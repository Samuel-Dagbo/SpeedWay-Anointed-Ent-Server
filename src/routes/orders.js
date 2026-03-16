import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  sendOrderConfirmation,
  sendAdminOrderNotification,
  sendOrderStatusEmail
} from "../services/emailService.js";

export const ordersRouter = express.Router();

const orderItemSchema = z.object({
  product_id: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive()
});

const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  total: z.number().positive()
});

// Customer: create order from cart
ordersRouter.post("/", authMiddleware(), async (req, res) => {
  try {
    const { items, total } = orderSchema.parse(req.body);
    const userId = req.user.id;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        total,
        status: "pending"
      })
      .select("*")
      .single();
    if (orderError) throw orderError;

    const orderItems = items.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      quantity: it.quantity,
      price: it.price,
      total: it.quantity * it.price
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);
    if (itemsError) throw itemsError;

    // Decrement stock and log inventory
    for (const it of items) {
      await supabaseAdmin.rpc("decrement_stock_and_log", {
        p_product_id: it.product_id,
        p_quantity: it.quantity,
        p_reason: "online_order",
        p_reference: order.id.toString()
      });
    }

    // Email confirmation (best-effort)
    const { data: userProfile } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();
    if (userProfile?.email) {
      await sendOrderConfirmation(userProfile.email, order.id, total);
    }
    // Notify shop owner/admin as well
    await sendAdminOrderNotification(order.id, total);

    res.status(201).json({ order_id: order.id });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// Customer: get own orders
ordersRouter.get("/my", authMiddleware(), async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*, products(name, image_url))")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: list all orders
ordersRouter.get("/", authMiddleware("admin"), async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, users(full_name, email)")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: update status
ordersRouter.patch("/:id/status", authMiddleware("admin"), async (req, res) => {
  const status = z.enum(["pending", "processing", "completed", "cancelled"]).parse(
    req.body.status
  );
  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ status })
    .eq("id", req.params.id)
    .select("*")
    .single();
  if (error) return res.status(400).json({ error: error.message });

  // Email customer about status change
  if (data?.user_id) {
    const { data: userProfile } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", data.user_id)
      .single();
    if (userProfile?.email) {
      await sendOrderStatusEmail(userProfile.email, data.id, status);
    }
  }

  res.json(data);
});

