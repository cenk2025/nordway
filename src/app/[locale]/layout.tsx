import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChatWidget } from "@/features/assistant/chat-widget";
import { CookieConsent } from "@/features/consent/cookie-consent";
import { JsonLd } from "@/components/json-ld";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { organizationLd, websiteLd } from "@/lib/structured-data";
import "../globals.css";

// Public Sans — the U.S. federal government's official typeface (USWDS).
// Used for both body and display type: sharp, no-nonsense, built for trust.
const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-sans-var",
  display: "swap",
});

const publicSansDisplay = Public_Sans({
  subsets: ["latin"],
  variable: "--font-display-var",
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: {
      default: t("pages.home.title"),
      template: "%s · Nordway",
    },
    description: t("orgDescription"),
    applicationName: SITE_NAME,
    metadataBase: new URL(SITE_URL),
    // Search Console / Bing Webmaster ownership tokens (Bing also feeds ChatGPT and Copilot search).
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
      other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
        : undefined,
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const hasConsent = Boolean(cookieStore.get("nordway_cookie_consent"));
  // Theme is stored in a cookie and applied server-side as a class on <html> —
  // no inline <script>, so there's no no-flash flicker and nothing for React 19
  // to warn about (even across client-side locale switches).
  const themeClass = cookieStore.get("nordway_theme")?.value === "dark" ? "dark" : "";
  const tSeo = await getTranslations({ locale, namespace: "seo" });

  return (
    <html lang={locale} className={themeClass} suppressHydrationWarning>
      <body className={`${publicSans.variable} ${publicSansDisplay.variable} antialiased`}>
        <JsonLd data={[organizationLd(locale, tSeo("orgDescription")), websiteLd(locale)]} />
        <NextIntlClientProvider>
          <Providers>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
              <ChatWidget />
              {!hasConsent && <CookieConsent />}
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
