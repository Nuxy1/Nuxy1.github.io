// The sitemap search engines read (robots.txt points here): every page in src/pages, built with the site.
import type { APIRoute } from "astro";
import { examples } from "../data/examples";
import { demoSites } from "../data/demo-sites";
import { caseStudies, publishable } from "../data/case-studies";

// (pages marked noindex stay out: the thank-you page, the 404 page and the demonstration websites)
const unlisted = ["/contact/thanks/", "/404/", "/example-sites/"];
// (a page made from data, like work/[slug] or examples/[slug], is listed once per page it makes)
const paths = Object.keys(import.meta.glob("./**/*.{astro,md}"))
  .map((file) => file.slice(1).replace(/(index)?\.(astro|md)$/, "").replace(/([^/])$/, "$1/"))
  .filter((p) => !p.includes("[") && !unlisted.some((u) => p.startsWith(u)))
  .concat(examples.map((e) => `/work/${e.slug}/`))
  .concat(demoSites.map((d) => `/examples/${d.slug}/`))
  // a client project page only once it is published (never a staged one: those are noindex and stage-build only)
  .concat(caseStudies.filter((c) => publishable(c)).map((c) => `/portfolio/${c.slug}/`))
  .sort();

export const GET: APIRoute = ({ site }) =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `  <url><loc>${new URL(p, site)}</loc></url>`).join("\n")}\n</urlset>\n`,
    { headers: { "content-type": "application/xml" } },
  );
