// Makes the website's logo files from the approved masters in business/brand/logo (see its README).
// Only resizes and re-encodes: nothing is redrawn, blurred or recoloured. Run from portfolio/site: node scripts/brand-assets.mjs
import sharp from "sharp";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const site = join(dirname(fileURLToPath(import.meta.url)), "..");
const brand = join(site, "..", "..", "business", "brand", "logo");
const master = (n) => join(brand, "masters", n);
const pub = join(site, "public");
const out = join(pub, "brand");
mkdirSync(out, { recursive: true });

const OBSIDIAN = { r: 8, g: 13, b: 23, alpha: 1 }; // #080D17, the brand's darkest surface
const fit = { kernel: "lanczos3" };
const webp = { quality: 90, alphaQuality: 100, effort: 6 };

// 1. The full logo (symbol, NUXY, AUTOMATION) on a clear background: header and footer.
for (const w of [240, 360, 480, 540, 800]) await sharp(master("nuxy-logo-transparent.png")).resize({ width: w, ...fit }).webp(webp).toFile(join(out, `nuxy-logo-${w}.webp`));
await sharp(master("nuxy-logo-transparent.png")).resize({ width: 480, ...fit }).png({ compressionLevel: 9 }).toFile(join(out, "nuxy-logo-480.png"));

// 2. The dark logo with its tagline, on #080D17: promotional sections.
// Its empty margin is trimmed (the page gives the spacing), so the tagline stays as large as it can on a phone.
// Trimmed only where the picture is the flat #080D17 background: the glow around the ring is kept whole.
const darkTight = await sharp(master("nuxy-logo-dark.png")).trim({ background: "#080D17", threshold: 4 }).extend({ top: 24, bottom: 24, left: 24, right: 24, background: OBSIDIAN }).png().toBuffer({ resolveWithObject: true });
for (const w of [600, 1200]) await sharp(darkTight.data).resize({ width: w, ...fit }).webp({ quality: 88, effort: 6 }).toFile(join(out, `nuxy-logo-dark-tight-${w}.webp`));
console.log("dark logo trimmed to", darkTight.info.width, "x", darkTight.info.height);

// 3. The N symbol alone.
for (const w of [96, 192, 496]) await sharp(master("nuxy-icon-transparent.png")).resize({ width: w, ...fit }).webp(webp).toFile(join(out, `nuxy-icon-${w}.webp`));

// 4. App icons: the symbol on the brand's dark square.
const darkSquare = async (size) => sharp(master("nuxy-icon-dark.png")).resize({ width: size, height: size, fit: "contain", background: OBSIDIAN, ...fit }).flatten({ background: OBSIDIAN }).png({ compressionLevel: 9 }).toBuffer();
writeFileSync(join(pub, "apple-touch-icon.png"), await darkSquare(180));
writeFileSync(join(pub, "icon-192.png"), await darkSquare(192));
writeFileSync(join(pub, "icon-512.png"), await darkSquare(512));
writeFileSync(join(pub, "logo.png"), await darkSquare(512)); // (named in the site's structured data)

// 5. favicon.ico (16, 32, 48): cropped close to the solid symbol, because a wide glow margin leaves a 16 px icon too small to read.
const layer = sharp(join(brand, "layers", "layer_icon.png"));
const { data, info } = await layer.clone().raw().toBuffer({ resolveWithObject: true });
let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
const side = Math.max(x1 - x0, y1 - y0) + 24, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
const left = Math.max(0, Math.round(cx - side / 2)), top = Math.round(cy - side / 2);
const tight = await layer.clone().extend({ top: Math.max(0, -top), bottom: Math.max(0, top + side - info.height), background: { r: 0, g: 0, b: 0, alpha: 0 } }).extract({ left, top: Math.max(0, top), width: side, height: side }).png().toBuffer();
const pngs = [];
for (const s of [16, 32, 48]) pngs.push([s, await sharp(tight).resize({ width: s, height: s, ...fit }).png({ compressionLevel: 9 }).toBuffer()]);
const head = Buffer.alloc(6 + 16 * pngs.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
let offset = head.length;
pngs.forEach(([s, buf], i) => {
  const e = 6 + i * 16;
  head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3);
  head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6); head.writeUInt32LE(buf.length, e + 8); head.writeUInt32LE(offset, e + 12);
  offset += buf.length;
});
writeFileSync(join(pub, "favicon.ico"), Buffer.concat([head, ...pngs.map(([, b]) => b)]));
writeFileSync(join(out, "nuxy-icon-tight-64.png"), await sharp(tight).resize({ width: 64, height: 64, ...fit }).png({ compressionLevel: 9 }).toBuffer());

// The old vector mark is retired: the approved logo is a raster image and is not redrawn as vector shapes.
if (existsSync(join(pub, "favicon.svg"))) rmSync(join(pub, "favicon.svg"));
console.log("brand assets written to", out);
