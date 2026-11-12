// One animation loop helper for every demo effect: it runs only while its element is on screen and the tab is
// visible, keeps to a frame-rate cap, and stop() removes every listener it added. Canvas helpers cap the pixel ratio
// at 1.5 (a 3x phone screen would otherwise draw nine times the pixels for no visible gain).
export const dpr = () => Math.min(window.devicePixelRatio || 1, 1.5);

export function loop(el: Element, frame: (t: number, dt: number) => void, { fps = 60 } = {}) {
  let raf = 0, last = 0, onScreen = false, stopped = false;
  const step = 1000 / fps - 1;
  const tick = (t: number) => {
    raf = 0;
    if (stopped || !onScreen || document.hidden) return;
    const dt = last ? t - last : 16;
    if (dt >= step) { last = t; frame(t, Math.min(dt, 64)); }
    raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf && !stopped && onScreen && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); } };
  const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; kick(); });
  io.observe(el);
  const vis = () => kick();
  document.addEventListener("visibilitychange", vis);
  return {
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    },
  };
}

/** Size a canvas to its box at the capped pixel ratio; returns the CSS size. Call again on resize. */
export function fit(canvas: HTMLCanvasElement) {
  const r = canvas.getBoundingClientRect(), k = dpr();
  const w = Math.max(1, Math.round(r.width * k)), h = Math.max(1, Math.round(r.height * k));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  return { w: r.width, h: r.height, k };
}

/** Pointer position over an element as -1..1 on each axis, smoothed; stop() removes the listeners. */
export function pointer(el: HTMLElement) {
  const p = { x: 0, y: 0, tx: 0, ty: 0, px: -1, py: -1, inside: false };
  const move = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    const r = el.getBoundingClientRect();
    p.px = e.clientX - r.left; p.py = e.clientY - r.top;
    p.tx = (p.px / r.width) * 2 - 1; p.ty = (p.py / r.height) * 2 - 1;
    p.inside = true;
  };
  const leave = () => { p.tx = 0; p.ty = 0; p.inside = false; p.px = -1; p.py = -1; };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerleave", leave);
  return {
    p,
    /** ease toward the target; call once a frame */
    ease(k = 0.08) { p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; return p; },
    stop() { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); },
  };
}
