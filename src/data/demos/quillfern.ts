// Quillfern Candle Co.: a fictional candle maker (data/demo-sites.ts). Every name, scent, price, place and quote here
// is invented for the demonstration; the catalogue and cart rules live in lib/demo/quillfern-cart.ts.
import { SHIP, PROMO } from "../../lib/demo/quillfern-cart";

export const base = "/example-sites/quillfern-candles";
export const phone = "(507) 555-0178";
export const email = "hello@quillfern.example";
export const callNote = `Demo: on a real site this button calls the studio at ${phone}.`;
export const emailNote = `Demo: on a real site this writes to ${email}.`;

export const nav = [
  { href: `${base}/shop/`, label: "Shop" },
  { href: `${base}/#story`, label: "Our story" },
  { href: `${base}/#get`, label: "Shipping & pickup" },
];

/** the pickup studio, in a made-up town (labelled as such where it appears) */
export const studio = {
  name: "Quillfern studio",
  street: "14 Tallow Lane",
  town: "Wickham Falls",
  hours: [["Thursday–Friday", "12:00 – 6:00 pm"], ["Saturday", "10:00 am – 4:00 pm"]] as const,
};

export const care = [
  ["First burn", "Let the first burn melt the wax all the way to the edge of the jar, about 2–3 hours, or it will tunnel."],
  ["Every time", "Trim the wick to ¼ inch before lighting. A tall wick smokes and burns too fast."],
  ["Last of the wax", "Stop when ½ inch is left. The jar washes out with warm soapy water and makes a good pot."],
] as const;

export const faq = [
  ["How long does shipping take?", `Orders leave the studio within 2 business days and usually arrive 3–5 days later. Standard shipping is $${SHIP.standard}, free on orders over $${SHIP.freeOver}; express (1–2 days) is $${SHIP.express}.`],
  ["How does local pickup work?", "Choose pickup at checkout and we text you when it’s ready, usually on the studio’s next open day (Thursday to Saturday). Bring the order number; pickup is always free."],
  ["Which size should I choose?", "The 4 oz tin suits a desk or a bathroom and travels well. The 8 oz jar fills a bedroom; the 12 oz fills a living room and lasts about 70 hours."],
  ["Can I return a candle?", "Unlit candles can come back within 30 days. If a jar arrives broken, send a photo and we send a new one."],
  ["Is there a code?", `In this demo, ${PROMO.code} takes ${PROMO.off * 100}% off the candles. It only changes the numbers on this page.`],
] as const;
