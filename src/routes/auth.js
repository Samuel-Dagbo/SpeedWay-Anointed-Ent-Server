import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import {
  sendWelcomeEmail,
  sendLoginAlert,
  sendPasswordResetEmail,
  sendEmailConfirmation
} from "../services/emailService.js";
import { generateToken } from "../middleware/auth.js";
import jwt from "jsonwebtoken";

export const authRouter = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  role: z.enum(["admin", "customer"]).optional().default("customer")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6)
});

const verifySchema = z.object({
  token: z.string().min(10)
});

authRouter.post("/signup", async (req, res, next) => {
  try {
    const { email, password, full_name, role } = signupSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 10);

    const { data: createdUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        email,
        full_name,
        role,
        password_hash: passwordHash,
        email_verified: false
      })
      .select("id, email, full_name, role, email_verified")
      .single();

    if (insertError) throw insertError;

    const verifyToken = jwt.sign(
      { sub: createdUser.id, type: "email_verify" },
      process.env.JWT_SECRET || "change-me",
      { expiresIn: "24h" }
    );
    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`;

    sendEmailConfirmation(email, verifyLink).catch((err) =>
      console.error("[email] verify failed", err)
    );
    sendWelcomeEmail(email, full_name).catch((err) =>
      console.error("[email] welcome failed", err)
    );

    const token = generateToken({
      id: createdUser.id,
      email,
      role
    });

    res.status(201).json({
      token,
      user: {
        id: createdUser.id,
        email,
        full_name,
        role,
        email_verified: createdUser.email_verified
      }
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, password_hash, email_verified")
      .eq("email", email)
      .single();
    if (profileError || !profile) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, profile.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (!profile.email_verified) {
      return res.status(403).json({ error: "Please verify your email first." });
    }

    sendLoginAlert(email).catch((err) =>
      console.error("[email] login alert failed", err)
    );

    const token = generateToken({
      id: profile.id,
      email: profile.email,
      role: profile.role
    });

    res.json({
      token,
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        email_verified: profile.email_verified
      }
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    const email = z.string().email().parse(req.body.email);
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (profile) {
      const token = jwt.sign(
        { sub: profile.id, type: "password_reset" },
        process.env.JWT_SECRET || "change-me",
        { expiresIn: "30m" }
      );
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      sendPasswordResetEmail(email, resetLink).catch((err) =>
        console.error("[email] reset failed", err)
      );
    }
    res.json({ message: "If that email exists, a reset link was sent." });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = resetSchema.parse(req.body);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "change-me"
    );
    if (decoded.type !== "password_reset") {
      return res.status(400).json({ error: "Invalid reset token" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { error } = await supabaseAdmin
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", decoded.sub);
    if (error) throw error;

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/verify-email", async (req, res, next) => {
  try {
    const { token } = verifySchema.parse(req.body);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "change-me"
    );
    if (decoded.type !== "email_verify") {
      return res.status(400).json({ error: "Invalid verification token" });
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update({ email_verified: true })
      .eq("id", decoded.sub);
    if (error) throw error;

    res.json({ message: "Email verified successfully." });
  } catch (err) {
    next(err);
  }
});
