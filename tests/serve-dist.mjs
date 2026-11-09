// Serves dist/ the way GitHub Pages does: folder/ -> folder/index.html, and anything missing -> 404.html with a 404.
// Used by the browser tests; nothing here is a test itself (node --test runs only *.test.mjs).
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain", ".ico": "image/x-icon", ".json": "application/json", ".webmanifest": "application/manifest+json", ".mp4": "video/mp4", ".vtt": "text/vtt" };

export function serveDist(folder) {
  const dist = resolve(folder);
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([\\/])+/, "");
    let file = join(dist, path);
    if (file !== dist && !file.startsWith(dist + sep)) return res.writeHead(400).end();
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) {
      const page = join(dist, "404.html");
      return res.writeHead(404, { "content-type": TYPES[".html"] }).end(existsSync(page) ? readFileSync(page) : "Not found");
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () =>
    ok({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() })));
}
