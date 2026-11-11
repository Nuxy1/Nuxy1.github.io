// Real client case studies (src/components/CaseStudy.astro). Empty until there is a client who agreed to be named.
// `consent` records the client's written yes (who, when, to what); without it the component renders nothing.
// Optional parts are shown only when filled in: `solution` (how the problem was solved, in a sentence or two),
// `shots` (screenshots of the real work), `beforeAfter` (the same screen before and after), `results` (each with the
// source of its number) and `quote` (the client's own words, only when they gave them). Nothing here is ever made up.
export type CaseShot = { src: string; alt: string; width: number; height: number; caption?: string };
export type CaseStudyData = {
  slug: string; business: string; industry: string; location: string; problem: string; solution?: string; built: string[];
  shots?: CaseShot[]; beforeAfter?: { before: CaseShot; after: CaseShot };
  results: { value: string; label: string; source: string }[]; quote?: { text: string; name: string }; consent: string;
};
export const caseStudies: CaseStudyData[] = [];
