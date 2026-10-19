import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeading, PageHeader } from "@/components/marketing";
import { Disclaimer } from "@/components/disclaimer";
import { FeeCalculator } from "@/components/fee-calculator";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "pricing");
}

const TIER_KEYS = ["start", "pilot", "scale"] as const;

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricingPage");

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />

      {/* Tiers */}
      <Section>
        <SectionHeading title={t("tiers.title")} lead={t("tiers.lead")} />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {TIER_KEYS.map((tier) => {
            const features = t.raw(`tiers.${tier}.features`) as string[];
            const featured = tier === "pilot";
            return (
              <Card
                key={tier}
                className={featured ? "border-primary shadow-lg ring-1 ring-primary/20" : ""}
              >
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold">
                      {t(`tiers.${tier}.name`)}
                    </h3>
                    {featured && <Badge variant="info">{t("tiers.popular")}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{t(`tiers.${tier}.tagline`)}</p>
                  <p className="font-display text-2xl font-extrabold">
                    {t(`tiers.${tier}.priceHint`)}
                  </p>
                  <ul className="space-y-2 text-sm">
                    {features.map((f, i) => (
                      <li key={i} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 [color:var(--success)]" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">{t("tiers.note")}</p>
      </Section>

      {/* Calculator */}
      <Section muted className="scroll-mt-20">
        <div id="calculator" className="scroll-mt-24">
          <SectionHeading
            eyebrow={t("calc.eyebrow")}
            title={t("calc.title")}
            lead={t("calc.lead")}
          />
          <div className="mt-10">
            <FeeCalculator />
          </div>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl space-y-4">
          <Disclaimer tone="warning" title={t("legal.officialTitle")}>
            {t("legal.officialBody")}
          </Disclaimer>
          <Disclaimer title={t("legal.vatTitle")}>{t("legal.vatBody")}</Disclaimer>
          <Disclaimer title={t("legal.refundTitle")}>{t("legal.refundBody")}</Disclaimer>
        </div>
      </Section>
    </>
  );
}
