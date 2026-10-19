import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Append an entry to the audit log. Uses the service-role client because
 * `audit_log` grants no client insert policy (admins can only read). Best-effort:
 * an audit failure must never block or fail the primary action.
 */
export async function logAudit(entry: {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createServiceRoleClient();
    await admin.from("audit_log").insert({
      user_id: entry.userId ?? null,
      action: entry.action,
      entity: entry.entity ?? null,
      entity_id: entry.entityId ?? null,
      meta: entry.meta ?? {},
    });
  } catch {
    // Swallow — auditing is non-critical and must not surface to the user.
  }
}
