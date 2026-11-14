---
name: Nuxy Automation
description: Obsidian and navy layers, platinum text, one electric-blue accent with a little ice cyan, Inter, and the metallic NUXY logo. Calm and plain-spoken, built for owners of small service businesses reading on a phone between jobs.
colors:
  bg: "#080d17"
  bg-2: "#101b2d"
  panel: "#19273c"
  surface-strong: "#213149"
  bg-deep: "#060a12"
  field: "#0c1523"
  ink: "#e8eef6"
  body: "#c7d2e1"
  muted: "#a5b4c8"
  placeholder: "#8696ad"
  hairline: "#263a54"
  hairline-soft: "#1c2b41"
  hairline-strong: "#375070"
  field-line: "#5f7697"
  field-line-hover: "#829abb"
  blue: "#2563eb"
  blue-line: "#4f8af5"
  cyan: "#43c7fa"
  accent-soft: "rgba(37,99,235,0.16)"
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
    backgroundColor: "rgba(67,199,250,0.1)"
    textColor: "{colors.cyan}"
    rounded: "{rounded.full}"
---

# Design System: Nuxy Automation

The tokens live in one place: the `:root` block in `src/layouts/Base.astro`. This file describes them and the rules
for using them. If the two ever disagree, `Base.astro` is what ships; fix this file.

## Overview

A dark site in the owner's palette (2026-11-13), chosen to sit under the metallic silver NUXY logo with its
electric-blue ring: Obsidian for the page, Midnight Navy and Titanium Slate for sections and cards, Platinum White
and Muted Silver for text, Electric Blue as the one accent and Ice Cyan for small labels. Roughly three quarters
dark, a fifth neutral, and a few percent blue or cyan. It should read as a calm, competent small business, not a
tech startup: plain words, real prices, real screenshots of real demos. The reader is a busy owner of a local service business,
often on a phone, deciding in under a minute whether this is worth a message.

What it is not: no robots or AI imagery, no glowing gradients (one restrained glow exists: see Colors), no heavy glass or 3D, no fake dashboards, no invented
numbers, logos or reviews. Decoration never stands in for evidence.

One exception, from the owner's cinematic brief (2026-11-11), which asks for a more premium, cinematic first
impression: the heroes of `/`, `/websites/`, `/automation/` and `/website-security/`, and a screen on
`/creative-studio/`, may each carry one short silent video loop made with an AI video tool. The footage is abstract
(light, structure, networks): no people, no robots, no logos, no words. It is decoration and is held to the rules
under "Cinematic loops" in Motion. Everything else above still holds, and real website demonstrations stay real
screenshots or working pages. The owner approved the generation budget on 2026-11-11 and the five loops exist
(`src/data/cinematic-manifest.json`). A page whose loop is not listed there builds and looks as it did before the
brief.

A second exception, from the owner's website levels brief (2026-11-12), which sells four website levels and needs
to show what the higher ones look like: real-time 3D appears in exactly one place, the Halvane Audio concept
(`/example-sites/halvane-audio/`, a made-up speaker brand labelled as a Nuxy demonstration), as the Immersive
level's example. Nuxy's own pages stay flat: the level pages, `/web-design/` and `/portfolio/` use the tokens
below, and the only "deeper" motion on them is the CSS-only three-levels café (ThreeLevels). The 3D is held to the
rules under "Halvane 3D" in Motion. "Make everything 3D" stays a don't.

## Colors

- **The owner's palette (2026-11-13), by name:** Obsidian `bg` #080D17, Midnight Navy `bg-2` #101B2D, Titanium
  Slate `panel` #19273C, Electric Blue `blue` #2563EB, Ice Cyan `cyan` #43C7FA, Platinum White `ink` #E8EEF6, Muted
  Silver `muted` #A5B4C8, Subtle Borders `hairline` #263A54. The other tokens are steps derived from these.
- **Dark layers:** `bg` for the page, `bg-2` for alternating sections, `panel` for cards, `surface-strong` for
  raised parts inside a card, `bg-deep` for the footer and code blocks, `field` for form fields. Edges are drawn
  with `hairline` lines rather than shadows.
- **One accent:** Electric Blue. `button` is the same #2563eb (white text on it is 5.17:1; on `button-hover` 6.70:1).
  `link` is the lighter blue for text links (6.09:1 or better on every layer). `cyan` is used only for small labels
  (eyebrows, chips) and small highlights.
- **Text:** `ink` for headings, `body` for paragraphs, `muted` for supporting text. Measured on the lightest layer
  they sit on (`surface-strong`): 11.24, 8.58 and 6.23 to 1; on the page: 16.65, 12.71 and 9.22. `placeholder` is
  4.36:1 on `surface-strong` and 5.00 or better on the layers fields really sit on.
- **Edges that carry meaning** (a form control's outline, a chosen card): `field-line` and `blue-line`. `field-line`
  is 3:1 or better on `field`, `panel` and `bg-2` (WCAG 1.4.11); `blue-line` is 3.93:1 or better on every layer.
  `hairline` is decoration only (its strong step is 2.35:1 on the page) and never the only sign of a control or a
  state.
- **The one glow:** `--glow` (a 1px blue edge and a soft blue shadow below). It appears on a filled button while
  hovered and on the one featured plan card of `/pricing/`. Nowhere else: no glowing text, no glow on panels, icons
  or sections. Blue light inside the logo files is part of the logo and is not re-created in CSS.
- **Status:** `ok`, `warn`, `bad` only for real states (sent, needs attention, failed), never decoration.
- **Focus:** a visible `focus` ring on every interactive element; never removed.
- The demo websites under `/example-sites/` and the salon inside `/demo/` are made-up businesses with their own palettes and fonts on
  purpose. They don't follow these tokens.
- Demo-brand fonts never cost a download: Halvane Audio uses the same self-hosted Inter in its own warm palette,
  and the Ostrel Coffee café inside ThreeLevels uses the system serif stack (`ui-serif, serif`) with `--mono`
  for small labels. No demo requests a font from another site.

## Typography

- **Inter** (variable, latin subset), self-hosted at `public/fonts/inter-var-latin.woff2` and preloaded, with a
  metric-matched "Inter Fallback" face so text doesn't jump when the font arrives. No font requests to other sites.
- Headings 650-700 weight with slight negative tracking; `text-wrap: balance` on headings.
- Body 16px / 1.6. Paragraphs stay under about 70 characters wide.
- Prices use tabular figures where they line up in tables.
- Headings on Nuxy's own pages are in Title Case (approvals 85, 2026-11-13): small words (a, an, the, and, or, for,
  to, of, in, on, with, from...) stay lower case unless first or last; a one-sentence heading has no full stop, a
  heading of two sentences keeps both ("Build Smarter. Grow Faster."). The made-up demo businesses keep their own style.

### Working type scale (as built, rem at a 16px root)

| Step | Size | Used for |
|---|---|---|
| Display | `clamp(2.25rem, 1.3rem + 3.6vw, 3.75rem)` (36-60px), 700, -0.035em, line-height 1.06 | every page's h1, the home hero included |
| Section | `clamp(1.75rem, 1.25rem + 1.9vw, 2.5rem)` (28-40px), 650, -0.03em | h2 section heads; feature blocks use `clamp(2rem, 1.4rem + 2.6vw, 3-3.25rem)` |
| Sub-section | `clamp(1.5rem, 1.2rem + 1.2vw, 2rem)` and `1.5-1.75rem` | price figures, plan names, large card heads |
| Card head | `1.25-1.375rem` | panel titles, step titles |
| Lead / h3 | `1.1875rem` | `.lead` intro paragraphs and h3 |
| h4 / large body | `1.0625-1.125rem` | h4, FAQ questions, button labels |
| Body | `1rem` / 1.6 | paragraphs |
| Small | `0.9375rem` | card body text, list items (the most used size) |
| Smaller | `0.875rem`, `0.8125rem` | meta lines, notes, form hints, table cells |
| Label | `0.75rem`, `0.6875rem` | eyebrows, chips, uppercase labels (never below 11px) |

New text uses one of these steps; sizes outside them (a few 1.3125 and 1.625rem) are older one-offs, not a pattern.

### Corner radii

- Tokens in `Base.astro`: `--r-sm` 8px (inputs, small buttons), `--r-md` 12px (cards inside panels, tiles),
  `--r-lg` 18px (panels: the main card surface), `--r-full` 999px (pills, chips, main buttons).
- The one larger box is the closing call to action on the home page (`.final-box`, 24px), so it reads as the end of the page.
- Small parts (progress bars, focus underlines, tags inside cards): 2-6px. Round icons and avatars: 50%.
- Plain px values elsewhere (10, 14, 22px) are older one-offs; new work uses the tokens.

## Layout

- Content sits in `.wrap`: max 1200px, side gutter 16px on phones up to 40px.
- Sections breathe: `.section` padding 64-112px; `.section-head` holds the eyebrow, h2 and one-line intro.
- Built phone first and checked at 320, 375, 390, 768, 1024, 1440 and 1920px wide, with no sideways scroll at any width.
- The header is 64px tall on every page at every width. Below 900px its links fold into the phone menu; from 900px
  they sit in a row with the Services dropdown; the "Get a Free Quote" button shows from 768px.
- Buttons, toggles, menu links and form fields are at least 44px tall (main buttons 48px). Text links in footers, breadcrumbs and sentences meet the WCAG 2.2 AA minimum instead: 24px, or spaced so a 24px circle on each touches no other target. `tests/pages.test.mjs` checks both on every page.
- Wide tables inside the docs pages scroll sideways inside their own box instead of widening the page. `Doc.astro`
  wraps every table in a `.table-scroll` region named after the heading above it; Tab reaches the box (and arrow keys
  scroll it) only while it overflows, and a soft shadow at the cut edge shows there is more.

### Pages

| Page | Job |
|---|---|
| `/` | In this order: hero ("Build Smarter. Grow Faster.", two buttons, starting prices), what we do (two service categories), the four website levels, example work, the automation demos, how it works, the handover summary, why Nuxy, a short FAQ, one final next step with the callback link |
| `/handover/` | How a finished website is handed over, for someone who has never owned one: the steps, what Nuxy does and what the client does, the two account arrangements, other companies' costs, care plans, asking for changes, leaving or moving later. Written from `src/data/handover.ts`, `services.ts` and `/policies/`. **New: publishing it needs the owner's yes.** It says nothing about a client portal: none is live (`handoverPortal = false` in `src/data/site.ts`, and a test fails the build if a page speaks of one) |
| `/websites/` | Website building: own-it-outright vs optional monthly care, what you own, ownership promises |
| `/get-a-website/` | Short landing page for businesses without a website; links to the demo websites |
| `/automation/` | Lead response and follow-up, missed-call text-back, review requests and the other automations |
| `/ecommerce/` | Online stores in the client's own Shopify or Square Online account, with the two published sizes |
| `/website-security/` | Free website health consultation, repairs at a fixed written price, and security assessments only with the owner's written authorization |
| `/web-design/` | The four website levels (Business, Signature, Immersive, Flagship): the level cards, the comparison tabs, the expectation matrix, the three-levels café, the five-question finder, add-ons, "Why does immersive cost more?", package boundaries, timelines and the levels FAQ |
| `/business-websites/`, `/signature-websites/`, `/immersive-websites/` | One page per level (`LevelPage.astro`): who it suits, what's included, what's not, timeline and revisions, add-ons, the other levels. There is no Flagship page: Flagship is a written scope, reached from `/contact/?level=flagship` |
| `/portfolio/` | "Our Work", in three kinds kept apart: client projects (`#clients`, shown only when an entry passes every check in `case-studies.ts`: none today), concept demonstrations (`#concepts`: the example websites and the store, each for a made-up business and labelled so, plus the three video concepts), and interactive experiments (`#technical`: the open-source automations) |
| `/portfolio/<slug>/` | One client project (`[slug].astro`), built only for an entry that passes `publishable()`; Chrysfadezzz (CHRYS) is published there since 13 November 2026 (indexable, canonical, CreativeWork JSON-LD); the stage build (`npm run build:stage`, `stage/case-studies.ts`, empty now) adds any client still waiting on a yes, with a "Staged preview, not published" note, `noindex` and no JSON-LD. Hero: tags, name, summary, buttons, then on a phone the cover and the facts, all on one left edge; an "On this page" index of the sections (the `/handover/` pill pattern), with a "Back to the sections" link after the closing band; the seven sections the brief names; a Design Showcase (phone and computer frames from `CaseFrame.astro`, each a link to its full file, opened in a `<dialog>` viewer that always shows the whole picture, with caption, "3 of 8", arrows, keys and swipe; closing returns focus to the picture that opened it); a walkthrough video that loads nothing until played; the closing quote band with the entry's lead source |
| `/solutions/` | Every service, grouped, with search and filters (all services visible without JavaScript) |
| `/pricing/` | Published one-time prices, the monthly plans, bundle discount, FAQ |
| `/creative-studio/` | AI Creative & Video Advertising: three kinds of video work with starting prices, what every video includes, the starting-price estimator, the three fictional concept demos (only once all three exist as real files), limits and FAQ. **Its prices are proposed: publishing the page needs the owner's written yes** |
| `/about/` | How we work and what we won't do |
| `/contact/` | The inquiry form (and `/contact/thanks/`), and under it the callback request form (`#callback`) |
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
  One primary per view where possible. `.small`, `.wide` and `.pill` are size and shape variants. A filled button
  takes `--glow` on hover; nothing else does, except the featured plan.
- **Button wording:** "Get a Free Quote" is the main action everywhere. A page that sells one thing may name it
  ("Get a Free Website Quote", "Get My Custom Quote", "Get My Free Automation Plan" on `/automation/`); the second
  action is "Request a callback". Sentence case for links and secondary actions.
- **Panel:** the card surface (`panel` background, hairline border, 18px radius). No shadow on the dark layers
  except the header and floating parts, which use `--shadow`.
- **Eyebrow and chip:** small cyan uppercase labels; chips for tags like "Popular" or "Add-on".
- **FAQ:** native `<details>`; the plus icon turns 45 degrees when open.
- **ServiceCard:** name, price, one-line outcome, who it suits, what you need, running costs, and a "Get a Free
  Quote" link that pre-selects the service in the form.
- **Header (`Base.astro`):** Services (a dropdown of eight links, `details.drop[data-drop]`), Pricing, Demos, Our
  Work, About, and one button, "Get a Free Quote". On phones the same links sit in one menu
  (`details.menu[data-menu]`). Both are native `<details>`, so they open without JavaScript; the script only adds
  Escape, a click outside, closing after a link is chosen, and closing the dropdown when focus moves on. Services is marked current on every service page.
- **InquiryForm:** name, business name, email, type of business, what they'd like help with, and optional fields
  (the service or plan they're asking about, website, phone, tools, budget, best way to reach you). On success
  it shows a reference number; on failure it says plainly that the message was not sent and shows the email
  address instead. It never claims a message arrived when it didn't. Above the button it says what happens next:
  a written recommendation and price, and no sales call is required.
  A link with `?services=<id>,<id>` (from the estimator) names those services at the top and writes them into the
  project box, only when the box is empty, where the visitor can change them. Ids that aren't in the catalogue are
  dropped, and nothing is sent until the visitor presses the button.
- **Form controls:** fields sit on `field` with a `field-line` edge (lighter on hover, the focus ring on focus).
  Radio buttons and checkboxes are drawn (20px, `appearance: none`) so their edge holds 3:1 on every layer; they
  are still real inputs, so the keyboard and screen readers treat them as before.
- **CallbackForm (`/contact/#callback`):** name, business, phone (required), email (optional), what the call is
  about, the time of day preferred (a preference only: business days, Central time), an optional note, and one
  unticked box: "I agree that Nuxy Automation may call or text me at this number about this request". It says it is
  a request, not an appointment; it never shows, offers or promises a time. Reasons and times come from
  `src/data/callback.ts`, the same lists as the inquiry service's. It posts to the same inquiry service as the quote
  form, and the service must be deployed before the site (approvals item 49), or every callback is refused.
- **PackageEstimator (`/pricing/#package`):** tick services, see an estimated starting price, and carry
  the choice to the quote form. It is not a quote and says so ("Estimated starting price. Final scope and price are
  confirmed in writing."). Names and prices come from `data/services.ts` (`estimable`); the sum is done by
  `data/estimate.ts`: 2 services 10% off, 3 or more 15% off, or a preset bundle at its bundle price, whichever is
  lower, never both. Services that need a consultation first can be ticked but are never added into the total, and
  other companies' subscriptions are named as paid to them. Without JavaScript the list still shows every price and
  the button still opens the form with the ticked services. `tests/estimate.test.mjs` checks the arithmetic against
  the catalogue.
- **Phone quote bar (home page, under 720px):** one "Get a Free Quote" button fixed to the bottom of the screen. It
  shows only while the hero, the estimator, the final box and the footer are all off screen (an
  `IntersectionObserver`, no scroll listener), so it never sits over those sections' own buttons, and it has a close button; closing
  it is remembered for the visit in `sessionStorage` (`nuxy-quote-bar`). Without JavaScript it never appears.
- **LeadDemo:** an interactive phone-frame demo of the flagship. It runs in the page only and sends nothing.
- **DeviceShot / DemoSites:** screenshots of the demo websites in a phone or laptop frame, each marked as a demo.
  Each screenshot comes in several widths (`shotWidths` in `src/data/demo-sites.ts`, with `srcset` and `sizes`), so a
  phone downloads a small file. `scripts/example-shots.mjs` remakes them from the demo pages.
- **CaseStudy:** one real client project, from `src/data/case-studies.ts` (empty today). It renders nothing unless
  `publishable()` passes: the entry's `consent` records the client's written yes (who, when, to what) and four
  checks are each written down (the project is complete, permission covers publishing, the screenshots are
  approved, the details are accurate). A link to the live site needs a fifth, `checks.url`. Never in an entry: a
  street address or anything the client keeps private. Candidates and what each still lacks:
  `business/site-upgrade/case-study-candidates.md`. Fields: business, industry, location,
  the problem, the solution, what was built, screenshots, a before/after pair, results (each with the source of its
  number) and a quote (only the client's own words). Optional parts show only when filled in; nothing is ever made
  up. `tests/site.test.mjs` fails the build if an entry lacks consent, a result lacks its source, a picture lacks
  its description or size, or any page shows a client project that isn't in the file. Entries appear in the home
  page's `#portfolio` section and in their own section (`#clients`) above the examples on `/portfolio/`, whose note at
  the top then says the client projects are real and the examples made up, instead of "every business on this page
  is made up".
- **Icon:** Phosphor icons (regular weight), inlined as SVG so they take the text colour and cost no request.
  Decorative icons are hidden from screen readers.
- **Logo (`Logo.astro`):** the approved NUXY Automation logo as image files, made by `scripts/brand-assets.mjs`
  from the masters in `business/brand/logo/` (see its README). Never redrawn in CSS or SVG, never swapped for an
  icon. `full`: symbol, NUXY and AUTOMATION on a clear background, in the header (179px wide, 44px tall; 163px
  under 560px) and the footer (228px). `dark`: the same with the tagline "INTELLIGENCE IN MOTION" on its own
  #080D17, used once, above the closing section of `/about/`, where the page colour is the same so no edge shows.
  `icon`: the N symbol alone, for the browser tab and app icons. Dark surfaces only: on white the silver letters
  nearly disappear and no light version exists. The old vector mark (`Mark.astro`, `favicon.svg`) is retired.
- **Share picture:** `public/og.jpg` (1200x630), made by `scripts/og-image.mjs` from the dark logo, the home
  headline, the brand colours and Inter. Remake it when the headline changes, and look at it before committing.
- **Small posters:** `public/media/demo-*-s.webp` are smaller copies of the demo posters for the places that show
  them as small cards, so a phone doesn't download a full-size poster for a card.

All prices, services and plans come from `src/data/services.ts`; components never type a Nuxy price.

## Motion

Motion explains what the business gets; it never decorates for its own sake. Tokens live in
`src/styles/motion.css`: `--dur-1` 160ms (hovers), `--dur-2` 240ms (a demo step, a panel), `--dur-3` 380ms (a chosen
part coming forward), `--dur-4` 520ms (section reveals, the hero's camera move); easing `--ease-out`
`cubic-bezier(0.16, 1, 0.3, 1)`, `--ease-io` for paths that go and return.

- **Four levels** (`src/scripts/motion.ts`), set on `<html data-motion>`: `reduced` (nothing moves), `light` (short
  state changes only), `standard` (adds the hero's slow ambient loops), `enhanced` (adds the hero's travelling
  pulses). With no choice made, the device suggests one: save-data, a slow connection, little memory, few cores or a
  dropped-frame check give `light`; `enhanced` needs a mouse, a 1280px+ screen, 8+ cores and 8+ GB reported.
- **Only `Base.astro` imports `motion.ts`.** Components read `<html data-motion>` and listen for the `nuxy:motion`
  event instead. Importing it anywhere else splits it into a shared file that every page fetches in a second step
  (measured: +150 ms LCP on slow 4G).
- **The visitor decides.** The footer's Motion choice (Reduced / Standard / Enhanced) is kept in `localStorage`
  (`nuxy-motion`); if storage is off the site simply forgets it.
- **Reduced motion always wins.** `prefers-reduced-motion: reduce` forces `reduced`; the footer then locks the other
  two choices and says why. The global rule at the end of `Base.astro` still cuts any animation to an instant change.
- **Nothing runs forever.** Ambient loops (`html[data-ambient]`) run only while the hero is on screen, the tab is
  visible and less than a minute has passed since the last interaction; then they pause. The demos advance only after
  Play, stop at their last step, and pause when the tab is hidden or the demo leaves the screen.
- **No network, no cost.** No motion code fetches anything, calls an API or uses a provider. The demos are scripted
  and say "Simulated demo … No call is placed, no message is sent and nothing is booked."
- **Works without JavaScript.** The hero's parts, the demo tabs and the goal picker are radio buttons switched by CSS
  `:has()`; without `:has()` every panel shows in a list. The demo player alone needs JavaScript and stays hidden
  without it (the whole example then shows).
- **The demo player under 900px** (one column, the cards below the buttons): the cards sit in a window under half the
  screen tall (`.ap-demo.ready .ap-feed`, `min(46svh, 26rem)`) that the player scrolls to the newest card, so the play
  is seen without scrolling the page. The window keeps its height, so nothing below it moves. Pressing Start, Next or
  a step brings the window on screen once, only as far as needed; the clock never scrolls the page. Before the first
  step the window is empty and doesn't scroll; once it has cards it is a keyboard stop so keys can scroll it. From
  900px the cards sit beside the buttons in full, as before. `tests/pages.test.mjs` checks every step at two phone
  sizes, with and without reduced motion.
- **Section reveals** fade up once as they enter the screen, only for sections that start below the first screen.
- **The /solutions/ filter** glides the cards to their new places with a view transition, started only when motion is
  on.
- **Cinematic loops** (`CinematicLoop.astro`, `src/scripts/cinematic.ts`, files listed in
  `src/data/cinematic-manifest.json`). A loop is silent decoration, hidden from screen readers, with nothing a
  visitor needs inside it. On `reduced` and `light` motion, with a data saver, or without JavaScript, only the
  poster image is shown and the video file is never requested. Otherwise the video is fetched after the page has
  loaded, one loop at a time, and only the most visible loop plays; none plays behind an open video player. As a
  hero backdrop the footage is capped to a dim slate (the page colour under the headline) and fades out at its
  edges, so every text keeps at least 4.5:1 even over a pure white frame (`tests/cinematic.test.mjs` measures
  it). A loop that is not in the manifest renders nothing: no box, no script. Files are made by
  `scripts/encode-cinematic.mjs` from masters; generating footage is the owner's private, approved step and
  nothing on the site can start it.
- **Creative Studio demos** (`CreativeGallery.astro`): nothing plays until the visitor presses play, one player at
  a time, each labelled a fictional concept demonstration. The gallery is all three demos or none. `VideoTeasers.astro` shows the same three posters, each with that label, under the home page's four service cards and on `/portfolio/`: plain links to the gallery, lazy-loaded pictures, no video file requested, no price, and nothing at all unless all three demos exist.
- **The three-levels café** (`ThreeLevels.astro`): one made-up café drawn as a Business, a Signature and an
  Immersive site, switched by three radio buttons and CSS (works without JavaScript). The Signature and Immersive
  versions fade their parts in on switching unless motion is reduced; the Immersive loop runs only with
  `html[data-ambient]`, while the drawing is on screen and the tab is visible (the script sets `.run`).
- **Halvane 3D** (`src/lib/halvane/scene.ts`, Three.js): loaded as its own file (about 131 KB gzip) only after the
  page has loaded, never with reduced motion or save-data, and only when WebGL works; otherwise the page keeps its
  SVG drawing, which is complete on its own. Pixel ratio `Math.min(devicePixelRatio, 1.5)`, drawing paused while
  off screen or in a hidden tab, and `dispose()` frees every geometry, material, texture and the renderer (then
  forces a context loss). Switching reduced motion on stops and frees the scene. The scene is built in short steps
  that yield to the page, its shaders compile asynchronously before the first frame, and changing the finish swaps
  colours only (no shader rebuild), so no task blocks a tap for long. No reflection map on any device: three's
  reflection blur held the page for about 0.4 s on a Windows desktop and the lights alone give the same look.
  `tests/levels.test.mjs` checks it.
- **Prices are never typed into motion components.** The hero panels and the goal picker read names and prices from
  `data/services.ts`, skip any id that isn't in the catalogue, and the goal picker is a fixed list per goal, not AI.
- Analytics: a demo counts `demo_start` and `demo_complete` at most once each per demo per page view; the goal picker's buttons are
  `cta_selector` and `service_details`.

## Analytics hooks

Clicks on elements with `data-track="<event>"` (and on email links) are counted anonymously: an event name and the
page path, sent to Nuxy's own server, counted per day. No cookies, no IP address stored, never anything typed into a
form, and nothing at all when the browser sends Do Not Track or Global Privacy Control, or when the page is not on
the real address (local previews, tests and copies count nothing). Name new events in
`snake_case`, for example `cta_hero`, `service_ask`, `example_open`. The privacy section of `/policies/` lists what
is counted.

Buttons counted since the conversion upgrade: `cta_header` and `cta_menu` (the header and phone-menu quote
buttons), `cta_hero`, `cta_services`, `cta_home_security`, `cta_portfolio`,
`cta_pricing_preview`, `cta_tiers_quote`, `cta_final`, `cta_sticky` (home page), `cta_estimator` and
`estimator_use` (the estimator: the button, and the first tick per page view), `cta_portfolio_quote` and
`portfolio_demos` (`/portfolio/`). None carries what was ticked, typed or chosen: the estimator's choices travel
only in the address of the quote form, in the visitor's own browser. `tests/pages.test.mjs` checks that.

Counted since the Creative Studio brief: `cta_creative_quote`, `cta_creative_estimate`, `cta_creative_package`,
`cta_creative_portfolio` (the page's buttons), `cta_creative_video_ads`, `cta_creative_motion_graphics` and
`cta_creative_product_showcases` (the quote button under each kind of video work), `cta_creative_estimator` (the
estimator's button), `creative_demo_play` and `cta_creative_similar` (the demo gallery), `cta_video_upsell` (the
video block on `/websites/` and `/automation/`), `cta_home_creative` (the home page's line about video work), `cta_video_teasers` and `video_teaser_card` (the strip of three demo posters under the home page's service cards and on `/portfolio/`: its button and its cards).
Counted since the site improvement brief (2026-11): `cta_explore_work` (the hero's second button, which replaced
`cta_see_working`), `cta_cat_websites` and `cta_cat_automation` (the two service categories), `cta_levels_compare`
(the website levels strip), `cta_handover` (the home page's handover section), `cta_final_callback` (the callback
link in the final box), `cta_handover_quote`, `cta_handover_levels`, `cta_handover_care`, `cta_handover_final` and
`cta_handover_callback` (the buttons of `/handover/`), `callback_started` (the first field of the callback form
is touched; once per page view) and `callback_completed` (sent only after the inquiry service has confirmed that it
stored the request: a button press is never counted as a lead). None carries a name, a number or anything typed.
A client project page counts `case_study_walkthrough` (its Watch the Walkthrough button), `cta_case_quote` and
`cta_case_quote_end` (its two quote buttons), `cta_case_levels` (the website levels link), `case_study_contents` (Back to the sections) and
`cta_case_portfolio`;
the card counts `case_study_open` and `case_study_open_cover`.
`case_study_live` is the “Visit the live website” button of a client case study (`CaseStudy.astro`). It exists
only when a client entry passes `publishable()` and the client agreed to a link (`checks.url`); with no client
entries today it is on no page.
Counted since the website levels brief: `tier_viewed` (a level page opens; once per page view),
`tier_selected` (a level's button, the finder's "Discuss My Project" and the portfolio's custom-project link),
`tier_comparison_opened` (the first tab change in the comparison), `website_recommender_started` (the finder's
first answer) and `website_recommender_completed` (a result shown), `portfolio_tier_filter` (each change of the
portfolio's level filter), `immersive_demo_opened` (the Halvane card on `/immersive-websites/`), `contact_started`
(the form's first answer) and `contact_completed` (the form sent). None says which level, answer or filter was
chosen: the level travels only in the form's address (`/contact/?level=…`). `tests/levels.test.mjs` checks each
fires and what it carries.

The same rule holds: an event name and the page, never a choice or a price. The counting service drops any name
that is not lowercase letters, digits and underscores, 32 at most, without an error: `tests/creative.test.mjs`
checks every `data-track` in the build against that.

## Anchors and old links

The site used to be one long page. Old links like `/#lead-follow-up` or `/#request` still work: the home page maps
the old anchor to its new place.

- Every service id goes to `/solutions/#<id>`; ids of services that were merged go to their group,
  `/solutions/#<group>`.
- Every monthly plan id goes to `/pricing/#<id>`.
- `#request` goes to `/contact/`, `#services` and `#kinds` to `/solutions/`, `#plans` and `#faq` to the pricing page,
  `#work` to `/demos/#technical`, `#keep` to `/about/#how-we-work`.
- Home page sections renamed or moved in the conversion upgrade (2026-11): `#what-we-build` goes to `/#what-we-do`,
  `#why` to `/#why-nuxy`, `#ownership` to `/websites/#ownership`. When a home page section id changes, add the old
  one to `legacy` in `Base.astro`; `tests/site.test.mjs` checks every entry lands on an id that exists.

Service ids are permanent: never reuse or rename one, because outreach emails and old links point at them.
