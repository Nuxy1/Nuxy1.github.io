# Video masters

The full-quality videos the site's small files are made from. Nothing in this folder is served: the website only
ever gets what `scripts/encode-cinematic.mjs` writes to `public/media/` and lists in
`src/data/cinematic-manifest.json`.

The video files here are **not in git** (`.gitignore`): they are large, and the owner decides where they are kept.
Keep a copy outside this PC; losing a master means paying to generate it again.

## What belongs here

| File | Used for | Shape |
|---|---|---|
| `hero.mp4` | home hero backdrop | 16:9, 6–8 s, subject on the right, left side dark |
| `web-development.mp4` | `/websites/` hero backdrop | 16:9, 5–6 s |
| `automation.mp4` | `/automation/` hero backdrop | 16:9, 5–6 s |
| `security.mp4` | `/website-security/` hero backdrop | 16:9, 5–6 s |
| `creative-studio.mp4` | the screen on `/creative-studio/` | 16:9, 6–8 s |
| `demo-<id>.mp4` (+ `demo-<id>-vertical.mp4`, `demo-<id>.vtt`) | the three portfolio demos (`demos` in `src/data/creative.ts`) | with sound; captions when anything is spoken |

Backdrop footage is capped very dim on the page (see DESIGN.md, "Cinematic loops"), so dark footage with one clear
light subject works best. No words, logos, faces or real brands in any loop.

## Rules

- Making a video costs Higgsfield credits. It happens only after the owner approves the estimate, by hand, in the
  owner's own account. No script in this repository calls a generation service.
- A retake is a new paid generation: it needs its own yes unless the approved budget already covers it.
- Record every generation in `business/creative-studio/generation-log.md`: date, clip, model, settings, prompt,
  credits, kept or rejected and why.
- Demos are for made-up brands and are labelled "fictional concept demonstration" on the site. Sound must be
  original or licensed; write its source in the log.

## From shots to a demo master

The three demos are cut from several short shots each. The shots (`shots/`), the stills they were made from
(`stills/`) and the music beds are in this folder, not in git. `scripts/cut-demos.mjs` trims the shots, dissolves
between them, sets the words in the site's own fonts, puts the music under them and writes `demo-<id>.mp4` here. It
makes nothing new and calls no generation service; each end card says "Concept demonstration. Fictional brand."

```
PLAYWRIGHT_CORE=<playwright-core folder> BROWSER=<msedge.exe or chrome.exe> node scripts/cut-demos.mjs [id ...]
```

## From master to site

The largest file the encoder lets through (loop, phone loop, demo, poster) is in `scripts/cinematic-limits.mjs`,
which `tests/creative.test.mjs` reads too, so the encoder and the test hold every file to the same numbers.

```
node scripts/encode-cinematic.mjs loop hero assets/cinematic/hero.mp4 --length 6
node scripts/encode-cinematic.mjs demo <id> assets/cinematic/demo-<id>.mp4 --vertical assets/cinematic/demo-<id>-vertical.mp4 --captions assets/cinematic/demo-<id>.vtt
node scripts/encode-cinematic.mjs check
node --test tests/creative.test.mjs tests/cinematic.test.mjs
```

`remove <loop|demo> <id>` takes a video off the site again and deletes its served files; the master stays here.
