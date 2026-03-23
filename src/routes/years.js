import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";
import { getCached, setCache, clearCache } from "../server.js";

export const yearsRouter = express.Router();

const yearSchema = z.object({
  label: z.string().min(4)
});

yearsRouter.get("/", async (_req, res) => {
  const cacheKey = "years:all";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);
  
  const { data, error } = await supabaseAdmin
    .from("years")
    .select("*")
    .order("label", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  
  setCache(cacheKey, data, 120000);
  res.json(data);
});

yearsRouter.post("/", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = yearSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("years")
      .insert(payload)
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    clearCache("years");
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

yearsRouter.put("/:id", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = yearSchema.partial().parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("years")
      .update(payload)
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    clearCache("years");
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

yearsRouter.delete("/:id", authMiddleware("admin"), async (req, res) => {
  const { error } = await supabaseAdmin
    .from("years")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  clearCache("years");
  res.status(204).send();
});
