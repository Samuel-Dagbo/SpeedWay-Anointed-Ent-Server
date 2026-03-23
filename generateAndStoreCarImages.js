import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const API_KEY = "ci_57183011ae96155b960f23e3c5cb3d3362936649c9a231a634badfc2";

async function getSignedUrl(make, model, year) {
  const url = `https://carimagesapi.com/api/v1/signed-url?api_key=${API_KEY}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.url || null;
  } catch {
    return null;
  }
}

async function processBatch(products, startIdx) {
  const results = await Promise.all(
    products.map(async (p, i) => {
      const brandName = (p.brands?.name || "").trim().replace(/\s+/g, " ");
      const modelName = (p.models?.name || "").trim().replace(/\s+/g, " ");
      const yearLabel = (p.years?.label || "2020").trim();
      
      const imageUrl = await getSignedUrl(brandName, modelName, yearLabel);
      
      if (imageUrl) {
        await supabase.from("products").update({ car_image_url: imageUrl }).eq("id", p.id);
      }
      
      return { idx: startIdx + i + 1, brandName, modelName, success: !!imageUrl };
    })
  );
  return results;
}

async function updateCarImages() {
  console.log("Fetching products...\n");

  let allProducts = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data } = await supabase
      .from("products")
      .select("id, brands(name), models(name), years(label)")
      .eq("is_deleted", false)
      .range(offset, offset + limit - 1);

    if (!data || data.length === 0) break;
    allProducts.push(...data);
    console.log(`Fetched ${allProducts.length}...`);
    if (data.length < limit) break;
    offset += limit;
  }

  console.log(`\nTotal: ${allProducts.length}\n`);
  
  const batchSize = 200;
  let completed = 0;
  let failed = 0;

  for (let i = 0; i < allProducts.length; i += batchSize) {
    const batch = allProducts.slice(i, i + batchSize);
    const results = await processBatch(batch, i);
    
    const batchSuccess = results.filter(r => r.success).length;
    const batchFailed = results.filter(r => !r.success).length;
    completed += batchSuccess;
    failed += batchFailed;

    console.log(`[${i + batch.length}/${allProducts.length}] Updated: ${completed}, Failed: ${failed}`);
    
    if (i + batchSize < allProducts.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`\nCOMPLETED: ${completed} updated, ${failed} failed`);
}

updateCarImages().catch(console.error);
