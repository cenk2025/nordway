"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { COOKIE_NOTICE_VERSION } from "@/config/legal";

/**
 * Records a cookie-preference choice against the current session, if one
 * exists. Anonymous visitors are a no-op here — for them the browser cookie
 * itself (see cookie-consent.tsx, which encodes choice + version + timestamp)
 * is the consent record. Uses the service-role client because `consents`
 * grants no client insert policy (mirrors src/lib/audit.ts). Best-effort:
 * must never block the banner from dismissing.
 */
export async function recordCookieConsent(choice: "all" | "essential"): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const admin = createServiceRoleClient();
    await admin.from("consents").insert({
      user_id: user.id,
      purpose: "cookie_preferences",
      choice,
      notice_version: COOKIE_NOTICE_VERSION,
    });
  } catch {
    // Swallow — consent logging is best-effort and must not surface to the user.
  }
}
