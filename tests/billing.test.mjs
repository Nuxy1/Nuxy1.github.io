// Monthly-plan sign-up (data/billing.ts, pages/get-started, pages/billing), checked three ways:
//  1. the site's questions against the service's rules (src/eligibility.js): every choice id the page offers is one the
//     service accepts, and every id the service knows is on the page;
//  2. both builds: with the flag off (dist/) nothing of the sign-up is built and the plan cards still ask for a quote;
//     with it on (BILLING_DIST) the pages exist, are noindex, and carry no key, secret or price id;
//  3. end to end in a browser against the real billing routes (src/billing/routes.js) on a fake database and a fake
//     Stripe. Nothing leaves this computer: the browser's calls to preview.nuxyautomation.com are answered locally, and
//     the redirect to checkout.stripe.com is caught before it goes anywhere.
//
//   npm run build
//   PUBLIC_BILLING_CHECKOUT=true npx astro build --outDir <folder outside the repo>
//   BILLING_DIST=<that folder> INQUIRY_JS=<agent>/src/inquiry.js PLAYWRIGHT_CORE=<playwright-core> BROWSER=<Edge> \
//   node --test tests/billing.test.mjs
//
// (build the flag-on site with no PUBLIC_BILLING_URL: the page's CSP only allows the real service address)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { serveDist } from "./serve-dist.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const offDist = process.env.SITE_DIST || join(here, "..", "dist");
const onDist = process.env.BILLING_DIST;
if (!onDist || !existsSync(join(onDist, "get-started", "care", "index.html"))) throw new Error("Set BILLING_DIST to a PUBLIC_BILLING_CHECKOUT=true build (see the header of this file).");
const agent = process.env.INQUIRY_JS;
if (!agent || !existsSync(agent)) throw new Error("Set INQUIRY_JS to the inquiry service's src/inquiry.js (see the header of this file).");
const src = dirname(agent);
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE || "playwright-core");
const { startPublic, inquiryStore, hitCounter } = await import(pathToFileURL(agent).href);
const { billingRoutes } = await import(pathToFileURL(join(src, "billing", "routes.js")).href);
const { parseAnswers, PLANS } = await import(pathToFileURL(join(src, "eligibility.js")).href);
const rulesText = readFileSync(join(src, "eligibility.js"), "utf8");
const LIVE = "https://preview.nuxyautomation.com";
const HOST = new URL((await import("../astro.config.mjs")).default.site).hostname;
const REF = "NX-0123456789";

// ---- 1. the questions match the rules ----
// (read from the built pages, i.e. what ships: data/billing.ts reads import.meta.env, which plain Node doesn't have)

const html = (path) => readFileSync(join(onDist, path, "index.html"), "utf8");
const unescape = (s) => s.replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
const attr = (tag, name) => { const v = tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]; return v === undefined ? undefined : unescape(v); };
// name → [values] of every radio and checkbox answer on a sign-up page
const choicesOn = (page) => {
  const out = {};
  const form = page.slice(page.search(/<form\b[^>]*\sdata-form[\s>=]/), page.indexOf("</form>")); // (the footer has its own Motion radios)
  assert.ok(form.length > 100, "sign-up form not found");
  for (const [tag] of form.matchAll(/<input\b[^>]*>/g)) {
    const type = attr(tag, "type"), name = attr(tag, "name");
    if ((type === "radio" || type === "checkbox") && name) (out[name] ??= []).push(attr(tag, "value"));
  }
  return out;
};
const carePage = html("get-started/care");
const starterPage = html("get-started/automation-starter");
const root = (page) => page.match(/<div[^>]*\sdata-signup[\s>][^>]*>|<div[^>]*\sdata-signup="[^"]*"[^>]*>/)[0];
const outcomes = JSON.parse(attr(root(carePage), "data-outcomes"));
const disclosure = readFileSync(join(here, "..", "src", "data", "billing.ts"), "utf8").match(/export const disclosure =\s*"([^"]+)"/)[1];
const selfServePlans = Object.keys(PLANS).filter((k) => PLANS[k].selfServe);

const care ={ plan: "care", platform: "squarespace", siteState: "working", domainControl: "me", accountOwner: "me", canInvite: "yes", sensitive: ["none"] };
const starter = { plan: "automation-starter", tools: ["zapier"], workflowCount: "2", workflowState: "working", builtBy: "me-or-team", accountOwner: "me", canInvite: "yes", sensitive: ["none"] };
const accepted = (base, name, id) => {
  const a = { ...base, [name]: Array.isArray(base[name]) ? [id] : id };
  if (name === "workflowState" && id === "not-built") a.workflowCount = "0";
  return parseAnswers(a);
};
// The keys of one const object in eligibility.js (e.g. WEBSITE_PLATFORMS), read from the source: they aren't exported.
const keysOf = (name) => {
  const m = rulesText.match(new RegExp(`const ${name} = (?:Object\\.freeze\\()?\\{([^}]*)\\}`));
  assert.ok(m, `${name} not found in eligibility.js`);
  return [...m[1].matchAll(/(?:^|[,{\s])"?([a-z0-9-]+)"?\s*:/g)].map((k) => k[1]);
};
const listOf = (name) => {
  const m = rulesText.match(new RegExp(`const ${name} = (?:Object\\.freeze\\()?\\[([^\\]]*)\\]`));
  assert.ok(m, `${name} not found in eligibility.js`);
  return [...m[1].matchAll(/"([a-z0-9-]+)"/g)].map((k) => k[1]);
};

test("every choice the page offers is one the service accepts", () => {
  for (const [base, page] of [[care, carePage], [starter, starterPage]]) {
    for (const [name, ids] of Object.entries(choicesOn(page))) for (const id of ids) {
      const r = accepted(base, name, id);
      assert.ok(r.ok, `${base.plan} ${name}=${id}: ${r.ok ? "" : r.errors.join("; ")}`);
    }
  }
});

test("every answer the service knows is on the page, and nothing else", () => {
  const web = choicesOn(carePage), auto = choicesOn(starterPage);
  const want = (rule) => [...new Set(rule)].sort();
  const pairs = [
    [web, "platform", keysOf("WEBSITE_PLATFORMS")], [web, "siteState", listOf("SITE_STATE")], [web, "domainControl", listOf("DOMAIN_CONTROL")],
    [auto, "tools", keysOf("AUTOMATION_TOOLS")], [auto, "workflowState", listOf("WORKFLOW_STATE")], [auto, "builtBy", listOf("BUILT_BY")],
  ];
  for (const set of [web, auto]) pairs.push([set, "accountOwner", listOf("ACCOUNT_OWNER")], [set, "canInvite", listOf("YES_NO_UNKNOWN")], [set, "sensitive", keysOf("SENSITIVE")]);
  for (const [set, field, rule] of pairs) assert.deepEqual([...set[field]].sort(), want(rule), field);
  assert.deepEqual(Object.keys(web).sort(), ["accountOwner", "canInvite", "domainControl", "platform", "sensitive", "siteState"]);
  assert.deepEqual(Object.keys(auto).sort(), ["accountOwner", "builtBy", "canInvite", "sensitive", "tools", "workflowState"]);
});

test("the plan limit, the self-serve plans and the outcomes match the service", () => {
  assert.match(starterPage, new RegExp(`covers up to ${PLANS["automation-starter"].maxWorkflows}\\. A workflow is`));
  assert.equal((carePage.match(/name="workflowCount"/g) ?? []).length, 0);
  assert.equal((starterPage.match(/name="workflowCount"/g) ?? []).length, 1);
  assert.deepEqual(Object.keys(outcomes).sort(), ["custom_quote", "eligible", "manual_review", "needs_clarification", "unsupported"]);
  for (const [k, o] of Object.entries(outcomes)) if (k !== "eligible") for (const b of [o.body, o.withSuggestion ?? o.body]) assert.match(b, /^Nothing has been charged/, k);
});

// ---- 2. the builds ----

const files = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]));

test("with the flag off, nothing of the sign-up is built and the plan cards ask for a quote", () => {
  assert.equal(existsSync(join(offDist, "get-started")), false);
  assert.equal(existsSync(join(offDist, "billing")), false);
  const pricing = readFileSync(join(offDist, "pricing", "index.html"), "utf8");
  assert.doesNotMatch(pricing, /get-started|Billed monthly: charged today/);
  for (const id of Object.keys(PLANS)) assert.match(pricing, new RegExp(`href="/contact/\\?service=${id}"[^>]*>Get a Free Quote`), id);
});

test("with the flag on, the pages exist, aren't indexed, and carry no secret or price id", () => {
  const pages = ["get-started/care", "get-started/automation-starter", "billing/thanks", "billing/cancelled"];
  for (const p of pages) {
    const html = readFileSync(join(onDist, p, "index.html"), "utf8");
    assert.match(html, /<meta name="robots" content="noindex, nofollow"/, p);
    assert.doesNotMatch(html, /rel="canonical"/, p);
  }
  for (const p of ["get-started/care", "get-started/automation-starter"]) {
    const html = readFileSync(join(onDist, p, "index.html"), "utf8");
    assert.ok(html.includes(`data-endpoint="${LIVE}/billing"`), p);
    assert.ok(html.includes(disclosure), p);
  }
  // Only the two self-serve plans get a page: the others stay a conversation.
  assert.deepEqual(readdirSync(join(onDist, "get-started")).sort(), [...selfServePlans].sort());
  // Self-serve plans start the sign-up; the others still begin with a conversation, never a checkout.
  const pricing = readFileSync(join(onDist, "pricing", "index.html"), "utf8");
  for (const id of Object.keys(PLANS)) {
    const card = selfServePlans.includes(id) ? `href="/get-started/${id}/"` : `href="/contact/?service=${id}`;
    assert.ok(pricing.includes(card), id);
  }
  assert.equal((pricing.match(new RegExp(disclosure.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length, selfServePlans.length);
  // Nothing secret anywhere in the build: no Stripe key, webhook secret or price id (prices come from the database).
  const leaks = files(onDist).filter((f) => /\.(html|js|css|json|txt|xml)$/.test(f))
    .filter((f) => /\b(sk|rk)_(test|live)_|\bwhsec_|\bprice_[A-Za-z0-9]{8,}/.test(readFileSync(f, "utf8")));
  assert.deepEqual(leaks, []);
});

// ---- 3. in the browser ----

// The billing database's functions, kept in memory (the shape of src/billing/db.js's answers).
function fakeDb() {
  const invitations = new Map();
  const cases = [];
  const db = {
    invitations, cases,
    plans: async () => [
      { key: "care", active: true, self_serve: true },
      { key: "automation-starter", active: true, self_serve: true },
      { key: "automation-growth", active: true, self_serve: false },
      { key: "automation-partner", active: true, self_serve: false },
    ],
    caseOpen: async (a) => (cases.push(a), { status: "ok", case_id: `case-${cases.length}`, public_ref: REF }),
    inviteAuto: async (caseId, hash) => {
      const plan = cases.at(-1).answers.plan;
      invitations.set(hash, { status: "ok", invitation_id: `inv-${caseId}`, public_ref: REF, plan_key: plan, plan_name: plan,
        price_id: "price_TESTONLY", amount_cents: 7900, currency: "usd", contact_email: "owner@example.com", business_name: "Example Bakery",
        session_id: null, session_count: 0, expires_at: "2026-11-21T12:00:00.000Z" });
      return "2026-11-21T12:00:00.000Z";
    },
    inviteOpen: async (hash) => invitations.get(hash) ?? { status: "not_found", public_ref: null },
    inviteSession: async (hash, session) => {
      const inv = invitations.get(hash);
      const previous = inv.session_id;
      inv.session_id = session;
      inv.session_count += 1;
      return { status: "ok", previous_session: previous };
    },
    tx: async (fn) => fn(db),
  };
  return db;
}
function fakeStripe() {
  const sessions = [];
  return {
    sessions,
    async post(path, body) {
      if (path !== "/v1/checkout/sessions") return { status: "expired" };
      const id = `cs_test_${String(sessions.length + 1).padStart(12, "a")}`;
      const s = { id, url: `https://checkout.stripe.com/c/pay/${id}`, status: "open", expires_at: body.expires_at, metadata: body.metadata, body };
      sessions.push(s);
      return s;
    },
    async get(path) {
      const s = sessions.find((x) => x.id === path.split("/").at(-1));
      if (!s) throw new Error("No such checkout session");
      return s;
    },
  };
}

let web, inq, api, site, browser, db, stripe, scratch;
const logs = [];
before(async () => {
  web = await serveDist(onDist);
  site = `http://${HOST}:${new URL(web.url).port}`;
  db = fakeDb();
  stripe = fakeStripe();
  const billing = billingRoutes({ db, stripe, siteUrl: site, log: (l) => logs.push(l), limits: { apply: 1000, applyDay: 1000, checkout: 1000 } });
  // (the contact form's store and counter are never touched here: only /billing/* is called)
  scratch = mkdtempSync(join(tmpdir(), "nuxy-billing-"));
  inq = startPublic({ port: 0, store: inquiryStore(join(scratch, "inquiries.json"), () => {}), hits: hitCounter(join(scratch, "hits.json"), { log: () => {} }),
    notify: () => {}, log: (m) => logs.push(m), siteUrl: site, origins: [site], billing });
  await new Promise((ok) => (inq.listening ? ok() : inq.once("listening", ok)));
  api = `http://127.0.0.1:${inq.address().port}`;
  browser = await chromium.launch({ executablePath: process.env.BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true,
    args: [`--host-resolver-rules=MAP ${HOST} 127.0.0.1`, "--disable-features=HttpsUpgrades"] });
});
after(async () => {
  await browser?.close();
  inq?.close();
  web?.close();
  if (scratch) rmSync(scratch, { recursive: true, force: true });
});

// A page whose calls to the live service go to the local one. `answer(route, path)` can replace a reply.
async function open(path, { js = true, answer, width = 1280, height = 900, motion = "no-preference" } = {}) {
  const context = await browser.newContext({ javaScriptEnabled: js, viewport: { width, height }, reducedMotion: motion });
  const sent = [];
  await context.route(`${LIVE}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.pathname.startsWith("/billing/")) sent.push( // (not the site-wide /hit visit counter)
      { path: url.pathname, body: new URLSearchParams(req.postData() ?? "") });
    if (answer && (await answer(route, url.pathname)) !== false) return;
    const res = await route.fetch({ url: api + url.pathname + url.search, maxRedirects: 0, headers: { ...req.headers(), "x-forwarded-for": "203.0.113.7" } });
    await route.fulfill({ response: res });
  });
  const stripePages = [];
  await context.route("https://checkout.stripe.com/**", (route) => {
    stripePages.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Stripe test stand-in</title><p>stand-in</p>" });
  });
  const page = await context.newPage();
  // (same as contact-form.test.mjs: jump the target into view, then act, so smooth scrolling can't stall a click)
  for (const name of ["click", "check", "uncheck"]) {
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
  return { page, context, sent, errors, stripePages };
}
const CONTACT = { name: "Test Person", email: "owner@example.com", business: "Example Bakery" };
async function answer(page, values) {
  for (const [k, v] of Object.entries(values)) {
    if (["name", "email", "business", "website", "note", "workflowCount"].includes(k)) await page.fill(`[name="${k}"]`, v);
    else for (const one of [v].flat()) await page.check(`[name="${k}"][value="${one}"]`);
  }
}
const careAnswers = (o = {}) => ({ platform: "squarespace", siteState: "working", domainControl: "me", accountOwner: "me", canInvite: "yes", sensitive: "none", ...CONTACT, ...o });
const starterAnswers = (o = {}) => ({ tools: ["zapier", "google-workspace"], workflowCount: "2", workflowState: "working", builtBy: "me-or-team", accountOwner: "my-team", canInvite: "yes", sensitive: "none", ...CONTACT, ...o });
const submit = async (page) => {
  await page.click("[data-submit]");
  await page.locator("[data-result]").waitFor({ state: "visible" });
};
const text = (page, sel) => page.locator(sel).innerText();
const visible = (page, sel) => page.locator(sel).isVisible();

test("an eligible Website Care application asks for consent, then goes to Stripe's checkout", async () => {
  const { page, context, sent, errors, stripePages } = await open("/get-started/care/");
  // Every question is labelled, and the form says what is required.
  const unlabelled = await page.$$eval("[data-form] input:not([type=hidden]), [data-form] textarea", (els) =>
    els.filter((el) => !el.labels?.length && !el.closest("label")).map((el) => el.name));
  assert.deepEqual(unlabelled, []);
  await answer(page, careAnswers({ website: "examplebakery.com" }));
  await submit(page);
  assert.equal(await page.getAttribute("[data-result]", "data-decision"), "eligible");
  assert.equal(await text(page, "[data-r-title]"), outcomes.eligible.title);
  assert.equal(await text(page, "[data-r-ref]"), REF);
  assert.equal(await visible(page, "[data-pay]"), true);
  assert.match(await text(page, "[data-pay]"), /Billed monthly: charged today/);
  assert.match(await text(page, "[data-expires]"), /^This checkout link works until /);
  assert.equal(await page.evaluate(() => document.activeElement?.matches("[data-result]")), true);
  // The application carried the answers and nothing the server would trust for money.
  const apply = sent.find((s) => s.path === "/billing/apply").body;
  assert.equal(apply.get("plan"), "care");
  assert.equal(apply.get("platform"), "squarespace");
  for (const k of ["price", "amount", "price_id", "priceId"]) assert.equal(apply.has(k), false, k);
  // No consent, no checkout.
  await page.click("[data-checkout]");
  assert.equal(await visible(page, "[data-consent-err]"), true);
  assert.equal(sent.filter((s) => s.path === "/billing/checkout").length, 0);
  assert.equal(await page.evaluate(() => document.activeElement?.matches("[data-consent]")), true);
  await page.check("[data-consent]");
  assert.equal(await visible(page, "[data-consent-err]"), false);
  await Promise.all([page.waitForURL(/^https:\/\/checkout\.stripe\.com\//), page.click("[data-checkout]")]);
  assert.equal(stripePages.length, 1);
  const s = stripe.sessions.at(-1);
  assert.equal(stripePages[0], s.url);
  // The session is a test-mode subscription for the plan's own price, and comes back to the site's return pages.
  assert.equal(s.body.mode, "subscription");
  assert.deepEqual(s.body.line_items, [{ price: "price_TESTONLY", quantity: 1 }]);
  assert.equal(s.body.allow_promotion_codes, false);
  assert.equal(s.body.success_url, `${site}/billing/thanks/?ref=${REF}`);
  assert.equal(s.body.cancel_url, `${site}/billing/cancelled/?ref=${REF}`);
  assert.deepEqual(errors, []);
  await context.close();
});

test("each other answer gets its own outcome, and nothing can be paid", async () => {
  const cases = [
    ["/get-started/care/", careAnswers({ platform: "unknown" }), "needs_clarification", /what the website is built on/],
    ["/get-started/care/", careAnswers({ platform: "wordpress" }), "manual_review", /A person checks this platform/],
    ["/get-started/care/", careAnswers({ siteState: "not-built" }), "custom_quote", /A new website is a one-time project/],
    ["/get-started/care/", careAnswers({ sensitive: "moves-money" }), "unsupported", /outside what Nuxy offers/],
    ["/get-started/automation-starter/", starterAnswers({ workflowCount: "4" }), "needs_clarification", /covers up to 2 workflows; 4 fits a larger plan/],
  ];
  for (const [path, values, decision, reason] of cases) {
    const { page, context, sent, errors } = await open(path);
    await answer(page, values);
    await submit(page);
    assert.equal(await page.getAttribute("[data-result]", "data-decision"), decision, decision);
    assert.equal(await text(page, "[data-r-title]"), outcomes[decision].title, decision);
    assert.match(await text(page, "[data-r-reasons]"), reason, decision);
    assert.equal(await visible(page, "[data-pay]"), false, decision);
    // One way forward per result: the old second "quote" button is gone (critique 16), the suggest button leads.
    assert.equal(await page.locator("[data-quote]").count(), 0, decision);
    // The body offers "the plan that fits" only when that button is shown.
    const suggested = await visible(page, "[data-suggest]");
    assert.equal(await text(page, "[data-r-body]"), (suggested && outcomes[decision].withSuggestion) || outcomes[decision].body, decision);
    if (decision === "needs_clarification" && path.includes("automation")) {
      assert.equal(await visible(page, "[data-suggest]"), true);
      assert.match(await text(page, "[data-suggest]"), /^Ask about Automation Growth/);
      assert.match(await page.getAttribute("[data-suggest]", "href"), /^\/contact\/\?service=automation-growth\b/);
      // The contact form gets the reference, so the conversation links to this case (critique 18).
      assert.match(await page.getAttribute("[data-suggest]", "href"), new RegExp(`[?&]ref=${REF}(&|#|$)`));
    }
    // "Change my answers" brings the form back with the answers kept, on the answer that needs more detail.
    await page.click("[data-edit]");
    if (decision === "needs_clarification") {
      const want = path.includes("automation") ? "workflowCount" : "platform";
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("name")), want, decision);
    }
    assert.equal(await visible(page, "[data-form]"), true);
    assert.equal(await visible(page, "[data-result]"), false);
    assert.equal(await page.isChecked(`[name="accountOwner"][value="${values.accountOwner}"]`), true);
    assert.equal(sent.filter((s) => s.path === "/billing/checkout").length, 0);
    assert.deepEqual(errors, [], decision);
    await context.close();
  }
});

test("the result badge shows one icon: a check when eligible, an info mark otherwise", async () => {
  const shown = (page) => page.$$eval("[data-badge] svg", (els) => els.filter((el) => getComputedStyle(el).display !== "none").length);
  for (const [values, decision] of [[careAnswers(), "eligible"], [careAnswers({ platform: "wordpress" }), "manual_review"]]) {
    const { page, context, errors } = await open("/get-started/care/");
    await answer(page, values);
    await submit(page);
    assert.equal(await page.getAttribute("[data-result]", "data-decision"), decision);
    assert.equal(await shown(page), 1, decision);
    assert.deepEqual(errors, [], decision);
    await context.close();
  }
});

test("a workflow count over the plan's limit points to the plan that covers it, before anything is sent", async () => {
  const { page, context, sent, errors } = await open("/get-started/automation-starter/");
  assert.equal(await visible(page, "[data-over]"), false);
  await page.fill('[name="workflowCount"]', "4");
  assert.equal(await visible(page, "[data-over]"), true);
  assert.match(await text(page, "[data-over]"), /^4 is more than Automation Starter covers \(2\)\. Automation Growth covers up to \d+\. You can still send your answers here\.$/);
  assert.match(await page.getAttribute("[data-over] a", "href"), /^\/(get-started|contact)\//);
  assert.match(await page.getAttribute('[name="workflowCount"]', "aria-describedby"), /\bo-workflowCount\b/);
  await page.fill('[name="workflowCount"]', "999");
  assert.match(await text(page, "[data-over]"), /more than any monthly plan covers\. You can ask for a written quote instead\.$/);
  await page.fill('[name="workflowCount"]', "2");
  assert.equal(await visible(page, "[data-over]"), false);
  assert.equal(sent.length, 0);
  assert.deepEqual(errors, []);
  await context.close();
});

test("leaving checkout keeps the answers for this tab: the cancelled page links back and the form fills in", async () => {
  const { page, context, errors } = await open("/get-started/care/");
  await answer(page, careAnswers({ website: "examplebakery.com", platform: "wix" }));
  await submit(page);
  await page.check("[data-consent]");
  await Promise.all([page.waitForURL(/^https:\/\/checkout\.stripe\.com\//), page.click("[data-checkout]")]);
  await page.goto(`${site}/billing/cancelled/?ref=${REF}`);
  assert.equal(await page.getAttribute("[data-back]", "href"), "/get-started/care/");
  assert.equal(await text(page, "[data-back]"), "Back to your answers");
  // Kept: the answers only, never the checkout token.
  const kept = await page.evaluate(() => sessionStorage.getItem("nuxy-signup"));
  assert.doesNotMatch(kept, /token|checkout|cs_test/i);
  await page.click("[data-back]");
  await page.waitForURL(/\/get-started\/care\/$/);
  assert.equal(await page.inputValue('[name="website"]'), "examplebakery.com");
  assert.equal(await page.inputValue('[name="email"]'), CONTACT.email);
  assert.equal(await page.isChecked('[name="platform"][value="wix"]'), true);
  assert.match(await text(page, "#signup-legend"), /^Your earlier answers are filled in/);
  // Used once: a reload starts empty, and the thanks page drops anything left.
  assert.equal(await page.evaluate(() => sessionStorage.getItem("nuxy-signup")), null);
  await page.reload();
  assert.equal(await page.inputValue('[name="website"]'), "");
  await page.evaluate(() => sessionStorage.setItem("nuxy-signup", JSON.stringify({ plan: "care", at: Date.now(), answers: [] })));
  await page.goto(`${site}/billing/thanks/?ref=${REF}`);
  assert.equal(await text(page, "[data-plan-line]"), "Your plan: Website Care, $79 a month");
  assert.equal(await page.locator(".next li").count(), 3);
  assert.equal(await page.evaluate(() => sessionStorage.getItem("nuxy-signup")), null);
  assert.deepEqual(errors, []);
  await context.close();
});

test("the page checks the answers before sending anything", async () => {
  const { page, context, sent, errors } = await open("/get-started/automation-starter/");
  await page.click("[data-submit]");
  // (tools, state, count, built by, owner, invite, sensitive, name, email, business); focus goes to the first, the tools
  // (the count is asked right after "Are the workflows running today?", critique 16)
  assert.equal(await text(page, "[data-status]"), "10 answers need a look.");
  assert.equal(sent.length, 0);
  // Focus goes to the summary at the top of the form, so the count shows before the first field (critique 19).
  assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute("data-summary")), true);
  assert.equal(await page.getAttribute("#f-workflowCount", "aria-invalid"), "true");
  assert.equal(await page.getAttribute("fieldset.field:has([name=tools])", "data-invalid"), "");
  assert.equal(await text(page, "[data-err=tools]"), "Choose at least one answer.");
  // The same count shows by the button, with one jump link per question (critique 18).
  assert.equal(await visible(page, "[data-summary]"), true);
  assert.equal(await text(page, "[data-summary] p"), "10 answers need a look.");
  assert.equal(await page.locator("[data-summary] li a").count(), 10);
  // The page's styles reach the lines the script builds (critique 20: scoped rules missed them).
  assert.equal(await page.$eval("[data-summary] p", (e) => getComputedStyle(e).fontWeight), "600");
  assert.equal(await page.$eval("[data-summary] a", (e) => getComputedStyle(e).display), "inline-block");
  assert.equal(await text(page, "[data-summary] li:first-child a"), "Which tools do the workflows run in?");
  assert.equal(await page.getAttribute("[data-summary] li:first-child a", "href"), "#q-tools");
  await page.click("[data-summary] a[href='#f-email']");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "f-email");
  // A bad email is named as soon as the field is left.
  await page.fill("#f-email", "owner@example");
  await page.locator("#f-email").blur();
  assert.equal(await text(page, "[data-err=email]"), "Enter an email address like name@business.com.");
  assert.equal(await page.getAttribute("#f-email", "aria-invalid"), "true");
  await page.fill("#f-email", "owner@example.com");
  assert.equal(await page.getAttribute("#f-email", "aria-invalid"), "false");
  // 0 workflows only fits "Not built yet".
  await page.check('[name=workflowState][value=working]');
  await page.fill("#f-workflowCount", "0");
  await page.locator("#f-workflowCount").blur();
  assert.match(await text(page, "[data-err=workflowCount]"), /^0 only fits “Not built yet”/);
  await page.check('[name=workflowState][value=not-built]');
  assert.equal(await visible(page, "[data-err=workflowCount]"), false);
  // "None of these" and a sensitive answer clear each other.
  await page.check('[name=sensitive][value=health-info]');
  await page.check('[name=sensitive][value=none]');
  assert.equal(await page.isChecked('[name=sensitive][value=health-info]'), false);
  await page.check('[name=sensitive][value=children-data]');
  assert.equal(await page.isChecked('[name=sensitive][value=none]'), false);
  assert.equal(sent.length, 0);
  assert.deepEqual(errors, []);
  await context.close();
});

test("answers changed in the browser are refused by the service and shown next to the question", async () => {
  const { page, context, sent, errors } = await open("/get-started/care/");
  await answer(page, careAnswers());
  // (a visitor edits the page to send an answer the service doesn't know)
  await page.$eval('[name=platform][value=squarespace]', (el) => { el.value = "frontpage"; });
  await page.click("[data-submit]");
  await page.locator("[data-problem-box]").waitFor({ state: "visible" });
  assert.equal(await text(page, "[data-problem-box]"), "Please check the highlighted answers.");
  assert.equal(await visible(page, "[data-err=platform]"), true);
  assert.match(await text(page, "[data-err=platform]"), /^Not accepted: /);
  assert.equal(await page.getAttribute("fieldset.field:has([name=platform])", "data-invalid"), "");
  // Focus goes to the refused answer itself, not to the box by the button.
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("name")), "platform");
  assert.equal(await visible(page, "[data-result]"), false);
  assert.deepEqual(sent.map((s) => s.path), ["/billing/apply"]);
  // Chromium logs the 400 itself; that is the only error.
  assert.equal(errors.length, 1);
  assert.match(errors[0], /status of 400/);
  await context.close();

  // A plan the visitor swapped in by hand gets no checkout link: Growth starts with a conversation.
  const second = await open("/get-started/automation-starter/");
  await answer(second.page, starterAnswers());
  await second.page.$eval("[name=plan]", (el) => { el.value = "automation-growth"; });
  await submit(second.page);
  assert.equal(await second.page.getAttribute("[data-result]", "data-decision"), "manual_review");
  assert.equal(await visible(second.page, "[data-pay]"), false);
  assert.match(await text(second.page, "[data-r-reasons]"), /starts with a conversation/);
  assert.deepEqual(second.errors, []);
  await second.context.close();
});

test("when the service can't be reached, the page says nothing was sent or charged", async () => {
  const { page, context, errors } = await open("/get-started/care/", { answer: (route) => route.abort("connectionrefused") });
  await answer(page, careAnswers());
  await page.click("[data-submit]");
  await page.locator("[data-problem-box]").waitFor({ state: "visible" });
  assert.match(await text(page, "[data-problem-box]"), /nothing was sent and nothing was charged/);
  assert.equal(await page.isEnabled("[data-submit]"), true);
  // Focus lands on the message, not on the page body the disabled button dropped it to (critique 18).
  assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute("data-problem-box")), true);
  // ...and the message is on screen, at any width (critique 20: it sat below the fold at 1440).
  await page.waitForFunction(() => {
    const r = document.querySelector("[data-problem-box]").getBoundingClientRect();
    return r.top >= 0 && r.bottom <= innerHeight;
  }, null, { timeout: 3000 });
  assert.ok(errors.every((e) => /Failed to load resource|ERR_/.test(e)), errors.join("\n"));
  await context.close();
});

test("a failed checkout keeps the visitor on the page with the service's words", async () => {
  const { page, context, errors } = await open("/get-started/care/", {
    answer: (route, path) => path === "/billing/checkout"
      ? route.fulfill({ status: 502, contentType: "application/json", headers: { "access-control-allow-origin": site }, body: JSON.stringify({ ok: false, message: "We couldn't open checkout just now. Nothing was charged." }) })
      : false,
  });
  await answer(page, careAnswers());
  await submit(page);
  await page.check("[data-consent]");
  await page.click("[data-checkout]");
  await page.locator("[data-checkout-err]").waitFor({ state: "visible" });
  assert.equal(await text(page, "[data-checkout-err]"), "We couldn't open checkout just now. Nothing was charged.");
  assert.equal(await page.isEnabled("[data-checkout]"), true);
  assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute("data-checkout-err")), true);
  assert.ok(page.url().startsWith(site));
  assert.ok(errors.every((e) => /status of 502/.test(e)), errors.join("\n"));
  await context.close();
});

test("the contact form starts the message with a sign-up reference, and only a real one", async () => {
  for (const [ref, want] of [[REF, `About my monthly-plan sign-up, reference ${REF}: `], ["<b>x</b>", ""], ["NX-12345", ""]]) {
    const { page, context, errors } = await open(`/contact/?service=automation-growth&ref=${encodeURIComponent(ref)}`);
    assert.equal(await page.inputValue("#f-need"), want, ref);
    assert.deepEqual(errors, [], ref);
    await context.close();
  }
});

test("without JavaScript the page offers the quote form instead", async () => {
  const { page, context } = await open("/get-started/care/", { js: false });
  assert.equal(await visible(page, "[data-form]"), false);
  assert.equal(await visible(page, ".nojs"), true);
  assert.equal(await page.getAttribute(".nojs a", "href"), "/contact/?service=care");
  await context.close();
});

test("the sign-up fits a phone and works with reduced motion", async () => {
  for (const path of ["/get-started/care/", "/get-started/automation-starter/", "/billing/thanks/", "/billing/cancelled/", "/pricing/"]) {
    const { page, context, errors } = await open(path, { width: 390, height: 844, motion: "reduce" });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(over <= 0, `${path} scrolls sideways by ${over}px`);
    if (path === "/get-started/care/") {
      await answer(page, careAnswers());
      await submit(page);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
      const box = await page.locator("[data-checkout]").boundingBox();
      assert.ok(box.height >= 44 && box.width <= 390, `checkout button ${box.width}x${box.height}`);
    }
    assert.deepEqual(errors, [], path);
    await context.close();
  }
});

test("the return pages show the reference only when it has the right shape, and never say paid", async () => {
  for (const [path, ref, shown] of [["/billing/thanks/", REF, true], ["/billing/cancelled/", REF, true], ["/billing/thanks/", "<b>x</b>", false], ["/billing/thanks/", "NX-12345", false]]) {
    const { page, context, errors } = await open(`${path}?ref=${encodeURIComponent(ref)}`);
    assert.equal(await visible(page, "[data-ref-line]"), shown, `${path} ${ref}`);
    if (shown) assert.equal(await text(page, "[data-ref]"), ref);
    const body = await page.locator("main, body").first().innerText();
    assert.doesNotMatch(body, /\bpaid\b|payment (?:is )?(?:complete|successful)/i, path);
    assert.deepEqual(errors, []);
    await context.close();
  }
  const thanks = await open("/billing/thanks/");
  assert.match(await thanks.page.locator("h1").innerText(), /Confirming Your Payment/);
  // Nothing kept for this tab: no plan line, never a blank "Your plan:".
  assert.equal(await visible(thanks.page, "[data-plan-line]"), false);
  await thanks.context.close();
});
