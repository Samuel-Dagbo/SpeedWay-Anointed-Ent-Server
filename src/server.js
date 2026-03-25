import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "./services/supabaseClient.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CACHE_TTL = 30000;
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { cache.delete(key); return null; }
  return entry.data;
}

function setCache(key, data, ttl = CACHE_TTL) {
  cache.set(key, { data, expires: Date.now() + ttl });
}

function clearCache(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

function createOptimizedClient() {
  return createClient(supabaseUrl, supabaseKey, {
    schema: 'public',
    persistSession: false,
    autoRefreshToken: false,
  });
}

export { getCached, setCache, clearCache, createOptimizedClient };

import { authRouter } from "./routes/auth.js";
import { productsRouter } from "./routes/products.js";
import { ordersRouter } from "./routes/orders.js";
import { salesRouter } from "./routes/sales.js";
import { categoriesRouter } from "./routes/categories.js";
import { brandsRouter } from "./routes/brands.js";
import { modelsRouter } from "./routes/models.js";
import { reportsRouter } from "./routes/reports.js";
import { usersRouter } from "./routes/users.js";
import { yearsRouter } from "./routes/years.js";
import { reviewsRouter } from "./routes/reviews.js";
import { emailRouter } from "./routes/email.js";
import { settingsRouter } from "./routes/settings.js";
import { addressesRouter } from "./routes/addresses.js";
import { wishlistRouter } from "./routes/wishlist.js";
import { cartRouter } from "./routes/cart.js";
import { couponsRouter } from "./routes/coupons.js";
import { notificationsRouter } from "./routes/notifications.js";
import { inventoryRouter } from "./routes/inventory.js";
import { stockSubscriptionsRouter } from "./routes/stockSubscriptions.js";
import { auditLogsRouter } from "./routes/auditLogs.js";
import { modelYearGalleriesRouter } from "./routes/model-year-galleries.js";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/orders", ordersRouter);
app.use("/sales", salesRouter);
app.use("/categories", categoriesRouter);
app.use("/brands", brandsRouter);
app.use("/models", modelsRouter);
app.use("/reports", reportsRouter);
app.use("/users", usersRouter);
app.use("/years", yearsRouter);
app.use("/reviews", reviewsRouter);
app.use("/email", emailRouter);
app.use("/settings", settingsRouter);
app.use("/addresses", addressesRouter);
app.use("/wishlist", wishlistRouter);
app.use("/cart", cartRouter);
app.use("/coupons", couponsRouter);
app.use("/notifications", notificationsRouter);
app.use("/inventory", inventoryRouter);
app.use("/stock-subscriptions", stockSubscriptionsRouter);
app.use("/audit-logs", auditLogsRouter);
app.use("/model-year-galleries", modelYearGalleriesRouter);

// TEMPORARY: Create model_year_galleries table
app.post("/admin/create-gallery-table", async (req, res) => {
  try {
    const { error } = await supabaseAdmin.query(`
      CREATE TABLE IF NOT EXISTS public.model_year_galleries (
        id uuid primary key default gen_random_uuid(),
        model_id uuid not null references public.models(id) on delete cascade,
        year text not null,
        image_url text,
        gallery jsonb not null default '[]'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        unique (model_id, year)
      );
      CREATE INDEX IF NOT EXISTS idx_model_year_galleries_model ON public.model_year_galleries(model_id);
    `);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Table created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TEMPORARY: Delete products not in Seat Belt or Car Alarm Systems
app.post("/admin/cleanup-products", async (req, res) => {
  try {
    const seatBeltId = '3b26667d-e16b-4fdf-b6bd-c5538ed04fba';
    const carAlarmId = 'a769b67d-3b3c-43e1-ba20-b5a89db916fd';
    
    // First get count of products to delete
    const { count } = await supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true })
      .not("category_id", "eq", seatBeltId)
      .not("category_id", "eq", carAlarmId);
    
    // Delete products not in those categories
    const { error: deleteError } = await supabaseAdmin
      .from("products")
      .delete()
      .not("category_id", "eq", seatBeltId)
      .not("category_id", "eq", carAlarmId);
    
    if (deleteError) return res.status(400).json({ error: deleteError.message });
    
    clearCache("products");
    res.json({ message: `Deleted ${count} products. Kept Seat Belt and Car Alarm Systems products.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, async () => {
  console.log(`API server running on http://localhost:${port}`);
  
  // Pre-warm cache on startup
  setTimeout(async () => {
    try {
      const [cats, brds, mdlz, yrs] = await Promise.all([
        supabaseAdmin.from("categories").select("*").order("name"),
        supabaseAdmin.from("brands").select("*").order("name"),
        supabaseAdmin.from("models").select("*, brands(name)").order("name"),
        supabaseAdmin.from("years").select("*").order("label", { ascending: false })
      ]);
      setCache("categories:all", cats.data, 3600000);
      setCache("brands:all", brds.data, 3600000);
      setCache("models:all", mdlz.data, 3600000);
      setCache("years:all", yrs.data, 3600000);
      console.log("[cache] pre-warmed on startup");
    } catch (err) {
      console.warn("[cache] pre-warm failed:", err?.message);
    }
  }, 3000);
});

// Optional self-ping to reduce cold starts on hosts like Render
const selfPingUrl = process.env.SELF_PING_URL;
const selfPingMinutes = Number(process.env.SELF_PING_MINUTES || 10);

async function warmCache() {
  try {
    const [cats, brds, mdlz, yrs] = await Promise.all([
      supabaseAdmin.from("categories").select("*").order("name"),
      supabaseAdmin.from("brands").select("*").order("name"),
      supabaseAdmin.from("models").select("*, brands(name)").order("name"),
      supabaseAdmin.from("years").select("*").order("label", { ascending: false })
    ]);
    setCache("categories:all", cats.data, 3600000);
    setCache("brands:all", brds.data, 3600000);
    setCache("models:all", mdlz.data, 3600000);
    setCache("years:all", yrs.data, 3600000);
    console.log("[cache] warmed", new Date().toISOString());
  } catch (err) {
    console.warn("[cache] warm failed:", err?.message);
  }
}

if (selfPingUrl) {
  const intervalMs = Math.max(selfPingMinutes, 1) * 60 * 1000;
  const ping = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      await fetch(selfPingUrl, { method: "GET", signal: controller.signal });
      clearTimeout(timeoutId);
      console.log("[self-ping] ok", new Date().toISOString());
      await warmCache();
    } catch (err) {
      console.warn("[self-ping] failed:", err?.message || err);
    }
  };

  setInterval(ping, intervalMs);
  setTimeout(ping, 5000);
}

