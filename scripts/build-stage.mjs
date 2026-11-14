// npm run build:stage: builds the review copy of the site with the staged client case studies into dist-stage/.
// The setting is made here rather than in package.json so the same command works in PowerShell, cmd and bash.
// See astro.config.mjs (STAGE) for what the stage build changes; dist/, the published folder, is never touched.
process.env.NUXY_STAGE = "1";
const { build } = await import("astro");
await build({});
