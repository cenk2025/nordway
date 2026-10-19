"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { sendEmail, emailLayout, adminEmail } from "@/lib/email";

const Schema = z.object({
  quoteId: z.string().uuid(),
  applicationId: z.string().uuid(),
});

export type AcceptResult = { ok: true } | { ok: false; error: string };

/**
 * User accepts their quote. Quote writes are locked to server/admin (see
 * 0005), so we verify ownership with the user's RLS-scoped client, then flip
 * only the status to 'accepted' via the service-role client — the user can
 * never touch prices. Notifies the admin by email (no-op if email unconfigured).
 */
export async function acceptQuote(raw: z.infer<typeof Schema>): Promise<AcceptResult> {
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { quoteId, applicationId } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  // Ownership check via RLS (select is scoped to the owner).
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, application_id, user_id, status")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote || quote.application_id !== applicationId || quote.user_id !== user.id) {
    return { ok: false, error: "forbidden" };
  }
  if (quote.status === "accepted") return { ok: true };

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    return { ok: false, error: "db" };
  }
  const { error } = await admin.from("quotes").update({ status: "accepted" }).eq("id", quoteId);
  if (error) return { ok: false, error: "db" };

  await logAudit({
    userId: user.id,
    action: "quote.accept",
    entity: "quote",
    entityId: quoteId,
    meta: { applicationId },
  });

  const to = adminEmail();
  if (to) {
    const { data: app } = await admin
      .from("applications")
      .select("reference, category")
      .eq("id", applicationId)
      .maybeSingle();
    await sendEmail({
      to,
      subject: `Quote accepted — ${app?.reference ?? applicationId}`,
      html: emailLayout(
        "A client accepted their quote",
        `Case <strong>${app?.reference ?? applicationId}</strong> (${app?.category ?? "—"}) — the applicant accepted the estimate. Review it and send the payment instructions / next steps.`
      ),
    });
  }

  revalidatePath(`/dashboard/${applicationId}`, "page");
  return { ok: true };
}
