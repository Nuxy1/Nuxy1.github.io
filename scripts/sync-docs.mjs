// Copies each portfolio project's README into src/pages/docs/<slug>.md as a docs page: frontmatter added, the first
// heading kept as the title, Mermaid diagrams (GitHub draws them, a static page doesn't) swapped for a note, and
// relative links pointed at the code on GitHub. `meta` is the page's search description (about 160 characters at most);
// without it, the README's first paragraph is shortened.  node scripts/sync-docs.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PROJECTS = [
  { slug: "small-business-automations", dir: "../small-business-automations", repo: "small-business-automations",
    meta: "Four working automations for made-up local businesses: booking reminders, lead follow-up, invoice reminders and review requests, with tests and a demo week." },
  { slug: "webhook-relay", dir: "../webhook-relay", repo: "shopify-webhook-relay",
    meta: "Every new Shopify order lands as a clean row in a Google Sheet and pings your team on Discord or Slack: within seconds, never twice, never silently lost." },
  { slug: "code-steps", dir: "../code-steps", repo: "automation-code-steps",
    meta: "Small, tested code steps for Zapier, n8n and Make that fix messy data: phones typed five ways, names in CAPS, time zones, \"1.234,56 €\" and JSON line items." },
  { slug: "csv-cleaner", dir: "../csv-cleaner", repo: "csv-contact-cleaner",
    meta: "Clean a contact list before it goes into a CRM or email tool: safe fixes made, duplicates merged, anything doubtful set aside for a person, nothing guessed." },
  { slug: "community-bot", dir: "../stream-community-bot", repo: "stream-community-bot" },
];

// Search engines cut a meta description at about 160 characters: keep the whole sentences that fit, or cut the first
// one at a word and end it with an ellipsis.
function metaDescription(text, max = 158) {
  let out = "";
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if ((out + " " + sentence).trim().length > max) break;
    out = (out + " " + sentence).trim();
  }
  if (out) return out;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:–-]+$/, "") + "…";
}

for (const p of PROJECTS) {
  let md = readFileSync(join(p.dir, "README.md"), "utf8");
  const title = /^#\s+(.+)$/m.exec(md)?.[1] ?? p.slug;
  const description = md.split("\n").find((line) => line.trim() && !line.startsWith("#") && !line.startsWith("!"))?.trim() ?? "";
  md = md.replace(/^#\s+.+\n/m, `# ${title}\n`)
    .replace(/```mermaid[\s\S]*?```/g, "*(Diagram: see the README on GitHub.)*")
    // the relay README's 35-second GIF becomes a silent video that waits for Play (WCAG 2.2.2) and loads a fifth of the bytes
    .replace(/!\[([^\]]*)\]\(docs\/demo\.gif\)/g, (_, alt) => `<figure class="doc-video"><video src="/videos/relay-demo.mp4" poster="/videos/relay-demo-poster.webp" width="800" height="450" controls muted playsinline preload="none"></video><figcaption>${alt}. 35 seconds, no sound.</figcaption></figure>`)
    .replace(/\]\((?!https?:|#|\/)([^)]+)\)/g, `](https://github.com/Nuxy1/${p.repo}/blob/main/$1)`);
  const front = `---\nlayout: ../../layouts/Doc.astro\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(p.meta ?? metaDescription(description))}\nrepo: ${p.repo}\n---\n\n`;
  writeFileSync(join("src/pages/docs", `${p.slug}.md`), front + md);
  console.log(`docs/${p.slug}.md <- ${p.dir}/README.md`);
}
