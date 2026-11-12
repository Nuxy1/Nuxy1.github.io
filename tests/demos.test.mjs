// The demo websites' pure logic, without a browser or a build:   node --test tests/demos.test.mjs   (Node 23.6+)
// Mossgate's made-up estimate rules (src/lib/demo/mossgate-estimate.ts): the arithmetic, the tidying of links, and the
// fixed booking calendar the booking page relies on.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT, CLEANS, EXTRAS, WINDOWS, estimate, normalise, toQuery, fromQuery, describe, hoursLabel, takenWindows, bookingDays, typicalSqft,
} from "../src/lib/demo/mossgate-estimate.ts";

test("mossgate: the default home gives the published worked example", () => {
  // (60 + 3x20 + 2x25 + 1500/100x3) x 1.06 = 227.9; every 2 weeks saves 12% = 200.55; shown x0.92..x1.1, to $5
  const e = estimate(DEFAULT);
  assert.deepEqual([e.low, e.high, e.crew, e.hours, e.morningOnly], [185, 220, 2, 2.5, false]);
  assert.equal(e.lines.at(-1).amount, -27, "the discount is its own line");
  assert.ok(e.low % 5 === 0 && e.high % 5 === 0 && e.low < e.high);
});

test("mossgate: a bigger clean costs more, a more frequent plan costs less", () => {
  const at = (o) => estimate(normalise({ ...DEFAULT, ...o })).mid;
  assert.ok(at({ clean: "deep" }) > at({ clean: "standard", freq: "once" }));
  assert.ok(at({ clean: "moveout" }) > at({ clean: "movein" }));
  assert.ok(at({ freq: "weekly" }) < at({ freq: "biweekly" }) && at({ freq: "biweekly" }) < at({ freq: "monthly" }) && at({ freq: "monthly" }) < at({ freq: "once" }));
  assert.ok(at({ bed: 4 }) > at({ bed: 3 }) && at({ sqft: 3000 }) > at({ sqft: 1500 }));
  assert.ok(Math.abs(at({ extras: ["windows"] }) - at({}) - EXTRAS.windows.add * 0.88) < 1e-9, "an extra adds its flat price, less the plan discount");
});

test("mossgate: a link can't set junk, a one-off clean is one time, included extras are never charged twice", () => {
  const c = normalise({ home: "castle", bed: "9", bath: "-2", sqft: "99999", clean: "deep", freq: "weekly", extras: "baseboards,oven,oven,<script>" });
  assert.deepEqual(c, { home: DEFAULT.home, bed: 5, bath: 1, sqft: 5000, clean: "deep", freq: "once", extras: ["oven"] });
  assert.equal(normalise({ bed: 2, sqft: "" }).sqft, typicalSqft(2), "no floor area: the typical one for the bedrooms");
  assert.equal(normalise({ sqft: 1234 }).sqft, 1250, "rounded to the slider's 50 sq ft step");
  for (const id of Object.keys(CLEANS)) {
    const e = estimate(normalise({ ...DEFAULT, clean: id, extras: CLEANS[id].includes }));
    assert.equal(e.lines.filter((l) => Object.values(EXTRAS).some((x) => x.name === l.label)).length, 0, `${id} charges no included extra`);
  }
});

test("mossgate: the estimate's link carries the clean to the booking page and back", () => {
  const c = normalise({ home: "apartment", bed: 2, bath: 1, sqft: 900, clean: "standard", freq: "weekly", extras: ["fridge", "pets"] });
  assert.deepEqual(fromQuery(`?${toQuery(c)}`), c);
  // the estimate form sent without JavaScript repeats the extras field
  assert.deepEqual(fromQuery("?clean=standard&bed=2&extras=fridge&extras=pets").extras, ["fridge", "pets"]);
  assert.equal(fromQuery(""), null, "no clean in the link: the booking page starts from its own default");
  assert.equal(fromQuery("?utm=x"), null);
  assert.equal(describe(DEFAULT), "Standard clean · 3 bed · 2 bath · every 2 weeks");
  assert.deepEqual([hoursLabel(1.5), hoursLabel(1), hoursLabel(3)], ["1½ hours", "1 hour", "3 hours"]);
});

test("mossgate: a long clean has to start in the morning and brings more cleaners", () => {
  const big = estimate(normalise({ home: "house", bed: 5, bath: 4, sqft: 5000, clean: "moveout" }));
  assert.equal(big.morningOnly, true);
  assert.equal(big.crew, 3);
  const small = estimate(normalise({ home: "apartment", bed: 1, bath: 1, sqft: 400, clean: "standard", freq: "once" }));
  // (60 + 20 + 25 + 12) x 0.95 = $111 of work at $50 an hour: one cleaner, 2 hours
  assert.deepEqual([small.crew, small.hours, small.morningOnly], [1, 2, false]);
});

test("mossgate: the demonstration calendar is fixed, skips Sundays and always leaves a choice", () => {
  const ids = WINDOWS.map((w) => w.id);
  assert.deepEqual(takenWindows(2), ids, "the third day is full");
  for (let n = 0; n < 10; n++) {
    const t = takenWindows(n);
    assert.deepEqual(t, takenWindows(n), "same answer every time");
    assert.ok(t.every((id) => ids.includes(id)));
    if (n !== 2) {
      assert.ok(t.length >= 1 && t.length <= 2, `day ${n} loses one or two windows`);
      assert.ok(WINDOWS.some((w) => w.morning && !t.includes(w.id)), `day ${n} keeps a morning window for a long clean`);
    }
  }
  // from a Saturday the next bookable day is Monday
  const days = bookingDays(new Date(2026, 10, 14, 15, 30));
  assert.equal(days.length, 10);
  assert.equal(days[0].getDay(), 1);
  assert.equal(days[0].getDate(), 16);
  assert.ok(days.every((d) => d.getDay() !== 0));
  assert.ok(days.every((d, i) => i === 0 || d > days[i - 1]));
});
