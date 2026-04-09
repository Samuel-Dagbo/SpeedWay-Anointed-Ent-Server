import express from "express";
import { collections, toObjectId } from "../services/mongodb.js";
import { authMiddleware } from "./auth.js";

export const notificationsRouter = express.Router();

notificationsRouter.get("/", authMiddleware(), async (req, res) => {
  try {
    const notifications = await collections.notifications()
      .find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .toArray();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

notificationsRouter.post("/mark-read", authMiddleware(), async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (ids.length === 0) return res.json({ message: "No notifications" });
    
    const objectIds = ids.map(id => toObjectId(id)).filter(id => id !== null);
    await collections.notifications().updateMany(
      { _id: { $in: objectIds }, user_id: req.user.id },
      { $set: { read_at: new Date() } }
    );
    res.json({ message: "Updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
