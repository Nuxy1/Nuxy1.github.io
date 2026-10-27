// Copies each portfolio project's README into src/pages/docs/<slug>.md as a docs page: frontmatter added, the first
// heading kept as the title, Mermaid diagrams (GitHub draws them, a static page doesn't) swapped for a note, and
// relative links pointed at the code on GitHub.  node scripts/sync-docs.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PROJECTS = [
  { slug: "webhook-relay", dir: "../webhook-relay", repo: "shopify-webhook-relay" },
  { slug: "code-steps", dir: "../code-steps", repo: "automation-code-steps" },
  { slug: "csv-cleaner", dir: "../csv-cleaner", repo: "csv-contact-cleaner" },
  { slug: "community-bot", dir: "../stream-community-bot", repo: "stream-community-bot" },
];

for (const p of PROJECTS) {
  let md = readFileSync(join(p.dir, "README.md"), "utf8");
  const title = /^#\s+(.+)$/m.exec(md)?.[1] ?? p.slug;
  const description = md.split("\n").find((line) => line.trim() && !line.startsWith("#") && !line.startsWith("!"))?.trim() ?? "";
  md = md.replace(/^#\s+.+\n/m, `# ${title}\n`)
    .replace(/```mermaid[\s\S]*?```/g, "*(Diagram: see the README on GitHub.)*")
    .replace(/!\[([^\]]*)\]\(docs\/demo\.gif\)/g, "![$1](/relay-demo.gif)")
    .replace(/\]\((?!https?:|#|\/)([^)]+)\)/g, `](https://github.com/Nuxy1/${p.repo}/blob/main/$1)`);
  const front = `---\nlayout: ../../layouts/Doc.astro\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description.slice(0, 200))}\nrepo: ${p.repo}\n---\n\n`;
  writeFileSync(join("src/pages/docs", `${p.slug}.md`), front + md);
  console.log(`docs/${p.slug}.md <- ${p.dir}/README.md`);
}
