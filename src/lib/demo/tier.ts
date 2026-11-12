// Experience tier for the demo websites, one answer for every effect on the page:
//   1 = full: pointer-driven depth, canvas or WebGL effects (wide screen, mouse or trackpad, enough cores)
//   2 = standard: CSS-only motion, no canvas loops (most phones and tablets)
//   3 = reduced: still pictures and instant state changes (reduced motion, data saver, low memory, or the visitor
//       chose "Reduced" in the Nuxy site's motion setting, which shares this browser's storage)
// <html data-tier> carries it for CSS. `?tier=1|2|3` forces one, for testing and for the screenshots.
// No JavaScript at all = the static markup, which every effect starts from.
export type Tier = 1 | 2 | 3;

type Nav = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
const nav = navigator as Nav;
const mq = (q: string) => window.matchMedia(q);
const reduce = mq("(prefers-reduced-motion: reduce)");

function forced(): Tier | null {
  const v = new URLSearchParams(location.search).get("tier");
  return v === "1" || v === "2" || v === "3" ? (+v as Tier) : null;
}
function chosen(): string | null {
  try { return localStorage.getItem("nuxy-motion"); } catch { return null; }
}

export function tier(): Tier {
  const f = forced();
  if (f) return f;
  const c = nav.connection;
  if (reduce.matches || chosen() === "reduced" || c?.saveData || /(^|-)2g$/.test(c?.effectiveType ?? "")
    || (nav.deviceMemory !== undefined && nav.deviceMemory < 4) || (nav.hardwareConcurrency || 8) <= 2) return 3;
  if (mq("(hover: hover) and (pointer: fine) and (min-width: 1024px)").matches && (nav.hardwareConcurrency || 4) >= 4) return 1;
  return 2;
}

let gl: boolean | undefined;
/** WebGL works here (checked once, the test context is thrown away at once). */
export function webgl(): boolean {
  if (gl !== undefined) return gl;
  try {
    const c = document.createElement("canvas");
    const ctx = c.getContext("webgl", { failIfMajorPerformanceCaveat: true }) as WebGLRenderingContext | null;
    gl = !!ctx;
    ctx?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch { gl = false; }
  return gl;
}

const root = document.documentElement;
function apply() {
  const t = tier();
  if (root.dataset.tier !== String(t)) {
    root.dataset.tier = String(t);
    document.dispatchEvent(new CustomEvent("demo:tier", { detail: t }));
  }
}
apply();
reduce.addEventListener?.("change", apply);

/** Run `start` while the tier allows it (at most `max`), and its returned stop function when the tier drops. */
export function whileTier(max: Tier, start: () => (() => void) | void) {
  let stop: (() => void) | void;
  const check = () => {
    const ok = tier() <= max;
    if (ok && !stop) stop = start() || (() => {});
    else if (!ok && stop) { stop(); stop = undefined; }
  };
  check();
  document.addEventListener("demo:tier", check);
}
