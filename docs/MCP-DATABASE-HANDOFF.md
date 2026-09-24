# Fairwork Pulse — MCP Database Handoff & Migration Status

**Date**: 22 September 2026  
**Status**: Historical report as of 22 September only. See [the current Supabase handoff](SUPABASE-HANDOFF.md) for pending 23 September migrations and recovery verification.  
**Environment**: Supabase PostgreSQL (Remote) & Next.js/Vinext App Shell  

---

## 1. Summary of Database Tasks Completed

All pending database migrations from `supabase/migrations/` have been applied to the Supabase database using the Supabase MCP (`apply_migration`), and verified with `list_migrations`, `list_tables`, `execute_sql`, and `get_advisors`.

### Applied Migrations Registry

| Version / Identifier | Migration Name | Status | Purpose |
| :--- | :--- | :--- | :--- |
| `20260921094520` | `20260921000000_fairwork_pulse_schema` | Applied | Core tables (`profiles`, `shifts`, `incidents`, `evidence_files`), trigger `handle_new_user`, RLS. |
| `20260921095506` | `20260921000001_evidence_storage_bucket` | Applied | Evidence storage bucket and storage RLS policies. |
| `20260921104202` | `20260921000002_fix_constraints_and_rls` | Applied | `UNIQUE (user_id, client_id)` on shifts/incidents, `is_encrypted` on evidence, `WITH CHECK` clauses on update policies. |
| `20260922111811` | `20260922000000_work_arrangements` | Applied | Table `work_arrangements`, composite PK (`user_id`, `id`), FK cascade, indexes, nullable `arrangement_id` on shifts, incidents, evidence. |
| `20260922111822` | `20260922000001_work_arrangement_custom_fields` | Applied | Added `custom_fields jsonb not null default '{}'::jsonb` to `work_arrangements`. |
| `20260922111830` | `20260922000002_work_arrangements_rls_with_check` | Applied | Hardened UPDATE RLS policy on `work_arrangements` with matching `WITH CHECK ((select auth.uid()) = user_id)`. |
| `20260922111838` | `20260922000003_expand_work_sectors` | Applied | Expanded `work_arrangements_sector_check` constraint covering all 13 worker sectors. |

---

## 2. Table Schema & Constraints (`public.work_arrangements`)

```sql
create table if not exists public.work_arrangements (
  user_id uuid references auth.users(id) on delete cascade not null,
  id text not null,
  label text not null,
  sector text not null default 'construction'
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
    )),
  payment_basis text not null default 'unsure'
    check (payment_basis in ('salary', 'hourly', 'daily', 'project', 'mixed', 'other', 'unsure')),
  employer_or_client text,
  confirmed boolean not null default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  custom_fields jsonb not null default '{}'::jsonb,
  primary key (user_id, id)
);
```

### Relational Enhancements
- `public.shifts.arrangement_id text`: Indexed via `idx_shifts_user_arrangement(user_id, arrangement_id)`.
- `public.incidents.arrangement_id text`: Indexed via `idx_incidents_user_arrangement(user_id, arrangement_id)`.
- `public.evidence_files.arrangement_id text`: Indexed via `idx_evidence_files_user_arrangement(user_id, arrangement_id)`.

---

## 3. Row Level Security (RLS) Verification

All tables in the `public` schema have Row Level Security enabled. Policies on `public.work_arrangements`:

- **SELECT (`Users can view own work arrangements`)**:
  `USING ((select auth.uid()) = user_id)`
- **INSERT (`Users can insert own work arrangements`)**:
  `WITH CHECK ((select auth.uid()) = user_id)`
- **UPDATE (`Users can update own work arrangements`)**:
  `USING ((select auth.uid()) = user_id)`
  `WITH CHECK ((select auth.uid()) = user_id)`
- **DELETE (`Users can delete own work arrangements`)**:
  `USING ((select auth.uid()) = user_id)`

Table privileges (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) are granted to `authenticated` and `anon` roles with RLS actively enforcing isolation.

---

## 4. Security & Performance Advisors

- **Security Advisor (`supabase db advisors` / MCP `get_advisors` type: "security")**:
  `{"result": {"lints": []}}` — 0 security vulnerabilities found.
- **Performance Advisor (MCP `get_advisors` type: "performance")**:
  Clean. Only informational notices regarding newly added indexes awaiting usage in production.

---

## 5. Verification Steps Executed

1. **Migration Application**: All 4 new SQL files applied via Supabase MCP `apply_migration`.
2. **Schema Introspection**: Verified table columns, data types, defaults, and foreign keys via Supabase MCP `list_tables(schemas: ["public"], verbose: true)`.
3. **Policy Introspection**: Queried `pg_policies` and `information_schema.role_table_grants` via Supabase MCP `execute_sql`.
4. **Codebase Test Suite**: Ran Vitest unit tests (`npm test`): 60 tests passed across 5 test suites (`legal-engine`, `work-arrangements`, `sector-agents`, `deepseek`, `crypto`).
5. **TypeScript Check**: Ran `npx tsc --noEmit`: 0 type errors.
