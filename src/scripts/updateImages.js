import "dotenv/config";
import { supabaseAdmin } from "../services/supabaseClient.js";

const PART_IMAGES = {
  'bonnet': 'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800&q=80',
  'BONNET': 'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800&q=80',
  'doors': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
  'bumpers': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
  'head lights': 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80',
  'side mirrors': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'tail lights': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80',
  'gear levels': 'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800&q=80',
  'fenders': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80',
  'grilles': 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80',
  'default': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
};

const CAR_IMAGES = {
  'toyota': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80',
  'honda': 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=800&q=80',
  'nissan': 'https://images.unsplash.com/photo-1558865869-c93f6f8482af?w=800&q=80',
  'bmw': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
  'mercedes-benz': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
  'mercedes- benz': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
  'range rover': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80',
  'land rover': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80',
  'porsche': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
  'hyundai': 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&q=80',
  'kia': 'https://images.unsplash.com/photo-1590367138606-2865e8fb8f1b?w=800&q=80',
  'lexus': 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80',
  'audi': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
  'ford': 'https://images.unsplash.com/photo-1551137820-5fe481867e53?w=800&q=80',
  'mazda': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
  'madza': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
  'volkswagen': 'https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=800&q=80',
  'subaru': 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&q=80',
  'jeep': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
  'jeeb': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
  'volvo': 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80',
  'suzuki': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80',
  'chevrolet': 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&q=80',
  'dodge': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
  'default': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
};

function normalize(str) {
  return (str || '').trim().toLowerCase();
}

function getPartImage(catName) {
  const key = normalize(catName);
  return PART_IMAGES[key] || PART_IMAGES['default'];
}

function getCarImage(brandName) {
  const key = normalize(brandName);
  
  if (key.includes('mercedes')) return CAR_IMAGES['mercedes-benz'];
  if (key.includes('land rover') || key.includes('range rover')) return CAR_IMAGES['land rover'];
  if (key.includes('honda')) return CAR_IMAGES['honda'];
  if (key.includes('nissan')) return CAR_IMAGES['nissan'];
  if (key.includes('toyota')) return CAR_IMAGES['toyota'];
  if (key.includes('bmw')) return CAR_IMAGES['bmw'];
  if (key.includes('porsche')) return CAR_IMAGES['porsche'];
  if (key.includes('hyundai')) return CAR_IMAGES['hyundai'];
  if (key.includes('kia')) return CAR_IMAGES['kia'];
  if (key.includes('lexus')) return CAR_IMAGES['lexus'];
  if (key.includes('audi')) return CAR_IMAGES['audi'];
  if (key.includes('ford')) return CAR_IMAGES['ford'];
  if (key.includes('mazda') || key.includes('madza')) return CAR_IMAGES['mazda'];
  if (key.includes('volkswagen')) return CAR_IMAGES['volkswagen'];
  if (key.includes('subaru')) return CAR_IMAGES['subaru'];
  if (key.includes('jeep') || key.includes('jeeb')) return CAR_IMAGES['jeep'];
  if (key.includes('volvo')) return CAR_IMAGES['volvo'];
  if (key.includes('suzuki')) return CAR_IMAGES['suzuki'];
  if (key.includes('chevrolet')) return CAR_IMAGES['chevrolet'];
  if (key.includes('dodge')) return CAR_IMAGES['dodge'];
  
  return CAR_IMAGES['default'];
}

async function run() {
  console.log('Fetching categories...');
  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('id, name');
  
  console.log('Fetching brands...');
  const { data: brands } = await supabaseAdmin
    .from('brands')
    .select('id, name');
  
  console.log(`Updating ${categories.length} categories and ${brands.length} brands...`);
  
  let updated = 0;
  
  for (const cat of categories) {
    const image_url = getPartImage(cat.name);
    const { error } = await supabaseAdmin
      .from('products')
      .update({ image_url })
      .eq('category_id', cat.id)
      .eq('is_deleted', false);
    
    if (error) {
      console.error(`Error updating category ${cat.name}:`, error.message);
    } else {
      updated++;
    }
  }
  
  console.log(`Updated ${updated} categories`);
  
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
  
  console.log('Done! All product images updated.');
}

run().catch(console.error);
