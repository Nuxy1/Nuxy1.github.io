// Plays the background loops (components/CinematicLoop.astro). One loop plays at a time; a loop's video file is
// requested only when it is first about to play, and never for a visitor on the reduced or light motion level, on a
// data saver, in a tab that is not showing, or behind an open video player. Nothing here reads or stores anything about the visitor.
type Net = Navigator & { connection?: { saveData?: boolean } };
type Source = { src: string; type: string };

const root = document.documentElement;
const loops = [...document.querySelectorAll<HTMLElement>("[data-cine]")];
const videoOf = (el: HTMLElement) => el.querySelector("video")!;
const dead = new WeakSet<HTMLElement>(); // (a loop whose file failed: the poster stays, it is not tried again)
const seen = new Map<HTMLElement, number>(); // how much of each "view" loop is on screen, 0..1
const held = new WeakSet<HTMLElement>(); // loops the visitor paused with the button: they stay paused on this page
let wanted: HTMLElement | null = null; // the hovered or focused "hover" loop, which wins over the ones in view
let ready = false;
let now: HTMLElement | null = null;

// (an open video player has the visitor's attention: no loop plays behind it)
const allowed = () => ready && root.hasAttribute("data-ambient") && !document.hidden && !(navigator as Net).connection?.saveData && !matchMedia("(prefers-reduced-data: reduce)").matches && !document.querySelector("dialog[open]");

function attach(el: HTMLElement) {
  const video = videoOf(el);
  if (video.childElementCount) return;
  // (data-small: the width the component chose; an empty phone list there means a still, so nothing is attached)
  const small = el.dataset.mobile && matchMedia(el.dataset.small || "(max-width: 640px)").matches;
  let list: Source[] = [];
  try { list = JSON.parse((small ? el.dataset.mobile : el.dataset.sources) ?? "[]"); } catch { /* no sources: the poster stays */ }
  for (const s of list) {
    // (only this site's own /media/ files, whatever the attribute says)
    if (!/^\/media\/[a-z0-9-]+\.(mp4|webm)$/.test(s.src)) continue;
    const source = document.createElement("source");
    source.src = s.src; source.type = s.type;
    video.append(source);
  }
  video.addEventListener("playing", () => { if (now === el) el.classList.add("on"); });
  // (a file that cannot be fetched or decoded: the last <source> reports it, the video itself for a decode error)
  const failed = () => { dead.add(el); el.classList.remove("on"); if (now === el) now = null; };
  video.addEventListener("error", failed);
  video.lastElementChild?.addEventListener("error", failed);
}

function stop(el: HTMLElement) {
  const video = videoOf(el);
  video.pause();
  if (el.dataset.cine === "hover") { el.classList.remove("on"); if (video.readyState) video.currentTime = 0; }
}

const stillNow = (el: HTMLElement) => el.dataset.mobile === "[]" && matchMedia(el.dataset.small || "(max-width: 640px)").matches;

function choose() {
  let next: HTMLElement | null = null;
  if (allowed()) {
    next = wanted;
    if (!next) {
      let best = 0.35; // (a loop plays once about a third of it is on screen)
      for (const [el, ratio] of seen) if (ratio > best) { best = ratio; next = el; }
    }
    if (next && (dead.has(next) || held.has(next))) next = null;
    // (a loop that is a still at this width, even when a wider window attached its video earlier)
    if (next && stillNow(next)) next = null;
  }
  if (next === now) return;
  if (now) { stop(now); if (stillNow(now)) now.classList.remove("on"); }
  now = next;
  if (!next) return;
  attach(next);
  const video = videoOf(next);
  if (!video.childElementCount) { now = null; return; }
  video.play().catch(() => { /* the browser refused to start it: the poster stays */ });
}

if (loops.length) {
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set(e.target as HTMLElement, e.isIntersecting ? e.intersectionRatio : 0);
      choose();
    }, { threshold: [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1] });
    for (const el of loops) if (el.dataset.cine === "view") io.observe(el);
  }
  for (const el of loops) {
    if (el.dataset.cine !== "hover") continue;
    const host = el.closest<HTMLElement>("[data-cine-host]") ?? el;
    const on = () => { wanted = el; choose(); };
    const off = () => { if (wanted === el) { wanted = null; choose(); } };
    // (a mouse only: on a touch screen a hover sticks after a tap, and the tap is meant for the card's link)
    host.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") on(); });
    host.addEventListener("pointerleave", off);
    host.addEventListener("focusin", on);
    host.addEventListener("focusout", (e) => { if (!host.contains(e.relatedTarget as Node | null)) off(); });
  }
  // The pause button (CinematicLoop.astro, the element right after a "view" loop). It shows while the video plays and
  // while the visitor holds it paused; a paused loop keeps its current frame and is not restarted by scrolling.
  for (const el of loops) {
    const button = el.nextElementSibling;
    if (!(button instanceof HTMLButtonElement) || !button.hasAttribute("data-cine-toggle")) continue;
    const video = videoOf(el);
    const sync = () => { button.hidden = video.paused && !held.has(el); };
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    button.addEventListener("click", () => {
      const pause = !held.has(el);
      if (pause) { held.add(el); if (now === el) { stop(el); now = null; } } else held.delete(el);
      button.setAttribute("aria-pressed", String(pause));
      choose();
      sync();
    });
  }
  document.addEventListener("nuxy:motion", choose);
  // (a window narrowed past a still's width stops its video; widened again, the video comes back)
  for (const small of new Set(loops.map((el) => el.dataset.mobile === "[]" ? el.dataset.small : "").filter(Boolean))) matchMedia(small!).addEventListener("change", choose);
  document.addEventListener("visibilitychange", choose);
  document.addEventListener("nuxy:player", choose); // (CreativeGallery.astro: its player opened or closed)
  // Start only after the page itself has finished loading and the browser is idle: the video never competes with it.
  const start = () => { ready = true; choose(); };
  const idle = () => ("requestIdleCallback" in window ? requestIdleCallback(start, { timeout: 2500 }) : setTimeout(start, 600));
  if (document.readyState === "complete") idle(); else addEventListener("load", idle, { once: true });
}
