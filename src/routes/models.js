import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";
import { getCached, setCache, clearCache } from "../server.js";

export const modelsRouter = express.Router();

const modelSchema = z.object({
  name: z.string(),
  brand_id: z.string(),
  years: z.array(z.string()).optional().default([]),
  image_url: z.string().optional()
});

modelsRouter.get("/", async (_req, res) => {
  const cacheKey = "models:all";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  
  const { data, error } = await supabaseAdmin
    .from("models")
    .select("*, brands(name)")
    .order("name", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  
  setCache(cacheKey, data, 120000);
  res.json(data);
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

