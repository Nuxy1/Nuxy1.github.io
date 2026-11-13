// Price and catalogue consistency, on the production build in dist/, no browser needed. One question: does every
// price a visitor can read, link or search for agree with the catalogue (src/data/services.ts, tiers.ts, creative.ts)?
// It looks for: missing or malformed catalogue entries, broken service links, prices that don't match, monthly prices
// shown as anything but monthly, and an item shown next to a price that isn't its own.
//
// What it leaves to other tests, so nothing is checked twice for the same reason: site.test.mjs pins the approved
// prices and the JSON-LD of /solutions/ and /pricing/; levels.test.mjs pins the level and add-on prices; and
// business/offer.md's per-service prices are checked by agent/upwork-inbox-drafter/test/leads.test.js ("the offer the
// cold-email drafter reads"). The last test here covers only what that one does not: the bundle arithmetic in offer.md.
//
//   npm run build
//   node --test tests/pricing.test.mjs        (needs Node 23.6 or newer: it imports services.ts directly)
//   DIST_DIR=<folder> node --test tests/pricing.test.mjs     (read another copy of the build, to prove the test can fail)
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { groups, services, variants, bundles, plans, retired, kinds, wants, primary, bundleMath, bundle as discount, dollars, money } from "../src/data/services.ts";
import { rules as creativeRules, usd as creativeUsd } from "../src/data/creative.ts";
import { questions, levelOrder } from "../src/data/level-finder.ts";

const here = dirname(fileURLToPath(import.meta.url));
const dist = process.env.DIST_DIR ? resolve(process.env.DIST_DIR) : join(here, "..", "dist");
if (!existsSync(join(dist, "index.html"))) throw new Error(`${dist} has no index.html: run npm run build first.`);
const origin = "https://nuxyautomation.com";

// ---------- reading the build ----------

const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith(".html") ? [join(d, e.name)] : []);
// dist/about/index.html -> "/about/"
const urlOf = (f) => "/" + relative(dist, f).split(sep).join("/").replace(/(^|\/)index\.html$/, "$1");
const pages = new Map(walk(dist).map((f) => [urlOf(f), readFileSync(f, "utf8")]));
const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”" };
const decode = (text) => text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
  e[0] !== "#" ? named[e.toLowerCase()] ?? m : String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))));
const dropCode = (html) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ");
// Everything a visitor reads. The made-up businesses' sites (/example-sites/) price their own made-up things.
const ownPages = [...pages].filter(([u]) => !u.startsWith("/example-sites/"));
// The form's budget list is a set of ranges, not prices of ours (the level finder's own bands are allowed below).
const dropBudget = (html) => html.replace(/<select[^>]*name="budget"[\s\S]*?<\/select>/g, " ");
const text = (html) => decode(dropCode(dropBudget(html)).replace(/<[^>]+>/g, " ")).replace(/’/g, "'").replace(/\s+/g, " ");
// The same text with a "|" wherever one element ends and another starts, so "a name, then the next element's price"
// can be told from "a name, then a price three paragraphs later".
const blocks = (html) => decode(dropCode(dropBudget(html))
  .replace(/<\/?(?:p|li|tr|td|th|h[1-6]|div|section|article|ul|ol|table|a|button|span|dt|dd|details|summary|header|footer|nav|main|label|option)\b[^>]*>/g, " | ")
  .replace(/<[^>]+>/g, " ")).replace(/’/g, "'").replace(/\s+/g, " ").replace(/(?:\| ?)+/g, "| ");
const all = (html, re) => [...html.matchAll(re)].map((m) => m[1]);
const ids = (html) => new Set(all(html, /\sid="([^"]+)"/g));
const ldJson = (html) => all(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g).map((s) => JSON.parse(s));

const MONEY = /\+?\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g;
const wholeDollars = /^\$\d{1,3}(?:,\d{3})*$/;

// ---------- the catalogue, in one list ----------

// tiers.ts imports without file extensions, which Node cannot follow, so its levels and add-ons are read as text, the
// way levels.test.mjs does. The Business price is written there from two services.ts values; they are put back here.
const tiersSrc = readFileSync(join(here, "..", "src", "data", "tiers.ts"), "utf8");
const starterPrice = variants.find((v) => v.id === "starter-website").price;
const sitePrice = services.find((s) => s.id === "new-website").price;
const unquote = (s) => s.trim().replace(/^`|`$/g, "").replace(/^"|"$/g, "").replace("${starter}", starterPrice).replace("${site}", sitePrice);
const levelsSrc = tiersSrc.slice(tiersSrc.indexOf("export const levels:"), tiersSrc.indexOf("export const levelById"));
const levels = [...levelsSrc.matchAll(/^ {2}\{\r?\n([\s\S]*?)^ {2}\},/gm)].map((m) => {
  const field = (key) => { const f = m[1].match(new RegExp(`^ {4}${key}: (.+),\\r?$`, "m")); return f ? unquote(f[1]) : undefined; };
  return Object.fromEntries(["id", "name", "promise", "tagline", "for", "price", "priceNote", "from", "built", "timeline", "revisions", "cta", "href", "page", "budget"].map((k) => [k, field(k)]));
});
const addOnsSrc = tiersSrc.slice(tiersSrc.indexOf("export const addOns:"), tiersSrc.indexOf("];", tiersSrc.indexOf("export const addOns:")));
const addOnLines = addOnsSrc.split(/\r?\n/).filter((l) => /^ {2}\{ id:/.test(l));
const addOns = addOnLines.flatMap((l) => {
  const m = l.match(/^ {2}\{ id: "([^"]+)", name: "([^"]+)", price: "([^"]+)", text: "([^"]+)", fits: \[([^\]]*)\] \},?$/);
  return m ? [{ id: m[1], name: m[2], price: m[3], text: m[4], fits: [...m[5].matchAll(/"([^"]+)"/g)].map((x) => x[1]) }] : [];
});

const amountsIn = (s) => (s ?? "").match(MONEY)?.map((a) => a.replace("+", "")) ?? [];

// What each catalogue item may be shown next to: its own price, a monthly price, and what the catalogue works out
// from it (a bundle's "separately" and "you save", the 10% and 15% totals, and the half a deposit invoice asks first).
const derived = (price) => { const n = dollars(price); return [price, money(n / 2), money(Math.round(n * (1 - discount.two / 100))), money(Math.round(n * (1 - discount.three / 100)))]; };
const items = [
  ...[...services, ...variants].map((s) => ({ kind: "service", id: s.id, name: s.name, amounts: [...derived(s.price), ...amountsIn(s.monthly)].flatMap(amountsIn) })),
  ...bundles.map((b) => ({ kind: "bundle", id: b.id, name: b.name, amounts: [...amountsIn(b.price), money(bundleMath(b).separately), money(bundleMath(b).save)] })),
  ...plans.map((p) => ({ kind: "plan", id: p.id, name: p.name, amounts: amountsIn(p.price) })),
  ...addOns.map((a) => ({ kind: "add-on", id: a.id, name: a.name, amounts: amountsIn(a.price) })),
];
// Levels are matched only where a whole element is the level's name ("Signature"), because "Business" is also a word.
const levelItems = levels.map((l) => ({ kind: "level", id: l.id, name: l.name, amounts: [...amountsIn(l.price), ...amountsIn(l.priceNote)] }));

// Every amount the catalogue can print. Built from the data, never typed.
const catalogueAmounts = new Set(items.flatMap((i) => i.amounts).concat(levelItems.flatMap((i) => i.amounts)));
// ...plus the level finder's budget bands, which are ranges the visitor picks from, not prices.
for (const a of questions.find((q) => q.id === "budget").answers.flatMap((x) => amountsIn(x.text))) catalogueAmounts.add(a);
// Creative Studio prices live only on /creative-studio/ (creative.ts); no other page may print one of its own.
const creativeAmounts = new Set([...creativeRules.types.map((t) => t.base), ...creativeRules.durations.map((d) => d.add), ...creativeRules.extras.map((e) => e.add),
  creativeRules.extraFormat, creativeRules.revisions.extra].filter(Boolean).map(creativeUsd));

// Amounts that are on a page but are not Nuxy prices. Each entry says where and why; nothing else is allowed.
const notNuxy = [
  // /demo/ is the made-up salon "Juniper & Rose" with its own price list and a deposit.
  { page: /^\/demo\/$/, amounts: ["$55", "$35", "$95", "$40", "$20"], why: "the made-up salon's own service prices and deposit" },
  // /demos/ shows a made-up plumber's job in the lead demo.
  { page: /^\/demos\/$/, amounts: ["$1,450"], why: "the made-up plumber's quote inside the lead demo" },
];
// Sample money printed by the automations themselves ("$1,240.00 of $1,800.00 left") always has cents; no Nuxy price does.
const sampleOutput = (u, a) => /^\/(work|docs)\//.test(u) && /\.\d\d$/.test(a);
const allowedHere = (u, a) =>
  catalogueAmounts.has(a) || (u === "/creative-studio/" && creativeAmounts.has(a)) || sampleOutput(u, a) ||
  notNuxy.some((n) => n.page.test(u) && n.amounts.includes(a));

// ---------- 1. the catalogue is complete ----------

const filled = (v) => typeof v === "string" && v.trim().length > 0;

test("every service, version, bundle, plan, website level and add-on has a unique id, a name and the fields its type requires", () => {
  const problems = [];
  const needService = ["id", "name", "price", "priceType", "status", "manage", "icon", "fixes", "text", "who", "fits", "needs", "costs"];
  for (const s of services) for (const k of needService) if (!filled(s[k])) problems.push(`service ${s.id}: no ${k}`);
  for (const v of variants) for (const k of ["id", "name", "price", "priceType", "text"]) if (!filled(v[k])) problems.push(`version ${v.id}: no ${k}`);
  for (const b of bundles) {
    for (const k of ["id", "name", "price", "icon", "who", "kind"]) if (!filled(b[k])) problems.push(`bundle ${b.id}: no ${k}`);
    if (!b.includes.length) problems.push(`bundle ${b.id}: includes nothing`);
    for (const i of b.items) if (!services.some((s) => s.id === i)) problems.push(`bundle ${b.id}: item ${i} is not a service`);
    if (!kinds.some((k) => k.id === b.kind)) problems.push(`bundle ${b.id}: kind ${b.kind} is not a business kind`);
  }
  for (const p of plans) {
    for (const k of ["id", "name", "price", "amount", "who", "kind"]) if (!filled(p[k])) problems.push(`plan ${p.id}: no ${k}`);
    if (!p.points.length || p.points.some((x) => !filled(x))) problems.push(`plan ${p.id}: empty points`);
  }
  assert.equal(levels.length, 4, "tiers.ts should list four website levels");
  assert.deepEqual(levels.map((l) => l.id), levelOrder, "the levels in tiers.ts and the finder's order differ");
  for (const l of levels) for (const k of ["id", "name", "promise", "tagline", "for", "price", "priceNote", "from", "built", "timeline", "revisions", "cta", "href", "budget"]) if (!filled(l[k])) problems.push(`level ${l.id}: no ${k}`);
  assert.ok(addOns.length >= 9 && addOns.length === addOnLines.length, `tiers.ts has ${addOnLines.length} add-on lines but only ${addOns.length} read: a line is malformed`);
  for (const a of addOns) for (const k of ["id", "name", "price", "text"]) if (!filled(a[k])) problems.push(`add-on ${a.id}: no ${k}`);
  for (const a of addOns) for (const l of a.fits) if (!levelOrder.includes(l)) problems.push(`add-on ${a.id}: fits unknown level ${l}`);
  assert.deepEqual(problems, []);
});

test("ids are unique across services, versions, bundles and plans (they are the /contact/?service= and #anchor names)", () => {
  const seen = new Map();
  const dupes = [];
  for (const [kind, list] of [["service", services], ["version", variants], ["bundle", bundles], ["plan", plans]]) {
    for (const x of list) { if (seen.has(x.id)) dupes.push(`${x.id}: ${seen.get(x.id)} and ${kind}`); else seen.set(x.id, kind); }
  }
  assert.deepEqual(dupes, []);
  for (const [label, list] of [["group", groups], ["website level", levels], ["add-on", addOns]]) {
    assert.equal(new Set(list.map((x) => x.id)).size, list.length, `${label} ids repeat`);
  }
  for (const [old, now] of Object.entries(retired)) {
    assert.ok(!seen.has(old), `retired id ${old} is also in use`);
    assert.ok(seen.has(now), `retired id ${old} points at ${now}, which does not exist`);
  }
});

test("every price is well formed and worded for its type: a plain price is whole dollars, a starting price says 'from'", () => {
  const problems = [];
  for (const s of [...services, ...variants]) {
    const bare = s.price.replace(/^from /, "");
    if (!wholeDollars.test(bare)) problems.push(`${s.id}: price "${s.price}" is not whole dollars`);
    if ((s.priceType === "fixed") === s.price.startsWith("from ")) problems.push(`${s.id}: price "${s.price}" does not match priceType ${s.priceType}`);
    if (s.monthly !== undefined && !/^(from )?\$\d{1,3}(?:,\d{3})*\/month$/.test(s.monthly)) problems.push(`${s.id}: monthly "${s.monthly}" is not "$N/month"`);
    if ((s.priceType === "setup") !== (s.monthly !== undefined)) problems.push(`${s.id}: only setup prices carry a monthly price`);
  }
  for (const s of services) if (s.manage === "own" && !s.monthly) problems.push(`${s.id}: manages itself but names no monthly price`);
  for (const b of bundles) if (!wholeDollars.test(b.price)) problems.push(`bundle ${b.id}: price "${b.price}" is not whole dollars`);
  for (const l of levels) {
    // a level reads "$499 – $900", "From $3,500", "Starting at $6,000" or the words "Custom quote" (Flagship states its number in the note)
    if (l.price !== "Custom quote" && !/^(From |Starting at )?\$[\d,]+( – \$[\d,]+)?$/.test(l.price)) problems.push(`level ${l.id}: price "${l.price}"`);
    const lowest = dollars(l.price === "Custom quote" ? l.priceNote : l.price);
    if (lowest !== Number(l.from)) problems.push(`level ${l.id}: from ${l.from} but the page says ${lowest}`);
  }
  for (const a of addOns) if (a.price !== "Custom quote" && !/^\+\$\d{1,3}(?:,\d{3})*$/.test(a.price)) problems.push(`add-on ${a.id}: price "${a.price}"`);
  assert.deepEqual(problems, []);
});

// ---------- 2. recurring prices ----------

test("every monthly plan is a positive whole-dollar amount per month, and the short amount matches the full price", () => {
  const problems = [];
  for (const p of plans) {
    const m = p.price.match(/^\$(\d+)\/month$/);
    if (!m || Number(m[1]) <= 0) problems.push(`${p.id}: price "${p.price}" is not "$N/month" with N above zero`);
    if (p.amount !== `$${m?.[1]}`) problems.push(`${p.id}: amount "${p.amount}" differs from price "${p.price}"`);
  }
  assert.equal(new Set(plans.map((p) => p.id)).size, plans.length, "plan ids repeat");
  assert.equal(new Set(plans.map((p) => p.name)).size, plans.length, "plan names repeat");
  assert.deepEqual(problems, []);
});

// Every "/month" or "a month" price on the site must be a recurring price the catalogue knows: a plan, a service's own
// monthly price, or a Creative Studio monthly package. A one-time price shown as monthly (or a typo) fails here.
const recurring = new Set([...plans.map((p) => p.amount), ...[...services, ...variants].flatMap((s) => amountsIn(s.monthly)),
  ...creativeRules.types.filter((t) => t.monthly).map((t) => creativeUsd(t.base))]);

test("every price shown as monthly is a recurring price in the catalogue, and a plan is never shown as one-time or yearly", () => {
  const problems = [];
  for (const [u, html] of ownPages) {
    const t = text(html);
    for (const m of t.matchAll(/(\$\d{1,3}(?:,\d{3})*)(?: ?\/ ?| a | per )(month|mo)\b/gi)) {
      if (!recurring.has(m[1])) problems.push(`${u}: ${m[0]} is shown as monthly but ${m[1]} is not a recurring price`);
    }
    // next to a plan's name, its price must be monthly and say nothing of one-time, yearly or annual
    const b = blocks(html);
    for (const p of plans) {
      for (const m of b.matchAll(new RegExp(`${p.name}[^|$]{0,20}(?:\\|[^|$]{0,60}){0,3}?[| ,(:]+\\$(\\d[\\d,]*)([^|]{0,40})`, "g"))) {
        if (`$${m[1]}` !== p.amount) continue; // a different amount is the mismatch test's business
        if (!/^ ?(\/ ?month| a month| per month)/.test(m[2])) problems.push(`${u}: ${p.name} ${p.amount} is not shown as monthly ("${m[2].slice(0, 30)}")`);
        if (/one-time|once|year|annual/i.test(m[2])) problems.push(`${u}: ${p.name} ${p.amount} is shown with one-time or yearly wording`);
      }
    }
  }
  assert.deepEqual(problems, []);
  // the two main pages show every plan, each with its monthly price
  for (const u of ["/pricing/"]) for (const p of plans) assert.match(text(pages.get(u)), new RegExp(`${p.name}.*?\\${p.amount} a month`), `${u}: ${p.name} is not shown as ${p.amount} a month`);
});

// ---------- 3. links ----------

test("every catalogue item with an anchor has its element on the page that lists it", () => {
  const solutions = ids(pages.get("/solutions/")), pricing = ids(pages.get("/pricing/"));
  const missing = [
    ...[...services, ...variants].filter((s) => !solutions.has(s.id)).map((s) => `/solutions/#${s.id}`),
    ...groups.filter((g) => !solutions.has(g.id)).map((g) => `/solutions/#${g.id}`),
    ...[...bundles, ...plans].filter((x) => !pricing.has(x.id)).map((x) => `/pricing/#${x.id}`),
  ];
  assert.deepEqual(missing, []);
});

test("every website level's page and button resolve, and the home and automation cards point at real places", () => {
  const problems = [];
  const levelIds = new Set(levels.map((l) => l.id));
  const resolves = (ref, who) => {
    const [path, hash = ""] = ref.split("#");
    const page = pages.get(path.split("?")[0]);
    if (!page) problems.push(`${who}: ${ref} has no page`);
    else if (hash && !ids(page).has(hash)) problems.push(`${who}: ${ref} has no id="${hash}"`);
  };
  for (const l of levels) {
    if (l.page) resolves(l.page, `level ${l.id} page`);
    const m = l.href.match(/^\/contact\/\?level=([a-z]+)$/);
    if (!m || !levelIds.has(m[1]) || m[1] !== l.id) problems.push(`level ${l.id}: button ${l.href} should open the form for this level`);
  }
  for (const p of primary) resolves(p.href, `primary ${p.id}`);
  assert.deepEqual(problems, []);
});

test("every /contact/?service=, ?services= and ?level= link on any page names an id the catalogue has", () => {
  const serviceIds = new Set([...services, ...variants, ...bundles, ...plans].map((x) => x.id).concat(Object.keys(retired)));
  const levelIds = new Set([...levels.map((l) => l.id), "unsure"]);
  const wantIds = new Set(wants.map((w) => w.id));
  const problems = [];
  let seen = 0;
  for (const [u, html] of pages) {
    for (const href of all(html, /\shref="([^"]*\/contact\/\?[^"]*)"/g)) {
      const q = new URL(decode(href), origin).searchParams;
      for (const key of ["service", "services"]) for (const v of (q.get(key) ?? "").split(",").filter(Boolean)) { seen++; if (!serviceIds.has(v)) problems.push(`${u}: ${href} -> ${key}=${v} is not in the catalogue`); }
      if (q.has("level")) { seen++; if (!levelIds.has(q.get("level"))) problems.push(`${u}: ${href} -> level=${q.get("level")}`); }
      if (q.has("want")) { seen++; if (!wantIds.has(q.get("want"))) problems.push(`${u}: ${href} -> want=${q.get("want")}`); }
    }
  }
  assert.ok(seen > 50, `only ${seen} contact links found: the pattern may have stopped matching`);
  assert.deepEqual(problems, []);
});

test("every /solutions/#id and /pricing/#id link on any page lands on an element that exists", () => {
  const problems = [];
  for (const [u, html] of pages) {
    for (const raw of all(html, /\shref="((?:\/solutions\/|\/pricing\/)#[^"]+)"/g)) {
      const [path, hash] = raw.split("#");
      if (!ids(pages.get(path)).has(hash)) problems.push(`${u}: ${raw}`);
    }
  }
  assert.deepEqual(problems, []);
});

// ---------- 4. every dollar amount is one the catalogue can produce ----------

test("every dollar amount on a Nuxy page, and in its structured data, is one the catalogue (or a commented exception) allows", () => {
  const problems = [];
  for (const [u, html] of ownPages) {
    for (const a of new Set(text(html).match(MONEY) ?? [])) if (!allowedHere(u, a.replace("+", ""))) problems.push(`${u}: shows ${a}`);
    // JSON-LD: every offer price is a catalogue amount written without the dollar sign (and minPrice for a "from" price)
    const walkLd = (n) => {
      if (Array.isArray(n)) return n.forEach(walkLd);
      if (!n || typeof n !== "object") return;
      for (const k of ["price", "minPrice", "maxPrice"]) {
        if (n[k] === undefined || n[k] === "") continue;
        const a = money(Number(String(n[k]).replace(/,/g, "")));
        if (Number.isNaN(Number(n[k])) || !allowedHere(u, a)) problems.push(`${u}: structured data ${k} ${n[k]}`);
      }
      Object.values(n).forEach(walkLd);
    };
    ldJson(html).forEach(walkLd);
  }
  assert.deepEqual(problems, []);
});

test("every catalogue price is shown on the page that sells it (/solutions/, /pricing/ and the level pages)", () => {
  const solutions = text(pages.get("/solutions/")), pricing = text(pages.get("/pricing/"));
  const problems = [];
  for (const s of [...services, ...variants]) if (!solutions.includes(s.price)) problems.push(`/solutions/ lacks ${s.name} ${s.price}`);
  for (const b of bundles) if (!pricing.includes(b.price)) problems.push(`/pricing/ lacks ${b.name} ${b.price}`);
  for (const p of plans) if (!pricing.includes(p.amount)) problems.push(`/pricing/ lacks ${p.name} ${p.amount}`);
  for (const l of levels.filter((x) => x.page)) {
    const t = text(pages.get(l.page));
    if (!amountsIn(l.price).every((a) => t.includes(a))) problems.push(`${l.page} lacks the ${l.name} price ${l.price}`);
  }
  assert.deepEqual(problems, []);
});

// ---------- 5. an item is never shown beside someone else's price ----------

test("wherever an item's name is followed straight away by a price, the price is that item's own", () => {
  const byName = [...items, ...levelItems].sort((a, b) => b.name.length - a.name.length); // longest first: "Advanced AI Voice Receptionist" before "AI Voice Receptionist"
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const problems = [];
  let pairs = 0;
  for (const [u, html] of ownPages) {
    let b = " " + blocks(html) + " ";
    // find each name, remembering where it is, then blank it so a shorter name inside a longer one is not found twice
    const events = [];
    for (const i of byName) {
      // levels count only as a whole element ("| Signature |"); every other name only as whole words
      const re = new RegExp(i.kind === "level" ? `(?<=\\| )${escape(i.name)}(?= \\|)` : `(?<![\\p{L}\\p{N}])${escape(i.name)}(?![\\p{L}\\p{N}])`, "gu");
      b = b.replace(re, (m, off) => { events.push({ at: off, end: off + m.length, item: i }); return " ".repeat(m.length); });
    }
    for (const m of b.matchAll(/\+?\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g)) events.push({ at: m.index, end: m.index + m[0].length, amount: m[0].replace("+", "") });
    events.sort((x, y) => x.at - y.at);
    events.forEach((e, n) => {
      const next = events[n + 1];
      if (!e.item || !next?.amount) return;
      const gap = b.slice(e.end, next.at);
      // "same short block": at most two element breaks and a short stretch between the name and the price
      if ((gap.match(/\|/g) ?? []).length > 2 || gap.length > 90) return;
      // A name in the middle of a sentence counts only with its price right behind it ("Name ($449)", "Name: $349");
      // otherwise the name must open its own element (a heading, a table cell, a card title).
      const opens = b.slice(Math.max(0, e.at - 2), e.at) === "| ";
      if (!opens && (gap.includes("|") || gap.length > 4)) return;
      // A name straight after a price is that price's label ("from $999 + $399/month | Advanced AI Voice Receptionist").
      const before = events[n - 1];
      if (before?.amount && b.slice(before.end, e.at).split("|").length <= 2) return;
      pairs++;
      if (!e.item.amounts.includes(next.amount)) problems.push(`${u}: ${e.item.name} is shown beside ${next.amount} (catalogue: ${[...new Set(e.item.amounts)].join(", ")})`);
    });
  }
  assert.ok(pairs > 60, `only ${pairs} name-and-price pairs found: the matching may have stopped working`);
  assert.deepEqual(problems, []);
});

// ---------- the form's budget choices ----------

test("every website level's budget is a choice on the contact form, and the finder's bands start and end where the form's do", () => {
  const form = readFileSync(join(here, "..", "src", "components", "InquiryForm.astro"), "utf8");
  const select = form.match(/<select[^>]*name="budget"[\s\S]*?<\/select>/)[0];
  const formValues = all(select, /<option value="([^"]+)"/g).filter((v) => v !== "" && v !== "unsure");
  for (const l of levels) assert.ok(formValues.includes(l.budget), `level ${l.id}: budget ${l.budget} is not on the form (${formValues.join(", ")})`);
  // The form has six bands, the finder four. They are not the same list, but the finder merges the form's bands
  // (under $500 and $500–$1,000 become "under $1,000"; $1,000–$3,000 and $3,000–$6,000 become "$1,000 to $6,000"), so
  // every number where a finder band ends must also be where a form band ends.
  const edges = (values) => new Set(values.flatMap((v) => v.match(/\d+/g) ?? []));
  const finderValues = questions.find((q) => q.id === "budget").answers.map((a) => a.id);
  for (const e of edges(finderValues)) assert.ok(edges(formValues).has(e), `the finder splits at ${e}, which the form does not`);
});

// ---------- 6. business/offer.md ----------

// leads.test.js (agent/upwork-inbox-drafter) already checks, row by row, that offer.md has every service, version,
// bundle and plan at its published price and monthly price, so that is not repeated. It does not check the bundle
// arithmetic printed in the same table ("separately $598, saves $69"); this does.
test("offer.md states each bundle's 'separately' total and saving as the catalogue works them out", (t) => {
  const file = join(here, "..", "..", "..", "business", "offer.md");
  if (!existsSync(file)) return t.skip("business/offer.md is not next to the website here");
  const md = readFileSync(file, "utf8");
  for (const b of bundles) {
    const row = md.split(/\r?\n/).find((l) => l.startsWith(`| ${b.name} |`));
    assert.ok(row, `offer.md has no row for ${b.name}`);
    const { separately, save } = bundleMath(b);
    assert.ok(row.includes(`${b.price} (separately ${money(separately)}, saves ${money(save)})`), `${b.name}: offer.md row does not read "${b.price} (separately ${money(separately)}, saves ${money(save)})"`);
  }
});
