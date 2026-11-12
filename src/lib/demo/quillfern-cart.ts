// Quillfern Candle Co.: the made-up candle maker's catalogue and the rules of its demonstration cart. Every candle,
// note, price and stock count is invented for the demonstration (data/demo-sites.ts). Pure functions, no browser:
// the pages read and write the cart through lib/demo/store.ts, and tests/demos.test.mjs checks the arithmetic.
// Nothing here knows who the visitor is: the cart holds candle ids, sizes and quantities, never a name or address.

export type Family = "warm" | "fresh";
export type Axis = "woody" | "warm" | "sweet" | "fresh" | "green" | "smoky";
export const AXES: { id: Axis; name: string }[] = [
  { id: "woody", name: "Woody" },
  { id: "warm", name: "Warm" },
  { id: "sweet", name: "Sweet" },
  { id: "fresh", name: "Fresh" },
  { id: "green", name: "Green" },
  { id: "smoky", name: "Smoky" },
];

export type SizeId = "tin" | "8oz" | "12oz";
export const SIZE_IDS: SizeId[] = ["tin", "8oz", "12oz"];
export const SIZES: Record<SizeId, { name: string; label: string; price: number; hours: number }> = {
  tin: { name: "Travel tin", label: "4 oz tin", price: 14, hours: 20 },
  "8oz": { name: "Classic jar", label: "8 oz jar", price: 26, hours: 45 },
  "12oz": { name: "Large jar", label: "12 oz jar", price: 34, hours: 70 },
};

export type Candle = {
  id: string;
  name: string;
  family: Family;
  /** when it suits: shown on cards */
  mood: string;
  tagline: string;
  blurb: string;
  notes: { top: string; heart: string; base: string };
  /** 0-5 on each axis, drawn as the scent profile */
  profile: Record<Axis, number>;
  /** how far the scent carries, 1-5 */
  throw: number;
  glass: string;
  label: string;
  /** demonstration stock per size when nothing has been "bought" in this browser */
  stock: Record<SizeId, number>;
};

export const CANDLES: Candle[] = [
  { id: "cedar-evening", name: "Cedar Evening", family: "warm", mood: "Evenings", tagline: "Cedarwood, bergamot and smoked vanilla",
    blurb: "The first cold evening of the year: a cedar fire burned down to embers, a cup of tea, the lamps turned low.",
    notes: { top: "Bergamot", heart: "Cedarwood", base: "Smoked vanilla" },
    profile: { woody: 5, warm: 4, sweet: 2, fresh: 1, green: 1, smoky: 3 }, throw: 4, glass: "#4a3a31", label: "#eadcc5",
    stock: { tin: 14, "8oz": 9, "12oz": 6 } },
  { id: "amber-hearth", name: "Amber Hearth", family: "warm", mood: "Long dinners", tagline: "Amber resin, cinnamon bark and orange peel",
    blurb: "Spiced and glowing, for long dinners in the darkest weeks: oranges on the table, something slow on the stove.",
    notes: { top: "Orange peel", heart: "Cinnamon bark", base: "Amber resin" },
    profile: { woody: 2, warm: 5, sweet: 3, fresh: 1, green: 0, smoky: 2 }, throw: 5, glass: "#93452b", label: "#f6e7d4",
    stock: { tin: 11, "8oz": 12, "12oz": 8 } },
  { id: "rain-garden", name: "Rain Garden", family: "fresh", mood: "Open windows", tagline: "Petrichor, violet leaf and vetiver",
    blurb: "Green and cool: the garden right after a summer storm, with every window in the house thrown open.",
    notes: { top: "Petrichor", heart: "Violet leaf", base: "Vetiver" },
    profile: { woody: 2, warm: 0, sweet: 1, fresh: 4, green: 5, smoky: 0 }, throw: 3, glass: "#7f9a7c", label: "#f2ead9",
    stock: { tin: 10, "8oz": 7, "12oz": 5 } },
  { id: "vanilla-linen", name: "Vanilla Linen", family: "fresh", mood: "All day", tagline: "Line-dried cotton, lemon peel and vanilla bean",
    blurb: "Clean sheets brought in from the line, with a little vanilla underneath so it never smells like laundry soap.",
    notes: { top: "Lemon peel", heart: "Line-dried cotton", base: "Vanilla bean" },
    profile: { woody: 0, warm: 2, sweet: 3, fresh: 4, green: 1, smoky: 0 }, throw: 3, glass: "#e2d8c8", label: "#a9bfca",
    stock: { tin: 16, "8oz": 15, "12oz": 10 } },
  { id: "forest-cabin", name: "Forest Cabin", family: "warm", mood: "Weekends away", tagline: "Balsam fir, spruce resin and birch smoke",
    blurb: "A walk through snowy pines, then boots off by the stove in a cabin that has smelled of wood smoke for fifty winters.",
    notes: { top: "Balsam fir", heart: "Spruce resin", base: "Birch smoke" },
    profile: { woody: 4, warm: 3, sweet: 0, fresh: 2, green: 3, smoky: 4 }, throw: 4, glass: "#3b5546", label: "#efe4cf",
    stock: { tin: 8, "8oz": 3, "12oz": 0 } },
  { id: "quiet-morning", name: "Quiet Morning", family: "fresh", mood: "Mornings", tagline: "White tea, pear and soft musk",
    blurb: "The hour before anyone else is awake: a pot of white tea, a ripe pear, light coming slowly through the curtains.",
    notes: { top: "Pear", heart: "White tea", base: "Soft musk" },
    profile: { woody: 1, warm: 1, sweet: 2, fresh: 5, green: 2, smoky: 0 }, throw: 2, glass: "#c8b394", label: "#fbf3e3",
    stock: { tin: 12, "8oz": 10, "12oz": 7 } },
];
export const FAMILIES: Record<Family, { name: string; note: string }> = {
  warm: { name: "Warm & woody", note: "Cedar, amber, smoke" },
  fresh: { name: "Fresh & light", note: "Rain, linen, tea" },
};
export const candleById = (id: string) => CANDLES.find((c) => c.id === id);

/** shipping: a flat rate, free over a threshold (after the promo), express always charged; pickup is free */
export const SHIP = { standard: 7, express: 15, freeOver: 60 };
/** the one demonstration promo code, printed on the cart page */
export const PROMO = { code: "DEMO10", off: 0.1 };
export const MAX_QTY = 9;

export type Line = { id: string; size: SizeId; qty: number };
export type How = "ship" | "pickup";
export type Speed = "standard" | "express";
export type Cart = { lines: Line[]; how: How; promo: string | null };
export const emptyCart = (): Cart => ({ lines: [], how: "ship", promo: null });

/** stock left per candle and size, keyed "id:size" */
export type Stock = Record<string, number>;
export const stockKey = (id: string, size: SizeId) => `${id}:${size}`;
export function defaultStock(): Stock {
  const s: Stock = {};
  for (const c of CANDLES) for (const z of SIZE_IDS) s[stockKey(c.id, z)] = c.stock[z];
  return s;
}
/** whatever was in storage, as a full stock table: unknown keys dropped, bad counts back to the default, and never
 *  more than the catalogue has (demo stock only ever goes down, until it is reset) */
export function normaliseStock(raw: unknown): Stock {
  const s = defaultStock();
  if (raw && typeof raw === "object") {
    for (const k of Object.keys(s)) {
      const v = (raw as Record<string, unknown>)[k];
      if (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= s[k]) s[k] = v as number;
    }
  }
  return s;
}
export const left = (stock: Stock, id: string, size: SizeId) => stock[stockKey(id, size)] ?? 0;

const isSize = (v: unknown): v is SizeId => typeof v === "string" && (SIZE_IDS as string[]).includes(v);
export const promoValid = (code: unknown) => typeof code === "string" && code.trim().toUpperCase() === PROMO.code;

/** whatever was in storage (or a link), as a cart that can be trusted: known candles and sizes only, duplicates
 *  merged, quantities whole and within 1..9 and within the stock left; a sold-out line is dropped */
export function normaliseCart(raw: unknown, stock: Stock = defaultStock()): Cart {
  const cart = emptyCart();
  if (!raw || typeof raw !== "object") return cart;
  const r = raw as { lines?: unknown; how?: unknown; promo?: unknown };
  if (Array.isArray(r.lines)) {
    for (const l of r.lines.slice(0, 40)) {
      if (!l || typeof l !== "object") continue;
      const { id, size, qty } = l as { id?: unknown; size?: unknown; qty?: unknown };
      if (typeof id !== "string" || !candleById(id) || !isSize(size)) continue;
      const n = Math.floor(Number(qty));
      if (!Number.isFinite(n) || n < 1) continue;
      const have = cart.lines.find((x) => x.id === id && x.size === size);
      const cap = Math.min(MAX_QTY, left(stock, id, size));
      if (have) have.qty = Math.min(cap, have.qty + n);
      else if (cap > 0) cart.lines.push({ id, size, qty: Math.min(cap, n) });
    }
  }
  cart.how = r.how === "pickup" ? "pickup" : "ship";
  cart.promo = promoValid(r.promo) ? PROMO.code : null;
  return cart;
}

/** add to the cart, never past the stock left or 9 of one line; says how many went in */
export function addLine(cart: Cart, id: string, size: SizeId, qty: number, stock: Stock): { cart: Cart; added: number } {
  const next = normaliseCart(cart, stock);
  const have = next.lines.find((l) => l.id === id && l.size === size);
  const now = have?.qty ?? 0;
  const room = Math.max(0, Math.min(MAX_QTY, left(stock, id, size)) - now);
  const added = Math.max(0, Math.min(room, Math.floor(qty)));
  if (added > 0) { if (have) have.qty += added; else next.lines.push({ id, size, qty: added }); }
  return { cart: next, added };
}

/** set a line's quantity (0 removes it) */
export function setQty(cart: Cart, id: string, size: SizeId, qty: number, stock: Stock): Cart {
  const next = normaliseCart(cart, stock);
  const n = Math.floor(qty);
  next.lines = next.lines
    .map((l) => (l.id === id && l.size === size ? { ...l, qty: Math.min(n, MAX_QTY, left(stock, id, size)) } : l))
    .filter((l) => l.qty >= 1);
  return next;
}

const cents = (n: number) => Math.round(n * 100) / 100;

export function totals(cart: Cart, speed: Speed = "standard") {
  const lines = cart.lines.flatMap((l) => {
    const candle = candleById(l.id);
    if (!candle) return [];
    const unit = SIZES[l.size].price;
    return [{ ...l, candle, unit, amount: unit * l.qty }];
  });
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const discount = cart.promo && promoValid(cart.promo) ? cents(subtotal * PROMO.off) : 0;
  const goods = cents(subtotal - discount);
  const shipping = count === 0 || cart.how === "pickup" ? 0 : speed === "express" ? SHIP.express : goods >= SHIP.freeOver ? 0 : SHIP.standard;
  const freeLeft = count > 0 && cart.how === "ship" && goods < SHIP.freeOver ? cents(SHIP.freeOver - goods) : 0;
  return { lines, count, subtotal, discount, shipping, total: cents(goods + shipping), freeLeft };
}

/** a demonstration order number: "QF-" and six letters or digits that can't be misread (no 0/O, 1/I/L, 2/Z, 5/S, 8/B) */
const ID_CHARS = "ACDEFGHJKMNPQRTUVWXY34679";
export function orderId(rand: () => number = Math.random) {
  let s = "";
  for (let i = 0; i < 6; i++) s += ID_CHARS[Math.floor(rand() * ID_CHARS.length) % ID_CHARS.length];
  return `QF-${s}`;
}

/** the demo stock after an order: what this browser shows next, so the visitor can see stock go down */
export function afterOrder(stock: Stock, cart: Cart): Stock {
  const next = { ...stock };
  for (const l of cart.lines) {
    const k = stockKey(l.id, l.size);
    if (k in next) next[k] = Math.max(0, next[k] - l.qty);
  }
  return next;
}

/** "Only 3 left", "Sold out", or nothing worth saying */
export function stockNote(n: number) {
  return n <= 0 ? "Sold out" : n <= 3 ? `Only ${n} left` : "";
}
