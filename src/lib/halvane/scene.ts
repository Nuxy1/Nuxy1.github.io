// The live LUMEN ONE for the Halvane concept page. It loads the same model the Blender posters are rendered from
// (public/3d/halvane/lumen-one.glb, meshopt-compressed), lights it with an environment built from the poster studio's
// own softboxes (key, rim, kicker, fill: positions, sizes and colour temperatures from scripts/halvane/build_speaker.py),
// and frames it from the named camera states in cameras.json through timeline.ts, so a poster and the canvas agree.
// The page owns the layout, the tier choice and the scroll position; this module draws the pose it is given, eases
// toward it, and sleeps when it arrives.

import {
  AgXToneMapping,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  CustomToneMapping,
  DirectionalLight,
  DoubleSide,
  Group,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  RectAreaLight,
  Scene,
  ShaderChunk,
  Spherical,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
  Vector4,
  VSMShadowMap,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { EXPLODE, HATCH_DEG, HINGE, blend, type CamState, type Pose } from "./timeline";
import cams from "./cameras.json";

// the rear-detail lamp's colour and place, from the state in cameras.json that has one (the poster render reads the
// same entry); its power comes through the pose, so it fades in and out with the chapter
const STATE_LAMP = Object.values(cams.states as unknown as Record<string, CamState>).find((s) => s.lamp)?.lamp;

export type Finish = "walnut" | "chalk" | "graphite";
/** A: full quality. B: no shadow map, at most 1.5 device pixels per CSS pixel on phones and 1 elsewhere. (C never
 * mounts the scene: the page shows posters.) */
export type Tier = "A" | "B";

export interface Hotspot {
  id: "tweeter" | "woofer" | "cabinet" | "rear";
  /** CSS pixels from the canvas's top left: the anchor a label hangs from on its right */
  x: number;
  y: number;
  /** the anchor for a label on the left: the driver's other rim, so a flipped label never crosses its own part */
  lx: number;
  ly: number;
  /** false when the part faces away from the camera */
  shown: boolean;
  /** a driver's front face on screen, [left, right, centre y, half height]: no other part's label may cover it */
  face?: [number, number, number, number];
}

export interface SpeakerOpts {
  tier: Tier;
  phone: boolean;
  pose: Pose;
  finish: Finish;
  /** where the model and textures are served; ends with a slash */
  base?: string;
  /** the WebGL context was lost: the page goes back to the posters */
  onLost(): void;
  /** frames stayed slow after the quality drop: the page should go back to the posters */
  onSlow?(): void;
  /** hotspot positions, sent while the showroom is interactive */
  onHotspots?(spots: Hotspot[]): void;
}

export interface Speaker {
  /** the pose the timeline wants; the drawn pose eases toward it */
  setPose(p: Pose): void;
  /** change the wood, with the wipe up the cabinet unless `wipe` is false */
  setFinish(f: Finish, wipe?: boolean): void;
  /** fetch the other finishes' textures before they are asked for */
  preload(): void;
  /** the showroom: drag to turn (with inertia), hotspots on */
  setInteractive(on: boolean): void;
  /** keyboard turn and tilt, in radians */
  nudge(yaw: number, pitch?: number): void;
  /** back to the state's own angle */
  reset(): void;
  setPaused(paused: boolean): void;
  dispose(): void;
}

// --- the poster studio, in three.js axes (Blender x, y, z -> three x, z, -y) -------------------------------------
const STUDIO = [
  // position, width, height, kelvin, Blender watts (build_speaker.py), calibration gain (see below)
  // area: drawn as a RectAreaLight instead of entering the environment (the rim; see below)
  { pos: [-1.6, 1.2, 0.4], w: 1.0, h: 0.7, k: 5200, watts: 180, gain: 1, area: false },
  { pos: [0.9, 0.5, -0.9], w: 0.12, h: 1.5, k: 4400, watts: 80, gain: 1, area: true },
  { pos: [-0.7, 0.9, -1.1], w: 0.4, h: 0.8, k: 4400, watts: 40, gain: 1, area: false },
  { pos: [1.5, 0.6, 1.6], w: 2.0, h: 2.0, k: 5000, watts: 9, gain: 1, area: false },
] as const;
const STUDIO_TARGET = new Vector3(0, 0.17, 0);
// A Cycles area light of P watts and area A has radiance P / (pi A). Each softbox enters the environment at that
// radiance (ENV_GAIN 1 is the physical match), and the rim strip, a RectAreaLight, shines at it too. The key's share
// is split: half in the environment, half as a shadow-casting direct light. Its physical half is ~15 W/m2 at the
// speaker, KEY_LUX 7.6; it runs at 10.5, the value that best matches the posters' tops (why the last 1.4x is needed
// is not isolated). Measured against the Cycles posters at 1440x900 over the three finishes, reveal and rear-detail
// (redesign doc, section 8): the front edge, the wadding and the tops of walnut and chalk land within 3 luma points
// (0-255 display); chalk's sides run 9-15 bright, and walnut's and graphite's reveal side and graphite's tops 8-11 dark.
const ENV_GAIN = 1;
const KEY_ENV_SHARE = 0.5;
const KEY_LUX = 10.5;
/** the rear-detail lamp: cameras.json watts to three.js candela, set so the wadding behind the door matches its poster */
const LAMP_GAIN = 0.24;
/** the wadding's share of the studio environment, before hvSpan's opening; set against the rear-detail poster */
const WADDING_ENV = 0.25;
/** Blender's exposure -0.3 EV */
const EXPOSURE = 0.81;

// The posters are graded with Blender's AgX view and its "AgX - Medium High Contrast" look. three's AgX is Filament's
// polynomial fit of the base curve, which runs about 10/255 brighter in the mid-tones and has no look, so the live
// speaker read greyer and flatter than its own poster. This curve is Blender 5.2's OCIO output sampled per channel
// (49 points over three's 16.5-stop log range, decoded back through three's outset and 2.2 power) and is used with
// three's own AgX matrices, plus the look's slight saturation lift. Against Blender's colour transform on 48 test
// colours it lands within 1.1/255 on average, 4.1/255 at worst (scripts/halvane/agx_mhc_sample.py and agx_mhc_lut.mjs; redesign doc, section 8).
const HV_AGX_MHC = [
  0, 0, 0, 0, 0, 0.00032, 0.00294, 0.00608, 0.00971, 0.01381, 0.01844, 0.02366, 0.02954, 0.03618, 0.04369, 0.0522,
  0.06188, 0.07291, 0.08554, 0.10003, 0.11672, 0.13626, 0.15895, 0.18538, 0.21614, 0.25192, 0.29335, 0.34087, 0.39451,
  0.45309, 0.51353, 0.57173, 0.6261, 0.67611, 0.72128, 0.76208, 0.79888, 0.83197, 0.86171, 0.88845, 0.91251, 0.93419,
  0.95375, 0.97144, 0.98737, 1, 1, 1, 1,
];
const HV_AGX_SAT = 1.06;
const CUSTOM_TONE = "vec3 CustomToneMapping( vec3 color ) { return color; }";
/** Swap three's no-op CustomToneMapping for the Blender-matched AgX; done once, before the first shader compiles. */
function installPosterToneMap(): boolean {
  const chunk = ShaderChunk.tonemapping_pars_fragment;
  if (chunk.includes("hvAgxCurve")) return true;
  if (!chunk.includes(CUSTOM_TONE)) return false;
  const n = HV_AGX_MHC.length - 1;
  const glsl = `
const float HV_AGX[${n + 1}] = float[${n + 1}]( ${HV_AGX_MHC.map((v) => v.toFixed(5)).join(", ")} );
float hvAgxCurve( float x ) {
  float t = clamp( x, 0.0, 1.0 ) * ${n}.0;
  int i = int( min( floor( t ), ${n - 1}.0 ) );
  return mix( HV_AGX[ i ], HV_AGX[ i + 1 ], t - float( i ) );
}
vec3 CustomToneMapping( vec3 color ) {
  const mat3 inset = mat3(
    vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
    vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
    vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 ) );
  const mat3 outset = mat3(
    vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
    vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
    vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 ) );
  color *= toneMappingExposure;
  color = inset * ( LINEAR_SRGB_TO_LINEAR_REC2020 * color );
  color = ( log2( max( color, 1e-10 ) ) + 12.47393 ) / 16.5;
  color = vec3( hvAgxCurve( color.r ), hvAgxCurve( color.g ), hvAgxCurve( color.b ) );
  color = pow( max( vec3( 0.0 ), outset * color ), vec3( 2.2 ) );
  color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
  float y = dot( color, vec3( 0.2126, 0.7152, 0.0722 ) );
  return clamp( mix( vec3( y ), color, ${HV_AGX_SAT.toFixed(2)} ), 0.0, 1.0 );
}`;
  ShaderChunk.tonemapping_pars_fragment = chunk.replace(CUSTOM_TONE, glsl);
  return true;
}

// the drivers' explode offsets and the rear hatch hinge live in timeline.ts, which also frames the moved parts
const [HINGE_X, HINGE_Z] = HINGE;
// The rear opening behind the plate (build_speaker.py cut_plate, in three axes): 12 mm inside the plate's 0.120 x
// 0.150 m outline, centred 0.130 m up, running from the 3 mm plate pocket through the rest of the 19 mm wall.
const HOLE_HALF = [0.048, 0.063];
const HOLE_Y = 0.13;
const HOLE_Z = [-0.127, -0.111];
// the lights' angular half-sizes in Cycles: the key's 1.0 x 0.7 m softbox at 1.94 m, the lamp's 0.5 m disc at 1.77 m
const KEY_SPREAD = 0.22;
const LAMP_SPREAD = 0.14;

// Soft rectangle occluders for the key and the rear-detail lamp, in view space. Once the service door opens it stands
// a few centimetres off the back, between both lights and the opening, and Cycles gives it a broad soft shadow over the
// wadding and down the back panel; the wadding also sees the lights only through the opening in the 19 mm wall. Neither
// fits the shadow map's fixed ~7 mm penumbra (and the lamp casts none), so both are traced here: the ray from the
// shaded point to the light meets the rectangle's plane at distance t, and the light's own angular size k spreads the
// edge over t * k. hvOut is how much of the light passes outside the rectangle (1 when the plane is behind the point).
const HV_DOOR_GLSL = /* glsl */ `
uniform float uHvDoorOn;
uniform vec3 uHvDoorC;
uniform vec3 uHvDoorU;
uniform vec3 uHvDoorV;
uniform vec3 uHvDoorN;
uniform vec2 uHvDoorH;
uniform vec3 uHvHoleC0;
uniform vec3 uHvHoleC1;
uniform vec3 uHvHoleU;
uniform vec3 uHvHoleV;
uniform vec3 uHvHoleN;
uniform vec2 uHvHoleH;
uniform vec2 uHvSpread;
float hvOut( vec3 P, vec3 L, vec3 C, vec3 U, vec3 V, vec3 N, vec2 H, float k ) {
	float ln = dot( L, N );
	if ( abs( ln ) < 1e-4 ) return 1.0;
	float t = dot( C - P, N ) / ln;
	if ( t <= 0.002 ) return 1.0;
	vec3 q = P + t * L - C;
	float d = max( abs( dot( q, U ) ) - H.x, abs( dot( q, V ) ) - H.y );
	float w = max( t * k / max( abs( ln ), 0.3 ), 0.001 );
	return smoothstep( -w, w, d );
}
// how much of the light reaches P through the opening's plane at C (none from the cabinet side, all once P is outside)
float hvThru( vec3 P, vec3 L, vec3 C, float k ) {
	float ln = dot( L, uHvHoleN );
	if ( ln > -1e-4 ) return 0.0;
	float t = dot( C - P, uHvHoleN ) / ln;
	if ( t <= 0.0 ) return 1.0;
	vec3 q = P + t * L - C;
	float d = max( abs( dot( q, uHvHoleU ) ) - uHvHoleH.x, abs( dot( q, uHvHoleV ) ) - uHvHoleH.y );
	float w = max( t * k / max( -ln, 0.3 ), 0.001 );
	return 1.0 - smoothstep( -w, w, d );
}
// inside the opening's tunnel through the wall; the rest of the port material (the front bass port) is left alone
bool hvTube( vec3 P ) {
	vec3 q = P - uHvHoleC0;
	float z = dot( q, uHvHoleN );
	float depth = dot( uHvHoleC1 - uHvHoleC0, uHvHoleN );
	vec2 e = uHvHoleH * 1.05;
	return z > -0.1 * depth && z < 1.1 * depth && abs( dot( q, uHvHoleU ) ) < e.x && abs( dot( q, uHvHoleV ) ) < e.y;
}
float hvLight( vec3 P, vec3 L, float k ) {
	float f = uHvDoorOn > 0.5 ? hvOut( P, L, uHvDoorC, uHvDoorU, uHvDoorV, uHvDoorN, uHvDoorH, k ) : 1.0;
	#ifdef HV_CAVITY
	f *= hvThru( P, L, uHvHoleC0, k ) * hvThru( P, L, uHvHoleC1, k );
	#endif
	#ifdef HV_WALL
	if ( hvTube( P ) ) f *= hvThru( P, L, uHvHoleC0, k );
	#endif
	return f;
}
// the share of the room a point behind the opening sees through it (per axis, the angle the opening spans from the
// point); about half on the tunnel's own walls
float hvSpan( vec3 P, vec3 C ) {
	vec3 q = P - C;
	float h = max( abs( dot( q, uHvHoleN ) ), 0.004 );
	float a = dot( q, uHvHoleU );
	float b = dot( q, uHvHoleV );
	float fx = ( atan( ( uHvHoleH.x - a ) / h ) + atan( ( uHvHoleH.x + a ) / h ) ) / PI;
	float fy = ( atan( ( uHvHoleH.y - b ) / h ) + atan( ( uHvHoleH.y + b ) / h ) ) / PI;
	return clamp( fx, 0.0, 1.0 ) * clamp( fy, 0.0, 1.0 );
}
`;
const HV_LIGHTS = ShaderChunk.lights_fragment_begin
  .replace(
    "getPointLightInfo( pointLight, geometryPosition, directLight );",
    "$&\n\t\tdirectLight.color *= hvLight( geometryPosition, normalize( pointLight.position - geometryPosition ), uHvSpread.y );",
  )
  .replace(
    "getDirectionalLightInfo( directionalLight, directLight );",
    "$&\n\t\tdirectLight.color *= hvLight( geometryPosition, directionalLight.direction, uHvSpread.x );",
  )
  .replace(
    "rectAreaLight = rectAreaLights[ i ];",
    "$&\n\t\trectAreaLight.color *= hvLight( geometryPosition, normalize( rectAreaLight.position - geometryPosition ), 0.1 );",
  );
// three's rect-area lights skip the clear coat; this adds its reflection of the rim strip, with the same LTC tables
// at the coat's roughness and normal
const HV_PHYSICAL_PARS = ShaderChunk.lights_physical_pars_fragment.replace(
  "reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );",
  `$&
		#ifdef USE_CLEARCOAT
		vec2 ccUv = LTC_Uv( geometryClearcoatNormal, viewDir, material.clearcoatRoughness );
		vec4 cc1 = texture2D( ltc_1, ccUv );
		vec4 cc2 = texture2D( ltc_2, ccUv );
		mat3 ccInv = mat3( vec3( cc1.x, 0, cc1.y ), vec3( 0, 1, 0 ), vec3( cc1.z, 0, cc1.w ) );
		vec3 ccFresnel = material.clearcoatF0 * cc2.x + ( material.clearcoatF90 - material.clearcoatF0 ) * cc2.y;
		clearcoatSpecularDirect += lightColor * ccFresnel * LTC_Evaluate( geometryClearcoatNormal, viewDir, position, ccInv, rectCoords );
		#endif`,
);
const hvIbl = (test: string, ao: string) =>
  `#include <lights_fragment_maps>\nif ( ${test} ) {\n\tfloat hvAo = ${ao};\n\tirradiance *= hvAo;\n\tiblIrradiance *= hvAo;\n\tradiance *= hvAo;\n}`;
const HV_IBL = {
  HV_CAVITY: hvIbl("true", "min( hvSpan( geometryPosition, uHvHoleC0 ), hvSpan( geometryPosition, uHvHoleC1 ) )"),
  HV_WALL: hvIbl("hvTube( geometryPosition )", "hvSpan( geometryPosition, uHvHoleC0 )"),
};

// the wood finishes (build_speaker.py WOOD): pore and top roughness, clear coat and its roughness, bump strength.
// Roughness runs pore -> top over heights 0.10-0.72 and holds outside them, as Blender's Map Range node does.
// Bump is set by eye against the posters' side panels at 1:1, since without Cycles' many samples a stronger bump
// breaks into single-pixel pore glints. Walnut and graphite keep Blender's 1 : 2.9 ratio; chalk runs at 0.3, not
// Blender's 1.8x (0.45), which speckled its pale panel with dark pores where the poster shows fine satin lines.
const ROUGH: Record<Finish, [number, number]> = { walnut: [0.72, 0.42], chalk: [0.62, 0.48], graphite: [0.66, 0.4] };
const COAT: Record<Finish, [number, number]> = { walnut: [0.18, 0.32], chalk: [0.35, 0.45], graphite: [0.25, 0.3] };
const BUMP: Record<Finish, number> = { walnut: 0.25, chalk: 0.3, graphite: 0.7 };
const WIPE_S = 0.9;

/** Tanner Helland's blackbody fit, the same one the Blender build uses, as a three.js colour. */
function kelvin(k: number, gain = 1): Color {
  const t = k / 100;
  const r = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592;
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * (t - 60) ** -0.0755148492;
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const c = (v: number) => Math.min(Math.max(v, 0), 255) / 255;
  const col = new Color().setRGB(c(r), c(g), c(b), SRGBColorSpace);
  return col.multiplyScalar(gain);
}

/** Ease a surface's normals toward their mean direction by k (0 = as modelled, 1 = flat). */
function softenNormals(g: BufferGeometry, k: number): void {
  const n = g.getAttribute("normal");
  if (!n) return;
  const mean = new Vector3();
  const v = new Vector3();
  for (let i = 0; i < n.count; i++) mean.add(v.fromBufferAttribute(n, i));
  if (mean.lengthSq() === 0) return;
  mean.normalize();
  const out = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i++) {
    v.fromBufferAttribute(n, i).lerp(mean, k).normalize();
    out[i * 3] = v.x;
    out[i * 3 + 1] = v.y;
    out[i * 3 + 2] = v.z;
  }
  g.setAttribute("normal", new BufferAttribute(out, 3));
}

/** Let the browser handle input between the heavy steps of the first load. */
const breathe = () => new Promise<void>((r) => setTimeout(r, 0));

// three builds a PMREM's blur and GGX filter programs on their first use inside fromScene, and the GGX one is a
// 300+ ms synchronous link on Windows (ANGLE over D3D11, qa\tools\profile.mjs): this builds both in parallel first,
// with the PMREM's own target bound so the programs get the keys fromScene asks for (no tone mapping, linear output).
// It reads three's private fields. three is pinned to an exact version in package.json and tests/levels.test.mjs
// checks the fields are there; if a later three drops them, this does nothing and fromScene compiles as before.
async function warmPmrem(renderer: WebGLRenderer, pmrem: PMREMGenerator, size: number): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = pmrem as any;
  if (typeof p._setSize !== "function" || typeof p._allocateTargets !== "function") return;
  p._setSize(size);
  p._allocateTargets().dispose(); // fromScene allocates its own; this one only makes the ping-pong target and materials
  const target = p._pingPongRenderTarget;
  const plane = p._lodMeshes?.[0]?.geometry;
  if (!target || !plane || !p._blurMaterial || !p._ggxMaterial) return;
  const group = new Group().add(new Mesh(plane, p._blurMaterial), new Mesh(plane, p._ggxMaterial));
  const prev = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  const built = renderer.compileAsync(group, new OrthographicCamera()); // the programs are chosen synchronously here
  renderer.setRenderTarget(prev);
  await built;
}

// the finish swap answers a click, so it starts at full pace and settles at the top (ease-out); a smoothstep spent
// its first ~120 ms below the cabinet and read as a lag (measured by qa/tools/wipe.mjs)
const ease = (t: number) => 1 - (1 - t) * (1 - t);

function poseGap(a: Pose, b: Pose): number {
  let d = Math.abs(a.yaw - b.yaw) / 90 + Math.abs(a.fov - b.fov) / 30 + Math.abs(a.lamp - b.lamp) / 40;
  for (let i = 0; i < 3; i++) d += Math.abs(a.pos[i] - b.pos[i]) + Math.abs(a.target[i] - b.target[i]);
  d += Math.abs(a.shift[0] - b.shift[0]) + Math.abs(a.shift[1] - b.shift[1]);
  for (const n in a.explode) d += Math.abs(a.explode[n] - (b.explode[n] ?? 0));
  return d + Math.abs(a.hatch - b.hatch);
}

export async function mountSpeaker(canvas: HTMLCanvasElement, opts: SpeakerOpts): Promise<Speaker> {
  const base = opts.base ?? "/3d/halvane/";
  const res = opts.phone || opts.tier === "B" ? "1k" : "2k";

  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "default" });
  renderer.setClearColor(0x000000, 0);
  // the poster-matched curve; three's own AgX if a future three renames the hook
  renderer.toneMapping = installPosterToneMap() ? CustomToneMapping : AgXToneMapping;
  renderer.toneMappingExposure = EXPOSURE;
  renderer.outputColorSpace = SRGBColorSpace;
  // phones and tablets (tier B) start at 1.5 device pixels per CSS pixel: at 1 the product read soft on a 3x screen
  // (qa\pass5\dpr). The frame watch below steps down to 1 before it gives up to the posters.
  let dprCap = opts.phone ? 1.5 : opts.tier === "A" ? 2 : 1;
  const applyDpr = () => renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  applyDpr();
  const shadows = opts.tier === "A";
  renderer.shadowMap.enabled = shadows;
  // the key is a 1 m softbox, so its shadows have a wide penumbra: a blurred variance map gives that edge, where
  // r181's PCF soft filter is a fixed 3x3 and drew hard rims around the drivers
  renderer.shadowMap.type = VSMShadowMap;
  const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), opts.tier === "A" ? 8 : 4);

  let lost = false;
  const onContextLost = () => {
    lost = true;
    stop();
    opts.onLost();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);
  // A program that fails to compile or link (an old or weak GPU against the patched shaders) makes three draw
  // nothing and only log it. Before mounting, the first draw below catches it and mounting fails, so the stills
  // stay; after mounting, the page is told as for a lost context. checkShaderErrors stays on for this, so on
  // Windows ANGLE (D3D11) the console also shows one harmless compiler note (X4122) about three's own packing constants.
  let shaderFailed = false;
  let mounted = false;
  renderer.debug.onShaderError = (gl: WebGLRenderingContext, program: WebGLProgram) => {
    if (shaderFailed) return;
    shaderFailed = true;
    console.warn("Halvane: a 3D shader did not compile on this GPU; showing the still images instead.", gl.getProgramInfoLog(program));
    if (mounted && !lost) {
      lost = true;
      stop();
      setTimeout(opts.onLost); // not from inside the render call that hit the error
    }
  };

  // --- the model's files, fetched while the environment below is built -------------------------------------
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const texLoader = new TextureLoader();
  const loadTex = (name: string, color: boolean, flipY = false) =>
    texLoader.loadAsync(base + name).then((t) => {
      t.flipY = flipY; // glTF UVs; the shadow plane uses Blender's orientation
      t.colorSpace = color ? SRGBColorSpace : NoColorSpace;
      t.anisotropy = maxAniso;
      t.needsUpdate = true;
      return t;
    });
  const finishTex = new Map<Finish, Promise<{ color: Texture; height: Texture }>>();
  const loadFinish = (f: Finish) => {
    let p = finishTex.get(f);
    if (!p) {
      p = Promise.all([loadTex(`${f}-color-${res}.webp`, true), loadTex(`${f}-height-${res}.webp`, false)]).then(
        ([color, height]) => ({ color, height }),
      );
      finishTex.set(f, p);
    }
    return p;
  };
  const assets = Promise.all([
    loader.loadAsync(base + "lumen-one.glb"),
    loadFinish(opts.finish),
    loadTex("paper-color-512.webp", true),
    loadTex("paper-height-512.webp", false),
    loadTex("shadow.webp", false, true),
    loadTex("wadding-color-512.webp", true),
    loadTex("wadding-height-512.webp", false),
  ]);
  assets.catch(() => {}); // awaited below; this only keeps a failure during the environment build from going unhandled

  // --- the studio environment ------------------------------------------------------------------------------
  const envScene = new Scene();
  envScene.background = new Color(0.0032, 0.003, 0.0028);
  STUDIO.forEach((s, i) => {
    if (s.area) return;
    const radiance =(s.watts / (s.w * s.h * Math.PI)) * s.gain * ENV_GAIN * (i === 0 ? KEY_ENV_SHARE : 1);
    const panel = new Mesh(
      new PlaneGeometry(s.w, s.h),
      new MeshBasicMaterial({ color: kelvin(s.k, radiance), side: DoubleSide }),
    );
    panel.position.set(s.pos[0], s.pos[1], s.pos[2]);
    panel.lookAt(STUDIO_TARGET);
    envScene.add(panel);
  });
  // the cyc's floor, as dark as the room: it hides the parts of the softboxes that hang below it (the fill's lower
  // half), as the cyc does in Cycles, and the environment is seen from the speaker's centre rather than the floor
  const envFloor = new Mesh(new PlaneGeometry(12, 12), new MeshBasicMaterial({ color: envScene.background }));
  envFloor.rotation.x = -Math.PI / 2;
  envScene.add(envFloor);
  const pmrem = new PMREMGenerator(renderer);
  await warmPmrem(renderer, pmrem, 256);
  const envTarget = pmrem.fromScene(envScene, 0.02, 0.1, 100, { position: STUDIO_TARGET, size: 256 });
  pmrem.dispose();
  envScene.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.dispose();
      (o.material as Material).dispose();
    }
  });

  const scene = new Scene();
  scene.environment = envTarget.texture;
  const camera = new PerspectiveCamera(16, 1, 0.05, 20);

  const key = new DirectionalLight(kelvin(5200), KEY_LUX);
  key.position.set(STUDIO[0].pos[0], STUDIO[0].pos[1], STUDIO[0].pos[2]);
  key.target.position.copy(STUDIO_TARGET);
  if (shadows) {
    key.castShadow = true;
    // 0.6 m over 1024 texels is 0.6 mm a texel; a 12-texel blur is a ~7 mm penumbra, about what a 1 m panel
    // 2 m away casts across the few centimetres between a driver and the baffle
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -0.3, right: 0.3, top: 0.3, bottom: -0.3, near: 1, far: 3.5 });
    key.shadow.radius = 12;
    key.shadow.blurSamples = 16;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.004;
  }
  scene.add(key, key.target);
  const lamp = new PointLight(kelvin(STATE_LAMP?.k ?? 4500), 0, 0, 2);
  lamp.position.set(...(STATE_LAMP?.pos ?? [-1, 1, 1.2]));
  // always in the scene, dark until rear-detail: hiding it changes the light count, which recompiles every program
  // on the way into that chapter
  scene.add(lamp);
  // The rim strip is nearly all the light the cabinet's sides get (they face away from the key and the lamp), and it
  // reaches them as a near reflection: from the top of a side the mirror direction meets the strip just above the
  // floor, from lower down it meets the part below the floor, which the cyc hides. So the sides run bright to dark
  // from top to bottom in Cycles, and a higher camera sees them darker. An environment map is one view from one point
  // at infinite distance and lit the sides flat, so the strip is a RectAreaLight, evaluated per pixel at its real
  // place (three's LTC), and cut off at the floor as the cyc cuts it.
  RectAreaLightUniformsLib.init();
  for (const s of STUDIO) {
    if (!s.area) continue;
    const strip = new RectAreaLight(kelvin(s.k), (s.watts / (s.w * s.h * Math.PI)) * s.gain * ENV_GAIN, s.w, s.h);
    strip.position.set(s.pos[0], s.pos[1], s.pos[2]);
    strip.lookAt(STUDIO_TARGET);
    const up = new Vector3(0, 1, 0).applyQuaternion(strip.quaternion);
    const below = Math.max(0, (s.h / 2) * up.y - s.pos[1]) / up.y; // the length of the strip under the floor
    strip.height = s.h - below;
    strip.position.addScaledVector(up, below / 2);
    scene.add(strip);
  }

  await breathe();

  // --- the model -------------------------------------------------------------------------------------------
  const [gltf, first, paperColor, paperHeight, shadowTex, woolColor, woolHeight] = await assets;
  await breathe();

  const root = gltf.scene.getObjectByName("LumenOne") ?? gltf.scene;
  const groups = new Map<string, Object3D>();
  for (const n of ["Cabinet", "Woofer", "Tweeter", "Rear"]) {
    const g = root.getObjectByName(n);
    if (g) groups.set(n, g);
  }
  const rest = new Map<Object3D, Vector3>();
  groups.forEach((g) => rest.set(g, g.position.clone()));

  const mats = new Map<string, MeshStandardMaterial>();
  gltf.scene.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    o.castShadow = shadows;
    o.receiveShadow = shadows;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (m instanceof MeshStandardMaterial) mats.set(m.name, m);
    }
    // Brushed metal (KHR_materials_anisotropy) needs a tangent per vertex. The GLB carries none, and three's
    // fallback derives one per pixel from screen derivatives, which is constant across each lathe facet: at
    // macro distance the waveguide showed a fan of fine radial streaks. The lathe's u runs round the axis, so
    // the UV tangent is the circular direction of the Blender build's radial Tangent node.
    const g = o.geometry as BufferGeometry;
    const brushed = (Array.isArray(o.material) ? o.material : [o.material]).some(
      (m) => m instanceof MeshPhysicalMaterial && m.anisotropy > 0,
    );
    if (brushed && g.index && g.getAttribute("uv") && g.getAttribute("normal") && !g.getAttribute("tangent")) {
      g.computeTangents();
    }
  });
  // Once the rear door opens, the map's ~7 mm penumbra gives its crossover board a hard, blotchy shadow in the
  // wadding and down the back panel, where Cycles' 1 m softbox spreads the door's shadow over centimetres (the
  // rear-detail poster). So the open door leaves the shadow map and its shadow is traced instead (HV_DOOR_GLSL,
  // set up in draw()). A VSM map also draws every *receiver* (three r181 WebGLShadowMap:
  // castShadow || receiveShadow under VSM), so turning castShadow off alone changes nothing; the door has to
  // stop receiving too. Layers don't help: that pass tests them against the main camera, not the shadow camera.
  const rearMeshes: Mesh[] = [];
  groups.get("Rear")?.traverse((o) => {
    if (o instanceof Mesh) rearMeshes.push(o);
  });
  let rearInMap = shadows;

  // the wood: two finishes in one shader, so a finish change can wipe up the cabinet
  const wood = mats.get("wood_walnut");
  const hv = {
    uMapB: { value: first.color as Texture },
    uBumpB: { value: first.height as Texture },
    uWipe: { value: 0 },
    uBumpK: { value: 1 },
    uRough: { value: new Vector4(...ROUGH[opts.finish], ...ROUGH[opts.finish]) },
  };
  let curFinish: Finish = opts.finish;
  if (wood) {
    wood.color.set(1, 1, 1);
    wood.map = first.color;
    wood.bumpMap = first.height;
    wood.bumpScale = BUMP[curFinish];
    if (wood instanceof MeshPhysicalMaterial) [wood.clearcoat, wood.clearcoatRoughness] = COAT[curFinish];
    const bumpPars = ShaderChunk.bumpmap_pars_fragment
      .replaceAll("texture2D( bumpMap, ", "hvH( ")
      .replace(
        "uniform float bumpScale;",
        "uniform float bumpScale;\nvec4 hvH( vec2 uv ) { return mix( texture2D(bumpMap, uv), texture2D(uBumpB, uv) * uBumpK, hvM ); }",
      );
    wood.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, hv);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying float vHvY;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHvY = ( modelMatrix * vec4( transformed, 1.0 ) ).y;");
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying float vHvY;\nuniform sampler2D uMapB;\nuniform sampler2D uBumpB;\nuniform float uWipe;\nuniform float uBumpK;\nuniform vec4 uRough;\nfloat hvM = 0.0;",
        )
        .replace("#include <bumpmap_pars_fragment>", bumpPars)
        .replace("#include <lights_physical_pars_fragment>", HV_PHYSICAL_PARS)
        .replace(
          "#include <map_fragment>",
          // the new finish rises from the cabinet's base (y 0.004) to past its top (0.334) with a soft 6 cm edge: the
          // edge's upper side starts on the base, so the first frame of the wipe already shows
          "float hvEdge = mix( -0.026, 0.37, uWipe );\nhvM = 1.0 - smoothstep( hvEdge - 0.03, hvEdge + 0.03, vHvY );\n#ifdef USE_MAP\n\tdiffuseColor *= mix( texture2D( map, vMapUv ), texture2D( uMapB, vMapUv ), hvM );\n#endif",
        )
        .replace(
          "#include <roughnessmap_fragment>",
          "float roughnessFactor = roughness;\n#ifdef USE_BUMPMAP\n\tfloat hvHt = clamp( ( texture2D( bumpMap, vBumpMapUv ).x - 0.1 ) / 0.62, 0.0, 1.0 );\n\troughnessFactor = mix( mix( uRough.x, uRough.y, hvHt ), mix( uRough.z, uRough.w, hvHt ), hvM );\n#endif",
        );
    };
    wood.customProgramCacheKey = () => "halvane-wood";
    wood.needsUpdate = true;
  }
  const paper = mats.get("paper");
  if (paper) {
    paper.color.set(1, 1, 1);
    paper.map = paperColor;
    paper.bumpMap = paperHeight;
    paper.bumpScale = 0.6;
    paper.needsUpdate = true;
  }
  // The wadding, seen only through the open service door. Its Principled sheen arrives in the GLB as a full-strength
  // white sheen, which drew bright streaks along every lump, where Cycles' microfibre sheen is a faint velvet. The
  // finest of its three noise octaves is also finer than its 3.5 mm grid, so the normals are eased halfway toward the
  // panel's facing direction: the lumps stay, the ripples go. Its colour and fibre are textures.py's wool, as in
  // the posters (the GLB keeps the UVs, not the images).
  // the open door's soft shadow and, for the wadding, the opening it is seen through (HV_DOOR_GLSL); draw() keeps
  // these in view space
  const v3 = () => ({ value: new Vector3() });
  const occ = {
    uHvDoorOn: { value: 0 },
    uHvDoorC: v3(),
    uHvDoorU: v3(),
    uHvDoorV: v3(),
    uHvDoorN: v3(),
    uHvDoorH: { value: new Vector2() },
    uHvHoleC0: v3(),
    uHvHoleC1: v3(),
    uHvHoleU: v3(),
    uHvHoleV: v3(),
    uHvHoleN: v3(),
    uHvHoleH: { value: new Vector2() },
    uHvSpread: { value: new Vector2(KEY_SPREAD, LAMP_SPREAD) },
  };
  // mode: the wadding behind the opening (HV_CAVITY) or the opening's own walls (HV_WALL, the port material)
  const occluded = (m: Material | undefined, key: string, mode?: keyof typeof HV_IBL) => {
    if (!m) return;
    const prev = m.onBeforeCompile.bind(m);
    m.onBeforeCompile = (shader, r) => {
      prev(shader, r);
      Object.assign(shader.uniforms, occ);
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>\n${mode ? `#define ${mode}\n` : ""}${HV_DOOR_GLSL}`)
        .replace("#include <lights_fragment_begin>", HV_LIGHTS)
        .replace("#include <lights_fragment_maps>", mode ? HV_IBL[mode] : "#include <lights_fragment_maps>");
    };
    m.customProgramCacheKey = () => key;
    m.needsUpdate = true;
  };
  occluded(wood, "halvane-wood");
  occluded(mats.get("port"), "halvane-port", "HV_WALL");
  const wadding = mats.get("wadding");
  occluded(wadding, "halvane-wadding", "HV_CAVITY");
  if (wadding) {
    // three does not shadow environment light; hvSpan scales the studio down to the share of it the wadding sees
    // through the opening, and this sets the level against the poster. (envMapIntensity applies only to a
    // material's own env map, not to scene.environment, hence the explicit envMap.)
    wadding.envMap = envTarget.texture;
    wadding.envMapIntensity = WADDING_ENV;
    wadding.color.set(1, 1, 1);
    wadding.map = woolColor;
    wadding.bumpMap = woolHeight;
    wadding.bumpScale = 0.8;
  }
  if (wadding instanceof MeshPhysicalMaterial) {
    wadding.sheenColor.multiplyScalar(0.25);
    wadding.sheenRoughness = 1;
    wadding.needsUpdate = true;
  }
  if (wadding) gltf.scene.traverse((o) => o instanceof Mesh && o.material === wadding && softenNormals(o.geometry, 0.5));

  // the baked contact shadow from the poster studio, turning with the speaker (0.64 m square, as in Blender)
  const shadowPlane = new Mesh(
    new PlaneGeometry(0.64, 0.64),
    new MeshBasicMaterial({ color: 0x000000, map: shadowTex, transparent: true, depthWrite: false, toneMapped: false }),
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.0004;
  shadowPlane.renderOrder = -1;
  root.add(shadowPlane);
  scene.add(gltf.scene);

  // the occluders' own frames: the service door from its mesh (x across, y up, z through the plate), the opening
  // from the Cabinet group with the cut_plate numbers above
  const plate = gltf.scene.getObjectByName("rear_plate");
  const plateBox = plate instanceof Mesh ? (plate.geometry.computeBoundingBox(), plate.geometry.boundingBox) : null;
  const plateC = plateBox?.getCenter(new Vector3());
  const plateH = plateBox?.getSize(new Vector3()).multiplyScalar(0.5);
  const cabinetGroup = groups.get("Cabinet");
  const holeC0 = new Vector3(0, HOLE_Y, HOLE_Z[0]);
  const holeC1 = new Vector3(0, HOLE_Y, HOLE_Z[1]);
  const occM = new Matrix4();
  const rectToView = (world: Matrix4, c: Vector3, hx: number, hy: number, o: "Door" | "Hole") => {
    occM.multiplyMatrices(camera.matrixWorldInverse, world);
    const e = occM.elements;
    const U = occ[`uHv${o}U`].value.set(e[0], e[1], e[2]);
    const V = occ[`uHv${o}V`].value.set(e[4], e[5], e[6]);
    occ[`uHv${o}N`].value.set(e[8], e[9], e[10]).normalize();
    occ[`uHv${o}H`].value.set(hx * U.length(), hy * V.length());
    U.normalize();
    V.normalize();
    occ[o === "Door" ? "uHvDoorC" : "uHvHoleC0"].value.copy(c).applyMatrix4(occM);
  };

  // hotspot anchors, measured from the model at rest so they follow the real geometry
  const anchors: { id: Hotspot["id"]; obj: Object3D; local: Vector3; left: Vector3; normal: Vector3; face?: Vector3[] }[] = [];
  {
    gltf.scene.updateMatrixWorld(true);
    // `u` is the anchor's share of the part's width from its left edge; a label on the left hangs from the mirror point
    const at = (id: Hotspot["id"], name: string, pick: (b: Box3, u?: number) => Vector3, normal: Vector3) => {
      const g = groups.get(name);
      if (!g) return;
      const b = new Box3().setFromObject(g);
      // a driver's front face (its box's four front corners), for the page's label obstacles
      const face = normal.z > 0 ? [0, 1, 2, 3].map((k) => g.worldToLocal(new Vector3(k & 1 ? b.max.x : b.min.x, k & 2 ? b.max.y : b.min.y, b.max.z))) : undefined;
      anchors.push({ id, obj: g, local: g.worldToLocal(pick(b)), left: g.worldToLocal(pick(b, -1)), normal, face });
    };
    const across = (b: Box3, u: number, flip?: number) => b.min.x + (b.max.x - b.min.x) * (flip ? 1 - u : u);
    // the drivers' anchors sit on the brass ring's outer edge (tweeter) and the surround (woofer), so a label runs out
    // over the cabinet face and never covers the dome or the cone
    at("tweeter", "Tweeter", (b, f) => new Vector3(across(b, 0.93, f), (b.min.y + b.max.y) / 2, b.max.z), new Vector3(0, 0, 1));
    at("woofer", "Woofer", (b, f) => new Vector3(across(b, 0.78, f), b.min.y + (b.max.y - b.min.y) * 0.78, b.max.z), new Vector3(0, 0, 1));
    // low on the side panel, below the woofer's label, so on a phone all three front labels fit on their own rows
    at("cabinet", "Cabinet", (b) => new Vector3(b.max.x, b.min.y + (b.max.y - b.min.y) * 0.3, b.min.z + (b.max.z - b.min.z) * 0.55), new Vector3(1, 0, 0));
    at("rear", "Rear", (b) => new Vector3((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, b.min.z), new Vector3(0, 0, -1));
  }

  // --- state -----------------------------------------------------------------------------------------------
  let cur: Pose = opts.pose;
  let goal: Pose = opts.pose;
  let spin = 0; // showroom turn on top of the state's yaw (radians)
  let spinGoal = 0;
  let spinVel = 0;
  let pitch = 0;
  let pitchGoal = 0;
  let dragging = false;
  let interactive = false;
  // the wipe front's height (0 = all the finish it left, 1 = all `wipeTo`) and the leg it is on: from `legFrom` to
  // `legGoal` over `legDur` seconds. A pick mid-wipe starts a new leg from where the front is, so it never jumps
  let wipeTo: Finish | null = null;
  let wipeU = 0;
  let legFrom = 0;
  let legGoal = 1;
  let legT = 0;
  let legDur = WIPE_S;
  let rushing = false;
  // a third finish picked mid-wipe waits here while the running wipe hurries to its end
  let queued: { f: Finish; tex: { color: Texture; height: Texture } } | null = null;
  let wantFinish: Finish = opts.finish;
  let paused = false;
  let onScreen = true;
  let disposed = false;
  // nothing draws until the programs below have finished linking: a draw while compileAsync still waits on them makes
  // three wait for the link on the main thread (a 300 ms stall on ANGLE, qa\tools\profile.mjs), and the observers'
  // first callbacks arrive during that wait
  let ready = false;
  // a texture is uploaded by the first draw that uses it, 30+ ms for a 2k image (qa\tools\profile.mjs); this uploads
  // each one in a task of its own first, so neither the first frame nor a finish swap carries them all at once
  const upload = async (list: Texture[]) => {
    for (const t of list) {
      if (disposed || lost) return;
      renderer.initTexture(t);
      await breathe();
    }
  };
  let width = 1;
  let height = 1;

  const completeWipe = () => {
    if (!wood || !wipeTo) return;
    curFinish = wipeTo;
    wipeTo = null;
    wood.map = hv.uMapB.value;
    wood.bumpMap = hv.uBumpB.value;
    wood.bumpScale = BUMP[curFinish];
    hv.uRough.value.set(...ROUGH[curFinish], ...ROUGH[curFinish]);
    hv.uWipe.value = 0;
    hv.uBumpK.value = 1;
    if (wood instanceof MeshPhysicalMaterial) [wood.clearcoat, wood.clearcoatRoughness] = COAT[curFinish];
  };

  // the front has gone back down: the finish it left stays, and the shader's second slot is cleared to match
  const cancelWipe = () => {
    if (!wood || !wipeTo) return;
    wipeTo = null;
    hv.uMapB.value = wood.map as Texture;
    hv.uBumpB.value = wood.bumpMap as Texture;
    hv.uRough.value.set(...ROUGH[curFinish], ...ROUGH[curFinish]);
    hv.uWipe.value = 0;
    hv.uBumpK.value = 1;
    if (wood instanceof MeshPhysicalMaterial) [wood.clearcoat, wood.clearcoatRoughness] = COAT[curFinish];
  };

  // a new leg from where the front is now. The time scales with the distance left, so a retarget keeps the first
  // wipe's pace instead of crawling over a short way or jumping a long one; a rush (a third finish waiting) runs at
  // about twice that pace (at three times, qa\tools\repick.mjs caught the rest of the wipe in a single sample)
  const aim = (goal: number, rush = false) => {
    if (goal === legGoal && rush === rushing) return;
    const d = Math.abs(goal - wipeU);
    legFrom = wipeU;
    legGoal = goal;
    legT = 0;
    rushing = rush;
    legDur = rush ? Math.max(0.15, d * 0.45) : Math.max(0.2, d * WIPE_S);
  };

  const startWipe = (f: Finish, tex: { color: Texture; height: Texture }, animate: boolean) => {
    if (!wood) return;
    if (wipeTo && animate) {
      if (f === wipeTo) {
        queued = null;
        aim(1);
      } else if (f === curFinish) {
        queued = null;
        aim(0);
      } else {
        queued = { f, tex };
        aim(legGoal, true);
      }
      wake();
      return;
    }
    // no wipe running, or no animation wanted (first mount, Still motion): settle at once
    queued = null;
    if (wipeTo) {
      if (f === curFinish) cancelWipe();
      else completeWipe();
    }
    if (f === curFinish) return;
    hv.uMapB.value = tex.color;
    hv.uBumpB.value = tex.height;
    hv.uBumpK.value = BUMP[f] / BUMP[curFinish];
    hv.uRough.value.set(...ROUGH[curFinish], ...ROUGH[f]);
    wipeTo = f;
    wipeU = legFrom = legT = 0;
    legGoal = 1;
    legDur = WIPE_S;
    rushing = false;
    if (!animate) completeWipe();
    wake();
  };

  // --- drawing ---------------------------------------------------------------------------------------------
  const sph = new Spherical();
  const tmp = new Vector3();
  const tmpN = new Vector3();
  const camPos = new Vector3();
  const tmpD = new Vector3();
  const tmpL = new Vector3();
  let lastSpots = "";

  const resize = () => {
    width = Math.max(1, canvas.clientWidth);
    height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
  };

  const draw = () => {
    const p = cur;
    root.rotation.y = (p.yaw * Math.PI) / 180 + spin;
    for (const [name, g] of groups) {
      const r = rest.get(g)!;
      g.position.set(r.x, r.y, r.z + (EXPLODE[name] ?? 0) * (p.explode[name] ?? 0));
    }
    const rear = groups.get("Rear");
    if (rear) {
      const phi = (HATCH_DEG * p.hatch * Math.PI) / 180;
      const c = Math.cos(phi);
      const s = Math.sin(phi);
      const r = rest.get(rear)!;
      rear.rotation.y = phi;
      // turn about the hinge line: position = h - R h keeps the hinge still
      rear.position.set(r.x + HINGE_X - (c * HINGE_X + s * HINGE_Z), r.y, r.z + HINGE_Z - (-s * HINGE_X + c * HINGE_Z));
      const inMap = renderer.shadowMap.enabled && p.hatch < 0.01;
      if (inMap !== rearInMap) {
        rearInMap = inMap;
        for (const m of rearMeshes) {
          m.castShadow = inMap;
          m.receiveShadow = inMap;
        }
      }
    }
    lamp.intensity = p.lamp * LAMP_GAIN;

    // camera: the state's position, tilted by the showroom pitch about the target
    tmp.set(p.pos[0] - p.target[0], p.pos[1] - p.target[1], p.pos[2] - p.target[2]);
    if (pitch !== 0) {
      sph.setFromVector3(tmp);
      sph.phi = Math.min(Math.max(sph.phi - pitch, 0.35), Math.PI / 2 - 0.04);
      tmp.setFromSpherical(sph);
    }
    camera.position.set(p.target[0] + tmp.x, p.target[1] + tmp.y, p.target[2] + tmp.z);
    camera.lookAt(p.target[0], p.target[1], p.target[2]);

    // fov across the short side; the target is shifted on screen by offsetting the projection, not the camera. The
    // page has already framed each state for this screen (timeline.fitLandscape, shiftLimit), so the shift is drawn as given
    const aspect = width / height;
    camera.aspect = aspect;
    camera.fov = aspect >= 1 ? p.fov : (2 * Math.atan(Math.tan((p.fov * Math.PI) / 360) / aspect) * 180) / Math.PI;
    camera.updateProjectionMatrix();
    const short = Math.min(width, height);
    const sx = p.shift[0] * short;
    const sy = p.shift[1] * short;
    camera.projectionMatrix.elements[8] = (-2 * sx) / width;
    camera.projectionMatrix.elements[9] = (-2 * sy) / height;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

    // the occluders in view space (HV_DOOR_GLSL); render() would bring these matrices up to date only inside itself
    camera.updateMatrixWorld();
    gltf.scene.updateMatrixWorld();
    const doorOn = plate && plateC && plateH && p.hatch > 0.01;
    occ.uHvDoorOn.value = doorOn ? 1 : 0;
    if (doorOn) rectToView(plate.matrixWorld, plateC, plateH.x, plateH.y, "Door");
    if (cabinetGroup) {
      rectToView(cabinetGroup.matrixWorld, holeC0, HOLE_HALF[0], HOLE_HALF[1], "Hole");
      occ.uHvHoleC1.value.copy(holeC1).applyMatrix4(occM);
    }

    renderer.render(scene, camera);

    if (interactive && opts.onHotspots) {
      camera.getWorldPosition(camPos);
      const spots: Hotspot[] = anchors.map((a) => {
        a.obj.updateWorldMatrix(true, false);
        const w = tmp.copy(a.local).applyMatrix4(a.obj.matrixWorld);
        const facing = tmpN.copy(a.normal).transformDirection(a.obj.matrixWorld).dot(tmpD.copy(camPos).sub(w).normalize());
        const ndc = w.project(camera); // in place: the shared vectors keep this per-frame loop free of garbage
        const l = tmpL.copy(a.left).applyMatrix4(a.obj.matrixWorld).project(camera);
        const spot: Hotspot = {
          id: a.id,
          x: ((ndc.x + 1) / 2) * width,
          y: ((1 - ndc.y) / 2) * height,
          lx: ((l.x + 1) / 2) * width,
          ly: ((1 - l.y) / 2) * height,
          shown: facing > 0.2 && ndc.z < 1,
        };
        if (a.face) {
          let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
          for (const c of a.face) {
            const p = tmpL.copy(c).applyMatrix4(a.obj.matrixWorld).project(camera);
            const px = ((p.x + 1) / 2) * width, py = ((1 - p.y) / 2) * height;
            [x0, x1, y0, y1] = [Math.min(x0, px), Math.max(x1, px), Math.min(y0, py), Math.max(y1, py)];
          }
          spot.face = [x0, x1, (y0 + y1) / 2, (y1 - y0) / 2];
        }
        return spot;
      });
      const sig = spots.map((s) => `${s.id}${Math.round(s.x)},${Math.round(s.y)},${Math.round(s.lx)},${s.shown}`).join("|");
      if (sig !== lastSpots) {
        lastSpots = sig;
        opts.onHotspots(spots);
      }
    }
  };

  // frame-time watch: p90 above 22 ms for 2 s drops to one pixel per CSS pixel and no shadow map; slow again -> onSlow
  let level = opts.tier === "A" || dprCap > 1 ? 0 : 1;
  let samples: number[] = [];
  let sampled = 0;
  const watch = (ms: number) => {
    samples.push(ms);
    sampled += ms;
    if (sampled < 2000 || samples.length < 30) return;
    const p90 = [...samples].sort((a, b) => a - b)[Math.floor(samples.length * 0.9)];
    samples = [];
    sampled = 0;
    if (p90 <= 22) return;
    if (level === 0) {
      level = 1;
      dprCap = 1;
      applyDpr();
      resize();
      // a shader recompile is a hitch of its own: only when there were shadows to drop
      if (renderer.shadowMap.enabled) {
        renderer.shadowMap.enabled = false;
        key.castShadow = false;
        mats.forEach((m) => (m.needsUpdate = true));
      }
    } else if (level === 1) {
      level = 2;
      opts.onSlow?.();
    }
  };

  const step = (dt: number): boolean => {
    let busy = false;
    const gap = poseGap(cur, goal);
    if (gap > 1e-4) {
      cur = blend(cur, goal, 1 - Math.exp(-6 * dt));
      busy = true;
    } else cur = goal;

    if (!dragging) {
      if (Math.abs(spinVel) > 0.02) {
        spin += spinVel * dt;
        spinGoal = spin;
        spinVel *= Math.exp(-3.2 * dt);
        busy = true;
      } else {
        spinVel = 0;
        const k = 1 - Math.exp(-7 * dt);
        if (Math.abs(spinGoal - spin) > 1e-4) {
          spin += (spinGoal - spin) * k;
          busy = true;
        } else spin = spinGoal;
        if (Math.abs(pitchGoal - pitch) > 1e-4) {
          pitch += (pitchGoal - pitch) * k;
          busy = true;
        } else pitch = pitchGoal;
      }
    }

    if (wipeTo) {
      legT = Math.min(1, legT + dt / legDur);
      wipeU = legFrom + (legGoal - legFrom) * ease(legT);
      hv.uWipe.value = wipeU;
      if (wood instanceof MeshPhysicalMaterial) {
        const a = COAT[curFinish];
        const b = COAT[wipeTo];
        wood.clearcoat = a[0] + (b[0] - a[0]) * wipeU;
        wood.clearcoatRoughness = a[1] + (b[1] - a[1]) * wipeU;
      }
      if (legT >= 1) {
        if (legGoal === 1) completeWipe();
        else cancelWipe();
        const q = queued;
        queued = null;
        if (q && q.f === wantFinish) startWipe(q.f, q.tex, true);
      }
      busy = true;
    }
    return busy || dragging;
  };

  let raf = 0;
  let last = 0;
  const canRun = () => ready && !disposed && !lost && !paused && onScreen && !document.hidden;
  const frame = (now: number) => {
    raf = 0;
    const ms = Math.min(100, now - last);
    last = now;
    const busy = step(ms / 1000);
    draw();
    if (busy) watch(ms);
    // `!raf`: something inside step (a queued finish wipe starting) may have called wake() already, and a second
    // request here would run two loops per frame with only one of them cancellable
    if (busy && canRun() && !raf) raf = requestAnimationFrame(frame);
  };
  function wake() {
    if (raf || !canRun()) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // --- showroom input --------------------------------------------------------------------------------------
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  const onDown = (e: PointerEvent) => {
    if (!interactive || e.button > 0) return;
    dragging = true;
    spinVel = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = e.timeStamp;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
    wake();
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = ((e.clientX - lastX) / Math.max(320, width)) * Math.PI * 1.6;
    const dt = Math.max(1, e.timeStamp - lastT) / 1000;
    spin += dx;
    spinGoal = spin;
    spinVel = spinVel * 0.6 + (dx / dt) * 0.4;
    if (e.pointerType === "mouse") {
      pitch = Math.min(Math.max(pitch + ((e.clientY - lastY) / Math.max(320, height)) * 1.2, -0.12), 0.3);
      pitchGoal = pitch;
    }
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = e.timeStamp;
    wake();
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    if (e.timeStamp - lastT > 80) spinVel = 0; // a pause before letting go means no throw
    spinVel = Math.max(-6, Math.min(6, spinVel));
    canvas.style.cursor = interactive ? "grab" : "";
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    wake();
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  // --- lifecycle -------------------------------------------------------------------------------------------
  const io = new IntersectionObserver((entries) => {
    onScreen = entries.some((en) => en.isIntersecting);
    if (onScreen) wake();
    else stop();
  });
  io.observe(canvas);
  const onVisibility = () => (document.hidden ? stop() : wake());
  document.addEventListener("visibilitychange", onVisibility);
  const ro = new ResizeObserver(() => {
    resize();
    if (!raf && canRun()) draw();
  });
  ro.observe(canvas);

  resize();
  if (shadows) {
    // build the open door's programs (receiveShadow off) now too, so the first opening doesn't stall on a compile
    for (const m of rearMeshes) m.receiveShadow = false;
    await renderer.compileAsync(scene, camera);
    for (const m of rearMeshes) m.receiveShadow = true;
  }
  await renderer.compileAsync(scene, camera);
  await breathe();
  await upload([first.color, first.height, paperColor, paperHeight, shadowTex, woolColor, woolHeight]);
  ready = true;
  draw(); // three checks each program on its first use, so a failed compile shows up here
  wake(); // picks up whatever the observers asked for while the programs were linking

  const api: Speaker = {
    setPose(p) {
      goal = p;
      wake();
    },
    setFinish(f, wipe = true) {
      if (f === wantFinish) return;
      wantFinish = f;
      void loadFinish(f).then(async (tex) => {
        await upload([tex.color, tex.height]);
        if (!disposed && wantFinish === f) startWipe(f, tex, wipe);
      });
    },
    preload() {
      for (const f of ["walnut", "chalk", "graphite"] as Finish[]) void loadFinish(f);
    },
    setInteractive(on) {
      interactive = on;
      canvas.style.cursor = on ? "grab" : "";
      canvas.style.touchAction = on ? "pan-y" : "";
      if (!on) {
        dragging = false;
        lastSpots = "";
      }
      wake();
      if (!raf && canRun()) draw();
    },
    nudge(yaw, p = 0) {
      spinVel = 0;
      spinGoal += yaw;
      pitchGoal = Math.min(Math.max(pitchGoal + p, -0.12), 0.3);
      wake();
    },
    reset() {
      spinVel = 0;
      // unwind the shortest way: bring the turn into (-pi, pi] first
      spin = Math.atan2(Math.sin(spin), Math.cos(spin));
      spinGoal = 0;
      pitchGoal = 0;
      wake();
    },
    setPaused(p) {
      paused = p;
      if (p) stop();
      else wake();
    },
    dispose() {
      disposed = true;
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      const textures = new Set<Texture>([paperColor, paperHeight, shadowTex, woolColor, woolHeight]);
      scene.traverse((o) => {
        if (!(o instanceof Mesh)) return;
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose();
      });
      void Promise.all(finishTex.values()).then((all) => all.forEach((t) => (t.color.dispose(), t.height.dispose())));
      textures.forEach((t) => t.dispose());
      envTarget.dispose();
      key.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
  if (shaderFailed) {
    api.dispose();
    throw new Error("Halvane: shader compile failed");
  }
  mounted = true;
  return api;
}

// keep the type-only Group import from being dropped by editors that sort imports
export type { Group };
