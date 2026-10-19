import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Wallet } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatEur } from "@/lib/pricing";
import { Container } from "@/components/marketing";
import { Card, CardContent } from "@/components/ui/card";
import { AdminNav } from "@/features/admin/admin-nav";
import { FinanceBars, DistributionPie } from "@/features/admin/charts";
import { FinanceLedger } from "@/features/admin/finance-ledger";
import { ExpenseCategories } from "@/features/admin/expense-categories";
import type { Transaction } from "@/lib/db/types";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = { title: "Admin · Finance", robots: PRIVATE_ROBOTS };

export default async function FinancePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { locale } = await params;
  const { from, to } = await searchParams;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) redirect({ href: "/login", locale });
  if (!(await isAdmin())) redirect({ href: "/dashboard", locale });

  const t = await getTranslations("finance");

  const supabase = await createClient();
  let query = supabase.from("transactions").select("*").order("occurred_on", { ascending: false });
  if (from) query = query.gte("occurred_on", from);
  if (to) query = query.lte("occurred_on", to);
  const [{ data }, { data: catData }] = await Promise.all([
    query,
    supabase.from("expense_categories").select("id, name").order("name"),
  ]);
  const txns = (data as Transaction[]) ?? [];
  const categories = (catData as { id: string; name: string }[]) ?? [];

  const totalIncome = txns.filter((x) => x.type === "income").reduce((s, x) => s + Number(x.amount), 0);
  const totalExpense = txns.filter((x) => x.type === "expense").reduce((s, x) => s + Number(x.amount), 0);
  const net = totalIncome - totalExpense;
  const pending = txns
    .filter((x) => x.type === "income" && x.status === "pending")
    .reduce((s, x) => s + Number(x.amount), 0);
  const totalVat = txns.reduce((s, x) => s + Number(x.vat), 0);

  // Monthly income vs expense.
  const monthMap = new Map<string, { income: number; expense: number }>();
  for (const x of txns) {
    const m = x.occurred_on.slice(0, 7);
    const cur = monthMap.get(m) ?? { income: 0, expense: 0 };
    cur[x.type] += Number(x.amount);
    monthMap.set(m, cur);
  }
  const monthly = [...monthMap.entries()].sort().map(([month, v]) => ({ month, ...v }));

  // Expense by category.
  const catMap = new Map<string, number>();
  for (const x of txns.filter((x) => x.type === "expense")) {
    const k = x.category || t("uncategorized");
    catMap.set(k, (catMap.get(k) ?? 0) + Number(x.amount));
  }
  const expenseByCategory = [...catMap.entries()].map(([label, value]) => ({ label, value }));

  return (
    <Container className="py-12">
      <div className="mb-6 flex items-center gap-3">
        <Wallet className="h-7 w-7 text-primary" />
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{t("title")}</h1>
      </div>
      <AdminNav />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("totalIncome")} value={formatEur(totalIncome, locale)} tone="success" />
        <Stat label={t("totalExpense")} value={formatEur(totalExpense, locale)} tone="expense" />
        <Stat label={t("net")} value={formatEur(net, locale)} tone={net >= 0 ? "success" : "expense"} />
        <Stat label={t("pendingIncome")} value={formatEur(pending, locale)} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="font-display text-lg font-bold">{t("monthly")}</h2>
            <FinanceBars data={monthly} incomeLabel={t("income")} expenseLabel={t("expense")} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="font-display text-lg font-bold">{t("expenseByCategory")}</h2>
            <DistributionPie data={expenseByCategory} label={t("noExpenses")} />
          </CardContent>
        </Card>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {t("vatTotal")}: <span className="font-medium tabular-nums">{formatEur(totalVat, locale)}</span> (ALV 25,5%)
      </p>

      <Card className="mb-6">
        <CardContent className="space-y-3 p-6">
          <h2 className="font-display text-lg font-bold">{t("categoriesTitle")}</h2>
          <ExpenseCategories categories={categories} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <FinanceLedger transactions={txns} from={from} to={to} categories={categories.map((c) => c.name)} />
        </CardContent>
      </Card>
    </Container>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "expense";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={
            tone === "success"
              ? "font-display text-2xl font-extrabold tabular-nums [color:var(--success)]"
              : tone === "expense"
                ? "font-display text-2xl font-extrabold tabular-nums [color:var(--destructive)]"
                : "font-display text-2xl font-extrabold tabular-nums"
          }
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
