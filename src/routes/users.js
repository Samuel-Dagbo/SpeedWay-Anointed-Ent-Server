import express from "express";
import { z } from "zod";
import { collections, toObjectId } from "../services/mongodb.js";
import { authMiddleware } from "./auth.js";

export const usersRouter = express.Router();

usersRouter.get("/me", authMiddleware(), async (req, res) => {
  try {
    const user = await collections.users().findOne(
      { _id: toObjectId(req.user.id) },
      { projection: { password_hash: 0 } }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: user._id.toString(),
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      email_verified: user.email_verified,
      created_at: user.created_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

usersRouter.patch("/me", authMiddleware(), async (req, res) => {
  try {
    const payload = z
      .object({
        full_name: z.string().min(1).max(120).optional(),
        email: z.string().email().optional()
      })
      .parse(req.body);
    
    const updateFields = { ...payload, updated_at: new Date() };
    const result = await collections.users().findOneAndUpdate(
      { _id: toObjectId(req.user.id) },
      { $set: updateFields },
      { returnDocument: "after", projection: { password_hash: 0 } }
    );
    
    if (!result) return res.status(404).json({ error: "User not found" });
    res.json({
      id: result._id.toString(),
      email: result.email,
      full_name: result.full_name,
      role: result.role
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

usersRouter.get("/", authMiddleware("admin"), async (_req, res) => {
  try {
    const users = await collections.users()
      .find({})
      .project({ password_hash: 0 })
      .sort({ created_at: -1 })
      .toArray();
    res.json(users.map(u => ({
      id: u._id.toString(),
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      created_at: u.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

usersRouter.patch("/:id/role", authMiddleware("admin"), async (req, res) => {
  try {
    const role = z.enum(["admin", "manager", "staff", "customer"]).parse(req.body.role);
    const result = await collections.users().findOneAndUpdate(
      { _id: toObjectId(req.params.id) },
      { $set: { role, updated_at: new Date() } },
      { returnDocument: "after", projection: { password_hash: 0 } }
    );
    if (!result) return res.status(404).json({ error: "User not found" });
    res.json({
      id: result._id.toString(),
      email: result.email,
      full_name: result.full_name,
      role: result.role
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
