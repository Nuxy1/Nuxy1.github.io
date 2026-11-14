// Checks of every client project page: the published ones (src/data/case-studies.ts) in the production build (dist/),
// and any still waiting on the client's written approval (stage/case-studies.ts) in the stage build
// (npm run build:stage -> dist-stage/). Each half is skipped when its build is missing, so `npm test` after a plain
// build still passes. site.test.mjs checks the publication rules themselves (consent and the four checks, sitemap,
// lead field, no staged preview in dist/).
// What a client page must never show (the brief's phase 9): a street address, an admin or dashboard route, a live link
// before the client agreed to one, a phone number or an email address of the client, or anything from the client's
// database. Every picture and the video must exist, be described and have their size.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { staged } from "../stage/case-studies.ts";
import { caseStudies, liveLink } from "../src/data/case-studies.ts";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "dist-stage");
const dist = join(here, "..", "dist");
const haveStage = existsSync(join(out, "index.html"));
const haveDist = existsSync(join(dist, "index.html"));

const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith(".html") ? [join(d, e.name)] : []);
const urlOf = (root, f) => "/" + relative(root, f).split(sep).join("/").replace(/(^|\/)index\.html$/, "$1");
const read = (root) => new Map(walk(root).map((f) => [urlOf(root, f), readFileSync(f, "utf8")]));
const text = (html) => html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");

// [project, build folder, staged?]: published projects are checked in dist/, staged ones in dist-stage/
const projects = [
  ...(haveDist ? caseStudies.map((c) => [c, dist, false]) : []),
  ...(haveStage ? staged.map((c) => [c, out, true]) : []),
];
const skip = projects.length === 0 && "no client project to check (or dist/ and dist-stage/ are missing)";
const cache = new Map();
const pagesOf = (root) => cache.get(root) ?? cache.set(root, read(root)).get(root);

test("every client project has its project page with the seven sections, its card and its lead source", { skip }, () => {
  for (const [c, root, isStaged] of projects) {
    const pages = pagesOf(root);
    const own = pages.get(`/portfolio/${c.slug}/`);
    assert.ok(own, `${c.slug}: the project page is built`);
    if (isStaged) {
      assert.match(own, /<meta name="robots" content="noindex/, `${c.slug}: the staged page is kept out of search`);
      assert.doesNotMatch(own, /rel="canonical"/, `${c.slug}: no canonical link on a staged page`);
      assert.doesNotMatch(own, /application\/ld\+json[^>]*>[^<]*CreativeWork/, `${c.slug}: no structured data on a staged page`);
      assert.match(own, /Staged preview, not published/, `${c.slug}: the staged banner`);
    } else {
      assert.doesNotMatch(own, /noindex|Staged preview/, `${c.slug}: a published page is indexable and has no staged banner`);
      assert.match(own, new RegExp(`rel="canonical" href="https://nuxyautomation\\.com/portfolio/${c.slug}/"`), `${c.slug}: its canonical address`);
      assert.match(own, /application\/ld\+json[^>]*>[^<]*CreativeWork/, `${c.slug}: its structured data`);
    }
    for (const h of ["Project Overview", "The Challenge", "The Solution", "Features", "Design Showcase", "Technology", "Project Outcome"]) {
      assert.match(own, new RegExp(`<h2[^>]*>${h}</h2>`), `${c.slug}: the "${h}" section`);
    }
    assert.match(own, /Want a Website Built for Your Business\?/, `${c.slug}: the closing call to action`);
    assert.match(own, /From booking systems to custom business websites, NUXY builds digital experiences around the way your business operates\./);
    if (c.lead) assert.ok(own.includes(`/contact/?want=new-website&amp;from=${c.lead.id}`), `${c.slug}: Get a Free Quote carries the lead source`);
    // one quote button at the top and one in the closing band, not a third in between
    assert.equal((own.match(/data-track="cta_case_quote[a-z_]*"/g) ?? []).length, 2, `${c.slug}: two quote buttons`);
    // the "On this page" index lists the seven sections, and every link lands on a heading that is on the page
    const toc = own.match(/<nav class="cs-toc[^"]*"[^>]*aria-label="On this page"[^>]*>([\s\S]*?)<\/nav>/);
    assert.ok(toc, `${c.slug}: the section index`);
    // the link back to that index at the end of the page
    assert.match(own, /<nav class="cs-toc[^"]*" id="contents"/, `${c.slug}: the index can be linked to`);
    assert.match(own, /href="#contents"[^>]*data-track="case_study_contents"/, `${c.slug}: a way back to the index from the end`);
    const targets = [...toc[1].matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
    assert.equal(targets.length, 7, `${c.slug}: seven sections in the index`);
    for (const id of targets) assert.match(own, new RegExp(`<h2[^>]*id="${id}"`), `${c.slug}: #${id} is a heading on the page`);
    // the test-copy note is said once, not repeated
    assert.ok((text(own).match(/test copy/g) ?? []).length <= 1, `${c.slug}: the test-copy note appears at most once`);
    // the card: on the home page and /portfolio/, marked staged only in the stage build, before the concept demonstrations
    for (const url of ["/", "/portfolio/"]) {
      const html = pages.get(url);
      assert.match(html, new RegExp(`<article class="case[^"]*" id="case-${c.slug}"[^>]*${isStaged ? "data-staged" : ">"}`), `${url}: the card`);
      assert.match(html, /Real Client Website/, `${url}: the card says it is a real client website`);
      assert.match(html, new RegExp(`href="/portfolio/${c.slug}/"[^>]*data-track="case_study_open"`), `${url}: View Project`);
    }
    // client work comes before the concept demonstrations on the home page
    const home = pages.get("/");
    assert.ok(home.indexOf(`id="case-${c.slug}"`) < home.indexOf('data-track="example_open"'), "/: the client card comes before the concept demos");
    // the demo the project replaces is gone from the video teasers (its files stay, on /creative-studio/)
    if (c.replaces) {
      const name = new RegExp(c.replaces.replace(/-/g, "[- ]"), "i");
      for (const url of ["/", "/portfolio/"]) assert.doesNotMatch(text(pages.get(url)), name, `${url}: ${c.replaces} is replaced`);
      assert.match(text(pages.get("/creative-studio/")), name, `/creative-studio/: ${c.replaces} is kept there`);
    }
    // the quote form knows the lead source
    if (c.lead) assert.match(pages.get("/contact/"), /name="lead"/, "the quote form carries the lead field");
  }
});

test("a client page shows nothing private: no address, no admin route, no unapproved live link, no client contact details", { skip }, () => {
  for (const [c, root] of projects) {
    const own = pagesOf(root).get(`/portfolio/${c.slug}/`);
    const words = text(own);
    assert.doesNotMatch(own, /\/admin|\/dashboard|\/api\//i, `${c.slug}: no admin, dashboard or API route`);
    if (!liveLink(c)) {
      assert.doesNotMatch(own, /Visit Live Website|case_study_live/, `${c.slug}: no live link before the client agreed to one`);
      if (c.url) assert.ok(!own.includes(c.url), `${c.slug}: the live address is not on the page`);
    }
    assert.doesNotMatch(words, /\b\d{2,5}\s+[A-Z][a-z]+\s+(St|Street|Ave|Avenue|Rd|Road|Blvd|Dr|Drive|Ln|Lane|Way|Ct)\b/, `${c.slug}: no street address`);
    assert.doesNotMatch(words, /\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/, `${c.slug}: no phone number`);
    assert.doesNotMatch(words.replace(/[\w.+-]+@nuxyautomation\.com/g, ""), /[\w.+-]+@[\w-]+\.[\w.]+/, `${c.slug}: no email address`);
    if (c.location) assert.doesNotMatch(c.location, /\d/, `${c.slug}: location is a town at most`);
  }
});

test("every client picture and the walkthrough exist, are described, have their size and load lazily", { skip }, () => {
  for (const [c, root] of projects) {
    const own = pagesOf(root).get(`/portfolio/${c.slug}/`);
    // The cover at the top (CaseCover) shows the first computer and first phone shot inside a figure that names them;
    // the showcase leaves both cover shots out (no picture twice), so those are on the page as pictures, not as alt text.
    const coverPhone = (c.shots ?? []).filter((s) => s.device === "mobile");
    const coverDesk = (c.shots ?? []).filter((s) => s.device !== "mobile");
    for (const s of c.shots ?? []) {
      assert.ok(existsSync(join(root, s.src)), `${s.src} is in the build`);
      for (const part of (s.srcset ?? "").split(",").map((x) => x.trim().split(" ")[0]).filter(Boolean)) assert.ok(existsSync(join(root, part)), `${part} exists`);
      assert.ok(s.alt.trim().length >= 20 && s.width > 0 && s.height > 0, `${s.src}: described and sized`);
      if ((coverPhone.length > 1 && s === coverPhone[0]) || (coverDesk.length > 1 && s === coverDesk[0])) {
        assert.ok(own.includes(s.src) && /<figure[^>]*aria-label="The [^"]+ website on a computer and a phone"/.test(own), `${s.src}: shown in the named cover`);
        continue;
      }
      assert.ok(own.includes(`alt="${s.alt.replace(/"/g, "&quot;")}"`) || own.includes(s.alt), `${s.src}: its description is on the page`);
    }
    if (c.video) {
      for (const f of [c.video.src, c.video.poster, c.video.captions].filter(Boolean)) assert.ok(existsSync(join(root, f)), `${f} is in the build`);
      assert.ok(statSync(join(root, c.video.src)).size < 4 * 1024 * 1024, "the walkthrough stays under 4 MB");
      assert.match(own, /<video[^>]*preload="none"/, "the video loads nothing until played");
      assert.match(own, /<track kind="captions"/, "the video has a captions track");
    }
    // every picture below the top loads lazily; only the cover at the top is eager
    // (inside <main>: the header logo is the site's own and loads at once on every page)
    const main = own.slice(own.indexOf("<main"), own.indexOf("</main>"));
    const imgs = [...main.matchAll(/<img [^>]*>/g)].map((m) => m[0]);
    assert.ok(imgs.filter((i) => /fetchpriority="high"/.test(i)).length <= 2, "at most the cover's two pictures load early");
    for (const i of imgs.filter((i) => !/fetchpriority/.test(i))) assert.match(i, /loading="lazy"/, `lazy: ${i.slice(0, 80)}`);
    for (const i of imgs) assert.match(i, /width="\d+" height="\d+"/, `sized: ${i.slice(0, 80)}`);
  }
});

test("the production build carries none of the staged work", { skip: !haveDist && "dist/ is missing: run npm run build" }, () => {
  const pages = pagesOf(dist);
  for (const c of staged) {
    assert.ok(!pages.has(`/portfolio/${c.slug}/`), `${c.slug}: no project page in dist/`);
    for (const [url, html] of pages) {
      assert.ok(!html.includes(c.business), `${url}: ${c.business} is not in dist/`);
      if (c.lead) assert.ok(!html.includes(c.lead.id), `${url}: ${c.lead.id} is not in dist/`);
    }
    for (const s of c.shots ?? []) assert.ok(!existsSync(join(dist, s.src)), `${s.src} is not in dist/`);
    if (c.video) assert.ok(!existsSync(join(dist, c.video.src)), `${c.video.src} is not in dist/`);
    if (c.replaces) assert.match(pages.get("/"), new RegExp(c.replaces.replace(/-/g, "[- ]"), "i"), `${c.replaces} is still shown in dist/ until the client approves`);
  }
});
