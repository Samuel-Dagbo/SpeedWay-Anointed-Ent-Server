import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { connectToMongoDB, collections } from "./services/mongodb.js";

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

export { getCached, setCache, clearCache };

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
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

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

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 4000;

async function warmCache() {
  try {
    const [cats, brds, mdlz, yrs] = await Promise.all([
      collections.categories().find({}).sort({ name: 1 }).toArray(),
      collections.brands().find({ is_hidden: { $ne: true } }).sort({ name: 1 }).toArray(),
      collections.models().find({}).sort({ name: 1 }).toArray(),
      collections.years().find({}).sort({ label: -1 }).toArray(),
    ]);
    
    const visibleModels = (mdlz || []).filter(m => !m.is_hidden);
    setCache("categories:all", cats, 3600000);
    setCache("brands:all", brds, 3600000);
    setCache("models:all", visibleModels, 3600000);
    setCache("years:all", yrs, 3600000);
    console.log("[cache] warmed", new Date().toISOString());
  } catch (err) {
    console.warn("[cache] warm failed:", err?.message);
  }
}

async function startServer() {
  try {
    await connectToMongoDB();
    
    app.listen(port, async () => {
      console.log(`API server running on http://localhost:${port}`);
      
      setTimeout(async () => {
        await warmCache();
      }, 3000);
    });
    
    const selfPingUrl = process.env.SELF_PING_URL;
    const selfPingMinutes = Number(process.env.SELF_PING_MINUTES || 10);

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
    
  } catch (err) {
    console.error("[server] Failed to start:", err);
    process.exit(1);
  }
}

startServer();
