// Example websites: made-up businesses, built to show what a Nuxy website looks like. Each one carries a
// "Demonstration website" banner, is kept out of search (noindex) and the sitemap, uses .example addresses and
// 555 phone numbers, and is never described as a client. Names checked for real US businesses on 2026-11-09
// (business/site-upgrade/01-assessment.md).
import type { IconName } from "../components/Icon.astro";
import type { LevelId } from "./level-finder";

export type DemoSite = {
  slug: string;
  name: string;
  kind: string;
  /** the kind of project, as the portfolio shows it */
  project: string;
  icon: IconName;
  summary: string;
  shows: string[];
  /** which published services the site demonstrates (ids in data/services.ts) */
  services: string[];
  // The case study (website levels brief, 2026-11-12): which level the concept shows and what a real project like it
  // would involve. Every one of these is a concept project; the pages say so in those words.
  tier: LevelId;
  objective: string;
  direction: string;
  technology: string;
  automation: string;
  performance: string;
  mobile: string;
  /** "What a project like this would include" */
  includes: string[];
  /** what the interactive demo shows, for the "Built by Nuxy" drawer and the cards */
  capabilities: string[];
  /** the Nuxy page that sells this kind of build */
  cta: { label: string; href: string };
};

export const demoSites: DemoSite[] = [
  {
    slug: "fernway-lawn",
    name: "Fernway Lawn & Landscape",
    kind: "Landscaping company",
    project: "Business website with quote requests",
    icon: "tree",
    summary: "A landscaping company that wants more quote requests in spring and fewer phone calls during the season.",
    shows: ["Quote form with job type, yard size and photos", "Seasonal services and a clear service area", "Click-to-call and click-to-text on phones"],
    services: ["new-website", "quotes", "follow-up"],
    tier: "business",
    objective: "More quote requests in spring, and fewer calls to answer while the crew is out on jobs.",
    direction: "Deep greens on ivory, big photos of finished yards and plain, friendly words.",
    technology: "For a client: built in their own Squarespace or Wix account, so they can edit it. This demonstration is coded to show the layout.",
    automation: "Quote requests saved and answered at once, with a follow-up if the customer goes quiet.",
    performance: "Light pages and compressed photos, with no heavy motion, so it opens fast on a phone signal.",
    mobile: "Call and text buttons stay in reach, and the quote form is one short column.",
    includes: ["Up to 4 pages: home, services, service area and quote", "A quote form with job type, yard size and photos", "Your Google Business Profile linked, and the local search basics", "One round of changes within 14 days of handover"],
    capabilities: ["Season-by-season service calendar", "Five-step quote estimator with a live price range", "Photo upload checked and previewed in the browser", "Before-and-after project sliders", "Service-area map with drive times", "Lead routing: CRM record, owner text, follow-up"],
    cta: { label: "Build My Website", href: "/websites/" },
  },
  {
    slug: "lantern-row-barbers",
    name: "Lantern Row Barbers",
    kind: "Barber shop",
    project: "Signature website with online booking",
    icon: "scissors",
    summary: "A barber shop that wants clients to book themselves instead of calling while the chairs are full.",
    shows: ["Book-now button on every screen", "Services and prices at a glance", "Hours, walk-in policy and directions"],
    services: ["new-website", "booking", "reviews"],
    tier: "signature",
    objective: "Let clients book themselves while the chairs are full, and look like the best shop in the neighbourhood.",
    direction: "Charcoal, oxblood and cream with brass detail, editorial type and an opening sequence that sets the scene.",
    technology: "Custom-coded and published to hosting in the client’s name, with their booking tool connected.",
    automation: "Online booking with confirmations and reminders, and a review request after the cut.",
    performance: "Motion steps down on slower phones, and every photo is sized for the screen it lands on.",
    mobile: "The Book button stays in reach, and services and prices fit on one screen.",
    includes: ["A custom design direction, agreed before the build", "Services, barbers, gallery, booking and contact pages", "Premium motion: reveals, transitions and hover detail", "Two rounds on the design and one on the finished build"],
    capabilities: ["Opening sequence that settles on the shop at dusk", "Six-step booking with barbers, dates and open times", "“Available today” board with demo open times", "Cancellation waitlist", "Filterable style gallery", "Reminder texts and review requests after the visit"],
    cta: { label: "Automate My Business", href: "/automation/" },
  },
  {
    slug: "mossgate-cleaning",
    name: "Mossgate Home Cleaning",
    kind: "Cleaning company",
    project: "Business website with price ranges",
    icon: "sparkle",
    summary: "A home cleaning company that wants customers to see a price range and request a clean in under a minute.",
    shows: ["Instant price range by home size and extras", "Arrival-window booking that carries the estimate", "Room-by-room checklist for each clean"],
    services: ["new-website", "booking", "invoices"],
    tier: "business",
    objective: "Show a fair price range and take a cleaning request in under a minute.",
    direction: "Soft, clean colours, plenty of white space and prices written plainly.",
    technology: "For a client: built in their own Squarespace or Wix account, so they can edit it. This demonstration is coded to show the layout.",
    automation: "Estimate requests saved, with booking confirmations and reminders before each clean.",
    performance: "Small pages and calm motion that never gets between a visitor and the price.",
    mobile: "The price range and the request form work with one thumb.",
    includes: ["Up to 4 pages: home, services, pricing and booking", "A price range by home size", "A booking request with preferred days", "One round of changes within 14 days of handover"],
    capabilities: ["Instant estimate by home size, clean type and extras", "Room-by-room checklist", "Arrival-window scheduler that carries the estimate", "Confirmation, reminder and invoice automation"],
    cta: { label: "Automate My Business", href: "/automation/" },
  },
  {
    // (a storefront built as plain pages on this site to show the design: there is no shop behind it; its cart and demo
    // checkout never ask for a card or take an order. Name checked for real businesses on 2026-11-09.)
    slug: "quillfern-candles",
    name: "Quillfern Candle Co.",
    kind: "Online candle shop",
    project: "E-commerce store",
    icon: "shoppingBag",
    summary: "A small candle maker that sells at weekend markets and wants an online store with shipping and local pickup.",
    shows: ["Product grid with collections and filters", "Product page with scent notes, sizes and stock", "Cart that explains shipping and pickup before checkout"],
    services: ["online-shop", "store", "email-list"],
    tier: "signature",
    objective: "Sell online with shipping and local pickup, not just at weekend markets, and feel as handmade as the candles.",
    direction: "Ivory and parchment with copper detail, botanical still lifes and a quiet, editorial shop layout.",
    technology: "For a client: a custom-designed theme on their own Shopify store, so orders, stock and payments stay in Shopify.",
    automation: "Order and pickup emails, a back-in-stock list and a welcome email for new subscribers.",
    performance: "Product photos sized for each screen, and the cart stays quick with any number of items.",
    mobile: "Filters, sizes and the cart are built for a phone first.",
    includes: ["A custom shop design and product pages", "Collections, filters, scent notes and sizes", "Shipping and local pickup explained before checkout", "Two rounds on the design and one on the finished build"],
    capabilities: ["A hero candle that lights itself, still under reduced motion", "Product pages with scent profiles", "Cart that persists in the browser", "Three-step checkout demo (no card taken)", "Order confirmation, stock and email automation"],
    // (a Signature store: the quote form opens on "Online store" at the Signature level, not the Online shop's price)
    cta: { label: "Build My Store", href: "/contact/?want=shopify&level=signature" },
  },
  {
    // The Immersive concept (website levels brief): a made-up speaker brand, its page built with Three.js. Names
    // "Halvane" and "Lumen One" checked for real audio businesses on 2026-11-12 (none found).
    slug: "halvane-audio",
    name: "Halvane Audio",
    kind: "Speaker brand",
    project: "Immersive product launch",
    icon: "speakerHifi",
    summary: "A speaker maker launching its first bookshelf speaker, Lumen One, that needs the launch to be remembered.",
    shows: ["A speaker you turn by scrolling, hovering or dragging", "Scroll to bring the studio light up while the five parts are named", "Three finishes, with notes on what each part does"],
    services: ["email-list", "follow-up"],
    tier: "immersive",
    objective: "Make the launch memorable enough that visitors join the pre-order list before they leave.",
    direction: "A dark studio in warm architectural light: walnut, ivory type and brass detail, the product in the middle and the words around it.",
    technology: "Custom-coded: the speaker is prerendered product imagery drawn frame by frame, with Three.js (WebGL) only for the background, all loaded after the page.",
    automation: "Pre-order sign-ups sent to the brand’s email tool, with an instant confirmation to the buyer.",
    performance: "Product frames and the 3D background load after the page; the background lowers its resolution when frames run slow and pauses off screen or in a hidden tab.",
    mobile: "Drag to turn the speaker; phones get lighter frames, and reduced motion gets still images.",
    includes: ["A creative direction and storyboard before the build", "A product sequence made from prerendered imagery, turned by scroll", "A finish selector and annotated parts", "A still, fast version for reduced motion and slower phones"],
    capabilities: ["A speaker you can turn, made from prerendered frames", "Scroll-driven light-up with the five parts named", "Three finishes with notes on each part", "Still images for slower phones and reduced motion", "Pre-order list with an instant confirmation"],
    cta: { label: "Plan My Launch", href: "/immersive-websites/" },
  },
];

export const demoSiteBySlug = Object.fromEntries(demoSites.map((d) => [d.slug, d]));

// The services a demo lists beside its price. A Signature or Immersive demo is the website itself, priced by its level,
// so it never also lists the Business website ($900) or the Business shop ($1,200): that read as the price of the
// demo (critique 11-17). The automations it shows keep their own prices on every level.
const businessOnly = new Set(["new-website", "online-shop"]);
export const listedServices = (d: DemoSite) => (d.tier === "business" ? d.services : d.services.filter((id) => !businessOnly.has(id)));

// Screenshot widths in public/images/examples/ (scripts/example-shots.mjs makes them from the demo pages). The widest
// keeps the plain name (<slug>-desktop.webp); the others add their width (<slug>-desktop-400.webp). Pages list them all
// in srcset, so a small or 1x screen downloads a smaller file and a sharp phone screen still gets the widest.
export const shotWidths = { desktop: [400, 640, 800], phone: [200, 390] } as const;
export const shotSrcset = (slug: string, view: "desktop" | "phone") => {
  const widths = shotWidths[view], widest = widths[widths.length - 1];
  return widths.map((w) => `/images/examples/${slug}-${view}${w === widest ? "" : `-${w}`}.webp ${w}w`).join(", ");
};
