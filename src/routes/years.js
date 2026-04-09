import express from "express";
import { z } from "zod";
import { collections, toObjectId } from "../services/mongodb.js";
import { authMiddleware } from "./auth.js";
import { getCached, setCache, clearCache } from "../server.js";

export const yearsRouter = express.Router();

const yearSchema = z.object({
  label: z.string().min(4)
});

yearsRouter.get("/", async (_req, res) => {
  const cacheKey = "years:all";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  
  try {
    const years = await collections.years()
      .find({})
      .sort({ label: -1 })
      .toArray();
    const formatted = years.map(y => ({
      ...y,
      id: y._id.toString(),
      _id: undefined
    }));
    setCache(cacheKey, formatted, 3600000);
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

yearsRouter.post("/", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = yearSchema.parse(req.body);
    const result = await collections.years().insertOne({
      ...payload,
      created_at: new Date()
    });
    const inserted = await collections.years().findOne({ _id: result.insertedId });
    clearCache("years");
    res.status(201).json(inserted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

yearsRouter.put("/:id", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = yearSchema.partial().parse(req.body);
    const result = await collections.years().findOneAndUpdate(
      { _id: toObjectId(req.params.id) },
      { $set: payload },
      { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ error: "Year not found" });
    clearCache("years");
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

yearsRouter.delete("/:id", authMiddleware("admin"), async (req, res) => {
  try {
    const result = await collections.years().deleteOne({ _id: toObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Year not found" });
    clearCache("years");
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
