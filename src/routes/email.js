import express from "express";
import { z } from "zod";
import { authMiddleware } from "./auth.js";
import { sendTestEmail } from "../services/emailService.js";

export const emailRouter = express.Router();

emailRouter.post("/test", async (req, res) => {
  try {
    const to = z.string().email().parse(req.body.to);
    console.log("[test-email] Sending to:", to);
    await sendTestEmail(to);
    res.json({ message: "Test email sent!" });
  } catch (err) {
    console.error("[test-email] Error:", err);
    res.status(400).json({ error: err.message || "Failed to send test email" });
  }
});

emailRouter.post("/test-auth", authMiddleware("admin"), async (req, res) => {
  try {
    const to = z.string().email().parse(req.body.to);
    await sendTestEmail(to);
    res.json({ message: "Test email queued." });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to send test email" });
  }
});
