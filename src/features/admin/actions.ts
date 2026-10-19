"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { sendEmail, emailLayout } from "@/lib/email";
import { VAT_RATE } from "@/config/migri-2026";

export type AdminResult = { ok: true } | { ok: false; error: string };

/** Verify the caller is an admin. RLS also enforces this, but we fail fast. */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const, userId: null };
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { supabase, ok: data?.role === "admin", userId: user.id };
}

const STATUSES = [
  "draft",
  "submitted",
  "in_review",
  "docs_needed",
  "ready",
  "submitted_to_authority",
  "decided",
  "closed",
] as const;

const StatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(STATUSES),
});

/** Admin: move an application along its workflow. */
export async function updateApplicationStatus(
  raw: z.infer<typeof StatusSchema>
): Promise<AdminResult> {
  const parsed = StatusSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { supabase, ok, userId } = await requireAdmin();
  if (!ok) return { ok: false, error: "forbidden" };

  const { error } = await supabase
    .from("applications")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.applicationId);
  if (error) return { ok: false, error: "db" };

  await logAudit({
    userId,
    action: "application.status_update",
    entity: "application",
    entityId: parsed.data.applicationId,
    meta: { status: parsed.data.status },
  });

  // Notify the applicant (best-effort; no-op without email configured).
  try {
    const admin = createServiceRoleClient();
    const { data: appRow } = await admin
      .from("applications")
      .select("user_id, reference")
      .eq("id", parsed.data.applicationId)
      .maybeSingle();
    if (appRow) {
      const { data } = await admin.auth.admin.getUserById(appRow.user_id as string);
      const to = data.user?.email;
      if (to) {
        await sendEmail({
          to,
          subject: `Update on your Nordway case ${appRow.reference ?? ""}`.trim(),
          html: emailLayout(
            "Your case status changed",
            `Your case <strong>${appRow.reference ?? ""}</strong> is now: <strong>${parsed.data.status.replace(/_/g, " ")}</strong>. Sign in to see the details and next steps.`
          ),
        });
      }
    }
  } catch {
    // ignore email failures
  }

  revalidatePath(`/admin/cases/${parsed.data.applicationId}`, "page");
  revalidatePath("/admin", "page");
  return { ok: true };
}

const DocSchema = z.object({
  documentId: z.string().uuid(),
  applicationId: z.string().uuid(),
  status: z.enum(["pending", "in_review", "approved", "fix_needed"]),
  reviewNote: z.string().max(500).optional().default(""),
});

/** Admin: approve / flag a document during review. */
export async function updateDocumentStatus(
  raw: z.input<typeof DocSchema>
): Promise<AdminResult> {
  const parsed = DocSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { supabase, ok, userId } = await requireAdmin();
  if (!ok) return { ok: false, error: "forbidden" };

  const { error } = await supabase
    .from("documents")
    .update({ status: parsed.data.status, review_note: parsed.data.reviewNote || null })
    .eq("id", parsed.data.documentId);
  if (error) return { ok: false, error: "db" };

  await logAudit({
    userId,
    action: "document.review",
    entity: "document",
    entityId: parsed.data.documentId,
    meta: { status: parsed.data.status, applicationId: parsed.data.applicationId },
  });
  revalidatePath(`/admin/cases/${parsed.data.applicationId}`, "page");
  return { ok: true };
}

const QuoteSchema = z.object({
  quoteId: z.string().uuid(),
  applicationId: z.string().uuid(),
  rangeNetMin: z.number().min(0).max(100000),
  rangeNetMax: z.number().min(0).max(100000),
  status: z.enum(["draft", "sent", "accepted", "declined"]),
});

/**
 * Admin: confirm / adjust the quote after review. Editing the net range
 * recomputes the gross (VAT-inclusive) range so the two stay consistent.
 */
export async function updateQuote(raw: z.infer<typeof QuoteSchema>): Promise<AdminResult> {
  const parsed = QuoteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { supabase, ok, userId } = await requireAdmin();
  if (!ok) return { ok: false, error: "forbidden" };

  const min = Math.min(parsed.data.rangeNetMin, parsed.data.rangeNetMax);
  const max = Math.max(parsed.data.rangeNetMin, parsed.data.rangeNetMax);

  const { error } = await supabase
    .from("quotes")
    .update({
      range_net_min: min,
      range_net_max: max,
      range_gross_min: Math.round(min * (1 + VAT_RATE)),
      range_gross_max: Math.round(max * (1 + VAT_RATE)),
      status: parsed.data.status,
    })
    .eq("id", parsed.data.quoteId);
  if (error) return { ok: false, error: "db" };

  await logAudit({
    userId,
    action: "quote.update",
    entity: "quote",
    entityId: parsed.data.quoteId,
    meta: { status: parsed.data.status, rangeNet: [min, max], applicationId: parsed.data.applicationId },
  });
  revalidatePath(`/admin/cases/${parsed.data.applicationId}`, "page");
  return { ok: true };
}
