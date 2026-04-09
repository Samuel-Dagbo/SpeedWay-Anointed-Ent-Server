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
import { sendEmail } from "./services/emailService.js";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/admin/cache/clear", (_req, res) => {
  cache.clear();
  res.json({ message: "Cache cleared" });
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
      collections.years().find({ label: -1 }).toArray(),
    ]);
    
    const visibleModels = (mdlz || []).filter(m => !m.is_hidden);
    
    const formattedCats = cats.map(c => ({ ...c, id: c._id?.toString(), _id: undefined }));
    const formattedBrds = brds.map(b => ({ ...b, id: b._id?.toString(), _id: undefined }));
    const formattedModels = visibleModels.map(m => ({ ...m, id: m._id?.toString(), _id: undefined }));
    const formattedYears = yrs.map(y => ({ ...y, id: y._id?.toString(), _id: undefined }));
    
    setCache("categories:all", formattedCats, 3600000);
    setCache("brands:all", formattedBrds, 3600000);
    setCache("models:all", formattedModels, 3600000);
    setCache("years:all", formattedYears, 3600000);
    console.log("[cache] warmed", new Date().toISOString());
  } catch (err) {
    console.warn("[cache] warm failed:", err?.message);
  }
}

async function runDailyHealthCheck() {
  const results = {
    timestamp: new Date().toISOString(),
    checks: [],
    summary: { passed: 0, failed: 0 }
  };

  const baseUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace('/api', '').replace('/', '') : 'http://localhost:4000';
  const apiUrl = baseUrl.includes('localhost') ? 'http://localhost:4000' : 'https://speedway-anointed-ent-server.onrender.com';

  const endpoints = [
    { name: "Health", url: "/health" },
    { name: "Categories", url: "/categories" },
    { name: "Brands", url: "/brands" },
    { name: "Models", url: "/models" },
    { name: "Years", url: "/years" },
    { name: "Products (page 1)", url: "/products?page=1&limit=1" },
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${apiUrl}${endpoint.url}`, { signal: controller.signal });
      clearTimeout(timeoutId);

      const success = response.ok;
      results.checks.push({
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        success
      });
      results.summary[success ? "passed" : "failed"]++;
    } catch (err) {
      results.checks.push({
        name: endpoint.name,
        url: endpoint.url,
        status: "ERROR",
        success: false,
        error: err.message
      });
      results.summary.failed++;
    }
  }

  try {
    const mongodbStatus = await collections.users().stats();
    results.checks.push({
      name: "MongoDB",
      url: "Cluster0",
      status: mongodbStatus ? "OK" : "ERROR",
      success: Boolean(mongodbStatus)
    });
    results.summary[mongodbStatus ? "passed" : "failed"]++;
  } catch (err) {
    results.checks.push({
      name: "MongoDB",
      url: "Cluster0",
      status: "ERROR",
      success: false,
      error: err.message
    });
    results.summary.failed++;
  }

  const emailContent = generateHealthReportEmail(results);
  await sendEmail({
    to: "samueldagbo50@gmail.com",
    subject: `Speedway Daily Health Report - ${new Date().toLocaleDateString()}`,
    html: emailContent
  });

  console.log(`[health-check] Daily report sent. Passed: ${results.summary.passed}/${results.checks.length}`);
}

function generateHealthReportEmail(results) {
  const statusColor = results.summary.failed === 0 ? "#22c55e" : "#ef4444";
  const statusText = results.summary.failed === 0 ? "All Systems Operational" : "Issues Detected";

  const checksHtml = results.checks.map(check => {
    const color = check.success ? "#22c55e" : "#ef4444";
    const icon = check.success ? "✅" : "❌";
    const errorInfo = check.error ? `<br><small style="color:#666;">Error: ${check.error}</small>` : "";
    return `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">${icon} ${check.name}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;">${check.url}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;color:${color};font-weight:bold;">${check.status}</td>
      </tr>
    `;
  }).join("");

  return `
    <div style="background:#f8fafc;padding:24px 12px;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="padding:20px 24px;background:#0f172a;color:#ffffff;">
          <h2 style="margin:0;font-size:22px;">Speedway Daily Health Report</h2>
          <p style="margin:8px 0 0;opacity:0.7;font-size:12px;">${results.timestamp}</p>
        </div>
        <div style="padding:24px;">
          <div style="background:${statusColor}15;border-left:4px solid ${statusColor};padding:16px;border-radius:8px;margin-bottom:20px;">
            <h3 style="margin:0;color:${statusColor};font-size:18px;">${statusText}</h3>
            <p style="margin:4px 0 0;font-size:14px;">${results.summary.passed}/${results.checks.length} checks passed</p>
          </div>
          
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:10px;text-align:left;">Service</th>
                <th style="padding:10px;text-align:left;">Endpoint</th>
                <th style="padding:10px;text-align:left;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${checksHtml}
            </tbody>
          </table>
          
          <div style="margin-top:20px;padding:16px;background:#f8fafc;border-radius:8px;">
            <h4 style="margin:0 0 8px;font-size:14px;">Server Info</h4>
            <p style="margin:0;font-size:12px;color:#666;">
              Environment: ${process.env.NODE_ENV || 'production'}<br>
              Uptime: ${process.uptime ? Math.floor(process.uptime() / 3600) + " hours" : 'N/A'}
            </p>
          </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#666;text-align:center;">
          This is an automated health check report from Speedway Anointed Ent
        </div>
      </div>
    </div>
  `;
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
        } catch (err) {
          console.warn("[self-ping] failed:", err?.message || err);
        }
      };

      setInterval(ping, intervalMs);
      setTimeout(ping, 5000);
    }

    const DAILY_CHECK_HOUR = 8;
    const checkDaily = async () => {
      const now = new Date();
      const nextRun = new Date();
      nextRun.setHours(DAILY_CHECK_HOUR, 0, 0, 0);
      if (now >= nextRun) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      const msUntilNextRun = nextRun.getTime() - now.getTime();
      
      setTimeout(async () => {
        try {
          console.log("[health-check] Running daily health check...");
          await runDailyHealthCheck();
        } catch (err) {
          console.error("[health-check] Failed:", err?.message);
        }
        setInterval(runDailyHealthCheck, 24 * 60 * 60 * 1000);
      }, msUntilNextRun);
    };

    try {
      console.log("[health-check] Running initial health check on startup...");
      await runDailyHealthCheck();
    } catch (err) {
      console.error("[health-check] Initial check failed:", err?.message);
    }
    
    checkDaily();
    
  } catch (err) {
    console.error("[server] Failed to start:", err);
    process.exit(1);
  }
}

startServer();
