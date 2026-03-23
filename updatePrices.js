import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Realistic Ghana Cedis prices for car parts
const BASE_PRICES = {
  'bonnet': { min: 800, max: 3500 },
  'door': { min: 1200, max: 5000 },
  'doors': { min: 1200, max: 5000 },
  'bumper': { min: 600, max: 3000 },
  'bumpers': { min: 600, max: 3000 },
  'fender': { min: 500, max: 2500 },
  'fenders': { min: 500, max: 2500 },
  'headlight': { min: 350, max: 1800 },
  'headlights': { min: 350, max: 1800 },
  'head light': { min: 350, max: 1800 },
  'head lights': { min: 350, max: 1800 },
  'taillight': { min: 300, max: 1500 },
  'taillights': { min: 300, max: 1500 },
  'tail light': { min: 300, max: 1500 },
  'tail lights': { min: 300, max: 1500 },
  'mirror': { min: 200, max: 900 },
  'mirrors': { min: 200, max: 900 },
  'side mirror': { min: 200, max: 900 },
  'side mirrors': { min: 200, max: 900 },
  'grille': { min: 400, max: 2500 },
  'grilles': { min: 400, max: 2500 },
  'gear': { min: 300, max: 1200 },
  'gear level': { min: 300, max: 1200 },
  'gear levels': { min: 300, max: 1200 },
};

function getPartType(name) {
  const lower = name.toLowerCase();
  for (const key of Object.keys(BASE_PRICES)) {
    if (lower.includes(key)) return key;
  }
  return null;
}

function generatePrice(name) {
  const partType = getPartType(name);
  let min = 300, max = 1500;
  
  if (partType && BASE_PRICES[partType]) {
    min = BASE_PRICES[partType].min;
    max = BASE_PRICES[partType].max;
  }
  
  const variance = Math.abs(name.length - 30) * 10;
  const basePrice = Math.floor(Math.random() * (max - min)) + min + variance;
  return Math.round(basePrice / 50) * 50;
}

(async () => {
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .eq('is_deleted', false);
  
  console.log(`Updating prices for ${products.length} products...`);
  
  // Process in batches of 100
  const BATCH_SIZE = 100;
  let totalUpdated = 0;
  
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    
    const updates = batch.map(p => ({
      id: p.id,
      price: generatePrice(p.name),
      cost_price: Math.round(generatePrice(p.name) * 0.6)
    }));
    
    // Use batch update
    for (const update of updates) {
      await supabase
        .from('products')
        .update({ 
          price: update.price,
          cost_price: update.cost_price
        })
        .eq('id', update.id);
    }
    
    totalUpdated += batch.length;
    console.log(`Updated ${totalUpdated}/${products.length} products`);
  }
  
  console.log('\nDone! Showing sample prices:');
  
  const { data: samples } = await supabase
    .from('products')
    .select('name, price')
    .limit(8);
  
  samples.forEach(p => {
    console.log(`- ${p.name.substring(0, 45).padEnd(47)} GHS ${p.price}`);
  });
})();
