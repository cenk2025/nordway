import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderLock, MessagesSquare, User, Calculator, Sparkles, CalendarClock } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { formatEur } from "@/lib/pricing";
import { Container } from "@/components/marketing";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/features/dashboard/status-badge";
import { MessageThread } from "@/features/messaging/message-thread";
import { AdminStatusEditor, AdminQuoteEditor } from "@/features/admin/case-controls";
import { DocReview } from "@/features/admin/doc-review";
import { AiAssessment } from "@/features/admin/ai-assessment";
import { DeadlineManager } from "@/features/deadlines/deadline-manager";
import type { Application, Quote, DocumentRow, Message, Profile, Deadline } from "@/lib/db/types";

export const metadata: Metadata = { title: "Admin · Case" };

export default async function AdminCasePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect({ href: "/login", locale });
  if (!(await isAdmin())) redirect({ href: "/dashboard", locale });

  const supabase = await createClient();
  const { data: appData } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
  if (!appData) notFound();
  const application = appData as Application;

  const [{ data: quoteData }, { data: docsData }, { data: msgData }, { data: profData }, { data: dlData }] =
    await Promise.all([
      supabase.from("quotes").select("*").eq("application_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("documents").select("*").eq("application_id", id).order("uploaded_at", { ascending: false }),
      supabase.from("messages").select("*").eq("application_id", id).order("created_at", { ascending: true }),
      supabase.from("profiles").select("*").eq("id", application.user_id).maybeSingle(),
      supabase.from("case_deadlines").select("*").eq("application_id", id).order("due_date", { ascending: true }),
    ]);

  const quote = quoteData as Quote | null;
  const documents = (docsData as DocumentRow[]) ?? [];
  const messages = (msgData as Message[]) ?? [];
  const profile = profData as Profile | null;
  const deadlines = (dlData as Deadline[]) ?? [];

  // Applicant email via the service-role admin API (server-only).
  let email = "—";
  try {
    const admin = createServiceRoleClient();
    const { data } = await admin.auth.admin.getUserById(application.user_id);
    email = data.user?.email ?? "—";
  } catch {
    /* ignore */
  }

  const t = await getTranslations("adminCase");
  const tc = await getTranslations("categories");
  const tcalc = await getTranslations("calc");

  return (
    <Container className="max-w-4xl py-12">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("back")}
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{tc(application.category)}</h1>
          <p className="text-muted-foreground">
            {application.reference} · {application.target_city || application.target_country}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Applicant */}
        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <User className="h-5 w-5 text-primary" /> {t("applicant")}
            </h2>
            <Row label={t("name")} value={profile?.full_name || "—"} />
            <Row label={t("email")} value={email} />
            <Row label={t("language")} value={profile?.locale ?? "—"} />
            <Row label={tcalc("complexityLabel")} value={tcalc(`complexity.${application.complexity}`)} />
            <Row label={tcalc("familyMembers")} value={String(application.family_members)} />
            <Row label={tcalc("urgent")} value={application.urgent ? t("yes") : t("no")} />
            {application.notes && <p className="pt-2 text-sm text-muted-foreground">{application.notes}</p>}
          </CardContent>
        </Card>

        {/* Workflow + quote controls */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-bold">{t("workflow")}</h2>
              <AdminStatusEditor applicationId={application.id} status={application.status} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <Calculator className="h-5 w-5 text-primary" /> {t("quote")}
              </h2>
              {quote ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {t("currentGross")}: {formatEur(quote.range_gross_min, locale)} –{" "}
                    {formatEur(quote.range_gross_max, locale)}
                  </p>
                  <AdminQuoteEditor
                    quoteId={quote.id}
                    applicationId={application.id}
                    rangeNetMin={quote.range_net_min}
                    rangeNetMax={quote.range_net_max}
                    status={quote.status}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t("noQuote")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deadlines */}
      <Card className="mt-6">
        <CardContent className="space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <CalendarClock className="h-5 w-5 text-primary" /> {t("deadlines")}
          </h2>
          <DeadlineManager applicationId={application.id} deadlines={deadlines} />
        </CardContent>
      </Card>

      {/* AI assessment draft */}
      <Card className="mt-6">
        <CardContent className="space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Sparkles className="h-5 w-5 text-primary" /> {t("aiAssessment")}
          </h2>
          <AiAssessment applicationId={application.id} />
        </CardContent>
      </Card>

      {/* Documents */}
      <Card className="mt-6">
        <CardContent className="space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <FolderLock className="h-5 w-5 text-primary" /> {t("documents")}
          </h2>
          <DocReview applicationId={application.id} documents={documents} />
        </CardContent>
      </Card>

      {/* Messaging (as admin) */}
      <Card className="mt-6">
        <CardContent className="space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <MessagesSquare className="h-5 w-5 text-primary" /> {t("messages")}
          </h2>
          <MessageThread applicationId={application.id} currentUserId={user!.id} messages={messages} />
        </CardContent>
      </Card>
    </Container>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-2 text-sm last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
