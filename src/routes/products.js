import express from "express";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import crypto from "crypto";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";

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

productsRouter.get("/", async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      "*, categories(name), brands(name), models(name), years(label)"
    )
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
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

productsRouter.post("/", authMiddleware("admin"), maybeUpload, async (req, res) => {
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
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

productsRouter.put("/:id", authMiddleware("admin"), maybeUpload, async (req, res) => {
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
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

productsRouter.delete("/:id", authMiddleware("admin"), async (req, res) => {
  const { error } = await supabaseAdmin
    .from("products")
    .update({ is_deleted: true })
    .eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

