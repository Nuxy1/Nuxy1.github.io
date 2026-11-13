# Nuxy Automation website: improvement audit

Written 2026-11-13 for the brief "Complete website improvement & conversion upgrade".
Branch `site-improvement-2026-11` in the worktree `C:\Users\power\Freelance-improve`. Starting point: the live site
(site `b8d7a96`, master `93b3e44`), kept as the local tag `baseline-site-improvement-2026-11-13`.

**Nothing in this document is deployed, pushed or committed.** Every change is a local edit waiting for the owner's
review. Decisions the owner has to make are numbered in `business/site-upgrade/approvals.md` (items 64 to 93) and
are referred to here as "approvals NN".

This folder (`portfolio/site/docs/`) is not part of the built site. The public `/docs/` pages come from
`src/pages/docs/`.

## 1. What was looked at, and how

- The live site: a header-only request (it is served through Cloudflare, Brotli-compressed) and the five addresses
  the brief names. `/web-design/` exists and is kept.
- The source in `portfolio/site`: every page, component and data file, `PRODUCT.md`, `DESIGN.md`, the tests, and the
  business documents the site is written from (`business/offer.md`, `business/audit-2026-11-05.md`,
  `business/site-upgrade/*`).
- A build of the starting point (63 pages plus the 404) and a build of this branch (64 pages plus the 404; the new
  one is `/handover/`), compared by script: every title, description, heading, structured-data block, internal link
  and anchor, every price shown, page weight and element count.
- Lighthouse (mobile, simulated slow phone) on the home page and five others, before and after.
- Screenshots at 390 px and 1440 px, forms filled in a real browser against a throwaway copy of the inquiry
  service. No real inquiry was sent and no email left this computer.

Not done, and why: no load was put on the live server, no live form was submitted, and the advertised services
were not re-delivered to prove them (section 12 reports their status from the business documents, with dates).

## 2. Source of truth for prices

Prices live in two files and nowhere else: `src/data/tiers.ts` (the four website levels) and `src/data/services.ts`
(every other service, the bundles and the monthly plans). Pages read from them. The reference points in the brief
match the catalogue exactly:

| What | Brief's reference | Catalogue | Same |
|---|---|---|---|
| Business, one page | $499 | $499 | yes |
| Business, up to 4 pages | $900 | $900 | yes |
| Signature | from $3,500 | from $3,500 | yes |
| Immersive | starting at $6,000 | starting at $6,000 | yes |
| Flagship | custom, around $12,000 or more | custom quote, "usually from about $12,000" | yes |
| Website Care | $79/month | $79/month | yes |

**No price was changed.** A script compared every dollar figure on every page before and after: identical. A new
test (`tests/pricing.test.mjs`) now fails the build if a page shows a price for a level or plan that differs from
the catalogue.

## 3. Existing strengths (kept)

- Real prices in writing on every service, with what is included and what is not.
- Honest labels: example sites say they are for made-up businesses; four services say "Available after
  consultation" instead of pretending to be ready; no reviews, logos or numbers are invented.
- Written policies in plain words (`/policies/`): deposit, refund, the 30-day launch watch, who owns what.
- A working, tested inquiry form on Nuxy's own server, with consent that is never assumed, a 365-day deletion rule
  and no cookies, trackers or advertising scripts.
- Fast pages: Lighthouse mobile 99 to 100 before this work, self-hosted font, no third-party script.
- A strict Content-Security-Policy, and accessibility, best-practices and SEO scores of 100.
- A test suite that checks copy rules (no fabricated claims, demo labels present), prices and the form end to end.

## 4. The seventeen audit points

| # | Point | Found at the start | On this branch |
|---|---|---|---|
| 1 | Visual consistency | One navy theme, consistent, but the old vector mark did not match the owner's chosen metallic logo; form-control edges were decoration-weight | Owner's palette in the central tokens, the approved logo as image files in header, footer and icons, one restrained glow. Section 10 |
| 2 | Typography and spacing | Inter throughout, sound scale. Home headline was three stacked sentences | Unchanged scale. Home headline shortened (approvals 71) |
| 3 | Responsive layouts | Sound at 390 and 1440 px | Checked again at both widths on the pages the briefs name; header logo 163 px wide under 560 px |
| 4 | Navigation | Six service links, the four website levels hard to find from the home page | Services menu of eight links, levels shown on the home page, every specialised service still reachable |
| 5 | Call-to-action placement | Several different labels for the same action ("Get My Free Automation Plan" on pages that were not about automation) | One main label, "Get a Free Quote"; a page that sells one thing may name it; second action "Request a callback". Section 7 |
| 6 | Pricing consistency | Site consistent with itself. Two internal documents stale. Section 5 | Site unchanged; a test guards it; stale documents marked |
| 7 | Duplicate or contradictory text | `/policies/` says "I", the rest says "we" (already approvals 7). Handover steps existed only on `/websites/` | Handover steps now come from one data file; "I"/"we" left for the owner |
| 8 | Claims and guarantees | The word "guarantee" appears on no real page. Operational promises listed in section 11 | Nothing removed; each promise is put to the owner (approvals 66 to 70) |
| 9 | Portfolio | Example work and experiments mixed under one heading | Three kinds kept apart: client projects (none yet, section hidden), concept demonstrations, interactive experiments |
| 10 | Accessibility | Lighthouse 100. Input outlines under 3:1 | Field and chosen-card edges now 3:1 or better; contrast of every text token measured (section 10); reduced motion respected |
| 11 | Performance | Home 99, others 100 | Others 99 to 100; home 87 to 99 across runs, the low ones measured while the PC was busy. Section 8 |
| 12 | SEO | Five titles over 60 characters; six main pages without structured data; 5 broken in-page links from `/work/*` | Titles shortened, structured data added, the 5 links fixed. Section 9 |
| 13 | Contact and lead collection | One form, works. No phone-first path | Callback request form added (approvals 65). Not live until the server is deployed first |
| 14 | Security and privacy | Strict CSP as a meta tag; privacy text accurate | CSP still allows only the site and its own server. Privacy text extended for callbacks. CSP could now be sent as a header (approvals 81) |
| 15 | Mobile usability | Sound | Callback and quote forms checked at 390 px. Buttons and form controls are 44 px or taller. The one-line links in the `/pricing/` price tables and custom-project headings (40) and the heading links on `/portfolio/` (4) were 19 to 21 px tall; each now has an invisible tap layer about 40 px tall that moves nothing (tested at 390 and 1440 px: every tap 8 px above and below lands on its link, none covers another control). The links still 19 px tall all sit inside sentences, which WCAG 2.5.8 exempts. 30 home-page controls are 24 to 43 px tall: above the 24 px AA minimum, below the 44 px ideal. Jump links put their section 16 to 32 px under the sticky header. With the phone quote bar showing, no control that has keyboard focus is covered by the bar or the header (home, handover, pricing and contact tabbed through at 390 px). Taps have no double-tap wait (`touch-action: manipulation`); pinch zoom still works. The two forms on `/contact/` each carry an accessible name taken from their heading (`aria-labelledby`), so a screen reader's form list tells them apart |
| 16 | Dead links, unfinished features | 12 in-page links without a target: 5 real (from `/work/*`), 7 in the example sites | The 5 fixed. The 7 are intended: demo buttons marked `data-demo-action` that explain what a real site would do. No unfinished feature is public: the client portal is behind `handoverPortal = false` and a test |
| 17 | Status of advertised services | Section 12 | No page claims more than the business documents support |

## 5. Pricing

- **The site is consistent.** One catalogue, read by every page.
- **Stale internal documents.** `business/site-upgrade/proposals.md` sections 2 and 3 (2026-11-09) and approvals
  item 54 ("$100 Care plan") were written before the catalogue that went live on 2026-11-11. They are now marked as
  superseded so nobody quotes from them. They were never public.
- **Level names.** The brief's names are used with the catalogue's scope: "Business: Built to Convert", "Signature:
  Built to Stand Out", "Immersive: Built to Be Remembered", "Flagship: Bespoke Digital Experiences". The home page
  and `/websites/` say that advanced animation and 3D belong to the higher levels and are not part of Business.
- **Not proposed:** no new price, discount, guarantee or "unlimited" anything.

## 6. Confusing journeys

| Problem at the start | Change |
|---|---|
| A visitor who wants a website had to read past automation demos to find the levels | Home order: hero, what we do (two categories), the four levels, example work, then the automation demos and tools |
| "What happens after I pay, and who owns the site?" was answered only deep in `/websites/` | A short handover summary on the home page and a full page, `/handover/`, written for someone who has never owned a website (approvals 64) |
| Someone who would rather talk had only a form asking for a written brief | "Request a callback": six short fields. It says plainly that it is a request, not an appointment, and shows no times |
| Portfolio visitors could not tell real client work from examples | Three labelled kinds. The client section stays hidden until a project passes every check |
| Automation buttons on non-automation pages | "Get My Free Automation Plan" is now only on `/automation/` |

Still open: no online scheduler. `calUrl` in `src/data/site.ts` is empty, so no booking page is offered and no
times are shown. Building one needs a calendar provider the owner chooses (approvals 78).

## 7. Trust and conversion

Missing at the start, and what was done without inventing anything:

- **Who is behind it.** `/about/` keeps its facts; the logo with its tagline now closes the page. No team, office
  or certification was invented. A founder photo or name beyond what is published is the owner's choice.
- **Proof.** There are no client reviews or results yet (`PRODUCT.md`), so none are shown. Credibility comes from
  the example work, the open-source automations, the written policies and the handover explanation.
- **Real client work.** A reusable case-study structure exists (`src/data/case-studies.ts`) and is empty. An entry
  reaches a page only with the client's written consent and four written checks. Candidates and what each lacks:
  `business/site-upgrade/case-study-candidates.md`. CHRYS is not deployed and has no written permission; its
  address is never to appear. Piller Properties is a concept that carries a real company's name (approvals 74).
- **Ownership.** `/handover/` separates the two arrangements (a site handed over into the client's own accounts;
  the optional monthly plan on top) and says the plan and the contract decide who owns, hosts and pays for what.
- **Counting leads.** A request is counted only after the server confirms it was stored. A button press is never
  counted as a lead. No tracking pixel or third-party analytics was added.

## 8. Performance

Lighthouse, mobile, simulated slow 4G, same machine:

| Page | Before | After |
|---|---|---|
| `/` | 99 (LCP 1.9 s, 357 KB) | Seven runs on the final build: 99, 99, 98, 98, 90, 90, 87 (LCP 2.1 to 2.2 s, 409 KB). Total blocking 0 ms in the four high runs, 350 to 450 ms in the three low ones. An earlier build scored 99, 94 and 92 |
| `/contact/` | 100 | 100 |
| `/portfolio/` | 100 | 100 |
| `/pricing/` | 100 | 100 |
| `/websites/` | 100 | 99 |
| `/handover/` | new | 100 |

- The home page is heavier because it now carries two more sections: HTML 227 KB to 238 KB, 2,603 to 2,691
  elements, stylesheets 69 KB to 76 KB (four files to five). The logo is a 240 to 800 px WebP chosen by the
  browser; small copies of the demo posters were added so a phone does not download a full-size poster for a card.
- One slow task was removed: the demo strip measured its layout before anyone pressed it (about 220 ms on a
  phone). It now measures on first use.
- The run-to-run spread on the home page (87 to 99) is main-thread time while a long page lays out, and it widens
  when the PC is busy: another session's test suites were running during the final measurement (processor at 55%).
  To rule out the newest CSS rule (bottom scroll room for the phone quote bar), the same build was measured with
  and without it, runs alternating: 98, 99 and 98 with the rule, 99, 86 and 84 without. The rule is not the cause
  and stays. A figure taken on an idle PC is still owed before deploy (approvals 82). A tested fix,
  `content-visibility` on the lower sections, was **not shipped**: it needs the reveal script
  (`src/scripts/motion.ts`) rewritten first (approvals 82).
- No video hero and no 3D were added.

## 9. Search engines

| Item | Before | After |
|---|---|---|
| Home title | 74 characters | "Nuxy Automation · Websites, Automation & Website Care" |
| Titles over 60 characters | `/`, `/automation/`, `/creative-studio/`, `/ecommerce/`, `/website-security/` | Two left: `/work/booking-reminders/` (63) and `/work/invoice-reminders/` (68). Only the brand name at the end is cut; the word "Example" has to stay |
| Structured data | None on `/contact/`, `/creative-studio/`, `/demos/`, `/get-a-website/`, `/policies/`, `/website-security/` | Added to all six, plus `/about/`, `/handover/` and `/portfolio/` (whose entries are named "concept project") |
| In-page links without a target | 12 | 7, all intended demo buttons |
| `noindex` | 404 and `/contact/thanks/` | Same, as intended |

No structured data claims a review, a rating, an address that is not published, or a client.

## 10. Design

- **Palette (brief 2).** The central tokens now carry the owner's colours: Obsidian #080D17, Midnight Navy
  #101B2D, Titanium Slate #19273C, Electric Blue #2563EB, Ice Cyan #43C7FA, Platinum White #E8EEF6, Muted Silver
  #A5B4C8, borders #263A54. Roughly three quarters dark, a fifth neutral, a few percent blue or cyan.
- **Contrast, measured.** On the lightest layer text sits on: headings 11.24:1, paragraphs 8.58:1, supporting text
  6.23:1, links 6.09:1. White on the button 5.17:1 (6.70:1 hovered). Focus ring 10.78:1 on the page background and 8.34:1 on cards. Form-control
  edges 3:1 or better where fields sit. All pass WCAG AA.
- **One glow.** A thin blue edge and soft shadow on a filled button while hovered and on the one featured plan.
  Nowhere else.
- **Logo (brief 3).** The owner's image, cleaned and separated, in the header, the footer, the icons, `/about/`
  and the share picture. Never redrawn in CSS or SVG. What could not be kept (the two corner arcs, a light-background
  version, a vector file) is written in `business/brand/logo/README.md` (approvals 72 and 73).
- **Layout.** Not changed beyond the new sections and the home order.
- **Type.** The home headline follows the hero size in `DESIGN.md` to the letter: 36 px in two lines on a phone,
  one line from about 600 to 960 px, 60 px in two lines on a wide screen; no sideways scroll and no console error
  at nine widths from 320 to 1440 px. Three sub-headings on the home and handover pages were set in Title Case to
  match their neighbours. Pages still differ from each other in heading case (approvals 85).
- **Design detector (Impeccable, run on the seven changed layout and page files).** 52 findings now, 56 on the
  same files at the start tag. The palette work cleared all 17 colour and font findings. What is left: 46 font
  sizes and 5 corner radii that are not on `DESIGN.md`'s short lists, and one left border that is an ordinary
  quotation rule (a false alarm, also in the start tag). The new sections account for 13 of them, each a size or
  radius the site already used. `DESIGN.md` names seven type roles and the site uses about 17 sizes: that gap is
  older than this work, so it is put to the owner (approvals 86) and `DESIGN.md` was not rewritten here.
  A second, independent run by a separate agent on eleven files (these seven plus the websites and automation
  pages, the quote form and the thanks page) found the same 52 here and 22 more of the same kinds there. Its one
  colour finding was fixed: the quote form's error text now uses the `bad` token, as the callback form does
  (contrast 5.4 to 1 on a card). The home page's closing box has a 24 px corner where `DESIGN.md` gives panels
  18 px; that is in the start tag too and sits with approvals 86.
- **Design review by two separate agents (Impeccable critique, 2026-11-13).** One agent ran the detector and a
  browser pass, the other reviewed the design from the pictures and the source. Score 25 of 36 on the ten
  usability rules (consistency and minimalism lowest, at 2 of 4). Each claim was checked in the browser before
  anything changed. Fixed: the Start Demo button showed a play and a pause icon together (an older CSS order
  fault); both comparison tables were cut off on phones and now stack into labelled rows below their own width
  (520 and 680 px); the "Request a proposal" links on pricing have a 44 px tap area; the smallest label on a
  phone went from 11 to 12 px; the unselected parts of the hero picker are dimmed to 78% instead of 62%. Two
  labels on pricing were reworded, with no change of meaning: the heading "Want it looked after after launch?"
  now ends "once it's live?", and the plan badge "Recommended for several automations", which wrapped over
  the card edge, now reads "For several automations". Not changed, by design: the stacked outlines on the
  Immersive card, the hero price links (30 px, above the 24 px minimum) and the estimator's "quoted
  separately" rows. The larger points (page length, the ten-choice quote form, the demo at rest, naming,
  buttons, generic lines) are choices for the owner: approvals 87 to 93. After the fixes: 64 routes at two
  widths with no sideways scroll, 0 accessibility-scan violations on 8 pages, tests unchanged (161 pass, 9
  skipped, 24 comparison pictures waiting for approvals 84). A detector run on the five edited files adds no new
  kind of finding; it does list two one-off tints in the hero picker (a pale cyan dot and a deep blue fill) that
  were literal colours at the start tag and were retuned to the new palette; they belong with approvals 86.

## 11. Operational promises

The brief asks that each promise be checked against what actually runs, and that none be removed silently. None
was removed or reworded. Each is set out for the owner in approvals 66 to 70:

| Promise on the site | What backs it today | Gap |
|---|---|---|
| "Within one business day you'll hear back" (quote and contact requests) | The request is stored and a notice is emailed to the Nuxy inbox | Nothing measures it and nothing watches the server (`02-roles-and-operations.md`: "Nothing watches the server yet", approvals 3). It rests on the inbox being read every business day |
| "Website checked every 5 minutes, 24/7" (Website Care) | The procedure sets up an uptime check in the client's own name | No care client yet, so it has never run for one. "24/7" is the check, not a person: the pricing page says so, and it should stay beside the claim |
| 30-day launch watch, written check-ins on day 3 and day 14, anything the work breaks fixed free | Written in `/policies/`; alerts come from the same uptime check or the automation's failure alert | The two check-ins need a reminder each time; the business audit of 2026-11-05 lists the heartbeat monitor as "when the first care-plan client signs" |
| First reply within 2 business days / 1 business day / same business day (plans) | The plan terms | One person. No cover is described for illness or time away |
| "Your automation team, on call" (Automation Partner's one-line description) | The plan's own term is "work starts the same business day" | "Team" and "on call" promise more than the term beside them |
| "We never ask for your passwords"; every account in the client's name and on the client's card | The ownership procedure (`04-website-ownership-procedures.md`) | None found |
| Security work | `/website-security/` claims no certification and no guarantee; a test enforces that | None found |
| Speed | "We aim for Google's Core Web Vitals targets on every level" | An aim, not a guarantee. Supported by this site's own scores; no client measurement exists yet |

No uptime percentage, sales result or guarantee is claimed on any real page.

## 12. Status of advertised services

From the business documents, not re-tested in this work:

- `business/audit-2026-11-05.md`: "Delivery capacity: Unproven. No job delivered yet. Demos prove the logic, not
  real integrations." Revenue $0 at that date.
- `business/offer.md` marks four services "Available after consultation: never pitched as ready": AI Voice
  Receptionist, Lead qualification & booking, Cold outreach automation, Full business CRM system. The built site
  shows that label wherever they appear (`/`, `/automation/`, `/pricing/`, `/solutions/`).
- The other services are offered at fixed prices with a working demonstration or example. A demonstration is not
  a delivered client job, and the site does not say it is.
- The **client handover platform** is a draft in the Command Center (`docs/CLIENT-HANDOVER.md` there, 2026-11-13:
  not committed, no customer accounts, Stripe in test mode). The public site says nothing about a portal, a login or
  onboarding. The flag `handoverPortal` in `src/data/site.ts` is `false`, and a test fails the build if a page
  mentions a client portal while it is.

## 13. Proposed improvements and where each stands

**Implemented and tested (local, waiting for review)**

- Central price check (`tests/pricing.test.mjs`); prices unchanged.
- Home page order, headline, two service categories, the four levels, handover summary, short FAQ.
- `/handover/` page; handover content in one data file.
- Portfolio in three kinds; gated case-study structure, empty.
- Owner's palette, logo files, icons, share picture.
- Button wording, titles, structured data, the five fixed links.
- Form-control contrast; demo-strip performance fix; small posters.
- Callback form and its server path, with tests on a throwaway store.

**Implemented but not configured**

- Callback requests: the live inquiry service does not know the new path. The service must be deployed first, then
  the site (approvals 49 and 65). Until then the live server would refuse every callback.
- Client case studies: the template works; no entry exists.
- CSP as a response header: possible now that Cloudflare is in front; not set up.

**Awaiting approval**

- Everything above, as a deploy. Approvals 64 to 86.

**Not implemented**

- Online scheduler (no calendar provider chosen).
- Client portal on the public site (not built; behind a flag).
- A link from the lead store to the Command Center (planned there, approvals 39 and 63; requests are not duplicated
  today because there is one store).
- `content-visibility` on the home page.
- A light-background or vector logo.

## 14. Risks to existing functionality

| Risk | How it is held |
|---|---|
| Deploying the site before the inquiry service breaks the callback form | Deploy order written in approvals 49 and 65, `DESIGN.md` and `PRODUCT.md`. The quote form is unaffected either way |
| The inquiry service change breaks ordinary inquiries | The existing end-to-end form test and the service's own tests still pass; callbacks are a separate path into the same store. No lead record is deleted or migrated |
| Old links | No address was removed. `/web-design/`, the old one-page anchors and their redirects are as before |
| Colour change lowers contrast somewhere unseen | Every token pair measured; pages named in the brief checked at two widths. The visual baselines (24 pictures) fail until they are re-recorded, which is done only after the owner has looked |
| The logo on a light surface | The files are for dark surfaces only; the site has none light. Written in the logo README |
| New public text reads as a contract change | `/handover/` restates `/policies/` and the plan terms and adds none; it still needs the owner's yes (approvals 64) |
| Production data | Not touched. No database, billing setting, lead record or server file was changed. Tests use throwaway stores |

## 15. Second pass: approvals 87 to 93 (built 2026-11-13 on the owner's instruction)

The owner wrote "do all the recomendations 87-93" after reading the two-reviewer critique. All seven are built on the
same branch. **Still nothing committed, pushed or deployed.** No price, policy text, consent wording or operational
promise was changed; the statements in sections 5 and 11 hold.

| Item | What changed | What was left, and why |
|---|---|---|
| 87 Home length | 27 phone screens and about 2,500 words became 21 screens and about 1,700; page elements 2,691 to 1,638. The goal picker lives on `/automation/`, the estimator on `/pricing/`; two link rows under the trade demos lead to them. The handover block is a summary with one link | How it works, why Nuxy and the questions stay: the brief's Phase 3 names them |
| 88 Quote form | Five answers shown (Website, Online store, Automation, Care plan, Something else or not sure yet). A link that names one of the other five shows it as a sixth | All ten ids are still accepted by the inquiry service. No stored lead is changed; leads with those five ids display the new label |
| 89 Demo at rest | The first step is filled in before Start is pressed | The other steps stay dashed until the demo runs |
| 90 One name | The brief's two names head the choice on `/handover/` and `/websites/`, the plain sentence under each. "Get a Free Quote" and "Request a callback" are the two asks | Labels pinned by approvals 77, `DESIGN.md` or the level tests, "Get This Setup", and labels inside the demo sites |
| 91 Levels, cards, menu | Menu says "Live Demos"; demo cards carry two links | Level names |
| 92 Solid buttons | Pricing bundles outlined; the goal picker keeps one solid button, on "Best fit" | Hero gap (208 px against the page's 224 px section rhythm); one solid pair 657 px apart on `/automation/` at 1440 px; one solid button for each `/portfolio/` row |
| 93 Generic lines | Closing heading: "A Fixed Price in Writing Within One Business Day" (the promise `/contact/` already makes). The portfolio leads with the concept-demonstration label | The hero line from the brief; the "Why Nuxy" grid |

**Fixed on sight during this pass:** a wrapped quote-form answer left one word alone (now balanced); with five answers
the last one sat alone in half a row (now spans the row); the two link rows under the demos ended on different lines
when one text wrapped, and their arrows sat at different heights (both fixed).

**Risk added by 88:** the five labels are written in the site (`src/data/services.ts`) and in the inquiry service
(`agent/upwork-inbox-drafter/src/inquiry.js`). They deploy together, service first (approvals 65, then 84).

**Checks after this pass (all on this PC, against the local build):**

- Site tests: 195 tests, 162 pass, 9 skipped, 24 fail. All 24 are the visual baselines, expected until approvals 84.
- Inquiry service tests: 145 of 145 pass.
- 64 routes at two widths: none overflows. axe: 0 violations on eight pages at 390 and 1440 px.
- Reduced motion: no running animation on `/`, `/handover/`, `/contact/`. Keyboard order and focus outlines checked.
- Lighthouse (mobile): `/` 99, `/contact/` 100, `/portfolio/` 100, `/pricing/` 100, `/websites/` 99, `/handover/` 100,
  `/automation/` 99; accessibility, best practices and search 100 on all seven.
- No console error and no request to an outside address on seven routes.

**`DESIGN.md` now differs from the site in three places (reported, not rewritten):** line 192 lists the goal picker
and the package estimator in the home page's order (they now live on `/automation/` and `/pricing/`, with two link
rows on the home page); line 251 says the estimator is "`#package` on the home page" (it is `/pricing/#package`); line
228 still names the service card's button "Ask about this" (it reads "Get a Free Quote"). The type-size and radius
gap in approvals 86 is unchanged.
