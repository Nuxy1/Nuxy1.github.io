// Website levels (owner's brief, 2026-11-12): Business, Signature, Immersive and Flagship, so a customer can see what
// each price buys. Pages read everything about the levels from here: /web-design/, the level pages, the home strip,
// the portfolio badges, the case studies and the form. tests/levels.test.mjs pins every price and add-on below.
//
// The Business price is not typed here: it is the live website price in data/services.ts (one page and 4-page site),
// so the two can never disagree. Signature, Immersive and Flagship are starting points for a custom-coded build, and
// every one of them is confirmed in a written quote before any work starts.
//
// (The export is `levels`, not `tiers`: services.ts already exports `tiers`, the home page's "three ways to start".)
import { serviceById, variantById } from "./services";

import type { LevelId } from "./level-finder";
export type { LevelId };
export type MeterId = "design" | "motion" | "interaction" | "depth" | "story" | "custom";
/** 1 Basic, 2 Enhanced, 3 Advanced, 4 Bespoke */
export type Score = 1 | 2 | 3 | 4;

export const scale = ["Basic", "Enhanced", "Advanced", "Bespoke"] as const;
export const scaleName = (s: Score) => scale[s - 1];

export const meters: { id: MeterId; name: string; text: string }[] = [
  { id: "design", name: "Visual design", text: "How far the look is made for your brand: layout, type, colour and photography." },
  { id: "motion", name: "Motion", text: "How things move: from calm, quick changes to motion that tells the story as you scroll." },
  { id: "interaction", name: "Interactivity", text: "What a visitor can do on the page beyond reading and tapping a button." },
  { id: "depth", name: "Depth & 3D", text: "Layers, perspective and real-time 3D, used only where they help." },
  { id: "story", name: "Storytelling", text: "How the page leads a visitor from first look to the action you want." },
  { id: "custom", name: "Custom engineering", text: "How much is built from scratch for this one site." },
];

const starter = variantById["starter-website"].price; // "$499"
const site = serviceById["new-website"].price; // "$900"

export type Level = {
  id: LevelId;
  name: string;
  /** the home strip's short promise */
  promise: string;
  tagline: string;
  for: string;
  /** the price as a heading shows it */
  price: string;
  priceNote: string;
  /** the lowest starting number, for sorting and the recommender */
  from: number;
  built: string;
  points: string[];
  scores: Record<MeterId, Score>;
  complexity: "Lower" | "Moderate" | "High" | "Bespoke";
  timeline: string;
  revisions: string;
  cta: string;
  href: string;
  page?: string;
  /** the budget band that usually fits it (the form's budget values) */
  budget: string;
};

export const levels: Level[] = [
  {
    id: "business",
    name: "Business",
    promise: "Built to convert",
    tagline: "A clear, fast website that turns visitors into calls, bookings and quote requests.",
    for: "Local and service businesses that need to look professional, be found and make it easy to get in touch.",
    price: `${starter} – ${site}`,
    priceNote: `One page ${starter}, a site of up to 4 pages ${site}. Larger sites are quoted in writing.`,
    from: 499,
    built: "Designed for your business and built in your own Squarespace or Wix account, so you can edit it yourself.",
    points: ["Phone-first layout with your services, prices, hours and map", "A Book, Quote or Call button on every screen", "Calm, quick motion that never slows a visitor down", "Basic local search setup on your own domain"],
    scores: { design: 2, motion: 1, interaction: 1, depth: 1, story: 2, custom: 1 },
    complexity: "Lower",
    timeline: "About 1–2 weeks after we have your words and photos",
    revisions: "One round of changes within 14 days of handover",
    cta: "Start My Website",
    href: "/contact/?level=business",
    page: "/business-websites/",
    budget: "500-1000",
  },
  {
    id: "signature",
    name: "Signature",
    promise: "Built to stand out",
    tagline: "A custom-designed site with a distinct look and polished motion that sets you apart from competitors.",
    for: "Established businesses, studios and premium services whose website has to feel as good as the work they do.",
    price: "From $3,500",
    priceNote: "Most Signature sites fall between $3,500 and $6,000, set by pages and features in a written quote.",
    from: 3500,
    built: "Custom-coded and published to hosting in your name. You own the code and the domain.",
    points: ["A custom design direction made for your brand", "Premium motion on the key sections: scroll reveals and hover detail", "Light depth: layered images, parallax or a 2.5D accent", "Custom sections such as galleries, menus, booking or a shop"],
    scores: { design: 3, motion: 2, interaction: 2, depth: 2, story: 3, custom: 2 },
    complexity: "Moderate",
    timeline: "About 3–5 weeks",
    revisions: "Two rounds on the design direction and one on the finished build",
    cta: "Create My Brand Experience",
    href: "/contact/?level=signature",
    page: "/signature-websites/",
    budget: "3000-6000",
  },
  {
    id: "immersive",
    name: "Immersive",
    promise: "Built to be remembered",
    tagline: "An interactive experience with scroll storytelling and, where it suits the idea, real-time 3D.",
    for: "Product launches, premium brands and venues where the first impression is the whole pitch.",
    price: "Starting at $6,000",
    priceNote: "Custom quoted. The final price depends on the creative direction, the scenes and the 3D work involved.",
    from: 6000,
    built: "Custom-coded, with WebGL and Three.js where the idea calls for it, and a lighter version for slower devices.",
    points: ["A creative direction and storyboard before anything is built", "Scroll storytelling that never takes the scrollbar away", "Interactive 3D or layered scenes, depending on the direction", "A still, fast version for phones, slow devices and reduced motion"],
    scores: { design: 4, motion: 3, interaction: 3, depth: 3, story: 3, custom: 3 },
    complexity: "High",
    timeline: "About 6–10 weeks, set in the written plan",
    revisions: "Two rounds on the creative direction and two on the build",
    cta: "Build an Immersive Experience",
    href: "/contact/?level=immersive",
    page: "/immersive-websites/",
    budget: "6000-12000",
  },
  {
    id: "flagship",
    name: "Flagship",
    promise: "Bespoke digital experiences",
    tagline: "A bespoke digital experience: configurators, multi-scene stories, custom 3D and systems behind them.",
    for: "Brands with a large launch, a product to configure, or an idea no package covers.",
    price: "Custom quote",
    priceNote: "Usually from about $12,000. We scope it with you first and write down what is and isn’t included.",
    from: 12000,
    built: "Planned and built from scratch, often with automation or a back end, in accounts you own.",
    points: ["Discovery and a written scope before any design", "Several interactive scenes, a configurator or custom 3D models", "Automation and integrations behind the site where they help", "Performance and accessibility testing on real devices"],
    scores: { design: 4, motion: 4, interaction: 4, depth: 4, story: 4, custom: 4 },
    complexity: "Bespoke",
    timeline: "Planned with you, often 10 weeks or more",
    revisions: "Set in the written plan for each stage",
    cta: "Discuss a Custom Project",
    href: "/contact/?level=flagship",
    budget: "gt12000",
  },
];

export const levelById = Object.fromEntries(levels.map((l) => [l.id, l])) as Record<LevelId, Level>;
export const isLevel = (x: string): x is LevelId => Object.prototype.hasOwnProperty.call(levelById, x);

/** The expectation matrix: what each level usually includes, row by row. */
export const matrix: { row: string; cells: Record<LevelId, string> }[] = [
  { row: "Best for", cells: { business: "Getting calls, bookings and quotes", signature: "Standing out from competitors", immersive: "Launches and memorable first impressions", flagship: "Ideas no package covers" } },
  { row: "Built in", cells: { business: "Your own Squarespace or Wix", signature: "Custom code, your hosting", immersive: "Custom code, WebGL where it helps", flagship: "Custom code and systems" } },
  { row: "Pages", cells: { business: "1 to 4 (larger quoted)", signature: "Usually 4 to 8", immersive: "A story page plus supporting pages", flagship: "Scoped with you" } },
  { row: "Design", cells: { business: "Clean and on-brand", signature: "Custom design direction", immersive: "Art-directed, storyboarded", flagship: "Bespoke at every step" } },
  { row: "Motion", cells: { business: "Calm, quick changes", signature: "Premium reveals and transitions", immersive: "Scroll storytelling", flagship: "Choreographed scenes" } },
  { row: "Depth & 3D", cells: { business: "None needed", signature: "Layers or a 2.5D accent", immersive: "Real-time 3D where it suits the idea", flagship: "Custom 3D models and scenes" } },
  { row: "Interactivity", cells: { business: "Forms, calls, maps", signature: "Galleries, filters, booking", immersive: "Explorable scenes", flagship: "Configurators and tools" } },
  { row: "Automation", cells: { business: "Add any automation", signature: "Add any automation", immersive: "Add any automation", flagship: "Often part of the plan" } },
  { row: "Slower devices", cells: { business: "Fast everywhere", signature: "Motion steps down", immersive: "A still, fast version", flagship: "Tested on real devices" } },
  { row: "Timeline", cells: { business: levelById.business.timeline, signature: levelById.signature.timeline, immersive: levelById.immersive.timeline, flagship: levelById.flagship.timeline } },
  { row: "Revisions", cells: { business: levelById.business.revisions, signature: levelById.signature.revisions, immersive: levelById.immersive.revisions, flagship: levelById.flagship.revisions } },
  { row: "Price", cells: { business: levelById.business.price, signature: levelById.signature.price, immersive: levelById.immersive.price, flagship: levelById.flagship.price } },
];

/** Add-ons, each with the levels it fits. A Business site lives in Squarespace or Wix, so only add-ons that work inside
 * a website builder fit it (video, an animated illustration, automation behind the site). Flagship scopes everything in
 * its written plan, so no add-on lists it. Prices are starting points, confirmed in the written quote. */
export const addOns: { id: string; name: string; price: string; text: string; fits: LevelId[] }[] = [
  { id: "premium-motion", name: "Premium Motion", price: "+$750", text: "Page transitions and choreographed motion on every page, beyond the key sections.", fits: ["signature"] },
  { id: "3d-hero", name: "Interactive 3D Hero", price: "+$1,500", text: "A real-time 3D scene at the top of the home page, with a still version for slower devices.", fits: ["signature"] },
  { id: "3d-model", name: "Custom 3D Product Model", price: "+$750", text: "Your product modelled for the web from photos or drawings.", fits: ["signature", "immersive"] },
  { id: "scroll-story", name: "Advanced Scroll Storytelling", price: "+$1,500", text: "A section that tells one story step by step as the visitor scrolls.", fits: ["signature", "immersive"] },
  { id: "extra-scene", name: "Additional Interactive Scene", price: "+$1,000", text: "One more explorable scene beyond those in the plan.", fits: ["immersive"] },
  { id: "illustration", name: "Custom Animated Illustration", price: "+$500", text: "An illustration drawn for your brand, with light motion.", fits: ["business", "signature", "immersive"] },
  { id: "video", name: "Cinematic Video Integration", price: "+$500", text: "A background or hero video, compressed and with a still fallback.", fits: ["business", "signature", "immersive"] },
  { id: "automation", name: "Advanced Automation", price: "Custom quote", text: "Lead routing, CRM, follow-ups and owner alerts behind the site.", fits: ["business", "signature", "immersive"] },
  { id: "configurator", name: "Product Configurator", price: "Custom quote", text: "Let customers choose options, colours or sizes and see the result.", fits: ["signature", "immersive"] },
];

/** What each level does not include, said plainly so the quote has no surprises. */
export const boundaries: Record<LevelId, string[]> = {
  business: ["Real-time 3D, WebGL or custom shaders", "Custom code outside your website builder", "Copywriting beyond tidying the words you send"],
  signature: ["Full real-time 3D scenes (add the Interactive 3D Hero)", "Back-end systems or a customer login", "Product photography or video shoots"],
  immersive: ["Every effect in one site: the creative direction picks what serves the story", "Unlimited scenes (each extra scene is quoted)", "Custom 3D models of your product unless they are in the plan"],
  flagship: ["Anything not in the written scope; changes are quoted before they start"],
};

/** Which levels an add-on fits, in words: "Any level" when Business is one of them. */
export function fitsLabel(fits: LevelId[]): string {
  if (fits.includes("business")) return "Any level";
  return fits.map((l) => levelById[l].name).join(" or ");
}

/** How a project moves through the four complexity levels, for the timelines block. */
export const timelines = levels.map((l) => ({ id: l.id, name: l.name, complexity: l.complexity, timeline: l.timeline }));

/** Why an immersive site costs more: the work behind it, in plain words. */
export const costReasons: { title: string; text: string }[] = [
  { title: "Direction before design", text: "An immersive site starts with a concept and a storyboard, agreed with you, before anything is built." },
  { title: "Scenes are made, not picked", text: "Every 3D object, light and camera move is made for your site. Nothing comes from a template." },
  { title: "Two versions of everything", text: "Each scene also needs a still, fast version for phones, slow devices and people who turn motion off." },
  { title: "Performance work", text: "3D has to load fast and stay smooth. That means compressing models, limiting effects on smaller screens and pausing what nobody can see." },
  { title: "More testing", text: "We check it on phones, tablets and computers, with a keyboard and with motion turned off." },
];

/** The FAQ on /web-design/ (and a short set on each level page). */
export const levelFaqs: { q: string; a: string; on?: LevelId[] }[] = [
  { q: "Which website level is right for my business?", a: "Most local businesses do best with Business: it brings in calls and bookings. Signature fits when you need to stand out, and Immersive when the first impression is the product. The website level finder below suggests one in five questions, and we’ll tell you honestly if a smaller level does the job." },
  { q: "Can I start with Business and upgrade later?", a: "Yes. Many clients start with Business to get results now and move up when it makes sense. A move to Signature or Immersive is a new custom-coded build, and we reuse your words, photos and what we learned.", on: ["business", "signature"] },
  { q: "Does every Immersive website use 3D?", a: "No. Immersive means the site is built as an experience. Real-time 3D is used only where it serves the idea. Some immersive sites use layered scenes, video or scroll storytelling instead.", on: ["immersive"] },
  { q: "Will animations slow my website down?", a: "They shouldn’t. Motion is light by default, steps down on slower devices, and stops if your visitor has asked their device to reduce motion. We aim for Google’s Core Web Vitals targets on every level.", on: ["business", "signature", "immersive"] },
  { q: "Will my website work on phones?", a: "Yes. Every level is designed phone first and tested at phone, tablet and computer sizes. Immersive scenes get a lighter version on phones.", on: ["business", "signature", "immersive"] },
  { q: "Can I edit the website myself?", a: "A Business site is built in your own Squarespace or Wix, so you edit it like any page there. Signature and Immersive sites are custom code: we can make the parts you change most editable, or make the changes for you on a care plan.", on: ["business", "signature"] },
  { q: "How long does a website take?", a: "About 1–2 weeks for Business, 3–5 weeks for Signature and 6–10 weeks for Immersive, once we have your words and photos. Flagship projects are planned with you. The written plan gives your dates." },
  { q: "How many revisions are included?", a: "Business includes one round of changes within 14 days of handover. Signature includes two rounds on the design and one on the build, Immersive two on the direction and two on the build. More rounds are quoted before they start." },
  { q: "Do I own my website?", a: "Yes. The domain, the accounts and, on Signature and above, the code are yours. A monthly plan is always optional.", on: ["business", "signature", "immersive"] },
  { q: "Can you add automation to my website?", a: "Yes, at any level: an instant reply to every inquiry, a CRM, owner alerts, booking reminders or estimate follow-ups. Automations are priced on their own.", on: ["business", "signature", "immersive"] },
  { q: "Why is there such a big jump in price between levels?", a: "Each level is a different kind of build. Business is designed in your website builder. Signature and Immersive are custom-coded from scratch, with design direction, motion, 3D and a lighter version for slow devices. That takes more time and more testing." },
];

/** The sales principle every level page carries. */
export const principle = "We recommend the level of interaction that supports your business—not effects just for the sake of effects.";

/** Automations that pair with a new website (the three flows on /web-design/). Services are ids in data/services.ts. */
export const flows: { title: string; steps: string[]; services: string[] }[] = [
  { title: "Every lead answered", steps: ["Website form", "Saved to your CRM", "Instant reply to the customer", "Alert to you"], services: ["follow-up"] },
  { title: "Barber shop booking", steps: ["Book now", "Calendar slot held", "Confirmation and reminder", "Review request after the cut"], services: ["booking", "reviews"] },
  { title: "Cleaning estimate", steps: ["Home size and rooms", "Price range shown", "Estimate request saved", "Follow-up if they go quiet"], services: ["quotes", "estimate-follow-up"] },
];

// The website level finder lives in level-finder.ts (its page script imports it without this file).
export { questions, recommend, levelOrder, levelNames } from "./level-finder";
export type { Question, Recommendation } from "./level-finder";

// ---------- the form ----------
/** The form's "Website level" answers (the inquiry service's LEVELS: change both together). */
export const formLevels: { id: LevelId | "unsure"; label: string }[] = [
  // (short, so a closed select shows the whole answer on a 320-pixel phone: "Signature (from $3,500)")
  ...levels.map((l) => ({ id: l.id, label: `${l.name} (${l.price.replace(/^Starting at /, "From ").toLowerCase()})` })),
  { id: "unsure", label: "I’m not sure yet" },
];
/** The form's "Main goal" answers (the inquiry service's GOALS: change both together). Short for the same reason. */
export const goals: { id: string; label: string }[] = [
  { id: "leads", label: "More calls or bookings" },
  { id: "sell", label: "Sell online" },
  { id: "standout", label: "Look more premium" },
  { id: "launch", label: "Launch a product" },
  { id: "time", label: "Automate busywork" },
  { id: "other", label: "Something else" },
];
