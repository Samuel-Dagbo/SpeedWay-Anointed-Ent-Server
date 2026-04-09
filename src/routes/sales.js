import express from "express";
import { z } from "zod";
import { collections, toObjectId } from "../services/mongodb.js";
import { authMiddleware } from "./auth.js";
import { logAudit } from "../services/audit.js";

export const salesRouter = express.Router();

const saleSchema = z
  .object({
    product_id: z.string().optional().nullable(),
    product_name: z.string().trim().min(1).optional().nullable(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
    note: z.string().optional().nullable()
  })
  .refine((payload) => payload.product_id || payload.product_name, {
    message: "Either product_id or product_name is required"
  });

const batchSaleSchema = z.object({
  items: z.array(saleSchema).min(1),
  note: z.string().optional().nullable()
});

async function processSale(payload, userId) {
  const total = payload.quantity * payload.price;

  const result = await collections.sales().insertOne({
    product_id: payload.product_id || null,
    product_name: payload.product_name || null,
    quantity: payload.quantity,
    price: payload.price,
    total,
    note: payload.note,
    created_at: new Date()
  });

  if (payload.product_id) {
    await collections.inventory().insertOne({
      product_id: payload.product_id,
      quantity: -payload.quantity,
      reason: "shop_sale",
      reference: result.insertedId.toString(),
      created_at: new Date()
    });
  }

  logAudit({
    actor_id: userId,
    action: "create",
    entity: "sale",
    entity_id: result.insertedId.toString(),
    metadata: { total: total, product_name: payload.product_name || null }
  });

  return { _id: result.insertedId, ...payload, total };
}

salesRouter.post("/", authMiddleware(["admin", "manager", "staff"]), async (req, res) => {
  try {
    const payload = saleSchema.parse(req.body);
    const sale = await processSale(payload, req.user.id);
    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

salesRouter.post("/batch", authMiddleware(["admin", "manager", "staff"]), async (req, res) => {
  try {
    const { items, note } = batchSaleSchema.parse(req.body);
    
    const results = [];
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    for (const item of items) {
      const saleWithNote = { ...item, note: item.note || note };
      const sale = await processSale(saleWithNote, req.user.id);
      results.push(sale);
    }

    logAudit({
      actor_id: req.user.id,
      action: "create_batch",
      entity: "sale",
      entity_id: null,
      metadata: { 
        items_count: items.length, 
        total: totalAmount,
        note
      }
    });

    res.status(201).json({ 
      success: true, 
      sales: results,
      summary: {
        items_count: items.length,
        total: totalAmount
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

salesRouter.get("/", authMiddleware(["admin", "manager", "staff"]), async (_req, res) => {
  try {
    const sales = await collections.sales()
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
        {
          $project: {
            _id: 1,
            product_id: 1,
            product_name: 1,
            quantity: 1,
            price: 1,
            total: 1,
            note: 1,
            created_at: 1,
            products: { name: "$product_data.name" }
          }
        },
        { $sort: { created_at: -1 } }
      ])
      .toArray();
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
