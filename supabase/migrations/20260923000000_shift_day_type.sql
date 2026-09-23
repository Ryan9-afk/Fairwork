alter table public.shifts add column if not exists day_type text check (day_type in ('normal', 'rest_day', 'public_holiday'));
alter table public.incidents drop constraint if exists incidents_category_check;
alter table public.incidents add constraint incidents_category_check check (category in ('injury', 'wages', 'maternity', 'termination', 'safety', 'general'));
