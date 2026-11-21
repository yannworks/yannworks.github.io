// Tests the showcase (three Experiments components loaded near the bottom of
// the page) in a real browser, and checks that the rest of the page still works.
//
// Run once: npm install --no-save playwright   (node_modules/ is ignored by git)
// Then:     node tools/test-showcase.mjs
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
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const URL_ = `http://127.0.0.1:${server.address().port}/`;
const CLONE = "git clone https://github.com/yannworks/experiments.git";

const browser = await chromium.launch({ channel: "chrome" });
let failed = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : `\n     got:  ${JSON.stringify(got)}\n     want: ${JSON.stringify(want)}`}`);
}

async function open(options = {}, { url = URL_, init } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, ...options });
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("request", (r) => requests.push(r.url()));
  if (init) await page.addInitScript(init);
  await page.goto(url, { waitUntil: "load" });
  return { context, page, errors, requests };
}

async function scrollToShowcase(page) {
  await page.evaluate(() => document.querySelector(".showcase").scrollIntoView({ block: "start" }));
  await page.waitForSelector(".showcase.is-live, .showcase.is-failed", { timeout: 10000 });
  await page.waitForTimeout(300);
}

// ---- Loading only near the section, and nothing new on the first screen
{
  const { context, page, errors, requests } = await open();
  await page.waitForTimeout(1200);
  check("phone: the showcase is not fetched before the visitor scrolls", requests.some((u) => u.includes("showcase/showcase.")), false);
  await scrollToShowcase(page);
  check("phone: after scrolling, the components are mounted", await page.evaluate(() => document.querySelector(".showcase").className), "showcase is-live");
  check("three stages hold a component", await page.$$eval(".showcase__stage", (s) => s.map((x) => x.children.length > 0)), [true, true, true]);
  check("stage heights are the reserved ones (no shift on mount)", await page.$$eval(".showcase__stage", (s) => s.map((x) => Math.round(x.getBoundingClientRect().height))), [256, 184, 120]);
  check("no console errors", errors, []);
  check("built from the commit in vendor/SOURCE.json", await page.evaluate(() => window.showcase.commit.slice(0, 7)), JSON.parse(await readFile(join(ROOT, "tools/showcase/vendor/SOURCE.json"), "utf8")).commit.slice(0, 7));

  // Nothing moves on its own: no style or attribute changes in the section for 2 s.
  const changes = await page.evaluate(() => new Promise((done) => {
    let n = 0;
    const seen = new MutationObserver((list) => { n += list.length; });
    seen.observe(document.querySelector(".showcase"), { attributes: true, subtree: true, childList: true, characterData: true });
    setTimeout(() => { seen.disconnect(); done(n); }, 2000);
  }));
  check("the showcase starts no animation by itself (2 s without input)", changes, 0);
  await context.close();
}

// ---- Wide screen: three columns, rows lined up
{
  const { context, page, errors } = await open({ viewport: { width: 1440, height: 900 } });
  await scrollToShowcase(page);
  const tops = await page.$$eval(".showcase__stage", (s) => s.map((x) => Math.round(x.getBoundingClientRect().top)));
  check("1440: the three stages share one row", new Set(tops).size, 1);
  check("1440: no horizontal scroll", await page.evaluate(() => document.documentElement.scrollWidth), 1440);
  check("1440: no console errors", errors, []);
  await context.close();
}

// ---- Without JavaScript: names, lines and links, no empty stages
for (const width of [320, 1440]) {
  const { context, page } = await open({ javaScriptEnabled: false, viewport: { width, height: 800 } });
  check(`no JS ${width}: three links to Experiments`, await page.$$eval(".showcase__link", (a) => a.map((x) => x.getAttribute("href"))), [
    "https://yannworks.github.io/experiments/#/shoji-bento",
    "https://yannworks.github.io/experiments/#/gem-clip",
    "https://yannworks.github.io/experiments/#/snooze-button",
  ]);
  check(`no JS ${width}: stages take no room`, await page.$$eval(".showcase__stage", (s) => s.map((x) => getComputedStyle(x).display)), ["none", "none", "none"]);
  check(`no JS ${width}: no horizontal scroll`, await page.evaluate(() => document.documentElement.scrollWidth), width);
  await context.close();
}

// ---- The bundle fails to load: same as without JavaScript, no page error
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.route("**/showcase/showcase.js", (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(URL_, { waitUntil: "load" });
  await scrollToShowcase(page);
  check("load failure: section marked failed", await page.evaluate(() => document.querySelector(".showcase").className), "showcase is-failed");
  check("load failure: stages hidden, links visible", await page.evaluate(() => [
    [...document.querySelectorAll(".showcase__stage")].every((s) => getComputedStyle(s).display === "none"),
    [...document.querySelectorAll(".showcase__link")].every((a) => a.getBoundingClientRect().height > 0),
  ]), [true, true]);
  check("load failure: no script error", errors, []);
  await context.close();
}

// ---- Gem Clip: copies the command; a refused copy says so
{
  const { context, page } = await open({ viewport: { width: 1440, height: 900 } });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: URL_ });
  await scrollToShowcase(page);
  await page.click(".gem-clip__clip--front");
  await page.waitForTimeout(250);
  check("Gem Clip: the clipboard holds the clone command", await page.evaluate(() => navigator.clipboard.readText()), CLONE);
  check("Gem Clip: it says Copied, for screen readers too", await page.evaluate(() => [
    document.querySelector(".gem-clip").dataset.status, document.querySelector(".gem-clip__sr").textContent]), ["copied", "Copied"]);
  check("Gem Clip: the button is named", await page.getAttribute(".gem-clip__clip--front", "aria-label"), "Copy the command that downloads my lab");
  await context.close();
}
{
  const refuse = () => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new DOMException("Denied", "NotAllowedError")) } });
    document.execCommand = () => false;
  };
  const { context, page } = await open({ viewport: { width: 390, height: 844 } }, { init: refuse });
  await scrollToShowcase(page);
  await page.click(".gem-clip__clip--front");
  await page.waitForTimeout(400);
  check("Gem Clip refused: the note says it couldn't copy", await page.evaluate(() => {
    const note = document.querySelector(".gem-clip__note");
    return [note.textContent, getComputedStyle(note).opacity, document.querySelector(".gem-clip__sr").textContent];
  }), ["Couldn’t copy", "1", "Couldn’t copy"]);
  await context.close();
}

// ---- Keyboard
{
  const { context, page, errors } = await open({ viewport: { width: 1440, height: 900 } });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: URL_ });
  await scrollToShowcase(page);
  // Tab from the last link of the graph section into the showcase.
  await page.focus(".showcase__title");
  await page.evaluate(() => document.querySelector(".showcase__name").setAttribute("tabindex", "-1"));
  await page.focus(".showcase__name");
  const order = [];
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press("Tab");
    order.push(await page.evaluate(() => {
      const el = document.activeElement;
      return el.getAttribute("role") || el.getAttribute("aria-label") || el.textContent.trim();
    }));
  }
  check("Tab order: two Shoji lines, link, clip, link, button, link", order, [
    "separator", "separator", "Open in Experiments: Shoji Bento", "Copy the command that downloads my lab",
    "Open in Experiments: Gem Clip", "Press me", "Open in Experiments: Snooze Button"]);

  const line = page.locator(".shoji__line").first();
  await line.focus();
  const before = await line.getAttribute("aria-valuenow");
  await page.keyboard.press("ArrowLeft");
  check("Shoji: an arrow key moves the focused line one step", [before, await line.getAttribute("aria-valuenow")], ["67", "58"]);
  check("Shoji: the focus ring shows on the line", await line.evaluate((el) => getComputedStyle(el, "::before").outlineStyle), "solid");

  await page.focus(".gem-clip__clip--front");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  check("Gem Clip: Enter copies", await page.evaluate(() => navigator.clipboard.readText()), CLONE);

  await page.focus(".snooze-button");
  check("Snooze: keyboard focus opens the eyes", await page.getAttribute(".snooze-button", "data-lid"), "open");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(100);
  check("Snooze: Enter starts the busy state, announced", await page.evaluate(() => [
    document.querySelector(".snooze-button").getAttribute("aria-busy"), document.querySelector(".snooze-button__sr").textContent]), ["true", "Working"]);
  await page.waitForTimeout(1500);
  check("Snooze: then done, announced", await page.evaluate(() => [
    document.querySelector(".snooze-button").dataset.status, document.querySelector(".snooze-button__sr").textContent]), ["success", "Done"]);
  check("keyboard: no console errors", errors, []);
  await context.close();
}

// ---- Touch: Snooze wakes on a tap; Shoji lets the page scroll
{
  const { context, page, errors } = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await scrollToShowcase(page);
  check("touch: Shoji lines let vertical swipes scroll the page", await page.$$eval(".shoji__line", (l) => l.map((x) => getComputedStyle(x).touchAction)), ["pan-y", "pan-y"]);

  // A real touch swipe that starts on the vertical line of the grid.
  const cdp = await context.newCDPSession(page);
  const box = await page.locator('.shoji__line[data-axis="x"]').boundingBox();
  await page.evaluate(() => window.scrollTo(0, document.querySelector(".shoji").getBoundingClientRect().top + scrollY - 300));
  const box2 = await page.locator('.shoji__line[data-axis="x"]').boundingBox();
  const y0 = await page.evaluate(() => scrollY);
  await cdp.send("Input.synthesizeScrollGesture", { x: Math.round(box2.x + box2.width / 2), y: Math.round(box2.y + 60), yDistance: -200, gestureSourceType: "touch", speed: 800 });
  await page.waitForTimeout(300);
  check("touch: a swipe up that starts on a Shoji line scrolls the page", (await page.evaluate(() => scrollY)) - y0 > 100, true);

  // A sideways drag on the same line still moves it.
  const before = await page.getAttribute('.shoji__line[data-axis="x"]', "aria-valuenow");
  const b = await page.locator('.shoji__line[data-axis="x"]').boundingBox();
  const x = Math.round(b.x + b.width / 2), y = Math.round(b.y + 60);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i = 1; i <= 8; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - i * 8, y }] });
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(120);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(600);
  const after = await page.getAttribute('.shoji__line[data-axis="x"]', "aria-valuenow");
  check("touch: a sideways drag moves the Shoji line", Number(after) < Number(before), true);

  await page.locator(".snooze-button").scrollIntoViewIfNeeded();
  await page.tap(".snooze-button");
  await page.waitForTimeout(80);
  check("touch: a tap on Snooze makes it busy (pupils go round)", await page.getAttribute(".snooze-button", "data-status"), "loading");
  await page.waitForTimeout(1500);
  check("touch: then it smiles", await page.getAttribute(".snooze-button", "data-status"), "success");
  check("touch: no console errors", errors, []);
  await context.close();
}

// ---- Reduced motion: the components skip their movement, nothing breaks
{
  const { context, page, errors } = await open({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await scrollToShowcase(page);
  await page.click(".shoji__cell >> nth=1");
  await page.waitForTimeout(50);
  const w1 = await page.evaluate(() => document.querySelectorAll(".shoji__cell")[1].style.width);
  await page.waitForTimeout(400);
  const w2 = await page.evaluate(() => document.querySelectorAll(".shoji__cell")[1].style.width);
  check("reduced motion: a pressed compartment takes its room at once", w1 === w2 && w1 !== "", true);
  check("reduced motion: no console errors", errors, []);
  await context.close();
}

// ---- The rest of the page still works
for (const [width, height] of [[320, 700], [390, 844], [1440, 900]]) {
  for (const scheme of ["light", "dark"]) {
    const { context, page, errors } = await open({ viewport: { width, height }, colorScheme: scheme });
    await page.waitForTimeout(800);
    const state = await page.evaluate(() => ({
      scene: document.querySelector(".scene").classList.contains("is-live"),
      clock: /where it's \d\d:\d\d/.test(document.querySelector(".intro").textContent),
      theme: document.documentElement.dataset.theme,
    }));
    check(`${width} ${scheme}: scene live, clock written, theme kept`, state, { scene: true, clock: true, theme: scheme });
    await scrollToShowcase(page);
    check(`${width} ${scheme}: no horizontal scroll`, await page.evaluate(() => document.documentElement.scrollWidth), width);
    check(`${width} ${scheme}: no console errors`, errors, []);
    await context.close();
  }
}

// Theme switch with the showcase on screen: components follow the new colour scheme.
{
  const { context, page, errors } = await open({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
  await scrollToShowcase(page);
  const fill = () => page.evaluate(() => getComputedStyle(document.querySelector(".shoji__cell[data-solid]")).backgroundColor);
  const light = await fill();
  await page.click(".theme-toggle");
  await page.waitForTimeout(800);
  const dark = await fill();
  check("theme switch: Shoji's filled box follows the theme", [light, dark], ["rgb(33, 32, 28)", "rgb(238, 238, 236)"]);
  check("theme switch: no console errors", errors, []);
  await context.close();
}

await browser.close();
server.close();
console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
process.exit(failed ? 1 : 0);
