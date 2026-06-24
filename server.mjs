// Zero-dependency static dev server for the Face2Face site.
// This IS the current dev server (referenced by package.json "dev"/"start") — not dead code.
// Usage: npm run dev   (or: node server.mjs)   — override port with PORT=4000 npm run dev
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

// Long-cache static media (no content-hashing here, so keep it modest); revalidate markup.
const LONG_CACHE = new Set([".webp", ".avif", ".jpg", ".jpeg", ".png", ".gif", ".ico", ".woff", ".woff2", ".svg"]);

// Baseline security headers (defense-in-depth; complements the in-page CSP).
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=(), interest-cohort=()",
};

const server = createServer(async (req, res) => {
  try {
    // Decode (filenames may contain spaces) and strip query string.
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";

    // Never serve private / archived / dependency dirs or dotfiles
    // (keeps things like _archive/ and the requirements screenshot off the web).
    if (/(^|[\\/])(_archive|node_modules|uploads)([\\/]|$)/i.test(urlPath) || /[\\/]\.[^\\/]/.test(urlPath)) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>404 Not Found</h1>");
      return;
    }

    // Resolve safely inside ROOT (block path traversal).
    const filePath = normalize(join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end("403 Forbidden");
      return;
    }

    const info = await stat(filePath).catch(() => null);
    const target = info && info.isDirectory() ? join(filePath, "index.html") : filePath;

    const body = await readFile(target);
    const ext = extname(target).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": LONG_CACHE.has(ext) ? "public, max-age=604800" : "no-cache",
      ...SECURITY_HEADERS,
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8", ...SECURITY_HEADERS });
    res.end("<h1>404 Not Found</h1>");
  }
});

server.listen(PORT, () => {
  console.log(`\n  Face2Face dev server running:\n  → http://localhost:${PORT}/\n\n  Press Ctrl+C to stop.\n`);
});
