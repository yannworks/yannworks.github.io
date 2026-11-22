// Measures what the living dots cost on a slow phone: Chrome slowed down 4 times
// (CDP CPU throttling), a 390 x 844 touch screen. Two places on the page, each
// for 10 s, with the animation on and with reduced motion (dots still):
//   - the active card's strip on screen (Flow);
//   - the end of the page on screen (Drift).
// Prints, for each: script time per step of the dots (mean and worst, from
// DOTS.stats), and the share of the main thread busy (CDP TaskDuration) and
// spent in scripts (ScriptDuration) over the 10 s.
//
// Run once: npm install --no-save playwright   (node_modules/ is ignored by git)
// Then:     node tools/measure-dots.mjs

import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
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
const URL_ = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ channel: "chrome" });
const SECONDS = 10;

async function measure(place, reduced) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await page.goto(URL_, { waitUntil: "load" });
  await page.waitForSelector(".showcase.is-live");
  await page.waitForTimeout(2500);                          // print, components, Clawd's walk are over
  await page.evaluate((place) => {
    if (place === "card") {
      const strip = document.querySelector(".showcase__item.is-active .fringe").getBoundingClientRect();
      scrollTo(0, scrollY + strip.bottom - innerHeight + 40);
    } else scrollTo(0, document.body.scrollHeight);
  }, place);
  await page.waitForTimeout(1500);                          // Clawd may walk once at the bottom: let him finish
  if (place === "end") await page.waitForTimeout(9000);     // ... and settle (his idle lasts 8 s)
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Performance.enable");
  const before = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  await page.evaluate(() => { DOTS.stats.steps = 0; DOTS.stats.ms = 0; DOTS.stats.worst = 0; });
  await page.waitForTimeout(SECONDS * 1000);
  const after = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  const stats = await page.evaluate(() => ({ ...DOTS.stats }));
  await context.close();
  const share = (k) => (((after[k] - before[k]) / SECONDS) * 100).toFixed(1) + " %";
  return { place, reduced, steps: stats.steps, perStep: stats.steps ? (stats.ms / stats.steps).toFixed(2) + " ms" : "-",
    worst: stats.worst.toFixed(2) + " ms", busy: share("TaskDuration"), script: share("ScriptDuration") };
}

console.log(`phone 390 x 844, CPU slowed 4 x, ${SECONDS} s each`);
for (const place of ["card", "end"]) {
  for (const reduced of [false, true]) {
    const r = await measure(place, reduced);
    console.log(`${r.place.padEnd(4)} ${r.reduced ? "reduced (still)" : "animated       "}  steps ${String(r.steps).padStart(3)}, script per step ${r.perStep.padStart(8)} (worst ${r.worst}), main thread busy ${r.busy}, in scripts ${r.script}`);
  }
}
await browser.close();
server.close();
