"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail, emailLayout, adminEmail, escapeHtml } from "@/lib/email";
import { estimate, ADDON_IDS, type AddonId } from "@/lib/pricing";
import { PERMIT_CATEGORIES, type PermitCategory } from "@/config/migri-2026";

const InputSchema = z.object({
  category: z.enum(PERMIT_CATEGORIES as [string, ...string[]]),
  tier: z.enum(["start", "pilot", "scale"]),
  complexity: z.enum(["simple", "standard", "complex"]),
  targetCity: z.string().max(120).optional().default(""),
  incomeRegion: z.enum(["capital", "majorCity", "other"]).optional(),
  familyMembers: z.number().int().min(0).max(20),
  urgent: z.boolean(),
  addons: z.array(z.enum(ADDON_IDS as [string, ...string[]])).default([]),
  notes: z.string().max(2000).optional().default(""),
});

export type OnboardingInput = z.infer<typeof InputSchema>;

export type OnboardingResult =
  | { ok: true; id: string }
  | { ok: false; error: "unauthenticated" | "invalid" | "db" };

/** Short human-friendly case reference, e.g. NW-2026-7F3KQK. */
function makeReference(): string {
  const year = new Date().getFullYear();
  // 6 base36 chars + timestamp tail → collision-negligible (a unique index on
  // applications.reference backstops it — see 0004_hardening.sql).
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const tail = Date.now().toString(36).slice(-2).toUpperCase();
  return `NW-${year}-${rand}${tail}`;
}

/**
 * Create an application from the onboarding wizard and snapshot a draft quote
 * computed by the central pricing engine. The quote is an ESTIMATE (status
 * 'draft') — finalised only after expert review. RLS ensures the row is owned
 * by the caller (we set user_id = auth uid explicitly).
 */
export async function createApplicationWithQuote(
  raw: OnboardingInput
): Promise<OnboardingResult> {
  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const input = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const category = input.category as PermitCategory;
  const reference = makeReference();

  // 1) application
  const { data: app, error: appErr } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      category,
      tier: input.tier,
      complexity: input.complexity,
      target_country: "FI",
      target_city: input.targetCity || null,
      income_region: input.incomeRegion ?? null,
      family_members: input.familyMembers,
      urgent: input.urgent,
      notes: input.notes || null,
      status: "submitted",
      reference,
    })
    .select("id")
    .single();

  if (appErr || !app) return { ok: false, error: "db" };
  const applicationId = app.id as string;

  // 2) add-ons
  if (input.addons.length > 0) {
    await supabase.from("application_addons").insert(
      input.addons.map((addon_id) => ({ application_id: applicationId, addon_id }))
    );
  }

  // 3) quote snapshot from the central engine
  const q = estimate({
    category,
    tier: input.tier,
    complexity: input.complexity,
    familyMembers: input.familyMembers,
    urgent: input.urgent,
    addons: input.addons as AddonId[],
  });

  // Quotes are money — write them server-authoritatively via the service-role
  // client so clients can never forge prices (RLS denies client quote writes;
  // see 0005_quotes_server_only.sql). Values come only from the pricing engine.
  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    return { ok: false, error: "db" };
  }
  const { error: quoteErr } = await admin.from("quotes").insert({
    application_id: applicationId,
    user_id: user.id,
    lines: q.lines,
    subtotal_net: q.subtotal,
    vat_rate: q.vatRate,
    range_net_min: q.rangeNet.min,
    range_net_max: q.rangeNet.max,
    range_gross_min: q.rangeGross.min,
    range_gross_max: q.rangeGross.max,
    official_fee_min: q.officialFee.min,
    official_fee_max: q.officialFee.max,
    currency: "EUR",
    status: "draft",
  });
  if (quoteErr) return { ok: false, error: "db" };

  // Notify the back-office of the new case (best-effort; no-op without email).
  const to = adminEmail();
  if (to) {
    await sendEmail({
      to,
      subject: `New case — ${reference}`,
      html: emailLayout(
        "New relocation case",
        `A new <strong>${category}</strong> case (<strong>${reference}</strong>) was submitted for ${escapeHtml(input.targetCity || "Finland")}. Review it in the admin back-office.`
      ),
    });
  }

  revalidatePath("/dashboard", "page");
  return { ok: true, id: applicationId };
}
