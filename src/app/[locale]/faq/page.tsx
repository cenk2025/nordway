import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Section, PageHeader, Container } from "@/components/marketing";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { faqLd } from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "faq");
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faqPage");
  const items = t.raw("items") as { q: string; a: string }[];

  return (
    <>
      <JsonLd data={faqLd(items, locale)} />
      <PageHeader title={t("title")} lead={t("lead")} />
      <Section>
        <Container className="max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {items.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </Section>
    </>
  );
}
