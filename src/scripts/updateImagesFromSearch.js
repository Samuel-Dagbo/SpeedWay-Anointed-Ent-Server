import "dotenv/config";
import crypto from "crypto";
import sharp from "sharp";
import { supabaseAdmin } from "../services/supabaseClient.js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
const SEARCH_DELAY_MS = Number(process.env.IMAGE_UPDATE_DELAY_MS || 300);
const FETCH_BATCH_SIZE = 500;
const UPDATE_BATCH_SIZE = 100;
const OPENVERSE_API = "https://api.openverse.org/v1/images/";

const PART_RULES = [
  { key: "brake-pads", label: "Brake Pads", search: "brake pads auto part", pattern: /\bbrake\s*pads?\b/i, color: "#8c1d18" },
  { key: "brake-disc", label: "Brake Disc", search: "brake disc rotor auto part", pattern: /\b(brake\s*disc|rotor)s?\b/i, color: "#6c757d" },
  { key: "brake-caliper", label: "Brake Caliper", search: "brake caliper auto part", pattern: /\bbrake\s*calipers?\b/i, color: "#7f1d1d" },
  { key: "brake-shoes", label: "Brake Shoes", search: "brake shoes auto part", pattern: /\bbrake\s*shoes?\b/i, color: "#7c2d12" },
  { key: "headlight", label: "Headlight", search: "car headlight assembly auto part", pattern: /\b(head\s*lights?|headlights?|headlight\s*assembly)\b/i, color: "#0f4c81" },
  { key: "tail-light", label: "Tail Light", search: "car tail light auto part", pattern: /\b(tail\s*lights?|taillights?|tail\s*light\s*assembly)\b/i, color: "#9f1239" },
  { key: "fog-light", label: "Fog Light", search: "car fog light auto part", pattern: /\bfog\s*lights?\b/i, color: "#475569" },
  { key: "turn-signal", label: "Turn Signal", search: "car turn signal lamp auto part", pattern: /\b(turn\s*signal|indicator\s*lamp)s?\b/i, color: "#b45309" },
  { key: "shock-absorber", label: "Shock Absorber", search: "shock absorber auto part", pattern: /\bshock\s*absorbers?\b/i, color: "#1d4ed8" },
  { key: "coil-spring", label: "Coil Spring", search: "coil spring auto part", pattern: /\bcoil\s*springs?\b/i, color: "#0f766e" },
  { key: "control-arm", label: "Control Arm", search: "control arm auto part", pattern: /\bcontrol\s*arms?\b/i, color: "#166534" },
  { key: "strut-assembly", label: "Strut Assembly", search: "strut assembly auto part", pattern: /\bstrut\s*assembl(y|ies)\b/i, color: "#1e3a8a" },
  { key: "sway-bar-link", label: "Sway Bar Link", search: "sway bar link auto part", pattern: /\bsway\s*bar\s*links?\b/i, color: "#0f766e" },
  { key: "ball-joint", label: "Ball Joint", search: "ball joint auto part", pattern: /\bball\s*joints?\b/i, color: "#14532d" },
  { key: "air-filter", label: "Air Filter", search: "air filter auto part isolated", pattern: /\bair\s*filter\b/i, color: "#15803d" },
  { key: "oil-filter", label: "Oil Filter", search: "oil filter auto part isolated", pattern: /\boil\s*filter\b/i, color: "#854d0e" },
  { key: "cabin-filter", label: "Cabin Filter", search: "cabin air filter auto part", pattern: /\bcabin\s*filter\b/i, color: "#0f766e" },
  { key: "fuel-filter", label: "Fuel Filter", search: "fuel filter auto part", pattern: /\bfuel\s*filter\b/i, color: "#92400e" },
  { key: "transmission-filter", label: "Transmission Filter", search: "transmission filter auto part", pattern: /\btransmission\s*filter\b/i, color: "#7c3aed" },
  { key: "spark-plug", label: "Spark Plug", search: "spark plug auto part isolated", pattern: /\bspark\s*plugs?\b/i, color: "#b91c1c" },
  { key: "timing-belt", label: "Timing Belt", search: "timing belt auto part", pattern: /\btiming\s*belt\b/i, color: "#7c2d12" },
  { key: "water-pump", label: "Water Pump", search: "engine water pump auto part", pattern: /\bwater\s*pump\b/i, color: "#0369a1" },
  { key: "thermostat", label: "Thermostat", search: "car thermostat auto part", pattern: /\bthermostat\b/i, color: "#0f766e" },
  { key: "engine-mount", label: "Engine Mount", search: "engine mount auto part", pattern: /\bengine\s*mount\b/i, color: "#334155" },
  { key: "starter-motor", label: "Starter Motor", search: "starter motor auto part isolated", pattern: /\bstarter\s*motor\b/i, color: "#1d4ed8" },
  { key: "alternator", label: "Alternator", search: "alternator auto part isolated", pattern: /\balternators?\b/i, color: "#7c3aed" },
  { key: "battery", label: "Car Battery", search: "car battery auto part isolated", pattern: /\bbatter(y|ies)\b/i, color: "#475569" },
  { key: "ignition-coil", label: "Ignition Coil", search: "ignition coil auto part", pattern: /\bignition\s*coil\b/i, color: "#7c3aed" },
  { key: "sensor", label: "Car Sensor", search: "automotive sensor auto part", pattern: /\bsensors?\b/i, color: "#0369a1" },
  { key: "door", label: "Car Door", search: "car door auto body part", pattern: /\bdoors?\b/i, color: "#1f2937" },
  { key: "bumper", label: "Car Bumper", search: "car bumper auto body part", pattern: /\bbumpers?\b/i, color: "#374151" },
  { key: "fender", label: "Car Fender", search: "car fender auto body part", pattern: /\bfenders?\b/i, color: "#4b5563" },
  { key: "side-mirror", label: "Side Mirror", search: "car side mirror auto part", pattern: /\b(side\s*mirror|wing\s*mirror)s?\b/i, color: "#334155" },
  { key: "grille", label: "Car Grille", search: "car grille auto part", pattern: /\bgrille?s?\b/i, color: "#111827" },
  { key: "bonnet", label: "Car Bonnet", search: "car hood bonnet body part", pattern: /\b(bonnet|hood)\b/i, color: "#1f2937" },
];

const CATEGORY_FALLBACKS = {
  brakes: { key: "brakes", label: "Brake System", search: "brake system auto part", color: "#7f1d1d" },
  lighting: { key: "lighting", label: "Lighting Part", search: "car lighting auto part", color: "#0f4c81" },
  suspension: { key: "suspension", label: "Suspension Part", search: "suspension auto part", color: "#166534" },
  filters: { key: "filters", label: "Filter", search: "car filter auto part", color: "#15803d" },
  engine: { key: "engine", label: "Engine Part", search: "engine component auto part", color: "#92400e" },
  electrical: { key: "electrical", label: "Electrical Part", search: "automotive electrical part", color: "#1d4ed8" },
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCategoryFallback(categoryName) {
  const normalized = normalizeText(categoryName).toLowerCase();

  for (const [key, value] of Object.entries(CATEGORY_FALLBACKS)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  return {
    key: "generic-auto-part",
    label: "Auto Part",
    search: "auto spare part isolated",
    color: "#1e293b",
  };
}

function detectPart(product) {
  const haystack = [
    product.name,
    product.description,
    product.categories?.name,
    product.brands?.name,
    product.models?.name,
    product.years?.label,
  ]
    .map((value) => normalizeText(value))
    .join(" ");

  for (const rule of PART_RULES) {
    if (rule.pattern.test(haystack)) {
      return rule;
    }
  }

  return getCategoryFallback(product.categories?.name);
}

function buildSearchQueries(part, product) {
  const brand = normalizeText(product.brands?.name);
  const model = normalizeText(product.models?.name);
  const year = normalizeText(product.years?.label);
  const queries = [
    `${part.search}`,
    `${part.label} auto part`,
    `${part.label} car spare part`,
  ];

  if (brand && model) {
    queries.push(`${brand} ${model} ${part.label}`);
    queries.push(`${brand} ${part.label}`);
  }

  if (year && brand && model) {
    queries.push(`${year} ${brand} ${model} ${part.label}`);
  }

  return [...new Set(queries.map((query) => normalizeText(query)).filter(Boolean))];
}

function scoreCandidate(candidate, part) {
  const title = normalizeText(candidate?.title).toLowerCase();
  const creator = normalizeText(candidate?.creator).toLowerCase();
  const combined = `${title} ${creator}`;
  const expectedTokens = normalizeText(part.label).toLowerCase().split(" ");
  const negativeTokens = ["car", "sedan", "suv", "road", "street", "vehicle exterior"];

  let score = 0;

  for (const token of expectedTokens) {
    if (token && combined.includes(token)) {
      score += 4;
    }
  }

  for (const token of negativeTokens) {
    if (combined.includes(token)) {
      score -= 1;
    }
  }

  if (candidate?.license === "cc0" || candidate?.license === "pdm") {
    score += 3;
  }

  if (candidate?.width && candidate?.height) {
    score += Math.min(candidate.width, candidate.height) >= 800 ? 2 : 0;
  }

  return score;
}

async function searchOpenverseImage(part, sampleProduct) {
  const queries = buildSearchQueries(part, sampleProduct);

  for (const query of queries) {
    const url = new URL(OPENVERSE_API);
    url.searchParams.set("q", query);
    url.searchParams.set("license", "cc0,pdm");
    url.searchParams.set("page_size", "10");
    url.searchParams.set("mature", "false");

    try {
      console.log(`Searching Openverse for "${query}"`);
      const response = await fetch(url, {
        headers: {
          "User-Agent": "speedway-image-updater/1.0",
        },
      });

      if (!response.ok) {
        console.log(`Openverse search failed (${response.status}) for "${query}"`);
        await sleep(SEARCH_DELAY_MS);
        continue;
      }

      const payload = await response.json();
      const ranked = (payload.results || [])
        .filter((candidate) => candidate?.url)
        .map((candidate) => ({
          candidate,
          score: scoreCandidate(candidate, part),
        }))
        .sort((left, right) => right.score - left.score);

      const best = ranked[0]?.candidate;
      if (best?.url) {
        console.log(`Selected Openverse image "${best.title || "untitled"}" for ${part.label}`);
        return {
          sourceType: "openverse",
          remoteUrl: best.url,
          attribution: {
            title: best.title,
            creator: best.creator,
            source: best.source,
            license: best.license,
            foreignLandingUrl: best.foreign_landing_url,
          },
        };
      }
    } catch (error) {
      console.log(`Openverse error for "${query}": ${error.message}`);
    }

    await sleep(SEARCH_DELAY_MS);
  }

  return null;
}

async function downloadImageBuffer(remoteUrl) {
  const response = await fetch(remoteUrl, {
    headers: {
      "User-Agent": "speedway-image-updater/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`URL did not return an image (${contentType || "unknown content type"})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function buildPlaceholderSvg(part) {
  const label = part.label;
  const query = part.search.toUpperCase();

  return `
    <svg width="1400" height="1000" viewBox="0 0 1400 1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${part.color}" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="1400" height="1000" fill="url(#bg)" />
      <circle cx="1150" cy="210" r="180" fill="rgba(255,255,255,0.08)" />
      <circle cx="240" cy="830" r="220" fill="rgba(255,255,255,0.06)" />
      <text x="90" y="180" font-size="44" font-family="Arial, Helvetica, sans-serif" fill="#e2e8f0" letter-spacing="8">SPEEDWAY ANOINTED ENT</text>
      <text x="90" y="450" font-size="120" font-weight="700" font-family="Arial, Helvetica, sans-serif" fill="#ffffff">${label}</text>
      <text x="90" y="540" font-size="40" font-family="Arial, Helvetica, sans-serif" fill="#cbd5e1">Generated fallback used when no safe public-domain photo matched.</text>
      <text x="90" y="800" font-size="30" font-family="Arial, Helvetica, sans-serif" fill="#94a3b8">${query}</text>
    </svg>
  `;
}

async function uploadBuffer(buffer, folder, filenameBase) {
  const storagePath = `${folder}/${filenameBase}-${crypto.randomUUID()}.jpg`;
  const processed = await sharp(buffer)
    .resize({ width: 1400, height: 1000, fit: "cover", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, processed, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function uploadPlaceholder(part) {
  const svg = buildPlaceholderSvg(part);
  const buffer = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  return uploadBuffer(buffer, "generated-product-images", slugify(part.key));
}

async function resolveImageUrlForPart(part, sampleProduct, cache) {
  if (cache.has(part.key)) {
    return cache.get(part.key);
  }

  let result = null;
  const onlineMatch = await searchOpenverseImage(part, sampleProduct);

  if (onlineMatch?.remoteUrl) {
    try {
      const imageBuffer = await downloadImageBuffer(onlineMatch.remoteUrl);
      const publicUrl = await uploadBuffer(imageBuffer, "product-images", slugify(part.key));
      result = {
        publicUrl,
        sourceType: onlineMatch.sourceType,
        attribution: onlineMatch.attribution,
      };
    } catch (error) {
      console.log(`Remote image failed for ${part.label}: ${error.message}`);
    }
  }

  if (!result) {
    const publicUrl = await uploadPlaceholder(part);
    result = {
      publicUrl,
      sourceType: "generated-placeholder",
      attribution: null,
    };
  }

  cache.set(part.key, result);
  return result;
}

async function fetchAllProducts() {
  const allProducts = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select(`
        id,
        name,
        description,
        image_url,
        categories (name),
        brands (name),
        models (name),
        years (label)
      `)
      .eq("is_deleted", false)
      .range(offset, offset + FETCH_BATCH_SIZE - 1)
      .order("id");

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    if (!data || data.length === 0) {
      hasMore = false;
      continue;
    }

    allProducts.push(...data);
    offset += FETCH_BATCH_SIZE;

    if (data.length < FETCH_BATCH_SIZE) {
      hasMore = false;
    }
  }

  return allProducts;
}

async function updateProductIds(productIds, imageUrl) {
  for (let index = 0; index < productIds.length; index += UPDATE_BATCH_SIZE) {
    const batch = productIds.slice(index, index + UPDATE_BATCH_SIZE);
    const { error } = await supabaseAdmin
      .from("products")
      .update({ image_url: imageUrl })
      .in("id", batch);

    if (error) {
      throw new Error(`Failed to update products: ${error.message}`);
    }
  }
}

async function updateProductImages() {
  console.log("Fetching products from Supabase...\n");
  const products = await fetchAllProducts();

  console.log(`Fetched ${products.length} active products`);

  const groupedProducts = new Map();

  for (const product of products) {
    const part = detectPart(product);
    const existingGroup = groupedProducts.get(part.key) || {
      part,
      products: [],
    };

    existingGroup.products.push(product);
    groupedProducts.set(part.key, existingGroup);
  }

  console.log(`Detected ${groupedProducts.size} unique product image groups\n`);

  const imageCache = new Map();
  const summary = {
    updated: 0,
    groups: 0,
    openverse: 0,
    generated: 0,
  };

  for (const group of groupedProducts.values()) {
    const sampleProduct = group.products[0];
    console.log(`[group ${summary.groups + 1}/${groupedProducts.size}] ${group.part.label} -> ${group.products.length} products`);

    const image = await resolveImageUrlForPart(group.part, sampleProduct, imageCache);
    await updateProductIds(
      group.products.map((product) => product.id),
      image.publicUrl
    );

    summary.groups += 1;
    summary.updated += group.products.length;
    summary[image.sourceType === "openverse" ? "openverse" : "generated"] += 1;

    console.log(`Updated ${group.products.length} products with ${image.sourceType} image`);
    await sleep(SEARCH_DELAY_MS);
  }

  console.log("\n" + "=".repeat(60));
  console.log("IMAGE UPDATE SUMMARY");
  console.log("=".repeat(60));
  console.log(`Products updated: ${summary.updated}`);
  console.log(`Groups processed: ${summary.groups}`);
  console.log(`Openverse uploads: ${summary.openverse}`);
  console.log(`Generated placeholders: ${summary.generated}`);
  console.log(`Bucket: ${BUCKET}`);
  console.log("=".repeat(60));
}

updateProductImages().catch((error) => {
  console.error("\nImage update failed:");
  console.error(error);
  process.exit(1);
});
