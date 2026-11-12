# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Owners and managers of small service businesses in Faribault, southern Minnesota and the Twin Cities, and remote
businesses anywhere in the US: trades and home services (plumbers, HVAC, electricians, cleaners, landscapers),
appointment businesses (salons, barbers, spas, studios), restaurants, shops and small offices. They are busy, often
reading on a phone between jobs, and not technical. Many arrive from a short email that named one problem on their
own website, or from a local search. Their job on the site: understand what would change for their business, see the
price, check that Nuxy is real and careful, and decide whether to send a message.

## Product Purpose

Nuxy Automation builds and fixes websites for small businesses and sets up the automations that stop leads slipping
away: an instant reply to every inquiry, follow-ups, missed-call text-back, booking and reminders, review requests,
invoices and reports. Success: the owner sends the inquiry form (or an email), gets a written plan and price within
one business day, and the work is agreed in writing.

## Positioning

A small local business based in Faribault, Minnesota. Fixed prices published up front. Everything in writing; calls
optional. Built inside the client's own accounts as an invited user, never with their passwords. The client owns the
website, the domain and every account, and a monthly plan is optional, never a condition. Proof is working demos and
open-source code anyone can open, clearly labelled as demonstrations, not testimonials.

### Four main services

1. Business websites (one page $499, 4-page site $900)
2. E-commerce stores (5 products $699, 25 products $1,200)
3. AI and business automation (one-time setups from $149; the AI Voice Receptionist is available after consultation)
4. Optional website management (Website Care $79/month)

### Also: AI Creative & Video Advertising

An additional service, from the owner's Creative Studio brief (2026-11-11): short video ads, motion graphics and
product showcases, made with AI video tools and finished by a person. Nuxy stays a website and automation business;
the four main services and the home page's message are unchanged, and video work is offered beside them
(`/creative-studio/`, the Services menu, one block on `/websites/`, `/automation/` and `/solutions/`).
**The creative prices, add-ons and the monthly term ("Cancel any time; unused videos don't carry over") were approved
by the owner on 2026-11-11** and are published prices: `src/data/creative.ts` holds them, `tests/creative.test.mjs`
pins them, and a change needs the owner's written yes. They are printed on `/creative-studio/`. `/contact/` carries
the estimator's rules too, so that a visitor arriving from the estimator sees the same estimated starting price
worked out again beside the form; it prints no creative price otherwise. The three videos in the page's gallery are
fictional concept demonstrations, labelled as such on the page and inside each file, never client work.

### Home page

The home page has one job: a small-business owner understands within seconds what Nuxy can do for them, sees the
automation working, sees roughly what it costs, and knows how to ask. In order: the hero (two buttons and the
starting prices), four cards (AI Voice Receptionist, Lead Recovery Automation, Business Websites, Business
Automation; `featured` in `src/data/services.ts`), the automation demos, the goal picker, the package estimator,
example work, three ways to start (Starter, Growth, Custom; `tiers`), the five steps, why Nuxy, and one final
button. Every price on it is worked out from the catalogue. The estimator gives an estimated starting price, never
a quote. E-commerce stores and website management are reached from the Services menu and the full list.

The flagship is **Lead response & follow-up**: an instant reply to every website form, email, Facebook or Instagram
inquiry, friendly follow-ups that stop when the customer replies, and an alert to the owner.

## Operating Context

- Static Astro site on GitHub Pages (custom domain nuxyautomation.com). Pages work without JavaScript, including the
  inquiry form (it posts and lands on the thanks page). JavaScript adds the service search and filters, the form's
  in-page result, the lead demo and anonymous counts.
- **Source of truth:** `src/data/services.ts` holds every service (26, in 6 groups), their 3 smaller or
  larger versions, the 3 preset bundles, the 4 monthly plans and their terms, the retired ids (`retired`, still
  accepted in links and the form), the bundle discount, the four main services, the FAQ and the service areas.
  Pages, the pricing table, the inquiry form's list and the structured data read from it; no Nuxy price is typed
  anywhere else on the site.
- **Creative work:** `src/data/creative.ts` holds the kinds of video work, their starting prices, the estimator's
  rules, the three demo briefs, the limits and the FAQ; `src/data/creative-estimate.ts` is the arithmetic, shared by
  the estimator and the quote form. The estimator sends nothing: its choices travel as a short code in the quote
  form's address, the form checks the code against the same rules, works the price out again and writes it into
  the project box as words. The request is saved as `want: creative` with no service id. The inquiry service must
  be deployed before the site, or it refuses that answer.
- **Videos are made privately.** Generation runs in the owner's own Higgsfield account, by hand, after the owner
  approves the credits. The site has no route, key or script that can reach a video service, and a visitor can
  never spend credits. `src/data/cinematic-manifest.json` lists the finished files; a page shows a video only
  when its file is listed there and really exists (`tests/creative.test.mjs`).
- The inquiry form posts to Nuxy's own inquiry service (`inquiryUrl` in `src/data/site.ts`), which saves the
  message and emails it to the Nuxy inbox. If sending fails, the page says so and shows the email address.
- Old one-page links (`/#booking`, `/#request`, ...) are redirected to their new pages; see DESIGN.md "Anchors and
  old links". Service ids are permanent.
- The demonstration websites (`/example-sites/*`) are noindex and labelled as demos; `/demo/` is a Nuxy page whose
  made-up salon is labelled as such at the top.

## Capabilities and Constraints

- Prices are the published prices in `src/data/services.ts`. One-time services from $149 to $1,200 (custom systems quoted
  from $2,500); optional monthly plans $79, $149, $349 and $799. Order 2 one-time services together for 10% off, 3 or
  more for 15% off; the preset bundles are already discounted. Published prices apply to work agreed from 2026-11-11;
  earlier agreements keep their terms. `business/offer.md` (what the cold-email drafter quotes) must match it: an
  agent test fails on any difference.
- 50% to start, 50% at handover, by invoice. Written plan and price within one business day.
- Client websites are built in the client's own Squarespace or Wix account so they can edit them alone; the
  demonstration websites are custom-coded to show what's possible.
- Video work: the customer approves a concept and a fixed written price before anything is made. The page says the
  videos are made with AI tools, that files sent for a video may be uploaded to the AI video service, that a real
  person's face or voice is used only with that person's written permission, and that views or sales are never
  promised.
- No ranking or growth guarantees. No unlimited support. Nothing is sent to a business's customers without rules the
  owner approved.

## Brand Commitments

- Name: Nuxy Automation. The site speaks as "we", meaning the business; it never names or implies people who aren't
  part of it.
- Logo: the Nuxy mark (`src/components/Mark.astro`, `public/favicon.svg`).
- Voice: plain, friendly, direct and honest; short sentences; no jargon or buzzwords. Explain the result before the
  tool.
- Look: see DESIGN.md (dark navy, one blue accent, Inter).

## Evidence on Hand

- An interactive lead demo on the home page and `/demos/` (runs in the page, sends nothing).
- Three demonstration websites for made-up local businesses and a demo salon booking site, each labelled as a demo.
- Four case studies (`/work/*`) built from the open-source small-business automations (github.com/Nuxy1), with the
  demo's real output; the businesses in them are made up and say so.
- Open-source projects with docs and code: the small-business automations, a webhook relay, Zapier/n8n code steps, a
  CSV contact cleaner and a community Discord bot.
- No video work for a client yet. Three Creative Studio demo videos exist (made 2026-11-11): they are for made-up
  brands and are labelled fictional concept demonstrations on the page and on each video's end card. The gallery
  and every link that says "portfolio" for videos appear only while all three exist as real, checked files. Never
  show an AI-made video as client work or as a before and after.
- No client reviews, testimonials, customer logos or results yet. `src/data/reviews.ts` takes real reviews only, word
  for word with their source; while it is empty no reviews section is shown. Never fabricate reviews, logos, numbers,
  certifications, partnerships or people.

## Product Principles

1. Honest first: show only what is real, and label every demonstration as one.
2. The price and the result are visible before any contact.
3. Respect the owner's time: readable in a minute on a phone; everything in writing.
4. Their accounts, their control: no passwords, no lock-in, never held hostage, the monthly plan optional.
5. Fail out loud: if something didn't work (a form, a send), say so plainly and give another way.
