import express from "express";
import { z } from "zod";
import { collections } from "../services/mongodb.js";
import { authMiddleware } from "./auth.js";

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
  try {
    const settings = await collections.settings().findOne({ singleton: true });
    res.json(settings || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
      updated_at: new Date()
    };

    const result = await collections.settings().findOneAndUpdate(
      { singleton: true },
      { $set: normalized },
      { upsert: true, returnDocument: "after" }
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
