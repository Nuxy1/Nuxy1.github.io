// Fernway Lawn & Landscape: a fictional landscaping company (data/demo-sites.ts). Every name, place, price, person
// and quote here is invented for the demonstration; the towns are made up and labelled so on the map.
import { SERVICES, type ServiceId } from "../../lib/demo/fernway-quote";

export const base = "/example-sites/fernway-lawn";
export const phone = "(507) 555-0142";
export const email = "hello@fernway.example";
export const callNote = `Demo: on a real site this button calls Fernway at ${phone}.`;
export const textNote = `Demo: on a real site this opens a text to ${phone}.`;

export const nav = [
  { href: `${base}/services/`, label: "Services" },
  { href: `${base}/projects/`, label: "Projects" },
  { href: `${base}/about/`, label: "About" },
  { href: `${base}/contact/`, label: "Contact" },
];

export const hours = [
  ["Monday–Friday", "7:00 am – 6:00 pm"],
  ["Saturday", "8:00 am – 2:00 pm"],
  ["Sunday", "Closed (snow calls only)"],
] as const;

export const serviceCopy: Record<ServiceId, { included: string[]; season: string; art: string }> = {
  mowing: { included: ["Mow at the right height for the season", "String-trim fences, beds and posts", "Blow clippings off drive and walks"], season: "April – October", art: "mow" },
  cleanup: { included: ["Leaves raked from lawn and beds", "Dead perennials cut back", "Gutters at ground level cleared"], season: "April and October", art: "leaf" },
  mulch: { included: ["Beds weeded and edged by spade", "Weed barrier where it's needed", "Two inches of shredded hardwood"], season: "May – June", art: "bed" },
  hedge: { included: ["Sides and top shaped with hand shears", "Inside dead wood thinned", "Cuttings raked and hauled"], season: "June and September", art: "hedge" },
  planting: { included: ["A short plan you approve first", "Plants chosen for sun, soil and deer", "Planted, mulched and watered in"], season: "May – September", art: "plant" },
  snow: { included: ["Drive and walks after 2 inches", "Steps shovelled by hand", "Ice melt on request"], season: "November – March", art: "snow" },
};
export const serviceList = (Object.keys(SERVICES) as ServiceId[]).map((id) => ({ id, ...SERVICES[id], ...serviceCopy[id] }));

// the 25-mile service area: map coordinates are on a 400 x 400 plan centred on the yard (200, 200); 8 px = 1 mile
export const towns = [
  { id: "alder-bend", name: "Alder Bend", x: 150, y: 120, miles: 11, minutes: 18, days: "Mon & Thu" },
  { id: "quarry-hill", name: "Quarry Hill", x: 296, y: 154, miles: 13, minutes: 21, days: "Tue & Fri" },
  { id: "millbrook", name: "Millbrook Flats", x: 238, y: 262, miles: 9, minutes: 14, days: "Every weekday" },
  { id: "sorrel-creek", name: "Sorrel Creek", x: 92, y: 236, miles: 14, minutes: 24, days: "Wed" },
  { id: "juniper-point", name: "Juniper Point", x: 320, y: 300, miles: 18, minutes: 29, days: "Thu" },
  { id: "oak-hollow", name: "Oak Hollow", x: 196, y: 52, miles: 19, minutes: 31, days: "Mon" },
] as const;

export const testimonials = [
  { quote: "The text the night before is the best part. I know the gate needs to be open and the dog inside.", who: "Homeowner, weekly mowing", where: "Alder Bend" },
  { quote: "Sent three photos on Sunday, had a price Monday morning and a crew on Wednesday.", who: "Homeowner, fall cleanup", where: "Millbrook Flats" },
  { quote: "Same two people every week, and they noticed the sprinkler head before I did.", who: "Homeowner, seasonal plan", where: "Quarry Hill" },
];

export const faqs = [
  ["Do you need to see the yard before quoting?", "Usually not. A few photos and the lot size are enough for most jobs. For large properties or new plantings we book a 15-minute visit."],
  ["What if it rains on my day?", "We text you the evening before with the new day. Mowing moves to the next dry day; nothing is skipped without a message."],
  ["Do I need to be home?", "No. Leave the gate unlatched and tell us about pets in the quote form. You get a photo when the job is done."],
  ["How do I pay?", "A card on file is charged after each visit, or a seasonal plan in monthly payments. You get a receipt by email."],
  ["Can I pause a weekly plan?", "Yes, for vacations or a dry spell. Pause from the link in any reminder text."],
] as const;

export const projects = [
  { id: "backyard", title: "Overgrown backyard to a weekly lawn", place: "Alder Bend", work: ["First cut and haul-away", "Edged beds", "Weekly mowing"], time: "One day, then weekly", art: "backyard" },
  { id: "front-bed", title: "Bare front bed, planted and mulched", place: "Quarry Hill", work: ["Bed shaped", "12 perennials, 3 shrubs", "Shredded hardwood mulch"], time: "Two days", art: "bed" },
  { id: "fall", title: "Fall cleanup before the first snow", place: "Millbrook Flats", work: ["Leaves off lawn and beds", "Perennials cut back", "Last mow"], time: "Half a day", art: "fall" },
  { id: "hedge", title: "Shaggy hedge row, shaped by hand", place: "Sorrel Creek", work: ["40 ft of boxwood", "Dead wood thinned", "Cuttings hauled"], time: "Five hours", art: "hedge" },
] as const;
