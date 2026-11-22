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
    ...(c.clean === "standard" ? [] : [{ label: `${CLEANS[c.clean].name} clean (${CLEANS[c.clean].note.toLowerCase()})`, amount: Math.round(clean - base) }]),
    ...extras,
    ...(off > 0 ? [{ label: `${FREQS[c.freq].name} (${FREQS[c.freq].note.toLowerCase()})`, amount: -Math.round(off) }] : []),
  ];
  // about $50 of work an hour for one cleaner; past 4 hours a second cleaner comes, past 10 a third
  const work = before / 50;
  const crew = work > 10 ? 3 : work > 4 ? 2 : 1;
  const hours = Math.max(1.5, Math.round((work / crew) * 2) / 2);
  return { low: to5(mid * 0.92), high: to5(mid * 1.1), mid, lines, hours, crew, morningOnly: work > 6 };
}

/** the home-type line of the receipt, in words (the townhouse is the base price and prints no line) */
const HOME_WHY: Record<Home, string> = { house: "House, for stairs and a basement", townhouse: "Townhouse", apartment: "Apartment or condo, all on one floor" };

/** "3 bedrooms", "5+ bedrooms" */
const many = (n: number, top: number, one: string) => `${n === top ? `${top}+` : n} ${one}${n > 1 ? "s" : ""}`;

/** The same sum as estimate(), one ingredient a line, for the printed receipt (visit, bedrooms, bathrooms, floor area,
 *  home type, clean, extras, plan). Each amount is the change in the rounded running total, so the lines always add
 *  up to the rounded middle figure. */
export function receipt(c: Choice): { label: string; amount: number }[] {
  const out: { label: string; amount: number }[] = [];
  let total = 0, shown = 0;
  const add = (label: string, next: number) => { total = next; const r = Math.round(next); out.push({ label, amount: r - shown }); shown = r; };
  add("Visit", 60);
  add(`${many(c.bed, 5, "bedroom")} at $20`, total + 20 * c.bed);
  add(`${many(c.bath, 4, "bathroom")} at $25`, total + 25 * c.bath);
  // the floor area reads as "typical" while it is the size we assume for the bedrooms, so an untouched slider is not a formula
  const typical = c.sqft === typicalSqft(c.bed);
  add(typical ? `About ${c.sqft.toLocaleString("en-US")} sq ft, usual for ${many(c.bed, 5, "bedroom")}` : `${c.sqft.toLocaleString("en-US")} sq ft of floor`, total + Math.round((c.sqft / 100) * 3));
  // the lines name the reason, not the rate: the rate is in the price key, the line already shows what it adds
  if (HOMES[c.home].x !== 1) add(HOME_WHY[c.home], total * HOMES[c.home].x);
  if (CLEANS[c.clean].x !== 1) add(`${CLEANS[c.clean].name} clean (${CLEANS[c.clean].note.toLowerCase()})`, total * CLEANS[c.clean].x);
  for (const e of c.extras) add(EXTRAS[e].name, total + EXTRAS[e].add);
  if (FREQS[c.freq].x !== 1) add(`${FREQS[c.freq].name} (${FREQS[c.freq].note.toLowerCase()})`, total * FREQS[c.freq].x);
  return out;
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

/** the receipt's line above the range: the lines added up, the figure the range is worked from (not a second price,
 *  so it is not called one). A plan is priced per visit, a one-off clean as a whole */
export const priceLabel = (f: Freq) => (f === "once" ? "Lines added up, this clean" : "Lines added up, per visit");
/** the stub's word for the range: "Per visit" or "For this clean" */
export const perLabel = (f: Freq) => (f === "once" ? "For this clean" : "Per visit");

export const hoursLabel =(h: number) => `${Math.floor(h)}${h % 1 ? "½" : ""} hour${h === 1 ? "" : "s"}`;
/** "2 cleaners, about 3½ hours" */
export const crewLabel = (e: Pick<Estimate, "crew" | "hours">) => `${e.crew === 1 ? "1 cleaner" : `${e.crew} cleaners`}, about ${hoursLabel(e.hours)}`;
/** "Standard clean, 3 bedrooms, 2 bathrooms, every 2 weeks": the plain sentence the pages show */
export function summary(c: Choice) {
  return `${CLEANS[c.clean].name} clean, ${many(c.bed, 5, "bedroom")}, ${many(c.bath, 4, "bathroom")}, ${FREQS[c.freq].name.toLowerCase()}`;
}
/** "House, 3 bedrooms, 2 bathrooms": the home on its own, for the booking's size line */
export function homeSize(c: Choice) {
  return `${HOMES[c.home].name}, ${many(c.bed, 5, "bedroom")}, ${many(c.bath, 4, "bathroom")}`;
}
/** "Deep clean · 3 bed · 2 bath · every 2 weeks": the short form the tests pin; the pages show summary() */
export function describe(c: Choice) {
  return [`${CLEANS[c.clean].name} clean`, `${c.bed === 5 ? "5+" : c.bed} bed`, `${c.bath === 4 ? "4+" : c.bath} bath`, FREQS[c.freq].name.toLowerCase()].join(" · ");
}

// Arrival windows and the booking calendar: a fixed pattern (no random numbers), so a day always looks the same and
// the tests can rely on it. Day 0 is the first bookable day (tomorrow, or Monday after a Saturday); Sundays are off.
// no-break spaces, and a word joiner after the dash (a line may still break between a dash and a no-break space), so
// a window never splits
export const WINDOWS = [
  { id: "8-10", label: "8\u00a0–\u2060\u00a010\u00a0am", morning: true },
  { id: "10-12", label: "10\u00a0am\u00a0–\u2060\u00a012\u00a0pm", morning: true },
  { id: "1-3", label: "1\u00a0–\u2060\u00a03\u00a0pm", morning: false },
  { id: "3-5", label: "3\u00a0–\u2060\u00a05\u00a0pm", morning: false },
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
