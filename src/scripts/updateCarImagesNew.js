import "dotenv/config";
import { supabaseAdmin } from "../services/supabaseClient.js";

const CAR_IMAGES = {
  'Toyota': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Honda': 'https://cdn.pixabay.com/photo/2016/09/02/09/29/honda-1637615_1280.jpg',
  'Nissan': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'BMW': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'Mercedes-Benz': 'https://cdn.pixabay.com/photo/2017/08/28/13/22/mercedes-2688738_1280.jpg',
  'Porsche': 'https://cdn.pixabay.com/photo/2017/01/27/14/27/porsche-2113869_1280.jpg',
  'Hyundai': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Kia': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Lexus': 'https://cdn.pixabay.com/photo/2017/11/06/13/48/lexus-2923696_1280.jpg',
  'Audi': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Ford': 'https://cdn.pixabay.com/photo/2016/02/20/17/56/ford-1213348_1280.jpg',
  'Mazda': 'https://cdn.pixabay.com/photo/2015/05/28/12/33/mazda-788747_1280.jpg',
  'Volkswagen': 'https://cdn.pixabay.com/photo/2016/03/14/15/41/volkswagen-1253653_1280.jpg',
  'Subaru': 'https://cdn.pixabay.com/photo/2015/09/17/17/34/subaru-946475_1280.jpg',
  'Jeep': 'https://cdn.pixabay.com/photo/2016/05/06/22/25/jeep-1375209_1280.jpg',
  'Land Rover': 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg',
  'Volvo': 'https://cdn.pixabay.com/photo/2016/11/14/15/32/volvo-1827402_1280.jpg',
  'Suzuki': 'https://cdn.pixabay.com/photo/2016/04/21/17/02/suzuki-1343849_1280.jpg',
  'Chevrolet': 'https://cdn.pixabay.com/photo/2016/02/26/17/00/chevrolet-1224353_1280.jpg',
  'Dodge': 'https://cdn.pixabay.com/photo/2016/09/28/17/34/dodge-1698626_1280.jpg',
  'default': 'https://cdn.pixabay.com/photo/2015/01/19/13/51/car-602808_1280.jpg',
};

function getCarImage(brandName) {
  const name = brandName || '';
  const lower = name.toLowerCase();
  
  if (lower.includes('mercedes')) return CAR_IMAGES['Mercedes-Benz'];
  if (lower.includes('land rover') || lower.includes('range rover')) return CAR_IMAGES['Land Rover'];
  if (lower.includes('jeep') || lower.includes('jeeb')) return CAR_IMAGES['Jeep'];
  if (lower.includes('toyota')) return CAR_IMAGES['Toyota'];
  if (lower.includes('honda')) return CAR_IMAGES['Honda'];
  if (lower.includes('nissan')) return CAR_IMAGES['Nissan'];
  if (lower.includes('bmw')) return CAR_IMAGES['BMW'];
  if (lower.includes('porsche')) return CAR_IMAGES['Porsche'];
  if (lower.includes('hyundai')) return CAR_IMAGES['Hyundai'];
  if (lower.includes('kia')) return CAR_IMAGES['Kia'];
  if (lower.includes('lexus')) return CAR_IMAGES['Lexus'];
  if (lower.includes('audi')) return CAR_IMAGES['Audi'];
  if (lower.includes('ford')) return CAR_IMAGES['Ford'];
  if (lower.includes('mazda') || lower.includes('madza')) return CAR_IMAGES['Mazda'];
  if (lower.includes('volkswagen')) return CAR_IMAGES['Volkswagen'];
  if (lower.includes('subaru')) return CAR_IMAGES['Subaru'];
  if (lower.includes('volvo')) return CAR_IMAGES['Volvo'];
  if (lower.includes('suzuki')) return CAR_IMAGES['Suzuki'];
  if (lower.includes('chevrolet')) return CAR_IMAGES['Chevrolet'];
  if (lower.includes('dodge')) return CAR_IMAGES['Dodge'];
  
  return CAR_IMAGES['default'];
}

async function updateCarImages() {
  console.log('Fetching all products with brand info...');
  
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(`
      id,
      name,
      brand_id,
      brands (name)
    `)
    .eq('is_deleted', false);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`\nTotal products to update: ${data.length}\n`);

  const updates = [];
  let brandCounts = {};

  for (const product of data) {
    const brandName = product.brands?.name || '';
    const car_image_url = getCarImage(brandName);
    
    updates.push({
      id: product.id,
      car_image_url,
    });

    if (!brandCounts[brandName]) {
      brandCounts[brandName] = 0;
    }
    brandCounts[brandName]++;
  }

  console.log('Brand distribution:');
  Object.entries(brandCounts).sort((a, b) => b[1] - a[1]).forEach(([brand, count]) => {
    console.log(`  ${brand}: ${count} products`);
  });

  console.log('\nUpdating car images...');
  
  const batchSize = 100;
  let updated = 0;
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    const { error } = await supabaseAdmin
      .from('products')
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error(`Error updating batch ${Math.floor(i / batchSize) + 1}:`, error.message);
    } else {
      updated += batch.length;
    }
    
    if ((i + batchSize) % 500 === 0 || i + batchSize >= updates.length) {
      console.log(`Progress: ${Math.min(i + batchSize, updates.length)}/${updates.length}`);
    }
  }

  console.log(`\n✓ Successfully updated ${updated} car images`);
}

updateCarImages().catch(console.error);
