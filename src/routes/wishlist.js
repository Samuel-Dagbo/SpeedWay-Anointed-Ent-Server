import express from "express";
import { z } from "zod";
import { collections, toObjectId } from "../services/mongodb.js";
import { authMiddleware } from "./auth.js";

export const wishlistRouter = express.Router();

const itemSchema = z.object({
  product_id: z.string()
});

async function ensureWishlist(userId) {
  let wishlist = await collections.wishlist().findOne({ user_id: userId });
  if (!wishlist) {
    const result = await collections.wishlist().insertOne({
      user_id: userId,
      name: "My wishlist",
      created_at: new Date()
    });
    wishlist = { _id: result.insertedId, user_id: userId, name: "My wishlist" };
  }
  return wishlist;
}

wishlistRouter.get("/", authMiddleware(), async (req, res) => {
  try {
    const wishlist = await ensureWishlist(req.user.id);
    const items = await collections.wishlistItems()
      .aggregate([
        { $match: { wishlist_id: wishlist._id } },
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
              price: "$product_data.price",
              image_url: "$product_data.image_url",
              quantity: "$product_data.quantity"
            }
          }
        },
        { $sort: { created_at: -1 } }
      ])
      .toArray();
    res.json({ wishlist, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

wishlistRouter.post("/items", authMiddleware(), async (req, res) => {
  try {
    const payload = itemSchema.parse(req.body);
    const wishlist = await ensureWishlist(req.user.id);
    
    const result = await collections.wishlistItems().insertOne({
      wishlist_id: wishlist._id,
      product_id: payload.product_id,
      created_at: new Date()
    });
    
    const item = await collections.wishlistItems()
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
              price: "$product_data.price",
              image_url: "$product_data.image_url",
              quantity: "$product_data.quantity"
            }
          }
        }
      ])
      .toArray();
    
    res.status(201).json(item[0] || { id: result.insertedId.toString() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

wishlistRouter.delete("/items/:id", authMiddleware(), async (req, res) => {
  try {
    const result = await collections.wishlistItems().deleteOne({ _id: toObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Item not found" });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
