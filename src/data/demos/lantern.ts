// Lantern Row Barbers: a fictional barber shop (data/demo-sites.ts). Every name, price, person, time and quote here
// is invented for the demonstration. The booking calendar is a fixed pattern (no random numbers), so the same day
// always looks the same and the tests can rely on it.
export const base = "/example-sites/lantern-row-barbers";
export const phone = "(507) 555-0187";
export const email = "hello@lanternrow.example";
export const address = "112 Lantern Row";
export const callNote = `Demo: on a real site this button calls the shop at ${phone}.`;
export const directionsNote = "Demo: on a real site this opens directions in your maps app.";

export const nav = [
  { href: `${base}/services/`, label: "Services" },
  { href: `${base}/barbers/`, label: "Barbers" },
  { href: `${base}/gallery/`, label: "Gallery" },
  { href: `${base}/contact/`, label: "Visit" },
];

// getDay() numbers: 0 Sunday ... 6 Saturday
export const hours = [
  { day: "Monday", d: 1, open: null },
  { day: "Tuesday", d: 2, open: "9:00 am – 7:00 pm" },
  { day: "Wednesday", d: 3, open: "9:00 am – 7:00 pm" },
  { day: "Thursday", d: 4, open: "9:00 am – 7:00 pm" },
  { day: "Friday", d: 5, open: "9:00 am – 7:00 pm" },
  { day: "Saturday", d: 6, open: "9:00 am – 5:30 pm" },
  { day: "Sunday", d: 0, open: null },
] as const;
export const openDay = (d: number) => d >= 2 && d <= 6;

export type ServiceId = "classic" | "fade" | "combo" | "beard" | "kids";
/** `photo` is the menu board's preview (data/demo-photos.json); `shows` says what that photo is of, since it is a
 *  generated style photo made for the demo, not a client. */
export const services: { id: ServiceId; name: string; price: number; mins: number; note: string; includes: string[]; photo: string; shows: string }[] = [
  { id: "classic", name: "Classic Cut", price: 35, mins: 30, note: "Scissor or clipper, washed and styled", includes: ["Consultation in the chair", "Wash, cut and style", "Neck shave with a hot lather"], photo: "lantern-part", shows: "A side part, combed over with light pomade" },
  { id: "fade", name: "Skin Fade", price: 40, mins: 40, note: "Blended to the skin, finished with a razor line", includes: ["Fade at the height you choose", "Scissor work on top", "Razor-sharp line-up"], photo: "lantern-fade", shows: "A drop fade under a curly top" },
  { id: "combo", name: "Cut + Beard", price: 50, mins: 50, note: "Any cut with a full beard shape", includes: ["Any haircut on the menu", "Beard shaped and lined", "Hot towel and beard oil"], photo: "lantern-beard", shows: "A full beard, squared at the jaw" },
  { id: "beard", name: "Beard Trim", price: 20, mins: 20, note: "Lined, shaped and oiled", includes: ["Length taken down evenly", "Cheek and neck lines by razor", "Beard oil finish"], photo: "lantern-tools", shows: "The straight razor, strop and hot towel behind every beard trim" },
  { id: "kids", name: "Kids Cut", price: 28, mins: 25, note: "12 and under, with a little patience", includes: ["Any style, kept simple", "A booster seat if needed", "No rush, no fuss"], photo: "lantern-crop", shows: "A textured crop. Kids get the same cut, sized down." },
];
export const serviceById = Object.fromEntries(services.map((s) => [s.id, s])) as Record<ServiceId, (typeof services)[number]>;

export type BarberId = "marcus" | "eli" | "julian";
export const barbers: { id: BarberId; name: string; chair: number; years: number; known: string; styles: string[]; line: string; tone: string }[] = [
  { id: "marcus", name: "Marcus", chair: 1, years: 12, known: "Skin fades and sharp line-ups", styles: ["fades", "beard"], line: "Fast hands, clean blends. Ask for the drop fade.", tone: "#c9a45c" },
  { id: "eli", name: "Eli", chair: 2, years: 7, known: "Textured crops and scissor work", styles: ["textured", "classic"], line: "Reads hair like a map. Curly and thick hair welcome.", tone: "#b9774a" },
  { id: "julian", name: "Julian", chair: 3, years: 21, known: "Classic cuts, beards and hot towels", styles: ["classic", "beard"], line: "Twenty-one years on Lantern Row. Books up first.", tone: "#8e9a7a" },
];
export const barberById = Object.fromEntries(barbers.map((b) => [b.id, b])) as Record<BarberId, (typeof barbers)[number]>;

// the shop's appointment times, every open day
export const slots = ["9:30", "10:15", "11:45", "1:30", "3:00", "4:45"] as const;
const am = (t: string) => +t.split(":")[0] >= 8 && +t.split(":")[0] < 12;
export const slotLabel = (t: string) => `${t} ${am(t) ? "am" : "pm"}`;

// "available today": the last open chairs on the board day (today, or the next open day once these have passed)
export const board: Record<BarberId, string[]> = { marcus: ["2:30"], eli: ["4:15"], julian: [] };
/** board times are 24-hour minutes so the page can tell when they have passed */
export const boardLatest = 14 * 60 + 30; // the board stays on today until Marcus's 2:30 has gone

/** Is this time already booked with this barber? day = 1.. for the open days after the board day (a fixed pattern:
 *  about a third of the times are gone, Julian is fully booked on the first of them, nobody has a day with fewer than
 *  two open times otherwise: two of the six times are gone for each barber each day). */
export function taken(barber: BarberId, day: number, slot: number): boolean {
  const b = barbers.findIndex((x) => x.id === barber);
  if (barber === "julian" && day === 1) return true;
  return (slot * 5 + b * 4 + day * 7) % 3 === 0;
}
/** The open times for a barber on a day (day 0 = the board day). */
export function openTimes(barber: BarberId, day: number): string[] {
  if (day === 0) return board[barber];
  return slots.filter((_, i) => !taken(barber, day, i));
}

export type Style = "fades" | "textured" | "beard" | "classic";
export const styleNames: Record<Style, string> = { fades: "Fades", textured: "Textured", beard: "Beard", classic: "Classic" };
// gallery: style examples, not clients. The four with `photo` have a generated style photo (back of the head, or a
// profile cropped below the eyes so no one is identifiable), used by the home page's style strip and the style book.
// `lengths` is the cut sheet the style book draws to scale: [where, as a barber says it, millimetres], from the neck up.
// Clipper guards: #1 is 3 mm, #2 is 6 mm, #3 is 10 mm, #4 is 13 mm.
export type Length = [zone: string, said: string, mm: number];
export const gallery: { id: string; name: string; style: Style; by: BarberId; note: string; service: ServiceId; lengths: Length[]; photo?: string }[] = [
  { id: "drop-fade", name: "Drop fade, curly top", style: "fades", by: "marcus", note: "Fade drops behind the ear; curls kept long on top.", service: "fade", lengths: [["Neck", "Skin", 0], ["Sides", "#1 to #2", 5], ["Top", "3 in", 76]], photo: "lantern-fade" },
  { id: "low-taper", name: "Low taper", style: "fades", by: "marcus", note: "Tapered at the temple and neck only. Grows out clean.", service: "fade", lengths: [["Neck", "#1", 3], ["Sides", "#4", 13], ["Top", "2 in", 51]] },
  { id: "high-skin", name: "High skin fade", style: "fades", by: "marcus", note: "Bald at the sides, short crop on top, hard part.", service: "fade", lengths: [["Neck", "Skin", 0], ["Sides", "Skin", 0], ["Top", "1 in", 25]] },
  { id: "crop", name: "Textured crop", style: "textured", by: "eli", note: "Choppy fringe, point-cut for movement.", service: "classic", lengths: [["Neck", "#2", 6], ["Sides", "#3", 10], ["Top", "1.5 in", 38]], photo: "lantern-crop" },
  { id: "quiff", name: "Messy quiff", style: "textured", by: "eli", note: "Scissor-cut length, matte clay, pushed up.", service: "classic", lengths: [["Neck", "#3", 10], ["Sides", "1 in", 25], ["Top", "3.5 in", 89]] },
  { id: "full-beard", name: "Full beard, shaped", style: "beard", by: "julian", note: "Squared at the jaw, cheek line by razor.", service: "combo", lengths: [["Neck", "Clean", 0], ["Cheek", "1 in", 25], ["Chin", "1.5 in", 38]], photo: "lantern-beard" },
  { id: "short-boxed", name: "Short boxed beard", style: "beard", by: "marcus", note: "Even half-inch, crisp neck line.", service: "beard", lengths: [["Neck", "Clean", 0], ["Cheek", "½ in", 13], ["Chin", "½ in", 13]] },
  { id: "side-part", name: "Side part", style: "classic", by: "julian", note: "Combed over with a light pomade, tapered sides.", service: "classic", lengths: [["Neck", "#2", 6], ["Sides", "#3", 10], ["Top", "3 in", 76]], photo: "lantern-part" },
  { id: "pompadour", name: "Pompadour", style: "classic", by: "julian", note: "Volume at the front, swept back, scissor-over-comb.", service: "classic", lengths: [["Neck", "#2", 6], ["Sides", "1 in", 25], ["Top", "4.5 in", 114]] },
];


export const policies = [
  ["Running late?", "Reply to your reminder text. Up to 10 minutes late we still do the full cut; after that we may shorten it or move you."],
  ["Cancelling", "Cancel or move from the link in your text, any time up to two hours before. Your slot goes straight to the cancellation list."],
  ["Walk-ins", "Welcome until 4 pm whenever a chair is free. Booked clients go first, so booking is the surest way in."],
  ["Paying", "Card, tap or cash in the shop. No booking fee and no deposit."],
] as const;
/** The two house rules the booking's last step repeats before Confirm: the rule sentence of "Running late?" and
 *  "Cancelling" above, word for word. Change them together. */
export const bookingRules = [
  [policies[0][0], "Up to 10 minutes late we still do the full cut; after that we may shorten it or move you."],
  [policies[1][0], "Cancel or move from the link in your text, any time up to two hours before."],
] as const;

/** The board day: today while the shop is open and Marcus's 2:30 has not gone, else the next open day. Visitor's
 *  own clock; dates only (no times kept). */
export function boardDay(now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (openDay(d.getDay()) && now.getHours() * 60 + now.getMinutes() < boardLatest) return d;
  do d.setDate(d.getDate() + 1); while (!openDay(d.getDay()));
  return d;
}
/** The booking calendar: the board day, then the next open days (six in all). */
export function bookingDays(now: Date, n = 6): Date[] {
  const out = [boardDay(now)];
  const d = new Date(out[0]);
  while (out.length < n) { d.setDate(d.getDate() + 1); if (openDay(d.getDay())) out.push(new Date(d)); }
  return out;
}
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
/** "Today", "Tomorrow" or "Wednesday" for the board; long form for the booking summary. */
export function dayName(d: Date, now: Date, long = false): string {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const rel = sameDay(d, now) ? "Today" : sameDay(d, tomorrow) ? "Tomorrow" : "";
  const date = d.toLocaleDateString("en-US", long ? { weekday: "long", month: "long", day: "numeric" } : { weekday: "long" });
  return long ? (rel ? `${rel}, ${date}` : date) : rel || date;
}
