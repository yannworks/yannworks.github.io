// The GitHub contribution graph: one square per day for the last 26 weeks, in
// Clawd's orange, with a small Clawd standing on today's column.
//
// Where the data comes from: a GitHub Action (.github/workflows/contributions.yml)
// runs once a day, asks GitHub for the contribution calendar and saves it as
// contributions.json next to this page. This file only reads that JSON.
//
// The squares are plain elements coloured by style.css (data-level 0 to 4), so
// they follow the theme by themselves. Clawd is a small canvas drawn from the
// approved grids in js/clawd-sprites.js, 2 CSS px per cell.

const ACTIVITY = {
  FILE: "contributions.json",
  WEEKS: 26,               // half a year, on every screen
  GAP: 3,                  // px between squares
  MIN_SQ: 6, MAX_SQ: 16,   // square size in px, picked to fill the width
  CELL: 2,                 // CSS px per cell of Clawd's grid (22 x 16 cells: 44 x 32 px)...
  CELL_SMALL: 1.5,         // ...or about this, rounded to whole screen pixels, when squares are under 12 px
  WALK_FROM: 120,          // px: Clawd walks in from this far left of today
  STEP_MS: 50,             // one walking step...
  STEP_CELLS: 2,           // ...moves him this many cells
  FRAME_MS: 150,           // blink, bounce and wave frames
  SETTLE_MS: 8000,         // after this (from his arrival), Clawd stands still until poked
  STALE_DAYS: 3,           // older data says "updated <date>"
};

// The walk cycle of the clawd skill: [legs lifted, crouch] per step.
const WALK_STEPS = [["A", 0], ["A", 0], [null, 0], [null, 1], ["B", 0], ["B", 0], [null, 0], [null, 1]];
const BOUNCE = [0, 1, 1, 0];
const WAVE = [0, 1, 1, 0, 1, 1, 0];       // crouches of the happy wave, one per frame

// Name of a pose in CLAWD_POSES, e.g. pose("front", { face: "happy", arm: "left_up" }).
function pose(view, o = {}) {
  const parts = [view];
  if (o.face && o.face !== "normal") parts.push(o.face);
  if (o.arm) parts.push(o.arm);
  if (o.crouch) parts.push("crouch");
  if (o.legs) parts.push("legs" + o.legs);
  return parts.join("/");
}

// ------------------------------------------------------------------ data

function validContributions(d) {
  if (!d || typeof d.total !== "number" || !Array.isArray(d.days) || d.days.length < 7) return false;
  // Sample files (tools/sample-contributions.mjs) only ever show on this computer.
  if (d.sample && !["localhost", "127.0.0.1"].includes(location.hostname)) return false;
  return d.days.every((day, i) =>
    /^\d{4}-\d{2}-\d{2}$/.test(day.date) && Number.isInteger(day.count) && day.count >= 0 &&
    Number.isInteger(day.level) && day.level >= 0 && day.level <= 4 &&
    (i === 0 || day.date > d.days[i - 1].date));
}

async function loadContributions() {
  try {
    const response = await fetch(ACTIVITY.FILE, { cache: "no-cache" });
    if (!response.ok) return null;
    const data = await response.json();
    return validContributions(data) ? data : null;
  } catch (e) {
    return null;                                    // missing or broken file: no graph
  }
}

const dayMs = 864e5;
const utc = (date) => Date.parse(date + "T00:00:00Z");

// Columns are weeks starting on Sunday (like GitHub), rows are weekdays.
function layoutDays(days, weeks) {
  const start = utc(days[0].date);
  const offset = new Date(start).getUTCDay();
  const all = days.map((d) => {
    const index = Math.round((utc(d.date) - start) / dayMs) + offset;
    return { ...d, col: Math.floor(index / 7), row: index % 7 };
  });
  const lastCol = all[all.length - 1].col;
  const firstCol = Math.max(0, lastCol - weeks + 1);
  const cells = all.filter((c) => c.col >= firstCol).map((c) => ({ ...c, col: c.col - firstCol }));
  return { cells, cols: lastCol - firstCol + 1 };
}

function dayLabel(cell, lastDate) {
  const sameYear = cell.date.slice(0, 4) === lastDate.slice(0, 4);
  const when = new Date(utc(cell.date)).toLocaleDateString("en-US",
    { month: "short", day: "numeric", year: sameYear ? undefined : "numeric", timeZone: "UTC" });
  const what = cell.count === 0 ? "No contributions" : cell.count === 1 ? "1 contribution" : `${cell.count.toLocaleString("en-US")} contributions`;
  return `${what} · ${when}`;
}

// ------------------------------------------------------------------ the graph

// Draws the graph for `data` inside `section` (see the markup in index.html).
// Returns a small controller; options.reduced = prefers-reduced-motion.
function mountActivity(section, data, options = {}) {
  const box = section.querySelector(".activity__graph");
  const summary = section.querySelector(".activity__summary");
  const line = section.querySelector(".activity__day");
  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = options.reduced ?? reducedQuery.matches;
  const lastDate = data.days[data.days.length - 1].date;
  const { cells, cols } = layoutDays(data.days, ACTIVITY.WEEKS);
  const today = cells[cells.length - 1];

  // ---- the squares: blanks first, so that each column starts on a Sunday
  const days = document.createElement("div");
  days.className = "activity__days";
  days.setAttribute("aria-hidden", "true");
  for (let i = 0; i < cells[0].row; i++) days.append(Object.assign(document.createElement("i"), { className: "is-blank" }));
  const squares = cells.map((cell, i) => {
    const sq = document.createElement("i");
    sq.dataset.level = cell.level;
    sq.dataset.i = i;
    days.append(sq);
    return sq;
  });

  // ---- the month names, under the columns where a month starts (skipped when cramped)
  const months = document.createElement("div");
  months.className = "activity__months";
  months.setAttribute("aria-hidden", "true");
  const starts = [];
  cells.forEach((c) => {
    if (c.row !== 0 && c !== cells[0]) return;
    const m = new Date(utc(c.date)).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
    if (!starts.length || starts[starts.length - 1].m !== m) starts.push({ m, col: c.col });
  });
  const labels = starts.filter((s, k) => !(starts[k + 1] && starts[k + 1].col - s.col < 3) && s.col <= cols - 3)
    .map((s) => { const el = document.createElement("span"); el.textContent = s.m; months.append(el); return { el, col: s.col }; });

  // ---- Clawd: a canvas with as many pixels as the screen, cells drawn as squares
  const canvas = document.createElement("canvas");
  canvas.className = "activity__clawd";
  canvas.setAttribute("aria-hidden", "true");
  const g = canvas.getContext("2d");
  box.append(days, months, canvas);

  writeSummary();

  // ---- sizes: squares fill the width, up to 16 px
  let sq = ACTIVITY.MAX_SQ, pitch = sq + ACTIVITY.GAP, unit = ACTIVITY.CELL;   // CSS px per cell of Clawd's grid
  function fit() {
    // The room the graph has: its column on wide screens (style.css puts it in the
    // second of two), the whole width otherwise.
    const body = box.parentElement, columns = getComputedStyle(body).gridTemplateColumns.split(" ");
    const avail = getComputedStyle(body).display === "grid" && columns.length > 1 ? parseFloat(columns[1]) : body.clientWidth;
    sq = Math.max(ACTIVITY.MIN_SQ, Math.min(ACTIVITY.MAX_SQ, Math.floor((avail - (cols - 1) * ACTIVITY.GAP) / cols)));
    pitch = sq + ACTIVITY.GAP;
    section.style.setProperty("--sq", sq + "px");               // the legend's swatches match the squares
    labels.forEach((l) => { l.el.style.left = l.col * pitch + "px"; });
    // Whole screen pixels per cell of Clawd's grid, so every cell is a sharp square.
    const dpr = window.devicePixelRatio || 1;
    const px = Math.max(1, Math.round((sq >= 12 ? ACTIVITY.CELL : ACTIVITY.CELL_SMALL) * dpr));
    unit = px / dpr;
    canvas.width = 22 * px;
    canvas.height = 16 * px;
    canvas.style.width = 22 * unit + "px";
    canvas.style.height = 16 * unit + "px";
    box.style.setProperty("--clawd-h", 16 * unit + 2 + "px");
    draw();
  }

  function writeSummary() {
    const total = cells.reduce((n, c) => n + c.count, 0);
    summary.textContent = "";
    const text = document.createElement("span");
    const num = document.createElement("b");
    num.className = "kw";
    num.textContent = total.toLocaleString("en-US");
    text.append(num, ` ${total === 1 ? "contribution" : "contributions"} in the last 6 months`);
    const age = Date.now() - Date.parse(data.fetchedAt || "");
    if (age > ACTIVITY.STALE_DAYS * dayMs) {
      const when = new Date(data.fetchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
      const note = document.createElement("span");
      note.className = "activity__updated";
      note.textContent = ` · updated ${when}`;
      text.append(note);
    }
    // Less, the five colours, More (decorative: the numbers are in the day line).
    const legend = document.createElement("span");
    legend.className = "activity__legend";
    legend.setAttribute("aria-hidden", "true");
    legend.append("Less");
    for (let level = 0; level <= 4; level++) {
      const swatch = document.createElement("i");
      swatch.style.background = level ? `var(--level-${level})` : "var(--line)";
      legend.append(swatch);
    }
    legend.append("More");
    summary.append(text, legend);
  }

  // ---- Clawd's timing. His clock starts when the graph is first seen.
  let clock = 0, started = false, running = false, raf = 0, last = null, inView = false;
  let pokedAt = -1e9, settledEarly = false;
  const todayX = () => Math.max(0, Math.min(cols * pitch - ACTIVITY.GAP - 22 * unit, today.col * pitch + sq / 2 - 11 * unit));
  const walkStart = () => Math.max(0, todayX() - ACTIVITY.WALK_FROM);
  const walkSteps = () => Math.ceil((todayX() - walkStart()) / (ACTIVITY.STEP_CELLS * unit));
  const arrivalMs = () => (reduced ? 0 : walkSteps() * ACTIVITY.STEP_MS);
  const settleMs = () => (settledEarly ? 0 : arrivalMs() + ACTIVITY.SETTLE_MS);
  const waving = (t) => t - pokedAt >= 0 && t - pokedAt < WAVE.length * ACTIVITY.FRAME_MS;

  // Clawd's pose and place at time t.
  function clawdAt(t) {
    const x = todayX();
    const frame = (ms) => Math.floor(ms / ACTIVITY.FRAME_MS);
    if (waving(t)) {                                                         // poked: happy, waving
      const crouch = reduced ? 0 : WAVE[frame(t - pokedAt)];
      return { pose: pose("front", { face: "happy", arm: "left_up", crouch }), x };
    }
    if (t < arrivalMs()) {                                                   // the walk
      const step = Math.floor(t / ACTIVITY.STEP_MS);
      const [legs, crouch] = WALK_STEPS[step % WALK_STEPS.length];
      return { pose: pose("side_right", { legs, crouch }), x: Math.min(x, walkStart() + step * ACTIVITY.STEP_CELLS * unit) };
    }
    const idle = t - arrivalMs();
    if (t < settleMs()) {                                                    // a few blinks and bounces, then still
      const bounce = reduced ? undefined : [400, 4200].find((b) => idle >= b && idle < b + 4 * ACTIVITY.FRAME_MS);
      if (bounce !== undefined) return { pose: pose("front", { crouch: BOUNCE[frame(idle - bounce)] }), x };
      if ([1800, 6200].some((b) => idle >= b && idle < b + ACTIVITY.FRAME_MS)) return { pose: pose("front", { face: "blink" }), x };
    }
    return { pose: pose("front"), x };
  }

  const busy = (t) => t < settleMs() || waving(t);

  function draw() {
    g.clearRect(0, 0, canvas.width, canvas.height);
    if (!started) { canvas.hidden = true; return; }
    canvas.hidden = false;
    const c = clawdAt(clock);
    canvas.style.transform = `translateX(${c.x}px)`;
    const grid = CLAWD_POSES[c.pose];
    const k = canvas.width / 22;                    // screen pixels per cell
    const top = 16 - grid.length;                   // feet on the bottom edge
    grid.forEach((row, y) => [...row].forEach((ch, x) => {
      if (!CLAWD_COLORS[ch]) return;
      g.fillStyle = CLAWD_COLORS[ch];
      g.fillRect(Math.round(x * k), Math.round((top + y) * k), Math.round((x + 1) * k) - Math.round(x * k), Math.round((top + y + 1) * k) - Math.round((top + y) * k));
    }));
  }

  // ---- the clock: runs while Clawd moves, the graph is on screen and the tab is visible
  function tick(now) {
    raf = 0;
    if (!running || !inView || document.hidden) { last = null; return; }
    clock += last === null ? 0 : Math.min(100, now - last);
    last = now;
    draw();
    if (!busy(clock)) { running = false; last = null; return; }
    raf = requestAnimationFrame(tick);
  }
  function play() {
    running = true;
    if (!raf && inView && !document.hidden) raf = requestAnimationFrame(tick);
  }

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView && !started && entry.intersectionRatio >= 0.4) { started = true; clock = 0; draw(); }
    if (inView && started && busy(clock)) play();
  }, { threshold: [0, 0.4] }).observe(box);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && started && busy(clock)) play(); });

  // Poked (pointer over him, or a tap): happy face and a wave.
  function poke() {
    if (!started || clock < arrivalMs() || waving(clock)) return;
    pokedAt = clock;
    play();
  }
  canvas.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") poke(); });
  canvas.addEventListener("pointerdown", poke);

  // ---- choosing a day: mouse, finger or keyboard
  let selected = null, hoverSelect = false;
  function select(cell, fromHover = false) {
    if (selected) squares[cells.indexOf(selected)].classList.remove("is-selected");
    selected = cell;
    hoverSelect = fromHover;
    if (cell) squares[cells.indexOf(cell)].classList.add("is-selected");
    line.textContent = dayLabel(cell || today, lastDate);       // with nothing chosen: today
  }
  const cellAt = (e) => {
    const sqEl = e.target.closest && e.target.closest("i[data-i]");
    return sqEl ? cells[Number(sqEl.dataset.i)] : null;
  };
  days.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const cell = cellAt(e);
    if (cell && cell !== selected) select(cell, true);
  });
  box.addEventListener("pointerleave", () => {
    if (hoverSelect && document.activeElement !== box) select(null);
  });
  days.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch") return;
    const cell = cellAt(e);
    if (cell) select(cell);
  });
  box.addEventListener("focus", () => { if (!selected) select(today); });
  box.addEventListener("keydown", (e) => {
    const moves = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
    let next = null;
    const i = selected ? cells.indexOf(selected) : cells.length - 1;
    if (e.key in moves) next = cells[i + moves[e.key]];
    else if (e.key === "Home") next = cells[0];
    else if (e.key === "End") next = today;
    else return;
    e.preventDefault();
    if (next) select(next);
  });

  // ---- follow the window size and the motion setting
  new ResizeObserver(fit).observe(section);
  reducedQuery.addEventListener("change", () => { reduced = reducedQuery.matches; draw(); });

  section.querySelector(".activity__body").hidden = false;
  fit();
  line.textContent = dayLabel(today, lastDate);

  return {
    replay() { started = true; clock = 0; pokedAt = -1e9; settledEarly = false; play(); },
    poke,
    // For tests and recordings: stop the clock and move it by hand.
    debug: {
      freeze() { running = false; started = true; clock = 0; draw(); },
      step(ms) { clock += ms; draw(); return canvas.toDataURL("image/png"); },
      poke() { poke(); },
      get clock() { return clock; },
      get running() { return running; },
      get weeks() { return cols; },
      get unit() { return unit; },
      get square() { return sq; },
      get settleMs() { return settleMs(); },
      get arrivalMs() { return arrivalMs(); },
      get pose() { return started ? clawdAt(clock).pose : null; },
    },
  };
}

// Loads the data and shows the graph; without valid data the section stays hidden.
async function startActivity() {
  const section = document.getElementById("activity");
  if (!section) return null;
  const data = await loadContributions();
  if (!data) { section.hidden = true; return null; }
  section.querySelector(".activity__fallback").hidden = true;
  const graph = mountActivity(section, data);
  window.activityDebug = graph.debug;
  return graph;
}
