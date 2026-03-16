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
  authMiddleware("admin"),
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
  authMiddleware("admin"),
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

