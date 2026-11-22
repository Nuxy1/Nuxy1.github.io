// Lantern Row's opening hours, read two ways: whether the shop is open at a given moment (from the visitor's own
// clock; nothing is kept), and a short summary for the footer that groups days with the same hours.
export type Day = { readonly day: string; readonly d: number; readonly open: string | null };

const toMin = (s: string) => {
  const m = /(\d+):(\d+)\s*(am|pm)/.exec(s);
  if (!m) throw new Error(`not a time: ${s}`);
  return ((+m[1] % 12) + (m[3] === "pm" ? 12 : 0)) * 60 + +m[2];
};
const span = (open: string) => open.split("–").map((x) => x.trim()) as [string, string];

/** "Open now, until 7:00 pm" or "Closed now. Opens tomorrow at 9:00 am", for the moment `now`. */
export function openStatus(hours: readonly Day[], now: Date): { text: string; open: boolean; today: number } {
  const today = now.getDay();
  const t = now.getHours() * 60 + now.getMinutes();
  const h = hours.find((x) => x.d === today);
  if (h?.open) {
    const [a, b] = span(h.open);
    if (t >= toMin(a) && t < toMin(b)) return { text: `Open now, until ${b}`, open: true, today };
    if (t < toMin(a)) return { text: `Closed now. Opens today at ${a}`, open: false, today };
  }
  for (let i = 1; i <= 7; i++) {
    const next = hours.find((x) => x.d === (today + i) % 7);
    if (next?.open) return { text: `Closed now. Opens ${i === 1 ? "tomorrow" : next.day} at ${span(next.open)[0]}`, open: false, today };
  }
  return { text: "Closed", open: false, today };
}

const list = (days: string[]) => (days.length < 3 ? days.join(" and ") : `${days.slice(0, -1).join(", ")} and ${days.at(-1)}`);

/** Runs of neighbouring days with the same hours ("Tuesday to Friday"), then every closed day on one line. */
export function hoursSummary(hours: readonly Day[]): { days: string; open: string | null }[] {
  const runs: { first: string; last: string; open: string }[] = [];
  for (const h of hours) {
    if (!h.open) continue;
    const prev = runs.at(-1);
    const adjacent = prev && hours[hours.findIndex((x) => x.day === prev.last) + 1]?.day === h.day;
    if (prev && adjacent && prev.open === h.open) prev.last = h.day;
    else runs.push({ first: h.day, last: h.day, open: h.open });
  }
  const rows: { days: string; open: string | null }[] = runs.map((r) => ({
    days: r.first === r.last ? r.first : `${r.first} to ${r.last}`, open: r.open,
  }));
  const closed = hours.filter((h) => !h.open).map((h) => h.day);
  // the week as people say it: the weekend day before the Monday ("Sunday and Monday")
  const weekOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  if (closed.length) rows.push({ days: list(closed.sort((a, b) => weekOrder.indexOf(a) - weekOrder.indexOf(b))), open: null });
  return rows;
}
