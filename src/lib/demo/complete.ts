// Fills and opens a DemoComplete panel (components/demo/DemoComplete.astro). Rows are plain text, set with
// textContent, so nothing a visitor typed can become markup.
export function showComplete(panel: HTMLElement, rows: [string, string][], hide: HTMLElement[] = []) {
  const dl = panel.querySelector<HTMLElement>("[data-complete-summary]")!;
  dl.replaceChildren(...rows.filter(([, v]) => v).map(([k, v]) => {
    const row = document.createElement("div");
    const dt = document.createElement("dt"), dd = document.createElement("dd");
    dt.textContent = k; dd.textContent = v;
    row.append(dt, dd);
    return row;
  }));
  hide.forEach((h) => { h.hidden = true; });
  panel.hidden = false;
  panel.focus({ preventScroll: true });
  panel.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

/** Wire the panel's "Start again" button. */
export function onRestart(panel: HTMLElement, restart: () => void) {
  panel.querySelector("[data-restart]")?.addEventListener("click", () => { panel.hidden = true; restart(); });
}
