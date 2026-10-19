"use client";

import { useTranslations } from "next-intl";

const COOKIE_NAME = "nordway_cookie_consent";

/**
 * Lets a visitor withdraw or change a cookie choice they already made.
 * Clearing the cookie and reloading is enough — the layout's server-side
 * `hasConsent` check (see app/[locale]/layout.tsx) then re-evaluates to
 * false, so <CookieConsent /> renders again and they can pick fresh.
 */
export function CookiePreferencesLink() {
  const t = useTranslations("footer");

  function reopen() {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={reopen}
      className="text-left hover:text-foreground"
    >
      {t("cookiePreferences")}
    </button>
  );
}
