/**
 * ============================================================================
 * Nordway pricing engine — SINGLE SOURCE OF TRUTH for service-fee estimation.
 * ============================================================================
 *
 * Change prices HERE only. Every estimate in the app (live calculator on the
 * pricing page, onboarding wizard, admin quote draft) goes through `estimate()`.
 *
 * NOTE: The figures below are PLACEHOLDERS to demonstrate the structure — Cenk
 * sets the real prices. They are Nordway's *service* fee and DO NOT include the
 * official Migri/Enter Finland handling fee, which is always shown separately
 * (see OFFICIAL_FEE_RANGE in config/migri-2026.ts) and is non-refundable.
 *
 * Output is always a RANGE, never a single number, and carries the caveat that
 * it is finalised only after an expert review — Nordway never guarantees a price
 * or an outcome.
 */

import {
  VAT_RATE,
  OFFICIAL_FEE_RANGE,
  type PermitCategory,
} from "@/config/migri-2026";

/** Service tiers, mirroring the wider VOON Start / Pilot / Scale model. */
export type ServiceTier = "start" | "pilot" | "scale";

/** Case complexity, set by the user (later confirmed by the expert). */
export type Complexity = "simple" | "standard" | "complex";

/** Optional settling-in add-on services. */
export type AddonId =
  | "housing"
  | "bankRegistration"
  | "insurance"
  | "translation"
  | "languageCourse";

export const ADDON_IDS: AddonId[] = [
  "housing",
  "bankRegistration",
  "insurance",
  "translation",
  "languageCourse",
];

// --- Editable price table (PLACEHOLDER values) ------------------------------

/** Base service fee per permit category (EUR, ex VAT). */
export const BASE_FEE: Record<PermitCategory, number> = {
  work: 350,
  blueCard: 350,
  entrepreneur: 600,
  startup: 600,
  student: 250,
  family: 400,
  permanent: 300,
};

/** Complexity multiplier applied to the base fee. */
export const COMPLEXITY_MULTIPLIER: Record<Complexity, number> = {
  simple: 1.0,
  standard: 1.3,
  complex: 1.7,
};

/**
 * Tier multiplier applied to the (base × complexity) figure. Start is mostly
 * self-guided (lowest), Scale is end-to-end full-service (highest).
 */
export const TIER_MULTIPLIER: Record<ServiceTier, number> = {
  start: 0.6,
  pilot: 1.0,
  scale: 1.6,
};

/** Extra fee per additional household member (EUR, ex VAT). */
export const PER_FAMILY_MEMBER = 120;

/** Priority/expedited handling surcharge (EUR, ex VAT). */
export const URGENCY_FEE = 150;

/** Settling-in add-on prices (EUR, ex VAT). */
export const ADDON_FEE: Record<AddonId, number> = {
  housing: 200,
  bankRegistration: 90,
  insurance: 60,
  translation: 80,
  languageCourse: 70,
};

/**
 * Spread applied around the computed subtotal to express that this is an
 * estimate, not a fixed quote (e.g. ±15% → 450–700). Tune in one place.
 */
export const RANGE_SPREAD = 0.15;

// --- Engine -----------------------------------------------------------------

export interface EstimateInput {
  category: PermitCategory;
  tier: ServiceTier;
  complexity: Complexity;
  /** Additional household members beyond the main applicant (>= 0). */
  familyMembers: number;
  urgent: boolean;
  addons: AddonId[];
}

export interface QuoteLine {
  /** i18n key suffix under `pricing.lines.*`, or a literal for add-ons. */
  key: string;
  /** EUR amount (ex VAT) this line contributes. */
  amount: number;
}

export interface Quote {
  lines: QuoteLine[];
  /** Service subtotal, ex VAT. */
  subtotal: number;
  /** Low/high service estimate, ex VAT (subtotal ± RANGE_SPREAD, rounded). */
  rangeNet: { min: number; max: number };
  /** Low/high service estimate, incl VAT. */
  rangeGross: { min: number; max: number };
  vatRate: number;
  /** Official Migri/Enter Finland fee — shown SEPARATELY, not part of subtotal. */
  officialFee: { min: number; max: number };
}

const clampInt = (n: number) => Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));
const roundTo = (n: number, step = 10) => Math.round(n / step) * step;

/** Compute an itemized, ranged service-fee estimate. Pure + deterministic. */
export function estimate(input: EstimateInput): Quote {
  const familyMembers = clampInt(input.familyMembers);
  const lines: QuoteLine[] = [];

  const base = BASE_FEE[input.category] ?? 0;
  const complexityMul = COMPLEXITY_MULTIPLIER[input.complexity] ?? 1;
  const tierMul = TIER_MULTIPLIER[input.tier] ?? 1;

  const coreFee = base * complexityMul * tierMul;
  lines.push({ key: "base", amount: coreFee });

  if (familyMembers > 0) {
    lines.push({
      key: "familyMembers",
      amount: PER_FAMILY_MEMBER * familyMembers,
    });
  }

  if (input.urgent) {
    lines.push({ key: "urgency", amount: URGENCY_FEE });
  }

  for (const addon of input.addons) {
    const fee = ADDON_FEE[addon];
    if (fee) lines.push({ key: `addon.${addon}`, amount: fee });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);

  const rangeNet = {
    min: roundTo(subtotal * (1 - RANGE_SPREAD)),
    max: roundTo(subtotal * (1 + RANGE_SPREAD)),
  };
  const rangeGross = {
    min: roundTo(rangeNet.min * (1 + VAT_RATE)),
    max: roundTo(rangeNet.max * (1 + VAT_RATE)),
  };

  const official = OFFICIAL_FEE_RANGE[input.category];

  return {
    lines,
    subtotal: roundTo(subtotal),
    rangeNet,
    rangeGross,
    vatRate: VAT_RATE,
    officialFee: { min: official.onlineMin, max: official.onlineMax },
  };
}

/** Format an EUR amount for display, locale-aware. */
export function formatEur(amount: number, locale = "en"): string {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : locale === "fi" ? "fi-FI" : "en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
