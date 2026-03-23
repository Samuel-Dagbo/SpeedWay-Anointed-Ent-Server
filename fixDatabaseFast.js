import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL || `postgresql://postgres:${process.env.SUPABASE_SERVICE_ROLE_KEY}@${process.env.SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '')}:5432/postgres`,
  ssl: { rejectUnauthorized: false }
});

// Actually, let's use the Supabase REST API instead - it's more reliable
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateProducts() {
  console.log('Fetching all products...');
  
  // Fetch all products with pagination
  let allProducts = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .eq('is_deleted', false)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    if (!data || data.length === 0) break;
    allProducts = [...allProducts, ...data];
    page++;
    if (data.length < pageSize) break;
  }
  
  console.log(`Total products: ${allProducts.length}`);
  
  // Generate all updates first
  console.log('Generating updates...');
  
  const updates = allProducts.map(p => {
    const name = p.name.toLowerCase();
    let price, cost_price, image_url, car_image_url;
    
    // Price logic
    if (name.includes('spark plug') || name.includes('ignition plug')) {
      price = Math.round((30 + Math.random() * 90) / 10) * 10;
    } else if (name.includes('air filter') || name.includes('cabin filter')) {
      price = Math.round((35 + Math.random() * 115) / 10) * 10;
    } else if (name.includes('oil filter')) {
      price = Math.round((50 + Math.random() * 150) / 10) * 10;
    } else if (name.includes('brake pad') || name.includes('brake shoe')) {
      price = Math.round((95 + Math.random() * 255) / 10) * 10;
    } else if (name.includes('brake caliper')) {
      price = Math.round((250 + Math.random() * 550) / 10) * 10;
    } else if (name.includes('abs sensor')) {
      price = Math.round((100 + Math.random() * 150) / 10) * 10;
    } else if (name.includes('ignition coil') || name.includes('coil pack')) {
      price = Math.round((100 + Math.random() * 200) / 10) * 10;
    } else if (name.includes('alternator')) {
      price = Math.round((400 + Math.random() * 800) / 10) * 10;
    } else if (name.includes('starter')) {
      price = Math.round((350 + Math.random() * 650) / 10) * 10;
    } else if (name.includes('battery')) {
      price = Math.round((200 + Math.random() * 600) / 10) * 10;
    } else if (name.includes('radiator') || name.includes('cooling')) {
      price = Math.round((300 + Math.random() * 900) / 10) * 10;
    } else if (name.includes('water pump')) {
      price = Math.round((150 + Math.random() * 350) / 10) * 10;
    } else if (name.includes('shock') || name.includes('strut') || name.includes('suspension')) {
      price = Math.round((180 + Math.random() * 520) / 10) * 10;
    } else if (name.includes('stabilizer link')) {
      price = Math.round((80 + Math.random() * 120) / 10) * 10;
    } else if (name.includes('ball joint')) {
      price = Math.round((100 + Math.random() * 250) / 10) * 10;
    } else if (name.includes('tie rod') || name.includes('steering')) {
      price = Math.round((120 + Math.random() * 280) / 10) * 10;
    } else if (name.includes('headlight')) {
      price = Math.round((300 + Math.random() * 900) / 10) * 10;
    } else if (name.includes('taillight') || name.includes('rear light')) {
      price = Math.round((250 + Math.random() * 650) / 10) * 10;
    } else if (name.includes('mirror')) {
      price = Math.round((150 + Math.random() * 450) / 10) * 10;
    } else if (name.includes('grille')) {
      price = Math.round((300 + Math.random() * 1200) / 10) * 10;
    } else if (name.includes('bonnet') || name.includes('hood')) {
      price = Math.round((800 + Math.random() * 2700) / 10) * 10;
    } else if (name.includes('door')) {
      price = Math.round((1000 + Math.random() * 4000) / 10) * 10;
    } else if (name.includes('bumper')) {
      price = Math.round((500 + Math.random() * 2000) / 10) * 10;
    } else if (name.includes('fender') || name.includes('wing')) {
      price = Math.round((400 + Math.random() * 1600) / 10) * 10;
    } else if (name.includes('windscreen') || name.includes('windshield')) {
      price = Math.round((400 + Math.random() * 1600) / 10) * 10;
    } else if (name.includes('gearbox') || name.includes('transmission')) {
      price = Math.round((1500 + Math.random() * 6500) / 10) * 10;
    } else if (name.includes('cvt') || name.includes('transmission oil')) {
      price = Math.round((200 + Math.random() * 300) / 10) * 10;
    } else if (name.includes('fuel pump')) {
      price = Math.round((200 + Math.random() * 600) / 10) * 10;
    } else if (name.includes('fuel filter')) {
      price = Math.round((80 + Math.random() * 220) / 10) * 10;
    } else if (name.includes('sensor')) {
      price = Math.round((80 + Math.random() * 320) / 10) * 10;
    } else if (name.includes('turbo')) {
      price = Math.round((1500 + Math.random() * 4500) / 10) * 10;
    } else if (name.includes('exhaust') || name.includes('muffler')) {
      price = Math.round((200 + Math.random() * 800) / 10) * 10;
    } else if (name.includes('wiper')) {
      price = Math.round((30 + Math.random() * 120) / 10) * 10;
    } else if (name.includes('key')) {
      price = Math.round((40 + Math.random() * 110) / 10) * 10;
    } else if (name.includes('tire') || name.includes(' tyre')) {
      price = Math.round((200 + Math.random() * 1000) / 10) * 10;
    } else if (name.includes('rim') || name.includes('wheel')) {
      price = Math.round((300 + Math.random() * 1700) / 10) * 10;
    } else {
      price = Math.round((100 + Math.random() * 900) / 10) * 10;
    }
    
    cost_price = Math.round(price * 0.55);
    
    // Image URL logic
    if (name.includes('bonnet') || name.includes('hood')) image_url = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop';
    else if (name.includes('door')) image_url = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop';
    else if (name.includes('bumper')) image_url = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop';
    else if (name.includes('headlight')) image_url = 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop';
    else if (name.includes('taillight')) image_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop';
    else if (name.includes('mirror')) image_url = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
    else if (name.includes('filter')) image_url = 'https://images.unsplash.com/photo-1609592424825-db4a65827c79?w=800&h=600&fit=crop';
    else if (name.includes('brake')) image_url = 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop';
    else if (name.includes('shock') || name.includes('strut')) image_url = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
    else if (name.includes('battery')) image_url = 'https://images.unsplash.com/photo-1609592424825-db4a65827c79?w=800&h=600&fit=crop';
    else if (name.includes('engine') || name.includes('piston')) image_url = 'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=800&h=600&fit=crop';
    else image_url = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
    
    // Car image URL logic
    if (name.includes('toyota') && (name.includes('corolla') || name.includes('rav4') || name.includes('camry') || name.includes('hilux'))) {
      car_image_url = 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop';
    } else if (name.includes('honda') && (name.includes('civic') || name.includes('accord'))) {
      car_image_url = 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&h=600&fit=crop';
    } else if (name.includes('hyundai') && (name.includes('elantra') || name.includes('tucson'))) {
      car_image_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop';
    } else if (name.includes('bmw')) {
      car_image_url = 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop';
    } else if (name.includes('mercedes') || name.includes('benz')) {
      car_image_url = 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop';
    } else if (name.includes('nissan')) {
      car_image_url = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop';
    } else {
      car_image_url = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
    }
    
    return { id: p.id, price, cost_price, image_url, car_image_url };
  });
  
  console.log('Updating products in parallel batches...');
  
  // Process in batches of 100 with Promise.all for parallelism
  const batchSize = 100;
  let updated = 0;
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    // Create update promises - use update() for each record
    const promises = batch.map(item => 
      supabase
        .from('products')
        .update({
          price: item.price,
          cost_price: item.cost_price,
          image_url: item.image_url,
          car_image_url: item.car_image_url
        })
        .eq('id', item.id)
        .then(({ error }) => ({ id: item.id, error }))
    );
    
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    
    if (errors.length > 0) {
      console.log(`Batch ${Math.floor(i/batchSize) + 1}: ${errors.length} errors`);
    }
    
    updated += batch.length - errors.length;
    console.log(`Progress: ${updated}/${updates.length}`);
  }
  
  console.log(`\nDone! Updated ${updated} products.`);
  
  // Summary
  const { data: summary } = await supabase
    .from('products')
    .select('price')
    .eq('is_deleted', false);
  
  if (summary) {
    const prices = summary.map(p => Number(p.price)).filter(p => !isNaN(p));
    console.log(`\nPrice Summary:`);
    console.log(`- Min: ₵${Math.min(...prices)}`);
    console.log(`- Max: ₵${Math.max(...prices)}`);
    console.log(`- Avg: ₵${Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)}`);
  }
}

updateProducts().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
