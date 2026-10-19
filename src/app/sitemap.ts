import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, absoluteUrl, indexableLocales, languageAlternates } from "@/lib/seo";
import { flags } from "@/lib/flags";

// Every public page in every indexable locale, each with its hreflang siblings.
export default function sitemap(): MetadataRoute.Sitemap {
  if (!flags.allowIndexing) return [];
  const lastModified = new Date();
  return indexableLocales().flatMap((locale) =>
    PUBLIC_PAGES.map((page) => ({
      url: absoluteUrl(locale, page.path),
      lastModified,
      changeFrequency: page.priority >= 0.8 ? ("weekly" as const) : ("monthly" as const),
      priority: page.priority,
      alternates: { languages: languageAlternates(page.path) },
    }))
  );
}
