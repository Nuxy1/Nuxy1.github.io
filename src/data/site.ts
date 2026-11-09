// Site-wide settings. Everything here is public (it ships in the page): never put a secret in this file.

export const inbox = "nuxy@nuxyautomation.com";

// The inquiry form posts here: Nuxy's own inquiry service on Nuxy's server (its code and deploy steps are kept in
// the private business repo). PUBLIC_INQUIRY_URL overrides it for local tests.
export const inquiryUrl: string = import.meta.env.PUBLIC_INQUIRY_URL || "https://preview.nuxyautomation.com/inquiry";

// Anonymous page counts (event + page + day; no cookies, no IP, no form contents). Empty string = off.
export const hitUrl: string = import.meta.env.PUBLIC_HIT_URL ?? "https://preview.nuxyautomation.com/hit";

// A Cal.com or Calendly booking page. Empty = the booking option is not shown anywhere. Set it only once the
// calendar is configured with its own public event type (never the private calendar).
export const calUrl = "";

// People shown on the About page. Empty until the owner approves names and photos; never a made-up person.
export type Person = { name: string; role: string; bio: string; photo?: string };
export const team: Person[] = [];

// Real client case studies (src/components/CaseStudy.astro). Empty until there is a client who agreed to be named.
export type CaseStudyData = {
  slug: string; business: string; industry: string; location: string; problem: string; built: string[];
  results: { value: string; label: string; source: string }[]; quote?: { text: string; name: string }; consent: string;
};
export const caseStudies: CaseStudyData[] = [];
