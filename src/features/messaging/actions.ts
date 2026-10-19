"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail, emailLayout, adminEmail } from "@/lib/email";

const SendSchema = z.object({
  applicationId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
});

export type SendResult =
  | { ok: true }
  | { ok: false; error: "unauthenticated" | "invalid" | "db" };

/**
 * Post a message to a case thread. sender_id is forced to the caller; RLS
 * ensures the caller participates in the application (owner) or is an admin.
 * sender_role is read from the caller's profile so the UI can show who spoke.
 */
export async function sendMessage(raw: z.infer<typeof SendSchema>): Promise<SendResult> {
  const parsed = SendSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { applicationId, body } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const senderIsAdmin = profile?.role === "admin";
  const { error } = await supabase.from("messages").insert({
    application_id: applicationId,
    sender_id: user.id,
    sender_role: senderIsAdmin ? "admin" : "user",
    body,
  });
  if (error) return { ok: false, error: "db" };

  // Notify the other party (best-effort; no-op without email configured).
  try {
    const admin = createServiceRoleClient();
    const { data: appRow } = await admin
      .from("applications")
      .select("user_id, reference")
      .eq("id", applicationId)
      .maybeSingle();
    const ref = appRow?.reference ?? "";
    if (senderIsAdmin && appRow) {
      // Admin → applicant
      const { data } = await admin.auth.admin.getUserById(appRow.user_id as string);
      const to = data.user?.email;
      if (to)
        await sendEmail({
          to,
          subject: `New message on your Nordway case ${ref}`.trim(),
          html: emailLayout("You have a new message", `Your Nordway expert replied on case <strong>${ref}</strong>. Sign in to read and respond.`),
        });
    } else if (!senderIsAdmin) {
      // Applicant → admin
      const to = adminEmail();
      if (to)
        await sendEmail({
          to,
          subject: `New client message — ${ref}`.trim(),
          html: emailLayout("New client message", `The applicant sent a message on case <strong>${ref}</strong>. Open the admin back-office to respond.`),
        });
    }
  } catch {
    // ignore email failures
  }

  revalidatePath(`/dashboard/${applicationId}`, "page");
  return { ok: true };
}

/** Mark messages from the other party as read when the thread is opened. */
export async function markThreadRead(applicationId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("application_id", applicationId)
    .neq("sender_id", user.id)
    .is("read_at", null);
}
