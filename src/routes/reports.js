import express from "express";
import { z } from "zod";
import { supabaseAdmin } from "../services/supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";

export const reportsRouter = express.Router();

const rangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime()
});

async function aggregateSales(from, to) {
  const { data: orderAgg, error: orderErr } = await supabaseAdmin
    .from("orders")
    .select("total, created_at")
    .gte("created_at", from)
    .lte("created_at", to)
    .eq("status", "completed");
  if (orderErr) throw orderErr;

  const { data: shopSales, error: salesErr } = await supabaseAdmin
    .from("sales")
    .select("total, created_at, quantity, product_id")
    .gte("created_at", from)
    .lte("created_at", to);
  if (salesErr) throw salesErr;

  const revenue =
    (orderAgg || []).reduce((sum, o) => sum + (o.total || 0), 0) +
    (shopSales || []).reduce((sum, s) => sum + (s.total || 0), 0);

  const itemsSold = (shopSales || []).reduce(
    (sum, s) => sum + (s.quantity || 0),
    0
  );

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
  try {
    const { data: sales, error } = await supabaseAdmin
      .from("sales")
      .select("total, quantity, created_at");
    if (error) throw error;

    const bucket = new Map();
    (sales || []).forEach((s) => {
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
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

reportsRouter.get(
  "/sales/products",
  authMiddleware(["admin", "manager", "staff"]),
  async (_req, res) => {
    try {
      const { data: sales, error } = await supabaseAdmin
        .from("sales")
        .select("total, quantity, product_id, products(name)");
      if (error) throw error;

      const bucket = new Map();
      (sales || []).forEach((s) => {
        const key = s.product_id;
        const current = bucket.get(key) || {
          product_id: key,
          name: s.products?.name || "Unknown",
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
    try {
      const { data: orders, error } = await supabaseAdmin
        .from("orders")
        .select("id, total, user_id, users(full_name, email)")
        .eq("status", "completed");
      if (error) throw error;

      const bucket = new Map();
      (orders || []).forEach((o) => {
        const key = o.user_id || "guest";
        const current = bucket.get(key) || {
          user_id: o.user_id,
          name: o.users?.full_name || "Guest",
          email: o.users?.email || "",
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

      res.json({ customers: rows, avgOrderValue: Number(avgOrderValue.toFixed(2)) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

