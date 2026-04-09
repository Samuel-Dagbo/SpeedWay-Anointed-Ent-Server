import express from "express";
import { z } from "zod";
import { collections, toObjectId } from "../services/mongodb.js";
import { authMiddleware } from "./auth.js";

export const reviewsRouter = express.Router();

const reviewSchema = z.object({
  product_id: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().nullable(),
  body: z.string().trim().min(5).max(1000)
});

reviewsRouter.get("/", async (_req, res) => {
  try {
    const reviews = await collections.reviews()
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user_data"
          }
        },
        { $unwind: { path: "$user_data", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            rating: 1,
            title: 1,
            body: 1,
            created_at: 1,
            product_id: 1,
            "user_data.full_name": 1,
            users: { full_name: "$user_data.full_name" }
          }
        },
        { $sort: { created_at: -1 } }
      ])
      .toArray();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

reviewsRouter.get("/product/:id", async (req, res) => {
  try {
    const reviews = await collections.reviews()
      .aggregate([
        { $match: { product_id: req.params.id } },
        {
          $lookup: {
            from: "user",
            localField: "user_id",
            foreignField: "_id",
            as: "user_data"
          }
        },
        { $unwind: { path: "$user_data", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            rating: 1,
            title: 1,
            body: 1,
            created_at: 1,
            users: { full_name: "$user_data.full_name" }
          }
        },
        { $sort: { created_at: -1 } }
      ])
      .toArray();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

reviewsRouter.post("/", authMiddleware(), async (req, res) => {
  try {
    const payload = reviewSchema.parse(req.body);
    const result = await collections.reviews().insertOne({
      user_id: req.user.id,
      product_id: payload.product_id,
      rating: payload.rating,
      title: payload.title || null,
      body: payload.body,
      created_at: new Date()
    });
    const inserted = await collections.reviews().findOne({ _id: result.insertedId });
    res.status(201).json({
      id: inserted._id.toString(),
      rating: inserted.rating,
      title: inserted.title,
      body: inserted.body,
      created_at: inserted.created_at,
      product_id: inserted.product_id
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
