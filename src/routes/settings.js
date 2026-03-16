import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";

export const settingsRouter = express.Router();

const optionalUrl = z
  .string()
  .url()
  .or(z.literal(""))
  .optional()
  .nullable();

const settingsSchema = z.object({
  business_name: z.string().optional().nullable(),
  support_email: z.string().email().or(z.literal("")).optional().nullable(),
  support_phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  facebook_url: optionalUrl,
  instagram_url: optionalUrl,
  x_url: optionalUrl,
  tiktok_url: optionalUrl,
  linkedin_url: optionalUrl,
  whatsapp_url: optionalUrl
});

const normalize = (value) => {
  if (value === "") return null;
  return value ?? null;
};

settingsRouter.get("/", async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || {});
});

settingsRouter.put("/", authMiddleware("admin"), async (req, res) => {
  try {
    const payload = settingsSchema.parse(req.body);
    const normalized = {
      singleton: true,
      business_name: normalize(payload.business_name),
      support_email: normalize(payload.support_email),
      support_phone: normalize(payload.support_phone),
      address: normalize(payload.address),
      facebook_url: normalize(payload.facebook_url),
      instagram_url: normalize(payload.instagram_url),
      x_url: normalize(payload.x_url),
      tiktok_url: normalize(payload.tiktok_url),
      linkedin_url: normalize(payload.linkedin_url),
      whatsapp_url: normalize(payload.whatsapp_url),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .upsert(normalized, { onConflict: "singleton" })
      .select("*")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

