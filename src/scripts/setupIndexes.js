import "dotenv/config";
import { connectToMongoDB, getDB } from "../services/mongodb.js";

async function setupIndexes() {
  console.log("Setting up MongoDB indexes...");
  
  try {
    await connectToMongoDB();
    const db = getDB();
    
    const indexes = [
      { collection: "users", indexes: [{ key: { email: 1 }, options: { unique: true } }] },
      { collection: "products", indexes: [
        { key: { category_id: 1 } },
        { key: { brand_id: 1 } },
        { key: { model_id: 1 } },
        { key: { year_id: 1 } },
        { key: { status: 1 } },
        { key: { is_deleted: 1 } },
        { key: { name: "text" } },
        { key: { created_at: -1 } }
      ]},
      { collection: "categories", indexes: [
        { key: { name: 1 } }
      ]},
      { collection: "brands", indexes: [
        { key: { name: 1 } },
        { key: { is_hidden: 1 } }
      ]},
      { collection: "models", indexes: [
        { key: { brand_id: 1 } },
        { key: { name: 1 } }
      ]},
      { collection: "years", indexes: [
        { key: { label: -1 } }
      ]},
      { collection: "orders", indexes: [
        { key: { user_id: 1 } },
        { key: { status: 1 } },
        { key: { created_at: -1 } }
      ]},
      { collection: "order_items", indexes: [
        { key: { order_id: 1 } },
        { key: { product_id: 1 } }
      ]},
      { collection: "order_status_events", indexes: [
        { key: { order_id: 1 } }
      ]},
      { collection: "order_returns", indexes: [
        { key: { order_id: 1 } },
        { key: { user_id: 1 } }
      ]},
      { collection: "coupons", indexes: [
        { key: { code: 1 }, options: { unique: true } },
        { key: { active: 1 } }
      ]},
      { collection: "coupon_redemptions", indexes: [
        { key: { coupon_id: 1 } },
        { key: { user_id: 1 } }
      ]},
      { collection: "reviews", indexes: [
        { key: { product_id: 1 } },
        { key: { user_id: 1 } }
      ]},
      { collection: "cart", indexes: [
        { key: { user_id: 1 } },
        { key: { status: 1 } }
      ]},
      { collection: "cart_items", indexes: [
        { key: { cart_id: 1 } },
        { key: { product_id: 1 } }
      ]},
      { collection: "wishlist", indexes: [
        { key: { user_id: 1 } }
      ]},
      { collection: "wishlist_items", indexes: [
        { key: { wishlist_id: 1 } },
        { key: { product_id: 1 } }
      ]},
      { collection: "addresses", indexes: [
        { key: { user_id: 1 } }
      ]},
      { collection: "notifications", indexes: [
        { key: { user_id: 1 } },
        { key: { created_at: -1 } }
      ]},
      { collection: "inventory", indexes: [
        { key: { product_id: 1 } },
        { key: { reason: 1 } },
        { key: { created_at: -1 } }
      ]},
      { collection: "stock_subscriptions", indexes: [
        { key: { user_id: 1 } },
        { key: { product_id: 1 } }
      ]},
      { collection: "audit_logs", indexes: [
        { key: { actor_id: 1 } },
        { key: { entity: 1 } },
        { key: { created_at: -1 } }
      ]},
      { collection: "sales", indexes: [
        { key: { created_at: -1 } },
        { key: { product_id: 1 } }
      ]},
      { collection: "settings", indexes: [
        { key: { singleton: 1 }, options: { unique: true, sparse: true } }
      ]}
    ];
    
    for (const { collection: coll, indexes: idxs } of indexes) {
      console.log(`Creating indexes for ${coll}...`);
      for (const idx of idxs) {
        try {
          await db.collection(coll).createIndex(idx.key, idx.options);
          console.log(`  - Created index: ${JSON.stringify(idx.key)}`);
        } catch (err) {
          if (err.code === 85 || err.code === 86) {
            console.log(`  - Index already exists: ${JSON.stringify(idx.key)}`);
          } else {
            console.error(`  - Error: ${err.message}`);
          }
        }
      }
    }
    
    console.log("\nIndex setup complete!");
  } catch (err) {
    console.error("Failed to setup indexes:", err);
    process.exit(1);
  }
}

setupIndexes();
