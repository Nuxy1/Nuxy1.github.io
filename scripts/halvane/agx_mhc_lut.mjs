// Fit the HV_AGX_MHC table in src/lib/halvane/scene.ts from Blender's AgX "Medium High Contrast" samples.
//
//   node scripts/halvane/agx_mhc_lut.mjs <samples.json> [entries=48] [out.json]
//
// <samples.json> comes from agx_mhc_sample.py. The neutral ramp is decoded from sRGB and raised to 1/2.2 (three's AgX
// applies a 2.2 power after its outset matrix), then resampled to `entries` + 1 points over three's log2 range
// (-12.47393 .. +4.02607). The table replaces three's polynomial contrast curve; three's own inset / outset matrices
// stay. The script then runs the whole live chain on the 48 test colours, at saturation 1, 1.06 and 1.12, and prints the
// worst and mean error in 0-255 display units against Blender, so the saturation lift in scene.ts can be checked.
import { readFileSync, writeFileSync } from "node:fs";

const [samplesPath, entriesArg, outPath] = process.argv.slice(2);
if (!samplesPath) {
  console.error("usage: node agx_mhc_lut.mjs <samples.json> [entries=48] [out.json]");
  process.exit(1);
}
const D = JSON.parse(readFileSync(samplesPath, "utf8"));
const N = Number(entriesArg) || 48;
const LOG_MIN = -12.47393;
const LOG_RANGE = 16.5;

const dec = (d) => (d <= 0.04045 ? d / 12.92 : Math.pow((d + 0.055) / 1.055, 2.4));
const enc = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const cl = (x) => Math.min(1, Math.max(0, x));

const grey = D.grey.map(([stop, d]) => [(stop - LOG_MIN) / LOG_RANGE, Math.pow(dec(cl(d)), 1 / 2.2)]);
const last = grey.length - 1;
const sample = (x) => {
  const t = cl(x) * last;
  const i = Math.min(last - 1, Math.floor(t));
  return grey[i][1] + (grey[i + 1][1] - grey[i][1]) * (t - i);
};
const lut = Array.from({ length: N + 1 }, (_, i) => +sample(i / N).toFixed(5));
const curve = (x) => {
  const t = cl(x) * N;
  const i = Math.min(N - 1, Math.floor(t));
  return lut[i] + (lut[i + 1] - lut[i]) * (t - i);
};

// column-major 3x3 matrices, as three's AgXToneMapping declares them
const M = (c0, c1, c2) => (v) => [0, 1, 2].map((i) => c0[i] * v[0] + c1[i] * v[1] + c2[i] * v[2]);
const toRec2020 = M([0.6274, 0.0691, 0.0164], [0.3293, 0.9195, 0.088], [0.0433, 0.0113, 0.8956]);
const toRec709 = M([1.6605, -0.1246, -0.0182], [-0.5876, 1.1329, -0.1006], [-0.0728, -0.0083, 1.1187]);
const inset = M(
  [0.856627153315983, 0.137318972929847, 0.11189821299995],
  [0.0951212405381588, 0.761241990602591, 0.0767994186031903],
  [0.0482516061458583, 0.101439036467562, 0.811302368396859],
);
const outset = M(
  [1.1271005818144368, -0.1413297634984383, -0.14132976349843826],
  [-0.11060664309660323, 1.157823702216272, -0.11060664309660294],
  [-0.016493938717834573, -0.016493938717834257, 1.2519364065950405],
);

const live = (rgb, sat) => {
  let v = inset(toRec2020(rgb)).map((u) => cl(curve((Math.log2(Math.max(u, 1e-10)) - LOG_MIN) / LOG_RANGE)));
  v = toRec709(outset(v).map((u) => Math.pow(Math.max(0, u), 2.2)));
  if (sat !== 1) {
    const y = 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    v = v.map((u) => y + (u - y) * sat);
  }
  return v.map((u) => enc(cl(u)) * 255);
};

for (const sat of [1, 1.06, 1.12]) {
  let worst = 0;
  let sum = 0;
  for (const [rgb, ref] of D.col) {
    const e = Math.max(...live(rgb, sat).map((u, i) => Math.abs(u - ref[i] * 255)));
    worst = Math.max(worst, e);
    sum += e;
  }
  console.log(`${N + 1} entries, saturation ${sat}: worst ${worst.toFixed(1)}/255, mean ${(sum / D.col.length).toFixed(1)}/255`);
}
if (outPath) writeFileSync(outPath, JSON.stringify(lut));
else console.log(JSON.stringify(lut));
