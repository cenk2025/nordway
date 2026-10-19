"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Trash2, Loader2, Check, RotateCcw } from "lucide-react";
import { addDeadline, toggleDeadline, deleteDeadline } from "@/features/deadlines/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Deadline, DeadlineKind } from "@/lib/db/types";

const KINDS: DeadlineKind[] = [
  "permit_expiry",
  "appointment",
  "document_validity",
  "submission",
  "other",
];

/** Admin: add / complete / delete deadlines on a case. */
export function DeadlineManager({
  applicationId,
  deadlines,
}: {
  applicationId: string;
  deadlines: Deadline[];
}) {
  const t = useTranslations("deadlines");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [kind, setKind] = useState<DeadlineKind>("appointment");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!dueDate) {
      setError(t("needDate"));
      return;
    }
    startTransition(async () => {
      const res = await addDeadline({ applicationId, kind, dueDate, note });
      if (res.ok) {
        setDueDate("");
        setNote("");
      } else setError(t("saveError"));
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-4">
        <div className="space-y-1">
          <Label>{t("kindLabel")}</Label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as DeadlineKind)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`kind.${k}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="dl-date">{t("dueDate")}</Label>
          <Input id="dl-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="dl-note">{t("noteLabel")}</Label>
          <Input id="dl-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("notePlaceholder")} />
        </div>
        <div className="sm:col-span-4">
          <Button type="submit" variant="cta" size="sm" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t("add")}
          </Button>
          {error && <span className="ml-3 text-sm text-destructive">{error}</span>}
        </div>
      </form>

      {deadlines.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {deadlines.map((d) => (
            <li key={d.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t(`kind.${d.kind}`)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {new Date(d.due_date + "T00:00:00").toLocaleDateString(locale, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  {d.note ? ` · ${d.note}` : ""}
                </p>
              </div>
              {d.done && <Badge variant="muted">{t("done")}</Badge>}
              <Button
                variant="ghost"
                size="icon"
                aria-label={d.done ? t("reopen") : t("markDone")}
                disabled={isPending}
                onClick={() => startTransition(async () => void (await toggleDeadline(d.id, !d.done)))}
              >
                {d.done ? <RotateCcw className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("delete")}
                disabled={isPending}
                onClick={() => startTransition(async () => void (await deleteDeadline(d.id)))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
