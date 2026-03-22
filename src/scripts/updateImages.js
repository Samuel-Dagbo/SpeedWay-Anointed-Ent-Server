import "dotenv/config";
import { supabaseAdmin } from "../services/supabaseClient.js";

const PART_IMAGES = {
  'Bonnet': 'https://cdn.pixabay.com/photo/2016/03/12/23/23/automobile-1252872_1280.jpg',
  'Doors': 'https://cdn.pixabay.com/photo/2016/03/12/23/23/car-1252872_1280.jpg',
  'Bumpers': 'https://cdn.pixabay.com/photo/2015/09/12/19/39/car-937061_1280.jpg',
  'Side Mirrors': 'https://cdn.pixabay.com/photo/2016/04/13/19/20/side-mirror-1328401_1280.jpg',
  'Head Lights': 'https://cdn.pixabay.com/photo/2014/11/13/23/54/headlight-534069_1280.jpg',
  'Tail Lights': 'https://cdn.pixabay.com/photo/2015/05/22/05/57/taillight-779740_1280.jpg',
  'Gear Levels': 'https://cdn.pixabay.com/photo/2016/08/01/21/41/gear-stick-1569409_1280.jpg',
  'Fenders': 'https://cdn.pixabay.com/photo/2016/11/23/18/36/auto-1853826_1280.jpg',
  'Grilles': 'https://cdn.pixabay.com/photo/2016/11/22/20/09/automobile-1851053_1280.jpg',
  'camry': 'https://cdn.pixabay.com/photo/2017/01/09/11/09/car-1964294_1280.jpg',
  'BONNET': 'https://cdn.pixabay.com/photo/2016/03/12/23/23/automobile-1252872_1280.jpg',
  'default': 'https://cdn.pixabay.com/photo/2015/01/19/13/51/car-602808_1280.jpg',
};

const CAR_IMAGES = {
  'Toyota': 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg',
  'Honda': 'https://cdn.pixabay.com/photo/2016/09/02/09/29/honda-1637615_1280.jpg',
  'Nissan': 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg',
  'BMW': 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg',
  'Mercedes-Benz': 'https://cdn.pixabay.com/photo/2017/08/28/13/22/mercedes-2688738_1280.jpg',
  'Mercedes- Benz': 'https://cdn.pixabay.com/photo/2017/08/28/13/22/mercedes-2688738_1280.jpg',
  'Range Rover': 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg',
  'Porsche': 'https://cdn.pixabay.com/photo/2017/01/27/14/27/porsche-2113869_1280.jpg',
  'Hyundai': 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg',
  'Kia': 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg',
  'Lexus': 'https://cdn.pixabay.com/photo/2017/11/06/13/48/lexus-2923696_1280.jpg',
  'Audi': 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg',
  'Ford': 'https://cdn.pixabay.com/photo/2016/02/20/17/56/ford-1213348_1280.jpg',
  'Mazda': 'https://cdn.pixabay.com/photo/2015/05/28/12/33/mazda-788747_1280.jpg',
  'Madza': 'https://cdn.pixabay.com/photo/2015/05/28/12/33/mazda-788747_1280.jpg',
  'Volkswagen': 'https://cdn.pixabay.com/photo/2016/03/14/15/41/volkswagen-1253653_1280.jpg',
  'Subaru': 'https://cdn.pixabay.com/photo/2015/09/17/17/34/subaru-946475_1280.jpg',
  'Jeep': 'https://cdn.pixabay.com/photo/2016/05/06/22/25/jeep-1375209_1280.jpg',
  'Jeeb': 'https://cdn.pixabay.com/photo/2016/05/06/22/25/jeep-1375209_1280.jpg',
  'Land Rover': 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg',
  'Volvo': 'https://cdn.pixabay.com/photo/2016/11/14/15/32/volvo-1827402_1280.jpg',
  'Suzuki': 'https://cdn.pixabay.com/photo/2016/04/21/17/02/suzuki-1343849_1280.jpg',
  'Chevrolet': 'https://cdn.pixabay.com/photo/2016/02/26/17/00/chevrolet-1224353_1280.jpg',
  'Dodge': 'https://cdn.pixabay.com/photo/2016/09/28/17/34/dodge-1698626_1280.jpg',
  'default': 'https://cdn.pixabay.com/photo/2015/01/19/13/51/car-602808_1280.jpg',
  '': 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg',
};

function trim(s) { return (s || '').trim(); }
function getPartImage(catName) { return PART_IMAGES[trim(catName)] || PART_IMAGES.default; }

function getCarImage(brandName) {
  const name = brandName || '';
  const trimmed = name.trim();
  
  // Check for specific brand patterns (some have special characters or trailing spaces)
  if (trimmed === 'Toyota') return 'https://cdn.pixabay.com/photo/2017/10/10/19/26/toyota-2839525_1280.jpg';
  if (trimmed === 'Honda' || name.startsWith('Honda')) return 'https://cdn.pixabay.com/photo/2016/09/02/09/29/honda-1637615_1280.jpg';
  if (trimmed === 'Nissan' || name.startsWith('Nissan')) return 'https://cdn.pixabay.com/photo/2016/11/21/14/52/nissan-1845419_1280.jpg';
  if (trimmed === 'BMW') return 'https://cdn.pixabay.com/photo/2017/08/10/10/29/bmw-2621517_1280.jpg';
  if (trimmed.includes('Mercedes') || name.startsWith('Mercedes')) return 'https://cdn.pixabay.com/photo/2017/08/28/13/22/mercedes-2688738_1280.jpg';
  if (trimmed.includes('Range Rover') || name.startsWith('Range Rover')) return 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg';
  if (trimmed.includes('Land Rover') || name.startsWith('Land Rover')) return 'https://cdn.pixabay.com/photo/2016/11/10/20/19/range-rover-1816667_1280.jpg';
  if (trimmed === 'Porsche' || name.startsWith('Porsche')) return 'https://cdn.pixabay.com/photo/2017/01/27/14/27/porsche-2113869_1280.jpg';
  if (trimmed === 'Hyundai' || name.startsWith('Hyundai')) return 'https://cdn.pixabay.com/photo/2015/05/27/19/48/hyundai-787828_1280.jpg';
  if (trimmed === 'Kia' || name.startsWith('Kia')) return 'https://cdn.pixabay.com/photo/2016/02/16/09/23/kia-1200491_1280.jpg';
  if (trimmed === 'Lexus' || name.startsWith('Lexus')) return 'https://cdn.pixabay.com/photo/2017/11/06/13/48/lexus-2923696_1280.jpg';
  if (trimmed === 'Audi' || name.startsWith('Audi')) return 'https://cdn.pixabay.com/photo/2016/06/05/12/08/audi-1437832_1280.jpg';
  if (trimmed === 'Ford' || name.startsWith('Ford')) return 'https://cdn.pixabay.com/photo/2016/02/20/17/56/ford-1213348_1280.jpg';
  if (trimmed === 'Mazda' || name.startsWith('Mazda') || name.startsWith('Madza')) return 'https://cdn.pixabay.com/photo/2015/05/28/12/33/mazda-788747_1280.jpg';
  if (trimmed === 'Volkswagen' || name.startsWith('Volkswagen')) return 'https://cdn.pixabay.com/photo/2016/03/14/15/41/volkswagen-1253653_1280.jpg';
  if (trimmed === 'Subaru' || name.startsWith('Subaru')) return 'https://cdn.pixabay.com/photo/2015/09/17/17/34/subaru-946475_1280.jpg';
  if (trimmed === 'Jeep' || name.startsWith('Jeep') || name.startsWith('Jeeb')) return 'https://cdn.pixabay.com/photo/2016/05/06/22/25/jeep-1375209_1280.jpg';
  if (trimmed === 'Volvo' || name.startsWith('Volvo')) return 'https://cdn.pixabay.com/photo/2016/11/14/15/32/volvo-1827402_1280.jpg';
  if (trimmed === 'Suzuki' || name.startsWith('Suzuki')) return 'https://cdn.pixabay.com/photo/2016/04/21/17/02/suzuki-1343849_1280.jpg';
  if (trimmed === 'Chevrolet' || name.startsWith('Chevrolet')) return 'https://cdn.pixabay.com/photo/2016/02/26/17/00/chevrolet-1224353_1280.jpg';
  if (trimmed === 'Dodge' || name.startsWith('Dodge')) return 'https://cdn.pixabay.com/photo/2016/09/28/17/34/dodge-1698626_1280.jpg';
  
  return CAR_IMAGES.default;
}

async function run() {
  console.log('Fetching products...');
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, name, categories(name), brands(name)');

  console.log('Updating', products.length, 'products...');

  const batchSize = 100;
  let updated = 0;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    const updates = batch.map(p => ({
      id: p.id,
      image_url: getPartImage(p.categories?.name),
      car_image_url: getCarImage(p.brands?.name),
    }));

    await supabaseAdmin
      .from('products')
      .upsert(updates, { onConflict: 'id' });

    updated += batch.length;
    if (updated % 500 === 0 || updated === products.length) {
      console.log('Updated:', updated, '/', products.length);
    }
  }

  console.log('Done!');
}

run().catch(console.error);
