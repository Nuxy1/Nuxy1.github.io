// Serves dist/ the way GitHub Pages does: folder/ -> folder/index.html, and anything missing -> 404.html with a 404.
// Used by the browser tests; nothing here is a test itself (node --test runs only *.test.mjs).
// Like Pages it answers a Range request with just that part of the file (206): a browser asks for video that way.
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain", ".ico": "image/x-icon", ".json": "application/json", ".webmanifest": "application/manifest+json", ".mp4": "video/mp4", ".webm": "video/webm", ".vtt": "text/vtt" };

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
    const body = readFileSync(file);
    const head = { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "accept-ranges": "bytes" };
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
    if (range && (range[1] || range[2])) {
      // ("bytes=500-" from 500 to the end, "bytes=-500" the last 500, "bytes=0-99" the first 100)
      const start = range[1] ? Number(range[1]) : Math.max(0, body.length - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
      if (start > end || start >= body.length) return res.writeHead(416, { "content-range": `bytes */${body.length}` }).end();
      return res.writeHead(206, { ...head, "content-range": `bytes ${start}-${end}/${body.length}`, "content-length": end - start + 1 }).end(body.subarray(start, end + 1));
    }
    res.writeHead(200, { ...head, "content-length": body.length }).end(body);
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () =>
    ok({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() })));
}
