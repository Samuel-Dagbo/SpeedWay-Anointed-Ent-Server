import express from "express";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import crypto from "crypto";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";
import { getCached, setCache, clearCache } from "../server.js";

export const brandsRouter = express.Router();

const brandSchema = z.object({
  name: z.string(),
  logo_url: z.string().nullable(),
  is_hidden: z.boolean().default(false)
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

async function uploadImage(file, folder = "brands") {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
  const filename = `${folder}/${crypto.randomUUID()}.jpg`;
  const processed = await sharp(file.buffer)
    .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
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

brandsRouter.get("/", async (_req, res) => {
  const cacheKey = "brands:all";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  
  const { data, error } = await supabaseAdmin
    .from("brands")
    .select("*")
    .eq("is_hidden", false)
    .order("name", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  
  setCache(cacheKey, data, 3600000);
  res.json(data);
});

brandsRouter.get("/:id", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("brands")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Brand not found" });
  res.json(data);
});

brandsRouter.post("/", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = brandSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("brands")
      .insert(payload)
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    clearCache("brands");
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

brandsRouter.put("/:id", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = brandSchema.partial().parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("brands")
      .update(payload)
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    clearCache("brands");
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

brandsRouter.delete("/:id", authMiddleware("admin"), async (req, res) => {
  const { error } = await supabaseAdmin
    .from("brands")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  clearCache("brands");
  res.status(204).send();
});

brandsRouter.post("/upload", authMiddleware("admin"), upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  try {
    const imageUrl = await uploadImage(req.file, "brands");
    res.json({ url: imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

