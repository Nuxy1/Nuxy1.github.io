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

### Four main services (home page)

1. Professional website development (new website $900)
2. Website redesign and modernization (quick fixes from $150)
3. AI and business automation (fixed prices from $200)
4. Booking, leads and customer follow-ups (fixed prices from $250)

The flagship is **Lead response & follow-up**: an instant reply to every website form, email, Facebook or Instagram
inquiry, friendly follow-ups that stop when the customer replies, and an alert to the owner.

## Operating Context

- Static Astro site on GitHub Pages (custom domain nuxyautomation.com). Pages work without JavaScript, including the
  inquiry form (it posts and lands on the thanks page). JavaScript adds the service search and filters, the form's
  in-page result, the lead demo and anonymous counts.
- **Source of truth:** `src/data/services.ts` holds every service (19, in groups), the 3 monthly plans, the bundle
  discount, the four main services, the FAQ and the service areas. Pages, the pricing table, the inquiry form's list
  and the structured data read from it; no Nuxy price is typed anywhere else.
- The inquiry form posts to Nuxy's own inquiry service (`inquiryUrl` in `src/data/site.ts`), which saves the
  message and emails it to the Nuxy inbox. If sending fails, the page says so and shows the email address.
- Old one-page links (`/#booking`, `/#request`, ...) are redirected to their new pages; see DESIGN.md "Anchors and
  old links". Service ids are permanent.
- The demonstration websites (`/example-sites/*`) are noindex and labelled as demos; `/demo/` is a Nuxy page whose
  made-up salon is labelled as such at the top.

## Capabilities and Constraints

- Prices are the published prices in `src/data/services.ts`. One-time services from $150 to $1,200; monthly plans
  $100, $500 and $1,000. Order 2 one-time services together for 10% off, 3 or more for 15% off.
- 50% to start, 50% at handover, by invoice. Written plan and price within one business day.
- Client websites are built in the client's own Squarespace or Wix account so they can edit them alone; the
  demonstration websites are custom-coded to show what's possible.
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
- No client reviews, testimonials, customer logos or results yet. `src/data/reviews.ts` takes real reviews only, word
  for word with their source; while it is empty no reviews section is shown. Never fabricate reviews, logos, numbers,
  certifications, partnerships or people.

## Product Principles

1. Honest first: show only what is real, and label every demonstration as one.
2. The price and the result are visible before any contact.
3. Respect the owner's time: readable in a minute on a phone; everything in writing.
4. Their accounts, their control: no passwords, no lock-in, never held hostage, the monthly plan optional.
5. Fail out loud: if something didn't work (a form, a send), say so plainly and give another way.
