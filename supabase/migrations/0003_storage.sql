-- ============================================================================
-- Nordway — 0003 storage (private documents bucket + RLS)
-- Run AFTER 0001/0002. Creates a PRIVATE bucket; files are only reachable via
-- short-lived signed URLs generated server-side.
--
-- Path convention (enforced by policy): {user_id}/{application_id}/{filename}
-- so a user can only touch objects under their own uid folder. Admins (via
-- public.is_admin()) can read every object for case review.
-- ============================================================================

-- Create the private bucket (id = name = 'documents'). Idempotent.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- storage.objects already has RLS enabled by Supabase. Add owner-folder policies.

drop policy if exists "documents_read_own_or_admin" on storage.objects;
create policy "documents_read_own_or_admin" on storage.objects
  for select using (
    bucket_id = 'documents' and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists "documents_insert_own" on storage.objects;
create policy "documents_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "documents_update_own_or_admin" on storage.objects;
create policy "documents_update_own_or_admin" on storage.objects
  for update using (
    bucket_id = 'documents' and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists "documents_delete_own_or_admin" on storage.objects;
create policy "documents_delete_own_or_admin" on storage.objects
  for delete using (
    bucket_id = 'documents' and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );
