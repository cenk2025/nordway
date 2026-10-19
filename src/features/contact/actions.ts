"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { CONTACT_EMAIL } from "@/config/contact";
import { routing } from "@/i18n/routing";
import { sendEmail, emailLayout, escapeHtml, isEmailConfigured } from "@/lib/email";
import { isRateLimited } from "@/lib/rate-limit";

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(160),
  message: z.string().trim().min(1).max(4000),
  locale: z.string().max(5),
  consent: z.literal(true),
  // Honeypot — real visitors never see or fill this field.
  website: z.string().max(200).optional(),
});

export type ContactResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "rate_limited" | "unavailable" };

const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 600;

const nl2br = (value: string) => escapeHtml(value).replace(/\n/g, "<br>");

/**
 * Contact-form submission: emails the team inbox (reply-to = the visitor) and
 * sends the visitor an auto-reply in the site language. Same Resend setup as
 * voon.fi / ads.voon.fi. No data is stored — the email is the record.
 */
export async function submitContact(raw: z.input<typeof ContactSchema>): Promise<ContactResult> {
  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { name, email, message, website } = parsed.data;

  // Honeypot filled in: pretend success so bots do not retry.
  if (website) return { ok: true };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  if (await isRateLimited(`contact:${ip}`, RATE_LIMIT, RATE_WINDOW_SECONDS)) {
    return { ok: false, error: "rate_limited" };
  }

  if (!isEmailConfigured()) {
    console.error("Contact form: RESEND_API_KEY is not set");
    return { ok: false, error: "unavailable" };
  }

  const locale = (routing.locales as readonly string[]).includes(parsed.data.locale)
    ? parsed.data.locale
    : routing.defaultLocale;
  const submitted = new Date().toLocaleString("fi-FI", { timeZone: "Europe/Helsinki" });

  const sent = await sendEmail({
    to: process.env.CONTACT_TO?.trim() || CONTACT_EMAIL,
    replyTo: email,
    subject: `Nordway — new enquiry from ${name}`,
    html: emailLayout(
      "New contact-form enquiry",
      `<p><b>Name:</b> ${escapeHtml(name)}<br><b>Email:</b> ${escapeHtml(email)}<br><b>Language:</b> ${escapeHtml(locale)}</p>
       <p>${nl2br(message)}</p>
       <p style="color:#8a93a5;font-size:12px">Sent ${escapeHtml(submitted)} · Reply to this email to answer the visitor.</p>`
    ),
  });
  if (!sent) return { ok: false, error: "unavailable" };

  // The team already has the enquiry, so a failed auto-reply must not fail the request.
  const t = await getTranslations({ locale, namespace: "contactPage.autoReply" });
  await sendEmail({
    to: email,
    replyTo: CONTACT_EMAIL,
    subject: t("subject"),
    html: emailLayout(
      t("heading"),
      `<p>${escapeHtml(t("greeting", { name }))}</p>
       <p>${escapeHtml(t("body"))}</p>
       <blockquote style="margin:16px 0;padding:12px 16px;background:#f4f6f9;border-left:4px solid #22304a">${nl2br(message)}</blockquote>
       <p>${escapeHtml(t("urgent", { email: CONTACT_EMAIL }))}</p>`
    ),
  });

  return { ok: true };
}
