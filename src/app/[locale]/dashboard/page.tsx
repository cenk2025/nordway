import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, FilePlus2, Inbox, CalendarClock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/flags";
import { Container } from "@/components/marketing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/features/dashboard/status-badge";
import { DeadlineList } from "@/features/deadlines/deadline-list";
import type { Application, Deadline } from "@/lib/db/types";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = { title: "Dashboard", robots: PRIVATE_ROBOTS };

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const tc = await getTranslations("categories");

  const user = await getCurrentUser();
  let applications: Application[] = [];
  let upcoming: Deadline[] = [];
  if (user && isSupabaseConfigured()) {
    const supabase = await createClient();
    const [{ data: apps }, { data: dls }] = await Promise.all([
      supabase.from("applications").select("*").order("created_at", { ascending: false }),
      supabase
        .from("case_deadlines")
        .select("*")
        .eq("done", false)
        .order("due_date", { ascending: true })
        .limit(5),
    ]);
    applications = (apps as Application[]) ?? [];
    upcoming = (dls as Deadline[]) ?? [];
  }

  return (
    <Container className="py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild variant="cta">
          <Link href="/onboarding">
            <FilePlus2 className="h-4 w-4" /> {t("newApplication")}
          </Link>
        </Button>
      </div>

      {upcoming.length > 0 && (
        <Card className="mb-6">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold">{t("upcoming")}</h2>
            </div>
            <DeadlineList deadlines={upcoming} withCaseLink />
          </CardContent>
        </Card>
      )}

      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold">{t("empty.title")}</h2>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">{t("empty.body")}</p>
            </div>
            <Button asChild variant="cta">
              <Link href="/onboarding">
                {t("empty.cta")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <Card key={app.id} className="transition-shadow hover:shadow-md">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-bold">{tc(app.category)}</h3>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {app.target_city || app.target_country}
                  {app.reference ? ` · ${app.reference}` : ""}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="muted">{t(`tier.${app.tier}`)}</Badge>
                  <span>{new Date(app.created_at).toLocaleDateString(locale)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
