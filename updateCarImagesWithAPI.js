import "dotenv/config";
import { supabaseAdmin } from "./src/services/supabaseClient.js";

const API_KEY = "ci_57183011ae96155b960f23e3c5cb3d3362936649c9a231a634badfc2";

function getCarImageUrl(brandName, modelName, yearLabel) {
  const make = brandName.replace(/\s+$/, '').replace(/-\s*/g, ' ').trim();
  const model = modelName.replace(/\s+$/, '').replace(/  /g, ' ').replace(/-/g, ' ').trim();
  const year = parseInt(yearLabel) || 2020;

  const params = new URLSearchParams({
    api_key: API_KEY,
    make: make,
    model: model,
    year: year.toString()
  });

  return `https://carimagesapi.com/api/v1/signed-url?${params.toString()}`;
}

async function updateCarImages() {
  console.log('Fetching products...\n');

  const allProducts = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, brand_id, model_id, year_id, brands(name), models(name), years(label)')
      .eq('is_deleted', false)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching products:', error);
      break;
    }

    if (!data || data.length === 0) break;

    allProducts.push(...data);
    console.log(`Fetched ${allProducts.length} products...`);

    if (data.length < limit) break;
    offset += limit;
  }

  console.log(`\nTotal products: ${allProducts.length}\n`);

  const updates = allProducts.map(p => {
    const brandName = p.brands?.name || '';
    const modelName = p.models?.name || '';
    const yearLabel = p.years?.label || '';
    
    return {
      id: p.id,
      car_image_url: getCarImageUrl(brandName, modelName, yearLabel)
    };
  });

  console.log('Updating car images in batches...\n');

  const batchSize = 500;
  let totalUpdated = 0;

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    const ids = batch.map(u => u.id);
    const firstUrl = batch[0].car_image_url;

    const { error } = await supabaseAdmin
      .from('products')
      .update({ car_image_url: firstUrl })
      .in('id', ids)
      .eq('id', ids[0]);

    if (!error) totalUpdated += batch.length;

    console.log(`Batch ${batchNum}: Updated ${totalUpdated}/${updates.length}`);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`COMPLETED: Prepared ${totalUpdated} car image URLs`);
  console.log(`URLs are generated dynamically via CarImages API`);
  console.log(`${'='.repeat(50)}`);
}

updateCarImages().catch(console.error);
