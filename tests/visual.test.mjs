// Visual regression: the first screen of each main page, at a phone and a desktop width, compared with the saved
// pictures in tests/visual/. A change that moves, hides, crops or recolours something fails here even when every
// other test still passes. Reduced motion is on, and each shot waits for the fonts and the images on screen.
//
//   npm run build
//   PLAYWRIGHT_CORE=<path to a playwright-core folder> BROWSER=<path to chrome.exe or msedge.exe> node --test tests/visual.test.mjs
//
// After a change you meant to make, save new pictures and LOOK at them before committing:
//
//   UPDATE_BASELINES=1 PLAYWRIGHT_CORE=... BROWSER=... node --test tests/visual.test.mjs
//
// A failing page writes its new screenshot and a difference picture (changed pixels in red) to tests/visual/out/,
// which is not committed. Fonts are drawn slightly differently on other computers and browser versions, so the saved
// pictures belong to one setup, named in tests/visual/setup.json, and a failure on a different setup says so. On a new
// computer, build a version known to be good and save its pictures first.
// The PNG reader below is small and built in, so this test needs no extra package.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateSync, inflateSync } from "node:zlib";
import { serveDist } from "./serve-dist.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "..", "dist");
const saved = join(here, "visual");
const out = join(saved, "out");
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE || "playwright-core");
const UPDATE = process.env.UPDATE_BASELINES === "1";

const PAGES = { home: "/", automation: "/automation/", websites: "/websites/", "get-a-website": "/get-a-website/",
  pricing: "/pricing/", demos: "/demos/", about: "/about/", contact: "/contact/" };
const SCREENS = [{ width: 390, height: 844 }, { width: 1440, height: 900 }];
// A pixel counts as changed when a colour channel moves by more than CHANNEL; a page fails when more than SHARE of
// its pixels changed. The same build on the same setup gives 0 changed pixels; the slack is for edge smoothing only.
const CHANNEL = 24;
const SHARE = 0.0002;

// --- PNG: 8-bit RGB or RGBA, not interlaced (what browsers' screenshots are) ---
function decode(buf) {
  assert.equal(buf.readUInt32BE(0), 0x89504e47, "not a PNG");
  let pos = 8, width = 0, height = 0, depth = 0, type = 0, interlace = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), kind = buf.toString("latin1", pos + 4, pos + 8), body = buf.subarray(pos + 8, pos + 8 + len);
    if (kind === "IHDR") [width, height, depth, type, interlace] = [body.readUInt32BE(0), body.readUInt32BE(4), body[8], body[9], body[12]];
    else if (kind === "IDAT") idat.push(body);
    else if (kind === "IEND") break;
    pos += 12 + len;
  }
  if (depth !== 8 || (type !== 2 && type !== 6) || interlace) throw new Error(`unsupported PNG: depth ${depth}, colour type ${type}, interlace ${interlace}`);
  const bpp = type === 6 ? 4 : 3, stride = width * bpp, raw = inflateSync(Buffer.concat(idat)), px = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)], src = y * (stride + 1) + 1, row = y * stride, up = row - stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? px[row + i - bpp] : 0, b = y ? px[up + i] : 0, c = y && i >= bpp ? px[up + i - bpp] : 0;
      let v = raw[src + i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[row + i] = v & 255;
    }
  }
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0, j = 0; i < px.length; i += bpp, j += 4) {
    data[j] = px[i]; data[j + 1] = px[i + 1]; data[j + 2] = px[i + 2]; data[j + 3] = bpp === 4 ? px[i + 3] : 255;
  }
  return { width, height, data };
}

function encode({ width, height, data }) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) data.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  const chunk = (kind, body) => {
    const head = Buffer.alloc(8), crc = Buffer.alloc(4);
    head.writeUInt32BE(body.length);
    head.write(kind, 4, "latin1");
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])));
    return Buffer.concat([head, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

// Changed pixels, and a picture of them: the new screenshot dimmed, with every changed pixel in red.
function compare(want, got) {
  const diff = Buffer.alloc(got.data.length);
  let changed = 0;
  for (let i = 0; i < got.data.length; i += 4) {
    const moved = Math.max(Math.abs(want.data[i] - got.data[i]), Math.abs(want.data[i + 1] - got.data[i + 1]), Math.abs(want.data[i + 2] - got.data[i + 2])) > CHANNEL;
    if (moved) changed++;
    diff[i] = moved ? 255 : got.data[i] >> 2;
    diff[i + 1] = moved ? 0 : got.data[i + 1] >> 2;
    diff[i + 2] = moved ? 0 : got.data[i + 2] >> 2;
    diff[i + 3] = 255;
  }
  return { changed, diff: { width: got.width, height: got.height, data: diff } };
}

// The setup the pictures were saved on is kept beside them, so a failure on another computer or browser says so
// instead of looking like a broken page.
const setupFile = join(saved, "setup.json");
let web, browser, setup, otherSetup = "";
before(async () => {
  assert.ok(existsSync(join(dist, "index.html")), "run npm run build first");
  web = await serveDist(dist);
  const executablePath = process.env.BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
  browser = await chromium.launch({ executablePath, headless: true });
  setup = { browser: `${basename(executablePath).replace(/\.exe$/i, "")} ${browser.version()}`, system: process.platform };
  rmSync(out, { recursive: true, force: true });
  if (UPDATE) {
    mkdirSync(saved, { recursive: true });
    writeFileSync(setupFile, JSON.stringify(setup, null, 2) + "\n");
  } else if (existsSync(setupFile)) {
    const was = JSON.parse(readFileSync(setupFile, "utf8"));
    if (was.browser !== setup.browser || was.system !== setup.system) {
      otherSetup = ` (pictures saved with ${was.browser} on ${was.system}, this run is ${setup.browser} on ${setup.system}: ` +
        "if the difference picture shows only text edges, save pictures for this setup from a build known to be good)";
    }
  }
});
after(async () => {
  await browser?.close();
  web?.close();
});

async function shoot(path, screen) {
  const context = await browser.newContext({ viewport: screen, reducedMotion: "reduce", deviceScaleFactor: 1 });
  try {
    // Nothing from other sites; the anonymous visit count only runs on the real address anyway.
    await context.route((url) => url.origin !== web.url, (route) => route.abort());
    const page = await context.newPage();
    await page.goto(web.url + path, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => [...document.images].every((img) => img.complete || img.getBoundingClientRect().top > innerHeight));
    return await page.screenshot({ animations: "disabled", caret: "hide" });
  } finally {
    await context.close();
  }
}

test("the PNG reader reads a browser screenshot pixel for pixel", async () => {
  const context = await browser.newContext({ viewport: { width: 64, height: 48 }, deviceScaleFactor: 1 });
  try {
    const page = await context.newPage();
    await page.setContent(`<body style="margin:0;background:#123456"><div style="width:10px;height:10px;background:#abcdef"></div><div style="margin-left:30px;width:20px;height:20px;background:linear-gradient(90deg,#000,#fff)"></div></body>`);
    const shot = decode(await page.screenshot());
    const at = (x, y) => [...shot.data.subarray((y * shot.width + x) * 4, (y * shot.width + x) * 4 + 3)];
    assert.equal(shot.width, 64);
    assert.equal(shot.height, 48);
    assert.deepEqual(at(0, 0), [0xab, 0xcd, 0xef]);
    assert.deepEqual(at(9, 9), [0xab, 0xcd, 0xef]);
    assert.deepEqual(at(40, 40), [0x12, 0x34, 0x56]);
    assert.deepEqual(at(63, 47), [0x12, 0x34, 0x56]);
    const [left] = at(31, 15), [right] = at(48, 15);
    assert.ok(left < 40 && right > 215 && left < right, `gradient read as ${left}..${right}`);
    assert.deepEqual(decode(encode(shot)).data, shot.data, "writing and reading back changes nothing");
  } finally {
    await context.close();
  }
});

for (const [name, path] of Object.entries(PAGES)) {
  for (const screen of SCREENS) {
    const file = `${name}-${screen.width}.png`;
    test(`${path} at ${screen.width}px looks the same as tests/visual/${file}`, async () => {
      const png = await shoot(path, screen);
      if (UPDATE || !existsSync(join(saved, file))) {
        mkdirSync(saved, { recursive: true });
        writeFileSync(join(saved, file), png);
        if (!UPDATE) assert.fail(`no saved picture yet: saved ${file}; look at it, then run the test again`);
        return;
      }
      const want = decode(readFileSync(join(saved, file))), got = decode(png);
      const save = (diff) => {
        mkdirSync(out, { recursive: true });
        writeFileSync(join(out, file), png);
        if (diff) writeFileSync(join(out, file.replace(".png", "-diff.png")), encode(diff));
      };
      if (want.width !== got.width || want.height !== got.height) {
        save();
        assert.fail(`size changed: saved ${want.width}x${want.height}, now ${got.width}x${got.height}${otherSetup}`);
      }
      const { changed, diff } = compare(want, got);
      const limit = Math.floor(got.width * got.height * SHARE);
      if (changed > limit) save(diff);
      assert.ok(changed <= limit, `${changed} pixels changed (limit ${limit}); see tests/visual/out/${file.replace(".png", "-diff.png")}${otherSetup}`);
    });
  }
}
