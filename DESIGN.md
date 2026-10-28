---
name: Nuxy Automation
description: A warm, photo-led marketplace look (after the Airbnb reference in awesome-design-md): white canvas, near-black ink, one coral accent, soft rounded shapes.
colors:
  bg: "#ffffff"
  surface: "#f7f7f7"
  surface-strong: "#f0f0f0"
  ink: "#222222"
  body: "#3f3f3f"
  muted: "#6a6a6a"
  hairline: "#dddddd"
  hairline-soft: "#ebebeb"
  accent: "#dc2453"
  accent-press: "#b8143f"
  accent-text: "#c81d4a"
  accent-soft: "#fdecf0"
  on-accent: "#ffffff"
  dark-bg: "#121212"
  dark-surface: "#1b1b1b"
  dark-ink: "#f3f3f3"
  dark-accent-text: "#ff7d97"
typography:
  hero:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 3.3vw, 2.875rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  section:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  card-title:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  meta:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
  price:
    fontFamily: "Figtree, -apple-system, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    fontFeature: "tnum, lnum"
rounded:
  sm: "8px"
  md: "14px"
  lg: "20px"
  full: "999px"
spacing:
  section: "clamp(56px, 7vw, 88px)"
  container: "1200px"
  gutter: "clamp(16px, 4vw, 40px)"
  card-gap: "40px 24px"
  nav-height: "72px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    height: "48px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    border: "1px inset {colors.ink}"
    rounded: "{rounded.sm}"
    height: "48px"
  nav-pill:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    height: "40px"
  listing:
    photoRatio: "4 / 3 (first row), 16 / 9 (second row)"
    photoRounded: "{rounded.md}"
  ticket:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.md}"
    padding: "24px"
---

# Design System: Nuxy Automation

## Overview

The site reads like a friendly booking marketplace, the world the clients already live in. The canvas is white (near-black in dark mode), the ink is near-black, and one coral accent carries the single action: **Request a setup**. Real photography of the businesses served (salon, spa, nail studio, barbershop, dance studio, tattoo studio, groomer) carries the visual weight, so type stays modest. The photos are generated stock scenes, never presented as clients.

Built from three skills: **awesome-design-md** (the Airbnb reference: white canvas, one accent, photo-first cards, pill search bar, reservation card), **taste-skill** (design read, anti-slop rules, pre-flight) and Vercel's **web design guidelines** (accessibility, focus, motion, content handling).

**Design read:** a landing page for small booking-business owners reading on a phone, in a warm, photo-led marketplace language, built with native CSS in Astro. Dials: variance 6, motion 4, density 4.

**Key characteristics**
- One accent. Coral fills only the request action (nav pill, hero button, request card) and the search orb. Everywhere else is ink, greys and photos.
- Photo-first package listings with the price on the title line, like a listing card.
- The finder under the hero is the Airbnb search pill, split by problem (Missed calls, Slow replies, Few reviews, Old website); the coral orb opens every package.
- The request card is the reservation card: what to include, one full-width button, and "Nothing is charged until you agree to the written plan."
- Works without client-side JavaScript. Three small inline scripts only enhance: the small-screen menu closes on a choice, the copy-address button, and the demo's message arrivals.

## Colors

- **Ink** (#222222): headings, prices, nav, the focus ring. Never pure black.
- **Body** (#3f3f3f) for running text; **Muted** (#6a6a6a) for meta lines ("Fixes: ..."), captions and the legal band.
- **Coral** (#dc2453, pressed #b8143f): the request action and the orb only. White text on it is 4.9:1.
- **Coral text** (#c81d4a light, #ff7d97 dark): link hover and the check marks in the request card.
- **Coral soft** (#fdecf0 / #3b1621): selection and the demo's auto-filled words.
- **Surfaces**: #f7f7f7 for the How it works band, the footer and quiet notes; #f0f0f0 behind icons and loading photos.
- **Dark mode** follows the system (`prefers-color-scheme`): the same roles on #121212, ink #f3f3f3. Coral stays the same fill.

**The One Coral Rule.** If something is coral, it is the way to ask for a setup. Package cards use a quiet ink link; only the package an email linked to (`:target`) turns its link into the coral button.

## Typography

**Figtree** (variable 300-900, self-hosted, preloaded; SIL Open Font License), the closest free match to Airbnb's Cereal. One family for everything.

- **Hero**: 700, two lines on desktop, -0.03em.
- **Section titles**: 700, about 28-36px. No eyebrows above them.
- **Card titles**: 700 at 19px with the price right-aligned on the same line (tabular numerals).
- **Body** 16px / 1.55; **meta** 15px muted.
- Sentence case throughout (the Airbnb voice), including buttons. No em or en dashes anywhere on the site.

## Layout

- Container 1200px with a 16-40px gutter; sticky white header 72px with a hairline.
- Hero: copy (1.25fr) beside the photo (1fr, 20px radius), the photo's height held to the viewport (420-660px). Stacks on phones with the photo below the buttons.
- Packages: 6-column grid, three listings then two wider ones; 2 columns on tablets (the last one full width), 1 on phones. Requests line up at the bottom of each row.
- Care plan: its own wide card (photo beside text) because it is monthly.
- Add-ons: sticky title on the left, rows with round icons on the right.
- How it works: a grey band, four steps along a dashed line with calendar-style numbers (first one filled); vertical on phones.
- Projects: the relay video beside the four projects.
- Request: details on the left, the sticky ticket on the right.
- Footer: three link columns and a legal band ("No cookies, no tracking.").

## Shapes and elevation

Radius rule: **buttons 8px, cards and photos 14px, hero photo and large framed cards 20px, pills and round icons full.** One shadow tier (`--shadow`) for the finder, menu and demo frames, and a lifted tier (`--shadow-lift`) for the ticket, the open menu and hovered guides. No other shadows.

## Motion

Motion level 4: purposeful and quiet.
- Hero copy rises in (staggered 80ms) and the photo settles from 1.03 scale.
- Sections rise 28px as they enter, using CSS scroll-driven animations (`animation-timeline: view()`) where supported; elsewhere they are simply there.
- Photos scale 1.03 on card hover; the request arrow nudges 3px; buttons press to 0.98.
- `prefers-reduced-motion`: all of it off, and the demo video waits for its play button.

## Icons

Phosphor (regular), inlined by `src/components/Icon.astro` so they take the text colour. One family only; decorative icons are `aria-hidden`.

## Anchors

Outreach emails link to `#booking`, `#follow-up`, `#reviews`, `#new-website`, `#site-fixes`, `#care`, `#add-ons`, `#missed-calls`, `#deposits`, `#gift-cards`, `#packages`, `#how`, `#work`, `#request`. Keep these ids stable.
