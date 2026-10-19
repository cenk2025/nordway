"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export type DeadlineResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const, userId: null };
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { supabase, ok: data?.role === "admin", userId: user.id };
}

const AddSchema = z.object({
  applicationId: z.string().uuid(),
  kind: z.enum(["permit_expiry", "appointment", "document_validity", "submission", "other"]),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(300).optional().default(""),
});

/** Admin: add a deadline to a case. user_id is copied from the application. */
export async function addDeadline(raw: z.input<typeof AddSchema>): Promise<DeadlineResult> {
  const parsed = AddSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { supabase, ok, userId } = await requireAdmin();
  if (!ok) return { ok: false, error: "forbidden" };

  const { data: app } = await supabase
    .from("applications")
    .select("user_id")
    .eq("id", parsed.data.applicationId)
    .maybeSingle();
  if (!app) return { ok: false, error: "not_found" };

  const { error } = await supabase.from("case_deadlines").insert({
    application_id: parsed.data.applicationId,
    user_id: app.user_id as string,
    kind: parsed.data.kind,
    due_date: parsed.data.dueDate,
    note: parsed.data.note || null,
  });
  if (error) return { ok: false, error: "db" };

  await logAudit({
    userId,
    action: "deadline.add",
    entity: "application",
    entityId: parsed.data.applicationId,
    meta: { kind: parsed.data.kind, dueDate: parsed.data.dueDate },
  });
  revalidatePath(`/admin/cases/${parsed.data.applicationId}`, "page");
  return { ok: true };
}

/** Admin: toggle a deadline done/undone. */
export async function toggleDeadline(id: string, done: boolean): Promise<DeadlineResult> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) return { ok: false, error: "forbidden" };
  const { data, error } = await supabase
    .from("case_deadlines")
    .update({ done })
    .eq("id", id)
    .select("application_id")
    .maybeSingle();
  if (error) return { ok: false, error: "db" };
  if (data) revalidatePath(`/admin/cases/${data.application_id}`, "page");
  return { ok: true };
}

/** Admin: delete a deadline. */
export async function deleteDeadline(id: string): Promise<DeadlineResult> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) return { ok: false, error: "forbidden" };
  const { data } = await supabase
    .from("case_deadlines")
    .select("application_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("case_deadlines").delete().eq("id", id);
  if (error) return { ok: false, error: "db" };
  if (data) revalidatePath(`/admin/cases/${data.application_id}`, "page");
  return { ok: true };
}
