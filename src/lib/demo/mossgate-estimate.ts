// Mossgate's demonstration estimate. Every price here is invented for the demo (the pages say "Demonstration pricing
// only."), but the rules behave like a real cleaning company's sheet: rooms and floor area set the base, the type of
// clean multiplies it, extras add a flat amount unless the clean already includes them, repeat visits are cheaper,
// and the answer is a range rounded to $5 because no home is priced to the dollar unseen.
// Pure functions, no page access: the estimate page, the booking page and tests/demos.test.mjs all use them.
export type Home = "apartment" | "townhouse" | "house";
export type Clean = "standard" | "deep" | "movein" | "moveout";
export type Freq = "once" | "monthly" | "biweekly" | "weekly";
export type Extra = "fridge" | "oven" | "windows" | "baseboards" | "pets" | "cabinets";

export const HOMES: Record<Home, { name: string; note: string; x: number }> = {
  apartment: { name: "Apartment or condo", note: "One floor", x: 0.95 },
  townhouse: { name: "Townhouse", note: "Two or three floors", x: 1 },
  house: { name: "House", note: "Stairs and a basement, often", x: 1.06 },
};
export const CLEANS: Record<Clean, { name: string; note: string; x: number; includes: Extra[]; repeat: boolean }> = {
  standard: { name: "Standard", note: "Regular upkeep", x: 1, includes: [], repeat: true },
  deep: { name: "Deep", note: "Top to bottom, the first visit", x: 1.6, includes: ["baseboards"], repeat: false },
  movein: { name: "Move-in", note: "Empty home, before you unpack", x: 1.75, includes: ["fridge", "oven", "cabinets", "baseboards"], repeat: false },
  moveout: { name: "Move-out", note: "Empty home, for the deposit", x: 1.9, includes: ["fridge", "oven", "cabinets", "baseboards"], repeat: false },
};
export const EXTRAS: Record<Extra, { name: string; note: string; add: number }> = {
  fridge: { name: "Inside the fridge", note: "Shelves out and washed", add: 30 },
  oven: { name: "Inside the oven", note: "Racks and glass too", add: 35 },
  windows: { name: "Inside windows", note: "Glass, sills and tracks", add: 45 },
  baseboards: { name: "Baseboards", note: "Wiped by hand in every room", add: 30 },
  pets: { name: "Pet hair", note: "Furniture and stairs", add: 20 },
  cabinets: { name: "Inside cabinets", note: "Emptied cabinets only", add: 40 },
};
export const FREQS: Record<Freq, { name: string; note: string; x: number }> = {
  once: { name: "One time", note: "", x: 1 },
  monthly: { name: "Monthly", note: "Save 5%", x: 0.95 },
  biweekly: { name: "Every 2 weeks", note: "Save 12%", x: 0.88 },
  weekly: { name: "Weekly", note: "Save 18%", x: 0.82 },
};
export const BEDS = [1, 2, 3, 4, 5] as const; // 5 = 5 or more
export const BATHS = [1, 2, 3, 4] as const; // 4 = 4 or more
export const SQFT_MIN = 400, SQFT_MAX = 5000, SQFT_STEP = 50;
/** a typical floor area for the bedroom count, used until the visitor moves the slider */
export const typicalSqft = (bed: number) => [650, 950, 1500, 2100, 2800][Math.min(Math.max(bed, 1), 5) - 1];

export type Choice = { home: Home; bed: number; bath: number; sqft: number; clean: Clean; freq: Freq; extras: Extra[] };
export const DEFAULT: Choice = { home: "house", bed: 3, bath: 2, sqft: typicalSqft(3), clean: "standard", freq: "biweekly", extras: [] };

const is = <T extends string>(o: Record<T, unknown>, v: unknown): v is T => typeof v === "string" && Object.prototype.hasOwnProperty.call(o, v);
const clampInt = (v: unknown, lo: number, hi: number, fallback: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && String(v).trim() !== "" ? Math.min(hi, Math.max(lo, n)) : fallback;
};

/** Tidy a choice from anywhere (a link, the form): unknown values fall back to the default, numbers are clamped,
 *  a one-off clean is always one time, and extras the clean already includes are dropped. */
export function normalise(raw: Partial<Record<keyof Choice, unknown>>): Choice {
  const bed = clampInt(raw.bed, 1, 5, DEFAULT.bed);
  const clean = is(CLEANS, raw.clean) ? raw.clean : DEFAULT.clean;
  const sqftRaw = clampInt(raw.sqft, SQFT_MIN, SQFT_MAX, typicalSqft(bed));
  const list = Array.isArray(raw.extras) ? raw.extras : typeof raw.extras === "string" ? raw.extras.split(",") : [];
  return {
    home: is(HOMES, raw.home) ? raw.home : DEFAULT.home,
    bed,
    bath: clampInt(raw.bath, 1, 4, DEFAULT.bath),
    sqft: Math.round(sqftRaw / SQFT_STEP) * SQFT_STEP,
    clean,
    freq: CLEANS[clean].repeat && is(FREQS, raw.freq) ? raw.freq : "once",
    extras: [...new Set(list.filter((e): e is Extra => is(EXTRAS, e) && !CLEANS[clean].includes.includes(e)))],
  };
}

export type Estimate = {
  low: number; high: number;
  /** the middle figure the range is built around, before rounding */
  mid: number;
  lines: { label: string; amount: number }[];
  /** on-site time for the crew, in hours, and how many cleaners come */
  hours: number; crew: 1 | 2 | 3;
  /** a long clean has to start in a morning window to finish the same day */
  morningOnly: boolean;
};

/** The made-up rules: $60 + $20 a bedroom + $25 a bathroom + $3 per 100 sq ft, times the home type and the clean,
 *  plus extras, less the repeat discount; shown as x0.92 to x1.1, rounded to $5. */
export function estimate(c: Choice): Estimate {
  const rooms = 60 + 20 * c.bed + 25 * c.bath;
  const area = Math.round((c.sqft / 100) * 3);
  const base = (rooms + area) * HOMES[c.home].x;
  const clean = base * CLEANS[c.clean].x;
  const extras = c.extras.map((e) => ({ label: EXTRAS[e].name, amount: EXTRAS[e].add }));
  const before = clean + extras.reduce((t, e) => t + e.amount, 0);
  const off = before * (1 - FREQS[c.freq].x);
  const mid = before - off;
  const to5 = (n: number) => Math.round(n / 5) * 5;
  const lines = [
    { label: `${c.bed === 5 ? "5+" : c.bed} bed, ${c.bath === 4 ? "4+" : c.bath} bath, ${c.sqft.toLocaleString("en-US")} sq ft ${HOMES[c.home].name.toLowerCase()}`, amount: Math.round(base) },
    ...(c.clean === "standard" ? [] : [{ label: `${CLEANS[c.clean].name} clean (x${CLEANS[c.clean].x})`, amount: Math.round(clean - base) }]),
    ...extras,
    ...(off > 0 ? [{ label: `${FREQS[c.freq].name} (${FREQS[c.freq].note.toLowerCase()})`, amount: -Math.round(off) }] : []),
  ];
  // about $50 of work an hour for one cleaner; past 4 hours a second cleaner comes, past 10 a third
  const work = before / 50;
  const crew = work > 10 ? 3 : work > 4 ? 2 : 1;
  const hours = Math.max(1.5, Math.round((work / crew) * 2) / 2);
  return { low: to5(mid * 0.92), high: to5(mid * 1.1), mid, lines, hours, crew, morningOnly: work > 6 };
}

/** Choice <-> link query, so "Book this clean" carries the estimate to the booking page. Extras can come as one
 *  comma list (our links) or repeated fields (the estimate form submitted without JavaScript). */
export function toQuery(c: Choice): string {
  const q = new URLSearchParams({ home: c.home, bed: String(c.bed), bath: String(c.bath), sqft: String(c.sqft), clean: c.clean, freq: c.freq });
  if (c.extras.length) q.set("extras", c.extras.join(","));
  return q.toString();
}
export function fromQuery(search: string): Choice | null {
  const q = new URLSearchParams(search);
  if (!q.has("clean") && !q.has("bed")) return null;
  return normalise({ home: q.get("home"), bed: q.get("bed"), bath: q.get("bath"), sqft: q.get("sqft") ?? undefined, clean: q.get("clean"), freq: q.get("freq"), extras: q.getAll("extras").join(",") });
}

export const hoursLabel = (h: number) => `${Math.floor(h)}${h % 1 ? "½" : ""} hour${h === 1 ? "" : "s"}`;
/** "Deep clean · 3 bed · 2 bath · every 2 weeks" */
export function describe(c: Choice) {
  return [`${CLEANS[c.clean].name} clean`, `${c.bed === 5 ? "5+" : c.bed} bed`, `${c.bath === 4 ? "4+" : c.bath} bath`, FREQS[c.freq].name.toLowerCase()].join(" · ");
}

// Arrival windows and the booking calendar: a fixed pattern (no random numbers), so a day always looks the same and
// the tests can rely on it. Day 0 is the first bookable day (tomorrow, or Monday after a Saturday); Sundays are off.
export const WINDOWS = [
  { id: "8-10", label: "8 – 10 am", morning: true },
  { id: "10-12", label: "10 am – 12 pm", morning: true },
  { id: "1-3", label: "1 – 3 pm", morning: false },
  { id: "3-5", label: "3 – 5 pm", morning: false },
] as const;
export type WindowId = (typeof WINDOWS)[number]["id"];
/** windows already taken on bookable day n: the third day is full, the rest lose one or two */
export function takenWindows(n: number): WindowId[] {
  if (n === 2) return ["8-10", "10-12", "1-3", "3-5"];
  const ids = WINDOWS.map((w) => w.id);
  const a = ids[(n * 3 + 1) % 4], b = ids[(n * 5 + 2) % 4];
  return n % 3 === 0 ? [a] : [...new Set([a, b])];
}
/** the next `count` working days (Monday to Saturday) after `from` */
export function bookingDays(from: Date, count = 10): Date[] {
  const out: Date[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) out.push(new Date(d));
  }
  return out;
}
