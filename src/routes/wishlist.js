import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";

export const wishlistRouter = express.Router();

const itemSchema = z.object({
  product_id: z.string()
});

async function ensureWishlist(userId) {
  const { data } = await supabaseAdmin
    .from("wishlists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (data) return data;
  const { data: created } = await supabaseAdmin
    .from("wishlists")
    .insert({ user_id: userId, name: "My wishlist" })
    .select("*")
    .single();
  return created;
}

wishlistRouter.get("/", authMiddleware(), async (req, res) => {
  try {
    const wishlist = await ensureWishlist(req.user.id);
    const { data, error } = await supabaseAdmin
      .from("wishlist_items")
      .select("id, created_at, products(id, name, price, image_url, quantity)")
      .eq("wishlist_id", wishlist.id)
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ wishlist, items: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

wishlistRouter.post("/items", authMiddleware(), async (req, res) => {
  try {
    const payload = itemSchema.parse(req.body);
    const wishlist = await ensureWishlist(req.user.id);
    const { data, error } = await supabaseAdmin
      .from("wishlist_items")
      .insert({ wishlist_id: wishlist.id, product_id: payload.product_id })
      .select("id, created_at, products(id, name, price, image_url, quantity)")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

wishlistRouter.delete("/items/:id", authMiddleware(), async (req, res) => {
  const { error } = await supabaseAdmin
    .from("wishlist_items")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});
