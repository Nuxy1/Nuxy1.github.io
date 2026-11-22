// The phone dock (the fixed pair of buttons at the bottom of a demo site) steps aside while the page's own buttons for
// the same actions are on screen: a page marks them with data-dock-cover, and the dock gets data-away while any of
// them is in view. Two "Book" buttons on one first screen say the same thing twice, and the dock would sit over the
// hero's photo or board. Without JavaScript, or on a page with nothing marked, the dock simply stays. It never hides
// while it holds keyboard focus, and the CSS hides it with visibility, so a hidden dock is also out of the tab order.
export function dockStepsAside(dock: HTMLElement | null): void {
  const covers = document.querySelectorAll("[data-dock-cover]");
  if (!dock || !covers.length || !("IntersectionObserver" in window)) return;
  const seen = new Set<Element>();
  const apply = () => dock.toggleAttribute("data-away", seen.size > 0 && !dock.contains(document.activeElement));
  // the first answer is measured now, so the dock does not slide away on load; the CSS animates only once data-live is set
  for (const c of covers) { const r = c.getBoundingClientRect(); if (r.width && r.bottom > 0 && r.top < innerHeight) seen.add(c); }
  apply();
  requestAnimationFrame(() => requestAnimationFrame(() => dock.setAttribute("data-live", "")));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target));
    apply();
  });
  covers.forEach((c) => io.observe(c));
  dock.addEventListener("focusout", apply);
}
