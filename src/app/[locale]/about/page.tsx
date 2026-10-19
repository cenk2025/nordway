import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Lock, ShieldCheck, Download, Building2, FileCheck2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Section, SectionHeading, PageHeader, Container } from "@/components/marketing";
import { Disclaimer } from "@/components/disclaimer";
import { pageMetadata } from "@/lib/seo";
import { VoonIqLogo } from "@/components/vooniq-logo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "about");
}

const SECURITY_ICONS = [ShieldCheck, Lock, Download, Building2, FileCheck2] as const;

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("aboutPage");
  const principles = t.raw("principles.items") as { title: string; body: string }[];
  const story = t.raw("story.paragraphs") as string[];
  const security = t.raw("security.items") as { title: string; body: string }[];

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />

      <Section>
        <Container className="max-w-3xl space-y-4">
          {story.map((p, i) => (
            <p key={i} className="text-muted-foreground">
              {p}
            </p>
          ))}
        </Container>
      </Section>

      <Section muted>
        <SectionHeading title={t("principles.title")} lead={t("principles.lead")} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((p, i) => (
            <Card key={i}>
              <CardContent className="space-y-2 p-6">
                <h3 className="font-display text-base font-bold">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="security">
        <SectionHeading title={t("security.title")} lead={t("security.lead")} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {security.map((item, i) => {
            const Icon = SECURITY_ICONS[i % SECURITY_ICONS.length];
            return (
              <Card key={i}>
                <CardContent className="space-y-3 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="font-display text-base font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section muted>
        <Container className="max-w-3xl space-y-4">
          <VoonIqLogo height={36} />
          <Disclaimer title={t("voon.title")}>{t("voon.body")}</Disclaimer>
        </Container>
      </Section>
    </>
  );
}
