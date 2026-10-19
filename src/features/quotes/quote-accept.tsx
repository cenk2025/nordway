"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, CheckCircle2 } from "lucide-react";
import { acceptQuote } from "@/features/quotes/actions";
import { Button } from "@/components/ui/button";
import type { QuoteStatus } from "@/lib/db/types";

/**
 * User-facing quote acceptance. Shown on the case page when a quote is still a
 * draft/sent estimate. Accepting flips status to 'accepted' (server-side).
 */
export function QuoteAccept({
  quoteId,
  applicationId,
  status,
}: {
  quoteId: string;
  applicationId: string;
  status: QuoteStatus;
}) {
  const t = useTranslations("quoteAccept");
  const [isPending, startTransition] = useTransition();
  const [accepted, setAccepted] = useState(status === "accepted");
  const [error, setError] = useState<string | null>(null);

  if (accepted) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium [color:var(--success)]">
        <CheckCircle2 className="h-4 w-4" /> {t("accepted")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{t("intro")}</p>
      <Button
        variant="cta"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await acceptQuote({ quoteId, applicationId });
            if (res.ok) setAccepted(true);
            else setError(t("error"));
          });
        }}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {t("accept")}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">{t("note")}</p>
    </div>
  );
}
