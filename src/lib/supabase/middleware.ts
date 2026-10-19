import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

/**
 * Route prefixes (after the locale segment) that require an authenticated user.
 * `eligibility` and any future assessment/test routes are gated too — tests are
 * member-only, so visitors must sign up / sign in before taking them.
 */
const PROTECTED_PREFIXES = [
  "dashboard",
  "onboarding",
  "admin",
  "account",
  "eligibility",
];

/**
 * Refresh the Supabase auth session on every request and enforce route
 * protection. Called from `proxy.ts` (Next.js 16's renamed middleware).
 *
 * We mutate cookies on the `response` produced by next-intl so both the locale
 * routing and the refreshed session cookies survive in a single response.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured yet (placeholder env), skip silently so the
  // app still renders during local scaffolding.
  if (!url || !anon || url.includes("your-project")) {
    return guardProtectedRoutes(request, response, null);
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return guardProtectedRoutes(request, response, user?.id ?? null);
  } catch {
    // A corrupted/truncated Supabase auth cookie (e.g. a missing chunk) makes
    // getUser() throw while parsing the token JSON. Clear those cookies so the
    // app self-heals to a logged-out state instead of 500-ing every route; the
    // user simply signs in again to write a fresh, valid cookie.
    for (const c of request.cookies.getAll()) {
      if (c.name.startsWith("sb-") && c.name.includes("-auth-token")) {
        response.cookies.set(c.name, "", { maxAge: 0, path: "/" });
      }
    }
    return guardProtectedRoutes(request, response, null);
  }
}

/** Redirect unauthenticated users away from protected route groups. */
function guardProtectedRoutes(
  request: NextRequest,
  response: NextResponse,
  userId: string | null
): NextResponse {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];
  const hasLocale = routing.locales.includes(maybeLocale as never);
  const locale = hasLocale ? maybeLocale : routing.defaultLocale;
  const rest = hasLocale ? segments.slice(1) : segments;

  const isProtected = PROTECTED_PREFIXES.includes(rest[0]);

  if (isProtected && !userId) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${locale}/login`;
    // Keep the full original target (path + query) so the user lands back where
    // they intended after signing in.
    loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
