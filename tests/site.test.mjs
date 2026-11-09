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
import { services, plans, primary, groups } from "../src/data/services.ts";
import { demoSites } from "../src/data/demo-sites.ts";
import { examples } from "../src/data/examples.ts";

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
  assert.equal(pages.size, 33, `pages: ${[...pages.keys()].join(" ")}`);
  for (const u of ["/", "/websites/", "/get-a-website/", "/automation/", "/solutions/", "/pricing/", "/about/",
    "/contact/", "/contact/thanks/", "/demos/", "/demo/", "/policies/", "/docs/", "/404.html", "/ecommerce/", "/portfolio/"]) {
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
  for (const s of services) {
    const o = offers.get(`${origin}/solutions/#${s.id}`);
    assert.ok(o, `no offer for ${s.id}`);
    const got = o.price ?? o.priceSpecification?.minPrice;
    assert.equal(got, digits(s.price), `${s.id}: structured data says ${got}, the site says ${s.price}`);
    if (s.price.startsWith("from")) assert.equal(o.price, undefined, `${s.id}: a "from" price must be a minPrice`);
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
    [...services.map((s) => s.price), ...plans.map((p) => p.price), ...primary.map((p) => p.price)].flatMap((p) => p.match(money) || []));
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
  for (const s of services) assert.ok(solutions.includes(s.price), `/solutions/ doesn't show ${s.name} ${s.price}`);
  const pricing = visible(pages.get("/pricing/"));
  for (const p of plans) assert.ok(pricing.includes(p.amount), `/pricing/ doesn't show ${p.name} ${p.amount}`);
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
