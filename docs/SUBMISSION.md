# Fairwork Pulse — Hackathon Submission

## Project description

Fairwork Pulse is a mobile-first, offline-capable work record and evidence wallet for Kenyan casual and informal workers. A worker can record a shift, attach payment or incident evidence, compare agreed pay with recorded payment, and prepare a selective Haki Dossier for discussion with an adviser, labour officer, or union representative.

## Problem statement

Workers without written contracts or payslips can struggle to reconstruct dates, hours, payments, deductions, and incidents when seeking assistance. Existing reporting channels often begin after a dispute has escalated, when evidence is already scattered or lost.

## Solution

The app keeps worker-entered records on the device, supports client-side encryption with a PIN, records SHA-256 file-integrity hashes, and offers an optional encrypted Supabase backup. Deterministic calculations separate the recorded payment gap from additional estimated entitlements that need review. The Haki Dossier lets the worker choose which records, evidence, and personal details to print or save as PDF.

## Demonstrated features

- Clean personal profile and clearly marked synthetic demo mode
- Shift, payment, incident, and evidence capture
- Encrypted device vault and encrypted cloud upload
- Explainable payment breakdown with assumptions and rule references
- Selective, redacted Haki Dossier export
- Offline application shell and device-local capture
- English and Kiswahili entry points

The feature-phone and regulator screens are concept demonstrations. The regulator data is illustrative. Fairwork Pulse does not determine legal liability or evidence admissibility.

## Impact

The immediate benefit is better recall and organization: the worker leaves with a dated record and a structured set of questions. Intended impact measures for a pilot are successful shift-log completion, time to create a record, dossier completeness, and the percentage of users who can explain the difference between recorded payment gaps and estimates.

## Sustainability and scalability

Worker recordkeeping remains free. The team will test whether labour-support institutions, unions, civil-society organizations, or responsible businesses would fund training, deployment support, and privacy-preserving aggregate analysis. This is a hypothesis for validation, not an existing partnership. Identifiable worker records will not be sold.

## Technical summary

Next.js, React, TypeScript, IndexedDB, Web Crypto AES-GCM, SHA-256, Supabase PostgreSQL/Storage with row-level security, and an optional server-only DeepSeek rights-information assistant. Calculation rules remain deterministic and separate from AI responses.

## Submission checklist

- [ ] Replace bracketed team details in the pitch deck
- [ ] Record and link the backup demo video
- [ ] Run the user-test protocol and record only truthful findings
- [ ] Ask a law mentor to review the representative scenario and wording
- [ ] Export one synthetic sample dossier
- [ ] Confirm deployed URL and offline reload
- [ ] Submit before 12:30 p.m. on 25 September 2026
