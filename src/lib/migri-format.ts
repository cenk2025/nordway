import { CATEGORY_THRESHOLDS, type PermitCategory } from "@/config/migri-2026";

/** Build a short, human threshold string from the config for a category. */
export function thresholdText(category: PermitCategory, caseByCase: string): string {
  const th = CATEGORY_THRESHOLDS[category];
  if (th.caseByCase) return caseByCase;
  if (th.netMonthlyByRegion) {
    const r = th.netMonthlyByRegion;
    return `${r.capital} / ${r.majorCity} / ${r.other} €/mo`;
  }
  if (th.grossMonthly) return `≥ ${th.grossMonthly} €/mo`;
  if (th.netMonthly) {
    return th.firstYearFunds
      ? `${th.netMonthly} €/mo · ${th.firstYearFunds} €/yr`
      : `${th.netMonthly} €/mo`;
  }
  return caseByCase;
}
