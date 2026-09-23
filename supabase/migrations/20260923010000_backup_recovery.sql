-- Support account recovery for encrypted Supabase backups.
-- National ID values are never stored. The client stores a salted, slow verifier.

alter table public.profiles
  add column if not exists recovery_id_hash text,
  add column if not exists recovery_id_salt text;

create table if not exists public.vault_recovery_metadata (
  user_id uuid references auth.users(id) on delete cascade primary key,
  salt_base64 text not null,
  verify_token_payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vault_recovery_metadata enable row level security;

drop policy if exists "Users can view own recovery metadata" on public.vault_recovery_metadata;
create policy "Users can view own recovery metadata"
  on public.vault_recovery_metadata for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own recovery metadata" on public.vault_recovery_metadata;
create policy "Users can insert own recovery metadata"
  on public.vault_recovery_metadata for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own recovery metadata" on public.vault_recovery_metadata;
create policy "Users can update own recovery metadata"
  on public.vault_recovery_metadata for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.vault_recovery_metadata from anon;
grant select, insert, update on public.vault_recovery_metadata to authenticated;
