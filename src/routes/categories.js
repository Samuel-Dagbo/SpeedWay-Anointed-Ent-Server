import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";
import { getCached, setCache, clearCache } from "../server.js";

export const categoriesRouter = express.Router();

const categorySchema = z.object({
  name: z.string(),
  image_url: z.string().optional()
});

categoriesRouter.get("/", async (_req, res) => {
  const cacheKey = "categories:all";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  
  setCache(cacheKey, data, 120000);
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

