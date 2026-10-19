-- ============================================================================
-- Nordway — 0004 hardening
-- Run AFTER 0001–0003. Idempotent. (On the existing project these were already
-- applied at runtime via the service-role storage API; this file keeps a fresh
-- project reproducible.)
-- ============================================================================

-- 1) Constrain the private documents bucket: max 15 MB, PDF/JPG/PNG/WebP only.
--    Client-side checks are not enough — this is the server-enforced limit.
update storage.buckets
set file_size_limit = 15728640,
    allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp']
where id = 'documents';

-- 2) Prevent duplicate case references (NULL allowed for drafts without a ref).
create unique index if not exists applications_reference_key
  on public.applications (reference)
  where reference is not null;
