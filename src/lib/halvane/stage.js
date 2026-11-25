// Halvane stage: the parts of the page the GetLayers port does not own.
//  - the product stage: an image-based viewer (owner's photoreal brief, 2026-11-24: no substitute 3D speaker). The
//    hero poster is a photo cutout; on tiers 1-2 a 49-frame walnut orbit (cut from an AI-generated Seedance 2.5
//    turntable clip, public/3d/halvane/orbit) takes over while the speaker turns. The artefakt template's
//    buildProductScene journey (hero -> details: size, rise, shift, scroll turn, release drop) and its drag spin
//    and fling still drive it, as a CSS transform on the photo and a frame index into the orbit.
//  - the finish sync between the collection, the reserve form and the speaker.
//  - Act 04: the GetLayers pendulum-wave scene, mounted when its section comes near; sound only from its button.
// One ticker drives every frame (artefakt's subscribe); the pendulum draws on it or on its own idle gate, and its
// WebGL context pauses off screen and is freed on pagehide.
import {
  subscribe, coarsePointer, FRAME_QUERY, acquireRegionPointer, whenNear, assetFailure, MathUtils,
  FRAME_HEIGHT, SUBJECT_HEIGHT, SUBJECT_RISE, SCROLL_TURN, ease, drift,
  PARALLAX, DRAG_DEGREES_PER_PX, SPIN_FRICTION, SPIN_STOP, TRAVEL_SETTLE_MS, TRAVEL_MUTE_MS, TRAVEL_MUTE_SPEED,
  RELEASE_LAG, JOURNEY_FOLLOW, PHYSICS_STEP_MS, MAX_PHYSICS_STEPS, readTier, FRAME_BUDGET, RESIZE_DEBOUNCE_MS,
} from "./artefakt.js";
import { tier, webgl, whileTier } from "../demo/tier";
import { afterHeroPaint } from "./first-paint.js";

const DEG = 180 / Math.PI;

/* ==========================================================================
   ORBIT. Frames 0-48 turn the cabinet from its left side, through the front, to
   its right side; frame 26 is the hero poster's angle. Every frame sits on the
   poster's framing (same 1600-square box, speaker centre and base), cropped to
   one shared rect so each draws at a constant offset. The clip turns about 1.9
   degrees a frame, so the template's 40 degree scroll turn lands near frame 47.
   ========================================================================== */
const ORBIT = {
  count: 49,
  rest: 26,
  degPerFrame: 1.9,
  sizes: { 800: [183, 140, 488, 571], 520: [118, 90, 318, 373] },
};
/* Shown while the speaker is this many frames off its rest angle (or being dragged); hidden again under the
   second, so the poster never flickers back in mid-turn. */
const SHOW_AT = 0.35, HIDE_AT = 0.08;
/* The details framing, in the template's 800-unit stage. The template grows its product to 795 units there, which
   the GLB could take; the orbit is cut from a 720p clip (cabinet about 500 source px tall), so it stays near its
   native size (about 7% up) and moves into the gap between "Turn it round" and the feature cards instead of
   growing over them. */
const PHOTO_DETAILS = { height: 610, rise: -14, shiftX: -49 };
/* Desktop has no drag (the template drags on touch only): the cabinet turns toward the cursor instead, by up to this
   many degrees of real orbit footage, half the template's 24 so it stays near the poster's angle. */
const POINTER_TURN = 12;

/* ==========================================================================
   PRODUCT STAGE (template buildProductScene, app.js 1905-2368)
   ========================================================================== */
const FINISHES = ["walnut", "chalk", "graphite"];
const FINISH_NAME = { walnut: "Walnut", chalk: "Chalk", graphite: "Graphite" };
let finish = "walnut";
let onFinish = () => {};

function buildProductScene() {
  const region = document.getElementById("product-region");
  const section = document.getElementById("hero");
  const hit = document.getElementById("product-hit");
  const stage = document.getElementById("product-canvas");
  const photo = document.getElementById("product-photo");
  const canvas = document.getElementById("product-orbit");
  if (!region || !section || !stage || !photo || !canvas) return;

  const frameQuery = window.matchMedia(FRAME_QUERY);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let framed = frameQuery.matches;
  const coarse = coarsePointer();
  const tierName = readTier();
  const pointer = acquireRegionPointer(stage);
  if (hit) pointer.attachDragTarget(hit);

  let cssHeight = 1, scale = 1;
  let journey = 0, released = 0, lastJourney = 0, travelSettle = 1;
  let heightPx = 1, riseX = 0, riseY = 0;
  let spin = 0, spinVelocity = 0;
  let journeyTurn = 0, journeyTurnTarget = 0, journeyPrimed = false, pointerTurn = 0;
  let physicsAccum = 0, lastTime = 0;
  let lastTransform = "";

  const readJourney = () => {
    if (!framed) { released = 0; return 0; }
    const travel = section.offsetHeight;
    const top = section.getBoundingClientRect().top;
    released = Math.max(0, -top - travel);
    return travel > 0 ? Math.min(1, Math.max(0, -top / travel)) : 0;
  };

  /* The template's framing, in stage pixels: cabinet height, centre rise above the stage centre and sideways shift.
     Boxed (tablet and phone) the poster's own CSS box is the framing, so nothing moves. Reduced motion jumps
     between the hero and details framings instead of travelling. */
  const frameSubject = () => {
    if (!framed) { heightPx = SUBJECT_HEIGHT * scale; riseY = SUBJECT_RISE * scale; riseX = 0; return; }
    const eased = reduce.matches ? (journey < 0.5 ? 0 : 1) : drift(journey);
    heightPx = (SUBJECT_HEIGHT + (PHOTO_DETAILS.height - SUBJECT_HEIGHT) * eased) * scale;
    riseY = (SUBJECT_RISE + (PHOTO_DETAILS.rise - SUBJECT_RISE) * eased) * scale;
    riseX = PHOTO_DETAILS.shiftX * eased * scale;
  };

  const applySize = () => {
    cssHeight = Math.max(1, stage.clientHeight);
    scale = cssHeight / FRAME_HEIGHT;
    framed = frameQuery.matches;
    journey = readJourney();
    frameSubject();
    sizeOrbit();
  };

  const clamp = (v) => Math.min(1, Math.max(-1, v));

  /* The photo box is placed by CSS on the hero framing; the journey scales it about the cabinet's centre and moves
     it. One transform string, written only when it changes. */
  const place = (nx, ny, active) => {
    const lagPx = cssHeight * RELEASE_LAG;
    const releaseDrop = lagPx > 0 ? lagPx * (1 - Math.exp(-released / lagPx)) : 0;
    const s = heightPx / (SUBJECT_HEIGHT * scale);
    const x = riseX - nx * PARALLAX * scale * active;
    const y = -(riseY - SUBJECT_RISE * scale) + ny * PARALLAX * scale * active + releaseDrop;
    const t = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
    if (t !== lastTransform) { photo.style.transform = t; lastTransform = t; }
  };

  /* ---- orbit frames ---- */
  let frames = null, size = 0, loading = 0, shown = false, drawn = -1;
  const ctx = canvas.getContext("2d");
  const orbitOn = () => !!frames && finish === "walnut";
  function sizeOrbit() {
    /* 800px frames where the photo box is drawn larger than 560 device pixels, 520px below that. */
    const box = photo.offsetWidth * Math.min(2, window.devicePixelRatio || 1);
    const want = box > 560 ? 800 : 520;
    if (frames && want > size) { dropOrbit(); void loadOrbit(); }
  }
  async function loadOrbit() {
    if (frames || loading) return;
    const box = photo.offsetWidth * Math.min(2, window.devicePixelRatio || 1);
    const S = box > 560 ? 800 : 520;
    const mine = ++loading;
    try {
      const list = await Promise.all(Array.from({ length: ORBIT.count }, async (_, i) => {
        const img = new Image();
        img.decoding = "async";
        img.src = `/3d/halvane/orbit/walnut-${S}/${String(i).padStart(2, "0")}.webp`;
        await img.decode();
        return "createImageBitmap" in window ? createImageBitmap(img) : img;
      }));
      if (mine !== loading) { list.forEach((b) => b.close?.()); return; }
      const [x, y, w, h] = ORBIT.sizes[S];
      canvas.width = w;
      canvas.height = h;
      Object.assign(canvas.style, { left: `${(x / S) * 100}%`, top: `${(y / S) * 100}%`, width: `${(w / S) * 100}%`, height: `${(h / S) * 100}%` });
      canvas.hidden = false;
      frames = list;
      size = S;
      drawn = -1;
      resume();
    } catch (err) {
      if (mine === loading) assetFailure(`/3d/halvane/orbit/walnut-${S}/`, err);
    } finally {
      if (mine === loading) loading = 0;
    }
  }
  function dropOrbit() {
    loading = 0;
    frames?.forEach((b) => b.close?.());
    frames = null;
    size = 0;
    canvas.hidden = true;
    show(false);
  }
  function show(on) {
    if (on === shown) return;
    shown = on;
    photo.classList.toggle("is-turning", on);
  }
  function draw(index) {
    if (Math.abs(index - drawn) < 0.01) return;
    drawn = index;
    const i0 = Math.floor(index), f = index - i0;
    const i1 = Math.min(ORBIT.count - 1, i0 + 1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.drawImage(frames[i0], 0, 0);
    if (f > 0.02 && i1 !== i0) { ctx.globalAlpha = f; ctx.drawImage(frames[i1], 0, 0); ctx.globalAlpha = 1; }
  }

  const frame = (time) => {
    const delta = lastTime ? Math.min(50, time - lastTime) : 16;
    lastTime = time;
    const state = pointer.state;
    const dragging = state.mode === "dragging";

    journey = readJourney();
    frameSubject();

    const journeySpeed = Math.abs(journey - lastJourney) / Math.max(1, delta / PHYSICS_STEP_MS);
    lastJourney = journey;
    const settleTarget = 1 - Math.min(1, journeySpeed / TRAVEL_MUTE_SPEED);
    if (Math.abs(settleTarget - travelSettle) > 1e-3) {
      const perStep = PHYSICS_STEP_MS / (settleTarget < travelSettle ? TRAVEL_MUTE_MS : TRAVEL_SETTLE_MS);
      travelSettle += (settleTarget - travelSettle) * (1 - Math.pow(1 - perStep, delta / PHYSICS_STEP_MS));
    } else travelSettle = settleTarget;

    /* Drag and fling turn the speaker only while there are frames to show (walnut, tiers 1-2). */
    const turnable = orbitOn();
    if (turnable && dragging) {
      spinVelocity = MathUtils.degToRad(state.dragDeltaX * DRAG_DEGREES_PER_PX);
      spin += spinVelocity;
    } else {
      if (state.flingX !== 0) {
        spinVelocity = turnable ? MathUtils.degToRad(state.flingX * DRAG_DEGREES_PER_PX) : 0;
        state.flingX = 0;
      }
      if (Math.abs(spinVelocity) > SPIN_STOP) { spin += spinVelocity; spinVelocity *= SPIN_FRICTION; }
      else spinVelocity = 0;
    }

    /* Pointer (desktop, framed): a few pixels of parallax, and the cabinet turns toward the cursor. */
    const active = (!coarse && framed && state.engaged && !reduce.matches ? state.intensity : 0) * ease(travelSettle);
    const nx = state.width ? clamp((state.rawX / state.width) * 2 - 1) : 0;
    const ny = state.height ? clamp((state.rawY / state.height) * 2 - 1) : 0;
    const pointerTarget = turnable ? MathUtils.degToRad(nx * POINTER_TURN) * active : 0;

    physicsAccum = Math.min(physicsAccum + delta, PHYSICS_STEP_MS * MAX_PHYSICS_STEPS);
    journeyTurnTarget = framed ? ease(journey) * SCROLL_TURN : 0;
    if (!journeyPrimed) { journeyTurn = journeyTurnTarget; journeyPrimed = true; }
    while (physicsAccum >= PHYSICS_STEP_MS) {
      physicsAccum -= PHYSICS_STEP_MS;
      journeyTurn += (journeyTurnTarget - journeyTurn) * JOURNEY_FOLLOW;
      pointerTurn += (pointerTarget - pointerTurn) * JOURNEY_FOLLOW;
    }

    place(nx, ny, active);

    if (!turnable) { show(false); return; }
    /* Frame index: scroll turns toward the side panel; a drag to the left does too (the front follows the hand). The
       spin is held inside the clip's range, so a hard drag stops at either end instead of wrapping. */
    const toFrames = DEG / ORBIT.degPerFrame;
    const journeyFrames = (journeyTurn + pointerTurn) * toFrames;
    const lo = ORBIT.rest + journeyFrames - (ORBIT.count - 1), hi = ORBIT.rest + journeyFrames;
    const spinFrames = spin * toFrames;
    if (spinFrames < lo || spinFrames > hi) { spin = Math.min(hi, Math.max(lo, spinFrames)) / toFrames; spinVelocity = 0; }
    const index = ORBIT.rest + journeyFrames - spin * toFrames;
    const off = Math.abs(index - ORBIT.rest);
    if (!shown && (off > SHOW_AT || dragging)) show(true);
    else if (shown && off < HIDE_AT && !dragging && spinVelocity === 0) show(false);
    if (shown) draw(index);
  };

  /* Gates: the ticker runs only while the region is near the viewport and the tab is visible. On tier 3 there is
     nothing to animate between scroll events, so a scroll listener places the photo instead of a ticker. */
  let unsubscribe = null, near = false, scrollQueued = false, listening = false;
  const onScroll = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame((t) => { scrollQueued = false; frame(t); });
  };
  const resume = () => {
    if (unsubscribe || listening || document.hidden || !near) return;
    lastTime = 0;
    if (tier() <= 2) unsubscribe = subscribe(frame, () => FRAME_BUDGET[tierName]);
    else { listening = true; window.addEventListener("scroll", onScroll, { passive: true }); onScroll(); }
  };
  const pause = () => {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    if (listening) { listening = false; window.removeEventListener("scroll", onScroll); }
  };
  new IntersectionObserver((entries) => {
    near = entries.some((e) => e.isIntersecting);
    near ? resume() : pause();
  }, { rootMargin: "10% 0px" }).observe(region);
  document.addEventListener("visibilitychange", () => (document.hidden ? pause() : resume()));
  document.addEventListener("demo:tier", () => { pause(); resume(); });

  let resizeTimer = 0, lastWidth = window.innerWidth;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (coarse && window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      applySize();
      onScroll();
    }, RESIZE_DEBOUNCE_MS);
  };
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });
  frameQuery.addEventListener?.("change", () => { applySize(); onScroll(); });
  reduce.addEventListener?.("change", onScroll);
  applySize();

  /* A finish without orbit frames (chalk, graphite) shows its poster and does not turn; back on walnut the drag
     starts again from the rest angle. */
  onFinish = (f) => {
    if (f !== "walnut") { spin = 0; spinVelocity = 0; show(false); drawn = -1; }
  };

  window.addEventListener("pagehide", () => pause());
  /* The frames (0.4-0.6 MB) wait for the poster's paint (first-paint.js) and an idle moment, so they never count
     into LCP or share a slow phone's first-view bandwidth. Tier 3 keeps the poster alone. */
  const idleCall = (fn) => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 300));
  const boot = () => afterHeroPaint(() => idleCall(() => whileTier(2, () => { void loadOrbit(); return dropOrbit; })));
  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot, { once: true });
}

/* ==========================================================================
   FINISH SYNC: the collection's reserve links, the form's select, the summary
   and the sent note follow one choice; the hero poster takes it too, so the
   speaker on the stage is the one being reserved.
   ========================================================================== */
function wireFinishes() {
  const select = document.querySelector("[data-finish-select]");
  const summary = document.querySelector("[data-res-finish]");
  const sent = document.querySelector("[data-sent-finish]");
  const poster = document.getElementById("product-poster");
  const choose = (f) => {
    if (!FINISHES.includes(f)) return;
    finish = f;
    if (select && select.value !== f) select.value = f;
    if (summary) summary.textContent = FINISH_NAME[f];
    if (sent) sent.textContent = FINISH_NAME[f];
    if (poster && poster.dataset.finish !== f) {
      poster.dataset.finish = f;
      poster.srcset = [800, 1000, 1200, 1600].map((w) => `/3d/halvane/posters/${f}-showroom-${w}.webp ${w}w`).join(", ");
      poster.src = `/3d/halvane/posters/${f}-showroom-1200.webp`;
      poster.alt = `The Lumen One speaker in ${FINISH_NAME[f].toLowerCase()}, turned to show its front and side.`;
    }
    onFinish(f);
  };
  select?.addEventListener("change", () => choose(select.value));
  /* The demo form's reset puts the select back on its first option; keep it on the finish that is showing. */
  select?.form?.addEventListener("demo-reset", () => { select.value = finish; });
  for (const link of document.querySelectorAll("[data-choose-finish]")) {
    link.addEventListener("click", () => choose(link.dataset.chooseFinish));
  }
  if (select) choose(select.value);
}

/* ==========================================================================
   ACT 04: the pendulum wave (GetLayers scene pendulum-wave, ported in
   pendulum.js). A still stands in on tier 3, without WebGL and until the
   scene's own fade-in has run.
   ========================================================================== */
function wireSound() {
  const section = document.getElementById("sound");
  const canvas = document.getElementById("sound-canvas");
  if (!section || !canvas) return;
  const button = document.getElementById("sound-toggle");
  const release = document.getElementById("sound-release");
  let api = null, mounting = false, visible = false;

  const watch = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    api?.setPaused(!visible);
  }, { rootMargin: "0px" });

  async function start() {
    if (api || mounting || tier() > 2 || !webgl()) return;
    mounting = true;
    try {
      const { mountPendulum } = await import("./pendulum.js");
      canvas.hidden = false;
      api = mountPendulum(canvas, {
        maxDpr: tier() === 1 ? 2 : 1.5,
        plate: "H A L V A N E   ·   1 5",
        soundButton: button,
        subscribe: (fn) => subscribe(fn, () => 0),
      });
      section.classList.add("is-live");
      if (release) release.hidden = false;
      watch.observe(section);
      api.setPaused(!visible);
    } catch (err) {
      assetFailure("pendulum-wave", err);
      stop();
    } finally {
      mounting = false;
    }
  }
  function stop() {
    watch.disconnect();
    api?.dispose();
    api = null;
    section.classList.remove("is-live");
    if (release) release.hidden = true;
    if (button) button.hidden = true;
  }
  release?.addEventListener("click", () => api?.release());
  window.addEventListener("pagehide", () => stop());
  window.addEventListener("pageshow", (e) => { if (e.persisted && tier() <= 2) whenNear(section, 1, () => void start()); });
  whenNear(section, 1, () => whileTier(2, () => { void start(); return stop; }));
}

/* ==========================================================================
   ACT 05b: the light sweep (an AI-generated Seedance 2.5 clip, 16 s forward and
   back). The file is attached only on tiers 1-2 when the section comes near, and
   plays only while on screen with the Moving light button on. Tier 3 keeps the
   poster and never downloads the clip.
   ========================================================================== */
function wireSweep() {
  const section = document.getElementById("sweep");
  const video = document.getElementById("sweep-video");
  const button = document.getElementById("sweep-toggle");
  if (!section || !video || !button) return;
  let visible = false, wanted = true, attached = false;
  const sync = () => {
    if (attached && visible && wanted && tier() <= 2) video.play().catch(() => {});
    else video.pause();
  };
  const watch = new IntersectionObserver((entries) => { visible = entries.some((e) => e.isIntersecting); sync(); }, { threshold: 0.2 });
  button.addEventListener("click", () => {
    wanted = !wanted;
    button.setAttribute("aria-pressed", String(wanted));
    sync();
  });
  video.addEventListener("error", () => { assetFailure("light-sweep", video.error); button.hidden = true; });
  whenNear(section, 1, () => whileTier(2, () => {
    if (!attached) { video.src = video.dataset.src; attached = true; }
    button.hidden = false;
    watch.observe(section);
    return () => { watch.disconnect(); visible = false; sync(); button.hidden = true; };
  }));
  window.addEventListener("pagehide", () => video.pause());
}

/* ==========================================================================
   ACT 06c: out of the dark. 57 frames (1.0 s to 8.0 s of an AI-generated
   Seedance 2.5 clip, every third frame) scrubbed by scroll while the stage is
   pinned. The scroll through the section is split into beats:
     0.00-0.70  the frames run: light comes up, the camera pushes in;
     0.70-0.78  the frames fall to black;
     0.76-0.90  the plinth photo rises out of the black (opacity), and keeps a
                slow dolly (scale 1.06 to 1) and a small drift to the end.
   One line of type per beat. Tiers 1-2 only; tier 3 keeps the static layout
   and never downloads a frame.
   ========================================================================== */
const FINALE = {
  count: 57,
  focusX: 0.76,          // the speaker's side of the frame, matched to the CSS object-position
  framesEnd: 0.7,
  emergeOut: [0.7, 0.78],
  revealIn: [0.76, 0.9],
  beats: [0, 0.26, 0.5, 0.8],
  follow: 0.2,           // eased approach to the scroll position per frame (~60 Hz)
};
function wireFinale() {
  const section = document.getElementById("finale");
  const canvas = document.getElementById("finale-canvas");
  const media = section && section.querySelector(".finale-media");
  if (!section || !canvas || !media) return;
  const lines = [...section.querySelectorAll(".finale-line")];
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const span = (v, [a, b]) => clamp01((v - a) / (b - a));
  const frames = new Array(FINALE.count).fill(null);
  let dir = null, loading = false;

  const load = () => {
    if (loading) return;
    loading = true;
    dir = media.clientWidth * Math.min(window.devicePixelRatio || 1, 2) > 900 ? "hi" : "lo";
    let next = 0, failed = false;
    const pump = () => {
      if (next >= FINALE.count || failed) return;
      const index = next++;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => { frames[index] = img; painted = -1; pump(); };
      img.onerror = () => {
        if (failed) return;
        failed = true;
        assetFailure(img.src, new Error("finale frame did not load"));
        section.setAttribute("data-fallback", "");
      };
      img.src = `/3d/halvane/finale/${dir}/${String(index).padStart(3, "0")}.webp`;
    };
    for (let i = 0; i < 4; i += 1) pump();
  };

  const nearest = (index) => {
    for (let step = 0; step < FINALE.count; step += 1) {
      if (frames[index - step]) return frames[index - step];
      if (frames[index + step]) return frames[index + step];
    }
    return null;
  };

  let cw = 0, ch = 0;
  const header = document.querySelector(".header-pin");
  const size = () => {
    const head = header ? Math.max(0, Math.round(header.getBoundingClientRect().height)) : 0;
    section.style.setProperty("--head", `${head}px`);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    cw = Math.max(1, Math.round(media.clientWidth * ratio));
    ch = Math.max(1, Math.round(media.clientHeight * ratio));
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; painted = -1; }
  };
  /* object-fit: cover with object-position focusX 50%, as the poster img does */
  const blit = (img, alpha) => {
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (cw - w) * FINALE.focusX, (ch - h) * 0.5, w, h);
  };
  let painted = -1;
  const paint = (position) => {
    if (Math.abs(position - painted) < 0.01) return;
    const lower = Math.floor(position), upper = Math.min(FINALE.count - 1, lower + 1);
    const a = nearest(lower);
    if (!a) return;
    const b = nearest(upper) || a;
    blit(a, 1);
    if (b !== a) blit(b, position - lower);
    ctx.globalAlpha = 1;
    painted = position;
    canvas.dataset.ready = "";
  };

  let shown = 0, target = 0, applied = -1, beat = -1, unsubscribe = null;
  const progress = () => {
    const rect = section.getBoundingClientRect();
    const run = section.offsetHeight - window.innerHeight;
    return run > 0 ? clamp01(-rect.top / run) : 0;
  };
  const setBeat = (p) => {
    let b = 0;
    FINALE.beats.forEach((start, i) => { if (p >= start) b = i; });
    if (b === beat) return;
    beat = b;
    lines.forEach((line, i) => line.toggleAttribute("data-on", i === b));
  };
  const frame = () => {
    target = progress();
    shown += (target - shown) * FINALE.follow;
    if (Math.abs(target - shown) < 0.0005) shown = target;
    setBeat(target);
    if (shown === applied && painted >= 0) return; // at rest and drawn: nothing to do this frame
    applied = shown;
    const p = shown;
    paint(span(p, [0, FINALE.framesEnd]) * (FINALE.count - 1));
    section.style.setProperty("--emerge", String(1 - span(p, FINALE.emergeOut)));
    const r = span(p, FINALE.revealIn);
    section.style.setProperty("--reveal", r.toFixed(3));
    const settle = span(p, [FINALE.revealIn[0], 1]);
    section.style.setProperty("--dolly", (1.06 - 0.06 * settle).toFixed(4));
    section.style.setProperty("--drift", `${(12 * (1 - settle)).toFixed(1)}px`);
  };
  const watch = new IntersectionObserver((entries) => {
    const on = entries.some((e) => e.isIntersecting);
    if (on && !unsubscribe) { size(); shown = target = progress(); unsubscribe = subscribe(frame); }
    else if (!on && unsubscribe) { unsubscribe(); unsubscribe = null; }
  });
  const onResize = () => { if (section.hasAttribute("data-live")) { size(); applied = -1; } };

  /* The pinned layout is set at once, not when the section comes near: growing the section to its scroll length
     later would push everything below it (a reader who jumped to #reserve would be moved). Only the frames wait. */
  whenNear(section, 1.5, () => { if (tier() <= 2) load(); });
  whileTier(2, () => {
    section.setAttribute("data-live", "");
    size();
    setBeat(progress());
    window.addEventListener("resize", onResize);
    watch.observe(section);
    return () => {
      watch.disconnect();
      if (unsubscribe) { unsubscribe(); unsubscribe = null; }
      window.removeEventListener("resize", onResize);
      section.removeAttribute("data-live");
      lines.forEach((line) => line.removeAttribute("data-on"));
      beat = -1;
      applied = -1;
      for (const name of ["--emerge", "--reveal", "--dolly", "--drift", "--head"]) section.style.removeProperty(name);
    };
  });
}

buildProductScene();
wireFinishes();
wireSound();
wireSweep();
wireFinale();
