import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";

export const cartRouter = express.Router();

const cartItemSchema = z.object({
  product_id: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive()
});

const cartSchema = z.object({
  items: z.array(cartItemSchema)
});

async function ensureCart(userId) {
  const { data } = await supabaseAdmin
    .from("carts")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (data) return data;
  const { data: created } = await supabaseAdmin
    .from("carts")
    .insert({ user_id: userId, status: "active" })
    .select("*")
    .single();
  return created;
}

cartRouter.get("/", authMiddleware(), async (req, res) => {
  const cart = await ensureCart(req.user.id);
  const { data, error } = await supabaseAdmin
    .from("cart_items")
    .select("id, quantity, price, products(id, name, image_url)")
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ cart, items: data || [] });
});

cartRouter.put("/", authMiddleware(), async (req, res) => {
  try {
    const payload = cartSchema.parse(req.body);
    const cart = await ensureCart(req.user.id);
    await supabaseAdmin.from("cart_items").delete().eq("cart_id", cart.id);
    if (payload.items.length > 0) {
      const rows = payload.items.map((item) => ({
        cart_id: cart.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));
      const { error } = await supabaseAdmin.from("cart_items").insert(rows);
      if (error) return res.status(400).json({ error: error.message });
    }
    await supabaseAdmin
      .from("carts")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", cart.id);
    res.json({ message: "Cart updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
