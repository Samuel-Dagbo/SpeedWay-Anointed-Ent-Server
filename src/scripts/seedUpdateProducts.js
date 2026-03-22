import "dotenv/config";
import { supabaseAdmin } from "../services/supabaseClient.js";

const CAR_IMAGES = {
  "Toyota": [
    "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80",
    "https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?w=800&q=80",
    "https://images.unsplash.com/photo-1567808285-4e5b5d5e0de6?w=800&q=80",
    "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&q=80",
  ],
  "Honda": [
    "https://images.unsplash.com/photo-1606611013016-96e59e5e2a53?w=800&q=80",
    "https://images.unsplash.com/photo-1619424086546-14e1e6f470c6?w=800&q=80",
    "https://images.unsplash.com/photo-1625243486554-4d23e5e1a1b4?w=800&q=80",
  ],
  "Nissan": [
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80",
    "https://images.unsplash.com/photo-1612540055116-4a7a4b2a09e9?w=800&q=80",
    "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&q=80",
  ],
  "BMW": [
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
    "https://images.unsplash.com/photo-1520050206274-a1ae44e97fa4?w=800&q=80",
    "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80",
  ],
  "Mercedes-Benz": [
    "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
    "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80",
    "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80",
  ],
  "Range Rover": [
    "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80",
    "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80",
    "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80",
  ],
  "default": [
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80",
  ],
};

const PART_IMAGES = {
  Brakes: {
    "Toyota": [
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    ],
    "Honda": [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80",
    ],
    "Nissan": [
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    ],
    "BMW": [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80",
    ],
    "Mercedes-Benz": [
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    ],
    "Range Rover": [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80",
    ],
    default: [
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80",
    ],
  },
  Lighting: {
    "Toyota": [
      "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80",
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80",
    ],
    "Honda": [
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80",
      "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80",
    ],
    "Nissan": [
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80",
      "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80",
    ],
    "BMW": [
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80",
      "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80",
    ],
    "Mercedes-Benz": [
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80",
      "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80",
    ],
    "Range Rover": [
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80",
      "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80",
    ],
    default: [
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80",
    ],
  },
  Suspension: {
    "Toyota": [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
      "https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&q=80",
    ],
    "Honda": [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
      "https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&q=80",
    ],
    "Nissan": [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
      "https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&q=80",
    ],
    "BMW": [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
      "https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&q=80",
    ],
    "Mercedes-Benz": [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
      "https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&q=80",
    ],
    "Range Rover": [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
      "https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&q=80",
    ],
    default: [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
    ],
  },
  Filters: {
    "Toyota": [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
      "https://images.unsplash.com/photo-1486754735734-325b5831c3ad?w=800&q=80",
    ],
    "Honda": [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
      "https://images.unsplash.com/photo-1486754735734-325b5831c3ad?w=800&q=80",
    ],
    "Nissan": [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
      "https://images.unsplash.com/photo-1486754735734-325b5831c3ad?w=800&q=80",
    ],
    "BMW": [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
      "https://images.unsplash.com/photo-1486754735734-325b5831c3ad?w=800&q=80",
    ],
    "Mercedes-Benz": [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
      "https://images.unsplash.com/photo-1486754735734-325b5831c3ad?w=800&q=80",
    ],
    "Range Rover": [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
      "https://images.unsplash.com/photo-1486754735734-325b5831c3ad?w=800&q=80",
    ],
    default: [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
    ],
  },
  Engine: {
    "Toyota": [
      "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=800&q=80",
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
    ],
    "Honda": [
      "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=800&q=80",
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
    ],
    "Nissan": [
      "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=800&q=80",
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
    ],
    "BMW": [
      "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=800&q=80",
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
    ],
    "Mercedes-Benz": [
      "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=800&q=80",
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
    ],
    "Range Rover": [
      "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=800&q=80",
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
    ],
    default: [
      "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=800&q=80",
    ],
  },
  Electrical: {
    "Toyota": [
      "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    ],
    "Honda": [
      "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    ],
    "Nissan": [
      "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    ],
    "BMW": [
      "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    ],
    "Mercedes-Benz": [
      "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    ],
    "Range Rover": [
      "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    ],
    default: [
      "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=800&q=80",
    ],
  },
};

const PART_NAMES = {
  Brakes: [
    "Brake Pads (Front)",
    "Brake Pads (Rear)",
    "Brake Disc",
    "Brake Caliper",
    "Brake Shoes",
    "Brake Lines",
    "Brake Master Cylinder",
    "Brake Booster",
  ],
  Lighting: [
    "Headlight Assembly",
    "Headlight Bulb",
    "Taillight Assembly",
    "LED Headlight",
    "Fog Light",
    "Turn Signal",
    "Interior Light",
    "License Plate Light",
  ],
  Suspension: [
    "Shock Absorber (Front)",
    "Shock Absorber (Rear)",
    "Coil Spring (Front)",
    "Coil Spring (Rear)",
    "Control Arm (Front Lower)",
    "Strut Assembly",
    "Sway Bar Link",
    "Ball Joint",
  ],
  Filters: [
    "Air Filter",
    "Oil Filter",
    "Cabin Filter",
    "Fuel Filter",
    "Transmission Filter",
    "Power Steering Filter",
    "Air Filter (Secondary)",
    "Oil Filter (Cartridge)",
  ],
  Engine: [
    "Spark Plug Set",
    "Timing Belt Kit",
    "Water Pump",
    "Thermostat",
    "Engine Mount",
    "Valve Cover Gasket",
    "Timing Chain Kit",
    "Camshaft Seal",
  ],
  Electrical: [
    "Starter Motor",
    "Alternator",
    "Car Battery",
    "Ignition Coil",
    "Oxygen Sensor",
    "Mass Air Flow Sensor",
    "Crankshaft Position Sensor",
    "Throttle Position Sensor",
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
  return Math.round(Math.random() * (max - min) + min * 100) / 100;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateProductName(brand, model, category, year) {
  const parts = PART_NAMES[category] || ["Spare Part"];
  const part = randomChoice(parts);
  return `${brand} ${model} ${part} (${year})`;
}

function generateDescription(brand, model, category, part) {
  return `Genuine ${brand} ${model} ${part}. Premium quality replacement part designed for optimal performance and perfect fit.`;
}

function getCarImage(brand) {
  return CAR_IMAGES[brand] ? randomChoice(CAR_IMAGES[brand]) : randomChoice(CAR_IMAGES.default);
}

function getPartImage(brand, category) {
  return PART_IMAGES[category]?.[brand] 
    ? randomChoice(PART_IMAGES[category][brand]) 
    : randomChoice(PART_IMAGES[category]?.default || ["https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80"]);
}

async function fetchData() {
  const [categories, brands, models, years, products] = await Promise.all([
    supabaseAdmin.from("categories").select("*"),
    supabaseAdmin.from("brands").select("*"),
    supabaseAdmin.from("models").select("*"),
    supabaseAdmin.from("years").select("*"),
    supabaseAdmin.from("products").select("*"),
  ]);

  return {
    categories: categories.data || [],
    brands: brands.data || [],
    models: models.data || [],
    years: years.data || [],
    products: products.data || [],
  };
}

async function run() {
  console.log("[seed:update] Fetching data from database...");

  const { categories, brands, models, years, products } = await fetchData();

  console.log(`Found: ${categories.length} categories, ${brands.length} brands, ${models.length} models, ${years.length} years, ${products.length} existing products`);

  const brandMap = new Map(brands.map((b) => [b.id, b]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const modelBrandMap = new Map(models.map((m) => [m.id, m.brand_id]));

  const updates = [];
  let updateCount = 0;

  for (const product of products) {
    const brand = brandMap.get(product.brand_id);
    const category = categoryMap.get(product.category_id);
    const model = models.find((m) => m.id === product.model_id);
    const year = years.find((y) => y.id === product.year_id);

    if (!brand || !category || !model || !year) {
      continue;
    }

    const newName = generateProductName(brand.name, model.name, category.name, year.label);
    const newDescription = generateDescription(
      brand.name,
      model.name,
      category.name,
      newName.split("(")[0].trim().split(" ").slice(2).join(" ")
    );

    const newCarImage = getCarImage(brand.name);
    const newProductImage = getPartImage(brand.name, category.name);

    const priceRange = PRICE_RANGES[category.name] || { min: 200, max: 2000 };
    const newPrice = product.price === 0 ? randomInt(priceRange.min, priceRange.max) : product.price;
    const newCostPrice = product.cost_price === 0 ? Math.round(newPrice * randomFloat(0.65, 0.8)) : product.cost_price;

    updates.push({
      id: product.id,
      name: newName,
      description: newDescription,
      image_url: newProductImage,
      car_image_url: newCarImage,
      price: newPrice,
      cost_price: newCostPrice,
    });
    updateCount++;
  }

  console.log(`Updating ${updateCount} products...`);

  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    const ids = batch.map((b) => b.id);
    
    const { error } = await supabaseAdmin
      .from("products")
      .update(batch.map((item) => ({
        name: item.name,
        description: item.description,
        image_url: item.image_url,
        car_image_url: item.car_image_url,
        price: item.price,
        cost_price: item.cost_price,
      })))
      .in("id", ids);

    if (error) {
      console.error(`Batch error: ${error.message}`);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
    }

    if ((i + batchSize) % 500 === 0 || i + batchSize >= updates.length) {
      console.log(`Progress: ${Math.min(i + batchSize, updates.length)}/${updates.length}`);
    }
  }

  console.log(`\n[seed:update] Complete!`);
  console.log(`Updated: ${successCount} products`);
  if (errorCount > 0) console.log(`Errors: ${errorCount}`);
}

run().catch((err) => {
  console.error("[seed:update] Failed:", err);
  process.exit(1);
});
