import express from "express";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import crypto from "crypto";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";
import { getCached, setCache, clearCache } from "../server.js";

export const modelsRouter = express.Router();

const modelSchema = z.object({
  name: z.string(),
  brand_id: z.string(),
  years: z.array(z.string()).optional().default([]),
  image_url: z.string().nullable(),
  gallery: z.array(z.string()).optional().default([])
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

async function uploadImage(file, folder = "models") {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
  const filename = `${folder}/${crypto.randomUUID()}.jpg`;
  const processed = await sharp(file.buffer)
    .resize({ width: 1200, height: 800, fit: "inside", withoutEnlargement: true })
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

modelsRouter.get("/", async (_req, res) => {
  const cacheKey = "models:visible";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  
  const { data, error } = await supabaseAdmin
    .from("models")
    .select("*, brands(name, is_hidden)")
    .order("name", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  
  const filtered = data.filter(m => !m.brands?.is_hidden);
  setCache(cacheKey, filtered, 3600000);
  res.json(filtered);
});

modelsRouter.get("/:id", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("models")
    .select("*, brands(name)")
    .eq("id", req.params.id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Model not found" });
  res.json(data);
});

modelsRouter.post("/", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = modelSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("models")
      .insert(payload)
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    clearCache("models");
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

modelsRouter.put("/:id", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = modelSchema.partial().parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("models")
      .update(payload)
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    clearCache("models");
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

modelsRouter.delete("/:id", authMiddleware("admin"), async (req, res) => {
  const { error } = await supabaseAdmin
    .from("models")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  clearCache("models");
  res.status(204).send();
});

modelsRouter.post("/upload", authMiddleware("admin"), upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  try {
    const imageUrl = await uploadImage(req.file, "models");
    res.json({ url: imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

