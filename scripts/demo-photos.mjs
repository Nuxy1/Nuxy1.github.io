// Makes the small photo files the four example sites serve, from the full-size masters in assets/cinematic/demos/
// (git-ignored; where each master came from is in docs/demo-photo-assets.md). Usage: node scripts/demo-photos.mjs
// Writes public/images/demos/<name>-<width>.avif and .webp and src/data/demo-photos.json (sizes for <DemoPhoto>).
import sharp from "sharp";
import { readdirSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const src = join(root, "assets/cinematic/demos");
const out = join(root, "public/images/demos");
mkdirSync(out, { recursive: true });

// widths by shape: wide heroes need a big file for 2x desktop screens; tiles and portraits never show that large;
// 160 is for small thumbnails (the quote picker shows 56 px squares)
const widthsFor = (w, h, name) => (/-hero/.test(name) ? [640, 1024, 1600, 2400] : w / h > 1.05 ? [160, 480, 800, 1200] : [360, 600, 900]);

// AVIF quality 52 by default. The Fernway hero is striped grass in fine detail, which costs about twice the bytes of
// the other heroes at the same setting: 42 cut its 1024 file from 63 KB to 39 KB with no visible change at 2x zoom
// (compared 2026-11-21), which matters because it is the phone's largest paint.
const avifQuality = (name) => ({ "fernway-hero": 42 })[name] ?? 52;

const manifest = {};
for (const file of readdirSync(src).filter((f) => f.endsWith(".png")).sort()) {
  const name = basename(file, ".png");
  const input = sharp(join(src, file));
  const { width, height } = await input.metadata();
  const widths = widthsFor(width, height, name).filter((x) => x <= width);
  for (const w of widths) {
    const resized = () => sharp(join(src, file)).resize({ width: w, withoutEnlargement: true });
    const avif = join(out, `${name}-${w}.avif`), webp = join(out, `${name}-${w}.webp`);
    if (!existsSync(avif)) await resized().avif({ quality: avifQuality(name), effort: 5 }).toFile(avif);
    if (!existsSync(webp)) await resized().webp({ quality: 78, effort: 5 }).toFile(webp);
  }
  // the colour under the photo while it loads, so the space never flashes white or black
  const { channels } = await sharp(join(src, file)).resize(32).stats();
  const hex = "#" + channels.slice(0, 3).map((c) => Math.round(c.mean)).map((v) => v.toString(16).padStart(2, "0")).join("");
  manifest[name] = { w: width, h: height, widths, bg: hex };
  console.log(name, `${width}x${height}`, widths.join(","), hex);
}
writeFileSync(join(root, "src/data/demo-photos.json"), JSON.stringify(manifest, null, 2) + "\n");
