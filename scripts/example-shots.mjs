// Remakes the example-website screenshots in public/images/examples/ from the built demo pages (/example-sites/<slug>/):
// a 1280x800 computer view and a 390x780 phone view, each captured at 2x, then saved as WebP at every width in
// shotWidths (src/data/demo-sites.ts). Run it after changing a demo site or adding one:
//   npx astro build
//   PLAYWRIGHT_CORE=<path to a playwright-core folder> BROWSER=<path to chrome.exe or msedge.exe> node scripts/example-shots.mjs [slug ...]
// Name one or more slugs to remake only those (so the other pictures stay byte-for-byte as they are).
// Needs ffmpeg (with libwebp) on PATH. Then build again so dist/ has the new pictures, and look at them before committing.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { serveDist } from "../tests/serve-dist.mjs";
import { demoSites, shotWidths } from "../src/data/demo-sites.ts";

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE || "playwright-core");
const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "public", "images", "examples");
const only = process.argv.slice(2);
const unknown = only.filter((s) => !demoSites.some((d) => d.slug === s));
if (unknown.length) throw new Error(`not a demo site: ${unknown.join(", ")}`);
const views = { desktop: { width: 1280, height: 800 }, phone: { width: 390, height: 780 } };

const web = await serveDist(join(root, "dist"));
const browser = await chromium.launch({ executablePath: process.env.BROWSER, headless: true });
const work = mkdtempSync(join(tmpdir(), "example-shots-"));
try {
  for (const { slug } of demoSites.filter((d) => !only.length || only.includes(d.slug))) {
    for (const [view, viewport] of Object.entries(views)) {
      // Reduced motion, so anything that fades in is already shown; fonts loaded, so the text is the real face.
      const context = await browser.newContext({ viewport, deviceScaleFactor: 2, reducedMotion: "reduce" });
      const page = await context.newPage();
      const res = await page.goto(`${web.url}/example-sites/${slug}/`, { waitUntil: "networkidle" });
      if (!res?.ok()) throw new Error(`/example-sites/${slug}/ answered ${res?.status()}: build the site first`);
      await page.evaluate(() => document.fonts.ready);
      const png = join(work, `${slug}-${view}.png`);
      await page.screenshot({ path: png });
      await context.close();
      const widths = shotWidths[view], widest = widths[widths.length - 1];
      for (const w of widths) {
        const file = join(out, `${slug}-${view}${w === widest ? "" : `-${w}`}.webp`);
        execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-vf", `scale=${w}:-2:flags=lanczos`,
          "-c:v", "libwebp", "-quality", "80", "-compression_level", "6", file]);
        console.log(`${file.slice(root.length)}  ${Math.round(statSync(file).size / 1024)} KB`);
      }
    }
  }
} finally {
  await browser.close();
  web.close();
  rmSync(work, { recursive: true, force: true });
}
