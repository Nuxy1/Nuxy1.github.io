// Makes public/og.jpg (1200x630): the picture a phone or a chat app shows when a page of the site is shared.
// It is drawn from the same things the site uses: the approved logo file (with its tagline), the brand colours,
// the self-hosted Inter and the home page's headline. Nothing in it is a claim the site does not make.
// Run from portfolio/site, after `node scripts/brand-assets.mjs`:
//   PLAYWRIGHT_CORE=<path to a playwright-core folder> BROWSER=<path to chrome.exe or msedge.exe> node scripts/og-image.mjs
// Then look at public/og.jpg before committing. If the home headline changes, change `headline` here too.
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE || "playwright-core");
const root = fileURLToPath(new URL("..", import.meta.url));
const b64 = (p) => readFileSync(join(root, "public", p)).toString("base64");

const headline = ["Build Smarter.", "Grow Faster."];
const line = "Websites, automation and website care for small businesses, at clear prices in writing.";
const builds = ["Business websites", "Online stores", "AI & business automation", "Website care & repairs"];
const where = ["Faribault, Minnesota", "Twin Cities · remote across the US"];

const check = `<svg viewBox="0 0 24 24" fill="none" stroke="#43c7fa" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5L19.5 7"/></svg>`;
const pin = `<svg viewBox="0 0 24 24" fill="none" stroke="#43c7fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.500C5 14.900 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/></svg>`;

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: Inter; src: url(data:font/woff2;base64,${b64("fonts/inter-var-latin.woff2")}) format("woff2"); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 630px; }
body { position: relative; overflow: hidden; background: #080d17; color: #c7d2e1; font: 400 24px/1.4 Inter, sans-serif; font-feature-settings: "cv11", "ss01"; -webkit-font-smoothing: antialiased; }
/* one soft blue light, kept to the right so the logo's own dark panel has no visible edge */
body::before { content: ""; position: absolute; inset: 0; background: radial-gradient(520px 420px at 100% 0%, rgb(37 99 235 / 0.26), transparent 70%), radial-gradient(420px 320px at 100% 100%, rgb(67 199 250 / 0.07), transparent 70%); }
.left { position: absolute; left: 64px; top: 0; bottom: 0; width: 660px; }
.logo { position: absolute; left: -24px; top: 34px; width: 452px; height: auto; display: block; }
h1 { position: absolute; left: 0; top: 204px; color: #e8eef6; font-size: 86px; font-weight: 700; line-height: 1.03; letter-spacing: -0.038em; white-space: nowrap; }
h1 span { display: block; }
.line { position: absolute; left: 0; top: 400px; width: 590px; font-size: 25px; line-height: 1.4; color: #c7d2e1; }
.where { position: absolute; left: 0; bottom: 52px; display: flex; align-items: center; gap: 10px; font-size: 21px; color: #a5b4c8; white-space: nowrap; }
.where svg { width: 24px; height: 24px; flex: none; }
.where b { color: #e8eef6; font-weight: 600; }
.card { position: absolute; right: 64px; top: 50%; transform: translateY(-50%); width: 424px; padding: 34px 34px 30px; border: 1px solid #263a54; border-radius: 22px; background: rgb(25 39 60 / 0.82); box-shadow: 0 0 0 1px rgb(37 99 235 / 0.16), 0 24px 60px -24px rgb(37 99 235 / 0.45); }
.card p { color: #a5b4c8; font-size: 17px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; }
.card ul { list-style: none; padding: 0; margin-top: 14px; }
.card li { display: flex; align-items: center; gap: 14px; padding: 15px 0; border-top: 1px solid #263a54; color: #e8eef6; font-size: 23px; font-weight: 600; line-height: 1.25; }
.card li svg { width: 26px; height: 26px; flex: none; }
.card .url { margin-top: 4px; padding-top: 20px; border-top: 1px solid #263a54; color: #7cb3ff; font-size: 22px; font-weight: 600; letter-spacing: 0; text-transform: none; }
</style>
<div class="left">
  <img class="logo" alt="" src="data:image/webp;base64,${b64("brand/nuxy-logo-dark-tight-1200.webp")}">
  <h1>${headline.map((h) => `<span>${h}</span>`).join("")}</h1>
  <p class="line">${line}</p>
  <p class="where">${pin}<b>${where[0]}</b><span>· ${where[1]}</span></p>
</div>
<div class="card">
  <p>What we build</p>
  <ul>${builds.map((t) => `<li>${check}${t.replace("&", "&amp;")}</li>`).join("")}</ul>
  <p class="url">nuxyautomation.com</p>
</div>`;

const browser = await chromium.launch({ executablePath: process.env.BROWSER, headless: true });
try {
  const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })).newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").length);
  if (!fonts) throw new Error("Inter did not load: the picture would use a fallback font");
  const png = await page.screenshot({ type: "png" });
  const jpg = await sharp(png).resize({ width: 1200, height: 630, kernel: "lanczos3" }).jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
  writeFileSync(join(root, "public", "og.jpg"), jpg);
  console.log("public/og.jpg", jpg.length, "bytes");
} finally {
  await browser.close();
}
