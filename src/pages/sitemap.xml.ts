// The sitemap search engines read (robots.txt points here): every page in src/pages, built with the site.
import type { APIRoute } from "astro";
import { examples } from "../data/examples";

// (a page made from data, like work/[slug], is listed once per page it makes)
const paths = Object.keys(import.meta.glob("./**/*.{astro,md}"))
  .map((file) => file.slice(1).replace(/(index)?\.(astro|md)$/, "").replace(/([^/])$/, "$1/"))
  .filter((p) => !p.includes("["))
  .concat(examples.map((e) => `/work/${e.slug}/`))
  .sort();

export const GET: APIRoute = ({ site }) =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `  <url><loc>${new URL(p, site)}</loc></url>`).join("\n")}\n</urlset>\n`,
    { headers: { "content-type": "application/xml" } },
  );
