import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";

export const reviewsRouter = express.Router();

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().nullable(),
  body: z.string().trim().min(5).max(1000)
});

reviewsRouter.get("/", async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("id, rating, title, body, created_at, users(full_name)")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

reviewsRouter.post("/", authMiddleware(), async (req, res) => {
  try {
    const payload = reviewSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .insert({
        user_id: req.user.id,
        rating: payload.rating,
        title: payload.title || null,
        body: payload.body
      })
      .select("id, rating, title, body, created_at, users(full_name)")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
