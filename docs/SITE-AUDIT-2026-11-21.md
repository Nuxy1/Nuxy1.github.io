# Site audit and redesign, 2026-11-21

**Nothing in this document is deployed, pushed or committed.** The work is unstaged edits in the worktree
`C:\Users\power\Freelance-redesign` (this folder, `portfolio/site`), branch `site-redesign-2026-11`, HEAD `5ec629f`, with
the peer branch `higgsfield-visuals-2026-11` merged and staged. Decisions for the owner: `business/site-upgrade/approvals.md`
rows 102 to 121. "Live" below means https://nuxyautomation.com/ as it was on 2026-11-21.

## How to review (L)

1. `npm run build` here, then serve `dist/` with any static server. During the audit session it was served at
   http://127.0.0.1:60354 (local only; it stops with that session).
2. Pages to start with: `/`, `/websites/`, `/get-a-website/`, `/ecommerce/`, `/portfolio/`, `/examples/quillfern-candles/`,
   `/contact/`, `/docs/small-business-automations/`.
3. Screenshots (outside the repo): `D:\Work\Business\Nuxy-Site-Redesign-2026-11\screenshots` (`before` = live,
   `after`, `critique-*`, `work`), Lighthouse reports in `..\lighthouse`.
4. Tests: each `tests/*.test.mjs` file run on its own against `dist/` (Playwright core and the Chromium build named in
   the test files' environment variables). Visual goldens are in `tests/visual/`; the ones that changed were compared
   with the old image and checked by eye before replacing.

## A. Routes (completed and verified)

67 built pages plus `404.html`:

| Group | Pages |
|---|---|
| Nuxy pages (24) | `/`, `/about/`, `/automation/`, `/business-websites/`, `/contact/`, `/contact/thanks/`, `/creative-studio/`, `/demo/`, `/demos/`, `/ecommerce/`, `/get-a-website/`, `/handover/`, `/immersive-websites/`, `/payment/cancelled/`, `/payment/thanks/`, `/policies/`, `/portfolio/`, `/portfolio/chrysfadezzz/`, `/pricing/`, `/signature-websites/`, `/solutions/`, `/web-design/`, `/websites/`, `/website-security/` |
| Example pages (5) | `/examples/{fernway-lawn, mossgate-cleaning, lantern-row-barbers, quillfern-candles, halvane-audio}/` |
| Docs (6) | `/docs/` and `code-steps`, `community-bot`, `csv-cleaner`, `small-business-automations`, `webhook-relay` |
| Open-source automations (4) | `/work/{booking-reminders, invoice-reminders, lead-follow-up, review-requests}/` |
| Example sites (28, `noindex`) | `/example-sites/…` for the five made-up businesses. Owned by a peer session; not edited here |

## B. The brief's 15 findings

| # | Finding | Status |
|---|---|---|
| 1 | Tier confusion: Signature examples linked to cheaper services | **Fixed.** The Signature candle shop's quote went to the $1,200 Online shop service; it now goes to its own level. Every example page states its level, price and what it is built in under the title. `/get-a-website/` shows only Business examples. The hero pictures say what the price beside them buys (a $900 site is built in your own Squarespace or Wix account; the `/ecommerce/` example is a Signature shop, from $3,500) |
| 2 | Homepage too long | **Fixed.** 18,573 px live → 12,496 px here at 390 wide (8,370 at 1440; round-4 captures). The FAQ and the concept-film block left the home page (the FAQ stays on `/pricing/` and the service pages, the films on `/creative-studio/` and `/portfolio/`); the demo cards became one compact strip after the client work |
| 3 | Portfolio visual quality | **Partly.** Client work first, a level filter with a live count, one name for the open-source work. The preview images of the example sites belong to the peer session that owns those sites (see E) |
| 4 | Chrysfadezzz launch status | **Checked, not changed.** The site is live (since 2026-11-13). The card's generic points and the booking-text line are client claims: approvals 104 and 105 |
| 5 | Video showcase names differ | **Resolved** with the merged `higgsfield-visuals-2026-11` films: one title per film on every page that shows it |
| 6 | Secure fixed-scope purchase path | **Investigated only.** Checkout stays behind `PUBLIC_BILLING_CHECKOUT`, off in this build; no page offers it. Approval 107 |
| 7 | Monitoring and response-time promises | **Checked, not changed.** They depend on checks set up per client: approval 106 |
| 8 | Starter repeated on `/websites/` | **Fixed.** The Starter paragraph appears once |
| 9 | Quote form conditional fields | **Verified in the browser, then fixed.** A third box ("Features you have in mind") asked again what the project box asks; removed. The build-or-management question hides, and is not sent, when the answer is a monthly plan. Its question now names "one-time setup" as its answer does |
| 10 | Pricing, directory and demos repeat each other | **Partly.** Demos are matched to the page's price; merging `/pricing/` and `/solutions/` changes two pages' scope: approval 109 |
| 11 | Portfolio should lead with real client work | **Fixed.** Chrysfadezzz first, then the made-up examples |
| 12 | Older docs use a different navigation | **Fixed.** Docs pages have the site's breadcrumb, a "Code on GitHub" link and a closing quote block |
| 13 | Ownership, handover, plans and quote process repeated | **Partly.** The home handover section stays (the strength the brief asks to keep); the rest is approval 109 |
| 14 | "I" vs "we" | **Partly.** "We" everywhere except `/policies/`, kept as "I" on purpose until the legal-status decision: approval 108 |
| 15 | Metadata, JSON-LD, indexation, sitemap, links, canonicals | **Fixed.** Breadcrumb JSON-LD on example, docs, demo and open-source pages (`src/lib/crumbs.ts`); example sites stay `noindex`; results in "Verification" |

## C. Changes by page

- **Home:** shorter (finding 2). Order: hero → what we do (with starting prices) → client work, then the concept strip
  → website levels → one automation demo → why Nuxy → handover → quote (pinned by `tests/pages.test.mjs`). In the levels
  block the quote is the one filled button and "Compare Website Levels" is secondary.
- **`/websites/`:** Starter said once; the hero shows Mossgate (so it differs from `/get-a-website/`) with a caption on
  what $900 buys; the hero film shows only from 1024 px (approval 119); the price line breaks only between prices. The
  "Two ways" head is left-aligned like the others, each way's icon sits in its heading line, and the last button reads
  "First Website? Start Here".
- **`/get-a-website/`:** title without a full stop, plainer lead, only Business examples, a link to the bigger levels,
  "Full Website Details" in Title Case like every other button.
- **`/ecommerce/`:** the example store says it is a Signature shop from $3,500 and that the $1,200 Online shop is a
  theme set up in your own Shopify or Square Online account.
- **`/examples/<slug>/`:** level, price and what it is built in under the title; quote goes to the right level; the
  made-up business's section is "Concept Walkthrough"; the preview frame no longer catches a phone's scroll (approval 110);
  Previous and Next walk the portfolio's order (by level), not the data file's.
- **`/portfolio/`:** client work first; level filter with "Showing N … examples" (a status message for screen readers);
  the Flagship line sits outside the button group; "Open-Source Automations". Each example's level chip carries the
  level's price, and the "Industry" row (which repeated the line above it) is gone. The Halvane previews show the 3D
  cabinet most visitors see.
- **`/contact/`:** under the lead, the two ways to start (write it down, or ask for a call back), then "What Happens
  Next" as three short steps, then the form, then the callback form; the callback is offered once. On a phone the two
  ways are in the first screen and the reassurance comes before the first field. "More details (optional)" is a section
  of the form, not a second box inside it. Form changes under finding 9.
- **Docs:** breadcrumb, code link, a 56ch reading measure (median 71 characters a line, none over 77), closing quote
  block; wide tables and code blocks scroll in a box you can reach by keyboard, with a soft edge on each side that has
  more to see; `scripts/sync-docs.mjs` no longer undoes the hand-cased headings.
- **Site-wide:** footer link "Open-source automations"; last two words of a line kept together (approval 120); FAQ lists
  keep the page's left edge and a 780px reading width.

Prices were not changed anywhere.

## Fix list (found during the work, all fixed)

1. Signature candle shop's quote button opened the $1,200 Online shop service.
2. The Quillfern preview frame caught a phone's scroll.
3. A docs sync undid the hand-cased headings.
4. `/websites/` hero film showed as a dark box behind the buttons on a phone.
5. `/contact/` on a phone: the callback came after the whole form and was offered twice.
6. Docs lines ran 90 to 99 characters at 1440.
7. Service names split at a hyphen ("follow- / up") at 390; a demo's kind split inside "Barber shop".
8. Single words left alone on the last line across the site.
9. Hero examples built at a higher level sat beside a lower price with nothing saying so (critique round 2).
10. "Interactive experiments" named the open-source automations, which are neither.
11. Portfolio filter: no count of what was showing; the Flagship line sat inside the button group.
12. The form's question said "one-time build", its answer "One-time setup".
13. `/get-a-website/` was the only one-sentence page title ending in a full stop.
14. A made-up business's section was called "The Case Study", the name used for client work.
15. Approval row 113 said the home page had no phone quote bar; it has one (row corrected, code unchanged).
16. Both Halvane previews showed the reduced-motion fallback drawing and an old banner, not the 3D cabinet most visitors
    see (`scripts/example-shots.mjs` now captures that one demo with motion on; all five previews re-checked against
    their real pages).
17. "More details" in the quote form was a bordered box inside the form's box (critique round 3).
18. Docs text at 64ch still ran a median of 81 characters a line (Inter's wide "0" makes ch overstate the measure);
    `VideoUpsell` text at 70ch ran 90. Now 56ch and 60ch.
19. The `/websites/` "two ways" panels stacked a tinted icon tile above each heading, a template tell.
20. `/contact/` on a phone: "What Happens Next" came after both forms (critique round 3, P1).
21. The home levels block had "Compare Website Levels" filled and the quote secondary, unlike every other section.
22. Example pages' Previous and Next followed the data file's order, so Quillfern's Previous was not its neighbour on
    `/portfolio/`.
23. `/websites/`: the only centred section head on the page, the FAQ indented about 170px from the headings above it,
    and a last button phrased as a question ("No website yet?").
24. Portfolio example cards showed the add-ons but not the level's price; the "Industry" row repeated the line above.
25. Docs code blocks on a phone cut the text at the right edge with nothing saying they scroll (cue added in round 3,
    made stronger in round 4).
26. The critique capture script scrolled too fast, so every scroll-reveal section was captured as an empty band
    (`scripts/shots.mjs` in the redesign folder now scrolls 300px every 250ms; tooling only, not the site).
27. `PRODUCT.md` and `docs/design-brief-2026-11.md` still described the older home order.

Critique rounds 4 and 5:

28. `/examples/quillfern-candles/` showed five price figures and no single answer to "what does a store like this
    cost". The level price is now the one answer under the title, the smaller service is one "smaller budget" line,
    and the automations further down are labelled optional, each with its own price.
29. Home levels block on a phone: four stacked cards ran 2,546px. Under 720px they sit in one row that scrolls
    sideways, Business first, with the next card peeking in.
30. "Concept demonstration" pushed the level badge out of the demo card (now "concept demo"). A chosen view or filter
    chip used the filled blue that marks the next step everywhere else; it is now a lighter layer with a blue edge.
31. `/portfolio/` on a phone: each concept's facts fold under one "Project details" line instead of a spec table
    each; a "Back to the list" link follows each concept; the level filter is left out (the chips above already index
    the page) and the Flagship line follows the intro 40px down instead of 80px.
32. Demo cards: the level badge stays at the right when the label and badge fit, and drops under them at the left when
    they do not, instead of squeezing the label.
33. Quote form: choosing "Phone" as the best way to reach you asks for a number (choosing Email clears it); a folded
    copy of what was sent stays on the page after sending; its headings follow the site's Title Case.
34. The phone demo window at rest showed one card over about 230px of nothing. The quiet note the wide layout shows
    now sits in that space.
35. Docs tables of three or more columns stack on a phone, each cell under its column's name; the sideways scroll cut
    them off mid-word.
36. `/portfolio/` on a phone: the phone frame covered the right end of Halvane's headline. Under 480px it overlaps the
    computer by 20px.
37. Callback form at 390: the options wrapped two and one. They now sit in even columns.
38. Breadcrumbs, level pills and other standalone links shorter than 44px get an invisible 44px tap band (nothing
    moves); the docs links from the README get the same.
39. Home: the only way to the FAQ was a link at the end of the location line. The final quote box now links to it.
40. Docs and README: the sentence about the demo address was corrected. Publishing the README change to the public
    GitHub repository is the owner's step.
41. `DESIGN.md`'s home row and a `VideoTeasers` comment still described the older home order.
42. `/websites/` at 1440: the footage's lit panel ended in a hard rounded edge through the example's phone. The
    lower cap used on `/automation/` keeps the motion and lets the example lead.
43. Demo cards: the level pill sat under the card-wide link, so a tap on "Business" opened the computer and phone view
    instead of the level page.
44. Docs header: when the code link wraps under the breadcrumbs, a 14px row gap keeps the two tap bands apart.
45. Price check (tooling outside the repo): a pattern missed figures right after some characters; fixed and re-run.

After critique round 5:

46. Home receptionist demo link said "from $599" without its monthly fee. It now says "from $599 + from $249/month",
    as everywhere else.
47. Home hero film: its two fade masks added up instead of intersecting, so the film showed a hard edge under the
    menu at the top right. They now intersect at every width (checked at 390, 1024 and 1440).
48. Home ownership heading: "None of the Technical Headaches." moves to its own line as a whole instead of breaking
    mid-phrase.
49. Example previews: the computer frame's shadow was removed; only the phone in front casts one.
50. Home levels row: "See all pricing" was a third way on beside the quote and the comparison. Pricing is in the menu
    on every page, so the link went.
51. `/portfolio/` on a phone: the gap above the first concept was halved.
52. Example pages' phone preview: a status-bar strip above the page, as on a real phone, so the rounded corners no
    longer cut the demo's top line.
53. On `/contact/` the header's quote button is the page you are on: it is outlined and carries `aria-current="page"`.
54. `/get-a-website/` at 1024 and wider: the page's close ran down one 880px column with the right half empty. How It
    Works is now on the left, ownership and the quote on the right.
55. Example pages labelled the made-up business's section "Concept Case Study"; it is now "Concept Walkthrough".
56. A code block wider than its box shows the same soft edge as a docs table on the side that scrolls.
57. The critique capture script scrolled smoothly, so in rounds 1 to 5 the sticky header and the contact aside were
    sometimes drawn mid-page. It now scrolls instantly (tooling only; round 6 used the fixed captures).
58. Visual goldens `home-1440`, `contact-390` and `contact-1440` were replaced after comparing each diff by eye: only
    the hero fade under the menu and the outlined header button changed.
59. `/portfolio/` cards: the level badge always takes its own row under the icon and kind, so names in a row line up
    at every width.
60. Example-site cards (`/websites/`, `/get-a-website/`, `/ecommerce/`, `/demos/`) show the level's starting price from
    `src/data` next to the level name, as the portfolio does (the store card shows the online-store price). From 1024
    to 1199px, three to a row, the kind label keeps two lines so the names line up.
61. "Our Work" in the menu is marked (`aria-current="true"`) on `/examples/*` and `/work/*`, which belong to it.
62. Home hero on screens under 900px: the picture fades out over the last quarter of its width instead of a 37px
    strip that read as cut off.
63. `/contact/` side column "Prices and Paying": the starting prices from `src/data`, three answers word for word from
    the pricing questions (how to pay, other companies' costs, changing your mind) and a link to `/pricing/#faq`.
64. `/contact/` on a computer: the side column was 650-750px tall beside a form about 3,100px long, so on a 1280x800
    or 1536x730 laptop it scrolled away and left empty space. The column now runs the form's full height and its
    last block, "Prices and Paying", stays in view while the form scrolls (any screen 640px tall or more, checked at
    ten sizes from 1024x600 to 1920x960). Its answers share a name, so one opens at a time and the block always fits.
    The detector's `first-viewport-column-overflow` rule still fires: it measures the column's content, not what
    stays in view. Visual golden `contact-1440` replaced after comparing the diff: only the two swapped blocks moved.

Critique round 7 (fixes 65-76):

65. Home automation demo: a "How it ends" preview shows the demo's last card at rest (hidden from screen readers, gone
    once play starts). It adds to approval 89; the owner can veto it.
66. Price lines put each item's own price first, e.g. "New website ($900 up to 4 pages, $499 for one page)". Amounts
    unchanged.
67. Docs code blocks wrap on phones, and the orphaned inline code at a line's end is gone.
68. `/contact/` h1 uses the Display scale, as DESIGN.md pins for every h1.
69. `/contact/` steps are rows from 640px: heading left, text right.
70. `/websites/` "If you leave" steps fold into a native `<details>`, open by default from 1024px: 14,243 to 13,736px
    tall at 390 (partly fixed; the rest of the length is a content call, see "Not done").
71. Home levels row on phones: one dot per level, the one in view drawn long.
72. `/websites/` ownership pair at equal heights (879 and 879px at 1440).
73. Footer logo and link rhythm at 390.
74. A one-off yellow (`#fcd34d`) replaced by the warning token `var(--warn)`.
75. Home "Your Accounts": reading measure and the h2's line break.
76. `/websites/` hero backdrop fades in at the top instead of starting on a hard edge.

Critique round 8 (fixes 77-84):

77. The "How it ends" label is one text span, so no gap before its full stop.
78. `/websites/`: the three facts (Suits, We need from you, Paid to other companies) moved from the price panel to
    under the feature list, one row each from 640px. At 1440 the main column is 672px and the panel 546px (was 462
    and 862).
79. `/websites/` ownership pair from 1024px: the six-step card is the wider one (spare room 33 and 87px, was about
    340px).
80. `/get-a-website/` from 1024px: the why list in three columns, the offer full width, the cost notes side by side;
    from 1200px, four columns of what you get.
81. "$499 one-time" never breaks at its hyphen.
82. `/contact/` step-title column 13rem to 9.5rem.
83. "Ask for a call back" is now "Request a callback".
84. `/portfolio/` "Services it shows" is now "Optional services it shows, each priced on its own" (amounts unchanged).

Critique round 9 (fixes 85-92):

85. Example pages (`/examples/*`): the eyebrow keeps "concept demonstration" together.
86. Docs code blocks break after a slash or between JSON fields, and keep an email address or hyphenated word whole
    (`codeBlock` in `Doc.astro`). Nothing adds a character, so copied code is unchanged.
87. Under 360px such a word may break again rather than push the block sideways (`Base.astro`).
88. Inquiry form "not sent" panel: Gmail and Outlook links that carry the same answers, and the address printed in
    full. The callback form's panel prints the address too.
89. Invalid text fields get the red border in both forms (the input rule outranked the plain `[aria-invalid]` rule).
90. Home on phones: the four levels and their prices sit side by side above the swipe row (`.lv-ladder` in
    `LevelRail.astro`, hidden from screen readers; the list below carries the words). Hidden from 720px.
91. `/portfolio/` Flagship line says why there is no example ("Flagship work is planned one project at a time") and
    links to a custom-project quote.
92. Example-page eyebrow is a block, not a flex row, so at 320 the kept-together phrase moves to its own line. Fix 85
    had made `/examples/fernway-lawn/` 334px wide at 320; the page test caught it.

Before critique round 10 (fixes 93-94):

93. Footer "Docs" is now "Developer docs": the docs are setup guides for the open-source projects (Node, webhooks,
    Discord), not help for site owners.
94. Docs guides of three or more sections list them under the opening paragraph ("On this page", the `/handover/`
    pill row, 44px targets): `small-business-automations` (4), `webhook-relay` (6), `csv-cleaner` (3). A link lands
    80px from the top, under the header. The two short guides have none.

After critique round 10 (fixes 95-98):

95. Docs code blocks wider than the reading column grow to the right from 1100px, up to 48px from the window's edge,
    and only scroll past that (`Base.astro`). At 1440 the four guides that scrolled now show their output whole; one
    `webhook-relay` block still scrolls. 0px page overflow at 1100, 1280, 1440 and 1920.
96. The contact form's management question says what management costs, read from the plans data: "Website Care at
    $79 a month for a website, or from $149 a month for automations" (`InquiryForm.astro`; no price changed).
97. `/websites/` adds one line under the made-up examples linking the real Chrysfadezzz case study. The line is built
    only from `src/data/case-studies.ts` (service, business, industry, location), the same words the published case
    study shows, and is hidden if that study is ever staged. Not added to `/get-a-website/`: that page shows only
    Business examples on purpose, and the case study does not say which level the barber site is.
98. `/websites/` on phones (under 640px): an "On This Page" chip row under the hero (New Website, Redesign, Examples,
    Two Ways to Work, Ownership, Questions), the `/portfolio/` pattern. Each chip is 44px tall and lands its section 80px
    from the top; hidden from 640px. The ownership and questions sections got ids for it.

After critique round 11 (fixes 99-102) and the last SEO check (103):

99. Quote form, empty or half-filled Send: with two or more missing answers the page scrolls to a count above the form
    ("5 answers need fixing.") and focuses it, with one jump link per question in the question's own words, as the
    plan sign-up pages do. One missing answer still focuses its field. A missing choice group is marked once, by one
    red outline 8px around the five choices, instead of five red cards (`InquiryForm.astro`).
100. Docs code: a wrapped line now continues 3 characters in from its own text, using each line's indent, so a wrapped
    entry in the indented demo log no longer reads as a new entry (`Doc.astro`, `Base.astro`).
101. `/websites/`: the real Chrysfadezzz case study is now a small panel with its own home-page picture instead of one
    line (supersedes 97). It still sits after the made-up examples, labelled apart from them, uses only the words in
    `src/data/case-studies.ts` and hides if the study is staged. `/get-a-website/` still leaves it out (see 97).
102. The too-long message for "Tell us about your project" now says "Your project description is too long (3000
    characters at most)." instead of naming a "Project description" field the visitor never saw (`InquiryForm.astro`).
103. `/automation/` title shortened from "Lead Follow-Up, Automation & AI Receptionist · Nuxy Automation" (62
    characters, past where search results cut titles) to "Lead Follow-Up & AI Receptionist · Nuxy Automation" (50);
    "Automation" stays in the brand part. Rebuilt; pages 34/34 and site 22/22 rerun after it.

The owner's decisions of 2026-11-21 (104-105):

104. The Business level card reads "$499 – $900" again, the owner's choice over "From $499" (approval 121). One
    line in `src/data/tiers.ts`; every card, badge and the `/business-websites/` description print it from there. The
    other levels keep "From $X". `tests/levels.test.mjs` and `tests/pricing.test.mjs` pin the label. No amount changed.
105. `/contact/` shows one form at a time (approval 122). With JavaScript the two choices above the forms ("Write it
    down", "Request a callback") become tabs (WAI-ARIA tabs: arrow keys, Home and End, one tab stop); the quote form
    is chosen first and "What Happens Next" moves with it; `/contact/#callback` (home, `/handover/` and the plans' links)
    opens the callback form and lands the two choices 16px under the header, as every anchor on the site does. A
    hidden form keeps what was typed in it. Without JavaScript nothing changes: both forms show and the choices jump.
    The chosen tab is tinted with a doubled blue edge. The script is inline and import-free, so the page still loads
    one script file. New test in `tests/contact-form.test.mjs`; the three callback tests open `/contact/#callback`;
    the two contact goldens in `tests/visual/` were replaced after the diff showed only the chosen-tab tint.

After the push (2026-11-22):

106. Astro 7.4.2 to 7.4.7. The repository security check (`tools/security-check.mjs`) passes, but its npm audit
    counted one moderate finding in the site: Astro ≤ 7.4.6, advisories GHSA-mh32-jxcr-mh9f (attribute injection
    through dynamic tag names) and GHSA-r3h5-4585-7x3w (the `@astrojs/node` image endpoint). Neither reaches this
    site: it is a static build with no `@astrojs/node`, and every dynamic tag name comes from the site's own code.
    The old version is on `master` too (it predates this work). Updated anyway, so the audit is clean: 7.4.7 is the first release that patches
    both and was 16 days old; the lockfile was resolved with `npm install --before=2026-11-07`, so no package in it
    is newer than two weeks (the youngest is 15.6 days). It brings Rolldown in as Vite's bundler. `npm audit`: 0. The
    build's two CSP warnings (Shiki's inline styles, `style-src-attr`) are the same ones 7.4.2 printed; the config
    already allows attribute styles. Outside this audit, `media/fiverr/video/landing` pins `astro` at exactly 7.4.2
    and carries the same moderate finding; it is a separate project, left for the owner to decide.

## Critique trend

Impeccable critique of the 7 key pages (home, portfolio, get-a-website, websites, one example, contact, one docs
guide), two fresh assessors each round on Opus and Sonnet; the lower of the two scores is stored, never rounded up.
Stored scores in order: 29, 31, 31, 31.5, 32, 31, 31, 31, 32, 31 (round 11, 2026-11-21). Records in
`.impeccable/critique/` (local, not committed).

The score sits at 31-32/40, under the owner's 35 minimum. In the last rounds each heuristic scored 3 still names at
least one item that needs an owner decision, so fixes inside this task's scope remove single findings without moving
a heuristic. The decisions that would lift it: one name for Website Care and plain headings in `handover.ts`
(approvals 116 and 90; heuristics 2 and 4), the "Live Demos" nav label (row 91; heuristic 4), a shorter `/websites/`
with one ownership block (heuristic 8), and a saved form draft with privacy wording (heuristic 3). One form at a time
on `/contact/` (heuristics 5 and 7) was decided by the owner and built after round 11 (fix 105); the owner kept both
forms' fields, so the quote form's phone field stays. Until the rest are decided the score is capped at about 32/40.

## Verification

All runs below are on the local build (`dist/`), one test file or browser job at a time.

| Check | Result |
|---|---|
| Type check (`tsc` with the project config) | exit 0 |
| `npm run build` | exit 0, 67 pages plus `404.html` |
| All 14 test files, each run on its own (round 11, after fixes 99-101) | 222/222, 0 failures: billing 18, cinematic 21, contact-form 27, creative 21, demos 6, estimate 7, levels 16, pages 34, pricing 14, quillfern 5, security-txt 2, site 22, stage 4, visual 25 (goldens in `tests/visual/`, none changed) |
| `tests/contact-form.test.mjs` after fix 102 (against a local stand-in for the inquiry service) | 27/27. Fix 102 changes one message string; no test asserts the old wording |
| All 14 test files again after fixes 104-105 (round 12, the last edit) | 223/223, 0 failures: billing 18, cinematic 21, contact-form 28 (one new: the form switch), creative 21, demos 6, estimate 7, levels 16, pages 34, pricing 14, quillfern 5, security-txt 2, site 22, stage 4, visual 25 (the two contact goldens replaced; every other golden unchanged) |
| Fix 105 in the browser (390 and 1440, local build) | quote form first, callback hidden; a click or the arrow keys switch, the address shows `#callback`, typed values survive; `/contact/#callback` lands with both choices 16px under the header and the first callback field on screen; reduced motion lands the same; without JavaScript both forms show; 0 page errors |
| Fix 99 and 102 in the browser, every send blocked (0 requests left the page) | empty Send at 390: "5 answers need fixing." takes focus, links read "What do you need?", "Your name", "Business name", "Email", "Tell us about your project"; too-long answer: "Your project description is too long (3000 characters at most)." |
| Page sweep: 36 Nuxy pages × 5 widths, each scrolled so the fade-ins finish | round 11: 0 console errors, 0 failed requests, 0 sideways overflow, 0 axe hits (earlier runs had 1 axe hit on `/demo/`, a timing artifact: a chat bubble captured mid fade-in). Round 12 (after 104-105): 0 failed requests, 0 overflow, 0 axe hits, and 1 page error at 390 on `/examples/mossgate-cleaning/`, thrown by the peer's Mossgate demo (see "Not done") |
| Round 13, after fix 106 (Astro 7.4.7): build, types, tests | `astro build` clean (68 HTML files; the two CSP warnings also printed by 7.4.2), `tsc` 0 errors, the flag-on billing build rebuilt outside the repo; all 14 test files 223/223 with the same per-file counts as round 12 and every visual golden unchanged; `npm audit` 0 |
| Round 13 in the browser and on `dist/` | sweep (36 pages × 5 widths): 0 console or page errors, 0 failed requests, 0 overflow, 1 axe hit on `/demo/` at 1440, the known mid-fade chat bubble: re-run three times, 0 contrast hits once the bubbles settle (opacity 0 to 0.95 when axe first ran). Links, SEO and prices as in rounds 11-12. Lighthouse mobile on `/contact/`, `/docs/small-business-automations/`, `/websites/`: 100 in all four categories, LCP within 10 ms of round 11, CLS 0 |
| Internal links across `dist/` (5,266 checked, round 11) | none broken outside the example sites; inside them, demo buttons use `#call`, `#email`, `#text`, `#rooms`, `#warranty`, `#directions` and `#review` as on-page demo actions (peer's files, not edited) |
| Prices on Nuxy pages vs `src/data` (round 11, 40 pages, all seven names checked) | all match. Starter $499 (4 pages), Signature $3,500 (12), Immersive $6,000 (5), online shop $1,200 (4), Mini Online Store $699 (`/pricing/`). The Business level card reads "$499 – $900" on 10 pages (round 12, after fix 104; the owner's decision on row 121, which the peer's merged commit `e9ab3e0` had changed to "From $499"), with the note "One page $499, a site of up to 4 pages $900"; amounts unchanged. Other "Business" prices are other products: the $1,499 video-ad "Business package" (`creative.ts`, owner-approved) and the "Business CRM & Automation System from $2,500". Flagship shows no fixed price. `$149` on `/pricing/` and `/policies/` is the published automation starting price, not a Starter price |
| SEO metadata (after fix 103: 68 HTML files, 36 in the sitemap) | every Nuxy page has a title, description and canonical, and no indexed page has a long title (`/automation/` was 62 characters, now 50). Example sites and payment pages are `noindex` |
| `tests/pages.test.mjs`, `tests/site.test.mjs` after fix 103 | 34/34, 22/22 |
| Preview images vs real pages | all five example previews match their live demos (item 16) |
| Production forms and integrations | never submitted, nothing sent; checkout stays off (`PUBLIC_BILLING_CHECKOUT`) |

Lighthouse (mobile and desktop presets, local build, reports in the redesign folder's `lighthouse/r9` and
`lighthouse/r11`). Contact, docs and websites are from round 11 (23:08 on 2026-11-21, after fixes 99-101; fix 102 at
23:16 changed only the words of one error message); the other five are from round 9 (21:40). CLS is 0 everywhere. Mobile performance moves a few points between runs
on the same build (home 95-98, pricing 94-98 across rounds), so treat the mobile figures as a range.

| Page | Desktop perf / a11y / BP / SEO, LCP | Mobile perf / a11y / BP / SEO, LCP, TBT |
|---|---|---|
| `/` | 100 / 100 / 100 / 100, 0.5 s | 95 / 100 / 100 / 100, 2.4 s, 180 ms |
| `/contact/` | 100 / 100 / 100 / 100, 0.3 s | 100 / 100 / 100 / 100, 1.2 s, 60 ms |
| `/docs/small-business-automations/` | 100 / 100 / 100 / 100, 0.3 s | 99 / 100 / 100 / 100, 0.9 s, 90 ms |
| `/get-a-website/` | 100 / 100 / 100 / 100, 0.5 s | 100 / 100 / 100 / 100, 1.9 s, 50 ms |
| `/portfolio/` | 100 / 100 / 100 / 100, 0.3 s | 100 / 100 / 100 / 100, 1.2 s, 10 ms |
| `/pricing/` | 100 / 100 / 100 / 100, 0.4 s | 94 / 100 / 100 / 100, 1.4 s, 290 ms |
| `/web-design/` | 100 / 100 / 100 / 100, 0.4 s | 98 / 100 / 100 / 100, 2.3 s, 50 ms |
| `/websites/` | 100 / 100 / 100 / 100, 0.5 s | 100 / 100 / 100 / 100, 1.2 s, 10 ms |

## Not done, and why

- **Deploy and merge to master:** the owner's step (approval 102). The owner approved committing and pushing this
  branch on 2026-11-21, and nothing more. Merge order with `higgsfield-visuals-2026-11`: approval 103.
- **GitHub "Security checks" on the pushed branch:** the run did not start because of a billing block on the GitHub
  account ("recent account payments have failed or your spending limit needs to be increased"), the owner's step.
  The same command (`node tools/security-check.mjs --strict --skip=semgrep`) run locally passed 8 of 8, Gitleaks
  over the whole history included.
- **Mossgate demo page error (peer's file, reported, not edited):** the before/after slider's opening animation in
  `src/pages/example-sites/mossgate-cleaning/index.astro` (line 286) can throw "undefined is not iterable" when the
  first animation frame's time is earlier than the start time it measured, so `keys[i - 1]` is read at `i = 0`. It
  happens on some runs only (round 11's sweep was clean). Clamping the elapsed time at 0 fixes it. The demo session
  that owns the file confirmed it; its uncommitted Mossgate rewrite removes this animation, so the file is left as it
  is here (a patch would only conflict with that rewrite).
- **Live checkout:** stays off (approval 107).
- **Client claims, service names and pricing messages:** approvals 104, 105, 106, 109, 111, 112, 113, 115, 116, 117.
- **Example sites** (`src/pages/example-sites/*`, `src/components/demo/*`, the text of `src/data/demo-sites.ts`): owned by a
  peer session; Lantern Row beside the real barber is approval 118.
- **Production forms:** never submitted; form tests run against a local stand-in.
- **`/websites/` repeats ownership points that `/handover/` explains:** left; trimming it is a content call, not a fix.
- **Design score 31/40, under the 35 minimum:** the decisions that cap it are listed under "Critique trend" above.
- **Left from round 11 on purpose:** the contact "What Happens Next" title column, the datalist arrow, the docs JSON
  wrapping mid-token at 390, "NOT" in capitals in the fail panel, the Fernway picture shown twice on `/get-a-website/` at
  390; the example pages' "Technology" and "Performance" rows are the peer's text.
- **Tooling:** the Bash tool in this Claude session failed on every call (a harness error), so checks ran through
  PowerShell and Node, and the critique assessors read prepared screenshots and detector output.
