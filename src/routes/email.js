import express from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { sendTestEmail } from "../services/emailService.js";

export const emailRouter = express.Router();

emailRouter.post("/test", authMiddleware("admin"), async (req, res) => {
  try {
    const to = z.string().email().parse(req.body.to);
    await sendTestEmail(to);
    res.json({ message: "Test email queued." });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to send test email" });
  }
});
