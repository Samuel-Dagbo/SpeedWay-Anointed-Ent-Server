import express from "express";
import { z } from "zod";
import { collections, toObjectId } from "../services/mongodb.js";
import { authMiddleware } from "./auth.js";

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
  try {
    const coupons = await collections.coupons()
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

couponsRouter.post("/", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = couponSchema.parse(req.body);
    const result = await collections.coupons().insertOne({
      ...payload,
      code: payload.code.toUpperCase(),
      created_at: new Date(),
      updated_at: new Date()
    });
    const inserted = await collections.coupons().findOne({ _id: result.insertedId });
    res.status(201).json(inserted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

couponsRouter.patch("/:id", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = couponSchema.partial().parse(req.body);
    const result = await collections.coupons().findOneAndUpdate(
      { _id: toObjectId(req.params.id) },
      { $set: { ...payload, updated_at: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ error: "Coupon not found" });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

couponsRouter.post("/validate", authMiddleware(), async (req, res) => {
  try {
    const { code, total } = validateSchema.parse(req.body);
    const now = new Date();
    
    const coupon = await collections.coupons().findOne({
      code: code.toUpperCase(),
      active: true
    });
    if (!coupon) return res.status(404).json({ error: "Invalid coupon" });

    if (coupon.start_at && new Date(coupon.start_at) > now) {
      return res.status(400).json({ error: "Coupon not active yet" });
    }
    if (coupon.end_at && new Date(coupon.end_at) < now) {
      return res.status(400).json({ error: "Coupon has expired" });
    }
    if (coupon.min_order && total < Number(coupon.min_order)) {
      return res.status(400).json({ error: "Order total too low" });
    }

    const redeemedCount = await collections.couponRedemptions().countDocuments({
      coupon_id: coupon._id
    });
    if (coupon.usage_limit && redeemedCount >= coupon.usage_limit) {
      return res.status(400).json({ error: "Coupon usage limit reached" });
    }

    const userCount = await collections.couponRedemptions().countDocuments({
      coupon_id: coupon._id,
      user_id: req.user.id
    });
    if (coupon.per_user_limit && userCount >= coupon.per_user_limit) {
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
