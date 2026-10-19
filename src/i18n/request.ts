import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

type Messages = Record<string, unknown>;

/** Deep-merge `overlay` onto `base` so missing keys fall back to the base. */
function deepMerge(base: Messages, overlay: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    const existing = out[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      out[key] = deepMerge(existing as Messages, value as Messages);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Per-request i18n config. English is the base catalogue; every other locale is
 * layered on top so any not-yet-translated key (notably for the "coming soon"
 * sv/no locales) gracefully falls back to English instead of throwing.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const base = (await import("../../messages/en.json")).default as Messages;
  const messages =
    locale === "en"
      ? base
      : deepMerge(base, (await import(`../../messages/${locale}.json`)).default as Messages);

  return { locale, messages };
});
