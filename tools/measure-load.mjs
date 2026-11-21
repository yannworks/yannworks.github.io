// Measures how heavy the page is and how fast it opens, the way a phone on a
// slow mobile network would load it (Lighthouse's throttling: 150 ms round
// trip, 1.6 Mbit/s down). Every run starts with an empty cache.
//
// Run once: npm install --no-save playwright   (node_modules/ is ignored by git)
// Then:     node tools/measure-load.mjs [runs]          (default 7 runs)
// It serves this folder itself, gzipped like GitHub Pages, and prints the
// median of each number.
//
// "Opening" counts what the browser fetches before the visitor scrolls.
// "Showcase" scrolls to the bottom and counts what arrives on top of that,
// and when the three components are on screen.

import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const RUNS = Number(process.argv[2]) || 7;
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const ZIP = new Set([".html", ".css", ".js", ".json", ".svg"]);

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(req.url.split("?")[0]);
  if (path.endsWith("/")) path += "index.html";
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  try {
    let body = await readFile(file);
    const headers = { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" };
    if (ZIP.has(extname(file)) && /gzip/.test(req.headers["accept-encoding"] || "")) {
      body = gzipSync(body);
      headers["content-encoding"] = "gzip";
    }
    res.writeHead(200, headers).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const URL_ = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ channel: "chrome" });

async function once() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
  });
  const urls = new Map();
  const bytes = new Map();
  cdp.on("Network.requestWillBeSent", (e) => urls.set(e.requestId, e.request.url));
  cdp.on("Network.loadingFinished", (e) => bytes.set(e.requestId, e.encodedDataLength));
  await page.addInitScript(() => {
    window.__lcp = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });

  await page.goto(URL_, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const fcp = performance.getEntriesByName("first-contentful-paint")[0];
    return { dcl: nav.domContentLoadedEventEnd, load: nav.loadEventEnd, fcp: fcp ? fcp.startTime : 0, lcp: window.__lcp };
  });
  const sum = (filter) => {
    let total = 0, count = 0;
    for (const [id, n] of bytes) if (filter(urls.get(id) || "")) { total += n; count++; }
    return { total, count };
  };
  const opening = sum(() => true);
  const before = new Set(bytes.keys());

  // Scroll to the bottom, the way a visitor would, and wait for the components.
  const t0 = await page.evaluate(() => performance.now());
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const mounted = await page
    .waitForFunction(() => document.querySelector(".showcase.is-live"), null, { timeout: 15000 })
    .then(() => page.evaluate(() => performance.now()))
    .catch(() => null);
  await page.waitForTimeout(500);
  let extra = 0, extraCount = 0;
  for (const [id, n] of bytes) if (!before.has(id)) { extra += n; extraCount++; }

  await context.close();
  return { ...timing, opening: opening.total, requests: opening.count, extra, extraCount, mount: mounted === null ? null : mounted - t0 };
}

const runs = [];
for (let i = 0; i < RUNS; i++) runs.push(await once());
const median = (key) => {
  const values = runs.map((r) => r[key]).filter((v) => v !== null).sort((a, b) => a - b);
  return values.length ? values[Math.floor(values.length / 2)] : null;
};
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const ms = (n) => (n === null ? "n/a" : `${Math.round(n)} ms`);

console.log(`${RUNS} runs, phone 390 px, 150 ms RTT, 1.6 Mbit/s, empty cache, gzip; medians`);
console.log(`opening:  ${kb(median("opening"))} in ${median("requests")} requests`);
console.log(`          first paint ${ms(median("fcp"))}, largest paint ${ms(median("lcp"))}, DOM ready ${ms(median("dcl"))}, load ${ms(median("load"))}`);
console.log(`showcase: ${kb(median("extra"))} in ${median("extraCount")} more requests, components on screen ${ms(median("mount"))} after the scroll`);

await browser.close();
server.close();
