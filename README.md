# Fairwork Pulse 🇰🇪
> **Pocket Evidence Wallet & Labour Rights Engine for Kenyan Casual and Informal Workers**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Storage-3ECF8E?logo=supabase)](https://supabase.com/)
[![Web Crypto](https://img.shields.io/badge/Web%20Crypto-AES--GCM--256-orange)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Rights%20Assistant-8E75B2?logo=google)](https://ai.google.dev/)
[![Netlify Status](https://img.shields.io/badge/Netlify-Ready-00C7B7?logo=netlify)](https://www.netlify.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Executive Summary

**Fairwork Pulse** is a mobile-first "Pocket Evidence Wallet" engineered for Kenya's **~15 million informal, casual, and gig workers**—including construction fundis and mjengo casuals, agricultural and tea-estate pickers, domestic caregivers, and app-based delivery riders.

Because casual workers often lack written contracts or payslips, they are routinely vulnerable to wage withholding, unlawful deductions, unpaid overtime, and uncompensated injuries. **Fairwork Pulse** helps workers keep contemporaneous records they can organize for discussion with an adviser, labour officer, or union representative.

> **Core Promise:** *Proof of Work. Power to Remedy.*

Built for the **Strathmore / iLab Africa Hackathon 2026** (Nairobi, Kenya).

---

## 🏛️ The 7 Core Architectural Pillars

```
                     ┌──────────────────────────────────────────────┐
                     │           FAIRWORK PULSE WALLET              │
                     │          (Mobile-First Client)               │
                     └───────┬──────────────────────────────┬───────┘
                             │                              │
             ┌───────────────▼──────────────┐       ┌───────▼──────────────────────┐
             │   1. CLIENT-SIDE ENCRYPTED   │       │   2. EVIDENCE INTEGRITY      │
             │             VAULT            │       │       INTEGRITY CHECKS       │
             │   - PBKDF2 (100k iters)      │       │   - M-Pesa / Receipt Capture │
             │   - AES-GCM-256 Web Crypto   │       │   - Native SHA-256 Hash      │
             │   - Local-First IndexedDB    │       │   - Court Chain-of-Custody   │
             └───────────────┬──────────────┘       └───────┬──────────────────────┘
                             │                              │
             ┌───────────────▼──────────────┐       ┌───────▼──────────────────────┐
             │   3. GEMINI AI ASSISTANT     │       │   4. ENCRYPTED CLOUD BACKUP  │
             │   - Bilingual (EN & SW)      │       │             SYNC             │
             │   - Employment Act 2007      │       │   - Supabase PostgreSQL      │
             │   - Offline Rules Fallback   │       │   - Strict RLS & Storage     │
             └───────────────┬──────────────┘       └───────┬──────────────────────┘
                             │                              │
             ┌───────────────▼──────────────┐       ┌───────▼──────────────────────┐
             │   5. REGIONAL RISK MONITOR   │       │   6. DYNAMIC STATUTORY       │
             │   - Sub-County Telemetry     │       │         RULES ENGINE         │
             │   - Illustrative Aggregates  │       │   - 1.5x Daily Overtime      │
             │   - COTU-K / Labour Officers │       │   - 2.0x Sunday Double-Time  │
             └───────────────┬──────────────┘       └───────┬──────────────────────┘
                             │                              │
                             └───────────────┬──────────────┘
                                             │
                             ┌───────────────▼──────────────┐
                             │  7. FEATURE-PHONE (KITOCHI)  │
                             │            INTAKE            │
                             │   - 2G USSD (*384*2026#)     │
                             │   - WhatsApp Gateway Bot     │
                             └──────────────────────────────┘
```

### 1. Client-Side Encrypted Vault
- **Master PIN Derivation**: Uses the browser's native **Web Crypto API** with **PBKDF2** (100,000 iterations, SHA-256) and a unique cryptographic salt.
- **Authenticated Encryption**: Sensitive financial amounts, employer identities, and dispute notes are encrypted using **AES-GCM-256** directly on the worker's device.
- **Offline Persistence**: Shift and incident indices are stored in browser **IndexedDB** (`fairwork_pulse_vault_v1`). Plaintext dates remain locally searchable while financial values stay encrypted.

### 2. Evidence Attachments with SHA-256 Integrity Checks
- **M-Pesa & Receipt Capture**: Workers attach photos of M-Pesa SMS confirmations, paper wage vouchers, gate badges, or clinical injury treatment cards.
- **Cryptographic Digest**: The client immediately computes a raw 256-bit **SHA-256 byte-hash** (`crypto.subtle.digest`) on the binary image before storage.
- **Interactive Lightbox**: Full-resolution image preview, document classification badges, timestamp verification, and SHA-256 inspection.
- **Evidence Index**: The cryptographic hash is recorded in the **Haki Dossier** so a later copy can be compared with the captured file. The app does not determine legal admissibility.

### 3. Bilingual Gemini AI Legal Rights Assistant
- **Kenya Labour Law Intelligence**: Powered by Google Gemini (`gemini-2.5-flash`), with a system prompt strictly grounded in the *Employment Act 2007*, *Regulation of Wages (General) Order*, and *Work Injury Benefits Act (WIBA) 2007*.
- **English & Sheng/Kiswahili Support**: Allows casual workers to ask questions in their preferred language (e.g. *"Mwajiri amekataa kunilipa overtime ya Sunday, nifanye nini?"*).
- **Graceful Offline Fallback**: If network connectivity drops, the assistant switches to an embedded offline statutory knowledge base without failing.

### 4. Encrypted Supabase Cloud Backup
- **PostgreSQL Database**: Configured with tables for `profiles`, `shifts`, `incidents`, and `evidence_files`.
- **Row Level Security (RLS)**: Enforces tenant isolation on all tables using cached `(select auth.uid()) = user_id` policies.
- **Private Storage Bucket**: Dedicated `evidence-vault` bucket with path-scoped RLS policies (`${user.id}/${evidence.id}.${ext}`).
- **Encryption boundary**: With a PIN active, wage values, employer details, incident narratives, and evidence content upload as AES-GCM ciphertext. Profile fields, record dates, categories, and operational metadata remain readable to the service.

### 5. Anonymized Regional Regulator & Union Risk Monitor
- **Illustrative Aggregation**: The regulator view demonstrates how regional trends could be shown once a sufficient, consented dataset and privacy review exist. Its current values are sample data.
- **Labour Inspector Telemetry**: Gives COTU-K union reps and Sub-County Labour Officers heatmap visibility into systemic wage withholding and safety hotspots.

### 6. Dynamic Kenyan Legal Rules Engine
- **Sector-Specific Schedules**:
  - **Construction & Artisans** (*Ujenzi*) — KSh 1,180/day statutory benchmark
  - **Agriculture & Tea** (*Kilimo*) — KSh 820/day
  - **Domestic & Care Workers** (*Wafanyakazi wa Nyumbani*) — KSh 920/day
  - **Gig Delivery & Boda Boda** (*Usafirishaji*) — KSh 1,250/day
- **Statutory Audit Calculations**:
  - Wage shortfalls (Employment Act §§ 17–19)
  - Daily overtime (1.5× hourly rate for hours over statutory daily threshold)
  - Sunday and Public Holiday rest-day double time (2.0× hourly rate)

### 7. Multi-Channel 2G Feature-Phone (Kitochi) Intake Simulator
- **USSD Shortcode (`*384*2026#`)**: An interactive 2G USSD session simulator for non-smartphone casual workers.
- **WhatsApp Gateway Bot**: Interactive SMS/WhatsApp string parser (`SHIFT [Employer] [Agreed] [Paid] [Hours]`) that computes the statutory deficit and injects the shift into the worker's device ledger.

---

## 💻 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) / [Vinext](https://github.com/cloudflare/vinext) (React 19) |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Custom iOS "Pocket Evidence Wallet" Design System |
| **Local Database** | Native [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) via Custom Storage Engine |
| **Cryptography** | Native [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (PBKDF2, AES-GCM-256, SHA-256) |
| **Cloud Database** | [Supabase PostgreSQL](https://supabase.com/) with Row Level Security (RLS) |
| **Cloud Storage** | [Supabase Storage](https://supabase.com/storage) (`evidence-vault` bucket) |
| **AI Rights Bot** | [Google Gemini API](https://ai.google.dev/) (`gemini-2.5-flash`) |
| **Hosting Targets** | [Netlify](https://www.netlify.com/), [Cloudflare Workers](https://workers.cloudflare.com/), [OpenAI Sites](https://chatgpt.com/) |

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js**: `v22.13.0` or newer
- **npm**: `v10.0.0` or newer
- Git

### 2. Clone and Install
```bash
git clone https://github.com/ryanreo/fairwork-pulse.git
cd fairwork-pulse
npm install
```

### 3. Environment Variables
Copy the example environment configuration:
```bash
cp .env.example .env.local
```
Fill in your credentials in `.env.local`:
```ini
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key

# Google Gemini API Key
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Verification & Tests
```bash
# Run ESLint check (0 errors, 0 warnings)
npm run lint

# Run Next.js / Vinext build validation
npm run build
```

---

## 🌐 Deploying to Netlify

This repository includes a Netlify deployment configuration in [`netlify.toml`](netlify.toml).

### Option A: 1-Click Netlify Import
1. Push this repository to your GitHub account (`ryanreo/fairwork-pulse`).
2. Log in to [Netlify](https://app.netlify.com/).
3. Click **"Add new site"** > **"Import an existing project"** > Choose **GitHub**.
4. Select `fairwork-pulse`.
5. Netlify will automatically detect the settings from `netlify.toml`:
   - **Build command:** `npm run build:next`
   - **Publish directory:** `.next`
   - **Plugin:** `@netlify/plugin-nextjs`
6. In **Site Configuration** > **Environment variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `GEMINI_API_KEY`
7. Click **"Deploy site"**!

### Option B: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Log in and deploy
netlify login
netlify init
netlify deploy --build --prod
```

---

## ⚖️ Legal Framework & Statutory Citations

All statutory calculations and advice prompts are grounded directly in the Laws of Kenya:

1. **Employment Act (No. 11 of 2007)**
   - Section 17: Prohibition of unauthorized deductions
   - Section 18: Timely payment of wages upon completion of task
   - Section 27: Statutory rest day (at least one rest day per seven-day period)
   - Section 35: Redundancy, termination procedures, and summary dismissal
   - Section 29: Statutory 3-month fully paid maternity leave
2. **Regulation of Wages (General) Order**
   - Regulation 5: Standard statutory working hours (8 hours/day, 45–52 hours/week depending on sector)
   - Regulation 6: Overtime multiplier at **1.5×** basic hourly rate
   - Regulation 7: Sunday and gazetted public holiday multiplier at **2.0×** basic hourly rate
3. **Work Injury Benefits Act (WIBA, No. 13 of 2007)**
   - Employer liability for work-related injuries, emergency medical expenses, and disability compensation

> *Disclaimer: Fairwork Pulse provides indicative statutory guidance based on Kenyan legislation. Records and dossiers are designed for dispute conciliation and legal advocacy, but do not replace legal representation.*

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

Developed with ❤️ for Kenya's informal workforce.
