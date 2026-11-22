# Design brief, visuals pass (November 2026)

Decisions approved for the Higgsfield visuals pass; DESIGN.md holds the full system (tokens, type, motion levels).

## Direction

The aim is Apple restraint with the precision of advanced computing, without borrowing either brand's look:

- dark page colour (`--bg #080D17`), Inter and Title Case headings;
- one blue accent (`--link` / `--blue-rgb`), used for actions and focus, not decoration;
- generated imagery looks like **real materials under real light**: machined graphite aluminium, smoked glass, thin
  precise light. Never glowing spheres, holograms, floating interface panels, neon or purple.

## Honesty rules (they come before taste)

- Real client work is shown only from real screenshots. **Chry$:** no generated images of the shop, the work or the
  barber. His street address is never shown.
- Concept films are labelled "Fictional concept demonstration". The films are about made-up brands; no invented client,
  result or endorsement.
- Demo sites are shown from real screenshots of the live demos and named as made-up businesses. A render is never shown
  as a live site.
- AI-made media is labelled as made with AI video tools wherever it is the subject.

## What each surface shows

- **Home (owner's brief 2026-11-17):** audience is owners of small local businesses; the main action is "Get a Free
  Quote" (/contact/), the second is "Explore Our Work". Headline "Websites That Stand Out. / Systems That Save You
  Time." The second line is in `--muted`, so four wrapped lines still read as two statements. Section order since the
  owner's site audit brief (2026-11-21): hero, what we do with starting prices, real work (Chry$ first, then the
  concept strip), levels, one automation demo, why Nuxy, handover, the quote. Questions and video teasers moved off
  home to /pricing/#faq and the Creative Studio.
- **Contact (site audit round 4, 2026-11-21):** the two ways (write it down, ask for a call back) come right under the
  lead, then "What Happens Next" as three short steps, then the form, then the callback form. A phone shows the two
  ways in the first screen and the reassurance before the first field.
- **Home hero (done 11-17):** the H object (H1 still, H3 highlight pass; graphite and titanium with blue channels,
  right half, left 45% calm) is the backdrop; the parts diagram moved below the work. Desktop plays the one 5.5 s
  highlight loop (webm 59 KB / mp4 92 KB) after load; under 1200px it is the H2 portrait still only, never video
  (880w for 2x phones, 1280w above). Reduced motion, data saver and no-JS get the still.
- **Creative Studio hero:** stills from the three concept films, the first one large, with a caption saying they are
  fictional concept films and a link to watch them; the generated screen loop is only a fallback.
- **Web Design hero:** three demo screenshots climbing to the right, one per level, each labelled with
  its level, captioned as made-up businesses.
- **Client card:** the screenshots stand on a darker stage that fills their column, one composed object.
- **After the 11-17 critiques:** the diagram hub is graphite with a titanium rim (no glow) and hides under 640px;
  home shows Chry$ plus two demos; Business alone carries the emphasis (blue rule, solid button); the phone Our Work
  index is one chip row.
- **Backdrops** (`hero`, `automation`, `security`, `web-development`): one matched set from
  `business/creative-studio/higgsfield-pack-2026-11.md`. The subject sits at about 60% across, vertically centred,
  mid-to-low key.

## Media rules

- The poster (the loop's first frame) is the still image that loads first, and it loads eagerly.
- Video is fetched only after the page has loaded. Reduced or light motion, Save-Data and no-JS get the poster only.
  Loops have a pause control.
- Budgets are enforced by `scripts/cinematic-limits.mjs`: loop 1.6 MB, phone loop 0.7 MB, poster 120 KB.
- Originals live in `assets/cinematic/`, which git ignores. Only `scripts/encode-cinematic.mjs` writes to `public/media`
  and the manifest. A slot missing from the manifest renders nothing, so media never shows broken.
- The site never calls Higgsfield; the owner generates by hand, on Unlimited, with zero credits.
