import express from "express";
import { z } from "zod";
import multer from "multer";
import { collections, toObjectId } from "../services/mongodb.js";
import { uploadImage } from "../services/cloudinary.js";
import { authMiddleware } from "./auth.js";
import { getCached, setCache, clearCache } from "../server.js";

export const brandsRouter = express.Router();

const brandSchema = z.object({
  name: z.string(),
  logo_url: z.string().nullable().optional(),
  is_hidden: z.boolean().default(false)
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

brandsRouter.get("/", async (_req, res) => {
  const cacheKey = "brands:all";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  
  try {
    const brands = await collections.brands()
      .find({ is_hidden: { $ne: true } })
      .sort({ name: 1 })
      .toArray();
    const formatted = brands.map(b => ({
      ...b,
      id: b._id.toString(),
      _id: undefined
    }));
    setCache(cacheKey, formatted, 3600000);
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

brandsRouter.get("/:id", async (req, res) => {
  try {
    const brand = await collections.brands().findOne({ _id: toObjectId(req.params.id) });
    if (!brand) return res.status(404).json({ error: "Brand not found" });
    brand.id = brand._id.toString();
    brand._id = undefined;
    res.json(brand);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

brandsRouter.post("/", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = brandSchema.parse(req.body);
    const result = await collections.brands().insertOne({
      ...payload,
      created_at: new Date(),
      updated_at: new Date()
    });
    const inserted = await collections.brands().findOne({ _id: result.insertedId });
    clearCache("brands");
    res.status(201).json(inserted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

brandsRouter.put("/:id", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = brandSchema.partial().parse(req.body);
    const result = await collections.brands().findOneAndUpdate(
      { _id: toObjectId(req.params.id) },
      { $set: { ...payload, updated_at: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ error: "Brand not found" });
    clearCache("brands");
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

brandsRouter.delete("/:id", authMiddleware("admin"), async (req, res) => {
  try {
    const result = await collections.brands().deleteOne({ _id: toObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Brand not found" });
    clearCache("brands");
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

brandsRouter.post("/upload", authMiddleware("admin"), upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  try {
    const result = await uploadImage(req.file.buffer, "brands");
    res.json({ url: result.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
