// How a finished website is handed over (the home page's #handover section and /handover/). Every line restates a
// published term: /policies/ (refunds, plan cancellations, terms), /websites/#ownership and data/services.ts. Nothing
// here describes a client portal or any tool a customer can sign in to: none exists yet (data/site.ts handoverPortal).
// Changing a promise here needs the owner's written yes, like the policies it comes from.
import type { IconName } from "../components/Icon.astro";
import { plans } from "./services.ts";

const care = plans[0];

// The three steps of the home page section (the titles are the brief's).
export const handoverSteps: { icon: IconName; title: string; text: string }[] = [
  { icon: "eye", title: "Review Your Website", text: "You see the finished website working before you pay the rest. Anything that doesn’t do what the written plan says is fixed at no charge, and one round of changes within 14 days of handover is included." },
  { icon: "plugsConnected", title: "Connect the Essentials", text: "We help connect your domain, your website account and the business tools named in your plan. We work as an invited user and never ask for your passwords." },
  { icon: "rocketLaunch", title: "Launch With Confidence", text: "Once you approve it and every page, button and form has been tested on a phone and a computer, the website goes live. You get a short video guide, and every job includes a 30-day launch watch." },
];

// The two arrangements. They are not the same: the first is how every website is delivered, the second is an optional
// monthly plan on top of it. Which one applies, and who pays for what, is written in the plan and the contract.
// `plain` is the everyday sentence shown under each name on /handover/ and /websites/ (approvals 90).
export const arrangements: { icon: IconName; title: string; plain: string; tag: string; text: string; points: string[] }[] = [
  { icon: "lockSimple", title: "Customer-Owned Infrastructure", plain: "Buy your website outright", tag: "How every website is delivered",
    text: "Your website account, your domain and any paid plans are in your name and billed to you directly. Nuxy sets them up with you.",
    points: ["Your domain, registered in your name", "You hold the owner login for the website and the domain", "Our access removed after the 30-day launch watch, unless you choose a monthly plan"] },
  { icon: "arrowsClockwise", title: "Nuxy-Managed Service", plain: "Let Nuxy look after it", tag: `Optional · ${care.name} ${care.price}`,
    text: "Nuxy keeps watching and looking after the agreed services month to month, under the plan you sign. Your accounts stay in your name.",
    points: [...care.points.slice(0, 2), care.points[3], "Stop whenever you like: your site stays up, with no lockout and no release fee"] },
];
export const arrangementsNote = "The two are not the same thing. Who owns, hosts and pays for each part, and who is responsible for it, is written in your plan and your contract, and that is what decides. Other companies’ subscriptions, such as your website builder’s plan, are paid by you to them and named before you sign up.";
export const dependsNote = "What you need to set up depends on the platform your website is built on and on your written plan, which says what the project needs from you.";

// Delivery from the finished website to our access being removed, in order (/handover/).
export const delivery: { title: string; text: string }[] = [
  { title: "You review it", text: "You see the website working before you pay the second half. Anything that doesn’t do what the written plan says is fixed at no charge." },
  { title: "We connect the essentials", text: "Your domain, your website account and the business tools named in your plan are connected. We work as an invited user in your accounts." },
  { title: "Everything is tested", text: "Each page, button and form is checked on a phone and a computer, and the contact form is tested from start to finish." },
  { title: "It goes live", text: "After you approve it, the website goes live in your own accounts. You get a short video guide, and the second half of the price is due." },
  { title: "30-day launch watch", text: "For 30 days every failure alerts us, and we check in with you in writing on day 3 and day 14. Anything our work breaks is fixed at no charge. One round of changes within 14 days of handover is included." },
  { title: "Our access is removed", text: "Once you confirm everything works, and at the latest when the launch watch ends, we remove our access, unless you choose a monthly plan." },
];

export const nuxyHandles: string[] = [
  "Building the website described in your written plan",
  "Helping you pick and register a domain in your name, if you don’t have one",
  "Connecting your domain, your website account and the tools named in your plan",
  "Testing every page, button and form on a phone and a computer",
  "A short video guide to your finished website",
  "Watching the website for the first 30 days after launch",
];
export const youDo: string[] = [
  "Agree to the written plan and its fixed price by email",
  "Open the accounts your plan names, in your name and on your card (we set them up with you)",
  "Invite us as a user. We never ask for your passwords",
  "Send your logo, photos, services, prices and hours",
  "Review the website and tell us what to change",
  "Approve the launch",
];

// What happens when a monthly plan is stopped (/websites/#ownership shows the same list).
export const leaving: string[] = [
  "Tell us by email, or use the cancel link in your monthly receipt.",
  "We confirm in writing when the plan ends: the end of the month you’ve already paid for.",
  "We send you a copy of your site’s text, images and logo files, and notes on any settings we changed.",
  "We check that you can sign in as the owner of the website, the domain and any connected tools.",
  "You get short written notes: where everything runs, renewal dates, and who to contact for what.",
  "We remove our access and tell you when it’s done.",
  "Billing stops. You’re never charged again.",
];
