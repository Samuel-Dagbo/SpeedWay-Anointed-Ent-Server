import "dotenv/config";
import { supabaseAdmin } from "../services/supabaseClient.js";

// Car images by brand - exact matches with trailing spaces
const CAR_IMAGES = {
  'Toyota': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Honda ': 'https://cdn.pixabay.com/photo/2016/09/02/09/29/honda-1637615_1280.jpg',
  'Nissan ': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'BMW': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'Mercedes- Benz ': 'https://cdn.pixabay.com/photo/2017/08/28/13/22/mercedes-2688738_1280.jpg',
  'Porsche ': 'https://cdn.pixabay.com/photo/2017/01/27/14/27/porsche-2113869_1280.jpg',
  'Hyundai ': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Kia ': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Lexus': 'https://cdn.pixabay.com/photo/2017/11/06/13/48/lexus-2923696_1280.jpg',
  'Audi': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Ford ': 'https://cdn.pixabay.com/photo/2016/02/20/17/56/ford-1213348_1280.jpg',
  'Mazda ': 'https://cdn.pixabay.com/photo/2015/05/28/12/33/mazda-788747_1280.jpg',
  'Volkswagen': 'https://cdn.pixabay.com/photo/2016/03/14/15/41/volkswagen-1253653_1280.jpg',
  'Subaru ': 'https://cdn.pixabay.com/photo/2015/09/17/17/34/subaru-946475_1280.jpg',
  'Jeeb ': 'https://cdn.pixabay.com/photo/2016/05/06/22/25/jeep-1375209_1280.jpg',
  'Land Rover ': 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg',
  'Volvo': 'https://cdn.pixabay.com/photo/2016/11/14/15/32/volvo-1827402_1280.jpg',
  'Suzuki': 'https://cdn.pixabay.com/photo/2016/04/21/17/02/suzuki-1343849_1280.jpg',
  'Chevrolet': 'https://cdn.pixabay.com/photo/2016/02/26/17/00/chevrolet-1224353_1280.jpg',
  'Dodge ': 'https://cdn.pixabay.com/photo/2016/09/28/17/34/dodge-1698626_1280.jpg',
  'default': 'https://cdn.pixabay.com/photo/2015/01/19/13/51/car-602808_1280.jpg',
};

function getCarImage(brandName) {
  const name = brandName || '';
  // Direct match first
  if (CAR_IMAGES[name]) return CAR_IMAGES[name];
  // Trim match
  const trimmed = name.trim();
  if (CAR_IMAGES[trimmed]) return CAR_IMAGES[trimmed];
  // Starts with match
  for (const [key, url] of Object.entries(CAR_IMAGES)) {
    if (name.startsWith(key) || trimmed.startsWith(key)) return url;
  }
  return CAR_IMAGES.default;
}

async function run() {
  console.log('Fetching brands...');
  const { data: brands } = await supabaseAdmin.from('brands').select('id, name');
  const brandMap = new Map(brands.map(b => [b.id, b.name]));
  
  console.log('Fetching products...');
  const { data: products } = await supabaseAdmin.from('products').select('id, brand_id');
  
  console.log('Updating', products.length, 'products with correct car images...');
  
  // Group by car_image_url needed
  const updates = products.map(p => {
    const brandName = brandMap.get(p.brand_id) || '';
    return {
      id: p.id,
      car_image_url: getCarImage(brandName),
    };
  });
  
  // Batch update
  const batchSize = 100;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    await supabaseAdmin.from('products').upsert(batch, { onConflict: 'id' });
    if ((i + batchSize) % 500 === 0 || i + batchSize >= updates.length) {
      console.log('Updated:', Math.min(i + batchSize, updates.length), '/', updates.length);
    }
  }
  
  console.log('Done!');
}

run().catch(console.error);
