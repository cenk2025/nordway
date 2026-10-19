# Nordway — Supabase setup

Apply the migrations in order in the **Supabase SQL editor**
(Dashboard → Database → SQL editor → New query → paste → Run):

1. `migrations/0001_core_schema.sql` — tables, enums, triggers, `is_admin()`
2. `migrations/0002_rls.sql` — Row Level Security policies
3. `migrations/0003_storage.sql` — private `documents` bucket + storage policies
4. `migrations/0004_hardening.sql` … `migrations/0007_consents.sql` — hardening, quotes, deadlines, consent log
5. `migrations/0008_quote_acceptance_consent.sql` — Terms + withdrawal-right choice recorded at quote acceptance

All are **idempotent** (safe to re-run).

## Auth configuration

In Dashboard → **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000` for dev, `https://nordway.voon.fi` for prod
- **Redirect URLs:** add `http://localhost:3000/**` and `https://nordway.voon.fi/**`

Email confirmation is on by default — magic links and signup confirmations are
emailed by Supabase's built-in mailer (rate-limited; wire Resend/SMTP for prod).

## Make yourself an admin

After signing up once, run this with your email to unlock `/admin`:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## Optional: seed expense categories (finance module, Phase 2D)

```sql
insert into public.expense_categories (name) values
  ('operations'), ('translation'), ('marketing'), ('subscriptions'), ('other')
on conflict (name) do nothing;
```

## RLS model (summary)

| Table | User access | Admin access |
|---|---|---|
| `profiles` | own row | all |
| `applications`, `quotes`, `documents`, `messages`, `application_addons` | own only | all |
| `transactions`, `expense_categories` | none | full |
| `audit_log` | none | read |
| storage `documents/*` | own `uid/` folder | all (review) |

Service-role server code bypasses RLS for trusted ops (account deletion, audit
inserts). The service-role key is never exposed to the browser.
