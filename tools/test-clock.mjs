// Tests the local time in the intro (js/clock.js) in a real browser, with
// emulated time zones and a fixed clock.
//
// Run once: npm install --no-save playwright   (node_modules/ is ignored by git)
// Then:     node tools/test-clock.mjs
// It uses the Chrome installed on the computer, serves this folder itself,
// prints one line per check and exits with an error if one fails.

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
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const URL_ = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ channel: "chrome" });
let failed = 0;
function check(name, got, want) {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : `\n     got:  ${JSON.stringify(got)}\n     want: ${JSON.stringify(want)}`}`);
}

// Opens the page for a visitor in `zone` with the clock stopped at `iso`.
async function open(zone, iso, options = {}) {
  const context = await browser.newContext({ timezoneId: zone, reducedMotion: options.reduced ? "reduce" : "no-preference" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  // Installed one second early, then paused at `iso`: installing at `iso` itself
  // failed now and then ("Cannot fast-forward to the past") when a few
  // milliseconds passed between the two calls.
  await page.clock.install({ time: new Date(Date.parse(iso) - 1000) });
  await page.clock.pauseAt(new Date(iso));
  await page.goto(URL_ + (options.query || ""));
  return { page, context, errors };
}
// No-break spaces are shown as plain spaces, to keep the expected sentences readable.
const plain = (text) => text.replace(/\u00a0/g, " ");
const clause = async (page) => plain(await page.locator(".intro .clock").textContent());
const intro = async (page) => plain(await page.locator(".intro").textContent()).replace(/\s+/g, " ").trim().split(". I like")[0];

// ---- One sentence per case: zones, daylight saving, half and quarter hours.
const CASES = [
  // [visitor zone, UTC instant, expected clause]
  ["Europe/Paris", "2026-11-21T20:41:00Z", ", where it's 21:41"],
  ["Europe/Berlin", "2026-11-21T20:41:00Z", ", where it's 21:41"],
  ["America/New_York", "2026-11-21T20:41:00Z", ", where it's 21:41 (6 hours ahead of you)"],
  ["Asia/Kolkata", "2026-11-21T20:41:00Z", ", where it's 21:41 (4½ hours behind you)"],
  ["Pacific/Auckland", "2026-11-21T20:41:00Z", ", where it's 21:41 (12 hours behind you)"],
  ["Asia/Kathmandu", "2026-11-21T20:41:00Z", ", where it's 21:41 (4 hours 45 minutes behind you)"],
  // Summer: Paris UTC+2, New York UTC-4, Auckland UTC+12 (its winter).
  ["America/New_York", "2026-07-01T10:00:00Z", ", where it's 12:00 (6 hours ahead of you)"],
  ["Pacific/Auckland", "2026-07-01T10:00:00Z", ", where it's 12:00 (10 hours behind you)"],
  // The weeks when only one side has changed the clocks: 5 hours, not 6.
  ["America/New_York", "2026-03-15T20:41:00Z", ", where it's 21:41 (5 hours ahead of you)"],
  ["America/New_York", "2026-10-28T20:41:00Z", ", where it's 21:41 (5 hours ahead of you)"],
  ["America/New_York", "2026-03-30T19:41:00Z", ", where it's 21:41 (6 hours ahead of you)"],
  // Paris changes its clocks at 01:00 UTC: 01:59 is followed by 03:00.
  ["Europe/Paris", "2026-03-29T00:59:00Z", ", where it's 01:59"],
  ["Europe/Paris", "2026-03-29T01:00:00Z", ", where it's 03:00"],
  // A visitor in London is one hour behind; on the change night too.
  ["Europe/London", "2026-03-29T00:59:00Z", ", where it's 01:59 (1 hour ahead of you)"],
  // Midnight in Paris (New York is still on the 21st).
  ["America/New_York", "2026-11-21T23:00:00Z", ", where it's 00:00 (6 hours ahead of you)"],
];
for (const [zone, iso, want] of CASES) {
  const { page, context, errors } = await open(zone, iso);
  check(`${zone} at ${iso}`, await clause(page), want);
  if (errors.length) check(`${zone}: no console errors`, errors.join(" | "), "");
  await context.close();
}

// ---- The <time> element and its machine-readable value.
{
  const { page, context } = await open("Asia/Kolkata", "2026-07-01T10:00:00Z");
  check("datetime attribute (summer)", await page.locator(".intro time").getAttribute("datetime"), "2026-07-01T12:00+02:00");
  check("one break point in the bracket, between amount and direction", (await page.locator(".intro .clock__gap").textContent()).trim().split(" ").length, 2);
  check("no live region on the clock", await page.locator(".intro [aria-live]").count(), 0);
  check("full sentence", await intro(page), "Hi, I'm Yann, a student living in France, where it's 12:00 (3½ hours behind you)");
  await context.close();
}

// ---- The minute changes on time, across midnight, with no layout shift.
{
  const { page, context, errors } = await open("America/New_York", "2026-11-21T22:59:59.000Z");
  await page.waitForTimeout(1200);                         // let the entrance finish (real time)
  const box = () => page.evaluate(() => {
    const r = (el) => { const b = el.getBoundingClientRect(); return [b.left, b.top, b.width].map((v) => Math.round(v * 10) / 10); };
    return { time: r(document.querySelector(".intro time")), kw: r(document.querySelector(".kw")) };
  });
  check("23:59 before midnight", await clause(page), ", where it's 23:59 (6 hours ahead of you)");
  const before = await box();
  await page.clock.runFor(990);
  check("still 23:59 at 59.99 s", await page.locator(".intro time").textContent(), "23:59");
  await page.clock.runFor(30);
  const during = await box();
  check("digits swapping right after the minute", await page.locator(".intro .clock__swap").count(), 4);
  await page.clock.runFor(400);
  check("00:00 after midnight", await page.locator(".intro time").textContent(), "00:00");
  check("swap cleaned up", await page.locator(".intro .clock__swap").count(), 0);
  const after = await box();
  check("time box left and top unchanged", JSON.stringify([during.time.slice(0, 2), after.time.slice(0, 2)]), JSON.stringify([before.time.slice(0, 2), before.time.slice(0, 2)]));
  check("time width unchanged within 0.1 px", Math.abs(after.time[2] - before.time[2]) <= 0.1 && Math.abs(during.time[2] - before.time[2]) <= 0.1, true);
  check("next keyword did not move", JSON.stringify([during.kw, after.kw]), JSON.stringify([before.kw, before.kw]));
  await page.clock.fastForward(60000);
  await page.clock.runFor(300);                           // let the swap finish
  check("one minute later: 00:01", await page.locator(".intro time").textContent(), "00:01");
  await page.clock.fastForward(59 * 60000);           // like a computer waking from sleep
  await page.clock.runFor(300);
  check("an hour later, catches up: 01:00", await page.locator(".intro time").textContent(), "01:00");
  check("no console errors", errors.join(" | "), "");
  await context.close();
}

// ---- Reduced motion: the minute changes without the swap.
{
  const { page, context } = await open("Europe/Paris", "2026-11-21T20:41:59.500Z", { reduced: true });
  await page.clock.runFor(520);
  check("reduced motion: new minute at once", await page.locator(".intro time").textContent(), "21:42");
  check("reduced motion: no swap", await page.locator(".intro .clock__swap").count(), 0);
  await context.close();
}

// ---- The tab comes back after a while: the time is right at once.
{
  const { page, context } = await open("Europe/Paris", "2026-11-21T20:41:10Z");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
  });
  await page.clock.setSystemTime(new Date("2026-11-21T21:15:10Z"));   // the clock jumps, no timer fires
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  check("tab visible again: updated", await page.locator(".intro time").textContent(), "22:15");
  await context.close();
}

// ---- ?now= and ?tz= for trying things by hand.
{
  const { page, context } = await open("Europe/Paris", "2026-11-21T08:00:00Z", { query: "?now=2026-03-15T20:41:00Z&tz=Asia/Kolkata" });
  check("?now= and ?tz=", await clause(page), ", where it's 21:41 (4½ hours behind you)");
  await context.close();
}
{
  const { page, context, errors } = await open("Europe/Paris", "2026-11-21T08:00:00Z", { query: "?now=nonsense&tz=Mars/Base" });
  check("bad ?now= and ?tz= are ignored", await clause(page), ", where it's 09:00");
  check("bad parameters: no errors", errors.join(" | "), "");
  await context.close();
}

// ---- Without JavaScript the sentence ends at "France.".
{
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(URL_);
  check("no JavaScript", (await page.locator(".intro").textContent()).replace(/\s+/g, " ").trim().startsWith("Hi, I'm Yann, a student living in France. I like"), true);
  await context.close();
}

// ---- The board shows every case.
{
  const { page, context, errors } = await open("Europe/Paris", "2026-11-21T20:41:00Z");
  await page.goto(URL_ + "board.html");
  check("board: seven states", await page.locator("#clock-states .clock time").count(), 7);
  check("board: no console errors", errors.join(" | "), "");
  await context.close();
}

await browser.close();
server.close();
console.log(failed ? `\n${failed} check(s) failed.` : "\nAll checks passed.");
process.exit(failed ? 1 : 0);
