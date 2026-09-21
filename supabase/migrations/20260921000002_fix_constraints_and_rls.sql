-- ==============================================================================
-- Migration: 20260921000002_fix_constraints_and_rls
-- Fixes:
-- 1. Adds UNIQUE (user_id, client_id) to shifts and incidents for idempotent upsert.
-- 2. Adds is_encrypted column to evidence_files table.
-- 3. Updates RLS policies for UPDATE on shifts, incidents, profiles, and evidence_files
--    to include WITH CHECK ((select auth.uid()) = user_id) preventing privilege escalation.
-- ==============================================================================

-- 1. Unique constraints for idempotent cloud upserts
alter table public.shifts
  add constraint shifts_user_client_unique unique (user_id, client_id);

alter table public.incidents
  add constraint incidents_user_client_unique unique (user_id, client_id);

-- 2. Add is_encrypted column to evidence_files for zero-knowledge tracking
alter table public.evidence_files
  add column if not exists is_encrypted boolean default false;

-- 3. Complete RLS UPDATE policies with WITH CHECK clauses

-- Shifts
drop policy if exists "Users can update own shifts" on public.shifts;
create policy "Users can update own shifts"
  on public.shifts for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Incidents
drop policy if exists "Users can update own incidents" on public.incidents;
create policy "Users can update own incidents"
  on public.incidents for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Profiles
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Evidence Files
drop policy if exists "Users can update own evidence" on public.evidence_files;
create policy "Users can update own evidence"
  on public.evidence_files for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
