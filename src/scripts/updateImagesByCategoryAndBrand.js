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
  if (name.includes('tail light') || name.includes('taillight')) return PART_IMAGES['Tail Lights'];
  if (name.includes('fender')) return PART_IMAGES['Fenders'];
  if (name.includes('grille') || name.includes('grill')) return PART_IMAGES['Grilles'];
  if (name.includes('gear')) return PART_IMAGES['default'];
  
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

async function updateImagesByCategoryAndBrand() {
  console.log('Fetching categories and brands...');
  
  const { data: categories } = await supabaseAdmin.from('categories').select('id, name');
  const { data: brands } = await supabaseAdmin.from('brands').select('id, name');
  
  console.log(`\nUpdating images by category (${categories.length} categories)...`);
  
  for (const cat of categories) {
    const image_url = getPartImage(cat.name);
    const { error } = await supabaseAdmin
      .from('products')
      .update({ image_url })
      .eq('category_id', cat.id)
      .eq('is_deleted', false);
    
    if (error) {
      console.error(`Error updating category ${cat.name}:`, error.message);
    }
  }
  
  console.log(`\nUpdating car images by brand (${brands.length} brands)...`);
  
  for (const brand of brands) {
    const car_image_url = getCarImage(brand.name);
    const { error } = await supabaseAdmin
      .from('products')
      .update({ car_image_url })
      .eq('brand_id', brand.id)
      .eq('is_deleted', false);
    
    if (error) {
      console.error(`Error updating brand ${brand.name}:`, error.message);
    }
  }
  
  console.log('\n✓ Successfully updated all product images');
}

updateImagesByCategoryAndBrand().catch(console.error);
