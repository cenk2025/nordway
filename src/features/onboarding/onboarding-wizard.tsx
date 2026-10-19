"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Loader2,
  Minus,
  Plus,
  Check,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  estimate,
  formatEur,
  ADDON_IDS,
  type AddonId,
  type Complexity,
  type ServiceTier,
} from "@/lib/pricing";
import { PERMIT_CATEGORIES, INCOME_REGIONS, type PermitCategory } from "@/config/migri-2026";
import { createApplicationWithQuote } from "@/features/onboarding/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Disclaimer } from "@/components/disclaimer";
import { cn } from "@/lib/utils";

const TIERS: ServiceTier[] = ["start", "pilot", "scale"];
const COMPLEXITIES: Complexity[] = ["simple", "standard", "complex"];
const REGIONS = INCOME_REGIONS.map((r) => r.id);
const PREFILL_KEY = "nordway:eligibility";
const STEP_COUNT = 5;

export function OnboardingWizard({ initialCategory }: { initialCategory?: PermitCategory }) {
  const t = useTranslations("onboarding");
  const tcalc = useTranslations("calc");
  const tc = useTranslations("categories");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<PermitCategory>(initialCategory ?? "work");
  const [targetCity, setTargetCity] = useState("");
  const [incomeRegion, setIncomeRegion] = useState<(typeof REGIONS)[number]>("capital");
  const [complexity, setComplexity] = useState<Complexity>("standard");
  const [familyMembers, setFamilyMembers] = useState(0);
  const [urgent, setUrgent] = useState(false);
  const [tier, setTier] = useState<ServiceTier>("pilot");
  const [addons, setAddons] = useState<AddonId[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Prefill the suggested category from the eligibility pre-check, if present.
  useEffect(() => {
    if (initialCategory) return;
    try {
      const raw = sessionStorage.getItem(PREFILL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { category?: PermitCategory };
        if (parsed.category && PERMIT_CATEGORIES.includes(parsed.category)) {
          // Reading sessionStorage on mount is a client-only external-store
          // sync — the canonical use of an effect.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCategory(parsed.category);
        }
      }
    } catch {
      /* ignore */
    }
  }, [initialCategory]);

  const quote = useMemo(
    () => estimate({ category, tier, complexity, familyMembers, urgent, addons }),
    [category, tier, complexity, familyMembers, urgent, addons]
  );

  function toggleAddon(id: AddonId) {
    setAddons((p) => (p.includes(id) ? p.filter((a) => a !== id) : [...p, id]));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createApplicationWithQuote({
        category,
        tier,
        complexity,
        targetCity,
        incomeRegion,
        familyMembers,
        urgent,
        addons,
        notes,
      });
      if (res.ok) {
        sessionStorage.removeItem(PREFILL_KEY);
        router.push(`/dashboard/${res.id}`);
        router.refresh();
      } else {
        setError(t(`error.${res.error}`));
      }
    });
  }

  const progress = Math.round(((step + 1) / STEP_COUNT) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t(`steps.${step}`)}</span>
              <span>{t("stepOf", { n: step + 1, total: STEP_COUNT })}</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Step 0 — category */}
          {step === 0 && (
            <Field label={t("fields.category")}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PERMIT_CATEGORIES.map((c) => (
                  <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                    {tc(c)}
                  </Chip>
                ))}
              </div>
            </Field>
          )}

          {/* Step 1 — destination */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="city">{t("fields.city")}</Label>
                <Input
                  id="city"
                  value={targetCity}
                  onChange={(e) => setTargetCity(e.target.value)}
                  placeholder={t("fields.cityPlaceholder")}
                />
              </div>
              <Field label={t("fields.region")} hint={t("fields.regionHint")}>
                <div className="grid grid-cols-3 gap-2">
                  {REGIONS.map((r) => (
                    <Chip key={r} active={incomeRegion === r} onClick={() => setIncomeRegion(r)}>
                      {t(`regions.${r}`)}
                    </Chip>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* Step 2 — situation */}
          {step === 2 && (
            <div className="space-y-5">
              <Field label={tcalc("complexityLabel")}>
                <div className="grid grid-cols-3 gap-2">
                  {COMPLEXITIES.map((cx) => (
                    <Chip key={cx} active={complexity === cx} onClick={() => setComplexity(cx)}>
                      {tcalc(`complexity.${cx}`)}
                    </Chip>
                  ))}
                </div>
              </Field>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{tcalc("familyMembers")}</p>
                  <p className="text-xs text-muted-foreground">{tcalc("familyMembersHint")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" aria-label="decrease" onClick={() => setFamilyMembers((n) => Math.max(0, n - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">{familyMembers}</span>
                  <Button variant="outline" size="icon" aria-label="increase" onClick={() => setFamilyMembers((n) => Math.min(10, n + 1))}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{tcalc("urgent")}</p>
                  <p className="text-xs text-muted-foreground">{tcalc("urgentHint")}</p>
                </div>
                <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />
              </label>
            </div>
          )}

          {/* Step 3 — service level + addons */}
          {step === 3 && (
            <div className="space-y-5">
              <Field label={tcalc("tier")} hint={tcalc(`tierDesc.${tier}`)}>
                <div className="grid grid-cols-3 gap-2">
                  {TIERS.map((ti) => (
                    <Chip key={ti} active={tier === ti} onClick={() => setTier(ti)}>
                      {tcalc(`tiers.${ti}`)}
                    </Chip>
                  ))}
                </div>
              </Field>
              <Field label={tcalc("addonsLabel")}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ADDON_IDS.map((a) => (
                    <label
                      key={a}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm transition-colors",
                        addons.includes(a) ? "border-primary bg-primary/5" : "hover:bg-accent"
                      )}
                    >
                      <input type="checkbox" checked={addons.includes(a)} onChange={() => toggleAddon(a)} className="h-4 w-4 accent-[var(--primary)]" />
                      {tcalc(`addons.${a}`)}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* Step 4 — review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="notes">{t("fields.notes")}</Label>
                <textarea
                  id="notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("fields.notesPlaceholder")}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Disclaimer tone="warning" title={tcalc("caveatTitle")}>
                {tcalc("caveatBody")}
              </Disclaimer>
              {error && (
                <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" disabled={step === 0 || isPending} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              <ArrowLeft className="h-4 w-4" /> {t("back")}
            </Button>
            {step < STEP_COUNT - 1 ? (
              <Button variant="cta" onClick={() => setStep((s) => Math.min(STEP_COUNT - 1, s + 1))}>
                {t("next")} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="cta" onClick={submit} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {t("submit")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live quote panel */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card className="overflow-hidden">
          <div className="bg-primary px-6 py-4 text-primary-foreground">
            <p className="flex items-center gap-2 text-sm font-medium opacity-90">
              <Calculator className="h-4 w-4" /> {tcalc("estimateTitle")}
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">
              {formatEur(quote.rangeGross.min, locale)} – {formatEur(quote.rangeGross.max, locale)}
            </p>
            <p className="text-xs opacity-80">{tcalc("vatIncl", { rate: "25.5" })}</p>
          </div>
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
                  {formatEur(quote.officialFee.min, locale)} – {formatEur(quote.officialFee.max, locale)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{tcalc("officialFeeNote")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}
