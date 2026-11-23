# Development efficiency: Halvane immersive demo

Written 2026-11-23 under the owner's "NUXY Immersive Website Demo" brief. Read this first in any new session on the
Halvane page; search the long fix list (`halvane-redesign-2026-11.md` §7) by row number, don't read it whole.

## 1. Why the hours went into repeated fixes

The numbers come from this session's own log, 2026-11-22 10:11 to 11-23 17:46 UTC. The span is 31.6 h. Taking out
three breaks of 7.1 h, 2.8 h and 6.2 h leaves 14.6 h of active work.

| Measure | Value |
|---|---|
| Time spent running tools (renders, Lighthouse, tests, captures, builds) | 1.5 h of the 14.6 h active |
| Context compactions | 147, median 5 min apart |
| Whole-file re-reads | `scene.ts` 246, `halvane-audio.astro` 229, `build_speaker.py` 113, the fix list 56 |
| Edits | `halvane-audio.astro` 293, `scene.ts` 276, the fix list 151, `timeline.ts` 38, `build_speaker.py` 35 |
| Screenshots viewed by eye | 392 |
| Timed runs (count, average) | Blender 53 (28 s), Lighthouse 23 (53 s), single test files 26 (36 s), QA chapter passes 13 (64 s), builds 28 (22 s) |
| Skill loads | 11 in the whole session |
| Failed tool calls | PowerShell 81 of 1,205, Bash 32 of 475 (quoting through the RTK hook), Edit 9 of 969 |

### The three biggest causes

1. **Context churn.** About 90% of active time went to model turns, not tools.
   - The context filled about every 5 minutes.
   - After each compaction, the large files were read again: `scene.ts` (54 KB), the page (58 KB), `build_speaker.py`
     (55 KB) and the fix list (87 KB, rows of 1,000+ characters).
   - Each re-read cost time and brought the next compaction closer.
   - Viewing 392 screenshots was the other large consumer.
2. **Two renderers for one look.** The speaker is drawn twice: as Cycles posters (reduced motion, tier 3, loading) and
   as the live three.js scene.
   - Every material, light or camera change had to land in both, then be matched by eye.
   - The fix list has 33 rows on posters and renders, 21 on materials and 12 on live-vs-poster calibration.
   - Until 11-23 there was no number for "the live scene matches the poster", so the next critic could reopen any
     calibration.
3. **An open-ended review loop.** The acceptance criteria were never frozen.
   - Each critique round used fresh assessors (by rule), and fix-on-sight added whatever they found.
   - Each fix was checked by eye on a full 52-shot pass.
   - Fixes reopened earlier fixes: the showroom labels took row 80 and then row 83. Row 79 broke a test that only the
     full suite caught, a day later.
   - Critique runs 1 and 2 both scored 24/32 (about 30/40): the fixes moved findings around more than they lifted the
     score.

### Other diagnostic items from the brief

| Item | Finding |
|---|---|
| Repeatedly modified files | The page, `scene.ts`, the fix list, `timeline.ts`, `build_speaker.py` (counts above). |
| Problems fixed more than once | Live-vs-poster calibration (12 rows); renders and posters (33); showroom labels (rows 80, then 83); the row 79 renders stayed open across two critique runs. |
| Regressions introduced by fixes | Row 79's wool textures broke the shader warm-up test, which asserted an exact source string (fixed in row 84). Row 80's labels needed row 83. |
| Complex components | `scene.ts` (1,161 lines); `halvane-audio.astro` (931 lines: markup, CSS and the client script in one file); `build_speaker.py` (1,122 lines). |
| Repeated failed commands | Bash quoting through the RTK hook; `blender` is not on PATH; PowerShell `-Filter` has no character classes; tests run without `PLAYWRIGHT_CORE` and `BROWSER` set fail with "Cannot find module 'playwright-core'" (happened again on 11-23). |
| Slow builds and tests | Nothing slow on its own: a build takes 2 to 5 s warm, the full suite 136 s. The cost was how often full passes and Lighthouse ran, and the screenshots read after them. |
| Unneeded dependency or skill loading | Not a real cause (11 skill loads). No new dependencies were added. |

## 2. Stabilized baseline, 2026-11-23

The baseline lives in `D:\Work\Business\Nuxy-Halvane-Redesign-2026-11\baseline\2026-11-23\`:

| Item | Contents |
|---|---|
| `files\` | The 119 changed or new files under `portfolio/site` (8.3 MB). |
| `MANIFEST.txt` | The HEAD commit, the branch, and a sha256 prefix per file. |
| `tracked.patch` | `git diff --binary` of the tracked changes. `git apply --check --reverse` passes on the working tree. |
| `visual\` | QA pass 12, 52 shots. |

- **Restore one file:** copy it from `files\`.
- **Restore everything:** on a clean HEAD, run `git apply tracked.patch`, then copy in the untracked files.
- **Commits:** none. A local WIP commit on `halvane-immersive-2026-11` would be a stronger baseline; it waits on the
  owner's yes.

**Tests.** 197 in total: 185 pass and 10 are skipped. Two fail for environment reasons only: `billing.test.mjs` needs
`BILLING_DIST` and `contact-form.test.mjs` needs `INQUIRY_JS`, both builds of other services. One real failure turned up
and was fixed (row 84).

**Visual references.** Consoles were clean in every run.

| Pass | Coverage |
|---|---|
| `qa\pass12` | 1440x900, 390x844, 360x780 and 1440x900 reduced (the stabilization baseline) |
| `qa\pass13` | The same sizes after row 86, **the current baseline**. Against pass 12, 50 of 52 shots are within 1.5%; the other two are the reworded copy at 360 (final-product 27%, driver-macro 5.6%) |
| `qa\r84-wide`, `qa\r86-wide` | 1920x1080 and 768x1024: front-detail, rear-detail, material-transition, showroom (r86 is current) |
| `qa\r84-chip` | The finish chips, 1440x900 and 390x844 |
| `qa\r86-tags`, `qa\r87-tags` | The showroom labels, all 8 turns at 1440, 390 and 360 (r86 has the phone sheets; r87 is current) |
| `qa\r87` | Room and showroom after row 87, within 1.5% of pass 13 |

## 3. The repair loop (every fix)

1. **Reproduce** with a number or one targeted shot, not a full pass. Run from `D:\Work\Business\Nuxy-Halvane-Redesign-2026-11`:
   `node qa\tools\chapters.mjs qa\<dir> "1440x900,390x844,noreduced" <chapter>`
   Chapter names: reveal, silhouette, front-detail, driver-macro, rear-detail, material-transition, showroom,
   final-product, hv-head, hv-room, hv-specs, hv-reserve, hv-foot.
2. **Find which layer owns the defect** before editing:
   - the poster (Blender);
   - the live scene (`scene.ts`, `cameras.json`);
   - the page (CSS, markup);
   - the motion (`timeline.ts`).

   Measure the defect:
   - `qa\tools\livepost.py <dir>` for live vs poster colour;
   - `qa\tools\labels.mjs` for the showroom labels (it measures at the showroom's resting point; read its shots by eye
     for a label over a cone, which it cannot see);
   - DOM boxes for layout.
3. **Make the smallest safe change**, in that one place.
4. **Verify:**
   1. `npm run build` (about 5 s).
   2. Run the same targeted capture.
   3. Run `python -I qa\tools\vdiff.py qa\pass13 qa\<dir>`.
   4. View only the flagged sheets in `qa\<dir>\vdiff\`.
   5. Run the one test file that covers the area.
5. **Check neighbours** only when the change touched shared code (`scene.ts`, `timeline.ts`, page-wide CSS): capture
   every chapter at the same two sizes and run vdiff.
6. **After two failed attempts, change the method**:
   - measure instead of looking;
   - isolate the problem in a scratch page;
   - or bring in Opus 5.5 at high effort.

   Never try a third variation of the same edit.
7. **Log one fix row.** Refresh the visual baseline only after a change is accepted.

Run a full 5-size pass, Lighthouse or the full test suite only at milestones: before a critique, before an owner review,
before a commit. Run one test job at a time.

**Done means:**

| Level | Completion criteria |
|---|---|
| P0 | The build passes. The suite has no failure other than the two environment ones. The console is clean at every size. |
| P1 | vdiff shows no unintended change against the baseline (1440 and 390, plus 1920 and 768 for changed chapters). The label check is clean. livepost is ok, or the gap is explained. |
| P2 | Listed with evidence in §7. It does not block. |

## 4. Rules that stop repeat fixes

- **One source of truth for the look: the Cycles posters.** A material, light or camera change goes in this order:
  1. Blender first (`build_speaker.py`, `textures.py`, `cameras.json`).
  2. Then the live constants in `scene.ts`.
  3. Then `livepost.py` must show every chapter under 8 luma and 4° of hue.

  Never tune the live scene by eye alone.
- **Frozen parts** are listed in §6. Change one only for a P0 or P1, with evidence.
- **Frozen acceptance:**
  - the critique rubric (H1-H9, with H7 and H10 n/a);
  - the owner's 35/40 bar;
  - P0/P1/P2 triage of every finding.

  P2 findings go to §7, not into the fix loop. This follows the owner's 11-14 note: skip small findings that aren't
  worth it and report them.
- **Tests check behaviour and order, not exact source strings.** Row 84 rewrote the one that broke.
- **Context:**
  - Find the place in a big file with Grep, then read it with offset and limit. Never read `scene.ts`, the page,
    `build_speaker.py` or the fix list whole.
  - Search the fix list by row number: `Select-String '^\| 8\d \|'`.
- **Images:** view only vdiff-flagged sheets or a single crop. Never review a whole pass by eye.
- **Skills:** load them by design stage, once per stage. Repairs need none.
- **Shell:**
  - Use PowerShell (the Bash tool runs through the RTK hook).
  - Run Blender by its full path.
  - Set `PLAYWRIGHT_CORE` and `BROWSER` before any test.
  - When a capture needs a fresh page, build first; the QA tools serve `dist`.
- **Blender:** render only when `cameras.json`, `build_speaker.py` or `textures.py` changed. Render one finish at a
  time, walnut last (`--out` saves the .blend).

## 5. Model and effort

| Work | Model and effort |
|---|---|
| Routine repairs that follow the loop (CSS, copy, a camera value, a test) | Fable 5.2, medium |
| Architecture (the structure of `scene.ts`, the renderer budget) | Opus 5.5, high |
| Important visual decisions, such as whether "Graphite" should render cooler | Opus 5.5, high |
| The critique and its triage | Opus 5.5, high |

The owner switches models with `/model`. A session never switches itself, and the model is not changed in the middle of
a task.

## 6. Sections

All 13 parts render at 1440x900, 390x844, 360x780 and with reduced motion (pass 13, consoles clean). At 1920x1080 and
768x1024 they were checked in pass crit1, and the four chapters changed since then were checked in r86-wide.

| Part | Status | Frozen |
|---|---|---|
| Header (fictional-brand line, nav, Reserve) | complete | yes |
| 01 Reveal (hero) | complete | yes |
| 02 Silhouette | complete; live is 9 luma brighter than its poster (P2) | yes |
| 03 Front detail (woofer alone) | complete (row 79) | yes |
| 04 Driver macro (tweeter) | complete (rows 79, 83) | yes |
| 05 Rear detail (crossover, wool) | complete (row 79) | yes |
| 06 Material transition (finish picker) | complete; Graphite chip matched to the render (row 84) | yes |
| 07 Room | complete | yes |
| 08 Showroom (turn, labels) | complete; labels clear the drivers' faces and the phone caption, every turn at 1440, 390 and 360 (rows 80, 83, 86) | yes |
| 09 Final product | complete; price reads as a planned run (row 86) | yes |
| 10 Specs | complete | yes |
| 11 Reserve | complete | yes |
| 12 Footer | complete | yes |

"Complete" means it works and matches the approved direction at every size. The page as a whole met the 35/40 critique
bar in run 4 (§7).

## 7. Remaining defects

**P0:** none. **P1:** none known.

**P2:**

1. **Silhouette:** the live scene is 9 luma brighter than its poster (the match limit is 8). Hue and coverage match.
   The state has no lights of its own; only its angle differs (yaw -66° vs -35°) under the shared lights. A fix would
   change the shared lighting and risk the other 7 chapters, which all match (livepost, pass 12). Left by choice.
2. **Row 33 residuals:** compared with the posters, the live chalk sides run 9 to 15 brighter. The walnut and graphite
   reveal sides and the graphite tops run 8 to 11 darker.
3. **Graphite renders warm brown-grey.** The chip now shows that honestly. Whether the finish should look cooler is a
   visual decision for Opus 5.5 or the owner, and it means a Blender change first (§4).
4. **Critique run 3 P2s, left by choice** (reasons in the fix list, §14):
   - phones show empty bands above and below the speaker at the room and showroom: that is the portrait framing, and
     moving it changes the camera and poster contract `livepost.py` checks;
   - grain behind the 1440 front-detail caption: measured at about 11:1 contrast behind the body text;
   - with reduced motion the showroom poster is close to the final chapter's: a real fix needs new Blender angle posters;
   - a flat panel inside the woofer opening at 1440/1920 front-detail: a Blender model fix.
5. **Detector:** `impeccable detect` on the built page exits 2 on one `cramped-padding` item for `.hv-reserve`. It is a
   false positive (80 px or more of padding; the detector does not resolve `clamp()` with `var()`). Left as is rather
   than bending the CSS to the tool.
6. **Deferred:**
   - the sticky demo bar;
   - the `#9fd3ff` link colour;
   - `@types/three` not installed (editor noise only).

**Score:** each run used a new pair of assessors on routed models (A Opus on the built page, B Sonnet on the
detector) and the same frozen rubric.

| Run | Score | What moved it |
|---|---|---|
| 1, 2 | 24/32, about 30/40 | Fixes moved findings around more than they lifted the score (§1). |
| 3 | 26/32, about 32.5/40 | After this stabilization. Row 86 then fixed its findings: copy as design intent, nav and progress cues, the inline email error, anchors under the bar, labels clear of the drivers and the phone caption. |
| 4 | **28/32 = 35.0/40, the bar is met** | No P0 or P1. Row 87 fixed the three cheap P2s it raised (label dot, chip edge, room heading). The rest are listed in the fix list §14, run 4. |

The bar is met with no margin. The P2s that would lift it further are camera, Blender or poster work (point 4 above
and §14 run 4). They are not worth reopening the frozen chapters for, so they are reported, not chased.

**Environment:** the billing and contact-form tests need builds of other services (§2).

**Shipped 2026-11-23, on the owner's word ("Go ahead and do these"):**

| Step | Record |
|---|---|
| Commits | Redesign `02dbb46`, then `902f192`, which merges master `fbfaba4` (the privacy-policy line) into the branch. |
| Pushes | Branch pushed. nuxy-business master fast-forwarded `fbfaba4..902f192`. |
| Pages | `e6b5545..cee62e3`. Actions run `45241006954`: build and deploy both succeeded. |
| Rollback | Push `e6b5545`'s tree back to Pages main. |
| Tests before the push | Full suite 232 pass, 0 fail, 10 skipped. |
| Live bytes | 539 of 545 files are byte-identical to the local build. The other 6 are `.vtt`/`robots.txt` files that differ only by the worktree's CRLF; they are identical once normalised to LF. |
| Live sweep | 67 pages at 1440 and 390: no console errors, no overflow, one h1 each. The work-page videos (`preload="metadata"`) log `ERR_ABORTED` because the browser stops after the metadata; the files return 200. |
| Live Halvane page | 3D at 1440 and 390, and all 14 `/3d/halvane/` requests return 200. Reduced motion gets the posters and no GLB. No audio plays. The fictional-brand notice is there. The only console item is the D3D shader compiler's X4122 precision warning at 1440. |

**Still the owner's:**
- the Blender MCP: off and not installed. The review was re-checked 11-23 against upstream, which is unchanged at
  `a5a8acf`, and now has 12 findings, F12 being floating dependencies. It is at
  `D:\Work\Business\NUXY-3D-Studio\docs\blender-mcp-security-review.md`. Choose A (keep it off, recommended) or B (a
  sandboxed trial);
- the parked engine phases 4-8 and 18, and the 25-step work order;
- the optional P2s.

## 8. What was changed to prevent repeat fixes (11-23)

| Change | Where | Effect |
|---|---|---|
| `vdiff.py` | `qa\tools` | A pixel regression check against a baseline. Only shots over the limit get a side-by-side and heat map, so only those are viewed. |
| `livepost.py` | `qa\tools` | Live vs poster colour per chapter as numbers. It replaces calibration by eye. |
| `chapters.mjs` part filter and reduced-motion control | `qa\tools` | Shoots one chapter at chosen sizes in seconds instead of a 52-shot pass. |
| `labels.mjs` | `qa\tools` | The showroom label check, kept with the other tools (it had lived in a session scratchpad). It measures at the showroom's resting point; measuring at the scroll start had flagged a fault that was not there (row 86). |
| Baseline snapshot | `baseline\2026-11-23` | Files, hashes and a reverse-checked patch, so any regression can be compared or rolled back without git. |
| Shader warm-up test checks order, not one exact string | `tests/levels.test.mjs` | Adding a texture to the first upload no longer breaks it. |
| Halvane font ignores at the worktree root | `.impeccable/config.json` (untracked) | The design hook reads its config there, so it stopped re-flagging the brand fonts on every page edit. |
| This file | `docs/` | A short entry point, so the 87 KB fix list is never loaded whole. |
