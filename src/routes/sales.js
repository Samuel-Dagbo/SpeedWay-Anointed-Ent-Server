import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";
import { logAudit } from "../services/audit.js";

export const salesRouter = express.Router();

const saleSchema = z
  .object({
    product_id: z.string().uuid().optional().nullable(),
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

  const { data: sale, error } = await supabaseAdmin
    .from("sales")
    .insert({
      product_id: payload.product_id || null,
      product_name: payload.product_name || null,
      quantity: payload.quantity,
      price: payload.price,
      total,
      note: payload.note
    })
    .select("*")
    .single();
  if (error) throw error;

  if (payload.product_id) {
    await supabaseAdmin.rpc("decrement_stock_and_log", {
      p_product_id: payload.product_id,
      p_quantity: payload.quantity,
      p_reason: "shop_sale",
      p_reference: sale.id.toString()
    });
  }

  logAudit({
    actor_id: userId,
    action: "create",
    entity: "sale",
    entity_id: sale.id,
    metadata: { total: sale.total, product_name: payload.product_name || null }
  });

  return sale;
}

// Admin: record single in-store sale
salesRouter.post("/", authMiddleware(["admin", "manager", "staff"]), async (req, res) => {
  try {
    const payload = saleSchema.parse(req.body);
    const sale = await processSale(payload, req.user.id);
    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: record batch in-store sales (single transaction)
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

// Admin: list sales
salesRouter.get("/", authMiddleware(["admin", "manager", "staff"]), async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("sales")
    .select("*, products(name)")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

