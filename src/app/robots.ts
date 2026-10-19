import type { MetadataRoute } from "next";
import { flags } from "@/lib/flags";
import { SITE_URL } from "@/lib/seo";

// Signed-in and transactional areas never belong in a search or AI index.
const PRIVATE = ["/api/", "/*/admin", "/*/account", "/*/dashboard", "/*/onboarding", "/*/auth/", "/*/login", "/*/signup"];

// AI search / answer-engine crawlers, allowed explicitly so the guide, FAQ and
// services pages can be cited in ChatGPT, Claude, Perplexity, Gemini, Copilot.
const AI_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "bingbot",
];

// Pre-launch: block all crawlers until NEXT_PUBLIC_ALLOW_INDEXING=true.
export default function robots(): MetadataRoute.Robots {
  if (!flags.allowIndexing) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
