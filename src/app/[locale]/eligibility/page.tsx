import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader, Section } from "@/components/marketing";
import { EligibilityWizard } from "@/features/eligibility/eligibility-wizard";

export const metadata: Metadata = { title: "Eligibility pre-check" };

export default async function EligibilityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("eligibility");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <Section>
        <EligibilityWizard />
      </Section>
    </>
  );
}
