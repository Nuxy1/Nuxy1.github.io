# Halvane Audio: immersive redesign (2026-11)

Fictional brand, NUXY Immersive-tier demo. Branch `halvane-immersive-2026-11`. Owner's brief: "HALVANE AUDIO — IMMERSIVE WEBSITE MASTER REDESIGN" plus the skill-orchestration order (both 2026-11-22). Nothing here is deployed, committed or pushed without the owner's word.

## 1. Audit of the page before this work (d0dfa85)

Screenshots and walkthrough: `D:\Work\Business\Nuxy-Halvane-Redesign-2026-11\before\`.

- **Model:** built at runtime from three.js primitives (rounded box, lathe, torus, cylinders). No real driver anatomy: the woofer reads as a black hole, the tweeter as a bead. Verdict: rebuild, not improve.
- **Materials:** one canvas-drawn grain texture tinted orange-red; no normal or roughness detail; metal is flat colour.
- **Lighting:** hemisphere + key + a blue rim that tints the cabinet's left side purple; no environment reflections; a radial-gradient blob for a shadow. ACES at 1.05.
- **Composition:** speaker pinned left at ~60% of the viewport, text right; mobile stacks a small speaker over the text. Generic Inter type, tracked caps eyebrow with middle dots, numbered steps for content that is not a sequence, brass pill buttons, bordered finish cards.
- **Scroll:** an IntersectionObserver picks a "part"; explode is a 0-1 spread. No camera choreography.
- **Kept (verified facts):** every product fact in the old copy and spec list (dimensions, drivers, 45 Hz-22 kHz ±3 dB, 87 dB, 6 Ω, 7.4 kg, $1,180 demo price, 200-pair first run), the three finishes, the demo form behaviour and every fictional-business disclosure.
- **Engineering kept:** load after `load` + idle, never with reduced motion, Save-Data or no WebGL; a run token; dispose on stop; context-loss fallback.

## 2. Art direction: "Sound, made tangible"

The memorable thing is the speaker itself, lit like a photograph in a dark room. Everything else is quiet.

| Token | Hex | Role |
|---|---|---|
| Night | `#100e0c` | page and studio darkness (warm, never blue) |
| Smoke | `#1b1815` | quiet panels, the spec card's back |
| Ivory | `#efe7da` | type and the primary button |
| Ash | `#a39a8c` | secondary text (7.0:1 on Night) |
| Walnut | `#5e3f2b` | finish sample, small warm surfaces |
| Brass | `#b9a27c` | focus ring, active states, hairline details only |

- **Type:** Newsreader Display (opsz 72, 300-500) for headings, set large, light and tight, sentence case. Albert Sans (300-700) for text and controls: Scandinavian-drawn, plain, legible at 15-17 px. Both OFL, self-hosted (`public/fonts/`), 89 KB together; Inter stays only in the shared demo banner.
- **Layout:** left-aligned editorial columns over a full-bleed stage. Desktop: the speaker is framed off-centre by the camera (not by CSS), the copy sits in the empty side. Mobile is its own composition: the stage holds the top 58% of the screen, copy rises below it, camera states have phone framings.
- **Light:** one key (soft box, upper left, 5200 K), a long strip behind for the edge line and a kicker (both 4400 K: at 3600-3800 K their grazing reflection turned the chalk and graphite sides tan, fix 10), a dim 5000 K fill, a floor bounce. No blue light anywhere. Neutral tone mapping (AgX Medium High Contrast, exposure -0.3) so walnut stays brown, not orange.
- **Motion:** one orchestrated reveal on load (the room light comes up on the cabinet). After that, motion answers scroll or touch only: camera moves between named states, finish changes are a lacquer wipe up the cabinet.

Removed after the anti-generic check: tracked caps eyebrows, middle-dot meta strings, 01-05 numbering (the parts are not a sequence), pill buttons, bordered "card" finish pickers (replaced by rendered material samples), the hairline broadsheet spec table (now a printed tuning card).

## 3. Storyboard and camera states

| Act | Camera state | Content |
|---|---|---|
| Reveal | `reveal` | name, line "Built by hand. Tuned by ear.", reserve + see inside |
| Form | `silhouette` | cabinet: 19 mm solid walnut, braced, slot port |
| Engineering | `front-detail` → `driver-macro` | woofer, tweeter, then the back plate and crossover (`rear-detail`) |
| Materials | `material-transition` | three finishes, rendered samples, lacquer wipe |
| Experience | still render | the pair in a room (Blender, same model) |
| Showroom | `showroom` | drag/keys to turn, hotspots, finish, reset |
| Finale | `final-product` | specs card, reserve form, disclosure |

## 4. Skill and tool plan (owner's orchestration order)

| Stage | Skill / tool | What it decides here |
|---|---|---|
| Route | `web-design-router` | BUILD · SIGNATURE · 3D; budgets, tiers A/B/C, quality gate |
| A direction | `frontend-design:frontend-design` | tokens, type pairing, anti-generic revisions above |
| 3D | Blender 5.2 (scripted), Context7 three r181 | canonical model, PBR textures, GLB + Meshopt, real-time scene |
| Motion | `gsap-skills:gsap-scrolltrigger` (GSAP is the scroll engine) | one scrubbed timeline driving named camera states |
| B components | `anthropic-skills:emil-design-eng` | configurator, buttons, hotspots, drag feel |
| C motion | `anthropic-skills:animate` | reveal, wipe and hotspot timing, reduced motion |
| D review | `web-interface-review`, Impeccable critique (≥35/40) | findings, fixes, re-score |
| QA | Playwright (playwright-core scripts), chrome-devtools trace, Lighthouse | screenshots at 1440/1920/768/390/360, video, numbers |

Not used, with reason: React Bits and Magic UI (React + Tailwind components; this page is Astro without React, and none adds to a product page); Higgsfield (every product image must come from the canonical model; atmosphere is rendered in Blender instead, so no paid credits); `img2threejs` (no supplied reference object).

## 5. Skill findings record

_Filled in as each stage runs: what the skill changed, and the rendered result that confirmed it. "Pending" means the page that would show it is not built yet._

| Skill (stage) | What it changed in the work | Verified |
|---|---|---|
| `web-design-router` (route; references `3d`, `experience-tiers`, `performance-budget`) | Classified BUILD, SIGNATURE, 3D. Its rule "the poster is the LCP" is why every camera state has a transparent Cycles poster rendered from the same model and framed by the same `cameras.json` (the poster pipeline in §6). Its texture caps (2048 desktop, 1024 phone) set the texture sizes in the asset table. Its DPR caps (phone 1-1.5, desktop 1-2), the p90 > 22 ms downgrade, offscreen pause and tiers A/B/C are the spec for the `scene.ts` rebuild. | Posters: yes, `model\posters\sheet-all.png` shows all 12 states framed as specified. Texture sizes: yes (asset table). Runtime rules: yes. DPR caps are `scene.ts` `dprCap` (phone 1.5, tier A 2, other 1, row 42). The p90 downgrade (down to 1, then the posters) is in the frame watch. The offscreen and hidden-tab pause is `canRun` with an IntersectionObserver and `visibilitychange` (`scene.ts:936-1008`). Frame numbers in §9, load numbers in §10. |
| `frontend-design:frontend-design` (A direction) | Wrote §2: the six tokens, Newsreader Display + Albert Sans, the off-centre camera framing, and the anti-generic pass that removed tracked-caps eyebrows, middle-dot meta, 01-05 numbering, pill buttons, bordered finish cards and the hairline spec table. | Yes: the rebuilt page renders the tokens, both faces and the off-centre framing at every QA size (`qa\pass4`, `qa\pass4m`, `qa\pass5`). |
| `gsap-skills:gsap-scrolltrigger` (motion engine) | Set how scroll is wired. There is one standalone `ScrollTrigger.create` over the story with `onUpdate` and `onRefresh` only. It has no tween, no scrub state, no pin and no `markers`. Refresh measures the chapter anchors, and update sends the viewport centre through the pure `poseAt`. `ScrollTrigger.refresh()` runs again once `document.fonts.ready` resolves, because the faces change where the chapters sit. A second trigger, from the story's bottom to `max`, turns the header solid; it reads `progress`, not `onEnter`, so a jump past the start (a nav link, a restored scroll) still lands solid. The render loop stops on `pagehide`. | Yes. `halvane-timeline.test.mjs` passes 11/11 (holds, continuity, fast and reverse scroll land on the same pose). The header check is row 36 (`headprobe.mjs`, solid in all six jump and wheel runs). |
| `choreograph` (motion relationships) | Cast the speaker as the lead and the copy as support. On load the stage settles (`hv-settle`, 700 ms, 16 px). The headline overlaps it at 120 ms (600 ms, 14 px), and the lede and buttons follow at 220 ms (500 ms, 8 px), so the lead travels furthest and the support travels less. That is one entrance, not a per-section stagger. On scroll each caption has no timed animation: its fade and 10 px drift come from the same anchor distance as the camera blend (`fadeCaps`), and drift with the scroll direction. The close-up veil follows the same blend (`shade`). On a finish change the wipe on the cabinet is the lead; the radio and label change at once, with no stagger on that often-used control. The part labels only fade (200-240 ms), as decoration. | Yes, on recordings. `qa\pass5\wipe2`: the wipe settles by 660 ms. The §9 frames table shows no frame over 22 ms while the captions and the camera move together. |
| `animation-performance` (frame budget) | 11-23: listed every moving part by driver and property (§12), then traced the one slow frame of the pass 6 walk to its cause (first-use shader compiles in the GPU process, not an animation), so no animation was changed for it. It found one real cost in code: the hotspot projection allocated two vectors per anchor per frame while the showroom is open (row 57). | `walk.mjs` traces in `qa\pass7\` (with GPU and ANGLE categories); tests `timeline` 11/11, `levels` 17/17, `visual` 25/25 after the fix. |
| `review-animations` | 11-23, against its ten standards (§13). It changed three things: a finish picked mid-wipe now reverses or retargets the front instead of snapping it to its end (row 58, its interruptibility standard); hover looks are gated on a fine pointer so they no longer stick after a tap (row 59, its accessibility standard); the still-motion poster swap is a 200 ms crossfade instead of a hard cut (row 60). Checking the retarget found a doubled render loop (row 61). Verdict: Approve. | Yes: `repick.mjs` before and after, `rmcheck.mjs` (mouse and touch, OS reduce and Nuxy Reduced), `rafcount.mjs` before and after; tests `timeline` 11/11 and `levels` 17/17 on the final build. `visual.test.mjs` was not run: the Halvane page is not in its page list, so its baselines cannot change. |
| `web-interface-review` | 11-23, pinned guidelines, against the page and the `DemoSite.astro` layout: six fixes (rows 49-54). Clean already: labels and legend, alt text with decoration aria-hidden, heading order, skip link, image sizes, lazy and `fetchpriority`, font preload with swap, no `transition: all`, no zoom or paste blocking, email field attributes, real buttons, the layout's reduced-motion rule, `scroll-padding-top` for the header, `touch-action: pan-y` on the canvas. The fields' `outline: none` loses to `#main :focus-visible`, so focus stays visible (no change). Report only: the finish is not kept in the URL. | Not checkable from code, so left to the browser pass: caption and tag contrast over posters and 3D, overflow at 360, rendered hit targets, touch drag, scrollbar colour, screen-reader order. |
| Impeccable critique | 11-23, run 1 and run 2, each with a fresh pair of assessors on routed models (§14): both 24/32, about 30/40, below the 35 bar. | Fixes in rows 62-78 and 82; rows 79-81 open, then run 3 with a new pair (§14). |

## 6. Status and next steps (checkpoint 2026-11-22 13:30, before the 14:00 hibernation)

**Latest checkpoint, 2026-11-23 12:30.** The owner's "NUXY Immersive Website Demo" efficiency brief is in. Start with `docs/DEVELOPMENT_EFFICIENCY.md`: it has the diagnosis, the baseline, the repair loop, the sections and the remaining defects. Rows 79-87 are done. QA pass 13 is the visual baseline. Critique run 4 scored 28/32 = 35.0/40 (§14), which meets the bar. Nothing is committed, pushed or deployed, and the Blender MCP is off; all of that waits on the owner.

**Earlier checkpoint, 2026-11-23 about 04:45 (before the 05:00 hibernation).** Since 11-22: rows 62-72 of the fix list (critique fixes, the waveguide tangent fix, the crossover rebuilt with leads, sealed ends, ties and print). The web GLB, the rear-detail posters and `dist` are current (pass 10 shots at 1440, 768, 390 and 1440 reduced in `D:\Work\Business\Nuxy-Halvane-Redesign-2026-11\qa\pass10`, console clean). Full suite 11-23 04:05 and again 04:22 after the run 2 fixes: 197 tests, 185 pass, 2 environment fails (billing, contact-form), 10 skipped. The engine's `nuxy-scroll-cinematic` tests: 11 of 11. Critique run 2 (fresh assessors): 24/32, still below the bar; its page fixes are rows 73-78 and 82, checked in pass 11 (`qa\pass11`, 1440, 390, 360 and 1440 reduced, console clean). Nothing committed, pushed or deployed; the Blender MCP stays off. Next: rows 79-81 (close-up renders, showroom labels, the rest of row 81), then run 3 with a new pair, then row 33's finish residuals, the engine's Phase 4 skill router (tell peer sessions first, it writes to `~/.claude/skills`), and the wrap-up deliverables.

Done (all uncommitted on `halvane-immersive-2026-11`, worktree `C:\Users\power\Freelance-halvane`). Model masters live in `D:\Work\Business\Nuxy-Halvane-Redesign-2026-11\model\` (`M` below); web copies in `public/3d/halvane/`.

- Phase 1 audit (§1, before shots in `D:\Work\Business\Nuxy-Halvane-Redesign-2026-11\before\`), phase 2 direction (§2), storyboard (§3), skill plan (§4).
- Fonts, wired by `@font-face` in `halvane-audio.astro` (near line 203): `public/fonts/newsreader-display-var.woff2` (56,848 B), `public/fonts/albert-sans-var.woff2` (32,020 B).
- Procedural textures, `scripts/halvane/textures.py` (numpy + Pillow, tileable, seeds fixed), sizes in the table below.
- **Canonical model, `scripts/halvane/build_speaker.py`** (Blender 5.2, Cycles HIP on the RX 7900 XT): cabinet 0.21 x 0.33 x 0.26 m with bevels and a front slot port; tweeter (dome, surround, ring, waveguide, can); woofer (frame, trim, screws, surround, paper cone, dust cap, spider); rear plate with brass posts, washers, screws and printed labels; a hand-wired point-to-point crossover inside the plate (two air-core coils at right angles, film caps, ceramic resistors, copper leads, solder fillets, brass standoffs; since row 69 also part leads, sealed cap ends, cable ties and a maker's print); acoustic wadding seen through the opened plate; feet. 24 named materials. Studio: key 5200 K, rim and kicker 4400 K, fill 5000 K, AgX Medium High Contrast, exposure -0.3. **Realism gate: passed** (the 1440 hero no longer reads as a primitive; checked on the stills below).
- **Stills** (the phase 3 deliverable): `M\renders\walnut-{hero,front,macro,side,rear,exploded}.png`, 1440 x 900, 160 samples, re-rendered 13:25 at the locked 4400 K rim (5-6 s each); contact sheet `M\renders\sheet-4400.png`.
- **GLB**: `public/3d/halvane/lumen-one.glb` 1,169,916 B (320,077 B gzip; 24 materials, 40 meshes, 123,995 triangles), made from `M\xo-run-1123\lumen-one-raw.glb` (3,773,008 B; rebuilt for the crossover, row 69; the previous web GLB, 1,133,664 B, is kept in `M\xo-run-1123\prev`) by `npx -y @gltf-transform/cli@4.1.1 meshopt <in> <out> --level medium`. Not `optimize`: it merges the four groups the page animates. Hierarchy verified: LumenOne > Cabinet (cabinet, feet, wadding), Rear (plate, posts, washers, screws, labels, crossover parts), Tweeter, Woofer; 22 materials; extensions EXT_meshopt_compression, KHR_mesh_quantization, KHR_materials_anisotropy / clearcoat / sheen / specular.
- **Contact shadow**: baked in Cycles, `public/3d/halvane/shadow.webp` 11,216 B (0.64 m square). The posters and the live scene lay the same texture under the speaker.
- **Camera states**, `src/lib/halvane/cameras.json`: eight named states shared by Blender and `scene.ts` (convention in the file's `$comment`). Locked today:
  - showroom and material-transition at yaw -38, where the finishes read best;
  - silhouette at yaw -66 (at -90 the side read as a flat brown plank; evidence `M\silhouette\sheet.png`);
  - front-detail at yaw -20 with the camera at 0.6 m, which shows the top and the empty driver cut-outs (evidence `M\frontdetail\sheet2.png`);
  - rear-detail with the plate opened as a service door and its own 4300 K disc lamp.
- **Posters** (the LCP and the no-WebGL / reduced-motion picture): `build_speaker.py --posters` renders transparent squares framed exactly as `scene.ts` frames each state. `scripts/halvane/posters_to_webp.py` fades the outer 7% of alpha (the shadow reached the edge and showed a seam) and writes WebP at 800/1200/1600. 24 posters: all eight states in all three finishes, so the no-WebGL page can show any finish at any state (72 WebP files). Sizes at 1600 px are 57-105 KB; the outermost pixel ring measured alpha 0 on all 72 files (`border.mjs`, 2026-11-22 evening). Check sheet: `M\posters\sheet-all.png`.

Asset record (web copies in `public/3d/halvane/`, bytes):

| Texture | color 2k | height 2k | color 1k | height 1k |
|---|---|---|---|---|
| walnut | 88,356 | 301,154 | 28,292 | 147,818 |
| chalk | 36,368 | 289,898 | 10,558 | 108,020 |
| graphite | 58,854 | 309,030 | 20,698 | 117,060 |
| paper (512) | 1,938 | 66,180 | | |

Open on the textures: the height maps carry most of the weight (~1 MB at 2k for three finishes). Once the scene runs, measure both options (bake a normal map at lower quality, or drop desktop height to 1k) and pick one.

Commands (from `portfolio/site`; `M=D:/Work/Business/Nuxy-Halvane-Redesign-2026-11/model`):

- stills: `blender -b --factory-startup -P scripts/halvane/build_speaker.py -- --tex $M/tex --font $M/fonts/AlbertSans-var.ttf --out $M`
- posters / GLB: add `--no-render --posters <states> [--finish chalk|graphite] [--glb $M/web/lumen-one-raw.glb]`; with another `--out`, add `--poster-shadow $M/web/shadow.png`
- web posters: `python scripts/halvane/posters_to_webp.py $M/posters public/3d/halvane/posters --sheet $M/posters/sheet-all.png`
- room stills: `blender -b $M/lumen-one.blend --factory-startup -P scripts/halvane/build_room.py -- --tex $M/tex --out $M --samples 192 --tag=-desktop --res 2400x1350 --cam=-0.45,-2.6,0.92 --target=0.05,0.3,0.7 --lens 46`; mobile: `--tag=-mobile --res 1200x1500 --cam=-0.85,-1.5,0.8 --target=-0.55,0.3,0.74 --lens 55`. Add `--preview` for a 2.5x smaller, 48-sample draft (about 3 s). A `--tag` value starting with `-` must be written `--tag=-x` (argparse reads `--tag -x` as an option).

Next, in order:

1. ~~Experience still~~ DONE 13:36: the pair on a charcoal ash sideboard in a plaster room, rendered in Blender from the canonical blend through collection instances (no Higgsfield, no paid credits).
   - Light: 4300 K sun through a mullioned window (shadow-only blocker), 6500 K skylight bounce at 80 W, so the sun patch is warm and the shadows neutral-cool. A 4600 K bounce read sepia; 7500 K read cold (`M\renders\room-sheet3.png`).
   - Desktop: 2400x1350, both speakers, focus on the sunlit left one. Mobile: 1200x1500, a separate composition, one speaker close with the books.
   - Web: `public/3d/halvane/room/room-desktop-{2400,1600}.webp` (52 / 28 KB) and `room-mobile-{1200,800}.webp` (36 / 20 KB), WebP q90; no banding at 1:1 in the wall gradient.
2. ~~Scroll engine~~ DECIDED 13:38: a small custom timeline over `cameras.json`, not GSAP.
   - The camera pose is a pure function of scroll position: chapter centres are cached on resize; the pair of states either side of the viewport centre is blended with a hold zone (about 20%) around each state. Fast and reverse scroll cannot desync because no tween state is kept.
   - The stage is CSS `position: sticky`, so native scroll stays native (no pinning, no hijack). One passive scroll listener feeds the existing rAF loop, which eases the drawn pose toward the target (critically damped) and sleeps when it arrives.
   - Interpolated per state: yaw, position, target, fov, shift, explode, hatch, lamp power; a portrait viewport uses each state's `portrait` fov and shift.
   - Why not GSAP: it is not installed, it would be a new third-party dependency (the router needs the owner's yes), and ScrollTrigger adds about 45 KB gz for work this page does in about 80 lines.
   - Built 13:39: `src/lib/halvane/timeline.ts` (`poseOf`, `blend`, `locate`, `poseAt`), tested by `tests/halvane-timeline.test.mjs` (7/7: every state complete with a portrait framing, holds, continuity, fast and reverse scroll, clamping, portrait, explode / hatch / lamp). Node 24 strips the types, so the test imports the `.ts` directly.
   - **Revised later on 11-22: GSAP 3.15.1 + ScrollTrigger now own scroll.** The owner's "NUXY Ultimate 3D & Immersive Design Engine" brief names the split ("ScrollTrigger gives progress, GSAP owns the timeline, three renders"), which settles the dependency question above. The pure timeline stays: on refresh ScrollTrigger measures each chapter's middle (the anchors), on update the viewport centre goes through `poseAt` to the scene, the posters and the caption fades. Still no pin, no hijack, no per-frame framework state; `halvane-audio.astro` near line 400.
3. ~~Rebuild `src/lib/halvane/scene.ts`~~ DONE (calibrated in §8, interaction-tested in §9), keeping every pattern `tests/levels.test.mjs` matches:
   - loading and look: GLTFLoader + MeshoptDecoder, PMREM room environment, AgX, textures by material name;
   - finishes: swap the `wood_*` material, with the finish wipe;
   - camera: the camera states with the projection shift, explode, the hatch pivot, the state lamp, rim and kicker at 4400 K;
   - showroom: drag with inertia, limits and touch; keys; reset; hotspots;
   - robustness: tiers A/B/C, context loss, dispose.
   - Written 13:48 (first draft, not yet run in a browser): new API `setPose`, `setFinish(f, wipe)`, `preload`, `setInteractive`, `nudge`, `reset`, `setPaused`, `dispose`; studio PMREM from the four poster softboxes plus a shadowing directional key on tier A; wood shader patched for two finishes (height-mixed roughness, wipe over world y); explode, hatch hinge, rear lamp, projection shift, drag inertia, frame-time downgrade. rolldown bundle OK: 158 KB gz with three (budget 600). Open: light gains `ENV_GAIN`, `KEY_LUX`, `LAMP_GAIN` and the bump weights are guesses until compared side by side with the posters.
   - 13:50 first browser run (scratchpad harness: rolldown bundle + a static server over `public/`, Chromium 1254 on D3D11): loads in about 1 s, no errors; yaw, projection shift, hatch hinge, rear lamp and wood textures match the posters. Brightness against the posters (mean display luma of the object, pixels above 40): gains 0.1 / 2.2 / 0.12 gave reveal 62.0 vs 90.6 and rear 71.8 vs 102.9; doubled to 0.2 / 4.4 / 0.24 gives reveal 72.9 vs 90.6, rear 96.9 vs 102.9. Colour balance already matches (R/G 1.36 live vs 1.34 poster). Still open: highlights are weaker (p90 101 vs 128 on reveal), so the key's specular needs work; compare at matched framing.
   - Evening 11-22: these guesses are replaced by the measured calibration in §8 (tone map, light gains, wadding, roughness, bump).
4. ~~Redesign `src/pages/example-sites/halvane-audio.astro`~~ DONE (QA passes 4 and 5):
   - wire the fonts;
   - make the poster `<img srcset>` the LCP;
   - keep the `.hv-stage` / `.is-3d` / `[data-canvas]` contract;
   - update the reduced-motion `svg` assertion on purpose.
5. ~~Update the portfolio entry (`src/data/demo-sites.ts`, `scripts/example-shots.mjs`) with real screenshots.~~ Done 11-23 (row 47).
6. Test and QA:
   - tests one file at a time, then the production build;
   - QA at 1440x900, 1920x1080, 768x1024, 390x844 and 360 wide, on every tier, with two correction passes;
   - console, Lighthouse and a trace; a walkthrough video.
7. Review and close-out:
   - `web-interface-review`, the Impeccable critique (35/40 minimum), then polish;
   - the design brief (300-600 words), §5, the deliverables report.

## 7. Fix list

| # | Found | Fix | State |
|---|---|---|---|
| 1 | First walnut too dark (#40291c), figure blotches ignored the grain | colour bands follow the warped rings (`along_rings`), lighter ramp; mean now #5e422d | fixed |
| 2 | Graphite showed knot-like "eyes" | smaller ring warps, patchy early-wood darkening | fixed |
| 3 | Pyright: `Image.LANCZOS`, unused `rng`/`ring` | `Image.Resampling.LANCZOS`, parameters removed | fixed |
| 4 | Rear labels unreadable at poster size | labels drawn with a dedicated "print" material | fixed |
| 5 | Exploded view pulled the rear plate out as a floating fin | Rear removed from the explode offsets (drivers only) | fixed |
| 6 | Opened rear showed a black void | acoustic wadding inside + a per-state disc lamp for rear-detail | fixed |
| 7 | Crossover looked like toy parts | rebuilt point to point: air-core coils at right angles, film caps, resistors, leads, solder fillets | fixed |
| 8 | Wadding rendered blocky | smooth shading on its faces | fixed |
| 9 | Flat coil read as a dark donut | coils rebuilt with winding ridges and end cheeks | fixed |
| 10 | Chalk and graphite sides rendered tan / brown; the finishes read two-toned | Test sheets isolated the cause: textures were uniform, and rim power and position were ruled out, leaving the rim at 3600 K and the kicker at 3800 K. Both are now 4400 K, and walnut still reads warm (`M\rimtest2\sheet*.png`) | fixed |
| 11 | Poster shadow reached the square's edge, a seam over the page | alpha faded over the outer 7% in `posters_to_webp.py`; border alpha measured 0 | fixed |
| 12 | Pyright: `Image.NEAREST` / `Image.LANCZOS` in the poster script | `Image.Resampling.*` | fixed |
| 13 | Silhouette at yaw -90 read as a flat brown plank | yaw -66 | fixed |
| 14 | front-detail (yaw -14, 0.3 m) hid the driver cut-outs; side lit near-white | yaw -20, camera at 0.6 m | fixed |
| 15 | §2 still described a warm rim strip | corrected to the 4400 K rim / kicker with the reason | fixed |
| 16 | Room preview 1: an orange cast over everything (3000-3500 K sun, world and bounce) | sun 4300 K, world 4800 K, skylight bounce 6500 K (row 20) | fixed |
| 17 | Pale oak sideboard read as flat saturated yellow and dominated the frame | charcoal-stained ash (graphite texture, #d9d2c8 tint), darker floor | fixed |
| 18 | Grey cylinder vessel read like a third-party smart speaker | lathe-turned stoneware bottle vase with an open mouth | fixed |
| 19 | Speakers too small in the first framing; no mobile composition | 46 mm desktop framing; separate 1200x1500 mobile framing on one speaker | fixed |
| 20 | Final candidate still read sepia: warm sun and warm bounce left no colour contrast | skylight bounce 6500 K / 80 W (warm patch, cool shadows); focus moved to the sunlit speaker (`--focus`) | fixed |
| 21 | `--tag -vA` failed: argparse took the value for an option | `--tag=-vA`; noted in the commands | fixed |
| 22 | Timeline hold returned `a + (b - a) * 1`, which missed the state by a rounding error (0.30000000000000004) | `poseAt` returns the state itself when the eased progress is 0 or 1 | fixed |
| 23 | Live shadows drew hard rims around the drivers: r181's PCF soft filter is a fixed 3x3, while the key is a 1 m softbox | `VSMShadowMap`, 1024 map over 0.6 m, blur radius 12 (about a 7 mm penumbra); tier A only | fixed |
| 24 | Live render flatter than the posters: three's AgX has no "Medium High Contrast" look | custom tone map: a 49-entry curve fitted to Blender's own transform plus saturation 1.06; worst 4.1/255, mean 1.1/255 on 48 colours (§8) | fixed |
| 25 | Wood roughness read from the raw height, not through Blender's Map Range (0.10-0.72) | the same remap in the roughness shader chunk | fixed |
| 26 | Wadding behind the rear door glowed (luma 158 vs the poster's 112): three does not shadow environment light inside the cabinet, and `envMapIntensity` was a no-op (three applies it only to a material's own `envMap`) | explicit `envMap` at 0.12, sheen x0.25 at roughness 1, normals eased halfway to their mean, rear lamp gain 0.18: luma 112 (since the rim fix, row 27: `envMap` 0.25, lamp 0.24, still 112) | fixed |
| 27 | With physical light gains the cabinet's side and front ran dark (reveal side 40 vs 69). A first fix (key 9, rim strip x1.75) only traded the error between faces | Cause found: the rim strip lived only in the PMREM environment, which has no parallax, so its highlight landed as if the strip were infinitely far away, and the lower half of the strip sat under the env floor. The strip is now a `RectAreaLight` at its real place and size (three's LTC), clipped at the floor, at its physical gain 1, and the clear coat gets the same LTC term (`HV_PHYSICAL_PARS`). Key 10.5, lamp 0.24. Error against the posters 11.2 → 7.1 (weighted rms over 3 finishes x 2 stops); over the whole frame, the worst third of each shot went from a mean error of 7.0-9.1 luma to 4.2-5.6 (§8) | fixed |
| 28 | Bump 0.5 broke the walnut side panels into single-pixel pore glints | bump halved for all three finishes, Blender's ratio kept (chalk later lowered to 0.3, row 34). All three finishes checked side by side with their posters at 1:1 (`qa/pass3/final1`, 11-22 night): no glints. Graphite at 1.0 and 1.4 only made the grain busier and did not bring back the poster's sparse pale pore flecks, so 0.7 stays (`qa/pass3/var7/cmp/gb.png`) | fixed |
| 29 | A `scene.ts` comment claimed the live render sits "within ~8 lightness points" of the posters; the reveal side is 11 under | comment rewritten with the measured numbers | fixed |
| 30 | This doc was stale: "twelve posters" (there are 24), old walnut texture sizes, "not GSAP" | corrected in §6 | fixed |
| 31 | A black Y-shaped tick on every top corner, in all three finishes and in both renderers | `build_speaker.py` tested "inside" per axis, and the middle faces of each 8-segment bevel sit 3.4 mm in on all three axes, so they took the port finish. Now `shell_depth()` (signed distance to the rounded box) decides, for the material and the UVs alike. GLB, 24 posters and the blend rebuilt (backups `*.pre-cornerfix*` in `M`) | fixed |
| 32 | Live rear-detail: a hard grey blotch in the wadding and down the back panel; the poster has a soft shadow | Under VSM, three r181 draws every *receiver* into the shadow map, so the open door's crossover board printed a hard shadow (a 7 mm penumbra against Cycles' 1 m softbox). The open door now leaves the map (cast and receive off), and its shadow is traced in the shader as a soft rectangle (`hvOut`). The wadding also sees the key, lamp and studio only through the opening (`hvThru`, `hvSpan`), and the opening's own walls are shaded the same way (`HV_WALL`, port material inside the tunnel only). Wadding shadow core 6 / lit 168 / rim 94 against the poster's 3 / 173 / 85 (walnut; chalk and graphite match) | fixed |
| 33 | The finishes don't land alike against their posters: chalk's sides run 9-15 bright; walnut's and graphite's reveal side 9-11 dark; graphite's tops 8-9 dark | Ruled out by test: the clear coat following the pores, which Blender does for walnut and graphite (patched in, 0.2 luma change, not shipped); a stronger graphite bump (1-2 points, busier grain); a lower key (7.6 or 9 darkens every top). Untested: how three and Cycles layer the clear coat over the base; chalk carries the heaviest coat (0.35) and is the one that runs bright. Seen side by side, every finish reads as the same object under the same light (`final1/sheet-a.png`, `sheet-b.png`) | open, documented (§8) |
| 34 | At 1:1, chalk's side panel was speckled with dark pores where the poster shows fine satin lines | Chalk's bump 0.45 → 0.3 (Blender's 1.8x ratio dropped for chalk only). All 12 measured cells unchanged; whole-frame worst third at chalk's reveal 4.2 → 4.1 luma. `qa/pass3/var8/cmp/chalk.png`: poster, 0.45, 0.3, 0.2. Walnut's grain checked the same way and left alone | fixed |
| 35 | QA pass 3 found one console warning at 1440x900 (also in passes 1 and 2): `warning X4122: sum of 0.996094 and -2.98545e-017 cannot be represented accurately in double precision`. It is the Windows ANGLE (D3D11) shader compiler noting three's own `UnpackDownscale = 255. / 256.` constant in `packing.glsl`, logged by three as a program info log: harmless, not ours to change. The same log also carries `warning X4008: floating point division by zero` (passes 1-4): traced on 11-22 (`WEBGL_debug_shaders`, program `PMREMGGXConvolution`) to three's `vec3 T1 = lensq > 0.0 ? vec3(-Vh.y, Vh.x, 0.0) / sqrt(lensq) : vec3(1.0, 0.0, 0.0)`; PMREM fixes the view direction at (0, 0, 1), so `lensq` folds to 0 and HLSL, which evaluates both sides of a ternary, warns about the side the ternary then discards. No NaN reaches a pixel; also three's, also left alone. Looking into it showed a real gap: a shader that fails to compile or link only gets logged by three, so the page would have shown a blank stage | `scene.ts` sets `renderer.debug.onShaderError`: a failure during mounting makes `mountSpeaker` dispose and throw, so the page keeps the still images; one after mounting is handled as a lost context. `qa/tools/shaderfail.mjs` (every program forced to report a failed link): control reaches 3D; the forced run never does, canvas and tools stay hidden, the still shows, one Halvane warning, no retry while scrolling. A failure after mounting was not forced (no later program compile to hook) | fixed |
| 36 | At 390 wide, the header past the story let what scrolled under it show through | The header's solid layer (`.hv-head::before`) is fully opaque `--night`, switched on by the story's ScrollTrigger once it has started. `qa\tools\headprobe.mjs` at 390x844 and 1440x900, reaching the page end and the reserve form by a jump and by wheel steps: solid in all six, layer opacity 1. Crop `qa\landfit2\390-end-head.png` | fixed |
| 37 | The woofer close-up (`driver-macro`) fills the screen, so its caption sat on the lit cabinet | `.hv-veil`: the light falls off on the caption's side, as the poster's edge fade does; its opacity follows the camera's blend into and out of the close-up (`locate`, as `poseAt`), and on a portrait screen the caption's own scrim does the job instead. `qa\tools\capcontrast.mjs` (text shot against the same frame with the text hidden), worst background pixel under each line: 1440x900 heading 11.74:1, body 9.48:1; 1024x768 12.36 / 9.89; 390x844 11.18 / 9.18 | fixed |
| 38 | On near-square landscape screens (1024x768, 1000x900, 1280x1024) the speaker ran under its caption. First cause: one shift limit for every screen. Second cause, seen after the first fix: the fit only knew the closed cabinet, so the pulled-out woofer touched the tweeter caption and the open hatch was cut at the left edge | The renderer and the poster draw each state's shift as given; the page fits the landscape states per screen (`fitCaptions`): `fitLandscape` keeps the speaker inside the band beside its caption (32 px gap; the showroom over all 24 turns), and only ever widens the field of view. `reach()` in `timeline.ts` gives the points that must stay clear: the cabinet's corners, the drivers' rings moved out by `EXPLODE`, and the rear plate turned about `HINGE` by `HATCH_DEG`, from `build_speaker.py`'s sizes; `scene.ts` now reads those three constants from `timeline.ts`, so the drawing and the fit cannot drift apart. The fov at 1024x768: tweeter 19 → 22.9, crossover 16 → 20.1; 1440x900 and 1920x1080 are unchanged. Shots `qa\landfit2\sheet-land.png` (1024x768, 1280x1024, 1000x900, 3D and poster) and `sheet-port.png` (390x844, 768x1024): every part clear of its caption and on screen. Tests: `reach`, `fitLandscape` over five screens and every state, `fitPortrait` against `reach` | fixed |
| 39 | Over the story the header is see-through, and its small grey text failed contrast where something bright passed under it: the woofer close-up (360: "Audio" 1.7:1 at worst; 768: "Specs" 2.0; 1024: "Finishes" 1.9) and the room's lit wall (768: nav 3.5; 1024: "Audio" 3.3) | The header's gradient moved to its own layer (`.hv-head::after`, 104 px): 0.94 to 0.88 night where the text sits, then a soft fall-off below the bar, so it reads as a vignette, not a band; it fades out when the solid layer comes on. `qa\tools\headcontrast.mjs` (new: hides the header's text, shoots the background, reads each text's line boxes) at every chapter stop and three room positions. Worst after: 360x780 5.61, 768x1024 5.55, 1024x768 5.52, 1440x900 6.15 (3D); posters 390x844 6.23, 1440x900 6.22. Shots `qa\pass4\shade-sheet.png`, `shade-sheet-m.png`. Timeline 11/11, levels 16/16, site 22/22 | fixed |
| 40 | The footer's two demo links pointed at `#rooms` and `#warranty`, which don't exist on the page (found by `qa\tools\interact.mjs` D, which follows every in-page link) | the footer carries `id="hv-foot"` and both links point at it, the convention the other demo pages use; the click still shows the "on a real site" note and the page does not move (1440, 768, 390) | fixed |
| 41 | The finish wipe answered a click late: it eased in with a smoothstep from 4 cm under the cabinet's base, so 85 ms after the click 0% of the new finish showed and 200 ms after only 5% (`qa\tools\wipe.mjs`, `qa\pass5\wipe`) | ease-out (full pace at the start, settling at the top), the edge starts on the base, 1.1 s → 0.9 s: 27% at 85 ms, 47% at 211 ms, 94% at 473 ms, settled by 660 ms (`qa\pass5\wipe2`) | fixed |
| 42 | On phones the canvas drew 1 device pixel per CSS pixel, so the product read soft on a 3x screen (`qa\pass5\dpr`) | `dprCap` in `scene.ts`: phones start at 1.5, tier A desktops at 2, other tier B screens at 1; the frame watch steps down to 1 before it gives up to the posters. `frames.mjs` at 1.5 on 390x844: p99 3.7 / 3.7 / 7.2 ms at CPU x1 / x4 / x6, no frame over 22 ms (§9) | fixed |
| 43 | Shader links blocked the page: Lighthouse mobile TBT 3,110 ms, desktop 830 ms. `glprobe.mjs` (wraps the GL calls) at 1440x900 found `getProgramInfoLog` taking 724 ms in all, with two stalls of 331 and 327 ms. Two causes: a draw while `compileAsync` was still pending made three link that program on the spot, and the PMREM's GGX filter (300+ ms) linked synchronously inside `fromScene` | a `ready` gate: nothing draws until `compileAsync` resolves, then one `draw()` and a `wake()` for whatever the observers asked for meanwhile. `warmPmrem` builds the PMREM's blur and GGX programs with `compileAsync` first, bound to its own target so the keys match. After: 7 calls, 38 ms in all at 1440x900, none over 2 ms at 390x844. `levels.test.mjs` checks the order and that three's private PMREM fields still exist | fixed |
| 44 | The model and the first finish's textures were only requested after the environment was built | `const assets = Promise.all([...])` starts the GLB and the first finish before the PMREM work and is awaited after it; its share of the change is not measured on its own (the §10 runs include it) | fixed |
| 45 | Each 2k texture was uploaded by the first draw that used it (`texSubImage2D`, 30+ ms each), so the first frame carried all of them, and a finish swap carried its two inside the wipe's first frame | `upload()` runs `renderer.initTexture` one texture per task before the first draw (first finish, paper, contact shadow) and before a wipe starts. Phone profile at 4x CPU: long tasks 235 ms in all, longest 169 ms, before; about 130 ms, longest about 90 ms, after (the uploads still cost 115 to 124 ms, now split). `levels.test.mjs` checks both call sites | fixed |
| 46 | `tier.ts` said tier 2 runs "CSS-only motion, no canvas loops", but the Halvane page runs its 3D on tier 2 (tier B), and the tier 3 list left out 2G, low cores and the 4 GB line | comment rewritten to say what the code does; no behaviour change | fixed |
| 47 | The portfolio and level pages still showed the old Halvane design (`public/images/examples/halvane-audio-*.webp`), and the `demo-sites.ts` entry described the old page | entry rewritten to match the rebuilt page (no invented specs); `node scripts/example-shots.mjs halvane-audio` remade all five widths from the built page with the model rendered (desktop 23 KB, phone 23 KB), then rebuilt; both pictures looked at 11-23 | fixed |
| 48 | `tests/levels.test.mjs` passed 17/17 but never exited. A top-level `await import("../astro.config.mjs")` sat after the browserless tests and before the hooks, so node ran `after()` while `before()` was still launching the browsers; `after()` closed nothing, and two Edge processes plus the dist server kept the process alive | the host is read inside `before()`, so every hook and test is declared before anything runs. Proved with a minimal repro (late hooks after a top-level await: `after` before `before`, hung; moved: in order, exits) and on the file: tests 1-6 exit in 16.9 s, the whole file 17/17 exits in 21.6 s. The other test files' top-level awaits come before their first test or hook, so they are not affected | fixed |
| 49 | The reserve form's field edges were 0.24 ivory, about 1.8:1 against the section: below the 3:1 a field boundary needs (WCAG 1.4.11) | border raised to 0.42 ivory (about 3.25:1 computed) | fixed (rendered check in the browser pass) |
| 50 | Under 3D the shown poster is only faded, so it stays in the accessibility tree as the stage's description (the canvas is aria-hidden), but its alt stayed on the chapter and finish it had when 3D took over | `altNow()` rewrites the shown poster's alt when the chapter or the finish changes under 3D; the redundant `toLowerCase()` dropped | fixed, verified 11-23 in Edge at 1440 and 390 under 3D (`qa/pass6/pass6.txt`): after Chalk is picked in the materials chapter, the materials, side and reveal posters all read "in chalk" |
| 51 | Numbers could wrap away from their units ("19 mm", "45 Hz", "7.4 kg", "200 pairs") | `nb()` in the frontmatter joins a number to the word after it in the step texts and specs; `&nbsp;` in the two paragraphs | fixed |
| 52 | A dark page with no `color-scheme` at the root: light scrollbar and light native control chrome | `:root:has(> body.hv-body) { color-scheme: dark }`; the Nuxy bar, drawer, toast and pill all set their own colours (checked in `DemoSite.astro`) | fixed, verified 11-23 (`qa/pass6`): root `color-scheme` is dark at all five sizes; the drawer renders #0e1311 / #eef2ef with scheme dark, opens with focus on Close, Escape closes it and focus returns to "About this demo" |
| 53 | The Nuxy "Reduced" motion setting (tier 3 without the media query) still played the poster and headline entrances | `html[data-tier="3"]` turns those three animations off | fixed |
| 54 | Small ones from the same review: `.hv-link` had no hover state; the logo could be machine-translated ("Audio"); tap-highlight flash on buttons, tools and swatches; a straight apostrophe in the woofer alt; the sent note read "Demo only — nothing was sent" where the other demos say "Demo only: nothing was sent." | underline turns ivory on hover (hover devices only, 200 ms); `translate="no"` on both logos; tap highlight off; ’; wording matched | fixed |
| 55 | The engine inventory (`D:\Work\Business\NUXY-3D-Studio\docs\inventory.md`) said the Blender MCP security review was written, but the file did not exist | Review written from the source at commit a5a8acf (11 findings, each line cited and re-checked by script; nothing installed or run), recommendation "keep it off", approval request in its §6 | fixed 11-23 |
| 56 | Touch targets under 44 px on tablet and phone (WCAG 2.5.5 advisory; all passed the 24 px minimum of 2.5.8): the wordmark link 24 px tall, the header Reserve button 40, the nav links 41-43 | `.hv-mark` gets 10 px block padding offset by a negative margin (same layout, 44 px hit area); nav links padding 11 px; on `pointer: coarse` the small button is 44 tall and nav links 44 wide. Re-measured at 768, 390 and 360: nothing under 44 except the shared layout's skip link (42, keyboard focus only, left as is) | fixed 11-23 |
| 57 | The showroom's hotspot projection made two new vectors per anchor every frame (`camPos.clone()`, `w.clone()`), which is garbage for the collector on a phone | One shared vector (`tmpD`) and an in-place `project`; the per-frame loop allocates nothing but the small result objects | fixed 11-23 |
| 58 | A second finish picked while a wipe was running made the running wipe jump to its end first: 60% of the whole walnut-to-chalk change in one sample for a third finish, 55% for the first finish picked again (a plain wipe's biggest sample is 19%) | The wipe runs in legs (`aim`, `scene.ts:778`): picking the finish it came from reverses the front from where it is, picking its target again resumes it, and a third finish hurries the running leg to its end (about twice the pace) and then starts its own wipe from a queue (`scene.ts:788`). Re-measured (`qa\pass7\repick-after2` and a second run): going back peaks at 18-24%, a third finish at 31-36% on the hurried leg, and every run ends 0.0% from its target | fixed 11-23 |
| 59 | Hover colours were gated on `(hover: hover)` or not at all, so on a touch screen a tapped control kept its hover look: the Reserve button stayed light, and the brass edge on the showroom's Turn button read as a toggle that had switched on | Every hover rule on the page is inside `@media (hover: hover) and (pointer: fine)` (nav, buttons, text link, finish names, showroom tools, footer). `qa\tools\rmcheck.mjs` at 390 with touch: button and tool unchanged after a tap; at 1440 with a mouse: both change on hover | fixed 11-23 |
| 60 | With still motion (OS reduced motion or the Nuxy Reduced setting) a finish change swapped the poster with a hard cut, because the layout's global reduce rule cuts every transition to 0.01 ms | A 200 ms opacity crossfade for the poster frame only (`halvane-audio.astro:280-281`), which reduced-motion guidance allows (opacity, no movement). `rmcheck.mjs`: transition `opacity 0.2s` under both, sampled frames go 0.00/1.00 → 0.44/0.56 → 1.00/0.00 | fixed 11-23 |
| 61 | Found while checking row 58: the queued wipe starts inside the frame's `step()`, whose `wake()` asks for a frame, and then `frame()` asked for another one, so two render loops ran per frame until the wipe ended, and `stop()` could cancel only one of them | `frame()` asks for the next frame only when none is pending (`scene.ts:1009`). `qa\tools\rafcount.mjs`: animation-frame callbacks per frame during a queued wipe 2.81 before, 1.93 after (a plain wipe is 2.02: the scene loop plus GSAP's ticker; idle 1.02) | fixed 11-23 |
| 62 | At 320 px wide the header's links pushed the page sideways (horizontal scroll) | the middle links (`.hv-mid`) hide below 360 px (`halvane-audio.astro:254`); no sideways scroll at 320 in pass 7 | fixed |
| 63 | Critique 2026-11-23, P1: at 768 the portrait caption scrim stopped mid-screen (a visible seam), and on phones the hero lede sat over the port | the caption box spans the hold so its scrim reaches both screen edges; the hero speaker is fitted between the headline and the lede (`fitCaptions`); checked at 390, 360 and 768 in pass 7 | fixed |
| 64 | Critique P2: the reserve ending did not say what was being reserved | a summary (`.hv-sum`: finish, demonstration price, first run of 200 pairs) beside the form; the finish line follows the picker | fixed |
| 65 | Critique P2: on phones the showroom labels collided and covered the drivers, and the help copy named arrow keys on touch | a label that would overlap one already placed is not shown (`placeTags`); the help copy is chosen by pointer type (`how3d`) | fixed |
| 66 | Critique P2: the Chalk swatch showed one colour, though Chalk has oak sides | two-tone chip, lacquer front and oak side | fixed |
| 67 | Critique P3: the nav was hidden under 600 px, the turn buttons gave no spoken outcome, and the room caption fell below the fold at 768 | Finishes, Specs and Reserve stay in the phone nav (only `.hv-wide` hides); a polite status line reports each turn; the room picture is capped at 66svh | fixed |
| 68 | Critique P1: inside chapters. On phones "The woofer" framed the tweeter, and "The tweeter" was led by the exploded woofer | steps now map the woofer to the exploded front view (the woofer leads it) and the tweeter to a macro re-aimed on the tweeter (`cameras.json` driver-macro: target on the tweeter centre, fov 15.5, portrait 13.5); its posters re-rendered in Cycles for all three finishes (about 30 s each); alt text and the "Drawn apart" note moved with them; pass 8 shots at 390, 768, 1440 and 1440 reduced | fixed |
| 69 | Critique P1, rest: the crossover reads toy-like (plain saturated parts, no leads from the parts, a hook-up wire running into a resistor's side, no print) | `build_rear`: every cap and resistor now has leads leaving the middle of its end faces and bending down to a solder joint; the hook-up wire was re-routed to those joints (one fillet per point, so none z-fight); the film caps got sealed epoxy ends, a cable tie with its locking head, and a slightly duller wrap; each part carries a small maker's print (`HALVANE MKP`, `HALVANE`: no values, since the page states none). New materials `epoxy` and `ink`; `label()` takes a placement matrix. Rear-detail posters re-rendered for all three finishes (about 10 s each), GLB re-exported (row 88 line). Pass 10 at 1440 and 390: the parts read as real components; console clean at 1440, 390 and 1440 reduced | fixed |
| 70 | The browser tests failed with "browser not found" in this worktree | tests need `PLAYWRIGHT_CORE` (the global @playwright/cli's playwright-core) and `BROWSER` (chromium-1254); command in §14 | fixed (process) |
| 71 | Seen at the new macro (pass 8): the live tweeter waveguide showed a fan of fine radial streaks that the Cycles poster does not have. The GLB carries no tangents, so three derived one per pixel from screen derivatives, constant across each lathe facet | `scene.ts` computes vertex tangents at load for every anisotropic (brushed) mesh: waveguide, woofer trim, rear plate. The lathe's u runs round the axis, matching Blender's radial tangent. Pass 9 at 1440: smooth, and it now matches the poster; console clean at 390, 1440 and 1440 reduced; full suite 185 pass, the 2 known environment fails, 10 skipped | fixed |
| 72 | Critique P1, rest: in the rear view the cabinet seems to float; its rounded bottom edge catches light and reads as a gap, with no dark contact line under it | measured on the pass 10 shot at 1440 (columns x 420, 520, 620): right under the edge the page drops to luminance 1-3 and recovers to the open background's 14 over about 60 px, so the contact shadow already reaches black and a darker one cannot show. The impression comes from the lit round-over on the bottom edge, which the Cycles poster has too (the cabinet stands on 4 mm feet). No change; noted for the re-score | checked, no change |
| 73 | Critique run 2, P1: the specs said "Measured in our listening room with the grille off" for a product that does not exist and has no grille. The figures themselves come unchanged from the original live page (d0dfa85), so they stay | the specs lede now says Lumen One is fictional and these are design figures, not test results; the dust covers and tuning card read "would come with" | fixed (pass 11) |
| 74 | Critique run 2, P1: no fiction notice on screen during the story (the demo bar scrolls away) and the last chapter's $1,180 had no demonstration label | a small "Fictional brand" line under the wordmark in the sticky header, checked at 1440, 390 and 360; "(demonstration price)" added to the last chapter | fixed (pass 11) |
| 75 | Critique run 2, P2: with 3D off the showroom said "Have a look around" but offered nothing to do | the heading reads "The finished speaker" by default and switches to "Have a look around" only when the 3D tools show (and back in `stop()`); the help line no longer repeats the heading | fixed, checked in a browser 3D and reduced |
| 76 | Critique run 2: "Turned right." said nothing about what is now in view | after the turn settles (700 ms) the status line adds "In view:" and the labels that are showing; repeats clear the timer | fixed, checked: button and arrow key both announce |
| 77 | Critique run 2: the port-near-the-wall point was made twice (cabinet chapter and room); the crossover had no "for illustration" note although its back panel is drawn open | cabinet copy now says only where the bass leaves; a "Back panel opened for illustration." note under the crossover chapter | fixed (pass 11) |
| 78 | Seen in pass 11: the specs lede ended on one lone word | `text-wrap: pretty` on the copy blocks (captions, room, specs, reserve) | fixed |
| 79 | Critique run 2, P2, renders: the crossover close-up turns the walnut orange and the wool reads as a blob; the woofer state frames both drivers; the tweeter macro's top edge is soft (depth of field). The tweeter caption itself reads cleanly over the desktop veil (pass 11) | render and camera work (`cameras.json`, `build_speaker.py`, poster re-render) | fixed (verified in row 84) |
| 80 | Critique run 2, P2: showroom labels: the tweeter label covers its own dot and the dome; on phones 2 of 4 labels show, with an empty band | row 83 | fixed |
| 81 | Critique run 2, H1: no chapter or progress cue and no `aria-current` in the nav; "Inside" hidden on phones; the Graphite chip has low salience; the footer is thin | the nav now marks where the reader is (row 82); the Graphite chip in row 84. Considered and left as they are: "Inside" on phones (measured: the bar needs about 421 px with it, so at 390 the Reserve button runs 7 px off screen and at 360 it runs 36 px off; the Inside chapters begin straight after the hero, whose own "See inside" link jumps there) and the footer (the mark, two service links and the fictional-brand line close a one-product page; more links would be filler) | fixed (two parts left as they are, with reasons) |
| 82 | Row 81, first part | an IntersectionObserver on a zero-height line at the middle of the screen sets `aria-current` on Inside (cabinet to crossover chapters), Finishes or Specs, in every tier; the marked link turns ivory with a thin brass underline. Checked at 1440 (3D and reduced) and 390: hero, room, showroom and reserve mark nothing, the rest mark the right link; console clean | fixed |
| 83 | Row 80 | `scene.ts`: the driver anchors moved to the ring's outer rim (tweeter 0.93, woofer 0.78 across), each front driver gained a mirrored left anchor for a label on the left, and the cabinet anchor moved low on the side panel. `placeTags`: each label takes the first free place of right of its dot, left from the mirrored rim, then a row up or down (two at most) on a thin brass elbow, slid back on screen when it would run off an edge; dots, labels and leaders are all obstacles. A scratch check (`tagcheck.mjs`) at 1440x900, 390x844 and 360x780 over rest, three turns right, reset and three turns left: 0 overlaps, 0 labels or dots off screen, 0 leaders crossing a label, console clean; phones now show 3 front labels at rest instead of 2 | fixed |
| 84 | Row 79 check, the Graphite chip and a stale test (efficiency brief, 11-23) | Row 79 verified on the posters (front-detail shows the woofer alone, the wool is grey fibre, the tweeter is sharp at f/8) and live: `livepost.py` puts the live speaker within 0.3 luma of its poster in rear-detail; in pass 12 the woofer is not clipped at 390x844 and 360x780 (first bright column 13 and 12 px from the edge); `vdiff.py` against pass 11 shows only shots 03 and 05 changed. The Graphite chip (`.sw-graphite .hv-chip`) was a near-black neutral (#2a2725 mid) while the stained ash renders warm brown-grey (posters: front #625145, side #4a392c); it now runs `#5f4e42 → #48392e → #33281f`, checked in the swatch row at 1440x900 and 390x844, console clean. `levels.test.mjs` (shader warm-up) matched the exact first-upload list and failed once row 79 added the wool maps; it now requires the first finish, paper and shadow in that upload and checks the order (last compile, upload, ready); 1 of 1 passes. The Impeccable hook reads its config from the worktree root, so the two Halvane font ignores were added there too (file-scoped), which stops the repeat findings on every page edit | fixed |
| 85 | Efficiency brief: why the fixes repeated, and the workflow that stops it (11-23) | `docs/DEVELOPMENT_EFFICIENCY.md` is now the entry point: the measured diagnosis (14.6 h active, about 90% of it model turns; 147 compactions; the big files re-read 100 to 250 times), the 2026-11-23 baseline (files, hashes, a reverse-checked patch, pass 12 shots; 185 tests pass, 2 environment-only failures), the repair loop (targeted capture, find the owning layer, smallest fix, build + vdiff + one test file, a new method after two failed attempts), the frozen parts, the remaining defects and the model guidance. The silhouette's +9 luma (live vs poster) is left by choice: that state has no lights of its own, so a fix would move the 7 chapters that match | done |
| 86 | Critique run 3 findings (26/32, 11-23) | H2: the steps and the last chapter now read as design intent, not as a shipped product ("A planned first run of 200 pairs at $1,180 a pair (demonstration price)"). H1: the nav spy also marks the Reserve button (a brass ring) and keeps Finishes current over the room, the showroom and the last chapter; a brass progress hairline (`--hv-p`) runs under the bar through the story and hides once the bar turns solid. H9: an inline email error (`:user-invalid`, tied to the field by `aria-describedby`). H8: `scroll-margin-top: 64px` on Specs and Reserve, clear of the bar. Labels: `scene.ts` now reports each driver's projected front face, and `placeTags` treats it as an ellipse obstacle for the other parts' labels (on a 360 px phone the cabinet's label had flipped onto the woofer) and, once a label steps off its row, for the inner 70% of its own face; on a stacked phone the showroom labels also keep below the caption and its 56 px scrim, read live because the caption scrolls in before its hold. The label check was itself wrong: it measured at `scrollIntoView` start, 96 px before the hold (DemoSite's `scroll-padding-top`); it now measures at the resting point. Checks: labels 0 faults, none missing, all 8 turns at 1440, 390 and 360 (sheets read by eye); 18 shots within 1.5% of pass 12 (`qa\r86`, 1440 and 390, console clean); nav, progress and email checked in the DOM at 1440 and 390; timeline 11/11, levels 17/17, site Halvane 1/1 | done |
| 87 | Critique run 4 cheap findings (28/32, 11-23) | H6/H8: the brass label dot vanished on the brass tweeter ring and the woofer rim, and the label chips lost their shape off the model. The dot now has a dark 2 px ring inside its brass halo, and the chip an inset ivory hairline (the turn buttons' edge; inset, so the box `placeTags` measures is unchanged). H2: the room heading said "shelf" over a sideboard; it is now "At home by the wall", which matches the photo and the paragraph. A first try, "Made to live by the wall", wrapped to two lines at 360 and moved the photo (vdiff 15.9%), so it was replaced. The label check moved from the session scratchpad to `qa\tools\labels.mjs`. Checks: labels 0 faults, none missing, 8 turns at 1440, 390 and 360 (`qa\r87-tags`, 1440 R3 and 360 R1 read by eye); room and showroom at 1440, 390 and 360 within 1.5% of pass 13 (`qa\r87`, console clean); site Halvane 1/1 | done |

## 8. Live render calibration (2026-11-22 evening and night)

The Cycles posters are the reference: they come from the same blend, lights and camera states as the GLB. The live scene is tuned until it matches them at the same viewport, not until it looks good on its own.

**Method.** The built page (`dist`) is served locally and opened in Edge on ANGLE D3D11 (the RX 7900 XT) at 1440x900, DPR 1. For each stop the page is scrolled to the chapter's middle and shot twice: live 3D, and the poster mode (`?tier=3`). Three regions per stop are averaged and reduced to luma (Rec. 709 weights on the mean sRGB display values, 0-255). Reveal: cabinet side, front-left edge, top. Rear-detail: cabinet side, top, the wadding behind the door. Every variant is a literal patch of `scene.ts`, built, shot, measured, then reverted. Shots and scripts sit under `D:\Work\Business\Nuxy-Halvane-Redesign-2026-11\qa\` (written `qa\` below): the first pass in `qa\tune\` with its scripts in `qa\tools\first-pass\` (`sweep.mjs`, `qa-one.mjs`, `stats.mjs`, `remeasure.mjs`), the second pass in `qa\pass3\` with its scripts in `qa\tools\` and every variant's patch list in `qa\tools\variants\`.

**Tone map.** Blender renders with AgX plus the "Medium High Contrast" look at exposure -0.3; three r181 ships AgX without looks. `scripts/halvane/agx_mhc_sample.py` (run inside Blender 5.2) samples Blender's own OCIO transform: a 241-point neutral ramp and 48 test colours. `scripts/halvane/agx_mhc_lut.mjs` fits the ramp to a 49-entry curve that replaces three's contrast polynomial and keeps three's inset and outset matrices. With a 1.06 saturation lift the live chain lands within 1.1/255 on average, 4.1/255 at worst. Re-running both scripts reproduces the table in `scene.ts` exactly (checked 11-22). `EXPOSURE` 0.81 is -0.3 EV.

**Lights.** A Cycles area light of P watts over area A has radiance P / (pi A). The key, the kicker and the fill enter the PMREM studio environment at that radiance (`ENV_GAIN` 1 is the physical match). The environment is rendered from the cabinet's middle (`STUDIO_TARGET`, 0.17 m up) and has a dark floor plane, as the cyc does. The key is split: half in the environment, half as the shadow-casting directional light (`KEY_ENV_SHARE` 0.5).

**First pass (evening): the rim strip inside the environment too.** Walnut only, shots in `qa\tune\`:

| Variant | Reveal side | Front-left | Top | Rear side | Rear top | Wadding |
|---|---|---|---|---|---|---|
| Poster (target) | 69 | 77 | 96 | 53 | 106 | 112 |
| Physical gains (key 7.6) | 40 | 64 | 86 | 42 | 99 | 158 |
| Rim strip 2x | 63 | 64 | 100 | 66 | 113 | 158 |
| Rim strip 3x | 82 | 65 | 112 | 86 | 125 | 158 |
| Key 9, rim 1.75x, wadding env 0.12 | 58 | 70 | 99 | 61 | 113 | 125 |
| + lamp gain 0.18 | 58 | 70 | 99 | 60 | 112 | 112 |
| + bump 0.25 (the evening ship) | 57 | 70 | 99 | 60 | 112 | 112 |
| Rim strip 4x (rejected) | 98 | 70 | 124 | 97 | 135 | 113 |

Every row was re-measured from the saved shots (`remeasure.mjs`, same rectangles) and matches. No gain fitted both side faces. The two "side" regions are mirror faces (the reveal +x face and the rear-detail -x face) with the same world normal (0.819, 0, 0.574) and almost the same camera, so the environment lit them alike (57 and 60) while Cycles splits them (69 and 53). The evening ship matched their mean and neither face.

**Cause, found at night.** The rim strip is nearly all the light the sides get (they face away from the key and the lamp), and it reaches them as a near mirror reflection. From the top of a side the mirror direction meets the strip just above the floor; from lower down it meets the part of the strip below the floor, which the cyc hides. So Cycles shades each side bright at the top and dark at the bottom, and the higher rear-detail camera sees its side darker. An environment map is one view from one point at infinite distance, so it cannot show either effect. The fix:

- the strip is a `RectAreaLight` at its real place and size, evaluated per pixel by three's LTC tables, shortened to the part above the floor, at its physical gain 1 (`scene.ts`, the comment above `RectAreaLightUniformsLib.init()`);
- three's area lights skip the clear coat, so `HV_PHYSICAL_PARS` (a patched `lights_physical_pars_fragment`) adds the coat's reflection of the strip with the same tables, at the coat's own normal and roughness;
- then the key's direct half, the rear lamp and the wadding were re-set against the posters.

**Second pass, all three finishes.** Shots in `qa\pass3\`, 1440x900, every row re-measured from the saved shots by `qa\tools\measure.mjs` (same rectangles as the first pass). Each finish cell reads rear side, rear top, reveal side, reveal top. The score is sqrt(sum of w x error² / 9) over those twelve cells, with w 0.5 / 0.25 / 1 / 0.5; lower is better. Rows from "gain 1.2" to "key 7.6" each change one thing against the "gain 1, key 9" row.

| Variant | Walnut | Chalk | Graphite | Walnut front edge | Wadding | Score |
|---|---|---|---|---|---|---|
| Posters (target) | 53 106 69 96 | 124 217 134 214 | 50 89 67 80 | 77 | 112 | 0 |
| Evening ship, rim in the environment (`finish5`) | 62 112 57 99 | 152 218 150 214 | 55 86 51 76 | 70 | 100 | 11.2 |
| Rim as an area light, gain 1, key 9 | 54 101 60 91 | 139 214 143 212 | 47 77 56 69 | 73 | 101 | 7.6 |
| Rim gain 1.2 | 61 104 68 94 | 147 216 151 214 | 53 79 63 71 | 73 | 101 | 8.7 |
| Rim gain 1.4 | 67 107 75 96 | 154 217 158 215 | 59 81 70 73 | 73 | 101 | 11.8 |
| Rim gain 1.8 | 79 112 88 101 | 166 220 169 218 | 70 85 83 77 | 74 | 101 | 19.2 |
| Rim gain 2.4 | 94 118 104 108 | 178 223 181 222 | 84 91 98 83 | 74 | 101 | 28.7 |
| No coat term | 52 101 57 91 | 135 214 138 212 | 44 76 52 69 | 73 | 101 | 8.1 |
| Environment without its floor | 55 101 61 91 | 143 214 146 212 | 47 77 56 69 | 73 | 101 | 8.4 |
| Environment rendered from the origin | 55 100 61 89 | 142 215 145 213 | 47 75 56 67 | 70 | 100 | 8.5 |
| Kicker as an area light too | 54 100 60 86 | 139 216 142 214 | 47 73 56 62 | 73 | 101 | 8.6 |
| Kicker and fill as area lights | 53 100 60 87 | 134 217 138 215 | 47 73 56 63 | 73 | 101 | 7.7 |
| Key 7.6 (its physical value) | 54 98 60 87 | 139 212 143 209 | 47 74 56 67 | 68 | 99 | 8.3 |
| Key 10.5 | 54 105 60 94 | 139 216 143 214 | 47 79 56 72 | 78 | 103 | 7.1 |
| + lamp 0.24 (`final1`) | 54 106 60 94 | 139 217 143 214 | 47 80 56 72 | 78 | 112 | 7.1 |
| + chalk bump 0.3 (shipped, `var8\cbump0.3`) | 54 106 60 94 | 139 217 143 214 | 47 80 56 72 | 78 | 112 | 7.1 |

The kicker and fill as area lights scored no better (7.7 against 7.6) and each costs a per-pixel LTC evaluation, so they stay in the environment. For the wadding, lamp 0.22 gave 109 and a wadding environment share of 0.32 gave 105 (at lamp 0.18); lamp 0.24 lands on 112.

Shipped: `ENV_GAIN` 1, `KEY_ENV_SHARE` 0.5, `KEY_LUX` 10.5, the rim strip as a `RectAreaLight` at gain 1, `LAMP_GAIN` 0.24, `WADDING_ENV` 0.25, `EXPOSURE` 0.81, and chalk's bump at 0.3 (below). The front edge, the wadding and the tops of walnut and chalk land within 2 points of their posters, and the two side faces now split the same way as in Cycles (walnut 60 / 54 against 69 / 53). Over the whole frame (`qa\tools\framediff.mjs`, poster against live over the poster's covered pixels), the worst third of each of the six frames had a mean error of 7.0-9.1 luma before the area light and 4.2-5.6 after; the chalk grain change moved chalk's reveal from 4.2 to 4.1.

**What still does not match.**

- The key runs 1.4x over its physical value. At 7.6 (the "key 7.6" row) every top sits 4-7 points under the shipped value and up to 15 under its poster. Why the extra light is needed is not isolated.
- The finishes do not land alike (fix list row 33): chalk's sides run 9-15 bright; walnut's reveal side runs 9 dark; graphite's reveal side runs 11 dark and its tops 8-9 dark.
- Tried at night and not shipped (`qa\pass3\var7\`, generated by `qa\tools\vfj.mjs`):
  - the clear coat following the pores, as Blender does for walnut and graphite: patched in correctly, the frame moved 0.2 luma at most, score unchanged;
  - with keys 9 and 7.6 on top of it: score 7.5 and 8.2;
  - graphite bump 1.0 and 1.4: score 6.9 and 6.8, but the grain turns busy and the poster's sparse pale pore flecks still don't appear, so the bump stays 0.7.
- Not tested: how three and Cycles layer the clear coat over the base. Chalk carries the heaviest coat (0.35) and is the one that runs bright.

**Seen, not only measured.** `qa\pass3\final1\sheet-a.png` and `sheet-b.png` set tier A, tier B and the poster side by side, one row per finish and stop (sheet-a: reveal and rear-detail; sheet-b: material-transition and showroom). `crop-side.png` shows chalk's and graphite's side panels at 1:1, poster against live, at reveal and material-transition. Every stop reads as the same object under the same light as its poster. At 1:1 two differences showed:

- Chalk's live panel was speckled with dark pores where the poster shows fine satin lines. Chalk's bump went from 0.45 (Blender's 1.8x walnut) to 0.3: every measured cell stayed the same and the speckle is gone (`qa\pass3\var8\cmp\chalk.png`: poster, 0.45, 0.3, 0.2; at 0.2 the lines start to fade). Walnut's panel was checked the same way: its grain matches, and its only gap is the warmer, darker tone measured above. Fix list row 34.
- Graphite's poster shows sparse pale pore flecks in the coat that the live panel does not (`qa\pass3\var7\cmp\gb.png`: poster, shipped, bump 1.0, bump 1.4). Not fixed (row 33).

**Cost.** The rect light adds three's LTC tables to the scene chunk: 848.6 KB raw, 257.9 KB gzip (budget 600 KB gzip); the page script is 47.9 KB gzip (budget 170). Vite still prints its 500 KB raw chunk warning for the scene chunk, which only loads after the poster, on tiers A and B. Mobile frame time with the rect light is still to measure (QA pass 3).

**Tools.** `qa\tools\` holds the second-pass scripts, copied out of the session scratchpad: `run-qa.sh` / `qa-shots.mjs` (viewport sweep), `finish-qa.mjs` (finish shots), `variants2.mjs` (patch, build, shoot, measure, restore), `measure.mjs`, `framediff.mjs`, `sheet3.mjs`, `gz.mjs`, `vfj.mjs`; `qa\tools\variants\` holds every variant's patch list (`vf-a.json` to `vf-l.json`) and `qa\tools\first-pass\` the first pass's scripts. `variants2.mjs` restores `scene.ts` but does not rebuild, so run `npm run build` after it.

## 9. Interaction QA (pass 5, 2026-11-22 night)

Built page (`npx astro build`, served from `dist` by `tests/serve-dist.mjs`), Edge on D3D11. Tools in `D:\Work\Business\Nuxy-Halvane-Redesign-2026-11\qa\tools\`, output in `qa\pass5\`. Every console was clean (the filter drops only driver-level X4008 / GPU-stall / ReadPixels / GL_CLOSE_PATH / SwiftShader lines).

`interact.mjs`:

- A, showroom at 1440x900, mouse. A 168 px drag to the right moves the front labels right (tweeter +112 px, woofer +132 px; the cabinet label hides as its face turns away), so the speaker turns with the hand. ArrowRight turns it the same way (+83 / +80). "Reset view" puts every label back to the pixel. The wheel over the canvas scrolls the page (8775 → 9175): the canvas never holds the scroll.
- B, showroom at 390x844, touch (CDP touch events). A sideways swipe turns the speaker (+148 / +143) and the page stays put (8233 → 8233); an upward swipe scrolls the page (8233 → 8482). No trap on a phone.
- C, `?tier=2` (tier B): `data-tier=2`, the 3D stage comes up, reveal, rear-detail and showroom render.
- D, every in-page link at 1440x900, 768x1024 and 390x844: each target heading lands below the header (e.g. `#specs` at 264 / 192 px, `#reserve` at 263 / 300 / 176 px). The footer's demo links show their note and the page does not move (row 40). The skip link is the first Tab stop and is on screen; Enter, then Tab, lands on "Reserve a pair" inside `main`.

`wipe.mjs` (finish swap at the material-transition chapter, 1440x900):

- Progress of walnut → chalk over the cabinet, measured against the before and after frames: 27% at 85 ms, 47% at 211 ms, 74% at 341 ms, 94% at 473 ms, 100% at 659 ms (row 41; before the fix 0% / 5% / 25% / 43% / 81% / 100% at 85 / 201 / 333 / 472 / 662 / 903 ms).
- Graphite, then walnut 60 ms later: lands on walnut with 0.0% left of graphite; radio, select and the cabinet label all say walnut.
- The reserve form's select drives the same choice (graphite: radio, select and label agree).
- Reduced motion: posters, as designed (line 5 of the page); the swap is instant (100% at 120 ms) and the label follows.
- Tier C at 390 (touch): the graphite poster replaces walnut's, label and controls agree (`qa\pass5\wipe\poster-graphite-390.png`).

`frames.mjs` (frame cadence while the whole story scrolls in 9 s, rAF deltas in the page; this PC's RX 7900 XT through D3D11 with the CPU slowed by CDP, so a phone's GPU is not simulated, and the headless browser is not vsync-locked):

| Run | Canvas px per CSS px | p50 / p90 / p99 / max (ms) | Frames over 22 ms | Downgrade or poster fallback |
|---|---|---|---|---|
| 1440x900, tier A | 1 (window DPR 1) | 3.6 / 3.6 / 3.8 / 25.1 | 1 | none |
| 1920x1080, tier A | 1 | 3.6 / 3.6 / 3.8 / 10.9 | 0 | none |
| 390x844 phone, CPU x1 (before row 42) | 1 | 3.6 / 3.6 / 3.7 / 14.3 | 0 | none |
| 390x844 phone, CPU x4 (before row 42) | 1 | 3.6 / 3.6 / 3.8 / 11.7 | 0 | none |
| 390x844 phone, CPU x1 | 1.5 | 3.6 / 3.6 / 3.7 / 9.0 | 0 | none |
| 390x844 phone, CPU x4 | 1.5 | 3.6 / 3.6 / 3.7 / 9.5 | 0 | none |
| 390x844 phone, CPU x6 | 1.5 | 3.6 / 3.7 / 7.2 / 15.0 | 0 | none |

The rect light and the 1.5 cap cost nothing measurable on this GPU; on a real phone the frame watch is the guard (p90 over 22 ms for 2 s: down to 1, then the posters). A real mid-range phone has not been measured.

## 10. Load performance (2026-11-22 night to 11-23)

Lighthouse 13.6 (global npm), Playwright's chromium-1254 headless on D3D11, against the built page served from `dist`; `qa\tools\lh.mjs <outdir> [path] [mobile|desktop]`, reports in `qa\lighthouse\`. Mobile uses Lighthouse's simulated throttling (slow 4G, 4x CPU), so its LCP, TBT and TTI are model estimates, not timings from a phone. One run per row; scores move a few points between runs.

| Run | Mobile perf / TBT / LCP / TTI | Desktop perf / TBT |
|---|---|---|
| Before rows 43-45 | 62 / 3,110 ms / 3.3 s / 10.9 s | 72 / 830 ms |
| After rows 43-44 (shader links, fetch overlap) | 88 / 260 ms / 3.1 s / 8.7 s | 96 / 160 ms |
| After row 45 (texture uploads) | 86 / 270 ms / 3.3 s / 8.6 s, CLS 0 | 99 / 80 ms, LCP 0.6 s, TTI 1.0 s |
| Pass 6, 11-23, after rows 46-56 (three runs; `qa\pass6\lh*`) | 71-73 / 770-950 ms / 3.1-3.2 s / 9.2-9.4 s, CLS 0 | 99 / 90 ms, LCP 0.6 s |

Why pass 6's mobile TBT is higher than the row above, though the 3D start path did not change: almost all of it is one task, the idle callback that starts the 3D. Its first synchronous step, `webgl()` in `tier.ts`, creates the page's first WebGL context, and in a fresh browser the first context waits on the GPU process setting up ANGLE/D3D11. Lighthouse wraps `requestIdleCallback` on throttled runs, so the task is filed under `_lighthouse-eval.js` (`cbWrap`), and its simulated time is the observed time times four. Measured on this PC on 11-23 (`qa\tools\glprobe.mjs`, chromium-1254, the same flags): first context 247 ms, every later context 4-6 ms. The 11-22 run had the same task at about 41 ms observed (164 ms simulated); pass 6 had 175-190 ms (769 ms simulated). The page's own long tasks matched across runs (page script 91 / 83 ms, scene 128 / 122 ms). So the gap is how quickly this PC's GPU process warms up, not a regression. Whatever creates the first context pays this cost: without the probe, three's renderer would pay it one step later. Running it in an idle callback after `load` is the right place, and starting the 3D on the first scroll would move the stall onto the user's first gesture.

Accessibility 100 and best practices 100 in every run. SEO 66 is by design: every demo page carries `noindex,nofollow` (`DemoSite.astro`, and `sitemap.xml.ts` leaves them out) so a fictional brand never shows up in search.

What is left, and why it stays:

- Mobile LCP. The LCP element is the reveal poster (`walnut-reveal-1200.webp`, 66 KiB, `fetchpriority="high"`, in the first HTML). Observed, it paints at 289 ms; the 3.3 s is the simulation. A plain demo page with no 3D (`/example-sites/quillfern-candles/`) measures 2.7 s simulated / 378 ms observed on the same set-up, so most of the gap is the font and poster bytes on a slow-4G model, not the 3D, which only starts after `load` and an idle callback.
- Image delivery says 32 KiB of the poster could be saved. The page sets the poster's `sizes` to its drawn width (490 px on a 412 px phone, because the portrait crop runs past the screen), and at 1.75x that asks for 858 px, so the browser takes the 1200 variant; the 800 one would be under-resolved. A 1000 px variant would save about 18 KiB per finish and state; not done, the gain is small next to the poster pipeline change.
- Unused JS: 191 KiB of `scene.js` and 66 KiB of the page script are not run before the scene starts. They are the 3D and the story code, loaded after `load`; splitting them further would add requests for no visible gain.
- The build's chunk-size warning (over 500 kB) is `scene.js` with three inside it. It is loaded by a dynamic import only on tiers 1-2 with WebGL, never on tier 3 or without JavaScript, so it is left as one chunk.
- `valid-source-maps` is informational: the build ships no source maps (Astro's default), which keeps the demo's source out of the public files.
- three is untyped here: `@types/three` is not installed and `src/lib/halvane/three.d.ts` declares its modules as `any`, so the editor cannot check the scene's three calls (the build uses esbuild, which does not type-check, and is clean). Adding `@types/three` at the pinned version is a dev-dependency change left for the owner.

## 11. Pass 6 QA, trace and walkthrough (2026-11-23)

The built page after rows 46-56, Edge on D3D11, one job at a time. Output in `D:\Work\Business\Nuxy-Halvane-Redesign-2026-11\qa\pass6\`.

- `pass6.mjs` at 1440x900, 1920x1080, 768x1024, 390x844 and 360x800: no sideways scroll; no control smaller than 24 px, and at 768, 390 and 360 nothing is under 44 px except the skip link (row 56); the root `color-scheme` is dark; the Nuxy drawer opens with focus on Close, Escape closes it and focus returns; heading levels never skip; the hotspot chips are 8.03:1; the product image's alt names the chosen finish; the console is clean.
- `interact.mjs` A-D again: all as in §9. D now measures from after Playwright's own scroll-into-view (the first run's "10698 px" at 390 was that scroll, not the page), and the footer's demo links move the page 0 px at all three sizes.
- Test files: `visual` 25/25, `timeline` 11/11.
- `walk.mjs trace`, 1440x900 (`walk\trace-1440-scroll.json`, opens in the DevTools Performance panel): the whole story scrolled down in 9 s and back up in 3 s. 3,333 frames, p50 / p90 / p99 3.6 / 3.6 / 3.8 ms, one frame over 22 ms (32 ms, on the way down), none over 33 ms. No long task (PerformanceObserver). The main thread was busy 16% of the 12 s, and its longest task was 8 ms. A peer session was running its own browser job at the same time, so the GPU was shared. Headless is not vsync-locked, so these are headroom numbers, not a 60 Hz cadence.
- `walk.mjs video`: `walk\walk-1440.mp4` (48 s) and `walk\walk-390.mp4` (37 s, touch, recorded at 2x). Both have a `.webm` original and a contact sheet. The tour covers the reveal, the five story chapters, all three finishes (mouse) or two (touch), a showroom drag, a label hover, Reset view, the finale, the reserve form, and a fast scroll back up to the reveal. The 3D was live in both, and both consoles were clean. Checked frame by frame: no blank or poster flash between chapters, the finish swap lands on the radio's finish, and the phone showroom's three tags do not overlap (about 6 px between the woofer and cabinet chips).

Report-only, not fixed:
- F12: the chosen finish is not kept in the URL, so a shared link opens on walnut. That is a product decision for a real shop; the demo has no shop.
- The skip link is 42 px tall at 141 px wide. It passes the 24 px minimum and only appears on keyboard focus.

## 12. Animation performance pass (2026-11-23)

Skill: `animation-performance`. Every moving part, by driver and property, then the one slow frame of the pass 6 walk. Output in `D:\Work\Business\Nuxy-Halvane-Redesign-2026-11\qa\pass7\`.

| Element | Driver | Properties | Plays during |
|---|---|---|---|
| Hero settle, headline, lede and buttons (`hv-settle`, `hv-in-1`, `hv-in-2`) | CSS keyframes, once per visit; off under tier 3 | `transform`, `opacity` | load |
| Captions (`fadeCaps`) | ScrollTrigger `onUpdate`, inline style, skipped under a 0.004 change | `opacity`, `transform` | scroll |
| Close-up veil (`shade`) | same update | `opacity`; `--veil` (gradient side) only while it shows, on an element with no children | scroll |
| Poster frames (`placeFrame`) | ScrollTrigger `onRefresh` and a poster swap, never per scroll frame | `--ps`, `--tx`, `--ty` on a frame that holds one image | resize, poster swap |
| Camera pose | three.js rAF while busy, blend `1-exp(-6dt)` | WebGL uniforms | scroll |
| Lacquer wipe | three.js rAF, 0.9 s | `uWipe` and clearcoat values; every finish has clearcoat above 0, so no shader recompile | finish change |
| Hotspot tags | three.js rAF while the showroom is interactive; DOM write only when the rounded positions change | `transform` | drag, keys |
| Finish chip ring | CSS transition, 200 ms | `box-shadow` (paint) on a 36 px chip | hover, check |

Findings, most expensive first:

- **The one slow frame (35.7 ms, at 57% of the scroll down)** is not an animation. `trace-1440-scroll.json` in `walk-gpu\` and `walk-angle\` shows a 37.8 ms GPU-process raster flush, and inside it ANGLE's `D3DCompile` building Skia's rounded-rectangle and gradient shaders for the first time (four compiles, about 24 ms). That is the moment the finish swatches (3 px radius, gradient fill, inset ring) first reach the raster area. The same happens at the 9 s turnaround for the finale's rounded controls (one 12.4 ms compile, a 15.6 ms frame). It is a once-per-cold-cache cost: the scroll back up crosses both places with no frame over 14.3 ms. A pre-decode of the room image before the walk (`PREDECODE`, an A/B switch in `walk.mjs`) gave 28.4 and 25.0 ms, within run-to-run spread, and the room image decodes on a worker after the flush, so the page is not changed for it. Verified from the trace on this PC (RX 7900 XT, D3D11). Other GPUs and backends (Metal, Vulkan, phone GPUs) compile differently and need a recording on the device.
- **Hotspot projection** (`scene.ts`, the `spots` map): two vector allocations per anchor per frame while the showroom is open. Fixed (row 57). Verified from code; no frame drop was measured from it on this PC.
- **Chip ring** (`halvane-audio.astro`, `.hv-chip` and its checked state): a paint-tier `box-shadow` transition, but on a 36 px element and only on hover or a check, never during scroll. `filter: drop-shadow()` cannot draw an inset ring, so it stays.
- **Poster frame variables** (`placeFrame`): layout-tier custom properties, but only on refresh and a poster swap, and the frame holds one child. The trace's style and layout events peak at 0.26 ms and paint at 0.82 ms.
- Everything that runs per scroll frame is `opacity`, `transform` or a WebGL uniform; no state lives in a framework; no `transition: all`; no animated blur.

Not measured: a mid-range phone, and a 120 Hz screen's 8 ms budget on anything but this desktop (p99 3.8 ms here). The frame watch in `scene.ts` (p90 over 22 ms for 2 s drops to DPR 1 and no shadows) is the safety net for those; the walk never triggered it.

## 13. Animation review pass (2026-11-23)

Skill: `review-animations`, its ten standards against every animation in §12's table, then the fixes. Output in `D:\Work\Business\Nuxy-Halvane-Redesign-2026-11\qa\pass7\` (`repick-before`, `repick-after`, `repick-after2`, `tests-after-motion.txt`).

### Part 1: findings

| Before | After | Why |
| --- | --- | --- |
| A finish picked mid-wipe called `completeWipe()` first: the running front jumped to its end, then the new wipe started (60% of the whole change in one sample) | Legs that retarget from where the front is (`scene.ts:778` `aim`, `scene.ts:788` `startWipe`): the first finish again reverses, the target again resumes, a third finish hurries the running leg and queues its own wipe | Standard 6: a control people click quickly must retarget from the current state, never restart or snap |
| `.hv-btn:hover`, `.hv-tool:hover`, nav, finish-name and footer hover colours ungated; `.hv-link:hover` gated on `(hover: hover)` alone | All inside `@media (hover: hover) and (pointer: fine)` (`halvane-audio.astro:242-253, 345, 351, 385`) | Standard 8: on touch a tapped control keeps `:hover`, so the light button and the brass Turn edge stayed on after the finger left |
| Still motion: the poster swap was a hard cut (the layout's global reduce rule sets every transition to 0.01 ms) | `opacity 200ms var(--ease)` on the poster frame only, also under the media query with `!important` (`halvane-audio.astro:280-281`) | Standard 8: reduced motion is gentler, not zero; opacity with no movement is the allowed form |
| `frame()` asked for the next frame even when `step()` had already asked (a queued wipe starting inside `step`) | Asks only when no frame is pending (`scene.ts:1009`) | Two loops per frame while a queued wipe ran, one of them out of `stop()`'s reach |

### Part 2: verdict

**Interruptibility and timing.** Fixed as above. Measured with `repick.mjs` (screenshots of the cabinet as fast as the browser allows, about one every 75 ms; each step is the change between two samples as a share of the whole walnut-to-chalk change):

| Case | Before | After |
|---|---|---|
| Plain wipe (baseline) | biggest step 19% | 18-20% |
| First finish picked again 300 ms in | 55% at 350 ms (the snap) | 18-24%, the front turns back from where it was |
| Third finish picked 300 ms in | 60% at 318 ms (the snap) | 31-36% on the hurried leg, then the new wipe at 20-23% |

Every after-run ends 0.0% from its target finish, and the console is clean. The hurried leg's step is larger than a plain wipe's on purpose: it runs at about twice the pace (`Math.max(0.15, d * 0.45)` seconds for the distance `d` left) so a third pick is not kept waiting. At 0.3 one run measured 36%; at 0.45 two runs measured 31% and 36%, so the difference is inside the sample spacing and the slower 0.45 stays. Animation-frame callbacks per frame (`rafcount.mjs`): idle 1.02, plain wipe 2.02, queued wipe 2.81 before row 61 and 1.93 after.

**Origin, physicality and cohesion.** Pass, no change. Every CSS animation uses the one `--ease` curve (`cubic-bezier(0.2, 0.7, 0.2, 1)`, `halvane-audio.astro:214`), a strong ease-out. Presses scale to 0.98 (buttons, `:247`) and 0.97 (showroom tools, `:352`), never from 0. The wipe is an ease-out quad per leg.

**Durations over 300 ms, each with its reason.** The hero entrance (stage 700 ms, headline 600 ms at 120 ms, lede and buttons 500 ms at 220 ms, `:271-324`) is one entrance per visit, where the skill allows a slower wave. The lacquer wipe is 0.9 s (`WIPE_S`, `scene.ts:295`): it is the product's material changing, the one thing the finish control exists to show, and a person changes finish a few times per visit, not a hundred. Arrow keys on the finish radios also start it; each press retargets the running wipe (above), so key presses never stack wipes, and with still motion the change is the 200 ms crossfade.

**Accessibility.** Fixed as above. `rmcheck.mjs` results: under OS reduced motion and under the Nuxy Reduced setting the stage is still (no 3D), the poster frame's transition is `opacity 0.2s`, and sampled swap frames go 0.00/1.00 → 0.44/0.56 → 1.00/0.00. With a mouse at 1440 the hover media query matches, the Reserve button goes from rgb(239, 231, 218) to rgb(251, 244, 232) and the Turn tool's edge turns brass; with touch at 390 it does not match, and neither changes after a tap.

**Checked and left as they are.** The showroom's keyboard nudge eases toward its target and retargets on each press (direct manipulation, the object turning shows the change). Drag follows the pointer 1:1 with inertia on release. Captions and the close-up veil are tied to scroll position, not timed, and are skipped when still. The header fade reads `progress`.

Tests on the final build: `halvane-timeline.test.mjs` 11/11, `levels.test.mjs` 17/17 (20.8 s). `visual.test.mjs` was not run because the Halvane page is not in its page list.

Not checked: the feel on a real phone (touch hover was checked in Chromium's touch emulation, not on a device), and a screen reader's reading of the radio change during a wipe.

**Decision: Approve.** No feel-breaking motion is left, nothing should be deleted, durations over 300 ms each have a stated reason, the finish wipe is interruptible, reduced motion is honoured, and hover is gated.

## 14. Impeccable critique pass (2026-11-23)

**Run 1.** Two fresh assessors on routed models, never Fable: A reviewed the built page as a designer, B ran the detector. Score **24/32, about 30/40**, below the owner's 35/40 bar. H1 status 3, H2 real world 2, H3 control 3, H4 consistency 3, H5 error prevention 4, H6 recognition 3, H8 aesthetic 3, H9 recovery 3; H7 and H10 n/a (a single-visit showcase, not a task surface).

**Fixed since run 1** (rows 62-68): the 320 px sideways scroll; the portrait caption scrim seam at 768 and the hero lede over the port on phones; a reservation summary beside the form; showroom labels that collided on phones, and help copy that named arrow keys on touch screens; the two-tone Chalk chip; the phone nav, a spoken result for each turn, and the room picture capped so its caption shows at 768; the inside chapters remapped so "The woofer" shows the woofer and "The tweeter" a macro of the tweeter, with new Cycles posters for all three finishes.

**Still open** (row 69): the crossover reads toy-like, and the cabinet seems to float in the rear view. Both need model work in `build_speaker.py`, then a GLB re-export and new rear-detail posters.

**Left on purpose, reported:** the demonstration disclaimer appears about six times (the top bar, the Built by Nuxy pill, the price in the specs and in the reservation summary, the form's small print and its sent message, the footer). The brief requires the fiction to stay obvious, so it stays. The detector's 30 advisory items are colour, radius and type-size values outside the Nuxy portfolio's `DESIGN.md`; Halvane is a separate fictional brand with its own tokens (§2). `.impeccable/config.json` carries a scoped ignore for the two Halvane fonts (Newsreader Display, Albert Sans), limited to `halvane-audio.astro`, so the detector stops flagging them; every other rule still runs on the page.

**Pass 8 QA.** `qa/tools/chapters.mjs` shot all 13 chapter states at 390x844, 768x1024, 1440x900 and 1440x900 with reduced motion (3D off, Cycles posters); the console was clean in all four runs. Shots: `D:\Work\Business\Nuxy-Halvane-Redesign-2026-11\qa\pass8\`.

**Tests in this worktree** need two variables, or every browser test fails with "browser not found":

```powershell
$env:PLAYWRIGHT_CORE = "C:/Users/power/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core"
$env:BROWSER = "C:/Users/power/AppData/Local/ms-playwright/chromium-1254/chrome-win64/chrome.exe"
node --test --test-concurrency=1 --test-reporter=tap tests/*.test.mjs
```

**Run 2 (re-score), 2026-11-23 04:06.** A new pair, not the run 1 assessors: A (Opus) reviewed the built page from the pass 10 shots and the source; B (Sonnet) ran the detector. Score **24/32, about 30/40**, still below the bar. H1 3, H2 3, H3 3, H4 3, H5 3, H6 3, H8 3, H9 3; H7 and H10 n/a. H2 rose from 2 to 3 after rows 62-72.

- A's top finding: the specs were framed as measured ("in our listening room with the grille off") for a product that does not exist. A called the figures invented; they are not: they come unchanged from the original live page (d0dfa85). The framing was the defect, fixed in row 73.
- Also from A: no fiction notice on screen during the story, and an unlabelled price in the last chapter (row 74); a poster-mode showroom that invited exploring with no controls (row 75); a turn status that did not say what came into view (row 76); a repeated port point and no illustration note on the crossover (row 77); close-up render faults (row 79); label overlap and the empty band on phones (row 80); no progress cue, no `aria-current`, and smaller items (row 81).
- B: the Astro source scan exited 0 with 33 advisory items; the `dist` scan exited 2 with 1 warning and 31 advisory items. The warning ("cramped padding" on `.hv-reserve`) is a false positive: the section's padding is `clamp(80px, 10vw, 144px)`. All 64 advisory items are the expected brand-token notes (§2). The live overlay was skipped because the page's CSP blocks it.

**Fixed since run 2** (rows 73-78 and 82, pass 11 at 1440, 390, 360 and 1440 reduced, console clean; shots in `D:\Work\Business\Nuxy-Halvane-Redesign-2026-11\qa\pass11`): the honest specs wording, the "Fictional brand" line in the sticky header, the demonstration label on the last price, the showroom heading that matches what the visitor can do, the turn status naming the parts in view, the crossover illustration note, the single port point, `text-wrap: pretty` on the copy, and a nav that marks the current section (`aria-current`).

**Still open** (rows 79-81): the close-up renders, the showroom labels, and the rest of row 81 ("Inside" on phones, the Graphite chip, the footer). Run 3 waits until they are done, again with a new pair of assessors on routed models.

**Run 3, 2026-11-23.** A new pair: A (Opus) reviewed the built page; B (Sonnet) ran the detector. Score **26/32, about 32.5/40**, still below the bar. H1 3, H2 3, H3 3, H4 4, H5 3, H6 4, H8 3, H9 3; H7 and H10 n/a. B found only the known `.hv-reserve` false positive and the brand-token advisories. A's findings and what became of them:

- Fixed in row 86: copy that read as a shipped product (H2), the nav and progress cues (H1), no inline email error (H9), anchors under the bar (H8), and (a) the cabinet label flipped onto the woofer on a 360 px phone.
- Left as P2, by choice: (b) the empty bands on phones at the room and showroom (390/360-08, 390-05): that is the portrait framing, and moving it changes the camera and poster contract that `livepost.py` checks. (c) Grain behind the 1440 front-detail caption: measured on pass 12, the background behind the body text is p50 14-28 and p90 32-36 luma, about 11:1 contrast. (d) With reduced motion the showroom poster is close to the last chapter's (yaw -38 centred against -35 shifted): a real fix needs new Blender angle posters or poster-mode labels. (e) A flat panel inside the woofer opening at 1440/1920-03: a Blender model fix.

**Run 4, 2026-11-23.** A new pair again: A (Opus) on pass 13, r86-wide and the label shots; B (Sonnet) ran the detector. Score **28/32 = 35.0/40, the bar is met**, with no margin. H1 3, H2 4, H3 4, H4 3, H5 4, H6 3, H8 3, H9 4; H7 and H10 n/a. No P0 or P1. B: no anti-pattern beyond the known `.hv-reserve` false positive and the two brand fonts; no contrast, tiny-text, motion or focus fault. A's twelve P2s and what became of them:

- Fixed in row 87: the label dot lost on the brass rims and the chips' missing edge (H6/H8), and the "shelf" heading over a sideboard (H2).
- Left as P2, by design or because the fix is a camera, Blender or poster change: the progress hairline hands over to the solid header after the story (it measures the story, by design); Finishes stays current over the room, the showroom and the last chapter, and Reserve shows current as a ring because it is a button; phones drop "Inside" (the hero's own "See inside" link covers it); the chosen finish is shown by a ring, a brighter name and the form's summary; labels 8 px apart at 360 L3 (no overlap, checked); the empty band on the phone showroom (run 3 (b)); the opened back panel reads as a black slab, the crossover sits far from its caption at 1920, a woofer fragment at the bottom of the 1440 tweeter close-up, and a blown edge on the reduced front-detail poster (all camera, Blender or poster work).
