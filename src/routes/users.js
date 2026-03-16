import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";

export const usersRouter = express.Router();

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
    const role = z.enum(["admin", "customer"]).parse(req.body.role);
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

