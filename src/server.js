import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

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

// Generic error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});

// Optional self-ping to reduce cold starts on hosts like Render
const selfPingUrl = process.env.SELF_PING_URL;
const selfPingMinutes = Number(process.env.SELF_PING_MINUTES || 10);
if (selfPingUrl) {
  const intervalMs = Math.max(selfPingMinutes, 1) * 60 * 1000;
  const ping = async () => {
    try {
      await fetch(selfPingUrl, { method: "GET" });
      console.log("[self-ping] ok", new Date().toISOString());
    } catch (err) {
      console.warn("[self-ping] failed:", err?.message || err);
    }
  };

  ping();
  setInterval(ping, intervalMs);
}

