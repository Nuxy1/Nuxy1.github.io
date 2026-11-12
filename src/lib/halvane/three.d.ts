// three ships without its own type declarations and @types/three is not installed (the site builds with esbuild,
// which does not type-check); these lines keep the editor quiet about the Halvane scene's imports.
declare module "three";
declare module "three/addons/geometries/RoundedBoxGeometry.js";
declare module "three/addons/environments/RoomEnvironment.js";
