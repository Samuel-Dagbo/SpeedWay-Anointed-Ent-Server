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
  "Bonnet": "hood",
  "Gear Lever": "gear shifter"
};

function clean(s) {
  return (s || "").trim().replace(/\s+/g, " ").replace(/-/g, " ");
}

async function searchEcommerce(brand, model, year, category) {
  const part = CATEGORY_MAP[category] || category;
  const b = clean(brand);
  const m = clean(model);
  
  const queries = [
    `${b} ${m} ${year} ${part}`,
    `${b} ${m} ${part} oem`
  ];
  
  for (const query of queries) {
    try {
      const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_ipg=25`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const html = await res.text();
      
      const matches = html.match(/https:\/\/i\.ebayimg\.com\/images\/g\/[a-zA-Z0-9]+\/s-l[3-9]\d{2}\.jpg/g);
      if (matches && matches.length > 0) {
        const img = matches[0];
        if (img.includes('s-l')) {
          return { url: img, source: 'ebay' };
        }
      }
    } catch (e) {
      continue;
    }
  }
  
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
  
  let updated = 0;
  let failed = 0;
  let sources = {};
  
  for (let i = 0; i < all.length; i++) {
    const p = all[i];
    const brand = p.brands?.name || "";
    const model = p.models?.name || "";
    const year = p.years?.label || "";
    const category = p.categories?.name || "";
    
    if (!brand || !model || !year || !category) {
      failed++;
      continue;
    }
    
    const result = await searchEcommerce(brand, model, year, category);
    
    if (result) {
      await supabase.from("products").update({ image_url: result.url }).eq("id", p.id);
      updated++;
      sources[result.source] = (sources[result.source] || 0) + 1;
      console.log(`[${i+1}/${all.length}] Updated: ${brand} ${model} ${year} ${category}`);
    } else {
      failed++;
    }
    
    if ((i + 1) % 50 === 0) {
      console.log(`\nProgress: ${updated} updated, ${failed} failed\n`);
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  console.log(`\n=== COMPLETE ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Sources:`, sources);
}

main().catch(console.error);
