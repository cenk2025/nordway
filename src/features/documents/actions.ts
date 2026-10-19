"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "documents";

const RecordSchema = z.object({
  applicationId: z.string().uuid(),
  docType: z.string().min(1).max(60),
  fileName: z.string().min(1).max(255),
  storagePath: z.string().min(1).max(500),
});

export type DocActionResult =
  | { ok: true }
  | { ok: false; error: "unauthenticated" | "invalid" | "db" | "forbidden" };

/**
 * Record metadata for a file the client already uploaded to the private bucket.
 * The storage path must live under the caller's own uid folder (enforced by
 * storage RLS); we additionally verify the application belongs to the caller.
 */
export async function recordDocument(raw: z.infer<typeof RecordSchema>): Promise<DocActionResult> {
  const parsed = RecordSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const input = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  // Path must be scoped to this user's folder.
  if (!input.storagePath.startsWith(`${user.id}/`)) {
    return { ok: false, error: "forbidden" };
  }

  // Verify the target application is accessible to the caller. RLS on
  // `documents` only enforces user_id = auth.uid(); it does NOT stop a user
  // from attaching a row to someone else's application_id. The applications
  // RLS (owner or admin) makes this lookup return null for a foreign case.
  const { data: app } = await supabase
    .from("applications")
    .select("id")
    .eq("id", input.applicationId)
    .maybeSingle();
  if (!app) return { ok: false, error: "forbidden" };

  const { error } = await supabase.from("documents").insert({
    application_id: input.applicationId,
    user_id: user.id,
    doc_type: input.docType,
    file_name: input.fileName,
    storage_path: input.storagePath,
    status: "pending",
  });
  if (error) return { ok: false, error: "db" };

  revalidatePath(`/dashboard/${input.applicationId}`, "page");
  return { ok: true };
}

/**
 * Generate a short-lived signed URL to view/download a document. RLS on the
 * documents row + storage object ensures only the owner (or an admin) can.
 */
export async function getSignedUrl(
  documentId: string
): Promise<{ ok: true; url: string } | { ok: false }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return { ok: false };

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path as string, 60);
  if (error || !data) return { ok: false };
  return { ok: true, url: data.signedUrl };
}

/** Delete a document (storage object + metadata row). Owner or admin via RLS. */
export async function deleteDocument(documentId: string): Promise<DocActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, application_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return { ok: false, error: "forbidden" };

  await supabase.storage.from(BUCKET).remove([doc.storage_path as string]);
  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (error) return { ok: false, error: "db" };

  revalidatePath(`/dashboard/${doc.application_id}`, "page");
  return { ok: true };
}
