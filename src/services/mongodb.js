import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn("[mongodb] MONGODB_URI not set in environment variables");
}

let client = null;
let db = null;

export async function connectToMongoDB() {
  if (db) return db;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db("speedway_anointed_ent");
    console.log("[mongodb] Connected successfully");
    
    client.on("close", () => {
      console.log("[mongodb] Connection closed");
      db = null;
      client = null;
    });
    
    return db;
  } catch (err) {
    console.error("[mongodb] Connection failed:", err.message);
    throw err;
  }
}

export function getDB() {
  if (!db) {
    throw new Error("MongoDB not connected. Call connectToMongoDB() first.");
  }
  return db;
}

export function getCollection(name) {
  return getDB().collection(name);
}

export function toObjectId(id) {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export const collections = {
  users: () => getCollection("users"),
  products: () => getCollection("products"),
  categories: () => getCollection("categories"),
  brands: () => getCollection("brands"),
  models: () => getCollection("models"),
  years: () => getCollection("years"),
  orders: () => getCollection("orders"),
  orderItems: () => getCollection("order_items"),
  orderStatusEvents: () => getCollection("order_status_events"),
  orderReturns: () => getCollection("order_returns"),
  coupons: () => getCollection("coupons"),
  couponRedemptions: () => getCollection("coupon_redemptions"),
  reviews: () => getCollection("reviews"),
  cart: () => getCollection("cart"),
  wishlist: () => getCollection("wishlist"),
  addresses: () => getCollection("addresses"),
  notifications: () => getCollection("notifications"),
  inventory: () => getCollection("inventory"),
  stockSubscriptions: () => getCollection("stock_subscriptions"),
  auditLogs: () => getCollection("audit_logs"),
  settings: () => getCollection("settings"),
  sales: () => getCollection("sales"),
};

export async function closeMongoDB() {
  if (client) {
    await client.close();
    db = null;
    client = null;
  }
}
