// The homepage estimator's arithmetic (src/data/estimate.ts) against the published rules in src/data/services.ts.
// No browser and no build needed:   node --test tests/estimate.test.mjs   (Node 23.6 or newer: it imports .ts directly)
//
// The rules (services.ts `bundle.text`): 2 one-time services together are 10% off, 3 or more 15% off; the preset
// bundles are already discounted, so the two never stack. The estimate uses whichever is lower for the visitor.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { estimate } from "../src/data/estimate.ts";
import { services, variants, bundles, bundle, estimable, consultOnly, dollars } from "../src/data/services.ts";

const here = dirname(fileURLToPath(import.meta.url));
const rules = { two: bundle.two, three: bundle.three, bundles: bundles.map((b) => ({ id: b.id, name: b.name, price: dollars(b.price), items: b.items })) };
const items = estimable.flatMap((g) => g.items);
const price = Object.fromEntries(items.map((s) => [s.id, dollars(s.price)]));
const list = (...ids) => ids.map((id) => ({ id, price: price[id] }));
const sum = (ids) => ids.reduce((t, id) => t + price[id], 0);

test("the rules the estimator is handed are the published ones", () => {
  assert.deepEqual([rules.two, rules.three], [10, 15]);
  assert.match(bundle.text, /2 one-time services together and the total is 10% off; 3 or more, 15% off/);
  assert.match(bundle.text, /already discounted, so this doesn’t apply on top of them/);
});

test("only services anyone can order today, at a real catalogue price, are added up", () => {
  const all = new Map([...services, ...variants].map((s) => [s.id, s]));
  assert.ok(items.length >= 10, `${items.length} services`);
  assert.equal(new Set(items.map((s) => s.id)).size, items.length, "no service twice");
  for (const s of items) {
    const real = all.get(s.id);
    assert.ok(real, `${s.id} is in the catalogue`);
    assert.equal(s.price, real.price, `${s.id} keeps its catalogue price`);
    assert.ok(price[s.id] > 0, `${s.id} has a dollar price`);
    assert.ok(!["custom", "setup"].includes(real.priceType), `${s.id} is a one-time price`);
  }
  // consultation-only services (the AI Voice Receptionist among them) are never in the sum
  assert.ok(consultOnly.length > 0);
  for (const s of consultOnly) assert.ok(!(s.id in price), `${s.id} is quoted separately`);
  // every preset bundle is made of services the estimator lists, so a visitor can tick their way to it
  for (const b of bundles) for (const id of b.items) assert.ok(id in price, `${b.id}: ${id}`);
});

test("nothing chosen is $0, and one service is its own price with nothing off", () => {
  assert.deepEqual(estimate([], rules), { subtotal: 0, save: 0, total: 0, how: "none", percent: 0, bundles: [], exact: "" });
  for (const s of items) {
    const e = estimate(list(s.id), rules);
    assert.deepEqual([e.subtotal, e.save, e.total, e.how], [price[s.id], 0, price[s.id], "none"], s.id);
  }
});

test("two services are 10% off and three or more 15% off, rounded so the estimate never promises more than the quote", () => {
  // (hand-checked against today's prices; a deliberate price change updates these three lines)
  assert.deepEqual([price.reviews, price["missed-calls"], price["follow-up"], price.booking], [149, 199, 399, 349]);
  const two = estimate(list("reviews", "booking"), rules); // 498, 10% = 49.8
  assert.deepEqual([two.subtotal, two.save, two.total, two.how, two.percent], [498, 49, 449, "multi", 10]);
  const three = estimate(list("reviews", "missed-calls", "follow-up"), rules); // 747, 15% = 112.05
  assert.deepEqual([three.subtotal, three.save, three.total, three.how, three.percent], [747, 112, 635, "multi", 15]);
  // any other number of services: the same percentage of the list total, rounded down, never more
  const ids = items.filter((s) => !s.alt).map((s) => s.id);
  for (let n = 2; n <= ids.length; n++) {
    const chosen = ids.slice(0, n), e = estimate(list(...chosen), rules), pct = n >= 3 ? 15 : 10;
    assert.equal(e.subtotal, sum(chosen));
    assert.ok(e.save >= Math.floor((sum(chosen) * pct) / 100), `${n} services save at least ${pct}%`);
    assert.equal(e.total, e.subtotal - e.save);
    assert.ok(Number.isInteger(e.save) && e.save < e.subtotal);
  }
});

test("a preset bundle and the multi-service discount never stack: the estimate uses one of them, the lower total", () => {
  for (const b of rules.bundles) {
    const off = sum(b.items) - b.price;
    assert.ok(off > 0, `${b.id} costs less than its services separately`);
    // exactly the bundle
    const multi = Math.floor((sum(b.items) * (b.items.length >= 3 ? 15 : 10)) / 100);
    const e = estimate(list(...b.items), rules);
    assert.equal(e.save, Math.max(off, multi), `${b.id}: one discount, the better one`);
    assert.notEqual(e.save, off + multi, `${b.id}: not both`);
    assert.ok(e.total <= b.price, `${b.id}: never more than the published bundle price`);
    if (off >= multi) assert.deepEqual([e.how, e.total, e.exact, e.bundles], ["bundle", b.price, b.id, [b.name]]);
    else assert.deepEqual([e.how, e.exact], ["multi", ""]);

    // the bundle plus one more service: still one discount on the whole request
    const extra = items.find((s) => !s.alt && !b.items.includes(s.id) && !rules.bundles.some((o) => o.items.includes(s.id)));
    const more = [...b.items, extra.id], multiMore = Math.floor((sum(more) * 15) / 100);
    const m = estimate(list(...more), rules);
    assert.equal(m.save, Math.max(off, multiMore), `${b.id} + ${extra.id}`);
    assert.equal(m.total, sum(more) - m.save);
    assert.equal(m.exact, "", "a bundle with something added is not the plain bundle");
    assert.ok(m.total >= sum(more) - Math.max(off, multiMore));
  }
  // every bundle at once: their savings add (they share no service), and still no percentage on top
  const every = rules.bundles.flatMap((b) => b.items);
  assert.equal(new Set(every).size, every.length, "the preset bundles share no service");
  const offAll = rules.bundles.reduce((t, b) => t + sum(b.items) - b.price, 0), multiAll = Math.floor((sum(every) * 15) / 100);
  const all = estimate(list(...every), rules);
  assert.equal(all.save, Math.max(offAll, multiAll));
  assert.equal(all.exact, "");
});

test("a service listed twice is counted once, and a bundle that would cost more is ignored", () => {
  const twice = estimate([...list("reviews"), ...list("reviews")], rules);
  assert.equal(twice.percent, 0, "one service is not a pair");
  const dear = { two: 10, three: 15, bundles: [{ id: "dear", name: "Dear", price: 9999, items: ["reviews", "booking"] }] };
  const e = estimate(list("reviews", "booking"), dear);
  assert.deepEqual([e.how, e.save], ["multi", 49]);
  // (made-up bundle prices from here on, to reach the cases today’s catalogue doesn’t)
  // a dearer bundle beside a good one takes nothing away from the good one
  const mixed = { two: 10, three: 15, bundles: [{ id: "good", name: "Good", price: 300, items: ["reviews", "booking"] }, { id: "dear", name: "Dear", price: 9999, items: ["missed-calls", "follow-up"] }] };
  const m = estimate(list("reviews", "booking", "missed-calls", "follow-up"), mixed); // 1,096 separately; the bundle saves 198, 15% would save 164
  assert.deepEqual([m.how, m.save, m.total, m.bundles, m.exact], ["bundle", 198, 898, ["Good"], ""]);
  // a bundle with one more service beside it is not "exactly that bundle", even when the bundle price is what is used
  const plus = estimate(list("reviews", "booking", "missed-calls"), mixed); // 697 separately; bundle 198 off, 15% would be 104
  assert.deepEqual([plus.how, plus.save, plus.exact], ["bundle", 198, ""]);
  assert.equal(estimate(list("reviews", "booking"), mixed).exact, "good");
});

test("the estimator holds no prices of its own", () => {
  for (const file of ["../src/data/estimate.ts", "../src/components/PackageEstimator.astro"]) {
    // (the code, without its comments: they describe the published rules in words)
    const code = readFileSync(join(here, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    assert.doesNotMatch(code, /\$\s?\d/, `${file} has no dollar amount written into it`);
    assert.doesNotMatch(code, /\b(10|15)\s?%/, `${file} has no discount percentage written into it`);
  }
});
