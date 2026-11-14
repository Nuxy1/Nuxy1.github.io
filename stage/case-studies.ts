// STAGED, NOT PUBLISHED. Client case studies that wait on the client's written approval. Only the stage build reads
// this file (NUXY_STAGE=1 npm run build:stage, into dist-stage/): astro.config.mjs swaps it in for
// src/data/staged-case-studies.ts, which is empty. The production build (npm run build, dist/) never sees it, and
// tests/stage.test.mjs fails if anything from here reaches dist/.
//
// An entry moves to src/data/case-studies.ts `caseStudies` only when every check there is written down (consent,
// completed, permission, screenshots, details; url for a live link). Open approvals: business/site-upgrade/approvals.md
// items 94 onward, and Candidate 1 in business/site-upgrade/case-study-candidates.md.
//
// Chrysfadezzz moved to src/data/case-studies.ts on 13 November 2026, once the barber said yes (approvals.md 94).
import type { CaseStudyData } from "../src/data/case-studies";

export const staged: CaseStudyData[] = [];
