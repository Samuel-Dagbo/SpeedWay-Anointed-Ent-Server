import express from "express";
import { z } from "zod";
import { collections, toObjectId } from "../services/mongodb.js";
import { authMiddleware } from "./auth.js";

export const cartRouter = express.Router();

const cartItemSchema = z.object({
  product_id: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive()
});

const cartSchema = z.object({
  items: z.array(cartItemSchema)
});

async function ensureCart(userId) {
  let cart = await collections.cart().findOne({ user_id: userId, status: "active" });
  if (!cart) {
    const result = await collections.cart().insertOne({
      user_id: userId,
      status: "active",
      created_at: new Date(),
      updated_at: new Date()
    });
    cart = { _id: result.insertedId, user_id: userId, status: "active" };
  }
  return cart;
}

cartRouter.get("/", authMiddleware(), async (req, res) => {
  try {
    const cart = await ensureCart(req.user.id);
    const items = await collections.cartItems()
      .aggregate([
        { $match: { cart_id: cart._id } },
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
            quantity: 1,
            price: 1,
            "product_data._id": 1,
            "product_data.name": 1,
            "product_data.image_url": 1,
            products: { id: "$product_data._id", name: "$product_data.name", image_url: "$product_data.image_url" }
          }
        },
        { $sort: { created_at: 1 } }
      ])
      .toArray();
    res.json({ cart, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

cartRouter.put("/", authMiddleware(), async (req, res) => {
  try {
    const payload = cartSchema.parse(req.body);
    const cart = await ensureCart(req.user.id);
    
    await collections.cartItems().deleteMany({ cart_id: cart._id });
    
    if (payload.items.length > 0) {
      const rows = payload.items.map((item) => ({
        cart_id: cart._id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        created_at: new Date()
      }));
      await collections.cartItems().insertMany(rows);
    }
    
    await collections.cart().updateOne(
      { _id: cart._id },
      { $set: { updated_at: new Date() } }
    );
    res.json({ message: "Cart updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
