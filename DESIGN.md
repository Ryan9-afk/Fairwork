---
name: Fairwork Pulse
description: A calm pocket evidence wallet for Kenyan workers.
colors:
  ink: "#171817"
  warm-ground: "#f3f1ed"
  sheet: "#ffffff"
  quiet-line: "#e8e7e3"
  signal-yellow: "#ffd428"
  protective-mint: "#ccefd5"
  action-blue: "#0a72f5"
  danger: "#ff453a"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Geist Fairwork', 'Segoe UI', sans-serif"
    fontSize: "1.875rem"
    fontWeight: 680
    lineHeight: 1.08
    letterSpacing: "-0.04em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Geist Fairwork', 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Geist Fairwork', 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 650
    lineHeight: 1.2
rounded:
  control: "13px"
  surface: "24px"
  pill: "999px"
spacing:
  compact: "8px"
  control: "14px"
  surface: "20px"
  section: "28px"
components:
  button-primary:
    background: "{colors.ink}"
    color: "{colors.sheet}"
    borderRadius: "{rounded.pill}"
  button-quiet:
    background: "{colors.sheet}"
    color: "{colors.ink}"
    borderRadius: "{rounded.pill}"
  card:
    background: "{colors.sheet}"
    color: "{colors.ink}"
    borderRadius: "{rounded.surface}"
---

# Design System: Fairwork Pulse

## Overview

**Creative North Star: "The Pocket Evidence Wallet"**

Fairwork Pulse should feel like a trusted personal instrument carried at the end of a working day: quiet, protective, and immediately legible. The interface borrows the composure and tactile hierarchy of a native mobile wallet while using its most prominent surfaces for wage evidence, incident reporting, and remedy preparation.

Warm neutral ground, bright paper surfaces, compact typography, and sparing signal colors keep the product reassuring without making legal or financial risk feel casual. The worker's current claim and next useful action always receive the clearest visual weight.

**Key Characteristics:**
- Warm, low-contrast environmental ground with crisp white working surfaces.
- One prominent summary surface followed by direct, pill-shaped actions.
- Native-feeling controls, generous touch targets, and a floating bottom dock.
- Yellow for capture, mint for protection, blue for navigation, red only for risk.

## Colors

The palette combines warm paper neutrals with small, purposeful safety signals.

### Primary
- **Work Ink:** The default text and primary-action color; use it for decisive labels and save actions.

### Secondary
- **Signal Yellow:** Reserved for the central log action and evidence-capture moments.
- **Protective Mint:** Used for privacy, completion, and low-pressure supportive actions.
- **Action Blue:** Used for navigation state, links, and system-level affordances.

### Neutral
- **Warm Ground:** The app canvas behind all working surfaces.
- **Paper Sheet:** Cards, grouped forms, and the bottom dock.
- **Quiet Line:** Hairline separators inside grouped controls.

**The Signal Economy Rule.** Bright color must communicate action or state; it is never ambient decoration.

## Typography

**Display Font:** SF Pro on Apple devices; self-hosted Geist elsewhere
**Body Font:** SF Pro on Apple devices; self-hosted Geist elsewhere

**Character:** Compact and familiar, with strong numerals for money and hours. Geist keeps the same crisp, neutral rhythm on Windows and Android where SF Pro is unavailable. Hierarchy comes from weight and scale rather than ornamental type.

### Hierarchy
- **Display** (680, 1.875rem, 1.08): Page titles and major record headings.
- **Headline** (700, 1.2rem, 1.2): Form and section headings.
- **Title** (650, 0.94rem, 1.25): Record names and high-value row labels.
- **Body** (400, 0.875rem, 1.45): Instructions and explanatory copy.
- **Label** (650, 0.75rem, normal case): Controls, metadata, and action names.

**The Numeric Clarity Rule.** Monetary values use tabular numerals and tighter tracking than supporting copy.

## Layout

The product is a phone-first single-column surface capped at 520px and centered on larger screens. Primary pages use 14–20px side gutters, 24–28px section spacing, and uninterrupted vertical reading order. Dense forms use grouped rows rather than nested cards. At small widths, labels and values retain separate columns; essential actions remain reachable above the floating navigation dock.

## Elevation & Depth

Depth is ambient, never structural. White working surfaces float above the warm ground with broad, low-opacity shadows. Internal hierarchy uses tonal changes and hairline separators; borders and shadows do not appear together on the same surface.

### Shadow Vocabulary
- **Ambient Surface** (`0 18px 45px rgb(32 34 31 / 7%)`): Major summary surfaces.
- **Quiet Group** (`0 13px 38px rgb(31 33 30 / 6%)`): Forms, ledgers, and grouped choices.
- **Floating Dock** (`0 16px 45px rgb(28 30 27 / 18%)`): Persistent mobile navigation only.

**The One Plane Rule.** A component gets either a separator or elevation at its outer edge, never both.

## Shapes

Large surfaces use gently rounded 24–27px corners. Primary buttons and compact actions are true pills. Icon wells use 10–12px corners, while the central capture action is circular. Organic cropped circles may softly enter summary-card corners but may not replace content.

## Components

### Buttons
- **Shape:** Full pills for primary and quick actions; compact 13px corners for secondary in-form controls.
- **Primary:** Work Ink background, white label, 48px minimum height.
- **Hover / Focus:** Darken slightly on hover; use a translucent action-blue focus ring.
- **Secondary:** White or softly tinted surfaces with dark text and a real Lucide icon.

### Cards / Containers
- **Corner Style:** Large, softly rounded surfaces (24px).
- **Background:** Paper Sheet on Warm Ground.
- **Shadow Strategy:** Broad ambient lift without an outside border.
- **Internal Padding:** 20–27px for summaries; 14–18px for grouped controls.

### Inputs / Fields
- **Style:** Transparent grouped rows with a Quiet Line separator; label left, value right.
- **Focus:** Blue ring or caret feedback without shifting layout.
- **Error / Disabled:** Risk red is reserved for actionable errors and unpaid-status text.

### Navigation
- **Style:** A floating five-position paper dock. Default items are gray, the active destination is blue, and the center log control is a raised yellow circle with a plus icon.

### Evidence Summary
- **Style:** A large white wallet-like surface showing the indicated amount due, record count, and status. It is the visual anchor of the home screen.

## Do's and Don'ts

### Do:
- **Do** make the worker's current amount, record status, and next action visible in the first viewport.
- **Do** maintain 44px or larger interactive targets and visible keyboard focus.
- **Do** use Lucide icons consistently and pair unfamiliar symbols with labels.
- **Do** let Kiswahili and English labels expand without overlap.

### Don't:
- **Don't** use banking logos, card-network branding, or proprietary Apple interface assets.
- **Don't** decorate every card with a different color; signal colors must retain meaning.
- **Don't** stack cards inside cards when grouped rows can communicate the structure.
- **Don't** use glass effects away from the navigation dock or other genuinely floating chrome.
