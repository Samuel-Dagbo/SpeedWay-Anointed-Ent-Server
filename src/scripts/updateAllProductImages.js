import "dotenv/config";
import { supabaseAdmin } from "../services/supabaseClient.js";

const PART_IMAGES = {
  'Bonnet': 'https://cdn.pixabay.com/photo/2016/03/14/15/41/volkswagen-1253653_1280.jpg',
  'Doors': 'https://cdn.pixabay.com/photo/2015/01/19/13/51/car-602808_1280.jpg',
  'Bumpers': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Head Lights': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'Side Mirrors': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Tail Lights': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'Fenders': 'https://cdn.pixabay.com/photo/2015/09/17/17/34/subaru-946475_1280.jpg',
  'Grilles': 'https://cdn.pixabay.com/photo/2017/08/28/13/22/mercedes-2688738_1280.jpg',
  'default': 'https://cdn.pixabay.com/photo/2015/01/19/13/51/car-602808_1280.jpg',
};

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

function getPartImage(categoryName) {
  const name = (categoryName || '').trim().toLowerCase();
  
  if (name.includes('bonnet')) return PART_IMAGES['Bonnet'];
  if (name.includes('door')) return PART_IMAGES['Doors'];
  if (name.includes('bumper')) return PART_IMAGES['Bumpers'];
  if (name.includes('head light') || name.includes('headlight')) return PART_IMAGES['Head Lights'];
  if (name.includes('side mirror') || name.includes('mirror')) return PART_IMAGES['Side Mirrors'];
  if (name.includes('tail light') || name.includes('taillight') || name.includes('tail light')) return PART_IMAGES['Tail Lights'];
  if (name.includes('fender')) return PART_IMAGES['Fenders'];
  if (name.includes('grille') || name.includes('grill')) return PART_IMAGES['Grilles'];
  
  return PART_IMAGES['default'];
}

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

async function updateAllProductImages() {
  console.log('Fetching all products with brand, category, model, and year info...');
  
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(`
      id,
      name,
      category_id,
      brand_id,
      model_id,
      year_id,
      categories (name),
      brands (name),
      models (name),
      years (label)
    `)
    .eq('is_deleted', false);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`\nTotal products to update: ${data.length}\n`);

  const updates = [];
  const stats = {
    categories: {},
    brands: {},
    skipped: 0,
    updated: 0,
  };

  for (const product of data) {
    const categoryName = product.categories?.name || '';
    const brandName = product.brands?.name || '';
    const modelName = product.models?.name || '';
    const yearLabel = product.years?.label || '';
    
    const image_url = getPartImage(categoryName);
    const car_image_url = getCarImage(brandName);
    
    updates.push({
      id: product.id,
      image_url,
      car_image_url,
    });

    stats.categories[categoryName] = (stats.categories[categoryName] || 0) + 1;
    stats.brands[brandName] = (stats.brands[brandName] || 0) + 1;
  }

  console.log('Category distribution:');
  Object.entries(stats.categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} products`);
    });

  console.log('\nBrand distribution:');
  Object.entries(stats.brands)
    .sort((a, b) => b[1] - a[1])
    .forEach(([brand, count]) => {
      console.log(`  ${brand}: ${count} products`);
    });

  console.log('\nUpdating all product images...');
  
  let updated = 0;
  let errors = 0;
  
  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];
    const { error } = await supabaseAdmin
      .from('products')
      .update({
        image_url: update.image_url,
        car_image_url: update.car_image_url,
      })
      .eq('id', update.id);
    
    if (error) {
      console.error(`Error updating product ${update.id}:`, error.message);
      errors++;
    } else {
      updated++;
    }
    
    if ((i + 1) % 100 === 0 || i + 1 === updates.length) {
      console.log(`Progress: ${i + 1}/${updates.length}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('UPDATE SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total rows updated: ${updated}`);
  console.log(`Rows with errors: ${errors}`);
  console.log(`Rows skipped: ${stats.skipped}`);
  console.log('='.repeat(60));

  if (updated > 0) {
    console.log('\n✓ Successfully updated product images');
  } else {
    console.log('\n✗ No products were updated');
  }
}

updateAllProductImages().catch(console.error);
