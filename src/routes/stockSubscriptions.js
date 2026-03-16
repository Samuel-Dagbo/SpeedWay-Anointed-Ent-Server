import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";

export const stockSubscriptionsRouter = express.Router();

const subscriptionSchema = z.object({
  product_id: z.string()
});

stockSubscriptionsRouter.get("/", authMiddleware(), async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("stock_subscriptions")
    .select("id, created_at, products(id, name, image_url, quantity)")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

stockSubscriptionsRouter.post("/", authMiddleware(), async (req, res) => {
  try {
    const payload = subscriptionSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("stock_subscriptions")
      .insert({ user_id: req.user.id, product_id: payload.product_id })
      .select("id, created_at, products(id, name, image_url, quantity)")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

stockSubscriptionsRouter.delete("/:id", authMiddleware(), async (req, res) => {
  const { error } = await supabaseAdmin
    .from("stock_subscriptions")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});
