import "dotenv/config";
import { supabaseAdmin } from "../services/supabaseClient.js";

const IMAGE_URLS = {
  car: [
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80",
    "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80",
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80",
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  ],
  product: {
    Brakes: [
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    ],
    Lighting: [
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80",
    ],
    Suspension: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80",
    ],
    Filters: [
      "https://images.unsplash.com/photo-1486754735734-325b5831c3ad?w=800&q=80",
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
    ],
    Engine: [
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80",
      "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=800&q=80",
    ],
    Electrical: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
    ],
  },
  default: [
    "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80",
  ],
};

const PRICE_RANGES = {
  Brakes: { min: 300, max: 2500 },
  Lighting: { min: 500, max: 8000 },
  Suspension: { min: 400, max: 5000 },
  Filters: { min: 80, max: 600 },
  Engine: { min: 200, max: 4000 },
  Electrical: { min: 150, max: 3000 },
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateProductName(category, brand, model, year) {
  const categoryPrefixes = {
    Brakes: ["Brake Pads", "Brake Disc", "Brake Caliper", "Brake Shoes", "Brake Lines"],
    Lighting: ["Headlight Assembly", "Tail Light", "LED Bulb", "Fog Light", "Turn Signal"],
    Suspension: ["Shock Absorber", "Coil Spring", "Control Arm", "Strut Assembly", "Sway Bar Link"],
    Filters: ["Air Filter", "Oil Filter", "Cabin Filter", "Fuel Filter", "Transmission Filter"],
    Engine: ["Spark Plug", "Timing Belt", "Water Pump", "Thermostat", "Engine Mount"],
    Electrical: ["Starter Motor", "Alternator", "Battery", "Ignition Coil", "Sensor"],
  };
  const prefix = randomChoice(categoryPrefixes[category] || ["Part"]);
  return `${brand} ${model} ${prefix} (${year})`;
}

function generateDescription(category, brand, model) {
  const descriptions = {
    Brakes: `High-quality ${category.toLowerCase()} component for ${brand} ${model}. Designed for optimal stopping power and safety.`,
    Lighting: `Premium ${category.toLowerCase()} replacement for ${brand} ${model}. Provides excellent visibility and road safety.`,
    Suspension: `Heavy-duty ${category.toLowerCase()} part for ${brand} ${model}. Built for comfort and handling performance.`,
    Filters: `OEM-grade ${category.toLowerCase()} for ${brand} ${model}. Ensures clean airflow and engine protection.`,
    Engine: `Durable ${category.toLowerCase()} component for ${brand} ${model}. Maintains engine performance and reliability.`,
    Electrical: `Reliable ${category.toLowerCase()} for ${brand} ${model}. Ensures proper vehicle electrical system function.`,
  };
  return descriptions[category] || `Quality spare part for ${brand} ${model}.`;
}

async function fetchExistingData() {
  const [categories, brands, models, years, existingProducts] = await Promise.all([
    supabaseAdmin.from("categories").select("*"),
    supabaseAdmin.from("brands").select("*"),
    supabaseAdmin.from("models").select("*"),
    supabaseAdmin.from("years").select("*"),
    supabaseAdmin.from("products").select("name, brand_id, model_id, year_id"),
  ]);

  return {
    categories: categories.data || [],
    brands: brands.data || [],
    models: models.data || [],
    years: years.data || [],
    existingProducts: existingProducts.data || [],
  };
}

function createProductKey(name, brandId, modelId, yearId) {
  return `${name}-${brandId}-${modelId}-${yearId}`;
}

async function upsertProducts(products) {
  const batchSize = 100;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const { error } = await supabaseAdmin
      .from("products")
      .upsert(batch, { onConflict: "name,brand_id,model_id,year_id" });

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, skipped };
}

async function run() {
  console.log("[seed:full] Fetching existing data from database...");

  const { categories, brands, models, years, existingProducts } = await fetchExistingData();

  console.log(`Found: ${categories.length} categories, ${brands.length} brands, ${models.length} models, ${years.length} years`);

  if (categories.length === 0 || brands.length === 0 || models.length === 0 || years.length === 0) {
    console.error("[seed:full] Error: Missing required data. Please ensure categories, brands, models, and years exist.");
    process.exit(1);
  }

  const existingKeys = new Set(
    existingProducts.map((p) => createProductKey(p.name, p.brand_id, p.model_id, p.year_id))
  );

  console.log(`Existing products: ${existingProducts.length}. Generating new products...`);

  const products = [];
  const modelBrandMap = new Map(models.map((m) => [m.id, m.brand_id]));

  for (const category of categories) {
    const productImages = IMAGE_URLS.product[category.name] || IMAGE_URLS.default;

    for (const brand of brands) {
      const brandModels = models.filter((m) => m.brand_id === brand.id);

      for (const model of brandModels) {
        for (const year of years) {
          const name = generateProductName(category.name, brand.name, model.name, year.label);
          const key = createProductKey(name, brand.id, model.id, year.id);

          if (existingKeys.has(key)) {
            continue;
          }

          const priceRange = PRICE_RANGES[category.name] || { min: 200, max: 2000 };
          const price = randomInt(priceRange.min, priceRange.max);
          const costPrice = Math.round(price * randomFloat(0.65, 0.8) * 100) / 100;

          products.push({
            name,
            category_id: category.id,
            brand_id: brand.id,
            model_id: model.id,
            year_id: year.id,
            price,
            cost_price: costPrice,
            quantity: randomInt(5, 50),
            description: generateDescription(category.name, brand.name, model.name),
            image_url: randomChoice(productImages),
            car_image_url: randomChoice(IMAGE_URLS.car),
            status: "active",
            is_deleted: false,
          });
        }
      }
    }
  }

  console.log(`Generated ${products.length} new products. Inserting...`);

  const result = await upsertProducts(products);

  console.log(`[seed:full] Complete. Inserted: ${result.inserted}, Skipped (existing): ${result.skipped}`);
  console.log(`[seed:full] Total products in database: ${existingProducts.length + result.inserted}`);
}

run().catch((err) => {
  console.error("[seed:full] Failed:", err);
  process.exit(1);
});
