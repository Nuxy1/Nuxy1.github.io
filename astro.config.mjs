import { defineConfig } from "astro/config";
import { cpSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Published by GitHub Pages from repo Nuxy1/Nuxy1.github.io under the custom domain (Settings > Pages > Custom
// domain), so no base path.
// Code blocks use github-dark-default: every colour in it, comments included, passes WCAG AA contrast on its background
// (github-dark's grey comments are 3.0:1).
//
// Content Security Policy: GitHub Pages can't send headers, so Astro writes it as a <meta> tag on every page, with a
// hash for each script and stylesheet it builds. A script that isn't Nuxy's own (one slipped into a page) doesn't
// run. Beyond the site itself, the only address any page may talk to is the inquiry service (the form and the
// anonymous counts; `inquiryUrl` in src/data/site.ts, `hitUrl` in src/data/hit.ts). If one of those moves to a new address, change it
// here too, or the form and the counts are blocked (the contact-form test fails). Inline style="" attributes stay
// allowed for the code colours on the docs pages; they can't run code.
// Write page scripts as plain <script> blocks so Astro builds and hashes them. An `is:inline` script is blocked,
// except in <head> above the policy tag (the homepage's old-link redirect, which must run before the page draws).
// The site tests fail on any blocked script or style.
const INQUIRY_HOST = "https://preview.nuxyautomation.com";

// Test build only (tests/cinematic.test.mjs): CINEMATIC_FIXTURE=<manifest.json> builds the site against test-pattern
// clips made by scripts/cinematic-fixture.mjs, so the video components can be tested before any real video exists.
// That build reads the fixture's list in place of src/data/cinematic-manifest.json, takes its files from the `media`
// folder beside that list, and goes to dist-fixture/. It never writes dist/, the only folder that is published.
const FIXTURE = process.env.CINEMATIC_FIXTURE ? resolve(process.env.CINEMATIC_FIXTURE) : "";
const fixture = FIXTURE ? {
  outDir: "./dist-fixture",
  vite: { resolve: { alias: [{ find: /^.*\/cinematic-manifest\.json$/, replacement: FIXTURE.replace(/\\/g, "/") }] } },
  integrations: [{
    name: "cinematic-fixture",
    hooks: { "astro:build:done": ({ dir }) => cpSync(join(dirname(FIXTURE), "media"), join(fileURLToPath(dir), "media"), { recursive: true }) },
  }],
} : {};

// Stage build only (npm run build:stage): NUXY_STAGE=1 builds the site with the client case studies that still wait on
// the client's written approval (stage/case-studies.ts, in place of the empty src/data/staged-case-studies.ts), and
// their pictures and video (stage/media, copied into the build). It goes to dist-stage/, for review on this computer.
// It never writes dist/, the only folder that is published; tests/stage.test.mjs checks that nothing staged is in dist/.
const STAGE = process.env.NUXY_STAGE === "1";
if (STAGE && FIXTURE) throw new Error("NUXY_STAGE and CINEMATIC_FIXTURE are separate test builds: set one at a time.");
const here = dirname(fileURLToPath(import.meta.url));
const stage = STAGE ? {
  outDir: "./dist-stage",
  vite: { resolve: { alias: [{ find: /^.*\/staged-case-studies(\.ts)?$/, replacement: join(here, "stage", "case-studies.ts").replace(/\\/g, "/") }] } },
  integrations: [{
    name: "nuxy-stage",
    // stage/media holds the pictures of a staged project; it is absent while nothing is staged
    hooks: { "astro:build:done": ({ dir }) => { if (existsSync(join(here, "stage", "media"))) cpSync(join(here, "stage", "media"), join(fileURLToPath(dir), "media"), { recursive: true }); } },
  }],
} : {};
const build = STAGE ? stage : fixture;

// One script file per page: Vite wraps every lazy import() in a small "preload" helper, and once two pages have a lazy
// import (the quote form's estimate, the Halvane demo's 3D scene) that helper becomes a file of its own that /contact/
// has to fetch before the form works (tests/cinematic.test.mjs counts the files). When none of a script's lazy imports
// has anything to preload (the list Vite writes is `[]`), the helper does nothing but call the import, so this swaps
// it for that call. A script that does preload something keeps Vite's helper, and if Vite's output ever changes shape
// the swap simply doesn't happen and that test fails.
const inlineEmptyPreload = () => ({
  name: "nuxy:inline-empty-preload",
  apply: "build",
  generateBundle: {
    order: "post",
    handler(_, bundle) {
      const helper = Object.values(bundle).find((c) => c.type === "chunk" && /(^|\/)preload-helper\.[\w-]+\.js$/.test(c.fileName));
      if (!helper) return;
      const name = helper.fileName.split("/").pop().replace(/[.$]/g, "\\$&");
      const from = new RegExp(`import\\{([\\w$]+) as ([\\w$]+)\\}from"\\./${name}";`);
      for (const c of Object.values(bundle)) {
        if (c.type !== "chunk" || c === helper || !c.imports.includes(helper.fileName) || c.code.includes("__vite__mapDeps")) continue;
        const m = c.code.match(from);
        if (!m) continue;
        c.code = c.code.replace(m[0], `const ${m[2]}=(f)=>f();`);
        c.imports = c.imports.filter((i) => i !== helper.fileName);
      }
      if (!Object.values(bundle).some((c) => c.type === "chunk" && c.imports.includes(helper.fileName))) delete bundle[helper.fileName];
    },
  },
});

export default defineConfig({
  ...build,
  vite: { ...(build.vite || {}), plugins: [inlineEmptyPreload()] },
  site: "https://nuxyautomation.com",
  markdown: { shikiConfig: { theme: "github-dark-default" } },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        `connect-src 'self' ${INQUIRY_HOST}`,
        `form-action 'self' ${INQUIRY_HOST}`,
        "frame-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
      ],
      scriptDirective: { resources: ["'self'"] },
      styleDirective: { resources: ["'self'", { resource: "'unsafe-inline'", kind: "attribute" }] },
    },
  },
});
