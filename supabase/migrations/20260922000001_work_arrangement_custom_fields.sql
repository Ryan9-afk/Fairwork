-- Flexible, worker-confirmed context fields for AI-assisted and manual setup.
alter table public.work_arrangements
  add column if not exists custom_fields jsonb not null default '{}'::jsonb;
