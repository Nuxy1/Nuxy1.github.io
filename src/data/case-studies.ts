// Real client case studies: a card (src/components/CaseStudy.astro) on the home page and /portfolio/, and a project page
// (src/pages/portfolio/[slug].astro). Empty until a real client project passes every check below.
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
import type { IconName } from "../components/Icon.astro";
import { staged } from "./staged-case-studies.ts";

export type CaseShot = { src: string; srcset?: string; alt: string; width: number; height: number; caption?: string; device?: "desktop" | "mobile" };
// `note`: a line shown under the video, for example that a booking in it was made with test data
export type CaseVideo = { src: string; poster: string; width: number; height: number; label: string; captions?: string; note?: string };
export type CaseChecks = { completed: string; permission: string; screenshots: string; details: string; url?: string };
export type CaseStudyData = {
  slug: string; business: string; industry: string; location?: string;
  projectType: string;      // for example "Business website with online booking"
  services: string[];       // what Nuxy delivered, in the catalogue's words
  problem: string; solution?: string;
  built: string[];          // key functionality the finished project really has
  tech?: string[];
  techNote?: string;        // one plain sentence above the tech list: what being built this way means for the client
  shots?: CaseShot[]; beforeAfter?: { before: CaseShot; after: CaseShot }; video?: CaseVideo;
  url?: string;             // the live website; shown only with checks.url
  results?: { value: string; label: string; source: string }[];
  quote?: { text: string; name: string };
  // The client card and the project page (/portfolio/<slug>/), each part shown only when filled in:
  card?: { category: string; description: string; highlights: string[] }; // the card's category line, summary and highlights
  overview?: string; outcome?: string;  // "Project Overview" and "Project Outcome" (an outcome names no number it can't source)
  features?: { title: string; text: string; icon?: IconName }[];
  // `lead`: the quote form's lead source for "Get a Free Quote" on the project page (?from=<id>). The inquiry service lists
  //   the same ids and labels in agent/upwork-inbox-drafter/src/inquiry.js LEAD_SOURCES, and a test compares them.
  // `replaces`: the id of a creative concept demo (data/creative.ts) that this project takes the place of in the video
  //   strips on the home page and /portfolio/ while it is shown. The demo and its files stay.
  lead?: { id: string; label: string }; replaces?: string;
  consent: string; checks: CaseChecks;
};

const filled = (s?: string) => Boolean(s && s.trim().length >= 10);

// True only when the consent and all four checks are written down. Pages and the component both ask this.
export const publishable = (c?: CaseStudyData): boolean =>
  Boolean(c && c.consent?.trim().length >= 20 && c.checks && filled(c.checks.completed) && filled(c.checks.permission) && filled(c.checks.screenshots) && filled(c.checks.details));

// The live link is shown only when the client agreed to it as well.
export const liveLink = (c: CaseStudyData): string | undefined => (c.url && filled(c.checks?.url) ? c.url : undefined);

// Chrysfadezzz: every fact checked against the CHRYS project (docs/PLAN.md, docs/STATUS.md and the running site).
// Pictures and video are real captures of that site, 13 November 2026: the content pages from the development copy,
// the booking steps from a test copy with made-up details ("Test Client", example.com email, 555 phone number), so no
// real customer and no real appointment appears. No client photo from the barber's portfolio is used (that permission
// covers his site, not Nuxy's). No address, no dashboard address, no numbers.
const media = "/media/chrys";
const desktop = (name: string, alt: string, caption: string) => ({
  src: `${media}/${name}-1440.webp`, srcset: `${media}/${name}-800.webp 800w, ${media}/${name}-1440.webp 1440w`,
  alt, caption, width: 1440, height: 900, device: "desktop" as const,
});
const phone = (name: string, alt: string, caption: string) => ({
  src: `${media}/${name}-780.webp`, srcset: `${media}/${name}-400.webp 400w, ${media}/${name}-780.webp 780w`,
  alt, caption, width: 780, height: 1688, device: "mobile" as const,
});

export const caseStudies: CaseStudyData[] = [
  {
    slug: "chrysfadezzz",
    business: "Chrysfadezzz",
    industry: "Barber",
    location: "Faribault, Minnesota",
    projectType: "Real Client Website",
    services: ["Custom-coded website", "Online booking & reminders"],
    card: {
      category: "Barber & Appointment Booking",
      description: "A modern barber website designed to simplify appointment booking, showcase services, and provide a smooth mobile experience.",
      highlights: ["Online appointment booking", "Live appointment availability", "Mobile-responsive design", "Professional service presentation", "Streamlined customer experience"],
    },
    overview: "Chrysfadezzz is a barber in Faribault, Minnesota, cutting fades, tapers, designs and beard work. Nuxy designed and built his website: a black-and-gold site that presents his services and prices and lets clients book a time online, on a phone or a computer.",
    problem: "Booking ran through Instagram direct messages. A client had to send a message, wait for a reply and agree on a time, and nothing stopped two people being offered the same slot. The cancellation and late policies sat in a single post that scrolled out of sight, and searching for a barber in Faribault found nothing that belonged to him.",
    solution: "A website built around booking. Clients pick a service, a day and an open time, add their details, read the policies and send the request in a few steps, then get an email with a link to manage it. The services and prices are on their own page, written plainly, and the site is set up for local search.",
    features: [
      { icon: "clock", title: "Live availability", text: "Only open times are offered, worked out from his working hours and the bookings already made, so a slot can't be given twice." },
      { icon: "bellRinging", title: "Reminder emails", text: "Clients get a reminder before the appointment, by email once it is set up at launch." },
      { icon: "listChecks", title: "Cancellation waitlist", text: "When a service is fully booked, clients can join a waitlist and get an email if a time opens up. It switches on with email at launch." },
      { icon: "shieldCheck", title: "Policies before booking", text: "Cancellation, no-show and late rules are shown in the booking steps and acknowledged before a request is sent." },
      { icon: "mapPin", title: "Private location", text: "The exact address is never published: clients are told to message him for it once a booking is confirmed." },
      { icon: "monitor", title: "Run by the barber", text: "He manages his hours, bookings and portfolio himself, from a private dashboard that only he can sign in to." },
    ],
    built: ["Online booking with live availability", "Booking management by private link", "Reminder emails and a cancellation waitlist", "Services and prices page", "Mobile-first design", "Local search setup"],
    tech: ["Next.js", "React", "PostgreSQL", "Tailwind CSS", "Installable web app (PWA)"],
    techNote: "Built from code rather than a page builder, so the booking rules, reminders and waitlist work the way his shop does: Next.js and React draw the pages, PostgreSQL keeps the bookings and Tailwind CSS styles them. Clients can also add the site to their phone's home screen and open it like an app.",
    outcome: "Built and tested: a booking runs from choosing a service to the request-received screen, with the policies agreed to on the way, as the walkthrough above shows. The emails (the booking link, reminders and the waitlist) start once email is set up at launch. The site is not live yet, so no results are claimed here. It goes live once hosting and accounts are set up in the barber's own name, so he will own it outright.",
    shots: [
      desktop("home-desktop", "The Chrysfadezzz home page on a computer: the heading “Precision. Style. Confidence.” in white serif type on black, with gold How to Book and See the Work buttons.", "Home page"),
      phone("home-phone", "The Chrysfadezzz home page on a phone: the same heading, the gold How to Book button, and the starting price of $30.", "Home page on a phone"),
      desktop("book-time-desktop", "Booking on a computer, the time step: open times for Wednesday, November 18, grouped into morning, afternoon and evening.", "Booking on a computer: open times by morning, afternoon and evening"),
      desktop("services-desktop", "The Services and prices page on a computer: Haircut $30 and Haircut + Design $35, each with a one-line description.", "Services and prices"),
      phone("services-phone", "The Services and prices page on a phone, listing Haircut, Haircut + Design and Haircut + Beard with their prices.", "Services on a phone"),
      phone("book-time-phone", "Booking on a phone, the time step: open times for Wednesday, November 18 as rounded buttons.", "Booking: pick a time"),
      phone("book-review-phone", "Booking on a phone, step 6 of 6: a summary of the haircut, the time and the made-up test client, with a Send Booking Request button.", "Booking: check and send"),
      phone("book-confirmed-phone", "The Request received screen on a phone, with a reference number and a note that the exact location is private.", "Booking: request received"),
    ],
    video: {
      src: `${media}/walkthrough.mp4`, poster: `${media}/poster-1280.webp`, width: 1280, height: 800,
      label: "Walkthrough of the Chrysfadezzz website, 64 seconds, no sound: the home page, the services, a booking from start to finish, then the same on a phone.",
      captions: `${media}/walkthrough.vtt`,
      note: "The booking pictures and this video were made on a test copy of the site with made-up details. No real appointment was booked.",
    },
    lead: { id: "portfolio-chrys", label: "Portfolio — CHRYS" },
    replaces: "noctis-skin",
    // The barber's yes, relayed by Nuxy's owner on 13 November 2026 (business/site-upgrade/approvals.md item 94).
    // No live link: his site is not live yet (item 95). The page says neither "sold" nor "gift" (item 97).
    consent: "Chrysfadezzz (the barber) said yes to his name, his town (Faribault, Minnesota), the 8 screenshots, the 64-second walkthrough and this text; relayed by Nuxy's owner on 13 November 2026.",
    checks: {
      completed: "Built and tested by 13 November 2026 (the CHRYS project's docs/STATUS.md); not launched yet, as the page says: it goes live once his hosting and accounts are set up in his name.",
      permission: "His yes was relayed by Nuxy's owner on 13 November 2026 (\"his yes covered everything\") and is recorded in business/site-upgrade/approvals.md, item 94.",
      screenshots: "The barber approved the 8 screenshots and the walkthrough shown here (made with test data only); relayed by Nuxy's owner, 13 November 2026.",
      details: "The barber approved this wording: his name, town, services and the card text; relayed by Nuxy's owner, 13 November 2026.",
    },
  },
];

// What the pages show: every publishable client project, then any staged one. `staged` is always empty except in the
// stage build (src/data/staged-case-studies.ts says how), so in the published site this is exactly the publishable list.
export const isStaged = (c: CaseStudyData): boolean => staged.includes(c);
export const shownCases: CaseStudyData[] = [...caseStudies.filter((c) => publishable(c)), ...staged];
// the concept demos a shown client project takes the place of (see `replaces`)
export const replacedDemos: ReadonlySet<string> = new Set(shownCases.flatMap((c) => (c.replaces ? [c.replaces] : [])));
// the lead sources the quote form accepts (?from=<id>), from the shown projects only
export const leadSources: Record<string, string> = Object.fromEntries(shownCases.flatMap((c) => (c.lead ? [[c.lead.id, c.lead.label] as const] : [])));
