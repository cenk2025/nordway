/** Feature flags, read from public env. Keep flag reads centralized here. */
export const flags = {
  /** Render sv/no as fully active locales rather than "coming soon". */
  localesSvNo: process.env.NEXT_PUBLIC_FEATURE_LOCALES_SV_NO === "true",
  /** Let search engines index the site. Off until public launch. */
  allowIndexing: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true",
} as const;

/** True when Supabase env points at a real project (not the scaffold placeholder). */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url && anon && !url.includes("your-project") && anon !== "your-anon-key"
  );
}

/**
 * True when a real Anthropic API key is present (server-only). When false, the
 * AI eligibility assistant and admin case-assessment draft degrade gracefully
 * instead of erroring.
 */
export function isAiConfigured(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return Boolean(key && key.trim() && !key.includes("your-anthropic"));
}
