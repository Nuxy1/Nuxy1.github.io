// Motion level for the whole site (styles/motion.css explains the four levels). Imported by Base.astro and by each
// moving component, so it runs once, before any of them. Nothing here needs the network or a timer that keeps going.

export type Level = "reduced" | "light" | "standard" | "enhanced";
export type Choice = "reduced" | "standard" | "enhanced";

const KEY = "nuxy-motion";
const root = document.documentElement;
const mq = (q: string) => window.matchMedia(q);
const reduceQuery = mq("(prefers-reduced-motion: reduce)");

type Nav = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
const nav = navigator as Nav;

// (browser storage can be off, full or throw in a private window: the site then simply forgets the choice)
const stored = (): Choice | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "reduced" || v === "standard" || v === "enhanced" ? v : null;
  } catch { return null; }
};

/** The device asks for reduced motion: always obeyed, and the footer choice can't turn motion back on. */
export const deviceReduced = () => reduceQuery.matches;

let slow = false; // set by the frame check below

// What the device suggests when the visitor hasn't chosen. Conservative: a hint that data or power is short gives the
// light level; enhanced needs a mouse, a wide screen and a device that reports plenty of cores and memory (only
// Chromium reports memory, so other browsers stay on standard unless the visitor picks Enhanced).
function suggested(): Level {
  const c = nav.connection;
  if (slow || mq("(prefers-reduced-data: reduce)").matches || c?.saveData || /(^|-)2g$/.test(c?.effectiveType ?? "")
    || (nav.deviceMemory !== undefined && nav.deviceMemory < 4) || (nav.hardwareConcurrency || 8) <= 2) return "light";
  if (mq("(hover: hover) and (pointer: fine) and (min-width: 1280px)").matches && (nav.hardwareConcurrency || 0) >= 8 && (nav.deviceMemory ?? 0) >= 8) return "enhanced";
  return "standard";
}

export function level(): Level {
  if (deviceReduced()) return "reduced";
  return stored() ?? suggested();
}

/** Ambient (looping) motion is allowed at this level. */
export const ambient = (l: Level = level()) => l === "standard" || l === "enhanced";
/** Short state transitions are allowed at this level. */
export const moving = (l: Level = level()) => l !== "reduced";


function apply() {
  const l = level();
  root.dataset.motion = l;
  root.toggleAttribute("data-ambient", ambient(l));
  if (l === "reduced") root.removeAttribute("data-reveal");
  // components read <html data-motion> and listen for this (they don't import this file: see AutomationCore.astro)
  document.dispatchEvent(new CustomEvent("nuxy:motion", { detail: l }));
  syncControl();
}

export function choose(c: Choice) {
  try { localStorage.setItem(KEY, c); } catch {}
  apply();
}

// ---- Section reveals: run once per element, only for what starts below the first screen ----
function setupReveals() {
  const els = [...document.querySelectorAll<HTMLElement>(".reveal")];
  if (!els.length || !("IntersectionObserver" in window) || !moving()) return;
  const fold = window.innerHeight;
  const later = els.filter((el) => {
    if (el.getBoundingClientRect().top < fold) { el.classList.add("in"); return false; }
    return true;
  });
  if (!later.length) return;
  const io = new IntersectionObserver((entries) => {
    let i = 0;
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      el.style.setProperty("--stagger", `${Math.min(i++, 4) * 70}ms`);
      el.classList.add("in");
      io.unobserve(el);
    }
  }, { rootMargin: "0px 0px -6% 0px" });
  later.forEach((el) => io.observe(el));
  root.setAttribute("data-reveal", "");
}

// ---- The footer's Motion choice ----
const picker = document.querySelector<HTMLFieldSetElement>("[data-motion-pick]");
function syncControl() {
  if (!picker) return;
  const l = level(), locked = deviceReduced();
  const shown: Choice = l === "light" ? "standard" : l;
  picker.querySelectorAll<HTMLInputElement>("input[name='motion']").forEach((r) => {
    r.checked = r.value === shown;
    r.disabled = locked && r.value !== "reduced";
  });
  const note = picker.querySelector<HTMLElement>("[data-motion-note]");
  if (note) note.hidden = !locked;
}
if (picker) {
  picker.hidden = false;
  picker.addEventListener("change", (e) => {
    const r = e.target as HTMLInputElement;
    if (r.name === "motion") choose(r.value as Choice);
  });
}

// ---- Frame check: if the page can't keep about 30 frames a second while the hero moves, drop the optional motion
// (only when the visitor hasn't chosen a level; a choice is kept). It samples once, about 1.5 s after load. ----
function frameCheck() {
  if (stored() || !ambient() || document.hidden) return;
  const times: number[] = [];
  let last = 0;
  const tick = (t: number) => {
    if (last) times.push(t - last);
    last = t;
    if (times.length < 45) { requestAnimationFrame(tick); return; }
    const sorted = times.sort((a, b) => a - b), median = sorted[sorted.length >> 1];
    if (median > 34) { slow = true; apply(); }
  };
  requestAnimationFrame(tick);
}

apply();
setupReveals();
reduceQuery.addEventListener?.("change", apply);
if (document.readyState === "complete") setTimeout(frameCheck, 1500);
else window.addEventListener("load", () => setTimeout(frameCheck, 1500), { once: true });
