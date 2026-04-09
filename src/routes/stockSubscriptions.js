import express from "express";
import { z } from "zod";
import { collections, toObjectId } from "../services/mongodb.js";
import { authMiddleware } from "./auth.js";

export const stockSubscriptionsRouter = express.Router();

const subscriptionSchema = z.object({
  product_id: z.string()
});

stockSubscriptionsRouter.get("/", authMiddleware(), async (req, res) => {
  try {
    const subscriptions = await collections.stockSubscriptions()
      .aggregate([
        { $match: { user_id: req.user.id } },
        {
          $lookup: {
            from: "products",
            localField: "product_id",
            foreignField: "_id",
            as: "product_data"
          }
        },
        { $unwind: { path: "$product_data", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            created_at: 1,
            products: {
              id: "$product_data._id",
              name: "$product_data.name",
              image_url: "$product_data.image_url",
              quantity: "$product_data.quantity"
            }
          }
        },
        { $sort: { created_at: -1 } }
      ])
      .toArray();
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

stockSubscriptionsRouter.post("/", authMiddleware(), async (req, res) => {
  try {
    const payload = subscriptionSchema.parse(req.body);
    const result = await collections.stockSubscriptions().insertOne({
      user_id: req.user.id,
      product_id: payload.product_id,
      created_at: new Date()
    });
    
    const subscription = await collections.stockSubscriptions()
      .aggregate([
        { $match: { _id: result.insertedId } },
        {
          $lookup: {
            from: "products",
            localField: "product_id",
            foreignField: "_id",
            as: "product_data"
          }
        },
        { $unwind: { path: "$product_data", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            created_at: 1,
            products: {
              id: "$product_data._id",
              name: "$product_data.name",
              image_url: "$product_data.image_url",
              quantity: "$product_data.quantity"
            }
          }
        }
      ])
      .toArray();
    
    res.status(201).json(subscription[0] || { id: result.insertedId.toString() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

stockSubscriptionsRouter.delete("/:id", authMiddleware(), async (req, res) => {
  try {
    const result = await collections.stockSubscriptions().deleteOne({
      _id: toObjectId(req.params.id),
      user_id: req.user.id
    });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Subscription not found" });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
