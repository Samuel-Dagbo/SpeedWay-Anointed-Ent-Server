import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";

export const brandsRouter = express.Router();

const brandSchema = z.object({
  name: z.string(),
  years: z.array(z.string()).optional().default([])
});

brandsRouter.get("/", async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("brands")
    .select("*")
    .order("name", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
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
  res.status(204).send();
});

