import { defineConfig } from "astro/config";
import { cpSync } from "node:fs";
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
// anonymous counts; `inquiryUrl` and `hitUrl` in src/data/site.ts). If one of those moves to a new address, change it
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

export default defineConfig({
  ...fixture,
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
