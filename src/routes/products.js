import express from "express";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import crypto from "crypto";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";
import { logAudit } from "../services/audit.js";
import { getCached, setCache, clearCache } from "../server.js";
import { generateProductImage, generateSearchKeywords } from "../services/gemini.js";

export const productsRouter = express.Router();

const productSchema = z.object({
  name: z.string().min(1),
  category_id: z.string().uuid(),
  brand_id: z.string().uuid(),
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
  car_image_url: z.string().url().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active")
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

function maybeUpload(req, res, next) {
  if (req.is("multipart/form-data")) {
    return upload.fields([
      { name: "image", maxCount: 1 },
      { name: "car_image", maxCount: 1 }
    ])(req, res, next);
  }
  return next();
}

async function uploadProductImage(file, folder = "products") {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
  const filename = `${folder}/${crypto.randomUUID()}.jpg`;
  const processed = await sharp(file.buffer)
    .resize({ width: 1400, withoutEnlargement: true })
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

async function getOrCreateByName(table, name, extra = {}) {
  if (!name) return null;
  const { data: existing } = await supabaseAdmin
    .from(table)
    .select("*")
    .eq("name", name)
    .maybeSingle();
  if (existing) return existing;
  const { data: created } = await supabaseAdmin
    .from(table)
    .insert({ name, ...extra })
    .select("*")
    .single();
  return created;
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
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;
  
  let query = supabaseAdmin
    .from("products")
    .select(
      "*, categories(name), brands(name), models(name), years(label)",
      { count: "exact" }
    )
    .eq("is_deleted", false);

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  if (brand_id) {
    query = query.eq("brand_id", brand_id);
  }
  if (model_id) {
    query = query.eq("model_id", model_id);
  }
  if (year_id) {
    query = query.eq("year_id", year_id);
  }
  if (category_id) {
    query = query.eq("category_id", category_id);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limitNum - 1);
    
  if (error) return res.status(500).json({ error: error.message });
  
  const result = {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limitNum)
    }
  };
  
  setCache(cacheKey, result, q ? 5000 : 15000);
  res.json(result);
});

// Get products count by category - optimized single query
productsRouter.get("/by-category", async (req, res) => {
  const cacheKey = "categories_with_counts";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select(`
      id,
      name,
      products:products(count)
    `);
  
  if (error) return res.status(500).json({ error: error.message });
  
  const result = (data || []).map(cat => ({
    id: cat.id,
    name: cat.name,
    product_count: cat.products?.[0]?.count || 0
  }));
  
  setCache(cacheKey, result, 60000);
  res.json(result);
});

productsRouter.get("/export", authMiddleware("admin"), async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("name, price, cost_price, quantity, description, image_url, car_image_url, status, categories(name), brands(name), models(name), years(label)")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
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
    "car_image_url",
    "status"
  ];
  const lines = [header.join(",")];
  (data || []).forEach((p) => {
    const row = [
      p.name,
      p.categories?.name || "",
      p.brands?.name || "",
      p.models?.name || "",
      p.years?.label || "",
      p.price,
      p.cost_price || "",
      p.quantity,
      (p.description || "").replace(/\n/g, " "),
      p.image_url || "",
      p.car_image_url || "",
      p.status
    ];
    lines.push(row.join(","));
  });
  res.setHeader("Content-Type", "text/csv");
  res.send(lines.join("\n"));
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
      if (row.model && brand?.id) {
        const { data: existing } = await supabaseAdmin
          .from("models")
          .select("*")
          .eq("name", row.model)
          .eq("brand_id", brand.id)
          .maybeSingle();
        model =
          existing ||
          (await supabaseAdmin
            .from("models")
            .insert({ name: row.model, brand_id: brand.id })
            .select("*")
            .single()).data;
      }
      const year = row.year
        ? await supabaseAdmin.from("years").select("*").eq("label", row.year).maybeSingle()
        : null;
      const yearData = year?.data || null;
      const payload = {
        name: row.name,
        category_id: category?.id || null,
        brand_id: brand?.id || null,
        model_id: model?.id || null,
        year_id: yearData?.id || null,
        price: Number(row.price || 0),
        cost_price: row.cost_price ? Number(row.cost_price) : null,
        quantity: Number(row.quantity || 0),
        description: row.description || null,
        image_url: row.image_url || null,
        car_image_url: row.car_image_url || null,
        status: row.status || "active"
      };
      const { data, error } = await supabaseAdmin
        .from("products")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      created.push(data);
    }

    res.status(201).json({ count: created.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

productsRouter.get("/:id", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      "*, categories(name), brands(name), models(name), years(label)"
    )
    .eq("id", req.params.id)
    .eq("is_deleted", false)
    .single();
  if (error) return res.status(404).json({ error: "Product not found" });
  res.json(data);
});

productsRouter.post("/", authMiddleware(["admin", "manager"]), maybeUpload, async (req, res) => {
  try {
    const raw = req.body;
    const payload = productSchema.parse(raw);
    const files = req.files || {};
    const productImage = Array.isArray(files.image) ? files.image[0] : null;
    const carImage = Array.isArray(files.car_image) ? files.car_image[0] : null;
    if (productImage) {
      payload.image_url = await uploadProductImage(productImage, "products");
    }
    if (carImage) {
      payload.car_image_url = await uploadProductImage(carImage, "cars");
    }
    const { data, error } = await supabaseAdmin
      .from("products")
      .insert(payload)
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    logAudit({
      actor_id: req.user.id,
      action: "create",
      entity: "product",
      entity_id: data.id,
      metadata: { name: data.name }
    });
    clearCache("products");
    clearCache("categories");
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

productsRouter.put("/:id", authMiddleware(["admin", "manager"]), maybeUpload, async (req, res) => {
  try {
    const payload = productSchema.partial().parse(req.body);
    const files = req.files || {};
    const productImage = Array.isArray(files.image) ? files.image[0] : null;
    const carImage = Array.isArray(files.car_image) ? files.car_image[0] : null;
    if (productImage) {
      payload.image_url = await uploadProductImage(productImage, "products");
    }
    if (carImage) {
      payload.car_image_url = await uploadProductImage(carImage, "cars");
    }
    const { data, error } = await supabaseAdmin
      .from("products")
      .update(payload)
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    logAudit({
      actor_id: req.user.id,
      action: "update",
      entity: "product",
      entity_id: data.id,
      metadata: { name: data.name }
    });
    clearCache("products");
    clearCache("categories");
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

productsRouter.delete("/:id", authMiddleware(["admin", "manager"]), async (req, res) => {
  const { error } = await supabaseAdmin
    .from("products")
    .update({ is_deleted: true })
    .eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  logAudit({
    actor_id: req.user.id,
    action: "delete",
    entity: "product",
    entity_id: req.params.id
  });
  clearCache("products");
  clearCache("categories");
  res.status(204).send();
});

productsRouter.post("/generate-image/:id", authMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("*, categories(name), brands(name), models(name), years(label)")
      .eq("id", req.params.id)
      .single();

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const prompt = `${product.brands?.name || ""} ${product.models?.name || ""} ${product.years?.label || ""} ${product.name} ${product.categories?.name || ""}`.trim();

    const result = await generateProductImage(prompt);

    let imageUrl;
    if (result.imageData) {
      const buffer = Buffer.from(result.imageData, "base64");
      const processed = await sharp(buffer)
        .resize({ width: 1200, height: 800, fit: "cover" })
        .jpeg({ quality: 85 })
        .toBuffer();

      const filename = `product-images/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET || "product-images")
        .upload(filename, processed, { contentType: "image/jpeg", upsert: true });

      if (uploadError) throw new Error("Failed to upload image");

      const { data: urlData } = supabaseAdmin.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET || "product-images")
        .getPublicUrl(filename);
      imageUrl = urlData.publicUrl;
    } else if (result.externalUrl) {
      const downloadRes = await fetch(result.externalUrl, { headers: { "User-Agent": "SpeedwayApp/1.0" } });
      if (!downloadRes.ok) throw new Error("Failed to download external image");
      const buffer = Buffer.from(await downloadRes.arrayBuffer());
      const processed = await sharp(buffer).resize({ width: 1200, height: 800, fit: "cover" }).jpeg({ quality: 85 }).toBuffer();
      
      const filename = `product-images/${crypto.randomUUID()}.jpg`;
      await supabaseAdmin.storage.from(process.env.SUPABASE_STORAGE_BUCKET || "product-images").upload(filename, processed, { contentType: "image/jpeg", upsert: true });
      const { data: urlData } = supabaseAdmin.storage.from(process.env.SUPABASE_STORAGE_BUCKET || "product-images").getPublicUrl(filename);
      imageUrl = urlData.publicUrl;
    }

    if (imageUrl) {
      await supabaseAdmin.from("products").update({ image_url: imageUrl }).eq("id", req.params.id);
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
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("*, categories(name), brands(name), models(name), years(label)")
      .eq("id", req.params.id)
      .single();

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const keywords = await generateSearchKeywords({
      name: product.name,
      description: product.description,
      brand: product.brands?.name,
      model: product.models?.name,
      year: product.years?.label,
      category: product.categories?.name
    });

    res.json({ keywords });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

