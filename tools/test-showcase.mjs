// Tests the page in a real browser: the showcase (three Experiments components
// right under the intro), the orange dots, the contribution graph with Clawd,
// and the rest of the page (clock, theme, no theatre left).
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

// ---- Loading after the page, without scrolling (the section is on the first screen)
{
  const { context, page, errors, requests } = await open();
  await page.waitForSelector(".showcase.is-live", { timeout: 10000 });
  check("phone: the showcase is fetched only after the page has loaded", await page.evaluate(() => {
    const load = performance.getEntriesByType("navigation")[0].loadEventEnd;
    return performance.getEntriesByType("resource").filter((r) => r.name.includes("showcase/showcase.")).every((r) => r.startTime >= load);
  }), true);
  check("phone: the components are mounted without scrolling", await page.evaluate(() => [document.querySelector(".showcase").className, scrollY]), ["showcase enter is-live", 0]);
  check("phone: the first card starts on the first screen", await page.evaluate(() => document.querySelector(".showcase__item").getBoundingClientRect().top < innerHeight), true);
  check("the theatre is gone: no scene, no scene scripts fetched", [await page.locator(".scene, .stage").count(),
    requests.some((u) => /(show|stage|stage-art|scene)\.js|stage-(light|dark)\.png/.test(u))], [0, false]);
  check("three stages hold a component", await page.$$eval(".showcase__stage", (s) => s.map((x) => x.children.length > 0)), [true, true, true]);
  check("stage heights are the reserved ones (no shift on mount)", await page.$$eval(".showcase__stage", (s) => s.map((x) => Math.round(x.getBoundingClientRect().height))), [256, 136, 120]);
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
  const boxes = await page.$$eval(".showcase__item", (s) => s.map((x) => { const r = x.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), b: Math.round(r.bottom) }; }));
  check("1440: Shoji leads, as tall as the two others stacked beside it", [
    boxes[1].l > boxes[0].l, boxes[1].l === boxes[2].l, boxes[0].t === boxes[1].t, boxes[0].b === boxes[2].b], [true, true, true, true]);
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
  check("load failure: section marked failed", await page.evaluate(() => document.querySelector(".showcase").className), "showcase enter is-failed");
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
      graph: document.querySelectorAll(".activity__days i[data-level]").length > 100,
      clock: /where it's \d\d:\d\d/.test(document.querySelector(".intro").textContent),
      theme: document.documentElement.dataset.theme,
    }));
    check(`${width} ${scheme}: graph drawn, clock written, theme kept`, state, { graph: true, clock: true, theme: scheme });
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

// ---- The orange dots: one card at a time, never under content
{
  const { context, page, errors } = await open({ viewport: { width: 1440, height: 1300 } });
  await page.waitForSelector(".showcase.is-live");
  await page.waitForTimeout(300);
  const active = () => page.$$eval(".showcase__item", (c) => c.map((x) => x.classList.contains("is-active")));
  check("dots: the first card is active at rest", await active(), [true, false, false]);
  await page.hover(".showcase__item--clip .showcase__name");
  await page.waitForTimeout(350);
  check("dots: pointing at Gem Clip moves them there", await active(), [false, true, false]);
  await page.mouse.move(5, 5);
  await page.waitForTimeout(100);
  check("dots: they stay when the pointer leaves", await active(), [false, true, false]);
  // Lit cells per strip (js/dots.js keeps them in field.on).
  const lit = () => page.evaluate(() => accent.items.fringe.map((it) => it.field.on.reduce((n, v) => n + v, 0)));
  await page.waitForTimeout(500);
  const afterSwitch = await lit();
  check("dots: only the active card's strip has dots once the switch is over", [afterSwitch[0], afterSwitch[1] > 20, afterSwitch[2]], [0, true, 0]);
  check("dots: the strips never slide or get clipped (no clip-path, no transform)", await page.$$eval(".fringe canvas", (cs) =>
    cs.every((c) => getComputedStyle(c).clipPath === "none" && getComputedStyle(c).transform === "none")), true);
  const flowA = await page.evaluate(() => Array.from(accent.items.fringe[1].field.on).join(""));
  await page.waitForTimeout(1500);
  const flowB = await page.evaluate(() => Array.from(accent.items.fringe[1].field.on).join(""));
  check("dots: the active strip flows (cells change while it stays active)", flowA !== flowB, true);
  // Reversed halfway: back on Gem Clip, briefly on Snooze, back again: Gem Clip carries on from what was still lit.
  const full = (await lit())[1];
  await page.hover(".showcase__item--snooze .showcase__name");
  await page.waitForTimeout(90);
  await page.hover(".showcase__item--clip .showcase__name");
  await page.waitForTimeout(90);
  check("dots: a quick change of mind carries on from the cells still lit (no restart from zero)", (await lit())[1] >= full * 0.35, true);
  await page.waitForTimeout(500);
  // Keyboard: a focus that no pointer caused switches the dots at once (one 83 ms step), no random lighting.
  await page.evaluate(() => document.querySelector(".showcase__item--snooze .showcase__link").focus());
  await page.waitForTimeout(120);
  const early = (await lit())[2];
  await page.waitForTimeout(600);
  const later = (await lit())[2];
  check("dots: keyboard focus inside a card moves them, without motion", [await active(), early >= later * 0.7 && later > 20], [[false, false, true], true]);
  check("dots: each strip is under its card's link, never under text or a component", await page.$$eval(".showcase__item", (cards) => cards.map((c) => {
    const strip = c.querySelector(".fringe").getBoundingClientRect();
    const link = c.querySelector(".showcase__link .link__text").getBoundingClientRect();
    const stage = c.querySelector(".showcase__stage").getBoundingClientRect();
    return strip.top >= link.bottom - 0.5 && strip.top >= stage.bottom - 0.5;
  })), [true, true, true]);
  check("dots: each keyword band sits in the gap under its word", await page.$$eval(".intro .kw", (kws) => kws.every((k) => {
    const c = k.querySelector(".kw__dots");
    return c && c.width > 0 && c.getBoundingClientRect().top >= k.getBoundingClientRect().bottom - 1;
  })), true);
  check("dots: the end field is below everything else", await page.evaluate(() =>
    document.querySelector(".end").getBoundingClientRect().top >= document.querySelector(".activity").getBoundingClientRect().bottom), true);
  check("dots: no console errors", errors, []);
  await context.close();
}
{
  const { context, page } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.waitForSelector(".showcase.is-live");
  await page.locator(".showcase__item--snooze .showcase__name").scrollIntoViewIfNeeded();
  await page.tap(".showcase__item--snooze .showcase__name");
  await page.waitForTimeout(100);
  check("dots: a tap on a card moves them there", await page.$$eval(".showcase__item", (c) => c.map((x) => x.classList.contains("is-active"))), [false, false, true]);
  await context.close();
}
{
  const { context, page } = await open({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await page.waitForSelector(".showcase.is-live");
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  const all = () => page.evaluate(() => [...accent.items.kw, ...accent.items.fringe, ...accent.items.end].map((it) => Array.from(it.field.on).join("")));
  const r1 = await all();
  await page.waitForTimeout(1200);
  const r2 = await all();
  check("dots, reduced motion: one still image, nothing changes", JSON.stringify(r1) === JSON.stringify(r2), true);
  check("dots, reduced motion: the active strip and the page end still show their dots", await page.evaluate(() =>
    [accent.items.fringe[0], accent.items.end[0]].map((it) => it.field.on.some((v) => v))), [true, true]);
  await page.evaluate(() => scrollTo(0, 0));
  await page.hover(".intro .kw");
  await page.waitForTimeout(300);
  check("dots, reduced motion: pointing at a keyword changes nothing", JSON.stringify(r1[0]) === JSON.stringify((await all())[0]), true);
  await context.close();
}

// ---- Keywords: still while you read, a short crackle when pointed at; the loop sleeps off screen
{
  const { context, page, errors } = await open({ viewport: { width: 1440, height: 900 } });
  await page.waitForTimeout(2500);                                  // print, then the bands appear
  const kw = () => page.evaluate(() => accent.items.kw.map((it) => Array.from(it.field.on).join("")));
  const k1 = await kw();
  check("keywords: every band has appeared", k1.every((b) => b.includes("1")), true);
  await page.waitForTimeout(2000);
  check("keywords: nothing moves while the visitor reads (2 s)", JSON.stringify(await kw()) === JSON.stringify(k1), true);
  await page.hover(".intro .kw >> nth=1");
  await page.waitForTimeout(250);
  const k2 = await kw();
  check("keywords: pointing at a word makes its band crackle", k2[1] !== k1[1], true);
  await page.mouse.move(5, 5);
  await page.waitForTimeout(1000);
  check("keywords: then the band is exactly as before", (await kw())[1] === k1[1], true);
  const t1 = await page.evaluate(() => accent.items.end[0].time);
  await page.waitForTimeout(1000);
  check("loop: the page end, off screen, does not run", await page.evaluate(() => accent.items.end[0].time), t1);
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  const e1 = await page.evaluate(() => Array.from(accent.items.end[0].field.on).join(""));
  await page.waitForTimeout(1500);
  check("loop: on screen, the page end drifts", e1 !== (await page.evaluate(() => Array.from(accent.items.end[0].field.on).join(""))), true);
  await page.setViewportSize({ width: 1440, height: 300 });         // a short window: the cards are far above
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  check("loop: the active card's strip, now off screen, does not run", await page.evaluate(() => {
    const it = accent.items.fringe[0]; const t = it.time;
    return new Promise((ok) => setTimeout(() => ok(it.time === t), 600));
  }), true);
  check("keywords and loop: no console errors", errors, []);
  await context.close();
}

// ---- The graph and Clawd
{
  const { context, page, errors } = await open({ viewport: { width: 1440, height: 900 } });
  await page.locator(".activity__graph").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => window.activityDebug && window.activityDebug.clock > window.activityDebug.arrivalMs + 200, null, { timeout: 8000 });
  check("graph: 26 weeks, squares up to 16 px", await page.evaluate(() => [activityDebug.weeks, activityDebug.square]), [26, 16]);
  check("graph: Clawd is 44 x 32 px", await page.$eval(".activity__clawd", (c) => [c.getBoundingClientRect().width, c.getBoundingClientRect().height]), [44, 32]);
  check("graph: Clawd stands on today's column", await page.evaluate(() => {
    const c = document.querySelector(".activity__clawd").getBoundingClientRect();
    const sq = [...document.querySelectorAll(".activity__days i[data-level]")].pop().getBoundingClientRect();
    return Math.abs(c.bottom - (sq.top - 2)) <= 1 && c.left <= sq.right && c.right >= sq.left;
  }), true);
  await page.hover(".activity__clawd");
  await page.waitForTimeout(80);
  check("graph: pointing at Clawd makes him wave with his happy face", await page.evaluate(() => activityDebug.pose), "front/happy/left_up");
  await page.focus(".activity__graph");
  check("graph: focus reads today", (await page.textContent(".activity__day")).includes("·"), true);
  await page.keyboard.press("ArrowLeft");
  check("graph: arrow keys move one week", await page.$$eval(".activity__days i.is-selected", (s) => s.length), 1);
  check("graph: no console errors", errors, []);
  await context.close();
}
{
  const { context, page } = await open({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await page.locator(".activity__graph").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  check("graph, reduced motion: Clawd does not walk in", await page.evaluate(() => activityDebug.arrivalMs), 0);
  await context.close();
}

// ---- Every component fits inside its stage, at every width (fixed stages, no overflow)
{
  const misfits = [];
  for (const width of [320, 340, 360, 375, 390, 414, 480, 600, 768, 899, 900, 1100, 1280, 1440]) {
    const { context, page } = await open({ viewport: { width, height: 900 } });
    await page.waitForSelector(".showcase.is-live");
    await page.waitForTimeout(200);
    const out = await page.$$eval(".showcase__stage", (stages) => stages.map((st) => {
      const s = st.getBoundingClientRect();
      const parts = [...st.querySelectorAll("*")].map((e) => e.getBoundingClientRect()).filter((b) => b.width && b.height);
      return parts.every((b) => b.top >= s.top - 0.5 && b.bottom <= s.bottom + 0.5 && b.left >= s.left - 0.5 && b.right <= s.right + 0.5);
    }));
    out.forEach((ok, i) => { if (!ok) misfits.push(`${width}:${["shoji", "clip", "snooze"][i]}`); });
    await context.close();
  }
  check("every component fits in its stage from 320 to 1440 px", misfits, []);
}

// ---- No text under the keyword dots: hide the dots, then look for ink where they were
for (const width of [320, 390, 1440]) {
  const { context, page } = await open({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
  await page.waitForTimeout(800);
  const bands = await page.$$eval(".kw__dots", (cs) => cs.map((c) => { const r = c.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }));
  await page.addStyleTag({ content: ".kw__dots { visibility: hidden }" });
  const shot = (await page.screenshot()).toString("base64");
  const ink = await page.evaluate(async ({ shot, bands }) => {
    const img = new Image();
    img.src = "data:image/png;base64," + shot;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    return bands.map(([x, y, w, h]) => {
      const d = g.getImageData(Math.round(x * 2), Math.round(y * 2), Math.round(w * 2), Math.round(h * 2)).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] < 200) n++;
      return n;
    });
  }, { shot, bands });
  check(`${width}: no letter reaches into the dots under a keyword`, ink.every((n) => n === 0) && ink.length === 4, true);
  await context.close();
}

// ---- Without JavaScript: no dots, no empty strips standing in for them
{
  const { context, page } = await open({ javaScriptEnabled: false, viewport: { width: 390, height: 800 } });
  check("no JS: no dot canvases", await page.locator("canvas").count(), 0);
  await context.close();
}

await browser.close();
server.close();
console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
process.exit(failed ? 1 : 0);
