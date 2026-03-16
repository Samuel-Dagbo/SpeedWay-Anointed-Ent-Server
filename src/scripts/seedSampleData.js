import "dotenv/config";
import { supabaseAdmin } from "../services/supabaseClient.js";

async function upsertMany(table, rows, conflict) {
  const { error } = await supabaseAdmin
    .from(table)
    .upsert(rows, { onConflict: conflict });
  if (error) throw error;
}

async function run() {
  const categories = [
    { name: "Brakes" },
    { name: "Lighting" },
    { name: "Suspension" },
    { name: "Filters" },
    { name: "Engine" },
    { name: "Electrical" }
  ];

  const brands = [
    { name: "Range Rover" },
    { name: "Toyota" },
    { name: "Honda" },
    { name: "Nissan" },
    { name: "BMW" },
    { name: "Mercedes-Benz" }
  ];

  await upsertMany("categories", categories, "name");
  await upsertMany("brands", brands, "name");

  const { data: brandRows } = await supabaseAdmin.from("brands").select("*");
  const brandId = Object.fromEntries(brandRows.map((b) => [b.name, b.id]));

  const models = [
    { name: "Range Rover Sport", brand_id: brandId["Range Rover"] },
    { name: "Range Rover Evoque", brand_id: brandId["Range Rover"] },
    { name: "Range Rover Vogue", brand_id: brandId["Range Rover"] },
    { name: "Corolla", brand_id: brandId["Toyota"] },
    { name: "Hilux", brand_id: brandId["Toyota"] },
    { name: "Civic", brand_id: brandId["Honda"] },
    { name: "CR-V", brand_id: brandId["Honda"] },
    { name: "X-Trail", brand_id: brandId["Nissan"] },
    { name: "Patrol", brand_id: brandId["Nissan"] },
    { name: "3 Series", brand_id: brandId["BMW"] },
    { name: "5 Series", brand_id: brandId["BMW"] },
    { name: "C-Class", brand_id: brandId["Mercedes-Benz"] }
  ];

  await upsertMany("models", models, "name,brand_id");

  const years = Array.from({ length: 10 }).map((_, i) => ({
    label: `${2015 + i}`
  }));
  await upsertMany("years", years, "label");

  const { data: categoryRows } = await supabaseAdmin
    .from("categories")
    .select("*");
  const categoryId = Object.fromEntries(
    categoryRows.map((c) => [c.name, c.id])
  );

  const { data: modelRows } = await supabaseAdmin.from("models").select("*");
  const modelId = Object.fromEntries(
    modelRows.map((m) => [`${m.name}-${m.brand_id}`, m.id])
  );

  const { data: yearRows } = await supabaseAdmin.from("years").select("*");
  const yearId = Object.fromEntries(yearRows.map((y) => [y.label, y.id]));

  const products = [
    {
      name: "Range Rover Sport Brake Pads (Front)",
      category_id: categoryId.Brakes,
      brand_id: brandId["Range Rover"],
      model_id: modelId[`Range Rover Sport-${brandId["Range Rover"]}`],
      year_id: yearId["2021"],
      price: 1250,
      cost_price: 900,
      quantity: 14,
      description: "OEM-grade ceramic brake pads for Range Rover Sport.",
      image_url:
        "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1200&auto=format&fit=crop",
      status: "active",
      is_deleted: false
    },
    {
      name: "Range Rover Evoque LED Headlight",
      category_id: categoryId.Lighting,
      brand_id: brandId["Range Rover"],
      model_id: modelId[`Range Rover Evoque-${brandId["Range Rover"]}`],
      year_id: yearId["2020"],
      price: 4500,
      cost_price: 3600,
      quantity: 6,
      description: "High-performance LED headlight assembly.",
      image_url:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop",
      status: "active",
      is_deleted: false
    },
    {
      name: "Toyota Corolla Air Filter",
      category_id: categoryId.Filters,
      brand_id: brandId.Toyota,
      model_id: modelId[`Corolla-${brandId.Toyota}`],
      year_id: yearId["2019"],
      price: 220,
      cost_price: 150,
      quantity: 40,
      description: "Premium air filter for better engine breathing.",
      image_url:
        "https://images.unsplash.com/photo-1486754735734-325b5831c3ad?q=80&w=1200&auto=format&fit=crop",
      status: "active",
      is_deleted: false
    },
    {
      name: "Toyota Hilux Shock Absorber Set",
      category_id: categoryId.Suspension,
      brand_id: brandId.Toyota,
      model_id: modelId[`Hilux-${brandId.Toyota}`],
      year_id: yearId["2022"],
      price: 3200,
      cost_price: 2500,
      quantity: 8,
      description: "Heavy-duty suspension kit for rugged terrains.",
      image_url:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
      status: "active",
      is_deleted: false
    },
    {
      name: "Honda Civic Starter Motor",
      category_id: categoryId.Electrical,
      brand_id: brandId.Honda,
      model_id: modelId[`Civic-${brandId.Honda}`],
      year_id: yearId["2018"],
      price: 1850,
      cost_price: 1400,
      quantity: 10,
      description: "Reliable starter motor with high torque output.",
      image_url:
        "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1200&auto=format&fit=crop",
      status: "active",
      is_deleted: false
    },
    {
      name: "Nissan X-Trail Brake Disc",
      category_id: categoryId.Brakes,
      brand_id: brandId.Nissan,
      model_id: modelId[`X-Trail-${brandId.Nissan}`],
      year_id: yearId["2020"],
      price: 980,
      cost_price: 720,
      quantity: 18,
      description: "Ventilated brake disc for improved heat dissipation.",
      image_url:
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop",
      status: "active",
      is_deleted: false
    },
    {
      name: "BMW 3 Series Oil Filter",
      category_id: categoryId.Filters,
      brand_id: brandId.BMW,
      model_id: modelId[`3 Series-${brandId.BMW}`],
      year_id: yearId["2021"],
      price: 260,
      cost_price: 180,
      quantity: 30,
      description: "OEM oil filter for BMW 3 Series engines.",
      image_url:
        "https://images.unsplash.com/photo-1486754735734-325b5831c3ad?q=80&w=1200&auto=format&fit=crop",
      status: "active",
      is_deleted: false
    },
    {
      name: "Mercedes-Benz C-Class Spark Plug Set",
      category_id: categoryId.Engine,
      brand_id: brandId["Mercedes-Benz"],
      model_id: modelId[`C-Class-${brandId["Mercedes-Benz"]}`],
      year_id: yearId["2019"],
      price: 740,
      cost_price: 520,
      quantity: 22,
      description: "High-ignition spark plugs for smooth performance.",
      image_url:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop",
      status: "active",
      is_deleted: false
    }
  ];

  await upsertMany("products", products, "name,brand_id,model_id,year_id");

  console.log("[seed] Sample data inserted.");
}

run().catch((err) => {
  console.error("[seed] Failed to seed sample data:", err);
  process.exit(1);
});
