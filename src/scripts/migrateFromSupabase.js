import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { MongoClient, ObjectId } from "mongodb";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function connectMongo() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client.db("speedway_anointed_ent");
}

function toObjectId(id) {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

async function migrateCollection(db, table, collection, transform = (x) => x) {
  console.log(`Migrating ${table} -> ${collection}...`);
  try {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      console.error(`  Error fetching ${table}:`, error.message);
      return 0;
    }
    
    if (!data || data.length === 0) {
      console.log(`  No data in ${table}`);
      return 0;
    }
    
    const documents = data.map((item) => {
      const doc = transform(item);
      if (doc._id && !doc._id instanceof ObjectId) {
        doc._id = toObjectId(doc._id);
      }
      return doc;
    });
    
    await db.collection(collection).deleteMany({});
    const result = await db.collection(collection).insertMany(documents);
    console.log(`  Migrated ${result.insertedCount} documents`);
    return result.insertedCount;
  } catch (err) {
    console.error(`  Error migrating ${table}:`, err.message);
    return 0;
  }
}

function transformUser(user) {
  return {
    _id: toObjectId(user.id),
    email: user.email,
    full_name: user.full_name,
    role: user.role || "customer",
    password_hash: user.password_hash,
    email_verified: user.email_verified || false,
    created_at: new Date(user.created_at),
    updated_at: new Date(user.updated_at || user.created_at)
  };
}

function transformCategory(cat) {
  return {
    _id: toObjectId(cat.id),
    name: cat.name,
    image_url: cat.image_url,
    show_by_brand: cat.show_by_brand !== undefined ? cat.show_by_brand : true,
    created_at: new Date(cat.created_at),
    updated_at: new Date(cat.updated_at || cat.created_at)
  };
}

function transformBrand(brand) {
  return {
    _id: toObjectId(brand.id),
    name: brand.name,
    logo_url: brand.logo_url,
    is_hidden: brand.is_hidden || false,
    created_at: new Date(brand.created_at),
    updated_at: new Date(brand.updated_at || brand.created_at)
  };
}

function transformModel(model) {
  return {
    _id: toObjectId(model.id),
    name: model.name,
    brand_id: toObjectId(model.brand_id),
    years: model.years || [],
    image_url: model.image_url,
    gallery: model.gallery || [],
    created_at: new Date(model.created_at),
    updated_at: new Date(model.updated_at || model.created_at)
  };
}

function transformYear(year) {
  return {
    _id: toObjectId(year.id),
    label: year.label,
    created_at: new Date(year.created_at)
  };
}

function transformProduct(product) {
  return {
    _id: toObjectId(product.id),
    name: product.name,
    category_id: product.category_id,
    brand_id: product.brand_id,
    model_id: product.model_id,
    year_id: product.year_id,
    price: Number(product.price),
    cost_price: product.cost_price ? Number(product.cost_price) : null,
    quantity: Number(product.quantity) || 0,
    description: product.description,
    image_url: product.image_url,
    gallery: product.gallery || [],
    status: product.status || "active",
    is_deleted: product.is_deleted || false,
    created_at: new Date(product.created_at),
    updated_at: new Date(product.updated_at || product.created_at)
  };
}

function transformOrder(order) {
  return {
    _id: toObjectId(order.id),
    user_id: order.user_id,
    total: Number(order.total),
    subtotal: Number(order.subtotal) || Number(order.total),
    discount_total: Number(order.discount_total) || 0,
    coupon_code: order.coupon_code,
    shipping_fee: Number(order.shipping_fee) || 0,
    delivery_address_id: order.delivery_address_id,
    status: order.status || "pending",
    estimated_delivery_date: order.estimated_delivery_date,
    created_at: new Date(order.created_at),
    updated_at: new Date(order.updated_at || order.created_at)
  };
}

async function migrate() {
  console.log("Starting migration from Supabase to MongoDB...\n");
  
  if (!SUPABASE_URL || !SUPABASE_KEY || !MONGODB_URI) {
    console.error("Missing required environment variables!");
    console.log("Need: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MONGODB_URI");
    process.exit(1);
  }
  
  let db;
  try {
    db = await connectMongo();
    console.log("Connected to MongoDB\n");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
  
  let totalMigrated = 0;
  
  totalMigrated += await migrateCollection(db, "users", "users", transformUser);
  totalMigrated += await migrateCollection(db, "categories", "categories", transformCategory);
  totalMigrated += await migrateCollection(db, "brands", "brands", transformBrand);
  totalMigrated += await migrateCollection(db, "models", "models", transformModel);
  totalMigrated += await migrateCollection(db, "years", "years", transformYear);
  totalMigrated += await migrateCollection(db, "products", "products", transformProduct);
  totalMigrated += await migrateCollection(db, "orders", "orders", transformOrder);
  
  await migrateCollection(db, "reviews", "reviews");
  await migrateCollection(db, "coupons", "coupons");
  await migrateCollection(db, "notifications", "notifications");
  await migrateCollection(db, "addresses", "addresses");
  await migrateCollection(db, "wishlists", "wishlist");
  await migrateCollection(db, "wishlist_items", "wishlist_items");
  await migrateCollection(db, "carts", "cart");
  await migrateCollection(db, "cart_items", "cart_items");
  await migrateCollection(db, "stock_subscriptions", "stock_subscriptions");
  await migrateCollection(db, "sales", "sales");
  await migrateCollection(db, "site_settings", "settings");
  await migrateCollection(db, "audit_logs", "audit_logs");
  await migrateCollection(db, "order_items", "order_items");
  await migrateCollection(db, "order_status_events", "order_status_events");
  await migrateCollection(db, "order_returns", "order_returns");
  await migrateCollection(db, "coupon_redemptions", "coupon_redemptions");
  await migrateCollection(db, "inventory", "inventory");
  
  console.log(`\nMigration complete! Total documents: ${totalMigrated}`);
  console.log("\nNext steps:");
  console.log("1. Run 'npm run setup:indexes' to create MongoDB indexes");
  console.log("2. Test the API to ensure everything works");
  console.log("3. Deploy the updated backend to Render");
  
  process.exit(0);
}

migrate().catch(console.error);
