"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Trash2, Loader2, Download } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { createTransaction, deleteTransaction } from "@/features/admin/finance-actions";
import { formatEur } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/lib/db/types";

const today = () => new Date().toISOString().slice(0, 10);

export function FinanceLedger({
  transactions,
  from,
  to,
  categories = [],
}: {
  transactions: Transaction[];
  from?: string;
  to?: string;
  categories?: string[];
}) {
  const t = useTranslations("finance");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [vat, setVat] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState(today());
  const [status, setStatus] = useState<"paid" | "pending">("paid");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError(t("invalidAmount"));
      return;
    }
    startTransition(async () => {
      const res = await createTransaction({
        type,
        amount: amt,
        vat: Number(vat) || 0,
        category,
        description,
        occurredOn,
        status,
      });
      if (res.ok) {
        setAmount("");
        setVat("");
        setCategory("");
        setDescription("");
      } else {
        setError(t("saveError"));
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteTransaction(id);
    });
  }

  function setDateFilter(key: "from" | "to", value: string) {
    const params = new URLSearchParams();
    const next = { from, to, [key]: value } as Record<string, string | undefined>;
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  const exportHref = `/${locale}/admin/finance/export${
    from || to ? `?${new URLSearchParams({ ...(from && { from }), ...(to && { to }) }).toString()}` : ""
  }`;

  return (
    <div className="space-y-6">
      {/* Filter + export */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="from">{t("from")}</Label>
          <Input id="from" type="date" value={from ?? ""} onChange={(e) => setDateFilter("from", e.target.value)} className="w-auto" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to">{t("to")}</Label>
          <Input id="to" type="date" value={to ?? ""} onChange={(e) => setDateFilter("to", e.target.value)} className="w-auto" />
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={exportHref} download>
            <Download className="h-4 w-4" /> {t("exportCsv")}
          </a>
        </Button>
      </div>

      {/* Add form */}
      <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label>{t("type")}</Label>
          <select value={type} onChange={(e) => setType(e.target.value as "income" | "expense")} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="income">{t("income")}</option>
            <option value="expense">{t("expense")}</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="amount">{t("amount")} (€)</Label>
          <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="vat">{t("vat")} (€)</Label>
          <Input id="vat" type="number" step="0.01" value={vat} onChange={(e) => setVat(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cat">{t("category")}</Label>
          <Input id="cat" list="cats" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t("categoryPlaceholder")} />
          <datalist id="cats">
            {(categories.length > 0
              ? categories
              : ["operations", "translation", "marketing", "subscriptions", "other"]
            ).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="desc">{t("description")}</Label>
          <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="date">{t("date")}</Label>
          <Input id="date" type="date" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>{t("statusLabel")}</Label>
          <select value={status} onChange={(e) => setStatus(e.target.value as "paid" | "pending")} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="paid">{t("paid")}</option>
            <option value="pending">{t("pending")}</option>
          </select>
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-4">
          <Button type="submit" variant="cta" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t("add")}
          </Button>
          {error && <span className="ml-3 text-sm text-destructive">{error}</span>}
        </div>
      </form>

      {/* Table */}
      {transactions.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3">{t("date")}</th>
                <th className="p-3">{t("type")}</th>
                <th className="p-3">{t("category")}</th>
                <th className="p-3 text-right">{t("amount")}</th>
                <th className="p-3 text-right">{t("vat")}</th>
                <th className="p-3">{t("statusLabel")}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="p-3 whitespace-nowrap text-muted-foreground">{tx.occurred_on}</td>
                  <td className="p-3">
                    <Badge variant={tx.type === "income" ? "success" : "amber"}>
                      {t(tx.type)}
                    </Badge>
                  </td>
                  <td className="p-3">{tx.category || "—"}</td>
                  <td className="p-3 text-right tabular-nums">{formatEur(tx.amount, locale)}</td>
                  <td className="p-3 text-right tabular-nums text-muted-foreground">{formatEur(tx.vat, locale)}</td>
                  <td className="p-3">
                    <Badge variant={tx.status === "paid" ? "muted" : "info"}>{t(tx.status)}</Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" aria-label={t("delete")} disabled={isPending} onClick={() => remove(tx.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
