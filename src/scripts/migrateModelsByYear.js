import "dotenv/config";
import { supabaseAdmin } from "../services/supabaseClient.js";

async function migrateModels() {
  console.log("Starting model migration...\n");

  // Get all models with multiple years
  const { data: modelsWithYears, error: fetchError } = await supabaseAdmin
    .from("models")
    .select("*")
    .not("years", "eq", "[]");

  if (fetchError) {
    console.error("Error fetching models:", fetchError);
    return;
  }

  console.log(`Found ${modelsWithYears?.length || 0} models with multiple years\n`);

  const results = { created: 0, deleted: 0, skipped: 0 };

  for (const model of modelsWithYears || []) {
    if (!model.years || !Array.isArray(model.years) || model.years.length === 0) {
      results.skipped++;
      continue;
    }

    console.log(`Processing: ${model.name} (${model.years.length} years)`);

    // Check if any products are on this model
    const { data: productsOnModel } = await supabaseAdmin
      .from("products")
      .select("id, year_id")
      .eq("model_id", model.id);

    const hasProducts = productsOnModel && productsOnModel.length > 0;

    for (const year of model.years) {
      const yearName = `${model.name} ${year}`;

      // Check if this model already exists
      const { data: existing } = await supabaseAdmin
        .from("models")
        .select("id")
        .eq("name", yearName)
        .eq("brand_id", model.brand_id)
        .maybeSingle();

      if (existing) {
        console.log(`  - ${year}: Already exists, linking products`);
        
        // Move products to existing model
        if (hasProducts) {
          for (const product of productsOnModel) {
            // Check if this product's year matches
            if (product.year_id) {
              const { data: yearData } = await supabaseAdmin
                .from("years")
                .select("label")
                .eq("id", product.year_id)
                .maybeSingle();

              if (yearData?.label === year) {
                await supabaseAdmin
                  .from("products")
                  .update({ model_id: existing.id })
                  .eq("id", product.id);
                console.log(`    Moved product to ${yearName}`);
              }
            }
          }
        }
        results.skipped++;
      } else {
        // Create new model
        const { data: newModel, error: createError } = await supabaseAdmin
          .from("models")
          .insert({
            name: yearName,
            brand_id: model.brand_id,
            years: [year],
            image_url: model.image_url || null,
            gallery: model.gallery || []
          })
          .select("id")
          .single();

        if (createError) {
          console.error(`  - ${year}: Error creating - ${createError.message}`);
          continue;
        }

        console.log(`  - ${year}: Created new model`);

        // Move products with matching year to new model
        if (hasProducts) {
          for (const product of productsOnModel) {
            if (product.year_id) {
              const { data: yearData } = await supabaseAdmin
                .from("years")
                .select("label")
                .eq("id", product.year_id)
                .maybeSingle();

              if (yearData?.label === year) {
                await supabaseAdmin
                  .from("products")
                  .update({ model_id: newModel.id })
                  .eq("id", product.id);
                console.log(`    Moved product to ${yearName}`);
              }
            }
          }
        }
        results.created++;
      }
    }

    // Delete old model if no products remain
    const { data: remainingProducts } = await supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("model_id", model.id);

    if (!remainingProducts || remainingProducts.count === 0) {
      await supabaseAdmin.from("models").delete().eq("id", model.id);
      console.log(`  Deleted old model: ${model.name}\n`);
      results.deleted++;
    } else {
      console.log(`  Kept old model (${remainingProducts.count} products remain)\n`);
    }
  }

  console.log("\n=== Migration Complete ===");
  console.log(`Created: ${results.created}`);
  console.log(`Deleted: ${results.deleted}`);
  console.log(`Skipped: ${results.skipped}`);
}

migrateModels().catch(console.error);
