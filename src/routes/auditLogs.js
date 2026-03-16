import express from "express";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";

export const auditLogsRouter = express.Router();

auditLogsRouter.get("/", authMiddleware("admin"), async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("audit_logs")
    .select("*, users(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
