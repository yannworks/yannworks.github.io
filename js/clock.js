// Yann's local time in the intro: "a student living in France, where it's
// 21:41 (6 hours ahead of you)". The gap only shows when the visitor's clock
// is set to another time zone.
//
// This file is loaded in <head> without `defer`, so a one-line script right
// after the intro can write the time before the page is first drawn: the
// sentence never jumps and the entrance plays with the time already there.
// Without JavaScript the sentence simply ends at "France.".
//
// The time comes from the visitor's device: if its clock is wrong, so is this.
// To try another moment or place: index.html?now=2026-03-15T20:41:00Z&tz=Asia/Kolkata
// (`now` starts the clock at that instant, `tz` pretends to be a visitor there).

const CLOCK = {
  ZONE: "Europe/Paris",
  SWAP_MS: 240,     // changed digits swap in dots, through the scene's dither masks (0: change at once)
};

// Minutes ahead of UTC in `zone` at `date`. Paris: 60 in winter, 120 in summer.
// The browser knows every zone's rules, daylight saving included.
function zoneOffset(zone, date) {
  const p = {};
  const format = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone, hourCycle: "h23",
    year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric",
  });
  for (const part of format.formatToParts(date)) p[part.type] = Number(part.value);
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((wall - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

// "6 hours ahead of you", "4½ hours behind you", or "" for the same time.
// `minutes` is Paris's offset minus the visitor's. No-break spaces keep
// "6 hours" and "ahead of you" whole, so a line never starts with "you).";
// the only breaks are between the amount and the direction (and after
// "hours" in the long "4 hours 45 minutes").
function gapText(minutes) {
  if (minutes === 0) return "";
  const m = Math.abs(minutes), h = Math.floor(m / 60), r = m % 60;
  const nb = String.fromCharCode(160);         // no-break space
  const hours = (n) => n + nb + (n === 1 ? "hour" : "hours");
  let size;
  if (r === 0) size = hours(h);
  else if (r === 30) size = h === 0 ? "half" + nb + "an" + nb + "hour" : h + "½" + nb + "hours";
  else size = (h ? hours(h) + " " : "") + r + nb + "minutes";
  const side = minutes > 0 ? "ahead" + nb + "of" + nb + "you" : "behind" + nb + "you";
  return size + " " + side;
}

// Everything the sentence needs at `date`, for a visitor in `visitorZone`
// (a zone name, or nothing to use the device's own setting).
function clockAt(date, visitorZone) {
  const paris = zoneOffset(CLOCK.ZONE, date);
  const visitor = visitorZone ? zoneOffset(visitorZone, date) : -date.getTimezoneOffset();
  const t = new Date(date.getTime() + paris * 60000);        // Paris wall clock, read as UTC
  const two = (n) => String(n).padStart(2, "0");
  const time = two(t.getUTCHours()) + ":" + two(t.getUTCMinutes());
  const sign = paris < 0 ? "-" : "+";
  const datetime = t.getUTCFullYear() + "-" + two(t.getUTCMonth() + 1) + "-" + two(t.getUTCDate()) +
    "T" + time + sign + two(Math.floor(Math.abs(paris) / 60)) + ":" + two(Math.abs(paris) % 60);
  return { time, datetime, gap: gapText(paris - visitor) };
}

// Writes the clause into `el` (the empty <span class="clock"> after "France").
// With `swap`, the digits that changed trade places in dots instead of
// jumping; the text around them never moves (equal-width digits, see style.css).
function showClock(el, state, swap) {
  let time = el.querySelector("time");
  if (!time) {
    time = document.createElement("time");
    time.className = "clock__time";
    const gap = document.createElement("span");
    gap.className = "clock__gap";
    el.append(", where it's ", time, gap);
  }
  const gap = el.querySelector(".clock__gap");
  const gapLine = state.gap ? " (" + state.gap + ")" : "";
  if (gap.textContent !== gapLine) gap.textContent = gapLine;
  time.dateTime = state.datetime;

  if (time._swap) time._swap();                // finish a swap still running
  const before = time.textContent;
  if (before === state.time) return;
  const masks = window.dither;                 // from main.js, once it has run
  if (!swap || !CLOCK.SWAP_MS || !masks || before.length !== state.time.length || !CSS.supports("mask-image", "none")) {
    time.textContent = state.time;
    return;
  }

  // Each changed digit: the new one on top of the old, through complementary
  // masks, so every dot shows one or the other, never both or neither.
  time.textContent = "";
  const pairs = [];
  [...state.time].forEach((ch, i) => {
    if (ch === before[i]) return time.append(ch);
    const box = document.createElement("span");
    const next = document.createElement("span");
    const old = document.createElement("span");
    box.className = "clock__swap";
    next.textContent = ch;
    old.textContent = before[i];
    old.setAttribute("aria-hidden", "true");
    box.append(next, old);
    time.append(box);
    pairs.push([next, old]);
  });
  const paint = (level) => pairs.forEach(([next, old]) => {
    next.style.maskImage = next.style.webkitMaskImage = masks.MASKS[level];
    old.style.maskImage = old.style.webkitMaskImage = masks.INVERSE[level];
  });
  paint(0);
  const start = performance.now();
  let frame = requestAnimationFrame(function step() {
    const k = Math.min(1, (performance.now() - start) / CLOCK.SWAP_MS);
    paint(Math.round(k * 64));
    if (k < 1) frame = requestAnimationFrame(step);
    else time._swap();
  });
  time._swap = () => {
    cancelAnimationFrame(frame);
    time._swap = null;
    time.textContent = state.time;
  };
}

// Keeps the clause up to date: one timer set for the next whole minute (so it
// never drifts), and a refresh whenever the tab comes back into view.
function startClock(el) {
  if (!el) return;
  const params = new URLSearchParams(location.search);
  const fixed = Date.parse(params.get("now"));
  const shift = isNaN(fixed) ? 0 : fixed - Date.now();
  let zone = params.get("tz");
  try { if (zone) zoneOffset(zone, new Date()); } catch (e) { zone = null; }   // unknown zone: ignore it
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let timer = 0;

  function update(swap) {
    const now = new Date(Date.now() + shift);
    showClock(el, clockAt(now, zone), swap && !reduced.matches && !document.hidden);
    clearTimeout(timer);
    // Recomputed from the real clock each time; if a timer fires a hair early,
    // the minute has not changed, nothing is redrawn and it simply waits again.
    timer = setTimeout(() => update(true), 60000 - (now.getTime() % 60000));
  }

  update(false);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) update(false); });
  addEventListener("pageshow", (e) => { if (e.persisted) update(false); });   // back/forward cache
}
