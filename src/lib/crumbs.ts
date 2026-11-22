// A page's breadcrumb trail as schema.org data, for the <script type="application/ld+json"> in its head. The trail
// starts at Home and follows the links the page shows (site audit 2026-11-21, finding 15: the example, docs and demo
// pages had none). Paths are the site's own ("/docs/"), made absolute on the live domain.
const site = "https://nuxyautomation.com";

export function crumbs(trail: [name: string, path: string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [["Home", "/"], ...trail].map(([name, path], i) => ({
      "@type": "ListItem", position: i + 1, name, item: `${site}${path}`,
    })),
  };
}
