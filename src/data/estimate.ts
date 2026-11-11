// The homepage estimator's arithmetic (components/PackageEstimator.astro), kept apart from the page so the tests can
// run it on its own. It holds no prices: the page hands it the chosen services' catalogue prices and the published
// discount rules (data/services.ts `bundle` and `bundles`).
//
// Two published ways to pay less, and they never stack (services.ts: "The preset bundles are already discounted, so
// this doesn't apply on top of them"):
//   multi   2 one-time services ordered together are 10% off, 3 or more 15% off, on the whole list at list price
//   bundle  a preset bundle whose services are all chosen, at its bundle price, with everything else at list price
// The estimate shows whichever of the two is lower for the visitor, and says which one it used. A saving is rounded
// down to a whole dollar, so the estimate never promises more off than the written quote will.
export type EstItem = { id: string; price: number };
export type EstRules = { two: number; three: number; bundles: { id: string; name: string; price: number; items: string[] }[] };
export type Estimate = {
  subtotal: number;
  save: number;
  total: number;
  how: "none" | "multi" | "bundle";
  /** the discount percentage used (how "multi") */
  percent: number;
  /** the preset bundles used (how "bundle") */
  bundles: string[];
  /** set when the choice is exactly one preset bundle and nothing else: the id the contact form can name */
  exact: string;
};

export function estimate(items: EstItem[], rules: EstRules): Estimate {
  const price = new Map(items.map((i) => [i.id, i.price]));
  const subtotal = items.reduce((t, i) => t + i.price, 0);
  const percent = price.size >= 3 ? rules.three : price.size === 2 ? rules.two : 0;
  const multi = Math.floor((subtotal * percent) / 100);

  // (preset bundles share no service today; `used` keeps a service from counting in two if that ever changes)
  const used = new Set<string>();
  const names: string[] = [];
  let exact = "";
  let bundleSave = 0;
  for (const b of rules.bundles) {
    if (!b.items.every((id) => price.has(id)) || b.items.some((id) => used.has(id))) continue;
    const save = b.items.reduce((t, id) => t + price.get(id)!, 0) - b.price;
    if (save <= 0) continue;
    bundleSave += save;
    names.push(b.name);
    b.items.forEach((id) => used.add(id));
    if (b.items.length === price.size) exact = b.id;
  }

  if (bundleSave > 0 && bundleSave >= multi) return { subtotal, save: bundleSave, total: subtotal - bundleSave, how: "bundle", percent: 0, bundles: names, exact };
  if (multi > 0) return { subtotal, save: multi, total: subtotal - multi, how: "multi", percent, bundles: [], exact: "" };
  return { subtotal, save: 0, total: subtotal, how: "none", percent: 0, bundles: [], exact: "" };
}
