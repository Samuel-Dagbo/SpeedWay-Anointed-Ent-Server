import express from "express";
import { z } from "zod";
import multer from "multer";
import { collections, toObjectId } from "../services/mongodb.js";
import { uploadImage } from "../services/cloudinary.js";
import { authMiddleware } from "./auth.js";
import { getCached, setCache, clearCache } from "../server.js";

export const modelsRouter = express.Router();

const modelSchema = z.object({
  name: z.string(),
  brand_id: z.string(),
  years: z.array(z.string()).optional().default([]),
  image_url: z.string().nullable().optional(),
  gallery: z.array(z.string()).optional().default([])
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

modelsRouter.get("/", async (_req, res) => {
  const cacheKey = "models:visible";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  
  try {
    const models = await collections.models()
      .aggregate([
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
        { $sort: { name: 1 } }
      ])
      .toArray();
    
    const formatted = models.map(m => ({
      id: m._id.toString(),
      _id: undefined,
      name: m.name,
      brand_id: m.brand_id?.toString(),
      years: m.years,
      image_url: m.image_url,
      gallery: m.gallery,
      brands: { name: m.brand_data?.name, is_hidden: m.brand_data?.is_hidden }
    }));
    
    setCache(cacheKey, formatted, 3600000);
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

modelsRouter.get("/:id", async (req, res) => {
  try {
    const model = await collections.models()
      .aggregate([
        { $match: { _id: toObjectId(req.params.id) } },
        {
          $lookup: {
            from: "brands",
            localField: "brand_id",
            foreignField: "_id",
            as: "brand_data"
          }
        },
        { $unwind: { path: "$brand_data", preserveNullAndEmptyArrays: true } }
      ])
      .toArray();
    
    if (!model || model.length === 0) return res.status(404).json({ error: "Model not found" });
    
    const m = model[0];
    res.json({
      id: m._id.toString(),
      _id: undefined,
      name: m.name,
      brand_id: m.brand_id?.toString(),
      years: m.years,
      image_url: m.image_url,
      gallery: m.gallery,
      brands: { name: m.brand_data?.name }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

modelsRouter.post("/", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = modelSchema.parse(req.body);
    const result = await collections.models().insertOne({
      ...payload,
      brand_id: toObjectId(payload.brand_id),
      created_at: new Date(),
      updated_at: new Date()
    });
    const inserted = await collections.models().findOne({ _id: result.insertedId });
    clearCache("models");
    res.status(201).json(inserted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

modelsRouter.put("/:id", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = modelSchema.partial().parse(req.body);
    const updateData = { ...payload, updated_at: new Date() };
    if (payload.brand_id) {
      updateData.brand_id = toObjectId(payload.brand_id);
    }
    const result = await collections.models().findOneAndUpdate(
      { _id: toObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ error: "Model not found" });
    clearCache("models");
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

modelsRouter.delete("/:id", authMiddleware("admin"), async (req, res) => {
  try {
    const result = await collections.models().deleteOne({ _id: toObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Model not found" });
    clearCache("models");
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

modelsRouter.post("/upload", authMiddleware("admin"), upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  try {
    const result = await uploadImage(req.file.buffer, "models");
    res.json({ url: result.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
