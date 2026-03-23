import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Real car part photos from Unsplash (no clipart)
const partImages = {
  "Bonnet": "https://images.unsplash.com/photo-1626668011683-958c221b6d2c?w=800&q=80",
  "BONNET": "https://images.unsplash.com/photo-1626668011683-958c221b6d2c?w=800&q=80",
  "Bonnets": "https://images.unsplash.com/photo-1626668011683-958c221b6d2c?w=800&q=80",
  "Hood": "https://images.unsplash.com/photo-1626668011683-958c221b6d2c?w=800&q=80",
  "Hoods": "https://images.unsplash.com/photo-1626668011683-958c221b6d2c?w=800&q=80",
  "Head Lights": "https://images.unsplash.com/photo-1566140967404-b8b3952fe0de?w=800&q=80",
  "Headlight": "https://images.unsplash.com/photo-1566140967404-b8b3952fe0de?w=800&q=80",
  "Headlightes": "https://images.unsplash.com/photo-1566140967404-b8b3952fe0de?w=800&q=80",
  "Head Lamps": "https://images.unsplash.com/photo-1566140967404-b8b3952fe0de?w=800&q=80",
  "Headlight Bezels": "https://images.unsplash.com/photo-1566140967404-b8b3952fe0de?w=800&q=80",
  "Headlight Bezel": "https://images.unsplash.com/photo-1566140967404-b8b3952fe0de?w=800&q=80",
  "Tail Lights": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Tail Light": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Taillight": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Taillights": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Tail Light Bezels": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Tail Light Bezel": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Bumpers": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
  "Bumper": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
  "Front Bumpers": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
  "Rear Bumpers": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
  "Bumpers Covers": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
  "Bumper Cover": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
  "Doors": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "Door": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "Fenders": "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
  "Fender": "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
  "Fender Flares": "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
  "Fender Flare": "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
  "Fender Liners": "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
  "Fender Liner": "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
  "Side Mirrors": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80",
  "Side Mirror": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80",
  "Mirror": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80",
  "Mirrors": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80",
  "Grilles": "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&q=80",
  "Grille": "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&q=80",
  "Gear Levels": "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80",
  "Gear Level": "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80",
  "Gear Knob": "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80",
  "Gearbox": "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80",
  "Radiators": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
  "Radiator": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
  "Wheels": "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=800&q=80",
  "Wheel": "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=800&q=80",
  "Rims": "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=800&q=80",
  "Rim": "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=800&q=80",
  "Windshields": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&q=80",
  "Windshield": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&q=80",
  "Wind Screen": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&q=80",
  "Windows": "https://images.unsplash.com/photo-1506059612708-99d6c258160e?w=800&q=80",
  "Window": "https://images.unsplash.com/photo-1506059612708-99d6c258160e?w=800&q=80",
  "Side Glass": "https://images.unsplash.com/photo-1506059612708-99d6c258160e?w=800&q=80",
  "Trunk Lids": "https://images.unsplash.com/photo-1626668011683-958c221b6d2c?w=800&q=80",
  "Trunk Lid": "https://images.unsplash.com/photo-1626668011683-958c221b6d2c?w=800&q=80",
  "Tailgates": "https://images.unsplash.com/photo-1626668011683-958c221b6d2c?w=800&q=80",
  "Tailgate": "https://images.unsplash.com/photo-1626668011683-958c221b6d2c?w=800&q=80",
  "Sensors": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Sensor": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Park Sensors": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Spoilers": "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
  "Spoiler": "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80",
  "Roof Racks": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Roof Rack": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Running Boards": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "Running Board": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "Steps": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "Step": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "Door Handles": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "Door Handle": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "Handles": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "Handle": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "Fuel Doors": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "Fuel Door": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "Fuel Caps": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "Fuel Cap": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "Lock Sets": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Lock Set": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Locks": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Lock": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Switches": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Switch": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Buttons": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Button": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "Emblems": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
  "Emblem": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
  "Badges": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
  "Badge": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
};

const defaultImage = "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80";

function getPartImage(name) {
  if (!name) return defaultImage;
  
  const lower = name.toLowerCase().replace(/\s+/g, ' ');
  
  if (/bonnet|hood|bonnets|hoods/.test(lower)) {
    return partImages["Bonnet"];
  }
  if (/head\s*light|headlamp|headlamp/.test(lower)) {
    return partImages["Head Lights"];
  }
  if (/tail\s*light|taillight/.test(lower)) {
    return partImages["Tail Lights"];
  }
  if (/bumper/.test(lower)) {
    return partImages["Bumpers"];
  }
  if (/door[^h]/.test(lower)) {
    return partImages["Doors"];
  }
  if (/fender/.test(lower)) {
    return partImages["Fenders"];
  }
  if (/mirror/.test(lower)) {
    return partImages["Side Mirrors"];
  }
if (/grille|grill/.test(lower)) {
    return partImages["Grilles"];
  }
  if (/gear|knob/.test(lower)) {
    return partImages["Gear Levels"];
  }
  if (/radiator/.test(lower)) {
    return partImages["Radiators"];
  }
  if (/wheel|rim/.test(lower)) {
    return partImages["Wheels"];
  }
  if (/windshield|wind\s*screen|window/.test(lower)) {
    return partImages["Windshields"];
  }
  if (/trunk|tailgate/.test(lower)) {
    return partImages["Trunk Lids"];
  }
  if (/sensor/.test(lower)) {
    return partImages["Sensors"];
  }
  if (/spoiler/.test(lower)) {
    return partImages["Spoilers"];
  }
  if (/roof\s*rack/.test(lower)) {
    return partImages["Roof Racks"];
  }
  if (/running\s*board|step/.test(lower)) {
    return partImages["Running Boards"];
  }
  if (/door\s*handle/.test(lower)) {
    return partImages["Door Handles"];
  }
  if (/fuel\s*door|fuel\s*cap/.test(lower)) {
    return partImages["Fuel Doors"];
  }
  if (/emblem|badge/.test(lower)) {
    return partImages["Emblems"];
  }
  if (/lock|switch|button/.test(lower)) {
    return partImages["Lock Sets"];
  }
  
  return defaultImage;
}

async function updatePartImages() {
  console.log("Fetching products...\n");

  let allProducts = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data } = await supabase
      .from("products")
      .select("id, name")
      .eq("is_deleted", false)
      .range(offset, offset + limit - 1);

    if (!data || data.length === 0) break;
    allProducts.push(...data);
    console.log(`Fetched ${allProducts.length}...`);
    if (data.length < limit) break;
    offset += limit;
  }

  console.log(`\nTotal: ${allProducts.length}\n`);
  
  const batchSize = 500;
  let completed = 0;

  for (let i = 0; i < allProducts.length; i += batchSize) {
    const batch = allProducts.slice(i, i + batchSize);
    
    const promises = batch.map(async (p) => {
      const imageUrl = getPartImage(p.name);
      const { error } = await supabase.from("products").update({ image_url: imageUrl }).eq("id", p.id);
      return !error;
    });

    const results = await Promise.all(promises);
    completed += results.filter(Boolean).length;
    console.log(`[${i + batch.length}/${allProducts.length}] Updated: ${completed}`);
  }

  console.log(`\nCOMPLETED: ${completed} products updated`);
}

updatePartImages().catch(console.error);
