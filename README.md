# Nordway

> Your trusted path to the North. · Luotettava reittisi pohjoiseen. · Kuzeye giden güvenilir yolun.

**Nordway** is a premium, multilingual relocation & advisory platform for people
moving from **Türkiye to Finland** (Sweden & Norway in later phases) — to work,
start a business, study or reunite with family. A **VOON IQ** service.

This repository currently contains **Phase 1**: the full marketing site, legal
framework, i18n, design system and the live, transparent **pricing engine**.
Auth, the eligibility pre-check, onboarding wizard, dashboard, document vault,
messaging, admin/finance and the AI assistant land in later phases.

---

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 + shadcn/ui · next-intl 4 ·
Supabase (Phase 2) · Anthropic API (server-only) · deployed on Vercel.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in when ready; the marketing site runs without real keys
npm run dev                  # http://localhost:3000  → redirects to /en
```

Other commands:

```bash
npm run build    # production build
npm run lint     # eslint
```

## Environment variables

See `.env.example`. The site renders with placeholder values; Supabase/Anthropic
features degrade gracefully until real keys are provided.

| Var | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` | public | Supabase (RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | trusted ops; never exposed |
| `ANTHROPIC_API_KEY` | **server only** | AI assistant / case drafts (Phase 2) |
| `NEXT_PUBLIC_SITE_URL` | public | auth redirect base URL |
| `NEXT_PUBLIC_FEATURE_LOCALES_SV_NO` | public | enable sv/no locales |

## Languages

`tr`, `fi`, `en` are fully translated. `sv`, `no` are **"coming soon"** —
visible but disabled in the switcher until `NEXT_PUBLIC_FEATURE_LOCALES_SV_NO=true`.

**Adding a language:** add the locale to `src/i18n/routing.ts` (and its label),
create `messages/<locale>.json` (any missing key falls back to English), done.

## Where to change things

| Want to change… | Edit |
|---|---|
| **Prices** | `src/lib/pricing.ts` (single source of truth) |
| **Migri thresholds / official fees / VAT** | `src/config/migri-2026.ts` |
| **Copy / translations** | `messages/*.json` |
| **Design tokens** | `src/app/globals.css` |
| **Feature flags** | `src/lib/flags.ts` |

> ⚠️ Migri figures are **2026 references** and may change — every figure is shown
> with a "verify the current value" note. Update them in `config/migri-2026.ts`.

## Legal posture

Nordway is **not** a government authority and does not replace Migri. It offers
information, eligibility pre-assessment, document prep, coordination and
settling-in support — **not** legal representation, and **no** outcome guarantee.
Official Migri fees are always shown separately and are non-refundable. See the
in-app Privacy Notice, Terms, Cookie Policy and Service Scope & Disclaimer, and
`CLAUDE.md` for the rules that must never be dropped.

## Deployment

GitHub → Vercel (auto-deploy on `main`) → custom domain `nordway.fi`.
Set the env vars above in Vercel; add `nordway.fi` under Domains; in Supabase
Auth set Site/Redirect URL to `https://nordway.fi`.

---

A **VOON IQ** service.
