// Cuts the three Creative Studio concept demos from their approved shots (assets/cinematic/shots/, never in git) into
// the masters scripts/encode-cinematic.mjs reads. It makes nothing new and calls no generation service: it trims the
// shots, dissolves between them, lays the type over them and puts the music bed under them.
//
//   PLAYWRIGHT_CORE=<path to a playwright-core folder> BROWSER=<path to msedge.exe or chrome.exe> node scripts/cut-demos.mjs [id ...]
//
// The words on screen are set in the site's own fonts (public/fonts) by a browser and saved as see-through pictures,
// so the videos use the same type as the pages. Every word is the brief's: the made-up brand, its line, and for the
// menu the three dishes and prices. Each end card says the brand is fictional, so the label travels with the file.
// Shots used, in order, and how long each runs are in CUTS below; change a number there and run it again.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const shots = join(root, "assets", "cinematic", "shots");
const typeDir = join(root, "assets", "cinematic", "type");
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const BLEND = 0.5; // (seconds one shot takes to dissolve into the next)
const NOTE = ["Concept demonstration. Fictional brand.", "Made by Nuxy Automation."];

const font = (file) => readFileSync(join(root, "public", "fonts", file)).toString("base64");
const css = `
@font-face { font-family: "Sofia"; font-weight: 700; src: url(data:font/woff2;base64,${font("sofia-xc-700.woff2")}) format("woff2"); }
@font-face { font-family: "Figtree"; font-weight: 300 900; src: url(data:font/woff2;base64,${font("figtree-var.woff2")}) format("woff2"); }
html, body { margin: 0; background: transparent; }
.f { position: relative; overflow: hidden; color: #fff; font-family: "Figtree"; }
.f > * { position: absolute; margin: 0; }
.c { left: 0; right: 0; text-align: center; }
.shade { text-shadow: 0 2px 22px rgba(0, 0, 0, 0.95), 0 0 4px rgba(0, 0, 0, 0.6); }
`;
// (letter spacing adds a gap after the last letter: the same indent in front keeps a centred line centred)
const spaced = (em) => `letter-spacing:${em}em;text-indent:${em}em`;
const note = (bottom, size, color) => `<p class="c" style="bottom:${bottom}px;font:400 ${size}px/1.5 Figtree;letter-spacing:.06em;color:${color}">${NOTE.join("<br>")}</p>`;

const vantage = (tall) => {
  const [w, h] = tall ? [1080, 1920] : [1920, 1080];
  const s = tall ? "vv" : "vh";
  const name = tall ? 92 : 136, small = tall ? 27 : 32;
  return {
    w, h, music: "music-vantage.mp3", fadeIn: tall ? 1 : 0.5,
    segs: [{ src: `${s}1`, ss: 0.3, dur: 3.2 }, { src: `${s}2`, ss: 0.5, dur: 3.2 }, { src: `${s}3`, ss: 0.4, dur: 3.8 }, { src: `${s}4`, ss: 0.5, dur: 3.4 }, { card: "black", dur: 3.4 }],
    type: [
      { in: 9.2, out: 11.2, html: `<p class="c shade" style="top:${Math.round(h * (tall ? 0.8 : 0.86))}px;font:500 ${small}px/1 Figtree;${spaced(tall ? 0.3 : 0.42)}">ENGINEERED TO STAND APART.</p>` },
      { in: 12.0, html: `<p class="c" style="top:${Math.round(h * 0.5) - name}px;font:700 ${name}px/1 Sofia;${spaced(tall ? 0.22 : 0.3)}">VANTAGE MOTORS</p>` },
      { in: 12.5, html: `<p class="c" style="top:${Math.round(h * 0.5) + Math.round(name * 0.45)}px;font:500 ${small - 2}px/1 Figtree;${spaced(tall ? 0.3 : 0.42)};color:#c5cedb">ENGINEERED TO STAND APART.</p>` },
      { in: 12.8, html: note(tall ? 120 : 64, tall ? 26 : 24, "#8b95a3") },
    ],
  };
};

const cream = "#f6e8cc", amber = "#f2a93b";
const dish = (top, name, price) => `
  <div style="inset:0;background:linear-gradient(to right, rgba(0,0,0,.62), rgba(0,0,0,0) 52%)"></div>
  <p class="shade" style="left:132px;top:${top}px;font:700 112px/1 Sofia;letter-spacing:.03em;color:${cream}">${name}</p>
  <div style="left:136px;top:${top + 136}px;width:96px;height:4px;background:${amber}"></div>
  <p class="shade" style="left:134px;top:${top + 168}px;font:700 76px/1 Figtree;color:${amber}">${price}</p>`;
const dishOnly = (top, name, price) => dish(top, name, price).replace(/<div style="inset:0[^>]*><\/div>/, "");

const CUTS = {
  "vantage-motors": vantage(false),
  "vantage-motors-vertical": vantage(true),
  "ember-oak": {
    w: 1920, h: 1080, music: "music-ember.mp3", fadeIn: 0.6,
    // (the end card is the opening room again, slowed, darkened and out of focus: on a menu screen the video then loops cleanly)
    segs: [{ src: "e1", ss: 0.2, dur: 4.6 }, { src: "e2", ss: 0.2, dur: 4.7 }, { src: "e3", ss: 0.2, dur: 4.7 }, { card: "e1", dur: 5.5 }],
    type: [
      { in: 0.9, out: 3.5, html: `<div style="inset:0;background:radial-gradient(ellipse at center, rgba(0,0,0,.6), rgba(0,0,0,0) 68%)"></div><p class="c shade" style="top:440px;font:700 200px/1 Sofia;${spaced(0.1)};color:${cream}">EMBER &amp; OAK</p>` },
      { in: 4.9, out: 7.8, html: dish(380, "Signature Burger", "$14") },
      // One dish at a time in the same place: stacked, "House Lemonade" ran into the fries cup.
      { in: 8.7, out: 12.3, html: `<div style="inset:0;background:linear-gradient(to right, rgba(0,0,0,.62), rgba(0,0,0,0) 52%)"></div>` },
      { in: 8.7, out: 10.4, html: dishOnly(170, "Truffle Fries", "$7") },
      { in: 10.6, out: 12.3, html: dishOnly(170, "House Lemonade", "$5") },
      { in: 13.1, html: `<p class="c shade" style="top:372px;font:700 200px/1 Sofia;${spaced(0.1)};color:${cream}">EMBER &amp; OAK</p>` },
      { in: 13.7, html: `<p class="c shade" style="top:620px;font:600 34px/1 Figtree;${spaced(0.36)};color:${amber}">CRAFTED FOR THE CRAVING.</p>` },
      { in: 14.2, html: note(64, 24, "#c9bfae") },
    ],
  },
  "noctis-skin": {
    w: 1080, h: 1920, music: "music-noctis.mp3", fadeIn: 0.4,
    segs: [{ src: "n1", ss: 0, dur: 3.4 }, { src: "n2", ss: 0.3, dur: 3.2 }, { src: "n3", ss: 0.4, dur: 3.2 }, { src: "n4", ss: 0.3, dur: 3.4 }, { card: "black", dur: 3.8 }],
    type: [
      { in: 1.4, out: 5.2, html: `<p class="c shade" style="top:150px;font:300 66px/1 Figtree;${spaced(0.5)};color:#eef2f8">NOCTIS SKIN</p>` },
      { in: 3.3, out: 5.2, html: `<p class="c shade" style="top:262px;font:400 31px/1 Figtree;${spaced(0.2)};color:#b4bfcf">Midnight Renewal Serum</p>` },
      { in: 11.7, html: `<p class="c" style="top:820px;font:300 66px/1 Figtree;${spaced(0.5)};color:#eef2f8">NOCTIS SKIN</p><div style="left:508px;top:936px;width:64px;height:1px;background:#6f7b8c"></div>` },
      { in: 12.3, html: `<p class="c" style="top:984px;font:400 28px/1 Figtree;${spaced(0.42)};color:#b4bfcf">REFINE YOUR RITUAL.</p>` },
      { in: 12.7, html: note(120, 26, "#7d8796") },
    ],
  },
};

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CUTS);
for (const id of ids) if (!CUTS[id]) { console.error(`cut-demos: no such cut: ${id} (${Object.keys(CUTS).join(", ")})`); process.exit(1); }
mkdirSync(typeDir, { recursive: true });

// 1. The type, as see-through pictures the size of the frame.
const playwright = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE || "playwright-core");
const browser = await playwright.chromium.launch({ executablePath: process.env.BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
try {
  for (const id of ids) {
    const cut = CUTS[id];
    const page = await browser.newPage({ viewport: { width: cut.w, height: cut.h }, deviceScaleFactor: 1 });
    for (const [i, layer] of cut.type.entries()) {
      const html = join(typeDir, `${id}-${i}.html`);
      writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>${css}</style><div class="f" style="width:${cut.w}px;height:${cut.h}px">${layer.html}</div>`);
      await page.goto(pathToFileURL(html).href);
      // (both fonts are asked for by name, so a card can never be drawn in a stand-in font)
      const ok = await page.evaluate(async () => { const got = await Promise.all([document.fonts.load('700 40px "Sofia"'), document.fonts.load('400 40px "Figtree"')]); await document.fonts.ready; return got.every((list) => list.length > 0) && [...document.fonts].every((f) => f.status === "loaded"); });
      if (!ok) throw new Error(`${id}: the site's fonts did not load for the type`);
      // (nothing may run off the frame: a clipped word would be cut silently)
      const over = await page.evaluate(() => [...document.querySelectorAll(".f p")].filter((p) => { const r = document.createRange(); r.selectNodeContents(p); const b = r.getBoundingClientRect(); return b.left < 24 || b.right > innerWidth - 24 || b.top < 0 || b.bottom > innerHeight; }).map((p) => p.textContent));
      if (over.length) throw new Error(`${id}: type runs off the frame: ${over.join(" | ")}`);
      await page.screenshot({ path: join(typeDir, `${id}-${i}.png`), omitBackground: true });
    }
    await page.close();
  }
} finally { await browser.close(); }

// 2. The cut.
const round = (n) => Math.round(n * 1000) / 1000;
for (const id of ids) {
  const cut = CUTS[id];
  const { w, h } = cut;
  const total = round(cut.segs.reduce((sum, s) => sum + s.dur, 0) - (cut.segs.length - 1) * BLEND);
  const args = ["-hide_banner", "-loglevel", "error", "-y"];
  const graph = [];
  const frame = `fps=24,scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1`;
  cut.segs.forEach((s, i) => {
    if (s.card === "black") {
      args.push("-f", "lavfi", "-t", String(s.dur), "-i", `color=c=black:s=${w}x${h}:r=24`);
      graph.push(`[${i}:v]format=yuv420p,setsar=1[s${i}]`);
    } else if (s.card) {
      const file = join(shots, `${s.card}.mp4`);
      if (!existsSync(file)) throw new Error(`missing shot: ${file}`);
      args.push("-i", file);
      graph.push(`[${i}:v]setpts=1.25*(PTS-STARTPTS),${frame},gblur=sigma=16,eq=brightness=-0.2:saturation=0.85,trim=duration=${s.dur},setpts=PTS-STARTPTS,format=yuv420p[s${i}]`);
    } else {
      const file = join(shots, `${s.src}.mp4`);
      if (!existsSync(file)) throw new Error(`missing shot: ${file}`);
      args.push("-i", file);
      graph.push(`[${i}:v]trim=start=${s.ss}:duration=${s.dur},setpts=PTS-STARTPTS,${frame},format=yuv420p[s${i}]`);
    }
  });
  let last = "s0", at = 0;
  for (let i = 1; i < cut.segs.length; i++) {
    at = round(at + cut.segs[i - 1].dur - BLEND);
    graph.push(`[${last}][s${i}]xfade=transition=fade:duration=${BLEND}:offset=${at}[x${i}]`);
    last = `x${i}`;
  }
  const n = cut.segs.length;
  cut.type.forEach((layer, i) => {
    args.push("-loop", "1", "-framerate", "24", "-t", String(total), "-i", join(typeDir, `${id}-${i}.png`));
    const out = layer.out === undefined ? "" : `,fade=t=out:st=${layer.out}:d=0.5:alpha=1`;
    graph.push(`[${n + i}:v]format=rgba,fade=t=in:st=${layer.in}:d=0.6:alpha=1${out}[t${i}]`);
    graph.push(`[${last}][t${i}]overlay=0:0:format=auto[o${i}]`);
    last = `o${i}`;
  });
  graph.push(`[${last}]fade=t=in:st=0:d=${cut.fadeIn},fade=t=out:st=${round(total - 0.6)}:d=0.6,format=yuv420p[v]`);
  // (the shots' own generated sound is dropped: only the music bed is heard)
  const music = join(shots, cut.music);
  if (!existsSync(music)) throw new Error(`missing music: ${music}`);
  args.push("-i", music);
  graph.push(`[${n + cut.type.length}:a]atrim=0:${total},asetpts=PTS-STARTPTS,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.3,afade=t=out:st=${round(total - 1.8)}:d=1.8,aresample=48000[a]`);
  const target = join(root, "assets", "cinematic", `demo-${id}.mp4`);
  args.push("-filter_complex", graph.join(";"), "-map", "[v]", "-map", "[a]", "-t", String(total), "-r", "24", "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-ac", "2", "-movflags", "+faststart", target);
  execFileSync(FFMPEG, args, { stdio: ["ignore", "inherit", "inherit"] });
  console.log(`${id}: ${total} s -> ${target}`);
}
