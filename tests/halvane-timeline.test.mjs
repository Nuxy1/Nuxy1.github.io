// The Halvane scroll timeline is a pure function of scroll position: these checks pin the properties the page
// relies on (states hold, blends are continuous, fast or reverse scroll lands on the same pose, portrait framing).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CABINET, EXPLODE, HINGE, extentX, extentY, fitLandscape, fitPortrait, locate, poseAt, poseOf, reach } from "../src/lib/halvane/timeline.ts";

const here = dirname(fileURLToPath(import.meta.url));
const cams = JSON.parse(readFileSync(join(here, "..", "src", "lib", "halvane", "cameras.json"), "utf8")).states;
const names = Object.keys(cams);
const states = names.map((n) => cams[n]);
const anchors = states.map((_, k) => 400 + k * 900);

test("every state in cameras.json has the fields the scene reads", () => {
  assert.ok(names.length >= 6, "the storyboard needs at least six states");
  for (const n of names) {
    const s = cams[n];
    assert.equal(typeof s.yaw, "number", n);
    assert.equal(s.pos.length, 3, n);
    assert.equal(s.target.length, 3, n);
    assert.ok(s.fov > 5 && s.fov < 40, `${n} fov`);
    assert.equal(s.shift.length, 2, n);
    assert.ok(s.portrait && s.portrait.fov > 5 && s.portrait.shift.length === 2, `${n} has a portrait framing`);
  }
});

test("each chapter holds its own state around its middle", () => {
  for (let k = 0; k < states.length; k++) {
    // segments are 900 px and the hold is 20%, so the state holds for 180 px either side of its chapter's middle
    for (const d of [-150, 0, 150]) {
      assert.deepEqual(poseAt(states, anchors, anchors[k] + d, false), poseOf(states[k], false), `${names[k]} holds at ${d}px`);
    }
  }
});

test("the blend is continuous and stays between its two states", () => {
  let prev = poseAt(states, anchors, anchors[0], false);
  for (let c = anchors[0]; c <= anchors[anchors.length - 1]; c += 5) {
    const p = poseAt(states, anchors, c, false);
    assert.ok(Math.abs(p.yaw - prev.yaw) < 4, `yaw jumps at ${c}`);
    assert.ok(Math.abs(p.fov - prev.fov) < 0.5, `fov jumps at ${c}`);
    prev = p;
  }
  const { i, t } = locate(anchors, (anchors[2] + anchors[3]) / 2);
  assert.equal(i, 2);
  assert.ok(Math.abs(t - 0.5) < 1e-9, "the middle of a segment is half way");
});

test("a fast or reverse scroll lands on the same pose as a slow one", () => {
  // the same position reached three ways: straight there, a slow walk back up from the end, a flick down from the top
  const at = anchors[4] + 333;
  const direct = poseAt(states, anchors, at, false);
  let back = null;
  for (let c = anchors[anchors.length - 1] + 503; c >= at; c -= 7) back = poseAt(states, anchors, c, false);
  poseAt(states, anchors, -1000, false);
  const flick = poseAt(states, anchors, at, false);
  assert.deepEqual(back, direct, "slow reverse scroll");
  assert.deepEqual(flick, direct, "fast scroll");
});

test("outside the chapters the pose clamps to the first and last states", () => {
  assert.deepEqual(poseAt(states, anchors, -5000, false), poseOf(states[0], false));
  assert.deepEqual(poseAt(states, anchors, 1e7, false), poseOf(states[states.length - 1], false));
});

test("a portrait canvas uses each state's portrait framing", () => {
  for (let k = 0; k < states.length; k++) {
    const p = poseAt(states, anchors, anchors[k], true);
    assert.equal(p.fov, states[k].portrait.fov);
    assert.deepEqual(p.shift, states[k].portrait.shift);
    assert.deepEqual(p.pos, states[k].pos, "portrait keeps the camera position");
  }
});

test("extentY projects the cabinet like the scene camera", () => {
  // straight on, camera level with the cabinet's middle: the front top edge is the highest point, the front bottom
  // edge the lowest, both 0.165 m off axis at 1.87 m, over a short side that spans 2 tan(5 deg) at unit distance
  const p = { yaw: 0, pos: [0, 0.169, 2], target: [0, 0.169, 0], fov: 10, shift: [0, 0], explode: {}, hatch: 0, lamp: 0 };
  const [lo, hi] = extentY(p);
  const want = 0.165 / 1.87 / (2 * Math.tan((5 * Math.PI) / 180));
  assert.ok(Math.abs(hi - want) < 1e-9, `top ${hi} vs ${want}`);
  assert.ok(Math.abs(lo + want) < 1e-9, `bottom ${lo} vs ${-want}`);
  // turning the speaker a quarter turn swaps width and depth but keeps the height
  const [lo90, hi90] = extentY({ ...p, yaw: 90 });
  assert.ok(Math.abs(hi90 - 0.165 / (2 - 0.105) / (2 * Math.tan((5 * Math.PI) / 180))) < 1e-9, "quarter turn");
  assert.ok(lo90 < 0 && hi90 > 0);
});

test("reach adds the pulled-out drivers and the open hatch to the cabinet", () => {
  const closed = reach({ explode: 0, hatch: 0 });
  assert.equal(closed.length, 8, "a closed speaker is its cabinet's corners");
  for (const [x, y, z] of closed) {
    assert.ok([CABINET.min[0], CABINET.max[0]].includes(x) && [CABINET.min[1], CABINET.max[1]].includes(y) && [CABINET.min[2], CABINET.max[2]].includes(z));
  }
  const front = (pts) => Math.max(...pts.map((p) => p[2]));
  assert.ok(Math.abs(front(reach({ explode: 1 })) - (0.1314 + EXPLODE.Woofer)) < 1e-9, "the woofer's trim leads at full explode");
  assert.ok(Math.abs(front(reach({ explode: 0.5 })) - (0.1314 + EXPLODE.Woofer / 2)) < 1e-9, "half way, half the distance");
  // a record pulls out only the drivers it names: the woofer alone adds its rings, the tweeter alone its own
  const woofer = reach({ explode: { Woofer: 1 } }).slice(8);
  const tweeter = reach({ explode: { Tweeter: 1 } }).slice(8);
  assert.equal(woofer.length, 4 * 16, "the woofer's four rings");
  assert.equal(tweeter.length, 3 * 16, "the tweeter's three rings");
  assert.ok(Math.abs(front(woofer) - (0.1314 + EXPLODE.Woofer)) < 1e-9);
  assert.ok(Math.abs(front(tweeter) - (0.131 + EXPLODE.Tweeter)) < 1e-9);
  assert.equal(reach({ explode: { Woofer: 0 } }).length, 8, "a zero share moves nothing");
  // the hatch turns about its hinge: every added point keeps its distance from the hinge line and its height
  const rest = reach({ hatch: 1e-9 }).slice(8);
  const open = reach({ hatch: 1 }).slice(8);
  assert.equal(open.length, 8);
  open.forEach((p, k) => {
    const d = (q) => Math.hypot(q[0] - HINGE[0], q[2] - HINGE[1]);
    assert.ok(Math.abs(d(p) - d(rest[k])) < 1e-9, "same distance from the hinge");
    assert.equal(p[1], rest[k][1], "same height");
  });
  // its free edge (0.12 m from the hinge) ends about 4 cm out past the cabinet's side at the full 125 degrees
  assert.ok(Math.max(...open.map((p) => p[0])) > CABINET.max[0] + 0.035, "the open hatch swings out past the cabinet's side");
});

test("fitLandscape keeps the speaker inside the band beside the caption, and only widens", () => {
  const TURN = Array.from({ length: 24 }, (_, k) => k * 15);
  for (const [W, H] of [[1024, 768], [1000, 900], [1280, 1024], [1440, 900], [1920, 1080]]) {
    const short = Math.min(W, H);
    const x = (s, v) => W / 2 + (v + s.shift[0]) * short;
    for (const n of names) {
      const s = cams[n];
      const turns = n === "showroom" ? TURN : [0];
      const cap = Math.min(480, 0.4 * W);
      const gut = Math.min(96, Math.max(20, 0.06 * W));
      const [left, right] = s.shift[0] >= 0 ? [gut + cap + 32, W - gut] : [gut, W - gut - cap - 32];
      const f = fitLandscape(s, W, H, left, right, turns);
      const [lo, hi] = extentX(poseOf(f, false), reach(f), turns);
      assert.ok(x(f, lo) >= left - 0.5 && x(f, hi) <= right + 0.5, `${n} at ${W}x${H}: ${x(f, lo)}..${x(f, hi)} in ${left}..${right}`);
      assert.ok(f.fov >= s.fov - 1e-9, `${n} never zooms in`);
      assert.deepEqual(f.pos, s.pos, "the camera stays put");
      assert.deepEqual(f.portrait, s.portrait, "the portrait framing is untouched");
      if (f !== s && f.fov > s.fov + 1e-9) assert.ok(Math.abs(x(f, hi) - x(f, lo) - (right - left)) < 0.5, `${n} widens only to fill the band`);
    }
  }
  // a state that already fits comes back as it is, and no band at all leaves it alone
  assert.equal(fitLandscape(cams.reveal, 1920, 1080, 0, 1920), cams.reveal);
  assert.equal(fitLandscape(cams.reveal, 1024, 768, 600, 600), cams.reveal);
  assert.equal(fitLandscape(cams.reveal, 1024, 768, 700, 600), cams.reveal);
});

test("fitPortrait keeps the speaker inside the band the captions leave, and only widens", () => {
  const [W, H] = [390, 844];
  const y = (s, v) => H / 2 - (v + poseOf(s, true).shift[1]) * Math.min(W, H);
  for (const n of names) {
    for (const [top, bottom] of [[76, 520], [300, 820], [76, 300]]) {
      const s = cams[n];
      const f = fitPortrait(s, W, H, top, bottom);
      const [lo, hi] = extentY(poseOf(f, true), reach(f));
      if (f === s) {
        assert.ok(y(s, hi) >= top && y(s, lo) <= bottom, `${n} was said to fit [${top}, ${bottom}]`);
        continue;
      }
      assert.ok(y(f, hi) >= top - 0.5 && y(f, lo) <= bottom + 0.5, `${n} fitted into [${top}, ${bottom}]`);
      assert.ok(f.portrait.fov >= s.portrait.fov - 1e-9, `${n} never zooms in`);
      assert.deepEqual(f.pos, s.pos, "the camera stays put");
      assert.equal(cams[n].portrait.fov, s.portrait.fov, "the source state is not changed");
    }
  }
  // a band the whole height of a tall canvas changes nothing
  assert.equal(fitPortrait(cams.reveal, 390, 4000, 0, 4000), cams.reveal);
});

test("explode, hatch and the rear lamp come only from the states that set them", () => {
  for (let k = 0; k < states.length; k++) {
    const p = poseOf(states[k], false);
    const e = states[k].explode ?? 0;
    for (const n of Object.keys(EXPLODE)) assert.equal(p.explode[n], typeof e === "number" ? e : (e[n] ?? 0), `${names[k]} ${n}`);
    assert.deepEqual(Object.keys(p.explode).sort(), Object.keys(EXPLODE).sort(), "every driver has a share");
    assert.equal(p.hatch, states[k].hatch ?? 0);
    assert.equal(p.lamp, states[k].lamp?.power ?? 0);
  }
});
