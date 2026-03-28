import express from "express";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import crypto from "crypto";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";
import { getCached, setCache, clearCache } from "../server.js";

export const categoriesRouter = express.Router();

const categorySchema = z.object({
  name: z.string(),
  image_url: z.string().nullable(),
  show_by_brand: z.boolean().default(true)
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

async function uploadImage(file, folder = "categories") {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
  const filename = `${folder}/${crypto.randomUUID()}.jpg`;
  const processed = await sharp(file.buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filename, processed, {
      contentType: "image/jpeg",
      upsert: true
    });
  if (error) throw error;

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

categoriesRouter.get("/", async (_req, res) => {
  const cacheKey = "categories:all";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  
  setCache(cacheKey, data, 3600000);
  res.json(data);
});

categoriesRouter.get("/:id", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Category not found" });
  if (data.show_by_brand === undefined) {
    data.show_by_brand = true;
  }
  res.json(data);
});

categoriesRouter.post("/", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = categorySchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert(payload)
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    clearCache("categories");
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

categoriesRouter.put("/:id", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = categorySchema.partial().parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("categories")
      .update(payload)
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    clearCache("categories");
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

categoriesRouter.delete("/:id", authMiddleware("admin"), async (req, res) => {
  const { error } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  clearCache("categories");
  res.status(204).send();
});

categoriesRouter.get("/:id/products-by-model", async (req, res) => {
  const cacheKey = `category_products:${req.params.id}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select(`
        id, name, price, quantity, image_url, status, brand_id, model_id,
        models(id, name, image_url, brand_id, brands(id, name, logo_url, is_hidden)),
        brands(id, name, logo_url, is_hidden)
      `)
      .eq("category_id", req.params.id)
      .eq("status", "active")
      .eq("is_deleted", false);

    if (error) throw error;

    const brandGroups = {};
    (products || []).forEach(p => {
      const productBrand = p.brands;
      const modelBrand = p.models?.brands;
      const hidden = productBrand?.is_hidden || modelBrand?.is_hidden;
      if (hidden) return;

      const brandId = p.brand_id || modelBrand?.id || "generic";
      const brandName = productBrand?.name || modelBrand?.name || "Other";
      const brandLogo = productBrand?.logo_url || modelBrand?.logo_url || null;

      const modelId = p.model_id || "__nomodel";
      const modelName = p.models?.name || null;
      const modelImage = p.models?.image_url || null;

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
        id: p.id,
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
    const imageUrl = await uploadImage(req.file, "categories");
    res.json({ url: imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

