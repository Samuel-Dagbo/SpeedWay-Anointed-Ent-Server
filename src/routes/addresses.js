import express from "express";
import { z } from "zod";
import { collections, toObjectId } from "../services/mongodb.js";
import { authMiddleware } from "./auth.js";

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
  try {
    const addresses = await collections.addresses()
      .find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .toArray();
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

addressesRouter.post("/", authMiddleware(), async (req, res) => {
  try {
    const payload = addressSchema.parse(req.body);
    if (payload.is_default) {
      await collections.addresses().updateMany(
        { user_id: req.user.id },
        { $set: { is_default: false } }
      );
    }
    const result = await collections.addresses().insertOne({
      ...payload,
      user_id: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    });
    const inserted = await collections.addresses().findOne({ _id: result.insertedId });
    res.status(201).json(inserted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

addressesRouter.put("/:id", authMiddleware(), async (req, res) => {
  try {
    const payload = addressSchema.partial().parse(req.body);
    if (payload.is_default) {
      await collections.addresses().updateMany(
        { user_id: req.user.id },
        { $set: { is_default: false } }
      );
    }
    const result = await collections.addresses().findOneAndUpdate(
      { _id: toObjectId(req.params.id), user_id: req.user.id },
      { $set: { ...payload, updated_at: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ error: "Address not found" });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

addressesRouter.delete("/:id", authMiddleware(), async (req, res) => {
  try {
    const result = await collections.addresses().deleteOne({
      _id: toObjectId(req.params.id),
      user_id: req.user.id
    });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Address not found" });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
