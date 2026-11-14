// Client case studies waiting on the client's written approval: empty here, always. The stage build
// (NUXY_STAGE=1 npm run build:stage, into dist-stage/) swaps this file for stage/case-studies.ts, so a staged
// case study can be reviewed on this computer without ever reaching dist/, the folder that is published.
// tests/stage.test.mjs checks both halves of that.
import type { CaseStudyData } from "./case-studies";

export const staged: CaseStudyData[] = [];
