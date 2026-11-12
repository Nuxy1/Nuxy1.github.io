// The Creative Studio estimator's arithmetic and the short code that carries a visitor's choices to the quote form
// (components/CreativeEstimator.astro writes it, components/InquiryForm.astro reads it). Kept apart from both pages so
// the tests can run it on its own. It holds no prices: each page hands it the rules built from data/creative.ts, the
// same list the service cards print, so a card and the estimator can never show different numbers.
//
// Everything that arrives from an address is checked against those rules before it is used: an unknown service, a
// number out of range or a made-up option makes the whole code invalid, and the form then behaves as if none was sent.
// The dollar figure is never read from the address; the form works it out again from the checked choices.
export type CreativeType = {
  id: string;
  label: string;
  /** dollars: per video for a one-time type, per month for a package */
  base: number;
  monthly: boolean;
  /** videos in a monthly package; 0 lets the visitor choose 1..maxVideos */
  count: number;
  /** export formats included in the base price */
  formats: number;
  /** the base is a starting price ("from $350") rather than a fixed one */
  from: boolean;
};
export type CreativeRules = {
  types: CreativeType[];
  maxVideos: number;
  durations: { id: string; label: string; add: number }[];
  formats: { id: string; label: string }[];
  extraFormat: number;
  /** percent added to the base and length; null is "not sure yet" and gives a range from the lowest to the highest */
  levels: { id: string; label: string; percent: number | null }[];
  revisions: { included: number; max: number; extra: number };
  extras: { id: string; label: string; add: number }[];
  /** the complexity uplift is rounded up to this many dollars */
  round: number;
};
export type CreativeChoice = { type: string; videos: number; duration: string; formats: string[]; level: string; revisions: number; extras: string[] };
export type CreativeLine = { label: string; amount: number };
export type CreativeQuote = {
  /** the starting estimate in dollars; `high` is above `low` only when the complexity is "not sure yet" */
  low: number;
  high: number;
  monthly: boolean;
  videos: number;
  lines: CreativeLine[];
};

const whole = (v: unknown) => (typeof v === "number" && Number.isInteger(v) ? v : NaN);
const known = <T extends { id: string }>(list: T[], ids: unknown): string[] | null => {
  if (!Array.isArray(ids)) return null;
  const set = new Set(ids);
  if (set.size !== ids.length || ids.some((id) => typeof id !== "string" || !list.some((x) => x.id === id))) return null;
  return list.filter((x) => set.has(x.id)).map((x) => x.id); // (the rules' own order, whatever order they came in)
};

/** The choice with every part checked against the rules, or null when any part is not one the page offers. */
export function check(choice: Partial<CreativeChoice> | null | undefined, rules: CreativeRules): CreativeChoice | null {
  if (!choice) return null;
  const type = rules.types.find((t) => t.id === choice.type);
  if (!type) return null;
  const videos = type.count || whole(choice.videos);
  if (!(videos >= 1 && videos <= Math.max(rules.maxVideos, type.count))) return null;
  if (!rules.durations.some((d) => d.id === choice.duration)) return null;
  const formats = known(rules.formats, choice.formats);
  if (!formats || formats.length === 0) return null;
  if (!rules.levels.some((l) => l.id === choice.level)) return null;
  const revisions = whole(choice.revisions);
  if (!(revisions >= rules.revisions.included && revisions <= rules.revisions.max)) return null;
  const extras = known(rules.extras, choice.extras);
  if (!extras) return null;
  return { type: type.id, videos, duration: choice.duration!, formats, level: choice.level!, revisions, extras };
}

/** The starting estimate for a checked choice. */
export function quote(c: CreativeChoice, rules: CreativeRules): CreativeQuote {
  const type = rules.types.find((t) => t.id === c.type)!;
  const each = (n: number) => n * c.videos;
  const lines: CreativeLine[] = [];
  const base = type.monthly ? type.base : each(type.base);
  lines.push({ label: type.monthly ? type.label : c.videos > 1 ? `${type.label} × ${c.videos}` : type.label, amount: base });

  const duration = rules.durations.find((d) => d.id === c.duration)!;
  const length = each(duration.add);
  if (length) lines.push({ label: `Length: ${duration.label}`, amount: length });

  const extraFormats = Math.max(0, c.formats.length - type.formats);
  if (extraFormats) lines.push({ label: `${extraFormats} extra ${extraFormats === 1 ? "format" : "formats"}`, amount: each(extraFormats * rules.extraFormat) });

  const extraRounds = c.revisions - rules.revisions.included;
  if (extraRounds) lines.push({ label: `${extraRounds} extra revision ${extraRounds === 1 ? "round" : "rounds"}`, amount: each(extraRounds * rules.revisions.extra) });

  for (const id of c.extras) {
    const x = rules.extras.find((e) => e.id === id)!;
    lines.push({ label: x.label, amount: each(x.add) });
  }

  // Complexity is a share of the making itself (the base and the length), not of the extras.
  const uplift = (percent: number) => Math.ceil(((base + length) * percent) / 100 / rules.round) * rules.round;
  const level = rules.levels.find((l) => l.id === c.level)!;
  const percents = rules.levels.map((l) => l.percent).filter((p): p is number => p !== null);
  const rest = lines.reduce((t, l) => t + l.amount, 0);
  let low = rest, high = rest;
  if (level.percent === null) {
    low += uplift(Math.min(...percents));
    high += uplift(Math.max(...percents));
  } else if (level.percent > 0) {
    const add = uplift(level.percent);
    lines.push({ label: `${level.label} complexity`, amount: add });
    low += add; high += add;
  }
  return { low, high, monthly: type.monthly, videos: c.videos, lines };
}

// ---- The code in the address: type~videos~length~formats~complexity~revisions~extras, lists joined by dots ----
// e.g. "ad~2~30~9x16.16x9~advanced~3~captions.voice". Only lower-case letters, digits, "-", "." and "~" are ever
// accepted, so nothing in it can carry markup or a link.
export const encode = (c: CreativeChoice): string =>
  [c.type, c.videos, c.duration, c.formats.join("."), c.level, c.revisions, c.extras.join(".")].join("~");

export function decode(code: string | null | undefined, rules: CreativeRules): CreativeChoice | null {
  if (typeof code !== "string" || !/^[a-z0-9.~-]{1,160}$/.test(code)) return null;
  const parts = code.split("~");
  if (parts.length !== 7) return null;
  const [type, videos, duration, formats, level, revisions, extras] = parts;
  if (!/^\d{1,2}$/.test(videos) || !/^\d$/.test(revisions)) return null;
  return check({ type, videos: Number(videos), duration, formats: formats.split("."), level, revisions: Number(revisions), extras: extras ? extras.split(".") : [] }, rules);
}

const money = (n: number) => "$" + n.toLocaleString("en-US");
/** "$249", "$249–$324", with "a month" for a package. */
export const priceText = (q: CreativeQuote): string => (q.high > q.low ? `${money(q.low)}–${money(q.high)}` : money(q.low)) + (q.monthly ? " a month" : "");

// ("Up to 15 seconds" reads "up to 15 seconds" inside a sentence; "AI voice-over" keeps its capitals)
const inline = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const list = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);
/** One plain sentence naming the choices, for the quote form's project box. */
export function describe(c: CreativeChoice, rules: CreativeRules): string {
  const type = rules.types.find((t) => t.id === c.type)!;
  const pick = <T extends { id: string; label: string }>(all: T[], id: string) => all.find((x) => x.id === id)!.label;
  const parts = [
    type.monthly ? type.label : c.videos > 1 ? `${type.label} × ${c.videos}` : type.label,
    `${inline(pick(rules.durations, c.duration))}${c.videos > 1 ? " each" : ""}`,
    `${c.formats.length === 1 ? "format" : "formats"}: ${list(c.formats.map((f) => pick(rules.formats, f)))}`,
    `complexity: ${inline(pick(rules.levels, c.level))}`,
    `${c.revisions} revision rounds`,
  ];
  if (c.extras.length) parts.push(`extras: ${list(c.extras.map((x) => inline(pick(rules.extras, x))))}`);
  return parts.join("; ");
}
