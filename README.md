# nuxy1.github.io

My portfolio site: services, projects, and a docs page for each project. Built with [Astro](https://astro.build) as plain static HTML (no client-side JavaScript), and published by GitHub Pages on every push.

```bash
npm install
node scripts/sync-docs.mjs   # copy each project's README in as a docs page (run from the portfolio folder layout)
npm run dev                  # http://localhost:4321
npm run build                # static site in dist/
```

- `src/pages/index.astro`: the home page (services, work, how I work)
- `src/pages/docs/`: one page per project, from its README
- `src/layouts/`: the page frame (light and dark from the system setting)
- `.github/workflows/deploy.yml`: build and publish to GitHub Pages
