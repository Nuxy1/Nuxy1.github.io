# nuxyautomation.com

The Nuxy Automation website: automation and website services for small service businesses, prices, demos, example
websites and a docs page for each technical project. Built with [Astro](https://astro.build) as static HTML with a
little plain JavaScript (menu, service finder, inquiry form, demos), and published by GitHub Pages on every push
(`.github/workflows/deploy.yml`).

```bash
npm install
npm run dev                  # http://localhost:4321
npm run build                # static site in dist/
```

## Where things live

- `src/data/services.ts`: every service, plan and price. No page types a Nuxy price; the tests check this.
- `src/data/`: site-wide public settings (`site.ts`, never a secret), the demo-website list (`demo-sites.ts`), the
  four working examples behind the demos and the case study (`examples.ts`), and real reviews only (`reviews.ts`,
  empty until there are some; the reviews section stays hidden while it is).
- `src/pages/`: one folder per page; `src/pages/docs/` holds the project docs, copied in by `scripts/sync-docs.mjs`.
- `src/pages/example-sites/`: demonstration websites for made-up businesses. Each is marked as a demo and not indexed.
- `src/layouts/`: `Base.astro` (the page frame, styles, menu and visit counting), `Doc.astro` (docs pages),
  `DemoSite.astro` (the demo websites).
- `DESIGN.md`: colours, type, layout, components and motion. `PRODUCT.md`: who the site is for and what it must say.

## Tests

Run against the production build in `dist/`, in a real browser, with nothing sent to other sites:

```bash
npm run build
INQUIRY_JS=<path to the inquiry service's src/inquiry.js> \
PLAYWRIGHT_CORE=<path to a playwright-core folder> BROWSER=<path to chrome.exe or msedge.exe> \
npm test
```

Each `tests/*.test.mjs` file says at the top what it checks and which of those settings it needs.

**Screenshots** (`tests/visual.test.mjs`, part of `npm test`): the first screen of eight main pages at 390 and 1440
pixels wide is compared with the saved pictures in `tests/visual/`. A failure writes the new screenshot and a
difference picture (changed pixels in red) to `tests/visual/out/`, which is not committed. After a change you meant to
make (new wording, a price, a colour), look at the difference pictures, then save new pictures and look at those too
before committing:

```bash
UPDATE_BASELINES=1 PLAYWRIGHT_CORE=... BROWSER=... node --test tests/visual.test.mjs
```

The pictures belong to one computer and browser (`tests/visual/setup.json`), because fonts are drawn slightly
differently elsewhere; a failure on another setup says so. On a new computer, save pictures from a build known to be
good first. The publishing workflow only builds the site, so these tests never block a deploy.

## Visit counting

The site counts page views and a few button clicks anonymously (see `/policies/`), and **only on its real address**
(the `site` in `astro.config.mjs`, with or without `www.`). Local previews, tests and copies of the site count nothing.
The contact-form test serves the build under the real name, pointed at this computer, to check the counting.

## Security policy

Every page carries a Content Security Policy (`security.csp` in `astro.config.mjs`; a `<meta>` tag, because GitHub
Pages can't send headers). Only scripts and styles Astro builds run, each listed by its hash, and the only outside
address a page may talk to is the inquiry service. Two rules follow:

- Write page scripts as plain `<script>` blocks. An `is:inline` script is blocked, and the tests fail on it.
- If the inquiry service moves (`inquiryUrl` or `hitUrl` in `src/data/site.ts`), change `INQUIRY_HOST` in
  `astro.config.mjs` too, or the browser blocks the form and the counts.

## Images

- **Example-website screenshots** (`public/images/examples/`) come from the demo pages themselves, at each width in
  `shotWidths` (`src/data/demo-sites.ts`) so phones download a small one. After changing or adding a demo website:

  ```bash
  npm run build
  PLAYWRIGHT_CORE=<path to a playwright-core folder> BROWSER=<path to chrome.exe or msedge.exe> node scripts/example-shots.mjs
  npm run build
  ```

  It needs `ffmpeg` with WebP support. Look at the new pictures before committing.
- **The four `/work/` videos** come from `media/demo-videos/render.mjs` in the Freelance repo (its header explains
  it). It writes each video, its captions and its WebP poster together, in the site's colours, mark and font. Re-run
  it after changing a service name or price that its end card shows, or the made-up business in a demo.
- **Other video posters** (`public/videos/*-poster.webp`) are WebP, made from a still frame:
  `ffmpeg -ss 1 -i video.mp4 -frames:v 1 -c:v libwebp -quality 80 -compression_level 6 video-poster.webp`
- New photos and pictures go in as WebP (or SVG), with `width` and `height` set, and `alt` text or `alt=""`.

## Docs pages

`scripts/sync-docs.mjs` copies each project's README in as a docs page (run it from the full portfolio folder
layout). `Doc.astro` puts every table in its own sideways-scrolling box, labelled with the heading above it, so a wide
table never widens the page on a phone. This is done in the layout, not with a Markdown plugin, because a plugin would
need another package installed.
