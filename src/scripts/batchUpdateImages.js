import "dotenv/config";
import crypto from "crypto";
import sharp from "sharp";
import { supabaseAdmin } from "../services/supabaseClient.js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
const CONCURRENT_LIMIT = 10;
const RATE_LIMIT_DELAY = 500;

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESSKEY;
const PEXELS_API_KEY = process.env.PEXEL_API;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSearchTerms(product) {
  const name = normalizeText(product.name || "");
  const desc = normalizeText(product.description || "");
  const category = normalizeText(product.categories?.name || "");
  const brand = normalizeText(product.brands?.name || "");
  const model = normalizeText(product.models?.name || "");
  const year = normalizeText(product.years?.label || "");

  const partPatterns = [
    { pattern: /\b(hood|bonnet|engine\s*cover)\b/i, type: "car hood" },
    { pattern: /\bdoor(s)?\b/i, type: "car door" },
    { pattern: /\b(bumper|fender\s*cover)\b/i, type: "car bumper" },
    { pattern: /\bfender(s)?\b/i, type: "car fender" },
    { pattern: /\b(headlight|head\s*light|head\s*lamp)\b/i, type: "headlight" },
    { pattern: /\b(taillight|tail\s*light|rear\s*light)\b/i, type: "taillight" },
    { pattern: /\b(grille|grill)\b/i, type: "car grille" },
    { pattern: /\b(mirror|side\s*mirror|wing\s*mirror)\b/i, type: "car mirror" },
    { pattern: /\b(gear\s*(level|shift|lever)|shift\s*knob)\b/i, type: "gear knob" },
    { pattern: /\b(wheel|rim|alloy\s*wheel)\b/i, type: "car wheel" },
    { pattern: /\b(brake\s*pads?)\b/i, type: "brake pads" },
    { pattern: /\b(brake\s*(disc|rotor))\b/i, type: "brake disc" },
    { pattern: /\b(brake\s*caliper)\b/i, type: "brake caliper" },
    { pattern: /\b(starter|starter\s*motor)\b/i, type: "car starter" },
    { pattern: /\b(alternator)\b/i, type: "car alternator" },
    { pattern: /\b(battery)\b/i, type: "car battery" },
    { pattern: /\b(spark\s*plug)\b/i, type: "spark plug" },
    { pattern: /\b(oil|air|cabin)\s*filter\b/i, type: "car filter" },
    { pattern: /\b(suspension|shock|strut)\b/i, type: "car suspension" },
    { pattern: /\b(radiator)\b/i, type: "car radiator" },
    { pattern: /\b(exhaust|muffler)\b/i, type: "car exhaust" },
    { pattern: /\b(windshield|window\s*glass)\b/i, type: "car window" },
    { pattern: /\b(fog\s*light)\b/i, type: "fog light" },
    { pattern: /\b(turn\s*signal|indicator)\b/i, type: "turn signal" },
    { pattern: /\b(tailgate|boot|trunk)\b/i, type: "car trunk" },
    { pattern: /\b(steering\s*wheel)\b/i, type: "steering wheel" },
    { pattern: /\b(control\s*arm|wishbone)\b/i, type: "control arm" },
    { pattern: /\b(ball\s*joint)\b/i, type: "ball joint" },
    { pattern: /\b(tie\s*rod)\b/i, type: "tie rod" },
    { pattern: /\b(water\s*pump)\b/i, type: "water pump" },
    { pattern: /\b(thermostat)\b/i, type: "thermostat" },
    { pattern: /\b(ignition\s*coil)\b/i, type: "ignition coil" },
    { pattern: /\b(sensor|crankshaft|cam\s*sensor)\b/i, type: "car sensor" },
    { pattern: /\b(cv\s*axle|half\s*shaft|driveshaft)\b/i, type: "cv axle" },
    { pattern: /\b(strut\s*mount|bearing)\b/i, type: "strut mount" },
    { pattern: /\b(catalytic\s*converter|cat\s*back)\b/i, type: "catalytic converter" },
    { pattern: /\b(radiator\s*fan|cooling\s*fan)\b/i, type: "radiator fan" },
    { pattern: /\b(power\s*steering\s*pump)\b/i, type: "power steering pump" },
    { pattern: /\b(ac\s*compressor|air\s*conditioning)\b/i, type: "ac compressor" },
    { pattern: /\b(wiper|windshield\s*wiper)\b/i, type: "car wiper" },
  ];

  let partType = "auto part";
  for (const { pattern, type } of partPatterns) {
    if (pattern.test(name) || pattern.test(desc) || pattern.test(category)) {
      partType = type;
      break;
    }
  }

  const queries = [];
  if (brand && model && year) {
    queries.push(`${brand} ${model} ${year} ${partType}`);
  }
  if (brand && model) {
    queries.push(`${brand} ${model} ${partType}`);
  }
  if (brand) {
    queries.push(`${brand} ${partType}`);
  }
  queries.push(partType);
  queries.push(`car ${partType}`);

  return {
    name,
    brand,
    model,
    year,
    partType,
    queries: [...new Set(queries)].filter(Boolean)
  };
}

async function searchUnsplash(query) {
  if (!UNSPLASH_ACCESS_KEY) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch {
    return null;
  }
}

async function searchPexels(query) {
  if (!PEXELS_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.photos?.[0]?.src?.large || null;
  } catch {
    return null;
  }
}

async function findImage(query) {
  let imageUrl = await searchUnsplash(query);
  if (imageUrl) return { url: imageUrl, source: "unsplash" };
  await sleep(RATE_LIMIT_DELAY);
  imageUrl = await searchPexels(query);
  if (imageUrl) return { url: imageUrl, source: "pexels" };
  return null;
}

async function downloadImage(url) {
  const res = await fetch(url, { headers: { "User-Agent": "SpeedwayApp/1.0" } });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) throw new Error("Not an image");
  return Buffer.from(await res.arrayBuffer());
}

async function uploadToSupabase(buffer) {
  const filename = `product-images/${crypto.randomUUID()}.jpg`;
  const processed = await sharp(buffer)
    .resize({ width: 1200, height: 800, fit: "cover", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filename, processed, { contentType: "image/jpeg", upsert: true });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl;
}

async function processProduct(product) {
  const info = extractSearchTerms(product);

  for (const query of info.queries) {
    const result = await findImage(query);
    if (result) {
      try {
        const buffer = await downloadImage(result.url);
        const uploadedUrl = await uploadToSupabase(buffer);
        return { success: true, url: uploadedUrl, source: result.source, query };
      } catch (err) {
        console.error(`  Download/upload error: ${err.message}`);
      }
    }
    await sleep(RATE_LIMIT_DELAY);
  }
  return { success: false };
}

async function processBatch(products, batchNum, totalBatches) {
  const semaphore = { count: 0, queue: [] };

  const runConcurrent = async (fn) => {
    while (semaphore.count >= CONCURRENT_LIMIT) {
      await new Promise(r => setTimeout(r, 100));
    }
    semaphore.count++;
    try {
      return await fn();
    } finally {
      semaphore.count--;
    }
  };

  const tasks = products.map((product, idx) =>
    runConcurrent(async () => {
      const globalIdx = (batchNum - 1) * 100 + idx + 1;
      console.log(`[${globalIdx}] Processing: ${product.name.substring(0, 50)}`);
      const result = await processProduct(product);
      if (result.success) {
        await supabaseAdmin.from("products").update({ image_url: result.url }).eq("id", product.id);
        console.log(`  ✓ Updated (${result.source}): ${result.url.substring(0, 50)}...`);
      } else {
        console.log(`  ✗ No image found`);
      }
      return result;
    })
  );

  return Promise.all(tasks);
}

async function fetchProducts(offset, limit) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(`id, name, description, image_url, categories(name), brands(name), models(name), years(label)`)
    .eq("is_deleted", false)
    .range(offset, offset + limit - 1);
  if (error) throw new Error(`Fetch failed: ${error.message}`);
  return data || [];
}

async function main() {
  console.log("=".repeat(60));
  console.log("BATCH PRODUCT IMAGE UPDATER (Pexels + Unsplash)");
  console.log("=".repeat(60));
  console.log(`\nAPI Keys:`);
  console.log(`  Unsplash: ${UNSPLASH_ACCESS_KEY ? "✓ Configured" : "✗ Not set"}`);
  console.log(`  Pexels: ${PEXELS_API_KEY ? "✓ Configured" : "✗ Not set"}`);

  const totalRes = await supabaseAdmin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_deleted", false);
  const totalProducts = totalRes.count || 0;
  console.log(`\nTotal products to process: ${totalProducts}`);
  console.log(`Concurrent requests: ${CONCURRENT_LIMIT}`);
  console.log();

  const results = { updated: 0, skipped: 0, failed: 0, bySource: {} };
  const BATCH_SIZE = 100;
  let offset = 0;
  let batchNum = 0;

  while (true) {
    const products = await fetchProducts(offset, BATCH_SIZE);
    if (!products.length) break;
    batchNum++;
    console.log(`\n--- Batch ${batchNum} (${products.length} products) ---`);

    const batchResults = await processBatch(products, batchNum, Math.ceil(totalProducts / BATCH_SIZE));

    for (const r of batchResults) {
      if (r.success) {
        results.updated++;
        results.bySource[r.source] = (results.bySource[r.source] || 0) + 1;
      } else {
        results.skipped++;
      }
    }

    console.log(`Batch ${batchNum} complete. Total: ${results.updated} updated, ${results.skipped} skipped`);
    offset += BATCH_SIZE;

    if (products.length < BATCH_SIZE) break;
  }

  console.log("\n" + "=".repeat(60));
  console.log("COMPLETE");
  console.log("=".repeat(60));
  console.log(`Updated: ${results.updated}`);
  console.log(`Skipped/No image: ${results.skipped}`);
  console.log("\nBy Source:");
  for (const [source, count] of Object.entries(results.bySource)) {
    console.log(`  ${source}: ${count}`);
  }
  console.log("=".repeat(60));
}

main().catch(err => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
