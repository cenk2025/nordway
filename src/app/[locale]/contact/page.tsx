import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Mail, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Section, PageHeader, Container } from "@/components/marketing";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contactPage");

  const details = [
    { icon: Mail, label: t("info.emailLabel"), value: "hello@nordway.voon.fi" },
    { icon: MapPin, label: t("info.locationLabel"), value: t("info.location") },
    { icon: Clock, label: t("info.hoursLabel"), value: t("info.hours") },
  ];

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <Section>
        <Container className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <CardContent className="p-6">
              <ContactForm />
            </CardContent>
          </Card>
          <div className="space-y-5">
            {details.map((d) => (
              <div key={d.label} className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <d.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{d.label}</p>
                  <p className="text-sm text-muted-foreground">{d.value}</p>
                </div>
              </div>
            ))}
            <p className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              {t("info.voon")}
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
