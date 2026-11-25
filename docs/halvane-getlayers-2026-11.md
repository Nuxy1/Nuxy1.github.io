# Halvane Audio: GetLayers flagship rebuild (November 2026)

Branch `halvane-getlayers-2026-11` (worktree `Freelance-halvane-getlayers`), from master `ab33370`. Committed, merged
to master and published to the live site on the owner's word (2026-11-24: "put it on the live site"). Working files,
captures and tools live in
`D:\Work\Business\Nuxy-Halvane-GetLayers-2026-11\`.

## Design brief (approved direction for this build)

**Subject.** Halvane Audio is a fictional workshop that builds one product, the Lumen One: a two-way bookshelf
speaker in solid hardwood with a paper woofer and an aluminium tweeter in a brass ring. The page sells a
reservation for a first run of 200 pairs. The visitor is someone who buys one good thing and keeps it for twenty
years; they want to see how it is made, not to be shouted at.

**Direction: a workshop at night.** One speaker on an obsidian stage, lit from above, with nothing around it that
does not explain it. The GetLayers template **Artefakt** supplies the whole frame: the 50-unit stage, the lattice
light that follows the pointer, the scrambled type, the spring motion, the technology walk and the product cards.
The Style **Obsidian Luxe** supplies the tokens. Halvane brings only its own content: the real 3D model, the
renders, the copy and two typefaces it already owned.

**Palette.** Obsidian `#0a0a0c` (stage), warm graphite `#111114` (lattice), bone `#f4f1ea` (text), stone
`#a8a49b` (muted text), ash `#85817a` (fine print, 5.1:1 on obsidian), titanium `#cfc9be` (the wordmark's lit
copy, one flat colour: the template's gradient text was replaced). The only warm colours on the page belong to the product: walnut,
brass, chalk and graphite finishes. No accent colour, no gradient wash, no glow.

**Type.** Newsreader Display, light, for display headings and the wordmark: a book face, because Halvane talks
like a maker, not a gadget brand. Albert Sans for everything else, including the template's small UI text.
Sentence case everywhere; no all-caps labels, no eyebrows.

**Layout.** Artefakt's frame: each act fills one 50-unit stage on a wide screen and becomes a single column below
1024 px. Text sits at the stage edges; the centre belongs to the speaker. Numbering appears only where the
content is a sequence (the five-part walk inside the cabinet).

**The one bold thing.** The speaker itself, oversized in the centre of the first two acts, turning 40 degrees and
drawing apart as you scroll. Everything else stays quiet so that one movement reads.

**Motion.** One system: artefakt.js (springs, Lenis, the scroll-scrubbed reel), with the pendulum scene sharing
its frame clock. Tier 3 (reduced motion, data saver, low memory) gets still images and no WebGL. Audio plays only
after the visitor presses the sound button.

**Honesty.** Lumen One is fictional, so its figures are design figures, not measurements; the page says so. The
exploded and open-back views are labelled "for illustration". The price is always a demonstration price. Forms
send nothing and say so.

## Act map

| Act | Section | Content and motion | GetLayers source |
|---|---|---|---|
| 1 Arrival | `#hero` | Oversized speaker poster, then the live 3D model; Halvane wordmark behind it with the template's torch; markers, h1, one CTA, two badges | Artefakt hero, wordmark torch, lattice, scramble |
| 2 Reveal | `#details` | The sticky stage carries the real model 40 degrees round and draws the woofer and tweeter forward; three intent-led rows | Artefakt product stage + details frame |
| 3 Engineered detail | `#technology` | 61-frame reel rendered from the real GLB; five cards with leaders to projected anchors; back panel opened on the last card | Artefakt technology walk |
| 4 Sound visualised | `#sound` | Pendulum Wave scene, retinted to walnut and brass; release and sound buttons; still image on tier 3 | Scene `pendulum-wave` |
| 5 Experience | `#room` | The speaker in a room by the wall (existing render) | Halvane asset |
| 6 Collection | `#collections`, `#specs` | Three finish cards with three views each; specification list | Artefakt collections cards |
| 7 Finale | `#reserve`, `#footer` | Reservation form (demo), footer with the fiction line | Artefakt footer |

## Fix list

| # | Item | State |
|---|---|---|
| 1 | Demo form reset put the finish select back on Walnut while another finish was showing | Fixed in stage.js (`demo-reset` resyncs the select) |
| 2 | Template menu labels were all caps and listed Reserve twice | Fixed: sentence case, Listen added, Reserve only as the cart link |
| 3 | Specifications heading clipped at 1920, 1440 and 1024 | Fixed: `#specs.flow` grid gives the heading its own 27-unit column |
| 4 | Mobile LCP waited on the WebGL hero | Fixed: `first-paint.js` holds 3D start until the hero poster has painted (3 s cap) |
| 5 | Swatches, menu and sound buttons under 44 px on touch | Fixed in halvane.css (44 px targets) |
| 6 | Wordmark used gradient text (brief bans gradients) | Fixed: flat `#cfc9be` |
| 7 | Native scrollbar, select list and autofill drew light on the dark page | Fixed: `color-scheme: dark`, scoped to this page |
| 8 | Grey tap flash and double-tap zoom delay on touch | Fixed: tap highlight off, `touch-action: manipulation` on the controls |
| 9 | Swatch hover ring stuck on after a tap on touch screens | Fixed: hover wrapped in `@media (hover: hover)` |
| 10 | Impeccable flagged the two owner-approved fonts | Not a defect: file-scoped font suppressions in `.impeccable/config.json`, disclosed in the report |
| 11 | Two WebGL contexts live at once (stage + pendulums) | Fixed by stage b (photo frames replaced the WebGL stage); measured 11-24: one live context (pendulums), the tier probe releases its test context |
| 12 | Demo-card screenshots `/images/examples/halvane-audio-*.webp` show the old page | Fixed 11-24: re-shot with `scripts/example-shots.mjs halvane-audio`; old files backed up in the report folder |
| 13 | Nuxy demo pill outside any landmark (axe `region`) | Fixed: wrapped in `<aside aria-label="About this demo">` (DemoSite.astro) |
| 14 | Hero claim and tier-3 finale paragraph cross the photo; contrast at risk | Fixed: tight dark text shadow; measured 0 below AA at 1440/768/390 |
| 15 | Tablet (768): the reel dropped 117 px onto the part cards | Fixed: artefakt.js pins only on `FRAME_QUERY`, as the CSS does; desktop exit ramp unchanged |
| 16 | Image delivery: sound-still and showroom poster served larger than shown (about 67 KiB) | Fixed 11-24: 1000w for every poster, 1200w for sound-still; Lighthouse savings 67 → 13 KiB |
| 17 | `scene.ts`, `timeline.ts` and `public/3d/halvane/lumen-one.glb` (1.1 MB) are no longer loaded but still ship in public/ | Fixed 11-24 (owner: "you can delete them"): deleted with `tests/halvane-timeline.test.mjs`; the two scene.ts source tests removed; the Halvane browser test in `levels.test.mjs`, broken since stage b, now checks the orbit frames; DESIGN.md updated; copies in the report folder `photoreal-proof/removed-3d/` |
| 18 | 75 files under `public/3d/halvane` (5.1 MB) that no page references would ship: the 3D model's material textures, and the reveal, final-product, front/rear-detail and driver-macro posters only the 3D version used | Fixed 11-24 before publishing: removed after a check of every built page; copies in `photoreal-proof/removed-3d/unused-assets/`; suite 219 pass / 0 fail / 10 skipped, 0 browser errors at 1440 and 390 |
