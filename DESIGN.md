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
  service-card:
    rounded: "{rounded.md}"
    padding: "20px"
    border: "1px {colors.hairline}"
    hover: "lift 3px + the lifted shadow"
  category-strip:
    active: "ink label + 2px ink underline"
    inactive: "muted label"
  ticket:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.md}"
    padding: "24px"
---

# Design System: Nuxy Automation

## Overview

The site reads like a friendly marketplace, the world small-business owners already shop in. The canvas is white (near-black in dark mode), the ink is near-black, and one coral accent carries the single action: **Request a setup**. It sells to every kind of small business (appointments, trades, restaurants, shops, offices), so the only photo is the hero: a shop owner at work. Generated stock, never presented as a client. Everything else is type, icons and motion that shows the product working.

Built from three skills: **awesome-design-md** (the Airbnb reference: white canvas, one accent, category strip, reservation card and its sticky phone bar), **taste-skill** (design read, anti-slop rules, pre-flight) and Vercel's **web design guidelines** (accessibility, focus, motion, content handling).

**Design read:** a landing page for small-business owners of every kind, reading on a phone or laptop, in a clean, warm marketplace language, built with native CSS and a little vanilla JS in Astro. Dials: variance 6, motion 6, density 4.

**Key characteristics**
- One accent. Coral fills only the request action (nav pill, hero button, request card, phone bar) and the request on a service an email linked to. Everywhere else is ink, greys and the one photo.
- The hero photo carries live notifications ("Website inquiry answered", "Invoice paid"...) that arrive and leave every few seconds, marked "Examples of what runs while you work".
- One service catalog: Airbnb's category strip (All, Appointments, Trades, Restaurants, Shops, Offices) filters the cards and puts each kind's usual first steps first ("Start here"). Four groups: Win and keep customers, Less admin, Websites and Google, Add-ons.
- Service cards: icon, name and price, the problem it fixes, then "What's included" opening the details and the request. No repeated request rows down the page.
- The request card is the reservation card; on phones a sticky bar carries the same action once the hero is gone.
- Bundles: a + on each card (Airbnb's save heart) adds it to a bundle; a floating bar shows the services, the total with 10% off for 2 and 15% off for 3 or more, a nudge to the next step ("Add 1 more for 15% off") and one request email for the lot. It replaces the phone bar while it's open.
- Works without client-side JavaScript: every service is shown, the strip stays hidden, details open by tap. The scripts only enhance.

## Colors

- **Ink** (#222222): headings, prices, nav, the focus ring. Never pure black.
- **Body** (#3f3f3f) for running text; **Muted** (#6a6a6a) for meta lines ("Fixes: ..."), captions and the legal band.
- **Coral** (#dc2453, pressed #b8143f): the request action only. White text on it is 4.9:1.
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

- Container 1200px with a 16-40px gutter; sticky white header 72px with a hairline; the nav marks the section being read.
- Hero: copy (1.1fr) beside the photo (1fr, 20px radius) with the notification stack on it, three promises under the buttons. Stacks on phones with the photo below.
- Tools: a full-width row of the tools the work is built in, drifting slowly (held on hover).
- Services: the strip sticks under the header while the catalog scrolls; cards 3 across (Websites and Google 4 across), 2 on tablets, 1 on phones. Groups hold 6, 6, 4 and 3 so rows fill.
- Monthly plans: three cards, the most complete one set apart.
- How it works: a grey band, four steps on a line that draws in as you scroll; vertical on phones.
- Projects: the relay video beside three projects.
- Questions: sticky title on the left, answers that slide open on the right.
- Request: details on the left, the sticky ticket on the right.
- Footer: three link columns and a legal band ("No cookies, no tracking.").

## Shapes and elevation

Radius rule: **buttons 8px, cards and photos 14px, hero photo and large framed cards 20px, pills and round icons full.** One shadow tier (`--shadow`) for the menu and the demo video, and a lifted tier (`--shadow-lift`) for the ticket, the notifications, the featured plan and hovered cards. No other shadows.

## Motion

Motion level 6: lively, always meaning something.
- Hero copy rises in (staggered 90ms), the photo settles from 1.04 scale, then the notifications arrive one by one and keep cycling every 2.8s (paused while the tab is hidden).
- The tools row drifts (48s a loop, held on hover).
- The category strip filters with a View Transition: cards slide to their new places.
- Service details and answers slide open (`::details-content` with `interpolate-size`); carets turn, the answer's plus turns into a cross.
- Cards lift 3px on hover and their icon fills ink; the request arrow nudges 3px; buttons press to 0.98.
- Sections rise as they enter, and the How it works line draws step to step (CSS scroll-driven animations where supported; elsewhere everything is simply there).
- `prefers-reduced-motion`: all of it off, the tools wrap still, the notifications stand still, the demo video waits for its play button.

## Icons

Phosphor (regular), inlined by `src/components/Icon.astro` so they take the text colour. One family only; decorative icons are `aria-hidden`.

## Anchors

Outreach emails link to every service id (`#booking`, `#follow-up`, `#reviews`, `#quotes`, `#email-list`, `#ordering`, `#ai-replies`, `#invoices`, `#store`, `#reports`, `#data`, `#integrations`, `#new-website`, `#site-fixes`, `#online-shop`, `#google-profile`, `#missed-calls`, `#deposits`, `#gift-cards`), the plans (`#care`, `#automation-care`, `#automation-partner`) and `#services`, `#how`, `#work`, `#faq`, `#request`. A link to a service shows every service, opens that card and turns its request coral. Keep these ids stable.
