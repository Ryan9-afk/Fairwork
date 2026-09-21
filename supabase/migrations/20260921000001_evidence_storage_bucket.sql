-- Migration: 20260921000001_evidence_storage_bucket.sql
-- Description: Create private evidence-vault bucket and RLS policies for evidence images

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence-vault',
  'evidence-vault',
  false,
  10485760, -- 10MB limit per image
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

-- RLS Policies on storage.objects for evidence-vault
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated users can upload own evidence files'
  ) then
    create policy "Authenticated users can upload own evidence files"
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'evidence-vault'
        and (select auth.uid())::text = (storage.foldername(name))[1]
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can view own evidence files'
  ) then
    create policy "Users can view own evidence files"
      on storage.objects for select
      to authenticated
      using (
        bucket_id = 'evidence-vault'
        and (select auth.uid())::text = (storage.foldername(name))[1]
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can update own evidence files'
  ) then
    create policy "Users can update own evidence files"
      on storage.objects for update
      to authenticated
      using (
        bucket_id = 'evidence-vault'
        and (select auth.uid())::text = (storage.foldername(name))[1]
      )
      with check (
        bucket_id = 'evidence-vault'
        and (select auth.uid())::text = (storage.foldername(name))[1]
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can delete own evidence files'
  ) then
    create policy "Users can delete own evidence files"
      on storage.objects for delete
      to authenticated
      using (
        bucket_id = 'evidence-vault'
        and (select auth.uid())::text = (storage.foldername(name))[1]
      );
  end if;
end $$;
