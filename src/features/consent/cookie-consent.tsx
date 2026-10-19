"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Cookie } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { COOKIE_NOTICE_VERSION } from "@/config/legal";
import { recordCookieConsent } from "@/features/consent/actions";

const COOKIE_NAME = "nordway_cookie_consent";

const LEGAL_LINKS = [
  { href: "/legal/privacy", key: "privacy" },
  { href: "/legal/terms", key: "terms" },
  { href: "/legal/cookies", key: "cookies" },
  { href: "/legal/disclaimer", key: "disclaimer" },
] as const;

/**
 * GDPR cookie-consent banner. Renders only when no consent cookie is present
 * (the layout checks server-side, so returning visitors never see a flash).
 *
 * The cookie value itself is the consent record for anonymous visitors —
 * it encodes the choice, the notice version it was given against, and the
 * timestamp (`choice|version|isoTimestamp`), not just a bare "all"/"essential"
 * flag — so if it's ever inspected, it proves what was agreed to and when.
 * If a session already exists, the same choice is additionally written to
 * the `consents` table server-side (see features/consent/actions.ts) for a
 * durable, queryable record.
 */
export function CookieConsent() {
  const t = useTranslations("cookieConsent");
  const tf = useTranslations("footer");
  const [hidden, setHidden] = useState(false);

  function choose(value: "all" | "essential") {
    const record = `${value}|${COOKIE_NOTICE_VERSION}|${new Date().toISOString()}`;
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(record)}; path=/; max-age=31536000; SameSite=Lax`;
    setHidden(true);
    void recordCookieConsent(value);
  }

  if (hidden) return null;

  return (
    <div
      role="dialog"
      aria-label={t("title")}
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[60] border-t bg-card/95 p-4 shadow-2xl backdrop-blur sm:p-5"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex gap-3">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">{t("title")}</p>
            <p className="text-sm text-muted-foreground">
              {t("body")}{" "}
              {LEGAL_LINKS.map((l, i) => (
                <span key={l.href}>
                  <Link href={l.href} className="text-primary underline-offset-2 hover:underline">
                    {tf(l.key)}
                  </Link>
                  {i < LEGAL_LINKS.length - 1 ? " · " : "."}
                </span>
              ))}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2 lg:ml-auto">
          <Button variant="outline" size="sm" onClick={() => choose("essential")}>
            {t("essentialOnly")}
          </Button>
          <Button variant="cta" size="sm" onClick={() => choose("all")}>
            {t("acceptAll")}
          </Button>
        </div>
      </div>
    </div>
  );
}
