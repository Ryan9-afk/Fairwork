-- Fairwork Pulse: multi-arrangement worker context.
-- This migration is additive: existing records retain their IDs and contents.

create table if not exists public.work_arrangements (
  user_id uuid references auth.users(id) on delete cascade not null,
  id text not null,
  label text not null,
  sector text not null default 'construction'
    check (sector in ('construction', 'agriculture', 'domestic', 'gig_delivery')),
  payment_basis text not null default 'unsure'
    check (payment_basis in ('salary', 'hourly', 'daily', 'project', 'mixed', 'other', 'unsure')),
  employer_or_client text,
  confirmed boolean not null default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  primary key (user_id, id)
);

alter table public.work_arrangements enable row level security;

drop policy if exists "Users can view own work arrangements" on public.work_arrangements;
create policy "Users can view own work arrangements"
  on public.work_arrangements for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own work arrangements" on public.work_arrangements;
create policy "Users can insert own work arrangements"
  on public.work_arrangements for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own work arrangements" on public.work_arrangements;
create policy "Users can update own work arrangements"
  on public.work_arrangements for update
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own work arrangements" on public.work_arrangements;
create policy "Users can delete own work arrangements"
  on public.work_arrangements for delete
  using ((select auth.uid()) = user_id);

create index if not exists idx_work_arrangements_user_id
  on public.work_arrangements(user_id);
create index if not exists idx_work_arrangements_updated_at
  on public.work_arrangements(user_id, updated_at desc);

-- Arrangement IDs are local stable identifiers, so they intentionally remain
-- nullable on old rows. A client migration fills them with "legacy-existing-work".
alter table public.shifts
  add column if not exists arrangement_id text;
alter table public.incidents
  add column if not exists arrangement_id text;
alter table public.evidence_files
  add column if not exists arrangement_id text;

create index if not exists idx_shifts_user_arrangement
  on public.shifts(user_id, arrangement_id);
create index if not exists idx_incidents_user_arrangement
  on public.incidents(user_id, arrangement_id);
create index if not exists idx_evidence_files_user_arrangement
  on public.evidence_files(user_id, arrangement_id);
