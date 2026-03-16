import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";

export const addressesRouter = express.Router();

const addressSchema = z.object({
  label: z.string().max(40).optional().nullable(),
  recipient_name: z.string().max(120).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  address_line1: z.string().min(3),
  address_line2: z.string().max(120).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  region: z.string().max(80).optional().nullable(),
  postal_code: z.string().max(24).optional().nullable(),
  is_default: z.boolean().optional().default(false)
});

addressesRouter.get("/", authMiddleware(), async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("user_addresses")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

addressesRouter.post("/", authMiddleware(), async (req, res) => {
  try {
    const payload = addressSchema.parse(req.body);
    if (payload.is_default) {
      await supabaseAdmin
        .from("user_addresses")
        .update({ is_default: false })
        .eq("user_id", req.user.id);
    }
    const { data, error } = await supabaseAdmin
      .from("user_addresses")
      .insert({ ...payload, user_id: req.user.id })
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

addressesRouter.put("/:id", authMiddleware(), async (req, res) => {
  try {
    const payload = addressSchema.partial().parse(req.body);
    if (payload.is_default) {
      await supabaseAdmin
        .from("user_addresses")
        .update({ is_default: false })
        .eq("user_id", req.user.id);
    }
    const { data, error } = await supabaseAdmin
      .from("user_addresses")
      .update(payload)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

addressesRouter.delete("/:id", authMiddleware(), async (req, res) => {
  const { error } = await supabaseAdmin
    .from("user_addresses")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});
