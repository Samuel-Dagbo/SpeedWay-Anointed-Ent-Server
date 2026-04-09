import express from "express";
import { z } from "zod";
import { collections } from "../services/mongodb.js";
import { authMiddleware } from "./auth.js";
import { getCached, setCache } from "../server.js";

export const reportsRouter = express.Router();

const rangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime()
});

async function aggregateSales(from, to) {
  const [orderAgg, shopSales] = await Promise.all([
    collections.orders()
      .find({
        created_at: { $gte: new Date(from), $lte: new Date(to) },
        status: "completed"
      })
      .project({ total: 1, created_at: 1 })
      .toArray(),
    collections.sales()
      .find({
        created_at: { $gte: new Date(from), $lte: new Date(to) }
      })
      .project({ total: 1, quantity: 1, created_at: 1 })
      .toArray()
  ]);

  const revenue =
    orderAgg.reduce((sum, o) => sum + (o.total || 0), 0) +
    shopSales.reduce((sum, s) => sum + (s.total || 0), 0);

  const itemsSold = shopSales.reduce((sum, s) => sum + (s.quantity || 0), 0);

  return { revenue, itemsSold };
}

reportsRouter.get(
  "/summary",
  authMiddleware(["admin", "manager", "staff"]),
  async (_req, res) => {
    try {
      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const [today, week, month, year] = await Promise.all([
        aggregateSales(todayStart.toISOString(), now.toISOString()),
        aggregateSales(weekStart.toISOString(), now.toISOString()),
        aggregateSales(monthStart.toISOString(), now.toISOString()),
        aggregateSales(yearStart.toISOString(), now.toISOString())
      ]);

      res.json({ today, week, month, year });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

reportsRouter.post(
  "/range",
  authMiddleware(["admin", "manager", "staff"]),
  async (req, res) => {
    try {
      const { from, to } = rangeSchema.parse(req.body);
      const data = await aggregateSales(from, to);
      res.json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

reportsRouter.get("/sales/daily", authMiddleware(["admin", "manager", "staff"]), async (_req, res) => {
  const cacheKey = "report_sales_daily";
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const sales = await collections.sales()
      .find({})
      .project({ total: 1, quantity: 1, created_at: 1 })
      .toArray();

    const bucket = new Map();
    sales.forEach((s) => {
      const date = new Date(s.created_at);
      const key = date.toISOString().slice(0, 10);
      const current = bucket.get(key) || { total: 0, quantity: 0 };
      bucket.set(key, {
        total: current.total + Number(s.total || 0),
        quantity: current.quantity + Number(s.quantity || 0)
      });
    });

    const rows = Array.from(bucket.entries())
      .map(([date, value]) => ({ date, ...value }))
      .sort((a, b) => b.date.localeCompare(a.date));
    
    setCache(cacheKey, rows, 300000);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

reportsRouter.get(
  "/sales/products",
  authMiddleware(["admin", "manager", "staff"]),
  async (_req, res) => {
    const cacheKey = "report_sales_products";
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    try {
      const sales = await collections.sales()
        .aggregate([
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
              product_id: 1,
              total: 1,
              quantity: 1,
              name: "$product_data.name"
            }
          }
        ])
        .toArray();

      const bucket = new Map();
      sales.forEach((s) => {
        const key = s.product_id?.toString();
        const current = bucket.get(key) || {
          product_id: key,
          name: s.name || "Unknown",
          total: 0,
          quantity: 0
        };
        bucket.set(key, {
          ...current,
          total: current.total + Number(s.total || 0),
          quantity: current.quantity + Number(s.quantity || 0)
        });
      });

      const rows = Array.from(bucket.values()).sort((a, b) => b.total - a.total);
      setCache(cacheKey, rows, 300000);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

reportsRouter.get(
  "/customers/insights",
  authMiddleware(["admin", "manager", "staff"]),
  async (_req, res) => {
    const cacheKey = "report_customers_insights";
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    try {
      const orders = await collections.orders()
        .aggregate([
          { $match: { status: "completed" } },
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
              user_id: 1,
              total: 1,
              "user_data.full_name": 1,
              "user_data.email": 1
            }
          }
        ])
        .toArray();

      const bucket = new Map();
      orders.forEach((o) => {
        const key = o.user_id || "guest";
        const current = bucket.get(key) || {
          user_id: o.user_id,
          name: o.user_data?.full_name || "Guest",
          email: o.user_data?.email || "",
          order_count: 0,
          total_spent: 0
        };
        bucket.set(key, {
          ...current,
          order_count: current.order_count + 1,
          total_spent: current.total_spent + Number(o.total || 0)
        });
      });

      const rows = Array.from(bucket.values()).sort((a, b) => b.total_spent - a.total_spent);
      const avgOrderValue =
        rows.length === 0
          ? 0
          : rows.reduce((sum, r) => sum + r.total_spent, 0) /
            rows.reduce((sum, r) => sum + r.order_count, 0);

      const result = { customers: rows, avgOrderValue: Number(avgOrderValue.toFixed(2)) };
      setCache(cacheKey, result, 300000);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
