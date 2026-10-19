import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft, Calculator, FolderLock, MessagesSquare, CalendarClock } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatEur, formatEurRange } from "@/lib/pricing";
import { Container } from "@/components/marketing";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Disclaimer } from "@/components/disclaimer";
import { StatusBadge } from "@/features/dashboard/status-badge";
import { DocumentVault } from "@/features/documents/document-vault";
import { MessageThread } from "@/features/messaging/message-thread";
import { QuoteAccept } from "@/features/quotes/quote-accept";
import { DeadlineList } from "@/features/deadlines/deadline-list";
import type { Application, Quote, DocumentRow, Message, Deadline } from "@/lib/db/types";

export const metadata: Metadata = { title: "Case" };

export default async function CasePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect({ href: "/login", locale });

  const supabase = await createClient();
  const { data: app } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!app) notFound();
  const application = app as Application;

  const { data: quoteData } = await supabase
    .from("quotes")
    .select("*")
    .eq("application_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const quote = quoteData as Quote | null;

  const { data: docsData } = await supabase
    .from("documents")
    .select("*")
    .eq("application_id", id)
    .order("uploaded_at", { ascending: false });
  const documents = (docsData as DocumentRow[]) ?? [];

  const { data: dlData } = await supabase
    .from("case_deadlines")
    .select("*")
    .eq("application_id", id)
    .order("due_date", { ascending: true });
  const deadlines = (dlData as Deadline[]) ?? [];

  const { data: msgData } = await supabase
    .from("messages")
    .select("*")
    .eq("application_id", id)
    .order("created_at", { ascending: true });
  const messages = (msgData as Message[]) ?? [];

  const t = await getTranslations("casePage");
  const tc = await getTranslations("categories");
  const tcalc = await getTranslations("calc");

  return (
    <Container className="max-w-4xl py-12">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
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
        {/* Summary */}
        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="font-display text-lg font-bold">{t("summary")}</h2>
            <Row label={t("tier")} value={tcalc(`tiers.${application.tier}`)} />
            <Row label={tcalc("complexityLabel")} value={tcalc(`complexity.${application.complexity}`)} />
            <Row label={tcalc("familyMembers")} value={String(application.family_members)} />
            <Row label={tcalc("urgent")} value={application.urgent ? t("yes") : t("no")} />
            {application.notes && (
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">{application.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quote */}
        <Card className="overflow-hidden">
          <div className="bg-primary px-6 py-4 text-primary-foreground">
            <p className="flex items-center gap-2 text-sm font-medium opacity-90">
              <Calculator className="h-4 w-4" /> {tcalc("estimateTitle")}
            </p>
            {quote ? (
              <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">
                {formatEur(quote.range_gross_min, locale)} – {formatEur(quote.range_gross_max, locale)}
              </p>
            ) : (
              <p className="mt-1 text-sm opacity-80">—</p>
            )}
            <p className="text-xs opacity-80">{tcalc("vatIncl", { rate: "25.5" })}</p>
          </div>
          {quote && (
            <CardContent className="space-y-3 p-6">
              <ul className="space-y-2 text-sm">
                {quote.lines.map((line, i) => (
                  <li key={i} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      {line.key.startsWith("addon.")
                        ? tcalc(`addons.${line.key.slice(6)}`)
                        : tcalc(`lines.${line.key}`)}
                    </span>
                    <span className="tabular-nums">{formatEur(line.amount, locale)}</span>
                  </li>
                ))}
              </ul>
              <Separator />
              <div className="rounded-md bg-muted/60 p-3 text-sm">
                <div className="flex justify-between font-medium">
                  <span>{tcalc("officialFee")}</span>
                  <span className="tabular-nums">
                    {formatEurRange(quote.official_fee_min, quote.official_fee_max, locale)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{tcalc("officialFeeNote")}</p>
              </div>
              <Separator />
              <QuoteAccept quoteId={quote.id} applicationId={application.id} status={quote.status} />
            </CardContent>
          )}
        </Card>
      </div>

      {/* Deadlines */}
      <Card className="mt-6">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold">{t("deadlines")}</h2>
          </div>
          <DeadlineList deadlines={deadlines} />
        </CardContent>
      </Card>

      {/* Document vault */}
      <Card className="mt-6">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <FolderLock className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold">{t("documents")}</h2>
          </div>
          <DocumentVault applicationId={application.id} userId={user!.id} documents={documents} />
        </CardContent>
      </Card>

      {/* Secure messaging */}
      <Card className="mt-6">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <MessagesSquare className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold">{t("messages")}</h2>
          </div>
          <MessageThread applicationId={application.id} currentUserId={user!.id} messages={messages} />
        </CardContent>
      </Card>

      <div className="mt-6">
        <Disclaimer tone="warning" title={tcalc("caveatTitle")}>
          {tcalc("caveatBody")}
        </Disclaimer>
      </div>
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
