// Site-wide settings. Everything here is public (it ships in the page): never put a secret in this file.

export const inbox = "nuxy@nuxyautomation.com";

// The inquiry form posts here: Nuxy's own inquiry service on Nuxy's server (its code and deploy steps are kept in
// the private business repo). PUBLIC_INQUIRY_URL overrides it for local tests.
export const inquiryUrl: string = import.meta.env.PUBLIC_INQUIRY_URL || "https://preview.nuxyautomation.com/inquiry";

// Anonymous page counts: the address lives in ./hit.ts (the browser script on every page imports it from there).
export { hitUrl } from "./hit";

// A Cal.com or Calendly booking page. Empty = the booking option is not shown anywhere. Set it only once the
// calendar is configured with its own public event type (never the private calendar): see
// business/site-upgrade/08-booking-cal-vs-calendly.md. Setting it also adds the booking line to the privacy policy.
export const calUrl = "";
// The length of that event type, as the contact page states it. Keep it equal to the event's length.
export const calMinutes = 15;

// The "Request a callback" form on /contact/ (components/CallbackForm.astro), with its line in the privacy policy and
// its wording on /contact/thanks/. It needs the inquiry service with callback support (kind=callback, 2026-11-13):
// deploy that service FIRST, then a site build with this on. An older service refuses every callback request (it asks
// for an email and a project description), so the form would only ever show its "not sent" message.
export const callbackForm = true;
// The booking service's name for the privacy policy, from calUrl's address ("" while calUrl is empty).
const calHost = calUrl ? new URL(calUrl).hostname.replace(/^www\./, "") : "";
export const calService = ({ "cal.com": "Cal.com", "calendly.com": "Calendly" } as Record<string, string>)[calHost] ?? calHost;

// Whether Nuxy has a Shopify Partner account (it needs the owner's yes: brief 4, no new external accounts). Until it does,
// /ecommerce/ shows only the collaborator path (the client opens the store, then sends a collaborator request code),
// which works without one. Set to true only once the Partner account exists and a client transfer has been tried.
export const shopifyPartner = false;

// People shown on the About page. Empty until the owner approves names and photos; never a made-up person.
export type Person = { name: string; role: string; bio: string; photo?: string };
export const team: Person[] = [];

// Real client case studies live in ./case-studies.ts (each one only with the client's consent and four checks).
export { caseStudies, publishable, shownCases, isStaged, replacedDemos } from "./case-studies";
export type { CaseStudyData, CaseShot } from "./case-studies";

// The client handover portal (guided onboarding, approvals and launch steps a customer signs in to). It is being built
// in the command center and is NOT live: no customer can sign in to anything today. While this is false the site says
// nothing about a portal anywhere, and no sign-in or onboarding route is published. Turn it on only when the real
// system is live for customers, and write the /handover/ portal section from real screens of it, with demo data.
export const handoverPortal = false;
