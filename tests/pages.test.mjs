// Every page in a real browser, against the production build in dist/: no sideways scroll at the six checked widths,
// tap targets big enough (WCAG 2.2 AA 2.5.8), no console errors or broken files, reduced motion honoured, the pages
// that must work without JavaScript do, and the interactive parts (service finder, example viewer, demo forms and
// buttons, old links, the form's service list, the 404) do what they say. Nothing leaves this computer: requests to
// any other site are stopped, and the anonymous count beacons are caught and checked for what they carry.
//
//   npm run build
//   PLAYWRIGHT_CORE=<path to a playwright-core folder> BROWSER=<path to chrome.exe or msedge.exe> node --test tests/pages.test.mjs
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { serveDist } from "./serve-dist.mjs";
import { services, plans, groups, variants, bundles, retired } from "../src/data/services.ts";
import { demoSites } from "../src/data/demo-sites.ts";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "..", "dist");
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE || "playwright-core");
const WIDTHS = [320, 375, 390, 768, 1024, 1440];

const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith(".html") ? [join(d, e.name)] : []);
const urls = walk(dist).map((f) => "/" + relative(dist, f).split(sep).join("/").replace(/(^|\/)index\.html$/, "$1")).sort();

// The site counts visits only on its real address. A second browser sends that name to the local build instead of the
// internet, so counting can be tested; every other request it makes is still stopped by open() below.
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

// A browser tab on the local build. Requests to other sites are stopped and listed in `outside`; count beacons
// (…/hit) are answered 204 and their bodies kept in `beacons`; console errors, script errors and failed local files go
// in `errors`.
async function open({ width = 390, height = 800, base = site, ...options } = {}) {
  const context = await (base === site ? browser : hosted).newContext({ viewport: { width, height }, ...options });
  const tab = { context, outside: [], beacons: [], errors: [], posts: [] };
  await context.route((url) => url.origin !== base, (route) => {
    const req = route.request();
    if (/\/hit$/.test(new URL(req.url()).pathname)) {
      tab.beacons.push(Object.fromEntries(new URLSearchParams(req.postData() ?? "")));
      return route.fulfill({ status: 204 });
    }
    tab.outside.push(`${req.method()} ${req.url()}`);
    return route.abort();
  });
  // anything the page's security policy blocks is reported as an error with what was blocked
  await context.addInitScript(() => document.addEventListener("securitypolicyviolation", (e) =>
    console.error(`security policy blocked ${e.effectiveDirective}: ${e.blockedURI || "inline"} ${(e.sample || "").slice(0, 60)}`)));
  const page = await context.newPage();
  page.on("console", (m) => { if (m.type() === "error") tab.errors.push(`console: ${m.text()}`); });
  page.on("pageerror", (e) => tab.errors.push(`script: ${e.message}`));
  page.on("request", (r) => { if (r.method() !== "GET" && r.url().startsWith(base)) tab.posts.push(`${r.method()} ${r.url()}`); });
  page.on("response", (r) => { if (r.url().startsWith(base) && r.status() >= 400 && r.request().resourceType() !== "document") tab.errors.push(`${r.status()} ${r.url()}`); });
  tab.page = page;
  return tab;
}
const go = (page, path) => page.goto(site + path, { waitUntil: "load" });

for (const width of WIDTHS) {
  test(`every page at ${width}px: no sideways scroll, no errors, nothing loaded from other sites`, async () => {
    const tab = await open({ width });
    const problems = [];
    try {
      for (const u of urls) {
        tab.errors.length = 0;
        const res = await go(tab.page, u);
        if (u !== "/404.html" && res.status() !== 200) problems.push(`${u}: HTTP ${res.status()}`);
        const wide = await tab.page.evaluate(() => {
          const root = document.documentElement;
          if (root.scrollWidth <= root.clientWidth) return null;
          // name the widest elements that stick out, for the message
          const out = [...document.body.querySelectorAll("*")].filter((el) => el.getBoundingClientRect().right > root.clientWidth + 1)
            .slice(-3).map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}`);
          return `${root.scrollWidth}px wide in ${root.clientWidth}px (${out.join(", ")})`;
        });
        if (wide) problems.push(`${u}: ${wide}`);
        problems.push(...tab.errors.map((e) => `${u}: ${e}`));
      }
      problems.push(...tab.outside.map((r) => `request to another site: ${r}`));
    } finally {
      await tab.context.close();
    }
    assert.deepEqual(problems, []);
  });
}

// WCAG 2.2 AA 2.5.8: a target is at least 24 x 24 CSS px, unless a 24px circle on its centre touches no other target
// (or another small target's circle), or it is a link inside a sentence. A checkbox or radio counts its label.
const smallTargets = () => {
  const sel = "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [tabindex]:not([tabindex='-1'])";
  const items = [];
  for (const el of document.querySelectorAll(sel)) {
    let target = el;
    if (el.matches("input[type=checkbox], input[type=radio]")) target = el.closest("label") ?? (el.id && document.querySelector(`label[for="${el.id}"]`)) ?? el;
    const r = target.getBoundingClientRect();
    const cs = getComputedStyle(target);
    if (!r.width || !r.height || cs.visibility === "hidden" || target.closest("[hidden], [inert], [aria-hidden='true']")) continue;
    if (r.bottom + scrollY <= 0 || r.right + scrollX <= 0) continue; // parked off-screen until focused (skip link)
    const inline = el.tagName === "A" && cs.display === "inline" && el.parentElement &&
      el.parentElement.textContent.trim().length > el.textContent.trim().length;
    items.push({ el, r, small: !inline && (r.width < 24 || r.height < 24) });
  }
  const centre = (r) => [r.left + r.width / 2, r.top + r.height / 2];
  const distToRect = ([x, y], r) => Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
  return items.filter((a) => a.small).filter((a) => {
    const c = centre(a.r);
    return items.some((b) => b !== a && !a.el.contains(b.el) && !b.el.contains(a.el) &&
      (distToRect(c, b.r) < 12 || (b.small && Math.hypot(c[0] - centre(b.r)[0], c[1] - centre(b.r)[1]) < 24)));
  }).map(({ el, r }) => `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || el.name || "").trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
};

for (const width of [320, 1440]) {
  test(`every page at ${width}px: tap targets are at least 24px or spaced apart`, async () => {
    const tab = await open({ width });
    const problems = [];
    try {
      for (const u of urls) {
        await go(tab.page, u);
        problems.push(...(await tab.page.evaluate(smallTargets)).map((t) => `${u}: ${t}`));
      }
    } finally {
      await tab.context.close();
    }
    assert.deepEqual(problems, []);
  });
}

// DESIGN.md promises more than WCAG for the controls people press most: buttons, toggles, menu links and form fields
// are at least 44px tall. (A checkbox or radio counts its label.)
for (const width of [390, 1440]) test(`every page at ${width}px: buttons, toggles, menu links and form fields are at least 44px tall`, async () => {
  const tab = await open({ width });
  const problems = [];
  try {
    for (const u of urls) {
      await go(tab.page, u);
      // on a phone the main menu folds away; open it so its links are measured too
      if (await tab.page.locator("details[data-menu] > summary").isVisible()) await tab.page.click("details[data-menu] > summary");
      problems.push(...(await tab.page.evaluate(() => {
        const sel = "button, .button, .btn, .nav-link, .menu-panel a, summary, select, textarea, input:not([type=hidden])";
        return [...document.querySelectorAll(sel)].flatMap((el) => {
          const target = el.matches("input[type=checkbox], input[type=radio]")
            ? el.closest("label") ?? (el.id && document.querySelector(`label[for="${el.id}"]`)) ?? el : el;
          const r = target.getBoundingClientRect();
          if (!r.width || !r.height || target.closest("[hidden], [inert], [aria-hidden='true']") || r.bottom + scrollY <= 0) return [];
          return r.height < 43.5 ? [`${el.tagName.toLowerCase()}.${[...target.classList].join(".")} "${(el.textContent || el.getAttribute("aria-label") || el.name || "").trim().slice(0, 30)}" ${Math.round(r.height)}px tall`] : [];
        });
      })).map((t) => `${u}: ${t}`));
    }
  } finally {
    await tab.context.close();
  }
  assert.deepEqual([...new Set(problems)], []);
});

// the first five elements that animate or transition for longer than 10ms (none, when motion is off)
const animating = () => [...document.querySelectorAll("*")].filter((el) => {
  const cs = getComputedStyle(el);
  const longest = (v) => Math.max(...v.split(",").map((t) => parseFloat(t) * (t.trim().endsWith("ms") ? 1 : 1000)));
  return (cs.animationName !== "none" && longest(cs.animationDuration) > 10) || longest(cs.transitionDuration) > 10;
}).slice(0, 5).map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}`);

test("with reduced motion asked for, nothing animates", async () => {
  const tab = await open({ width: 1440, reducedMotion: "reduce" });
  try {
    for (const u of ["/", "/websites/", "/automation/", "/demos/"]) {
      await go(tab.page, u);
      assert.deepEqual(await tab.page.evaluate(animating), [], u);
    }
  } finally {
    await tab.context.close();
  }
});

test("without JavaScript: every service is listed, the form posts to the inquiry service, the example still shows", async () => {
  const tab = await open({ width: 390, javaScriptEnabled: false });
  const { page } = tab;
  try {
    await go(page, "/solutions/");
    assert.equal(await page.locator(".svc[data-fits]:visible").count(), services.length, "every service visible");
    assert.equal(await page.locator("[data-finder]").isVisible(), false, "the search box needs JavaScript, so it stays hidden");
    await go(page, "/contact/");
    const form = page.locator("form[method='post']");
    assert.equal(await form.count(), 1);
    assert.match(await form.getAttribute("action"), /^https:\/\/[^/]+\/inquiry$/);
    await go(page, `/examples/${demoSites[0].slug}/`);
    assert.equal(await page.locator("[data-toggle]").isVisible(), false);
    assert.ok(await page.locator("[data-stage] iframe").isVisible());
  } finally {
    await tab.context.close();
  }
});

test("service finder: search, filter by kind, the address keeps the filter, and a link to a hidden service shows it", async () => {
  const tab = await open({ width: 390 });
  const { page } = tab;
  const count = () => page.locator(".svc[data-fits]:visible").count();
  try {
    await go(page, "/solutions/");
    assert.equal(await count(), services.length);
    await page.fill("#svc-q", "invoices");
    const found = await count();
    assert.ok(found >= 1 && found < services.length, `"invoices" shows ${found}`);
    assert.match(await page.locator("[data-count]").textContent(), new RegExp(`^${found} of ${services.length} services$`));
    await page.fill("#svc-q", "zzzz");
    assert.equal(await count(), 0);
    assert.ok(await page.locator("[data-empty]").isVisible(), "no-results message");
    await page.fill("#svc-q", "");
    assert.equal(await count(), services.length);

    const kind = (await page.locator("input[name='for']").nth(1).getAttribute("value"));
    await page.locator(`input[name='for'][value='${kind}']`).check();
    const fitting = services.filter((s) => s.fits.split(" ").some((f) => f === "all" || f === kind));
    assert.equal(await count(), fitting.length, `kind ${kind}`);
    assert.equal(new URL(page.url()).searchParams.get("for"), kind);

    const hidden = services.find((s) => !fitting.includes(s));
    assert.ok(hidden, `a service that doesn't suit ${kind}`);
    await go(page, `/solutions/?for=${kind}#${hidden.id}`);
    assert.ok(await page.locator(`#${hidden.id}`).isVisible(), `#${hidden.id} shown even though it doesn't suit ${kind}`);
  } finally {
    await tab.context.close();
  }
});

test("example viewer: computer and phone buttons resize the demo, and phones start on the phone view", async () => {
  const tab = await open({ width: 1440 });
  const { page } = tab;
  const slug = demoSites[0].slug;
  try {
    await go(page, `/examples/${slug}/`);
    const frame = page.locator("[data-stage] iframe");
    const pressed = (mode) => page.locator(`[data-toggle] button[data-mode='${mode}']`).getAttribute("aria-pressed");
    assert.equal(await pressed("desktop"), "true");
    assert.equal(await frame.evaluate((f) => f.style.width), "1280px");
    await page.click("[data-toggle] button[data-mode='phone']");
    assert.equal(await pressed("phone"), "true");
    assert.equal(await pressed("desktop"), "false");
    assert.equal(await frame.evaluate((f) => f.style.width), "390px");
    const fits = await page.evaluate(() => {
      const stage = document.querySelector("[data-stage]");
      return stage.querySelector("[data-screen]").getBoundingClientRect().width <= stage.clientWidth;
    });
    assert.ok(fits, "the phone view fits its column");
    await page.setViewportSize({ width: 390, height: 800 });
    await go(page, `/examples/${slug}/`);
    assert.equal(await pressed("phone"), "true", "phone view first on a phone");
  } finally {
    await tab.context.close();
  }
});

test("demo websites: their forms send nothing and say so, and their call/text buttons only explain", async () => {
  const tab = await open({ width: 390 });
  const { page } = tab;
  try {
    for (const d of demoSites) {
      await go(page, `/example-sites/${d.slug}/`);
      const forms = page.locator("form[data-demo-form]");
      assert.ok(await forms.count() >= 1, `${d.slug} has a demo form`);
      for (let i = 0; i < await forms.count(); i++) {
        const form = forms.nth(i);
        const sentId = await form.getAttribute("data-demo-form");
        await form.scrollIntoViewIfNeeded();
        // answer every required question
        for (const field of await form.locator("[required]").all()) {
          const tag = await field.evaluate((f) => f.tagName.toLowerCase());
          const type = (await field.getAttribute("type")) ?? "";
          if (tag === "select") await field.selectOption({ index: 1 });
          else if (type === "checkbox" || type === "radio") await field.check({ force: true });
          else if (type === "email") await field.fill("someone@example.com");
          else if (type === "tel") await field.fill("555-0100");
          else if (type === "number") await field.fill("2");
          else if (type === "date") await field.fill("2030-06-14");
          else if (type === "time") await field.fill("10:00");
          else await field.fill("Test answer");
        }
        await form.locator("button[type='submit'], button:not([type])").first().click();
        const sent = page.locator(`#${sentId}`);
        await sent.waitFor({ state: "visible", timeout: 3000 });
        assert.match(await sent.textContent(), /nothing (was|is) sent|demo/i, `${d.slug}: the sent panel says it's a demo`);
        assert.equal(await form.isVisible(), false);
        await sent.locator("[data-demo-again]").click();
        assert.ok(await form.isVisible(), `${d.slug}: the form comes back`);
      }
      const action = page.locator("[data-demo-action]:visible").first();
      const before = page.url();
      await action.click();
      const toast = page.locator("[data-demo-toast]");
      assert.equal((await toast.textContent()).trim(), (await action.getAttribute("data-demo-action")).trim());
      assert.equal(page.url(), before, `${d.slug}: the demo button doesn't change the address`);
    }
    assert.deepEqual(tab.posts, [], "no form was sent anywhere");
    assert.deepEqual(tab.outside, []);
  } finally {
    await tab.context.close();
  }
});

test("count beacons carry only an event name, the page path and another site's name", async () => {
  const tab = await open({ width: 1440, base: real });
  const { page } = tab;
  try {
    await page.goto(real + "/contact/");
    await page.fill("input[name='name']", "Private Person");
    await page.fill("input[name='email']", "private@example.com");
    // the lead-reply demo moved off the homepage in the 2026-11 sprint; it lives on /demos/ now
    await page.goto(real + "/demos/");
    await page.locator("[data-play]").first().click();
    await page.waitForTimeout(300);
    assert.ok(tab.beacons.length >= 3, `beacons: ${JSON.stringify(tab.beacons)}`);
    for (const b of tab.beacons) {
      assert.deepEqual(Object.keys(b).filter((k) => !["e", "p", "r"].includes(k)), [], JSON.stringify(b));
      assert.match(b.e, /^[a-z_]+$/);
      assert.match(b.p, /^\/[a-z0-9/-]*$/);
      assert.doesNotMatch(JSON.stringify(b), /Private|private@/);
    }
    assert.ok(tab.beacons.some((b) => b.e === "demo_start"), "the demo start is counted");
  } finally {
    await tab.context.close();
  }
  // nothing is counted when the browser asks not to be tracked (either signal), or on any other address
  const cases = [
    ["Global Privacy Control", real, () => Object.defineProperty(Navigator.prototype, "globalPrivacyControl", { get: () => true })],
    ["Do Not Track", real, () => Object.defineProperty(Navigator.prototype, "doNotTrack", { get: () => "1" })],
    ["a copy of the site at another address", site, () => {}],
  ];
  for (const [why, base, setup] of cases) {
    const quiet = await open({ width: 1440, base });
    try {
      await quiet.page.addInitScript(setup);
      await quiet.page.goto(base + "/demos/");
      await quiet.page.locator("[data-play]").first().click();
      await quiet.page.waitForTimeout(300);
      assert.deepEqual(quiet.beacons, [], `nothing counted with ${why}`);
    } finally {
      await quiet.context.close();
    }
  }
});

test("old one-page links land on their new page", async () => {
  const tab = await open({ width: 390 });
  const { page } = tab;
  const groupLegacy = groups.find((g) => g.legacy.length)?.legacy[0];
  const cases = [
    ["request", "/contact/"],
    [services[0].id, `/solutions/#${services[0].id}`],
    [plans[0].id, `/pricing/#${plans[0].id}`],
    ...(groupLegacy ? [[groupLegacy, `/solutions/#${groups.find((g) => g.legacy.includes(groupLegacy)).id}`]] : []),
  ];
  try {
    for (const [hash, to] of cases) {
      await go(page, `/#${hash}`);
      await page.waitForURL((u) => u.pathname !== "/", { timeout: 3000 });
      const u = new URL(page.url());
      assert.equal(u.pathname + u.hash, to, `/#${hash}`);
    }
  } finally {
    await tab.context.close();
  }
});

test("the form knows every service, version, bundle and plan, ?service= names one (only a real one), and every link to it is real", async () => {
  const tab = await open({ width: 390 });
  const { page } = tab;
  try {
    await go(page, "/contact/");
    const known = await page.locator("[data-inquiry]").evaluate((el) => JSON.parse(el.dataset.services));
    assert.deepEqual(Object.keys(known).sort(), [...services, ...variants, ...bundles, ...plans].map((s) => s.id).concat(Object.keys(retired)).sort());
    const answers = await page.locator("[name=want]").evaluateAll((r) => r.map((x) => x.value));
    for (const [id, s] of Object.entries(known)) assert.ok(answers.includes(s.want), `${id} picks ${s.want}`);
    for (const item of [plans[0], services[0], variants[0], bundles[0]]) {
      await go(page, `/contact/?service=${item.id}`);
      assert.equal(await page.locator("[name=service]").inputValue(), item.id);
      assert.ok((await page.locator("[data-about]").textContent()).includes(item.name), item.id);
    }
    // (an old link to a retired plan names the plan that replaced it, and keeps the old id so the owner can tell)
    for (const [id, now] of Object.entries(retired)) {
      await go(page, `/contact/?service=${id}`);
      assert.equal(await page.locator("[name=service]").inputValue(), id);
      assert.match(await page.locator("[data-about]").textContent(), new RegExp(`${plans.find((p) => p.id === now).name}.*which replaced`));
    }
    await go(page, "/contact/?service=not-a-service");
    assert.equal(await page.locator("[name=service]").inputValue(), "");
    // every "Request a proposal" or quote link on the site points at an id the form knows and an answer it has
    for (const u of ["/", "/solutions/", "/pricing/", "/automation/", "/websites/", "/ecommerce/", "/get-a-website/", "/website-security/"]) {
      const res = await go(page, u);
      if (res.status() === 404) continue;
      const links = await page.locator("a[href*='/contact/?']").evaluateAll((a) => a.map((x) => Object.fromEntries(new URL(x.href).searchParams)));
      for (const q of links) {
        if (q.service) assert.ok(q.service in known, `${u}: ?service=${q.service}`);
        if (q.want) assert.ok(answers.includes(q.want), `${u}: ?want=${q.want}`);
      }
    }
  } finally {
    await tab.context.close();
  }
});

test("a missing page answers 404 with a way back", async () => {
  const tab = await open({ width: 390 });
  try {
    const res = await go(tab.page, "/no-such-page/");
    assert.equal(res.status(), 404);
    assert.equal(await tab.page.locator("h1").count(), 1);
    for (const href of ["/", "/contact/"]) assert.ok(await tab.page.locator(`main a[href='${href}']`).count() >= 1, href);
  } finally {
    await tab.context.close();
  }
});

test("on a phone, inline code on the docs pages never breaks at a hyphen, short code stays on one line, and nothing is wider than the screen", async () => {
  const pages = readdirSync(join(dist, "docs"), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => `/docs/${e.name}/`);
  assert.ok(pages.length >= 5, "the five project docs pages are built");
  const tab = await open({ width: 320 });
  try {
    let checked = 0;
    for (const width of [320, 390]) {
      await tab.page.setViewportSize({ width, height: 800 });
      for (const path of pages) {
        await go(tab.page, path);
        const r = await tab.page.evaluate(() => {
          const spans = [...document.querySelectorAll(":not(pre) > code")];
          const lines = (e) => new Set([...e.getClientRects()].map((r) => Math.round(r.top))).size;
          return {
            count: spans.length,
            // short code in body text stays whole (a heading's larger type may wrap it, after a slash)
            broken: spans.filter((e) => !e.closest("h1, h2, h3, h4, h5, h6") && e.textContent.length <= 28 && lines(e) > 1).map((e) => e.textContent),
            // a hyphenated word sits whole in a .nobr or a .whole code, and each of those is on one line
            loose: spans.filter((e) => !e.classList.contains("whole") && [...e.childNodes].some((n) => n.nodeType === 3 && /[^\s/]-[^\s/]/.test(n.textContent))).map((e) => e.textContent),
            split: [...document.querySelectorAll(":not(pre) > code.whole, :not(pre) > code .nobr")].filter((e) => lines(e) > 1).map((e) => e.textContent),
            wide: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          };
        });
        checked += r.count;
        assert.deepEqual(r.broken, [], `${path} at ${width}: short code split across lines`);
        assert.deepEqual(r.loose, [], `${path}: code with a hyphenated word left breakable`);
        assert.deepEqual(r.split, [], `${path} at ${width}: code split at a hyphen`);
        assert.equal(r.wide, false, `${path} at ${width} is wider than the screen`);
      }
    }
    assert.ok(checked > 50, `only ${checked} inline code spans found, so this test proves little`);
    assert.deepEqual(tab.errors, []);
  } finally {
    await tab.context.close();
  }
});

test("a docs table wider than a phone scrolls in its own named box, which Tab reaches and arrow keys scroll", async () => {
  const tab = await open({ width: 320 });
  try {
    await go(tab.page, "/docs/csv-cleaner/");
    const boxes = await tab.page.$$eval(".table-scroll", (els) => els.map((e) => ({ role: e.getAttribute("role"), label: e.getAttribute("aria-label"), wide: e.scrollWidth > e.clientWidth, tab: e.tabIndex })));
    assert.ok(boxes.length >= 2, "csv-cleaner has two tables");
    for (const b of boxes) assert.ok(b.role === "region" && /^Table/.test(b.label ?? ""), JSON.stringify(b));
    const wide = boxes.findIndex((b) => b.wide);
    assert.ok(wide >= 0, "at 320 wide one table should need to scroll (else this test proves nothing)");
    assert.equal(boxes[wide].tab, 0);
    let reached = false;
    for (let i = 0; i < 80 && !reached; i++) {
      await tab.page.keyboard.press("Tab");
      reached = await tab.page.evaluate((n) => document.activeElement === document.querySelectorAll(".table-scroll")[n], wide);
    }
    assert.ok(reached, "Tab never reached the scrolling table");
    for (let i = 0; i < 4; i++) await tab.page.keyboard.press("ArrowRight");
    // Keyboard scrolling is animated, so wait for it rather than reading scrollLeft at once.
    await tab.page.waitForFunction((n) => document.querySelectorAll(".table-scroll")[n].scrollLeft > 0, wide, { timeout: 2000 })
      .catch(() => assert.fail("arrow keys didn't scroll it"));
    // On a wide screen a table that fits is left out of the Tab order.
    await tab.page.setViewportSize({ width: 1440, height: 900 });
    await tab.page.waitForFunction(() => [...document.querySelectorAll(".table-scroll")].every((e) => e.tabIndex === (e.scrollWidth > e.clientWidth ? 0 : -1)));
    assert.deepEqual(tab.errors, []);
  } finally {
    await tab.context.close();
  }
});

// ---- The motion upgrade (owner's brief, 2026-11-11): motion setting, hero core, simulated demos, goal picker ----

test("the footer's Motion choice: Reduced stops everything and is remembered; a device asking for reduced motion can only keep still", async () => {
  const tab = await open({ width: 1440 });
  const { page } = tab;
  try {
    await go(page, "/");
    assert.notEqual(await page.getAttribute("html", "data-motion"), "reduced");
    assert.equal(await page.getAttribute("html", "data-ambient"), "", "the hero's slow motion runs at first");
    await page.locator("[data-motion-pick] label", { hasText: "Reduced" }).click();
    assert.equal(await page.getAttribute("html", "data-motion"), "reduced");
    await go(page, "/");
    assert.equal(await page.getAttribute("html", "data-motion"), "reduced", "the choice is remembered on the next page");
    assert.equal(await page.getAttribute("html", "data-ambient"), null);
    await page.waitForTimeout(400);
    assert.deepEqual(await page.evaluate(animating), []);
  } finally {
    await tab.context.close();
  }
  const still = await open({ width: 390, reducedMotion: "reduce" });
  try {
    await go(still.page, "/");
    const radios = await still.page.$$eval("[data-motion-pick] input", (els) => els.map((e) => `${e.value}:${e.checked ? "on" : "off"}:${e.disabled ? "locked" : "open"}`));
    assert.deepEqual(radios, ["reduced:on:open", "standard:off:locked", "enhanced:off:locked"]);
    assert.ok(await still.page.locator("[data-motion-note]").isVisible(), "the note says why");
  } finally {
    await still.context.close();
  }
});

test("without JavaScript: the hero's parts, the simulated demos and the goal picker still work, and every demo says it is made up", async () => {
  const tab = await open({ width: 390, javaScriptEnabled: false });
  const { page } = tab;
  const shown = (sel, key) => page.locator(`${sel}:visible`).evaluateAll((els, k) => els.map((e) => e.getAttribute(k)), key);
  try {
    await go(page, "/");
    assert.deepEqual(await shown(".panel[data-part]", "data-part"), ["leads"]);
    await page.locator(".node", { hasText: "Booking" }).click();
    assert.deepEqual(await shown(".panel[data-part]", "data-part"), ["booking"]);

    const demos = await page.locator("#autopilot .ap-demo").allTextContents();
    assert.equal(demos.length, 4);
    for (const d of demos) assert.match(d.replace(/\s+/g, " "), /Simulated demo.*made up\. No call is placed, no message is sent and nothing is booked\./);
    assert.deepEqual(await shown("#autopilot .ap-demo", "id"), ["ap-voice"]);
    assert.equal(await page.locator("#ap-voice [data-controls]").isVisible(), false, "the player needs JavaScript, so it stays hidden");
    assert.equal(await page.locator("#ap-voice .ap-card.later").count(), 0, "without the player, the whole example shows");
    await page.locator(".ap-tab", { hasText: "Lead Qualification" }).click();
    assert.deepEqual(await shown("#autopilot .ap-demo", "id"), ["ap-qualify"]);

    assert.deepEqual(await shown(".as-panel", "id"), ["as-calls"]);
    await page.locator(".as-goal", { hasText: "Improve my website" }).click();
    assert.deepEqual(await shown(".as-panel", "id"), ["as-website"]);
  } finally {
    await tab.context.close();
  }
});

test("simulated demos: Play steps through on its own, Pause holds, the end stops it, and only the start and finish are counted", async () => {
  const tab = await open({ width: 1440, base: real });
  const { page } = tab;
  const caption = async () => (await page.locator("#ap-voice [data-at]:visible").textContent()).trim();
  try {
    await page.goto(real + "/");
    const demo = page.locator("#ap-voice");
    await demo.scrollIntoViewIfNeeded();
    assert.match(await caption(), /Press start/);
    await demo.locator("[data-play]").click();
    assert.match(await caption(), /^Step 1 of 6/);
    await page.waitForTimeout(2900);
    assert.match(await caption(), /^Step 2 of 6/, "it moves on by itself");
    await demo.locator("[data-play]").click(); // pause
    await page.waitForTimeout(2900);
    assert.match(await caption(), /^Step 2 of 6/, "paused, it holds");
    while (await demo.locator("[data-next]").isEnabled()) await demo.locator("[data-next]").click();
    assert.match(await caption(), /^Step 6 of 6/);
    assert.equal((await demo.locator("[data-play-label]").textContent()).trim(), "Watch it again");
    assert.equal(await demo.locator(".ap-card.later").count(), 0);
    await page.waitForTimeout(300);
    const counted = tab.beacons.map((b) => b.e).filter((e) => e.startsWith("demo_"));
    assert.deepEqual(counted, ["demo_start", "demo_complete"]);
    assert.deepEqual(tab.outside, []);
  } finally {
    await tab.context.close();
  }
});

test("the goal picker and the hero show only catalogue services, with their catalogue prices", async () => {
  const tab = await open({ width: 1440 });
  const { page } = tab;
  try {
    await go(page, "/");
    const byId = Object.fromEntries(services.map((s) => [s.id, s]));
    const cards = await page.$$eval(".as-card", (els) => els.map((el) => ({
      id: el.querySelector("a[href^='/contact/?service=']").getAttribute("href").split("=")[1],
      name: el.querySelector(".as-name").textContent.trim(),
      price: el.querySelector(".as-price").textContent,
    })));
    assert.ok(cards.length >= 12, `${cards.length} cards`);
    for (const c of cards) {
      assert.ok(byId[c.id], `${c.id} is in the catalogue`);
      assert.equal(c.name, byId[c.id].name);
      assert.ok(c.price.includes(byId[c.id].price), `${c.id}: ${c.price}`);
    }
    for (const a of await page.$$eval(".panel-svc", (els) => els.map((e) => ({ id: e.getAttribute("href").split("#")[1], text: e.textContent })))) {
      assert.ok(byId[a.id], a.id);
      assert.ok(a.text.includes(byId[a.id].price), `${a.id}: ${a.text}`);
    }
  } finally {
    await tab.context.close();
  }
});
