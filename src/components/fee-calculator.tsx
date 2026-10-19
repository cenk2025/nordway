"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Minus, Plus, Calculator, Sparkles } from "lucide-react";
import {
  estimate,
  formatEur,
  ADDON_IDS,
  type AddonId,
  type Complexity,
  type ServiceTier,
} from "@/lib/pricing";
import { PERMIT_CATEGORIES, type PermitCategory } from "@/config/migri-2026";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Disclaimer } from "@/components/disclaimer";
import { cn } from "@/lib/utils";

const TIERS: ServiceTier[] = ["start", "pilot", "scale"];
const COMPLEXITIES: Complexity[] = ["simple", "standard", "complex"];

/**
 * Live, transparent, itemized service-fee estimator. The marketing-facing
 * preview of the onboarding wizard's calculator. Pure client-side; every figure
 * comes from lib/pricing.ts. Always shows the official fee SEPARATELY and the
 * "estimate only / finalised after expert review" caveat.
 */
export function FeeCalculator() {
  const t = useTranslations("calc");
  const tc = useTranslations("categories");
  const locale = useLocale();

  const [category, setCategory] = useState<PermitCategory>("work");
  const [tier, setTier] = useState<ServiceTier>("pilot");
  const [complexity, setComplexity] = useState<Complexity>("standard");
  const [familyMembers, setFamilyMembers] = useState(0);
  const [urgent, setUrgent] = useState(false);
  const [addons, setAddons] = useState<AddonId[]>([]);

  const quote = useMemo(
    () => estimate({ category, tier, complexity, familyMembers, urgent, addons }),
    [category, tier, complexity, familyMembers, urgent, addons]
  );

  function toggleAddon(id: AddonId) {
    setAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  function lineLabel(key: string): string {
    if (key.startsWith("addon.")) return t(`addons.${key.slice(6)}`);
    return t(`lines.${key}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      {/* Controls */}
      <Card>
        <CardContent className="space-y-6 p-6">
          <Field label={t("category")}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PERMIT_CATEGORIES.map((c) => (
                <ChoiceChip
                  key={c}
                  active={category === c}
                  onClick={() => setCategory(c)}
                >
                  {tc(c)}
                </ChoiceChip>
              ))}
            </div>
          </Field>

          <Field label={t("tier")} hint={t(`tierDesc.${tier}`)}>
            <div className="grid grid-cols-3 gap-2">
              {TIERS.map((ti) => (
                <ChoiceChip key={ti} active={tier === ti} onClick={() => setTier(ti)}>
                  {t(`tiers.${ti}`)}
                </ChoiceChip>
              ))}
            </div>
          </Field>

          <Field label={t("complexityLabel")}>
            <div className="grid grid-cols-3 gap-2">
              {COMPLEXITIES.map((cx) => (
                <ChoiceChip
                  key={cx}
                  active={complexity === cx}
                  onClick={() => setComplexity(cx)}
                >
                  {t(`complexity.${cx}`)}
                </ChoiceChip>
              ))}
            </div>
          </Field>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t("familyMembers")}</p>
              <p className="text-xs text-muted-foreground">{t("familyMembersHint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="decrease"
                onClick={() => setFamilyMembers((n) => Math.max(0, n - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums">
                {familyMembers}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="increase"
                onClick={() => setFamilyMembers((n) => Math.min(10, n + 1))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t("urgent")}</p>
              <p className="text-xs text-muted-foreground">{t("urgentHint")}</p>
            </div>
            <input
              type="checkbox"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
              className="h-5 w-5 accent-[var(--primary)]"
            />
          </label>

          <Field label={t("addonsLabel")}>
            <div className="grid gap-2 sm:grid-cols-2">
              {ADDON_IDS.map((a) => (
                <label
                  key={a}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm transition-colors",
                    addons.includes(a)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={addons.includes(a)}
                    onChange={() => toggleAddon(a)}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  {t(`addons.${a}`)}
                </label>
              ))}
            </div>
          </Field>
        </CardContent>
      </Card>

      {/* Live estimate */}
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <div className="bg-primary px-6 py-4 text-primary-foreground">
            <p className="flex items-center gap-2 text-sm font-medium opacity-90">
              <Calculator className="h-4 w-4" />
              {t("estimateTitle")}
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">
              {formatEur(quote.rangeGross.min, locale)} –{" "}
              {formatEur(quote.rangeGross.max, locale)}
            </p>
            <p className="text-xs opacity-80">{t("vatIncl", { rate: "25.5" })}</p>
          </div>
          <CardContent className="space-y-3 p-6">
            <ul className="space-y-2 text-sm">
              {quote.lines.map((line, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{lineLabel(line.key)}</span>
                  <span className="tabular-nums">{formatEur(line.amount, locale)}</span>
                </li>
              ))}
            </ul>
            <Separator />
            <div className="flex justify-between text-sm font-medium">
              <span>{t("subtotalNet")}</span>
              <span className="tabular-nums">{formatEur(quote.subtotal, locale)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("vatLine", { rate: "25.5" })}</span>
              <span className="tabular-nums">
                {formatEur(Math.round(quote.subtotal * quote.vatRate), locale)}
              </span>
            </div>

            <Separator />

            <div className="rounded-md bg-muted/60 p-3 text-sm">
              <div className="flex justify-between font-medium">
                <span>{t("officialFee")}</span>
                <span className="tabular-nums">
                  {formatEur(quote.officialFee.min, locale)} –{" "}
                  {formatEur(quote.officialFee.max, locale)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t("officialFeeNote")}</p>
            </div>

            <Button variant="cta" size="lg" className="w-full" disabled>
              <Sparkles className="h-4 w-4" />
              {t("ctaRegister")}
            </Button>
            <p className="text-center text-xs text-muted-foreground">{t("ctaPhase2")}</p>
          </CardContent>
        </Card>

        <Disclaimer tone="warning" title={t("caveatTitle")}>
          {t("caveatBody")}
        </Disclaimer>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
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

function ChoiceChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}
