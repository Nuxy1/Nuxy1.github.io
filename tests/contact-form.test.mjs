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
import { services, wants } from "../src/data/services.ts";
import { emailTypo as siteTypo } from "../src/lib/email-typo.ts";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "..", "dist");
const agent = process.env.INQUIRY_JS;
if (!agent || !existsSync(agent)) throw new Error("Set INQUIRY_JS to the inquiry service's src/inquiry.js (see the header of this file).");
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE || "playwright-core");
const { inquiryStore, hitCounter, startPublic, emailTypo: serverTypo } = await import(pathToFileURL(agent).href);
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
  // The site scrolls smoothly (Base.astro), so under CPU load Playwright's own scroll before a click or check can keep
  // chasing a page that is still gliding ("element is not stable") until it times out. A person scrolls first and then
  // taps, so here every click and check jumps its target into view at once, then acts. Measured 2026-11-09 on the no-JS
  // submit, 4 runs in parallel: 39 stalls in 40 without this, 0 in 48 with it. Real motion stays on for everything else.
  for (const name of ["click", "check"]) {
    const act = page[name].bind(page);
    page[name] = async (selector, options) => {
      await page.locator(selector).first().evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
      return act(selector, options);
    };
  }
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(site + path);
  return { page, context, sent, errors };
}
// (picks "What do you need?" unless want is ""; the optional fields are opened first when one is given)
const fill = async (page, values = {}) => {
  const { want = "automation", ...typed } = values;
  const v = { name: "Test Person", business: "Example Plumbing Co", email: "owner@example.com", need: "We miss calls while on jobs and lose quote requests.", ...typed };
  if (want) await page.check(`[name=want][value="${want}"]`);
  if (["website", "type", "tools"].some((k) => k in v)) await page.evaluate(() => { document.querySelector(".inq-more").open = true; });
  for (const [k, val] of Object.entries(v)) await page.fill(`[name="${k}"]`, val);
  return { want, ...v };
};
const wantLabel = (id) => wants.find((w) => w.id === id).label;
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
  // ("What do you need?" is one group of choices: its error sits on the group, and focus goes to its first choice)
  assert.equal(await page.getAttribute("#f-want", "data-invalid"), "");
  assert.match(await page.textContent("#f-want-err"), /Choose what you need/);
  for (const name of ["name", "business", "email", "need"]) {
    assert.equal(await page.getAttribute(`[name=${name}]`, "aria-invalid"), "true", name);
    assert.ok((await page.textContent(`#f-${name}-err`)).length > 5, name);
  }
  assert.equal(await page.isHidden("#f-type-err"), true, "type of business is optional");
  assert.equal(await page.evaluate(() => [document.activeElement?.getAttribute("name"), document.activeElement?.value]).then((a) => a.join(" ")), `want ${wants[0].id}`);
  assert.equal(sent.inquiry.length, 0);
  // a bad email and a too-short message get their own messages, and fixing clears them as you type
  await fill(page, { email: "owner@example", need: "hi" });
  assert.equal(await page.isHidden("#f-want-err"), true, "choosing clears its error");
  assert.equal(await page.getAttribute("#f-want", "data-invalid"), null);
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
  // (the service it came from is named at the top and picks its answer; the customer doesn't have to)
  assert.equal(await page.inputValue("[name=service]"), "booking");
  assert.ok((await page.textContent("[data-about]")).includes(services.find((s) => s.id === "booking").name));
  assert.equal(await page.isChecked("[name=want][value=automation]"), true);
  await page.waitForTimeout(2600); // (a person takes longer than 2.5 s; faster posts are kept as likely spam)
  const v = await fill(page, { want: "", phone: "507-555-0134" });
  await page.click(".inq-more > summary");
  await page.selectOption("[name=timeline]", "month");
  await page.selectOption("[name=budget]", "500-1000");
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
  assert.equal(saved.want, "automation");
  assert.equal(saved.phone, "507-555-0134");
  assert.equal(saved.timeline, "month");
  assert.equal(saved.budget, "500-1000");
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
  assert.equal(await page.isHidden("[data-about]"), true);
  assert.equal(await page.locator("[name=want]:checked").count(), 0);
  const { page: p2, context: c2 } = await open(`/contact/?service=${encodeURIComponent('"]x')}&want=${encodeURIComponent('"]x')}`);
  assert.equal(await p2.inputValue("[name=service]"), "");
  assert.equal(await p2.locator("[name=want]:checked").count(), 0);
  await context.close();
  await c2.close();
});

test("?want= picks an answer, and wins over the service's own", async () => {
  for (const [query, picked, service] of [["?want=shopify", "shopify", ""], ["?service=site-fixes", "redesign", "site-fixes"], ["?service=site-fixes&want=new-website", "new-website", "site-fixes"], ["?want=everything", null, ""]]) {
    const { page, context, errors } = await open(`/contact/${query}`);
    const checked = await page.locator("[name=want]:checked");
    assert.equal(await checked.count(), picked ? 1 : 0, query);
    if (picked) assert.equal(await checked.getAttribute("value"), picked, query);
    assert.equal(await page.inputValue("[name=service]"), service, query);
    assert.equal(await page.isHidden("[data-about]"), !service, query);
    assert.deepEqual(errors, []);
    await context.close();
  }
});

test("'Not this one' takes the service off the request", async () => {
  const { page, context } = await open("/contact/?service=booking");
  await page.click("[data-about-clear]");
  assert.equal(await page.inputValue("[name=service]"), "");
  assert.equal(await page.isHidden("[data-about]"), true);
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("name")), "want");
  assert.match(await page.textContent("[data-status]"), /Removed/);
  await page.waitForTimeout(2600);
  await fill(page, { want: "other", email: "notthis@example.com" });
  await page.click("[data-submit]");
  await panel(page, "done").waitFor({ state: "visible" });
  const saved = store.find(await page.textContent("[data-ref]"));
  assert.equal(saved.service, "");
  assert.equal(saved.want, "other");
  await context.close();
});

test("a likely email typo is asked about, and changed only when the customer says yes", async () => {
  const { page, context, errors } = await open("/contact/");
  const tip = page.locator("[data-tip-box]");
  await page.fill("[name=email]", "owner@gmial.com");
  await page.locator("[name=email]").blur();
  await tip.waitFor({ state: "visible" });
  assert.equal(await page.textContent("[data-tip-address]"), "owner@gmail.com");
  assert.equal(await page.inputValue("[name=email]"), "owner@gmial.com", "nothing changed yet");
  await page.click("[data-tip-use]");
  assert.equal(await page.inputValue("[name=email]"), "owner@gmail.com");
  assert.equal(await tip.isHidden(), true);
  // a real domain that is close to a known one is left alone
  await page.fill("[name=email]", "owner@yahoo.ca");
  await page.locator("[name=email]").blur();
  assert.equal(await tip.isHidden(), true);
  // "No, it's right" keeps what they typed, and the question isn't asked again for it
  await page.fill("[name=email]", "owner@hotmial.com");
  await page.locator("[name=email]").blur();
  await tip.waitFor({ state: "visible" });
  await page.click("[data-tip-keep]");
  assert.equal(await tip.isHidden(), true);
  await page.locator("[name=email]").blur();
  assert.equal(await tip.isHidden(), true);
  await page.waitForTimeout(2600);
  await fill(page, { email: "owner@hotmial.com", business: "Typo Kept Co" });
  await page.click("[data-submit]");
  await panel(page, "done").waitFor({ state: "visible" });
  const saved = store.find(await page.textContent("[data-ref]"));
  assert.equal(saved.email, "owner@hotmial.com", "stored as typed; the business sees the flag instead");
  assert.deepEqual(errors, []);
  await context.close();
});

test("the page's typo check and the server's agree", () => {
  const known = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com", "live.com", "msn.com", "comcast.net", "sbcglobal.net", "proton.me"];
  const near = new Set(["yahoo.ca", "yahoo.co.uk", "hotmail.co.uk", "mail.com", "gmx.com", "hollowoak.com", "example.com", "gmail.company", ""]);
  // (every one-letter slip of the common domains: a letter dropped, doubled, swapped or replaced)
  for (const d of known) {
    for (let i = 0; i < d.length; i++) {
      near.add(d.slice(0, i) + d.slice(i + 1));
      near.add(d.slice(0, i) + d[i] + d.slice(i));
      if (i < d.length - 1) near.add(d.slice(0, i) + d[i + 1] + d[i] + d.slice(i + 2));
      for (const c of "aeimnot") near.add(d.slice(0, i) + c + d.slice(i + 1));
    }
  }
  let suggested = 0;
  for (const domain of near) {
    const email = `someone@${domain}`;
    assert.equal(siteTypo(email), serverTypo(email), email);
    if (serverTypo(email)) suggested++;
  }
  assert.ok(suggested > 200, `only ${suggested} suggestions`);
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
  const v = await fill(page, { need: "Line one\nLine two of what I need.", type: "Plumbing" });
  await page.selectOption("[name=timeline]", "asap");
  await page.selectOption("[name=budget]", "lt500");
  await page.check("[name=contact][value=either]");
  await page.click("[data-submit]");
  await panel(page, "fail").waitFor({ state: "visible" });
  assert.match(await page.textContent("[data-fail] h2"), /NOT sent/);
  assert.match(await page.textContent("[data-fail-text]"), /NOT saved/);
  assert.equal(await panel(page, "done").isHidden(), true);
  const href = await page.getAttribute("[data-mailto]", "href");
  const mail = new URL(href);
  assert.equal(mail.protocol, "mailto:");
  assert.match(mail.searchParams.get("subject"), /^Setup request: Quote requests/);
  const body = mail.searchParams.get("body");
  // (the choices read as the customer saw them, not as codes)
  for (const value of [`What I need: ${wantLabel(v.want)}`, v.name, v.business, v.email, "Type of business: Plumbing", "When: As soon as possible", "Budget: Under $500", "Best way to reach me: Either", "Line one\nLine two"]) assert.ok(body.includes(value), value);
  assert.ok(!body.includes("lt500") && !body.includes("asap"), body);
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
  // an error for something the customer can't see or fix here is a failure, not a silent stop
  const { page: p2, context: c2 } = await open("/contact/", {
    answer: (route) => route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ ok: false, errors: { service: "Unknown service." }, message: "Please fix the marked fields." }) }),
  });
  await fill(p2);
  await p2.click("[data-submit]");
  await panel(p2, "fail").waitFor({ state: "visible" });
  assert.match(await p2.textContent("[data-fail-text]"), /fix the marked fields/);
  await c2.close();
});

test("without JavaScript the form still sends and lands on the thank-you page", async () => {
  const { page, context } = await open("/contact/", { js: false });
  const v = await fill(page, { email: "nojs@example.com", want: "new-website" });
  await Promise.all([page.waitForURL(/\/contact\/thanks\//), page.click("[data-submit]")]);
  const ref = new URL(page.url()).searchParams.get("ref");
  assert.match(ref, REF);
  assert.equal(store.find(ref).business, v.business);
  assert.equal(store.find(ref).want, "new-website");
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
