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
- Demo-brand fonts never cost a download: Halvane Audio uses the same self-hosted Inter in its own warm palette,
  and the Ostrel Coffee café inside ThreeLevels uses the system serif stack (`ui-serif, serif`) with `--mono`
  for small labels. No demo requests a font from another site.

## Typography

- **Inter** (variable, latin subset), self-hosted at `public/fonts/inter-var-latin.woff2` and preloaded, with a
  metric-matched "Inter Fallback" face so text doesn't jump when the font arrives. No font requests to other sites.
- Headings 650-700 weight with slight negative tracking; `text-wrap: balance` on headings.
- Body 16px / 1.6. Paragraphs stay under about 70 characters wide.
- Prices use tabular figures where they line up in tables.

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
| `/` | In this order: hero (what Nuxy does, two buttons, starting prices), the four main services, the automation demos, the goal picker, the package estimator, example work, the three ways to start, the five steps, why Nuxy, one final next step |
| `/websites/` | Website building: own-it-outright vs optional monthly care, what you own, ownership promises |
| `/get-a-website/` | Short landing page for businesses without a website; links to the demo websites |
| `/automation/` | Lead response and follow-up, missed-call text-back, review requests and the other automations |
| `/ecommerce/` | Online stores in the client's own Shopify or Square Online account, with the two published sizes |
| `/website-security/` | Free website health consultation, repairs at a fixed written price, and security assessments only with the owner's written authorization |
| `/web-design/` | The four website levels (Business, Signature, Immersive, Flagship): the level cards, the comparison tabs, the expectation matrix, the three-levels café, the five-question finder, add-ons, "Why does immersive cost more?", package boundaries, timelines and the levels FAQ |
| `/business-websites/`, `/signature-websites/`, `/immersive-websites/` | One page per level (`LevelPage.astro`): who it suits, what's included, what's not, timeline and revisions, add-ons, the other levels. There is no Flagship page: Flagship is a written scope, reached from `/contact/?level=flagship` |
| `/portfolio/` | "Our Work": the example websites and the online store, each for a made-up business and labelled so, on a computer and a phone |
| `/solutions/` | Every service, grouped, with search and filters (all services visible without JavaScript) |
| `/pricing/` | Published one-time prices, the monthly plans, bundle discount, FAQ |
| `/creative-studio/` | AI Creative & Video Advertising: three kinds of video work with starting prices, what every video includes, the starting-price estimator, the three fictional concept demos (only once all three exist as real files), limits and FAQ. **Its prices are proposed: publishing the page needs the owner's written yes** |
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
- **Header (`Base.astro`):** Services (a dropdown of six links, `details.drop[data-drop]`), Pricing, Demos, Our
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
- **PackageEstimator (`#package` on the home page):** tick services, see an estimated starting price, and carry
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
  the entry's `consent` records the client's written yes (who, when, to what). Fields: business, industry, location,
  the problem, the solution, what was built, screenshots, a before/after pair, results (each with the source of its
  number) and a quote (only the client's own words). Optional parts show only when filled in; nothing is ever made
  up. `tests/site.test.mjs` fails the build if an entry lacks consent, a result lacks its source, a picture lacks
  its description or size, or any page shows a client project that isn't in the file. Entries appear in the home
  page's `#portfolio` section and in their own section (`#clients`) above the examples on `/portfolio/`, whose note at
  the top then says the client projects are real and the examples made up, instead of "every business on this page
  is made up".
- **Icon:** Phosphor icons (regular weight), inlined as SVG so they take the text colour and cost no request.
  Decorative icons are hidden from screen readers.
- **Mark:** the Nuxy logo mark. Pass `label=""` where the words "Nuxy Automation" sit right beside it, so screen
  readers skip it; otherwise it is announced by its label.

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
buttons), `cta_hero`, `cta_see_working`, `cta_services`, `cta_home_security`, `cta_portfolio`,
`cta_pricing_preview`, `cta_tiers_quote`, `cta_final`, `cta_sticky` (home page), `cta_estimator` and
`estimator_use` (the estimator: the button, and the first tick per page view), `cta_portfolio_quote` and
`portfolio_demos` (`/portfolio/`). None carries what was ticked, typed or chosen: the estimator's choices travel
only in the address of the quote form, in the visitor's own browser. `tests/pages.test.mjs` checks that.

Counted since the Creative Studio brief: `cta_creative_quote`, `cta_creative_estimate`, `cta_creative_package`,
`cta_creative_portfolio` (the page's buttons), `cta_creative_video_ads`, `cta_creative_motion_graphics` and
`cta_creative_product_showcases` (the quote button under each kind of video work), `cta_creative_estimator` (the
estimator's button), `creative_demo_play` and `cta_creative_similar` (the demo gallery), `cta_video_upsell` (the
video block on `/websites/` and `/automation/`), `cta_home_creative` (the home page's line about video work), `cta_video_teasers` and `video_teaser_card` (the strip of three demo posters under the home page's service cards and on `/portfolio/`: its button and its cards).
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
