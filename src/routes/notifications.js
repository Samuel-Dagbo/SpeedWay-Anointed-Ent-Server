import express from "express";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";

export const notificationsRouter = express.Router();

notificationsRouter.get("/", authMiddleware(), async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

notificationsRouter.post("/mark-read", authMiddleware(), async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (ids.length === 0) return res.json({ message: "No notifications" });
  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .in("id", ids)
    .eq("user_id", req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Updated" });
});
