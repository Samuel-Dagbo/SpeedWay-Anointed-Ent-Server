import express from "express";
import { z } from "zod";
import multer from "multer";
import crypto from "crypto";
import { collections, toObjectId } from "../services/mongodb.js";
import { uploadImage, uploadGalleryImage } from "../services/cloudinary.js";
import { authMiddleware } from "./auth.js";
import { logAudit } from "../services/audit.js";
import { getCached, setCache, clearCache } from "../server.js";
import { generateProductImage, generateSearchKeywords } from "../services/gemini.js";

export const productsRouter = express.Router();

const productSchema = z.object({
  name: z.string().min(1),
  category_id: z.string().uuid(),
  brand_id: z.string().uuid().nullable().optional(),
  model_id: z.string().uuid().nullable().optional(),
  year_id: z.string().uuid().nullable().optional(),
  price: z.preprocess((val) => Number(val), z.number()),
  cost_price: z.preprocess(
    (val) => (val === "" || val === undefined ? null : Number(val)),
    z.number().nullable().optional()
  ),
  quantity: z.preprocess((val) => Number(val), z.number().int()),
  description: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  gallery: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch { return []; }
      }
      return Array.isArray(val) ? val : [];
    },
    z.array(z.object({
      url: z.string(),
      type: z.enum(["image", "video"]).default("image")
    })).default([])
  ),
  status: z.enum(["active", "inactive"]).default("active")
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

function maybeUpload(req, res, next) {
  if (req.is("multipart/form-data")) {
    return upload.fields([
      { name: "image", maxCount: 1 },
      { name: "gallery_file", maxCount: 1 }
    ])(req, res, next);
  }
  return next();
}

async function getOrCreateByName(collection, name, extra = {}) {
  if (!name) return null;
  const existing = await collections[collection]().findOne({ name });
  if (existing) return existing;
  const result = await collections[collection]().insertOne({
    name,
    ...extra,
    created_at: new Date(),
    updated_at: new Date()
  });
  return { ...extra, _id: result.insertedId, name };
}

function parseCsv(raw) {
  const rows = String(raw || "")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  if (rows.length === 0) return [];
  const header = rows[0].split(",").map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((row) => {
    const values = row.split(",").map((v) => v.trim());
    const entry = {};
    header.forEach((key, idx) => {
      entry[key] = values[idx] ?? "";
    });
    return entry;
  });
}

productsRouter.get("/", async (req, res) => {
  const { q, brand_id, model_id, year_id, category_id, status, page = 1, limit = 20 } = req.query;
  
  const cacheKey = `products:${JSON.stringify(req.query)}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(10000, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;
  
  try {
    const match = { is_deleted: { $ne: true } };
    if (brand_id) match.brand_id = toObjectId(brand_id);
    if (model_id) match.model_id = toObjectId(model_id);
    if (year_id) match.year_id = toObjectId(year_id);
    if (category_id) match.category_id = category_id;
    if (status) match.status = status;
    
    if (q) {
      match.$or = [
        { name: { $regex: q, $options: "i" } }
      ];
    }
    
    const [data, countResult] = await Promise.all([
      collections.products()
        .aggregate([
          { $match: match },
          {
            $lookup: {
              from: "categories",
              localField: "category_id",
              foreignField: "_id",
              as: "category_data"
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
            $lookup: {
              from: "models",
              localField: "model_id",
              foreignField: "_id",
              as: "model_data"
            }
          },
          {
            $lookup: {
              from: "years",
              localField: "year_id",
              foreignField: "_id",
              as: "year_data"
            }
          },
          { $unwind: { path: "$category_data", preserveNullAndEmptyArrays: true } },
          { $unwind: { path: "$brand_data", preserveNullAndEmptyArrays: true } },
          { $unwind: { path: "$model_data", preserveNullAndEmptyArrays: true } },
          { $unwind: { path: "$year_data", preserveNullAndEmptyArrays: true } },
          { $match: { "brand_data.is_hidden": { $ne: true } } },
          { $sort: { created_at: -1 } },
          { $skip: offset },
          { $limit: limitNum }
        ])
        .toArray(),
      collections.products().countDocuments(match)
    ]);
    
    const filtered = data.map(p => ({
      ...p,
      categories: { name: p.category_data?.name },
      brands: { name: p.brand_data?.name, is_hidden: p.brand_data?.is_hidden },
      models: { name: p.model_data?.name, image_url: p.model_data?.image_url },
      years: { id: p.year_data?._id, label: p.year_data?.label }
    }));
    
    setCache(cacheKey, {
      data: filtered,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult,
        totalPages: Math.max(1, Math.ceil(countResult / limitNum))
      }
    }, q ? 10000 : 30000);
    res.json({
      data: filtered,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult,
        totalPages: Math.max(1, Math.ceil(countResult / limitNum))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productsRouter.get("/by-category", async (req, res) => {
  const cacheKey = "categories_with_counts_visible";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  
  try {
    const categories = await collections.categories()
      .find({})
      .project({ _id: 1, name: 1, image_url: 1 })
      .toArray();
    
    const counts = await collections.products()
      .aggregate([
        { $match: { is_deleted: { $ne: true } } },
        {
          $lookup: {
            from: "brands",
            localField: "brand_id",
            foreignField: "_id",
            as: "brand_data"
          }
        },
        { $unwind: { path: "$brand_data", preserveNullAndEmptyArrays: true } },
        { $match: { "brand_data.is_hidden": { $ne: true } } },
        { $group: { _id: "$category_id", count: { $sum: 1 } } }
      ])
      .toArray();
    
    const countMap = {};
    counts.forEach(c => {
      countMap[c._id] = c.count;
    });
    
    const result = categories.map(cat => ({
      _id: cat._id.toString(),
      id: cat._id.toString(),
      name: cat.name,
      image_url: cat.image_url,
      product_count: countMap[cat._id.toString()] || 0
    }));
    
    setCache(cacheKey, result, 60000);
    res.json(result);
  } catch (err) {
    console.error("by-category error:", err);
    res.status(500).json({ error: err.message });
  }
});

productsRouter.get("/all", authMiddleware(["admin", "manager", "staff"]), async (req, res) => {
  const { q, status, category_id, brand_id } = req.query;

  const cacheKey = `products:all:${JSON.stringify(req.query)}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const match = { is_deleted: { $ne: true } };
    if (status) match.status = status;
    if (category_id) match.category_id = category_id;
    if (brand_id) match.brand_id = toObjectId(brand_id);
    if (q) {
      match.$or = [
        { name: { $regex: q, $options: "i" } }
      ];
    }

    const data = await collections.products()
      .aggregate([
        { $match: match },
        {
          $lookup: {
            from: "categories",
            localField: "category_id",
            foreignField: "_id",
            as: "category_data"
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
          $lookup: {
            from: "models",
            localField: "model_id",
            foreignField: "_id",
            as: "model_data"
          }
        },
        {
          $lookup: {
            from: "years",
            localField: "year_id",
            foreignField: "_id",
            as: "year_data"
          }
        },
        { $unwind: { path: "$category_data", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$brand_data", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$model_data", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$year_data", preserveNullAndEmptyArrays: true } },
        { $match: { "brand_data.is_hidden": { $ne: true } } },
        { $sort: { created_at: -1 } }
      ])
      .toArray();

    const filtered = data.map(p => ({
      ...p,
      categories: { id: p.category_data?._id, name: p.category_data?.name },
      brands: { id: p.brand_data?._id, name: p.brand_data?.name, is_hidden: p.brand_data?.is_hidden },
      models: { id: p.model_data?._id, name: p.model_data?.name, image_url: p.model_data?.image_url },
      years: { id: p.year_data?._id, label: p.year_data?.label }
    }));
    
    setCache(cacheKey, filtered, q ? 10000 : 15000);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productsRouter.get("/export", authMiddleware("admin"), async (_req, res) => {
  try {
    const data = await collections.products()
      .aggregate([
        { $match: { is_deleted: { $ne: true } } },
        {
          $lookup: {
            from: "categories",
            localField: "category_id",
            foreignField: "_id",
            as: "category_data"
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
          $lookup: {
            from: "models",
            localField: "model_id",
            foreignField: "_id",
            as: "model_data"
          }
        },
        {
          $lookup: {
            from: "years",
            localField: "year_id",
            foreignField: "_id",
            as: "year_data"
          }
        },
        { $sort: { created_at: -1 } }
      ])
      .toArray();

    const header = [
      "name",
      "category",
      "brand",
      "model",
      "year",
      "price",
      "cost_price",
      "quantity",
      "description",
      "image_url",
      "status"
    ];
    const lines = [header.join(",")];
    data.forEach((p) => {
      const row = [
        p.name,
        p.category_data?.name || "",
        p.brand_data?.name || "",
        p.model_data?.name || "",
        p.year_data?.label || "",
        p.price,
        p.cost_price || "",
        p.quantity,
        (p.description || "").replace(/\n/g, " "),
        p.image_url || "",
        p.status
      ];
      lines.push(row.join(","));
    });
    res.setHeader("Content-Type", "text/csv");
    res.send(lines.join("\n"));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productsRouter.post("/import", authMiddleware("admin"), async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.items)
      ? req.body.items
      : parseCsv(req.body?.csv || "");
    if (!rows.length) return res.status(400).json({ error: "No rows to import" });

    const created = [];
    for (const row of rows) {
      const category = row.category
        ? await getOrCreateByName("categories", row.category)
        : null;
      const brand = row.brand ? await getOrCreateByName("brands", row.brand) : null;
      let model = null;
      if (row.model && brand?._id) {
        model = await collections.models().findOne({ name: row.model, brand_id: brand._id });
        if (!model) {
          const result = await collections.models().insertOne({
            name: row.model,
            brand_id: brand._id,
            years: [],
            gallery: [],
            created_at: new Date(),
            updated_at: new Date()
          });
          model = { _id: result.insertedId };
        }
      }
      const year = row.year
        ? await collections.years().findOne({ label: row.year })
        : null;
      
      const payload = {
        name: row.name,
        category_id: category?._id?.toString() || null,
        brand_id: brand?._id?.toString() || null,
        model_id: model?._id?.toString() || null,
        year_id: year?._id?.toString() || null,
        price: Number(row.price || 0),
        cost_price: row.cost_price ? Number(row.cost_price) : null,
        quantity: Number(row.quantity || 0),
        description: row.description || null,
        image_url: row.image_url || null,
        status: row.status || "active",
        gallery: [],
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await collections.products().insertOne(payload);
      const inserted = await collections.products().findOne({ _id: result.insertedId });
      created.push(inserted);
    }

    res.status(201).json({ count: created.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

productsRouter.get("/:id", async (req, res) => {
  try {
    const product = await collections.products()
      .aggregate([
        { $match: { _id: toObjectId(req.params.id), is_deleted: { $ne: true } } },
        {
          $lookup: {
            from: "categories",
            localField: "category_id",
            foreignField: "_id",
            as: "category_data"
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
          $lookup: {
            from: "models",
            localField: "model_id",
            foreignField: "_id",
            as: "model_data"
          }
        },
        {
          $lookup: {
            from: "years",
            localField: "year_id",
            foreignField: "_id",
            as: "year_data"
          }
        },
        { $unwind: { path: "$category_data", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$brand_data", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$model_data", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$year_data", preserveNullAndEmptyArrays: true } }
      ])
      .toArray();
    
    if (!product || product.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    const p = product[0];
    res.json({
      ...p,
      categories: { name: p.category_data?.name },
      brands: { name: p.brand_data?.name },
      models: { name: p.model_data?.name, image_url: p.model_data?.image_url, gallery: p.model_data?.gallery },
      years: { id: p.year_data?._id, label: p.year_data?.label }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productsRouter.post("/", authMiddleware(["admin", "manager"]), maybeUpload, async (req, res) => {
  try {
    const raw = req.body;
    const payload = productSchema.parse(raw);
    const files = req.files || {};
    const productImage = Array.isArray(files.image) ? files.image[0] : null;
    
    if (productImage) {
      const result = await uploadImage(productImage.buffer, "products");
      payload.image_url = result.url;
    }
    
    const insertData = {
      ...payload,
      category_id: payload.category_id,
      brand_id: payload.brand_id,
      model_id: payload.model_id,
      year_id: payload.year_id,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await collections.products().insertOne(insertData);
    const inserted = await collections.products().findOne({ _id: result.insertedId });
    
    logAudit({
      actor_id: req.user.id,
      action: "create",
      entity: "product",
      entity_id: result.insertedId.toString(),
      metadata: { name: inserted.name }
    });
    
    clearCache("products");
    clearCache("categories");
    res.status(201).json(inserted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

productsRouter.put("/:id", authMiddleware(["admin", "manager"]), maybeUpload, async (req, res) => {
  try {
    const payload = productSchema.partial().parse(req.body);
    const files = req.files || {};
    const productImage = Array.isArray(files.image) ? files.image[0] : null;
    
    if (productImage) {
      const result = await uploadImage(productImage.buffer, "products");
      payload.image_url = result.url;
    }
    
    const updateData = {
      ...payload,
      updated_at: new Date()
    };
    
    const result = await collections.products().findOneAndUpdate(
      { _id: toObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result) return res.status(404).json({ error: "Product not found" });
    
    logAudit({
      actor_id: req.user.id,
      action: "update",
      entity: "product",
      entity_id: req.params.id,
      metadata: { name: result.name }
    });
    
    clearCache("products");
    clearCache("categories");
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

productsRouter.delete("/:id", authMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const result = await collections.products().findOneAndUpdate(
      { _id: toObjectId(req.params.id) },
      { $set: { is_deleted: true, updated_at: new Date() } }
    );
    
    if (!result) return res.status(404).json({ error: "Product not found" });
    
    logAudit({
      actor_id: req.user.id,
      action: "delete",
      entity: "product",
      entity_id: req.params.id
    });
    
    clearCache("products");
    clearCache("categories");
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

productsRouter.post("/generate-image/:id", authMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const product = await collections.products()
      .aggregate([
        { $match: { _id: toObjectId(req.params.id) } },
        {
          $lookup: {
            from: "categories",
            localField: "category_id",
            foreignField: "_id",
            as: "category_data"
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
          $lookup: {
            from: "models",
            localField: "model_id",
            foreignField: "_id",
            as: "model_data"
          }
        },
        {
          $lookup: {
            from: "years",
            localField: "year_id",
            foreignField: "_id",
            as: "year_data"
          }
        }
      ])
      .toArray();
    
    if (!product || product.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    const p = product[0];
    const prompt = `${p.brand_data?.name || ""} ${p.model_data?.name || ""} ${p.year_data?.label || ""} ${p.name} ${p.category_data?.name || ""}`.trim();

    const result = await generateProductImage(prompt);

    let imageUrl;
    if (result.imageData) {
      const buffer = Buffer.from(result.imageData, "base64");
      const uploadResult = await uploadImage(buffer, "product-images");
      imageUrl = uploadResult.url;
    } else if (result.externalUrl) {
      const downloadRes = await fetch(result.externalUrl, { headers: { "User-Agent": "SpeedwayApp/1.0" } });
      if (!downloadRes.ok) throw new Error("Failed to download external image");
      const buffer = Buffer.from(await downloadRes.arrayBuffer());
      const uploadResult = await uploadImage(buffer, "product-images");
      imageUrl = uploadResult.url;
    }

    if (imageUrl) {
      await collections.products().updateOne(
        { _id: toObjectId(req.params.id) },
        { $set: { image_url: imageUrl, updated_at: new Date() } }
      );
      clearCache("products");
      res.json({ success: true, imageUrl });
    } else {
      res.status(500).json({ error: "Failed to generate image" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productsRouter.post("/generate-keywords/:id", authMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const product = await collections.products()
      .aggregate([
        { $match: { _id: toObjectId(req.params.id) } },
        {
          $lookup: {
            from: "categories",
            localField: "category_id",
            foreignField: "_id",
            as: "category_data"
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
          $lookup: {
            from: "models",
            localField: "model_id",
            foreignField: "_id",
            as: "model_data"
          }
        },
        {
          $lookup: {
            from: "years",
            localField: "year_id",
            foreignField: "_id",
            as: "year_data"
          }
        }
      ])
      .toArray();
    
    if (!product || product.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    const p = product[0];
    const keywords = await generateSearchKeywords({
      name: p.name,
      description: p.description,
      brand: p.brand_data?.name,
      model: p.model_data?.name,
      year: p.year_data?.label,
      category: p.category_data?.name
    });

    res.json({ keywords });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productsRouter.post("/upload", authMiddleware(["admin", "manager"]), upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  try {
    const result = await uploadImage(req.file.buffer, "products");
    res.json({ url: result.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

productsRouter.post("/upload-gallery", authMiddleware(["admin", "manager"]), upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const isVideo = req.file.mimetype.startsWith("video/");
  const isImage = req.file.mimetype.startsWith("image/");
  if (!isVideo && !isImage) {
    return res.status(400).json({ error: "Only images and videos are allowed" });
  }
  if (isVideo && req.file.size > 50 * 1024 * 1024) {
    return res.status(400).json({ error: "Video must be under 50MB" });
  }
  if (isImage && req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ error: "Image must be under 5MB" });
  }
  try {
    let result;
    if (isVideo) {
      result = await uploadGalleryImage(req.file.buffer, "products/videos");
    } else {
      result = await uploadGalleryImage(req.file.buffer, "products/gallery");
    }
    res.json({ url: result.url, type: isVideo ? "video" : "image" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
