---
name: Nuxy Automation
description: Dark navy, one blue accent, Inter. Calm and plain-spoken, built for owners of small service businesses reading on a phone between jobs.
colors:
  bg: "#0b1220"
  bg-2: "#111c30"
  panel: "#162238"
  surface-strong: "#1c2a44"
  ink: "#f8fafc"
  body: "#cbd5e1"
  muted: "#94a3b8"
  hairline: "#233350"
  hairline-soft: "#1a2741"
  hairline-strong: "#33466b"
  blue: "#3b82f6"
  cyan: "#22d3ee"
  accent-soft: "rgba(59,130,246,0.16)"
  button: "#2563eb"
  button-hover: "#1d4ed8"
  on-accent: "#ffffff"
  link: "#7cb3ff"
  focus: "#93c5fd"
  ok: "#34d399"
  warn: "#fbbf24"
  bad: "#f87171"
typography:
  hero:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 1.3rem + 3.6vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.035em"
  section:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 1.25rem + 1.9vw, 2.5rem)"
    fontWeight: 650
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  card-title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 650
    lineHeight: 1.2
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  meta:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  eyebrow:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "0.08em"
    textTransform: "uppercase"
  button:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  sm: "8px"
  button: "10px"
  md: "12px"
  lg: "18px"
  full: "999px"
spacing:
  section: "clamp(64px, 9vw, 112px)"
  section-tight: "clamp(48px, 6vw, 72px)"
  container: "1200px"
  gutter: "clamp(16px, 4vw, 40px)"
  nav-height: "64px"
  tap-target: "44px for buttons, toggles, menu links and form fields (main buttons 48px); 24px with spacing for text links"
components:
  button-primary:
    backgroundColor: "{colors.button}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    minHeight: "48px"
  button-secondary:
    backgroundColor: "transparent"
    borderColor: "{colors.hairline-strong}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
  panel:
    backgroundColor: "{colors.panel}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
  chip:
    backgroundColor: "rgba(34,211,238,0.1)"
    textColor: "{colors.cyan}"
    rounded: "{rounded.full}"
---

# Design System: Nuxy Automation

The tokens live in one place: the `:root` block in `src/layouts/Base.astro`. This file describes them and the rules
for using them. If the two ever disagree, `Base.astro` is what ships; fix this file.

## Overview

A dark navy site with one blue accent. It should read as a calm, competent small business, not a tech startup:
plain words, real prices, real screenshots of real demos. The reader is a busy owner of a local service business,
often on a phone, deciding in under a minute whether this is worth a message.

What it is not: no robots or AI imagery, no glowing gradients, no heavy glass or 3D, no fake dashboards, no invented
numbers, logos or reviews. Decoration never stands in for evidence.

## Colors

- **Navy layers:** `bg` for the page, `bg-2` for alternating sections, `panel` for cards, `surface-strong` for
  raised parts inside a card. Edges are drawn with `hairline` lines rather than shadows.
- **One accent:** blue. `button` (#2563eb) is the filled button colour, chosen over `blue` so white button text passes
  AA. `link` is the lighter blue for text links on navy. `cyan` is used only for small labels (eyebrows, chips).
- **Text:** `ink` for headings, `body` for paragraphs, `muted` for supporting text. All three pass WCAG AA on every
  navy layer.
- **Status:** `ok`, `warn`, `bad` only for real states (sent, needs attention, failed), never decoration.
- **Focus:** a visible `focus` ring on every interactive element; never removed.
- The demo websites under `/example-sites/` and the salon inside `/demo/` are made-up businesses with their own palettes and fonts on
  purpose. They don't follow these tokens.

## Typography

- **Inter** (variable, latin subset), self-hosted at `public/fonts/inter-var-latin.woff2` and preloaded, with a
  metric-matched "Inter Fallback" face so text doesn't jump when the font arrives. No font requests to other sites.
- Headings 650-700 weight with slight negative tracking; `text-wrap: balance` on headings.
- Body 16px / 1.6. Paragraphs stay under about 70 characters wide.
- Prices use tabular figures where they line up in tables.

## Layout

- Content sits in `.wrap`: max 1200px, side gutter 16px on phones up to 40px.
- Sections breathe: `.section` padding 64-112px; `.section-head` holds the eyebrow, h2 and one-line intro.
- Built phone first and checked at 320, 375, 390, 768, 1024 and 1440px wide, with no sideways scroll at any width.
- Buttons, toggles, menu links and form fields are at least 44px tall (main buttons 48px). Text links in footers, breadcrumbs and sentences meet the WCAG 2.2 AA minimum instead: 24px, or spaced so a 24px circle on each touches no other target. `tests/pages.test.mjs` checks both on every page.
- Wide tables inside the docs pages scroll sideways inside their own box instead of widening the page. `Doc.astro`
  wraps every table in a `.table-scroll` region named after the heading above it; Tab reaches the box (and arrow keys
  scroll it) only while it overflows, and a soft shadow at the cut edge shows there is more.

### Pages

| Page | Job |
|---|---|
| `/` | Who it's for, the four main services, the flagship, how it works, the live demo, one clear next step |
| `/websites/` | Website building: own-it-outright vs optional monthly care, what you own, ownership promises |
| `/get-a-website/` | Short landing page for businesses without a website; links to the demo websites |
| `/automation/` | Lead response and follow-up, missed-call text-back, review requests and the other automations |
| `/solutions/` | Every service, grouped, with search and filters (all services visible without JavaScript) |
| `/pricing/` | Published one-time prices, the monthly plans, bundle discount, FAQ |
| `/about/` | How we work and what we won't do |
| `/contact/` | The inquiry form (and `/contact/thanks/`) |
| `/demos/` | Index of the demos: the interactive lead demo, demo websites and technical write-ups |
| `/examples/*` | One page per demo website: computer and phone view, what it shows, the services it demonstrates; the business is labelled made up |
| `/example-sites/*` | Full demo websites for made-up businesses (noindex, labelled as demos) |
| `/demo/` | "See it working": a made-up salon showing booking, reminders and missed-call text-back (labelled made up at the top) |
| `/work/*` | Case studies of the four open-source automations, each on a made-up business (said at the top), with the real output |
| `/docs/*` | Technical write-ups for the open-source projects |
| `/policies/` | Terms, plan terms and privacy |
| `404` | Plain way back to the main pages |

## Components

- **Buttons:** primary (filled blue) for the one main action in a view; secondary (outlined) for the alternative.
  One primary per view where possible. `.small`, `.wide` and `.pill` are size and shape variants.
- **Panel:** the card surface (`panel` background, hairline border, 18px radius). No shadow on navy except the
  header and floating parts, which use `--shadow`.
- **Eyebrow and chip:** small cyan uppercase labels; chips for tags like "Popular" or "Add-on".
- **FAQ:** native `<details>`; the plus icon turns 45 degrees when open.
- **ServiceCard:** name, price, one-line outcome, who it suits, what you need, running costs, and an "Ask about
  this" link that pre-selects the service in the form.
- **InquiryForm:** name, business name, email, type of business, what they'd like help with, and optional fields
  (the service or plan they're asking about, website, phone, tools, budget, best way to reach you). On success
  it shows a reference number; on failure it says plainly that the message was not sent and shows the email
  address instead. It never claims a message arrived when it didn't.
- **LeadDemo:** an interactive phone-frame demo of the flagship. It runs in the page only and sends nothing.
- **DeviceShot / DemoSites:** screenshots of the demo websites in a phone or laptop frame, each marked as a demo.
  Each screenshot comes in several widths (`shotWidths` in `src/data/demo-sites.ts`, with `srcset` and `sizes`), so a
  phone downloads a small file. `scripts/example-shots.mjs` remakes them from the demo pages.
- **CaseStudy:** the case-study layout. It shows only what really happened in a demonstration project and is
  labelled as one; it has no slots for invented results or quotes.
- **Icon:** Phosphor icons (regular weight), inlined as SVG so they take the text colour and cost no request.
  Decorative icons are hidden from screen readers.
- **Mark:** the Nuxy logo mark. Pass `label=""` where the words "Nuxy Automation" sit right beside it, so screen
  readers skip it; otherwise it is announced by its label.

All prices, services and plans come from `src/data/services.ts`; components never type a Nuxy price.

## Motion

- Short and functional: 160-200ms colour, border and transform changes on hover and open, easing
  `cubic-bezier(0.16, 1, 0.3, 1)`.
- The only motion nobody asked for is small and runs once: the home page flow diagram's steps fade in on load, and
  `.reveal` sections fade up as they scroll into view (only in browsers with scroll-driven animations).
- The lead demo plays only after the visitor starts it.
- `prefers-reduced-motion: reduce` turns off smooth scrolling and cuts every animation and transition to an instant
  change (a global rule at the end of `Base.astro`).

## Analytics hooks

Clicks on elements with `data-track="<event>"` (and on email links) are counted anonymously: an event name and the
page path, sent to Nuxy's own server, counted per day. No cookies, no IP address stored, never anything typed into a
form, and nothing at all when the browser sends Do Not Track or Global Privacy Control, or when the page is not on
the real address (local previews, tests and copies count nothing). Name new events in
`snake_case`, for example `cta_hero`, `service_ask`, `example_open`. The privacy section of `/policies/` lists what
is counted.

## Anchors and old links

The site used to be one long page. Old links like `/#lead-follow-up` or `/#request` still work: the home page maps
the old anchor to its new place.

- Every service id goes to `/solutions/#<id>`; ids of services that were merged go to their group,
  `/solutions/#<group>`.
- Every monthly plan id goes to `/pricing/#<id>`.
- `#request` goes to `/contact/`, `#services` and `#kinds` to `/solutions/`, `#plans` and `#faq` to the pricing page,
  `#work` to `/demos/#technical`, `#keep` to `/about/#how-we-work`.

Service ids are permanent: never reuse or rename one, because outreach emails and old links point at them.
