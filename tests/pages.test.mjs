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
import { services, plans, groups, variants, bundles, retired, estimable, consultOnly, dollars } from "../src/data/services.ts";
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
    // the quote form and the callback form both post without JavaScript, to the same inquiry service
    const actions = await page.locator("form[method='post']").evaluateAll((fs) => fs.map((f) => f.getAttribute("action")));
    assert.equal(actions.length, 2, "the quote form and the callback form");
    for (const action of actions) assert.match(action, /^https:\/\/[^/]+\/inquiry$/);
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
    // multi-page demos keep their plain demo form on an inner page (Lantern Row: the cancellation list; Mossgate: the
    // question form on the about page)
    const formPage = { "lantern-row-barbers": "booking/", "mossgate-cleaning": "about/" };
    for (const d of demoSites) {
      await go(page, `/example-sites/${d.slug}/${formPage[d.slug] ?? ""}`);
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
          else if (type === "number") await field.fill((await field.getAttribute("min")) ?? "2");
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
    // every quote link on the site points at an id the form knows and an answer it has
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

    await go(page, "/automation/"); // the goal picker lives here since approvals 87
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
    // at rest the first step is already filled in, and the later ones wait as empty outlines (approvals 89)
    const rest = await demo.locator(".ap-card:not(.later)").evaluateAll((els) => els.map((e) => e.dataset.from));
    assert.ok(rest.length > 0 && rest.every((f) => f === "1"), "only the first step's cards show before Start");
    assert.ok((await demo.locator(".ap-card.later").count()) > 0, "the later steps wait");
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

test("simulated demos on a phone: the cards play in a window that keeps the newest one on screen, and nothing below moves", async () => {
  // measured in the page: where the window, the newest card and the phone quote bar sit
  const measure = (page) => page.evaluate(() => {
    const d = document.querySelector("#ap-voice"), feed = d.querySelector(".ap-feed"), f = feed.getBoundingClientRect();
    const last = [...d.querySelectorAll(".ap-card:not(.later)")].at(-1)?.getBoundingClientRect();
    const bar = document.querySelector("[data-sticky]"), b = bar.getBoundingClientRect();
    return {
      section: Math.round(document.querySelector("#autopilot").getBoundingClientRect().height), y: Math.round(scrollY),
      win: [f.top, f.bottom], scrolls: feed.scrollHeight > feed.clientHeight + 1, overflow: getComputedStyle(feed).overflowY, tabindex: feed.getAttribute("tabindex"),
      newest: last ? [last.top, last.bottom] : null, floor: bar.classList.contains("is-on") && b.height ? b.top : innerHeight,
    };
  });
  for (const [width, height, reducedMotion] of [[390, 844, "no-preference"], [375, 667, "reduce"]]) {
    const tab = await open({ width, height, reducedMotion, hasTouch: true });
    const { page } = tab;
    try {
      await go(page, "/");
      const demo = page.locator("#ap-voice");
      await demo.locator("[data-play]").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      const idle = await measure(page);
      assert.ok(idle.scrolls && idle.win[1] - idle.win[0] <= height * 0.47, `${width}: the cards sit in a window under half the screen tall`);
      assert.equal(idle.overflow, "hidden", "before the first press the window doesn't scroll");
      assert.ok(idle.newest && idle.newest[0] >= idle.win[0] - 1 && idle.newest[1] <= idle.win[1] + 1, `${width}: at rest the first step's cards sit inside the window`);
      assert.equal(idle.tabindex, null, "and isn't a keyboard stop");

      await demo.locator("[data-next]").click();
      await page.waitForTimeout(900);
      const total = +(await demo.getAttribute("data-steps"));
      let pageY = null;
      for (let k = 1; k <= total; k++) {
        const m = await measure(page);
        assert.equal(m.section, idle.section, `${width}: step ${k} changes no height`);
        assert.ok(m.newest[0] >= m.win[0] - 1 && m.newest[1] <= m.win[1] + 1, `${width}: step ${k}'s newest card is inside the window`);
        assert.ok(m.win[0] >= 64 && m.win[1] <= m.floor, `${width}: the window is clear of the header and the quote bar`);
        assert.equal(m.tabindex, "0", "with cards in it, keys can scroll the window");
        if (pageY === null) pageY = m.y; else assert.equal(m.y, pageY, `${width}: after the first press the page itself never scrolls`);
        if (k < total) { await demo.locator("[data-next]").dispatchEvent("click"); await page.waitForTimeout(700); }
      }
      await demo.locator("[data-reset]").dispatchEvent("click");
      await page.waitForTimeout(500);
      const again = await measure(page);
      // Start over puts the first step back where it was at rest (measured from the window's own top)
      const inWindow = (m) => m.newest && Math.round(m.newest[0] - m.win[0]);
      assert.deepEqual([again.section, inWindow(again), again.tabindex, again.overflow], [idle.section, inWindow(idle), null, "hidden"]);
    } finally {
      await tab.context.close();
    }
  }

  // two columns: no window, no extra keyboard stop, the whole feed in the page as before
  const wide = await open({ width: 1440 });
  try {
    await go(wide.page, "/");
    await wide.page.locator("#ap-voice [data-play]").click();
    await wide.page.waitForTimeout(400);
    const m = await measure(wide.page);
    assert.deepEqual([m.scrolls, m.overflow, m.tabindex], [false, "visible", null]);
  } finally {
    await wide.context.close();
  }
});

test("the goal picker and the hero show only catalogue services, with their catalogue prices", async () => {
  const tab = await open({ width: 1440 });
  const { page } = tab;
  try {
    await go(page, "/automation/"); // the goal picker lives here since approvals 87
    const byId = Object.fromEntries(services.map((s) => [s.id, s]));
    const cards = await page.$$eval(".as-card", (els) => els.map((el) => ({
      id: el.querySelector("a[href^='/contact/?service=']").getAttribute("href").split("=")[1],
      name: el.querySelector(".as-name").textContent.trim(),
      price: el.querySelector(".as-price").textContent,
    })));
    assert.ok(cards.length >= 12, `${cards.length} cards`);
    for (const c of cards) {
      assert.ok(byId[c.id], `${c.id} is in the catalogue`);
      assert.equal(c.name.toLowerCase(), byId[c.id].name.toLowerCase()); // shown in Title Case (approvals 85)
      assert.ok(c.price.includes(byId[c.id].price), `${c.id}: ${c.price}`);
    }
    await go(page, "/"); // the hero's list of services
    assert.ok((await page.locator(".panel-svc").count()) > 0, "the hero lists services");
    for (const a of await page.$$eval(".panel-svc", (els) => els.map((e) => ({ id: e.getAttribute("href").split("#")[1], text: e.textContent })))) {
      assert.ok(byId[a.id], a.id);
      assert.ok(a.text.includes(byId[a.id].price), `${a.id}: ${a.text}`);
    }
  } finally {
    await tab.context.close();
  }
});

// ---- 2026-11 conversion upgrade: header menu, package estimator, a list of services on the quote form, phone quote button ----

test("header: Services, Pricing, Live Demos, Our Work, About and one quote button; the Services list works by click and keyboard and every link is a real page", async () => {
  const tab = await open({ width: 1440 });
  const { page } = tab;
  try {
    await go(page, "/");
    const top = await page.locator("header .nav-list > li").evaluateAll((lis) => lis.map((li) => (li.querySelector(":scope > details > summary, :scope > a")?.textContent ?? "").trim()));
    assert.deepEqual(top, ["Services", "Pricing", "Live Demos", "Our Work", "About"]);
    const cta = page.locator("header a.head-cta");
    assert.equal(await cta.count(), 1);
    assert.deepEqual([(await cta.textContent()).trim(), await cta.getAttribute("href"), await cta.isVisible()], ["Get a Free Quote", "/contact/", true]);

    const drop = page.locator("header [data-drop]");
    const isOpen = () => drop.evaluate((d) => d.open);
    assert.equal(await isOpen(), false, "closed until asked for");
    await drop.locator("summary").click();
    assert.equal(await isOpen(), true);
    const links = await drop.locator("a").evaluateAll((as) => as.map((a) => ({ name: a.textContent.trim(), href: a.getAttribute("href"), h: a.getBoundingClientRect().height })));
    assert.deepEqual(links.map((l) => l.name), ["AI & Business Automation", "AI Voice Receptionist", "Business Websites", "Website Levels", "E-Commerce", "Website Repairs & Security", "Video & Creative Studio", "All Services"]);
    for (const l of links) {
      const [path, hash] = l.href.split("#");
      assert.ok(urls.includes(path), `${l.name} -> ${l.href}`);
      assert.ok(l.h >= 40, `${l.name} is ${l.h}px tall`);
      if (hash) {
        const there = await open({ width: 1440 });
        try {
          await go(there.page, l.href);
          assert.equal(await there.page.locator(`[id="${hash}"]`).count(), 1, `${l.href} lands on something`);
        } finally {
          await there.context.close();
        }
      }
    }
    // Escape closes it and gives the keyboard back to its button
    await page.keyboard.press("Escape");
    assert.equal(await isOpen(), false);
    assert.equal(await page.evaluate(() => document.activeElement?.tagName), "SUMMARY");
    // Enter opens it, Tab walks its links, and tabbing on past the last one closes it
    await page.keyboard.press("Enter");
    assert.equal(await isOpen(), true);
    for (const l of links) {
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("href")), l.href);
      assert.equal(await isOpen(), true);
    }
    await page.keyboard.press("Tab");
    assert.equal(await isOpen(), false, "leaving the list closes it");
    // a click anywhere else closes it
    await drop.locator("summary").click();
    await page.locator("main h1").click();
    assert.equal(await isOpen(), false);
    // the page you are on is marked, and a service page marks Services
    await go(page, "/pricing/");
    assert.equal((await page.locator("header .nav-list [aria-current=page]").textContent()).trim(), "Pricing");
    await go(page, "/websites/");
    assert.ok(await page.locator("header [data-drop] > summary.is-current").count(), "Services is marked on a service page");
    assert.deepEqual(tab.errors, []);
  } finally {
    await tab.context.close();
  }

  // on a phone the same destinations are in the menu, with the quote form, each big enough to tap
  const phone = await open({ width: 390 });
  try {
    await go(phone.page, "/");
    const menu = phone.page.locator("header [data-menu]");
    const box = await menu.locator("summary").boundingBox();
    assert.ok(box.width >= 44 && box.height >= 44, `menu button ${box.width}x${box.height}`);
    assert.ok(box.x + box.width > 390 - 24, "the menu button sits at the right edge");
    await menu.locator("summary").click();
    const items = await menu.locator(".menu-panel a").evaluateAll((as) => as.map((a) => ({ href: a.getAttribute("href"), h: a.getBoundingClientRect().height, shown: a.getBoundingClientRect().width > 0 })));
    for (const href of ["/automation/", "/automation/#voice", "/websites/", "/ecommerce/", "/website-security/", "/solutions/", "/pricing/", "/demos/", "/portfolio/", "/about/", "/contact/"])
      assert.ok(items.some((i) => i.href === href && i.shown), `the phone menu has ${href}`);
    for (const i of items) assert.ok(i.h >= 44, `${i.href} is ${i.h}px tall`);
    await phone.page.keyboard.press("Escape");
    assert.equal(await menu.evaluate((d) => d.open), false);
    assert.deepEqual(phone.errors, []);
  } finally {
    await phone.context.close();
  }
});

test("package estimator: catalogue prices, one discount at a time, consultation services left out of the total, and only service ids go on to the quote form", async () => {
  const tab = await open({ width: 1440, base: real });
  const { page } = tab;
  const usd = (n) => "$" + n.toLocaleString("en-US");
  const listed = estimable.flatMap((g) => g.items);
  const price = Object.fromEntries(listed.map((s) => [s.id, dollars(s.price)]));
  const sum = (ids) => ids.reduce((t, id) => t + price[id], 0);
  try {
    await page.goto(real + "/pricing/");
    const est = page.locator("#package");
    await est.locator("details.est-group").evaluateAll((ds) => ds.forEach((d) => (d.open = true))); // (two groups start open; the tests use them all)

    // every box is a catalogue service; the ones added up carry their catalogue price, the rest are consultation-only
    const boxes = await est.locator("input[name=services]").evaluateAll((bs) => bs.map((b) => ({ id: b.value, price: b.dataset.price, consult: b.hasAttribute("data-consult"), row: b.closest("label").textContent })));
    assert.deepEqual(boxes.filter((b) => !b.consult).map((b) => b.id).sort(), listed.map((s) => s.id).sort());
    assert.deepEqual(boxes.filter((b) => b.consult).map((b) => b.id).sort(), consultOnly.map((s) => s.id).sort());
    for (const b of boxes) {
      const s = [...services, ...variants].find((x) => x.id === b.id);
      assert.ok(b.row.includes(s.price), `${b.id} shows ${s.price}`);
      if (b.consult) assert.match(b.row, /quoted separately, not added to the total/);
      else assert.equal(Number(b.price), price[b.id], b.id);
    }

    const tick = async (...ids) => { for (const id of ids) await est.locator(`input[name=services][value="${id}"]`).check(); };
    const reset = () => est.locator("input[name=services]").evaluateAll((bs) => bs.forEach((b) => b.checked && b.click()));
    const see = () => est.evaluate((el) => {
      const t = (s) => el.querySelector(s).textContent.trim(), gone = (s) => { const e = el.querySelector(s); return e.hidden || e.closest("[hidden]") !== null; };
      return { filled: !gone("[data-filled]"), sub: t("[data-subtotal]"), save: gone("[data-save-row]") ? "" : t("[data-save]"), label: t("[data-save-label]"), total: gone("[data-total-row]") ? "" : t("[data-total]"),
        lines: [...el.querySelectorAll("[data-lines] li")].map((li) => li.textContent), hint: gone("[data-hint]") ? "" : t("[data-hint]"), go: t("[data-go]"), said: t("[data-status]") };
    });

    // nothing ticked: no total, and the button is the plain quote form
    let s = await see();
    assert.deepEqual([s.filled, s.go], [false, "Get a Free Quote"]);
    assert.match(await est.textContent(), /Estimated starting price\. Final scope and price are confirmed in writing\./);

    // one service: its price, nothing off
    await tick("reviews");
    s = await see();
    assert.deepEqual([s.filled, s.total, s.save, s.go], [true, usd(price.reviews), "", "Get This Setup"]);
    assert.match(s.hint, /Add a second one-time service and the total is 10% off/);
    assert.match(s.said, /1 service chosen\. Estimated starting total/);

    // two that are not a preset bundle: 10% off; a third: 15% off, on the whole list
    await tick("booking");
    s = await see();
    let ids = ["reviews", "booking"], off = Math.floor(sum(ids) * 0.1);
    assert.deepEqual([s.sub, s.save, s.total], [usd(sum(ids)), "−" + usd(off), usd(sum(ids) - off)]);
    assert.match(s.label, /2 services together: 10% off/);
    await tick("google-profile");
    s = await see();
    ids = ["reviews", "booking", "google-profile"]; off = Math.floor(sum(ids) * 0.15);
    assert.deepEqual([s.sub, s.save, s.total], [usd(sum(ids)), "−" + usd(off), usd(sum(ids) - off)]);
    assert.match(s.label, /3 services together: 15% off/);

    // each preset bundle, ticked service by service: the bundle price or the percentage, whichever is lower, never both
    for (const b of bundles) {
      await reset();
      await tick(...b.items);
      s = await see();
      const bundleOff = sum(b.items) - dollars(b.price), multi = Math.floor((sum(b.items) * (b.items.length >= 3 ? 15 : 10)) / 100), best = Math.max(bundleOff, multi);
      assert.equal(s.save, "−" + usd(best), `${b.id}: one discount`);
      assert.equal(s.total, usd(sum(b.items) - best), b.id);
      assert.notEqual(s.total, usd(sum(b.items) - bundleOff - multi), `${b.id}: the two discounts are not added together`);
      if (bundleOff >= multi) {
        assert.equal(s.total, b.price, `${b.id} shows its published price`);
        assert.ok(s.label.includes(b.name), s.label);
      }
    }

    // a consultation-only service can be ticked so it travels with the request, but it adds nothing to the total
    await reset();
    await tick("reviews", consultOnly[0].id);
    s = await see();
    assert.equal(s.total, usd(price.reviews));
    assert.equal(s.save, "");
    assert.ok(s.lines.some((l) => l.includes(consultOnly[0].name) && l.includes("quoted separately")), s.lines.join(" | "));
    assert.match(s.hint, /quoted separately, so it isn’t in this total/);
    await reset();
    await tick(consultOnly[0].id);
    s = await see();
    assert.deepEqual([s.filled, s.total, s.go], [true, "", "Get This Setup"], "a consultation-only choice shows no dollar total at all");

    // a smaller version and its full version are one job: ticking one unticks the other
    const small = listed.find((x) => x.alt && listed.some((y) => y.id === x.alt));
    if (small) {
      await reset();
      await tick(small.alt, small.id);
      assert.equal(await est.locator(`input[value="${small.alt}"]`).isChecked(), false);
      assert.equal((await see()).total, usd(price[small.id]));
    }

    // on to the quote form: the address carries catalogue ids and nothing else
    const leave = async () => { await Promise.all([page.waitForURL(/\/contact\//), est.locator("button[type=submit]").click()]); return page.url().slice(real.length); };
    await reset();
    await tick("follow-up", "missed-calls", "reviews");
    const order = boxes.map((b) => b.id).filter((id) => ["follow-up", "missed-calls", "reviews"].includes(id));
    assert.equal(await leave(), `/contact/?services=${order.join(",")}`);
    await page.goto(real + "/pricing/");
    await reset();
    assert.equal(await leave(), "/contact/", "nothing ticked opens the plain form");
    const whole = bundles.find((b) => sum(b.items) - dollars(b.price) >= Math.floor((sum(b.items) * (b.items.length >= 3 ? 15 : 10)) / 100));
    await page.goto(real + "/pricing/");
    await est.locator("details.est-group").evaluateAll((ds) => ds.forEach((d) => (d.open = true))); // (two groups start open; the tests use them all)
    await reset();
    await tick(...whole.items);
    assert.equal(await leave(), `/contact/?service=${whole.id}`, "exactly a preset bundle asks for that bundle");
    assert.ok((await page.locator("[data-about]").textContent()).includes(whole.name));

    // what was counted: that the estimator was used and its button pressed, never what was chosen
    await page.waitForTimeout(200);
    assert.ok(tab.beacons.some((b) => b.e === "estimator_use"), JSON.stringify(tab.beacons));
    assert.ok(tab.beacons.some((b) => b.e === "cta_estimator"), JSON.stringify(tab.beacons));
    for (const b of tab.beacons) {
      assert.deepEqual(Object.keys(b).filter((k) => !["e", "p", "r"].includes(k)), [], JSON.stringify(b));
      assert.match(b.e, /^[a-z0-9_]{1,32}$/);
      assert.match(b.p, /^\/[a-z0-9/-]*$/, "the page path only, without the chosen services");
    }
    assert.deepEqual(tab.posts, []);
    assert.deepEqual(tab.outside, []);
    assert.deepEqual(tab.errors, []);
  } finally {
    await tab.context.close();
  }

  // without JavaScript the list and its prices are all there, and the button still opens the quote form with the ticks
  const plain = await open({ width: 390, javaScriptEnabled: false });
  try {
    await go(plain.page, "/pricing/");
    const form = plain.page.locator("#package form");
    assert.deepEqual([await form.getAttribute("action"), await form.getAttribute("method")], ["/contact/", "get"]);
    assert.equal(await form.locator("input[name=services]").count(), listed.length + consultOnly.length);
    assert.equal(await form.locator("[data-filled]").isVisible(), false, "no total is shown that a script would have to work out");
  } finally {
    await plain.context.close();
  }
});

test("quote form: services chosen in the estimator are named, listed in the project box where they can be changed, and taken back out; only catalogue ids count", async () => {
  const tab = await open({ width: 390 });
  const { page } = tab;
  try {
    await go(page, "/contact/?services=follow-up,missed-calls,reviews");
    const known = await page.locator("[data-inquiry]").evaluate((el) => JSON.parse(el.dataset.services));
    const names = ["follow-up", "missed-calls", "reviews"].map((id) => known[id].name);
    const about = page.locator("[data-about]");
    const need = page.locator("#f-need");
    assert.equal(await about.isVisible(), true);
    for (const n of names) assert.ok((await about.textContent()).includes(n), n);
    assert.match(await about.locator("[data-about-clear]").textContent(), /^Not these: remove them from the request$/);
    assert.equal(await page.locator("[name=service]").inputValue(), "follow-up", "the server takes one id: the first");
    assert.equal(await need.inputValue(), `I’d like a price for: ${names.join(", ")}.\n`);
    assert.equal(await page.locator("[name=want]:checked").inputValue(), known["follow-up"].want);
    // "Not these" takes all of it back out
    await about.locator("[data-about-clear]").click();
    assert.equal(await about.isVisible(), false);
    assert.deepEqual([await page.locator("[name=service]").inputValue(), await need.inputValue()], ["", ""]);

    // once the visitor has written something of their own, their words stay
    await go(page, "/contact/?services=follow-up,missed-calls");
    await need.fill((await need.inputValue()) + "We are a two-person plumbing shop.");
    await about.locator("[data-about-clear]").click();
    assert.match(await need.inputValue(), /two-person plumbing shop/);

    // the form posted without JavaScript sends ?services=a&services=b: the same list
    await go(page, "/contact/?services=reviews&services=booking");
    assert.ok((await about.textContent()).includes(known.reviews.name) && (await about.textContent()).includes(known.booking.name));

    // anything that is not a catalogue id is dropped, and nothing in the address is ever written into the page as HTML
    await go(page, "/contact/?services=" + encodeURIComponent('reviews,<img src=x onerror="document.title=1">,not-a-service,REVIEWS,../x,reviews'));
    assert.equal(await page.locator("[name=service]").inputValue(), "reviews");
    assert.match(await about.textContent(), new RegExp(known.reviews.name));
    assert.match(await about.locator("[data-about-clear]").textContent(), /^Not this one/);
    assert.equal(await need.inputValue(), "", "one service is named at the top only");
    assert.equal(await page.locator("[data-inquiry] img").count(), 0);
    assert.notEqual(await page.title(), "1");
    await go(page, "/contact/?services=" + encodeURIComponent("<script>,nope"));
    assert.equal(await about.isVisible(), false);
    assert.equal(await page.locator("[name=service]").inputValue(), "");

    // a very long list is cut at twelve
    const many = Object.keys(known).slice(0, 20);
    await go(page, `/contact/?services=${many.join(",")}`);
    assert.equal((await need.inputValue()).length, `I’d like a price for: ${many.slice(0, 12).map((id) => known[id].name).join(", ")}.\n`.length);

    // what happens next is said beside the button, and loading the page with a list sent nothing anywhere
    await go(page, "/contact/");
    assert.match(await page.locator(".inq-next").textContent(), /You’ll receive a written recommendation and price\. No sales call is required\./);
    assert.deepEqual(tab.posts, []);
    assert.deepEqual(tab.outside, []);
    assert.deepEqual(tab.errors, []);
  } finally {
    await tab.context.close();
  }
});

test("phone quote button: absent at the top, shown mid-page clear of the header, out of the way at the last box and the footer, and closed for the visit once dismissed", async () => {
  const tab = await open({ width: 390, height: 780 });
  const { page } = tab;
  const on = () => page.locator("[data-sticky]").evaluate((b) => !b.hidden && b.classList.contains("is-on"));
  const at = async (target, want, why) => {
    await page.evaluate((t) => (t === "end" ? scrollTo(0, document.body.scrollHeight) : document.querySelector(t).scrollIntoView({ block: t === "[data-final]" ? "center" : "start" })), target);
    await page.waitForFunction((w) => { const b = document.querySelector("[data-sticky]"); return (!b.hidden && b.classList.contains("is-on")) === w; }, want, { timeout: 3000 }).catch(() => {});
    assert.equal(await on(), want, why);
  };
  try {
    await go(page, "/");
    await page.waitForTimeout(300);
    assert.equal(await on(), false, "not shown on arrival");
    await at("#how", true, "shown while reading how it works");
    await page.waitForTimeout(400); // (its fade)
    const m = await page.evaluate(() => {
      const r = (e) => e.getBoundingClientRect(), bar = document.querySelector("[data-sticky]");
      const [a, x] = [bar.querySelector("a"), bar.querySelector("[data-sticky-close]")].map(r);
      return { top: r(bar).top, bottom: r(bar).bottom, head: r(document.querySelector("header")).bottom, vh: innerHeight, vw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth,
        a: [a.width, a.height], x: [x.width, x.height], href: bar.querySelector("a").getAttribute("href"), label: bar.querySelector("[data-sticky-close]").getAttribute("aria-label"), seen: getComputedStyle(bar).visibility };
    });
    assert.equal(m.seen, "visible");
    assert.ok(m.bottom <= m.vh && m.top > m.vh - 96, `it is a short bar at the bottom: ${m.top}-${m.bottom} of ${m.vh}`);
    assert.ok(m.top > m.head, "clear of the header");
    assert.ok(m.a[1] >= 44 && m.x[0] >= 44 && m.x[1] >= 44, `targets ${m.a} and ${m.x}`);
    assert.equal(m.sw, m.vw, "no sideways scroll with the bar showing");
    assert.deepEqual([m.href, m.label], ["/contact/", "Hide the quote button"]);
    await at("[data-final]", false, "the last box is the same button");
    await at("end", false, "the footer is never covered");
    // (hidden means out of the keyboard's way too)
    assert.equal(await page.locator("[data-sticky]").evaluate((b) => getComputedStyle(b).visibility), "hidden");
    // dismissed: gone now, and still gone after a reload in the same visit
    await at("#how", true, "back mid-page");
    await page.locator("[data-sticky-close]").click();
    assert.equal(await on(), false);
    await page.reload({ waitUntil: "load" });
    await page.evaluate(() => document.getElementById("how").scrollIntoView());
    await page.waitForTimeout(600);
    assert.equal(await on(), false, "stays closed for the visit");
    assert.deepEqual(tab.outside, []);
    assert.deepEqual(tab.errors, []);
  } finally {
    await tab.context.close();
  }
  // never on a computer, and never without JavaScript (the header and the last box already have the button)
  for (const options of [{ width: 1440, height: 900 }, { width: 390, height: 780, javaScriptEnabled: false }]) {
    const other = await open(options);
    try {
      await go(other.page, "/#how");
      await other.page.waitForTimeout(400);
      assert.equal(await other.page.locator("[data-sticky]").evaluate((b) => getComputedStyle(b).display), "none", JSON.stringify(options));
    } finally {
      await other.context.close();
    }
  }
});

test("the homepage in its new order: one h1, the sections in the brief's sequence, and every in-page link lands", async () => {
  const tab = await open({ width: 1440 });
  const { page } = tab;
  try {
    await go(page, "/");
    assert.equal(await page.locator("h1").count(), 1);
    const order = await page.locator("main > section[id], main > section[data-final]").evaluateAll((ss) => ss.map((s) => s.id || "final"));
    const want = ["what-we-do", "website-levels", "portfolio", "autopilot", "how", "handover", "why-nuxy", "home-faq", "final"];
    assert.deepEqual(order.filter((id) => want.includes(id)), want);
    // headings go h1 > h2 > h3 without skipping a level
    const levels = await page.locator("main :is(h1, h2, h3, h4)").evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
    for (let i = 1; i < levels.length; i++) assert.ok(levels[i] - levels[i - 1] <= 1, `heading ${i} jumps from h${levels[i - 1]} to h${levels[i]}`);
    const anchors = await page.locator("a[href^='#'], a[href^='/#']").evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href").split("#")[1]))].filter(Boolean));
    for (const id of anchors) assert.equal(await page.locator(`[id="${id}"]`).count(), 1, `#${id}`);
    // the five trust lines are the brief's, and none of them is a number about clients
    const trust = await page.locator("#why-nuxy .trust h3").allTextContents();
    assert.deepEqual(trust, ["Clear Pricing", "Your Accounts", "Tested Before Launch", "No Long Contracts", "Direct Support"]);
    assert.doesNotMatch(await page.locator("#why-nuxy").textContent(), /\d+\s*(\+|%)?\s*(clients|customers|businesses served|reviews|stars)/i);
    // the goal picker and the estimator are linked from under the demos, and each is on its own page once (approvals 87)
    for (const [route, id] of [["/automation/", "what-to-automate"], ["/pricing/", "package"]]) {
      assert.equal(await page.locator(`[id="${id}"]`).count(), 0, `#${id} is off the home page`);
      assert.equal(await page.locator(`#autopilot a[href="${route}#${id}"]`).count(), 1, `the home link to ${route}#${id}`);
    }
    for (const [route, id] of [["/automation/", "what-to-automate"], ["/pricing/", "package"]]) {
      await go(page, route);
      assert.equal(await page.locator(`[id="${id}"]`).count(), 1, `${route}#${id}`);
      const ids = await page.locator("[id]").evaluateAll((els) => els.map((e) => e.id));
      assert.deepEqual(ids.filter((x, i) => ids.indexOf(x) !== i), [], `${route} has no id twice`);
    }
    assert.deepEqual(tab.errors, []);
  } finally {
    await tab.context.close();
  }
});
