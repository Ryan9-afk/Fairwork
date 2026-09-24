# Supabase handoff: backup recovery and shift categories

Prepared 24 September 2026 for an AI with Supabase MCP access.

## Task and target

Apply and verify the pending database changes for **Fairwork Pulse only**. Preserve existing accounts, records, evidence, and policies. This document supersedes the current-status claims in the older `MCP-DATABASE-HANDOFF.md`; that document records the 22 September state.

- Supabase project ref: **`hfkutilqpldaklqrurzm`**
- Project URL: `https://hfkutilqpldaklqrurzm.supabase.co`
- Deployment repository: `https://github.com/Ryan9-afk/Fairwork`, branch `main`.
- Application implementation commit: `aba43f0` (`Improve shift logging, dossiers, and backup recovery`).
- Local repository: `C:\Users\osage\OneDrive\Documents\ChatGPT projects\fairwork-pulse`.

GitHub/Vercel deployment does not apply Supabase SQL migrations. New cloud backups and recovery require the changes below. Do not put service-role keys, database passwords, raw National IDs, PINs, or real user records in reports or Git.

## Verified state versus outstanding work

A live schema-only REST request selecting `profiles.recovery_id_hash,recovery_id_salt` with `limit=0` returned HTTP 400 / PostgreSQL `42703`: `column profiles.recovery_id_hash does not exist`. The recovery migration is therefore outstanding. The shift migration's live status was not verified.

Public Auth settings indicated a configured SMS provider and `phone_autoconfirm: false`. SMS delivery, phone linking, and a complete live restore have **not** been tested. This session had no Supabase administrative credentials or MCP connection and made no database changes.

Local application checks passed: 70 tests across eight files, source ESLint (excluding the vendored minified PDF worker), TypeScript, Vinext build, and `npm run build:next`, the build used by Vercel. These checks do not establish live database or Auth correctness.

## Apply migrations through MCP

1. Confirm the project ref before writing. Inspect actual migration history, columns, constraints, policies, and grants. The older handoff lists seven migrations through `20260922000003_expand_work_sectors.sql` as applied; independently verify that historical claim.
2. Apply missing migrations in this order using the MCP migration mechanism, recording migration history. Read the exact SQL from these repository files; do not substitute a newly invented schema:
   - `supabase/migrations/20260923000000_shift_day_type.sql`
   - `supabase/migrations/20260923010000_backup_recovery.sql`
3. Do not replay already-applied non-idempotent earlier migrations, reset the database, delete records, or disable RLS to make tests pass. If existing data conflicts with a constraint, report and resolve the cause while preserving data.

The first migration adds nullable `shifts.day_type`, constrained to `normal`, `rest_day`, or `public_holiday`, and expands incident categories to include `general` alongside existing categories.

The second migration adds nullable text columns `profiles.recovery_id_hash` and `profiles.recovery_id_salt`, then creates `public.vault_recovery_metadata`:

| Column | Definition |
| --- | --- |
| `user_id` | UUID primary key, references `auth.users(id)` with cascade delete |
| `salt_base64` | Required text |
| `verify_token_payload` | Required JSONB |
| `created_at`, `updated_at` | Required timestamptz, default `now()` |

It enables RLS, grants authenticated SELECT/INSERT/UPDATE, revokes all access from the unauthenticated `anon` role, and creates own-user SELECT/INSERT/UPDATE policies using `auth.uid() = user_id`, including UPDATE `WITH CHECK`. Anonymous Auth users have the `authenticated` database role; they are distinct from unauthenticated requests using the `anon` role.

## How the app uses Supabase

- Registration/profile editing asks for a National ID (6–10 digits). The raw ID is transient; the profile stores a random salt and PBKDF2 SHA-256 verifier (600,000 iterations). Do not add a raw-ID column.
- The local vault uses AES-256-GCM with a PIN-derived key (PBKDF2 SHA-256, 100,000 iterations). Existing PIN input accepts 4–8 digits. PINs and encryption keys must never be uploaded.
- Before cloud backup, the user unlocks the vault, supplies a phone number, links it to the current anonymous Supabase account, and verifies the phone-change SMS. The client checks that the verified account is the originating account.
- Sync upserts the profile's ID verifier and the vault salt/encrypted verification token, followed by work arrangements, shifts, incidents, and evidence. Evidence uses the private `evidence-vault` Storage bucket.
- The hamburger menu's **Request backed-up data** flow asks for phone, National ID, vault PIN, and an SMS code. Recovery signs into the existing phone account with `shouldCreateUser: false`, checks the own-user ID verifier locally, then validates the PIN against the encrypted verification token locally.
- Recovery fetches own-user records in pages of 500, downloads encrypted evidence, and restores local IndexedDB records. The restored vault remains locked until unlocked with the PIN.

Relevant sources: `utils/supabase/recovery.ts`, `utils/supabase/sync.ts`, `lib/crypto.ts`, `components/cloud-sync-modal.tsx`, `components/backup-recovery-modal.tsx`, `components/worker-profile-modal.tsx`, and `types/supabase.ts`.

## Verification required after migration

Use synthetic records and approved test phone numbers/OTP facilities. Do not send messages to arbitrary real users.

1. Verify both profile columns, table definitions, constraints, RLS, and grants. Check existing owner policies and UPDATE `WITH CHECK` on profiles, arrangements, shifts, incidents, and evidence. Verify the evidence bucket remains private with owner-path restrictions.
2. Test with two separate accounts: each can read/write its own metadata and records; cross-account access and ownership reassignment are rejected. Unauthenticated requests cannot read recovery metadata. Test through user-scoped clients, not just an administrative client that bypasses RLS.
3. Confirm anonymous sign-in, phone linking, SMS provider delivery, and phone sign-in settings support the implemented flow. Keep confirmations and RLS enabled. Inspect rate limits and any required CAPTCHA integration. Report configuration changes explicitly.
4. Create a synthetic profile with ID/PIN; record normal/rest-day/public-holiday shifts, a general workplace incident, work arrangements, and evidence. Link a test phone and back up. Verify that neither raw ID nor PIN is present in database rows.
5. In an independent clean browser profile, recover with SMS + correct ID + correct PIN. Confirm all records, arrangements, attachments, and successful vault unlock. Confirm decrypted evidence hashes match saved SHA-256 values.
6. Verify wrong OTP, ID, and PIN do not import records. Verify missing recovery metadata produces a useful error. Exercise duplicate backup/retry and pagination beyond 500 records; confirm existing historical data survives.
7. Run Supabase security/performance advisors and report findings with severity and scope. Do not describe a clean advisor report as proof that the recovery design is secure.

## Known limitations to investigate, not conceal

- Old anonymous backups cannot be recovered by ID alone once the anonymous session is lost. Existing users must link a phone and upload recovery metadata from their original device before losing it.
- Phone OTP gates account access, but a short PIN has low entropy. If encrypted backup data and verification metadata are obtained, offline PIN guessing remains possible. Do not claim the four-digit PIN provides strong standalone protection.
- Current restore writes are separate IndexedDB operations, not an atomic all-store replacement. Restore merges/upserts using original local numeric IDs; collisions can overwrite records, and restoring into a populated vault using a different key/salt risks mixed data. These require application review/testing; applying SQL alone does not fix them.
- An OTP may be consumed before an incorrect ID/PIN is reported. Test retry behavior and whether a fresh SMS code is needed.
- Inspect Supabase phone-change behavior for stale pending changes. The client checks originating account identity; do not bulk-edit `auth.users` to work around account linking issues.

## Return a completion report

List the exact project, applied migration names/versions, any Auth/Storage setting changes, RLS test results, and evidence from SMS linking and clean-browser restoration. Separate verified outcomes from untested paths and remaining application issues. If app fixes are required, describe them concretely rather than marking recovery production-ready after schema application alone.
