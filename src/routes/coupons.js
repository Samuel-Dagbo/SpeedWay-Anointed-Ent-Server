import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";

export const couponsRouter = express.Router();

const couponSchema = z.object({
  code: z.string().min(3).max(32),
  description: z.string().optional().nullable(),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive(),
  min_order: z.number().optional().nullable(),
  max_discount: z.number().optional().nullable(),
  usage_limit: z.number().int().optional().nullable(),
  per_user_limit: z.number().int().optional().nullable(),
  start_at: z.string().datetime().optional().nullable(),
  end_at: z.string().datetime().optional().nullable(),
  active: z.boolean().optional().default(true)
});

const validateSchema = z.object({
  code: z.string().min(3),
  total: z.number().positive()
});

couponsRouter.get("/", authMiddleware("admin"), async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

couponsRouter.post("/", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = couponSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .insert({
        ...payload,
        code: payload.code.toUpperCase()
      })
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

couponsRouter.patch("/:id", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = couponSchema.partial().parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("coupons")
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

couponsRouter.post("/validate", authMiddleware(), async (req, res) => {
  try {
    const { code, total } = validateSchema.parse(req.body);
    const now = new Date().toISOString();
    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("active", true)
      .maybeSingle();
    if (error || !coupon) return res.status(404).json({ error: "Invalid coupon" });

    if (coupon.start_at && coupon.start_at > now) {
      return res.status(400).json({ error: "Coupon not active yet" });
    }
    if (coupon.end_at && coupon.end_at < now) {
      return res.status(400).json({ error: "Coupon has expired" });
    }
    if (coupon.min_order && total < Number(coupon.min_order)) {
      return res.status(400).json({ error: "Order total too low" });
    }

    const { count: redeemedCount } = await supabaseAdmin
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id);
    if (coupon.usage_limit && (redeemedCount || 0) >= coupon.usage_limit) {
      return res.status(400).json({ error: "Coupon usage limit reached" });
    }

    const { count: userCount } = await supabaseAdmin
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .eq("user_id", req.user.id);
    if (coupon.per_user_limit && (userCount || 0) >= coupon.per_user_limit) {
      return res.status(400).json({ error: "Coupon already used" });
    }

    const rawDiscount =
      coupon.type === "percent" ? (total * Number(coupon.value)) / 100 : Number(coupon.value);
    const discount = coupon.max_discount
      ? Math.min(rawDiscount, Number(coupon.max_discount))
      : rawDiscount;

    res.json({
      code: coupon.code,
      discount: Math.max(0, Number(discount.toFixed(2)))
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
