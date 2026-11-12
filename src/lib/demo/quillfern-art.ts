// Quillfern's candles drawn as SVG at build time (no photos and no outside requests): each scent has its own jar
// shape (8 and 12 oz) in its own glass and label colours; the 4 oz tin is one shape for all. Only our own catalogue values go in, so the markup is fixed.
import type { Candle, SizeId } from "./quillfern-cart";

const r = (n: number) => Math.round(n * 10) / 10;
const INK = "#3b2b22";

/** the flame path for a wick at (cx, wick): a teardrop `fh` tall and `fw` wide */
export function flamePath(cx: number, wick: number, fh: number, fw: number) {
  const top = wick - fh;
  return `M${r(cx)} ${r(top)}C${r(cx + fw * 0.9)} ${r(top + fh * 0.45)} ${r(cx + fw)} ${r(wick - fh * 0.08)} ${r(cx)} ${r(wick + fh * 0.04)}C${r(cx - fw)} ${r(wick - fh * 0.08)} ${r(cx - fw * 0.9)} ${r(top + fh * 0.45)} ${r(cx)} ${r(top)}Z`;
}

/** a lit flame (outer orange, inner pale) for a wick at (cx, wick), scaled to the vessel's width */
export function flame(cx: number, wick: number, w: number, cls = "qf-flame") {
  const fh = w * 0.3, fw = w * 0.085;
  return `<g class="${cls}"><path d="${flamePath(cx, wick, fh, fw)}" fill="#f29a32"/><path d="${flamePath(cx, wick - fh * 0.02, fh * 0.56, fw * 0.55)}" fill="#ffe7b0"/><ellipse cx="${r(cx)}" cy="${r(wick + fh * 0.01)}" rx="${r(fw * 0.42)}" ry="${r(fh * 0.07)}" fill="#7fa4e8" opacity=".55"/></g>`;
}

type Opts = { lit?: boolean; size?: SizeId; flameClass?: string };

// Each scent's label carries its own line mark, so the six jars read apart on a shelf of cards. Drawn in a box
// from -1 to 1 on both axes ("u,v" pairs); the fern (Quillfern's own mark) is the fallback.
const MARKS: Record<string, string> = {
  "cedar-evening": "M-0.6,-0.2 L0,-0.95 L0.6,-0.2 M-0.85,0.4 L0,-0.45 L0.85,0.4 M0,0.4 L0,1",
  "amber-hearth": "M0,1 C-0.8,0.6 -0.55,-0.2 -0.1,-1 C0,-0.45 0.45,-0.45 0.4,-0.75 C0.85,-0.1 0.8,0.6 0,1 Z",
  "rain-garden": "M0,-1 C0.3,-0.5 0.75,-0.05 0.75,0.35 C0.75,0.8 0.4,1 0,1 C-0.4,1 -0.75,0.8 -0.75,0.35 C-0.75,-0.05 -0.3,-0.5 0,-1 Z",
  "vanilla-linen": "M-1,-0.8 Q0,-0.4 1,-0.8 M-0.45,-0.62 L-0.45,0.65 L0.45,0.65 L0.45,-0.62",
  "forest-cabin": "M-0.95,0 L0,-0.9 L0.95,0 M-0.65,-0.25 L-0.65,1 L0.65,1 L0.65,-0.25 M-0.18,1 L-0.18,0.4 L0.18,0.4 L0.18,1",
  "quiet-morning": "M-1,0.65 L1,0.65 M-0.55,0.65 C-0.55,-0.1 0.55,-0.1 0.55,0.65 M0,-0.35 L0,-0.95 M-0.68,-0.05 L-0.98,-0.4 M0.68,-0.05 L0.98,-0.4",
  fern: "M0,1 L0,-1 M0,0.43 L-0.67,-0.1 M0,0.43 L0.67,-0.1 M0,-0.29 L-0.47,-0.71 M0,-0.29 L0.47,-0.71",
};

/** the label mark for a candle, centred at (cx, cy), `sw` by `sh` from centre to edge */
function mark(id: string | undefined, cx: number, cy: number, sw: number, sh: number, stroke: number) {
  const d = (MARKS[id ?? ""] ?? MARKS.fern).replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, u, v) => `${r(cx + +u * sw)} ${r(cy + +v * sh)}`);
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${r(stroke)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

// Jar shapes in a box from 0 to 1 on both axes ("u,v" pairs, v down from the top of the vessel box). Every jar's mouth
// is at v 0.12, the wax top at 0.19 and the wick tip at 0.1, so the hero's WebGL flame lines up whatever the shape.
// body = the glass outline; hi = the highlight stroke; extra = lines on the glass (threads, ribs, a collar);
// base = a heavy glass base; wax = the wax pool's half width; label = [left, top, width, height] of the label card.
type Jar = { body: string; hi: string; extra?: string; base?: string; wax: number; label: [number, number, number, number] };
const JARS: Record<string, Jar> = {
  // straight tumbler with a heavy glass base
  "cedar-evening": { body: "M0,0.12 L1,0.12 L1,0.95 Q1,1 0.94,1 L0.06,1 Q0,1 0,0.95 Z", base: "M0,0.89 L1,0.89 L1,0.95 Q1,1 0.94,1 L0.06,1 Q0,1 0,0.95 Z", hi: "M0.1,0.24 L0.1,0.82", wax: 0.44, label: [0.15, 0.4, 0.7, 0.38] },
  // apothecary jar: narrow neck, round shoulders
  "amber-hearth": { body: "M0.28,0.12 L0.72,0.12 L0.72,0.2 C0.95,0.22 1,0.3 1,0.4 L1,0.93 Q1,1 0.92,1 L0.08,1 Q0,1 0,0.93 L0,0.4 C0,0.3 0.05,0.22 0.28,0.2 Z", extra: "M0.28,0.145 L0.72,0.145", hi: "M0.1,0.44 L0.1,0.88", wax: 0.2, label: [0.14, 0.46, 0.72, 0.4] },
  // round bubble jar
  "rain-garden": { body: "M0.22,0.12 L0.78,0.12 L0.78,0.2 C0.97,0.3 1,0.46 1,0.6 C1,0.86 0.82,1 0.62,1 L0.38,1 C0.18,1 0,0.86 0,0.6 C0,0.46 0.03,0.3 0.22,0.2 Z", hi: "M0.12,0.46 C0.08,0.56 0.09,0.7 0.15,0.8", wax: 0.26, label: [0.2, 0.44, 0.6, 0.36] },
  // tapered glass, wide at the mouth
  "vanilla-linen": { body: "M0,0.12 L1,0.12 L0.86,0.96 Q0.85,1 0.8,1 L0.2,1 Q0.15,1 0.14,0.96 Z", hi: "M0.1,0.22 L0.19,0.84", wax: 0.44, label: [0.17, 0.4, 0.66, 0.36] },
  // mason jar: threaded neck, square shoulders
  "forest-cabin": { body: "M0.12,0.12 L0.88,0.12 L0.88,0.22 Q1,0.24 1,0.32 L1,0.92 Q1,1 0.9,1 L0.1,1 Q0,1 0,0.92 L0,0.32 Q0,0.24 0.12,0.22 Z", extra: "M0.12,0.15 L0.88,0.17 M0.12,0.185 L0.88,0.205", hi: "M0.09,0.36 L0.09,0.86", wax: 0.36, label: [0.15, 0.42, 0.7, 0.38] },
  // ribbed jar with a slight barrel
  "quiet-morning": { body: "M0.04,0.12 L0.96,0.12 C1,0.3 1,0.8 0.94,0.96 Q0.92,1 0.86,1 L0.14,1 Q0.08,1 0.06,0.96 C0,0.8 0,0.3 0.04,0.12 Z", extra: "M0.24,0.15 L0.24,0.98 M0.41,0.15 L0.41,0.995 M0.59,0.15 L0.59,0.995 M0.76,0.15 L0.76,0.98", hi: "M0.12,0.24 C0.09,0.45 0.09,0.7 0.12,0.86", wax: 0.42, label: [0.16, 0.42, 0.68, 0.36] },
  // the old rounded jar, for anything not in the catalogue
  plain: { body: "M0.16,0.12 L0.84,0.12 Q1,0.12 1,0.28 L1,0.84 Q1,1 0.84,1 L0.16,1 Q0,1 0,0.84 L0,0.28 Q0,0.12 0.16,0.12 Z", hi: "M0.1,0.29 L0.1,0.83", wax: 0.42, label: [0.15, 0.42, 0.7, 0.38] },
};

/** one candle with its bottom-left corner at (x, y + h): a jar for 8 and 12 oz, a low tin with its lid behind for 4 oz */
export function vessel(x: number, y: number, w: number, h: number, c: Pick<Candle, "glass" | "label"> & { id?: string }, { lit = false, size = "8oz", flameClass }: Opts = {}) {
  const cx = x + w / 2;
  const shadow = `<ellipse cx="${r(cx)}" cy="${r(y + h)}" rx="${r(w * 0.58)}" ry="${r(Math.max(3, h * 0.04))}" fill="#1d1611" opacity=".14"/>`;
  if (size === "tin") {
    const top = y + h * 0.32, wax = top + h * 0.05, wick = top - h * 0.02;
    return [
      shadow,
      // the lid, leaning behind
      `<ellipse cx="${r(cx + w * 0.34)}" cy="${r(y + h * 0.5)}" rx="${r(w * 0.2)}" ry="${r(h * 0.46)}" fill="#a79f92"/>`,
      `<ellipse cx="${r(cx + w * 0.34)}" cy="${r(y + h * 0.5)}" rx="${r(w * 0.15)}" ry="${r(h * 0.38)}" fill="${c.label}"/>`,
      `<rect x="${r(x)}" y="${r(top)}" width="${r(w)}" height="${r(y + h - top)}" rx="${r(w * 0.08)}" fill="#bdb5a8"/>`,
      `<rect x="${r(x)}" y="${r(top + (y + h - top) * 0.3)}" width="${r(w)}" height="${r((y + h - top) * 0.44)}" fill="${c.glass}"/>`,
      `<rect x="${r(x + w * 0.05)}" y="${r(top + 4)}" width="${r(w * 0.05)}" height="${r((y + h - top) * 0.8)}" rx="2" fill="#fff" opacity=".35"/>`,
      `<ellipse cx="${r(cx)}" cy="${r(top)}" rx="${r(w / 2)}" ry="${r(h * 0.07)}" fill="#cfc8bb"/>`,
      `<ellipse cx="${r(cx)}" cy="${r(wax)}" rx="${r(w * 0.44)}" ry="${r(h * 0.055)}" fill="#f6eddd"/>`,
      `<path d="M${r(cx)} ${r(wax)}V${r(wick)}" stroke="${INK}" stroke-width="${r(Math.max(1.4, w * 0.02))}" stroke-linecap="round"/>`,
      lit ? flame(cx, wick, w * 0.62, flameClass) : "",
    ].join("");
  }
  const jar = JARS[c.id ?? ""] ?? JARS.plain;
  const at = (d: string) => d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, u, v) => `${r(x + +u * w)} ${r(y + +v * h)}`);
  const wax = y + h * 0.19, wick = y + h * 0.1, mid = y + h * 0.58;
  const [lu, lv, lwu, lhu] = jar.label;
  const lx = x + w * lu, ly = y + h * lv, lw = w * lwu, lh = h * lhu, lcx = lx + lw / 2;
  const line = (d: string, op: number, sw: number) => `<path d="${at(d)}" fill="none" stroke="#fff" stroke-width="${r(sw)}" stroke-linecap="round" opacity="${op}"/>`;
  return [
    shadow,
    `<path d="${at(jar.body)}" fill="${c.glass}"/>`,
    // the wax seen through the glass (the outline again, a little smaller), a heavy base, lines on the glass
    `<path d="${at(jar.body)}" fill="#fff" opacity=".07" transform="translate(${r(cx)} ${r(mid)}) scale(.9 .93) translate(${r(-cx)} ${r(-mid)})"/>`,
    jar.base ? `<path d="${at(jar.base)}" fill="${INK}" opacity=".2"/>` : "",
    jar.extra ? line(jar.extra, 0.16, Math.max(1, w * 0.014)) : "",
    // the top of the wax pool, flatter in a narrow neck
    `<ellipse cx="${r(cx)}" cy="${r(wax)}" rx="${r(w * jar.wax)}" ry="${r(h * (jar.wax < 0.3 ? 0.03 : 0.045))}" fill="#f6eddd"/>`,
    line(jar.hi, 0.26, w * 0.06),
    // the label: an arch-topped card with the scent's mark and two lines of "type"
    `<path d="M${r(lx)} ${r(ly + lh)}V${r(ly + lw * 0.32)}A${r(lw / 2)} ${r(lw * 0.32)} 0 0 1 ${r(lx + lw)} ${r(ly + lw * 0.32)}V${r(ly + lh)}Z" fill="${c.label}"/>`,
    mark(c.id, lcx, ly + lh * 0.42, lw * 0.15, lh * 0.21, Math.max(1.2, w * 0.016)),
    `<rect x="${r(lcx - lw * 0.26)}" y="${r(ly + lh * 0.74)}" width="${r(lw * 0.52)}" height="${r(lh * 0.06)}" rx="1" fill="${INK}" opacity=".62"/>`,
    `<rect x="${r(lcx - lw * 0.16)}" y="${r(ly + lh * 0.86)}" width="${r(lw * 0.32)}" height="${r(lh * 0.045)}" rx="1" fill="${INK}" opacity=".35"/>`,
    `<path d="M${r(cx)} ${r(wax)}V${r(wick)}" stroke="${INK}" stroke-width="${r(Math.max(1.4, w * 0.022))}" stroke-linecap="round"/>`,
    lit ? flame(cx, wick, w, flameClass) : "",
  ].join("");
}

/** a card picture: one candle on a warm ground, in the size given (8 oz unless said) */
export function cardArt(c: Candle, size: SizeId = "8oz", lit = false) {
  const inner = size === "tin" ? vessel(52, 70, 96, 70, c, { size, lit }) : size === "12oz" ? vessel(52, 14, 96, 128, c, { size, lit }) : vessel(58, 30, 84, 112, c, { size, lit });
  return `<svg viewBox="0 0 200 160" aria-hidden="true" focusable="false">${inner}</svg>`;
}
