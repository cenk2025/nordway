"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Loader2 } from "lucide-react";
import { generateCaseAssessment } from "@/features/admin/ai-actions";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/disclaimer";

/** Admin: generate an AI draft case assessment. Human decides — this only speeds review. */
export function AiAssessment({ applicationId }: { applicationId: string }) {
  const t = useTranslations("aiAssessment");
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await generateCaseAssessment(applicationId);
      if (res.ok) setDraft(res.draft);
      else setError(t(res.error === "not_configured" ? "notConfigured" : "error"));
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
        <Button onClick={run} disabled={isPending} variant="outline" size="sm">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {draft ? t("regenerate") : t("generate")}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {draft && (
        <>
          <div className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed">
            {draft}
          </div>
          <Disclaimer tone="warning" title={t("draftTitle")}>
            {t("draftBody")}
          </Disclaimer>
        </>
      )}
    </div>
  );
}
