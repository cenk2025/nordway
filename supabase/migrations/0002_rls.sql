-- ============================================================================
-- Nordway — 0002 Row Level Security
-- Run AFTER 0001_core_schema.sql.
-- Model: each user can access only their own applications/quotes/documents/
-- messages/addons. Admins (profiles.role = 'admin') can access everything via
-- public.is_admin(). transactions + expense_categories are ADMIN ONLY.
-- ============================================================================

alter table public.profiles            enable row level security;
alter table public.applications        enable row level security;
alter table public.application_addons  enable row level security;
alter table public.quotes              enable row level security;
alter table public.documents           enable row level security;
alter table public.messages            enable row level security;
alter table public.transactions        enable row level security;
alter table public.expense_categories  enable row level security;
alter table public.audit_log           enable row level security;

-- ----------------------------------------------------------------------------
-- profiles — owner can read/update own row; admins read all. No client inserts
-- (the signup trigger creates the row); no client role escalation on update.
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
  for delete using (id = auth.uid());

-- ----------------------------------------------------------------------------
-- applications — full owner CRUD; admins read/update all.
-- ----------------------------------------------------------------------------
drop policy if exists applications_select on public.applications;
create policy applications_select on public.applications
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists applications_insert_own on public.applications;
create policy applications_insert_own on public.applications
  for insert with check (user_id = auth.uid());

drop policy if exists applications_update on public.applications;
create policy applications_update on public.applications
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists applications_delete_own on public.applications;
create policy applications_delete_own on public.applications
  for delete using (user_id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- application_addons — access follows the parent application's ownership.
-- ----------------------------------------------------------------------------
drop policy if exists addons_all on public.application_addons;
create policy addons_all on public.application_addons
  for all using (
    public.is_admin() or exists (
      select 1 from public.applications a
      where a.id = application_id and a.user_id = auth.uid()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.applications a
      where a.id = application_id and a.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- quotes — owner reads own; owner may create draft estimates; admins manage all.
-- ----------------------------------------------------------------------------
drop policy if exists quotes_select on public.quotes;
create policy quotes_select on public.quotes
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists quotes_insert_own on public.quotes;
create policy quotes_insert_own on public.quotes
  for insert with check (user_id = auth.uid());

drop policy if exists quotes_update on public.quotes;
create policy quotes_update on public.quotes
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists quotes_delete on public.quotes;
create policy quotes_delete on public.quotes
  for delete using (user_id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- documents — owner CRUD; admins read/update (review) all.
-- ----------------------------------------------------------------------------
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists documents_insert_own on public.documents;
create policy documents_insert_own on public.documents
  for insert with check (user_id = auth.uid());

drop policy if exists documents_update on public.documents;
create policy documents_update on public.documents
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists documents_delete_own on public.documents;
create policy documents_delete_own on public.documents
  for delete using (user_id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- messages — participants of the application (owner) + admins. Sender must be
-- the caller. Read receipts handled via update of read_at.
-- ----------------------------------------------------------------------------
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select using (
    public.is_admin() or exists (
      select 1 from public.applications a
      where a.id = application_id and a.user_id = auth.uid()
    )
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid() and (
      public.is_admin() or exists (
        select 1 from public.applications a
        where a.id = application_id and a.user_id = auth.uid()
      )
    )
  );

drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages
  for update using (
    public.is_admin() or exists (
      select 1 from public.applications a
      where a.id = application_id and a.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- transactions + expense_categories — ADMIN ONLY (finance module).
-- ----------------------------------------------------------------------------
drop policy if exists transactions_admin_all on public.transactions;
create policy transactions_admin_all on public.transactions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists expense_categories_admin_all on public.expense_categories;
create policy expense_categories_admin_all on public.expense_categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- audit_log — admins may read; inserts happen via SECURITY DEFINER server code
-- (service role) so no client insert policy is granted.
-- ----------------------------------------------------------------------------
drop policy if exists audit_log_admin_select on public.audit_log;
create policy audit_log_admin_select on public.audit_log
  for select using (public.is_admin());
