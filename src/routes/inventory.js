import express from "express";
import { z } from "zod";
import { collections, toObjectId } from "../services/mongodb.js";
import { authMiddleware } from "./auth.js";
import { logAudit } from "../services/audit.js";

export const inventoryRouter = express.Router();

const adjustmentSchema = z.object({
  product_id: z.string(),
  delta: z.number().int(),
  reason: z.string().min(2),
  note: z.string().optional().nullable()
});

inventoryRouter.post("/adjust", authMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const payload = adjustmentSchema.parse(req.body);
    const product = await collections.products().findOne(
      { _id: toObjectId(payload.product_id) },
      { projection: { _id: 1, quantity: 1 } }
    );
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    const nextQty = Number(product.quantity) + payload.delta;
    if (nextQty < 0) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    await collections.products().updateOne(
      { _id: toObjectId(payload.product_id) },
      { $set: { quantity: nextQty, updated_at: new Date() } }
    );

    await collections.inventory().insertOne({
      product_id: payload.product_id,
      change: payload.delta,
      reason: payload.reason,
      reference: "manual_adjustment",
      created_at: new Date()
    });

    const result = await collections.inventory().insertOne({
      product_id: payload.product_id,
      delta: payload.delta,
      reason: payload.reason,
      note: payload.note,
      actor_id: req.user.id,
      created_at: new Date()
    });
    
    const inserted = await collections.inventory().findOne({ _id: result.insertedId });
    
    logAudit({
      actor_id: req.user.id,
      action: "inventory_adjustment",
      entity: "product",
      entity_id: payload.product_id,
      metadata: { delta: payload.delta, reason: payload.reason }
    });

    res.status(201).json(inserted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

inventoryRouter.get("/adjustments", authMiddleware(["admin", "manager", "staff"]), async (_req, res) => {
  try {
    const adjustments = await collections.inventory()
      .aggregate([
        {
          $lookup: {
            from: "products",
            localField: "product_id",
            foreignField: "_id",
            as: "product_data"
          }
        },
        { $unwind: { path: "$product_data", preserveNullAndEmptyArrays: true } },
        { $sort: { created_at: -1 } }
      ])
      .toArray();
    res.json(adjustments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
