// Multi-step forms (quote, booking, estimate, checkout). Markup it expects inside the form:
//   [data-step]           one per step (a fieldset or section); all show without JavaScript
//   [data-step-title]     the heading in each step (it gets focus when the step opens)
//   [data-next] [data-back]  buttons; [data-next] checks the step's fields first
//   [data-progress]       a list whose items match the steps (aria-current="step" on the open one)
//   [data-step-status]    a polite live region: "Step 2 of 5: Property"
//   [data-answer]         optional, inside a progress button: `answer(i)` writes the step's answer there once the step has
//                         been left, so the tracker reads as a summary and a click goes straight back to that answer
// The browser's own validity rules decide whether a step can be left; `check` can add one more rule per step.
export type Stepper = { go(i: number, focus?: boolean): void; reset(focus?: boolean): void; readonly at: number; readonly count: number };

export function stepper(form: HTMLElement, opts: { check?: (i: number) => string | null; onStep?: (i: number) => void; answer?: (i: number) => string } = {}): Stepper {
  const steps = [...form.querySelectorAll<HTMLElement>("[data-step]")];
  const marks = [...form.querySelectorAll<HTMLElement>("[data-progress] > li")];
  const status = form.querySelector<HTMLElement>("[data-step-status]");
  // each button's own label: its text without the aria-hidden number and the answer (the name may be bare text or
  // wrapped in its own element)
  const labels = marks.map((m) => {
    const b = m.querySelector("button")?.cloneNode(true) as HTMLElement | undefined;
    b?.querySelectorAll("[aria-hidden], [data-answer]").forEach((n) => n.remove());
    return (b?.textContent ?? "").replace(/\s+/g, " ").trim();
  });
  let at = 0, reached = 0;
  form.classList.add("is-stepped");
  // the steps check their own fields (flag() below), so the final submit must reach the page's handler: it calls
  // firstInvalid() + flag(). Without JavaScript none of this runs and the browser's own checks stay on.
  if (form instanceof HTMLFormElement) form.noValidate = true;

  const title = (s: HTMLElement) => s.querySelector<HTMLElement>("[data-step-title]") ?? s;
  // answers show on every step that has been passed (behind or ahead of the open one), never on the open one or on the
  // furthest step, which was opened but not finished
  const paint = () => marks.forEach((m, n) => {
    const b = m.querySelector("button"), out = m.querySelector<HTMLElement>("[data-answer]");
    if (!b || !out) return;
    const a = n < reached && n !== at ? (opts.answer?.(n) ?? "").trim() : "";
    out.textContent = a;
    // the answer is drawn under the label; the button is named "Service, Mowing" so both are read, with a pause
    if (a) b.setAttribute("aria-label", `${labels[n]}, ${a}`); else b.removeAttribute("aria-label");
  });
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
    paint();
    // the tracker's short name ("Property"); the step's heading when a form has no tracker
    const name = labels[at] || (title(steps[at]).textContent?.trim() ?? "");
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
    // a step-wide message (no one field to point at) uses the line in its own place, under the whole step
    // (it no longer speaks for a field, so a field fixed later does not wipe it)
    if (out) { placeBack(out); owner.delete(out); out.textContent = msg ?? ""; }
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
  // a change inside a step can change another step's answer (a new service drops a frequency); the page's own change
  // handler runs after this one, so the tracker repaints on the next task
  form.addEventListener("change", () => setTimeout(paint));
  go(0, false);
  // a restart forgets how far the last run got, so the tracker does not offer answers from a form that was just cleared
  const reset = (focus = true) => { reached = 0; go(0, focus); };
  return { go, reset, get at() { return at; }, get count() { return steps.length; } };
}

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
// where each step's error line sits in the markup (under the step), the field it is speaking for, each field's own
// aria-describedby (its hints) from before it was flagged, and the listener waiting for a flagged field to be fixed
const home = new WeakMap<HTMLElement, [Node, Node | null]>();
const owner = new WeakMap<HTMLElement, Element>();
const desc = new WeakMap<Element, string | null>();
const waiting = new WeakMap<Element, [EventTarget, () => void]>();

/** Puts a step's error line back in its own place under the step. */
function placeBack(out: HTMLElement) {
  const h = home.get(out);
  if (!h) return;
  const [parent, next] = h;
  parent.insertBefore(out, next && next.parentNode === parent ? next : null);
  out.style.removeProperty("grid-column");
  out.style.removeProperty("flex-basis");
  home.delete(out);
}

/** The field's own block in its step: the largest element around it that holds no other question (a radio group's
 *  options are one question), widened to the whole row when another block sits beside it on screen. */
function blockOf(field: Field, step: HTMLElement) {
  const same = (x: Field) => x === field || (!!field.name && x.name === field.name);
  const other = (el: Element) => [...el.querySelectorAll<Field>("input, select, textarea")].some((x) => !same(x) && x.type !== "hidden");
  let a: HTMLElement = field;
  while (a.parentElement && a.parentElement !== step && !other(a.parentElement)) a = a.parentElement;
  const beside = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return [...(el.parentElement?.children ?? [])].some((s) => {
      if (s === el) return false;
      const q = s.getBoundingClientRect();
      return q.height > 0 && q.top < r.bottom - 1 && q.bottom > r.top + 1;
    });
  };
  while (a.parentElement && a.parentElement !== step && beside(a)) a = a.parentElement;
  return a;
}

/** Says what is wrong with a field in its step's [data-step-error] line (role="alert", so it is read out), marks the
 *  field aria-invalid and focuses it. The words come from the field's data-error, else the browser's own message.
 *  The line moves next to the field (under a text field, above a group's options) so on a phone it shows beside the
 *  question, not at the bottom of a long step; a group's block gets data-invalid for the site's own outline. The
 *  field keeps its hints in aria-describedby, with the line added. Once the field is fixed everything goes back.
 *  (The browser's bubble alone fades and looks different everywhere.) */
export function flag(field: Field) {
  const step = field.closest<HTMLElement>("[data-step]");
  const out = step?.querySelector<HTMLElement>("[data-step-error]") ?? null;
  const isGroup = field instanceof HTMLInputElement && (field.type === "radio" || field.type === "checkbox") && !!field.name;
  const group: Field[] = isGroup && step ? [...step.querySelectorAll<HTMLInputElement>(`input[name="${CSS.escape(field.name)}"]`)] : [field];
  const block = step ? blockOf(field, step) : null;
  const marked = isGroup && block && block !== field ? block : null;
  if (out) {
    if (block) {
      if (!home.has(out)) home.set(out, [out.parentNode!, out.nextSibling]);
      const legend = marked?.firstElementChild?.tagName === "LEGEND" ? marked.firstElementChild : null;
      if (legend) legend.after(out); else if (marked) marked.before(out); else block.after(out);
      // a block can sit in a grid or a wrapping row: the line takes a whole row of its own there
      out.style.gridColumn = "1 / -1";
      out.style.flexBasis = "100%";
    }
    owner.set(out, field);
    // a page's own setCustomValidity message (an out-of-area town, say) is more specific than the field's data-error
    out.textContent = field.validity.customError ? field.validationMessage : (field.dataset.error ?? field.validationMessage);
  }
  for (const f of group) {
    if (!desc.has(f)) desc.set(f, f.getAttribute("aria-describedby"));
    const ids = (desc.get(f) ?? "").split(/\s+/).filter((id) => id && id !== out?.id);
    if (out?.id) ids.push(out.id);
    if (ids.length) f.setAttribute("aria-describedby", ids.join(" "));
    f.setAttribute("aria-invalid", "true");
  }
  marked?.setAttribute("data-invalid", "");
  // the check waits for the page's own change handlers (they can set or lift a custom message), and listens on the
  // step, because picking a different option of a group fires on that option, not on the one flagged
  const scope: EventTarget = step ?? field;
  const prev = waiting.get(field);
  if (prev) { prev[0].removeEventListener("input", prev[1]); prev[0].removeEventListener("change", prev[1]); }
  const clear = () => setTimeout(() => {
    if (waiting.get(field)?.[1] !== clear || !field.checkValidity()) return;
    for (const f of group) {
      f.removeAttribute("aria-invalid");
      const d = desc.get(f);
      if (d) f.setAttribute("aria-describedby", d); else f.removeAttribute("aria-describedby");
      desc.delete(f);
    }
    marked?.removeAttribute("data-invalid");
    if (out && owner.get(out) === field) { out.textContent = ""; owner.delete(out); placeBack(out); }
    scope.removeEventListener("input", clear);
    scope.removeEventListener("change", clear);
    waiting.delete(field);
  });
  waiting.set(field, [scope, clear]);
  scope.addEventListener("input", clear);
  scope.addEventListener("change", clear);
  field.focus();
  // focus brings the field into view; make sure its message is in view too
  if (out) {
    const r = out.getBoundingClientRect();
    if (r.bottom > innerHeight || r.top < 0) out.scrollIntoView({ block: "nearest" });
  }
}

/** One-page demo forms (contact, waitlist, gift): the same inline message as the steppers. Wrap the fields and one
 *  [data-step-error] line (role="alert") in a [data-step] element. On submit the first invalid field is flagged and
 *  focused and the page's own submit handler (layouts/DemoSite) never runs; the line clears when the field is fixed.
 *  Without JavaScript the browser's own checks stay on, as in stepper(). */
export function inlineErrors(form: HTMLFormElement) {
  form.noValidate = true;
  form.addEventListener("submit", (e) => {
    const bad = firstInvalid(form);
    if (!bad) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    flag(bad);
  }, true);
}

/** Every step's fields valid (used before the final submit, in case a field changed after its step). */
export function firstInvalid(form: HTMLElement) {
  return [...form.querySelectorAll<HTMLInputElement>("[data-step] input, [data-step] select, [data-step] textarea")].find((f) => !f.disabled && !f.checkValidity()) ?? null;
}
