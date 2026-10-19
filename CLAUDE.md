# Nordway — Claude Code Project Guide

**Nordway** is a premium, multilingual relocation/advisory platform helping people
move from Türkiye to Finland (later Sweden & Norway) to work, start a business,
study or reunite with family. A **VOON I/O** service. Domain: `nordway.voon.fi`.

Built in **Phases**. Phase 1 (current) = scaffold + full marketing site + legal
+ live pricing engine. Phases 2+ add auth, the eligibility pre-check, onboarding
wizard, dashboard, document vault, messaging, admin/finance, and the AI assistant.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, `proxy.ts`) |
| Language | TypeScript (strict) |
| DB / Auth / Storage | Supabase (Postgres + RLS) — Phase 2 |
| i18n | next-intl 4 — `tr`, `fi`, `en` active; `sv`, `no` "coming soon" |
| Styling | Tailwind CSS v4 + shadcn/ui (new-york) |
| Icons | lucide-react · Charts: recharts (admin, Phase 2) |
| Forms | react-hook-form + zod (Phase 2) |
| AI | Anthropic API — **server-only**, default `claude-opus-4-8` |
| Deploy | GitHub → Vercel → `nordway.voon.fi` |

Mirrors the sibling VOON repo `tyo` (same Next 16 / Supabase SSR / next-intl
patterns). When in doubt about a convention, check `../tyo`.

---

## Non-negotiable legal rules (NEVER drop these)

Every one of these must stay visible in code and copy. They live in the i18n
catalogues and the `<Disclaimer>` component — do not remove or water down:

1. **Not an authority.** Nordway is not Migri and does not replace it. Official
   applications go through **Enter Finland**.
2. **No guarantee** of any residence-permit outcome — decisions rest with Migri /
   Elinvoimakeskus / Business Finland.
3. **Official fee ≠ service fee.** Always shown as separate line items. The Migri
   fee is non-refundable even on a negative decision.
4. **Scope:** information, eligibility pre-assessment, document prep/check,
   coordination, settling-in. **No legal representation / binding legal advice** —
   refer to a licensed immigration lawyer.
5. **GDPR:** explicit consent, separate Privacy Notice, data minimisation,
   encrypted storage, download/delete rights. RLS so users see only their data.
6. **Transparency:** applicants are not required to use a paid advisor — say so.
7. **Consumer protection:** transparent pricing, VAT (ALV 25.5%) shown, withdrawal
   & refund terms written down.

---

## Single sources of truth (edit in ONE place)

- **Prices** → `src/lib/pricing.ts`. All estimates flow through `estimate()`.
  Placeholder figures — Cenk sets real prices here.
- **Migri thresholds / official fees / VAT** → `src/config/migri-2026.ts`. Shown
  with a "Source: Migri — verify the current value" note.
- **Feature flags** → `src/lib/flags.ts`.
- **Locales / labels** → `src/i18n/routing.ts`.

## i18n rules

- Every user-facing string lives in `messages/{tr,fi,sv,no,en}.json`. No hard-coded
  copy in components.
- `en.json` is the base; other locales are deep-merged over it, so any missing key
  falls back to English (`src/i18n/request.ts`).
- `tr`, `fi`, `en` must be fully translated. `sv`/`no` are placeholders gated by
  `NEXT_PUBLIC_FEATURE_LOCALES_SV_NO`.
- Always import navigation from `@/i18n/navigation` (not `next/link`).

## Design

- Scandinavian, trustworthy, premium. **Light theme default**, airy, lots of
  whitespace. Tokens in `src/app/globals.css` (deep night-blue primary, ice
  neutrals, warm amber CTA via `variant="cta"`, aurora-green = positive signal).
- Demo imagery is placeholder; every demo asset carries a
  `{/* TODO: Cenk gerçek görselle değiştirecek */}` marker and lives under
  `public/demo/` when added.

## Conventions

- File layout: `app/[locale]/...` pages · `components/` (UI + marketing) ·
  `components/ui/` shadcn primitives · `lib/` · `config/` · `messages/`.
- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`) are **server-only** —
  never prefixed `NEXT_PUBLIC_`, never sent to the browser.
- Commands: `npm run dev` · `npm run build` · `npm run lint`.
- Keep changes phase-scoped and leave a working build at each step.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
