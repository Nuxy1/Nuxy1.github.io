// Site checks on the production build in dist/, no browser needed: page basics, search tags, the sitemap, demo
// labels, structured data, internal links and anchors, old one-page links, outside requests, the security policy, and
// that every Nuxy price on the pages comes from src/data/services.ts.
//
//   npm run build
//   node --test tests/site.test.mjs        (needs Node 23.6 or newer: it imports services.ts directly)
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { services, plans, primary, groups, health, wants, variants, bundles, bundleMath, money as usd } from "../src/data/services.ts";
import { demoSites } from "../src/data/demo-sites.ts";
import { examples } from "../src/data/examples.ts";
import { caseStudies } from "../src/data/case-studies.ts";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "..", "dist");
const origin = "https://nuxyautomation.com";
if (!existsSync(join(dist, "index.html"))) throw new Error("dist/ is missing: run npm run build first.");

const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith(".html") ? [join(d, e.name)] : []);
// dist/about/index.html -> "/about/", dist/404.html -> "/404.html"
const urlOf = (f) => "/" + relative(dist, f).split(sep).join("/").replace(/(^|\/)index\.html$/, "$1");
const pages = new Map(walk(dist).map((f) => [urlOf(f), readFileSync(f, "utf8")]));
const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”" };
const decode = (text) => text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
  e[0] !== "#" ? named[e.toLowerCase()] ?? m : String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))));
const visible = (html) =>
  decode(html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " "))
    .replace(/’/g, "'").replace(/\s+/g, " ");
const all = (html, re) => [...html.matchAll(re)].map((m) => m[1]);
const first = (html, re) => (html.match(re) || [])[1];
const isNoindex = (html) => /<meta name="robots" content="noindex/.test(html);
const ldJson = (html) => all(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g).map((s) => JSON.parse(s));

const demoUrls = demoSites.map((d) => `/example-sites/${d.slug}/`);
// Pages kept out of search on purpose: the 404, the after-sending page, and the made-up businesses' full websites.
const expectedNoindex = new Set(["/404.html", "/contact/thanks/", ...demoUrls]);
const indexable = [...pages.keys()].filter((u) => !expectedNoindex.has(u));
// Old one-page anchors (/#booking...) and where the home page sends them (Base.astro)
const legacy = JSON.parse(first(pages.get("/"), /const legacy = (\{[^;]*\});/));

test("the build has every page, and the made-up data matches the pages", () => {
  assert.equal(pages.size, 34, `pages: ${[...pages.keys()].join(" ")}`);
  for (const u of ["/", "/websites/", "/get-a-website/", "/automation/", "/solutions/", "/pricing/", "/about/",
    "/contact/", "/contact/thanks/", "/demos/", "/demo/", "/policies/", "/docs/", "/404.html", "/ecommerce/", "/portfolio/", "/website-security/"]) {
    assert.ok(pages.has(u), `missing ${u}`);
  }
  for (const d of demoSites) assert.ok(pages.has(`/examples/${d.slug}/`) && pages.has(`/example-sites/${d.slug}/`), d.slug);
  for (const e of examples) assert.ok(pages.has(`/work/${e.slug}/`), e.slug);
});

test("every page has a language, a viewport, one title, one h1 and a description of a useful length", () => {
  for (const [u, html] of pages) {
    assert.match(html, /<html lang="en"/, `${u}: lang`);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1/, `${u}: viewport`);
    assert.equal(all(html, /<title>([^<]*)<\/title>/g).length, 1, `${u}: one title`);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${u}: one h1`);
    const d = decode(first(html, /<meta name="description" content="([^"]*)"/) ?? "");
    assert.ok(d, `${u}: description`);
    // (search results show about 150-160 characters; pages kept out of search only need one)
    if (!expectedNoindex.has(u)) assert.ok(d.length >= 50 && d.length <= 160, `${u}: description is ${d.length} characters: ${d}`);
  }
});

test("titles and descriptions are unique, and indexable pages carry social preview tags", () => {
  const seen = { title: new Map(), desc: new Map() };
  for (const u of indexable) {
    const html = pages.get(u);
    const t = first(html, /<title>([^<]*)<\/title>/);
    const d = decode(first(html, /<meta name="description" content="([^"]*)"/) ?? "");
    assert.ok(!seen.title.has(t), `${u} has the same title as ${seen.title.get(t)}: ${t}`);
    assert.ok(!seen.desc.has(d), `${u} has the same description as ${seen.desc.get(d)}`);
    seen.title.set(t, u);
    seen.desc.set(d, u);
    for (const p of ["og:title", "og:description", "og:image", "og:url"]) {
      assert.match(html, new RegExp(`<meta property="${p}" content="[^"]+"`), `${u}: ${p}`);
    }
  }
});

test("each page either points search engines at itself or is kept out of search", () => {
  const noindex = new Set([...pages].filter(([, h]) => isNoindex(h)).map(([u]) => u));
  assert.deepEqual([...noindex].sort(), [...expectedNoindex].sort());
  for (const u of indexable) {
    assert.equal(first(pages.get(u), /<link rel="canonical" href="([^"]*)"/), origin + u, `${u}: canonical`);
  }
});

// Website security & repairs (brief 5). The page may promise only what Nuxy can stand behind: it names the work that
// needs the owner's written authorization, claims no certificate, guarantee or "completely secure", shows no price
// that isn't published, and sends every request through the existing quote form.
test("the security & repairs page keeps its rules: authorization named, no certification or guarantee claims, published prices only", () => {
  const html = pages.get("/website-security/");
  const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
  const text = visible(main);
  assert.match(text, /Protect Your Website\. Fix Problems\. Keep Your Business Running\./);
  assert.match(text, /Nuxy helps businesses identify technical problems, improve website reliability, and address verified security concerns through authorized assessments and professional repairs\./);
  for (const name of ["Free Website Health Consultation", "Authorized Security Assessment", "Website Repairs", "Ongoing Maintenance"]) assert.ok(text.includes(name), name);
  assert.deepEqual(health.map((o) => o.name), ["Free Website Health Consultation", "Authorized Security Assessment", "Website Repairs", "Ongoing Maintenance"]);
  // the three buttons, each to a choice the quote form has
  for (const [label, want] of [["Request a Website Health Check", "health-check"], ["Get a Website Repair Quote", "repair"], ["Ask About Security Assessments", "security"]]) {
    assert.ok(wants.some((w) => w.id === want), want);
    assert.match(main, new RegExp(`<a [^>]*href="/contact/\\?want=${want}"[^>]*>${label}</a>`), label);
  }
  for (const o of health) assert.ok(wants.some((w) => w.id === o.want), `${o.id} asks through ${o.want}`);
  // which work needs written authorization, said per offer and in its own section
  assert.match(text, /Written authorization from the website's owner is required before any testing starts\./);
  assert.match(text, /Only with your written authorization/);
  assert.match(text, /If that isn't clear, we don't test\./);
  for (const o of health) assert.ok(text.includes(o.auth.replace(/’/g, "'")), `${o.id}: authorization line`);
  // no claims Nuxy can't back
  for (const banned of [/guarantee/i, /100\s?%/, /hack-?proof/i, /unhackable/i, /fully secure/i, /unlimited/i, /penetration test(?!ing firm)/i, /\bpen ?test/i, /compliant\b/i, /bank-level/i, /military-grade/i]) {
    assert.doesNotMatch(text, banned);
  }
  for (const m of text.matchAll(/certified/gi)) assert.equal(text.slice(m.index - 6, m.index), "not a ", "“certified” only as something we are not");
  for (const m of text.matchAll(/completely secure/gi)) assert.match(text.slice(m.index - 20, m.index), /No promise of .$/, "“completely secure” only as something we don't promise");
  // every dollar amount is a published one
  const published = new Set([services.find((s) => s.id === "site-fixes").price.replace("from ", ""), plans[0].amount]);
  for (const price of text.match(/\$[\d,]+/g) ?? []) assert.ok(published.has(price), `${price} is not a published price for this page`);
  // found from the menu, the footer, the home page and the catalogue, without displacing the four primary services
  const home = pages.get("/");
  assert.equal(primary.length, 4);
  assert.equal(all(home.slice(home.indexOf("<main"), home.indexOf("</main>")), /<a [^>]*href="([/]website-security[/])"/g).length, 1);
  assert.ok(all(pages.get("/solutions/"), /<a [^>]*href="([/]website-security[/])"/g).length >= 3, "menu, footer and the catalogue's own link");
  for (const [u, page] of pages) if (!demoUrls.includes(u)) assert.ok(page.includes('href="/website-security/"'), `${u} has no link to the page`);
});

test("the sitemap lists exactly the indexable pages, and robots.txt points at it", () => {
  const xml = readFileSync(join(dist, "sitemap.xml"), "utf8");
  const locs = all(xml, /<loc>([^<]*)<\/loc>/g);
  assert.deepEqual([...locs].sort(), indexable.map((u) => origin + u).sort());
  assert.match(readFileSync(join(dist, "robots.txt"), "utf8"), /Sitemap: https:\/\/nuxyautomation\.com\/sitemap\.xml/);
});

test("every demonstration says it is made up, where a reader sees it", () => {
  for (const d of demoSites) {
    assert.match(visible(pages.get(`/example-sites/${d.slug}/`)), /demonstration/i, `/example-sites/${d.slug}/`);
    assert.match(visible(pages.get(`/examples/${d.slug}/`)), /is a made-up business/, `/examples/${d.slug}/`);
  }
  for (const e of examples) assert.match(visible(pages.get(`/work/${e.slug}/`)), /is made up for this example/, e.slug);
  assert.match(visible(pages.get("/demo/")), /is a made-up salon/);
});

test("structured data parses, and its prices are the published ones in services.ts", () => {
  for (const [u, html] of pages) ldJson(html); // throws on broken JSON-LD
  const offers = new Map();
  const collect = (node) => {
    if (Array.isArray(node)) return node.forEach(collect);
    if (!node || typeof node !== "object") return;
    if (node["@type"] === "Offer" && node.url) offers.set(node.url, node);
    for (const v of Object.values(node)) collect(v);
  };
  collect(ldJson(pages.get("/solutions/")));
  collect(ldJson(pages.get("/pricing/")));
  const digits = (p) => p.replace(/[^\d.]/g, "");
  for (const s of [...services, ...variants]) {
    const o = offers.get(`${origin}/solutions/#${s.id}`);
    assert.ok(o, `no offer for ${s.id}`);
    const got = o.price ?? o.priceSpecification?.minPrice;
    assert.equal(got, digits(s.price), `${s.id}: structured data says ${got}, the site says ${s.price}`);
    if (s.price.startsWith("from")) assert.equal(o.price, undefined, `${s.id}: a "from" price must be a minPrice`);
    // (a monthly management price is named, never added to the setup price)
    if (s.monthly) assert.ok(o.description?.includes(s.monthly), `${s.id}: its monthly price is not named`);
  }
  for (const b of bundles) {
    const o = offers.get(`${origin}/pricing/#${b.id}`);
    assert.ok(o, `no offer for bundle ${b.id}`);
    assert.equal(o.price, digits(b.price), b.id);
  }
  for (const p of plans) {
    const o = offers.get(`${origin}/pricing/#${p.id}`);
    assert.ok(o, `no offer for plan ${p.id}`);
    assert.equal(o.price, digits(p.amount), p.id);
  }
});

test("every Nuxy price shown comes from services.ts, and every service and plan shows its price", () => {
  const money = /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g;
  const known = new Set(
    [...[...services, ...variants].flatMap((s) => [s.price, s.monthly ?? ""]), ...plans.map((p) => p.price), ...primary.map((p) => p.price),
      ...bundles.flatMap((b) => [b.price, usd(bundleMath(b).separately), usd(bundleMath(b).save)])].flatMap((p) => p.match(money) || []));
  // Not Nuxy prices: the made-up plumber's quote inside the lead demo.
  const demoAmounts = new Set(["$1,450"]);
  // Pages whose amounts belong to made-up businesses or sample program output, not to Nuxy.
  const notNuxy = (u) => /^\/(example-sites|docs|work)\//.test(u) || u === "/demo/";
  for (const [u, html] of pages) {
    if (notNuxy(u)) continue;
    const shown = visible(html.replace(/<select[^>]*name="budget"[\s\S]*?<\/select>/g, " ")).match(money) || [];
    for (const a of shown) assert.ok(known.has(a) || demoAmounts.has(a), `${u} shows ${a}, which is not a price in services.ts`);
  }
  const solutions = visible(pages.get("/solutions/"));
  for (const s of [...services, ...variants]) assert.ok(solutions.includes(s.price), `/solutions/ doesn't show ${s.name} ${s.price}`);
  const pricing = visible(pages.get("/pricing/"));
  for (const p of plans) assert.ok(pricing.includes(p.amount), `/pricing/ doesn't show ${p.name} ${p.amount}`);
  for (const b of bundles) assert.ok(pricing.includes(b.name) && pricing.includes(b.price), `/pricing/ doesn't show ${b.name} ${b.price}`);
});

test("every internal link, image and anchor lands on something that exists", () => {
  const problems = [];
  for (const [u, page] of pages) {
    // The demo websites' Call / Text / Directions buttons point at "#call" and the like on purpose: their script shows
    // "Demo: on a real site this button calls..." instead, and without JavaScript they do nothing. Leave them out.
    const html = page.replace(/<a\b[^>]*data-demo-action[^>]*>/g, "");
    const refs = [...all(html, /\shref="([^"]+)"/g), ...all(html, /\ssrc="([^"]+)"/g), ...all(html, /\sposter="([^"]+)"/g),
      ...all(html, /\ssrcset="([^"]+)"/g).flatMap((set) => set.split(",").map((c) => c.trim().split(/\s+/)[0]))];
    for (const raw of refs) {
      let ref = raw.replace(/&amp;/g, "&");
      if (ref.startsWith(origin)) ref = ref.slice(origin.length) || "/";
      if (/^(https?:|mailto:|tel:|sms:|data:|javascript:)/.test(ref)) continue;
      const [pathAndQuery, hash = ""] = ref.split("#");
      const path = pathAndQuery.split("?")[0] || u;
      if (!path.startsWith("/")) { problems.push(`${u}: relative link ${raw}`); continue; }
      const target = pages.get(path) ?? (path.endsWith("/") ? undefined : pages.get(path + "/"));
      if (target === undefined) {
        if (!existsSync(join(dist, decodeURIComponent(path)))) problems.push(`${u}: ${raw} -> nothing at ${path}`);
        continue;
      }
      const id = decodeURIComponent(hash);
      if (hash && !target.includes(`id="${id}"`) && !(path === "/" && legacy[id])) {
        problems.push(`${u}: ${raw} -> no id="${hash}" on ${path}`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test("old one-page links (/#id) are mapped to a section that exists", () => {
  for (const s of services) assert.ok(legacy[s.id], `old link /#${s.id} is not mapped`);
  for (const p of plans) assert.ok(legacy[p.id], `old link /#${p.id} is not mapped`);
  for (const g of groups) for (const old of g.legacy) assert.ok(legacy[old], `old link /#${old} is not mapped`);
  // homepage sections that were live before the conversion upgrade and are now named or placed differently
  for (const old of ["what-we-build", "why", "ownership"]) assert.ok(legacy[old] && !pages.get("/").includes(`id="${old}"`), `old link /#${old} is not mapped`);
  for (const [from, to] of Object.entries(legacy)) {
    const [path, hash] = to.split("#");
    const target = pages.get(path);
    assert.ok(target, `/#${from} -> ${to}: no page`);
    if (hash) assert.ok(target.includes(`id="${hash}"`), `/#${from} -> ${to}: no id="${hash}"`);
  }
});

test("pages load nothing from other sites, and every image has alt text", () => {
  for (const [u, html] of pages) {
    const outside = [
      ...all(html, /<(?:script|img|iframe|source|video|audio|track)\b[^>]*\ssrc="(https?:\/\/[^"]+)"/g),
      ...all(html, /<link\b[^>]*rel="(?:stylesheet|preload|modulepreload|icon|apple-touch-icon|manifest)"[^>]*href="(https?:\/\/[^"]+)"/g),
    ].filter((src) => !src.startsWith(origin + "/"));
    assert.deepEqual(outside, [], `${u} loads from another site`);
    for (const img of html.match(/<img\b[^>]*>/g) || []) assert.match(img, /\salt="/, `${u}: image without alt: ${img.slice(0, 80)}`);
  }
});

// The security policy (astro.config.mjs) stops any script that isn't one of Nuxy's own. A browser applies it only to
// what comes after it, and runs an inline script only if its hash is listed, so: every page has it, every inline
// script below it is listed (an `is:inline` script is not), only the homepage's old-link redirect sits above it, and
// the addresses the form posts to and the counts go to are allowed.
test("every page carries the security policy, it covers every script on the page, and lets the form and the counts through", () => {
  const sha = (s) => "sha256-" + createHash("sha256").update(s).digest("base64");
  const countUrl = /["'`](https:\/\/[^"'`\s]+\/hit)["'`]/g; // in a built script, quoted any of three ways
  const problems = [];
  for (const [u, html] of pages) {
    const at = html.search(/<meta http-equiv="content-security-policy"/);
    if (at < 0) { problems.push(`${u}: no security policy`); continue; }
    const policy = decode(first(html, /<meta http-equiv="content-security-policy" content="([^"]+)"/));
    const rule = (name) => policy.split(";").map((d) => d.trim().split(/\s+/)).find((d) => d[0] === name)?.slice(1) ?? [];
    if (rule("script-src").includes("'unsafe-inline'") || rule("object-src").join() !== "'none'") problems.push(`${u}: policy too loose`);
    const code = (part) => [...part.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "")
      .matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter((m) => !/\ssrc=/.test(m[1])).map((m) => m[2]);
    for (const s of code(html.slice(0, at))) if (!(u === "/" && s.includes("const legacy"))) problems.push(`${u}: script above the policy: ${s.slice(0, 50)}`);
    for (const s of code(html.slice(at))) if (!rule("script-src").includes(`'${sha(s)}'`)) problems.push(`${u}: inline script not in the policy: ${s.trim().slice(0, 50)}`);
    for (const a of all(html, /<form\b[^>]*\saction="(https?:\/\/[^"]+)"/g)) if (!rule("form-action").includes(new URL(a).origin)) problems.push(`${u}: form-action blocks ${a}`);
    for (const a of all(html, countUrl)) if (!rule("connect-src").includes(new URL(a).origin)) problems.push(`${u}: connect-src blocks ${a}`);
  }
  // the counts are really on the pages (so the connect-src check above checked something)
  assert.ok([...pages.values()].filter((h) => all(h, countUrl).length).length >= 20, "count address not found in the pages");
  assert.deepEqual(problems, []);
});

test("Nuxy's pages show no email but the inbox, no phone number and no street address", () => {
  const nuxyPage = (u) => !/^\/(example-sites|docs|work)\//.test(u) && u !== "/demo/";
  for (const [u, html] of pages) {
    if (!nuxyPage(u)) continue;
    const text = visible(html) + " " + all(html, /href="mailto:([^"?]+)/g).join(" ");
    for (const e of text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) || []) {
      assert.equal(e, "nuxy@nuxyautomation.com", `${u} shows the email ${e}`);
    }
    for (const p of text.match(/\(?\b\d{3}\)?[ .-]\d{3}-\d{4}\b/g) || []) {
      assert.match(p, /555-01\d\d/, `${u} shows a phone number that isn't a made-up 555 one: ${p}`);
    }
    assert.doesNotMatch(text, /\b\d{2,5} [A-Z][a-z]+ (?:St|Street|Ave|Avenue|Rd|Road|Blvd|Dr|Drive|Ln|Lane|Way)\b/, `${u}: street address`);
  }
});

test("pictures drawn as SVG are named or hidden, and every docs table sits in its scrolling box", () => {
  const problems = [];
  for (const [u, html] of pages) {
    for (const svg of all(html, /(<svg\b[^>]*>)/g)) {
      const named = /\saria-label="[^"]+"/.test(svg) || /\saria-labelledby="[^"]+"/.test(svg);
      if (/\srole="img"/.test(svg) && !named) problems.push(`${u}: unnamed ${svg.slice(0, 80)}`);
    }
    if (u.startsWith("/docs/")) {
      const tables = (html.match(/<table\b/g) ?? []).length, boxed = (html.match(/<div class="table-scroll" role="region" tabindex="0" aria-label="Table[^"]*"><table\b/g) ?? []).length;
      if (tables !== boxed) problems.push(`${u}: ${tables - boxed} of ${tables} tables are not in a .table-scroll box`);
    }
  }
  assert.deepEqual(problems, []);
});

test("each icon is drawn once per page and every reused icon points at a drawing on the same page (F7)", () => {
  const problems = [];
  for (const [u, html] of pages) {
    const ids = all(html, /\sid="([^"]+)"/g);
    const seen = new Set();
    for (const id of ids) { if (seen.has(id)) problems.push(`${u}: id "${id}" is used twice`); seen.add(id); }
    for (const ref of all(html, /<use href="#([^"]+)"/g)) if (!seen.has(ref)) problems.push(`${u}: <use> points at missing #${ref}`);
  }
  assert.deepEqual(problems, []);
});

test("booking is shown only once a calendar link is set, and then the privacy policy names the booking service", () => {
  // (site.ts reads import.meta.env, so its calUrl is read from the source text rather than imported)
  const calUrl = readFileSync(join(here, "..", "src", "data", "site.ts"), "utf8").match(/export const calUrl = "([^"]*)"/)?.[1];
  assert.notEqual(calUrl, undefined, "site.ts has no calUrl line");
  const contact = readFileSync(join(dist, "contact", "index.html"), "utf8");
  const policies = readFileSync(join(dist, "policies", "index.html"), "utf8");
  if (calUrl === "") {
    const offering = walk(dist).filter((f) => /book a call|pick a time for a free/i.test(readFileSync(f, "utf8"))).map(urlOf);
    assert.deepEqual(offering, [], "a page offers a call with no calendar set");
    assert.doesNotMatch(policies, /Booking a call/);
  } else {
    assert.match(contact, /Book a call/);
    assert.ok(contact.includes(`href="${calUrl}"`), "the button goes to calUrl");
    assert.match(contact, /the form or an email gets the same written plan/, "the call is offered as optional");
    assert.match(policies, /<strong>Booking a call:<\/strong> the booking page is run by \S/);
  }
});

// The prices the owner approved in the pricing overhaul brief (2026-11-11). A change here is a price change for new
// customers: it needs the owner's written yes, and existing agreements keep what they agreed either way.
const approved = {
  "new-website": "$900", "starter-website": "$499", "site-fixes": "from $150", "google-profile": "$199", "online-shop": "$1,200",
  "mini-store": "$699", store: "$449", "gift-cards": "$150", ordering: "$349", "follow-up": "$399", "missed-calls": "$199",
  "ai-receptionist": "from $599 + from $249/month", "ai-receptionist-advanced": "from $999 + $399/month", "lead-qualification": "from $699",
  reviews: "$149", "ai-replies": "$649", booking: "$349", deposits: "$150", quotes: "$399", "estimate-follow-up": "$449",
  "re-engagement": "from $599", "email-list": "$249", "cold-outreach": "from $999", invoices: "$299", onboarding: "from $699",
  reports: "$249", data: "from $200", integrations: "from $750", "crm-system": "from $2,500",
  "lead-recovery": "$529", "appointment-protection": "$549", "quote-to-customer": "$749",
  care: "$79/month", "automation-starter": "$149/month", "automation-growth": "$349/month", "automation-partner": "$799/month",
};

test("the approved prices stay as approved, and every bundle beats the multi-service discount", () => {
  const now = Object.fromEntries([
    ...[...services, ...variants].map((s) => [s.id, s.monthly ? `${s.price} + ${s.monthly}` : s.price]),
    ...bundles.map((b) => [b.id, b.price]), ...plans.map((p) => [p.id, p.price]),
  ]);
  assert.deepEqual(now, approved);
  for (const b of bundles) {
    const { separately } = bundleMath(b);
    const off = b.items.length >= 3 ? 0.85 : 0.9;
    assert.ok(Number(b.price.replace(/\D/g, "")) < separately * off, `${b.id}: ${b.price} is not below ${separately} with the discount`);
  }
});

test("a client case study is published only with recorded consent, sourced results and described pictures; no page invents one", () => {
  const home = pages.get("/");
  for (const c of caseStudies) {
    assert.ok(c.consent?.trim().length >= 20, `${c.slug}: consent says who agreed, when and to what`);
    assert.match(c.slug, /^[a-z0-9-]+$/);
    for (const k of ["business", "industry", "location", "problem"]) assert.ok(c[k]?.trim(), `${c.slug}: ${k}`);
    assert.ok(c.built.length > 0, `${c.slug}: what was built`);
    for (const r of c.results) assert.ok(r.value.trim() && r.label.trim() && r.source.trim(), `${c.slug}: every result names its source`);
    if (c.quote) assert.ok(c.quote.text.trim() && c.quote.name.trim(), `${c.slug}: a quote has its speaker`);
    for (const p of [...(c.shots ?? []), ...(c.beforeAfter ? [c.beforeAfter.before, c.beforeAfter.after] : [])]) {
      assert.ok(p.alt.trim().length >= 10, `${c.slug}: ${p.src} is described`);
      assert.ok(p.width > 0 && p.height > 0, `${c.slug}: ${p.src} has its size, so the page doesn't jump`);
      assert.ok(existsSync(join(dist, p.src)), `${c.slug}: ${p.src} exists`);
    }
    assert.ok(home.includes(`id="case-${c.slug}"`), `${c.slug} is on the homepage`);
    assert.ok(pages.get("/portfolio/").includes(`id="case-${c.slug}"`), `${c.slug} is on /portfolio/`);
  }
  // /portfolio/ says "every business on this page is made up" exactly while that is true
  assert.equal(/Every business on this page is made up/.test(decode(pages.get("/portfolio/"))), caseStudies.length === 0, "the portfolio's made-up note follows the data");
  // nothing that reads as a client story appears anywhere unless an entry above put it there
  const ids = new Set(caseStudies.map((c) => `case-${c.slug}`));
  for (const [url, html] of pages) {
    for (const m of html.matchAll(/<article class="case[^"]*" id="(case-[^"]+)"/g)) assert.ok(ids.has(m[1]), `${url}: ${m[1]} is not in caseStudies`);
    if (!caseStudies.length) assert.doesNotMatch(decode(html.replace(/<script[\s\S]*?<\/script>/g, "")), /Client project ·/, `${url} shows a client project`);
  }
});
