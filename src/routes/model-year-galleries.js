import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";
import { getCached, setCache, clearCache } from "../server.js";

export const modelYearGalleriesRouter = express.Router();

const gallerySchema = z.object({
  model_id: z.string(),
  year: z.string(),
  image_url: z.string().nullable(),
  gallery: z.array(z.string()).optional().default([])
});

modelYearGalleriesRouter.get("/model/:modelId", async (req, res) => {
  const cacheKey = `model-year-galleries:${req.params.modelId}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const { data, error } = await supabaseAdmin
    .from("model_year_galleries")
    .select("*")
    .eq("model_id", req.params.modelId)
    .order("year", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  setCache(cacheKey, data, 3600000);
  res.json(data);
});

modelYearGalleriesRouter.get("/model/:modelId/year/:year", async (req, res) => {
  const { modelId, year } = req.params;
  const cacheKey = `model-year-gallery:${modelId}:${year}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const { data, error } = await supabaseAdmin
    .from("model_year_galleries")
    .select("*")
    .eq("model_id", modelId)
    .eq("year", year)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  setCache(cacheKey, data, 3600000);
  res.json(data || null);
});

modelYearGalleriesRouter.post("/", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = gallerySchema.parse(req.body);
    const { data: existing } = await supabaseAdmin
      .from("model_year_galleries")
      .select("*")
      .eq("model_id", payload.model_id)
      .eq("year", payload.year)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from("model_year_galleries")
        .update({
          image_url: payload.image_url,
          gallery: payload.gallery,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) return res.status(400).json({ error: error.message });
      clearCache("model-year-galleries");
      return res.json(data);
    }

    const { data, error } = await supabaseAdmin
      .from("model_year_galleries")
      .insert(payload)
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    clearCache("model-year-galleries");
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

modelYearGalleriesRouter.put("/model/:modelId/year/:year", authMiddleware("admin"), async (req, res) => {
  try {
    const { modelId, year } = req.params;
    const updateSchema = z.object({
      image_url: z.string().nullable().optional(),
      gallery: z.array(z.string()).optional()
    });
    const payload = updateSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from("model_year_galleries")
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq("model_id", modelId)
      .eq("year", year)
      .select("*")
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Gallery not found" });
    clearCache("model-year-galleries");
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

modelYearGalleriesRouter.delete("/:id", authMiddleware("admin"), async (req, res) => {
  const { error } = await supabaseAdmin
    .from("model_year_galleries")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  clearCache("model-year-galleries");
  res.status(204).send();
});

modelYearGalleriesRouter.delete("/model/:modelId/year/:year", authMiddleware("admin"), async (req, res) => {
  const { modelId, year } = req.params;
  const { error } = await supabaseAdmin
    .from("model_year_galleries")
    .delete()
    .eq("model_id", modelId)
    .eq("year", year);
  if (error) return res.status(400).json({ error: error.message });
  clearCache("model-year-galleries");
  res.status(204).send();
});
