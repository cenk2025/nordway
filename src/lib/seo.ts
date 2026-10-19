import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ACTIVE_LOCALES, routing, type Locale } from "@/i18n/routing";
import { flags } from "@/lib/flags";

/**
 * SEO — SINGLE SOURCE OF TRUTH for canonical URLs, hreflang alternates, page
 * metadata and the public route list (sitemap, llms.txt).
 *
 * The site origin comes from NEXT_PUBLIC_SITE_URL (set it to
 * https://nordway.fi once the domain is live); every canonical, sitemap and
 * JSON-LD URL follows it automatically.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://nordway.fi").replace(/\/$/, "");
export const SITE_NAME = "Nordway";

/** Locales worth indexing: sv/no only once they're real translations. */
export function indexableLocales(): readonly Locale[] {
  return flags.localesSvNo ? routing.locales : ACTIVE_LOCALES;
}

/** Public, indexable marketing routes (no locale prefix). Key = `seo.pages.*`. */
export const PUBLIC_PAGES = [
  { path: "", key: "home", priority: 1.0 },
  { path: "/finland-guide", key: "guide", priority: 0.9 },
  { path: "/services", key: "services", priority: 0.9 },
  { path: "/eligibility", key: "eligibility", priority: 0.9 },
  { path: "/pricing", key: "pricing", priority: 0.8 },
  { path: "/how-it-works", key: "howItWorks", priority: 0.8 },
  { path: "/faq", key: "faq", priority: 0.8 },
  { path: "/about", key: "about", priority: 0.6 },
  { path: "/contact", key: "contact", priority: 0.6 },
  { path: "/legal/privacy", key: "privacy", priority: 0.2 },
  { path: "/legal/terms", key: "terms", priority: 0.2 },
  { path: "/legal/cookies", key: "cookies", priority: 0.2 },
  { path: "/legal/disclaimer", key: "disclaimer", priority: 0.2 },
] as const;

export type PageKey = (typeof PUBLIC_PAGES)[number]["key"];

export const absoluteUrl = (locale: string, path = "") => `${SITE_URL}/${locale}${path}`;

/** hreflang map for a path, including x-default (English). */
export function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of indexableLocales()) languages[l] = absoluteUrl(l, path);
  languages["x-default"] = absoluteUrl(routing.defaultLocale, path);
  return languages;
}

const OG_LOCALE: Record<Locale, string> = {
  tr: "tr_TR",
  fi: "fi_FI",
  en: "en_GB",
  sv: "sv_SE",
  no: "nb_NO",
};

/**
 * Localized metadata for a public page: title, description, canonical,
 * hreflang alternates, Open Graph and Twitter. Copy lives in
 * messages/*.json → `seo.pages.<key>`.
 */
export async function pageMetadata(locale: string, key: PageKey): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "seo" });
  const page = PUBLIC_PAGES.find((p) => p.key === key)!;
  const title = t(`pages.${key}.title`);
  const description = t(`pages.${key}.description`);
  const url = absoluteUrl(locale, page.path);
  const indexable = (indexableLocales() as readonly string[]).includes(locale);

  return {
    // The home title is a complete brand line; other pages use the layout template.
    title: key === "home" ? { absolute: title } : title,
    description,
    keywords: t(`pages.${key}.keywords`),
    alternates: { canonical: url, languages: languageAlternates(page.path) },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale as Locale] ?? "en_GB",
      url,
      title,
      description,
      images: [{ url: `${SITE_URL}/${locale}/opengraph-image`, width: 1200, height: 630, alt: t("ogAlt") }],
    },
    twitter: { card: "summary_large_image", title, description },
    // Placeholder-translated locales (sv/no before launch) mirror English — keep them out of the index.
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
  };
}

/** For signed-in / transactional pages that must never appear in search. */
export const PRIVATE_ROBOTS: Metadata["robots"] = { index: false, follow: false };
