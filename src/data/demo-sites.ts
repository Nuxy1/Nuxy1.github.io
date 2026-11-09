// Example websites: made-up businesses, built to show what a Nuxy website looks like. Each one carries a
// "Demonstration website" banner, is kept out of search (noindex) and the sitemap, uses .example addresses and
// 555 phone numbers, and is never described as a client. Names checked for real US businesses on 2026-11-09
// (business/site-upgrade/01-assessment.md).
import type { IconName } from "../components/Icon.astro";

export type DemoSite = {
  slug: string;
  name: string;
  kind: string;
  icon: IconName;
  summary: string;
  shows: string[];
  /** which published services the site demonstrates (ids in data/services.ts) */
  services: string[];
};

export const demoSites: DemoSite[] = [
  {
    slug: "fernway-lawn",
    name: "Fernway Lawn & Landscape",
    kind: "Landscaping company",
    icon: "tree",
    summary: "A landscaping company that wants more quote requests in spring and fewer phone calls during the season.",
    shows: ["Quote form with job type, yard size and photos", "Seasonal services and a clear service area", "Click-to-call and click-to-text on phones"],
    services: ["new-website", "quotes", "follow-up"],
  },
  {
    slug: "lantern-row-barbers",
    name: "Lantern Row Barbers",
    kind: "Barber shop",
    icon: "scissors",
    summary: "A barber shop that wants clients to book themselves instead of calling while the chairs are full.",
    shows: ["Book-now button on every screen", "Services and prices at a glance", "Hours, walk-in policy and directions"],
    services: ["new-website", "booking", "reviews"],
  },
  {
    slug: "mossgate-cleaning",
    name: "Mossgate Home Cleaning",
    kind: "Cleaning company",
    icon: "sparkle",
    summary: "A home cleaning company that wants customers to see a price range and request a clean in under a minute.",
    shows: ["Instant price range by home size", "Booking request with preferred days", "What’s included, written plainly"],
    services: ["new-website", "booking", "invoices"],
  },
];

export const demoSiteBySlug = Object.fromEntries(demoSites.map((d) => [d.slug, d]));

// Screenshot widths in public/images/examples/ (scripts/example-shots.mjs makes them from the demo pages). The widest
// keeps the plain name (<slug>-desktop.webp); the others add their width (<slug>-desktop-400.webp). Pages list them all
// in srcset, so a small or 1x screen downloads a smaller file and a sharp phone screen still gets the widest.
export const shotWidths = { desktop: [400, 640, 800], phone: [200, 390] } as const;
export const shotSrcset = (slug: string, view: "desktop" | "phone") => {
  const widths = shotWidths[view], widest = widths[widths.length - 1];
  return widths.map((w) => `/images/examples/${slug}-${view}${w === widest ? "" : `-${w}`}.webp ${w}w`).join(", ");
};
