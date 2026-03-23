import "dotenv/config";
import crypto from "crypto";
import sharp from "sharp";
import { supabaseAdmin } from "../services/supabaseClient.js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
const FETCH_BATCH = 100;
const UPDATE_BATCH = 50;
const SEARCH_DELAY = 300;

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

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

function extractProductInfo(product) {
  const name = normalizeText(product.name || "");
  const desc = normalizeText(product.description || "");
  const category = normalizeText(product.categories?.name || "");
  const brand = normalizeText(product.brands?.name || "");
  const model = normalizeText(product.models?.name || "");
  const year = normalizeText(product.years?.label || "");
  
  const partPatterns = [
    { pattern: /\b(hood|bonnet|engine\s*cover|engine\s*hood)\b/i, type: "bonnet hood" },
    { pattern: /\bdoor(s)?\b/i, type: "car door" },
    { pattern: /\b(bumper|fender\s*cover)\b/i, type: "car bumper" },
    { pattern: /\bfender(s)?\b/i, type: "car fender" },
    { pattern: /\b(headlight|head\s*light|head\s*lamp)\b/i, type: "headlight" },
    { pattern: /\b(taillight|tail\s*light|rear\s*light|tail\s*lamp)\b/i, type: "taillight" },
    { pattern: /\b(grille|grill)\b/i, type: "car grille" },
    { pattern: /\b(mirror|side\s*mirror|wing\s*mirror|door\s*mirror)\b/i, type: "side mirror" },
    { pattern: /\b(gear\s*level|gear\s*shift|gear\s*lever|shift\s*knob|gear\s*knob)\b/i, type: "gear knob" },
    { pattern: /\b(wheel|rim|alloy\s*wheel|steel\s*wheel)\b/i, type: "car wheel" },
    { pattern: /\b(brake\s*pads?)\b/i, type: "brake pads" },
    { pattern: /\b(brake\s*disc|brake\s*rotor|rotor)\b/i, type: "brake disc" },
    { pattern: /\b(brake\s*caliper|caliper)\b/i, type: "brake caliper" },
    { pattern: /\b(starter|starter\s*motor)\b/i, type: "starter motor" },
    { pattern: /\b(alternator)\b/i, type: "alternator" },
    { pattern: /\b(battery|car\s*battery)\b/i, type: "car battery" },
    { pattern: /\b(spark\s*plug)\b/i, type: "spark plug" },
    { pattern: /\b(oil\s*filter)\b/i, type: "oil filter" },
    { pattern: /\b(air\s*filter)\b/i, type: "air filter" },
    { pattern: /\b(cabin\s*filter)\b/i, type: "cabin filter" },
    { pattern: /\b(suspension|shock|shock\s*absorber|strut)\b/i, type: "suspension" },
    { pattern: /\b(radiator|car\s*radiator)\b/i, type: "radiator" },
    { pattern: /\b(exhaust|muffler|catalytic)\b/i, type: "exhaust" },
    { pattern: /\b(windshield|window\s*glass|glass)\b/i, type: "window glass" },
    { pattern: /\b(fog\s*light|fog\s*lamp)\b/i, type: "fog light" },
    { pattern: /\b(turn\s*signal|indicator|turn\s*lamp)\b/i, type: "turn signal" },
    { pattern: /\b(radiator\s*grille|radiator\s*grill)\b/i, type: "radiator grille" },
    { pattern: /\b(tailgate|boot|trunk)\b/i, type: "tailgate" },
    { pattern: /\b(fender\s*liner|fender\s*lining)\b/i, type: "fender liner" },
    { pattern: /\b(chassis|subframe|crossmember)\b/i, type: "chassis" },
    { pattern: /\b(steering|steering\s*wheel|tie\s*rod)\b/i, type: "steering" },
    { pattern: /\b(control\s*arm|wishbone|lower\s*arm)\b/i, type: "control arm" },
    { pattern: /\b(ball\s*joint)\b/i, type: "ball joint" },
    { pattern: /\b(tie\s*rod\s*end|tie\s*rod)\b/i, type: "tie rod" },
    { pattern: /\b(water\s*pump)\b/i, type: "water pump" },
    { pattern: /\b(thermostat)\b/i, type: "thermostat" },
    { pattern: /\b(ignition\s*coil|coil\s*pack)\b/i, type: "ignition coil" },
    { pattern: /\b(crankshaft\s*position\s*sensor|cam\s*sensor)\b/i, type: "sensor" },
  ];
  
  let partType = "auto part";
  for (const { pattern, type } of partPatterns) {
    if (pattern.test(name) || pattern.test(desc) || pattern.test(category)) {
      partType = type;
      break;
    }
  }
  
  const searchQueries = [];
  
  if (brand && model && year) {
    searchQueries.push(`${brand} ${model} ${year} ${partType}`);
    searchQueries.push(`${brand} ${model} ${partType}`);
  }
  
  if (brand && model) {
    searchQueries.push(`${brand} ${model} ${partType}`);
  }
  
  if (brand) {
    searchQueries.push(`${brand} ${partType}`);
  }
  
  searchQueries.push(partType);
  searchQueries.push(`car ${partType}`);
  
  return {
    name,
    brand,
    model,
    year,
    partType,
    queries: [...new Set(searchQueries)].filter(Boolean)
  };
}

async function searchUnsplash(query) {
  if (!UNSPLASH_ACCESS_KEY) return null;
  
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
    });
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
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: PEXELS_API_KEY }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.photos?.[0]?.src?.large || null;
  } catch {
    return null;
  }
}

async function searchPixabay(query) {
  const apiKey = process.env.PIXABAY_API_KEY;
  
  try {
    let url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&per_page=5&safesearch=true`;
    
    if (!apiKey) {
      const res = await fetch(`https://pixabay.com/api/?key=47873977-73ee0d5e22ccc0bc1f1e3efdb&q=${encodeURIComponent(query)}&image_type=photo&per_page=3`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.hits?.[0]?.largeImageURL || data.hits?.[0]?.webformatURL || null;
    }
    
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.hits?.[0]?.largeImageURL || data.hits?.[0]?.webformatURL || null;
  } catch {
    return null;
  }
}

async function searchWikimediaCommons(query) {
  try {
    const searchRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + " vehicle")}&format=json&origin=*&srlimit=5`
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    
    for (const result of searchData.query?.search || []) {
      const pageId = result.pageid;
      const imgRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&prop=pageimages&format=json&pithumbsize=1200&pageids=${pageId}&origin=*`
      );
      if (!imgRes.ok) continue;
      const imgData = await imgRes.json();
      const pages = imgData.query?.pages || {};
      const page = Object.values(pages)[0];
      if (page?.thumbnail?.source) return page.thumbnail.source;
    }
    return null;
  } catch {
    return null;
  }
}

async function findImageForProduct(product) {
  const info = extractProductInfo(product);
  
  console.log(`  Brand: ${info.brand || "N/A"}, Model: ${info.model || "N/A"}, Part: ${info.partType}`);
  console.log(`  Searching ${info.queries.length} queries...`);
  
  for (const query of info.queries) {
    console.log(`    Trying: "${query}"`);
    
    let imageUrl = await searchUnsplash(query);
    if (imageUrl) {
      console.log(`    Found (Unsplash)`);
      return { url: imageUrl, source: "unsplash", query };
    }
    await sleep(SEARCH_DELAY);
    
    imageUrl = await searchPexels(query);
    if (imageUrl) {
      console.log(`    Found (Pexels)`);
      return { url: imageUrl, source: "pexels", query };
    }
    await sleep(SEARCH_DELAY);
    
    imageUrl = await searchPixabay(query);
    if (imageUrl) {
      console.log(`    Found (Pixabay)`);
      return { url: imageUrl, source: "pixabay", query };
    }
    await sleep(SEARCH_DELAY);
    
    imageUrl = await searchWikimediaCommons(query);
    if (imageUrl) {
      console.log(`    Found (Wikimedia)`);
      return { url: imageUrl, source: "wikimedia", query };
    }
    await sleep(SEARCH_DELAY);
  }
  
  return null;
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "SpeedwayApp/1.0" }
  });
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
  
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

async function fetchProducts(offset = 0) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(`id, name, description, image_url, categories(name), brands(name), models(name), years(label)`)
    .eq("is_deleted", false)
    .range(offset, offset + FETCH_BATCH - 1)
    .order("id");
  
  if (error) throw new Error(`Fetch failed: ${error.message}`);
  return data || [];
}

async function updateProduct(id, imageUrl) {
  const { error } = await supabaseAdmin
    .from("products")
    .update({ image_url: imageUrl })
    .eq("id", id);
  
  if (error) throw new Error(`Update failed: ${error.message}`);
}

async function main() {
  console.log("=".repeat(60));
  console.log("PRODUCT IMAGE UPDATE - Brand/Model Specific Search");
  console.log("=".repeat(60));
  console.log(`\nAPI Keys:`);
  console.log(`  Unsplash: ${UNSPLASH_ACCESS_KEY ? "Configured" : "Not set"}`);
  console.log(`  Pexels: ${PEXELS_API_KEY ? "Configured" : "Not set"}`);
  console.log(`  Pixabay: ${process.env.PIXABAY_API_KEY ? "Configured" : "Using demo key"}`);
  console.log();
  
  const totalRes = await supabaseAdmin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_deleted", false);
  
  const totalProducts = totalRes.count || 0;
  console.log(`Total products to process: ${totalProducts}\n`);
  
  const results = {
    updated: 0,
    skipped: 0,
    failed: 0,
    bySource: {}
  };
  
  let offset = 0;
  let processed = 0;
  
  while (true) {
    const products = await fetchProducts(offset);
    if (!products.length) break;
    
    for (const product of products) {
      processed++;
      console.log(`\n[${processed}/${totalProducts}] ${product.name}`);
      
      const info = extractProductInfo(product);
      const productKey = `${info.brand}-${info.model}-${info.partType}`.toLowerCase();
      
      try {
        const imageResult = await findImageForProduct(product);
        
        if (imageResult?.url) {
          console.log(`  Downloading...`);
          const buffer = await downloadImage(imageResult.url);
          console.log(`  Uploading...`);
          const uploadedUrl = await uploadToSupabase(buffer);
          await updateProduct(product.id, uploadedUrl);
          
          results.updated++;
          results.bySource[imageResult.source] = (results.bySource[imageResult.source] || 0) + 1;
          console.log(`  SUCCESS: ${imageResult.source} - ${uploadedUrl.substring(0, 60)}...`);
        } else {
          console.log(`  No image found`);
          results.skipped++;
        }
      } catch (err) {
        console.error(`  ERROR: ${err.message}`);
        results.failed++;
      }
      
      await sleep(SEARCH_DELAY);
    }
    
    if (products.length < FETCH_BATCH) break;
    offset += FETCH_BATCH;
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("UPDATE COMPLETE");
  console.log("=".repeat(60));
  console.log(`Updated: ${results.updated}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Failed: ${results.failed}`);
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
