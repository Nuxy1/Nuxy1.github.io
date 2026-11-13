// The video files the site may show. Used at build time by the components; page scripts get only what a component
// hands them in the HTML.
// The list is src/data/cinematic-manifest.json, written by scripts/encode-cinematic.mjs after it has made and checked
// each file. A loop or demo that is not listed does not exist as far as the pages are concerned: the component that
// would show it renders nothing, so an unfinished video can never appear as an empty box or a broken player.
//
// CINEMATIC_FIXTURE=<manifest.json> builds the site against test-pattern clips instead (tests/cinematic.test.mjs):
// astro.config.mjs points this import at that file and sends the build to dist-fixture/, never to dist/, so a test
// pattern cannot be published.
import listed from "./cinematic-manifest.json";

export type MediaFile = { src: string; bytes: number };
export type MediaSource = MediaFile & { type: string };
export type Loop = { width: number; height: number; duration: number; audio: false; poster: MediaFile; posterMobile?: MediaFile; sources: MediaSource[]; mobile?: MediaSource[] };
/** posterMobile: the same frame at 400 x 225 (or 225 x 400), for a card that shows it as a thumbnail */
export type DemoCut = { width: number; height: number; duration: number; audio: boolean; poster: MediaFile; posterMobile?: MediaFile; sources: MediaSource[] };
export type Demo = DemoCut & { captions?: MediaFile; /** a 9:16 cut for phones held upright */ vertical?: DemoCut };
type Manifest = { loops: Record<string, Loop>; demos: Record<string, Demo> };

const manifest = listed as unknown as Manifest;

export const loopOf = (id: string): Loop | undefined => manifest.loops[id];
export const demoOf = (id: string): Demo | undefined => manifest.demos[id];
/** The gallery is shown complete or not at all: true only when every one of these demos has its files. */
export const demosReady = (ids: string[]) => ids.length > 0 && ids.every((id) => Boolean(manifest.demos[id]));
/** "0:15" */
export const clock = (seconds: number) => `${Math.floor(Math.round(seconds) / 60)}:${String(Math.round(seconds) % 60).padStart(2, "0")}`;
