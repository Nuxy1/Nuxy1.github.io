// Makes test-pattern clips and runs them through the real encoder (scripts/encode-cinematic.mjs), so the video
// components can be built and tested before any real video exists. Nothing here is footage and nothing is published:
// the files go to tests/fixtures/cinematic/ (not in git), every frame says TEST PATTERN, and the site only reads them
// in a CINEMATIC_FIXTURE build, which goes to dist-fixture/ (see astro.config.mjs).
//
//   node scripts/cinematic-fixture.mjs          makes the fixture (a minute or so), skipped when it already exists
//   node scripts/cinematic-fixture.mjs --force  makes it again
// Needs ffmpeg and ffprobe on PATH (or FFMPEG / FFPROBE). No generation service is called and no credits are spent.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { LOOPS } from "./cinematic-limits.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const FFMPEG = process.env.FFMPEG || "ffmpeg";
export const fixtureDir = join(root, "tests", "fixtures", "cinematic");
export const fixtureManifest = join(fixtureDir, "manifest.json");
// Written after the last clip: the manifest alone appears with the first clip, so a run that stopped halfway would
// otherwise pass for a finished fixture.
const done = join(fixtureDir, "done");

export function makeFixture(force = false) {
  if (existsSync(done) && existsSync(fixtureManifest) && !force) return fixtureManifest;
  rmSync(fixtureDir, { recursive: true, force: true });
  const masters = join(fixtureDir, "masters"), media = join(fixtureDir, "media");
  mkdirSync(masters, { recursive: true });
  mkdirSync(media, { recursive: true });
  const ffmpeg = (args) => execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: ["ignore", "ignore", "inherit"] });
  // A moving test card (ffmpeg's own, unmistakably not footage) with a label burned in when the computer has one of
  // these fonts; a hue per clip tells them apart on screen.
  const font = ["C:/Windows/Fonts/arial.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"].find((f) => existsSync(f));
  const label = (name) => (font ? `,drawtext=fontfile='${font.replace(":", "\\:")}':text='TEST PATTERN ${name}':fontcolor=white:fontsize=h/16:x=(w-text_w)/2:y=(h-text_h)/2` : "");
  const master = (name, { w = 1920, h = 1080, seconds = 7, hue = 0, sound = false }) => {
    const file = join(masters, `${name}.mp4`);
    const picture = `testsrc2=size=${w}x${h}:rate=30:duration=${seconds},hue=h=${hue},drawbox=x=0:y=ih*0.4:w=iw:h=ih*0.2:color=black@0.85:t=fill${label(name)}`;
    ffmpeg(["-f", "lavfi", "-i", picture, ...(sound ? ["-f", "lavfi", "-i", `sine=frequency=${330 + hue}:duration=${seconds}`, "-c:a", "aac", "-shortest"] : []), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", file]);
    return file;
  };
  const encode = (...args) => execFileSync(process.execPath, [join(root, "scripts", "encode-cinematic.mjs"), ...args, "--out", media, "--manifest", fixtureManifest], { stdio: ["ignore", "ignore", "inherit"] });

  LOOPS.forEach((id, i) => encode("loop", id, master(id, { hue: i * 60 }), "--length", "6.5"));
  const captions = join(masters, "captions.vtt");
  writeFileSync(captions, "WEBVTT\n\n00:00.000 --> 00:03.000\nTest pattern captions\n\n00:03.000 --> 00:06.000\nSecond caption\n");
  encode("demo", "vantage-motors", master("vantage-motors", { seconds: 8, hue: 200, sound: true }), "--captions", captions, "--vertical", master("vantage-motors-v", { w: 1080, h: 1920, seconds: 8, hue: 200, sound: true }));
  encode("demo", "ember-oak", master("ember-oak", { seconds: 8, hue: 30, sound: true }));
  encode("demo", "noctis-skin", master("noctis-skin", { w: 1080, h: 1920, seconds: 8, hue: 280, sound: true }));
  rmSync(masters, { recursive: true, force: true });
  writeFileSync(done, "");
  return fixtureManifest;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) console.log(makeFixture(process.argv.includes("--force")));
