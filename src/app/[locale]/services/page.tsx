import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Home, Landmark, ShieldPlus, Languages, BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Container, Section, SectionHeading, PageHeader } from "@/components/marketing";
import { Disclaimer } from "@/components/disclaimer";
import {
  PERMIT_CATEGORIES,
  CATEGORY_THRESHOLDS,
  MIGRI_LAST_VERIFIED,
} from "@/config/migri-2026";

export const metadata: Metadata = { title: "Services" };

const SETTLING_ICONS = [Home, Landmark, ShieldPlus, Languages, BookOpen] as const;

/** Build a short, human threshold string from the config for a category. */
function thresholdText(category: (typeof PERMIT_CATEGORIES)[number], caseByCase: string) {
  const th = CATEGORY_THRESHOLDS[category];
  if (th.caseByCase) return caseByCase;
  if (th.netMonthlyByRegion) {
    const r = th.netMonthlyByRegion;
    return `${r.capital} / ${r.majorCity} / ${r.other} €/mo`;
  }
  if (th.grossMonthly) return `≥ ${th.grossMonthly} €/mo`;
  if (th.netMonthly) {
    return th.firstYearFunds
      ? `${th.netMonthly} €/mo · ${th.firstYearFunds} €/yr`
      : `${th.netMonthly} €/mo`;
  }
  return caseByCase;
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("servicesPage");
  const tc = await getTranslations("categories");
  const tcd = await getTranslations("categoryDesc");
  const settling = t.raw("settling.items") as { title: string; body: string }[];

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />

      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {PERMIT_CATEGORIES.map((c) => (
            <Card key={c}>
              <CardContent className="space-y-3 p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl font-bold">{tc(c)}</h3>
                  <Badge variant="muted">{t("thresholdLabel")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{tcd(c)}</p>
                <div className="rounded-md bg-muted/60 px-3 py-2 text-sm">
                  <span className="font-medium">{t("reference2026")}: </span>
                  <span className="tabular-nums">
                    {thresholdText(c, t("caseByCase"))}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Disclaimer title={t("migriNoteTitle")}>
            {t("migriNoteBody", { verified: MIGRI_LAST_VERIFIED })}
          </Disclaimer>
        </div>
      </Section>

      {/* Settling-in */}
      <Section muted>
        <SectionHeading
          eyebrow={t("settling.eyebrow")}
          title={t("settling.title")}
          lead={t("settling.lead")}
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {settling.map((s, i) => {
            const Icon = SETTLING_ICONS[i % SETTLING_ICONS.length];
            return (
              <Card key={i}>
                <CardContent className="space-y-2 p-6">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-base font-bold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section>
        <Container className="flex flex-col items-center gap-4 text-center">
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">{t("ctaTitle")}</h2>
          <Button asChild variant="cta" size="xl">
            <Link href="/eligibility">
              {t("ctaButton")} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Container>
      </Section>
    </>
  );
}
