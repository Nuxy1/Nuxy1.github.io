# Demo photo assets (November 2026)

The four redesigned demo sites (Fernway Lawn & Landscape, Mossgate Home Cleaning, Lantern Row Barbers, Quillfern
Candle Co.) use generated photographs. Every one was made for these demos. None shows a real client, customer, job,
product or person, and none may be presented as one. The before/after slider carries an "Example images" tag, and
every demo page carries the fictional-business banner from `src/layouts/DemoSite.astro`.

## How a photo gets onto a page

1. Put the master PNG in `assets/cinematic/demos/<site>-<id>.png` (masters are 2-3k px, 5-11 MB, never served).
2. Run `node scripts/demo-photos.mjs`. It writes `public/images/demos/<name>-<width>.avif` and `.webp` and records the
   size, the widths and the mean colour (the placeholder background) in `src/data/demo-photos.json`.
   - Widths by shape: names with `-hero` get 640/1024/1600/2400; other landscape photos 160/480/800/1200; square and
     portrait photos 360/600/900. A width larger than the master is skipped.
   - The script skips any output file that already exists. **When you replace a master, delete its old
     `public/images/demos/<name>-*` files first**, or the site keeps serving the old picture.
3. Show it with `src/components/demo/DemoPhoto.astro` (`<DemoPhoto name="..." alt="..." sizes="..." />`). Pass
   `priority` only for the photo that is the page's largest first-screen image.
4. Quillfern candles need no code: `src/components/demo/quillfern/CandlePic.astro` uses `quillfern-<candle id>` when
   that photo exists and falls back to the candle's paper label set in type when it does not. Its `shows` map says
   what each photo is of (the alt text), so update that line when a candle photo changes.

Output budget at the time of writing: 212 files, 11.4 MB in `public/images/demos`. A page only downloads the one
width its layout needs.

## Generation rules

- Higgsfield, by hand in the owner's Chrome, on the Unlimited plan only: zero credits spent. Never through the
  Higgsfield MCP or CLI. At most two jobs in flight at a time.
- No real people, faces that can be identified, brand names, logos, signage text, house numbers, vehicles or
  watermarks. Barber photos show the back of the head, or a profile cropped below the eyes.
- Before an alt text is written, check it against the picture, not against the prompt: the generator drifts (the
  backyard "after" shot came back with a door frame the prompt never asked for).
- The subject lines below are condensed. The full prompts as sent, with the Higgsfield job references, are kept in
  `D:\Work\Business\Nuxy-Demo-Redesign-2026-11\prompts-as-sent.txt`. One exception: the exact text of the
  `fernway-hero` prompt was not kept; its subject line below is the only record, so a replacement starts from that.
- Pairs (before/after, unlit/lit) are made as an **edit of the finished shot**, so the camera, framing and props
  match.

### Shared style tails (pasted after each subject)

- **Fernway (trade):** `natural colour, realistic editorial trade photography, subtle film grain. No people, no faces,
  no brand names, no logos, no text, no watermark.` Lens and light go in the subject line (35-50 mm, f/4-f/8).
- **Mossgate (homes):** `Natural colour, realistic editorial photography, subtle film grain. No people, no faces, no
  brand names, no logos, no text, no watermark.` Eye level, 24-28 mm, f/8, daylight; "lived-in, not a showroom".
- **Lantern Row (portraits):** `Warm brass rim light, 85mm lens, f/2.8, shallow depth of field, rich natural colour,
  cinematic low-key editorial photography, subtle film grain. The face is not visible and the person is not
  identifiable. No brand names, no logos, no text, no watermark.`
- **Quillfern (candles, made as edits of `quillfern-hero`):** `Same handmade cream stoneware jar, plain unprinted paper
  band and brushed copper lid as the reference, same studio and light family. Macro product photograph, square frame,
  the jar centred slightly low and filling about half the frame, shallow depth of field, soft natural window light
  from the left, warm ivory and parchment tones. No text, no logo, no label printing, no hands, no people.`

## Fernway Lawn & Landscape

| Master | Shows | Used on |
|---|---|---|
| `fernway-hero` | A striped front lawn on a misty morning, a grey house with a porch at the right edge | Home hero |
| `fernway-mow` | A walk-behind mower on a freshly striped lawn | About page; Mowing service |
| `fernway-leaves` | Leaves raked onto a tarp at the edge of a cleared lawn | Cleanup service; Fall cleanup project |
| `fernway-beds` | A spade-edged front bed in dark shredded mulch along a house wall | Mulch service; Front bed project |
| `fernway-hedge` | A boxwood hedge row cut square | Hedge service; Hedge project |
| `fernway-plant` | Trays of perennials beside a freshly dug bed | Planting service |
| `fernway-snow` | A concrete drive and walk shovelled clear at dawn, ice melt scattered | Snow service |
| `fernway-before` / `fernway-after` | The same backyard before and after a cleanup | Before/after slider (home, Projects); after = Backyard project card |

"Service" means everywhere a service appears: the Services page, the home page's service list and the quote form's
service picker (a 56 px thumbnail).

Subject lines:

- **hero:** _prompt text not recovered yet._
- **mow:** Photograph of a residential lawn mid-mow on a bright late-spring morning: a commercial walk-behind mower
  parked on the grass with a fresh light-and-dark stripe pattern behind it, the operator cut out of frame except dark
  work boots and green canvas trousers at the edge, a straight crisp edge where lawn meets a concrete path, small
  clippings catching the light, a white picket fence and lilac shrubs soft in the background. Low camera at knee
  height, 50mm lens, f/4, shallow depth of field.
- **leaves:** A fall leaf cleanup on a suburban back lawn in late October: leaves raked into two neat piles and a third
  on a green canvas tarp, a wooden-handled rake against the tarp, the cleared half of the lawn tidy while the far half
  is still scattered with leaves, a perennial bed cut back to clean stubs, soft overcast light. Eye level, 35mm, f/5.6.
- **beds:** A freshly planted front garden bed in early June: a curved bed with a clean spade-cut edge, dark shredded
  bark mulch, catmint, coneflower, hosta and three young boxwood, a stone step path, the lower course of a painted
  brick house wall behind, soft morning light. Three-quarter view from standing height, 35mm, f/5.6.
- **hedge:** A long boxwood hedge row freshly shaped by hand along a side yard: flat top, straight face, slightly lighter
  green on the fresh cut, clippings on a canvas drop sheet with hand shears resting on it, a gravel path, a timber
  fence and a birch behind, clear late-morning light. Low three-quarter angle, 50mm, f/4.
- **plant:** Late-spring morning in a Midwestern backyard: a freshly dug bed of dark soil curving along a cedar fence,
  three black nursery trays of young perennials (salvia, coneflower, hosta) on the lawn, a hand trowel and leather
  gloves at the spade-cut edge, a few plants already set. Soft low light, shallow depth of field, 35mm look.
- **snow:** A residential driveway and front walk just cleared of fresh snow at dawn: straight shovel edges, knee-high
  banks on both sides, a light scatter of ice-melt granules on the concrete, a snow-covered lawn and evergreens, the
  corner of a house with a warm porch light, pale blue sky. Eye level, 35mm, f/5.6. No vehicles, no house numbers.
- **after:** A modest suburban backyard on a clear summer morning: an evenly mown lawn with faint stripes, spade-cut
  edges along a mulched border, a weathered wooden fence, a small stone patio with two wooden chairs at the left edge,
  a mature tree casting soft shade. Fixed tripod view from the back door at standing height, 28mm, f/8. No animals.
- **before:** made as an edit of the after shot: "The same backyard as the reference photo, photographed from exactly
  the same spot, angle and framing, but a month earlier, before a landscaping crew cleaned it up after a summer of
  neglect": long uneven grass going to seed with no stripes, dandelions, clover and bare patches, unedged beds full of
  weeds and dead leaves, straggly shrubs, fallen branches; same fence, tree, house, patio and chairs, same light.
- **Edit made after generation (2026-11-21):** the after shot came back with a white door frame and a brass knob in
  its right 8%, which the before shot did not have. Both masters were cropped to the left 92% (2208 x 1792) so the
  slider halves still line up. The uncropped originals are in
  `D:\Work\Business\Nuxy-Demo-Redesign-2026-11\masters-uncropped\`.

## Mossgate Home Cleaning

| Master | Shows | Used on |
|---|---|---|
| `mossgate-hero` | A bright white kitchen and dining room: shaker cabinets, a round oak table and chairs, fruit and herbs on the counter, linen curtains at a wide window | Home hero |
| `mossgate-kitchen` | A stainless double sink on white quartz, a blue cloth over the edge | Room checklist: Kitchen |
| `mossgate-bath` | A white bathroom, glass-screened tiled shower, vanity, folded grey towels | Room checklist: Bathrooms |
| `mossgate-bed` | A made bed with a knit throw, lamp, armchair and sheer curtains | Room checklist: Bedrooms |
| `mossgate-living` | A linen sofa and armchair, oak coffee table with books and a blue vase, full bookshelf | Room checklist: Living areas |
| `mossgate-entry` | An oak staircase with white railings, a bench with shoes under it, coats on hooks | Room checklist: Entry and stairs |

The cobalt-blue cloth, towel or vase in each room is deliberate: it is the brand's one accent colour, carried
through the photography.

Subject lines (Mossgate tail after each): **hero** a freshly cleaned open-plan kitchen and dining area in a lived-in
family home on a sunny morning, linen-coloured cabinets, a quartz counter clear except a fruit bowl and a folded
cobalt tea towel, a round oak table with four chairs pushed in, sheer curtains, a few plants, 24mm f/8.
**kitchen** a just-cleaned stainless sink and faucet without water spots, white ceramic backsplash, a streak-free quartz
counter, a cobalt microfibre cloth folded on the sink edge, a plain unlabelled glass soap bottle, 50mm f/4, no hands.
**bath** white subway tile, a clear glass shower screen without water marks, a white vanity with a polished chrome tap,
folded warm-grey towels, a small plant on a frosted-window sill, 28mm f/8. **bed** crisp white linen and an oatmeal
throw, plumped pillows, an oak nightstand with a ceramic lamp, a wool rug with fresh vacuum lines, sheer curtains,
28mm f/8. **living** a linen sofa with straightened cushions, an oak coffee table with one small stack of books, a jute
rug, a tidy bookshelf, a cobalt ceramic vase as the only strong colour, 24mm f/8. **entry** white stair risers wiped
clean, a polished oak handrail, a swept hardwood floor, a bench with shoes lined up underneath, two jackets on hooks,
side-window daylight, 28mm f/8.

### Missing on purpose: a Mossgate before/after

The brief's before/after section is left out of Mossgate because there is no matched pair, and an unmatched pair
would mislead. Generation spec if the owner wants it:

- Start from `mossgate-kitchen` (or a new same-room "after" shot) and make the "before" as an **edit** of it: same
  camera, lens, framing, light and props, tripod-locked.
- Change only what a cleaning visit fixes: water spots and a soap ring on the sink, crumbs and a coffee ring on the
  counter, a crumpled towel, a few dishes in the basin, a smudged backsplash. Ordinary lived-in mess, not filth.
- No people, hands, brands or text. Both halves get the "Example images" tag, as on Fernway.
- Wire it with `src/components/demo/BeforeAfter.astro` (already shared with Fernway).

## Lantern Row Barbers

| Master | Shows | Used on |
|---|---|---|
| `lantern-hero` | The empty shop at dusk: oxblood chairs, brass wall lamps, mirrors, a blue street window | Home hero (`LanternHero.astro`) |
| `lantern-part` | A side part, combed over with light pomade, seen from behind | Classic Cut; gallery Side part |
| `lantern-fade` | A drop fade under a curly top, from behind | Skin Fade; gallery Drop fade; Marcus's bio |
| `lantern-beard` | A full beard squared at the jaw, profile cropped below the eyes | Cut + Beard; gallery Full beard; Julian's bio |
| `lantern-crop` | A textured crop, head turned away | Kids Cut (labelled as the adult cut, sized down); gallery Textured crop; Eli's bio |
| `lantern-tools` | A still life: straight razor, strop, brush, scissors, hot towel, a brass lantern | Beard Trim |

On the home menu board and style strip the photos have empty alt text, because the service name and the `shows` line
next to each one (`src/data/demos/lantern.ts`) already say what the photo is of. The gallery and barber pages give
each photo its own alt text.

Subject lines (Lantern tail after the four portraits): **hero** the interior of a small neighbourhood barbershop at dusk
from just inside the doorway: three vintage barber chairs in oxblood leather and chrome, brass wall lanterns, charcoal
walls, a cream hexagon tile floor, large mirrors, a dark wood counter with combs and razors, a window at the far end
with blue evening light; empty shop, anamorphic 35mm look, f/2.8, no signage text. **fade** a fresh drop skin fade from
directly behind and slightly to one side, back of the head and neck only, cream cape, charcoal background. **crop** a
textured crop from behind the ear, head turned away, choppy point-cut fringe, cream cape, oxblood wall. **beard** a full
beard in profile framed from the lower lip to the collar so the eyes and nose are out of frame, squared at the jaw,
beard-oil sheen. **part** a classic side part from behind and slightly above, light pomade shine, hard part, folded
cream towel at the neck, warm lantern glow. **tools** a still life on a dark walnut counter: a bone-handled straight
razor half open, a brass-handled brush, a steel comb, scissors, a folded cream hot towel, an oxblood strop at the edge,
lit by one brass lantern from the side, 50mm f/4, low key.

## Quillfern Candle Co.

| Master | Shows | Used on |
|---|---|---|
| `quillfern-hero` | One unlit candle: ivory stoneware jar, copper lid, fern and chamomile on parchment linen | Home hero, unlit state |
| `quillfern-hero-lit` | The same frame, lit, the room a little dimmer | Home hero, lit state (the site's one cinematic interaction, outside the shopping path) |
| `quillfern-cedar-evening` | Lit, on an oak board, cedar shavings, half a bergamot, a vanilla pod | Every candle view (below) |
| `quillfern-amber-hearth` | Unlit, on linen, orange peel curls, cinnamon sticks, a piece of amber resin | Every candle view |
| `quillfern-rain-garden` | Unlit, on a wet slate, rain-spotted leaves, a bundle of vetiver root | Every candle view |
| `quillfern-vanilla-linen` | Lit, on a folded white napkin, a twist of lemon peel, a vanilla pod | Every candle view |
| `quillfern-forest-cabin` | Unlit, on a weathered oak board, a fir sprig, birch bark, two spruce cones | Every candle view |
| `quillfern-quiet-morning` | Lit, on linen, a dish of white tea leaves, a ripe pear | Every candle view |

Candle views: the product page and its "nearby" row, the shop grid, the cart lines, and the home page's scent
families (each family leads with its first candle that has a photo). The "Shows" wording follows the `shows` map in
`CandlePic.astro`, checked against the photos.

Subject lines: **hero** a macro product photograph of a single hand-poured candle centred on parchment-coloured linen:
a straight-sided matte ivory stoneware vessel with a softly uneven rim, about 8 cm wide and 9 cm tall, cream soy wax,
one cotton wick, unlit, a thin brushed copper lid leaning against it, a plain uncoated paper band with no writing,
dried fern fronds, cedar tips and chamomile around the base, north-window daylight from the left, generous empty space,
100mm macro, f/5.6. **hero-lit** an edit of the hero: the same everything, now lit with one small calm flame and a shallow
melt pool, the room a little dimmer so the flame warms the rim and the linen; still bright, not moody, no smoke.
Each candle (an edit of the hero, candle tail after it): "A Quillfern candle called <name>, <lit or unlit>, on
<surface>. Around it: <three props>. <light>." with the surface, props and light from the table above.

## Checked on 2026-11-21

Every master was compared with its alt text on a contact sheet. Fixed that day: three alt texts that did not match
their photos (Fernway snow, Fernway hero, Mossgate hero), the Lantern gallery comment in `src/data/demos/lantern.ts`,
and the after photo's door frame (cropped, above).
