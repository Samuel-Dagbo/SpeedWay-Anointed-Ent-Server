import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CATEGORY_MAP = {
  "Head Lights": "headlight assembly",
  "Tail Lights": "taillight assembly",
  "Bumpers": "bumper cover",
  "Doors": "door panel",
  "Side Mirrors": "side mirror",
  "Grilles": "grille",
  "Fenders": "fender panel",
  "Bonnet": "hood"
};

function clean(s) {
  return (s || "").trim().replace(/\s+/g, " ").replace(/-/g, " ");
}

async function searchAutoZone(brand, model, year, category) {
  const part = CATEGORY_MAP[category] || category;
  const query = `${year} ${brand} ${model} ${part}`;
  
  try {
    const url = `https://www.autozone.com/collision-body-parts-and-hardware/${part.replace(" ", "-")}/${brand.toLowerCase()}/${model.toLowerCase()}/${year}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await res.text();
    
    const imgMatch = html.match(/\"(https:\/\/www\.autozone\.com\/images\/products\/[^\"]+\.(jpg|png)[^\"]*)\"/);
    if (imgMatch && imgMatch[1]) return imgMatch[1];
    
    const imgMatches = html.match(/https:\/\/www\.autozone\.com\/[^\"'>\s]+\.(jpg|png)/g);
    if (imgMatches && imgMatches.length > 0) {
      const valid = imgMatches.find(m => m.includes('product') || m.includes('sku'));
      return valid || imgMatches[0];
    }
  } catch (e) {
    console.log('AutoZone error:', e.message);
  }
  return null;
}

async function searchPartsMallGh(brand, model, category) {
  const part = CATEGORY_MAP[category] || category;
  const query = `${brand} ${model} ${part}`;
  
  try {
    const url = `https://www.partsmallgh.com/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await res.text();
    
    const imgMatch = html.match(/https:\/\/partsmallgh\.com\/[^\"'>\s]+\.(jpg|png)/g);
    if (imgMatch && imgMatch.length > 0) {
      return imgMatch[0];
    }
  } catch (e) {
    console.log('PartsMall error:', e.message);
  }
  return null;
}

async function searchRockAuto(brand, model, year, category) {
  const part = CATEGORY_MAP[category] || category;
  const query = `${year} ${brand} ${model} ${part}`;
  
  try {
    const url = `https://www.rockauto.com/en/search?searchtext=${encodeURIComponent(query)}&searchtype=full`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await res.text();
    
    const imgMatch = html.match(/https:\/\/media\.rockauto\.com\/[^\"'>\s]+\.(jpg|png)/g);
    if (imgMatch && imgMatch.length > 0) {
      return imgMatch[0];
    }
  } catch (e) {
    console.log('RockAuto error:', e.message);
  }
  return null;
}

async function findImage(brand, model, year, category) {
  const b = clean(brand);
  const m = clean(model);
  
  let img = await searchAutoZone(b, m, year, category);
  if (img) return { url: img, source: 'autozone' };
  
  img = await searchPartsMallGh(b, m, category);
  if (img) return { url: img, source: 'partsmallgh' };
  
  img = await searchRockAuto(b, m, year, category);
  if (img) return { url: img, source: 'rockauto' };
  
  return null;
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
  
  let done = 0, fail = 0, sources = {};
  
  for (let i = 0; i < all.length; i++) {
    const p = all[i];
    const brand = p.brands?.name || "";
    const model = p.models?.name || "";
    const year = p.years?.label || "";
    const category = p.categories?.name || "";
    
    if (!brand || !model || !year || !category) {
      fail++;
      continue;
    }
    
    const result = await findImage(brand, model, year, category);
    if (result) {
      await supabase.from("products").update({ image_url: result.url }).eq("id", p.id);
      done++;
      sources[result.source] = (sources[result.source] || 0) + 1;
      console.log(`[${i+1}/${all.length}] ${brand} ${model} ${year} ${category}: ${result.source}`);
    } else {
      fail++;
    }
    
    if ((i + 1) % 30 === 0) {
      console.log(`\nProgress: ${done}/${all.length} updated, ${fail} failed\n`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  console.log(`\n=== COMPLETE ===\nUpdated: ${done}\nFailed: ${fail}\nSources:`, sources);
}

main().catch(console.error);
