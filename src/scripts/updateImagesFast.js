import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CATEGORY_MAP = {
  "Head Lights": "headlight", "Tail Lights": "taillight",
  "Bumpers": "bumper", "Doors": "door",
  "Side Mirrors": "mirror", "Grilles": "grille",
  "Fenders": "fender", "Bonnet": "hood"
};

function clean(s) {
  return (s || "").trim().replace(/\s+/g, " ").replace(/- /g, "-");
}

async function searchGoogleImages(query) {
  try {
    const res = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(query)}&tbm=isch&num=5&api_key=demo`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.images_results?.[0]?.original || data.images_results?.[0]?.thumbnail;
  } catch { return null; }
}

async function searchDuckDuckGo(query) {
  try {
    const res = await fetch(`https://ddg-api.vercel.app/search?q=${encodeURIComponent(query)}&max_results=3&format=json`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.image || null;
  } catch { return null; }
}

async function searchBingImages(query) {
  try {
    const res = await fetch(`https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(query)}&count=3`, 
      { headers: { "Ocp-Apim-Subscription-Key": "demo" } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.value?.[0]?.contentUrl || data.value?.[0]?.thumbnailUrl;
  } catch { return null; }
}

async function findImage(brand, model, year, category) {
  const part = CATEGORY_MAP[category] || category;
  const b = clean(brand), m = clean(model);
  const queries = [
    `${b} ${m} ${year} ${part} OEM`,
    `${b} ${m} ${part} replacement`,
    `${b} ${part} ${year}`
  ];
  
  for (const q of queries) {
    let img = await searchDuckDuckGo(q);
    if (img) return img;
    img = await searchGoogleImages(q);
    if (img) return img;
  }
  return null;
}

async function processBatch(batch) {
  const results = await Promise.all(batch.map(async p => {
    const brand = p.brands?.name || "";
    const model = p.models?.name || "";
    const year = p.years?.label || "";
    const category = p.categories?.name || "";
    
    if (!brand || !model || !year || !category) return { id: p.id, success: false };
    
    const url = await findImage(brand, model, year, category);
    if (url) {
      await supabase.from("products").update({ image_url: url }).eq("id", p.id);
      return { id: p.id, success: true };
    }
    return { id: p.id, success: false };
  }));
  return results;
}

async function main() {
  console.log("Fetching products...");
  let all = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase.from("products")
      .select("id, brands(name), models(name), years(label), categories(name)")
      .eq("is_deleted", false).range(offset, offset + 999);
    if (!data || !data.length) break;
    all.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log(`Total: ${all.length}\n`);
  
  let done = 0, fail = 0;
  const batchSize = 50;
  
  for (let i = 0; i < all.length; i += batchSize) {
    const batch = all.slice(i, i + batchSize);
    const results = await processBatch(batch);
    
    done += results.filter(r => r.success).length;
    fail += results.filter(r => !r.success).length;
    
    console.log(`[${Math.min(i + batchSize, all.length)}/${all.length}] Updated: ${done}, Failed: ${fail}`);
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n=== COMPLETE ===\nUpdated: ${done}\nFailed: ${fail}`);
}

main().catch(console.error);
