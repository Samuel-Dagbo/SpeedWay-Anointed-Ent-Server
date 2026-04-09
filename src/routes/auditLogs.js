import express from "express";
import { collections } from "../services/mongodb.js";
import { authMiddleware } from "./auth.js";

export const auditLogsRouter = express.Router();

auditLogsRouter.get("/", authMiddleware("admin"), async (_req, res) => {
  try {
    const logs = await collections.auditLogs()
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "actor_id",
            foreignField: "_id",
            as: "user_data"
          }
        },
        { $unwind: { path: "$user_data", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            actor_id: 1,
            action: 1,
            entity: 1,
            entity_id: 1,
            metadata: 1,
            created_at: 1,
            users: {
              full_name: "$user_data.full_name",
              email: "$user_data.email"
            }
          }
        },
        { $sort: { created_at: -1 } },
        { $limit: 200 }
      ])
      .toArray();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
