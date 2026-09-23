# Fairwork Pulse — Technical & Concept Briefing

**Audience:** Presenters and colleagues (legal background, non-technical)
**Purpose:** Understand what we built, how it works under the hood, and what is true vs. what we must not claim.

---

## 0. Table of contents

1. The one-paragraph summary
2. Who this is for (current positioning)
3. The problem we are solving
4. What the product actually does
5. Foundations, from zero
   - 5.1 Data, files, and bytes
   - 5.2 Encryption vs. hashing
   - 5.3 Symmetric encryption and AES
   - 5.4 What "256" and "GCM" mean
   - 5.5 Keys, PINs, and key derivation
   - 5.6 PBKDF2, salt, and iterations
   - 5.7 SHA-256 and hashes
   - 5.8 "Zero-knowledge" / end-to-end encryption
   - 5.9 Local-first storage (IndexedDB)
   - 5.10 Row Level Security (tenant isolation)
   - 5.11 Chain of custody and tamper-evidence
   - 5.12 Application stack
6. How the app works, step by step
7. The legal rules engine
8. The AI assistant and its guardrails
9. The privacy boundary (what is encrypted vs. readable)
10. The multi-channel story (feature phones, unions, regulators)
11. What this is NOT
12. Honest limitations and known gaps
13. Glossary
14. Presenter Q&A prep
15. Suggested demo script

---

## 1. The one-paragraph summary

Fairwork Pulse is a **work-record and evidence wallet**. A person logs their shift, the pay agreed, the money received, and the type of day. The app separates an entered pay gap from an indicative overtime or rest-day estimate, stores records locally, and can protect sensitive content with a PIN-based encrypted vault. Evidence attachments receive a SHA-256 fingerprint so later changes to those exact bytes can be detected. The AI helps explain rights and work arrangements; a deterministic rules engine performs the arithmetic. Optional cloud backup uses row-level access controls and, with a PIN active, stores sensitive fields as ciphertext.

---

## 2. Who this is for (current positioning)

We have **moved beyond "informal workers only."** The product is for anyone who earns a wage or a fee but lacks reliable paperwork:

- Salaried and corporate employees who want a private, independent record of hours, pay, and incidents.
- Casual, gig, domestic, agricultural, and construction workers — the original focus.
- Anyone preparing to raise a workplace dispute (wage theft, unlawful deductions, injury, discrimination, unfair termination).

> **Public materials have been updated** to describe the product across the wage spectrum rather than "informal workers only."

Thirteen supported "sectors" (really, work profiles): **construction & artisans, agriculture & tea, domestic & care, gig delivery & boda boda, office & professional, retail/hotels & catering, private security, manufacturing & warehousing, general labour & casual, cleaning & facility services, healthcare & care, transport & PSV**, plus a freeform **"other"** bucket the assistant can use when nothing fits (the specific name is stored on the arrangement).

---

## 3. The problem we are solving

1. **Work is real, but the record isn't.** Many people have no contract or payslip, so proving what was agreed and what was paid is hard.
2. **Evidence is scattered.** An M-Pesa SMS, a photo of a voucher, a clinic card — all easily lost or altered.
3. **Memory fades and disputes are decided on documents.** If a record is created *late*, it is less useful.
4. **People don't know their rights.** The relevant law exists but is not accessible in the moment.
5. **Privacy matters.** A wage dispute tool that leaks wage data to a server (or a spouse, an employer) is dangerous to the user.

Fairwork Pulse attacks all five: log now, calculate accurately, preserve integrity, explain in plain language, and keep the worker in control of the keys.

---

## 4. What the product actually does

- **Records shifts/jobs** — employer or contractor, location, times, agreed pay, payment received, and one of three day types: normal working day, weekly rest day, or public holiday.
- **Calculates** the recorded agreed-pay gap and a separate estimated additional entitlement using the selected day type (see section 7).
- **Stores everything locally first** on the device (works offline).
- **Attaches evidence** with a SHA-256 fingerprint and payment-type detection.
- **Compiles a "Haki Dossier"** — an organised package (shifts, calculations, evidence index) to take to an adviser, union, or labour officer.
- **Exports and previews a multi-page PDF dossier** — the filename can be chosen, a timestamp distinguishes repeated downloads, and the page preview includes page navigation.
- **Separates wage incidents from other workplace concerns** — wage withholding and deductions are logged with shift/pay records; the incident flow covers injury, general abuse or another concern, and maternity discrimination.
- **Starts a fresh ledger deliberately** — a clear-reset action confirms the choice, clears local device-vault records, and then reloads the clean state.
- **Optional encrypted cloud backup** to Supabase.
- **AI assistant** that explains rights and helps set up a work profile, in English or Kiswahili.
- **(Vision) Union/regulator view** — anonymised, aggregated trends (currently illustrative sample data).

---

## 5. Foundations, from zero

### 5.1 Data, files, and bytes

Everything digital is ultimately a sequence of **bytes** (numbers 0–255). A photo, an SMS screenshot, or a text note is just a specific sequence of bytes. Two ideas follow from this:

- If you **transform** the bytes so they can be reversed with a secret, that's **encryption** (keeps content secret).
- If you **transform** the bytes so they *cannot* be reversed, that's **hashing** (creates a fingerprint).

Those two are the backbone of this app. They are different tools for different jobs, and people constantly confuse them.

### 5.2 Encryption vs. hashing

| | Encryption | Hashing |
|---|---|---|
| Reversible? | Yes, with the key | No |
| Purpose | Keep content **secret** | Detect **change** |
| Output | Ciphertext (variable length) | Fixed-length digest |
| Analogy | A locked box | A wax seal / fingerprint |
| Used in our app for | Wages, employer, incident notes, evidence images | Evidence integrity, PIN verification |

**Key point for a legal audience:** encryption protects *confidentiality*. Hashing protects *integrity*. Evidence integrity is about proving a file has not changed; confidentiality is about who can read it. We use both, for different reasons.

### 5.3 Symmetric encryption and AES

"Symmetric" means the **same key** both locks and unlocks. Our app uses **AES** (Advanced Encryption Standard), the global standard chosen by a public competition and used by banks and governments.

- **AES-256** means the key is 256 bits long. A 256-bit key has 2²⁵⁶ possible values — an astronomically large number (close to the number of atoms in the observable universe). Guessing it by brute force is not feasible.
- We use a **symmetric** cipher because the worker encrypts and decrypts on their own device; there is no separate "other party" who needs a different key.

### 5.4 What "256" and "GCM" mean

- **256** = key size (strength against brute force).
- **GCM** (Galois/Counter Mode) = the *mode of operation*, i.e. **how** AES is applied. GCM is **authenticated encryption**: it provides
  1. **Confidentiality** (nobody can read it without the key), and
  2. **Integrity/authenticity** (if even one bit of the ciphertext is altered, decryption *fails* instead of returning corrupted data).

This matters legally: AES-GCM doesn't just hide the content, it also flags tampering. We also use a **fresh random IV** (initialization value, 12 bytes / 96 bits) for every encryption, so encrypting the same text twice produces different ciphertext. That prevents an observer from telling that two records are identical.

### 5.5 Keys, PINs, and key derivation

A **PIN** is a short, human-memorable secret (e.g. 4–6 digits). It is *not* strong enough to be used directly as an encryption key, and it is guessable (there are only ~10,000 four-digit PINs).

So we never use the PIN directly. We run it through a **key-derivation function** to produce a proper 256-bit key. This serves two purposes:

1. It converts a short secret into a full-length key.
2. It deliberately **slows down** guessing, so an attacker who steals the encrypted data still cannot try all PINs cheaply.

The derived key is marked **non-extractable** in the browser: even our own JavaScript cannot read the raw key bytes back out. It lives only in the device's memory while the vault is unlocked.

### 5.6 PBKDF2, salt, and iterations

Our derivation function is **PBKDF2** (Password-Based Key Derivation Function 2) with **SHA-256**, **100,000 iterations**, and a random **16-byte salt**.

- **Iterations** = we apply the function 100,000 times. This makes each guess ~100,000× slower. A legitimate unlock costs the user a fraction of a second; an attacker trying billions of PINs is forced to spend enormous time.
- **Salt** = a random value added to the PIN before deriving, unique per device/vault. It ensures that two people with the PIN "1234" get *completely different* keys, and it defeats pre-computed "rainbow tables" (big lookup tables of common passwords). The salt is stored *next to* the ciphertext — that is safe; its job is uniqueness, not secrecy.

**Verifying a PIN without storing it:** we encrypt a known constant string with the derived key and store that small "verification token." On unlock, we derive the key from the entered PIN, try to decrypt the token, and check whether we get the constant back. If yes, the PIN is correct. The PIN itself is never stored anywhere.

### 5.7 SHA-256 and hashes

A **cryptographic hash** turns any input into a fixed-size output (SHA-256 always produces 256 bits / 64 hex characters). It has four properties that matter:

1. **Deterministic** — the same input always gives the same hash.
2. **One-way** — you cannot reconstruct the input from the hash.
3. **Avalanche** — changing one character changes the entire hash.
4. **Collision-resistant** — it is infeasible to find two different inputs with the same hash.

**What a hash proves:** the exact bytes of a file have not changed since the hash was recorded. If an edited image is re-hashed, it produces a completely different value.

**What a hash does NOT prove:** that the original file was genuine, unedited *before* capture, or created at the claimed time. It is an integrity tool, not an authentication or truth tool. (Say this out loud in Q&A — it demonstrates you understand the limits.)

In our app, SHA-256 is used to:
- Fingerprint evidence files (chain-of-custody).
- (Optionally) chain records so a later change to one record breaks the chain — tamper-evidence without a blockchain.

### 5.8 "Zero-knowledge" / end-to-end encryption

"Zero-knowledge" here means: **for the sensitive fields, the server never has the key, so it cannot read them.** The worker's device encrypts before upload; only ciphertext reaches the cloud.

Be precise — this is a **boundary, not an absolute**:

- With a PIN active, **wages, employer identity, incident narratives, and evidence content** are uploaded as ciphertext.
- **Operational metadata** (profile name/phone, record dates, sector, incident category, payment type) remains readable so the app can sync, sort, and aggregate.

So the accurate claim is: *"Sensitive worker content is end-to-end encrypted; operational metadata remains accessible."* Do **not** claim we can see nothing — the metadata is visible by design.

### 5.9 Local-first storage (IndexedDB)

The app stores records in the browser's **IndexedDB**, a real on-device database (database name `fairwork_pulse_vault_v1`). Benefits:

- Works with **no internet**.
- Data survives page reloads and app restarts.
- When a PIN is active, encrypted records persist **only as ciphertext**, and the plaintext copy is purged from storage.

"Indexed" fields (date, category, sector) stay plaintext so the app can search and display a timeline without decrypting everything; the sensitive values are encrypted.

### 5.10 Row Level Security (tenant isolation)

The cloud database (Supabase/Postgres) enforces, **at the database level**, that a logged-in user can only read or write rows tied to their own user ID. This is called **Row Level Security (RLS)**. The rule is essentially `authenticated user id = row's user_id`, applied on select, insert, update, and delete. Storage files are similarly scoped to a folder named after the user's ID.

Why it matters: even if there were a bug in our application code, the database itself refuses to hand one user's records to another. It is defence in depth, not just app logic.

### 5.11 Chain of custody and tamper-evidence

"Chain of custody" is the legal idea that evidence is tracked from collection to presentation, with no unexplained gaps or alterations. Our technical contribution:

- At capture, we record a **SHA-256 fingerprint** of the file plus a timestamp.
- The dossier lists these fingerprints, so a later copy can be re-hashed and compared.
- A **hash chain** (each record including the previous record's hash) can make wholesale tampering evident: altering any record invalidates every later link.

We do **not** claim this makes evidence automatically admissible. We claim it helps a human demonstrate that a file has not changed since capture.

### 5.12 Application stack

The interface uses **Next.js 16, React 19, TypeScript, and Vinext on Vite**, with Tailwind CSS 4 for styling. Shift, incident, and evidence records are stored locally in **IndexedDB**. The browser's **Web Crypto API** derives vault keys with PBKDF2/SHA-256 (100,000 iterations) and encrypts sensitive data with AES-GCM-256. **jsPDF** builds the dossier and **pdfjs-dist** previews its pages. Optional cloud sync uses **Supabase/Postgres** with row-level security; the server-side **DeepSeek** helper uses Zod-shaped responses and a deterministic fallback. **Vitest** covers application rules and important storage paths.

---

## 6. How the app works, step by step

1. **Open the app** → it loads locally first (offline-capable).
2. **Set up a work arrangement** → choose the type of work (sector) and how pay works (salary, hourly, daily, per project, etc.). You can keep several arrangements (e.g. a day job and weekend gigs) separate.
3. **Set a vault PIN** from the visible header action → the app derives the key, creates the verification token, and switches to encrypted storage.
4. **Log a shift** → enter employer, location, date and times, agreed pay, and amount received. Choose normal working day, weekly rest day, or public holiday.
5. **See the live calculation** → the rules engine updates the recorded pay gap, estimated additional entitlement, and total as the form changes. Estimates are labelled for review.
6. **Attach evidence** → the file is hashed (SHA-256), tagged (M-Pesa/receipt/bank), and, with a PIN active, encrypted; only ciphertext is persisted.
7. **Compile the Haki Dossier** → choose the records and evidence to include, name the PDF, download it, and preview its pages.
8. **Optional cloud backup** → encrypted rows sync to Supabase (idempotent upserts).
9. **(Vision) Union/regulator view** → anonymised aggregates by region.

---

## 7. The legal rules engine

This is plain, deterministic code (`lib/legal-engine.ts`). Same inputs → same outputs, every time. That is deliberate: **money math must be auditable, not "AI-generated."**

For each shift it computes from the worker's entered pay and working times:

- **Wage deficit** = agreed pay − amount received, never below zero. It is shown separately from the estimated additional entitlement.
- **Normal working day** — overtime hours are hours beyond 8; the hourly reference is the entered agreed pay divided by 8; the estimate applies a 1.5× multiplier to those extra hours.
- **Weekly rest day or public holiday** — the estimate applies 2.0× to every recorded working hour. The expected amount is compared with the recorded payment; it does not add the agreed daily amount a second time.
- **Estimated additional entitlement** = the additional amount still indicated after recorded payments, excluding the agreed-pay gap already shown separately. The total does not count the same amount twice.
- **Total indicated claim** = unpaid agreed amount + estimated additional entitlement.
- Marks line items **"recorded"** vs **"needs review."**

**Calculation limits:** no minimum-wage comparison is applied. The engine does not check pay against a statutory minimum. For normal days it uses a simple 8-hour-per-shift threshold and derives an hourly estimate from the worker-entered agreed daily pay divided by eight. For rest days and public holidays it applies 2× to recorded hours. The worker chooses the day type; the app does not infer it from a calendar. The same assumptions apply across sectors. The prototype does not model the General Order's weekly overtime threshold, sector-specific orders, breaks, split shifts, or contractual variations. These estimates organise a record; they are not a dependable legal entitlement calculation. A reviewed calculation needs weekly hours, the applicable wage order and pay basis, breaks, contract terms, and other facts. Confirm the applicable rules with an adviser before relying on a figure.

It also handles **cross-midnight shifts** (e.g. 20:00–04:00).

**Statutory anchors (official Kenya Law references checked 23 September 2026):**

- [**Employment Act, 2007, revised 26 April 2024**](https://new.kenyalaw.org/akn/ke/act/2007/11/eng%402024-04-26) — wages and deductions (§§ 17–19); weekly rest (§ 27); maternity leave (§ 29); termination (§ 35).
- [**Regulation of Wages (General) Order**](https://new.kenyalaw.org/akn/ke/act/ln/1982/120/eng%402022-12-31/source) — the General Order normally sets a 52-hour week spread over six days, with overtime beyond the normal weekly hours at 1.5× and work on the employee's normal rest day or public holiday at 2×. Other orders and employment terms can apply.
- [**Work Injury Benefits Act, 2007**](https://new.kenyalaw.org/akn/ke/act/2007/13/eng%402022-12-31/source.pdf) — compensation for work-related injury and disease.

**What it does NOT do:** it does not decide liability, does not classify anyone as employee vs. contractor, does not assign social class, and does not guarantee any amount. It produces *indicative* figures for discussion and flags what needs human review.

---

## 8. The AI assistant and its guardrails

The assistant (DeepSeek, called from our **server** so the API key never reaches the browser) helps explain rights and set up a work profile, in English or Kiswahili. It is deliberately boxed in:

1. **AI explains; code calculates.** Statutory arithmetic is never delegated to the model.
2. **The app owns routing.** The response cannot silently switch the worker's sector or task; those are set by the app, not the model.
3. **Prompt-injection defence.** Worker text and document excerpts are treated as **untrusted data**; the model is told to ignore any instructions hidden inside them.
4. **Source grounding.** The model may only cite source IDs from an allow-list; anything else is filtered out.
5. **Graceful fallback.** If the key is missing or the API fails, the app falls back to a deterministic offline message instead of breaking.
6. **Confirmation-first records.** Suggestions show assumptions, missing questions, and a confidence level, and nothing is saved without the worker confirming.
7. **Clean AI field labels.** AI-filled work-detail names have the accidental `Answer:` prefix removed before they are presented.

This "responsible AI" separation is a differentiator: most teams wrap everything in an LLM; we keep legal and financial logic deterministic.

---

## 9. The privacy boundary (memorise this)

| Stored as **ciphertext** (with PIN) | Server-readable **metadata** |
|---|---|
| Wage amounts, employer identity | Profile name and phone |
| Incident narratives | Record dates |
| Evidence image content | Sector, payment type, incident category |

One-line version: **"Sensitive worker content is end-to-end encrypted; operational metadata remains accessible."**

---

## 10. The multi-channel story

Many affected workers are not on a smartphone. We demonstrate two additional channels:

- **USSD shortcode simulator** (`*384*2026#`) — a 2G-friendly menu flow.
- **WhatsApp/SMS string parser** — e.g. `SHIFT [Employer] [Agreed] [Paid] [Hours]`, which computes the deficit and injects the shift into the ledger.

**Important:** these are **simulators** demonstrating the design, not live telco integrations. Say "we designed the channel," not "we operate the channel."

The **union/regulator dashboard** shows regional hotspot trends for labour officers and unions. Its data is currently **illustrative sample data**; the real version depends on consented, anonymised aggregation and a privacy review.

---

## 11. What this is NOT

- **Not legal advice or representation.** It is indicative guidance plus a record-organising tool.
- **Not a determination of admissibility.** We preserve integrity signals for a human decision-maker.
- **Not proof of truth.** A hash proves a file is unchanged since capture, not that its contents are true or unedited before capture.
- **Not a live surveillance system.** The regulator view is a designed, consented capability, currently illustrative.
- **Not a live telco service.** USSD/WhatsApp are simulated.
- **Not fully "zero-knowledge" in the absolute sense.** Metadata is server-readable (section 9).

---

## 12. Honest limitations and known gaps

Being upfront about these builds credibility and protects the team in Q&A.

1. **PIN creation is now reachable** — a visible **"Set PIN"** chip in the header opens the vault setup (previously it was hidden until a PIN already existed).
2. **Minimum-wage comparison was removed by design.** The engine reports only the agreed-vs-paid gap and overtime from the entered rate; it deliberately does not assert a statutory minimum. Overtime remains an estimate that needs human review.
3. **Deployments can go stale.** The live site was previously 11 commits behind, so its CSS did not match the code. Always confirm the deployed commit.
4. **Test coverage is growing.** Vitest currently covers the rules engine, vault/reset paths, dossier PDF generation, and related flows; a fuller device, browser, and cloud integration matrix is still needed.
5. **Anonymous sign-in** is used for the demo; production needs real identity, consent, and a data-protection review.
6. **Losing the PIN — or the phone — means losing access.** That is the cost of zero-knowledge; accounts plus a recovery phrase are the next milestone (see section 16).

---

## 13. Glossary

- **AES-256** — the standard symmetric cipher; "256" is the key length.
- **GCM** — an authenticated mode of AES (confidentiality + tamper detection).
- **Ciphertext / plaintext** — scrambled / original readable data.
- **Key** — the secret used to encrypt and decrypt.
- **PIN** — a short human secret; converted into a key via derivation.
- **PBKDF2** — a slow key-derivation function; turns a PIN into a key and resists guessing.
- **Salt** — random per-vault value added before derivation (defeats rainbow tables).
- **Iterations** — how many times derivation is repeated (slowness against brute force).
- **SHA-256** — a one-way hash producing a 64-character fingerprint.
- **Hash / digest** — the fixed-length fingerprint output.
- **IV (initialization vector)** — fresh random value per encryption so identical text encrypts differently.
- **Zero-knowledge / end-to-end encryption** — the server holds only ciphertext for sensitive fields and no key.
- **IndexedDB** — the browser's on-device database.
- **RLS (Row Level Security)** — database-enforced rule that users only see their own rows.
- **Chain of custody** — the tracked, unbroken handling of evidence.
- **Deterministic** — same input always yields the same output (our calculations).
- **Prompt injection** — hidden instructions in untrusted text trying to manipulate the AI.

---

## 14. Presenter Q&A prep

- **"Can you read my wages?"** → With a PIN, no — that content is ciphertext and we never hold the key. We can see operational metadata (name, dates, sector).
- **"What if the worker loses the PIN?"** → The key is unrecoverable by design; recovery is a policy question we are happy to discuss.
- **"What if the worker loses the phone?"** → Today the encrypted records would be unrecoverable — that is the zero-knowledge tradeoff. Accounts plus a recovery phrase (roadmap) make the record portable without ever handing the key to the server.
- **"Can you prove a photo wasn't edited?"** → We can prove it hasn't changed *since hash capture*. We cannot prove pre-capture provenance.
- **"Why not blockchain?"** → A hash (and optionally a hash chain) gives tamper-evidence without tokens, cost, or dependence on a third-party chain.
- **"Is the AI giving legal advice?"** → No. It explains, cites an allow-listed source register, and never decides. The arithmetic is deterministic code.
- **"Does it work without internet / on a feature phone?"** → Yes by design; we demonstrate offline logging and a USSD/WhatsApp channel (simulated).
- **"Who pays for it?"** → Unions, NGOs, county governments, insurers, or employers for compliance; freemium for individual workers. Have one answer ready.

---

## 15. Suggested demo script (short)

1. Open **Log a shift**, enter the location, pay, and hours, then compare the normal-day, rest-day, and public-holiday choices as the audit updates.
2. Point out that overtime and the total indicated claim are calculated below the form; explain that the displayed amounts are estimates for review.
3. In **Record what happened**, show workplace injury, workplace abuse or another concern, and maternity discrimination. Wage withholding and deductions stay with the shift/pay record.
4. Open the **Haki Dossier**, edit the download name, review both pages with the page controls, and download the PDF.
5. Show **Start fresh** and its confirmation using demo data, then close with the union/regulator and feature-phone views labelled illustrative/simulated.

Keep it to one worker's story: *record → calculate → preserve → share → aggregate.*

---

## 16. How we take this further (closing slide)

Use this **after** the demo, as the final slide. Rule: sequence it, tie each item to something already built, and turn each known limitation into a roadmap line. Keep it to 3–5 items, about 30–60 seconds. Do not lead with it, and do not promise anything that contradicts the working demo.

**Near term (weeks)**

1. **Accounts + recovery phrase** — a stable identity (email/phone OTP) and a recovery phrase that wraps the vault key, so a lost phone no longer means a lost record. Only the *wrapped* key and salt reach the server; the phrase never does. *(Turns today's lost-phone limitation into the next milestone.)*
2. **Export & portability** — one-tap encrypted backup plus PDF/CSV/JSON export, so the record outlives the app and can go straight into a dispute.
3. **Real feature-phone channel** — move the USSD/WhatsApp simulator to a live telco/BSP integration for genuine reach beyond smartphones.

**At scale**

4. **Consented, anonymised aggregates** — give unions and labour officers the regional trends view, built on explicit consent and a privacy review.
5. **Sustainability** — who pays: unions, NGOs, county governments, insurers, or employers for compliance, with a free tier for individual workers.

**One-line framing:** *"We built the hard part first — client-side encrypted evidence and transparent indicative wage estimates. Next is making it portable and recoverable: accounts, a recovery phrase, and export."*

---

*This document describes a prototype. Statutory citations must be verified against the current law before any public or legal use. The tool organises worker-provided information; it does not determine liability, guarantee admissibility, or replace legal advice.*
