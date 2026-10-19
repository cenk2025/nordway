import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { Container } from "@/components/marketing";
import { Card, CardContent } from "@/components/ui/card";
import { Disclaimer } from "@/components/disclaimer";
import { AccountActions } from "@/features/account/account-actions";

export const metadata: Metadata = { title: "Account" };

/**
 * Account & privacy. Phase-2A shows identity + a notice; data download/delete
 * (GDPR) and editing arrive in Phase 2D.
 */
export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) redirect({ href: "/login", locale });
  const profile = await getProfile();
  const t = await getTranslations("account");

  return (
    <Container className="max-w-2xl py-12">
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">{t("title")}</h1>
      <Card>
        <CardContent className="space-y-4 p-6">
          <Row label={t("name")} value={profile?.full_name || "—"} />
          <Row label={t("email")} value={user!.email ?? "—"} />
          <Row label={t("language")} value={profile?.locale ?? locale} />
          <Row label={t("role")} value={profile?.role ?? "user"} />
        </CardContent>
      </Card>
      <div className="mt-8 space-y-4">
        <h2 className="font-display text-xl font-bold">{t("privacyTitle")}</h2>
        <Disclaimer title={t("gdprTitle")}>{t("gdprBody")}</Disclaimer>
        <AccountActions />
      </div>
    </Container>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
