import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Shield, ArrowRight } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { redirect, Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/marketing";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/features/dashboard/status-badge";
import { AdminFilters } from "@/features/admin/admin-filters";
import { AdminNav } from "@/features/admin/admin-nav";
import type { Application } from "@/lib/db/types";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; category?: string }>;
}) {
  const { locale } = await params;
  const { status, category } = await searchParams;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect({ href: "/login", locale });
  if (!(await isAdmin())) redirect({ href: "/dashboard", locale });

  const t = await getTranslations("adminCases");
  const tc = await getTranslations("categories");

  const supabase = await createClient();
  let query = supabase.from("applications").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  const { data } = await query;
  const applications = (data as Application[]) ?? [];

  // Map applicant names (RLS lets admins read all profiles).
  const ids = [...new Set(applications.map((a) => a.user_id))];
  const names = new Map<string, string>();
  if (ids.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    for (const p of profs ?? []) names.set(p.id as string, (p.full_name as string) ?? "—");
  }

  return (
    <Container className="py-12">
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("count", { n: applications.length })}</p>
        </div>
      </div>

      <AdminNav />

      <div className="mb-6">
        <AdminFilters status={status} category={category} />
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground">{t("empty")}</CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {applications.map((app) => (
                <li key={app.id}>
                  <Link
                    href={`/admin/cases/${app.id}`}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {tc(app.category)} · {names.get(app.user_id) || "—"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {app.reference} · {app.target_city || app.target_country} ·{" "}
                        {new Date(app.created_at).toLocaleDateString(locale)}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
