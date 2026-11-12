// Multi-step forms (quote, booking, estimate, checkout). Markup it expects inside the form:
//   [data-step]           one per step (a fieldset or section); all show without JavaScript
//   [data-step-title]     the heading in each step (it gets focus when the step opens)
//   [data-next] [data-back]  buttons; [data-next] checks the step's fields first
//   [data-progress]       a list whose items match the steps (aria-current="step" on the open one)
//   [data-step-status]    a polite live region: "Step 2 of 5: Property"
// The browser's own validity rules decide whether a step can be left; `check` can add one more rule per step.
export type Stepper = { go(i: number, focus?: boolean): void; readonly at: number; readonly count: number };

export function stepper(form: HTMLElement, opts: { check?: (i: number) => string | null; onStep?: (i: number) => void } = {}): Stepper {
  const steps = [...form.querySelectorAll<HTMLElement>("[data-step]")];
  const marks = [...form.querySelectorAll<HTMLElement>("[data-progress] > li")];
  const status = form.querySelector<HTMLElement>("[data-step-status]");
  let at = 0, reached = 0;
  form.classList.add("is-stepped");
  // the steps check their own fields (flag() below), so the final submit must reach the page's handler: it calls
  // firstInvalid() + flag(). Without JavaScript none of this runs and the browser's own checks stay on.
  if (form instanceof HTMLFormElement) form.noValidate = true;

  const title = (s: HTMLElement) => s.querySelector<HTMLElement>("[data-step-title]") ?? s;
  const go = (i: number, focus = true) => {
    at = Math.max(0, Math.min(steps.length - 1, i));
    reached = Math.max(reached, at);
    steps.forEach((s, n) => { s.hidden = n !== at; });
    marks.forEach((m, n) => {
      if (n === at) m.setAttribute("aria-current", "step"); else m.removeAttribute("aria-current");
      m.classList.toggle("done", n < at);
      const b = m.querySelector("button");
      if (b) b.disabled = n > reached || n === at;
    });
    const name = title(steps[at]).textContent?.trim() ?? "";
    if (status) status.textContent = `Step ${at + 1} of ${steps.length}: ${name}`;
    if (focus) {
      const t = title(steps[at]);
      if (!t.hasAttribute("tabindex")) t.tabIndex = -1;
      t.focus({ preventScroll: true });
      // the sticky demo header covers the top of the page; html's scroll-padding-top (DemoSite) is its height plus room,
      // so a form that starts under the header (step tracker hidden) also scrolls back into view
      const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const top = form.getBoundingClientRect().top;
      if (top < pad - 1 || top > innerHeight * 0.6) form.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
    opts.onStep?.(at);
  };
  const valid = (i: number) => {
    const fields = [...steps[i].querySelectorAll<HTMLInputElement>("input, select, textarea")].filter((f) => !f.disabled);
    const bad = fields.find((f) => !f.checkValidity());
    if (bad) { flag(bad); return false; }
    const msg = opts.check?.(i);
    const out = steps[i].querySelector<HTMLElement>("[data-step-error]");
    if (out) out.textContent = msg ?? "";
    if (msg) { (out ?? steps[i]).scrollIntoView({ block: "nearest" }); return false; }
    return true;
  };
  form.addEventListener("click", (e) => {
    const t = e.target as Element;
    if (t.closest("[data-next]")) { e.preventDefault(); if (valid(at)) go(at + 1); }
    else if (t.closest("[data-back]")) { e.preventDefault(); go(at - 1); }
    else {
      const m = t.closest<HTMLElement>("[data-progress] > li");
      if (m && t.closest("button")) { e.preventDefault(); go(marks.indexOf(m)); }
    }
  });
  // Enter in a text field moves on instead of submitting the whole form from the middle
  form.addEventListener("keydown", (e) => {
    const t = e.target as HTMLElement;
    if (e.key === "Enter" && t.matches("input:not([type=checkbox]):not([type=radio]):not([type=submit])") && at < steps.length - 1) {
      e.preventDefault();
      if (valid(at)) go(at + 1);
    }
  });
  go(0, false);
  return { go, get at() { return at; }, get count() { return steps.length; } };
}

/** Says what is wrong with a field in its step's [data-step-error] line (role="alert", so it is read out), marks the
 *  field aria-invalid and focuses it. The words come from the field's data-error, else the browser's own message; the
 *  line clears as soon as the field is changed. (The browser's bubble alone fades and looks different everywhere.) */
export function flag(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  const out = field.closest("[data-step]")?.querySelector<HTMLElement>("[data-step-error]");
  if (out) {
    out.textContent = field.dataset.error ?? field.validationMessage;
    if (out.id) field.setAttribute("aria-describedby", out.id);
  }
  field.setAttribute("aria-invalid", "true");
  const clear = () => {
    if (!field.checkValidity()) return;
    field.removeAttribute("aria-invalid");
    if (out) out.textContent = "";
    field.removeEventListener("input", clear);
    field.removeEventListener("change", clear);
  };
  field.addEventListener("input", clear);
  field.addEventListener("change", clear);
  field.focus();
}

/** Every step's fields valid (used before the final submit, in case a field changed after its step). */
export function firstInvalid(form: HTMLElement) {
  return [...form.querySelectorAll<HTMLInputElement>("[data-step] input, [data-step] select, [data-step] textarea")].find((f) => !f.disabled && !f.checkValidity()) ?? null;
}
