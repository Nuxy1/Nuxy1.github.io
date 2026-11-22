// Monthly-plan sign-up (business/subscriptions/01-audit-and-plan.md §5). Everything here ships in the page: never a
// secret, a price id or an amount the server would trust. The browser only collects answers; the billing service
// (agent src/billing/routes.js, rules in src/eligibility.js) decides, and the price comes from its database.
//
// billingCheckout is OFF unless the build sets PUBLIC_BILLING_CHECKOUT=true. Off: no sign-up page is built, the
// thank-you and cancelled pages are not built, and the plan cards stay exactly as they were ("Get a Free Quote").
// The live site keeps it off until the owner approves live billing in writing.
import { callbackForm, inquiryUrl } from "./site";

export const billingCheckout: boolean = import.meta.env.PUBLIC_BILLING_CHECKOUT === "true";
/** The billing service's base address, on the same host as the inquiry form (CSP connect-src already allows it). */
export const billingUrl: string = (import.meta.env.PUBLIC_BILLING_URL || new URL("/billing", inquiryUrl).href).replace(/\/$/, "");

/** The plans a visitor can sign up for online once their answers fit (PLANS[*].selfServe in src/eligibility.js). */
export const selfServePlans = ["care", "automation-starter"] as const;
export type SelfServePlan = (typeof selfServePlans)[number];

/** What each plan card's button does when billingCheckout is on. */
export const planAction: Record<string, { label: string; href: string }> = {
  care: { label: "Get Started", href: "/get-started/care/" },
  "automation-starter": { label: "Get Started", href: "/get-started/automation-starter/" },
  "automation-growth": { label: "Request a Free Consultation", href: `/contact/?service=automation-growth${callbackForm ? "#callback" : ""}` },
  "automation-partner": { label: "Talk to Our Team", href: "/contact/?service=automation-partner" },
};

/** Shown on every plan card and again before checkout (the brief's disclosure, word for word in meaning). */
export const disclosure =
  "Billed monthly: charged today when you check out, then renews each month until you cancel. Cancel any time in the billing portal and the plan ends with the month already paid.";

/** Ticked before the checkout button works (auto-renewal laws ask for a clear yes to a renewing charge). */
export const renewalConsent = "I understand this plan is charged today and renews every month until I cancel.";

export type Choice = { id: string; label: string; hint?: string };
export type Question = { name: string; legend: string; help?: string; many?: boolean; choices: Choice[] };

// Ids match src/eligibility.js exactly (tests/billing.test.mjs reads that file and fails when they differ).
const accountOwner: Question = {
  name: "accountOwner",
  legend: "Who holds the logins to the accounts the workflows run in?",
  choices: [
    { id: "me", label: "I do" },
    { id: "my-team", label: "Someone on my team" },
    { id: "developer-or-agency", label: "A developer or agency" },
    { id: "unknown", label: "I’m not sure" },
  ],
};
const canInvite: Question = {
  name: "canInvite",
  legend: "Can you invite a new user to those accounts?",
  help: "Nuxy works through a user invitation to your own accounts. We never ask for your password.",
  choices: [
    { id: "yes", label: "Yes" },
    { id: "no", label: "No" },
    { id: "unknown", label: "I’m not sure" },
  ],
};
const sensitive: Question = {
  name: "sensitive",
  legend: "Does any of this handle the following?",
  help: "Choose all that apply, or “None of these”.",
  many: true,
  choices: [
    { id: "moves-money", label: "Moves money (payments, payouts, refunds)" },
    { id: "legal-records", label: "Legal records or contracts" },
    { id: "decisions-about-people", label: "Decisions about people (hiring, credit, housing)" },
    { id: "health-info", label: "Health information" },
    { id: "children-data", label: "Information about children" },
    { id: "none", label: "None of these" },
  ],
};

export const websiteQuestions: Question[] = [
  {
    name: "platform",
    legend: "What is the website built on?",
    choices: [
      { id: "squarespace", label: "Squarespace" },
      { id: "wix", label: "Wix" },
      { id: "square-online", label: "Square Online" },
      { id: "shopify", label: "Shopify" },
      { id: "wordpress", label: "WordPress" },
      { id: "webflow", label: "Webflow" },
      { id: "godaddy", label: "GoDaddy" },
      { id: "custom-code", label: "Custom code" },
      { id: "other", label: "Something else" },
      { id: "unknown", label: "I’m not sure" },
    ],
  },
  {
    name: "siteState",
    legend: "How is the website doing today?",
    choices: [
      { id: "working", label: "Working fine" },
      { id: "partly-broken", label: "Partly broken" },
      { id: "down", label: "Down" },
      { id: "not-built", label: "Not built yet" },
      { id: "unknown", label: "I’m not sure" },
    ],
  },
  {
    name: "domainControl",
    legend: "Who controls the domain name?",
    choices: [
      { id: "me", label: "I do" },
      { id: "someone-else", label: "Someone else" },
      { id: "unknown", label: "I’m not sure" },
    ],
  },
  { ...accountOwner, legend: "Who holds the logins to the website and domain accounts?" },
  canInvite,
  sensitive,
];

export const automationQuestions: Question[] = [
  {
    name: "tools",
    legend: "Which tools do the workflows run in?",
    help: "Choose all that apply.",
    many: true,
    choices: [
      { id: "google-workspace", label: "Google Workspace" },
      { id: "microsoft-365", label: "Microsoft 365" },
      { id: "zapier", label: "Zapier" },
      { id: "make", label: "Make" },
      { id: "shopify", label: "Shopify" },
      { id: "square", label: "Square" },
      { id: "woocommerce", label: "WooCommerce" },
      { id: "hubspot", label: "HubSpot" },
      { id: "airtable", label: "Airtable" },
      { id: "other", label: "Something else" },
      { id: "unknown", label: "I’m not sure" },
    ],
  },
  {
    name: "workflowState",
    legend: "Are the workflows running today?",
    choices: [
      { id: "working", label: "Yes, they work" },
      { id: "some-failing", label: "Some are failing" },
      { id: "not-built", label: "Not built yet" },
      { id: "unknown", label: "I’m not sure" },
    ],
  },
  {
    name: "builtBy",
    legend: "Who built them?",
    choices: [
      { id: "nuxy", label: "Nuxy" },
      { id: "me-or-team", label: "Me or my team" },
      { id: "someone-else", label: "Someone else" },
      { id: "unknown", label: "I’m not sure" },
    ],
  },
  accountOwner,
  canInvite,
  sensitive,
];

/** The published workflow limit of each automation plan (matches PLANS[*].maxWorkflows in src/eligibility.js). */
export const workflowLimit: Record<string, number> = { "automation-starter": 2, "automation-growth": 5, "automation-partner": 10 };

/** What each decision means for the visitor, in plain words. Nothing is charged unless the answer is "eligible". */
// withSuggestion: the body used instead when the service names a better-fitting plan and its button is shown.
export const outcomes: Record<string, { title: string; body: string; withSuggestion?: string }> = {
  eligible: { title: "Your answers fit this plan", body: "Check the details below, then continue to Stripe’s secure checkout." },
  needs_clarification: {
    title: "We need a little more detail",
    body: "Nothing has been charged. Your answers are saved, and we’ll ask by email about anything unclear. You can also change your answers now.",
    // (only a workflow count above this plan's limit names another plan: eligibility.js workflow.over_plan)
    withSuggestion: "Nothing has been charged. Your answers are saved, but this plan doesn’t cover that many workflows. Ask us about the plan that fits, or change your answers.",
  },
  manual_review: { title: "A person checks this first", body: "Nothing has been charged. Your answers are saved, and we reply by email once someone has looked. You only pay if the plan is approved." },
  custom_quote: { title: "This needs a written quote first", body: "Nothing has been charged. Your answers are saved; we’ll reply by email with a written quote. The monthly plan can start once that work is done." },
  unsupported: { title: "This is outside what Nuxy offers", body: "Nothing has been charged, and we won’t offer a plan for this. Your answers are saved in case you’d like to talk it through." },
};
