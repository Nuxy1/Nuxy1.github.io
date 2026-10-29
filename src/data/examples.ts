// The four working examples (github.com/Nuxy1/small-business-automations), for the homepage's demo week and the
// case-study pages. The businesses are made up; the lines are the demo's real output (npm run demo), the speeds are
// npm run bench on a Ryzen 7 desktop. Nothing here is a client result.
export type Line = [time: string, kind: string, text: string];
export type Example = {
  slug: string; tab: string; title: string; who: string; kind: string;
  service: { id: string; name: string; price: string };
  problem: string; built: string[]; messy: string[]; numbers: [string, string][]; speed: string; fit: string; lines: Line[];
};

export const examples: Example[] = [
  {
    slug: "booking-reminders", tab: "Booking reminders", title: "Booking reminders for a dog groomer", who: "Prairie Paws Grooming", kind: "dog groomer",
    service: { id: "booking", name: "Online booking & reminders", price: "$400" },
    problem: "Clients call to book while the groomer’s hands are full, so calls go unanswered, and the ones who do book sometimes forget and don’t show.",
    built: [
      "A confirmation the moment someone books online, with a link to move or cancel",
      "A reminder the day before and another 2 hours before, never at night",
      "A moved booking gets a new confirmation and new reminders; a cancelled one gets none",
      "The day’s schedule in the owner’s inbox every morning",
    ],
    messy: [
      "JORDAN PRICE in capitals becomes Jordan Price; Ana.Lima@Gmial.com is fixed",
      "The same booking sent twice by the booking tool is confirmed once",
      "A 9 a.m. appointment’s 2-hour reminder would land at 7 a.m.: skipped, the day-before one already went",
      "A booking with no usable email goes to the owner to confirm by hand",
    ],
    numbers: [["2", "bookings"], ["1", "moved"], ["3", "confirmations"], ["4", "reminders"], ["1", "morning schedule"], ["0", "reminders at night"]],
    speed: "5,000 bookings confirmed and checked for reminders in 1.4 seconds",
    fit: "Most booking tools (Square, Acuity, Vagaro) have confirmations and reminders built in: those are switched on and set up first. This runs where they don’t, from the booking tool’s webhook.",
    lines: [
      ["Mon 10:12", "booking", "Jordan Price books a full groom for Wednesday 2:00 PM"],
      ["Mon 10:12", "customer", "Confirmation to Jordan, with a link to move or cancel"],
      ["Mon 10:12", "owner", "New booking: Jordan Price"],
      ["Mon 21:40", "booking", "Ana Lima books a nail trim for Thursday 9:00 AM"],
      ["Mon 21:40", "customer", "Confirmation to ana.lima@gmail.com (the typo fixed)"],
      ["Tue 14:00", "customer", "See you tomorrow: reminder to Jordan"],
      ["Tue 16:05", "moved", "Jordan moves to Thursday 11:00 AM"],
      ["Tue 16:05", "customer", "Moved: a new confirmation; the old reminders are dropped"],
      ["Wed 09:00", "customer", "See you tomorrow: reminder to Ana"],
      ["Wed 11:00", "customer", "See you tomorrow: reminder to Jordan, for the new time"],
      ["Thu 07:00", "owner", "Today: 2 appointments"],
      ["Thu 07:00", "skipped", "Ana’s 2-hour reminder would land at 7 a.m.: skipped"],
      ["Thu 09:00", "customer", "In 2 hours: last reminder to Jordan"],
    ],
  },
  {
    slug: "lead-follow-up", tab: "Lead follow-up", title: "Lead follow-up for a plumber", who: "Northfield Plumbing Co.", kind: "plumber",
    service: { id: "follow-up", name: "Lead follow-up", price: "$450" },
    problem: "A plumber on a job can’t answer email or the website form. Inquiries sit for hours, and the customer books the next plumber on Google.",
    built: [
      "An instant reply to every inquiry: when you’ll call back, and what to do in an emergency",
      "An alert to the owner with the name, phone number and message, ready to call back",
      "A friendly follow-up after 1 day and after 3 days, stopping the moment the customer replies or books",
      "The same person sending the form twice is one conversation, not two replies",
    ],
    messy: [
      "MARIA GONZALEZ typed in capitals becomes Maria Gonzalez",
      "A typo like @gmial.com is fixed; phones in any format become +1 507 numbers",
      "No usable email or phone: straight to the owner, never into a void",
      "A follow-up that falls due at night waits for 9 a.m.",
    ],
    numbers: [["4", "form submissions"], ["2", "instant replies"], ["1", "repeat merged"], ["1", "passed to the owner"], ["3", "follow-ups"], ["0", "sent at night or twice"]],
    speed: "5,000 form submissions, repeats and typos included, in 0.14 seconds",
    fit: "Your website form (any form tool) sends each inquiry in, or the same steps are switched on in a tool you already use. Built in your account and tested on your real inquiries first.",
    lines: [
      ["Mon 09:10", "form", "Maria Gonzalez, Maria.Gonzalez@Gmial.com: “Kitchen sink drains slowly”"],
      ["Mon 09:10", "owner", "New inquiry: Maria Gonzalez, with her phone number"],
      ["Mon 09:10", "customer", "Instant reply to maria.gonzalez@gmail.com (the typo fixed)"],
      ["Mon 09:40", "owner", "Maria wrote again: one conversation, no second reply"],
      ["Tue 10:00", "owner", "Bob left no usable email or phone: passed to you"],
      ["Tue 10:00", "customer", "Follow-up to Maria"],
      ["Tue 15:00", "stopped", "Maria replied: her follow-ups stop"],
      ["Wed 09:00", "customer", "Follow-up to Wei: waited for 9 a.m., not 9:15 p.m."],
      ["Fri 09:00", "customer", "Last follow-up to Wei, then no more"],
    ],
  },
  {
    slug: "invoice-reminders", tab: "Invoice reminders", title: "Invoice reminders for a cleaning company", who: "Cannon River Cleaning", kind: "cleaning company",
    service: { id: "invoices", name: "Invoices & payment reminders", price: "$350" },
    problem: "Invoices go out, a few go quiet, and chasing them is awkward and easy to forget. Money sits unpaid for weeks.",
    built: [
      "Reads the open-invoices export from QuickBooks, Wave, Square or a spreadsheet",
      "A friendly reminder 3, 7 and 14 days after the due date, on weekdays in business hours",
      "Partial payments shown plainly: “$100.00 of $180.00 left”",
      "At 30 days late, a note to the owner to step in, instead of a fourth email; a list of what’s owed every Monday",
    ],
    messy: [
      "Dates written as 10/02/2026, Oct 25 2026 or 2026-10-20",
      "Money written as “$1,240.00”; names typed “Chen, Wei”",
      "An impossible due date (13/45/2026) or a missing email: passed to the owner, never guessed",
      "The week the clocks change: reminders still go out at 9 a.m.",
    ],
    numbers: [["6", "usable invoices"], ["2", "bad rows passed to the owner"], ["6", "reminders"], ["2", "late notes to the owner"], ["2", "Monday lists"], ["0", "weekend emails"]],
    speed: "A 5,000-row invoice export read and checked in 0.18 seconds",
    fit: "Your invoicing tool’s own reminders are switched on first where they exist; this runs where they can’t, from the export you already have.",
    lines: [
      ["Mon 10:00", "owner", "Invoice 1046 has no email: passed to you, not guessed"],
      ["Mon 10:00", "owner", "Invoice 1047’s due date reads 13/45/2026: passed to you"],
      ["Mon 10:00", "customer", "Friendly reminder: invoice 1041, $1,240.00"],
      ["Mon 10:00", "customer", "Friendly reminder: invoice 1042, $100.00 of $180.00 left"],
      ["Mon 10:00", "owner", "Invoice 1048 is 36 days late: time for a personal call"],
      ["Mon 10:00", "owner", "This week: 4 late invoices, $2,410.50 owed"],
      ["Tue 10:00", "customer", "Second reminder: invoice 1042"],
      ["Sat 10:00", "quiet", "Weekend: no customer emails"],
      ["Mon 09:00", "customer", "Second reminder: invoice 1043 (9 a.m. after the clock change)"],
    ],
  },
  {
    slug: "review-requests", tab: "Review requests", title: "Review requests for a salon", who: "Juniper & Rose Salon", kind: "salon",
    service: { id: "reviews", name: "Review requests", price: "$250" },
    problem: "Happy clients mean to leave a review and forget, and asking in person feels awkward.",
    built: [
      "A short thank-you with the Google review link, 2 hours after each visit",
      "Never at night, never after a no-show or a cancellation",
      "At most once per person in 180 days, and never again after “stop”",
      "The same link for everyone: asking only happy clients is against Google’s rules",
    ],
    messy: [
      "ANA LIMA and Ana.Lima@Example.com are recognized as the same person",
      "“priya at example” isn’t an email, so it isn’t used",
      "A visit ending at 6:30 p.m. is followed up at 9 a.m. the next day",
    ],
    numbers: [["6", "visits"], ["3", "thank-yous"], ["3", "skipped"], ["0", "sent at night"]],
    speed: "5,000 visits checked in 0.08 seconds",
    fit: "Your booking tool’s own review requests are switched on first where it has them; this runs where it doesn’t, from its visit export or webhook.",
    lines: [
      ["Mon 13:00", "customer", "Thank-you with the review link to Ana, 2 hours after her visit"],
      ["Tue 09:00", "customer", "To Jordan: her visit ended 6:30 p.m., so it waited for morning"],
      ["Tue 12:00", "skipped", "Tom was a no-show: not asked"],
      ["Wed 14:00", "skipped", "Ana again: already asked this year"],
      ["Wed 15:00", "skipped", "Priya’s email reads “priya at example”: not used"],
      ["Wed 16:30", "customer", "Thank-you with the review link to Sam"],
    ],
  },
];

// The service a case study shows working, by service id (for "See it working" links).
export const caseFor = Object.fromEntries(examples.map((e) => [e.service.id, e.slug]));
