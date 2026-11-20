// The GitHub contribution graph, drawn in dots like the scene, with a tiny
// Clawd standing on today's column.
//
// Where the data comes from: a GitHub Action (.github/workflows/contributions.yml)
// runs once a day, asks GitHub for the contribution calendar and saves it as
// contributions.json next to this page. This file only reads that JSON.
//
// How a day is drawn: a square of 4 x 4 dots. GitHub gives each day a level
// from 0 to 4; the square shows 1, 2, 4, 8 or 16 of its dots, picked in the
// order of the 4 x 4 Bayer grid (the small version of the scene's 8 x 8 grid).

const ACTIVITY = {
  FILE: "contributions.json",
  SQUARE: 4,               // dots per side of a day
  PITCH: 5,                // a square plus one dot of gap
  DOTS: [1, 2, 4, 8, 16],  // dots shown for GitHub levels 0 to 4
  BAND: 17,                // dot rows above the graph: Clawd (16) and one of air
  MIN_DOT: 2.4,            // smallest dot (CSS px) for a full year; below that, 26 weeks
  FILL_MS: 1000,           // fill-in the first time the graph is seen
  FILL_REDUCED_MS: 400,
  STEP_MS: 50,             // one walking step of Clawd...
  STEP_CELLS: 2,           // ...moves him this many dots
  FRAME_MS: 150,           // blink and bounce frames
  SETTLE_MS: 10000,        // after this (from the fill), Clawd stops moving until tapped
  STALE_DAYS: 3,           // older data says "updated <date>"
};

// Rank of each dot of a 4 x 4 square in Bayer order (same formula as the scene's shader).
const bayer2 = (x, y) => ((x % 2) * 0.5 + (y % 2) * 0.75) % 1;
const DOT_ORDER = [];
for (let y = 0; y < 4; y++) {
  for (let x = 0; x < 4; x++) DOT_ORDER.push({ x, y, rank: (bayer2(x >> 1, y >> 1) * 0.25 + bayer2(x, y)) * 16 });
}
DOT_ORDER.sort((a, b) => a.rank - b.rank);

// The walk cycle of the clawd skill: [legs lifted, crouch] per step.
const WALK_STEPS = [["A", 0], ["A", 0], [null, 0], [null, 1], ["B", 0], ["B", 0], [null, 0], [null, 1]];
const BOUNCE = [0, 1, 1, 0];

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
  const canvas = document.createElement("canvas");
  canvas.className = "activity__canvas";
  canvas.setAttribute("aria-hidden", "true");
  box.append(canvas);
  const g = canvas.getContext("2d");
  const root = document.documentElement;
  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = options.reduced ?? reducedQuery.matches;

  let weeks = 0, cells = [], cols = 0, W = 0, H = 0;
  let selected = null, hoverSelect = false;
  let ink = "#111";
  // Animation clock (ms): starts when the graph is first seen, stops when nothing moves.
  let clock = 0, started = false, running = false, raf = 0, last = null, inView = false;
  let happyAt = -1e9, settledEarly = false;
  const lastDate = data.days[data.days.length - 1].date;

  // ---- sizes: a whole number of screen pixels per dot, so dots stay square and sharp
  function fit() {
    const dpr = window.devicePixelRatio || 1;
    const avail = section.clientWidth;
    const wanted = avail / (53 * ACTIVITY.PITCH - 1) >= ACTIVITY.MIN_DOT ? 53 : 26;
    if (wanted !== weeks) {
      weeks = wanted;
      ({ cells, cols } = layoutDays(data.days, weeks));
      W = cols * ACTIVITY.PITCH - 1;
      H = ACTIVITY.BAND + 7 * ACTIVITY.PITCH - 1;
      canvas.width = W;
      canvas.height = H;
      if (selected) selected = cells.find((c) => c.date === selected.date) || null;
      writeSummary();
    }
    const k = Math.max(1, Math.floor((avail * dpr) / W));
    canvas.style.width = (W * k) / dpr + "px";
    canvas.style.height = (H * k) / dpr + "px";
    draw();
  }

  function writeSummary() {
    const year = weeks >= 53;
    const total = year ? data.total : cells.reduce((n, c) => n + c.count, 0);
    const word = total === 1 ? "contribution" : "contributions";
    summary.textContent = "";
    const num = document.createElement("b");
    num.className = "kw";
    num.textContent = total.toLocaleString("en-US");
    summary.append(num, ` ${word} in the last ${year ? "year" : "6 months"}`);
    const age = Date.now() - Date.parse(data.fetchedAt || "");
    if (age > ACTIVITY.STALE_DAYS * dayMs) {
      const when = new Date(data.fetchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
      const note = document.createElement("span");
      note.className = "activity__updated";
      note.textContent = ` · updated ${when}`;
      summary.append(note);
    }
  }

  // ---- timing of the fill-in and of Clawd
  const fillMs = () => (reduced ? ACTIVITY.FILL_REDUCED_MS : ACTIVITY.FILL_MS);
  const today = () => cells[cells.length - 1];
  const targetX = () => Math.max(0, Math.min(W - 22, today().col * ACTIVITY.PITCH + 2 - 11));
  const walkStart = -23;
  const walkSteps = () => Math.ceil((targetX() - walkStart) / ACTIVITY.STEP_CELLS);
  const arrivalMs = () => (reduced ? 0 : fillMs() + walkSteps() * ACTIVITY.STEP_MS);
  const settleMs = () => (settledEarly ? 0 : Math.max(ACTIVITY.SETTLE_MS, arrivalMs() + 3000));

  // How many dots of a square are on at time t (each dot appears in Bayer order).
  function dotsAt(cell, t) {
    const target = ACTIVITY.DOTS[cell.level];
    if (!started) return 0;
    const spread = reduced ? 0 : 0.2 * fillMs() * (cols > 1 ? cell.col / (cols - 1) : 0);   // left to right
    const span = fillMs() - (reduced ? 0 : 0.2 * fillMs());
    return Math.max(0, Math.min(target, Math.floor(((t - spread) / span) * 16)));
  }

  // Clawd's pose and place at time t, or null before he appears.
  function clawdAt(t) {
    const x = targetX();
    const frame = (ms) => Math.floor(ms / ACTIVITY.FRAME_MS);
    if (t - happyAt >= 0 && t - happyAt < 7 * ACTIVITY.FRAME_MS) {          // tapped: happy bounce
      return { pose: pose("front", { face: "happy", crouch: [0, 1, 1, 0, 1, 1, 0][frame(t - happyAt)] }), x };
    }
    if (!reduced && t < fillMs()) return null;
    if (!reduced && t < arrivalMs()) {                                       // the walk
      const step = Math.floor((t - fillMs()) / ACTIVITY.STEP_MS);
      const [legs, crouch] = WALK_STEPS[step % WALK_STEPS.length];
      return { pose: pose("side_right", { legs, crouch }), x: Math.min(x, walkStart + step * ACTIVITY.STEP_CELLS) };
    }
    const idle = t - arrivalMs();
    if (t < settleMs()) {                                                    // idle: blinks and bounces
      const bounce = [500, 4200].find((b) => idle >= b && idle < b + 4 * ACTIVITY.FRAME_MS);
      if (bounce !== undefined) return { pose: pose("front", { crouch: BOUNCE[frame(idle - bounce)] }), x };
      if ([1800, 6400].some((b) => idle >= b && idle < b + ACTIVITY.FRAME_MS)) return { pose: pose("front", { face: "blink" }), x };
    }
    return { pose: pose("front"), x };
  }

  const busy = (t) => t < Math.max(fillMs(), settleMs()) || t - happyAt < 7 * ACTIVITY.FRAME_MS;

  // ---- drawing
  function draw() {
    g.clearRect(0, 0, W, H);
    g.fillStyle = ink;
    for (const c of cells) {
      const n = dotsAt(c, clock);
      const x0 = c.col * ACTIVITY.PITCH, y0 = ACTIVITY.BAND + c.row * ACTIVITY.PITCH;
      for (let i = 0; i < n; i++) g.fillRect(x0 + DOT_ORDER[i].x, y0 + DOT_ORDER[i].y, 1, 1);
    }
    if (selected) {                                   // a one-dot frame around the chosen day
      const x0 = selected.col * ACTIVITY.PITCH - 1, y0 = ACTIVITY.BAND + selected.row * ACTIVITY.PITCH - 1;
      for (let i = 0; i < 6; i++) {
        g.fillRect(x0 + i, y0, 1, 1); g.fillRect(x0 + i, y0 + 5, 1, 1);
        g.fillRect(x0, y0 + i, 1, 1); g.fillRect(x0 + 5, y0 + i, 1, 1);
      }
    }
    const clawd = started ? clawdAt(clock) : null;
    if (clawd) {
      const grid = CLAWD_POSES[clawd.pose];
      const top = ACTIVITY.BAND - 1 - grid.length;
      grid.forEach((row, y) => [...row].forEach((ch, x) => {
        if (!CLAWD_COLORS[ch]) return;
        g.fillStyle = CLAWD_COLORS[ch];
        g.fillRect(clawd.x + x, top + y, 1, 1);
      }));
    }
  }

  // ---- the clock: runs while something moves, the graph is on screen and the tab is visible
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
    if (inView && !started && entry.intersectionRatio >= 0.4) { started = true; clock = 0; }
    if (inView && started && busy(clock)) play();
  }, { threshold: [0, 0.4] }).observe(canvas);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && started && busy(clock)) play(); });

  // ---- choosing a day: mouse, finger or keyboard
  function select(cell, fromHover = false) {
    selected = cell;
    hoverSelect = fromHover;
    line.textContent = cell ? dayLabel(cell, lastDate) : " ";
    draw();
  }
  function hit(e) {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
    const c = started ? clawdAt(clock) : null;
    if (c && x >= c.x && x < c.x + 23 && y < ACTIVITY.BAND) return { clawd: true };
    const col = Math.floor(x / ACTIVITY.PITCH), row = Math.floor((y - ACTIVITY.BAND) / ACTIVITY.PITCH);
    return { cell: cells.find((d) => d.col === col && d.row === row) || null };
  }
  function poke() {                                    // Clawd bounces with his happy face
    if (!started || (!reduced && clock < arrivalMs())) return;
    if (clock - happyAt < 7 * ACTIVITY.FRAME_MS) return;
    happyAt = clock;
    play();
  }
  box.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const h = hit(e);
    if (h.clawd) { if (!box.dataset.overClawd) poke(); box.dataset.overClawd = "1"; return; }
    delete box.dataset.overClawd;
    if (h.cell || hoverSelect) select(h.cell, true);
  });
  box.addEventListener("pointerleave", () => {
    delete box.dataset.overClawd;
    if (hoverSelect && document.activeElement !== box) select(null);
  });
  box.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch") return;
    const h = hit(e);
    if (h.clawd) poke();
    else if (h.cell) select(h.cell);
  });
  box.addEventListener("focus", () => { if (!selected) select(today()); });
  box.addEventListener("keydown", (e) => {
    const moves = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
    let next = null;
    const i = selected ? cells.indexOf(selected) : cells.length - 1;
    if (e.key in moves) next = cells[i + moves[e.key]];
    else if (e.key === "Home") next = cells[0];
    else if (e.key === "End") next = today();
    else return;
    e.preventDefault();
    if (next) select(next);
  });

  // ---- follow the theme, the window size and the motion setting
  function readInk() { ink = getComputedStyle(root).getPropertyValue("--ink").trim() || "#111"; }
  new MutationObserver(() => { readInk(); draw(); }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  new ResizeObserver(fit).observe(section);
  reducedQuery.addEventListener("change", () => { reduced = reducedQuery.matches; draw(); });
  // When the visitor pauses the scene, Clawd stops here too.
  document.addEventListener("scenepause", (e) => {
    if (e.detail && !e.detail.playing) { settledEarly = true; if (started) clock = Math.max(clock, fillMs()); draw(); }
  });

  readInk();
  box.hidden = false;
  fit();
  line.textContent = " ";

  return {
    replay() { started = true; clock = 0; happyAt = -1e9; settledEarly = false; play(); },
    // For tests and recordings: stop the clock and move it by hand.
    debug: {
      freeze() { running = false; started = true; clock = 0; draw(); },
      step(ms) { clock += ms; draw(); return canvas.toDataURL("image/png"); },
      get clock() { return clock; },
      get running() { return running; },
      get weeks() { return weeks; },
      get settleMs() { return settleMs(); },
    },
  };
}

// Loads the data and shows the graph; without valid data the section stays hidden.
async function startActivity() {
  const section = document.querySelector(".activity");
  if (!section) return null;
  const data = await loadContributions();
  if (!data) { section.hidden = true; return null; }
  section.querySelector(".activity__fallback").hidden = true;
  const graph = mountActivity(section, data);
  window.activityDebug = graph.debug;
  return graph;
}
