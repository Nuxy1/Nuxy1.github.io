/* The hero poster is the page's largest paint. Work the first view does not need (three.js for the background,
   the orbit and technology reel frames, the light-sweep clip, the finale frames, the pendulum scene) waits until the poster has
   actually been painted. Started earlier, it shares a phone's bandwidth and main thread with the first view, and
   Lighthouse counts every request that starts before that paint into LCP (it measured 2.1 to 4.7 s where the paint
   itself took 0.3 s).
   Element Timing reports the paint itself (Chromium). Elsewhere the poster's decode plus two frames stands in for
   it, and a time cap keeps a poster that never paints (a failed load, a page restored mid-scroll) from holding
   anything back for long. */
const ID = "hero-poster";
const CAP_MS = 3000;
let queue = [];

const flush = () => {
  if (!queue) return;
  const waiting = queue;
  queue = null;
  for (const fn of waiting) fn();
};

const watch = () => {
  const img = document.getElementById("product-poster");
  const twoFrames = () => requestAnimationFrame(() => requestAnimationFrame(flush));
  if (!img) return twoFrames();
  setTimeout(flush, CAP_MS);
  img.addEventListener("error", flush, { once: true });
  const types = typeof PerformanceObserver === "function" ? PerformanceObserver.supportedEntryTypes || [] : [];
  if (types.includes("element") && img.getAttribute("elementtiming") === ID) {
    const observer = new PerformanceObserver((list) => {
      if (!list.getEntries().some((entry) => entry.identifier === ID)) return;
      observer.disconnect();
      flush();
    });
    observer.observe({ type: "element", buffered: true });
    return;
  }
  if ("decode" in img) img.decode().then(twoFrames, twoFrames);
  else twoFrames();
};

/** Runs fn once the hero poster has been painted (at once if it already has). */
export function afterHeroPaint(fn) {
  if (queue) queue.push(fn);
  else fn();
}

watch();
