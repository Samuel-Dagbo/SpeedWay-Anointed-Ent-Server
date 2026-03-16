import "dotenv/config";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "../services/supabaseClient.js";

const email = process.env.ADMIN_EMAIL || "speedwayanointedent@gmail.com";
const password = process.env.ADMIN_PASSWORD || "StrongPassword123!";
const fullName = process.env.ADMIN_NAME || "Speedway Admin";

async function run() {
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  const passwordHash = await bcrypt.hash(password, 10);

  if (existing?.id) {
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        full_name: fullName,
        role: "admin",
        password_hash: passwordHash,
        email_verified: true
      })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabaseAdmin.from("users").insert({
      email,
      full_name: fullName,
      role: "admin",
      password_hash: passwordHash,
      email_verified: true
    });
    if (error) throw error;
  }

  console.log(`[seed] Admin user ready: ${email}`);
}

run().catch((err) => {
  console.error("[seed] Failed to seed admin user:", err);
  process.exit(1);
});
