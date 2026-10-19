import { getTranslations } from "next-intl/server";
import { Compass, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CookiePreferencesLink } from "@/features/consent/cookie-preferences-link";
import { VoonIqLogo } from "@/components/vooniq-logo";

/** Public footer with legal links, compliance signals and the VOON IQ byline. */
export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const year = new Date().getFullYear();

  const columns: { id: string; heading: string; links: { href: string; label: string }[] }[] = [
    {
      id: "services",
      heading: tn("services"),
      links: [
        { href: "/services", label: tn("services") },
        { href: "/finland-guide", label: tn("guide") },
        { href: "/how-it-works", label: tn("howItWorks") },
        { href: "/pricing", label: tn("pricing") },
      ],
    },
    {
      id: "company",
      heading: t("company"),
      links: [
        { href: "/about", label: tn("about") },
        { href: "/faq", label: tn("faq") },
        { href: "/contact", label: tn("contact") },
      ],
    },
    {
      id: "legal",
      heading: t("legal"),
      links: [
        { href: "/legal/privacy", label: t("privacy") },
        { href: "/legal/terms", label: t("terms") },
        { href: "/legal/cookies", label: t("cookies") },
        { href: "/legal/disclaimer", label: t("disclaimer") },
      ],
    },
  ];

  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-display text-lg font-extrabold">
              <Compass className="h-6 w-6 text-primary" aria-hidden />
              Nordway
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">{t("tagline")}</p>
            <p className="inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2 py-1 text-xs font-medium [color:var(--success)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("gdprBadge")}
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.id}>
              <h3 className="mb-3 text-sm font-semibold">{col.heading}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
                {col.id === "legal" && (
                  <li>
                    <CookiePreferencesLink />
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t pt-6 text-xs text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">{t("notAuthorityTitle")}</p>
          <p className="max-w-3xl leading-relaxed">{t("notAuthorityBody")}</p>
          <div className="mt-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <span className="flex items-center gap-2">
              © {year} Nordway · {t("voonByline")}
              <VoonIqLogo height={16} />
            </span>
            <span>{t("compliance")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
