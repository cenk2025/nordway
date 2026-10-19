"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Loader2, CheckCircle2 } from "lucide-react";
import { acceptQuote } from "@/features/quotes/actions";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { WITHDRAWAL_PERIOD_DAYS } from "@/config/legal";
import type { QuoteStatus } from "@/lib/db/types";

/**
 * User-facing quote acceptance. Shown on the case page when a quote is still a
 * draft/sent estimate. Accepting concludes the service contract: the Terms
 * must be accepted, and the consumer chooses whether work may start inside the
 * statutory withdrawal period (an express request, never pre-ticked).
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
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [accepted, setAccepted] = useState(status === "accepted");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [startEarly, setStartEarly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (accepted) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium [color:var(--success)]">
        <CheckCircle2 className="h-4 w-4" /> {t("accepted")}
      </p>
    );
  }

  const link = (chunks: React.ReactNode) => (
    <Link href="/legal/terms" className="text-primary underline-offset-2 hover:underline">
      {chunks}
    </Link>
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t("intro")}</p>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
        />
        <span>{t.rich("termsLabel", { link })}</span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={startEarly}
          onChange={(e) => setStartEarly(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
        />
        <span>
          {t("startEarlyLabel", { days: WITHDRAWAL_PERIOD_DAYS })}
          <span className="mt-1 block text-xs text-muted-foreground">
            {t("startEarlyHint", { days: WITHDRAWAL_PERIOD_DAYS })}
          </span>
        </span>
      </label>
      <Button
        variant="cta"
        disabled={isPending || !acceptTerms}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await acceptQuote({
              quoteId,
              applicationId,
              locale,
              acceptTerms: acceptTerms as true,
              startEarly,
            });
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
