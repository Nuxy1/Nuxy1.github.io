// Title Case for headings that are built from data (approvals 85: every heading on Nuxy's own pages is in Title Case).
// The data itself keeps sentence case, because the same names appear in sentences, form answers and the inquiry
// service's own lists. Rules: small words stay lower case unless first or last or after ":" / "?" / "."; acronyms,
// prices, paths and brand words are left as written; each part of a hyphenated word is capitalised (except small
// words in the middle, as in Back-and-Forth); a heading of one sentence loses its full stop. The made-up demo businesses keep their
// own style, so this is not used on their pages.

const SMALL = new Set("a an the and but or nor for so yet as at by in of off on per to up via vs with from into".split(" "));
const KEEP: Record<string, string> = { ai: "AI", seo: "SEO", faq: "FAQ", faqs: "FAQs", csv: "CSV", crm: "CRM", nuxy: "Nuxy", "3d": "3D", url: "URL", ssl: "SSL", api: "API", diy: "DIY", i: "I", n8n: "n8n", pm: "pm", am: "am" };
// verb + particle pairs, where the particle is part of the verb ("Follow Up", not "Follow up")
const PARTICLE: [RegExp, string][] = [[/\b(Follow|Look|Set|Sign|Clean|Back|Moving|Looks|Pick|Check) (up|for|in|out|on)\b/g, ""]];

function word(w: string, force: boolean): string {
  const m = /^(["“‘(]*)(.*?)(["”’),:;.?!]*)$/.exec(w);
  if (!m) return w;
  const [, pre, core, post] = m;
  if (!core) return w;
  const low = core.toLowerCase();
  if (low in KEEP) return pre + KEEP[low] + post;
  if (core.includes("/") || core.replace(/\.+$/, "").includes(".") || core.startsWith("$")) return w;
  if (core.includes("-") && !core.startsWith("-")) {
    const parts = core.split("-");
    return pre + parts.map((p, i) => word(p, i === 0 || i === parts.length - 1 || !SMALL.has(p.toLowerCase()))).join("-") + post;
  }
  if (/[A-Z]/.test(core.slice(1)) || /^\d/.test(core)) return w; // acronyms, brand words, numbers: as written
  if (!force && SMALL.has(low)) return pre + low + post;
  return pre + core[0].toUpperCase() + core.slice(1) + post;
}

export function titleCase(s: string): string {
  const words = s.split(" ");
  let start = true;
  let t = words
    .map((w, i) => {
      const out = w ? word(w, start || i === words.length - 1) : w;
      start = /[.:?!—–]$/.test(w) || w === "—" || w === "–";
      return out;
    })
    .join(" ");
  for (const [re] of PARTICLE) t = t.replace(re, (_, v: string, p: string) => `${v} ${p[0].toUpperCase()}${p.slice(1)}`);
  if (t.endsWith(".") && !t.endsWith("...") && !/[.?!]\s/.test(t.slice(0, -1))) t = t.slice(0, -1);
  return t;
}
