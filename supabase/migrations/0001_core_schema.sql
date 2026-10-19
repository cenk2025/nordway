-- ============================================================================
-- Nordway — 0001 core schema
-- Run this in the Supabase SQL editor (Database → SQL editor) FIRST.
-- Re-runnable: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- RLS policies live in 0002_rls.sql; storage in 0003_storage.sql — run in order.
-- ============================================================================

-- Enable extensions we rely on (pgcrypto for gen_random_uuid).
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('user','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.permit_category as enum
    ('work','blueCard','entrepreneur','startup','student','family','permanent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.service_tier as enum ('start','pilot','scale');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.case_complexity as enum ('simple','standard','complex');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.application_status as enum
    ('draft','submitted','in_review','docs_needed','ready','submitted_to_authority','decided','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.quote_status as enum ('draft','sent','accepted','declined');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_status as enum ('pending','in_review','approved','fix_needed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.txn_type as enum ('income','expense');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.txn_status as enum ('paid','pending');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Shared updated_at trigger function
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ----------------------------------------------------------------------------
-- profiles — one row per auth user (auto-created on signup, see trigger).
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  locale text not null default 'en',
  country text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- applications — one relocation case per row, owned by a user.
-- ----------------------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category public.permit_category not null,
  tier public.service_tier not null default 'pilot',
  complexity public.case_complexity not null default 'standard',
  target_country text not null default 'FI',
  target_city text,
  income_region text,                  -- 'capital' | 'majorCity' | 'other'
  family_members int not null default 0 check (family_members >= 0 and family_members <= 20),
  urgent boolean not null default false,
  status public.application_status not null default 'draft',
  reference text,                      -- human-friendly case ref (e.g. NW-2026-0001)
  notes text,                          -- applicant-supplied context
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists applications_user_idx on public.applications(user_id);
create index if not exists applications_status_idx on public.applications(status);

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at before update on public.applications
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- application_addons — selected settling-in add-ons for a case.
-- ----------------------------------------------------------------------------
create table if not exists public.application_addons (
  application_id uuid not null references public.applications(id) on delete cascade,
  addon_id text not null,              -- matches AddonId in lib/pricing.ts
  primary key (application_id, addon_id)
);

-- ----------------------------------------------------------------------------
-- quotes — itemized service-fee estimate snapshot for a case.
-- Money stored in EUR (numeric). Lines mirror lib/pricing.ts Quote.lines.
-- ----------------------------------------------------------------------------
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  lines jsonb not null default '[]'::jsonb,
  subtotal_net numeric not null default 0,
  vat_rate numeric not null default 0.255,
  range_net_min numeric not null default 0,
  range_net_max numeric not null default 0,
  range_gross_min numeric not null default 0,
  range_gross_max numeric not null default 0,
  official_fee_min numeric not null default 0,
  official_fee_max numeric not null default 0,
  currency text not null default 'EUR',
  status public.quote_status not null default 'draft',
  created_at timestamptz not null default now()
);
create index if not exists quotes_application_idx on public.quotes(application_id);
create index if not exists quotes_user_idx on public.quotes(user_id);

-- ----------------------------------------------------------------------------
-- documents — metadata for files in the private 'documents' storage bucket.
-- ----------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_type text not null,              -- passport, contract, income_proof, diploma...
  file_name text not null,
  storage_path text not null,          -- {user_id}/{application_id}/{uuid}-{name}
  status public.document_status not null default 'pending',
  review_note text,
  uploaded_at timestamptz not null default now()
);
create index if not exists documents_application_idx on public.documents(application_id);
create index if not exists documents_user_idx on public.documents(user_id);

-- ----------------------------------------------------------------------------
-- messages — secure expert ⇄ applicant thread, scoped to an application.
-- ----------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role public.app_role not null default 'user',
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_application_idx on public.messages(application_id, created_at);

-- ----------------------------------------------------------------------------
-- expense_categories — admin-managed lookup for the finance module.
-- ----------------------------------------------------------------------------
create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- transactions — income & expense ledger (admin/finance module).
-- application_id is optional (standalone income/expense allowed).
-- ----------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  type public.txn_type not null,
  application_id uuid references public.applications(id) on delete set null,
  category text,                       -- free text or expense_categories.name
  amount numeric not null,             -- gross amount in `currency`
  vat numeric not null default 0,      -- VAT portion (ALV)
  currency text not null default 'EUR',
  description text,
  occurred_on date not null default current_date,
  status public.txn_status not null default 'paid',
  created_at timestamptz not null default now()
);
create index if not exists transactions_occurred_idx on public.transactions(occurred_on);
create index if not exists transactions_type_idx on public.transactions(type);

-- ----------------------------------------------------------------------------
-- audit_log — append-only record for GDPR & trust.
-- ----------------------------------------------------------------------------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- is_admin() — SECURITY DEFINER helper used by RLS policies to grant admins
-- access to all rows. Reads the caller's role from profiles.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- Auto-create a profile row when a new auth user signs up.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, locale, country)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'locale', 'en'),
    new.raw_user_meta_data ->> 'country'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
