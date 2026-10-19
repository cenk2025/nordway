/**
 * ============================================================================
 * Migri 2026 reference data — SINGLE SOURCE OF TRUTH for official thresholds.
 * ============================================================================
 *
 * Every income threshold, region tier and official-fee figure shown in the app
 * is read from this file. When Migri updates a value, change it HERE only.
 *
 * IMPORTANT: These are REFERENCE values sourced from Migri (Maahanmuuttovirasto)
 * for 2026 and may change. Always show them next to a "Source: Migri — verify
 * the current value" note (see `migri.disclaimer` in the message catalogues).
 * Nordway is not an authority and does not guarantee these figures.
 *
 * Sources to re-verify periodically:
 *   - https://migri.fi  (residence permits, income requirements)
 *   - https://enterfinland.fi  (official applications + current handling fees)
 *   - https://www.businessfinland.fi  (startup eligibility statement)
 */

export const MIGRI_LAST_VERIFIED = "2026-10" as const;
export const MIGRI_SOURCE_URL = "https://migri.fi" as const;
export const ENTER_FINLAND_URL = "https://enterfinland.fi" as const;
export const BUSINESS_FINLAND_URL = "https://www.businessfinland.fi" as const;

/** Permit / service categories. These keys are the join between pricing, i18n and config. */
export type PermitCategory =
  | "work"
  | "blueCard"
  | "entrepreneur"
  | "startup"
  | "student"
  | "family"
  | "permanent";

export const PERMIT_CATEGORIES: PermitCategory[] = [
  "work",
  "blueCard",
  "entrepreneur",
  "startup",
  "student",
  "family",
  "permanent",
];

/**
 * Income region tiers used for startup / some income thresholds. Migri applies
 * different subsistence figures depending on cost-of-living region.
 */
export type IncomeRegion = "capital" | "majorCity" | "other";

export const INCOME_REGIONS: { id: IncomeRegion; exampleCities: string[] }[] = [
  { id: "capital", exampleCities: ["Helsinki", "Espoo", "Vantaa", "Kauniainen"] },
  { id: "majorCity", exampleCities: ["Tampere", "Jyväskylä", "Kuopio", "Turku", "Oulu"] },
  { id: "other", exampleCities: ["Other municipalities"] },
];

/**
 * Reference thresholds per category. `monthly`/`yearly` are EUR. `note` keys
 * point at extra context shown in the UI. All figures are 2026 references.
 */
export interface CategoryThreshold {
  /** Minimum gross monthly income (EUR), where a single figure applies. */
  grossMonthly?: number;
  /** Minimum net monthly income (EUR), where Migri specifies net. */
  netMonthly?: number;
  /** Net monthly figures by region (startup entrepreneur). */
  netMonthlyByRegion?: Record<IncomeRegion, number>;
  /** Required funds for the first year (EUR), e.g. students. */
  firstYearFunds?: number;
  /** Whether a concrete income figure applies or it's case-by-case. */
  caseByCase?: boolean;
}

export const CATEGORY_THRESHOLDS: Record<PermitCategory, CategoryThreshold> = {
  // Worker (TTOL) — sector collective agreement (TES) may set a higher figure.
  work: { grossMonthly: 1600 },
  // EU Blue Card — highly qualified employment.
  blueCard: { grossMonthly: 3937 },
  // Entrepreneur — two-stage (Elinvoimakeskus partial decision, then Migri).
  // Subsistence assessed case-by-case against business viability.
  entrepreneur: { caseByCase: true },
  // Startup entrepreneur — requires a positive Business Finland Eligibility
  // Statement first. Net subsistence varies by region.
  startup: {
    netMonthlyByRegion: { capital: 1210, majorCity: 1090, other: 1030 },
  },
  // Student — private health insurance required; funds for the first year.
  student: { netMonthly: 800, firstYearFunds: 9600 },
  // Family reunification — net income requirement scales with household size.
  family: { caseByCase: true },
  // Permanent residence (P / P-EU) — from 8.1.2026, language certificate and/or
  // employment-history conditions apply in addition to the required period.
  permanent: { caseByCase: true },
};

/**
 * Indicative official handling fees (EUR) paid TO Migri/Enter Finland — these
 * are NOT Nordway's service fee and are always shown as a separate line.
 * Online applications are cheaper than paper. Verify current fees at Enter Finland.
 * Stored as a range because fees differ by exact permit and channel.
 *
 * 2026 price list (in force 1.1.2026), first permits, online:
 *   employed person 750 · specialist / EU Blue Card 530 · entrepreneur 750 ·
 *   student 600 · family ties: spouse 750, minor child from 400 ·
 *   permanent residence 380 (minor 300).
 * Start-up entrepreneur: sources disagree (650 at missions vs 750) — kept as a range.
 */
export const OFFICIAL_FEE_RANGE: Record<PermitCategory, { onlineMin: number; onlineMax: number }> = {
  work: { onlineMin: 750, onlineMax: 750 },
  blueCard: { onlineMin: 530, onlineMax: 530 },
  entrepreneur: { onlineMin: 750, onlineMax: 750 },
  startup: { onlineMin: 650, onlineMax: 750 },
  student: { onlineMin: 600, onlineMax: 600 },
  family: { onlineMin: 400, onlineMax: 750 },
  permanent: { onlineMin: 300, onlineMax: 380 },
};

/** Finnish VAT (ALV) rate applied to Nordway's service fee, as of 2026. */
export const VAT_RATE = 0.255 as const;
