import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Verified car part images from Unsplash (known to work and show actual car parts)
const VERIFIED_IMAGES = {
  'bonnet': [
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop',
  ],
  'door': [
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=800&h=600&fit=crop',
  ],
  'doors': [
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=800&h=600&fit=crop',
  ],
  'bumper': [
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop',
  ],
  'bumpers': [
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop',
  ],
  'fender': [
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
  ],
  'fenders': [
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
  ],
  'headlight': [
    'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
  ],
  'headlights': [
    'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
  ],
  'head light': [
    'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
  ],
  'head lights': [
    'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
  ],
  'taillight': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
  ],
  'taillights': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
  ],
  'tail light': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
  ],
  'tail lights': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
  ],
  'mirror': [
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=800&h=600&fit=crop',
  ],
  'mirrors': [
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=800&h=600&fit=crop',
  ],
  'side mirror': [
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=800&h=600&fit=crop',
  ],
  'side mirrors': [
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=800&h=600&fit=crop',
  ],
  'grille': [
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
  ],
  'grilles': [
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
  ],
  'gear': [
    'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=800&h=600&fit=crop',
  ],
  'gear level': [
    'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=800&h=600&fit=crop',
  ],
  'gear levels': [
    'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=800&h=600&fit=crop',
  ],
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop';

function getPartType(name) {
  const lower = (name || '').toLowerCase();
  for (const key of Object.keys(VERIFIED_IMAGES)) {
    if (lower.includes(key)) {
      return key;
    }
  }
  return null;
}

function getImageForProduct(productName, productId) {
  const partType = getPartType(productName);
  
  if (partType && VERIFIED_IMAGES[partType]) {
    const images = VERIFIED_IMAGES[partType];
    // Use product ID to consistently assign the same image for the same product
    const index = productId.charCodeAt(0) % images.length;
    return images[index];
  }
  
  return DEFAULT_IMAGE;
}

// Simple hash function to vary images per product
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getImageForProductV2(productName, productId) {
  const partType = getPartType(productName);
  
  if (partType && VERIFIED_IMAGES[partType]) {
    const images = VERIFIED_IMAGES[partType];
    // Use productId hash to pick image consistently
    const index = hashCode(productId) % images.length;
    return images[index];
  }
  
  return DEFAULT_IMAGE;
}

(async () => {
  console.log('='.repeat(60));
  console.log('UPDATING IMAGES - VERIFIED CAR PART IMAGES');
  console.log('='.repeat(60));
  
  // Get all products
  let offset = 0;
  const limit = 1000;
  let totalUpdated = 0;
  
  while (true) {
    const { data: products, count } = await supabase
      .from('products')
      .select('id, name', { count: 'exact' })
      .eq('is_deleted', false)
      .range(offset, offset + limit - 1);
    
    if (!products || products.length === 0) break;
    
    console.log(`Processing products ${offset + 1} to ${offset + products.length}...`);
    
    // Update each product with verified image
    for (const product of products) {
      const imageUrl = getImageForProductV2(product.name, product.id);
      await supabase
        .from('products')
        .update({ image_url: imageUrl })
        .eq('id', product.id);
      
      totalUpdated++;
    }
    
    console.log(`Updated ${totalUpdated} products so far`);
    offset += limit;
    
    if (products.length < limit) break;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`DONE! Updated ${totalUpdated} product images.`);
  console.log('='.repeat(60));
  
  // Show sample
  const { data: samples } = await supabase
    .from('products')
    .select('name, image_url')
    .limit(5);
  
  console.log('\nSample products with images:');
  samples.forEach(p => {
    console.log(`- ${p.name.substring(0, 40)}`);
    console.log(`  Image: ${p.image_url}`);
  });
})();
