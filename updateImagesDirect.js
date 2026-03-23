import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESSKEY;
const PEXELS_KEY = process.env.PEXEL_API;
const CONCURRENT = 20;
const DELAY = 200;

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

function getPartFromName(name) {
  const lower = name.toLowerCase();
  if (/\b(hood|bonnet)\b/.test(lower)) return "hood";
  if (/\bdoor(s)?\b/.test(lower)) return "car door";
  if (/\b(bumper)\b/.test(lower)) return "bumper";
  if (/\bfender(s)?\b/.test(lower)) return "fender";
  if (/\b(headlight)\b/.test(lower)) return "headlight";
  if (/\b(taillight)\b/.test(lower)) return "taillight";
  if (/\b(grille)\b/.test(lower)) return "grille";
  if (/\b(mirror)\b/.test(lower)) return "side mirror";
  if (/\b(gear\s*(level|shift|knob))\b/.test(lower)) return "gear knob";
  if (/\b(wheel|rim)\b/.test(lower)) return "wheel rim";
  if (/\b(brake)\b/.test(lower)) return "brake";
  if (/\b(battery)\b/.test(lower)) return "battery";
  if (/\b(spark|filter|alternator|starter)\b/.test(lower)) return "engine part";
  if (/\b(suspension|shock|strut)\b/.test(lower)) return "suspension";
  if (/\b(radiator|exhaust|muffler)\b/.test(lower)) return "radiator exhaust";
  if (/\b(windshield|window|glass)\b/.test(lower)) return "window glass";
  return "auto part";
}

function getQueries(product) {
  const name = normalizeText(product.name || "");
  const brand = normalizeText(product.brands?.name || "");
  const model = normalizeText(product.models?.name || "");
  const year = normalizeText(product.years?.label || "");
  const part = getPartFromName(name);

  const partQueries = [];
  const carQueries = [];

  if (brand && model) {
    partQueries.push(`${brand} ${model} ${part}`);
    carQueries.push(`${brand} ${model}`);
    carQueries.push(`${brand} ${model} ${year}`);
  } else if (brand) {
    partQueries.push(`${brand} ${part}`);
    carQueries.push(brand);
  }

  return { partQueries, carQueries };
}

async function searchUnsplash(query) {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch {
    return null;
  }
}

async function searchPexels(query) {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.photos?.[0]?.src?.large || null;
  } catch {
    return null;
  }
}

async function searchPixabay(query) {
  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=47873977-73ee0d5e22ccc0bc1f1e3efdb&q=${encodeURIComponent(query + " car")}&image_type=photo&per_page=3&safesearch=true`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.hits?.[0]?.largeImageURL || data.hits?.[0]?.webformatURL || null;
  } catch {
    return null;
  }
}

async function searchAll(query) {
  let url = await searchUnsplash(query);
  if (url) return { url, source: "unsplash", query };
  await sleep(DELAY);

  url = await searchPexels(query);
  if (url) return { url, source: "pexels", query };
  await sleep(DELAY);

  url = await searchPixabay(query);
  if (url) return { url, source: "pixabay", query };

  return null;
}

async function findImage(product) {
  const { partQueries, carQueries } = getQueries(product);

  for (const query of partQueries) {
    const result = await searchAll(query);
    if (result) return { ...result, type: "part" };
  }

  for (const query of carQueries) {
    const result = await searchAll(query);
    if (result) return { ...result, type: "car" };
  }

  const result = await searchAll("car automobile");
  if (result) return { ...result, type: "fallback" };

  return null;
}

async function processProduct(product, idx) {
  const result = await findImage(product);
  if (result) {
    await supabase.from("products").update({ image_url: result.url }).eq("id", product.id);
    const typeIcon = result.type === "part" ? "P" : result.type === "car" ? "C" : "F";
    console.log(`[${idx}] [${typeIcon}] ${product.name.substring(0, 35)} => "${result.query}"`);
    return result.type;
  }
  console.log(`[${idx}] [X] ${product.name.substring(0, 35)}`);
  return null;
}

async function runBatch(products, startIdx) {
  let semaphore = 0;
  const promises = [];

  for (let i = 0; i < products.length; i++) {
    while (semaphore >= CONCURRENT) {
      await new Promise(r => setTimeout(r, 50));
    }

    const idx = startIdx + i;
    const p = (async () => {
      semaphore++;
      try {
        return await processProduct(products[i], idx);
      } finally {
        semaphore--;
      }
    })();
    promises.push(p);
  }

  return Promise.all(promises);
}

async function updateProducts() {
  console.log("=".repeat(60));
  console.log("FAST FALLBACK IMAGE SEARCH (Part -> Car -> Pixabay)");
  console.log("=".repeat(60));
  console.log(`APIs: Unsplash ✓ | Pexels ✓ | Pixabay ✓\n`);

  const totalRes = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_deleted", false);
  const total = totalRes.count || 0;
  console.log(`Total: ${total}\n`);

  const results = { part: 0, car: 0, fallback: 0, failed: 0 };
  let offset = 0;
  let processed = 0;

  while (processed < total) {
    const { data: products } = await supabase
      .from("products")
      .select("id, name, brands(name), models(name), years(label)")
      .eq("is_deleted", false)
      .range(offset, offset + 999);

    if (!products?.length) break;

    const batchResults = await runBatch(products, processed + 1);
    
    for (const r of batchResults) {
      if (r === "part") results.part++;
      else if (r === "car") results.car++;
      else if (r === "fallback") results.fallback++;
      else results.failed++;
    }

    processed += products.length;
    console.log(`\nProgress: ${processed}/${total} | Parts: ${results.part} | Cars: ${results.car} | Web: ${results.fallback} | Failed: ${results.failed}\n`);
    offset += 1000;

    if (products.length < 1000) break;
  }

  console.log("=".repeat(60));
  console.log(`DONE: ${results.part} parts, ${results.car} cars, ${results.fallback} web, ${results.failed} failed`);
  console.log("=".repeat(60));
}

updateProducts().catch(console.error);
