// Every service, plan and price on the site, in one place. Change a price or a service here and every page follows
// (business/site-upgrade/README.md, "Changing services and prices").
//
// Rules:
// - ids are linked from outreach emails and old /#id links: never change or reuse one.
// - Prices are the PUBLISHED prices. A new price needs the owner's written yes first (business/site-upgrade/
//   proposals.md); proposed prices never go in this file.
// - Plan points are the published plan terms: they change only with the owner's yes (policy-edits draft, changes 1-4).
import type { IconName } from "../components/Icon.astro";

export type Service = {
  id: string;
  name: string;
  price: string;
  icon: IconName;
  /** the owner's problem, in their words */
  fixes: string;
  /** what's delivered */
  text: string;
  /** who it suits, in words */
  who: string;
  /** kinds of business it suits (see kinds), or "all" */
  fits: string;
  /** what's needed from the customer */
  needs: string;
  /** costs paid to other companies, not to Nuxy */
  costs: string;
  popular?: boolean;
  addon?: boolean;
};

export type Group = { id: string; title: string; lead: string; legacy: string[]; items: Service[] };

const S = (s: Service) => s;

export const groups: Group[] = [
  {
    id: "websites",
    title: "Websites",
    lead: "A site that works on phones, shows up on Google and turns visits into inquiries.",
    legacy: ["web", "website"],
    items: [
      S({ id: "new-website", icon: "globeSimple", name: "New website", price: "$900", fits: "all", popular: true,
        fixes: "No website, or one too old to fix",
        text: "Up to 4 pages, built for phones: your services and prices, hours, map and a Book, Quote or Order button, on your own domain. Built in your own Squarespace or Wix account, so you can edit it and it stays yours.",
        who: "Businesses with no website, or one too old or broken to fix.",
        needs: "Your logo and photos, services, prices and hours, and a Squarespace or Wix account in your name.",
        costs: "The Squarespace or Wix plan and your domain, paid to them directly." }),
      S({ id: "site-fixes", icon: "wrench", name: "Website quick fixes", price: "from $150", fits: "all", popular: true,
        fixes: "A site that looks broken on a phone",
        text: "Secure https, a phone-friendly page setup, a booking or quote button and a contact form that works: on the site you already have.",
        who: "Businesses whose site works but looks dated or breaks on phones.",
        needs: "A login to your current website.",
        costs: "Usually none. Secure https is free on most hosts." }),
      S({ id: "google-profile", icon: "mapTrifold", name: "Google profile setup", price: "$250", fits: "all",
        fixes: "A business Google barely shows",
        text: "Your Google Business Profile claimed or created, with categories, hours, services, your photos and your website and booking links. I walk you through Google’s own verification.",
        who: "Any local business, especially one that’s new or has no website yet.",
        needs: "A Google account in your name and your business address or service area for Google’s verification.",
        costs: "None: Google Business Profile is free." }),
    ],
  },
  {
    id: "ecommerce",
    title: "E-commerce",
    lead: "Sell online from a store in your own account, plus the extras that keep orders moving.",
    legacy: [],
    items: [
      S({ id: "online-shop", icon: "shoppingBag", name: "Online shop", price: "$1,200", fits: "retail",
        fixes: "Customers who can’t buy unless they come in",
        text: "A store on Square Online or Shopify in your own account: up to 25 products from photos you send, payments, pickup or shipping, and a Shop button on your site.",
        who: "Shops ready to sell online.",
        needs: "Product photos, prices and descriptions, and a Square or Shopify account in your name.",
        costs: "Shopify’s or Square Online’s own plan, plus card fees." }),
      S({ id: "store", icon: "storefront", name: "Online store automations", price: "$500", fits: "retail",
        fixes: "Orders typed into spreadsheets by hand",
        text: "For Shopify, WooCommerce or Square stores: every order into your spreadsheet or accounting, low-stock alerts, abandoned-cart and thank-you emails.",
        who: "Online and local shops on Shopify, WooCommerce or Square.",
        needs: "Staff access to your store.",
        costs: "Sometimes a store app’s plan; it’s named in your written plan first." }),
      S({ id: "gift-cards", icon: "gift", name: "Online gift cards", price: "$150", fits: "appointments food retail", addon: true,
        fixes: "Gift shoppers with nowhere to buy",
        text: "A Buy a gift card button on your website, Google profile and Instagram, using your booking or point-of-sale tool’s own gift cards.",
        who: "Salons, restaurants and shops.",
        needs: "Access to your booking or point-of-sale tool.",
        costs: "Your tool’s own gift card fees, if any." }),
      S({ id: "ordering", icon: "forkKnife", name: "Online ordering & reservations", price: "$400", fits: "food",
        fixes: "A phone ringing at your busiest hour",
        text: "Online ordering and table reservations switched on in the system you already use (Toast, Square, Clover) or a free one, with Order and Reserve buttons on your site and Google profile.",
        who: "Restaurants, cafés, bakeries and breweries.",
        needs: "Access to your point-of-sale (Toast, Square or Clover).",
        costs: "Your point-of-sale’s own online-ordering fees, if any." }),
    ],
  },
  {
    id: "automation",
    title: "Business automation",
    lead: "Answer every inquiry fast, make booking easy, and spend fewer hours typing, chasing and copying between apps.",
    legacy: ["customers", "admin", "get-customers", "save-time"],
    items: [
      S({ id: "follow-up", icon: "chatCircleText", name: "Lead response & follow-up", price: "$450", fits: "all", popular: true,
        fixes: "Messages that wait hours for an answer",
        text: "Every website form, email, Facebook or Instagram inquiry gets an instant reply, 2 friendly follow-ups and an alert to you, so nobody waits until you’re free. A contact form added if your site has none.",
        who: "Any business that gets inquiries while it’s busy: trades, cleaners, contractors, salons, offices.",
        needs: "Access to your website form or inbox as an invited user, and how you’d like replies to sound.",
        costs: "Usually none: it runs in the email and form tools you already have." }),
      S({ id: "booking", icon: "calendarCheck", name: "Online booking & reminders", price: "$400", fits: "appointments office", popular: true,
        fixes: "Calls you miss while you’re with a customer",
        text: "A Book now button on your website, Google profile and Instagram, connected to the booking tool you already use (or a free one), plus automatic text and email reminders that cut no-shows.",
        who: "Appointment businesses: salons, groomers, studios, clinics, consultants.",
        needs: "Invited access to your booking tool (or we pick a free one together) and your website.",
        costs: "Your booking tool’s own plan, if any. Some tools charge for text reminders." }),
      S({ id: "quotes", icon: "clipboardText", name: "Quote requests", price: "$450", fits: "trades",
        fixes: "Calls you can’t take on a job",
        text: "A Get a quote form on your site (photos welcome), an instant reply to the customer, a reminder to you to send the estimate, and a follow-up if they go quiet.",
        who: "Trades and home services: plumbers, HVAC, landscapers, cleaners, contractors.",
        needs: "Website access and the questions you ask before you can quote.",
        costs: "Usually none. Photo uploads can need a form tool’s paid plan; it’s named in your written plan first." }),
      S({ id: "missed-calls", icon: "phoneX", name: "Missed-call text-back", price: "$250", fits: "trades appointments", addon: true,
        fixes: "Callers who hang up and call someone else",
        text: "When you can’t pick up, the caller gets a text right away with your booking or quote link, set up in the booking or phone tool you already use.",
        who: "Busy phones: trades on a job, salons mid-appointment.",
        needs: "Access to your phone or booking tool.",
        costs: "Depends on your phone tool. A new texting number needs carrier registration, paid to the carrier; it’s quoted in writing before you pay anything." }),
      S({ id: "reviews", icon: "star", name: "Review requests", price: "$250", fits: "all", popular: true,
        fixes: "Happy customers who never leave a review",
        text: "After each visit, job or order, every customer gets a short thank-you with a link to leave you a Google review. More reviews, no awkward asking.",
        who: "Any business with a Google profile and finished jobs or visits.",
        needs: "Your Google review link and where finished jobs or visits are recorded.",
        costs: "Usually none." }),
      S({ id: "email-list", icon: "envelopeOpen", name: "Email list & welcome emails", price: "$300", fits: "appointments food retail",
        fixes: "Customers who never hear from you again",
        text: "A sign-up form on your site and at checkout, 3 welcome emails in your voice, and your existing customers imported (only people who agreed), in Mailchimp, Brevo or Klaviyo.",
        who: "Shops, cafés, salons and anyone with repeat customers.",
        needs: "An account in Mailchimp, Brevo or Klaviyo, and a list of customers who agreed to hear from you.",
        costs: "Email tools are free up to a limit, then the tool’s own monthly plan." }),
      S({ id: "invoices", icon: "receipt", name: "Invoices & payment reminders", price: "$350", fits: "trades office",
        fixes: "Invoices sent late and paid later",
        text: "Invoices sent automatically when a job is done or an order ships, from QuickBooks, Stripe, Square or Wave, friendly reminders when one is overdue, and an alert when it’s paid.",
        who: "Trades, cleaners and offices that invoice after the work.",
        needs: "Invited access to QuickBooks, Stripe, Square or Wave.",
        costs: "Your accounting tool’s plan and its normal payment fees." }),
      S({ id: "deposits", icon: "creditCard", name: "Deposits & no-show protection", price: "$150", fits: "appointments", addon: true,
        fixes: "Empty chairs from no-shows",
        text: "A card on file or a small deposit when clients book, plus a clear cancellation policy, switched on in your booking tool.",
        who: "Appointment businesses that lose money to no-shows.",
        needs: "Access to your booking tool and the cancellation policy you want.",
        costs: "Your booking tool’s normal card fees." }),
      S({ id: "reports", icon: "chartLineUp", name: "Weekly report", price: "$300", fits: "all",
        fixes: "Numbers scattered across five apps",
        text: "One email or live dashboard every Monday with the numbers you care about: sales, leads, bookings, reviews, pulled from the tools you already use.",
        who: "Owners who want one Monday email instead of five logins.",
        needs: "Read-only access to the tools the numbers come from.",
        costs: "Usually none." }),
      S({ id: "data", icon: "broom", name: "Data clean-up & import", price: "from $200", fits: "all",
        fixes: "Messy, duplicated customer lists",
        text: "Customer and contact lists cleaned, duplicates merged and moved into your new CRM or email tool, with every change counted.",
        who: "Anyone moving to a new CRM, email tool or booking system.",
        needs: "An export of your lists (a spreadsheet or CSV file).",
        costs: "None." }),
    ],
  },
  {
    id: "custom",
    title: "Custom solutions",
    lead: "AI drafting and custom connections, for when your tools can’t do it on their own.",
    legacy: ["integrations", "add-ons", "advanced"],
    items: [
      S({ id: "ai-replies", icon: "sparkle", name: "AI inquiry assistant", price: "$750", fits: "all",
        fixes: "An inbox that eats your evenings",
        text: "New emails and form messages sorted by AI, with a drafted answer waiting in your inbox for you to approve and an alert for anything urgent. Nothing is sent without you.",
        who: "Owners who answer the same questions by email every day.",
        needs: "Access to your inbox, and an AI account in your name.",
        costs: "AI usage, billed by the AI company to your own account; estimated in your written plan." }),
      S({ id: "integrations", icon: "plugsConnected", name: "Custom integrations", price: "from $750", fits: "all",
        fixes: "Apps that don’t talk to each other",
        text: "Your CRM, email marketing, inventory sheet, accounting and website connected with custom connectors and webhooks: every record checked, never written twice, retried when a service is down, and an alert if anything fails.",
        who: "Businesses with several tools that need to share records.",
        needs: "Invited access to each tool.",
        costs: "Sometimes an automation tool’s plan (Zapier, Make or n8n) or a small server; named in your written plan first." }),
    ],
  },
];

export const services = groups.flatMap((g) => g.items);
export const serviceById = Object.fromEntries(services.map((s) => [s.id, s]));

// Kinds of business, for the catalog filter (each kind's usual starting services).
export const kinds: { id: string; icon: IconName; name: string; who: string; start: string[] }[] = [
  { id: "all", icon: "squaresFour", name: "All", who: "", start: [] },
  { id: "trades", icon: "hammer", name: "Trades & home services", who: "plumbers, HVAC, electricians, cleaners, landscapers, contractors", start: ["follow-up", "quotes", "invoices"] },
  { id: "appointments", icon: "calendarCheck", name: "Appointments", who: "salons, barbers, spas, studios, clinics, groomers", start: ["booking", "deposits", "reviews"] },
  { id: "food", icon: "forkKnife", name: "Restaurants", who: "restaurants, cafés, bakeries, breweries", start: ["ordering", "email-list", "gift-cards"] },
  { id: "retail", icon: "storefront", name: "Shops", who: "boutiques, gift shops, garden centers, online stores", start: ["online-shop", "store", "email-list"] },
  { id: "office", icon: "briefcase", name: "Offices", who: "law, accounting, real estate, insurance, consultants", start: ["follow-up", "ai-replies", "invoices"] },
];

// The monthly plans (billed monthly by Stripe, cancel any time). Points are the published terms, word for word.
export type Plan = { id: string; name: string; price: string; amount: string; who: string; points: string[] };
export const plans: Plan[] = [
  { id: "care", name: "Care plan", price: "$100/month", amount: "$100", who: "A website and a few simple automations", points: ["Website checked every 5 minutes, 24/7", "Anything that breaks fixed within one business day", "Domain and security renewals watched", "Small changes when you ask"] },
  { id: "automation-care", name: "Automation care", price: "$500/month", amount: "$500", who: "Businesses running several automations", points: ["Up to 10 automations or integrations monitored", "Failed runs alert me, fixed the same business day", "A monthly report of what ran and what was fixed", "Up to 3 hours of small changes a month"] },
  { id: "automation-partner", name: "Automation partner", price: "$1,000/month", amount: "$1,000", who: "Your automation team, on call", points: ["Everything in Automation care", "One new automation or integration every month", "Fixes started within 4 business hours", "A quarterly look at your tools for more time to save"] },
];
// The plan points above are published terms and stay word for word until the owner decides policy-edits-draft
// 2026-11-05 §2-3 (they mix a finish time on Care with a start time on Partner). This note only explains them: you hear
// when work starts and again when it's done, and a fix that waits on someone else (the Policies page's
// "Responsibility": other companies' outages) comes as soon as they allow, with updates. No new promise is made here.
export const planNote = "Monitoring runs 24/7: websites are checked every 5 minutes, and automations alert me when a run fails. Fixes come within each plan’s stated time, not instantly, and you hear from me when work starts and again when it’s fixed. If a fix waits on someone else (your host, an app’s outage, a change only you can approve), it comes as soon as they allow, with updates until then.";

// What the quote form asks first (brief 4 §8): six plain choices, required. A service page's link names the exact
// service (/contact/?service=<id>), which picks the matching choice here and is kept with the request; a page with no
// single service can name a choice instead (/contact/?want=<id>). The inquiry service (src/inquiry.js) has the same
// ids and labels, and a test fails when the two lists differ.
export const wants: { id: string; label: string }[] = [
  { id: "new-website", label: "New website" },
  { id: "redesign", label: "Website redesign" },
  { id: "shopify", label: "Shopify store" },
  { id: "automation", label: "AI automation" },
  { id: "maintenance", label: "Website maintenance" },
  { id: "other", label: "Other" },
];
const wantFor: Record<string, string> = { "new-website": "new-website", "site-fixes": "redesign", "online-shop": "shopify", store: "shopify", care: "maintenance" };
// (the automation and custom groups and the two automation plans are "AI automation"; the Google profile, online
// ordering and gift cards fit none of the six, so they are "Other" with the exact service kept beside it)
export const wantOf = (serviceId: string): string => {
  if (wantFor[serviceId]) return wantFor[serviceId];
  const group = groups.find((g) => g.items.some((s) => s.id === serviceId))?.id;
  return group === "automation" || group === "custom" || serviceId.startsWith("automation-") ? "automation" : "other";
};

export const bundle = { two: 10, three: 15, text: "Order 2 one-time services together and the total is 10% off; 3 or more, 15% off. Add-ons count, monthly plans aren’t discounted, and the discount is written into the plan and price before you pay anything." };

// The four primary services on the homepage (brief 4). Prices shown are published prices only. The management card
// lists only care-plan terms that are already published and capped (approval 7: "Small changes when you ask" has no
// cap, and "fixed within one business day" mixes reply and fix times, so neither is repeated here).
export type Primary = { id: string; icon: IconName; title: string; text: string; points: string[]; price: string; href: string; cta: string };
export const primary: Primary[] = [
  { id: "websites", icon: "browser", title: "Business Websites", text: "A fast, modern website that works on every phone, shows your services and makes it easy to call, book or ask for a quote.",
    points: ["Built for phones first", "A contact or quote form that works", "Basic local search setup", "Your domain, in your name"], price: "New website $900 · quick fixes from $150", href: "/websites/", cta: "Business websites" },
  { id: "ecommerce", icon: "shoppingBag", title: "E-Commerce Stores", text: "A Shopify or Square Online store in your own account, ready to take orders: your products, payments, and pickup or shipping.",
    points: ["Up to 25 products from your photos", "Payments, pickup or shipping set up", "Your store, your account, your billing", "A Shop button on your website"], price: "Online shop: $1,200", href: "/ecommerce/", cta: "E-commerce stores" },
  { id: "automation", icon: "lightning", title: "AI & Business Automation", text: "Every inquiry answered fast, bookings with reminders, invoices that send themselves, and AI-drafted replies you approve.",
    points: ["Built in your own accounts", "Nothing sent without your rules", "Every failure alerts us", "AI drafts, you approve"], price: "Fixed prices from $200", href: "/automation/", cta: "Automation services" },
  { id: "management", icon: "shieldCheck", title: "Optional Website Management", text: "After launch, we can keep your website watched and its renewals on track for a monthly fee. It’s never required.",
    points: ["Website checked every 5 minutes, 24/7", "Domain and security renewals watched", "Billed monthly, cancel any time", "Your website stays yours if you stop"], price: "Care plan: $100/month", href: "/websites/#ownership", cta: "Website management" },
];

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
  ["Who owns what you build?", "You do. Everything is built in your own accounts (your website builder, your booking tool, your Google, your Stripe), and once it’s paid in full everything built for you is yours, including your domain."],
  ["Do you need my passwords?", "No. We work as an invited user in your accounts and never ask for passwords. You can remove our access at any time."],
  ["What if something breaks after launch?", "Every job includes a 30-day launch watch: every failure alerts us, we check in with you on day 3 and day 14, and anything our work breaks is fixed at no charge. After that, anything that doesn’t do what the written plan says is still fixed at no charge, and a monthly plan keeps it watched."],
  ["How do I pay?", "By a secure Stripe invoice: card, Apple Pay, Google Pay or bank transfer. 50% to start and 50% at handover; monthly plans are billed monthly. Nothing is charged until you agree to the written plan."],
  ["Is there a discount for more than one service?", "Yes. " + bundle.text],
  ["What if I change my mind?", "Cancel before work starts and the whole deposit is refunded. After that, the part that covers work not yet done is refunded. Monthly plans end with the month already paid."],
  ["Do I have to sign up for a monthly plan?", "No. Every service is a one-time price. Monthly plans are optional, for businesses that want their website or automations watched after handover."],
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
