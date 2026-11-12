// AI Creative & Video Advertising (owner's Creative Studio brief, 2026-11-11): everything /creative-studio/ prints.
// One list of prices feeds the service cards, the estimator and the quote form, so they can never disagree.
//
// THESE ARE PUBLISHED PRICES. The owner approved the brief's starting prices ($249, $799, $1,499, $350, $299), the
// estimator's add-ons below and the monthly term ("cancel any time; unused videos don't carry over") on 2026-11-11;
// cost and margin are in business/creative-studio/RESULTS.md, and tests/creative.test.mjs pins every number.
// A change here is a price change for new customers: it needs the owner's written yes (change the number here and
// in the test together).
//
// Like the security offers (services.ts `health`), these are NOT in `groups`: the catalogue's cards are fixed-scope
// services with a Stripe price, and creative work is quoted in writing from a starting price.
import type { IconName } from "../components/Icon.astro";
import type { CreativeRules, CreativeType } from "./creative-estimate";

export const usd = (n: number) => "$" + n.toLocaleString("en-US");

/** The quote form's choice for this division (services.ts `wants`, and WANTS in the inquiry service). */
export const creativeWant = "creative";
export const quoteHref = `/contact/?want=${creativeWant}`;
/** The estimator's choices travel to the quote form in this address parameter (see creative-estimate.ts). */
export const quoteParam = "cq";

export const types: CreativeType[] = [
  { id: "ad", label: "Video advertisement", base: 249, monthly: false, count: 0, formats: 2, from: false },
  { id: "ad-growth", label: "Growth package: 4 video ads a month", base: 799, monthly: true, count: 4, formats: 2, from: false },
  { id: "ad-business", label: "Business package: 8 video ads a month", base: 1499, monthly: true, count: 8, formats: 2, from: false },
  { id: "motion", label: "Motion graphics or digital menu", base: 350, monthly: false, count: 0, formats: 1, from: true },
  { id: "showcase", label: "Product showcase", base: 299, monthly: false, count: 0, formats: 1, from: true },
];

export const rules: CreativeRules = {
  types,
  maxVideos: 8,
  durations: [
    { id: "15", label: "Up to 15 seconds", add: 0 },
    { id: "30", label: "16 to 30 seconds", add: 120 },
    { id: "60", label: "31 to 60 seconds", add: 300 },
  ],
  formats: [
    { id: "9x16", label: "Vertical 9:16" },
    { id: "16x9", label: "Widescreen 16:9" },
    { id: "1x1", label: "Square 1:1" },
    { id: "4x5", label: "Portrait 4:5" },
  ],
  extraFormat: 40,
  levels: [
    { id: "standard", label: "Standard", percent: 0 },
    { id: "advanced", label: "Advanced", percent: 30 },
    { id: "unsure", label: "Not sure yet", percent: null },
  ],
  revisions: { included: 2, max: 4, extra: 45 },
  extras: [
    { id: "captions", label: "Captions on screen", add: 25 },
    { id: "voice", label: "AI voice-over", add: 60 },
    { id: "stills", label: "Thumbnail and cover images", add: 30 },
  ],
  round: 5,
};

const typeById = Object.fromEntries(types.map((t) => [t.id, t]));
/** "$249", "$799 a month", "from $350": the words a card prints for a type's price. */
export const priceOf = (id: string): string => {
  const t = typeById[id];
  return `${t.from ? "from " : ""}${usd(t.base)}${t.monthly ? " a month" : ""}`;
};

// What the estimator's hints say; the numbers come from the rules, so a changed rule changes the sentence.
const [short, , long] = rules.durations;
export const levelHelp: Record<string, string> = {
  standard: "One product, place or message, a simple scene, text and logo added in editing.",
  advanced: `Several scenes, a detailed product, or a look that has to match your brand exactly. Adds ${rules.levels[1].percent}% to the cost of making the video (not to extras, formats or revisions).`,
  unsure: "You get a range, and the written quote settles it.",
};
export const estimatorNotes: string[] = [
  `Every video includes ${short.label.toLowerCase()}, ${rules.revisions.included} rounds of revisions and music that is original or licensed.`,
  `Longer than ${long.label.replace(/^\d+ to /, "")}, more than ${rules.maxVideos} videos, or something that doesn’t fit these choices? Ask for a custom quote.`,
  "This is a starting price, not a quote. Your written quote comes after a short brief, and nothing is charged before you approve it.",
];

// ---- The three service categories (brief, Phase 5: names and what each offers are the brief's) ----
export type CreativeOffer = {
  id: string;
  icon: IconName;
  name: string;
  text: string;
  offers: string[];
  /** the estimator types this card prices, in the order shown; the first is the card's headline price */
  prices: { type: string; name: string; note: string }[];
  included: string[];
};
const per = (t: CreativeType) => `${t.formats} ${t.formats === 1 ? "format" : "formats"}`;
export const offers: CreativeOffer[] = [
  {
    id: "video-ads", icon: "filmSlate", name: "AI Video Advertisements",
    text: "Short ads for social feeds, your website and screens in your shop, built around one clear message about your business.",
    offers: ["Short-form promotional ads", "Social media advertisements", "Product advertisements", "AI-assisted video editing", "Vertical and widescreen exports"],
    prices: [
      { type: "ad", name: "Single advertisement", note: "one video, one-time" },
      { type: "ad-growth", name: "Growth package", note: `${typeById["ad-growth"].count} videos each month` },
      { type: "ad-business", name: "Business package", note: `${typeById["ad-business"].count} videos each month` },
    ],
    included: [`One finished video, ${short.label.toLowerCase()}`, `${per(typeById.ad)} of your choice, such as vertical and widescreen`, `${rules.revisions.included} rounds of revisions`, "Your logo and wording added in editing, so they are spelled and placed correctly"],
  },
  {
    id: "motion-graphics", icon: "monitorPlay", name: "Motion Graphics & Digital Menus",
    text: "Moving menus and promotions for the screens in your business, and motion for your website and social posts.",
    offers: ["Animated restaurant menus", "Promotional displays", "Website motion graphics", "Animated product visuals", "Social media motion graphics"],
    prices: [{ type: "motion", name: "Per project", note: "starting price, quoted in writing" }],
    included: [`One finished piece, ${short.label.toLowerCase()}, in ${per(typeById.motion)}`, "Your real menu items and prices, typed in editing so they stay sharp and correct", `${rules.revisions.included} rounds of revisions`, "A file that loops cleanly on a screen"],
  },
  {
    id: "product-showcases", icon: "sparkle", name: "Premium Product Showcases",
    text: "A close, cinematic look at one product, for a launch, an online shop page or an ad.",
    offers: ["Cinematic product advertisements", "Product launch visuals", "AI-assisted product demonstrations", "Ecommerce promotional videos"],
    prices: [{ type: "showcase", name: "Per project", note: "starting price, quoted in writing" }],
    included: [`One finished video, ${short.label.toLowerCase()}, in ${per(typeById.showcase)}`, "Made from photos of your real product", `${rules.revisions.included} rounds of revisions`, "No claims about what the product does that you can’t back up"],
  },
];

/** The monthly packages, shown as their own row under the cards (their prices are offers[0].prices after the first). */
export const monthly = {
  title: "Video ads every month",
  text: "For a business that posts regularly: a set number of new ads each month for one fixed monthly price. Cancel any time; unused videos don’t carry over to the next month.",
};

/** True of every video, printed once under the cards. */
export const everyVideo: string[] = [
  "A concept and storyboard you approve before anything is made",
  "MP4 files ready to upload, sized for where they will run",
  "Music that is original or licensed for business use",
  "A written quote first: nothing is charged before you approve it",
];
/** What this service is not, in plain words (brief: define the limitations; never promise results). */
export const limits: { icon: IconName; title: string; text: string }[] = [
  { icon: "sparkle", title: "Made with AI tools, finished by hand", text: "Scenes are generated with AI video tools, then edited, titled and checked by a person. We say so, and we never pass generated footage off as filmed." },
  { icon: "videoCamera", title: "No filming on location", text: "Videos are made from your photos, footage and logo, plus generated scenes. If you need a camera crew, we will tell you that instead." },
  { icon: "user", title: "No real person without their consent", text: "A real person’s face or voice appears only with that person’s written permission. No look-alikes of public figures, and no other company’s logo or product." },
  { icon: "chartLineUp", title: "No promise of results", text: "A good video helps people notice you. We can’t promise views, sales or how an ad will perform, and we don’t run your ad account or buy ad space." },
];

// ---- Concept demonstrations (brief, Phase 2): three made-up brands. A demo is shown only once its real, checked
// video files are listed in cinematic-manifest.json; until then the page has no gallery at all. ----
export type CreativeDemo = { id: string; title: string; category: string; offer: string; line: string; text: string; /** the estimator code "Request Similar Project" opens the quote form with */ request: string };
export const demoLabel = "Fictional concept demonstration";
export const demoNote = "These three brands are made up. They are concept demonstrations made by Nuxy to show the kind of work on offer, not work done for clients.";
export const demos: CreativeDemo[] = [
  { id: "vantage-motors", title: "VANTAGE MOTORS", category: "Video advertisement", offer: "video-ads", line: "ENGINEERED TO STAND APART.",
    text: "A launch spot for a made-up car maker: slow light across the bodywork, one line of text, and a clean end card.", request: "ad~1~15~9x16.16x9~standard~2~" },
  { id: "ember-oak", title: "EMBER & OAK", category: "Digital menu", offer: "motion-graphics", line: "CRAFTED FOR THE CRAVING.",
    text: "A moving menu board for a made-up burger kitchen: three dishes, each with its name and price set in type.", request: "motion~1~30~16x9~standard~2~" },
  { id: "noctis-skin", title: "NOCTIS SKIN", category: "Product showcase", offer: "product-showcases", line: "REFINE YOUR RITUAL.",
    text: "A close look at a made-up night serum: glass, light and liquid, with no claims about what it does.", request: "showcase~1~15~9x16~standard~2~" },
];

// ---- How a project runs ----
export const steps: { title: string; text: string }[] = [
  { title: "A short brief", text: "You tell us what the video is for, where it will run and what it has to say, and send your logo, photos or footage." },
  { title: "A written quote and a concept you approve", text: "You get a fixed price in writing, then a short storyboard: the scenes, the words on screen and the feel. Nothing is made until you say yes." },
  { title: "Making it", text: "Scenes are generated with AI tools and the best takes are picked by hand. Names, prices and your logo are added in editing, never left to the AI, so they are spelled and placed correctly." },
  { title: "Your revisions", text: `You watch the first cut and ask for changes. ${rules.revisions.included} rounds are included.` },
  { title: "Delivery", text: "You get the finished files in each format you ordered, ready to upload. Thumbnail and cover images can be added to any order." },
];

export const faqs: [string, string][] = [
  ["Are the videos made with AI?", "Yes. Scenes are generated with AI video tools and then edited, titled and checked by a person. Text, prices and logos are added in editing so they are correct. We tell you which parts were generated, and you approve the concept before any of it is made."],
  ["What do you need from me?", "Your logo, a few photos of the product or place, the words you want on screen, and where the video will run. If you have footage of your own, we can cut it in."],
  ["Can I use the video in paid ads?", "Yes. The finished video is yours to use for your business, on your website, in social posts and in paid ads. One honest note: footage that is wholly AI-generated may not be protected by copyright under current US rules, so we can’t promise that nobody else could make something similar. Your name, logo and your own photos and footage stay yours."],
  ["Where do my photos and files go?", "We use what you send only to make your video. To generate scenes, some of it is uploaded to the AI video service we use (Higgsfield), whose terms allow it to use what is made there to train its own models. If something must not be uploaded, tell us and we will work around it."],
  ["How long does it take?", "It depends on the length and how many scenes there are. Your written quote includes a delivery date, and the clock starts when you approve the concept."],
  ["Will the video bring in customers?", "We can’t promise that, and nobody honestly can. We make the video clear, good-looking and right for where it runs. How it performs depends on your offer, your audience and how it is shown."],
  ["What if I need something longer or different?", `The prices here cover videos up to ${long.label.replace(/^\d+ to /, "")}. For a longer piece, a series or something that doesn’t fit, ask for a custom quote and describe it in your own words.`],
];

/** The optional add-on shown on the website and automation pages (brief, Phase 9). */
export const upsell = {
  title: "Add a short video ad",
  text: "Launching a new website or a new offer? We also make short video ads, moving menus and product showcases to go with it, made with AI video tools and finished by a person. It is optional and quoted separately.",
  // (the button says "portfolio" only once the demo videos exist: components/VideoUpsell.astro)
  cta: "See Video & Creative Services",
  ctaWithDemos: "Explore Our Video Portfolio",
  href: "/creative-studio/",
};
