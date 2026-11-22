# Demo redesign brief (2026-11)

Four fictional demo sites, each built as if a different studio made it. Shared rules: the demo banner stays; the "Built by Nuxy" pill shows only from 1400px, where the gutters hold it; everything fictional is labelled; no invented reviews or stats; photos are AI-generated, recorded in `docs/demo-photo-assets.md`, never presented as customer work; reduced motion gets stills; no payment processor.

## Fernway Lawn & Landscape (Business) — a field-crew almanac
- **Hero:** full-bleed morning-lawn photo, headline on the photo's quiet lower-left lawn over a soft scrim; a quote dock overlaps its bottom edge.
- **Type:** Bricolage Grotesque, heavy and tight, for headlines; Inter for body.
- **Colour:** moss #1F3A2B, lawn #5E8C3A, clover #DCE8C8, straw #E2C36B (accent), ivory #FAF8F1.
- **Sections:** service photo grid (one large tile + five), before/after slider (same yard), seasons, service-area map, quote CTA + click-to-call.
- **Motion:** CSS only, one hero load sequence.

## Mossgate Home Cleaning (Business) — price-first clarity
- **Hero:** large light-weight Figtree headline, then a bright kitchen photo with a receipt-style estimator overlapping it that prints its maths line by line. Beside the receipt on desktop, under the photo, a "How each line is priced" key built from the same rate sheet, so it never drifts.
- **Colour:** linen #F3EFE8, oat #E6DDD0, paper #FCFAF7, ink #24221F, cobalt #2443B8 (accent), sky #DCE5FB. No green: it must not read as Fernway.
- **Sections:** room-by-room checklist, arrival windows, validated booking, FAQ, mobile sticky CTA.
- **Booking:** home type, bedrooms and bathrooms are the same pill buttons as the estimate; an estimate link preselects them.
- **Left out on purpose:** before/after. There is no matched same-room pair yet, and an unmatched pair would mislead. The generation spec is in `docs/demo-photo-assets.md` if the owner wants one.

## Lantern Row Barbers (Signature) — cinematic editorial cover
- **Hero:** the shop at dusk. One orchestrated intro (about 1.8 s): lamplight travels from the big lantern along the brass lamps to the chairs, then fills the room; the words wait for it. Reduced motion, tier 3 and no JavaScript get the finished still.
- **Type:** Bodoni Moda for headlines and text (lining figures); Sofia XC is the signage voice (nav, labels, links), never body.
- **Colour:** charcoal #1C1A19, soot #121110, oxblood #6E1F24, cream #EFE6D6, brass #B8925A.
- **Sections:** menu board with dotted leaders and hover/focus photo previews; style strip (back-of-head and profile shots, no identifiable faces); a style book gallery in four chapters (fades, textured, beard, classic); split closing band with a facts row; footer hours grouped ("Tuesday to Friday"); six-step booking.

## Quillfern Candle Co. (Signature, ecommerce) — a botanical product journal
- **Hero:** split: copy column beside the jar photographed in an arch window. The one cinematic moment: the candle lights itself once (spark, lit photo dissolving in); the button names what it does next. Never in the purchase flow.
- **Type:** Fraunces for display and text. The shipped subset has proportional figures only, so prices do not align in columns.
- **Colour:** ivory #FBF8F1, parchment #EFE6D2, ink #2B2620, sage #7D8B6A, copper #B06A3B (accent).
- **Shop:** six product photos from one shared vessel and set; variant pills; a cart page with quantity, totals and remove; shipping or studio pickup; labelled demo checkout.

## Anti-sameness checks
- Heroes: four structures (on-photo headline; type above a photo + receipt; lamplit room; split arch window).
- Typefaces: none shared between sites except Inter as Fernway's body.
- Accents: straw, cobalt, brass, copper.
- Banned tells: all-caps eyebrows, middle-dot meta strings, arrows on buttons, a single accented headline word, identical rounded card grids.
