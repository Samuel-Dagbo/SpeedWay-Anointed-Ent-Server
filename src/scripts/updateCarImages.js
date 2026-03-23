import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CAR_IMAGES = {
  'toyota': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
  'honda': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800',
  'nissan': 'https://images.unsplash.com/photo-1559389366-833a8c2f7224?w=800',
  'bmw': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
  'mercedes': 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800',
  'benz': 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800',
  'porsche': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
  'hyundai': 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800',
  'kia': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800',
  'lexus': 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800',
  'audi': 'https://images.unsplash.com/photo-1603584173870-7b297f066607?w=800',
  'ford': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
  'mazda': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800',
  'volkswagen': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800',
  'vw': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800',
  'subaru': 'https://images.unsplash.com/photo-1588410327372-4a5f5eb2aa2c?w=800',
  'jeep': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800',
  'jeeb': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800',
  'land rover': 'https://images.unsplash.com/photo-1552410260-0fd903b7b728?w=800',
  'volvo': 'https://images.unsplash.com/photo-1584826557894-df8bf9a6ce95?w=800',
  'suzuki': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800',
  'chevrolet': 'https://images.unsplash.com/photo--1552519507-da3b142c6e3d?w=800',
  'dodge': 'https://images.unsplash.com/photo-1613483189614-b1e6a70725ac?w=800',
  'chevy': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
  'toyota': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
  'mitsubishi': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800',
  'acura': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800',
  'infiniti': 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800',
  'gmc': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
  'cadillac': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
  'chrysler': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
  'lincoln': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
  'buick': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
  'jaguar': 'https://images.unsplash.com/photo-1552410260-0fd903b7b728?w=800',
  'lexus': 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800',
  'mini': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
  'tesla': 'https://images.unsplash.com/photo-1560958089-b8a1929cea4f?w=800',
  'default': 'https://images.unsplash.com/photo-1494976388531-d1058504b777?w=800'
};

function getCarImageUrl(brandName) {
  const name = (brandName || '').toLowerCase().trim();
  
  for (const [key, url] of Object.entries(CAR_IMAGES)) {
    if (name.includes(key) || name.startsWith(key)) {
      return url;
    }
  }
  
  return CAR_IMAGES.default;
}

async function main() {
  console.log("Fetching products with brands...");
  let all = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase.from("products")
      .select("id, brands(name)")
      .eq("is_deleted", false).range(offset, offset + 999);
    if (!data || !data.length) break;
    all.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log(`Total: ${all.length}\n`);
  
  let updated = 0;
  
  for (let i = 0; i < all.length; i++) {
    const p = all[i];
    const brand = p.brands?.name || "";
    const url = getCarImageUrl(brand);
    
    await supabase.from("products").update({ car_image_url: url }).eq("id", p.id);
    updated++;
    
    if ((i + 1) % 100 === 0) {
      console.log(`[${i + 1}/${all.length}] Updated ${updated} car images`);
      await new Promise(r => setTimeout(r, 100));
    }
  }
  
  console.log(`\n=== COMPLETE ===\nUpdated: ${updated} products with matching car images`);
}

main().catch(console.error);
