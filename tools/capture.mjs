// Full-page screenshots of a page of this site, in every variant a mission needs.
//
// Run once: npm install --no-save playwright   (node_modules/ is ignored by git)
// Then:     node tools/capture.mjs <out dir> [page] [options]
//   page      path inside this folder, default "index.html" (a query string is allowed)
//   --widths  comma-separated, default 390,1440
//   --themes  light,dark (default both)
//   --reduced also take reduced-motion shots
//   --nojs    also take shots without JavaScript
//   --prefix  file name prefix, default "page"
// Phones (under 768 px) are emulated as touch devices, with a window as tall as the
// page, because Chrome drops touch emulation in a "full page" screenshot.
// Prints console errors and horizontal overflow for every shot.

import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".webp": "image/webp" };

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && ["--widths", "--themes", "--prefix"].includes(args[i - 1])));
const OUT = positional[0];
const PAGE = positional[1] || "index.html";
if (!OUT) { console.error("usage: node tools/capture.mjs <out dir> [page] [--widths 390,1440] [--reduced] [--nojs]"); process.exit(1); }
const WIDTHS = opt("--widths", "390,1440").split(",").map(Number);
const THEMES = opt("--themes", "light,dark").split(",");
const PREFIX = opt("--prefix", "page");

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(req.url.split("?")[0]);
  if (path.endsWith("/")) path += "index.html";
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" }).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const BASE = `http://127.0.0.1:${server.address().port}/`;
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });

async function shot({ width, theme, reduced = false, js = true, name }) {
  const phone = width < 768;
  const context = await browser.newContext({
    viewport: { width, height: phone ? 844 : 900 },
    deviceScaleFactor: 2,
    isMobile: phone, hasTouch: phone,
    colorScheme: theme || "light",
    reducedMotion: reduced ? "reduce" : "no-preference",
    javaScriptEnabled: js,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  if (theme) await page.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch (e) {} }, theme);
  await page.goto(BASE + PAGE, { waitUntil: "load" });
  // Walk down the page so anything loaded on scroll arrives, then come back up.
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(120); }
  await page.waitForTimeout(1500);
  await page.evaluate(() => scrollTo(0, 0));
  const full = await page.evaluate(() => document.documentElement.scrollHeight);
  // Phones: a window as tall as the page keeps touch emulation. Wide screens keep a
  // 900 px window (the page has full-height parts) and take a full-page shot.
  if (phone) await page.setViewportSize({ width, height: full });
  await page.waitForTimeout(2500);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.screenshot({ path: join(OUT, name + ".png"), fullPage: !phone });
  console.log(`${name}: ${full}px tall, overflow ${overflow}px, errors ${errors.length ? errors.join(" | ") : 0}`);
  await context.close();
}

for (const width of WIDTHS) {
  for (const theme of THEMES) {
    await shot({ width, theme, name: `${PREFIX}-${width}-${theme}` });
    if (flag("--reduced")) await shot({ width, theme, reduced: true, name: `${PREFIX}-${width}-${theme}-reduced` });
  }
  if (flag("--nojs")) await shot({ width, theme: null, js: false, name: `${PREFIX}-${width}-nojs` });
}
await browser.close();
server.close();
