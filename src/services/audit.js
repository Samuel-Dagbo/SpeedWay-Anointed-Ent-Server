import { collections } from "./mongodb.js";

export async function logAudit({ actor_id, action, entity, entity_id, metadata }) {
  try {
    await collections.auditLogs().insertOne({
      actor_id,
      action,
      entity,
      entity_id: entity_id ? String(entity_id) : null,
      metadata: metadata || {},
      created_at: new Date()
    });
  } catch (err) {
    console.warn("[audit] failed", err?.message || err);
  }
}
