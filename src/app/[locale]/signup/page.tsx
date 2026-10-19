import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Compass } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Container } from "@/components/marketing";
import { AuthForm } from "@/features/auth/auth-form";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = { title: "Create account", robots: PRIVATE_ROBOTS };

export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { locale } = await params;
  const { redirect: redirectTo } = await searchParams;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (user) redirect({ href: "/dashboard", locale });

  const t = await getTranslations("auth");

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Compass className="mx-auto mb-3 h-8 w-8 text-primary" />
          <h1 className="font-display text-2xl font-extrabold">{t("signupTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("signupSubtitle")}</p>
        </div>
        <AuthForm mode="signup" redirect={redirectTo} />
      </div>
    </Container>
  );
}
