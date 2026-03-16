import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";
import { logAudit } from "../services/audit.js";
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
  total: z.number().positive(),
  coupon_code: z.string().optional().nullable(),
  shipping_fee: z.number().optional().nullable(),
  delivery_address_id: z.string().optional().nullable()
});

// Customer: create order from cart
ordersRouter.post("/", authMiddleware(), async (req, res) => {
  try {
    const { items, total, coupon_code, shipping_fee, delivery_address_id } =
      orderSchema.parse(req.body);
    const userId = req.user.id;
    const subtotal = items.reduce((sum, it) => sum + it.quantity * it.price, 0);
    let discountTotal = 0;
    let appliedCoupon = null;

    if (coupon_code) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", coupon_code.toUpperCase())
        .eq("active", true)
        .maybeSingle();
      if (coupon) {
        const rawDiscount =
          coupon.type === "percent" ? (subtotal * Number(coupon.value)) / 100 : Number(coupon.value);
        const capped = coupon.max_discount
          ? Math.min(rawDiscount, Number(coupon.max_discount))
          : rawDiscount;
        discountTotal = Math.max(0, Number(capped.toFixed(2)));
        appliedCoupon = coupon;
      }
    }

    const computedTotal = Math.max(0, subtotal - discountTotal) + Number(shipping_fee || 0);

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        total: computedTotal,
        subtotal,
        discount_total: discountTotal,
        coupon_code: appliedCoupon?.code || null,
        shipping_fee: shipping_fee || 0,
        delivery_address_id: delivery_address_id || null,
        status: "pending",
        estimated_delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10)
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

    await supabaseAdmin.from("order_status_events").insert({
      order_id: order.id,
      status: "pending",
      note: "Order placed"
    });
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: `Order #${order.id.toString().padStart(4, "0")} placed`,
      body: `We received your order totaling GHS ${order.total}.`,
      type: "order"
    });
    logAudit({
      actor_id: userId,
      action: "create",
      entity: "order",
      entity_id: order.id,
      metadata: { total: order.total }
    });

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
      sendOrderConfirmation(userProfile.email, order.id, computedTotal).catch((err) =>
        console.error("[email] order confirmation failed", err)
      );
    }
    // Notify shop owner/admin as well
    sendAdminOrderNotification(order.id, computedTotal).catch((err) =>
      console.error("[email] admin notification failed", err)
    );

    if (appliedCoupon) {
      await supabaseAdmin.from("coupon_redemptions").insert({
        coupon_id: appliedCoupon.id,
        user_id: userId,
        order_id: order.id
      });
    }

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
    .select("*, order_items(*, products(name, image_url)), order_status_events(*)")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: list all orders
ordersRouter.get("/", authMiddleware(["admin", "manager", "staff"]), async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, users(full_name, email)")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: update status
ordersRouter.patch("/:id/status", authMiddleware(["admin", "manager"]), async (req, res) => {
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

  await supabaseAdmin.from("order_status_events").insert({
    order_id: data.id,
    status,
    note: req.body.note || null
  });
  logAudit({
    actor_id: req.user.id,
    action: "status_update",
    entity: "order",
    entity_id: data.id,
    metadata: { status }
  });

  // Email customer about status change
  if (data?.user_id) {
    const { data: userProfile } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", data.user_id)
      .single();
    if (userProfile?.email) {
      sendOrderStatusEmail(userProfile.email, data.id, status).catch((err) =>
        console.error("[email] status email failed", err)
      );
    }
    await supabaseAdmin.from("notifications").insert({
      user_id: data.user_id,
      title: `Order #${data.id.toString().padStart(4, "0")} ${status}`,
      body: `Your order status is now ${status}.`,
      type: "order"
    });
  }

  res.json(data);
});

ordersRouter.post("/:id/returns", authMiddleware(), async (req, res) => {
  try {
    const reason = z.string().min(4).parse(req.body.reason);
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, total")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .single();
    if (!order) return res.status(404).json({ error: "Order not found" });

    const { data, error } = await supabaseAdmin
      .from("order_returns")
      .insert({
        order_id: order.id,
        user_id: req.user.id,
        reason,
        status: "requested",
        amount: order.total
      })
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    logAudit({
      actor_id: req.user.id,
      action: "return_requested",
      entity: "order",
      entity_id: order.id,
      metadata: { reason }
    });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

ordersRouter.get("/returns", authMiddleware(["admin", "manager", "staff"]), async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("order_returns")
    .select("*, orders(id, total), users(full_name, email)")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

ordersRouter.patch("/returns/:id", authMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const status = z
      .enum(["requested", "approved", "rejected", "refunded"])
      .parse(req.body.status);
    const { data, error } = await supabaseAdmin
      .from("order_returns")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    logAudit({
      actor_id: req.user.id,
      action: "return_status_update",
      entity: "order_return",
      entity_id: data.id,
      metadata: { status }
    });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

ordersRouter.get("/:id/receipt", authMiddleware(), async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*, products(name, image_url)), users(full_name, email)")
    .eq("id", req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: "Order not found" });
  const isOwner = data.user_id === req.user.id;
  const isAdmin = ["admin", "manager", "staff"].includes(req.user.role);
  if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });
  res.json(data);
});

