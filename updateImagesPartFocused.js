import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESSKEY;
const PEXELS_KEY = process.env.PEXEL_API;

const PART_IMAGE_QUERIES = {
  'bonnet': ['car hood', 'automobile hood', 'engine hood', 'car hood open'],
  'door': ['car door', 'vehicle door', 'auto door', 'car door close up'],
  'doors': ['car door', 'vehicle door', 'auto door', 'car door close up'],
  'bumper': ['car bumper', 'automobile bumper', 'front bumper', 'car fender bumper'],
  'bumpers': ['car bumper', 'automobile bumper', 'front bumper', 'car fender bumper'],
  'fender': ['car fender', 'automobile fender', 'wheel arch', 'car body panel'],
  'fenders': ['car fender', 'automobile fender', 'wheel arch', 'car body panel'],
  'headlight': ['car headlight', 'automobile headlight', 'headlight bulb', 'car lamp'],
  'headlights': ['car headlight', 'automobile headlight', 'headlight bulb', 'car lamp'],
  'head light': ['car headlight', 'automobile headlight', 'headlight bulb', 'car lamp'],
  'head lights': ['car headlight', 'automobile headlight', 'headlight bulb', 'car lamp'],
  'taillight': ['car taillight', 'automobile taillight', 'tail light', 'rear light'],
  'taillights': ['car taillight', 'automobile taillight', 'tail light', 'rear light'],
  'tail light': ['car taillight', 'automobile taillight', 'tail light', 'rear light'],
  'tail lights': ['car taillight', 'automobile taillight', 'tail light', 'rear light'],
  'mirror': ['car side mirror', 'car mirror', 'vehicle mirror', 'wing mirror'],
  'mirrors': ['car side mirror', 'car mirror', 'vehicle mirror', 'wing mirror'],
  'side mirror': ['car side mirror', 'car mirror', 'vehicle mirror', 'wing mirror'],
  'side mirrors': ['car side mirror', 'car mirror', 'vehicle mirror', 'wing mirror'],
  'grille': ['car grille', 'automobile grille', 'front grille', 'radiator grille'],
  'grilles': ['car grille', 'automobile grille', 'front grille', 'radiator grille'],
  'gear': ['car gear stick', 'gear knob', 'manual transmission', 'car gear shift'],
  'gear level': ['car gear stick', 'gear knob', 'manual transmission', 'car gear shift'],
  'gear levels': ['car gear stick', 'gear knob', 'manual transmission', 'car gear shift'],
};

const CONCURRENT = 10;
const DELAY = 300;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getPartType(name) {
  const lower = name.toLowerCase();
  for (const [key, _] of Object.entries(PART_IMAGE_QUERIES)) {
    if (lower.includes(key)) {
      return key;
    }
  }
  return null;
}

function getSearchQueries(productName) {
  const partType = getPartType(productName);
  
  if (partType && PART_IMAGE_QUERIES[partType]) {
    return PART_IMAGE_QUERIES[partType];
  }
  
  return ['auto part', 'car spare part', 'automobile component'];
}

async function searchUnsplash(query) {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch {
    return null;
  }
}

async function searchPexels(query) {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.photos?.[0]?.src?.large || null;
  } catch {
    return null;
  }
}

async function searchAll(queries) {
  for (const query of queries) {
    let url = await searchUnsplash(query);
    if (url) return { url, source: 'unsplash', query };
    await sleep(DELAY);

    url = await searchPexels(query);
    if (url) return { url, source: 'pexels', query };
    await sleep(DELAY);
  }
  return null;
}

async function findImage(productName) {
  const queries = getSearchQueries(productName);
  return await searchAll(queries);
}

async function processProduct(product) {
  const result = await findImage(product.name);
  if (result) {
    await supabase.from('products').update({ image_url: result.url }).eq('id', product.id);
    return { id: product.id, name: product.name.substring(0, 40), query: result.query, source: result.source };
  }
  return null;
}

async function runBatch(products, startIdx) {
  let semaphore = 0;
  const promises = [];

  for (let i = 0; i < products.length; i++) {
    while (semaphore >= CONCURRENT) {
      await new Promise(r => setTimeout(r, 50));
    }

    const idx = startIdx + i;
    const p = (async () => {
      semaphore++;
      try {
        return await processProduct(products[i]).then(r => r ? { ...r, idx } : null);
      } finally {
        semaphore--;
      }
    })();
    promises.push(p);
  }

  return Promise.all(promises);
}

async function updateProducts() {
  console.log('='.repeat(60));
  console.log('UPDATING PRODUCT IMAGES - PART FOCUSED SEARCH');
  console.log('='.repeat(60));
  
  const { data: products, count } = await supabase
    .from('products')
    .select('id, name', { count: 'exact' })
    .eq('is_deleted', false);
  
  console.log(`Total products to update: ${count}\n`);
  
  const results = { updated: 0, failed: 0, failedProducts: [] };
  
  const BATCH_SIZE = 50;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const batchResults = await runBatch(batch, i + 1);
    
    for (const r of batchResults) {
      if (r) {
        results.updated++;
        console.log(`[${r.id.substring(0,8)}] "${r.name}" => "${r.query}" (${r.source})`);
      } else {
        results.failed++;
      }
    }
    
    console.log(`\nProgress: ${Math.min(i + BATCH_SIZE, products.length)}/${products.length} | Updated: ${results.updated} | Failed: ${results.failed}\n`);
  }

  console.log('='.repeat(60));
  console.log(`DONE: ${results.updated} updated, ${results.failed} failed`);
  console.log('='.repeat(60));
}

updateProducts().catch(console.error);
