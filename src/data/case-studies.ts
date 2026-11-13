// Real client case studies (src/components/CaseStudy.astro). Empty until a real client project passes every check below.
// The portfolio keeps three kinds of work apart: client projects (this file), concept demonstrations for made-up
// businesses (demo-sites.ts) and interactive experiments (examples.ts and /demos/). Nothing moves between them.
//
// An entry reaches a page only when `publishable()` says so:
//   consent            the client's written yes: who agreed, when, and to what (name, pictures, link, quote).
//   checks.completed   when the project was finished and handed over, and how that was confirmed.
//   checks.permission  where the written permission is kept (for example the email's date and subject).
//   checks.screenshots who approved the exact pictures used here, and when.
//   checks.details     who confirmed that the text on this card is accurate, and when.
//   checks.url         only when the client agreed to a link to the live website; without it no link is shown.
// Candidates and what each still needs are listed in business/site-upgrade/case-study-candidates.md, not here:
// a half-checked client never goes into this file.
//
// Never put here: a street address or anything the client keeps private, a number nobody can source, a quote the
// client did not give, or a feature the project does not have. `location` is a town at most, and only when approved.
// Optional parts are shown only when filled in: `location`, `solution`, `tech`, `shots`, `beforeAfter`, `video`, `url`,
// `results` (each with the source of its number) and `quote` (the client's own words).
export type CaseShot = { src: string; alt: string; width: number; height: number; caption?: string; device?: "desktop" | "mobile" };
export type CaseVideo = { src: string; poster: string; width: number; height: number; label: string; captions?: string };
export type CaseChecks = { completed: string; permission: string; screenshots: string; details: string; url?: string };
export type CaseStudyData = {
  slug: string; business: string; industry: string; location?: string;
  projectType: string;      // for example "Business website with online booking"
  services: string[];       // what Nuxy delivered, in the catalogue's words
  problem: string; solution?: string;
  built: string[];          // key functionality the finished project really has
  tech?: string[];
  shots?: CaseShot[]; beforeAfter?: { before: CaseShot; after: CaseShot }; video?: CaseVideo;
  url?: string;             // the live website; shown only with checks.url
  results?: { value: string; label: string; source: string }[];
  quote?: { text: string; name: string };
  consent: string; checks: CaseChecks;
};

const filled = (s?: string) => Boolean(s && s.trim().length >= 10);

// True only when the consent and all four checks are written down. Pages and the component both ask this.
export const publishable = (c?: CaseStudyData): boolean =>
  Boolean(c && c.consent?.trim().length >= 20 && c.checks && filled(c.checks.completed) && filled(c.checks.permission) && filled(c.checks.screenshots) && filled(c.checks.details));

// The live link is shown only when the client agreed to it as well.
export const liveLink = (c: CaseStudyData): string | undefined => (c.url && filled(c.checks?.url) ? c.url : undefined);

export const caseStudies: CaseStudyData[] = [];
