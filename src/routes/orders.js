import express from "express";
import { z } from "zod";
import { collections, toObjectId } from "../services/mongodb.js";
import { authMiddleware } from "./auth.js";
import { logAudit } from "../services/audit.js";
import {
  sendOrderConfirmation,
  sendAdminOrderNotification,
  sendOrderStatusEmail
} from "../services/emailService.js";

export const ordersRouter = express.Router();

const orderItemSchema = z.object({
  product_id: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive()
});

const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  total: z.number().positive(),
  coupon_code: z.string().optional().nullable(),
  shipping_fee: z.number().optional().nullable(),
  delivery_address_id: z.string().optional().nullable()
});

ordersRouter.post("/", authMiddleware(), async (req, res) => {
  try {
    const { items, total, coupon_code, shipping_fee, delivery_address_id } =
      orderSchema.parse(req.body);
    const userId = req.user.id;
    const subtotal = items.reduce((sum, it) => sum + it.quantity * it.price, 0);
    let discountTotal = 0;
    let appliedCoupon = null;

    if (coupon_code) {
      const coupon = await collections.coupons().findOne({
        code: coupon_code.toUpperCase(),
        active: true
      });
      if (coupon) {
        const rawDiscount =
          coupon.type === "percent" ? (subtotal * Number(coupon.value)) / 100 : Number(coupon.value);
        const capped = coupon.max_discount
          ? Math.min(rawDiscount, Number(coupon.max_discount))
          : rawDiscount;
        discountTotal = Math.max(0, Number(capped.toFixed(2)));
        appliedCoupon = coupon;
      }
    }

    const computedTotal = Math.max(0, subtotal - discountTotal) + Number(shipping_fee || 0);
    const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const orderResult = await collections.orders().insertOne({
      user_id: userId,
      total: computedTotal,
      subtotal,
      discount_total: discountTotal,
      coupon_code: appliedCoupon?.code || null,
      shipping_fee: shipping_fee || 0,
      delivery_address_id: delivery_address_id || null,
      status: "pending",
      estimated_delivery_date: estimatedDelivery.toISOString().slice(0, 10),
      created_at: new Date(),
      updated_at: new Date()
    });
    const orderId = orderResult.insertedId;

    const orderItems = items.map(it => ({
      order_id: orderId,
      product_id: it.product_id,
      quantity: it.quantity,
      price: it.price,
      total: it.quantity * it.price
    }));
    await collections.orderItems().insertMany(orderItems);

    await collections.orderStatusEvents().insertOne({
      order_id: orderId,
      status: "pending",
      note: "Order placed",
      created_at: new Date()
    });
    
    await collections.notifications().insertOne({
      user_id: userId,
      title: `Order #${orderId.toString().padStart(4, "0")} placed`,
      body: `We received your order totaling GHS ${order.total}.`,
      type: "order",
      read: false,
      created_at: new Date()
    });
    
    logAudit({
      actor_id: userId,
      action: "create",
      entity: "order",
      entity_id: orderId.toString(),
      metadata: { total: order.total }
    });

    for (const it of items) {
      await collections.inventory().insertOne({
        product_id: it.product_id,
        quantity: -it.quantity,
        reason: "online_order",
        reference: orderId.toString(),
        created_at: new Date()
      });
    }

    const userProfile = await collections.users().findOne(
      { _id: toObjectId(userId) },
      { projection: { email: 1 } }
    );
    if (userProfile?.email) {
      sendOrderConfirmation(userProfile.email, orderId.toString(), computedTotal).catch((err) =>
        console.error("[email] order confirmation failed", err)
      );
    }
    sendAdminOrderNotification(orderId.toString(), computedTotal).catch((err) =>
      console.error("[email] admin notification failed", err)
    );

    if (appliedCoupon) {
      await collections.couponRedemptions().insertOne({
        coupon_id: appliedCoupon._id,
        user_id: userId,
        order_id: orderId,
        created_at: new Date()
      });
    }

    res.status(201).json({ order_id: orderId.toString() });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

ordersRouter.get("/my", authMiddleware(), async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  try {
    const [orders, countResult] = await Promise.all([
      collections.orders()
        .aggregate([
          { $match: { user_id: req.user.id } },
          {
            $lookup: {
              from: "order_items",
              localField: "_id",
              foreignField: "order_id",
              as: "order_items"
            }
          },
          {
            $lookup: {
              from: "order_status_events",
              localField: "_id",
              foreignField: "order_id",
              as: "order_status_events"
            }
          },
          { $sort: { created_at: -1 } },
          { $skip: offset },
          { $limit: limitNum }
        ])
        .toArray(),
      collections.orders().countDocuments({ user_id: req.user.id })
    ]);

    const ordersWithProducts = await Promise.all(orders.map(async (order) => {
      const productIds = order.order_items.map(it => it.product_id);
      const products = await collections.products()
        .find({ _id: { $in: productIds.map(id => toObjectId(id)) } })
        .project({ name: 1, image_url: 1 })
        .toArray();
      
      const productMap = {};
      products.forEach(p => { productMap[p._id.toString()] = p; });
      
      return {
        ...order,
        order_items: order.order_items.map(it => ({
          ...it,
          products: productMap[it.product_id]
        }))
      };
    }));

    res.json({
      data: ordersWithProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult,
        totalPages: Math.ceil((countResult || 0) / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

ordersRouter.get("/", authMiddleware(["admin", "manager", "staff"]), async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  try {
    const [orders, countResult] = await Promise.all([
      collections.orders()
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
              user_data: { full_name: 1, email: 1 }
            }
          },
          { $sort: { created_at: -1 } },
          { $skip: offset },
          { $limit: limitNum }
        ])
        .toArray(),
      collections.orders().countDocuments({})
    ]);

    res.json({
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult,
        totalPages: Math.ceil((countResult || 0) / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

ordersRouter.patch("/:id/status", authMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const status = z.enum(["pending", "processing", "completed", "cancelled"]).parse(
      req.body.status
    );
    
    const result = await collections.orders().findOneAndUpdate(
      { _id: toObjectId(req.params.id) },
      { $set: { status, updated_at: new Date() } },
      { returnDocument: "after" }
    );
    
    if (!result) return res.status(404).json({ error: "Order not found" });

    await collections.orderStatusEvents().insertOne({
      order_id: result._id,
      status,
      note: req.body.note || null,
      created_at: new Date()
    });
    
    logAudit({
      actor_id: req.user.id,
      action: "status_update",
      entity: "order",
      entity_id: result._id.toString(),
      metadata: { status }
    });

    if (result?.user_id) {
      const userProfile = await collections.users().findOne(
        { _id: toObjectId(result.user_id) },
        { projection: { email: 1 } }
      );
      if (userProfile?.email) {
        sendOrderStatusEmail(userProfile.email, result._id.toString(), status).catch((err) =>
          console.error("[email] status email failed", err)
        );
      }
      await collections.notifications().insertOne({
        user_id: result.user_id,
        title: `Order #${result._id.toString().padStart(4, "0")} ${status}`,
        body: `Your order status is now ${status}.`,
        type: "order",
        read: false,
        created_at: new Date()
      });
    }

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

ordersRouter.post("/:id/returns", authMiddleware(), async (req, res) => {
  try {
    const reason = z.string().min(4).parse(req.body.reason);
    const order = await collections.orders().findOne({
      _id: toObjectId(req.params.id),
      user_id: req.user.id
    });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const result = await collections.orderReturns().insertOne({
      order_id: order._id,
      user_id: req.user.id,
      reason,
      status: "requested",
      amount: order.total,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    logAudit({
      actor_id: req.user.id,
      action: "return_requested",
      entity: "order",
      entity_id: order._id.toString(),
      metadata: { reason }
    });
    
    const inserted = await collections.orderReturns().findOne({ _id: result.insertedId });
    res.status(201).json(inserted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

ordersRouter.get("/returns", authMiddleware(["admin", "manager", "staff"]), async (_req, res) => {
  try {
    const returns = await collections.orderReturns()
      .aggregate([
        {
          $lookup: {
            from: "orders",
            localField: "order_id",
            foreignField: "_id",
            as: "order_data"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user_data"
          }
        },
        { $unwind: { path: "$order_data", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$user_data", preserveNullAndEmptyArrays: true } },
        { $sort: { created_at: -1 } }
      ])
      .toArray();
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

ordersRouter.patch("/returns/:id", authMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const status = z
      .enum(["requested", "approved", "rejected", "refunded"])
      .parse(req.body.status);
    const result = await collections.orderReturns().findOneAndUpdate(
      { _id: toObjectId(req.params.id) },
      { $set: { status, updated_at: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ error: "Return not found" });
    
    logAudit({
      actor_id: req.user.id,
      action: "return_status_update",
      entity: "order_return",
      entity_id: result._id.toString(),
      metadata: { status }
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

ordersRouter.get("/:id/receipt", authMiddleware(), async (req, res) => {
  try {
    const order = await collections.orders()
      .aggregate([
        { $match: { _id: toObjectId(req.params.id) } },
        {
          $lookup: {
            from: "order_items",
            localField: "_id",
            foreignField: "order_id",
            as: "order_items"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user_data"
          }
        },
        { $unwind: { path: "$user_data", preserveNullAndEmptyArrays: true } }
      ])
      .toArray();
    
    if (!order || order.length === 0) return res.status(404).json({ error: "Order not found" });
    
    const isOwner = order[0].user_id === req.user.id;
    const isAdmin = ["admin", "manager", "staff"].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });
    
    res.json(order[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
