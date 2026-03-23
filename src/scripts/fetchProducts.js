import "dotenv/config";
import { supabaseAdmin } from "../services/supabaseClient.js";

async function fetchProducts() {
  console.log('Fetching all products with brand, model, category, and year info...');
  
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(`
      id,
      name,
      category_id,
      brand_id,
      model_id,
      year_id,
      image_url,
      car_image_url,
      categories (name),
      brands (name),
      models (name),
      years (label)
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`\nTotal products found: ${data.length}\n`);
  
  // Format and display products
  const formatted = data.map(p => ({
    id: p.id,
    name: p.name,
    category: p.categories?.name || 'N/A',
    brand: p.brands?.name || 'N/A',
    model: p.models?.name || 'N/A',
    year: p.years?.label || 'N/A',
    image_url: p.image_url || 'MISSING',
    car_image_url: p.car_image_url || 'MISSING'
  }));

  formatted.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   Brand: ${p.brand}, Model: ${p.model}, Year: ${p.year}, Category: ${p.category}`);
    console.log(`   Image URL: ${p.image_url}`);
    console.log(`   Car Image URL: ${p.car_image_url}`);
    console.log('');
  });

  return data;
}

fetchProducts().catch(console.error);
