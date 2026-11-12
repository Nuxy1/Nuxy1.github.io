// Turns a finished master video into the small files the website serves, and lists them in
// src/data/cinematic-manifest.json. The site shows a video only when it is listed there, and tests/creative.test.mjs
// fails if a listed file is missing or is not the size the list says, so nothing reaches a page without passing here.
//
//   node scripts/encode-cinematic.mjs loop <id> <master> [--from 0] [--length <the rest of the master>] [--blend 0.5]
//       A silent background loop. <id>: hero, web-development, automation, security or creative-studio.
//       --blend fades the last half second into the first so the loop has no visible cut (0 for a master that
//       already loops). Makes a 1280x720 and a 640x360 version (MP4, plus WebM when it is smaller) and two posters,
//       which are the loop's first frame, so the video takes over from the picture without a jump.
//   node scripts/encode-cinematic.mjs demo <id> <master> [--poster-at 1] [--captions file.vtt] [--vertical master]
//       A portfolio demo with its sound. <id>: one of `demos` in src/data/creative.ts. --vertical adds a 9:16 cut
//       that phones held upright get instead.
//   node scripts/encode-cinematic.mjs remove <loop|demo> <id>      takes it off the site and deletes its files
//   node scripts/encode-cinematic.mjs check                         probes every listed file again
//
// A loop or demo is built in a work folder and checked there; only one that passes is moved into the site and
// listed, so a failed run leaves the files and the list exactly as they were.
// Masters stay in assets/cinematic/ (never served). Needs ffmpeg and ffprobe on PATH (or FFMPEG / FFPROBE).
// Paid generation is a separate, owner-approved step: this script never calls a generation service.
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const root = fileURLToPath(new URL("..", import.meta.url));
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const FFPROBE = process.env.FFPROBE || "ffprobe";
// (the size limits live in their own file so the tests can read them without running this script)
import { LOOPS, LIMITS } from "./cinematic-limits.mjs";

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    from: { type: "string", default: "0" }, length: { type: "string" }, blend: { type: "string", default: "0.5" },
    "poster-at": { type: "string" }, captions: { type: "string" }, vertical: { type: "string" },
    // (for trial runs and the tests: write somewhere other than the real site)
    out: { type: "string", default: join(root, "public", "media") },
    manifest: { type: "string", default: join(root, "src", "data", "cinematic-manifest.json") },
    "allow-id": { type: "boolean", default: false },
  },
});
const [command, ...rest] = positionals;
const fail = (message) => { console.error(`encode-cinematic: ${message}`); process.exit(1); };
const number = (name, fallback) => {
  const raw = opt[name] ?? fallback;
  const n = Number(raw);
  if (raw === undefined || !Number.isFinite(n) || n < 0) fail(`--${name} must be a number of seconds`);
  return n;
};
const run = (bin, args) => execFileSync(bin, args, { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 }).toString();
const ffmpeg = (args) => run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...args]);

function probe(file) {
  const info = JSON.parse(run(FFPROBE, ["-v", "error", "-show_format", "-show_streams", "-of", "json", file]));
  const video = info.streams.find((s) => s.codec_type === "video");
  if (!video) fail(`${file} has no video`);
  return { width: video.width, height: video.height, codec: video.codec_name, pixels: video.pix_fmt, duration: Number(info.format.duration), audio: info.streams.some((s) => s.codec_type === "audio") };
}
// A file that probes fine can still be cut short or damaged: play it through once and fail on any decoder complaint.
function plays(file) {
  const result = spawnSync(FFMPEG, ["-hide_banner", "-v", "error", "-i", file, "-f", "null", "-"], { stdio: ["ignore", "ignore", "pipe"], maxBuffer: 64 * 1024 * 1024 });
  const complaints = String(result.stderr ?? "").trim();
  if (result.status !== 0 || complaints) fail(`${file} does not play cleanly: ${(complaints || `ffmpeg exit ${result.status}`).slice(0, 300)}`);
}

const readManifest = () => (existsSync(opt.manifest) ? JSON.parse(readFileSync(opt.manifest, "utf8")) : { loops: {}, demos: {} });
const sorted = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
const writeManifest = (m) => writeFileSync(opt.manifest, JSON.stringify({ loops: sorted(m.loops), demos: sorted(m.demos) }, null, 2) + "\n");
// (where new files are written: the work folder while a loop or demo is being built)
let dir = opt.out;
const temps = [];
process.on("exit", () => { for (const t of temps) rmSync(t, { recursive: true, force: true }); });
const temp = (prefix) => { const t = mkdtempSync(join(tmpdir(), prefix)); temps.push(t); return t; };
const nameOf = (src) => src.replace(/^\/media\//, "");
const listed = (name) => ({ src: `/media/${name}`, bytes: statSync(join(dir, name)).size });
const filesOf = (entry) => [entry.poster, entry.posterMobile, entry.captions, ...(entry.sources ?? []), ...(entry.mobile ?? []), ...(entry.vertical ? filesOf(entry.vertical) : [])].filter(Boolean);
const fill = (w, h) => `scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${w}:${h},setsar=1`;
const round = (n) => Math.round(n * 100) / 100;

// Encodes `source` to `name`, stepping the quality down until it fits `limit`; fails rather than ship an oversized file.
function fit(source, name, limit, build, start, steps = 5) {
  const target = join(dir, name);
  for (let i = 0; i <= steps; i++) {
    ffmpeg(["-i", source, ...build(start + i * 2), target]);
    if (statSync(target).size <= limit) return listed(name);
  }
  rmSync(target, { force: true });
  fail(`${name} is still over ${limit} bytes at the lowest quality tried: shorten the clip or use a calmer take`);
}
const h264 = (filter, audio) => (crf) => ["-vf", filter, "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", String(crf), "-movflags", "+faststart", ...(audio ? ["-c:a", "aac", "-b:a", "128k", "-ac", "2"] : ["-an"])];
const vp9 = (filter) => (crf) => ["-vf", filter, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", String(crf), "-row-mt", "1", "-pix_fmt", "yuv420p", "-an"];
function poster(source, at, name, width, height) {
  ffmpeg(["-ss", String(at), "-i", source, "-frames:v", "1", "-vf", fill(width, height), "-c:v", "libwebp", "-quality", "72", join(dir, name)]);
  const file = listed(name);
  if (file.bytes > LIMITS.poster) fail(`${name} is ${file.bytes} bytes (limit ${LIMITS.poster})`);
  return file;
}
function sources(source, stem, [w, h], limit, crf) {
  const mp4 = fit(source, `${stem}.mp4`, limit, h264(fill(w, h), false), crf);
  const webm = fit(source, `${stem}.webm`, limit, vp9(fill(w, h)), crf + 9);
  // WebM first, so a browser that plays it takes the smaller file; dropped when it saves nothing
  if (webm.bytes < mp4.bytes * 0.9) return [{ ...webm, type: "video/webm" }, { ...mp4, type: "video/mp4" }];
  rmSync(join(dir, `${stem}.webm`), { force: true });
  return [{ ...mp4, type: "video/mp4" }];
}

function loop(id, master) {
  if (!LOOPS.includes(id) && !opt["allow-id"]) fail(`not a loop the site has a place for: ${id} (${LOOPS.join(", ")})`);
  if (opt["poster-at"] !== undefined) fail("--poster-at is for demos; a loop's poster is its first frame");
  const src = probe(master);
  const from = number("from"), blend = number("blend");
  const length = opt.length === undefined ? src.duration - from : number("length");
  if (length <= 0 || from + length > src.duration + 0.05) fail(`the master is ${round(src.duration)} s: --from ${from} --length ${length} does not fit`);
  if (length - blend > 10) fail(`a background loop is at most 10 seconds (this would be ${round(length - blend)})`);
  if (blend * 3 > length) fail("--blend is too long for this clip");
  const work = temp("cinematic-");
  {
    // One clean intermediate: cut, 24 frames a second, the end faded into the start, no sound.
    const cut = `[0:v]trim=start=${from}:end=${from + length},setpts=PTS-STARTPTS,fps=24,${fill(1280, 720)}`;
    const graph = blend > 0
      ? `${cut},split[x][y];[x]trim=start=${blend},setpts=PTS-STARTPTS[b];[y]trim=end=${blend},setpts=PTS-STARTPTS[a];[b][a]xfade=transition=fade:duration=${blend}:offset=${round(length - 2 * blend)},format=yuv420p[v]`
      : `${cut},format=yuv420p[v]`;
    const clean = join(work, "loop.mp4");
    ffmpeg(["-i", master, "-filter_complex", graph, "-map", "[v]", "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "10", clean]);
    const stem = `loop-${id}`;
    const entry = {
      width: 1280, height: 720, duration: round(probe(clean).duration), audio: false,
      poster: poster(clean, 0, `${stem}.webp`, 1280, 720),
      posterMobile: poster(clean, 0, `${stem}-m.webp`, 640, 360),
      sources: sources(clean, stem, [1280, 720], LIMITS.loop, 27),
      mobile: sources(clean, `${stem}-m`, [640, 360], LIMITS.loopMobile, 29),
    };
    return entry;
  }
}

function cutOf(master, stem, posterAt) {
  const src = probe(master);
  const tall = src.height > src.width;
  const [w, h] = tall ? [720, 1280] : [1280, 720];
  const ratio = src.width / src.height, want = w / h;
  if (Math.abs(ratio - want) / want > 0.03) fail(`${master} is ${src.width}x${src.height}: a demo master must be 16:9 or 9:16`);
  if (src.duration < 5 || src.duration > 61) fail(`${master} is ${round(src.duration)} s: a demo is 5 to 60 seconds`);
  if (posterAt >= src.duration) fail("--poster-at is past the end of the video");
  const file = fit(master, `${stem}.mp4`, LIMITS.demo, h264(fill(w, h), src.audio), 23);
  return { width: w, height: h, duration: round(probe(join(dir, `${stem}.mp4`)).duration), audio: src.audio, poster: poster(master, posterAt, `${stem}.webp`, w * 0.75, h * 0.75), sources: [{ ...file, type: "video/mp4" }] };
}
function demo(id, master) {
  if (!/^[a-z0-9-]{1,40}$/.test(id)) fail(`not a demo id: ${id}`);
  if (!opt["allow-id"]) {
    const known = [...readFileSync(join(root, "src", "data", "creative.ts"), "utf8").matchAll(/\{ id: "([a-z0-9-]+)", title:/g)].map((m) => m[1]);
    if (!known.includes(id)) fail(`not a demo in src/data/creative.ts: ${id} (${known.join(", ")})`);
  }
  const at = number("poster-at", "1");
  // (asked before anything is encoded, so a wrong file costs no time and changes nothing)
  if (opt.vertical) {
    if (!existsSync(opt.vertical)) fail(`no such file: ${opt.vertical}`);
    const v = probe(opt.vertical);
    if (v.height <= v.width) fail("--vertical must be a 9:16 master");
  }
  const entry = cutOf(master, `demo-${id}`, at);
  if (!entry.audio) console.warn(`note: ${id} has no sound track`);
  if (opt.captions) {
    const text = readFileSync(opt.captions, "utf8");
    if (!/^﻿?WEBVTT/.test(text) || !/-->/.test(text)) fail(`${opt.captions} is not a WebVTT captions file`);
    copyFileSync(opt.captions, join(dir, `demo-${id}.vtt`));
    entry.captions = listed(`demo-${id}.vtt`);
  }
  if (opt.vertical) {
    entry.vertical = cutOf(opt.vertical, `demo-${id}-v`, Math.min(at, probe(opt.vertical).duration - 0.1));
  }
  return entry;
}

function check(manifest, from = opt.out) {
  let count = 0;
  for (const [group, entries] of Object.entries(manifest))
    for (const [id, entry] of Object.entries(entries))
      for (const f of filesOf(entry)) {
        const file = join(from, nameOf(f.src));
        if (!existsSync(file)) fail(`${group}.${id}: ${f.src} is missing`);
        if (statSync(file).size !== f.bytes) fail(`${group}.${id}: ${f.src} is ${statSync(file).size} bytes, the list says ${f.bytes}`);
        if (/\.(mp4|webm)$/.test(file)) {
          plays(file);
          const p = probe(file);
          if (group === "loops" && p.audio) fail(`${group}.${id}: ${f.src} has a sound track`);
          if (p.pixels !== "yuv420p") fail(`${group}.${id}: ${f.src} is ${p.pixels}, which some phones cannot play`);
        }
        count++;
      }
  return count;
}

mkdirSync(opt.out, { recursive: true });
const manifest = readManifest();
if (command === "loop" || command === "demo") {
  const [id, master] = rest;
  if (!id || !master) fail(`usage: ${command} <id> <master file>`);
  if (!existsSync(master)) fail(`no such file: ${master}`);
  const group = command === "loop" ? "loops" : "demos";
  const before = manifest[group][id] ? filesOf(manifest[group][id]).map((f) => f.src) : [];
  const stage = (dir = temp("cinematic-out-"));
  const entry = command === "loop" ? loop(id, resolve(master)) : demo(id, resolve(master));
  // Checked where it was built. Any failure above or here ends the run with the site's files and list untouched.
  check({ [group]: { [id]: entry } }, stage);
  for (const f of filesOf(entry)) copyFileSync(join(stage, nameOf(f.src)), join(opt.out, nameOf(f.src)));
  // (a file the new entry no longer uses, like a WebM that stopped being worth it, is not left behind)
  const now = new Set(filesOf(entry).map((f) => f.src));
  for (const src of before) if (!now.has(src)) rmSync(join(opt.out, nameOf(src)), { force: true });
  manifest[group][id] = entry;
  writeManifest(manifest);
  const total = filesOf(entry).reduce((t, f) => t + f.bytes, 0);
  console.log(`${group}.${id}: ${entry.width}x${entry.height}, ${entry.duration} s, ${entry.audio ? "with sound" : "silent"}, ${filesOf(entry).length} files, ${total} bytes`);
  for (const f of filesOf(entry)) console.log(`  ${f.src}  ${f.bytes}`);
} else if (command === "remove") {
  const [kind, id] = rest;
  const group = kind === "loop" ? "loops" : kind === "demo" ? "demos" : fail("usage: remove <loop|demo> <id>");
  if (!manifest[group][id]) fail(`${group}.${id} is not listed`);
  for (const f of filesOf(manifest[group][id])) rmSync(join(opt.out, nameOf(f.src)), { force: true });
  delete manifest[group][id];
  writeManifest(manifest);
  console.log(`removed ${group}.${id}`);
} else if (command === "check") {
  console.log(`${check(manifest)} files listed, all present, the right size and playable`);
} else {
  fail("usage: loop <id> <master> | demo <id> <master> | remove <loop|demo> <id> | check");
}
