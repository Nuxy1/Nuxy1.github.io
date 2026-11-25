/* GetLayers template "artefakt" runtime, ported to Halvane Audio by tools/port-artefakt.mjs. Do not edit by hand:
   change the port script or stage.js. Template source: getlayers.ai/?layer=artefakt (style obsidian-luxe). */
import Lenis from "lenis";
import LAYERS from "./layers.json";
import { afterHeroPaint } from "./first-paint.js";
const ASSETS = "/3d/halvane/gl";
function assetFailure(url, err) { if (window.console) console.error("[halvane]", url, err); }
for (const img of document.querySelectorAll(".hvx img")) img.addEventListener("error", () => assetFailure(img.currentSrc || img.src, new Error("image did not load")), { once: true });
const MathUtils = { degToRad: (d) => (d * Math.PI) / 180 };

/* ==========================================================================
   THE SHARED TICKER

   A single, app-wide rAF loop. Every per-frame effect subscribes here instead of
   starting its own, so a page with N scroll-driven components runs ONE loop.
   Reference-counted: it starts on the first subscriber and cancels when the last
   leaves, so an idle page costs nothing. Each subscriber is throttled
   independently by its own framerate, read live every frame.
   ========================================================================== */
const subscribers = new Set();
let rafId = null;
function tick(time) {
  for (const sub of [...subscribers]) {
    if (!subscribers.has(sub)) continue;
    if (time - sub.last <= sub.rate()) continue;
    sub.last = time;
    try { sub.fn(time); }
    catch (error) { console.error("[ticker] subscriber threw:", error); }
  }
  rafId = requestAnimationFrame(tick);
}
function subscribe(fn, rate) {
  const sub = { fn, rate: rate || (() => 0), last: performance.now() };
  subscribers.add(sub);
  if (rafId === null) rafId = requestAnimationFrame(tick);
  return () => {
    subscribers.delete(sub);
    if (subscribers.size === 0 && rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  };
}

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.tier === "3";
const coarsePointer = () => window.matchMedia("(hover: none) and (pointer: coarse)").matches;
/* The frame layout's own query — the same one the CSS gives the `lg` variant,
   kept in step by hand because CSS cannot hand it to a script. */
const FRAME_QUERY = "(min-width: 1024px) and (min-aspect-ratio: 1/1)";

/* ==========================================================================
   ONE SPRING SOLVER — standing in for @react-spring/web.

   The same ODE react-spring solves, a = (tension * (to - x) - friction * v) /
   mass, integrated in sub-steps of at most 1ms on the shared ticker. Every
   entrance on the page uses react-spring's default config (tension 170,
   friction 26, mass 1: critically damped to within a hair, so no overshoot);
   the phone menu brings its own. Under prefers-reduced-motion every spring is
   skipped to its end state — react-spring's `skipAnimation`.
   ========================================================================== */
const DEFAULT_SPRING = { tension: 170, friction: 26, mass: 1 };

class SpringValue {
  constructor(value, onChange) {
    this.x = value; this.v = 0; this.to = value;
    this.config = DEFAULT_SPRING;
    this.onChange = onChange;
    this.stop = null; this.timer = 0; this.last = 0; this.onRest = null;
  }
  set(value) {
    window.clearTimeout(this.timer);
    if (this.stop) { this.stop(); this.stop = null; }
    this.x = this.to = value; this.v = 0;
    this.onChange(value);
  }
  start(to, config, delay, onRest) {
    window.clearTimeout(this.timer);
    const go = () => {
      this.to = to;
      this.config = config || DEFAULT_SPRING;
      this.onRest = onRest || null;
      if (reduced()) { this.set(to); if (onRest) onRest(); return; }
      if (!this.stop) { this.last = 0; this.stop = subscribe((time) => this.tick(time), () => 0); }
    };
    if (delay > 0) this.timer = window.setTimeout(go, delay); else go();
  }
  tick(time) {
    const dt = Math.min(64, this.last ? time - this.last : 16);
    this.last = time;
    const { tension, friction } = this.config;
    const mass = this.config.mass || 1;
    const steps = Math.max(1, Math.ceil(dt));
    const h = dt / steps / 1000;
    for (let i = 0; i < steps; i += 1) {
      const a = (tension * (this.to - this.x) - friction * this.v) / mass;
      this.v += a * h;
      this.x += this.v * h;
    }
    const span = Math.max(1e-6, Math.abs(this.to) > 1 ? 0.01 : 0.0005);
    if (Math.abs(this.to - this.x) < span && Math.abs(this.v) < span * 10) {
      this.x = this.to; this.v = 0;
      this.onChange(this.x);
      if (this.stop) { this.stop(); this.stop = null; }
      const done = this.onRest; this.onRest = null;
      if (done) done();
      return;
    }
    this.onChange(this.x);
  }
}

/* ==========================================================================
   REVEAL — two observers, whichever fires first.

   A hold-back alone has a failure mode that bit this page three times: anything
   anchored near the bottom of a viewport-tall section — or of the page — can come
   to rest CLOSER to the bottom edge than the margin is deep, and then it never
   reveals at all. The footer's copyright sits 40px clear at rest against a 64px
   band, and simply never appeared. Neither observer can be tightened into the
   other: a margin small enough to clear every bottom anchor is too small to stop
   early reveals.
   ========================================================================== */
const REVEAL_ROOT_MARGIN = "0px 0px -64px 0px";
function observeReveal(element, onReveal) {
  let fired = false;
  const observers = [];
  const fire = () => {
    if (fired) return;
    fired = true;
    for (const o of observers) o.disconnect();
    onReveal();
  };
  const watch = (options) => {
    const o = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) fire();
    }, options);
    o.observe(element);
    observers.push(o);
  };
  watch({ rootMargin: REVEAL_ROOT_MARGIN });
  watch({ threshold: 1 });
  return () => { for (const o of observers) o.disconnect(); };
}

/* ==========================================================================
   TYPESETTING — bind the small words to what follows them.

   A line that ends on "and", "to" or "the" leaves the reader holding a word that
   means nothing on its own until the next line arrives. In a proportional face it
   is a nuisance; in this one it is louder, because the type is monospaced and
   every such word is a visible stub of identical cells at the edge of the column.
   Measured at 390 the page had 23 of them.
   ========================================================================== */
const TIED = new Set([
  "a", "an", "the",
  "and", "or", "but", "as", "if", "so",
  "of", "to", "in", "on", "at", "by", "for", "with", "from", "into",
  "over", "under", "per", "via", "no", "not",
  "without", "within", "onto", "upon", "against", "across", "around",
  "after", "before", "through", "during", "between",
  "is", "are", "was", "be", "we", "it", "its",
  "my", "our", "your", "their", "his", "her", "i",
  "can", "may", "do", "does", "did", "has", "have", "had", "will",
  "&",
]);
const bare = (w) => w.toLowerCase().replace(/[^a-z&]/g, "");
/* maxPair — the longest run a binding may produce. A narrow column cannot afford
   a long one: gluing "without compromising" costs twenty characters of a line
   that holds twenty-nine, and the line above it ends short, which reads worse
   than the hanging word the binding was there to prevent. */
function tie(text, maxPair) {
  if (maxPair === undefined) maxPair = Infinity;
  const parts = text.split(/([ \t]+)/);
  const out = parts.slice();
  for (let i = 0; i < parts.length; i += 2) {
    const word = parts[i], gap = parts[i + 1], next = parts[i + 2];
    if (!gap || !next) continue;
    if (/[.,;:!?]$/.test(word)) continue;
    const key = bare(word);
    if (!key || !TIED.has(key)) continue;
    /* NO CHAINS ON A NARROW COLUMN. A function word bound to another runs three
       and four words into one token — "can be returned" — and a token that long
       carries the whole phrase down a line. */
    if (maxPair !== Infinity && TIED.has(bare(next))) continue;
    if (word.length + 1 + next.length > maxPair) continue;
    out[i] = word + " ";
    out[i + 1] = "";
  }
  return out.join("");
}
/* The hero's claim is two sentences to a line. Left to wrap where it liked, it
   split "WEATHER-RESISTANT. THERMAL / INSULATION." on a phone — a break in the
   middle of the second sentence, with the first one's full stop stranded
   mid-line. The only break that reads is the one the copy already has. */
const keepSentences = (text) =>
  text.replace(/(\S+)([ \t]+)/g, (whole, word) => (/[.,;:!?]$/.test(word) ? whole : word + " "));

const WIDE_QUERY = "(min-width: 640px)";
const NARROW_PAIR = 20;

/* ==========================================================================
   THE SCRAMBLE DECODER

   The label is replaced with random glyphs, then resolves left to right, one
   character per step, on the shared ticker.

   THE SCRAMBLED GLYPHS ARE aria-hidden and the real label is kept in a
   visually-hidden copy, so the accessible name stays stable while the visible
   text is churning — a screen reader must never be handed X#@%R.

   MONOSPACE BY DESIGN: the character count never changes, so nothing reflows,
   including the wrap points of a label that spans more than one line.
   ========================================================================== */
const SCRAMBLE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>";
const SCRAMBLE_STEP_MS = 40;
/* A label longer than this resolves more than one character per step, so the
   effect stays roughly as long whatever it is applied to — the tick rate never
   changes, so every decode on the page shares one texture, which is what stops a
   mixed cascade reading as several unrelated effects. */
const SCRAMBLE_MAX_STEPS = 22;

class Scramble {
  constructor(host) {
    this.host = host;
    this.raw = host.textContent;
    this.tieProse = host.hasAttribute("data-tie");
    this.keep = host.hasAttribute("data-keep-sentences");
    this.stop = null;
    this.step = 0;

    this.glyphs = document.createElement("span");
    this.glyphs.setAttribute("aria-hidden", "true");
    this.label = document.createElement("span");
    this.label.className = "sr-only";
    host.textContent = "";
    this.glyphs.className = "scr-glyphs"; this.ghost = document.createElement("span"); this.ghost.className = "scr-ghost";
    const box = document.createElement("span"); box.className = "scr-box"; box.setAttribute("aria-hidden", "true");
    box.append(this.ghost, this.glyphs); host.append(box, this.label);

    this.syncText();
    if (this.tieProse) {
      const q = window.matchMedia(WIDE_QUERY);
      q.addEventListener("change", () => this.syncText());
    }

    host.addEventListener("mouseenter", () => this.run());
    host.addEventListener("focus", () => this.run(), true);
  }
  syncText() {
    let text = this.raw;
    if (this.tieProse) text = tie(text, window.matchMedia(WIDE_QUERY).matches ? undefined : NARROW_PAIR);
    if (this.keep) text = keepSentences(text);
    this.text = text;
    this.glyphs.textContent = text;
    this.label.textContent = text; this.ghost.textContent = text;
  }
  halt() { if (this.stop) { this.stop(); this.stop = null; } }
  run() {
    /* Rapidly mutating glyphs are exactly what this setting exists to suppress. */
    if (reduced()) return;
    this.halt();
    this.step = 0;
    const text = this.text;
    const perStep = Math.max(1, Math.ceil(text.length / SCRAMBLE_MAX_STEPS));
    this.stop = subscribe(() => {
      const resolved = (this.step += 1) * perStep;
      if (resolved >= text.length) { this.glyphs.textContent = text; this.halt(); return; }
      let out = "";
      for (let i = 0; i < text.length; i += 1) {
        /* Whitespace is held fixed: on a monospaced face that keeps the word
           shape and the wrap points identical on every step. */
        out += (i < resolved || text[i] === " " || text[i] === "\u00A0")
          ? text[i]
          : SCRAMBLE_CHARACTERS[Math.floor(Math.random() * SCRAMBLE_CHARACTERS.length)];
      }
      this.glyphs.textContent = out;
    }, () => SCRAMBLE_STEP_MS);
  }
}

function wireScrambles(root) {
  for (const host of (root || document).querySelectorAll("[data-scramble]")) {
    if (host.dataset.wired) continue;
    host.dataset.wired = "1";
    const s = new Scramble(host);
    host.__scramble = s;
    const delay = host.dataset.delay === undefined ? undefined : Number(host.dataset.delay);
    const inView = host.hasAttribute("data-reveal");
    /* `revealInView` IS ENOUGH ON ITS OWN. It used to need a delay beside it or
       this returned before doing anything — so a label asking to decode on
       arrival, and only that, silently never decoded. Three headings on the page
       were written that way. A delay is a refinement of WHEN, not permission to
       run at all. */
    if (delay === undefined && !inView) continue;
    const wait = delay === undefined ? 0 : delay;
    if (!inView) { window.setTimeout(() => s.run(), wait); continue; }
    observeReveal(host, () => window.setTimeout(() => s.run(), wait));
  }
}

/* Applies the entrance on the same rule as the decode, so a label and the box
   it sits in arrive together. Every one of them is a spring from its start
   state (opacity 0, `--rise` px down) to rest, `--delay` ms after arriving —
   the project's <Inview mode="once"> / <Spring> with react-spring's default
   config. A fade-only entrance writes opacity alone. */
function wireRises(root) {
  for (const el of (root || document).querySelectorAll(".rise")) {
    if (el.dataset.risen) continue;
    el.dataset.risen = "1";
    if (reduced()) continue;
    const css = el.getAttribute("style") || "";
    const rise = /--rise:\s*(-?[\d.]+)px/.exec(css);
    const delay = /--delay:\s*([\d.]+)ms/.exec(css);
    const y = rise ? Number(rise[1]) : 12;
    const wait = delay ? Number(delay[1]) : 0;
    const spring = new SpringValue(0, (p) => {
      el.style.opacity = String(p);
      if (y !== 0) el.style.transform = p >= 1 ? "none" : "translate3d(0, " + ((1 - p) * y).toFixed(3) + "px, 0)";
    });
    observeReveal(el, () => spring.start(1, DEFAULT_SPRING, wait));
  }
}

/* ==========================================================================
   THE POINTER FIELD — one writer for the whole page.

   The lattice glow is CSS — a masked radial that every surface draws from the
   same two coordinates — so the page background and the opaque panels sitting on
   top of it light up in step without any per-element geometry. That only works
   if exactly one thing owns the values.
   ========================================================================== */
const LERP = 0.12;
const LAG_LERP = 0.045;
const frameLerp = (perFrame, deltaMs) => 1 - Math.pow(1 - perFrame, deltaMs / (1000 / 60));

(function pointerField() {
  if (coarsePointer() || reduced()) return;
  const root = document.documentElement;
  let rawX = -9999, rawY = -9999, x = -9999, y = -9999, lagX = -9999, lagY = -9999;
  let seen = false, last = 0;

  window.addEventListener("pointermove", (event) => {
    rawX = event.clientX; rawY = event.clientY;
    if (seen) return;
    /* Land on the first reading rather than easing in from off-screen. */
    seen = true; x = lagX = rawX; y = lagY = rawY;
  }, { passive: true });

  /* NO LEAVE HANDLER, on purpose. Sending the coordinates off-screen when the
     cursor leaves means the glow SLIDES away rather than stopping, and any
     spurious pointerleave — they happen — snaps it back on the next move. */
  subscribe((time) => {
    const delta = last ? Math.min(50, time - last) : 16;
    last = time;
    if (!seen && x < -9000) return;
    const k = frameLerp(LERP, delta), kLag = frameLerp(LAG_LERP, delta);
    x += (rawX - x) * k; y += (rawY - y) * k;
    lagX += (rawX - lagX) * kLag; lagY += (rawY - lagY) * kLag;
    root.style.setProperty("--hero-pointer-x", x + "px");
    root.style.setProperty("--hero-pointer-y", y + "px");
    root.style.setProperty("--hero-pointer-lag-x", lagX + "px");
    root.style.setProperty("--hero-pointer-lag-y", lagY + "px");
  }, () => 0);
})();

/* ==========================================================================
   SMOOTH SCROLL — the project's own Lenis, at the project's own lerp.

   `lerp: 0.075` rather than the library default of 0.1: measured, a wheel notch
   settles over about 25 frames instead of 15. `syncTouch` extends the same
   treatment to touch — it is off by default, which is why an earlier build
   glided on the desktop and scrolled natively on a phone. Anything asking for
   reduced motion gets the platform's own scrolling untouched: smoothing is
   motion the reader did not ask for.

   Driven from the shared ticker, so the page still runs exactly one rAF loop.

   > A hand-rolled follower stood here and was WRONG in a way worth recording.
   > It wrote `window.scrollTo` inside the ticker and guarded its own `scroll`
   > event with a synchronous `own` flag — but a scroll event is dispatched
   > ASYNCHRONOUSLY, after the frame, by which time the flag has flipped back.
   > So the guard never fired, the listener resynced `target = current` on every
   > single frame, and each wheel notch travelled about 7% of one step and
   > stopped. Lenis is not a convenience here; a smoother is a scheduling
   > problem and this is the one the project already solved.
   ========================================================================== */
/* Scroll to the top on load, as the project's ScrollLayout does. */
const lenis = new Lenis({ lerp: 0.075, smoothWheel: !reduced(), syncTouch: !reduced() });
subscribe((time) => lenis.raf(time), () => 0);

/* ==========================================================================

/* ---- Halvane: the markup is rendered at build time, so the template's builders (app.js 431-665) are not ported;
   wiring runs here, where the template ran it after building. ---- */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
wireScrambles();
wireRises();
for (const card of document.querySelectorAll(".product")) {
  const buttons = [...card.querySelectorAll(".swatches button")];
  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      buttons.forEach((b, j) => b.setAttribute("aria-pressed", j === index ? "true" : "false"));
    });
  });
}
/* Halvane: each swatch also brings its view of the speaker forward (the views are stacked and cross-faded). */
for (const card of document.querySelectorAll(".product")) {
  const buttons = [...card.querySelectorAll(".swatches button")];
  const views = [...card.querySelectorAll(".layer img")];
  buttons.forEach((button, index) => button.addEventListener("click", () => views.forEach((v, j) => (v.dataset.shown = j === index ? "1" : "0"))));
}

/* ==========================================================================
   THE HEADER'S SUBMENU
   ========================================================================== */
(function submenu() {
  const wrap = document.querySelector(".nav-item.has-menu > div");
  if (!wrap) return;
  const button = wrap.querySelector("button");
  const panel = wrap.querySelector(".nav-panel-wrap");
  const links = [...panel.querySelectorAll("a")];
  /* CLOSE ON A TIMER, cancelled by re-entering — the pointer needs to be allowed
     to leave the label on its way to the panel. */
  const CLOSE_DELAY_MS = 220;
  const TOUCH_GRACE_MS = 700;
  const hoverable = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let timer = null, lastTouch = 0, open = false;

  const setOpen = (value) => {
    open = value;
    button.setAttribute("aria-expanded", value ? "true" : "false");
    panel.classList.toggle("open", value);
    for (const a of links) a.tabIndex = value ? 0 : -1;
  };
  const cancel = () => { if (timer !== null) { clearTimeout(timer); timer = null; } };
  const schedule = () => { cancel(); timer = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS); };

  wrap.addEventListener("touchstart", () => { lastTouch = Date.now(); }, { passive: true });
  wrap.addEventListener("pointerenter", () => {
    if (!hoverable() || Date.now() - lastTouch < TOUCH_GRACE_MS) return;
    cancel(); setOpen(true);
  });
  wrap.addEventListener("pointerleave", () => {
    if (!hoverable() || Date.now() - lastTouch < TOUCH_GRACE_MS) return;
    schedule();
  });
  /* FOCUS DOES NOT OPEN IT, ACTIVATION DOES. Tapping a button focuses it and then
     clicks it, and focus arrives FIRST — so opening on focus and toggling on
     click cancelled each other out inside a single tap. Traced: aria-expanded
     went true at 155ms and false at 157ms. It is also the wrong pattern for a
     disclosure button, which is expected to respond to Enter or Space rather
     than to merely being tabbed to. Blur still closes it, so the group cannot be
     left hanging open behind a keyboard. */
  button.addEventListener("click", () => { cancel(); setOpen(!open); });
  wrap.addEventListener("focusout", (event) => {
    if (!wrap.contains(event.relatedTarget)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => { if (open && event.key === "Escape") { cancel(); setOpen(false); } });
  document.addEventListener("pointerdown", (event) => { if (open && !wrap.contains(event.target)) { cancel(); setOpen(false); } });
  setOpen(false);
})();

/* ==========================================================================
   THE PHONE MENU — a transcription of hero-menu.tsx (D-036).

   THE MENU BOOTS LIKE THE PAGE DOES. The lattice is drawn down the screen
   behind a scan line whose edge snaps to the lattice pitch, the rules draw
   across, and the labels rise out of their masks one after another, each
   decoding as it lands. Closing runs the film back up, quicker — the reader has
   already decided. Rows never fade: they slide out of an overflow:hidden mask,
   so their contrast holds on every frame.

   THE MENU DRAWS ITS OWN HEADER OVER THE PAGE'S, at the page's own measured
   boxes: the logo where the logo is, and a close control exactly over the
   burger whose bars cross into the x in step with the page's. The thing that
   opened the menu is, to the eye, the thing that shuts it.
   ========================================================================== */
const HERO_MENU = {
  open: { tension: 190, friction: 30 },
  close: { tension: 340, friction: 36 },
  row: { tension: 260, friction: 28 },
  glyph: { tension: 300, friction: 26 },
  enterLead: 150,
  enterStep: 45,
  leaveStep: 18,
  scanStep: 10,
};
const MENU_NAV = [
  { label: "The speaker", href: "#details" },
  { label: "Inside", href: "#technology" },
  { label: "Listen", href: "#sound" },
  { label: "Finishes", href: "#collections", submenu: ["Walnut", "Chalk", "Graphite"] },
];
const MENU_CART = { label: "Reserve a pair", href: "#reserve" };

(function phoneMenu() {
  const burger = document.getElementById("burger");
  if (!burger) return;
  const header = burger.closest("header");
  const glyphs = [burger.querySelector(".menu-glyph")];
  /* One value runs 0 (burger) -> 1 (x); every glyph on screen reads it. */
  const paintGlyph = (v) => {
    for (const g of glyphs) {
      const [top, mid, bottom] = g.children;
      top.style.transform = "translateY(calc(-50% - calc(0.46875 * var(--u)) * " + (1 - v) + ")) rotate(" + v * 45 + "deg)";
      mid.style.opacity = String(1 - v);
      mid.style.transform = "translateY(-50%) scaleX(" + (1 - v) + ")";
      bottom.style.transform = "translateY(calc(-50% + calc(0.46875 * var(--u)) * " + (1 - v) + ")) rotate(" + v * -45 + "deg)";
    }
  };
  const morph = new SpringValue(0, paintGlyph);

  const rect = (el) => { const r = el.getBoundingClientRect(); return { top: r.top, left: r.left, width: r.width, height: r.height }; };
  const place = (el, a) => { el.style.top = a.top + "px"; el.style.left = a.left + "px"; el.style.width = a.width + "px"; el.style.height = a.height + "px"; };

  let open = false, panel = null, reveal = null, rowSprings = [], restoreFocus = false, cleanup = null;

  const build = (anchors) => {
    const rows = MENU_NAV.flatMap((item, index) => [
      { label: item.label, href: item.href, main: true, index },
      ...(item.submenu || []).map((label) => ({ label, href: "#finish-" + label.toLowerCase(), main: false, index })),
    ]);
    const count = rows.length + 1;
    const el = document.createElement("div");
    el.id = "site-menu";
    el.className = "menu-panel lattice-panel";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Menu");
    const { toggle, logo } = anchors;
    const headerBottom = Math.max(toggle.top + toggle.height, logo ? logo.top + logo.height : 0);
    el.innerHTML =
      '<span class="menu-scan" aria-hidden="true"></span>' +
      (logo ? '<a class="menu-logo" href="#main" translate="no">Halvane <span>Audio</span></a>' : "") +
      '<button type="button" class="menu-toggle menu-close" aria-label="Close menu" aria-controls="site-menu" aria-expanded="true">' +
      '<span class="menu-glyph" aria-hidden="true"><i></i><i></i><i></i></span></button>' +
      '<div class="menu-scroll" style="padding-top:' + headerBottom + 'px">' +
      '<nav class="menu-nav" aria-label="Primary"><ul>' +
      rows.map((row, i) =>
        '<li class="menu-row ' + (row.main ? "main" : "sub") + '">' +
        (row.main ? '<span class="menu-rule" aria-hidden="true" data-rule="' + i + '"></span>' : "") +
        '<div class="menu-mask"><div class="menu-rise" data-rise="' + i + '"><a href="' + row.href + '">' +
        (row.main ? '<span class="menu-index">' + String(row.index + 1).padStart(2, "0") + "</span>" : "") +
        '<span data-scramble data-delay="' + (HERO_MENU.enterLead + i * HERO_MENU.enterStep + 120) + '">' + esc(row.label) + "</span>" +
        "</a></div></div></li>").join("") +
      '</ul><span class="menu-rule end" aria-hidden="true" data-rule="' + (rows.length - 1) + '"></span></nav>' +
      '<div class="menu-cart menu-mask"><div class="menu-rise" data-rise="' + rows.length + '"><a href="' + MENU_CART.href + '">' +
      '<span data-scramble data-delay="' + (HERO_MENU.enterLead + rows.length * HERO_MENU.enterStep + 120) + '">' + esc(MENU_CART.label) + "</span></a></div></div>" +
      "</div>";
    if (logo) place(el.querySelector(".menu-logo"), logo);
    place(el.querySelector(".menu-close"), toggle);

    /* The curtain: its edge snapped to the lattice so it uncovers whole cells,
       with the scan line riding it until it lands. */
    const travel = anchors.height;
    const scan = el.querySelector(".menu-scan");
    const edge = (v) => Math.min(travel, Math.round((v * travel) / HERO_MENU.scanStep) * HERO_MENU.scanStep);
    reveal = new SpringValue(0, (v) => {
      el.style.clipPath = "inset(0 0 " + Math.max(0, travel - edge(v)) + "px 0)";
      scan.style.opacity = String(v > 0.985 ? 0 : Math.min(1, v * 12));
      scan.style.transform = "translate3d(0, " + (edge(v) - 1) + "px, 0)";
    });
    reveal.set(0);

    rowSprings = Array.from({ length: count }, (_, i) => {
      const rises = el.querySelectorAll('[data-rise="' + i + '"]');
      const rules = el.querySelectorAll('[data-rule="' + i + '"]');
      return {
        y: new SpringValue(110, (v) => { for (const r of rises) r.style.transform = "translate3d(0, " + v + "%, 0)"; }),
        rule: new SpringValue(0, (v) => { for (const r of rules) r.style.transform = "scaleX(" + v + ")"; }),
      };
    });
    glyphs.push(el.querySelector(".menu-close .menu-glyph"));
    paintGlyph(morph.x);
    return el;
  };

  const animateRows = (isOpen) => {
    const count = rowSprings.length;
    rowSprings.forEach((s, i) => {
      const delay = isOpen ? HERO_MENU.enterLead + i * HERO_MENU.enterStep : (count - 1 - i) * HERO_MENU.leaveStep;
      s.y.start(isOpen ? 0 : 110, HERO_MENU.row, delay);
      s.rule.start(isOpen ? 1 : 0, HERO_MENU.row, delay);
    });
  };

  const unmount = () => {
    if (!panel) return;
    panel.remove();
    glyphs.length = 1;
    panel = null; reveal = null; rowSprings = [];
  };

  const setOpen = (value, returnFocus) => {
    if (value === open) return;
    open = value;
    burger.setAttribute("aria-expanded", value ? "true" : "false");
    burger.setAttribute("aria-label", value ? "Close menu" : "Open menu");
    morph.start(value ? 1 : 0, HERO_MENU.glyph, 0);

    if (value) {
      if (!panel) {
        const logoLink = header ? header.querySelector(".logo") : null;
        panel = build({ toggle: rect(burger), logo: logoLink ? rect(logoLink) : null, height: window.innerHeight });
        (document.querySelector(".hvx") || document.body).appendChild(panel);
        panel.querySelector(".menu-close").addEventListener("click", () => setOpen(false, true));
        panel.addEventListener("click", onNavigate, true);
        wireScrambles(panel);
      }
      reveal.start(1, HERO_MENU.open, 0);
      animateRows(true);

      /* Scroll-locked while open (Lenis stopped, html overflow hidden — the
         lattice's fixed layers resolve against the viewport), <main> inert,
         focus moved in and trapped. */
      const root = document.documentElement;
      const previousOverflow = root.style.overflow;
      root.style.overflow = "hidden";
      if (lenis) lenis.stop();
      const main = document.querySelector("main");
      if (main) main.setAttribute("inert", "");
      const onKeyDown = (event) => {
        if (event.key === "Escape") { setOpen(false, true); return; }
        if (event.key !== "Tab" || !panel) return;
        const focusables = [...panel.querySelectorAll("a[href], button")];
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      };
      document.addEventListener("keydown", onKeyDown);
      const firstLink = panel.querySelector("nav a[href]");
      if (firstLink) firstLink.focus({ preventScroll: true });
      cleanup = () => {
        document.removeEventListener("keydown", onKeyDown);
        if (main) main.removeAttribute("inert");
        root.style.overflow = previousOverflow;
        if (lenis) lenis.start();
        if (restoreFocus) burger.focus({ preventScroll: true });
        restoreFocus = false;
      };
      return;
    }

    restoreFocus = !!returnFocus;
    if (cleanup) { cleanup(); cleanup = null; }
    if (!panel) return;
    animateRows(false);
    const closing = panel;
    reveal.start(0, HERO_MENU.close, 0, () => { if (!open && panel === closing) unmount(); });
  };

  /* A same-page anchor: close first, then glide once the page can scroll. */
  const onNavigate = (event) => {
    const anchor = event.target.closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href") || "";
    if (!href.startsWith("#")) { setOpen(false, false); return; }
    event.preventDefault();
    setOpen(false, false);
    if (href.length < 2) return;
    window.setTimeout(() => {
      const target = document.querySelector(href);
      if (!target) return;
      if (lenis) lenis.scrollTo(target); else target.scrollIntoView({ behavior: "smooth" });
    }, 320);
  };

  burger.addEventListener("click", () => setOpen(!open, true));
})();

/* ==========================================================================
   THE CORNER MARKS' IDLES

   Driven from the shared ticker with a sine, the same way the product's idle
   drift is, and only while the mark is on screen — idle motion on something off
   screen is pure waste. Both marks are single white paths, so nothing inside them
   can be animated separately: the motion has to suit the whole shape.
   ========================================================================== */
const GLOBE_PERIOD_S = 3.4;
const GLOBE_SWING_DEG = 58;
/* Perspective depth, px. Small relative to the 37px glyph on purpose — it is what
   makes the near edge grow as the far edge shrinks, which is the difference
   between reading as a turn and reading as a squash. */
const GLOBE_PERSPECTIVE = 110;
const RETICLE_PING_S = 2.4;
const RETICLE_ATTACK = 0.1;
const RETICLE_RELEASE = 0.32;
const RETICLE_GAIN = 0.16;
const TAU = Math.PI * 2;

for (const glyph of document.querySelectorAll("[data-idle]")) {
  if (reduced()) continue;
  const motion = glyph.dataset.idle;
  let stop = null, start = 0;
  const run = (time) => {
    if (!start) start = time;
    const seconds = (time - start) / 1000;
    if (motion === "globe") {
      /* Swings either side of face-on rather than turning all the way round: past
         90 degrees a flat glyph mirrors, and a globe must never read as
         inside-out. */
      const angle = Math.sin((seconds / GLOBE_PERIOD_S) * TAU) * GLOBE_SWING_DEG;
      glyph.style.transform = "perspective(" + GLOBE_PERSPECTIVE + "px) rotateY(" + angle.toFixed(2) + "deg)";
      return;
    }
    /* A SIGHT PINGS; IT DOES NOT SCAN. Sharp rise, slower fall, then rest for
       most of the period — a steady throb would just flicker in the corner. */
    const phase = (seconds % RETICLE_PING_S) / RETICLE_PING_S;
    let envelope = 0;
    if (phase < RETICLE_ATTACK) envelope = phase / RETICLE_ATTACK;
    else if (phase < RETICLE_ATTACK + RETICLE_RELEASE) envelope = 1 - (phase - RETICLE_ATTACK) / RETICLE_RELEASE;
    const eased = envelope * envelope * (3 - 2 * envelope);
    glyph.style.transform = "scale(" + (1 + eased * RETICLE_GAIN).toFixed(4) + ")";
    glyph.style.opacity = (0.78 + 0.22 * eased).toFixed(3);
  };
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !stop) { start = 0; stop = subscribe(run, () => 0); }
    else if (!entry.isIntersecting && stop) { stop(); stop = null; }
  }).observe(glyph);
}

/* ==========================================================================
   THE REGION'S POINTER — a transcription of hero-pointer.ts.

   One pointermove listener on the product region writes raw coordinates; one
   subscription to the shared ticker smooths them and hands the same numbers to
   every consumer — the scene and the wordmark's torch read ONE instance per
   region, resolved from anywhere inside it, so they cannot drift out of phase.
   Coordinates are measured against the region's [data-pointer-frame] box (the
   pinned canvas), which does not go stale when the page scrolls under a still
   cursor.
   ========================================================================== */
const INTENSITY_IN_MS = 250;
const INTENSITY_OUT_MS = 400;
const FLING_WINDOW_MS = 100;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function createRegionPointer(events, frame) {
  const state = {
    rawX: 0, rawY: 0, x: 0, y: 0, lagX: 0, lagY: 0, intensity: 0, mode: "idle",
    width: frame.clientWidth, height: frame.clientHeight, engaged: false, dragDeltaX: 0, flingX: 0,
  };
  let rawX = 0, rawY = 0, previousRawX = 0;
  let intensityElapsed = 0, intensityFrom = 0, intensityTo = 0, lastTime = 0;
  const samples = [];
  const rampIntensity = (to) => { intensityFrom = state.intensity; intensityTo = to; intensityElapsed = 0; };

  events.addEventListener("pointermove", (event) => {
    const rect = frame.getBoundingClientRect();
    rawX = event.clientX - rect.left;
    rawY = event.clientY - rect.top;
    /* Land on the first reading rather than easing in from the corner. */
    if (!state.engaged) {
      state.x = state.lagX = rawX;
      state.y = state.lagY = rawY;
      previousRawX = rawX;
      state.engaged = true;
    }
    samples.push({ time: event.timeStamp, x: rawX });
    while (samples.length > 1 && event.timeStamp - samples[0].time > FLING_WINDOW_MS) samples.shift();
  }, { passive: true });
  events.addEventListener("pointerenter", () => { if (state.mode === "idle") state.mode = "hover"; rampIntensity(1); }, { passive: true });
  events.addEventListener("pointerleave", () => { if (state.mode !== "dragging") state.mode = "idle"; rampIntensity(0); }, { passive: true });

  new ResizeObserver(() => { state.width = frame.clientWidth; state.height = frame.clientHeight; }).observe(frame);

  /* THE SMOOTHED POSITION, REPUBLISHED IN VIEWPORT PIXELS for the opaque lattice
     panels' fixed-attachment highlight — written ONLY while a mouse is engaged
     and only when the rounded value moved. They live on <html>, so every write
     restyles the whole document and repaints each fixed-attachment panel;
     written on every scrolled frame on a phone that alone dropped 15-45% of the
     hero's and the details screen's frames. A touch screen publishes nothing. */
  const root = document.documentElement;
  const coarse = coarsePointer();
  let publishedX = "", publishedY = "";
  const publish = () => {
    if (coarse || !state.engaged) return;
    const rect = frame.getBoundingClientRect();
    const x = Math.round((rect.left + state.x) * 2) / 2 + "px";
    const y = Math.round((rect.top + state.y) * 2) / 2 + "px";
    if (x !== publishedX) root.style.setProperty("--hero-pointer-x", x);
    if (y !== publishedY) root.style.setProperty("--hero-pointer-y", y);
    publishedX = x; publishedY = y;
  };

  const tick = (time) => {
    const delta = lastTime ? Math.min(50, time - lastTime) : 16;
    lastTime = time;
    if (intensityTo !== state.intensity) {
      intensityElapsed += delta;
      const duration = intensityTo > intensityFrom ? INTENSITY_IN_MS : INTENSITY_OUT_MS;
      const progress = Math.min(1, intensityElapsed / duration);
      state.intensity = intensityFrom + (intensityTo - intensityFrom) * easeOutCubic(progress);
      if (progress === 1) state.intensity = intensityTo;
    }
    state.rawX = rawX; state.rawY = rawY;
    const k = frameLerp(LERP, delta), kLag = frameLerp(LAG_LERP, delta);
    state.x += (rawX - state.x) * k; state.y += (rawY - state.y) * k;
    state.lagX += (rawX - state.lagX) * kLag; state.lagY += (rawY - state.lagY) * kLag;
    state.dragDeltaX = state.mode === "dragging" ? rawX - previousRawX : 0;
    previousRawX = rawX;
    publish();
  };
  let unsubscribe = null;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !unsubscribe) { lastTime = 0; unsubscribe = subscribe(tick, () => 0); }
    else if (!entry.isIntersecting && unsubscribe) { unsubscribe(); unsubscribe = null; }
  }, { rootMargin: "10%" }).observe(events);

  /* Touch only: wait for 8px of travel; if the vertical component wins, the
     gesture is a scroll and goes back to the page; otherwise it is a drag. The
     release velocity is averaged over the last 100ms. */
  const attachDragTarget = (target) => {
    let dragStartX = 0, dragStartY = 0, dragPointerId = null;
    target.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "touch") return;
      dragStartX = event.clientX; dragStartY = event.clientY;
      dragPointerId = event.pointerId;
      samples.length = 0;
    }, { passive: true });
    target.addEventListener("pointermove", (event) => {
      if (dragPointerId !== event.pointerId) return;
      if (state.mode !== "dragging") {
        const dx = Math.abs(event.clientX - dragStartX);
        const dy = Math.abs(event.clientY - dragStartY);
        if (dx < 8 && dy < 8) return;
        if (dy > dx) { dragPointerId = null; return; }
        state.mode = "dragging";
        target.setPointerCapture(event.pointerId);
      }
    }, { passive: true });
    const endDrag = (event) => {
      if (dragPointerId !== event.pointerId) return;
      dragPointerId = null;
      if (state.mode !== "dragging") return;
      const first = samples[0], last = samples[samples.length - 1];
      if (first && last && last.time > first.time) state.flingX = ((last.x - first.x) / (last.time - first.time)) * 16.7;
      state.mode = state.intensity > 0 ? "hover" : "idle";
    };
    target.addEventListener("pointerup", endDrag, { passive: true });
    target.addEventListener("pointercancel", endDrag, { passive: true });
  };

  return { state, frame, attachDragTarget };
}

const regionPointers = new WeakMap();
/* Resolve the one pair every consumer must share, from anywhere inside it. */
function acquireRegionPointer(from) {
  const region = from.closest("[data-product-region]") || from;
  const frame = region.querySelector("[data-pointer-frame]") || region;
  let pointer = regionPointers.get(region);
  if (!pointer) { pointer = createRegionPointer(region, frame); regionPointers.set(region, pointer); }
  return pointer;
}

/* ==========================================================================
   THE WORDMARK'S TORCH — a transcription of hero-wordmark.tsx.

   The plate's artwork is chromed lettering, and CHROME IS ONLY CHROME WHEN
   SOMETHING MOVES OVER IT. On the frame, with a mouse, that is the cursor: a
   soft disc following the region pointer's SMOOTHED position, its opacity the
   pointer's intensity. Anywhere else there is no cursor, so the same aperture
   is driven across the mark on its own — a slanted BAND, because a sweep is
   what reads as a highlight travelling over metal, while a spot reads as a
   torch.

   Built as a MOVING WINDOW OVER A SECOND COPY rather than a mask that follows
   the cursor: a mask-position animated per frame repaints the whole plate every
   frame. This way the only thing that changes is a transform on two small
   boxes — the window translates to the cursor and the copy inside it translates
   back by the same amount, so the copy stays registered with the plate.
   ========================================================================== */
const REVEAL_RADIUS = 260;
/* The disc, as a share of the plate's longer side — capped, so in a phone's
   product box it stays a PART of the plate rather than lighting all of it. */
const REVEAL_SHARE = 0.42;
/* SWEEP_S is the crossing; the rest of SWEEP_CYCLE_S is the pause. */
const SWEEP_S = 2.6;
const SWEEP_CYCLE_S = 7.4;
const SWEEP_BAND = 0.42;
const SWEEP_STRENGTH = 1;
/* The band BRIGHTENS what it carries: lifting a dark, mostly-transparent
   artwork from 20% to 100% moves its pixels by ten levels at a phone's size. */
const SWEEP_FILTER = "brightness(2.6) contrast(1.1)";
const SWEEP_MASK = "linear-gradient(100deg, transparent 0%, rgb(0 0 0 / 0.35) 32%, #000 50%, rgb(0 0 0 / 0.35) 68%, transparent 100%)";
const DISC_MASK = "radial-gradient(circle closest-side, #000 0%, rgba(0,0,0,0.75) 45%, transparent 100%)";
/* The plate's own breath while the band drifts — what actually reads at a
   phone's size, because it acts on every mark at once. A different period from
   the sweep, so the pair never pulses together. */
const PLATE_BREATH_LOW = 0.8;
const PLATE_BREATH_HIGH = 1.7;
const PLATE_BREATH_S = 6.7;
/* No cursor to follow, so the drift is stepped at 30fps, not 60. */
const DRIFT_FRAME_MS = 1000 / 30;
const BACKDROP_OPACITY = 0.2;

/* Calls onPainted once the browser has REPORTED painting `element` as a
   largest-contentful-paint candidate, or after fallbackMs, whichever is first. */
function whenPainted(element, onPainted, fallbackMs) {
  let done = false, observer = null;
  const fire = () => {
    if (done) return;
    done = true;
    if (observer) observer.disconnect();
    window.clearTimeout(timer);
    onPainted();
  };
  const timer = window.setTimeout(fire, fallbackMs === undefined ? 1000 : fallbackMs);
  try {
    observer = new PerformanceObserver((list) => {
      if (list.getEntries().some((entry) => entry.element === element)) fire();
    });
    observer.observe({ type: "largest-contentful-paint", buffered: true });
  } catch (e) { /* No LCP API: the fallback timer decides. */ }
}

(function wordmark() {
  const wrap = document.getElementById("wordmark");
  if (!wrap) return;
  const box = wrap.querySelector(".wm-box");
  const base = wrap.querySelector(".wm-plate");
  const aperture = wrap.querySelector(".wm-window");
  const inner = wrap.querySelector(".wm-inner");

  /* THE PLATE IS SERVED AT REST, and fades in after its paint is reported. It
     is the page's largest paint on a phone; starting it at opacity 0 held the
     first paint back until script time. It sits under the loading curtain
     either way, so nobody sees the swap. */
  if (!reduced()) {
    const fade = new SpringValue(1, (v) => { wrap.style.opacity = String(v); });
    whenPainted(base, () => { fade.set(0); fade.start(1, DEFAULT_SPRING, 0); });
  }

  if (reduced()) return;
  const pointer = acquireRegionPointer(box);

  let visible = false, radius = REVEAL_RADIUS, plateW = 0, plateH = 0, band = 0;
  const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const frameQuery = window.matchMedia(FRAME_QUERY);
  let drifting = !hoverQuery.matches || !frameQuery.matches;

  const applyShape = () => {
    if (drifting) {
      band = Math.max(64, plateW * SWEEP_BAND);
      aperture.style.width = band + "px";
      aperture.style.height = plateH + "px";
      aperture.style.maskImage = SWEEP_MASK;
      aperture.style.webkitMaskImage = SWEEP_MASK;
      inner.style.filter = SWEEP_FILTER;
      return;
    }
    aperture.style.width = radius * 2 + "px";
    aperture.style.height = radius * 2 + "px";
    aperture.style.maskImage = DISC_MASK;
    aperture.style.webkitMaskImage = DISC_MASK;
    inner.style.filter = "";
  };
  const syncMode = () => {
    drifting = !hoverQuery.matches || !frameQuery.matches;
    if (plateW) applyShape();
    if (!drifting) base.style.opacity = String(BACKDROP_OPACITY);
  };
  hoverQuery.addEventListener("change", syncMode);
  frameQuery.addEventListener("change", syncMode);

  const syncSize = () => {
    const rect = box.getBoundingClientRect();
    plateW = rect.width; plateH = rect.height;
    inner.style.width = rect.width + "px";
    inner.style.height = rect.height + "px";
    radius = Math.min(REVEAL_RADIUS, Math.max(rect.width, rect.height) * REVEAL_SHARE);
    applyShape();
  };
  syncSize();
  new ResizeObserver(syncSize).observe(box);

  subscribe((time) => {
    if (drifting) {
      if (!plateW || !plateH) return;
      const cycle = (time / 1000) % SWEEP_CYCLE_S;
      const swell = (PLATE_BREATH_LOW + PLATE_BREATH_HIGH) / 2 +
        ((PLATE_BREATH_HIGH - PLATE_BREATH_LOW) / 2) * Math.sin((time / 1000 / PLATE_BREATH_S) * Math.PI * 2);
      base.style.opacity = String(BACKDROP_OPACITY * swell);
      if (cycle > SWEEP_S) {
        if (visible) { visible = false; aperture.style.opacity = "0"; }
        return;
      }
      const p = cycle / SWEEP_S;
      const left = -band + p * (plateW + band * 2);
      visible = true;
      aperture.style.transform = "translate3d(" + left + "px, 0, 0)";
      inner.style.transform = "translate3d(" + -left + "px, 0, 0)";
      aperture.style.opacity = String(SWEEP_STRENGTH);
      return;
    }
    const state = pointer.state;
    const shown = state.engaged && state.intensity > 0.001;
    if (shown !== visible) { visible = shown; if (!shown) aperture.style.opacity = "0"; }
    if (!shown) return;
    const rect = box.getBoundingClientRect();
    const frameRect = pointer.frame.getBoundingClientRect();
    const x = state.x + frameRect.left - rect.left;
    const y = state.y + frameRect.top - rect.top;
    aperture.style.transform = "translate3d(" + (x - radius) + "px, " + (y - radius) + "px, 0)";
    inner.style.transform = "translate3d(" + (radius - x) + "px, " + (radius - y) + "px, 0)";
    aperture.style.opacity = String(state.intensity);
  }, () => (drifting ? DRIFT_FRAME_MS : 0));
})();

/* ==========================================================================
   THE COLLECTIONS CARD TILT

   The card turns towards the corner the cursor is in and the garment stands off
   its face. Three elements and each has one job — the <li> owns the lens
   (perspective), the panel inside owns the rotation and preserve-3d, and the
   photographs sit in a layer of their own with a translateZ. THE PARALLAX IS THEN
   THE PERSPECTIVE'S OWN DOING, not a second animation kept in step with the
   first; the small pointer-driven translate on top carries the effect on the axis
   the tilt cannot, keeping it alive while the card is still nearly flat on.

   One spring solver stands in for @react-spring/web, with its config: slower than
   a hover fade on purpose, because the cursor is a noisy input and the box is
   large, and with NO OVERSHOOT — a card that wobbles after the cursor stops reads
   as loose, not as heavy.
   ========================================================================== */
const TILT = { tilt: 6.5, lens: 60, depth: 2.5, drift: 0.55 };
const TILT_CONFIG = { tension: 170, friction: 26, mass: 1 };

for (const card of document.querySelectorAll(".product")) {
  const panel = card.querySelector(".panel");
  const layer = card.querySelector(".layer");
  card.style.perspective = "calc(" + TILT.lens + " * var(--u))";
  /* The Z is constant, so the layer stands off the card at rest too and does not
     appear to detach the moment the cursor arrives. */
  layer.style.transform = "translate3d(0px, 0px, calc(" + TILT.depth + " * var(--u)))";

  let nx = 0, ny = 0, tx = 0, ty = 0, vx = 0, vy = 0, stop = null, last = 0;
  let checkedReduced = null;

  const step = (time) => {
    const dt = Math.min(0.05, (last ? time - last : 16) / 1000);
    last = time;
    /* The same ODE @react-spring/web solves: a = (k*(target - x) - c*v) / m. */
    const ax = (TILT_CONFIG.tension * (tx - nx) - TILT_CONFIG.friction * vx) / TILT_CONFIG.mass;
    const ay = (TILT_CONFIG.tension * (ty - ny) - TILT_CONFIG.friction * vy) / TILT_CONFIG.mass;
    vx += ax * dt; vy += ay * dt;
    nx += vx * dt; ny += vy * dt;
    /* THE CORNER UNDER THE CURSOR GOES AWAY, so the card leans towards the hand.
       Reversed, it reads as the card dodging the cursor. */
    panel.style.transform = "rotateX(" + (-ny * TILT.tilt).toFixed(3) + "deg) rotateY(" + (nx * TILT.tilt).toFixed(3) + "deg)";
    layer.style.transform =
      "translate3d(calc(" + (nx * TILT.drift).toFixed(4) + " * var(--u)), calc(" + (ny * TILT.drift * 0.7).toFixed(4) + " * var(--u)), calc(" + TILT.depth + " * var(--u)))";
    if (Math.abs(vx) + Math.abs(vy) + Math.abs(tx - nx) + Math.abs(ty - ny) < 1e-4 && tx === 0 && ty === 0) {
      nx = ny = vx = vy = 0;
      panel.style.transform = "";
      layer.style.transform = "translate3d(0px, 0px, calc(" + TILT.depth + " * var(--u)))";
      if (stop) { stop(); stop = null; }
    }
  };
  const wake = () => { if (!stop) { last = 0; stop = subscribe(step, () => 0); } };

  panel.addEventListener("pointermove", (event) => {
    /* A pointer that reports itself as a mouse is the only one this is for: touch
       has no hover, and tilting a card under the finger already covering it is
       motion nobody sees. */
    if (event.pointerType !== "mouse") return;
    if (checkedReduced === null) checkedReduced = reduced();
    if (checkedReduced) return;
    const box = panel.getBoundingClientRect();
    if (!box.width || !box.height) return;
    /* -1 at the left/top edge, +1 at the right/bottom. Clamped, because a child
       may overhang the box the angle is measured against. */
    const clamp = (v) => Math.min(1, Math.max(-1, v));
    tx = clamp(((event.clientX - box.left) / box.width) * 2 - 1);
    ty = clamp(((event.clientY - box.top) / box.height) * 2 - 1);
    wake();
  });
  panel.addEventListener("pointerleave", () => { tx = 0; ty = 0; wake(); });
}

/* ==========================================================================
   THE TECHNOLOGY WALK

   The artboards are five states of one composition: the stack never moves, and a
   single card steps down it, each with a leader line to its own layer. ALL FIVE
   CARDS ARE RENDERED AND CROSS-FADED rather than swapped: the markup never
   changes, so there is nothing to re-layout on a scroll frame, and a screen
   reader is handed all five specifications regardless of scroll position — which
   a scroll-gated one would not be.

   Progress is read once per frame from the shared ticker and state is written
   only when the active layer actually changes, so scrolling costs one rect read
   and no work in between.
   ========================================================================== */
/* How much scroll each layer after the first is given, as a share of the
   viewport. 0.4, down from 0.7 in two steps on the client's call — the cards were
   changing too slowly for the scroll they cost. Five layers now take 1.6
   viewports where they took 2.8. This is close to the floor: below roughly 0.35
   the stack starts to skip a card under a trackpad flick, because a single
   inertial scroll covers more than one step. It appears in two places that must
   agree — the region's height in CSS and the arithmetic here. */
const LAYER_STEP = 0.4;
document.getElementById("technology").style.setProperty("--technology-region", String(1 + (LAYERS.length - 1) * LAYER_STEP));

(function technologyWalk() {
  const section = document.getElementById("technology");
  const cards = [...document.querySelectorAll("#technology-cards .layer-card")];
  const leaders = [...document.querySelectorAll("#technology-cards .leader")];
  if (!cards.length) return;

  let active = 0, entered = false;
  /* The entrance is carried by the CARDS THEMSELVES, not by a wrapper: a
     transformed wrapper becomes the containing block for its absolutely
     positioned descendants, and would silently re-base every one of them off the
     artboard's coordinates. */
  observeReveal(section, () => {
    entered = true;
    for (const c of cards) c.classList.add("entered");
    apply();
  });

  /* Wired up front, not on first activation: the project's <ScrambleText tieProse>
     binds the small words from the first paint, so the inactive cards already
     carry their tied wrap points when they fade in. */
  for (const card of cards) {
    for (const el of card.querySelectorAll("[data-card-title]")) {
      el.setAttribute("data-scramble", ""); el.dataset.wired = "1"; el.__scramble = new Scramble(el);
    }
  }

  const decode = (card) => {
    /* Re-decodes each time this layer becomes the active one — the card is the
       only thing that moves, so the decode is what marks the step. */
    for (const [el, delay] of [[card.querySelector("[data-card-title]"), 0]]) {
      if (!el) continue;
      if (!el.__scramble) { el.setAttribute("data-scramble", ""); el.dataset.wired = "1"; el.__scramble = new Scramble(el); }
      window.setTimeout(() => el.__scramble.run(), delay);
    }
  };

  const apply = () => {
    cards.forEach((c, i) => c.classList.toggle("active", entered && i === active));
    leaders.forEach((l, i) => l.classList.toggle("active", entered && i === active));
    if (entered) decode(cards[active]);
  };

  let current = -1;
  subscribe(() => {
    const travel = section.offsetHeight - window.innerHeight;
    if (travel <= 0) return;
    const progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / travel));
    /* Equal bands, one per layer; the last one runs to the end. */
    const next = Math.min(LAYERS.length - 1, Math.floor(progress * LAYERS.length));
    if (next === current) return;
    current = next;
    active = next;
    apply();
  }, () => 0);
})();

/* ==========================================================================
   THE TECHNOLOGY REEL — a canvas over decoded stills, scrubbed by scrolling.

   SCRUBBED, NOT PLAYED. The section is already a pinned stage whose scroll walks
   a card down the layers, and the reel runs on the same clock — so the picture
   and the specification move together and the reader can hold either still.

   A CANVAS OVER KEYED STILLS, NOT A <video> WHOSE currentTime IS WRITTEN. Three
   rounds of tuning got the video scrub to provably optimal seeking and it still
   juddered, because the thing being optimised was the wrong thing: a decoder
   serves whole pictures at whatever rate it can, and the reader's scroll does not
   land on picture boundaries. drawImage of two already-decoded frames is
   synchronous, has no in-flight state to guard against, and — crucially — can
   show the picture BETWEEN two frames rather than the nearer of them.
   ========================================================================== */
/* How fast the playhead chases the scroll, per frame. The scroll is a coarse
   signal and a playhead placed straight onto it stutters — a wheel flick asks for
   half the clip in one frame and the picture snaps. Quoted per 60Hz step and
   rebased against the real frame delta each tick, so the reel tracks the same way
   on a 120Hz panel as on a 60Hz one. */
const SEEK_FOLLOW = 0.45;
const FOLLOW_STEP_MS = 1000 / 60;
/* THE BINDING CONSTRAINT IS RESIDENT MEMORY, NOT DOWNLOAD. A decoded ImageBitmap
   costs side^2 * 4 bytes however cheap it was on the wire, so the 61-frame set is
   137MB the moment it finishes decoding. A desktop tab carries that; a phone is
   killed by it. The breakpoint is the LAYOUT's own, not a device-pixel
   measurement: a modern phone at DPR 3 asks for more backing store than the
   desktop box does and has far less room to hold it, so pixel density is exactly
   the wrong signal here. */
const REEL_TIERS = { hi: { dir: "hi", side: 768, count: 61 }, lo: { dir: "lo", side: 512, count: 41 } };
const TIER_BREAKPOINT = 1024;
/* Enough to saturate a connection, few enough to stay ordered. */
const FETCH_CONCURRENCY = 6;
/* How far the reel lags the page once the stage stops being pinned, in viewport
   heights. The same ramp as the product's exit: a pinned element's apparent
   velocity goes from zero to the page's own in a single frame when it releases,
   and holding back by L(1 - e^(-x/L)) has a derivative of exactly 1 at the seam,
   so the reel starts leaving perfectly still. L IS ALSO THE LARGEST DISTANCE IT
   CAN FALL BEHIND, and this box has less room for that than the product does: the
   artwork ends 45 units above its stage's bottom edge and nothing clips it, so
   whatever it lags by hangs into the screen below. At a third of a viewport that
   was a sheet of the stack sitting over the next section. */
const REEL_RELEASE_LAG = 0.15;
/* How far AHEAD of the pinned stage the reel starts running, in viewports. At 0
   the first frame is what the reader sees for the whole of the screen's arrival,
   and it only starts moving once the stage has finished pinning — the picture is
   dead exactly while the eye is on it. */
const ENTRY_LEAD = 1;
/* The blend weight lands in an 8-bit channel, so a move of less than 1/255 of the
   gap between two frames cannot change a pixel. */
const REPAINT_EPSILON = 1 / 255;

/* Built only when the section is near — one viewport of lead, then an idle
   callback — like the project's <NearViewport lead={1}>. Twelve megabytes of
   frames seven screens from the top of the page are not a first-paint cost. */
function whenNear(node, lead, task) {
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    afterHeroPaint(() => {
      if (typeof requestIdleCallback === "function") requestIdleCallback(task, { timeout: 1000 });
      else window.setTimeout(task, 0);
    });
  }, { rootMargin: Math.round(lead * 100) + "% 0px" });
  observer.observe(node);
}

whenNear(document.getElementById("reel-box"), 1, function reel() {
  const canvas = document.getElementById("reel-canvas");
  const poster = document.getElementById("reel-poster");
  const section = document.getElementById("technology");
  if (!canvas) return;
  if (poster && poster.dataset.src) poster.src = poster.dataset.src;

  const tier = window.innerWidth >= TIER_BREAKPOINT ? REEL_TIERS.hi : REEL_TIERS.lo;
  const side = tier.side, count = tier.count;
  canvas.width = side;
  canvas.height = side;

  /* `alpha` is the whole point — the ground was keyed out so the page's lattice
     reads through it. `desynchronized` lets the compositor take the surface
     without a round trip through the main thread's paint, which is exactly the
     pattern here: one draw per rAF, never read back. */
  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) return;
  /* Set once, never per frame: clearRect is unaffected by it, and every draw
     wants the additive blend.

     THE BLEND IS ADDITIVE ON A CLEARED CANVAS, AND THAT IS NOT A STYLISTIC
     CHOICE. Drawing frame A then frame B at globalAlpha = t under the default
     source-over is not a cross-dissolve: where B is transparent, A survives at
     full strength, so the stack's old position never leaves and the motion
     smears. Clearing first and adding (1-t)A + tB with "lighter" interpolates
     colour AND alpha in premultiplied space, which is the correct dissolve. The
     weights sum to one, so nothing clips.

     THE FRAMES CARRY A REAL ALPHA CHANNEL, written at export time.
     mix-blend-mode: difference is the obvious answer for a lit object on black
     and it does nothing here: a blend composites against the backdrop WITHIN THE
     NEAREST ANCESTOR STACKING CONTEXT, and this section pins its stage with
     position: sticky, which creates one. Everything the artwork could blend with
     — the page's lattice — is outside it. Verified rather than assumed: with the
     stage forced to position: relative the blend works and the grid reads through
     the artwork; back on sticky, the black rectangle returns. The pin is not
     negotiable. A real key survives any stacking context, any ancestor, and the
     mobile layout where there is no sticky element at all — and it costs nothing
     at runtime. */
  ctx.globalCompositeOperation = "lighter";

  const frames = new Array(count).fill(null);
  let decoded = 0, disposed = false;
  const framePath = (index) => ASSETS + "/reel/" + tier.dir + "/" + String(index).padStart(3, "0") + ".webp";

  /* The nearest frame that has actually arrived, searching outward. The set loads
     in order, so early in the scroll this is almost always the frame itself; a
     reader who flicks to the end before loading finishes sees the last frame that
     made it rather than an empty box. */
  const nearest = (index) => {
    for (let step = 0; step < count; step += 1) {
      const before = frames[index - step];
      if (before) return before;
      const after = frames[index + step];
      if (after) return after;
    }
    return null;
  };

  let painted = Number.NaN;
  const draw = (position, force) => {
    if (!force && Math.abs(position - painted) < REPAINT_EPSILON) return;
    const lower = Math.floor(position);
    const upper = Math.min(count - 1, lower + 1);
    const a = nearest(lower);
    if (!a) return;
    const b = nearest(upper) || a;
    const t = position - lower;
    ctx.clearRect(0, 0, side, side);
    ctx.globalAlpha = 1 - t;
    ctx.drawImage(a, 0, 0, side, side);
    ctx.globalAlpha = t;
    ctx.drawImage(b, 0, 0, side, side);
    painted = position;
    /* The poster has done its job the moment there is a real picture under it.
       Opacity rather than unmount: the fade covers the seam between a filtered
       still and a keyed frame, which are close but not identical at the very
       darkest layers. */
    if (poster && poster.style.opacity !== "0") poster.style.opacity = "0";
  };

  /* createImageBitmap off a blob decodes on a WORKER THREAD, so none of this
     lands on the frame the scroll is using — which is the reason the frames are
     not plain <img> elements. An <img> defers its decode to the first drawImage,
     and that decode is synchronous and on the main thread: it would put back
     exactly the stall this design removes. */
  let cursor = 0;
  let reported = false;
  const pump = async () => {
    while (!disposed) {
      const index = cursor;
      cursor += 1;
      if (index >= count) return;
      const url = framePath(index);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("HTTP " + response.status);
        const bitmap = await createImageBitmap(await response.blob());
        if (disposed) { bitmap.close(); return; }
        frames[index] = bitmap;
        decoded += 1;
        /* Repaint on arrival, so the box fills in as the set lands rather than
           waiting for the reader to move. */
        draw(Number.isNaN(painted) ? 0 : painted, true);
      } catch (err) {
        /* A frame that will not load is one the neighbour search covers. Failing
           the whole reel over it would be worse than a longer blend — but a reel
           that never arrives at all must still say so. */
        if (!reported && index === 0) { reported = true; assetFailure(url, err); }
      }
    }
  };
  Promise.all(Array.from({ length: FETCH_CONCURRENCY }, () => pump()));

  let playhead = 0, lastTime = 0, pinnedTop = null;
  const frameMatch = window.matchMedia(FRAME_QUERY);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  /* TWO WAYS TO MEASURE, BECAUSE THE SECTION HAS TWO SHAPES. In the frame it is a
     pinned stage inside a region several viewports tall, and the scroll that
     matters is that region's own travel — the same number the card walk reads, so
     the two cannot drift apart. Below the frame there is no pinning and the
     section is barely taller than its content, so progress is the box's own
     crossing of the viewport instead. */
  const readProgress = () => {
    const viewport = window.innerHeight || 1;
    const travel = section.offsetHeight - viewport;
    /* Pinned only where the CSS pins (FRAME_QUERY). The stacked layout can be taller than the
       viewport too (tablet: heading, reel and five cards), and reading that as a pinned run
       dropped the reel onto the cards. */
    if (frameMatch.matches && travel > 0) {
      /* The lead is part of the run, not an offset on it: 0 with the section's
         top edge a lead's worth below the fold, 1 when the pinned travel is done.
         The reel therefore still ends exactly where the card walk does — it
         simply starts before the stage has locked. */
      const lead = viewport * ENTRY_LEAD;
      return clamp01((lead - section.getBoundingClientRect().top) / (lead + travel));
    }
    const box = canvas.getBoundingClientRect();
    return clamp01((viewport - box.top) / (viewport + box.height));
  };

  /* The exit ramp, applied to the REEL rather than to the stage: the heading, the
     note and the walking card leave with the screen, and only the picture hangs
     back — which is the parallax the rest of the page already reads as depth. */
  const applyRelease = (progress, viewport) => {
    /* THE BOX, NOT THE CANVAS. The ramp is written as a transform on the canvas,
       and a transformed element's own rect includes it — measuring there feeds
       the drop back into its own input and the ramp stalls at a fixed point a
       third of the way in. The parent carries no transform, so it is the one
       thing here still reporting where the layout actually is. */
    const box = canvas.parentElement || canvas;
    const boxTop = box.getBoundingClientRect().top;
    if (progress < 1) pinnedTop = boxTop;
    const released = pinnedTop === null ? 0 : Math.max(0, pinnedTop - boxTop);
    const lag = viewport * REEL_RELEASE_LAG;
    const drop = lag * (1 - Math.exp(-released / lag));
    const transform = drop > 0.5 ? "translate3d(0, " + drop.toFixed(1) + "px, 0)" : "";
    canvas.style.transform = transform;
    /* The poster rides along until it has faded, or the two separate visibly
       during the hand-off. */
    if (poster && decoded === 0) poster.style.transform = transform;
  };

  subscribe((time) => {
    const delta = lastTime ? Math.min(50, time - lastTime) : FOLLOW_STEP_MS;
    lastTime = time;
    const viewport = window.innerHeight || 1;
    const progress = readProgress();
    if (frameMatch.matches && section.offsetHeight - viewport > 0) applyRelease(progress, viewport);
    else if (pinnedTop !== null) { pinnedTop = null; canvas.style.transform = ""; if (poster) poster.style.transform = ""; }
    /* The follower is integrated every frame and the draw is unconditional after
       it — there is no decoder to be busy, so the two cannot fall out of step. */
    const follow = 1 - Math.pow(1 - SEEK_FOLLOW, delta / FOLLOW_STEP_MS);
    playhead += (progress - playhead) * follow;
    draw(playhead * (count - 1), false);
  }, () => 0);
});

/* ==========================================================================
   DEVICE TILT — a transcription of src/lib/scene/device-tilt.ts (D-036).

   The gyroscope as a cursor, for the travelling instance on a coarse pointer.
   A module-level reader, not a second loop: the scene calls readTilt(dt)
   inside its own frame. `deviceorientation` is listened to from the start
   (Android streams at once); iOS 13+ sends nothing until
   DeviceOrientationEvent.requestPermission() is called inside a user gesture,
   so the first touchend / click asks, and an ask rejected for want of a gesture
   re-arms for the next one. The reading is relative to how the phone was held
   at the first sample and re-centres slowly. Until a sensor reading arrives the
   target is a slow idle sway, so the garment is never dead.
   ========================================================================== */
const TILT_RANGE_DEG = 22;   // tilt that reads +-1
const TILT_EASE = 6;         // 1/s
const TILT_RECENTRE = 0.15;  // 1/s
const deviceTilt = (() => {
  let started = 0, active = false, hasSensor = false, base = null, clock = 0, lastT = 0;
  let raw = { x: 0, y: 0 };
  const out = { x: 0, y: 0 };
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  const screenAngle = () =>
    (typeof screen !== "undefined" && screen.orientation && screen.orientation.angle) ||
    (typeof window.orientation === "number" ? window.orientation : 0);
  const onOrientation = (e) => {
    if (e.beta == null || e.gamma == null) return;
    hasSensor = true;
    const a = screenAngle();
    let b = e.beta, g = e.gamma;
    if (a === 90) [b, g] = [g, -b];
    else if (a === -90 || a === 270) [b, g] = [-g, b];
    if (!base) base = { b, g };
    const now = performance.now();
    const dt = lastT ? Math.min((now - lastT) / 1000, 0.1) : 0;
    lastT = now;
    const k = 1 - Math.exp(-TILT_RECENTRE * dt);
    base.b += (b - base.b) * k;
    base.g += (g - base.g) * k;
    raw = { x: clamp((g - base.g) / TILT_RANGE_DEG), y: clamp((b - base.b) / TILT_RANGE_DEG) };
  };
  const disarm = () => { removeEventListener("touchend", askOnce); removeEventListener("click", askOnce); };
  const arm = () => { addEventListener("touchend", askOnce, { passive: true }); addEventListener("click", askOnce, { passive: true }); };
  function askOnce() {
    if (hasSensor) return disarm();
    const api = window.DeviceOrientationEvent;
    const ask = api && api.requestPermission ? api.requestPermission() : null;
    if (!ask) return disarm();
    disarm();
    ask.then((s) => { if (s !== "granted") hasSensor = false; }).catch(() => { if (active) arm(); });
  }
  return {
    start() {
      if (started++ > 0) return active;
      if (reduced() || !window.matchMedia("(pointer: coarse)").matches) return false;
      active = true;
      addEventListener("deviceorientation", onOrientation, { passive: true });
      const api = window.DeviceOrientationEvent;
      if (api && typeof api.requestPermission === "function") arm();
      return true;
    },
    read(dt) {
      if (!active) return out;
      clock += dt;
      const target = hasSensor ? raw : { x: Math.sin(clock * 0.45) * 0.35, y: Math.sin(clock * 0.31 + 1.3) * 0.2 };
      const k = 1 - Math.exp(-TILT_EASE * dt);
      out.x += (target.x - out.x) * k;
      out.y += (target.y - out.y) * k;
      return out;
    },
  };
})();
const FRAME_WIDTH = 1440;
const FRAME_HEIGHT = 800;
/* The silhouette's height in the hero, and how far above the section's centre it
   sits. */
const SUBJECT_HEIGHT = 570;
const SUBJECT_RISE = 36;
/* Boxed — below the frame, where the canvas is the product's own box in the flow
   and the artboard's coordinates mean nothing. */
const BOXED_FILL_Y = 0.97;
const BOXED_FILL_X = 0.93;
const BOXED_DROP = 0.025;
/* Where the journey ends: the details screen's framing, read off the photograph
   the model replaces. */
const DETAILS_HEIGHT = 795;
const DETAILS_DROP = 140;
const DETAILS_SHIFT_X = -92;
/* The turn the product makes on the way down. */
const SCROLL_TURN = MathUtils.degToRad(40);

/* Smootherstep — the pinned instance's approach reads as one gesture, so it keeps
   the symmetric curve. */
const ease = (t) => t * t * t * (t * (t * 6 - 15) + 10);
/* The journey gets an asymmetric one instead: it leaves early and arrives long,
   so the garment is already growing as the second screen comes up. */
const DRIFT_TAIL = 2.2;
const drift = (t) => 1 - Math.pow(1 - t, DRIFT_TAIL);

/* Hover rotation: absolute targets, not increments, so the cursor's place in the
   section IS the angle and a sweep can always be undone. */
const TURN_MAX = MathUtils.degToRad(24);
const ROLL_MAX = MathUtils.degToRad(12);
const TILT_MAX_X = MathUtils.degToRad(3);
/* The phone's own tilt, on touch only, where there is no cursor to read.
   readTilt() is +-1 at 22 degrees of tilt (or a slow idle sway before iOS grants
   the sensor), so a hand's ordinary sway turns the garment a few degrees. It
   feeds the same targets the cursor does, so the rotation spring smooths it and
   the sleeves trail it — the product breathes with the phone, it does not
   twitch. */
const GYRO_TURN = MathUtils.degToRad(12);
const GYRO_PITCH = MathUtils.degToRad(6);
const PARALLAX = 12;
const TILT_STIFFNESS = 0.08;
const TILT_DAMPING = 0.52;
const TILT_DRAG_SCALE = 0.3;
/* Touch has no hover, so a horizontal swipe still turns the product and a release
   still throws it. */
const DRAG_DEGREES_PER_PX = 0.4;
const SPIN_FRICTION = 0.94;
const SPIN_STOP = MathUtils.degToRad(0.05);
/* HOVER AUTHORITY IS TAKEN AND HANDED BACK CONTINUOUSLY, and what the gate reads
   is the scroll's SPEED rather than the bare fact that it moved. The time
   constant is asymmetric: the fall's while authority is being taken, the
   recovery's while it is given back. */
const TRAVEL_SETTLE_MS = 900;
const TRAVEL_MUTE_MS = 200;
const TRAVEL_MUTE_SPEED = 0.02;
/* A window, not a lead: the pinned instance's approach starts while its screen is
   still coming up and finishes after it has arrived, so the garment is still
   settling while the screen is being read. */
const ENTRANCE_START = 0.55;
const ENTRANCE_END = -0.3;
/* The exit ramp — zero at the moment the canvas releases, easing up to the page's
   own speed. The derivative is exactly 1 at the seam. */
const RELEASE_LAG = 0.15;
/* The body follows the scroll on the same clock as everything else, so its
   velocity — which is what the sleeves trail — is bounded and continuous rather
   than the raw scroll delta. */
const JOURNEY_FOLLOW = 0.12;
/* An idle that never stops, and ADDS to the rest pose rather than replacing it. */
const IDLE_PERIOD_S = 7;
const IDLE_ROTATION = MathUtils.degToRad(1.5);
const IDLE_RISE = 4;
/* Fixed timestep: the same number of steps per second on any display. THE
   PHYSICS IS NEVER THROTTLED with the frame budget — it is stepped on its own
   clock inside the frame precisely so the feel cannot follow the display. */
const PHYSICS_STEP_MS = 1000 / 60;
const MAX_PHYSICS_STEPS = 4;

/* Device tier, read ONCE at construction. A device does not change tier
   mid-session, and rebuilding buffers on a resize costs more than the mismatch is
   worth. The coarse-pointer clause is what catches tablets and large phones,
   which a width test alone puts on the desktop tier. */
const readTier = () => {
  if (!window.matchMedia("(hover: none) and (pointer: coarse)").matches) return "desktop";
  return window.innerWidth < 768 ? "mobile" : "tablet";
};
/* EVERY TIER STARTS AT 1.5, WITH MSAA (D-036). Phones used to start at 1 and be
   capped at 30fps — and the cap sat UNDER FPS_FLOOR, so the monitor read a
   deliberately throttled phone as a struggling one and stepped it to its floor
   within two seconds: a 262px buffer for a 350px box, a visibly noisy jacket.
   Below the frame the canvas is only the product's own box (~350x300 css), so
   1.5 is a fraction of one full-screen pass; 1.5 + MSAA holds the zip and the
   seams, 2 adds nothing a reader can see. The fallback still steps down. */
const RATIO_STEPS = { mobile: [1.5, 1.25, 1], tablet: [1.5, 1.25, 1], desktop: [1.5, 1.25, 1] };
/* ms between renders — 0 means every tick. EVERY TIER DRAWS AT THE DISPLAY'S
   RATE: a cap reads as low frame rate on an iPhone rather than as a saving, and
   any fps-driven fallback must never sit under a fixed frame cap. The physics
   runs on its own fixed clock either way. */
const FRAME_BUDGET = { mobile: 0, tablet: 0, desktop: 0 };
/* Cell pitch. The buffer is snapped to this so boxes land on whole pixels. */
const CELL = 50;
const RESIZE_DEBOUNCE_MS = 150;
/* Below this the interactive layer is dimmed — never the physics. */
const FPS_FLOOR = 50;

/* Halvane port: the template's own product (an iridescent jacket) and its
   material are gone; the speaker is prerendered photo frames drawn by stage.js
   (scene.ts and its GLB are no longer loaded).
   What stays below is the template's stage offset for the boxed layout. */
(function syncStageTop() {
  const root = document.getElementById("product-region");
  const box = document.querySelector("[data-hero-stage]");
  if (!root || !box) return;
  const sync = () => {
    const offset = box.getBoundingClientRect().top - root.getBoundingClientRect().top;
    root.style.setProperty("--hero-stage-top", Math.max(0, Math.round(offset)) + "px");
  };
  sync();
  /* Served hidden until it has its real offset — see the markup. */
  const frame = root.querySelector("[data-pointer-frame]");
  if (frame) frame.style.visibility = "visible";
  const observer = new ResizeObserver(sync);
  observer.observe(root);
  observer.observe(box);
})();
export { subscribe, reduced, coarsePointer, FRAME_QUERY, acquireRegionPointer, deviceTilt, whenNear, observeReveal, ASSETS, assetFailure, MathUtils, lenis, FRAME_WIDTH, FRAME_HEIGHT, SUBJECT_HEIGHT, SUBJECT_RISE, BOXED_FILL_Y, BOXED_FILL_X, BOXED_DROP, DETAILS_HEIGHT, DETAILS_DROP, DETAILS_SHIFT_X, SCROLL_TURN, ease, drift, TURN_MAX, ROLL_MAX, TILT_MAX_X, GYRO_TURN, GYRO_PITCH, PARALLAX, TILT_STIFFNESS, TILT_DAMPING, TILT_DRAG_SCALE, DRAG_DEGREES_PER_PX, SPIN_FRICTION, SPIN_STOP, TRAVEL_SETTLE_MS, TRAVEL_MUTE_MS, TRAVEL_MUTE_SPEED, RELEASE_LAG, JOURNEY_FOLLOW, IDLE_PERIOD_S, IDLE_ROTATION, IDLE_RISE, PHYSICS_STEP_MS, MAX_PHYSICS_STEPS, readTier, RATIO_STEPS, FRAME_BUDGET, RESIZE_DEBOUNCE_MS, FPS_FLOOR };
