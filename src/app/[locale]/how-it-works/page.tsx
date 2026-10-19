import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Section, PageHeader, Container } from "@/components/marketing";
import { Disclaimer } from "@/components/disclaimer";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "howItWorks");
}

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("howItWorksPage");
  const steps = t.raw("steps") as { title: string; body: string; detail: string }[];

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />

      <Section>
        <div className="mx-auto max-w-3xl space-y-6">
          {steps.map((step, i) => (
            <Card key={i}>
              <CardContent className="flex gap-5 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.body}</p>
                  <p className="text-sm text-muted-foreground/80">{step.detail}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-3xl space-y-4">
          <Disclaimer title={t("enterFinlandTitle")}>{t("enterFinlandBody")}</Disclaimer>
          <Disclaimer tone="warning" title={t("noGuaranteeTitle")}>
            {t("noGuaranteeBody")}
          </Disclaimer>
        </div>
      </Section>

      <Section muted>
        <Container className="flex flex-col items-center gap-4 text-center">
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">{t("ctaTitle")}</h2>
          <p className="max-w-xl text-muted-foreground">{t("ctaBody")}</p>
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
