import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

function generateGhanaPrice(partName) {
  const name = partName.toLowerCase();
  let baseMin = 50, baseMax = 500;
  
  if (name.includes('spark plug') || name.includes('ignition plug')) {
    baseMin = 30; baseMax = 120;
  } else if (name.includes('air filter') || name.includes('cabin filter') || name.includes('cabin air')) {
    baseMin = 35; baseMax = 150;
  } else if (name.includes('oil filter')) {
    baseMin = 50; baseMax = 200;
  } else if (name.includes('brake pad') || name.includes('brake shoe')) {
    baseMin = 95; baseMax = 350;
  } else if (name.includes('brake caliper')) {
    baseMin = 250; baseMax = 800;
  } else if (name.includes('abs sensor')) {
    baseMin = 100; baseMax = 250;
  } else if (name.includes('ignition coil') || name.includes('coil pack')) {
    baseMin = 100; baseMax = 300;
  } else if (name.includes('alternator')) {
    baseMin = 400; baseMax = 1200;
  } else if (name.includes('starter') || name.includes('start motor')) {
    baseMin = 350; baseMax = 1000;
  } else if (name.includes('battery')) {
    baseMin = 200; baseMax = 800;
  } else if (name.includes('radiator') || name.includes('cooling')) {
    baseMin = 300; baseMax = 1200;
  } else if (name.includes('water pump')) {
    baseMin = 150; baseMax = 500;
  } else if (name.includes('shock') || name.includes('strut') || name.includes('suspension')) {
    baseMin = 180; baseMax = 700;
  } else if (name.includes('stabilizer link') || name.includes('link bar')) {
    baseMin = 80; baseMax = 200;
  } else if (name.includes('ball joint')) {
    baseMin = 100; baseMax = 350;
  } else if (name.includes('tie rod') || name.includes('steering')) {
    baseMin = 120; baseMax = 400;
  } else if (name.includes('headlight') || name.includes('head light')) {
    baseMin = 300; baseMax = 1200;
  } else if (name.includes('taillight') || name.includes('tail light') || name.includes('rear light')) {
    baseMin = 250; baseMax = 900;
  } else if (name.includes('mirror') || name.includes('rear view')) {
    baseMin = 150; baseMax = 600;
  } else if (name.includes('grille') || name.includes('grill')) {
    baseMin = 300; baseMax = 1500;
  } else if (name.includes('bonnet') || name.includes('hood')) {
    baseMin = 800; baseMax = 3500;
  } else if (name.includes('door')) {
    baseMin = 1000; baseMax = 5000;
  } else if (name.includes('bumper')) {
    baseMin = 500; baseMax = 2500;
  } else if (name.includes('fender') || name.includes('wing')) {
    baseMin = 400; baseMax = 2000;
  } else if (name.includes('windscreen') || name.includes('windshield') || name.includes('glass')) {
    baseMin = 400; baseMax = 2000;
  } else if (name.includes('gearbox') || name.includes('transmission') || name.includes('gear box')) {
    baseMin = 1500; baseMax = 8000;
  } else if (name.includes('cvt') || name.includes('transmission oil') || name.includes('atf')) {
    baseMin = 200; baseMax = 500;
  } else if (name.includes('fuel pump')) {
    baseMin = 200; baseMax = 800;
  } else if (name.includes('fuel filter')) {
    baseMin = 80; baseMax = 300;
  } else if (name.includes('sensor')) {
    baseMin = 80; baseMax = 400;
  } else if (name.includes('piston ring')) {
    baseMin = 100; baseMax = 400;
  } else if (name.includes('cylinder head') || name.includes('head')) {
    baseMin = 800; baseMax = 3500;
  } else if (name.includes('turbo')) {
    baseMin = 1500; baseMax = 6000;
  } else if (name.includes('catalytic') || name.includes('cat con')) {
    baseMin = 800; baseMax = 3000;
  } else if (name.includes('exhaust') || name.includes('muffler')) {
    baseMin = 200; baseMax = 1000;
  } else if (name.includes('wiper')) {
    baseMin = 30; baseMax = 150;
  } else if (name.includes('key shell') || name.includes('key')) {
    baseMin = 40; baseMax = 150;
  } else if (name.includes('mat') || name.includes('carpet')) {
    baseMin = 50; baseMax = 300;
  } else if (name.includes('seat cover') || name.includes('seat')) {
    baseMin = 100; baseMax = 500;
  } else if (name.includes('tire') || name.includes(' tyre')) {
    baseMin = 200; baseMax = 1200;
  } else if (name.includes('rim') || name.includes('wheel')) {
    baseMin = 300; baseMax = 2000;
  }
  
  const price = baseMin + Math.random() * (baseMax - baseMin);
  return Math.round(price / 10) * 10;
}

function generatePartImageUrl(partName) {
  const name = partName.toLowerCase();
  
  if (name.includes('bonnet') || name.includes('hood')) return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop';
  if (name.includes('door')) return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop';
  if (name.includes('bumper')) return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop';
  if (name.includes('fender') || name.includes('wing')) return 'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=800&h=600&fit=crop';
  if (name.includes('grille') || name.includes('grill')) return 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop';
  if (name.includes('headlight') || name.includes('head light')) return 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop';
  if (name.includes('taillight') || name.includes('tail light') || name.includes('rear light')) return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop';
  if (name.includes('mirror') || name.includes('rear view')) return 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
  if (name.includes('windscreen') || name.includes('windshield') || name.includes('glass')) return 'https://images.unsplash.com/photo-1508853191279-582d0e0e92e1?w=800&h=600&fit=crop';
  if (name.includes('rim') || name.includes('wheel')) return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop';
  if (name.includes('engine') || name.includes('piston') || name.includes('cylinder')) return 'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=800&h=600&fit=crop';
  if (name.includes('gear') || name.includes('transmission') || name.includes('gearbox')) return 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop';
  if (name.includes('battery')) return 'https://images.unsplash.com/photo-1609592424825-db4a65827c79?w=800&h=600&fit=crop';
  if (name.includes('brake')) return 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop';
  if (name.includes('shock') || name.includes('strut') || name.includes('suspension')) return 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
  if (name.includes('filter')) return 'https://images.unsplash.com/photo-1609592424825-db4a65827c79?w=800&h=600&fit=crop';
  if (name.includes('spark') || name.includes('ignition') || name.includes('coil')) return 'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=800&h=600&fit=crop';
  if (name.includes('radiator') || name.includes('cooling') || name.includes('water pump')) return 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop';
  if (name.includes('alternator') || name.includes('starter')) return 'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=800&h=600&fit=crop';
  if (name.includes('fuel') || name.includes('pump')) return 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop';
  if (name.includes('exhaust') || name.includes('muffler') || name.includes('catalytic')) return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop';
  if (name.includes('sensor') || name.includes('abs')) return 'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=800&h=600&fit=crop';
  if (name.includes('steering') || name.includes('tie rod') || name.includes('ball joint')) return 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
  if (name.includes('turbo') || name.includes('charger')) return 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop';
  if (name.includes('wiper')) return 'https://images.unsplash.com/photo-1508853191279-582d0e0e92e1?w=800&h=600&fit=crop';
  if (name.includes('key')) return 'https://images.unsplash.com/photo-1609592424825-db4a65827c79?w=800&h=600&fit=crop';
  if (name.includes('seat') || name.includes('mat') || name.includes('carpet')) return 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
  if (name.includes('tire') || name.includes(' tyre')) return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop';
  if (name.includes('oil') || name.includes('lubricant') || name.includes('cvt')) return 'https://images.unsplash.com/photo-1609592424825-db4a65827c79?w=800&h=600&fit=crop';
  
  return 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
}

function generateCarImageUrl(partName) {
  const name = partName.toLowerCase();
  
  if (name.includes('toyota') && (name.includes('corolla') || name.includes('rav4') || name.includes('camry') || name.includes('hilux') || name.includes('fortuner') || name.includes('yaris') || name.includes('vitz') || name.includes('starlet'))) {
    return 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop';
  }
  if (name.includes('honda') && (name.includes('civic') || name.includes('accord') || name.includes('cr-v') || name.includes('pilot'))) {
    return 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&h=600&fit=crop';
  }
  if (name.includes('hyundai') && (name.includes('elantra') || name.includes('tucson') || name.includes('santa fe') || name.includes('sonata'))) {
    return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop';
  }
  if (name.includes('nissan') && (name.includes('sentra') || name.includes('altima') || name.includes('pathfinder') || name.includes('navara'))) {
    return 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop';
  }
  if (name.includes('bmw')) return 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop';
  if (name.includes('mercedes') || name.includes('benz')) return 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop';
  if (name.includes('mazda')) return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop';
  if (name.includes('ford')) return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop';
  if (name.includes('kia')) return 'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=800&h=600&fit=crop';
  if (name.includes('mitsubishi') || name.includes('outlander')) return 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
  if (name.includes('lexus')) return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop';
  if (name.includes('land cruiser') || name.includes('prado')) return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop';
  
  return 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';
}

async function updateProducts() {
  console.log('Fetching all products...');
  
  const { data: allProducts, error } = await supabase
    .from('products')
    .select('id, name')
    .eq('is_deleted', false);
  
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  
  console.log(`Total products: ${allProducts.length}`);
  
  // Generate updates for all products
  const updates = allProducts.map(product => {
    const newPrice = generateGhanaPrice(product.name);
    const costPrice = Math.round(newPrice * 0.55);
    return {
      id: product.id,
      price: newPrice,
      cost_price: costPrice,
      image_url: generatePartImageUrl(product.name),
      car_image_url: generateCarImageUrl(product.name)
    };
  });
  
  // Use RPC to bulk update - much faster!
  console.log('Creating RPC function for bulk update...');
  
  // Create the function inline
  await supabase.rpc('create_bulk_update_function', {});
  
  // Update in batches of 500
  const batchSize = 500;
  let updated = 0;
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    // Use upsert for each batch
    const { error } = await supabase
      .from('products')
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error(`Batch error ${i/batchSize + 1}:`, error.message);
      // Try individual updates in this batch
      for (const item of batch) {
        const { error: singleError } = await supabase
          .from('products')
          .update({
            price: item.price,
            cost_price: item.cost_price,
            image_url: item.image_url,
            car_image_url: item.car_image_url
          })
          .eq('id', item.id);
        
        if (!singleError) updated++;
      }
    } else {
      updated += batch.length;
      console.log(`Updated ${updated}/${updates.length} products...`);
    }
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

updateProducts();
