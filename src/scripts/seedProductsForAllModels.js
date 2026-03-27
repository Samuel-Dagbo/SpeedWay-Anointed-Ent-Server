import "dotenv/config";
import { supabaseAdmin } from "../services/supabaseClient.js";

async function seedProducts() {
  console.log("=== Seeding Products ===\n");

  // Get all categories except Seat Belt and Car Alarm Systems
  const { data: categories } = await supabaseAdmin
    .from("categories")
    .select("id, name")
    .not("name", "ilike", "%seat belt%")
    .not("name", "ilike", "%car alarm%");

  console.log(`Found ${categories?.length || 0} categories (excluding Seat Belt and Car Alarm Systems):`);
  categories?.forEach(c => console.log(`  - ${c.name}`));

  // Get all models (already split by year)
  const { data: models } = await supabaseAdmin
    .from("models")
    .select("id, name, brands(name)")
    .order("name");

  console.log(`\nFound ${models?.length || 0} models`);

  // Get existing products to check for duplicates
  const { data: existingProducts } = await supabaseAdmin
    .from("products")
    .select("name, category_id, model_id");

  const existingSet = new Set();
  existingProducts?.forEach(p => {
    existingSet.add(`${p.name.toLowerCase()}-${p.category_id}-${p.model_id}`);
  });

  console.log(`Found ${existingProducts?.length || 0} existing products`);

  // Create products for each category-model combination
  const productsToCreate = [];
  const skipped = [];

  for (const category of categories || []) {
    for (const model of models || []) {
      const productName = `${model.brands?.name || ""} ${model.name} ${category.name}`.trim();
      const key = `${productName.toLowerCase()}-${category.id}-${model.id}`;

      if (existingSet.has(key)) {
        skipped.push(productName);
        continue;
      }

      productsToCreate.push({
        name: productName,
        price: 0, // Default price
        quantity: 0,
        category_id: category.id,
        model_id: model.id,
        status: "active",
        description: null,
        image_url: null
      });
    }
  }

  console.log(`\nProducts to create: ${productsToCreate.length}`);
  console.log(`Products to skip (duplicates): ${skipped.length}`);

  // Insert in batches of 100
  const batchSize = 100;
  let created = 0;

  for (let i = 0; i < productsToCreate.length; i += batchSize) {
    const batch = productsToCreate.slice(i, i + batchSize);
    const { error } = await supabaseAdmin
      .from("products")
      .insert(batch);

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
    } else {
      created += batch.length;
      console.log(`Inserted ${created}/${productsToCreate.length} products...`);
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`Total created: ${created}`);
  console.log(`Total skipped (duplicates): ${skipped.length}`);
}

seedProducts().catch(console.error);
