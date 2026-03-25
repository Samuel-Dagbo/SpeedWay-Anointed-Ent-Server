import "dotenv/config";
import { supabaseAdmin } from "../services/supabaseClient.js";

async function splitModels() {
  console.log("=== Splitting Models by Year ===\n");

  // Get all models with multiple years (years array has more than 1 item)
  const { data: models, error } = await supabaseAdmin
    .from("models")
    .select("id, name, brand_id, image_url, gallery, years")
    .not("years", "eq", "[]");

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${models.length} models with years\n`);

  let created = 0;
  let deleted = 0;

  for (const model of models) {
    if (!model.years || model.years.length <= 1) continue;

    console.log(`Processing: ${model.name} with years: [${model.years.join(", ")}]`);

    // Create a new model for each year
    for (const year of model.years) {
      const newName = `${model.name} ${year}`;
      
      // Check if already exists
      const { data: existing } = await supabaseAdmin
        .from("models")
        .select("id")
        .eq("name", newName)
        .eq("brand_id", model.brand_id)
        .maybeSingle();

      if (existing) {
        console.log(`  - ${year}: Already exists, skipping`);
        continue;
      }

      // Create new model
      const { error: insertError } = await supabaseAdmin
        .from("models")
        .insert({
          name: newName,
          brand_id: model.brand_id,
          years: [year],
          image_url: model.image_url,
          gallery: model.gallery || []
        });

      if (insertError) {
        console.log(`  - ${year}: Error - ${insertError.message}`);
      } else {
        console.log(`  - ${year}: Created`);
        created++;
      }
    }

    // Delete the old model
    const { error: deleteError } = await supabaseAdmin
      .from("models")
      .delete()
      .eq("id", model.id);

    if (deleteError) {
      console.log(`  Deleted original: Error - ${deleteError.message}`);
    } else {
      console.log(`  Deleted original: ${model.name}`);
      deleted++;
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`Created: ${created} new models`);
  console.log(`Deleted: ${deleted} old models`);
}

splitModels().catch(console.error);
