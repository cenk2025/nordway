-- ============================================================================
-- Nordway — 0006 case deadlines / reminders
-- Run AFTER 0001–0005. Idempotent.
-- Experts set proactive deadlines on a case (permit expiry, appointment,
-- document validity…). The applicant can see them; only admins manage them.
-- ============================================================================

do $$ begin
  create type public.deadline_kind as enum
    ('permit_expiry','appointment','document_validity','submission','other');
exception when duplicate_object then null; end $$;

create table if not exists public.case_deadlines (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.deadline_kind not null default 'other',
  due_date date not null,
  note text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists case_deadlines_user_idx on public.case_deadlines(user_id);
create index if not exists case_deadlines_app_idx on public.case_deadlines(application_id);
create index if not exists case_deadlines_due_idx on public.case_deadlines(due_date);

alter table public.case_deadlines enable row level security;

-- Applicant reads their own; admins read all.
drop policy if exists case_deadlines_select on public.case_deadlines;
create policy case_deadlines_select on public.case_deadlines
  for select using (user_id = auth.uid() or public.is_admin());

-- Only admins create / update / delete deadlines.
drop policy if exists case_deadlines_insert on public.case_deadlines;
create policy case_deadlines_insert on public.case_deadlines
  for insert with check (public.is_admin());

drop policy if exists case_deadlines_update on public.case_deadlines;
create policy case_deadlines_update on public.case_deadlines
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists case_deadlines_delete on public.case_deadlines;
create policy case_deadlines_delete on public.case_deadlines
  for delete using (public.is_admin());
