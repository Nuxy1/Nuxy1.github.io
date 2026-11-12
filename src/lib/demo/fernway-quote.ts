// Fernway's demonstration quote estimator. Every price is invented for the demo (the pages say so); the rules are
// written to behave like a real landscaper's sheet: size sets the base, how often sets the per-visit rate, extras add
// a size-scaled amount, and the answer is a range rounded to $5 because a yard is never quoted to the dollar unseen.
export type Size = "small" | "medium" | "large" | "custom";
export type Frequency = "one-time" | "weekly" | "biweekly" | "seasonal";
export type ServiceId = "mowing" | "cleanup" | "mulch" | "hedge" | "planting" | "snow";
export type ExtraId = "edging" | "cleanup" | "mulch" | "trimming" | "bagging" | "haul";
type Unit = "visit" | "job" | "season";

export const SIZES: Record<Exclude<Size, "custom">, { label: string; sqft: number; hint: string }> = {
  small: { label: "Small", sqft: 5000, hint: "Up to 5,000 sq ft · a city lot" },
  medium: { label: "Medium", sqft: 12000, hint: "5,000–12,000 sq ft · a typical suburban yard" },
  large: { label: "Large", sqft: 22000, hint: "12,000–22,000 sq ft · about half an acre" },
};
export const CUSTOM_MIN = 1000, CUSTOM_MAX = 200000;

export const SERVICES: Record<ServiceId, { name: string; short: string; unit: Unit; base: [number, number, number]; freqs: Frequency[]; blurb: string }> = {
  mowing: { name: "Lawn mowing", short: "Mowing", unit: "visit", base: [45, 60, 85], freqs: ["weekly", "biweekly", "one-time", "seasonal"], blurb: "Mow, string-trim and blow off hard surfaces." },
  cleanup: { name: "Spring or fall cleanup", short: "Cleanup", unit: "job", base: [180, 260, 380], freqs: ["one-time", "seasonal"], blurb: "Leaves, sticks and dead growth cleared from lawn and beds." },
  mulch: { name: "Mulch & bed refresh", short: "Mulch", unit: "job", base: [250, 380, 560], freqs: ["one-time", "seasonal"], blurb: "Weeded, edged and topped with fresh mulch." },
  hedge: { name: "Hedge & shrub trimming", short: "Trimming", unit: "visit", base: [90, 140, 210], freqs: ["one-time", "seasonal"], blurb: "Shaped by hand, cuttings hauled off." },
  planting: { name: "Planting & small design", short: "Planting", unit: "job", base: [400, 650, 950], freqs: ["one-time"], blurb: "Shrubs and perennials chosen for your sun and soil." },
  snow: { name: "Snow removal", short: "Snow", unit: "season", base: [420, 560, 780], freqs: ["seasonal"], blurb: "Drive and walks cleared after 2 inches, Nov–Mar." },
};

export const FREQUENCIES: Record<Frequency, { label: string; hint: string }> = {
  "one-time": { label: "One time", hint: "A single visit" },
  weekly: { label: "Weekly", hint: "Same day each week" },
  biweekly: { label: "Every two weeks", hint: "Longer grass, a little more per visit" },
  seasonal: { label: "Seasonal plan", hint: "The whole season, booked once" },
};

// extras: [low, high] for a medium yard, scaled by size; per visit for visit services, per job otherwise
export const EXTRAS: Record<ExtraId, { name: string; add: [number, number]; overlaps?: ServiceId }> = {
  edging: { name: "Edging along drive and walks", add: [10, 15] },
  cleanup: { name: "Debris cleanup", add: [25, 40], overlaps: "cleanup" },
  mulch: { name: "Mulch top-up (2 cu yd)", add: [140, 180], overlaps: "mulch" },
  trimming: { name: "Shrub trimming", add: [45, 70], overlaps: "hedge" },
  bagging: { name: "Bag clippings", add: [8, 12] },
  haul: { name: "Haul-away of yard waste", add: [35, 55] },
};

// visits a seasonal plan covers, by service
const SEASON_VISITS: Partial<Record<ServiceId, number>> = { mowing: 26, cleanup: 2, mulch: 1, hedge: 3 };
const FREQ_RATE: Record<Frequency, number> = { weekly: 1, biweekly: 1.15, "one-time": 1.35, seasonal: 0.95 };

export type QuoteInput = { service: ServiceId; size: Size; customSqft?: number; frequency: Frequency; extras: ExtraId[] };
export type Quote = { low: number; high: number; per: string; season?: { low: number; high: number; visits: number }; monthly?: { low: number; high: number }; notes: string[] };

const r5 = (n: number) => Math.round(n / 5) * 5;

/** How big the yard is, as a factor of a medium yard (custom sizes interpolate between and beyond the presets). */
export function sizeFactor(size: Size, customSqft = 0): number {
  const sqft = size === "custom" ? Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, customSqft || 0)) : SIZES[size].sqft;
  return Math.pow(sqft / SIZES.medium.sqft, 0.62);
}

/** The base price for the service at this size: presets use the price sheet, custom sizes follow the curve. */
function basePrice(s: ServiceId, size: Size, customSqft = 0): number {
  const b = SERVICES[s].base;
  if (size === "small") return b[0];
  if (size === "medium") return b[1];
  if (size === "large") return b[2];
  return b[1] * sizeFactor("custom", customSqft);
}

export const allowed = (s: ServiceId, f: Frequency) => SERVICES[s].freqs.includes(f);
export const extraIncluded = (s: ServiceId, e: ExtraId) => EXTRAS[e].overlaps === s;

export function estimate(q: QuoteInput): Quote {
  const svc = SERVICES[q.service];
  const notes: string[] = [];
  const frequency = allowed(q.service, q.frequency) ? q.frequency : svc.freqs[0];
  if (frequency !== q.frequency) notes.push(`${FREQUENCIES[q.frequency].label} isn’t offered for ${svc.short.toLowerCase()}, so this uses ${FREQUENCIES[frequency].label.toLowerCase()}.`);
  const k = q.size === "custom" ? sizeFactor("custom", q.customSqft) : sizeFactor(q.size);
  const base = basePrice(q.service, q.size, q.customSqft);
  let lo = base * 0.92, hi = base * 1.18;
  for (const e of new Set(q.extras)) {
    if (extraIncluded(q.service, e)) continue;
    const [a, b] = EXTRAS[e].add;
    lo += a * k; hi += b * k;
  }
  if (q.size === "custom" && (q.customSqft ?? 0) > SIZES.large.sqft * 1.5) notes.push("A property this size is confirmed on a short visit before the price is final.");
  if (q.size === "custom" && !q.customSqft) notes.push("Enter the lot size for a closer range.");

  if (svc.unit === "season") {
    return { low: r5(lo), high: r5(hi), per: "for the season (Nov–Mar)", notes };
  }
  const rate = svc.unit === "visit" || frequency === "seasonal" ? FREQ_RATE[frequency] : 1;
  lo *= rate; hi *= rate;
  const per = svc.unit === "visit" ? "per visit" : "for the job";
  const out: Quote = { low: r5(lo), high: r5(hi), per, notes };
  if (frequency === "seasonal") {
    const visits = SEASON_VISITS[q.service] ?? 1;
    // one visit a season (mulch): the visit price is the season price, so say it once
    if (visits === 1) out.per = "for the season";
    else {
      out.season = { low: r5(lo * visits), high: r5(hi * visits), visits };
      if (svc.unit === "job") out.per = "per visit";
    }
  } else if (svc.unit === "visit" && (frequency === "weekly" || frequency === "biweekly")) {
    const perMonth = frequency === "weekly" ? 4.33 : 2.17;
    out.monthly = { low: r5(out.low * perMonth), high: r5(out.high * perMonth) };
  }
  return out;
}
