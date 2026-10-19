import "server-only";

/**
 * Transactional email via Resend's REST API (no SDK dependency). Degrades
 * gracefully: with no RESEND_API_KEY it silently no-ops, so the app works in
 * dev/preview without email configured. Server-only.
 *
 * Env: RESEND_API_KEY (secret), RESEND_FROM (an address on a Resend-verified
 * domain, e.g. "Nordway <info@voon.fi>" — same setup as voon.fi / ads.voon.fi),
 * NORDWAY_ADMIN_EMAIL (where new-case / accepted-quote alerts go).
 */
const FROM = process.env.RESEND_FROM || "Nordway <onboarding@resend.dev>";

/**
 * Escape a user-supplied string before interpolating it into `emailLayout`
 * HTML. Free-text fields (e.g. a case's target city) can otherwise inject
 * markup into transactional emails opened by the admin's mail client.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function adminEmail(): string | null {
  return process.env.NORDWAY_ADMIN_EMAIL?.trim() || null;
}

export function isEmailConfigured(): boolean {
  const k = process.env.RESEND_API_KEY;
  return Boolean(k && k.trim() && !k.includes("your-resend"));
}

/** Send one email. Never throws — returns false on any failure or when unconfigured. */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  if (!isEmailConfigured() || !opts.to) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) console.error("Resend error:", res.status, await res.text().catch(() => ""), "from:", FROM);
    return res.ok;
  } catch {
    return false;
  }
}

/** Minimal branded HTML wrapper for transactional emails. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#1a1f2b">
    <div style="font-weight:800;font-size:20px;color:#22304a;padding:16px 0">Nordway</div>
    <h1 style="font-size:18px;margin:0 0 12px">${title}</h1>
    <div style="font-size:14px;line-height:1.6;color:#3a4557">${bodyHtml}</div>
    <hr style="border:none;border-top:1px solid #e6e3dc;margin:24px 0"/>
    <p style="font-size:12px;color:#8a93a5">A VOON I/O service · Nordway is not a government authority and does not replace Migri. Official applications are made via Enter Finland.</p>
  </div>`;
}
