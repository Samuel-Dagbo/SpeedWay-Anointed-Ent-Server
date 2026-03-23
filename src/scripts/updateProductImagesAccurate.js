import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const UNSPLASH_ACCESSKEY = process.env.UNSPLASH_ACCESSKEY;
const PEXEL_API = process.env.PEXEL_API;

const CATEGORY_MAP = {
  "Head Lights": "front headlight assembly",
  "Tail Lights": "rear tail light assembly",
  "Bumpers": "front bumper cover",
  "Doors": "front door shell",
  "Side Mirrors": "side mirror assembly",
  "Grilles": "front grille",
  "Fenders": "front fender panel",
  "Bonnet": "hood panel"
};

function cleanInput(str) {
  return str.trim().replace(/\s+/g, " ").replace(/- /g, "-").replace(/ - /g, " ");
}

function buildSearchQuery(brand, model, year, category) {
  const part = CATEGORY_MAP[category] || category.toLowerCase();
  return `${brand} ${model} ${year} ${part}`;
}

let unsplashRateLimited = false;
let pexelsRateLimited = false;

async function searchUnsplash(query) {
  if (unsplashRateLimited) return null;
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
    const response = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESSKEY}` }
    });
    if (!response.ok) {
      if (response.status === 429) unsplashRateLimited = true;
      return null;
    }
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular || data.results[0].urls.small;
    }
  } catch (e) {}
  return null;
}

async function searchPexels(query) {
  if (pexelsRateLimited) return null;
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5`;
    const response = await fetch(url, {
      headers: { Authorization: PEXEL_API }
    });
    if (!response.ok) {
      if (response.status === 429) pexelsRateLimited = true;
      return null;
    }
    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.large;
    }
  } catch (e) {}
  return null;
}

async function searchWebImage(query) {
  try {
    const url = `https://ddg-api.vercel.app/search?q=${encodeURIComponent(query + " car part image")}&format=json&max_results=10`;
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.results) {
      for (const r of data.results) {
        if (r.image) return r.image;
      }
    }
  } catch (e) {}
  return null;
}

async function findImage(brand, model, year, category) {
  const part = CATEGORY_MAP[category] || category.toLowerCase();
  const brandClean = cleanInput(brand);
  const modelClean = cleanInput(model);
  
  const queries = [
    `${brandClean} ${modelClean} ${year} ${part} OEM replacement`,
    `${brandClean} ${modelClean} ${year} ${part}`,
    `${brandClean} ${modelClean} ${part} replacement`,
    `${modelClean} ${year} ${part}`,
    `${brandClean} ${part}`
  ];
  
  for (const query of queries) {
    let imageUrl = await searchUnsplash(query);
    if (imageUrl) return { url: imageUrl, source: "unsplash", query };
    
    imageUrl = await searchPexels(query);
    if (imageUrl) return { url: imageUrl, source: "pexels", query };
    
    imageUrl = await searchWebImage(query);
    if (imageUrl) return { url: imageUrl, source: "web", query };
  }
  
  return { url: null, source: "not_found", query: queries[0] };
}

async function processProduct(p) {
  const brand = p.brands?.name || "";
  const model = p.models?.name || "";
  const year = p.years?.label || "";
  const category = p.categories?.name || "";
  
  if (!brand || !model || !year || !category) {
    return { id: p.id, success: false, reason: "missing_data" };
  }
  
  const result = await findImage(brand, model, year, category);
  
  if (result.url) {
    await supabase.from("products").update({ image_url: result.url }).eq("id", p.id);
    return { id: p.id, success: true, source: result.source, query: result.query };
  }
  
  return { id: p.id, success: false, reason: "no_image_found", query: result.query };
}

async function main() {
  console.log("Fetching all products...\n");
  
  let allProducts = [];
  let offset = 0;
  const limit = 1000;
  
  while (true) {
    const { data } = await supabase
      .from("products")
      .select("id, brands(name), models(name), years(label), categories(name)")
      .eq("is_deleted", false)
      .range(offset, offset + limit - 1);
    
    if (!data || data.length === 0) break;
    allProducts.push(...data);
    console.log(`Fetched ${allProducts.length}...`);
    if (data.length < limit) break;
    offset += limit;
  }
  
  console.log(`\nTotal products: ${allProducts.length}\n`);
  
  const batchSize = 15;
  let completed = 0;
  let failed = 0;
  let sources = { unsplash: 0, pexels: 0, web: 0 };
  
  for (let i = 0; i < allProducts.length; i += batchSize) {
    const batch = allProducts.slice(i, i + batchSize);
    
    const results = await Promise.all(batch.map(processProduct));
    
    results.forEach(r => {
      if (r.success) {
        completed++;
        if (r.source) sources[r.source] = (sources[r.source] || 0) + 1;
      } else {
        failed++;
      }
    });
    
    console.log(`[${i + batch.length}/${allProducts.length}] Updated: ${completed}, Failed: ${failed}`);
    
    if (i + batchSize < allProducts.length) {
      await new Promise(r => setTimeout(r, 800));
    }
  }
  
  console.log(`\n=== COMPLETED ===`);
  console.log(`Updated: ${completed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Sources:`, sources);
}

main().catch(console.error);
