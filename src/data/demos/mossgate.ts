// Mossgate Home Cleaning: a fictional cleaning company (data/demo-sites.ts). Every name, price, person, place and
// quote here is invented for the demonstration; the price rules live in lib/demo/mossgate-estimate.ts.
import type { Clean } from "../../lib/demo/mossgate-estimate";

export const base = "/example-sites/mossgate-cleaning";
export const phone = "(507) 555-0163";
export const email = "hello@mossgate.example";
export const callNote = `Demo: on a real site this button calls the office at ${phone}.`;
export const textNote = `Demo: on a real site this opens a text to ${phone}.`;
export const emailNote = `Demo: on a real site this writes to ${email}.`;

export const nav = [
  { href: `${base}/estimate/`, label: "Prices" },
  { href: `${base}/checklist/`, label: "What we clean" },
  { href: `${base}/about/`, label: "About" },
];

export const hours = [
  ["Monday–Friday", "8:00 am – 5:00 pm"],
  ["Saturday", "8:00 am – 1:00 pm"],
  ["Sunday", "Closed"],
] as const;

// made-up towns, labelled as such where they appear
export const area = ["Mossgate", "Alder Bend", "North Fennick", "Larkhollow", "Copper Mill"];

/** what each clean covers, room by room: `clean` is the lightest clean that includes the task */
export type Room = { id: string; name: string; tasks: { t: string; clean: Clean }[] };
export const rooms: Room[] = [
  { id: "kitchen", name: "Kitchen", tasks: [
    { t: "Counters, backsplash and sink scrubbed", clean: "standard" },
    { t: "Stovetop degreased, outside of appliances wiped", clean: "standard" },
    { t: "Floor vacuumed and mopped", clean: "standard" },
    { t: "Cabinet fronts and handles wiped", clean: "deep" },
    { t: "Inside the microwave", clean: "deep" },
    { t: "Inside the oven and fridge", clean: "movein" },
    { t: "Inside every cabinet and drawer", clean: "movein" },
  ] },
  { id: "bath", name: "Bathrooms", tasks: [
    { t: "Toilet, shower, tub and sink disinfected", clean: "standard" },
    { t: "Mirrors and chrome polished", clean: "standard" },
    { t: "Floor washed by hand around the toilet", clean: "standard" },
    { t: "Grout and soap scum scrubbed", clean: "deep" },
    { t: "Vents and light fixtures dusted", clean: "deep" },
    { t: "Inside the vanity and medicine cabinet", clean: "movein" },
  ] },
  { id: "bed", name: "Bedrooms", tasks: [
    { t: "Beds made (linens changed if left out)", clean: "standard" },
    { t: "Surfaces dusted, mirrors cleaned", clean: "standard" },
    { t: "Floors vacuumed, under the bed where we can reach", clean: "standard" },
    { t: "Baseboards and door frames wiped", clean: "deep" },
    { t: "Inside closets, shelves and rails", clean: "movein" },
  ] },
  { id: "living", name: "Living areas", tasks: [
    { t: "Surfaces and electronics dusted", clean: "standard" },
    { t: "Cushions straightened, sofa vacuumed", clean: "standard" },
    { t: "Floors vacuumed and mopped", clean: "standard" },
    { t: "Light switches and door handles disinfected", clean: "deep" },
    { t: "Behind and under furniture we can move", clean: "deep" },
    { t: "Window sills and tracks", clean: "deep" },
  ] },
  { id: "entry", name: "Entry and stairs", tasks: [
    { t: "Mat shaken, floor vacuumed and mopped", clean: "standard" },
    { t: "Stairs vacuumed, railings wiped", clean: "standard" },
    { t: "Front door glass and frame", clean: "deep" },
    { t: "Coat closet emptied and wiped", clean: "movein" },
  ] },
];

export const team = [
  { name: "Rosa", role: "Team lead, 9 years", note: "Trains every new cleaner on the checklist before they clean alone.", tone: "#2f6f5e" },
  { name: "Dev", role: "Deep and move-out cleans", note: "The one to ask about ovens nobody has opened in years.", tone: "#d9714f" },
  { name: "Maren", role: "Recurring homes", note: "Keeps the same seven homes every two weeks, so nothing gets missed.", tone: "#8a9a5b" },
  { name: "Theo", role: "Office and scheduling", note: "Answers the texts and moves cleans when plans change.", tone: "#5b7f95" },
];

export const quotes = [
  { text: "I booked on my phone in the school pickup line. Rosa texted when she was on the way and sent a photo of the checklist when she left.", who: "Sample testimonial", where: "Alder Bend" },
  { text: "The move-out clean got our whole deposit back. The price on the site was what we paid.", who: "Sample testimonial", where: "North Fennick" },
  { text: "Same cleaner every other Thursday for a year. I stopped writing notes because she already knows.", who: "Sample testimonial", where: "Mossgate" },
];

export const faq = [
  ["Do I need to be home?", "No. Most customers leave a key in a lockbox. We never ask for a door code on the website: Theo calls to set that up after you book, and we text when we arrive and when we leave."],
  ["Do you bring supplies?", "Yes, everything, including a vacuum and microfibre cloths that are washed after every home. If you’d like your own products used, leave them out and say so in the notes."],
  ["What if I need to change the day?", "Reply to the reminder text at least a day ahead and we’ll find a new window. There’s no fee for moving a clean."],
  ["How do I pay?", "An invoice arrives by email after the clean with a link to pay by card. Nothing is charged before the clean is done."],
  ["Is the estimate the final price?", "It’s a range for a typical home of that size. We confirm the exact price before the first clean, and it only changes if you ask for more."],
  ["What does a recurring plan include?", "A standard clean at the same window with the same cleaner. Most plans start with one deep clean so the regular visits keep up from a clean slate."],
] as const;
