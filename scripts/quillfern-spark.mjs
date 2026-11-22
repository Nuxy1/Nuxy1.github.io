// Prints the data URI of the Quillfern hero's spark (src/components/demo/quillfern/PhotoHero.astro): the gradient
// radial-gradient(closest-side, rgba(255,236,196,.95), rgba(255,196,120,.45) 40%, transparent) drawn into a 64px
// lossless WebP, blended premultiplied like the browser does. The spark used to be that CSS gradient; drawing it as an
// image made the moment the candle catches far cheaper on phones and looks the same (within 2 of 255 levels).
// Usage: node scripts/quillfern-spark.mjs
import sharp from "sharp";

const N = 64;
const stops = [[0, [255, 236, 196, 0.95]], [0.4, [255, 196, 120, 0.45]], [1, [255, 196, 120, 0]]];
const colourAt = (t) => {
  if (t >= 1) return [0, 0, 0, 0];
  const i = t < stops[1][0] ? 0 : 1, [t0, a] = stops[i], [t1, b] = stops[i + 1], k = (t - t0) / (t1 - t0);
  const pre = (c) => [c[0] * c[3], c[1] * c[3], c[2] * c[3], c[3]];
  const [pa, pb] = [pre(a), pre(b)], p = pa.map((v, j) => v + (pb[j] - v) * k);
  return p[3] > 0 ? [p[0] / p[3], p[1] / p[3], p[2] / p[3], p[3]] : [0, 0, 0, 0];
};
const px = Buffer.alloc(N * N * 4);
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const c = colourAt(Math.hypot(x + 0.5 - N / 2, y + 0.5 - N / 2) / (N / 2)), o = (y * N + x) * 4;
  px[o] = Math.round(c[0]); px[o + 1] = Math.round(c[1]); px[o + 2] = Math.round(c[2]); px[o + 3] = Math.round(c[3] * 255);
}
const webp = await sharp(px, { raw: { width: N, height: N, channels: 4 } }).webp({ lossless: true }).toBuffer();
process.stdout.write(`data:image/webp;base64,${webp.toString("base64")}\n`);
