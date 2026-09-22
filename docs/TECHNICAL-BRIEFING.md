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

Fairwork Pulse is a **pocket work-record and evidence wallet**. A person logs what they did and what they were paid. The app calculates what Kenyan statutory rules say they were owed, stores that record **encrypted on their own device**, and lets them attach evidence (M-Pesa messages, receipts, injury cards) whose **digital fingerprint** is recorded so later tampering is detectable. The AI only *explains*; a separate deterministic rules engine does the arithmetic. Cloud backup is optional, and when a PIN is set, the sensitive content is uploaded as ciphertext the server cannot read.

---

## 2. Who this is for (current positioning)

We have **moved beyond "informal workers only."** The product is for anyone who earns a wage or a fee but lacks reliable paperwork:

- Salaried and corporate employees who want a private, independent record of hours, pay, and incidents.
- Casual, gig, domestic, agricultural, and construction workers — the original focus.
- Anyone preparing to raise a workplace dispute (wage theft, unlawful deductions, injury, discrimination, unfair termination).

> **Note for whoever edits the public materials:** the `README.md` and some in-app copy still describe the product as "for informal workers." If the pitch is now broader, that text needs updating so the story is consistent.

Four supported "sectors" (really, work profiles): **construction & artisans, agriculture & tea, domestic & care, gig delivery & boda boda.**

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

- **Records shifts/jobs** — employer, site, times, what was agreed, what was actually received, whether it was a Sunday/public holiday.
- **Calculates** statutory shortfall and overtime (see section 7).
- **Stores everything locally first** on the device (works offline).
- **Attaches evidence** with a SHA-256 fingerprint and payment-type detection.
- **Compiles a "Haki Dossier"** — an organised package (shifts, calculations, evidence index) to take to an adviser, union, or labour officer.
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

---

## 6. How the app works, step by step

1. **Open the app** → it loads locally first (offline-capable).
2. **Set up a work arrangement** → choose the type of work (sector) and how pay works (salary, hourly, daily, per project, etc.). You can keep several arrangements (e.g. a day job and weekend gigs) separate.
3. **Set a vault PIN** *(see the known gap in section 12)* → the app derives the key, creates the verification token, and switches to encrypted storage.
4. **Log a shift** → enter employer, site, start/end time, agreed pay, amount received, and whether it was a Sunday/public holiday.
5. **See the calculation** → the rules engine shows the recorded shortfall and an *estimated* overtime entitlement, clearly labelled "recorded" vs. "needs review."
6. **Attach evidence** → the file is hashed (SHA-256), tagged (M-Pesa/receipt/bank), and, with a PIN active, encrypted; only ciphertext is persisted.
7. **Compile the Haki Dossier** → shifts, calculations, and the evidence index in one package.
8. **Optional cloud backup** → encrypted rows sync to Supabase (idempotent upserts).
9. **(Vision) Union/regulator view** → anonymised aggregates by region.

---

## 7. The legal rules engine

This is plain, deterministic code (`lib/legal-engine.ts`). Same inputs → same outputs, every time. That is deliberate: **money math must be auditable, not "AI-generated."**

For each shift it computes:

- **Wage deficit** = agreed pay − amount actually received (never below zero). Treated as a **recorded fact**.
- **Overtime hours** = hours beyond the standard 8-hour day.
- **Overtime pay due** = overtime hours × (hourly rate derived from agreed pay) × multiplier.
  - **1.5×** on a normal day.
  - **2.0×** on a Sunday or public holiday.
- **Total indicated claim** = wage deficit + overtime pay due.
- Flags if agreed pay is below the sector baseline, and marks items **"needs review"** vs **"recorded."**

It also handles **cross-midnight shifts** (e.g. 20:00–04:00).

**Statutory anchors (verify against current orders before publication):**

- **Employment Act, 2007** — prompt payment and prohibition of unlawful deductions (§§ 17–19); weekly rest day (§ 27); maternity protection (§ 29); termination (§ 35).
- **Regulation of Wages (General) Order** — standard hours; overtime multipliers.
- **Work Injury Benefits Act (WIBA), 2007** — employer liability for workplace injury and medical costs.

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

1. **PIN creation is not reachable from the UI.** The setup flow and encryption code exist (`VaultLockModal`, `handleSetupPin`), but the only button that opens the vault modal is shown *only after* a PIN is already configured. In practice, a new user cannot start encryption from the interface. **This should be fixed before the demo** (add a visible "Set up security PIN" entry point).
2. **Statutory figures are inconsistent.** `README.md` lists daily baselines of KSh 1,180 / 820 / 920 / 1,250; `lib/legal-engine.ts` uses 1,200 / 950 / 650 / 1,100. One must be chosen and cited (with the applicable wage order and date).
3. **Deployments can go stale.** The live site was previously 11 commits behind, so its CSS did not match the code. Always confirm the deployed commit.
4. **No test coverage existed until recently**; we have now added unit tests for the rules engine, crypto, routing, and the AI fallback.
5. **Anonymous sign-in** is used for the demo; production needs real identity, consent, and a data-protection review.
6. **Losing the PIN means losing access.** That is the cost of zero-knowledge; a recovery design is a policy decision to discuss.

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
- **"Can you prove a photo wasn't edited?"** → We can prove it hasn't changed *since hash capture*. We cannot prove pre-capture provenance.
- **"Why not blockchain?"** → A hash (and optionally a hash chain) gives tamper-evidence without tokens, cost, or dependence on a third-party chain.
- **"Is the AI giving legal advice?"** → No. It explains, cites an allow-listed source register, and never decides. The arithmetic is deterministic code.
- **"Does it work without internet / on a feature phone?"** → Yes by design; we demonstrate offline logging and a USSD/WhatsApp channel (simulated).
- **"Who pays for it?"** → Unions, NGOs, county governments, insurers, or employers for compliance; freemium for individual workers. Have one answer ready.

---

## 15. Suggested demo script (short)

1. Open the app; show the **work record** screen and the **audit calculation** on a logged shift.
2. **Turn off Wi-Fi**; log another shift and show the fallback still works. Turn it back on and sync.
3. Attach an **M-Pesa screenshot**; show its **SHA-256 fingerprint**; edit the image and show the fingerprint change.
4. Open the **Haki Dossier** — shifts, calculations, evidence index.
5. Close with the **union/regulator** aggregate view (clearly labelled illustrative) and the **feature-phone** channel.

Keep it to one worker's story: *record → calculate → preserve → share → aggregate.*

---

*This document describes a prototype. Statutory figures and citations must be verified against the current wage orders before any public or legal use. The tool organises worker-provided information; it does not determine liability, guarantee admissibility, or replace legal advice.*
