import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";
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
    const { data: product, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("id, quantity")
      .eq("id", payload.product_id)
      .single();
    if (fetchError || !product) {
      return res.status(404).json({ error: "Product not found" });
    }
    const nextQty = Number(product.quantity) + payload.delta;
    if (nextQty < 0) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update({ quantity: nextQty })
      .eq("id", payload.product_id);
    if (updateError) return res.status(400).json({ error: updateError.message });

    await supabaseAdmin.from("inventory_logs").insert({
      product_id: payload.product_id,
      change: payload.delta,
      reason: payload.reason,
      reference: "manual_adjustment"
    });

    const { data: adjustment, error: adjError } = await supabaseAdmin
      .from("inventory_adjustments")
      .insert({
        product_id: payload.product_id,
        delta: payload.delta,
        reason: payload.reason,
        note: payload.note,
        actor_id: req.user.id
      })
      .select("*")
      .single();
    if (adjError) return res.status(400).json({ error: adjError.message });
    logAudit({
      actor_id: req.user.id,
      action: "inventory_adjustment",
      entity: "product",
      entity_id: payload.product_id,
      metadata: { delta: payload.delta, reason: payload.reason }
    });

    res.status(201).json(adjustment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

inventoryRouter.get("/adjustments", authMiddleware(["admin", "manager", "staff"]), async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("inventory_adjustments")
    .select("*, products(name)")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
