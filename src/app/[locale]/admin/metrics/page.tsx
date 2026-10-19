import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BarChart3 } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/marketing";
import { Card, CardContent } from "@/components/ui/card";
import { AdminNav } from "@/features/admin/admin-nav";
import { ApplicationsArea, CountBar, DistributionPie } from "@/features/admin/charts";
import { PERMIT_CATEGORIES } from "@/config/migri-2026";
import type { Application } from "@/lib/db/types";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = { title: "Admin · Metrics", robots: PRIVATE_ROBOTS };

const STATUSES = [
  "draft", "submitted", "in_review", "docs_needed", "ready", "submitted_to_authority", "decided", "closed",
] as const;

export default async function MetricsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect({ href: "/login", locale });
  if (!(await isAdmin())) redirect({ href: "/dashboard", locale });

  const t = await getTranslations("metrics");
  const ts = await getTranslations("dashboard.status");
  const tc = await getTranslations("categories");

  const supabase = await createClient();
  const { data } = await supabase.from("applications").select("category, status, created_at");
  const apps = (data as Pick<Application, "category" | "status" | "created_at">[]) ?? [];

  // Aggregate by month (last 12 months that have data).
  const byMonthMap = new Map<string, number>();
  for (const a of apps) {
    const m = a.created_at.slice(0, 7); // YYYY-MM
    byMonthMap.set(m, (byMonthMap.get(m) ?? 0) + 1);
  }
  const byMonth = [...byMonthMap.entries()].sort().map(([month, count]) => ({ month, count }));

  // By category & status.
  const byCategory = PERMIT_CATEGORIES.map((c) => ({
    label: tc(c),
    value: apps.filter((a) => a.category === c).length,
  })).filter((d) => d.value > 0);

  const byStatus = STATUSES.map((s) => ({
    label: ts(s),
    count: apps.filter((a) => a.status === s).length,
  }));

  const total = apps.length;
  const active = apps.filter((a) => !["draft", "closed", "decided"].includes(a.status)).length;
  const decided = apps.filter((a) => a.status === "decided").length;
  const submitted = apps.filter((a) => a.status !== "draft").length;
  const conversion = submitted > 0 ? Math.round((decided / submitted) * 100) : 0;

  return (
    <Container className="py-12">
      <div className="mb-6 flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-primary" />
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{t("title")}</h1>
      </div>
      <AdminNav />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("total")} value={total} />
        <Stat label={t("active")} value={active} />
        <Stat label={t("decided")} value={decided} />
        <Stat label={t("conversion")} value={`${conversion}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("overTime")}>
          <ApplicationsArea data={byMonth} label={t("overTime")} />
        </ChartCard>
        <ChartCard title={t("byCategory")}>
          <DistributionPie data={byCategory} label={t("noData")} />
        </ChartCard>
        <ChartCard title={t("byStatus")} full>
          <CountBar data={byStatus} label={t("byStatus")} />
        </ChartCard>
      </div>
    </Container>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-3xl font-extrabold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children, full }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <Card className={full ? "lg:col-span-2" : ""}>
      <CardContent className="space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {children}
      </CardContent>
    </Card>
  );
}
