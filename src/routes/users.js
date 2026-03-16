import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";

export const usersRouter = express.Router();

usersRouter.get("/me", authMiddleware(), async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, email, full_name, role, email_verified, created_at")
    .eq("id", req.user.id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

usersRouter.patch("/me", authMiddleware(), async (req, res) => {
  try {
    const payload = z
      .object({
        full_name: z.string().min(1).max(120).optional(),
        email: z.string().email().optional()
      })
      .parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("users")
      .update(payload)
      .eq("id", req.user.id)
      .select("id, email, full_name, role")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

usersRouter.get("/", authMiddleware("admin"), async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

usersRouter.patch("/:id/role", authMiddleware("admin"), async (req, res) => {
  try {
    const role = z.enum(["admin", "manager", "staff", "customer"]).parse(req.body.role);
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ role })
      .eq("id", req.params.id)
      .select("id, email, full_name, role")
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

