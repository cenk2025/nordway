-- ============================================================================
-- Nordway — 0005 quotes are server/admin-authoritative
-- Run AFTER 0001–0004. Idempotent.
--
-- Money must not be forgeable by clients. Previously quotes_insert_own /
-- quotes_update let a signed-in user write their own quote via the anon client.
-- Now: users may only SELECT their quotes; INSERT is done server-side with the
-- service-role key (see features/onboarding/actions.ts, which computes the quote
-- from lib/pricing.ts); UPDATE/DELETE are admin-only.
-- ============================================================================

-- Remove client insert entirely (service-role bypasses RLS for the wizard).
drop policy if exists quotes_insert_own on public.quotes;

-- Update is admin-only (admins adjust/confirm quotes in the back-office).
drop policy if exists quotes_update on public.quotes;
create policy quotes_update on public.quotes
  for update using (public.is_admin()) with check (public.is_admin());

-- Delete is admin-only (user rows still cascade away on account/case deletion).
drop policy if exists quotes_delete on public.quotes;
create policy quotes_delete on public.quotes
  for delete using (public.is_admin());

-- (quotes_select stays: a user can read their own quotes; admins read all.)
