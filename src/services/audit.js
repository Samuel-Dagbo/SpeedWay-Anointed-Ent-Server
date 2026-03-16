import { supabaseAdmin } from "./supabaseClient.js";

export async function logAudit({ actor_id, action, entity, entity_id, metadata }) {
  try {
    await supabaseAdmin.from("audit_logs").insert({
      actor_id,
      action,
      entity,
      entity_id: entity_id ? String(entity_id) : null,
      metadata: metadata || null
    });
  } catch (err) {
    console.warn("[audit] failed", err?.message || err);
  }
}
