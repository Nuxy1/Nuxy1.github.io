// Contact form, end to end, against the production build in dist/ and the real inquiry service code (src/inquiry.js,
// kept in the private business repo; INQUIRY_JS points at it) on a throwaway store. Nothing leaves this computer: the browser's
// requests to preview.nuxyautomation.com are answered by the local server, and no email is sent.
//
//   npm run build
//   INQUIRY_JS=<path to the inquiry service's src/inquiry.js> PLAYWRIGHT_CORE=<path to a playwright-core folder> \
//   BROWSER=<path to chrome.exe or msedge.exe> node --test tests/
//
// (playwright-core is not a dependency of the site: point PLAYWRIGHT_CORE at any copy, e.g. one npx downloaded)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { serveDist } from "./serve-dist.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "..", "dist");
const agent = process.env.INQUIRY_JS;
if (!agent || !existsSync(agent)) throw new Error("Set INQUIRY_JS to the inquiry service's src/inquiry.js (see the header of this file).");
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE || "playwright-core");
const { inquiryStore, hitCounter, startPublic } = await import(pathToFileURL(agent).href);
const LIVE = "https://preview.nuxyautomation.com";
// The site counts visits only on its real address, so the browser is told that name means this computer: the pages are
// served locally under the real host name, and the inquiry service sees the origin it will see in production.
const HOST = new URL((await import("../astro.config.mjs")).default.site).hostname;
const REF = /^NX-\d{6}-[A-Z0-9]{4}$/;

let site, api, web, inq, browser, dir, store, hits, notified;
const logs = [];
before(async () => {
  assert.ok(existsSync(join(dist, "contact", "index.html")), "run npm run build first");
  web = await serveDist(dist);
  site = `http://${HOST}:${new URL(web.url).port}`;
  dir = mkdtempSync(join(tmpdir(), "nuxy-form-"));
  store = inquiryStore(join(dir, "inquiries.json"), (m) => logs.push(m));
  hits = hitCounter(join(dir, "hits.json"), { log: (m) => logs.push(m) });
  notified = 0;
  inq = startPublic({ port: 0, store, hits, notify: () => notified++, log: (m) => logs.push(m), siteUrl: site, origins: [site], limits: { attempts: 1000, tenMinutes: 1000, day: 1000, allDay: 1000, hits: 1000 } });
  await new Promise((ok) => inq.listening ? ok() : inq.once("listening", ok));
  api = `http://127.0.0.1:${inq.address().port}`;
  browser = await chromium.launch({ executablePath: process.env.BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true,
    args: [`--host-resolver-rules=MAP ${HOST} 127.0.0.1`, "--disable-features=HttpsUpgrades"] });
});
after(async () => {
  await browser?.close();
  inq?.close();
  web?.close();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

// A page whose requests to the live server go to the local one instead. `answer` can replace the server's reply.
async function open(path, { js = true, answer, width = 1280, height = 900 } = {}) {
  const context = await browser.newContext({ javaScriptEnabled: js, viewport: { width, height } });
  const sent = { inquiry: [], hit: [] };
  await context.route(`${LIVE}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const kind = url.pathname === "/hit" ? "hit" : "inquiry";
    sent[kind].push(req.postData() ?? "");
    if (kind === "inquiry" && answer) return answer(route);
    const res = await route.fetch({ url: api + url.pathname + url.search, maxRedirects: 0, headers: { ...req.headers(), "x-forwarded-for": "203.0.113.7" } });
    await route.fulfill({ response: res });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(site + path);
  return { page, context, sent, errors };
}
const fill = async (page, values = {}) => {
  const v = { name: "Test Person", business: "Example Plumbing Co", email: "owner@example.com", type: "Plumbing", need: "We miss calls while on jobs and lose quote requests.", ...values };
  for (const [k, val] of Object.entries(v)) await page.fill(`[name="${k}"]`, val);
  return v;
};
const panel = (page, which) => page.locator(`[data-${which}]`);

test("the form is labelled, and nothing on the page errors", async () => {
  const { page, context, errors } = await open("/contact/");
  const unlabelled = await page.$$eval("form input:not([type=hidden]):not([name=nx_hp]), form select, form textarea", (els) =>
    els.filter((el) => !(el.labels?.length) && !el.closest("label")).map((el) => el.name));
  assert.deepEqual(unlabelled, []);
  // (the hidden trap field is out of reach for people and screen readers)
  assert.equal(await page.getAttribute("#f-hp", "tabindex"), "-1");
  assert.equal(await page.$eval("#f-hp", (el) => el.closest("[aria-hidden=true]") !== null), true);
  assert.deepEqual(errors, []);
  await context.close();
});

test("empty submit shows an error on each required field, focuses the first, and sends nothing", async () => {
  const { page, context, sent } = await open("/contact/");
  await page.click("[data-submit]");
  for (const name of ["name", "business", "email", "type", "need"]) {
    assert.equal(await page.getAttribute(`[name=${name}]`, "aria-invalid"), "true", name);
    assert.ok((await page.textContent(`#f-${name}-err`)).length > 5, name);
  }
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("name")), "name");
  assert.equal(sent.inquiry.length, 0);
  // a bad email and a too-short message get their own messages, and fixing clears them as you type
  await fill(page, { email: "owner@example", need: "hi" });
  await page.click("[data-submit]");
  assert.match(await page.textContent("#f-email-err"), /email address like/);
  assert.match(await page.textContent("#f-need-err"), /at least 10/);
  await page.fill("[name=email]", "owner@example.com");
  assert.equal(await page.getAttribute("[name=email]", "aria-invalid"), "false");
  assert.equal(sent.inquiry.length, 0);
  await context.close();
});

test("a real request is saved, shows its reference, and the page count carries no answers", async () => {
  const { page, context, sent } = await open("/contact/?service=booking");
  assert.equal(await page.inputValue("[name=service]"), "booking");
  await page.waitForTimeout(2600); // (a person takes longer than 2.5 s; faster posts are kept as likely spam)
  const v = await fill(page);
  await page.click(".inq-more > summary");
  await page.fill("[name=phone]", "507-555-0134");
  await page.selectOption("[name=budget]", "300-600");
  await page.check("[name=contact][value=email]");
  await page.click("[data-submit]");
  await panel(page, "done").waitFor({ state: "visible" });
  const ref = await page.textContent("[data-ref]");
  assert.match(ref, REF);
  assert.equal(await page.textContent("[data-email]"), v.email);
  assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute("data-done")), true);
  assert.equal(await page.isHidden("form"), true);
  const saved = store.find(ref);
  assert.equal(saved.business, v.business);
  assert.equal(saved.service, "booking");
  assert.equal(saved.budget, "300-600");
  assert.equal(saved.contact, "email");
  assert.equal(saved.stage, "new", "not treated as spam");
  assert.equal(notified > 0, true);
  // (the anonymous count says "form_submit" and the page, nothing typed)
  await page.waitForTimeout(300);
  assert.ok(sent.hit.some((b) => new URLSearchParams(b).get("e") === "form_submit"), "form_submit counted");
  for (const body of sent.hit) {
    assert.deepEqual([...new URLSearchParams(body).keys()].filter((k) => !["e", "p", "r"].includes(k)), []);
    assert.ok(!body.includes("example") && !body.includes("Test"), body);
  }
  assert.ok(!logs.join("\n").includes(v.email), "no email address in the server log");
  await context.close();
});

test("an unknown ?service= is ignored", async () => {
  const { page, context } = await open("/contact/?service=not-a-service");
  assert.equal(await page.inputValue("[name=service]"), "");
  const { page: p2, context: c2 } = await open(`/contact/?service=${encodeURIComponent('"]x')}`);
  assert.equal(await p2.inputValue("[name=service]"), "");
  await context.close();
  await c2.close();
});

test("sending twice gives the same reference (the server's duplicate guard)", async () => {
  const refs = [];
  for (let i = 0; i < 2; i++) {
    const { page, context } = await open("/contact/");
    await page.waitForTimeout(2600);
    await fill(page, { email: "twice@example.com", need: "Same request sent twice by a nervous customer." });
    await page.click("[data-submit]");
    await panel(page, "done").waitFor({ state: "visible" });
    refs.push(await page.textContent("[data-ref]"));
    await context.close();
  }
  assert.equal(refs[0], refs[1]);
});

test("when the server fails, the page says NOT sent and offers the answers as an email", async () => {
  const { page, context } = await open("/contact/?service=quotes", {
    answer: (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ ok: false, message: "Your message was NOT saved because of a problem on our side." }) }),
  });
  const v = await fill(page, { need: "Line one\nLine two of what I need." });
  await page.click("[data-submit]");
  await panel(page, "fail").waitFor({ state: "visible" });
  assert.match(await page.textContent("[data-fail] h2"), /NOT sent/);
  assert.match(await page.textContent("[data-fail-text]"), /NOT saved/);
  assert.equal(await panel(page, "done").isHidden(), true);
  const href = await page.getAttribute("[data-mailto]", "href");
  const mail = new URL(href);
  assert.equal(mail.protocol, "mailto:");
  assert.match(mail.searchParams.get("subject"), /^Setup request: /);
  const body = mail.searchParams.get("body");
  for (const value of [v.name, v.business, v.email, v.type, "Line one\nLine two"]) assert.ok(body.includes(value), value);
  // back to the form with everything still filled in
  await page.click("[data-retry]");
  assert.equal(await page.inputValue("[name=business]"), v.business);
  assert.equal(await page.isEnabled("[data-submit]"), true);
  await context.close();
});

test("when the server can't be reached, the page says NOT sent", async () => {
  const { page, context } = await open("/contact/", { answer: (route) => route.abort("connectionrefused") });
  await fill(page);
  await page.click("[data-submit]");
  await panel(page, "fail").waitFor({ state: "visible" });
  assert.match(await page.textContent("[data-fail-text]"), /couldn’t reach/);
  await context.close();
});

test("a 200 without a reference is still treated as NOT sent", async () => {
  const { page, context } = await open("/contact/", { answer: (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<html>proxy page</html>" }) });
  await fill(page);
  await page.click("[data-submit]");
  await panel(page, "fail").waitFor({ state: "visible" });
  await context.close();
});

test("the server's field errors appear next to the fields", async () => {
  const { page, context } = await open("/contact/", {
    answer: (route) => route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ ok: false, errors: { email: "That email address doesn't look complete." }, message: "Please fix the marked fields." }) }),
  });
  await fill(page);
  await page.click("[data-submit]");
  await page.waitForSelector("#f-email-err:not([hidden])");
  assert.match(await page.textContent("#f-email-err"), /doesn't look complete/);
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("name")), "email");
  assert.equal(await panel(page, "fail").isHidden(), true);
  await context.close();
});

test("without JavaScript the form still sends and lands on the thank-you page", async () => {
  const { page, context } = await open("/contact/", { js: false });
  const v = await fill(page, { email: "nojs@example.com" });
  await Promise.all([page.waitForURL(/\/contact\/thanks\//), page.click("[data-submit]")]);
  const ref = new URL(page.url()).searchParams.get("ref");
  assert.match(ref, REF);
  assert.equal(store.find(ref).business, v.business);
  assert.equal(store.find(ref).stage, "new", "no-JS sends no timing, so it isn't treated as too fast");
  assert.match(await page.textContent("h1"), /got your request/);
  await context.close();
});

test("the thank-you page shows only a well-formed reference", async () => {
  const { page, context } = await open("/contact/thanks/?ref=NX-261109-ABCD");
  assert.equal(await page.textContent("[data-ref]"), "NX-261109-ABCD");
  const { page: p2, context: c2 } = await open("/contact/thanks/?ref=%3Cimg%20src%3Dx%3E");
  assert.equal(await p2.isHidden("[data-ref-line]"), true);
  assert.equal(await page.getAttribute('meta[name="robots"]', "content"), "noindex, nofollow");
  await context.close();
  await c2.close();
});

test("the contact page fits every screen width with no sideways scroll", async () => {
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    const { page, context } = await open("/contact/", { width, height: 800 });
    await page.click(".inq-more > summary"); // (with the optional fields open too)
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.equal(over, 0, `${width}px overflows by ${over}px`);
    await context.close();
  }
});

test("the sitemap lists the contact page but not the thank-you page", async () => {
  const xml = readFileSync(join(dist, "sitemap.xml"), "utf8");
  assert.ok(xml.includes("/contact/</loc>"));
  assert.ok(!xml.includes("/contact/thanks/"));
});
