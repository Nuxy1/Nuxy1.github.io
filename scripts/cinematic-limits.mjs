// The loops the site has a place for and the largest file the encoder lets through, in bytes.
// One list for scripts/encode-cinematic.mjs (which refuses anything over) and tests/creative.test.mjs (which holds
// every listed file to the same numbers), so the two can never disagree.
export const LOOPS = ["hero", "web-development", "automation", "security", "creative-studio"];
export const LIMITS = { loop: 1_600_000, loopMobile: 700_000, demo: 8_000_000, poster: 120_000 };
