# Fairwork Pulse — Sources, Attributions, and Disclosure Register

Last reviewed: 20 September 2026

This register records third-party code, design guidance, icons, legal authorities, and AI assistance used in the Fairwork Pulse hackathon prototype. It is intended to support the hackathon disclosure requirement and make every externally sourced claim traceable.

## 1. UI components and design guidance

| Source | What we use | Where it is used | License / status |
|---|---|---|---|
| [shadcn/ui Button](https://ui.shadcn.com/docs/components/base/button) | The reusable React `Button` primitive and its variant architecture. Fairwork Pulse adds `iosPrimary`, `iosTinted`, and `iosPlain` variants rather than hand-writing separate buttons. | `components/ui/button.tsx`; all interactive buttons in `app/page.tsx` | MIT. Local license copy: `vendor/shadcn-tailwind-4.13.0.LICENSE.md` |
| [Base UI / Radix Slot pattern through shadcn/ui](https://ui.shadcn.com/docs/components/base/button) | Accessible composition behavior for the shared button primitive. | `components/ui/button.tsx` | Open-source dependencies declared in `package.json` and locked in `package-lock.json` |
| [Apple Design resources and Human Interface Guidelines](https://developer.apple.com/design/) | Reference for an iOS-inspired information hierarchy, grouped surfaces, familiar navigation, and touch-first controls. No Apple artwork, SF Symbols files, or proprietary design-kit assets are copied into the product. | Visual rules in `app/globals.css` and the documented design system | Guidance/reference only |
| [Apple UI design tips](https://developer.apple.com/design/tips/) | Minimum 44-point touch targets, screen-fitting layouts, legible text, contrast, and proximity between controls and the content they affect. | Button sizes, bottom navigation, grouped form rows, responsive layout | Guidance/reference only |
| [Lucide Icons](https://lucide.dev/) | Interface icons including check, calendar, briefcase, receipt, shield, folder, and alert symbols. | `app/page.tsx` | ISC license; installed package license at `node_modules/lucide-react/LICENSE` |
| [Geist](https://vercel.com/font) | Self-hosted variable UI font used as the non-Apple fallback. Apple devices continue to use their native SF Pro system font. | `public/fonts/geist-latin.woff2`; font stack in `app/globals.css` | SIL Open Font License 1.1 |

### Component decision

The prototype uses the checked-in shadcn/ui `Button` component as the single button source of truth. The visual variants are Fairwork Pulse styling layered on that primitive. This gives the team one auditable component instead of many unrelated `<button>` implementations.

## 2. Primary Kenyan legal authorities

These sources support the legal-information features. They are not a substitute for legal advice. Before a public or production release, a Kenyan labour-law practitioner should review the rules engine and every generated dossier statement.

| Authority | Product use | Primary source |
|---|---|---|
| Employment Act, 2007, sections 8–10 | Oral/written contracts, written-contract threshold, and required employment particulars. | [Kenya Law — current consolidated Employment Act](https://new.kenyalaw.org/akn/ke/act/2007/11/eng@2024-04-26) |
| Employment Act, 2007, sections 17–19 | Wage payment and permitted deductions; used in the wage-shortfall explanation. | [Kenya Law — current consolidated Employment Act](https://new.kenyalaw.org/akn/ke/act/2007/11/eng@2024-04-26) |
| Employment Act, 2007, section 27 | Working hours and weekly rest-day entitlement. Section 27 alone does not establish the prototype’s 8-hour daily threshold. | [Kenya Law — current consolidated Employment Act](https://new.kenyalaw.org/akn/ke/act/2007/11/eng@2024-04-26) |
| Regulation of Wages (General) Order, rules 5–6 | Normal working week and overtime multipliers: 1.5× beyond normal hours; 2× on a normal rest day or public holiday. | [Kenya Law — Regulation of Wages (General) Order](https://new.kenyalaw.org/akn/ke/act/ln/1982/120/eng@2022-12-31/source) |
| Employment Act, 2007, sections 5, 29 and 46 | Pregnancy discrimination, maternity leave, and pregnancy as an invalid reason for dismissal or discipline. | [Kenya Law — current consolidated Employment Act](https://new.kenyalaw.org/akn/ke/act/2007/11/eng@2024-04-26) |
| Work Injury Benefits Act, 2007 | Injury compensation, employer obligations, notice, reporting, and medical-aid flows. | [Kenya Law — WIBA source](https://new.kenyalaw.org/akn/ke/act/2007/13/eng@2007-11-09/source); [Ministry of Labour PDF](https://www.labour.go.ke/sites/default/files/law/THE_WORK_INJURY_BENEFITS_ACT_2007.pdf) |
| Occupational Safety and Health Act, 2007 | General workplace safety duties and occupational safety context. | [ILO NATLEX record](https://natlex.ilo.org/dyn/natlex2/r/natlex/fe/details?p3_isn=78264) |
| UN Guiding Principles on Business and Human Rights, Pillar III | Product rationale for improving access to effective remedy and reducing practical evidence barriers. | [OHCHR — Guiding Principles](https://www.ohchr.org/documents/publications/guidingprinciplesbusinesshr_en.pdf) |

### Legal implementation caution

The current UI demonstrates an indicative calculation. The brief’s default “8 hours per day” assumption is not presented here as a universal statutory rule: Kenya’s general order defines a normal 52-hour week, and sector-specific wage orders or contracts may set different daily arrangements. The production rules engine must select the applicable wage order, sector, contract terms, rest day, and current amendments before generating a final claim figure.

## 3. Original and illustrative content

- Product name, tagline, feature architecture, user flows, and demo scenario were supplied by the Fairwork Pulse team.
- Employer names, worker names, locations, monetary values, counts, and records visible in the prototype are fictional demonstration data.
- No testimonials, adoption statistics, case outcomes, or official endorsements are claimed.
- The generated visual mockup under `.impeccable/mocks/decision/` is a private design-development artifact and is not shipped as product content.

## 4. AI assistance disclosure

OpenAI Codex assisted with code scaffolding, interface implementation, design iteration, documentation, and source organization. The team supplied the product concept, requirements, target users, demo flows, and hackathon context. Team members remain responsible for reviewing the code, verifying legal statements, testing the prototype, and presenting the work as an AI-assisted—not entirely AI-generated—submission.

## 5. Technical dependency record

The authoritative package inventory and exact installed versions are in `package.json` and `package-lock.json`. Important direct dependencies include Next.js/Vinext, React, Tailwind CSS, shadcn/ui-related primitives, Radix UI, class-variance-authority, and Lucide React. License texts included by packages remain in `node_modules` for the local build; the shadcn license is also preserved under `vendor/`.

## 6. Citation practice for the pitch and dossier

- Cite the consolidated Kenya Law page and the specific section number on every legal-information slide.
- Cite the Regulation of Wages order—not Employment Act section 27 alone—for the 1.5× and 2× overtime multipliers.
- Mark all prototype calculations as “indicative” until sector and wage-order selection is implemented.
- Keep statutory paraphrases short; link to the primary source instead of reproducing long passages.
- Add a review date because statutes, regulations, minimum-wage orders, and public contact directories can change.
