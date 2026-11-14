// The Creative Studio page in a real browser: the price estimator and its hand-over to the quote form, the background
// loop and the video player.
//
//   npm run build                                   (dist/: what is published)
//   node scripts/cinematic-fixture.mjs              (test-pattern clips, needs ffmpeg; they are not footage)
//   CINEMATIC_FIXTURE=tests/fixtures/cinematic/manifest.json npx astro build      (dist-fixture/: never published)
//   PLAYWRIGHT_CORE=<path to a playwright-core folder> BROWSER=<path to chrome.exe or msedge.exe> node --test tests/cinematic.test.mjs
//
// The loop and player tests need video files, so they run against dist-fixture/ and are skipped (and say so) when that
// build is not there. Everything else runs against dist/. Nothing leaves this computer and no form is sent.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serveDist } from "./serve-dist.mjs";
import { check, quote, encode, priceText } from "../src/data/creative-estimate.ts";
import { rules, types, demos, demoLabel, creativeWant, quoteParam } from "../src/data/creative.ts";
import { caseStudies } from "../src/data/case-studies.ts";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "..", "dist");
const fixture = join(here, "..", "dist-fixture");
const manifest = JSON.parse(readFileSync(join(here, "..", "src/data/cinematic-manifest.json"), "utf8"));
const fixtureManifest = join(here, "fixtures", "cinematic", "manifest.json");
const hasFixture = existsSync(join(fixture, "creative-studio", "index.html")) && existsSync(fixtureManifest);
const noFixture = hasFixture ? false : "dist-fixture/ is not built (see the header of this file)";
// ENGINE=firefox or ENGINE=webkit runs the same suite in that engine; BROWSER must then name its program.
const playwright = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE || "playwright-core");
const engine = playwright[process.env.ENGINE || "chromium"];
const PAGE = "/creative-studio/";
const MEDIA = /\/media\/[^?]+\.(mp4|webm)$/;

let browser, web, fix;
before(async () => {
  assert.ok(existsSync(join(dist, "creative-studio", "index.html")), "run npm run build first");
  web = await serveDist(dist);
  if (hasFixture) fix = await serveDist(fixture);
  assert.ok(engine, `ENGINE=${process.env.ENGINE} is not a browser engine`);
  assert.ok(!process.env.ENGINE || process.env.ENGINE === "chromium" || process.env.BROWSER, "set BROWSER to the engine's program");
  browser = await engine.launch({ executablePath: process.env.BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
});
after(async () => {
  await browser?.close();
  web?.close();
  fix?.close();
});

// motion: "standard" is a visitor whose device allows motion and who chose Standard in the footer (the site's own
// frame check can otherwise drop a busy test machine to the light level); "reduced" is the device setting.
async function open(server, path, { width = 1280, height = 900, motion = "standard", js = true, init } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, javaScriptEnabled: js, reducedMotion: motion === "reduced" ? "reduce" : "no-preference" });
  if (motion === "standard") await context.addInitScript(() => { try { localStorage.setItem("nuxy-motion", "standard"); } catch {} });
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const media = [], errors = [];
  page.on("request", (r) => { const p = new URL(r.url()).pathname; if (MEDIA.test(p)) media.push(p); });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(server.url + path);
  return { page, context, media, errors };
}
// (the site scrolls smoothly: jump the target into view first, as tests/contact-form.test.mjs explains)
const show = (page, selector) => page.locator(selector).first().evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
const click = async (page, selector) => { await show(page, selector); await page.click(selector); };
const pick = (page, name, value) => click(page, `label:has(input[name="${name}"][value="${value}"])`);
const until = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: 8000 });
const total = (page) => page.textContent("[data-total]");
const code = (page) => page.inputValue("[data-code]");
const priceOfChoice = (choice) => priceText(quote(check(choice, rules), rules));
const first = types[0];
const start = { type: first.id, videos: 1, duration: rules.durations[0].id, formats: rules.formats.slice(0, first.formats).map((f) => f.id), level: rules.levels[0].id, revisions: rules.revisions.included, extras: [] };

// ---------------------------------------------------------------------------------------------------------------
// What is published
// ---------------------------------------------------------------------------------------------------------------

test("the published build holds exactly the video files the manifest lists, each at its recorded size", () => {
  const listed = [];
  const add = (f) => f && listed.push(f);
  for (const item of [...Object.values(manifest.loops), ...Object.values(manifest.demos)]) {
    for (const cut of [item, item.vertical].filter(Boolean)) { add(cut.poster); add(cut.posterMobile); (cut.sources ?? []).forEach(add); (cut.mobile ?? []).forEach(add); }
    add(item.captions);
  }
  for (const f of listed) {
    const file = join(dist, f.src);
    assert.ok(existsSync(file), `${f.src} is in dist/`);
    assert.equal(statSync(file).size, f.bytes, `${f.src} is the checked file`);
  }
  const media = join(dist, "media");
  // a published client project keeps its pictures in a folder of its own (/media/<client>/, checked by stage.test.mjs)
  const clientDirs = new Set(caseStudies.flatMap((c) => [...(c.shots ?? []).map((s) => s.src), c.video?.src].filter(Boolean)).map((s) => s.split("/").slice(0, 3).join("/")));
  const there = existsSync(media) ? readdirSync(media).map((n) => `/media/${n}`).filter((p) => !clientDirs.has(p)).sort() : [];
  assert.deepEqual(there, [...new Set(listed.map((f) => f.src))].sort(), "nothing else is in dist/media");
  // No demo is claimed until all three have real files: the portfolio and its player are then not on the page at all.
  const html = readFileSync(join(dist, "creative-studio", "index.html"), "utf8");
  const ready = demos.every((d) => manifest.demos[d.id]);
  assert.equal(html.includes("data-demo-player"), ready);
  assert.equal(/<video[\s>]/.test(html), ready || "creative-studio" in manifest.loops);
  if (!ready) for (const d of demos) assert.ok(!html.includes(d.title), `${d.title} is not named before its video exists`);
});

test("the page loads clean at every width and never scrolls sideways", async () => {
  for (const [width, height] of [[360, 740], [390, 800], [768, 1024], [1280, 900], [1920, 1080]]) {
    const { page, context, errors, media } = await open(web, PAGE, { width, height });
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 20)); } });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, `${width}px`);
    assert.deepEqual(errors, [], `${width}px`);
    if (!Object.keys(manifest.loops).length && !Object.keys(manifest.demos).length) assert.deepEqual(media, [], "no video file is asked for");
    await context.close();
  }
});

// ---------------------------------------------------------------------------------------------------------------
// The estimator
// ---------------------------------------------------------------------------------------------------------------

test("the estimator's figure is the published arithmetic for the choices on screen, and the code names those choices", async () => {
  const { page, context, errors } = await open(web, PAGE);
  assert.equal(await total(page), priceOfChoice(start));
  assert.equal(await code(page), encode(check(start, rules)));

  const d = rules.durations[1].id, level = "advanced", x = rules.extras.map((e) => e.id);
  await pick(page, "ce-duration", d);
  await pick(page, "ce-level", level);
  for (const id of x) await pick(page, "ce-extra", id);
  await page.selectOption("#ce-videos", "3");
  await page.selectOption("#ce-rounds", String(rules.revisions.included + 1));
  const extra = rules.formats[first.formats].id;
  await pick(page, "ce-format", extra);
  const choice = { ...start, videos: 3, duration: d, level, revisions: rules.revisions.included + 1, extras: x, formats: [...start.formats, extra] };
  assert.equal(await total(page), priceOfChoice(choice));
  assert.equal(await code(page), encode(check(choice, rules)));
  // every line of the breakdown adds up to the figure
  const lines = await page.$$eval("[data-lines] li span:last-child", (els) => els.map((el) => Number(el.textContent.replace(/[^0-9-]/g, ""))));
  assert.equal(lines.reduce((a, b) => a + b, 0), quote(check(choice, rules), rules).low);
  // the change is announced to a screen reader, in words
  assert.match(await page.textContent("[data-status]"), /^Estimated starting price \$[\d,]+/);
  assert.deepEqual(errors, []);
  await context.close();
});

test("a monthly package fixes the number of videos, and 'not sure yet' shows the range between standard and advanced", async () => {
  const { page, context } = await open(web, PAGE);
  await page.selectOption("#ce-videos", "3");
  for (const t of types.filter((t) => t.count)) {
    await pick(page, "ce-type", t.id);
    assert.equal(await page.isDisabled("#ce-videos"), true);
    assert.equal(await page.inputValue("#ce-videos"), String(t.count));
    assert.match(await page.textContent("[data-videos-help]"), new RegExp(`${t.count} videos each month`));
    const formats = rules.formats.slice(0, t.formats).map((f) => f.id);
    assert.equal(await total(page), priceOfChoice({ ...start, type: t.id, videos: t.count, formats }));
    assert.match(await total(page), / a month$/);
  }
  // back to a single kind of video: the count is the visitor's own again, not the package's
  await pick(page, "ce-type", first.id);
  assert.equal(await page.isDisabled("#ce-videos"), false);
  assert.equal(await page.inputValue("#ce-videos"), "3");
  assert.equal(await total(page), priceOfChoice({ ...start, videos: 3 }));
  assert.equal(await page.isVisible("[data-range]"), false);
  await pick(page, "ce-level", "unsure");
  const q = quote(check({ ...start, videos: 3, level: "unsure" }, rules), rules);
  assert.ok(q.high > q.low);
  assert.equal(await total(page), priceText(q));
  assert.equal(await page.isVisible("[data-range]"), true);
  await context.close();
});

test("with no shape chosen there is no figure and no code, and the form still leads to the quote form", async () => {
  const { page, context } = await open(web, PAGE);
  for (const f of start.formats) await pick(page, "ce-format", f);
  assert.equal(await total(page), "—");
  assert.equal(await code(page), "");
  assert.equal(await page.isVisible("[data-formats-error]"), true);
  await click(page, ".ce-sum button[type=submit]");
  await page.waitForURL("**/contact/**");
  assert.equal(new URL(page.url()).search, `?want=${creativeWant}`);
  assert.equal(await page.isChecked(`[name=want][value="${creativeWant}"]`), true);
  assert.equal(await page.isHidden("[data-about]"), true);
  await context.close();
});

test("on a phone the price rides at the bottom while the choices are in view, and steps aside for the summary", async () => {
  for (const [width, height] of [[360, 740], [390, 800]]) {
    const { page, context } = await open(web, PAGE, { width, height });
    await show(page, 'input[name="ce-type"]');
    await until(page, () => { const b = document.querySelector("[data-bar]"); return !b.hidden && !b.classList.contains("away"); });
    await pick(page, "ce-type", types.find((t) => t.count).id);
    assert.equal(await page.textContent("[data-bar-total]"), await total(page));
    // (it repeats the figure for the eye only: a screen reader gets the announcement instead)
    assert.equal(await page.getAttribute("[data-bar]", "aria-hidden"), "true");
    const box = await page.locator("[data-bar] p").boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= width && box.y + box.height <= height, `${width}px: the bar is inside the screen`);
    await show(page, "[data-total]");
    await until(page, () => document.querySelector("[data-bar]").classList.contains("away"));
    await context.close();
  }
  // on a wide screen the summary is always beside the choices, so the bar is never shown
  const { page, context } = await open(web, PAGE, { width: 1280, height: 900 });
  assert.equal(await page.$eval("[data-bar]", (el) => getComputedStyle(el).display), "none");
  await context.close();
});

test("without JavaScript the page reads in full, no code travels, and the figure says it cannot follow the choices", async () => {
  const { page, context } = await open(web, PAGE, { js: false });
  assert.equal(await total(page), priceOfChoice(start));
  assert.equal(await code(page), "");
  assert.equal(await page.isHidden("[data-bar]"), true);
  assert.match(await page.textContent("[data-creative-estimator]"), /Turn on JavaScript to see this figure change/);
  for (const t of types) assert.ok((await page.textContent("main")).includes(t.label), t.label);
  await context.close();
});

// ---------------------------------------------------------------------------------------------------------------
// From the estimator to the quote form
// ---------------------------------------------------------------------------------------------------------------

test("Get My Custom Quote carries the choices to the quote form, which works the price out again", async () => {
  const { page, context, errors } = await open(web, PAGE);
  await page.selectOption("#ce-videos", "2");
  await pick(page, "ce-duration", rules.durations[1].id);
  await pick(page, "ce-extra", rules.extras[0].id);
  const choice = { ...start, videos: 2, duration: rules.durations[1].id, extras: [rules.extras[0].id] };
  const price = priceOfChoice(choice);
  await click(page, ".ce-sum button[type=submit]");
  await page.waitForURL("**/contact/**");
  const url = new URL(page.url());
  assert.deepEqual([...url.searchParams.keys()], ["want", quoteParam], "only the answer to pick and the code are in the address");
  assert.equal(url.searchParams.get(quoteParam), encode(check(choice, rules)));
  await until(page, () => !document.querySelector("[data-about]").hidden);
  assert.ok((await page.textContent("[data-about-name]")).includes(`estimated starting price ${price}`));
  const need = await page.inputValue("#f-need");
  assert.ok(need.includes(`Estimator’s starting price: ${price} (an estimate, not a quote).`), need);
  assert.ok(need.includes(first.label));
  assert.equal(await page.isChecked(`[name=want][value="${creativeWant}"]`), true);
  // (a creative request is not a catalogue service: no service id is sent with it)
  assert.equal(await page.inputValue('input[name="service"]'), "");
  // "Not this one" takes the line back out, and the answer stays chosen
  await click(page, "[data-about-clear]");
  assert.equal(await page.isHidden("[data-about]"), true);
  assert.equal(await page.inputValue("#f-need"), "");
  assert.equal(await page.isChecked(`[name=want][value="${creativeWant}"]`), true);
  // (the address forgets the code too: loading the page again does not bring the choices back)
  assert.deepEqual([...new URL(page.url()).searchParams.keys()], ["want"]);
  await page.reload();
  assert.equal(await page.isHidden("[data-about]"), true);
  assert.equal(await page.inputValue("#f-need"), "");
  assert.equal(await page.isChecked(`[name=want][value="${creativeWant}"]`), true);
  assert.deepEqual(errors, []);
  await context.close();
});

test("the quote form asks for the estimator's sums only when the address carries a code", async () => {
  // (a second file loaded by the form's own costs every visitor about 150 ms of largest-paint time in Lighthouse)
  const files = (page) => page.evaluate(() => performance.getEntriesByType("resource").map((e) => new URL(e.name).pathname).filter((p) => p.endsWith(".js")));
  for (const path of ["/contact/", `/contact/?want=${creativeWant}`, "/contact/?service=booking"]) {
    const { page, context, errors } = await open(web, path);
    await page.waitForLoadState("networkidle");
    const js = await files(page);
    assert.equal(js.length, 1, `${path}: ${js.join(", ")}`);
    assert.equal(await page.getAttribute("[data-inquiry]", "data-estimate"), null, path);
    assert.deepEqual(errors, [], path);
    await context.close();
  }
  // with a code and no answer named, the sums are fetched and the video answer is picked
  const good = encode(check(start, rules));
  const { page, context, errors } = await open(web, `/contact/?${quoteParam}=${good}`);
  await until(page, () => document.querySelector("[data-inquiry]").dataset.estimate === "shown");
  assert.equal((await files(page)).length, 2);
  assert.equal(await page.isChecked(`[name=want][value="${creativeWant}"]`), true);
  assert.equal(await page.isHidden("[data-about]"), false);
  assert.deepEqual(errors, []);
  await context.close();
  // a catalogue service in the same address wins, and the code is not read at all
  const both = await open(web, `/contact/?service=booking&${quoteParam}=${good}`);
  await both.page.waitForLoadState("networkidle");
  assert.equal((await files(both.page)).length, 1);
  assert.equal(await both.page.inputValue("[name=service]"), "booking");
  assert.ok(!(await both.page.inputValue("#f-need")).includes("Estimator"));
  await both.context.close();
});

test("a changed or made-up code in the address never puts a price or any of its text on the quote form", async () => {
  const good = encode(check(start, rules));
  const bad = [
    good.replace(/^[^~]+/, "free"),                    // a kind of video that does not exist
    good.replace(/~1~/, "~999~"),                      // more videos than the estimator offers
    good.replace(/~1~/, "~0~"),
    good.replace(/~[^~]*$/, "~gold"),                  // an extra that does not exist
    good + "~1",                                       // too many parts
    "ad~1~15~9x16~standard~2~<img src=x onerror=alert(1)>",
    "%3Cscript%3Ealert(1)%3C/script%3E",
    "ad~1~15~9x16.9x16~standard~2~",                   // the same shape twice
    "a".repeat(5000),
    "",
  ];
  for (const c of bad) {
    const { page, context, errors } = await open(web, `/contact/?want=${creativeWant}&${quoteParam}=${encodeURIComponent(c)}`);
    await page.waitForLoadState("load");
    // (the sums load on demand: wait until the form has read the code, then see that it refused it)
    if (c) await until(page, () => document.querySelector("[data-inquiry]").dataset.estimate);
    assert.equal(await page.getAttribute("[data-inquiry]", "data-estimate"), c ? "refused" : null, c.slice(0, 40));
    assert.equal(await page.isHidden("[data-about]"), true, c.slice(0, 40));
    assert.equal(await page.inputValue("#f-need"), "", c.slice(0, 40));
    assert.equal(await page.$("img[src='x']"), null);
    assert.equal(await page.isChecked(`[name=want][value="${creativeWant}"]`), true);
    assert.deepEqual(errors, [], c.slice(0, 40));
    await context.close();
  }
  // and what the visitor already typed is never replaced or taken out
  const { page, context } = await open(web, `/contact/?want=${creativeWant}&${quoteParam}=${good}`);
  await until(page, () => !document.querySelector("[data-about]").hidden);
  await page.fill("#f-need", "We sell bikes and want a spring ad.");
  await click(page, "[data-about-clear]");
  assert.equal(await page.inputValue("#f-need"), "We sell bikes and want a spring ad.");
  await context.close();
});

// ---------------------------------------------------------------------------------------------------------------
// The background loop (test-pattern build)
// ---------------------------------------------------------------------------------------------------------------

const loop = "[data-cine]";
const loopState = (page) => page.$eval(`${loop} video`, (v) => ({ sources: v.childElementCount, paused: v.paused, muted: v.muted, loops: v.loop, controls: v.controls, on: v.parentElement.classList.contains("on"), hidden: v.closest("[aria-hidden=true]") !== null, tab: v.tabIndex }));
const playing = (page) => until(page, () => { const v = document.querySelector("[data-cine] video"); return !v.paused && v.currentTime > 0 && v.parentElement.classList.contains("on"); });
// (the loop starts only after the page has loaded and the browser is idle, 2.5 s at the latest: wait past that)
const settle = (page) => page.waitForTimeout(3400);
const weak = () => Object.defineProperty(Navigator.prototype, "hardwareConcurrency", { get: () => 2 });
const saver = () => Object.defineProperty(Navigator.prototype, "connection", { get: () => ({ saveData: true }) });

test("no video file is asked for on the reduced or light motion level, or on a data saver", { skip: noFixture }, async () => {
  const cases = {
    "device asks for reduced motion": { motion: "reduced" },
    "a device short on power (light level)": { motion: "auto", init: weak },
    "data saver, even after choosing Standard": { motion: "standard", init: saver },
  };
  for (const [name, options] of Object.entries(cases)) {
    const { page, context, media, errors } = await open(fix, PAGE, options);
    await settle(page);
    assert.deepEqual(media, [], name);
    const s = await loopState(page);
    assert.deepEqual([s.sources, s.paused, s.on], [0, true, false], name);
    // the still picture is there instead
    assert.ok(await page.$eval(`${loop} img`, (img) => img.complete && img.naturalWidth > 0), name);
    assert.deepEqual(errors, [], name);
    await context.close();
  }
  const { page, context } = await open(fix, PAGE, { motion: "auto", init: weak });
  assert.equal(await page.getAttribute("html", "data-motion"), "light");
  await context.close();
});

test("on the standard level the loop plays silently as decoration: one small file, the phone cut on a phone", { skip: noFixture }, async () => {
  const fx = JSON.parse(readFileSync(fixtureManifest, "utf8")).loops["creative-studio"];
  for (const [width, height, want] of [[1280, 900, fx.sources], [390, 800, fx.mobile ?? fx.sources]]) {
    const { page, context, media, errors } = await open(fix, PAGE, { width, height });
    await playing(page);
    assert.deepEqual([...new Set(media)], [want[0].src], `${width}px`);
    const s = await loopState(page);
    assert.deepEqual(s, { sources: want.length, paused: false, muted: true, loops: true, controls: false, on: true, hidden: true, tab: -1 }, `${width}px`);
    assert.deepEqual(errors, []);
    await context.close();
  }
});

test("the loop stops when it leaves the screen, when the tab is hidden and when the visitor picks Reduced", { skip: noFixture }, async () => {
  const { page, context } = await open(fix, PAGE);
  await playing(page);
  const paused = (yes) => until(page, (yes) => document.querySelector("[data-cine] video").paused === yes, yes);
  await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  await paused(true);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await paused(false);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
  await paused(true);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
  await paused(false);
  await click(page, 'label:has(input[name="motion"][value="reduced"])');
  await paused(true);
  assert.equal(await page.getAttribute("html", "data-motion"), "reduced");
  // The motion picker sits at the foot of the page, so the loop was already off screen when Reduced was clicked.
  // Back at the top, with the loop in view, it has to stay stopped: that is the choice doing the work.
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(() => document.querySelector("[data-cine] video")?.paused ?? true), true, "the loop stays stopped on Reduced once it is back in view");
  await context.close();
});

// ---------------------------------------------------------------------------------------------------------------
// Backdrops: the loop behind the words of the home, websites, automation and security heroes
// ---------------------------------------------------------------------------------------------------------------

const BACKDROPS = { "/": "hero", "/websites/": "web-development", "/automation/": "automation", "/website-security/": "security" };
const backdrop = ".cine-host > .cine.backdrop";

// Reads a screenshot's pixels in an empty page: its brightest pixel, and, given a second picture of the same size,
// how far the two are apart.
async function pixels(context, png, other) {
  const page = await context.newPage();
  const out = await page.evaluate(async ([a, b]) => {
    const read = async (b64) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      return g.getImageData(0, 0, c.width, c.height);
    };
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const A = await read(a), B = b ? await read(b) : null;
    let top = -1, rgb = null, far = 0, differ = 0;
    for (let i = 0; i < A.data.length; i += 4) {
      const l = 0.2126 * lin(A.data[i]) + 0.7152 * lin(A.data[i + 1]) + 0.0722 * lin(A.data[i + 2]);
      if (l > top) { top = l; rgb = [A.data[i], A.data[i + 1], A.data[i + 2]]; }
      if (B) {
        const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
        if (d > far) far = d;
        if (d > 2) differ++;
      }
    }
    return { size: [A.width, A.height], sameSize: !B || (A.width === B.width && A.height === B.height), rgb, far, differ };
  }, [png.toString("base64"), other ? other.toString("base64") : null]);
  await page.close();
  return out;
}
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const contrast = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

// Every piece of text in the hero that has no solid surface of its own under it, with its colour and size.
const wordsOverBackdrop = (page) => page.$eval(".cine-host", (host) => {
  const out = [];
  const nums = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  for (const el of host.querySelectorAll("*")) {
    if (el.closest(".cine")) continue;
    const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();
    if (!text || !el.getClientRects().length) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none") continue;
    let covered = false;
    for (let p = el; p && p !== host; p = p.parentElement) {
      const c = nums(getComputedStyle(p).backgroundColor);
      if ((c[3] ?? 1) >= 0.9) { covered = true; break; }
    }
    if (covered) continue;
    const c = nums(s.color);
    out.push({ text: text.slice(0, 40), color: c.slice(0, 3), alpha: c[3] ?? 1, size: parseFloat(s.fontSize), weight: Number(s.fontWeight) || 400 });
  }
  return out;
});

test("each division hero plays its own clip behind the words, out of reach of the mouse and of screen readers", { skip: noFixture }, async () => {
  const loops = JSON.parse(readFileSync(fixtureManifest, "utf8")).loops;
  for (const [path, id] of Object.entries(BACKDROPS)) {
    for (const [width, height, want] of [[1280, 900, loops[id].sources], [390, 844, loops[id].mobile ?? loops[id].sources]]) {
      const name = `${path} at ${width}px`;
      const { page, context, media, errors } = await open(fix, path, { width, height });
      await until(page, (sel) => { const v = document.querySelector(sel + " video"); return v && !v.paused && v.currentTime > 0 && v.parentElement.classList.contains("on"); }, backdrop);
      assert.deepEqual([...new Set(media)], [want[0].src], name);
      const s = await page.$eval(backdrop, (el) => {
        const cs = getComputedStyle(el), v = el.querySelector("video"), box = el.getBoundingClientRect(), host = el.parentElement.getBoundingClientRect();
        return { loops: document.querySelectorAll("[data-cine]").length, hidden: el.getAttribute("aria-hidden"), pointer: cs.pointerEvents, z: cs.zIndex, position: cs.position,
          muted: v.muted, controls: v.controls, tab: v.tabIndex, inside: box.left >= host.left - 1 && box.right <= host.right + 1 && box.top >= host.top - 1 && box.bottom <= host.bottom + 1,
          sideways: document.documentElement.scrollWidth - innerWidth };
      });
      assert.deepEqual(s, { loops: 1, hidden: "true", pointer: "none", z: "-1", position: "absolute", muted: true, controls: false, tab: -1, inside: true, sideways: 0 }, name);
      // every button and link in the hero still takes a click: nothing of the backdrop lies on top of it
      const blocked = await page.$$eval(".cine-host a, .cine-host button", (els) => els.filter((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || r.bottom < 0 || r.top > innerHeight) return false;
        const hit = document.elementFromPoint(r.left + r.width / 2, Math.min(r.top + r.height / 2, innerHeight - 1));
        return hit && hit.closest(".cine") !== null;
      }).length);
      assert.equal(blocked, 0, name);
      assert.deepEqual(errors, [], name);
      await context.close();
    }
  }
});

test("the published build shows a backdrop only for a clip the manifest really lists", async () => {
  for (const [path, id] of Object.entries(BACKDROPS)) {
    const html = readFileSync(join(dist, path, "index.html"), "utf8");
    assert.equal(/class="[^"]*\bcine\b[^"]*\bbackdrop\b/.test(html), Boolean(manifest.loops[id]), path);
    if (!manifest.loops[id]) assert.ok(!/<video/.test(html), `${path} has no video element`);
  }
});

test("the words over a backdrop stay readable on a pure white frame, and a black frame leaves the page as it was", { skip: noFixture }, async () => {
  // Only the backdrop is photographed: the hero's own words and panels, and the header, are hidden, and the picture
  // and the video are turned pure white, pure black, or taken away. (Set through the style object: the site's
  // content security policy refuses an added style sheet.)
  const frame = (page, mode) => page.evaluate((mode) => {
    for (const el of document.querySelectorAll(".cine-host > :not(.cine), .cine-host > :not(.cine) *, header")) el.style.setProperty("visibility", "hidden", "important");
    const b = document.querySelector(".cine-host > .cine.backdrop");
    if (mode === "none") b.style.setProperty("display", "none", "important");
    for (const m of b.querySelectorAll("img, video")) m.style.setProperty("filter", mode === "white" ? "brightness(0) invert(1)" : "brightness(0)", "important");
  }, mode);
  for (const path of Object.keys(BACKDROPS)) {
    for (const [width, height] of [[1440, 900], [1024, 768], [390, 844]]) {
      const name = `${path} at ${width}px`;
      const { page, context } = await open(fix, path, { width, height });
      await page.waitForSelector(backdrop);
      const words = await wordsOverBackdrop(page);
      assert.ok(words.length > 3, `${name}: found the hero's words`);
      const shot = () => page.locator(".cine-host").first().screenshot({ animations: "disabled" });
      await frame(page, "white");
      const white = await pixels(context, await shot());
      for (const w of words) {
        const colour = w.color.map((v, i) => Math.round(v * w.alpha + white.rgb[i] * (1 - w.alpha)));
        const need = w.size >= 24 || (w.size >= 18.66 && w.weight >= 700) ? 3 : 4.5;
        const got = contrast(colour, white.rgb);
        assert.ok(got >= need, `${name}: "${w.text}" (${w.size}px, rgb ${colour}) has ${got.toFixed(2)}:1 over the brightest backdrop pixel rgb ${white.rgb}; needs ${need}:1`);
      }
      await frame(page, "black");
      const black = await shot();
      await frame(page, "none");
      const none = await shot();
      const gap = await pixels(context, black, none);
      assert.ok(gap.sameSize, `${name}: the hero keeps its size without the backdrop`);
      assert.ok(gap.far <= 4, `${name}: a black frame changes ${gap.differ} pixels, by up to ${gap.far} of 255`);
      await context.close();
    }
  }
});

// ---------------------------------------------------------------------------------------------------------------
// The portfolio and its player (test-pattern build)
// ---------------------------------------------------------------------------------------------------------------

const player = "[data-demo-player]";
const playerState = (page) => page.$eval(player, (d) => {
  const v = d.querySelector("video"), r = v.getBoundingClientRect();
  return { open: d.open, tall: d.classList.contains("tall"), title: d.querySelector("[data-title]").textContent, file: v.currentSrc.split("/").pop(), sources: v.querySelectorAll("source").length,
    paused: v.paused, controls: v.controls, tracks: [...v.querySelectorAll("track")].map((t) => `${t.kind} ${t.srclang} ${t.getAttribute("src")}`), shape: r.height ? r.width / r.height : 0,
    inside: r.left >= 0 && r.right <= innerWidth && r.top >= 0, playing: [...document.querySelectorAll("video")].filter((x) => !x.paused).length, focus: document.activeElement?.getAttribute("aria-label") };
});
const opened = (page) => until(page, () => { const d = document.querySelector("[data-demo-player]"), v = d.querySelector("video"); return d.open && !v.paused && v.currentTime > 0; });
const card = (id) => `[data-demo][href*="demo-${id}"]`;

test("every demo is labelled a fictional concept demonstration, and nothing plays or downloads until play is pressed", { skip: noFixture }, async () => {
  const { page, context, media, errors } = await open(fix, PAGE, { motion: "reduced" });
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
  await settle(page);
  assert.deepEqual(media, []);
  assert.equal(await page.$$eval("video", (vs) => vs.filter((v) => !v.paused || v.autoplay || v.preload === "auto").length), 0);
  const cards = await page.$$eval(".cg-card", (els) => els.map((el) => ({ label: el.querySelector(".cg-label").textContent.trim(), title: el.querySelector("h3").textContent.trim(), name: el.querySelector("[data-demo] .sr-only").textContent.trim(), poster: el.querySelector("img").complete && el.querySelector("img").naturalWidth > 0 })));
  assert.deepEqual(cards.map((c) => c.title), demos.map((d) => d.title));
  for (const c of cards) {
    assert.equal(c.label, demoLabel, c.title);
    assert.match(c.name, /^Play /, `${c.title}: the play button says what it does`);
    assert.ok(c.poster, `${c.title}: poster loaded`);
  }
  assert.match(await page.textContent(".cg-note"), /made.up|fictional/i);
  assert.equal(await page.$eval(player, (d) => d.open), false);
  assert.deepEqual(errors, []);
  await context.close();
});

test("pressing play opens one video with its own controls and captions; Escape stops it and gives focus back", { skip: noFixture }, async () => {
  const fx = JSON.parse(readFileSync(fixtureManifest, "utf8")).demos;
  const { page, context, media, errors } = await open(fix, PAGE);
  const id = demos[0].id, link = card(id);
  // With the hero loop on screen and running, an opened player stops it; closing the player lets it carry on.
  await playing(page);
  await page.$eval(link, (a) => a.click());
  await opened(page);
  assert.deepEqual(await page.$$eval("video", (vs) => vs.filter((v) => !v.paused).map((v) => v.closest("dialog") !== null)), [true], "one video plays: the loop behind has stopped");
  await page.keyboard.press("Escape");
  await until(page, () => !document.querySelector("[data-demo-player]").open);
  await playing(page);

  await show(page, link);
  await page.focus(link);
  await page.keyboard.press("Enter");                   // (the keyboard opens it too)
  await opened(page);
  const s = await playerState(page);
  assert.deepEqual([s.open, s.tall, s.title, s.controls, s.playing], [true, false, demos[0].title, true, 1]);
  assert.equal(s.file, fx[id].sources[0].src.split("/").pop());
  assert.deepEqual(s.tracks, fx[id].captions ? [`captions en ${fx[id].captions.src}`] : []);
  assert.equal(s.focus, "Close video");
  assert.ok(s.inside && Math.abs(s.shape - fx[id].width / fx[id].height) < 0.03, "the video fits the screen with no black bars");
  assert.equal(await page.textContent(`${player} .cg-label`), demoLabel);
  assert.equal(new Set(media.filter((p) => p.includes("demo-"))).size, 1, "only the chosen demo is downloaded");
  const similar = await page.getAttribute(`${player} [data-similar]`, "href");
  assert.match(similar, new RegExp(`^/contact/\\?want=${creativeWant}&${quoteParam}=[a-z0-9.~-]+$`));

  await page.keyboard.press("Escape");
  await until(page, () => !document.querySelector("[data-demo-player]").open);
  const closed = await playerState(page);
  assert.deepEqual([closed.sources, closed.paused, closed.tracks.length], [0, true, 0], "the file is let go");
  assert.equal(await page.evaluate((sel) => document.activeElement === document.querySelector(sel), link), true, "focus is back on the play button");

  // a second demo replaces the first; the close button and a click beside the player both close it
  const other = card(demos[1].id);
  await click(page, other);
  await opened(page);
  const again = await playerState(page);
  assert.deepEqual([again.title, again.sources, again.playing], [demos[1].title, fx[demos[1].id].sources.length, 1]);
  await page.click(`${player} [data-close]`);
  await until(page, () => !document.querySelector("[data-demo-player]").open);
  await click(page, other);
  await opened(page);
  await page.mouse.click(5, 5);
  await until(page, () => !document.querySelector("[data-demo-player]").open);
  assert.equal(await page.$$eval("video", (vs) => vs.filter((v) => !v.paused && v.closest("dialog")).length), 0);
  assert.deepEqual(errors, []);
  await context.close();

  // The player's "Request Similar Project" opens the quote form already filled in for that kind of video.
  const form = await open(web, similar);
  await until(form.page, () => !document.querySelector("[data-about]").hidden);
  assert.match(await form.page.inputValue("#f-need"), /an estimate, not a quote/);
  await form.context.close();
});

test("a phone held upright gets the vertical cut, and a vertical-only demo is shown tall on any screen", { skip: noFixture }, async () => {
  const fx = JSON.parse(readFileSync(fixtureManifest, "utf8")).demos;
  const both = demos.find((d) => fx[d.id].vertical), tallOnly = demos.find((d) => fx[d.id].height > fx[d.id].width);
  assert.ok(both && tallOnly, "the test-pattern set has a demo with a vertical cut and a vertical-only demo");
  for (const [width, height, d, file, tall] of [
    [390, 800, both, fx[both.id].vertical.sources[0].src, true],
    [1280, 900, both, fx[both.id].sources[0].src, false],
    [800, 390, both, fx[both.id].sources[0].src, false],          // the same phone on its side
    [1280, 900, tallOnly, fx[tallOnly.id].sources[0].src, true],
    [390, 800, tallOnly, fx[tallOnly.id].sources[0].src, true],
  ]) {
    const { page, context } = await open(fix, PAGE, { width, height, motion: "reduced" });
    await click(page, card(d.id));
    await opened(page);
    const s = await playerState(page);
    assert.deepEqual([s.file, s.tall], [file.split("/").pop(), tall], `${d.id} at ${width}x${height}`);
    assert.ok(s.inside, `${d.id} at ${width}x${height}: the video is inside the screen`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
    await context.close();
  }
});

test("without JavaScript each play button is a plain link to its video file", { skip: noFixture }, async () => {
  const fx = JSON.parse(readFileSync(fixtureManifest, "utf8")).demos;
  const { page, context, media } = await open(fix, PAGE, { js: false });
  const links = await page.$$eval("[data-demo]", (els) => els.map((a) => a.getAttribute("href")));
  assert.deepEqual(links, demos.map((d) => fx[d.id].sources.find((s) => s.type === "video/mp4").src));
  for (const href of links) assert.ok(existsSync(join(fixture, href)), href);
  assert.deepEqual(media, []);
  await context.close();
});
