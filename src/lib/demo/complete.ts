// Fills and opens a DemoComplete panel (components/demo/DemoComplete.astro). Rows are plain text, set with
// textContent, so nothing a visitor typed can become markup.
/** A summary row: label, value (a list prints one line per item), and an optional role the document styles:
 *  "lead" is the headline line (the estimate on a work order, the time on an appointment card), "total" the sum line. */
export type CompleteRow = [label: string, value: string | string[], role?: "lead" | "total"];

export function showComplete(panel: HTMLElement, rows: CompleteRow[], hide: HTMLElement[] = []) {
  const dl = panel.querySelector<HTMLElement>("[data-complete-summary]")!;
  dl.replaceChildren(...rows.filter(([, v]) => (Array.isArray(v) ? v.length : v)).map(([k, v, role]) => {
    const row = document.createElement("div");
    const dt = document.createElement("dt"), dd = document.createElement("dd");
    dt.textContent = k;
    if (Array.isArray(v)) dd.append(...v.map((line) => Object.assign(document.createElement("span"), { textContent: line })));
    else dd.textContent = v;
    if (role) row.dataset.role = role;
    row.append(dt, dd);
    return row;
  }));
  const date = panel.querySelector<HTMLElement>("[data-complete-date]");
  if (date) date.textContent = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  hide.forEach((h) => { h.hidden = true; });
  panel.hidden = false;
  panel.focus({ preventScroll: true });
  panel.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

/** Wire the panel's restart button. */
export function onRestart(panel: HTMLElement, restart: () => void) {
  panel.querySelector("[data-restart]")?.addEventListener("click", () => { panel.hidden = true; restart(); });
}

/** Wire the panel's optional "same again" button (DemoComplete's again prop): the flow reopens with its answers kept. */
export function onAgain(panel: HTMLElement, again: () => void) {
  panel.querySelector("[data-again]")?.addEventListener("click", () => { panel.hidden = true; again(); });
}
