# Fairwork Pulse — AI Handoff

Last updated: 22 September 2026  
Current source branch: main  
Deployment: configure the target host from the repository after applying the Supabase migration

## 1. Mission

Fairwork Pulse is a hackathon MVP for workers across Kenyan sectors, from salaried office staff to casual, gig, and informal workers. It helps a worker create a private, contemporaneous record of work, payments, wage shortfalls, overtime, and workplace incidents, then package those records into a Haki Dossier for dispute support.

Core promise: **Proof of Work. Power to Remedy.**

The worker—not an employer or platform—controls the evidence. The main use case is a low- or mid-range phone at the end of a shift, often with unreliable connectivity. The target logging time is under 30 seconds.

Hackathon context: Strathmore/iLab, 24–25 September 2026; submission deadline 25 September at 1:00 PM EAT.

Read [PRODUCT.md](PRODUCT.md) before changing scope or product claims.

## 2. Current product behavior

### Working now

- Mobile-first shift logger for employer/site, date, start/end time, agreed pay, amount received, and Sunday/public-holiday status.
- Live indicative wage-shortfall and overtime calculation before saving.
- Shift records persist in browser `localStorage`.
- Records ledger with total indicated amount due.
- Incident flow for workplace injury, withheld wages, and maternity discrimination.
- Incident form with date, description, and a demo attachment action.
- Haki Dossier preview with record totals, evidence count, legal references, and browser print/PDF action.
- English/Kiswahili language toggle for core product copy.
- Multiple confirmed work arrangements per worker (job/client, sector, payment basis, and employer/platform context).
- Four config-driven sector specialists behind one server-only DeepSeek router: construction/artisans, agriculture/tea, domestic/care, and gig delivery/boda boda.
- Confirmation-first AI setup suggestions with assumptions, up to three high-value missing questions, confidence, review status, and source IDs. The assistant asks for only one or two sentences, avoids restating the worker's message, fills standard fields, and turns unexpected details into editable custom fields. Suggestions are never saved automatically.
- `/api/ai/chat`, `/api/ai/work-setup`, `/api/ai/concern`, and `/api/ai/document` with Zod validation, request limits, rate limiting, timeout, source allowlisting, and deterministic fallback.
- Existing IndexedDB records migrate to a stable `legacy-existing-work` arrangement without changing IDs or contents.
- Query-backed navigation:
  - `?screen=records`
  - `?screen=incidents`
  - `?screen=dossier`
- Production deployment through OpenAI Sites.

### Demonstration-only behavior

- DeepSeek is optional; without `DEEPSEEK_API_KEY`, the app uses a local fallback and manual setup remains available.
- Demo mode uses in-memory synthetic records and disables cloud upload; it must never be used as a worker's real ledger.
- Digital document analysis currently accepts worker-previewed text through the document API; image-only scans remain evidence attachments for manual review.
- Names, employers, locations, amounts, and existing records in the sample journey are fictional demo data.
- Legal calculations are indicative, not legal advice.

## 3. Visual system

The current visual direction is **The Pocket Evidence Wallet**: a polished, iPhone-inspired work-record interface adapted from financial-wallet interaction patterns without copying banking brands or proprietary Apple assets.

Key characteristics:

- Warm neutral ground with crisp white working surfaces.
- Prominent wallet-style “amount due” summary.
- Pill-shaped quick actions.
- Five-position floating bottom dock with a raised yellow log-shift action.
- Mint for supportive/protective actions, blue for navigation, yellow for capture, and red only for risk.
- Native SF Pro on Apple devices; self-hosted Geist on Windows and Android.

Design sources of truth:

- [DESIGN.md](DESIGN.md)
- [.impeccable/design.json](.impeccable/design.json)
- [app/globals.css](app/globals.css)
- [components/ui/button.tsx](components/ui/button.tsx)

Do not replace the current design system with generic shadcn styling. Continue using the shared `Button` primitive and its `iosPrimary`, `iosTinted`, `iosPlain`, and `iosIcon` variants.

## 4. Code architecture

Primary application files:

- `app/page.tsx` — the complete interactive client application and screen switching.
- `app/globals.css` — layout, responsive behavior, visual tokens, and component styles.
- `app/layout.tsx` — metadata and root application shell.
- `components/ui/button.tsx` — shared button variants.
- `public/fonts/geist-latin.woff2` — non-Apple variable-font fallback.

Stack:

- React 19
- Next.js-compatible Vinext runtime
- TypeScript
- Tailwind/shadcn-compatible component foundation
- Lucide React icons
- OpenAI Sites hosting
- Supabase client/SSR packages and encrypted sync are used for optional backup; local IndexedDB remains the source of truth.

The app is currently intentionally concentrated in `app/page.tsx`. Refactor only when it directly supports the next feature; do not pause feature work for speculative architecture cleanup.

## 5. Supabase status

Supabase project URL and publishable key are configured locally and should be configured in the selected deployment environment.

Files:

- `.env.local` — real local values; ignored by Git.
- `.env.example` — committed public configuration template.
- `utils/supabase/client.ts` — browser client.
- `utils/supabase/server.ts` — cookie-aware server client.
- `utils/supabase/middleware.ts` — session refresh helper.
- `proxy.ts` — Next.js 16 proxy entry point.

Installed pinned packages:

- `@supabase/supabase-js` 2.116.0
- `@supabase/ssr` 0.12.7

The Supabase Auth settings endpoint returned HTTP 200 with the configured publishable key. The production Sites environment is at revision 1.

The additive migrations `supabase/migrations/20260922000000_work_arrangements.sql`, `supabase/migrations/20260922000001_work_arrangement_custom_fields.sql`, `supabase/migrations/20260922000002_work_arrangements_rls_with_check.sql`, and `supabase/migrations/20260922000003_expand_work_sectors.sql` have been applied to the Supabase database via the Supabase MCP and verified. See [docs/MCP-DATABASE-HANDOFF.md](docs/MCP-DATABASE-HANDOFF.md) for the full migration verification report and schema details.

Cloud backup is still explicitly user-triggered. Anonymous auth does not promise device-loss recovery; describe it as backup unless a tested recovery path is added.

The next AI must use the installed project skills before Supabase work:

- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/supabase-postgres-best-practices/SKILL.md`

Supabase changes frequently. Check the current changelog and official documentation before implementation.

## 6. Recommended next product slice

Complete the validation and submission slice without breaking offline-first behavior:

1. [COMPLETED] Applied and verified the work-arrangements Supabase migration and RLS in the deployed project (documented in [docs/MCP-DATABASE-HANDOFF.md](docs/MCP-DATABASE-HANDOFF.md)).
2. Add a reviewed PDF text extractor (10 MB / 20 pages / 30,000 characters) before enabling digital-PDF submission in the UI.
3. Add dossier export selection for records, attachments, and personal-detail visibility.
4. Run three user rehearsals and record confusion/errors without collecting unnecessary personal data.
5. Ask a labour-law mentor to review one scenario, its sources, and assistance wording.
6. Rehearse the worker journey on mobile and desktop with DeepSeek unavailable and available.

Do not move identifiable records to Supabase until authentication and RLS are verified together.

## 7. Legal implementation cautions

- The current 1.5× and 2× overtime multipliers come from the applicable Regulation of Wages order, not Employment Act section 27 alone.
- An eight-hour daily threshold is not a universal statutory rule in Kenya.
- A production rules engine must determine sector, wage order, contract terms, normal rest day, and current amendments.
- Preserve “indicative” language around all calculations.
- Do not imply legal advice, official endorsement, guaranteed recovery, or verified case outcomes.

Legal sources and third-party attribution are documented in [SOURCES_AND_ATTRIBUTIONS.md](SOURCES_AND_ATTRIBUTIONS.md).

## 8. Local development

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Local URL:

```text
http://localhost:5173/
```

Validation:

```bash
npm run build
npx tsc --noEmit
```

The existing dev server may already be running. If the runner reports another Vinext process, reuse `http://localhost:5173/` rather than starting duplicates.

## 9. Sites deployment

Sites project ID:

```text
appgprj_6ab039c220cc8191971de5a8cfbbfa44
```

Current production deployment:

```text
Version: 6
Commit: 1b502f297df76ea36f610ebe37423e4e457912cf
Deployment: appgdep_6ab0f517d5e88191bfe28aed9720d5cf
URL: https://fairwork-pulse-ke.osageder.chatgpt.site
```

For every production edit:

1. Run `npm run build` and relevant checks.
2. Commit the exact source state.
3. Obtain a fresh Sites source-repository write credential.
4. Push the exact commit to the Sites repository branch.
5. Run `git rev-parse --verify HEAD`; use the full returned SHA.
6. Package built `dist` output, including `dist/.openai/hosting.json`.
7. Save a new Site version with that SHA and archive.
8. Deploy the saved version privately.
9. Confirm deployment status is `succeeded` before reporting completion.

The local bundled Sites packaging script has been unreliable on Windows because of shell/runtime assumptions. The working fallback has been:

- Copy `dist/server` and `dist/client` into `.sites-package-stage/dist`.
- Copy `.openai/hosting.json` into `.sites-package-stage/dist/.openai/hosting.json`.
- Copy `drizzle` into `.sites-package-stage/dist/.openai/drizzle` when present.
- Create the archive with `tar -C .sites-package-stage -czf <archive>.tar.gz dist`.
- Validate that the archive contains `dist/server/index.js` and `dist/.openai/hosting.json`.

Never commit or expose a short-lived Sites Git credential.

## 10. Repository state and generated files

Recent commits:

```text
1b502f2 Add Supabase SSR client foundation
b685283 Use Geist fallback on non-Apple devices
26ca59f Redesign Fairwork Pulse as native mobile wallet UI
29eaacf Fix incident navigation and mobile record rows
ca6569c Make navigation and dossier actions functional
```

Expected generated/untracked artifacts may include:

- `.sites-package-stage/`
- `fairwork-pulse-v4.tar.gz`
- `fairwork-pulse-v5.tar.gz`
- `fairwork-pulse-v6.tar.gz`
- `.impeccable/review/font-mobile-500.png`
- `.impeccable/review/font-records.png`
- `.impeccable/review/mobile-500.png`

These are build/review artifacts, not product source. Do not accidentally stage them. Do not delete unrelated user files while cleaning.

## 11. Known constraints and pitfalls

- `app/page.tsx` starts with `"use client"`; do not paste the Supabase server-component `todos` example over it.
- Next.js 16 uses `proxy.ts`; older documentation may say `middleware.ts`.
- Session validation on the server must use `getClaims()` or a fresh user lookup, not trust `getSession()` for authorization.
- A publishable key is allowed in browser code; a secret or service-role key must never reach the browser or Git.
- New Supabase tables may not be exposed to the Data API automatically. Explicit grants and RLS are separate requirements.
- Do not add authentication redirects until a working login/onboarding screen exists; the current proxy refreshes sessions without blocking anonymous visitors.
- Records and incidents must remain usable offline even after synchronization is added.
- Configure only a rotated replacement DeepSeek key as `DEEPSEEK_API_KEY` in local ignored env files and the deployment provider. Never commit a key or place it in `NEXT_PUBLIC_*` variables.
- Preserve user changes and inspect `git status` before editing.

## 12. Demo flow

The strongest current demo narrative is:

1. **Record** — log a shift in under 30 seconds.
2. **Detect** — show the immediate wage shortfall and indicative overtime.
3. **Preserve** — record an incident and attach evidence conceptually.
4. **Package** — open the Haki Dossier preview.
5. **Seek remedy** — print/export the structured record for a labour officer, union, or advocate.

The product should feel protective and practical, not bureaucratic or alarmist.
