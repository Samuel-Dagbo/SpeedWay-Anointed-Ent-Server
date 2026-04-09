import "dotenv/config";
import fs from "fs";
import path from "path";
import { MongoClient, ObjectId } from "mongodb";
import { parse } from "csv-parse/sync";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in environment variables");
  process.exit(1);
}

function toObjectId(id) {
  if (!id || id === "" || id === "null" || id === "undefined") return null;
  if (id.length === 36 && id.includes("-")) {
    try {
      return new ObjectId(id);
    } catch {
      return null;
    }
  }
  return null;
}

function parseCSVValue(value) {
  if (value === "" || value === "null" || value === "undefined") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (!isNaN(value) && value.trim() !== "") return Number(value);
  return value;
}

function parseDate(value) {
  if (!value || value === "null" || value === "") return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

const tableMappings = {
  "users_rows": { collection: "users", idField: "id" },
  "categories_rows": { collection: "categories", idField: "id" },
  "brands_rows": { collection: "brands", idField: "id" },
  "models_rows": { collection: "models", idField: "id" },
  "years_rows": { collection: "years", idField: "id" },
  "products_rows": { collection: "products", idField: "id" }
};

async function importCSV(csvPath, collectionName, idField = "_id") {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("speedway_anointed_ent");
    const collection = db.collection(collectionName);
    
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`\nImporting ${collectionName}: ${records.length} records...`);
    
    if (records.length === 0) {
      console.log(`  No records to import`);
      return 0;
    }
    
    const documents = records.map((record) => {
      const doc = {};
      
      for (const [key, value] of Object.entries(record)) {
        if (value === undefined || value === "") {
          doc[key] = null;
          continue;
        }
        
        if (key === idField) {
          doc._id = toObjectId(value);
          if (!doc._id) {
            doc._id = value;
          }
        } else if (key === "gallery" || key === "years") {
          try {
            doc[key] = JSON.parse(value);
          } catch {
            doc[key] = value;
          }
        } else if (key.includes("_at") || key === "created_at" || key === "updated_at" || key === "deleted_at") {
          doc[key] = parseDate(value);
        } else if (key === "email_verified" || key === "is_hidden" || key === "show_by_brand" || key === "is_default" || key === "active" || key === "is_deleted") {
          doc[key] = value === "true";
        } else if (key === "price" || key === "cost_price" || key === "quantity" || key === "total" || key === "subtotal" || key === "discount_total" || key === "shipping_fee" || key === "value" || key === "min_order" || key === "max_discount" || key === "usage_limit" || key === "per_user_limit" || key === "rating") {
          const num = parseFloat(value);
          doc[key] = isNaN(num) ? value : num;
        } else if (key.endsWith("_id") || key === "user_id" || key === "product_id" || key === "category_id" || key === "brand_id" || key === "model_id" || key === "year_id" || key === "cart_id" || key === "wishlist_id" || key === "order_id" || key === "coupon_id" || key === "actor_id" || key === "reference_id") {
          const oid = toObjectId(value);
          doc[key] = oid || value;
        } else {
          doc[key] = value;
        }
      }
      
      return doc;
    });
    
    await collection.deleteMany({});
    const result = await collection.insertMany(documents);
    console.log(`  Imported ${result.insertedCount} records`);
    return result.insertedCount;
    
  } finally {
    await client.close();
  }
}

async function main() {
  const csvDir = process.argv[2] || "./csv";
  
  console.log(`\nMongoDB CSV Import Tool`);
  console.log(`======================`);
  console.log(`Reading CSVs from: ${path.resolve(csvDir)}`);
  
  let totalImported = 0;
  
  for (const [filename, config] of Object.entries(tableMappings)) {
    const csvPath = path.join(csvDir, `${filename}.csv`);
    if (fs.existsSync(csvPath)) {
      const count = await importCSV(csvPath, config.collection, config.idField);
      totalImported += count;
    } else {
      console.log(`\nSkipping ${filename} (file not found: ${csvPath})`);
    }
  }
  
  console.log(`\n======================`);
  console.log(`Total imported: ${totalImported} records`);
  console.log(`\nDone!`);
  
  console.log(`\nNote: To import additional tables, export them from Supabase and add them to the tableMappings object in this script.`);
}

main().catch(console.error);
