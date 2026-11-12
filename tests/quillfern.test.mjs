// Quillfern's made-up store rules (src/lib/demo/quillfern-cart.ts): what a stored cart may hold, adding never passes
// the demo stock, totals, the demo code, shipping and pickup, and the stock after a demo order.
//   node --test tests/quillfern.test.mjs   (Node 23.6+)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CANDLES, SIZES, SHIP, PROMO, MAX_QTY, emptyCart, defaultStock, normaliseStock, normaliseCart, addLine, setQty, totals,
  orderId, afterOrder, stockNote, promoValid, left, stockKey,
} from "../src/lib/demo/quillfern-cart.ts";

const s0 = defaultStock();

test("quillfern: a stored cart can only hold known candles and sizes, within the stock, merged and capped", () => {
  assert.deepEqual(normaliseCart(null), emptyCart());
  assert.deepEqual(normaliseCart("junk"), emptyCart());
  const c = normaliseCart({
    lines: [
      { id: "cedar-evening", size: "8oz", qty: 4 }, { id: "cedar-evening", size: "8oz", qty: 4 },
      { id: "cedar-evening", size: "8oz", qty: 4 },   // 12 in total: capped at 9 (and the 9 in stock)
      { id: "nope", size: "8oz", qty: 1 }, { id: "rain-garden", size: "huge", qty: 1 },
      { id: "rain-garden", size: "tin", qty: -3 }, { id: "rain-garden", size: "tin", qty: "2.9" },
      { id: "forest-cabin", size: "12oz", qty: 1 },    // sold out: dropped
      { id: "<img src=x>", size: "tin", qty: 1 },
    ],
    how: "pickup", promo: " demo10 ",
  }, s0);
  assert.deepEqual(c.lines, [{ id: "cedar-evening", size: "8oz", qty: 9 }, { id: "rain-garden", size: "tin", qty: 2 }]);
  assert.equal(c.how, "pickup");
  assert.equal(c.promo, PROMO.code);
  assert.equal(normaliseCart({ how: "drone", promo: "FREE" }).how, "ship");
  assert.equal(normaliseCart({ promo: "FREE" }).promo, null);
  assert.equal(normaliseCart({ lines: Array.from({ length: 100 }, () => ({ id: "rain-garden", size: "tin", qty: 1 })) }, s0).lines[0].qty, Math.min(MAX_QTY, 40));
});

test("quillfern: adding never goes past the stock left or nine of one line, and says how many went in", () => {
  let { cart, added } = addLine(emptyCart(), "forest-cabin", "8oz", 2, s0);
  assert.equal(added, 2);
  ({ cart, added } = addLine(cart, "forest-cabin", "8oz", 5, s0));
  assert.equal(added, 1, "only 3 in stock");
  assert.equal(cart.lines[0].qty, 3);
  ({ cart, added } = addLine(cart, "forest-cabin", "12oz", 1, s0));
  assert.equal(added, 0, "sold out");
  assert.equal(cart.lines.length, 1);
  ({ cart, added } = addLine(cart, "vanilla-linen", "tin", 50, s0));
  assert.equal(added, MAX_QTY);
  assert.equal(setQty(cart, "vanilla-linen", "tin", 0, s0).lines.length, 1, "0 removes the line");
  assert.equal(setQty(cart, "forest-cabin", "8oz", 99, s0).lines[0].qty, 3, "set never passes the stock");
});

test("quillfern: totals, the demo code, free shipping over the line, express and pickup", () => {
  const one = addLine(emptyCart(), "cedar-evening", "8oz", 1, s0).cart;      // $26
  let t = totals(one);
  assert.deepEqual([t.count, t.subtotal, t.discount, t.shipping, t.total], [1, 26, 0, SHIP.standard, 26 + SHIP.standard]);
  assert.equal(t.freeLeft, SHIP.freeOver - 26);
  t = totals(one, "express");
  assert.equal(t.shipping, SHIP.express);
  t = totals({ ...one, how: "pickup" }, "express");
  assert.deepEqual([t.shipping, t.freeLeft], [0, 0], "pickup is free, and has no express");
  const three = addLine(one, "cedar-evening", "8oz", 2, s0).cart;             // $78
  t = totals(three);
  assert.deepEqual([t.shipping, t.freeLeft, t.total], [0, 0, 78]);
  // the code takes 10% off the candles, and free shipping is judged after it: $60 - 10% = $54, so shipping comes back
  const sixty = addLine(addLine(emptyCart(), "cedar-evening", "12oz", 1, s0).cart, "rain-garden", "8oz", 1, s0).cart;
  assert.equal(totals(sixty).shipping, 0, "$60 ships free");
  t = totals({ ...sixty, promo: PROMO.code });
  assert.equal(t.subtotal, SIZES["12oz"].price + SIZES["8oz"].price);
  assert.equal(t.discount, 6);
  assert.equal(t.shipping, SHIP.standard);
  assert.equal(t.freeLeft, 6);
  assert.equal(t.total, 54 + SHIP.standard);
  // cents stay exact: 3 tins with the code is $42 - $4.20
  t = totals({ ...addLine(emptyCart(), "rain-garden", "tin", 3, s0).cart, promo: PROMO.code });
  assert.deepEqual([t.discount, t.total], [4.2, 37.8 + SHIP.standard]);
  assert.deepEqual(totals(emptyCart()), { lines: [], count: 0, subtotal: 0, discount: 0, shipping: 0, total: 0, freeLeft: 0 });
  assert.ok(promoValid("demo10") && promoValid(" DEMO10 ") && !promoValid("DEMO1") && !promoValid(null));
});

test("quillfern: a demo order takes its candles out of this browser's demo stock, never below zero", () => {
  const cart = { lines: [{ id: "forest-cabin", size: "8oz", qty: 3 }, { id: "rain-garden", size: "tin", qty: 2 }], how: "ship", promo: null };
  const s1 = afterOrder(s0, cart);
  assert.equal(left(s1, "forest-cabin", "8oz"), 0);
  assert.equal(left(s1, "rain-garden", "tin"), left(s0, "rain-garden", "tin") - 2);
  assert.equal(left(afterOrder(s1, cart), "forest-cabin", "8oz"), 0);
  assert.equal(s0[stockKey("forest-cabin", "8oz")], 3, "the old stock is not changed");
  // stored stock can only lower what the catalogue has; junk goes back to the catalogue count
  const n = normaliseStock({ [stockKey("rain-garden", "tin")]: 999, [stockKey("cedar-evening", "8oz")]: -4, "x:tin": 5,
    [stockKey("vanilla-linen", "8oz")]: "7", [stockKey("quiet-morning", "tin")]: 4, [stockKey("amber-hearth", "12oz")]: 0 });
  assert.equal(left(n, "rain-garden", "tin"), left(s0, "rain-garden", "tin"), "can't go above the catalogue");
  assert.equal(left(n, "cedar-evening", "8oz"), left(s0, "cedar-evening", "8oz"));
  assert.equal(left(n, "vanilla-linen", "8oz"), left(s0, "vanilla-linen", "8oz"));
  assert.equal(left(n, "quiet-morning", "tin"), 4);
  assert.equal(left(n, "amber-hearth", "12oz"), 0);
  assert.ok(!("x:tin" in n));
  assert.deepEqual([stockNote(0), stockNote(2), stockNote(3), stockNote(4)], ["Sold out", "Only 2 left", "Only 3 left", ""]);
  assert.equal(CANDLES.length, 6);
});

test("quillfern: demo order numbers are QF- and six characters that can't be misread", () => {
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const id = orderId();
    assert.match(id, /^QF-[ACDEFGHJKMNPQRTUVWXY34679]{6}$/);
    seen.add(id);
  }
  assert.ok(seen.size > 490);
  assert.equal(orderId(() => 0.999999), "QF-999999");
});
