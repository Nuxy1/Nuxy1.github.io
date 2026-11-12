// The Lumen One speaker in 3D, for the Halvane Audio concept page (/example-sites/halvane-audio/). The page imports
// this module only after it has loaded, only when the visitor has not asked for reduced motion, and only when WebGL
// works; otherwise the page keeps its still drawing of the speaker, which tells the same story.
// Everything is built from code (no model or texture downloads): a rounded walnut cabinet, a paper woofer, an
// aluminium tweeter in a brass ring, a front slot port, and a back plate that carries the crossover board.
// Budget rules from the website-levels brief: pixel ratio at most 1.5, fewer segments on phones, no reflection map
// (three's reflection blur shader blocked the page for about 0.4 s on Windows desktops; lights alone look the same),
// the set-up runs in short steps with the shaders compiled before the first frame,
// drawing stops when the canvas is off screen or the tab is hidden, and dispose() frees every geometry, material,
// texture and the WebGL context itself.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, MeshStandardMaterial, MeshBasicMaterial,
  CylinderGeometry, LatheGeometry, SphereGeometry, TorusGeometry, PlaneGeometry, BoxGeometry,
  HemisphereLight, DirectionalLight, CanvasTexture, Vector2, Vector3,
  ACESFilmicToneMapping, SRGBColorSpace, RepeatWrapping, DoubleSide, MathUtils,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export type Part = "cabinet" | "woofer" | "tweeter" | "crossover";
export type Finish = "walnut" | "chalk" | "graphite";

export interface Speaker {
  /** 0 = assembled, 1 = fully taken apart */
  setExplode(t: number): void;
  setPart(p: Part): void;
  setFinish(f: Finish): void;
  /** stops the slow idle sway (the scene still answers drags and buttons) */
  setPaused(paused: boolean): void;
  /** turn the speaker by this many radians */
  turn(rad: number): void;
  dispose(): void;
}

interface Options {
  phone: boolean;
  /** where the active part sits on the canvas, in CSS pixels, so the page can place its label there */
  onLabel(x: number, y: number): void;
  onLost(): void;
}

const FINISH: Record<Finish, { color: number; rough: number; grain: boolean }> = {
  walnut: { color: 0x8a5c3c, rough: 0.55, grain: true },
  chalk: { color: 0xe4ddd0, rough: 0.82, grain: false },
  graphite: { color: 0x34322f, rough: 0.6, grain: false },
};
// how far the speaker turns to show each part (radians around its upright axis)
const YAW: Record<Part, number> = { cabinet: 0.55, woofer: 0.3, tweeter: 0.22, crossover: 2.85 };

// wood grain drawn once on a canvas: soft vertical bands with a little wobble, multiplied by the finish colour
function grainTexture(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, size, size);
  for (let x = 0; x < size; x++) {
    const band = Math.sin(x * 0.09) * 0.5 + Math.sin(x * 0.023 + 1.7) * 0.35 + Math.sin(x * 0.31) * 0.15;
    const v = Math.round(214 + band * 30);
    g.fillStyle = `rgb(${v},${v - 6},${v - 12})`;
    for (let y = 0; y < size; y += 8) g.fillRect(x + Math.sin(y * 0.02 + x * 0.004) * 2, y, 1, 8);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

// a plain white map for the painted finishes: the wood material always has a map, so changing finish never
// changes its shader (a missing map would force a fresh shader compile in the middle of a click)
function plainTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 2;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, 2, 2);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

// hand the main thread back between the heavy steps, so a tap or a scroll is never stuck behind the whole set-up
const breathe = () => new Promise<void>((done) => setTimeout(done, 0));

// soft round shadow under the speaker, so it stands on something without a lit floor
function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  r.addColorStop(0, "rgba(0,0,0,0.55)");
  r.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}

export async function mountSpeaker(canvas: HTMLCanvasElement, opts: Options): Promise<Speaker> {
  const seg = opts.phone ? 32 : 72;
  const renderer = new WebGLRenderer({ canvas, antialias: !opts.phone, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.1, 60);
  await breathe();
  scene.add(new HemisphereLight(0xfff1e0, 0x1a1410, 0.55));
  const key = new DirectionalLight(0xffd6a0, 2.4);
  key.position.set(3.5, 4.5, 5);
  const rim = new DirectionalLight(0x9db4ff, 1.3);
  rim.position.set(-4.5, 2, -3.5);
  const fill = new DirectionalLight(0xffe8cc, 0.5);
  fill.position.set(-3, -1, 4);
  scene.add(key, rim, fill);

  // materials
  const metal = 0.55; // metals read by the lights alone, without a reflection map
  const grain = grainTexture(opts.phone ? 256 : 512);
  const plain = plainTexture();
  const wood = new MeshStandardMaterial({ color: FINISH.walnut.color, roughness: FINISH.walnut.rough, map: FINISH.walnut.grain ? grain : plain });
  const brass = new MeshStandardMaterial({ color: 0xc8a46a, metalness: metal, roughness: 0.32 });
  const alu = new MeshStandardMaterial({ color: 0xdedbd5, metalness: metal * 0.9, roughness: 0.22 });
  const paper = new MeshStandardMaterial({ color: 0x1f1d1b, roughness: 0.9, side: DoubleSide });
  const rubber = new MeshStandardMaterial({ color: 0x141312, roughness: 0.7 });
  const iron = new MeshStandardMaterial({ color: 0x2c2b2a, metalness: metal * 0.7, roughness: 0.45 });
  const hole = new MeshBasicMaterial({ color: 0x050404 });
  const plate = new MeshStandardMaterial({ color: 0x1c1b1a, metalness: metal * 0.4, roughness: 0.5, side: DoubleSide });
  const board = new MeshStandardMaterial({ color: 0x23392f, roughness: 0.65 });
  const copper = new MeshStandardMaterial({ color: 0xb8733f, metalness: metal, roughness: 0.35 });
  const capA = new MeshStandardMaterial({ color: 0xd9c9a3, roughness: 0.5 });
  const capB = new MeshStandardMaterial({ color: 0x3a2a24, roughness: 0.5 });
  const shadowMap = shadowTexture();
  const shadow = new MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false });

  const W = 2.1, H = 3.3, D = 2.5, FZ = D / 2; // cabinet size; FZ = the front face
  const model = new Group();
  scene.add(model);
  const add = (parent: any, geo: any, mat: any, x = 0, y = 0, z = 0) => {
    const m = new Mesh(geo, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const disc = (r: number, depth: number, s = seg) => new CylinderGeometry(r, r, depth, s).rotateX(Math.PI / 2);

  // the cabinet, its driver cut-outs and the front slot port (all stay put)
  const cabinet = new Group();
  model.add(cabinet);
  add(cabinet, new RoundedBoxGeometry(W, H, D, opts.phone ? 3 : 5, 0.13), wood);
  add(cabinet, disc(0.76, 0.02), hole, 0, -0.42, FZ + 0.004);
  add(cabinet, disc(0.33, 0.02), hole, 0, 0.98, FZ + 0.004);
  add(cabinet, new RoundedBoxGeometry(1.1, 0.16, 0.05, 2, 0.06), hole, 0, -1.37, FZ);
  add(cabinet, new PlaneGeometry(W * 2.2, D * 2.2).rotateX(-Math.PI / 2), shadow, 0, -H / 2 - 0.01, 0);

  // woofer: brass trim ring, rubber surround, paper cone, dust cap, and the magnet behind it
  const woofer = new Group();
  woofer.position.set(0, -0.42, FZ);
  model.add(woofer);
  add(woofer, new TorusGeometry(0.75, 0.035, 12, seg), brass, 0, 0, 0.02);
  add(woofer, new TorusGeometry(0.66, 0.055, 12, seg), rubber, 0, 0, 0.01);
  const cone = new LatheGeometry([new Vector2(0.17, -0.2), new Vector2(0.32, -0.13), new Vector2(0.5, -0.05), new Vector2(0.62, 0)], seg).rotateX(Math.PI / 2);
  add(woofer, cone, paper);
  add(woofer, new SphereGeometry(0.19, seg, 12, 0, Math.PI * 2, 0, Math.PI * 0.32).rotateX(Math.PI / 2), paper, 0, 0, -0.33);
  add(woofer, disc(0.36, 0.26), iron, 0, 0, -0.42);
  add(woofer, disc(0.2, 0.3), iron, 0, 0, -0.32);

  // tweeter: brass face ring, aluminium dome in a shallow waveguide
  const tweeter = new Group();
  tweeter.position.set(0, 0.98, FZ);
  model.add(tweeter);
  add(tweeter, disc(0.33, 0.05), brass, 0, 0, 0.01);
  const guide = new LatheGeometry([new Vector2(0.13, -0.01), new Vector2(0.2, 0.02), new Vector2(0.29, 0.04)], seg).rotateX(Math.PI / 2);
  add(tweeter, guide, plate, 0, 0, 0.0);
  add(tweeter, new SphereGeometry(0.13, seg, 16, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), alu, 0, 0, -0.04);
  add(tweeter, disc(0.22, 0.2), iron, 0, 0, -0.14);

  // back plate with binding posts; the crossover board rides on its inner side and comes out with it
  const back = new Group();
  back.position.set(0, -0.35, -FZ);
  model.add(back);
  add(back, new RoundedBoxGeometry(1.4, 1.9, 0.06, 2, 0.03), plate);
  for (const x of [-0.22, 0.22]) {
    add(back, disc(0.075, 0.24, 20), brass, x, -0.55, -0.12);
    add(back, disc(0.11, 0.04, 20), x < 0 ? rubber : capB, x, -0.55, -0.04);
  }
  const pcb = new Group();
  pcb.position.set(0, 0.15, 0.13);
  back.add(pcb);
  add(pcb, new BoxGeometry(1.15, 1.2, 0.035), board);
  add(pcb, new TorusGeometry(0.16, 0.06, 10, 24), copper, -0.27, 0.27, 0.08);
  add(pcb, new TorusGeometry(0.12, 0.05, 10, 24), copper, 0.3, -0.3, 0.07);
  add(pcb, new CylinderGeometry(0.09, 0.09, 0.42, 20).rotateZ(Math.PI / 2), capA, 0.22, 0.3, 0.11);
  add(pcb, new CylinderGeometry(0.07, 0.07, 0.3, 20).rotateZ(Math.PI / 2), capB, -0.25, -0.25, 0.09);
  add(pcb, new BoxGeometry(0.34, 0.1, 0.1), capA, -0.25, -0.02, 0.07);

  // compile every shader before the first frame; where the browser supports parallel compiling this happens off
  // the main thread, otherwise the first frame compiles them as before
  await breathe();
  try { await renderer.compileAsync(scene, camera); } catch { /* the first render compiles instead */ }

  // where each part's label points, in the part's own space
  const anchors: Record<Part, [any, any]> = {
    cabinet: [cabinet, new Vector3(W / 2, H / 2 - 0.4, FZ - 0.3)],
    woofer: [woofer, new Vector3(0.55, 0.45, 0.05)],
    tweeter: [tweeter, new Vector3(0.24, 0.22, 0.05)],
    crossover: [pcb, new Vector3(0.55, 0.45, 0.06)],
  };

  // state: everything eases toward its target, and the loop sleeps once nothing moves
  let explode = 0, explodeTo = 0, show = 0;
  let yaw = YAW.cabinet, yawTo = YAW.cabinet, userYaw = 0;
  let part: Part = "cabinet";
  let paused = false, visible = true, raf = 0, alive = true, swayT = 0, last = 0;
  const tmp = new Vector3();

  const size = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    wake();
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    const k = 1 - Math.exp(-dt * 6);
    explode += (explodeTo - explode) * k;
    show += ((part === "crossover" ? 1 : 0) - show) * k;
    yaw += (yawTo + userYaw - yaw) * k;
    if (!paused) swayT += dt;
    const sway = Math.sin(swayT * 0.45) * 0.06;
    model.rotation.y = yaw + sway;
    model.rotation.x = 0.06;
    const e = MathUtils.smootherstep(explode, 0, 1);
    woofer.position.z = FZ + e * 1.5;
    tweeter.position.z = FZ + e * 2.15;
    back.position.z = -FZ - e * 1.45;
    // on the crossover step the pulled-out plate turns round to show the board on its inner side;
    // tied to the spread so it can only turn once it is well clear of the cabinet
    back.rotation.y = MathUtils.smootherstep(show, 0, 1) * e * Math.PI;
    // step back a little when the parts spread out, and further on tall phone-shaped canvases
    const fit = camera.aspect < 0.9 ? 1.35 / Math.max(camera.aspect, 0.55) : 1;
    camera.position.set(0, 0.55, (11.5 + e * 2.6) * fit);
    camera.lookAt(0, -0.05, 0);
    renderer.render(scene, camera);

    const [g, a] = anchors[part];
    g.updateWorldMatrix(true, false);
    tmp.copy(a).applyMatrix4(g.matrixWorld).project(camera);
    opts.onLabel((tmp.x * 0.5 + 0.5) * canvas.clientWidth, (-tmp.y * 0.5 + 0.5) * canvas.clientHeight);

    const settling = Math.abs(explodeTo - explode) > 0.001 || Math.abs((part === "crossover" ? 1 : 0) - show) > 0.001 || Math.abs(yawTo + userYaw - yaw) > 0.001;
    if (settling || !paused) loop();
  };
  const loop = () => { if (!raf && alive && visible && !document.hidden) raf = requestAnimationFrame(frame); };
  function wake() { last = 0; loop(); }

  // drag to turn (touch drags only turn it sideways, so the page still scrolls up and down)
  let dragX: number | null = null;
  const down = (e: PointerEvent) => { dragX = e.clientX; canvas.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent) => {
    if (dragX === null) return;
    userYaw += (e.clientX - dragX) * 0.01;
    dragX = e.clientX;
    wake();
  };
  const up = () => { dragX = null; };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);

  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) wake(); });
  io.observe(canvas);
  const vis = () => { if (!document.hidden) wake(); };
  document.addEventListener("visibilitychange", vis);
  const ro = new ResizeObserver(size);
  ro.observe(canvas);
  const lost = (e: Event) => { e.preventDefault(); opts.onLost(); };
  canvas.addEventListener("webglcontextlost", lost);
  size();

  const api: Speaker = {
    setExplode(t) { explodeTo = MathUtils.clamp(t, 0, 1); wake(); },
    setPart(p) { part = p; yawTo = YAW[p]; userYaw = 0; wake(); },
    setFinish(f) {
      const s = FINISH[f];
      wood.color.setHex(s.color);
      wood.roughness = s.rough;
      wood.map = s.grain ? grain : plain;
      wake();
    },
    setPaused(p) { paused = p; wake(); },
    turn(rad) { userYaw += rad; wake(); },
    dispose() {
      if (!alive) return;
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", vis);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("webglcontextlost", lost);
      scene.traverse((o: any) => o.geometry?.dispose());
      for (const m of [wood, brass, alu, paper, rubber, iron, hole, plate, board, copper, capA, capB, shadow]) m.dispose();
      grain.dispose();
      plain.dispose();
      shadowMap.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
  return api;
}
