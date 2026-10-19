"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { sendEmail, emailLayout, adminEmail, escapeHtml } from "@/lib/email";
import { CONTACT_EMAIL } from "@/config/contact";
import { TERMS_VERSION, WITHDRAWAL_PERIOD_DAYS } from "@/config/legal";
import { routing } from "@/i18n/routing";
import { formatEurRange } from "@/lib/pricing";

const Schema = z.object({
  quoteId: z.string().uuid(),
  applicationId: z.string().uuid(),
  locale: z.string().max(5),
  // Contract terms must be accepted to conclude the contract.
  acceptTerms: z.literal(true),
  // Optional EXPRESS request to start work inside the withdrawal period.
  startEarly: z.boolean(),
});

export type AcceptResult = { ok: true } | { ok: false; error: string };

/**
 * User accepts their quote — this concludes the (distance-sold) service
 * contract. Quote writes are locked to server/admin (see 0005), so we verify
 * ownership with the user's RLS-scoped client, record the Terms acceptance and
 * the withdrawal-right choice in `consents` (see 0008), then flip only the
 * status to 'accepted' via the service-role client — the user can never touch
 * prices. The consumer gets a confirmation on a durable medium (email) with the
 * withdrawal information; the admin is notified.
 */
export async function acceptQuote(raw: z.input<typeof Schema>): Promise<AcceptResult> {
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { quoteId, applicationId, startEarly } = parsed.data;
  const locale = (routing.locales as readonly string[]).includes(parsed.data.locale)
    ? parsed.data.locale
    : routing.defaultLocale;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  // Ownership check via RLS (select is scoped to the owner).
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, application_id, user_id, status, range_gross_min, range_gross_max, official_fee_min, official_fee_max")
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

  // The consent record is the legal proof — never accept without it.
  const { error: consentErr } = await admin.from("consents").insert([
    { user_id: user.id, purpose: "quote_acceptance", choice: "accepted_terms", notice_version: TERMS_VERSION },
    {
      user_id: user.id,
      purpose: "withdrawal_waiver",
      choice: startEarly ? "start_early_requested" : "start_after_withdrawal_period",
      notice_version: TERMS_VERSION,
    },
  ]);
  if (consentErr) return { ok: false, error: "db" };

  const { error } = await admin.from("quotes").update({ status: "accepted" }).eq("id", quoteId);
  if (error) return { ok: false, error: "db" };

  await logAudit({
    userId: user.id,
    action: "quote.accept",
    entity: "quote",
    entityId: quoteId,
    meta: { applicationId, startEarly, termsVersion: TERMS_VERSION },
  });

  const { data: app } = await admin
    .from("applications")
    .select("reference, category")
    .eq("id", applicationId)
    .maybeSingle();
  const ref = app?.reference ?? applicationId;
  const acceptedAt = new Date();
  const withdrawalEnds = new Date(acceptedAt.getTime() + WITHDRAWAL_PERIOD_DAYS * 86_400_000);
  const fmtDate = (d: Date) =>
    d.toLocaleDateString(locale === "tr" ? "tr-TR" : locale === "fi" ? "fi-FI" : "en-GB", {
      timeZone: "Europe/Helsinki",
    });

  // Confirmation on a durable medium (best-effort; no-op without email configured).
  if (user.email) {
    const t = await getTranslations({ locale, namespace: "quoteAccept.email" });
    const serviceFee = formatEurRange(Number(quote.range_gross_min), Number(quote.range_gross_max), locale);
    const officialFee = formatEurRange(Number(quote.official_fee_min), Number(quote.official_fee_max), locale);
    const p = (s: string) => `<p>${escapeHtml(s)}</p>`;
    await sendEmail({
      to: user.email,
      replyTo: CONTACT_EMAIL,
      subject: t("subject", { ref }),
      html: emailLayout(
        escapeHtml(t("heading")),
        [
          p(t("intro", { ref, date: fmtDate(acceptedAt) })),
          p(t("serviceFee", { amount: serviceFee })),
          p(t("officialFee", { amount: officialFee })),
          p(t("terms", { version: TERMS_VERSION })),
          `<h2 style="font-size:15px;margin:20px 0 8px">${escapeHtml(t("withdrawalTitle"))}</h2>`,
          p(t("withdrawalBody", { days: WITHDRAWAL_PERIOD_DAYS, date: fmtDate(withdrawalEnds), email: CONTACT_EMAIL })),
          p(startEarly ? t("startEarlyYes") : t("startEarlyNo", { date: fmtDate(withdrawalEnds) })),
          `<h2 style="font-size:15px;margin:20px 0 8px">${escapeHtml(t("formTitle"))}</h2>`,
          `<p style="white-space:pre-line;background:#f4f6f9;padding:12px 16px;border-radius:8px">${escapeHtml(
            t("formBody", { email: CONTACT_EMAIL, ref })
          )}</p>`,
        ].join("")
      ),
    });
  }

  const to = adminEmail();
  if (to) {
    await sendEmail({
      to,
      subject: `Quote accepted — ${ref}`,
      html: emailLayout(
        "A client accepted their quote",
        `Case <strong>${escapeHtml(ref)}</strong> (${escapeHtml(app?.category ?? "—")}) — the applicant accepted the estimate (Terms ${TERMS_VERSION}).<br>` +
          (startEarly
            ? `<strong>Start now:</strong> the client expressly asked for work to begin during the withdrawal period.`
            : `<strong>Do not start before ${fmtDate(withdrawalEnds)}:</strong> the client did NOT ask for an early start — work begins after the ${WITHDRAWAL_PERIOD_DAYS}-day withdrawal period.`) +
          `<br>Review it and send the payment instructions / next steps.`
      ),
    });
  }

  revalidatePath(`/dashboard/${applicationId}`, "page");
  return { ok: true };
}
