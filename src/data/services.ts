// Every service, plan, bundle and price on the site, in one place. Change a price or a service here and every page
// follows (business/site-upgrade/README.md, "Changing services and prices"; the change record is
// business/pricing-overhaul/pricing-change-record.md).
//
// Rules:
// - ids are linked from outreach emails, old /#id links and /contact/?service=<id>: never change or reuse one. A
//   retired id stays in `retired` with the id that replaces it, so its old links still land somewhere sensible.
// - Prices are the PUBLISHED prices. The prices below are the ones the owner approved in the pricing overhaul brief
//   (2026-11-11) for new customers; tests/site.test.mjs pins them, so a change needs the owner's yes and the test.
//   Existing customers keep the price and terms they agreed (the Policies page says so).
// - `priceType` says what kind of price it is, and pages word it from that: never show a "from" price as fixed.
// - `status` "consult" means it is offered only after a consultation (it isn't running for a client yet); pages show
//   "Available after consultation" and never call it ready-made. "planned" means not offered yet ("Coming soon").
import type { IconName } from "../components/Icon.astro";

/** fixed: one fixed one-time price. from: a starting one-time price, final price in writing. setup: a starting
 *  setup price plus its own optional monthly management (`monthly`). custom: a starting price for a custom quote. */
export type PriceType = "fixed" | "from" | "setup" | "custom";
export type Status = "active" | "consult" | "planned";
/** Which optional management fits it: a website plan, an automation plan, its own monthly price (`monthly`),
 *  quoted separately, or none (a one-time job). */
export type Manage = "website" | "automation" | "own" | "quoted" | "none";

/** A smaller or larger version of a service: same card, its own price and scope (not a separate product). */
export type Variant = { id: string; name: string; price: string; priceType: PriceType; monthly?: string; text: string };

export type Service = {
  id: string;
  name: string;
  price: string;
  priceType: PriceType;
  /** for priceType "setup": the optional monthly management price */
  monthly?: string;
  status: Status;
  manage: Manage;
  icon: IconName;
  /** the owner's problem, in their words */
  fixes: string;
  /** what's delivered */
  text: string;
  /** who it suits: the best-suited industries, in words */
  who: string;
  /** kinds of business it suits (see kinds), or "all" */
  fits: string;
  /** what's needed from the customer */
  needs: string;
  /** costs paid to other companies, not to Nuxy */
  costs: string;
  variants?: Variant[];
  popular?: boolean;
  addon?: boolean;
};

export type Group = { id: string; title: string; lead: string; legacy: string[]; items: Service[] };

const S = (s: Service) => s;
const V = (v: Variant) => v;

export const groups: Group[] = [
  {
    id: "websites",
    title: "Websites & online stores",
    lead: "A site that works on phones and shows up on Google, and a store in your own account, with the extras that keep orders moving.",
    legacy: ["web", "website", "ecommerce"],
    items: [
      S({ id: "new-website", icon: "globeSimple", name: "New website", price: "$900", priceType: "fixed", status: "active", manage: "website", fits: "all", popular: true,
        fixes: "No website, or one too old to fix",
        text: "Up to 4 pages, built for phones: your services and prices, hours, map and a Book, Quote or Order button, on your own domain. Built in your own Squarespace or Wix account, so you can edit it and it stays yours.",
        who: "Businesses with no website, or one too old or broken to fix.",
        needs: "Your logo and photos, services, prices and hours, and a Squarespace or Wix account in your name.",
        costs: "The Squarespace or Wix plan and your domain, paid to them directly.",
        variants: [V({ id: "starter-website", name: "Starter Website", price: "$499", priceType: "fixed",
          text: "One phone-friendly landing page from the words, photos and logo you send: a contact or inquiry form, basic search and Google setup, tested on phones and handed over. No extra pages and no custom back end." })] }),
      S({ id: "site-fixes", icon: "wrench", name: "Website quick fixes", price: "from $150", priceType: "from", status: "active", manage: "website", fits: "all", popular: true,
        fixes: "A site that looks broken on a phone",
        text: "Secure https, a phone-friendly page setup, a booking or quote button and a contact form that works: on the site you already have.",
        who: "Businesses whose site works but looks dated or breaks on phones.",
        needs: "Invited access to your current website.",
        costs: "Usually none. Secure https is free on most hosts." }),
      S({ id: "google-profile", icon: "mapTrifold", name: "Google profile setup", price: "$199", priceType: "fixed", status: "active", manage: "none", fits: "all",
        fixes: "A business Google barely shows",
        text: "Your Google Business Profile claimed or created, with categories, hours, services, your photos and your website and booking links. I walk you through Google’s own verification.",
        who: "Any local business, especially one that’s new or has no website yet.",
        needs: "A Google account in your name and your business address or service area for Google’s verification.",
        costs: "None: Google Business Profile is free." }),
      S({ id: "online-shop", icon: "shoppingBag", name: "Online shop", price: "$1,200", priceType: "fixed", status: "active", manage: "website", fits: "retail",
        fixes: "Customers who can’t buy unless they come in",
        text: "A store on Square Online or Shopify in your own account: up to 25 products from photos you send, payments, pickup or shipping, and a Shop button on your site.",
        who: "Shops and makers ready to sell online.",
        needs: "Product photos, prices and descriptions, and a Square or Shopify account in your name.",
        costs: "Shopify’s or Square Online’s own plan, plus card fees.",
        variants: [V({ id: "mini-store", name: "Mini Online Store", price: "$699", priceType: "fixed",
          text: "Up to 5 standard products on Shopify’s or Square Online’s own checkout, set up for phones and handed over. No custom inventory system." })] }),
      S({ id: "store", icon: "storefront", name: "Online store automations", price: "$449", priceType: "fixed", status: "active", manage: "automation", fits: "retail",
        fixes: "Orders typed into spreadsheets by hand",
        text: "For Shopify, WooCommerce or Square stores: every order into your spreadsheet or accounting, low-stock alerts, abandoned-cart and thank-you emails.",
        who: "Online and local shops on Shopify, WooCommerce or Square.",
        needs: "Staff access to your store.",
        costs: "Sometimes a store app’s plan; it’s named in your written plan first." }),
      S({ id: "gift-cards", icon: "gift", name: "Online gift cards", price: "$150", priceType: "fixed", status: "active", manage: "none", fits: "appointments food retail", addon: true,
        fixes: "Gift shoppers with nowhere to buy",
        text: "A Buy a gift card button on your website, Google profile and Instagram, using your booking or point-of-sale tool’s own gift cards.",
        who: "Salons, restaurants and shops.",
        needs: "Access to your booking or point-of-sale tool.",
        costs: "Your tool’s own gift card fees, if any." }),
      S({ id: "ordering", icon: "forkKnife", name: "Online ordering & reservations", price: "$349", priceType: "fixed", status: "active", manage: "website", fits: "food",
        fixes: "A phone ringing at your busiest hour",
        text: "Online ordering and table reservations switched on in the system you already use (Toast, Square, Clover) or a free one, with Order and Reserve buttons on your site and Google profile.",
        who: "Restaurants, cafés, bakeries and breweries.",
        needs: "Access to your point-of-sale (Toast, Square or Clover).",
        costs: "Your point-of-sale’s own online-ordering fees, if any." }),
    ],
  },
  {
    id: "leads",
    title: "Leads & customer communication",
    lead: "Answer every inquiry fast, catch the calls you miss, and get the reviews your work has earned.",
    legacy: ["automation", "customers", "get-customers"],
    items: [
      S({ id: "follow-up", icon: "chatCircleText", name: "Lead response & follow-up", price: "$399", priceType: "fixed", status: "active", manage: "automation", fits: "all", popular: true,
        fixes: "Messages that wait hours for an answer",
        text: "Every website form, email, Facebook or Instagram inquiry gets an instant reply and an alert to you or your staff, then 2 friendly follow-ups that stop as soon as they answer. A contact form added if your site has none.",
        who: "Any business that gets inquiries while it’s busy: trades, cleaners, contractors, salons, offices.",
        needs: "Access to your website form or inbox as an invited user, and how you’d like replies to sound.",
        costs: "Usually none: it runs in the email and form tools you already have." }),
      S({ id: "missed-calls", icon: "phoneX", name: "Missed-call text-back", price: "$199", priceType: "fixed", status: "active", manage: "automation", fits: "trades appointments", addon: true,
        fixes: "Callers who hang up and call someone else",
        text: "You miss a call, the caller gets one text right away with your booking or quote link, and you get an alert with their number. Landlines and numbers on your do-not-text list are skipped. It sends a message after the call; it doesn’t hold a conversation (that’s the AI Voice Receptionist).",
        who: "Busy phones: trades on a job, salons mid-appointment.",
        needs: "Access to your phone or booking tool.",
        costs: "Depends on your phone tool. Business texting needs carrier registration, paid to the carrier; it’s quoted in writing before you pay anything." }),
      S({ id: "ai-receptionist", icon: "headset", name: "AI Voice Receptionist", price: "from $599", priceType: "setup", monthly: "from $249/month", status: "consult", manage: "own", fits: "trades appointments food office",
        fixes: "Calls nobody can pick up, after hours or mid-job",
        text: "An AI voice answers the calls you choose (after hours, when the line is busy, or always). It says it’s an AI, answers questions from the information you approve, takes the caller’s name, number and what they need, books into your calendar where your tool allows, transfers to staff, and sends you a summary of every call. Emergencies and anything it isn’t sure about go to a person, by your rules; if the AI or a connection is down, calls go to your normal line or voicemail.",
        who: "Trades, salons, clinics’ front desks for scheduling only, restaurants and offices that miss calls.",
        needs: "Your hours, services, prices and answers to common questions, who takes transfers, and voice and phone provider accounts in your name.",
        costs: "Phone minutes and AI usage, billed by the providers to your own account, estimated in writing first, with a spending limit and alerts.",
        variants: [V({ id: "ai-receptionist-advanced", name: "Advanced AI Voice Receptionist", price: "from $999", priceType: "setup", monthly: "$399/month",
          text: "Everything above plus your CRM connected, more call types and routing rules, and more than one number. Custom integrations and more than one location are quoted separately." })] }),
      S({ id: "lead-qualification", icon: "funnel", name: "Lead qualification & booking", price: "from $699", priceType: "from", status: "consult", manage: "automation", fits: "trades office",
        fixes: "More leads than time to sort them",
        text: "Inquiries captured from your forms and sorted by rules you set (type of job, area, budget), with a simple score, an AI-drafted reply waiting for your approval, a booking link for good fits, follow-ups scheduled and an alert to staff. Sensitive or unclear messages always go to a person, and nothing is sent automatically unless you choose that in writing.",
        who: "Contractors, agencies and offices with steady inquiries and a calendar to fill.",
        needs: "Invited access to your forms, inbox and calendar, your rules for a good fit, and an AI account in your name.",
        costs: "AI usage, billed by the AI company to your own account; sometimes a form or automation tool’s plan. Named in your written plan first." }),
      S({ id: "reviews", icon: "star", name: "Review requests", price: "$149", priceType: "fixed", status: "active", manage: "automation", fits: "all", popular: true,
        fixes: "Happy customers who never leave a review",
        text: "After each finished job, visit or order, every customer gets the same short thank-you with your Google review link: no screening for happy customers, no rewards for reviews. Sent at a sensible time, never twice to the same visit, and anyone who opts out never gets another.",
        who: "Any business with a Google profile and finished jobs or visits.",
        needs: "Your Google review link and where finished jobs or visits are recorded.",
        costs: "Usually none. Texting needs carrier registration; email is free." }),
      S({ id: "ai-replies", icon: "sparkle", name: "AI inquiry assistant", price: "$649", priceType: "fixed", status: "active", manage: "automation", fits: "all",
        fixes: "An inbox that eats your evenings",
        text: "New emails and form messages sorted by AI, with a drafted answer waiting in your inbox for you to approve and an alert for anything urgent. Nothing is sent without you.",
        who: "Owners who answer the same questions by email every day.",
        needs: "Access to your inbox, and an AI account in your name.",
        costs: "AI usage, billed by the AI company to your own account; estimated in your written plan." }),
    ],
  },
  {
    id: "scheduling",
    title: "Scheduling & appointments",
    lead: "Make booking easy, cut no-shows, and stop playing phone tag over times.",
    legacy: [],
    items: [
      S({ id: "booking", icon: "calendarCheck", name: "Online booking & reminders", price: "$349", priceType: "fixed", status: "active", manage: "automation", fits: "appointments office", popular: true,
        fixes: "Calls you miss while you’re with a customer",
        text: "A Book now button on your website, Google profile and Instagram, connected to the booking tool you already use (or a free one), with text and email reminders that cut no-shows and a reschedule link where your tool supports it.",
        who: "Appointment businesses: barbers, salons, groomers, studios, consultants.",
        needs: "Invited access to your booking tool (or we pick a free one together) and your website.",
        costs: "Your booking tool’s own plan, if any. Some booking tools charge extra for text reminders." }),
      S({ id: "deposits", icon: "creditCard", name: "Deposits & no-show protection", price: "$150", priceType: "fixed", status: "active", manage: "none", fits: "appointments", addon: true,
        fixes: "Empty chairs from no-shows",
        text: "A card on file or a small deposit when clients book, plus a clear cancellation policy, switched on in your booking tool where it supports them.",
        who: "Appointment businesses that lose money to no-shows.",
        needs: "Access to your booking tool and the cancellation policy you want.",
        costs: "Your booking tool’s normal card fees." }),
    ],
  },
  {
    id: "sales",
    title: "Sales follow-up & re-engagement",
    lead: "Turn quotes into jobs and bring past customers back, without chasing anyone by hand.",
    legacy: [],
    items: [
      S({ id: "quotes", icon: "clipboardText", name: "Quote requests", price: "$399", priceType: "fixed", status: "active", manage: "automation", fits: "trades",
        fixes: "Calls you can’t take on a job",
        text: "A Get a quote form on your site (photos welcome), an instant reply to the customer, a reminder to you to send the estimate, and a follow-up if they go quiet.",
        who: "Trades and home services: plumbers, HVAC, landscapers, cleaners, contractors.",
        needs: "Website access and the questions you ask before you can quote.",
        costs: "Usually none. Photo uploads can need a form tool’s paid plan; it’s named in your written plan first." }),
      S({ id: "estimate-follow-up", icon: "paperPlaneTilt", name: "Estimate follow-up", price: "$449", priceType: "fixed", status: "active", manage: "automation", fits: "trades",
        fixes: "Estimates sent, then silence",
        text: "When an estimate is marked sent, the customer gets a friendly check-in on days 2, 5 and 10 (or the days you pick), by email, and by text only where they agreed to texts. It stops the moment they reply, book, decline or opt out, or you close the job; every reply alerts you, and a log shows what went out. Quote requests catch new inquiries; this follows up the estimates you’ve already sent.",
        who: "Roofing, HVAC, plumbing, landscaping, remodeling, painting and other home services.",
        needs: "Invited access to where your estimates live (your quoting tool, CRM or a spreadsheet) and the email you send from.",
        costs: "Usually none for email. Texting needs carrier registration, paid to the carrier; quoted in writing first." }),
      S({ id: "re-engagement", icon: "clockCounterClockwise", name: "Customer re-engagement", price: "from $599", priceType: "from", status: "active", manage: "automation", fits: "trades appointments food retail",
        fixes: "Customers who came once and never came back",
        text: "Customers who haven’t been back in 30, 60 or 90 days (you choose) get a friendly note: due for a tune-up, a membership about to lapse, time to rebook. Only people who agreed to hear from you are included; opt-outs and your do-not-contact list are always honored, and a monthly summary shows who came back.",
        who: "Salons, cleaners, HVAC and lawn care, gyms and shops with repeat customers.",
        needs: "Invited access to your customer records (CRM, booking or point-of-sale) and which customers agreed to marketing.",
        costs: "Your email or texting tool’s own plan, if your list is past its free limit." }),
      S({ id: "email-list", icon: "envelopeOpen", name: "Email list & welcome emails", price: "$249", priceType: "fixed", status: "active", manage: "automation", fits: "appointments food retail",
        fixes: "Customers who never hear from you again",
        text: "A sign-up form on your site and at checkout, 3 welcome emails in your voice, and your existing customers imported (only people who agreed), in Mailchimp, Brevo or Klaviyo.",
        who: "Shops, cafés, salons and anyone with repeat customers.",
        needs: "An account in Mailchimp, Brevo or Klaviyo, and a list of customers who agreed to hear from you.",
        costs: "Email tools are free up to a limit, then the tool’s own monthly plan." }),
      S({ id: "cold-outreach", icon: "megaphone", name: "Cold outreach automation", price: "from $999", priceType: "from", status: "consult", manage: "quoted", fits: "office",
        fixes: "No time to reach new business customers",
        text: "Legitimate business-to-business email outreach to a list you’re allowed to use: imports with duplicates removed, personalized templates, replies sorted, a booking link for interested replies, opt-outs honored for good and deliverability watched. Every email meets CAN-SPAM: honest subject, your real postal address and a working unsubscribe. No scraping, no LinkedIn automation, no bulk spam.",
        who: "Agencies, consultants and B2B service companies.",
        needs: "A prospect list from a lawful source (or a plan to build one), a sending domain and email account in your name, and your offer.",
        costs: "Your email sending tool and any list or data service, paid to them directly; named in your written plan first." }),
    ],
  },
  {
    id: "operations",
    title: "Business administration",
    lead: "Spend fewer hours typing, chasing and copying between apps.",
    legacy: ["admin", "save-time"],
    items: [
      S({ id: "invoices", icon: "receipt", name: "Invoices & payment reminders", price: "$299", priceType: "fixed", status: "active", manage: "automation", fits: "trades office",
        fixes: "Invoices sent late and paid later",
        text: "Invoices sent automatically when a job is done or an order ships, from QuickBooks, Stripe, Square or Wave, friendly reminders when one is overdue, and an alert when it’s paid.",
        who: "Trades, cleaners and offices that invoice after the work.",
        needs: "Invited access to QuickBooks, Stripe, Square or Wave.",
        costs: "Your accounting tool’s plan and its normal payment fees." }),
      S({ id: "onboarding", icon: "userPlus", name: "Client onboarding", price: "from $699", priceType: "from", status: "active", manage: "automation", fits: "office trades",
        fixes: "Every new client means a pile of setup emails",
        text: "When a new client signs, they get a welcome message, an intake form, a checklist of the documents you need and a scheduling link, and a project with its first tasks is created in your project tool, with status updates as it moves. Documents stay in your own storage, open only to the people who need them.",
        who: "Agencies, contractors, consultants, accountants and other service businesses.",
        needs: "Invited access to your forms, email, file storage and project tool, and the steps you take with every new client.",
        costs: "Sometimes a form, e-signature or automation tool’s plan; named in your written plan first." }),
      S({ id: "reports", icon: "chartLineUp", name: "Weekly report", price: "$249", priceType: "fixed", status: "active", manage: "automation", fits: "all",
        fixes: "Numbers scattered across five apps",
        text: "One email or live dashboard every Monday with the numbers you care about: sales, leads, bookings, reviews, pulled from the tools you already use.",
        who: "Owners who want one Monday email instead of five logins.",
        needs: "Read-only access to the tools the numbers come from.",
        costs: "Usually none." }),
      S({ id: "data", icon: "broom", name: "Data clean-up & import", price: "from $200", priceType: "from", status: "active", manage: "none", fits: "all",
        fixes: "Messy, duplicated customer lists",
        text: "Customer and contact lists cleaned, duplicates merged and moved into your new CRM or email tool, with every change counted.",
        who: "Anyone moving to a new CRM, email tool or booking system.",
        needs: "An export of your lists (a spreadsheet or CSV file).",
        costs: "None." }),
    ],
  },
  {
    id: "custom",
    title: "Custom AI & CRM systems",
    lead: "Custom connections and a full CRM, for when your tools can’t do it on their own.",
    legacy: ["integrations", "add-ons", "advanced"],
    items: [
      S({ id: "integrations", icon: "plugsConnected", name: "Custom integrations", price: "from $750", priceType: "from", status: "active", manage: "automation", fits: "all",
        fixes: "Apps that don’t talk to each other",
        text: "Your CRM, email marketing, inventory sheet, accounting and website connected with custom connectors and webhooks: every record checked, never written twice, retried when a service is down, and an alert if anything fails.",
        who: "Businesses with several tools that need to share records.",
        needs: "Invited access to each tool.",
        costs: "Sometimes an automation tool’s plan (Zapier, Make or n8n) or a small server; named in your written plan first." }),
      S({ id: "crm-system", icon: "addressBook", name: "Full business CRM & automation system", price: "from $2,500", priceType: "custom", status: "consult", manage: "quoted", fits: "all",
        fixes: "A business run from sticky notes, inboxes and spreadsheets",
        text: "A CRM on a maintained platform (such as HubSpot, Pipedrive or Zoho), not built from scratch: your pipeline and lead capture, plus the modules you pick, like scheduling, estimates, project tracking, tasks, invoicing links, reporting or more than one location. The starting price covers a limited first setup agreed in writing; every module beyond it is quoted.",
        who: "Growing businesses with a team, several services or more than one location.",
        needs: "A planning conversation in writing, invited access to the tools you use now, and an account in your name on the CRM we choose together.",
        costs: "The CRM’s own plan per user, and any tool it connects to, paid to them directly; named in your written plan first." }),
    ],
  },
];

export const services = groups.flatMap((g) => g.items);
export const serviceById = Object.fromEntries(services.map((s) => [s.id, s]));
export const variants = services.flatMap((s) => (s.variants ?? []).map((v) => ({ ...v, parent: s })));
export const variantById = Object.fromEntries(variants.map((v) => [v.id, v]));

// Kinds of business, for the catalogue filter and the industry examples (each kind's usual starting services and,
// where one fits, its bundle). `example` says what is automated and why it helps: no results are claimed.
export const kinds: { id: string; icon: IconName; name: string; who: string; start: string[]; bundle?: string; example?: string }[] = [
  { id: "all", icon: "squaresFour", name: "All", who: "", start: [] },
  { id: "trades", icon: "hammer", name: "Trades & home services", who: "plumbers, HVAC, electricians, cleaners, landscapers, contractors", start: ["missed-calls", "quotes", "estimate-follow-up"], bundle: "lead-recovery",
    example: "A missed call while you’re on a roof gets a text with your quote link; the quote form asks your usual questions; every estimate you send gets a polite check-in until the customer answers. You spend evenings on jobs, not chasing." },
  { id: "appointments", icon: "calendarCheck", name: "Barbers, salons & appointments", who: "barbers, salons, spas, studios, groomers", start: ["booking", "deposits", "reviews"], bundle: "appointment-protection",
    example: "Clients book from Google or Instagram at midnight, get a reminder the day before with a reschedule link, leave a card on file, and get one thank-you with your review link after the visit. Fewer empty chairs and no phone tag." },
  { id: "food", icon: "forkKnife", name: "Restaurants & cafés", who: "restaurants, cafés, bakeries, breweries", start: ["ordering", "email-list", "gift-cards"],
    example: "Orders and reservations come in online through the system you already use, gift cards sell from your site, and new sign-ups get a welcome email. The phone stops ringing at the busiest hour." },
  { id: "retail", icon: "storefront", name: "Shops & online retail", who: "boutiques, gift shops, makers, online stores", start: ["online-shop", "store", "email-list"],
    example: "Every order lands in your spreadsheet or accounting, low stock sends you an alert, and an abandoned cart gets one reminder email. No more typing orders by hand." },
  { id: "office", icon: "briefcase", name: "Professional services", who: "law, accounting, real estate, insurance, agencies, consultants", start: ["follow-up", "onboarding", "invoices"],
    example: "Every inquiry gets an instant reply, a new client gets the welcome, intake form and document checklist without you typing them, and invoices remind themselves. More time for the work clients pay for." },
];

// Preset bundles (fixed setup prices, no monthly fee). Each is made of whole services from the catalogue (`items`),
// so its scope is theirs and its "separately" total is worked out from their prices. The 10% / 15% multi-service
// discount never applies on top of a bundle (tests check the bundle is still cheaper than the discount would be).
export type Bundle = { id: string; name: string; price: string; icon: IconName; items: string[]; includes: string[]; who: string; kind: string };
const B = (b: Bundle) => b;
export const bundles: Bundle[] = [
  B({ id: "lead-recovery", name: "Lead Recovery Bundle", price: "$529", icon: "bellRinging", items: ["missed-calls", "follow-up"], kind: "trades",
    includes: ["Missed-call text-back", "Lead response and 2 follow-ups", "Alerts to you or your staff for every new lead", "Your booking or inquiry link in every reply"],
    who: "Plumbers, HVAC, contractors and cleaners." }),
  B({ id: "appointment-protection", name: "Appointment Protection Bundle", price: "$549", icon: "calendarCheck", items: ["booking", "reviews", "deposits"], kind: "appointments",
    includes: ["Online booking set up", "Text and email appointment reminders", "Review requests after each visit", "Deposit or card-on-file settings, where your booking tool supports them"],
    who: "Barbers, salons, groomers and studios." }),
  B({ id: "quote-to-customer", name: "Quote-to-Customer Bundle", price: "$749", icon: "clipboardText", items: ["quotes", "estimate-follow-up"], kind: "trades",
    includes: ["Quote request form and instant reply", "Estimate follow-up on days 2, 5 and 10", "An alert whenever a customer answers"],
    who: "Roofers, landscapers, painters, remodelers and other contractors." }),
];
export const bundleById = Object.fromEntries(bundles.map((b) => [b.id, b]));

/** "$1,200" -> 1200, "from $599" -> 599 */
export const dollars = (price: string) => Number((price.match(/\$([\d,]+)/)?.[1] ?? "").replace(/,/g, ""));
export const money = (n: number) => `$${n.toLocaleString("en-US")}`;
export const bundleMath = (b: Bundle) => {
  const separately = b.items.reduce((t, id) => t + dollars(serviceById[id].price), 0);
  return { separately, save: separately - dollars(b.price) };
};

// The optional monthly plans (billed monthly by Stripe, month to month). Points are the published terms, word for
// word (pricing overhaul brief, Phase 4). `care` and `automation-partner` keep their ids so old links land on the
// plan that replaced them; the earlier Automation care plan is in `retired`.
export type Plan = { id: string; name: string; price: string; amount: string; who: string; points: string[]; kind: "website" | "automation"; recommended?: boolean };
export const plans: Plan[] = [
  { id: "care", name: "Website Care", price: "$79/month", amount: "$79", who: "A website that should just keep working", kind: "website", points: ["Website checked every 5 minutes, 24/7", "Domain and security certificate renewal reminders", "A short monthly status summary", "Up to 30 minutes of small content changes a month", "First reply within 2 business days"] },
  { id: "automation-starter", name: "Automation Starter", price: "$149/month", amount: "$149", who: "Your first automation", kind: "automation", points: ["Up to 2 simple workflows monitored", "Failure alerts and troubleshooting", "Up to 30 minutes of small adjustments a month", "A basic monthly activity summary", "First reply within 2 business days"] },
  { id: "automation-growth", name: "Automation Growth", price: "$349/month", amount: "$349", who: "Several automations running", kind: "automation", recommended: true, points: ["Up to 5 agreed workflows monitored", "Errors troubleshot", "Up to 90 minutes of small changes a month", "Monthly activity and results report", "First reply within 1 business day"] },
  { id: "automation-partner", name: "Automation Partner", price: "$799/month", amount: "$799", who: "Priority help for your automations", kind: "automation", points: ["Up to 10 agreed workflows monitored", "Up to 3 hours of small adjustments a month", "Priority: work on an issue starts the same business day (after 3 pm Central: the next business morning)", "A monthly performance review", "One extra small workflow each quarter, in a fixed scope agreed in writing"] },
];
export const planById = Object.fromEntries(plans.map((p) => [p.id, p]));
/** Retired ids, and the id that now answers their old links. Their old customers keep what they agreed. */
export const retired: Record<string, string> = { "automation-care": "automation-growth" };

export const businessHours = "Monday to Friday, 9 a.m. to 5 p.m. Central time, except US federal holidays";
// What every plan shares (also on the Policies page, #cancel). Fair use and boundaries are defined here, once.
export const thirdPartyCosts = "Other companies’ subscriptions and usage (your website builder, texting, AI, phone minutes) are paid by you to them, and named before you sign up.";
export const planTerms: string[] = [
  "Month to month: cancel any time and the plan ends with the month already paid.",
  `Business days and hours are ${businessHours}. Reply times are when work on it starts, not a promise of when it’s fixed; another company’s outage is fixed as soon as they allow.`,
  "A workflow is one automation with one trigger, like “new form, then a reply and an alert”. Small changes are edits to work already built: wording, timing, a field. New pages, new workflows, redesigns and new integrations are quoted in writing.",
  "Unused minutes don’t carry over, and nothing is ever charged beyond the plan without your written yes.",
  thirdPartyCosts,
  "Your accounts, data and finished work stay yours, with or without a plan. Existing agreements keep the price and terms already agreed.",
];
export const planNote = "Monitoring runs 24/7: websites are checked every 5 minutes, and automations alert me when a run fails. Fixes start within each plan’s stated reply time, not instantly, and you hear from me when work starts and again when it’s fixed. If a fix waits on someone else (your host, an app’s outage, a change only you can approve), it comes as soon as they allow, with updates until then.";

// What the quote form asks first (brief 4 §8, three more in brief 5, video & creative in the Creative Studio brief):
// ten plain choices, required. A service page's link names the exact
// service (/contact/?service=<id>), which picks the matching choice here and is kept with the request; a page with no
// single service can name a choice instead (/contact/?want=<id>). The inquiry service (src/inquiry.js) has the same
// ids and labels, and a test fails when the two lists differ.
export const wants: { id: string; label: string }[] = [
  { id: "new-website", label: "Website" },
  { id: "redesign", label: "Website redesign" },
  { id: "shopify", label: "Online store" },
  { id: "automation", label: "Automation" },
  { id: "maintenance", label: "Care plan" },
  { id: "health-check", label: "Website health check" },
  { id: "repair", label: "Website repair" },
  { id: "security", label: "Security assessment" },
  { id: "creative", label: "Video & creative work" },
  { id: "other", label: "Something else or not sure yet" },
];
// The five the form shows (approvals 88). The other five stay accepted and keep their labels: a link that names one
// (/contact/?want=repair, a service that maps to one) shows it as a sixth choice, so the exact topic still travels.
export const wantsShown = ["new-website", "shopify", "automation", "maintenance", "other"];
const wantFor: Record<string, string> = { "new-website": "new-website", "starter-website": "new-website", "site-fixes": "redesign", "online-shop": "shopify", "mini-store": "shopify", store: "shopify", care: "maintenance" };
// (every automation group, the bundles and the automation plans are "AI automation"; the Google profile, online
// ordering and gift cards fit none of the choices, so they are "Other" with the exact service kept beside it)
export const wantOf = (id: string): string => {
  if (wantFor[id]) return wantFor[id];
  const parent = variantById[id]?.parent.id ?? id;
  const group = groups.find((g) => g.items.some((s) => s.id === parent))?.id;
  return (group && group !== "websites") || bundleById[id] || id.startsWith("automation-") ? "automation" : "other";
};

// Website security & repairs (brief 5): the four offers on /website-security/. They are NOT in `groups`: the catalogue
// promises a fixed, published price on every card, and the assessment and larger repairs are quoted in writing after a
// free look (their price ranges wait on the owner's yes, business/website-health/08-pricing.md). Each offer asks
// through one of the form's choices above (`want`). `auth` is what the page and the form must say before any work.
export type HealthOffer = { id: string; icon: IconName; name: string; price: string; priceNote: string; text: string; points: string[]; want: string; cta: string; auth: string };
export const health: HealthOffer[] = [
  { id: "health-consultation", icon: "gauge", name: "Free Website Health Consultation", price: "Free", priceNote: "No obligation",
    text: "We open your website the way a customer would, on a phone and on a computer, and tell you in plain words what works, what is broken and what looks out of date.",
    points: ["Pages, links, buttons and forms a visitor can see", "How it reads and loads on a phone", "Visible problems like a browser security warning", "A short written summary, with what we’d fix first"],
    want: "health-check", cta: "Request a Website Health Check", auth: "No written authorization needed: we only look at what any visitor sees. It is not a security test." },
  { id: "security-assessment", icon: "shieldCheck", name: "Authorized Security Assessment", price: "Quoted in writing", priceNote: "After the scope is agreed",
    text: "A careful, non-destructive review of your website’s security, done only after you approve a written scope: what we may test, when, and what is off limits.",
    points: ["A written scope you approve before anything is tested", "Findings in plain words: what we confirmed, what only looks possible", "What to fix first, and what each fix involves", "A retest after repairs, so you know what was resolved"],
    want: "security", cta: "Ask About Security Assessments", auth: "Written authorization from the website’s owner is required before any testing starts." },
  { id: "repairs", icon: "wrench", name: "Website Repairs", price: "Fixed price in writing", priceNote: "Before any work starts",
    text: "Broken pages, forms that don’t send, a layout that falls apart on phones, an expired security certificate, out-of-date software: fixed, tested and explained.",
    points: ["A written quote for exactly what will be fixed", "A backup or a way back before anything changes", "Tested on a phone and a computer afterwards", "A short report of what changed and what is left"],
    want: "repair", cta: "Get a Website Repair Quote", auth: "Your written approval of the quote, and access you grant as an invited user, are required before we change anything." },
  { id: "maintenance", icon: "arrowsClockwise", name: "Ongoing Maintenance", price: "", priceNote: "Optional, cancel anytime",
    text: "After a repair or a build, we can keep the website watched so the same problems don’t quietly come back. It is never a condition of any other work.",
    points: [],
    want: "maintenance", cta: "Ask about Website Care", auth: "A monthly agreement you can stop whenever you like. Your website and accounts stay yours." },
];

export const bundle = { two: 10, three: 15, text: "Order 2 one-time services together and the total is 10% off; 3 or more, 15% off. Add-ons count. The preset bundles are already discounted, so this doesn’t apply on top of them; monthly plans aren’t discounted, and the discount is written into the plan and price before you pay anything." };

// Words for a price, from its type, so no page shows a "from" price as a fixed one.
export const priceWords: Record<PriceType, string> = { fixed: "one-time", from: "one-time, starting price", setup: "setup, starting price", custom: "starting price, custom quote" };
export const statusWords: Record<Status, string> = { active: "", consult: "Available after consultation", planned: "Coming soon" };
const care = plans.find((p) => p.id === "care")!;
const starter = plans.find((p) => p.kind === "automation")!;
export const manageWords = (s: { manage: Manage; monthly?: string }): string =>
  ({
    website: `Optional: ${care.name}, ${care.price}`,
    automation: `Optional: an automation plan from ${starter.price}`,
    own: `Optional management ${s.monthly ?? ""}, plus provider usage`,
    quoted: "Ongoing management quoted separately, if you want it",
    none: "One-time job: no monthly plan needed",
  })[s.manage];

// The lowest fixed one-time price outside websites (the "first service" a small business can start with).
const automationItems = groups.filter((g) => g.id !== "websites").flatMap((g) => g.items).filter((s) => s.priceType === "fixed" && s.status === "active");
export const automationFrom = money(Math.min(...automationItems.map((s) => dollars(s.price))));

// The four primary services on the homepage (brief 4). Prices come from the data above, so they can't drift. The
// management card lists only Website Care terms that are published and capped.
export type Primary = { id: string; icon: IconName; title: string; text: string; points: string[]; price: string; href: string; cta: string };
const starterSite = variantById["starter-website"];
const miniStore = variantById["mini-store"];
export const primary: Primary[] = [
  { id: "websites", icon: "browser", title: "Business Websites", text: "A fast, modern website that works on every phone, shows your services and makes it easy to call, book or ask for a quote.",
    points: ["Built for phones first", "A contact or quote form that works", "Basic local search setup", "Your domain, in your name"], price: `One page ${starterSite.price} · 4-page site ${serviceById["new-website"].price}`, href: "/websites/", cta: "Business websites" },
  { id: "ecommerce", icon: "shoppingBag", title: "E-Commerce Stores", text: "A Shopify or Square Online store in your own account, ready to take orders: your products, payments, and pickup or shipping.",
    points: ["Up to 25 products from your photos", "Payments, pickup or shipping set up", "Your store, your account, your billing", "A Shop button on your website"], price: `5 products ${miniStore.price} · 25 products ${serviceById["online-shop"].price}`, href: "/ecommerce/", cta: "E-commerce stores" },
  { id: "automation", icon: "lightning", title: "AI & Business Automation", text: "Every inquiry answered fast, missed calls texted back, bookings with reminders, invoices that send themselves, and AI-drafted replies you approve.",
    points: ["Built in your own accounts", "Nothing sent without your rules", "Every failure alerts us", "AI drafts, you approve"], price: `One-time setups from ${automationFrom}`, href: "/automation/", cta: "Automation services" },
  { id: "management", icon: "shieldCheck", title: "Optional Website Management", text: "After launch, we can keep your website watched and its renewals on track for a monthly fee. It’s never required.",
    points: ["Website checked every 5 minutes, 24/7", "Domain and security renewals watched", "Billed monthly, cancel any time", "Your website stays yours if you stop"], price: `${care.name}: ${care.price}, optional`, href: "/websites/#ownership", cta: "Website management" },
];

// What the homepage estimator may add up: the one-time services anyone can order today, with the smaller versions
// beside their parent (choosing one clears the other). Consultation-only services are scoped first, so they are left
// out of an automatic total and named under it instead.
export const estimable = groups.map((g) => ({
  id: g.id, title: g.title,
  items: g.items.filter((s) => s.status === "active" && s.priceType !== "custom" && s.priceType !== "setup")
    .flatMap((s) => [{ id: s.id, name: s.name, price: s.price, fixes: s.fixes, alt: s.variants?.map((v) => v.id).join(" ") ?? "" },
      ...(s.variants ?? []).filter((v) => v.priceType !== "setup" && v.priceType !== "custom").map((v) => ({ id: v.id, name: v.name, price: v.price, fixes: `A smaller version of ${s.name}`, alt: s.id }))]),
})).filter((g) => g.items.length > 0);
export const consultOnly = services.filter((s) => s.status === "consult");

// How a job runs. Every promise here is a published term (/policies/#refunds, "At handover", and business/contract.md
// items 4, 5 and 7): step 4 is the policy's "you pay the other 50% after you’ve seen the work running", not a new one.
export const steps: { title: string; text: string }[] = [
  { title: "Tell us what you need", text: "Fill in the short quote form or send an email: your business, what you’d like built or fixed, and when. No call needed." },
  { title: "Get a clear proposal", text: "Within one business day, a written plan: what we’ll build, the fixed price and what it needs from you. Nothing is charged until you agree." },
  { title: "We build and test", text: "50% to start, by a secure Stripe invoice. Built in your own accounts as an invited user, never with your passwords, and tested with realistic examples." },
  { title: "Review and approve", text: "You see it working before you pay the rest. Anything that doesn’t do what the written plan says is fixed at no charge, and one round of changes within 14 days of handover is included." },
  { title: "Launch and handover", text: "It goes live in your own accounts with a short video guide, then the other 50%. Every job includes a 30-day launch watch." },
];

// Answers only from the written policies (/policies/) and the contract.
export const faqs: [string, string][] = [
  ["Do we need to get on a call?", "No. Your request, the written plan and price, questions and updates all happen in writing, with short screen recordings of each piece working. If you’d rather talk, say so in the form."],
  ["What’s the difference between a setup and a monthly plan?", "A setup is a one-time price to build something in your accounts; once it’s paid, it’s yours and keeps running. A monthly plan is optional: we watch it, fix what breaks and make small changes. You can buy a setup with no plan, and stop a plan any time."],
  ["Who owns what you build?", "You do. Everything is built in your own accounts (your website builder, your booking tool, your Google, your Stripe), and once it’s paid in full everything built for you is yours, including your domain."],
  ["Do you need my passwords?", "No. We work as an invited user in your accounts and never ask for passwords. You can remove our access at any time."],
  ["Are there costs from other companies?", "Sometimes: your website builder’s plan, a booking tool’s text reminders, texting registration with the carriers, AI usage or phone minutes. They’re paid by you, to them, from your own accounts, and every one is named in your written plan before you pay anything."],
  ["What’s the difference between missed-call text-back and the AI Voice Receptionist?", "Missed-call text-back sends one text after a call you couldn’t answer, with your booking or quote link. The AI Voice Receptionist answers the call itself and talks with the caller. The receptionist is set up after a consultation, because it depends on your phone system."],
  ["What if something breaks after launch?", "Every job includes a 30-day launch watch: every failure alerts us, we check in with you on day 3 and day 14, and anything our work breaks is fixed at no charge. After that, anything that doesn’t do what the written plan says is still fixed at no charge, and a monthly plan keeps it watched."],
  ["How do I pay?", "By a secure Stripe invoice: card, Apple Pay, Google Pay or bank transfer. 50% to start and 50% at handover; monthly plans are billed monthly. Nothing is charged until you agree to the written plan."],
  ["Is there a discount for more than one service?", "Yes. " + bundle.text],
  ["What if I change my mind?", "Cancel before work starts and the whole deposit is refunded. After that, the part that covers work not yet done is refunded. Monthly plans end with the month already paid."],
  ["Do I have to sign up for a monthly plan?", "No. Every service is a one-time price. Monthly plans are optional, for businesses that want their website or automations watched after handover."],
  ["Do you work with medical or dental offices?", "For scheduling and reminders, only after a compliance check first, and we may say no. These services aren’t set up to handle patient health information, and we don’t offer medical advice or emergency answering through them."],
  ["Can you promise more customers or a top Google ranking?", "No, and be careful with anyone who does. We build the things that make it easy to find you and contact you, set up the basics search engines look for, and measure what we can. Results depend on your market and your business."],
  ["Do you work outside Minnesota?", "Yes. Nuxy Automation is based in Faribault and works with businesses in Faribault, Northfield, Owatonna, Lakeville, the rest of southern Minnesota and the Twin Cities, and remotely anywhere in the US."],
];

// Where we work (local SEO and the About page). One page covers them all: no near-identical city pages.
export const areas = ["Faribault", "Northfield", "Owatonna", "Lakeville", "southern Minnesota", "the Twin Cities"];

// Tools the services are built in: the client's own accounts. "Works with", never a partnership.
export const tools = ["Google Business Profile", "Gmail", "Outlook", "Square", "Stripe", "QuickBooks", "Shopify", "Squarespace", "Wix", "WooCommerce", "Acuity", "Mailchimp", "Klaviyo", "Toast", "Clover", "Wave", "Zapier", "Make", "n8n", "Slack"];

// How a job keeps working after launch (business/delivery-playbook.md, in short). Published commitments.
export const keep: { icon: IconName; title: string; text: string }[] = [
  { icon: "sealCheck", title: "Your tools’ own features first", text: "If your booking tool or accounting app can already do it, we set that up properly. Custom code only where your tools can’t, and then only tested code." },
  { icon: "clipboardText", title: "Tested on your real, messy data", text: "A dry run on a copy of your records: names in capitals, typos, duplicates, odd dates. Every message is read by a person before anything goes live." },
  { icon: "bellSimple", title: "30-day launch watch, included", text: "For the first 30 days every failure alerts us, with check-ins on day 3 and day 14. Anything our work breaks is fixed at no charge." },
  { icon: "shieldCheck", title: "An off switch, and a plan", text: "You can pause it yourself in one step. If something goes wrong, we pause it first, tell you within 4 business hours, and fix it with a test so it can’t come back." },
];

// Safeguards every automation is built with (pricing overhaul brief, Phase 8). Requirements, shown as they are.
export const safeguards: string[] = [
  "Invited access only: we never ask for your passwords, and only get the access each job needs.",
  "Keys and secrets stay in your accounts or on a server, never in a web page.",
  "Messages respect consent: unsubscribe and STOP work, and a do-not-contact list is honored everywhere.",
  "Each message goes once: duplicates are blocked, failures retry and alert us.",
  "Logs keep what’s needed to fix a failure, not your customers’ private details.",
  "Uncertain or sensitive messages and calls go to a person.",
  "Your phone, booking, payment and CRM tools are checked for compatibility before you pay anything.",
  "Texting needs carrier registration, and we set it up before any texts go out.",
];
