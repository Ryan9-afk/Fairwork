-- ==============================================================================
-- Migration: 20260922000002_work_arrangements_rls_with_check
-- Fixes:
--   The work_arrangements UPDATE policy from 20260922000000 was created with a
--   USING clause but no WITH CHECK. Without WITH CHECK, an authenticated user
--   could rewrite the user_id of a row they own, moving the row into another
--   user's tenant (or planting rows under another user's id). This mirrors the
--   hardening already applied to shifts, incidents, profiles, and evidence in
--   20260921000002_fix_constraints_and_rls.
-- ==============================================================================

drop policy if exists "Users can update own work arrangements" on public.work_arrangements;
create policy "Users can update own work arrangements"
  on public.work_arrangements for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
