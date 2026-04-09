import express from "express";
import { z } from "zod";
import multer from "multer";
import { collections, toObjectId } from "../services/mongodb.js";
import { uploadImage } from "../services/cloudinary.js";
import { authMiddleware } from "./auth.js";
import { getCached, setCache, clearCache } from "../server.js";

export const categoriesRouter = express.Router();

const categorySchema = z.object({
  name: z.string(),
  image_url: z.string().nullable().optional(),
  show_by_brand: z.boolean().default(true)
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

categoriesRouter.get("/", async (_req, res) => {
  const cacheKey = "categories:all";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  
  try {
    const categories = await collections.categories()
      .find({})
      .sort({ name: 1 })
      .toArray();
    const formatted = categories.map(c => ({
      ...c,
      id: c._id.toString(),
      _id: undefined
    }));
    setCache(cacheKey, formatted, 3600000);
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

categoriesRouter.get("/:id", async (req, res) => {
  try {
    const category = await collections.categories().findOne({ _id: toObjectId(req.params.id) });
    if (!category) return res.status(404).json({ error: "Category not found" });
    category.id = category._id.toString();
    category._id = undefined;
    if (category.show_by_brand === undefined) {
      category.show_by_brand = true;
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

categoriesRouter.post("/", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = categorySchema.parse(req.body);
    const result = await collections.categories().insertOne({
      ...payload,
      created_at: new Date(),
      updated_at: new Date()
    });
    const inserted = await collections.categories().findOne({ _id: result.insertedId });
    clearCache("categories");
    res.status(201).json(inserted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

categoriesRouter.put("/:id", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = categorySchema.partial().parse(req.body);
    const result = await collections.categories().findOneAndUpdate(
      { _id: toObjectId(req.params.id) },
      { $set: { ...payload, updated_at: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ error: "Category not found" });
    clearCache("categories");
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

categoriesRouter.delete("/:id", authMiddleware("admin"), async (req, res) => {
  try {
    const result = await collections.categories().deleteOne({ _id: toObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Category not found" });
    clearCache("categories");
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

categoriesRouter.get("/:id/products-by-model", async (req, res) => {
  const cacheKey = `category_products:${req.params.id}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const products = await collections.products()
      .aggregate([
        {
          $match: {
            category_id: req.params.id,
            status: "active",
            is_deleted: { $ne: true }
          }
        },
        {
          $lookup: {
            from: "models",
            localField: "model_id",
            foreignField: "_id",
            as: "model_data"
          }
        },
        {
          $lookup: {
            from: "brands",
            localField: "brand_id",
            foreignField: "_id",
            as: "brand_data"
          }
        },
        {
          $unwind: { path: "$model_data", preserveNullAndEmptyArrays: true }
        },
        {
          $unwind: { path: "$brand_data", preserveNullAndEmptyArrays: true }
        },
        {
          $lookup: {
            from: "brands",
            localField: "model_data.brand_id",
            foreignField: "_id",
            as: "model_brand"
          }
        },
        {
          $unwind: { path: "$model_brand", preserveNullAndEmptyArrays: true }
        },
        {
          $match: {
            $or: [
              { "brand_data.is_hidden": { $ne: true } },
              { "model_brand.is_hidden": { $ne: true } }
            ]
          }
        }
      ])
      .toArray();

    const brandGroups = {};
    (products || []).forEach(p => {
      const productBrand = p.brand_data;
      const modelBrand = p.model_brand;
      const hidden = productBrand?.is_hidden || modelBrand?.is_hidden;
      if (hidden) return;

      const brandId = p.brand_id || modelBrand?._id?.toString() || "generic";
      const brandName = productBrand?.name || modelBrand?.name || "Other";
      const brandLogo = productBrand?.logo_url || modelBrand?.logo_url || null;

      const modelId = p.model_id?.toString() || "__nomodel";
      const modelName = p.model_data?.name || null;
      const modelImage = p.model_data?.image_url || null;

      if (!brandGroups[brandId]) {
        brandGroups[brandId] = {
          brand_id: brandId,
          brand_name: brandName,
          brand_logo: brandLogo,
          models: {}
        };
      }

      if (!brandGroups[brandId].models[modelId]) {
        brandGroups[brandId].models[modelId] = {
          model_id: modelId,
          model_name: modelName,
          model_image: modelImage,
          products: []
        };
      }

      brandGroups[brandId].models[modelId].products.push({
        id: p._id.toString(),
        name: p.name,
        price: p.price,
        quantity: p.quantity,
        image_url: p.image_url
      });
    });

    const result = Object.values(brandGroups)
      .sort((a, b) => a.brand_name.localeCompare(b.brand_name))
      .map(brand => ({
        ...brand,
        models: Object.values(brand.models)
      }));

    setCache(cacheKey, result, 30000);
    res.json(result);
  } catch (err) {
    console.error("products-by-model error:", err);
    res.status(500).json({ error: err.message });
  }
});

categoriesRouter.post("/upload", authMiddleware("admin"), upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  try {
    const result = await uploadImage(req.file.buffer, "categories");
    res.json({ url: result.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
