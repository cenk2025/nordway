-- ----------------------------------------------------------------------------
-- Consent audit trail — GDPR Art. 7(1) accountability. Records WHAT a user
-- agreed to, WHEN, and against WHICH notice version. Append-only: no update
-- policy exists, and rows are never deleted individually (they cascade away
-- only if the user's account itself is deleted).
--
-- Writes happen two ways, both bypassing RLS by design (mirrors audit_log):
--   1. Signup consent — captured atomically by extending the existing
--      on_auth_user_created trigger below, reading the client-supplied
--      auth metadata set at signUp()/signInWithOtp() time.
--   2. Cookie-preference consent while a session already exists — via the
--      service-role client in src/features/consent/actions.ts.
-- Anonymous (pre-auth) cookie choices are NOT logged here; the browser cookie
-- itself (value carries the choice + notice version + timestamp) is the
-- record for that case, which is standard practice for anonymous visitors.
-- ----------------------------------------------------------------------------

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  purpose text not null check (purpose in ('account_signup', 'cookie_preferences')),
  choice text not null,
  notice_version text not null,
  created_at timestamptz not null default now()
);

create index consents_user_id_idx on public.consents(user_id);

alter table public.consents enable row level security;

create policy consents_select_own on public.consents
  for select using (user_id = auth.uid() or public.is_admin());

-- No insert/update/delete policy for authenticated/anon roles — all writes
-- go through the trigger or the service-role client, both of which bypass RLS.

-- ----------------------------------------------------------------------------
-- Extend the signup trigger (defined in 0001_core_schema.sql) to also record
-- signup-time consent when the client attaches consent_privacy_terms='true'
-- to the new user's metadata.
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

  if (new.raw_user_meta_data ->> 'consent_privacy_terms') = 'true' then
    insert into public.consents (user_id, purpose, choice, notice_version)
    values (
      new.id,
      'account_signup',
      'accepted_privacy_and_terms',
      coalesce(new.raw_user_meta_data ->> 'consent_version', 'unknown')
    );
  end if;

  return new;
end;
$$;
