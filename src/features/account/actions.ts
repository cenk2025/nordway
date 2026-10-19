"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export type DeleteResult = { ok: true } | { ok: false; error: string };

/**
 * GDPR account deletion. Removes the user's storage objects, then deletes the
 * auth user via the service-role admin API — DB rows (profile, applications,
 * quotes, documents, messages) cascade away via ON DELETE CASCADE. Finally the
 * local session is cleared. Irreversible.
 */
export async function deleteAccount(): Promise<DeleteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const userId = user.id;

  try {
    const admin = createServiceRoleClient();

    // 1) Remove the user's files from the private bucket (their uid folder).
    const { data: appList } = await supabase.from("applications").select("id");
    const prefixes = [userId, ...((appList ?? []).map((a) => `${userId}/${a.id}`))];
    for (const prefix of prefixes) {
      const { data: files } = await admin.storage.from("documents").list(prefix);
      if (files && files.length > 0) {
        await admin.storage
          .from("documents")
          .remove(files.map((f) => `${prefix}/${f.name}`));
      }
    }

    // Record the deletion request before the rows cascade away.
    await logAudit({ userId, action: "account.delete", entity: "profile", entityId: userId });

    // 2) Delete the auth user (cascades all DB rows owned by them).
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return { ok: false, error: "delete_failed" };

    // 3) Clear the local session.
    await supabase.auth.signOut();
    return { ok: true };
  } catch {
    return { ok: false, error: "delete_failed" };
  }
}
