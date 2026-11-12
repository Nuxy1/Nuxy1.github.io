// The four website levels (owner's brief, 2026-11-12): the level finder's logic and the brief's prices without a
// browser, then every level part in a real browser against the production build in dist/: the level pages at all
// nine brief widths, the five-question finder, the comparison tabs, the matrix, the three-levels café, the portfolio
// filter, the level pages' buttons into the form, and the Halvane concept's 3D (never with reduced motion). Each
// count the brief names is checked to fire, once, carrying only its name and the page.
//
//   npm run build
//   PLAYWRIGHT_CORE=<path to a playwright-core folder> BROWSER=<path to chrome.exe or msedge.exe> node --test tests/levels.test.mjs
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serveDist } from "./serve-dist.mjs";
import { levelOrder, levelNames, questions, recommend } from "../src/data/level-finder.ts";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "..", "dist");
// tiers.ts imports without file extensions, which Node cannot follow, so it is read as text
const tiers = readFileSync(join(here, "..", "src", "data", "tiers.ts"), "utf8");
const level = (id) => tiers.match(new RegExp(String.raw`^ {4}id: "${id}",\r?\n {4}name: "([^"]+)"[\s\S]*?^ {4}price: ([^\r\n]+),`, "m"));

// ---------- without a browser ----------

test("the level finder names the same four levels, in the same order, as tiers.ts", () => {
  const rows = [...tiers.matchAll(/^ {4}id: "([a-z]+)",\r?\n {4}name: "([^"]+)"/gm)].map((m) => [m[1], m[2]]);
  assert.deepEqual(rows.map((r) => r[0]), levelOrder);
  assert.deepEqual(Object.fromEntries(rows), levelNames);
  for (const q of questions) assert.equal(new Set(q.answers.map((a) => a.id)).size, q.answers.length, `${q.id}: answer ids repeat`);
  assert.equal(questions.length, 5, "the brief asks for five questions");
});

// every combination of answers, with each question also left unanswered (5 × 5 × 5 × 6 × 4 = 3,000)
const combos = questions.reduce((all, q) => all.flatMap((a) => [a, ...q.answers.map((x) => ({ ...a, [q.id]: x.id }))]), [{}]);
const cap = { lt1000: "business", "1000-6000": "signature", "6000-12000": "immersive", gt12000: "flagship" };
const rank = (l) => levelOrder.indexOf(l);

test("every answer combination gets a level and a reason, within the budget, and nobody is turned away", () => {
  assert.equal(combos.length, 3000);
  const seen = new Set();
  for (const a of combos) {
    const r = recommend(a);
    const at = JSON.stringify(a);
    assert.ok(levelOrder.includes(r.level), at);
    assert.ok(r.reason.length > 60, `${at}: reason too short`);
    if (cap[a.budget]) assert.ok(rank(r.level) <= rank(cap[a.budget]), `${at}: ${r.level} is above the budget`);
    if (r.next) {
      assert.ok(rank(r.next) > rank(r.level), `${at}: next ${r.next} is not above ${r.level}`);
      assert.ok(r.reason.includes(levelNames[r.next]), `${at}: the reason does not name ${r.next}`);
      assert.ok(cap[a.budget], `${at}: only a budget lowers the level`);
    }
    assert.doesNotMatch(r.reason, /can[’']t help|not a fit|too small|too low/i, at);
    seen.add(r.level);
  }
  assert.deepEqual([...seen].sort(), [...levelOrder].sort(), "every level can be recommended");
});

test("the finder's answers lead where a visitor would expect", () => {
  const cases = [
    [{ goal: "leads", now: "none", feel: "simple", budget: "lt1000", when: "soon" }, "business", undefined],
    [{ goal: "standout", now: "dated", feel: "polished", budget: "1000-6000", when: "months" }, "signature", undefined],
    [{ goal: "launch", now: "brand", feel: "explore", budget: "6000-12000", when: "flexible" }, "immersive", undefined],
    [{ goal: "custom", now: "brand", feel: "explore", budget: "gt12000", when: "flexible" }, "flagship", undefined],
    // big plans on a small budget: the closest level, plus a way to grow into the one described
    [{ goal: "launch", now: "brand", feel: "explore", budget: "lt1000", when: "flexible" }, "business", "immersive"],
    // the same with no site yet and a short deadline: the small budget caps the level but must not erase what was described
    [{ goal: "launch", now: "none", feel: "explore", budget: "lt1000", when: "soon" }, "business", "immersive"],
    // a big budget alone never upsells a visitor who asked for calls and bookings
    [{ goal: "leads", now: "none", feel: "simple", budget: "gt12000", when: "soon" }, "business", undefined],
    // no answers at all still gets an answer
    [{}, "business", undefined],
  ];
  for (const [a, want, next] of cases) {
    const r = recommend(a);
    assert.equal(r.level, want, JSON.stringify(a));
    assert.equal(r.next, next, JSON.stringify(a));
  }
});

test("level and add-on prices are the brief's", () => {
  assert.equal(level("signature")?.[2], `"From $3,500"`);
  assert.equal(level("immersive")?.[2], `"Starting at $6,000"`);
  assert.equal(level("flagship")?.[2], `"Custom quote"`);
  // Business keeps the live $499 / $900 prices from services.ts (owner decision: production pricing is not overwritten)
  assert.equal(level("business")?.[2], "`${starter} – ${site}`");
  const addOns = Object.fromEntries([...tiers.matchAll(/name: "([^"]+)", price: "([^"]+)"/g)].map((m) => [m[1], m[2]]));
  assert.deepEqual(addOns, {
    "Premium Motion": "+$750",
    "Interactive 3D Hero": "+$1,500",
    "Custom 3D Product Model": "+$750",
    "Advanced Scroll Storytelling": "+$1,500",
    "Additional Interactive Scene": "+$1,000",
    "Custom Animated Illustration": "+$500",
    "Cinematic Video Integration": "+$500",
    "Advanced Automation": "Custom quote",
    "Product Configurator": "Custom quote",
  });
});

test("the 3D scene caps its pixel ratio at 1.5, pauses off screen and frees everything it made", () => {
  const scene = readFileSync(join(here, "..", "src", "lib", "halvane", "scene.ts"), "utf8");
  assert.match(scene, /setPixelRatio\(Math\.min\(window\.devicePixelRatio \|\| 1, 1\.5\)\)/);
  assert.match(scene, /new IntersectionObserver/);
  assert.match(scene, /visibilitychange/);
  assert.match(scene, /renderer\.dispose\(\);[\s\S]*renderer\.forceContextLoss\(\)/);
});

// ---------- in a browser ----------

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE || "playwright-core");
const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const PAGES = ["/web-design/", "/business-websites/", "/signature-websites/", "/immersive-websites/", "/portfolio/", "/automation/", "/contact/?level=immersive", "/example-sites/halvane-audio/"];

// counting only happens on the real address, so a second browser maps that name to the local build (as pages.test.mjs)
const HOST = new URL((await import("../astro.config.mjs")).default.site).hostname;
let web, site, real, browser, hosted;
before(async () => {
  assert.ok(existsSync(join(dist, "index.html")), "run npm run build first");
  web = await serveDist(dist);
  site = web.url;
  real = `http://${HOST}:${new URL(site).port}`;
  const executablePath = process.env.BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
  browser = await chromium.launch({ executablePath, headless: true });
  hosted = await chromium.launch({ executablePath, headless: true, args: [`--host-resolver-rules=MAP ${HOST} 127.0.0.1`, "--disable-features=HttpsUpgrades"] });
});
after(async () => {
  await browser?.close();
  await hosted?.close();
  web?.close();
});

// A tab on the local build: other sites are stopped (listed in `outside`), count beacons are answered 204 and kept in
// `beacons`, and console errors, script errors and failed local files are kept in `errors`; `asked` lists local files.
async function open({ width = 1440, height = 900, base = real, ...options } = {}) {
  const context = await (base === site ? browser : hosted).newContext({ viewport: { width, height }, ...options });
  const tab = { context, outside: [], beacons: [], errors: [], asked: [] };
  await context.route((url) => url.origin !== base, (route) => {
    const req = route.request();
    if (/\/hit$/.test(new URL(req.url()).pathname)) {
      tab.beacons.push(Object.fromEntries(new URLSearchParams(req.postData() ?? "")));
      return route.fulfill({ status: 204 });
    }
    tab.outside.push(`${req.method()} ${req.url()}`);
    return route.abort();
  });
  const page = await context.newPage();
  page.on("console", (m) => { if (m.type() === "error") tab.errors.push(`console: ${m.text()}`); });
  page.on("pageerror", (e) => tab.errors.push(`script: ${e.message}`));
  page.on("request", (r) => { if (r.url().startsWith(base)) tab.asked.push(new URL(r.url()).pathname); });
  page.on("response", (r) => { if (r.url().startsWith(base) && r.status() >= 400) tab.errors.push(`${r.status()} ${r.url()}`); });
  tab.page = page;
  tab.go = (path) => page.goto(base + path, { waitUntil: "load" });
  tab.count = (e) => tab.beacons.filter((b) => b.e === e).length;
  return tab;
}
// a beacon is sent as the click happens; give it a moment to reach the route
const settle = (page) => page.waitForTimeout(250);
const checkBeacons = (tab) => {
  for (const b of tab.beacons) {
    assert.deepEqual(Object.keys(b).filter((k) => !["e", "p", "r"].includes(k)), [], JSON.stringify(b));
    assert.match(b.e, /^[a-z_]+$/);
    assert.match(b.p, /^\/[a-z0-9/-]*$/);
  }
};

test("the level pages fit every brief width, from 320 to 1920 pixels, with no errors", async () => {
  const tab = await open({ base: site });
  const problems = [];
  try {
    for (const width of WIDTHS) {
      await tab.page.setViewportSize({ width, height: 900 });
      for (const path of PAGES) {
        await tab.go(path);
        const over = await tab.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (over > 0) problems.push(`${path} at ${width}px scrolls ${over}px sideways`);
      }
    }
    problems.push(...tab.errors, ...tab.outside.map((o) => `outside request: ${o}`));
    assert.deepEqual(problems, []);
  } finally {
    await tab.context.close();
  }
});

test("the five-question finder recommends a level, links to the form with it chosen, and counts start and finish once", async () => {
  const tab = await open({ width: 390, height: 844, hasTouch: false });
  const { page } = tab;
  try {
    await tab.go("/web-design/");
    const rec = page.locator("[data-rec]");
    await rec.scrollIntoViewIfNeeded();
    await assert.doesNotReject(rec.locator("[data-rec-quiz]").waitFor({ state: "visible" }));
    assert.equal(await rec.locator("[data-rec-static]").isVisible(), false);
    // big plans on a small budget: the finder still answers, with the closest level and a way up
    const answers = { goal: "launch", now: "brand", feel: "explore", budget: "lt1000", when: "flexible" };
    const want = recommend(answers);
    let n = 0;
    for (const [q, a] of Object.entries(answers)) {
      assert.equal(await rec.locator("[data-rec-count]").textContent(), `Question ${++n} of 5`);
      await rec.locator(`[data-rec-q="${q}"] label:has(input[value="${a}"])`).click();
      // a click moves straight on after a short pause
      if (n < 5) await page.waitForFunction((n) => document.querySelector("[data-rec-count]").textContent === `Question ${n + 1} of 5`, n);
    }
    const result = rec.locator("[data-rec-result]");
    await result.waitFor({ state: "visible" });
    assert.equal(await rec.locator("[data-rec-name]").textContent(), levelNames[want.level]);
    assert.equal(await rec.locator("[data-rec-reason]").textContent(), want.reason);
    assert.equal(await page.evaluate(() => document.activeElement?.matches("[data-rec-result]")), true, "focus moves to the result");
    const cta = rec.locator("[data-rec-cta]");
    assert.equal(await cta.textContent(), "Discuss My Project");
    assert.equal(await cta.getAttribute("href"), `/contact/?level=${want.level}`);
    await settle(page);
    assert.equal(tab.count("website_recommender_started"), 1);
    assert.equal(tab.count("website_recommender_completed"), 1);

    // start again with the keyboard: arrow keys choose without moving on, Next continues; start is not counted twice
    await rec.locator("[data-rec-again]").click();
    assert.equal(await rec.locator("[data-rec-count]").textContent(), "Question 1 of 5");
    await rec.locator('[data-rec-q="goal"] input').first().focus();
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(400);
    assert.equal(await rec.locator("[data-rec-count]").textContent(), "Question 1 of 5", "a key press does not move on by itself");
    assert.equal(await rec.locator("[data-rec-next]").isEnabled(), true);
    await rec.locator("[data-rec-next]").click();
    assert.equal(await rec.locator("[data-rec-count]").textContent(), "Question 2 of 5");
    await rec.locator("[data-rec-back]").click();
    assert.equal(await rec.locator('[data-rec-q="goal"] input:checked').getAttribute("value"), "standout", "Back keeps the answer");
    await settle(page);
    assert.equal(tab.count("website_recommender_started"), 1);

    // the finished result's button opens the form with the level already chosen
    for (const [q, a] of Object.entries(answers)) {
      if (q === "goal") { await rec.locator('[data-rec-q="goal"] label:has(input[value="launch"])').click(); continue; }
      await rec.locator(`[data-rec-q="${q}"] label:has(input[value="${a}"])`).click();
    }
    await result.waitFor({ state: "visible" });
    await Promise.all([page.waitForURL(/\/contact\/\?level=business$/), cta.click()]);
    await page.waitForLoadState("load");
    assert.equal(await page.locator("select[name=level]").inputValue(), "business");
    assert.equal(await page.locator("[data-web]").isVisible(), true);
    await settle(page);
    assert.ok(tab.count("tier_selected") >= 1, JSON.stringify(tab.beacons));
    checkBeacons(tab);
    assert.deepEqual([...tab.errors, ...tab.outside], []);
  } finally {
    await tab.context.close();
  }
});

test("the comparison is a keyboard-usable tab set that counts its first use once", async () => {
  const tab = await open();
  const { page } = tab;
  try {
    await tab.go("/web-design/");
    const visible = () => page.$$eval(".cmp-panel", (ps) => ps.filter((p) => !p.hidden && p.offsetHeight > 0).map((p) => p.dataset.level));
    assert.equal(await page.locator(".cmp-tabs[role=tablist]").isVisible(), true);
    assert.deepEqual(await visible(), ["signature"], "Signature is shown first");
    await page.click("#cmp-t-immersive");
    assert.deepEqual(await visible(), ["immersive"]);
    assert.equal(await page.getAttribute("#cmp-t-immersive", "aria-selected"), "true");
    await page.keyboard.press("ArrowRight");
    assert.deepEqual(await visible(), ["flagship"]);
    assert.equal(await page.evaluate(() => document.activeElement?.id), "cmp-t-flagship");
    await page.keyboard.press("ArrowRight");
    assert.deepEqual(await visible(), ["business"], "arrows wrap around");
    await page.keyboard.press("End");
    assert.deepEqual(await visible(), ["flagship"]);
    await page.keyboard.press("Home");
    assert.deepEqual(await visible(), ["business"]);
    assert.equal(await page.getAttribute("#cmp-p-business", "role"), "tabpanel");
    assert.equal(await page.getAttribute("#cmp-p-business", "aria-labelledby"), "cmp-t-business");
    await settle(page);
    assert.equal(tab.count("tier_comparison_opened"), 1);
    checkBeacons(tab);
  } finally {
    await tab.context.close();
  }
});

test("the expectation matrix is a table on a wide screen and a level picker on a phone", async () => {
  const tab = await open({ base: site });
  const { page } = tab;
  try {
    await tab.go("/web-design/");
    assert.equal(await page.locator(".mx-table").isVisible(), true);
    assert.equal(await page.locator(".mx-phone").isVisible(), false);
    assert.ok(await page.locator(".mx-table thead th").count() >= 4, "a column per level");
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator(".mx-table").isVisible(), false);
    const shown = () => page.$$eval(".mx-list", (ls) => ls.filter((l) => l.offsetHeight > 0).map((l) => l.dataset.level));
    assert.deepEqual(await shown(), ["business"]);
    await page.click('.mx-pick label[for="mx-signature"]');
    assert.deepEqual(await shown(), ["signature"]);
    // keyboard: the radios themselves take focus and arrows move between them
    await page.focus("#mx-signature");
    await page.keyboard.press("ArrowRight");
    assert.deepEqual(await shown(), ["immersive"]);
    assert.deepEqual(tab.errors, []);
  } finally {
    await tab.context.close();
  }
});

test("the three-levels café switches versions, loops only while on screen, and stays still with reduced motion", async () => {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    const tab = await open({ base: site, reducedMotion });
    const { page } = tab;
    try {
      await tab.go("/web-design/");
      const tl = page.locator("[data-tl]");
      assert.equal(await tl.evaluate((e) => e.classList.contains("run")), false, "not running before it is seen");
      await tl.scrollIntoViewIfNeeded();
      await page.click('label[for="tl-immersive"]');
      assert.equal(await page.isChecked("#tl-immersive"), true);
      await page.waitForFunction(() => document.querySelector("[data-tl]").classList.contains("run"));
      const anim = await page.$eval("[data-tl] .oc-bag", (e) => getComputedStyle(e).animationName);
      if (reducedMotion === "reduce") assert.equal(anim, "none", "no loop with reduced motion");
      else assert.notEqual(anim, "none", "the Immersive version loops");
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForFunction(() => !document.querySelector("[data-tl]").classList.contains("run"));
      assert.equal(await page.$eval("[data-tl] .oc-bag", (e) => getComputedStyle(e).animationName), "none", "stops off screen");
      assert.deepEqual(tab.errors, []);
    } finally {
      await tab.context.close();
    }
  }
});

test("the portfolio filters examples by level and counts each change", async () => {
  const tab = await open();
  const { page } = tab;
  try {
    await tab.go("/portfolio/");
    const all = await page.locator("article.case[data-tier]").count();
    assert.ok(all >= 5);
    const shown = () => page.$$eval("article.case[data-tier]", (cs) => cs.filter((c) => !c.hidden).map((c) => c.dataset.tier));
    const tiers = [...new Set(await page.$$eval("article.case[data-tier]", (cs) => cs.map((c) => c.dataset.tier)))];
    let changes = 0;
    for (const t of tiers) {
      await page.click(`[data-pf-filter] button[data-tier="${t}"]`);
      changes++;
      const s = await shown();
      assert.ok(s.length > 0 && s.every((x) => x === t), `${t}: ${s}`);
      assert.equal(await page.getAttribute(`[data-pf-filter] button[data-tier="${t}"]`, "aria-pressed"), "true");
    }
    await page.click('[data-pf-filter] button[data-tier="all"]');
    changes++;
    assert.equal((await shown()).length, all);
    await page.click('[data-pf-filter] button[data-tier="all"]');
    await settle(page);
    assert.equal(tab.count("portfolio_tier_filter"), changes, "pressing the chosen filter again counts nothing");
    checkBeacons(tab);
  } finally {
    await tab.context.close();
  }
});

test("each level page counts one view and its button opens the form with that level chosen", async () => {
  for (const id of ["business", "signature", "immersive"]) {
    const tab = await open({ width: 390, height: 844 });
    const { page } = tab;
    try {
      await tab.go(`/${id}-websites/`);
      await settle(page);
      assert.equal(tab.count("tier_viewed"), 1, `${id}: ${JSON.stringify(tab.beacons)}`);
      const button = page.locator("[data-track=tier_selected]").first();
      assert.equal(await button.getAttribute("href"), `/contact/?level=${id}`);
      await Promise.all([page.waitForURL(new RegExp(`/contact/\\?level=${id}$`)), button.click()]);
      await page.waitForLoadState("load");
      assert.equal(await page.locator("select[name=level]").inputValue(), id);
      await settle(page);
      assert.equal(tab.count("tier_selected"), 1);
      checkBeacons(tab);
      assert.deepEqual([...tab.errors, ...tab.outside], []);
    } finally {
      await tab.context.close();
    }
  }
});

test("the Immersive page opens the Halvane concept, which loads 3D only when motion is allowed and WebGL works", async () => {
  const tab = await open();
  const { page } = tab;
  try {
    await tab.go("/immersive-websites/");
    await Promise.all([page.waitForURL(/\/example-sites\/halvane-audio\/$/), page.click(".im-card[data-track=immersive_demo_opened]")]);
    await page.waitForLoadState("load");
    await settle(page);
    assert.equal(tab.count("immersive_demo_opened"), 1);
    assert.match(await page.textContent("body"), /fictional business|not a real business/i, "the concept is labelled");
    const webgl = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl"));
    if (webgl) {
      await page.waitForSelector(".hv-stage.is-3d", { timeout: 15000 });
      assert.ok(tab.asked.some((p) => /\/_astro\/scene\.[\w-]+\.js$/.test(p)), "the scene loads as its own file");
      assert.equal(await page.locator("[data-canvas]").isVisible(), true);
    } else {
      test.diagnostic?.("this browser has no WebGL: checked the still version only");
      assert.equal(await page.locator(".hv-stage.is-3d").count(), 0);
    }
    assert.deepEqual([...tab.errors, ...tab.outside], []);
  } finally {
    await tab.context.close();
  }
  // reduced motion: the still drawing, and the 3D code is never even downloaded
  const still = await open({ base: site, reducedMotion: "reduce" });
  try {
    await still.go("/example-sites/halvane-audio/");
    await still.page.waitForTimeout(1500);
    assert.equal(await still.page.locator(".hv-stage.is-3d").count(), 0);
    assert.deepEqual(still.asked.filter((p) => /\/_astro\/scene\./.test(p)), []);
    assert.equal(await still.page.locator(".hv-stage svg").first().isVisible(), true);
    assert.deepEqual(still.errors, []);
  } finally {
    await still.context.close();
  }
});

test("without JavaScript every level part still shows its content", async () => {
  const tab = await open({ base: site, javaScriptEnabled: false });
  const { page } = tab;
  try {
    await tab.go("/web-design/");
    assert.equal(await page.locator(".cmp-tabs").isVisible(), false);
    assert.equal(await page.locator(".cmp-panel:visible").count(), 4, "all four comparison panels");
    assert.equal(await page.locator("[data-rec-static]").isVisible(), true);
    assert.equal(await page.locator('[data-rec-static] a[href="/contact/?level=unsure"]').textContent(), "Discuss My Project");
    assert.equal(await page.locator("[data-rec-quiz]").isVisible(), false);
    await page.click('label[for="tl-signature"]');
    assert.equal(await page.isChecked("#tl-signature"), true, "the café switch is plain radios");
    await tab.go("/portfolio/");
    assert.equal(await page.locator("[data-pf-filter]").isVisible(), false);
    assert.equal(await page.locator("article.case[data-tier]:visible").count(), await page.locator("article.case[data-tier]").count());
  } finally {
    await tab.context.close();
  }
});

test("every add-on names the levels it fits, and each level page lists only add-ons that fit it", () => {
  const fits = Object.fromEntries([...tiers.matchAll(/\{ id: "([^"]+)", name: "[^"]+", price: "[^"]+", text: "[^"]+", fits: \[([^\]]*)\] \}/g)]
    .map((m) => [m[1], [...m[2].matchAll(/"(\w+)"/g)].map((x) => x[1])]));
  assert.equal(Object.keys(fits).length, 9);
  // a Business site lives in Squarespace or Wix: only builder-friendly add-ons fit it, and none are 3D or custom code
  assert.deepEqual(Object.keys(fits).filter((id) => fits[id].includes("business")).sort(), ["automation", "illustration", "video"]);
  for (const id in fits) assert.ok(!fits[id].includes("flagship"), `${id}: Flagship scopes everything in its plan`);
  for (const page of ["business", "signature", "immersive"]) {
    const src = readFileSync(join(here, "..", "src", "pages", `${page}-websites`, "index.astro"), "utf8");
    const ids = [...(src.match(/addOnIds=\{\[([^\]]*)\]\}/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    assert.ok(ids.length > 0, `${page} page lists add-ons`);
    for (const id of ids) assert.ok(fits[id]?.includes(page), `${id} does not fit ${page}`);
  }
});

test("no demo's project line names a different level than its badge", async () => {
  const { demoSites } = await import("../src/data/demo-sites.ts");
  for (const d of demoSites) {
    for (const l of levelOrder) {
      if (l === d.tier) continue;
      assert.ok(!new RegExp(`\b${levelNames[l]}\b`, "i").test(d.project), `${d.slug}: "${d.project}" names ${levelNames[l]} under a ${levelNames[d.tier]} badge`);
    }
  }
});
