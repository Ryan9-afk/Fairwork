-- ==============================================================================
-- Migration: 20260922000003_expand_work_sectors
-- Expands the work_arrangements.sector allow-list with the added categories for
-- office/professional and low-wage contract work, plus the freeform "other"
-- bucket used when the worker or the assistant proposes a category that is not
-- listed. Custom category names are kept on the arrangement `label`.
-- ==============================================================================

alter table public.work_arrangements
  drop constraint if exists work_arrangements_sector_check;

alter table public.work_arrangements
  add constraint work_arrangements_sector_check
  check (sector in (
    'construction',
    'agriculture',
    'domestic',
    'gig_delivery',
    'office_professional',
    'retail_hospitality',
    'security',
    'manufacturing',
    'general_labour',
    'cleaning_facility',
    'healthcare_care',
    'transport_psv',
    'other'
  ));
