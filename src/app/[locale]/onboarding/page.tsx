import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { Container } from "@/components/marketing";
import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard";
import { PERMIT_CATEGORIES, type PermitCategory } from "@/config/migri-2026";

export const metadata: Metadata = { title: "New application" };

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const { category } = await searchParams;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect({ href: "/login", locale });

  const t = await getTranslations("onboarding");
  const initial =
    category && PERMIT_CATEGORIES.includes(category as PermitCategory)
      ? (category as PermitCategory)
      : undefined;

  return (
    <Container className="py-12">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("lead")}</p>
      </div>
      <OnboardingWizard initialCategory={initial} />
    </Container>
  );
}
