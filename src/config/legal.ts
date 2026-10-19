/**
 * ============================================================================
 * Legal / GDPR reference data — SINGLE SOURCE OF TRUTH.
 * ============================================================================
 *
 * The notice version below is what gets stamped onto every consent record
 * (signup, cookie choice) in the `consents` table, and must match the
 * `lastUpdated` date shown in `legalPrivacy` / `legalCookies` across every
 * message catalogue (en/fi/tr). Bump BOTH together whenever the notice text
 * materially changes — that's what lets us answer "what did this user agree
 * to, and when" later.
 *
 * Sub-processor list must stay in sync with the "Sharing" section of the
 * privacy notice (messages/*.json → legalPrivacy.sections) and with what the
 * code actually calls (see src/lib/ai/client.ts for Anthropic, src/lib/email.ts
 * for Resend, src/lib/supabase/server.ts for Supabase).
 *
 * Supabase project region: confirmed `eu-north-1` (AWS Stockholm) — inside
 * the EU/EEA, so Supabase needs no international-transfer safeguard. Anthropic
 * and Resend remain US-based (see the "International data transfers" section
 * of the privacy notice). If the Supabase project is ever migrated to a
 * non-EU region, update `location` below AND that section in every locale.
 */

export const PRIVACY_NOTICE_VERSION = "2026-08-04" as const;
export const COOKIE_NOTICE_VERSION = "2026-08-04" as const;

export type SubProcessor = {
  name: string;
  purpose: string;
  /** Where this processor actually stores/processes the data — confirm before changing. */
  location: "EU" | "US";
};

export const SUB_PROCESSORS: SubProcessor[] = [
  { name: "Supabase", purpose: "Database, authentication and document storage", location: "EU" },
  { name: "Anthropic", purpose: "AI-assisted case review (server-side only)", location: "US" },
  { name: "Resend", purpose: "Transactional email (notifications, confirmations)", location: "US" },
];
