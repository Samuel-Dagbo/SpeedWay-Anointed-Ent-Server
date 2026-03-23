import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function clean(s) {
  return (s || "").trim().replace(/\s+/g, " ").replace(/-/g, " ");
}

async function searchWikipediaImages(brand, model, year) {
  const query = `${year} ${brand} ${model} car`;
  
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=5`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.query?.search?.length > 0) {
      const title = data.query.search[0].title;
      
      const imgRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=800&format=json`
      );
      const imgData = await imgRes.json();
      
      const pages = imgData.query?.pages;
      if (pages) {
        for (const pageId in pages) {
          const page = pages[pageId];
          if (page.thumbnail?.source) {
            return page.thumbnail.source;
          }
        }
      }
    }
  } catch (e) {
    console.log('Wiki error:', e.message);
  }
  
  return null;
}

async function searchWikimediaDirect(brand, model, year) {
  const filename = `${year}_${brand}_${model}`.replace(/\s+/g, "_");
  const query = `${year} ${brand} ${model}`;
  
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json&srlimit=10`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    if (data.query?.search?.length > 0) {
      for (const result of data.query.search) {
        const title = result.title.replace("File:", "");
        const imgQuery = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(title)}&prop=url&format=json`;
        
        const imgRes = await fetch(imgQuery);
        const imgData = await imgRes.json();
        
        const pages = imgData.query?.pages;
        if (pages) {
          for (const pageId in pages) {
            const page = pages[pageId];
            if (page.original?.url) {
              return page.original.url;
            }
          }
        }
      }
    }
  } catch (e) {
    console.log('Wikimedia error:', e.message);
  }
  
  return null;
}

async function findCarImage(brand, model, year) {
  const b = clean(brand);
  const m = clean(model);
  
  let img = await searchWikipediaImages(b, m, year);
  if (img) return { url: img, source: 'wikipedia' };
  
  img = await searchWikimediaDirect(b, m, year);
  if (img) return { url: img, source: 'wikimedia' };
  
  return null;
}

async function main() {
  console.log("Fetching products...");
  let all = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase.from("products")
      .select("id, brands(name), models(name), years(label)")
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
    
    if (!brand || !model || !year) {
      failed++;
      continue;
    }
    
    const result = await findCarImage(brand, model, year);
    
    if (result) {
      await supabase.from("products").update({ car_image_url: result.url }).eq("id", p.id);
      updated++;
      sources[result.source] = (sources[result.source] || 0) + 1;
      console.log(`[${i+1}/${all.length}] ${brand} ${model} ${year}: ${result.source}`);
    } else {
      failed++;
    }
    
    if ((i + 1) % 30 === 0) {
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
