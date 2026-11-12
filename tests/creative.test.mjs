// The Creative Studio's prices, estimator arithmetic and address code (src/data/creative.ts, creative-estimate.ts),
// and the list of video files the site may show (src/data/cinematic-manifest.json).
// No browser and no build needed:   node --test tests/creative.test.mjs   (Node 23.6 or newer: it imports .ts directly)
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { check, quote, encode, decode, priceText, describe } from "../src/data/creative-estimate.ts";
import { rules, types, offers, demos, priceOf, estimatorNotes, limits, faqs, upsell, creativeWant } from "../src/data/creative.ts";
import { wants } from "../src/data/services.ts";
import { LOOPS, LIMITS } from "../scripts/cinematic-limits.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, "..");
const manifest = JSON.parse(readFileSync(join(site, "src/data/cinematic-manifest.json"), "utf8"));
const base = { type: "ad", videos: 1, duration: "15", formats: ["9x16", "16x9"], level: "standard", revisions: 2, extras: [] };
const q = (over = {}) => quote(check({ ...base, ...over }, rules), rules);

// A change to any number here is a price change for new customers: it needs the owner's written yes. These are the
// published prices and add-ons the owner approved on 2026-11-11 (business/creative-studio/RESULTS.md).
test("every creative price is the pinned one", () => {
  assert.deepEqual(Object.fromEntries(types.map((t) => [t.id, [t.base, t.monthly, t.count, t.formats, t.from]])), {
    ad: [249, false, 0, 2, false],
    "ad-growth": [799, true, 4, 2, false],
    "ad-business": [1499, true, 8, 2, false],
    motion: [350, false, 0, 1, true],
    showcase: [299, false, 0, 1, true],
  });
  assert.deepEqual(rules.durations.map((d) => [d.id, d.add]), [["15", 0], ["30", 120], ["60", 300]]);
  assert.deepEqual(rules.formats.map((f) => f.id), ["9x16", "16x9", "1x1", "4x5"]);
  assert.equal(rules.extraFormat, 40);
  assert.deepEqual(rules.levels.map((l) => [l.id, l.percent]), [["standard", 0], ["advanced", 30], ["unsure", null]]);
  assert.deepEqual(rules.revisions, { included: 2, max: 4, extra: 45 });
  assert.deepEqual(rules.extras.map((x) => [x.id, x.add]), [["captions", 25], ["voice", 60], ["stills", 30]]);
  assert.deepEqual([rules.maxVideos, rules.round], [8, 5]);
});

test("a card's price words come from the same list", () => {
  assert.deepEqual(types.map((t) => priceOf(t.id)), ["$249", "$799 a month", "$1,499 a month", "from $350", "from $299"]);
  const priced = offers.flatMap((o) => o.prices.map((p) => p.type));
  assert.deepEqual([...priced].sort(), types.map((t) => t.id).sort(), "every type is on exactly one card");
  assert.equal(offers.length, 3);
});

test("the included video costs its base price and nothing more", () => {
  for (const t of types) {
    const formats = rules.formats.slice(0, t.formats).map((f) => f.id);
    const r = q({ type: t.id, formats });
    assert.deepEqual([r.low, r.high, r.monthly, r.lines.length], [t.base, t.base, t.monthly, 1], t.id);
    assert.equal(r.videos, t.count || 1);
  }
});

test("add-ons are per video and add up line by line", () => {
  // 2 ads, 16-30 s, 3 formats (1 extra), advanced, 3 revision rounds, captions + voice
  const r = q({ videos: 2, duration: "30", formats: ["9x16", "16x9", "1x1"], level: "advanced", revisions: 3, extras: ["captions", "voice"] });
  // base 498 + length 240 + format 80 + revision 90 + captions 50 + voice 120 = 1078; uplift 30% of (498 + 240) = 221.4 -> 225
  assert.deepEqual(r.lines.map((l) => l.amount), [498, 240, 80, 90, 50, 120, 225]);
  assert.equal(r.low, 1303);
  assert.equal(r.high, 1303);
  assert.equal(r.lines.reduce((t, l) => t + l.amount, 0), r.low, "the lines are the total");
  assert.equal(priceText(r), "$1,303");
});

test("a package multiplies the add-ons by its videos, not its price", () => {
  const r = q({ type: "ad-growth", videos: 1, duration: "30", extras: ["captions"] });
  assert.equal(r.videos, 4, "the package's own count, whatever was sent");
  assert.deepEqual(r.lines.map((l) => l.amount), [799, 480, 100]);
  assert.equal(priceText(r), "$1,379 a month");
});

test("“not sure yet” gives a range from standard to advanced", () => {
  const r = q({ level: "unsure" });
  assert.deepEqual([r.low, r.high], [249, 249 + 75]); // 30% of 249 = 74.7 -> 75
  assert.equal(priceText(r), "$249–$324");
  assert.ok(!r.lines.some((l) => /complexity/i.test(l.label)), "no complexity line when it is a range");
  const std = q({ level: "standard" }), adv = q({ level: "advanced" });
  assert.deepEqual([r.low, r.high], [std.low, adv.low]);
});

test("the estimate never goes down when something is added", () => {
  // Every choice the page offers, for every type, then each single step up from it: a longer video, one more shape,
  // one more revision round, one more extra, one more video, standard to advanced. No step may lower either end.
  const ids = (list) => list.map((x) => x.id);
  const steps = (c) => {
    const next = [];
    const d = ids(rules.durations).indexOf(c.duration);
    if (d + 1 < rules.durations.length) next.push({ ...c, duration: rules.durations[d + 1].id });
    if (c.formats.length < rules.formats.length) next.push({ ...c, formats: ids(rules.formats).slice(0, c.formats.length + 1) });
    if (c.revisions < rules.revisions.max) next.push({ ...c, revisions: c.revisions + 1 });
    for (const x of ids(rules.extras)) if (!c.extras.includes(x)) next.push({ ...c, extras: [...c.extras, x] });
    if (c.videos < rules.maxVideos) next.push({ ...c, videos: c.videos + 1 });
    if (c.level === "standard") next.push({ ...c, level: "advanced" });
    return next;
  };
  let compared = 0;
  for (const type of ids(types))
    for (const duration of ids(rules.durations))
      for (const level of ["standard", "advanced"])
        for (const revisions of [rules.revisions.included, rules.revisions.max - 1])
          for (const n of [1, 2, 3])
            for (const extras of [[], ["captions"]])
              for (const videos of [1, 3]) {
                const from = { type, videos, duration, formats: ids(rules.formats).slice(0, n), level, revisions, extras };
                const a = q(from);
                assert.ok(Number.isInteger(a.low) && Number.isInteger(a.high) && a.high >= a.low, JSON.stringify(a));
                for (const to of steps(from)) {
                  const b = q(to);
                  assert.ok(b.low >= a.low && b.high >= a.high, `${JSON.stringify(from)} -> ${JSON.stringify(to)}: ${a.low}-${a.high} became ${b.low}-${b.high}`);
                  compared++;
                }
              }
  assert.ok(compared > 1000, `${compared} steps compared`);
  // "Not sure yet" spans standard to advanced, so it is never under standard nor over advanced.
  const unsure = q({ level: "unsure" });
  assert.ok(unsure.low === q({ level: "standard" }).low && unsure.high === q({ level: "advanced" }).high);
});

test("anything the page does not offer is refused whole", () => {
  const bad = [
    { type: "free" }, { type: "__proto__" }, { type: "constructor" },
    { videos: 0 }, { videos: 9 }, { videos: 1.5 }, { videos: "2" }, { videos: -1 }, { videos: NaN },
    { duration: "90" }, { duration: 15 },
    { formats: [] }, { formats: ["9x16", "9x16"] }, { formats: ["21x9"] }, { formats: "9x16" },
    { level: "expert" }, { revisions: 1 }, { revisions: 5 }, { revisions: 2.5 },
    { extras: ["free-work"] }, { extras: ["voice", "voice"] }, { extras: null },
  ];
  for (const over of bad) assert.equal(check({ ...base, ...over }, rules), null, JSON.stringify(over));
  assert.equal(check(null, rules), null);
  assert.equal(check({}, rules), null);
});

test("the address code round-trips, in the rules' own order", () => {
  const c = check({ ...base, videos: 2, duration: "30", formats: ["16x9", "9x16"], level: "advanced", revisions: 3, extras: ["voice", "captions"] }, rules);
  assert.equal(encode(c), "ad~2~30~9x16.16x9~advanced~3~captions.voice");
  assert.deepEqual(decode(encode(c), rules), c);
  assert.equal(encode(check(base, rules)), "ad~1~15~9x16.16x9~standard~2~");
  assert.deepEqual(decode("ad~1~15~9x16.16x9~standard~2~", rules), check(base, rules));
});

test("a made-up or tampered address code is ignored", () => {
  const bad = [
    null, undefined, "", "ad", "ad~1~15~9x16~standard~2", "ad~1~15~9x16~standard~2~~", "ad~1~15~9x16~standard~2~captions~x",
    "AD~1~15~9x16~standard~2~", "ad~1~15~9x16~standard~2~<script>", "ad~1~15~9x16~standard~2~captions voice", "ad~01e1~15~9x16~standard~2~",
    "ad~99~15~9x16~standard~2~", "ad~1~15~~standard~2~", "ad~1~15~9x16~standard~22~", "ad~1~15~9x16~standard~-2~", "ad~1~15~9x16.~standard~2~",
    "free~1~15~9x16~standard~2~", "ad~1~15~9x16~standard~2~price-0", "ad~1~15~9x16~standard~2~" + "a".repeat(200), "ad~1~15~9x16~standard~2~captions.captions",
    "ad~1~15~9x16~standard~2~%0a", "ad~1~15~9x16~standard~2~javascript:alert-1",
  ];
  for (const code of bad) assert.equal(decode(code, rules), null, String(code).slice(0, 60));
  // (a price in the address changes nothing: there is nowhere to put one)
  assert.equal(decode("ad~1~15~9x16~standard~2~~0", rules), null);
});

test("the sentence for the quote form names every choice, and nothing else", () => {
  const c = check({ ...base, videos: 2, duration: "30", level: "advanced", revisions: 3, extras: ["captions", "voice"] }, rules);
  assert.equal(describe(c, rules), "Video advertisement × 2; 16 to 30 seconds each; formats: Vertical 9:16 and Widescreen 16:9; complexity: advanced; 3 revision rounds; extras: captions on screen and AI voice-over");
  assert.equal(describe(check({ ...base, type: "showcase", formats: ["1x1"] }, rules), rules), "Product showcase; up to 15 seconds; format: Square 1:1; complexity: standard; 2 revision rounds");
  for (const t of types) assert.doesNotMatch(describe(check({ ...base, type: t.id }, rules), rules), /[<>"&]/, t.id);
});

test("every demo's “Request Similar Project” code is a real choice for its own category", () => {
  assert.equal(demos.length, 3);
  for (const d of demos) {
    const c = decode(d.request, rules);
    assert.ok(c, d.id);
    const offer = offers.find((o) => o.id === d.offer);
    assert.ok(offer.prices.some((p) => p.type === c.type), `${d.id}: ${c.type} is priced on ${d.offer}`);
    assert.match(d.id, /^[a-z0-9-]+$/);
  }
});

test("the words keep the brief's promises", () => {
  const all = JSON.stringify({ offers, limits, faqs, estimatorNotes, upsell, demos });
  assert.doesNotMatch(all, /guarantee|go viral|double your|increase(s|d)? (your )?sales|proven results|\bROI\b/i, "no promise of results");
  assert.doesNotMatch(all, /clinically|dermatologist|anti-?aging|reduces wrinkles|cures?\b/i, "no skincare claims");
  assert.match(JSON.stringify(limits), /can’t promise views, sales/);
  assert.match(JSON.stringify(faqs), /Scenes are generated with AI video tools/, "says the videos are AI-made");
  assert.match(estimatorNotes.join(" "), /starting price, not a quote/);
  assert.ok(wants.some((w) => w.id === creativeWant), "the quote form has the creative choice");
});

// ---- The built pages (dist/, from `npx astro build`). The same promises, checked on what a visitor is really sent. ----
const dist = join(site, "dist");
const noBuild = !existsSync(join(dist, "creative-studio", "index.html")) && "no build in dist/: run npx astro build first";
const built = (path) => readFileSync(join(dist, path, "index.html"), "utf8");
const words = (html) => html.replace(/<(script|style|template)[\s\S]*?<\/\1>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
const section = (html, id) => {
  const at = html.indexOf(`id="${id}"`);
  assert.ok(at > 0, `#${id} is on the page`);
  const from = html.lastIndexOf("<section", at), to = html.indexOf("</section>", at);
  return words(html.slice(from, to));
};
const PROMISE = /guarantee|go(es)? viral|double your|increase(s|d)? (your )?sales|proven results|\bROI\b|best in|number one|#1\b/i;
const PROOF = /our clients|client work|case stud|testimonial|trusted by|award|as seen|five[- ]star|\d+\+? (happy )?(clients|customers|brands)/i;
const OTHER_PAGES = ["", "websites", "automation", "solutions"];

test("the built Creative Studio page says the videos are AI-made, promises no result and claims no client work", { skip: noBuild }, () => {
  const html = built("creative-studio"), text = words(html);
  assert.match(text, /made with AI video tools and finished by a person/);
  assert.match(text, /can’t promise views, sales/);
  assert.match(text, /starting price, not a quote/);
  assert.doesNotMatch(text, PROMISE, "no promise of results");
  assert.doesNotMatch(text, PROOF, "no proof that does not exist");
  assert.doesNotMatch(text, /clinically|dermatologist|anti-?aging|reduces wrinkles/i, "no skincare claims");
  // (every kind of video is on the page with its own starting price, and the page never calls a video service)
  for (const t of types) assert.ok(text.includes(priceOf(t.id)), `${t.id} ${priceOf(t.id)}`);
  const hosts = [...new Set([...html.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1].toLowerCase()))];
  assert.deepEqual(hosts.filter((h) => !/(^|\.)(nuxyautomation\.com|schema\.org|w3\.org|github\.com)$/.test(h)), [],
    "the only addresses in the page are Nuxy's own, its GitHub link in the footer and the schema names, so no video service can be called from it");
  assert.doesNotMatch(html, /Bearer\s+[A-Za-z0-9]|(^|[^a-z-])sk-[A-Za-z0-9_-]{20,}|api[_-]?key/i, "no key in the page");
});

test("the demo gallery, its players and every link to it are in the build only when all three demo videos exist", { skip: noBuild }, () => {
  const ready = demos.every((d) => manifest.demos[d.id]);
  const page = built("creative-studio");
  assert.equal(page.includes("data-demo-player"), ready, "the player");
  assert.equal(/id="portfolio"/.test(page), ready, "the gallery section");
  assert.equal(/fictional concept demonstration/i.test(words(page)), ready, "the label goes with the demos");
  if (ready) for (const path of ["websites", "automation"]) assert.ok(built(path).includes("/creative-studio/#portfolio"), `${path} links to the gallery`);
  else for (const path of ["creative-studio", ...OTHER_PAGES]) {
    assert.ok(!built(path).includes("/creative-studio/#portfolio"), `${path || "home"} links to a gallery that is not there`);
    assert.doesNotMatch(words(built(path)), /see (the|our) video portfolio|watch (the|our) (demo )?videos/i, path || "home");
  }
});

test("the video add-on on other pages names the AI tools, prints no price and promises nothing", { skip: noBuild }, () => {
  for (const path of ["websites", "automation"]) {
    const text = section(built(path), "video-upsell-h");
    assert.match(text, /made with AI video tools and finished by a person/, path);
    assert.doesNotMatch(text, /\$\s?\d/, `${path}: a creative price belongs on the Creative Studio page only`);
    assert.doesNotMatch(text, PROMISE, path);
    assert.doesNotMatch(text, PROOF, path);
  }
  const block = built("solutions");
  const at = block.indexOf('id="video-creative"');
  assert.ok(at > 0, "/solutions/ has the video block");
  const text = words(block.slice(at, block.indexOf("</div>", at)));
  assert.match(text, /made with AI video tools and finished by a person/);
  assert.doesNotMatch(text, /\$\s?\d/);
  assert.doesNotMatch(text, PROMISE);
  for (const path of OTHER_PAGES) assert.ok(built(path).includes('href="/creative-studio/'), `${path || "home"} links to the Creative Studio page`);
});

test("every counted button in the build has a name the counting service accepts, and the new ones are written down", { skip: noBuild }, () => {
  // (inquiry.js count(): /^[a-z0-9_]{1,32}$/ or the click is dropped without an error)
  const pages = readdirSync(dist, { recursive: true }).map(String).filter((f) => f.endsWith(".html"));
  const names = new Set();
  for (const f of pages) for (const m of readFileSync(join(dist, f), "utf8").matchAll(/data-track="([^"]*)"/g)) {
    assert.match(m[1], /^[a-z0-9_]{1,32}$/, `${f}: data-track="${m[1]}"`);
    names.add(m[1]);
  }
  const design = readFileSync(join(site, "DESIGN.md"), "utf8");
  const ours = [...names].filter((n) => /creative|video/.test(n));
  assert.ok(ours.length >= 9, `the creative buttons are counted: ${ours.join(", ")}`);
  for (const n of ours) assert.ok(design.includes("`" + n + "`"), `${n} is listed in DESIGN.md`);
});

// ---- The video files. An entry here is a claim that a real, checked file is in public/: a missing or resized
// file fails, and the three demos appear together or not at all (no half-built portfolio). ----
const files = (entry) => [entry.poster, entry.posterMobile, entry.captions, ...(entry.sources ?? []), ...(entry.mobile ?? []), ...(entry.vertical ? files(entry.vertical) : [])].filter(Boolean);
test("every video file the site lists exists and is the size the list says", () => {
  assert.deepEqual(Object.keys(manifest).sort(), ["demos", "loops"]);
  for (const [group, entries] of Object.entries(manifest))
    for (const [id, entry] of Object.entries(entries)) {
      const label = `${group}.${id}`;
      assert.match(id, /^[a-z0-9-]+$/, label);
      assert.ok(entry.poster?.src && entry.sources?.length, `${label} has a poster and a source`);
      assert.ok(entry.width > 0 && entry.height > 0 && entry.duration > 0, `${label} has its size and length`);
      for (const f of files(entry)) {
        assert.match(f.src, /^\/media\/[a-z0-9-]+\.(mp4|webm|webp|jpg|vtt)$/, `${label}: ${f.src}`);
        const path = join(site, "public", f.src);
        assert.ok(existsSync(path), `${label}: ${f.src} is in public/`);
        assert.equal(statSync(path).size, f.bytes, `${label}: ${f.src} is the encoded file`);
      }
      assert.ok(entry.sources.some((s) => s.type === "video/mp4"), `${label} has an MP4 every browser plays`);
    }
});

test("the demo gallery is all three demos or none", () => {
  const have = demos.filter((d) => manifest.demos[d.id]).map((d) => d.id);
  assert.ok(have.length === 0 || have.length === demos.length, `only ${have.join(", ")} listed`);
  for (const id of Object.keys(manifest.demos)) assert.ok(demos.some((d) => d.id === id), `${id} is a known demo`);
  for (const id of Object.keys(manifest.loops)) assert.ok(LOOPS.includes(id), `${id} is a known loop`);
});

// The limits are the encoder's own (scripts/cinematic-limits.mjs), so a file it would refuse can't be listed by hand.
test("background loops stay small and silent enough to be decoration", () => {
  for (const [id, entry] of Object.entries(manifest.loops)) {
    for (const s of entry.sources) assert.ok(s.bytes <= LIMITS.loop, `${id}: ${s.src} is ${s.bytes} bytes (limit ${LIMITS.loop})`);
    for (const s of entry.mobile ?? []) assert.ok(s.bytes <= LIMITS.loopMobile, `${id}: ${s.src} is ${s.bytes} bytes (limit ${LIMITS.loopMobile})`);
    assert.ok(entry.duration <= 10, `${id} is a short loop`);
    assert.equal(entry.audio, false, `${id} has no sound track`);
  }
});

test("demo videos and every poster stay under the encoder's limits", () => {
  const cuts = (entry) => [entry, entry.vertical].filter(Boolean);
  for (const [id, entry] of Object.entries(manifest.demos))
    for (const cut of cuts(entry)) {
      for (const s of cut.sources) assert.ok(s.bytes <= LIMITS.demo, `${id}: ${s.src} is ${s.bytes} bytes (limit ${LIMITS.demo})`);
      assert.ok(cut.poster.bytes <= LIMITS.poster, `${id}: ${cut.poster.src} is ${cut.poster.bytes} bytes (limit ${LIMITS.poster})`);
    }
  for (const [id, entry] of Object.entries(manifest.loops))
    for (const poster of [entry.poster, entry.posterMobile].filter(Boolean))
      assert.ok(poster.bytes <= LIMITS.poster, `${id}: ${poster.src} is ${poster.bytes} bytes (limit ${LIMITS.poster})`);
});
