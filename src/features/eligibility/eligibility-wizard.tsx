"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, ArrowLeft, RotateCcw, Compass, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Disclaimer } from "@/components/disclaimer";
import type { PermitCategory } from "@/config/migri-2026";
import { cn } from "@/lib/utils";

type Purpose = "work" | "business" | "study" | "family" | "permanent";

/** SessionStorage key read by the onboarding wizard to prefill the category. */
const PREFILL_KEY = "nordway:eligibility";

/**
 * Lightweight, branching eligibility pre-check. Output is INFORMATIONAL only —
 * it suggests a likely permit category and routes the user to registration. It
 * is explicitly not a decision and not a guarantee.
 */
export function EligibilityWizard() {
  const t = useTranslations("eligibility");
  const tcat = useTranslations("categories");

  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [jobOffer, setJobOffer] = useState<boolean | null>(null);
  const [highSkilled, setHighSkilled] = useState<boolean | null>(null);
  const [bizType, setBizType] = useState<"startup" | "traditional" | null>(null);

  // Total visible steps depend on the branch (purpose + up to 2 follow-ups).
  const followUps =
    purpose === "work" ? (jobOffer ? 2 : 1) : purpose === "business" ? 1 : 0;
  const totalSteps = 1 + followUps;
  const isResult = step >= totalSteps && purpose !== null;

  const result: PermitCategory | null = !purpose
    ? null
    : purpose === "study"
      ? "student"
      : purpose === "family"
        ? "family"
        : purpose === "permanent"
          ? "permanent"
          : purpose === "business"
            ? bizType === "startup"
              ? "startup"
              : "entrepreneur"
            : // work
              jobOffer === false
              ? "work"
              : highSkilled
                ? "blueCard"
                : "work";

  function reset() {
    setStep(0);
    setPurpose(null);
    setJobOffer(null);
    setHighSkilled(null);
    setBizType(null);
  }

  function persistAndContinueHref() {
    if (result && typeof window !== "undefined") {
      sessionStorage.setItem(PREFILL_KEY, JSON.stringify({ category: result }));
    }
    return "/onboarding";
  }

  const progress = isResult
    ? 100
    : Math.round((Math.min(step, totalSteps) / (totalSteps + 1)) * 100);

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="space-y-6 p-6 sm:p-8">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5" /> {t("kicker")}
            </span>
            {!isResult && <span>{t("stepOf", { n: step + 1, total: totalSteps })}</span>}
          </div>
          <Progress value={progress} />
        </div>

        {!isResult ? (
          <Question step={step} purpose={purpose} jobOffer={jobOffer}>
            {step === 0 && (
              <Choices
                options={(["work", "business", "study", "family", "permanent"] as Purpose[]).map(
                  (p) => ({ id: p, label: t(`q.purpose.${p}`) })
                )}
                value={purpose}
                onPick={(v) => {
                  setPurpose(v as Purpose);
                  setStep(1);
                }}
                title={t("q.purpose.title")}
              />
            )}
            {step === 1 && purpose === "work" && (
              <Choices
                options={[
                  { id: "yes", label: t("q.jobOffer.yes") },
                  { id: "no", label: t("q.jobOffer.no") },
                ]}
                value={jobOffer === null ? null : jobOffer ? "yes" : "no"}
                onPick={(v) => {
                  setJobOffer(v === "yes");
                  setStep(2);
                }}
                title={t("q.jobOffer.title")}
              />
            )}
            {step === 2 && purpose === "work" && jobOffer && (
              <Choices
                options={[
                  { id: "yes", label: t("q.highSkilled.yes") },
                  { id: "no", label: t("q.highSkilled.no") },
                ]}
                value={highSkilled === null ? null : highSkilled ? "yes" : "no"}
                onPick={(v) => {
                  setHighSkilled(v === "yes");
                  setStep(3);
                }}
                title={t("q.highSkilled.title")}
              />
            )}
            {step === 1 && purpose === "business" && (
              <Choices
                options={[
                  { id: "startup", label: t("q.bizType.startup") },
                  { id: "traditional", label: t("q.bizType.traditional") },
                ]}
                value={bizType}
                onPick={(v) => {
                  setBizType(v as "startup" | "traditional");
                  setStep(2);
                }}
                title={t("q.bizType.title")}
              />
            )}
          </Question>
        ) : (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-aurora-green/15 [color:var(--success)]">
              <Sparkles className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("result.likely")}</p>
              <h2 className="font-display text-2xl font-extrabold">
                {result ? tcat(result) : ""}
              </h2>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                {t(`result.note.${result}` as never)}
              </p>
            </div>
            <Disclaimer tone="warning" title={t("result.disclaimerTitle")}>
              {t("result.disclaimerBody")}
            </Disclaimer>
            <div className="flex flex-col gap-2">
              <Button asChild variant="cta" size="lg">
                <Link href={persistAndContinueHref()}>
                  {t("result.continue")} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4" /> {t("result.restart")}
              </Button>
            </div>
          </div>
        )}

        {!isResult && step > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ArrowLeft className="h-4 w-4" /> {t("back")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Question({
  children,
}: {
  step: number;
  purpose: Purpose | null;
  jobOffer: boolean | null;
  children: React.ReactNode;
}) {
  return <div className="space-y-4">{children}</div>;
}

function Choices({
  title,
  options,
  value,
  onPick,
}: {
  title: string;
  options: { id: string; label: string }[];
  value: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="grid gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onPick(o.id)}
            className={cn(
              "flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
              value === o.id
                ? "border-primary bg-primary/5"
                : "border-input hover:bg-accent"
            )}
          >
            {o.label}
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
