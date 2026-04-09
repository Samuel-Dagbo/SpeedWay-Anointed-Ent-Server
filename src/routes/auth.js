import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { collections } from "../services/mongodb.js";
import {
  sendWelcomeEmail,
  sendLoginAlert,
  sendPasswordResetEmail
} from "../services/emailService.js";

const JWT_SECRET = process.env.JWT_SECRET || "change-me";

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function authMiddleware(requiredRole = null) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (requiredRole) {
        const allowed = Array.isArray(requiredRole)
          ? requiredRole
          : [requiredRole];
        if (!allowed.includes(decoded.role)) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

export const authRouter = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  role: z.enum(["admin", "manager", "staff", "customer"]).optional().default("customer")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6)
});

authRouter.post("/signup", async (req, res, next) => {
  try {
    const { email, password, full_name, role } = signupSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await collections.users().findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const result = await collections.users().insertOne({
      email,
      full_name,
      role,
      password_hash: passwordHash,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    sendWelcomeEmail(email, full_name).catch((err) =>
      console.error("[email] welcome failed", err)
    );

    const token = generateToken({
      id: result.insertedId.toString(),
      email,
      role
    });

    res.status(201).json({
      token,
      user: {
        id: result.insertedId.toString(),
        email,
        full_name,
        role,
        email_verified: true
      }
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const profile = await collections.users().findOne({ email });
    
    if (!profile) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, profile.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    sendLoginAlert(email).catch((err) =>
      console.error("[email] login alert failed", err)
    );

    const token = generateToken({
      id: profile._id.toString(),
      email: profile.email,
      role: profile.role
    });

    res.json({
      token,
      user: {
        id: profile._id.toString(),
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
    const profile = await collections.users().findOne({ email });

    if (profile) {
      const token = jwt.sign(
        { sub: profile._id.toString(), type: "password_reset" },
        JWT_SECRET,
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
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== "password_reset") {
      return res.status(400).json({ error: "Invalid reset token" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await collections.users().updateOne(
      { _id: decoded.sub },
      { $set: { password_hash: passwordHash, updated_at: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    next(err);
  }
});
