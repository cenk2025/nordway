import { defineRouting } from "next-intl/routing";

/**
 * Locale routing for Nordway. Five languages are defined; `tr`, `fi`, `en` are
 * fully translated and active. `sv` and `no` ship as "coming soon" — they are
 * shown in the language switcher but rendered with a placeholder catalogue
 * until the feature flag (NEXT_PUBLIC_FEATURE_LOCALES_SV_NO) is enabled.
 *
 * URLs are always prefixed (`/tr/...`, `/fi/...`) so they are unambiguous for a
 * multilingual public tool. Default falls back to the browser language, then en.
 */
export const routing = defineRouting({
  locales: ["tr", "fi", "en", "sv", "no"],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: true,
});

export type Locale = (typeof routing.locales)[number];

/** Locales with complete, production-ready translations. */
export const ACTIVE_LOCALES = ["tr", "fi", "en"] as const;

/** Locales shown but not yet fully translated ("Tulossa pian / Coming soon"). */
export const COMING_SOON_LOCALES = ["sv", "no"] as const;

export const LOCALE_LABELS: Record<Locale, { native: string; flag: string }> = {
  tr: { native: "Türkçe", flag: "🇹🇷" },
  fi: { native: "Suomi", flag: "🇫🇮" },
  en: { native: "English", flag: "🇬🇧" },
  sv: { native: "Svenska", flag: "🇸🇪" },
  no: { native: "Norsk", flag: "🇳🇴" },
};
