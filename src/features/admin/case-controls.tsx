"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { updateApplicationStatus, updateQuote } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApplicationStatus, QuoteStatus } from "@/lib/db/types";

const STATUSES: ApplicationStatus[] = [
  "draft",
  "submitted",
  "in_review",
  "docs_needed",
  "ready",
  "submitted_to_authority",
  "decided",
  "closed",
];
const QUOTE_STATUSES: QuoteStatus[] = ["draft", "sent", "accepted", "declined"];

/** Admin: change an application's workflow status. */
export function AdminStatusEditor({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const t = useTranslations("adminCase");
  const ts = useTranslations("dashboard.status");
  const [value, setValue] = useState<ApplicationStatus>(status);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    startTransition(async () => {
      const res = await updateApplicationStatus({ applicationId, status: value });
      if (res.ok) setSaved(true);
    });
  }

  return (
    <div className="space-y-2">
      <Label>{t("status")}</Label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => {
            setValue(e.target.value as ApplicationStatus);
            setSaved(false);
          }}
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ts(s)}
            </option>
          ))}
        </select>
        <Button onClick={save} disabled={isPending || value === status} size="sm">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {t("save")}
        </Button>
      </div>
      {saved && <p className="text-xs [color:var(--success)]">{t("saved")}</p>}
    </div>
  );
}

/** Admin: review & adjust the quote (net range + status; gross recomputed server-side). */
export function AdminQuoteEditor({
  quoteId,
  applicationId,
  rangeNetMin,
  rangeNetMax,
  status,
}: {
  quoteId: string;
  applicationId: string;
  rangeNetMin: number;
  rangeNetMax: number;
  status: QuoteStatus;
}) {
  const t = useTranslations("adminCase");
  const [min, setMin] = useState(rangeNetMin);
  const [max, setMax] = useState(rangeNetMax);
  const [qStatus, setQStatus] = useState<QuoteStatus>(status);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    startTransition(async () => {
      const res = await updateQuote({
        quoteId,
        applicationId,
        rangeNetMin: min,
        rangeNetMax: max,
        status: qStatus,
      });
      if (res.ok) setSaved(true);
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="qmin">{t("netMin")}</Label>
          <Input id="qmin" type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="qmax">{t("netMax")}</Label>
          <Input id="qmax" type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>{t("quoteStatus")}</Label>
        <select
          value={qStatus}
          onChange={(e) => setQStatus(e.target.value as QuoteStatus)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {QUOTE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`qs.${s}`)}
            </option>
          ))}
        </select>
      </div>
      <Button onClick={save} disabled={isPending} size="sm" variant="cta">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {t("saveQuote")}
      </Button>
      {saved && <p className="text-xs [color:var(--success)]">{t("saved")}</p>}
    </div>
  );
}
