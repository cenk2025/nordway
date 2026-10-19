import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Derived once at build time so the CSP can allow exactly the Supabase
// project this deployment talks to — never a wildcard.
const supabaseOrigin = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes("your-project")) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
})();
const supabaseWs = supabaseOrigin.replace(/^https:/, "wss:");

// Not a nonce-based policy (that requires per-request wiring through the
// proxy into every Server Component that renders a script) — 'unsafe-inline'
// on script-src is a deliberate, understood trade-off: React already escapes
// all rendered content (no dangerouslySetInnerHTML anywhere in this codebase),
// so the main value here is locking down connect-src/frame-ancestors/object-src
// against exfiltration, clickjacking and plugin-based attacks, not blocking
// inline scripts specifically.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://images.unsplash.com${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "font-src 'self' data:",
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin} ${supabaseWs}` : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Pre-launch: keep every page out of search results (see src/app/robots.ts).
  ...(process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true"
    ? []
    : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]),
];

const nextConfig: NextConfig = {
  images: {
    // Demo/placeholder imagery is served from Unsplash during scaffolding and
    // will be replaced with self-hosted assets in /public/demo. See CLAUDE.md.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // A parent lockfile on the shared T7 drive triggers a harmless "inferred
  // workspace root" warning in dev — safe to ignore.
};

export default withNextIntl(nextConfig);
