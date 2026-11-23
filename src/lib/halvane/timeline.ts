// The scroll timeline for the Halvane concept page: which camera state the speaker is in, as a pure function of
// where the page is scrolled. Nothing is tweened and no state is kept between calls, so a fast flick or a reverse
// scroll lands on exactly the pose a slow scroll would; the scene only eases the drawn pose toward this target.
// The states live in cameras.json, the same file the Blender poster renders are framed from, so the still and the
// live speaker agree. Units follow that file: yaw in degrees (speaker turntable, lights fixed), fov in degrees across
// the canvas's short side, shift in short-side units (the page offsets the projection, not the camera).

export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

export interface Lamp {
  pos: Vec3;
  power: number;
  size: number;
  k: number;
}

export interface CamState {
  yaw: number;
  pos: Vec3;
  target: Vec3;
  fov: number;
  shift: Vec2;
  /** 0 = drivers in place, 1 = drivers pulled forward; {"Woofer": 1} pulls out only that driver */
  explode?: Explode;
  /** 0 = rear hatch shut, 1 = open */
  hatch?: number;
  lamp?: Lamp;
  portrait?: { fov: number; shift: Vec2 };
  /** poster.cover: the Cycles poster spans this many times the state's fov (a close-up that fills the screen) */
  poster?: { cover?: number };
}

export interface Pose {
  yaw: number;
  pos: Vec3;
  target: Vec3;
  fov: number;
  shift: Vec2;
  /** each driver's share of its EXPLODE travel (every driver in EXPLODE has a key) */
  explode: Record<string, number>;
  hatch: number;
  /** rear lamp power in the Blender watts of cameras.json (0 when the state has no lamp) */
  lamp: number;
}

export type Explode = number | Record<string, number>;

/** A state's explode as each driver's share of its travel: a number moves every driver, a record only those it names. */
export function explodeOf(e: Explode | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const n of Object.keys(EXPLODE)) out[n] = typeof e === "number" ? e : (e?.[n] ?? 0);
  return out;
}

export function poseOf(s: CamState, portrait: boolean): Pose {
  const p = portrait && s.portrait ? s.portrait : s;
  return {
    yaw: s.yaw,
    pos: [...s.pos],
    target: [...s.target],
    fov: p.fov,
    shift: [...p.shift],
    explode: explodeOf(s.explode),
    hatch: s.hatch ?? 0,
    lamp: s.lamp?.power ?? 0,
  };
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

export function blend(a: Pose, b: Pose, t: number): Pose {
  return {
    yaw: mix(a.yaw, b.yaw, t),
    pos: mix3(a.pos, b.pos, t),
    target: mix3(a.target, b.target, t),
    fov: mix(a.fov, b.fov, t),
    shift: [mix(a.shift[0], b.shift[0], t), mix(a.shift[1], b.shift[1], t)],
    explode: Object.fromEntries(Object.keys(EXPLODE).map((n) => [n, mix(a.explode[n] ?? 0, b.explode[n] ?? 0, t)])),
    hatch: mix(a.hatch, b.hatch, t),
    lamp: mix(a.lamp, b.lamp, t),
  };
}

/**
 * Where `centre` (the viewport's middle, in page pixels) falls between the chapter anchors (each chapter's middle,
 * ascending). Returns the segment index and an eased 0-1 progress inside it. `hold` is the share of each segment,
 * at both ends, where the pose stays on its state, so each state can be read before the next one starts.
 */
export function locate(anchors: number[], centre: number, hold = 0.2): { i: number; t: number } {
  const n = anchors.length;
  if (n < 2 || centre <= anchors[0]) return { i: 0, t: 0 };
  if (centre >= anchors[n - 1]) return { i: Math.max(0, n - 2), t: 1 };
  let i = 0;
  while (i < n - 2 && centre >= anchors[i + 1]) i++;
  const span = anchors[i + 1] - anchors[i];
  const raw = span > 0 ? (centre - anchors[i]) / span : 1;
  const u = Math.min(1, Math.max(0, (raw - hold) / (1 - 2 * hold)));
  return { i, t: u * u * (3 - 2 * u) };
}

/** The cabinet's bounding box in the GLB's axes (metres, y up, front +z): what has to stay clear of captions. */
export const CABINET = { min: [-0.105, 0.004, -0.13] as Vec3, max: [0.105, 0.334, 0.13] as Vec3 };

type Box = typeof CABINET;

// The moving parts (build_speaker.py EXPLODE, HATCH and the part sizes, in three axes): how far each driver is pulled
// forward at explode 1, and the rear hatch's hinge (x, z) and opening angle.
export const EXPLODE: Record<string, number> = { Woofer: 0.12, Tweeter: 0.08 };
export const HINGE: [number, number] = [0.06, -0.13];
export const HATCH_DEG = -125;
// each driver as rings about its axis (height y): [radius, z] at rest. Woofer: the cast flange and trim, then the
// motor at the back of the basket; tweeter: the waveguide, then its back can.
const DRIVERS: Record<string, { y: number; rings: [number, number][] }> = {
  Woofer: { y: 0.134, rings: [[0.085, 0.1314], [0.085, 0.1255], [0.046, 0.082], [0.046, 0.06]] },
  Tweeter: { y: 0.277, rings: [[0.042, 0.131], [0.042, 0.1232], [0.0258, 0.105]] },
};
// the hatch: the plate (0.120 x 0.150 m about its centre 0.130 m up), the binding posts out to z -0.151 and the
// crossover's on-edge coil in to z -0.089
const REAR: Box = { min: [-0.06, 0.055, -0.151], max: [0.06, 0.205, -0.089] };

const corners = (b: Box): Vec3[] => {
  const out: Vec3[] = [];
  for (const x of [b.min[0], b.max[0]]) for (const y of [b.min[1], b.max[1]]) for (const z of [b.min[2], b.max[2]]) out.push([x, y, z]);
  return out;
};

/**
 * The points that have to stay clear of the captions in a state: the cabinet's corners, and the drivers pulled out
 * of it and the rear hatch swung open about its hinge, moved as scene.ts moves them.
 */
export function reach(s: { explode?: Explode | Record<string, number>; hatch?: number }): Vec3[] {
  const pts = corners(CABINET);
  const e = explodeOf(s.explode);
  for (const [n, d] of Object.entries(DRIVERS))
    if (e[n] > 0)
      for (const [r, z] of d.rings)
        for (let k = 0; k < 16; k++) {
          const a = (k * Math.PI) / 8;
          pts.push([r * Math.cos(a), d.y + r * Math.sin(a), z + EXPLODE[n] * e[n]]);
        }
  const h = s.hatch ?? 0;
  if (h > 0) {
    const a = (HATCH_DEG * h * Math.PI) / 180;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    for (const [x, y, z] of corners(REAR)) {
      const dx = x - HINGE[0];
      const dz = z - HINGE[1];
      pts.push([HINGE[0] + dx * c + dz * sn, y, HINGE[1] - dx * sn + dz * c]);
    }
  }
  return pts;
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };

// the points projected on one screen axis (camera right or up), in short-side units before the shift; the speaker
// is turned by the pose's yaw plus each of `turns` (degrees) and the result spans all of them
function extent(p: Pose, pts: Vec3[], across: boolean, turns: number[]): [number, number] {
  const f = unit(sub(p.target, p.pos));
  const r = unit(cross(f, [0, 1, 0]));
  const axis = across ? r : cross(r, f);
  const k = 1 / (2 * Math.tan((p.fov * Math.PI) / 360));
  let lo = Infinity;
  let hi = -Infinity;
  for (const turn of turns) {
    const a = ((p.yaw + turn) * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    for (const [x, y, z] of pts) {
      const q = sub([x * c + z * s, y, -x * s + z * c], p.pos);
      const v = (dot(q, axis) / dot(q, f)) * k;
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
  }
  return [lo, hi];
}

/**
 * How far the points (by default the cabinet's corners) reach above the screen centre (both ends, low first) for a
 * pose, in short-side units and before the pose's shift: the same projection as scene.ts (speaker turned by yaw, fov
 * across the short side).
 */
export function extentY(p: Pose, pts: Vec3[] = corners(CABINET)): [number, number] {
  return extent(p, pts, false, [0]);
}

/**
 * How far the points reach right of the screen centre (both ends, left first), in the units of extentY. `turns` adds
 * yaws on top of the pose's (degrees), for a speaker the visitor can turn: the result covers every one of them.
 */
export function extentX(p: Pose, pts: Vec3[] = corners(CABINET), turns: number[] = [0]): [number, number] {
  return extent(p, pts, true, turns);
}

/**
 * Portrait screens stack the caption under (or over) the speaker. If the state's portrait framing would put the
 * speaker (its reach) outside the free band [top, bottom] (CSS px from the canvas top, on a W x H canvas), this
 * returns a copy whose portrait fov is widened just enough to fit and whose vertical shift centres it in the band; a
 * state that already fits is returned as it is. The page uses the copy for the 3D camera and the poster alike.
 */
export function fitPortrait(s: CamState, W: number, H: number, top: number, bottom: number, pts: Vec3[] = reach(s)): CamState {
  const p = poseOf(s, true);
  const short = Math.min(W, H);
  const [lo, hi] = extentY(p, pts);
  const y = (v: number) => H / 2 - (v + p.shift[1]) * short;
  if (y(hi) >= top && y(lo) <= bottom) return s;
  const k = Math.min(1, (bottom - top) / ((hi - lo) * short));
  const fov = (2 * Math.atan(Math.tan((p.fov * Math.PI) / 360) / k) * 180) / Math.PI;
  const mid = (H / 2 - (top + bottom) / 2) / short;
  return { ...s, portrait: { fov, shift: [p.shift[0], mid - (k * (hi + lo)) / 2] } };
}

/**
 * A rough limit on a landscape state's sideways shift, in short-side units: it keeps a cabinet framed like
 * cameras.json's (about 0.57 of the short side wide) on screen. The page applies it to the states it does not fit to
 * a caption band (the close-ups, and a square screen), so the scene can draw every shift it is given.
 */
export const shiftLimit = (W: number, H: number) => Math.max(0, 0.45 * W - 0.305 * H) / Math.min(W, H);

/**
 * Landscape screens put the caption in a column beside the speaker, and a near-square one (4:3, 5:4) leaves less room
 * than the framing in cameras.json was set for. If the speaker (its reach) would go outside the free band [left,
 * right] (CSS px across a W x H canvas), this returns a copy whose sideways shift moves it the least distance that
 * clears the band; only when the band is narrower than the speaker is the fov widened, just enough to fit it. `turns`
 * (degrees on top of the yaw) must clear too, for a speaker the visitor can turn. A state that already fits is
 * returned as it is.
 */
export function fitLandscape(s: CamState, W: number, H: number, left: number, right: number, turns: number[] = [0], pts: Vec3[] = reach(s)): CamState {
  const short = Math.min(W, H);
  const [lo, hi] = extentX(poseOf(s, false), pts, turns);
  const a = (left - W / 2) / short;
  const b = (right - W / 2) / short;
  const now = s.shift[0];
  // at fov scale m (the speaker drawn m times its size), the shifts that keep it inside the band
  const m = Math.min(1, (b - a) / (hi - lo));
  if (m <= 0) return s; // no band at all: leave the framing as it was set
  const from = a - m * lo;
  const to = b - m * hi;
  if (m === 1 && now >= from && now <= to) return s;
  const fov = m === 1 ? s.fov : (2 * Math.atan(Math.tan((s.fov * Math.PI) / 360) / m) * 180) / Math.PI;
  return { ...s, fov, shift: [Math.min(Math.max(now, from), Math.max(from, to)), s.shift[1]] };
}

/** The pose for one scroll position: `states[k]` belongs to the chapter whose middle is `anchors[k]`. */
export function poseAt(states: CamState[], anchors: number[], centre: number, portrait: boolean, hold = 0.2): Pose {
  if (states.length === 1 || anchors.length < 2) return poseOf(states[0], portrait);
  const { i, t } = locate(anchors, centre, hold);
  // inside a hold the pose is the state itself, not a + (b - a) * 1, which can miss b by a rounding error
  if (t <= 0) return poseOf(states[i], portrait);
  if (t >= 1) return poseOf(states[i + 1], portrait);
  return blend(poseOf(states[i], portrait), poseOf(states[i + 1], portrait), t);
}
