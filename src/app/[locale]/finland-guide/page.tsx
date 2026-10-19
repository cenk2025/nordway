import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container, Section } from "@/components/marketing";
import { Disclaimer } from "@/components/disclaimer";
import { JsonLd } from "@/components/json-ld";
import {
  PERMIT_CATEGORIES,
  CATEGORY_THRESHOLDS,
  OFFICIAL_FEE_RANGE,
  MIGRI_LAST_VERIFIED,
} from "@/config/migri-2026";
import { thresholdText } from "@/lib/migri-format";
import { formatEurRange } from "@/lib/pricing";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { articleLd, breadcrumbLd, faqLd, howToLd } from "@/lib/structured-data";

/** Bump when the guide copy or the Migri figures it shows are re-checked. */
const GUIDE_REVIEWED = "2026-10-19";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "guide");
}

type Item = { title: string; body: string };
type Qa = { q: string; a: string };

/**
 * Evergreen "how to move to Finland" guide — the main organic / AI-search
 * landing page. Answer-first structure, every figure read from
 * config/migri-2026.ts, with Article + HowTo + FAQPage + Breadcrumb JSON-LD.
 */
export default async function FinlandGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guidePage");
  const ts = await getTranslations("seo");
  const tc = await getTranslations("categories");
  const tcd = await getTranslations("categoryDesc");

  const steps = t.raw("steps") as Item[];
  const arrival = t.raw("arrival") as Item[];
  // FAQ answers carry figures from the Migri config, so they never drift.
  const figures: Record<string, string> = {
    workSalary: String(CATEGORY_THRESHOLDS.work.grossMonthly ?? ""),
    blueCardSalary: String(CATEGORY_THRESHOLDS.blueCard.grossMonthly ?? ""),
    studentMonthly: String(CATEGORY_THRESHOLDS.student.netMonthly ?? ""),
    studentYearly: String(CATEGORY_THRESHOLDS.student.firstYearFunds ?? ""),
  };
  const faq = (t.raw("faq") as Qa[]).map(({ q, a }) => ({
    q,
    a: a.replace(/\{(\w+)\}/g, (m, k: string) => figures[k] ?? m),
  }));

  const url = absoluteUrl(locale, "/finland-guide");
  const sections = [
    { id: "routes", title: t("routesTitle") },
    { id: "steps", title: t("stepsTitle") },
    { id: "costs", title: t("costsTitle") },
    { id: "arrival", title: t("arrivalTitle") },
    { id: "faq", title: t("faqTitle") },
  ];

  return (
    <>
      <JsonLd
        data={[
          articleLd({
            locale,
            url,
            headline: t("title"),
            description: ts("pages.guide.description"),
            dateModified: GUIDE_REVIEWED,
          }),
          howToLd({
            locale,
            name: t("stepsTitle"),
            steps: steps.map((s) => ({ name: s.title, text: s.body })),
          }),
          faqLd(faq, locale),
          breadcrumbLd([
            { name: ts("breadcrumbHome"), url: absoluteUrl(locale) },
            { name: t("breadcrumb"), url },
          ]),
        ]}
      />

      <div className="border-b bg-aurora">
        <Container className="py-14 sm:py-20">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              {ts("breadcrumbHome")}
            </Link>{" "}
            / <span>{t("breadcrumb")}</span>
          </nav>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t("eyebrow")}</p>
          <h1 className="mt-2 max-w-3xl font-display text-3xl font-extrabold sm:text-5xl">{t("title")}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t("lead")}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            <time dateTime={GUIDE_REVIEWED}>{t("updated", { date: GUIDE_REVIEWED })}</time>
          </p>
        </Container>
      </div>

      <Section>
        <div className="mx-auto max-w-3xl space-y-14">
          {/* Answer-first summary — what search snippets and AI answers quote. */}
          <div className="rounded-lg border-l-4 border-primary bg-muted/50 p-5">
            <h2 className="font-display text-lg font-bold">{t("answerTitle")}</h2>
            <p className="mt-2 leading-relaxed">{t("answer")}</p>
          </div>

          <nav aria-labelledby="toc" className="rounded-lg border p-5">
            <h2 id="toc" className="font-display text-base font-bold">
              {t("tocTitle")}
            </h2>
            <ol className="mt-2 space-y-1 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-primary hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <section id="routes" className="scroll-mt-24 space-y-5">
            <h2 className="font-display text-2xl font-extrabold">{t("routesTitle")}</h2>
            <p className="text-muted-foreground">{t("routesLead")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {PERMIT_CATEGORIES.map((c) => {
                const fee = OFFICIAL_FEE_RANGE[c];
                return (
                  <Card key={c}>
                    <CardContent className="space-y-2 p-5">
                      <h3 className="font-display text-lg font-bold">{tc(c)}</h3>
                      <p className="text-sm text-muted-foreground">{tcd(c)}</p>
                      <dl className="space-y-1 rounded-md bg-muted/60 px-3 py-2 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt>{t("thresholdLabel")}</dt>
                          <dd className="text-right tabular-nums">{thresholdText(c, t("caseByCase"))}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt>{t("feeLabel")}</dt>
                          <dd className="tabular-nums">{formatEurRange(fee.onlineMin, fee.onlineMax, locale)}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section id="steps" className="scroll-mt-24 space-y-5">
            <h2 className="font-display text-2xl font-extrabold">{t("stepsTitle")}</h2>
            <ol className="space-y-5">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display font-bold">{s.title}</h3>
                    <p className="mt-1 text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="costs" className="scroll-mt-24 space-y-5">
            <h2 className="font-display text-2xl font-extrabold">{t("costsTitle")}</h2>
            <p className="text-muted-foreground">{t("costsLead")}</p>
            <table className="w-full text-sm">
              <tbody>
                {PERMIT_CATEGORIES.map((c) => (
                  <tr key={c} className="border-b last:border-0">
                    <th scope="row" className="py-2 text-left font-medium">
                      {tc(c)}
                    </th>
                    <td className="py-2 text-right tabular-nums">
                      {formatEurRange(OFFICIAL_FEE_RANGE[c].onlineMin, OFFICIAL_FEE_RANGE[c].onlineMax, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm text-muted-foreground">{t("costsNote")}</p>
            <Button asChild variant="outline">
              <Link href="/pricing">
                {t("costsCta")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </section>

          <section id="arrival" className="scroll-mt-24 space-y-5">
            <h2 className="font-display text-2xl font-extrabold">{t("arrivalTitle")}</h2>
            <ul className="space-y-4">
              {arrival.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="text-muted-foreground">{a.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section id="faq" className="scroll-mt-24 space-y-5">
            <h2 className="font-display text-2xl font-extrabold">{t("faqTitle")}</h2>
            <div className="space-y-6">
              {faq.map((item, i) => (
                <div key={i}>
                  <h3 className="font-display font-bold">{item.q}</h3>
                  <p className="mt-1 text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          <Disclaimer title={t("sourcesTitle")}>
            {t("sourcesBody")} ({MIGRI_LAST_VERIFIED})
          </Disclaimer>
        </div>
      </Section>

      <Section muted>
        <Container className="flex flex-col items-center gap-4 text-center">
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">{t("ctaTitle")}</h2>
          <p className="max-w-xl text-muted-foreground">{t("ctaBody")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="cta" size="xl">
              <Link href="/eligibility">
                {t("ctaButton")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="/contact">{t("ctaSecondary")}</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
