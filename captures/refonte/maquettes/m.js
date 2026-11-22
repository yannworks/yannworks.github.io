// Mock-ups of the redesign: shared behaviour. Not the site's code.
// - ditherField(): draws orange dots on a canvas with the 8 x 8 Bayer grid,
//   denser where shape(x, y) is high. Drawn once per size; nothing animates by itself.
// - the contribution graph as plain squares, with Clawd (approved grid) on today.
// - the three real components, mounted from the site's showcase bundle.

(function () {
  const root = document.documentElement;
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  // ---------- dither
  const b2 = (x, y) => ((x % 2) * 0.5 + (y % 2) * 0.75) % 1;
  const bayer8 = (x, y) => (b2(x >> 2, y >> 2) * 0.25 + b2(x >> 1, y >> 1)) * 0.25 + b2(x, y);
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  // Smooth value noise on a coarse lattice, 0..1.
  function noise2(seed, step) {
    const r = rng(seed), cache = new Map();
    const at = (i, j) => { const k = i + ":" + j; if (!cache.has(k)) cache.set(k, r()); return cache.get(k); };
    const s = (t) => t * t * (3 - 2 * t);
    return (x, y) => {
      const i = Math.floor(x / step), j = Math.floor(y / step), fx = s(x / step - i), fy = s(y / step - j);
      const a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
  }
  const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

  // shape(u, v, n) -> 0..1 density; u, v are 0..1 across the canvas, n is noise 0..1.
  function ditherField(canvas, { cell = 3, shape, seed = 7, noiseStep = 7 }) {
    const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const c = Math.max(1, Math.round(cell * dpr));
    canvas.width = Math.ceil((w * dpr) / c) * c;
    canvas.height = Math.ceil((h * dpr) / c) * c;
    const cols = canvas.width / c, rows = canvas.height / c;
    const g = canvas.getContext("2d");
    const n = noise2(seed, noiseStep);
    const orange = css("--clawd") || "#d97757";
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = orange;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const d = shape(x / (cols - 1 || 1), y / (rows - 1 || 1), n(x, y));
        if (d > bayer8(x & 7, y & 7)) g.fillRect(x * c, y * c, c, c);
      }
    }
  }
  const SHAPES = {
    // card bottom: nothing at the top edge, solid-ish at the bottom, patchy in between
    fringe: (u, v, n) => smooth(0.05, 1, v) * (0.55 + 0.75 * n),
    // under a keyword: dense right under the word, fading downward
    underline: (u, v, n) => (1 - smooth(0, 1, v)) * (0.55 + 0.6 * n),
    // page end: rises from the bottom, in patches
    field: (u, v, n) => Math.pow(smooth(0.15, 1, v), 1.7) * (0.25 + 0.95 * n),
  };

  const drawn = [];
  function paint(canvas, opts) { drawn.push([canvas, opts]); ditherField(canvas, opts); }
  function repaint() { drawn.forEach(([c, o]) => ditherField(c, o)); }
  let t = 0;
  addEventListener("resize", () => { clearTimeout(t); t = setTimeout(repaint, 120); });

  function setupDither() {
    document.querySelectorAll(".fringe").forEach((f, i) => {
      const cv = f.querySelector("canvas") || f.appendChild(document.createElement("canvas"));
      paint(cv, { cell: +f.dataset.cell || 3, shape: SHAPES.fringe, seed: 11 + i * 17 });
    });
    document.querySelectorAll(".kw--dither .kw").forEach((k, i) => {
      const cv = k.appendChild(document.createElement("canvas"));
      cv.setAttribute("aria-hidden", "true");
      paint(cv, { cell: 2, shape: SHAPES.underline, seed: 3 + i * 5, noiseStep: 4 });
    });
    document.querySelectorAll(".end").forEach((e, i) => {
      const cv = e.querySelector("canvas") || e.appendChild(document.createElement("canvas"));
      paint(cv, { cell: +e.dataset.cell || 4, shape: SHAPES.field, seed: 99 + i, noiseStep: 9 });
    });
  }

  // ---------- theme
  const toggle = document.querySelector(".toggle");
  if (toggle) toggle.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    repaint(); drawGraph();
  });

  // ---------- cards: touch activates, scroll activates (direction B)
  document.querySelectorAll(".card, [data-card]").forEach((card) => {
    card.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch") return;
      document.querySelectorAll(".is-active").forEach((c) => c !== card && c.classList.remove("is-active"));
      card.classList.add("is-active");
    });
  });
  if (document.body.dataset.active === "scroll") {
    const items = [...document.querySelectorAll("[data-card]")];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => en.target.classList.toggle("is-active", en.isIntersecting));
    }, { rootMargin: "-40% 0px -40% 0px" });
    items.forEach((el) => io.observe(el));
  }

  // ---------- graph
  let data = null;
  async function drawGraph() {
    const host = document.querySelector(".graph");
    if (!host) return;
    if (!data) data = await fetch("../../../contributions.json").then((r) => r.json());
    const weeks = +(host.dataset.weeks || 26);
    const days = data.days;
    const start = Date.parse(days[0].date + "T00:00:00Z");
    const offset = new Date(start).getUTCDay();
    const all = days.map((d) => { const i = Math.round((Date.parse(d.date + "T00:00:00Z") - start) / 864e5) + offset; return { ...d, col: Math.floor(i / 7), row: i % 7 }; });
    const last = all[all.length - 1].col, first = Math.max(0, last - weeks + 1);
    const cells = all.filter((c) => c.col >= first);
    const grid = host.querySelector(".graph__grid");
    const gap = +(host.dataset.gap || 3);
    const avail = host.parentElement.clientWidth;
    const sq = Math.min(+(host.dataset.sq || 12), Math.floor((avail - (weeks - 1) * gap) / weeks));
    grid.style.setProperty("--sq", sq + "px"); grid.style.setProperty("--gap", gap + "px");
    grid.innerHTML = "";
    // leading empty slots so row = weekday
    for (let i = 0; i < cells[0].row; i++) { const s = document.createElement("span"); s.style.visibility = "hidden"; grid.append(s); }
    let total = 0;
    cells.forEach((c, i) => {
      const s = document.createElement("span");
      s.dataset.l = c.level; total += c.count;
      s.title = `${c.count} · ${c.date}`;
      if (i === cells.length - 1) s.className = "is-today";
      grid.append(s);
    });
    // months
    const months = host.querySelector(".graph__months");
    months.innerHTML = "";
    const labels = [];
    cells.forEach((c) => {
      if (c.row !== 0) return;
      const m = new Date(c.date + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
      if (!labels.length || labels[labels.length - 1].m !== m) labels.push({ m, col: c.col - first });
    });
    labels.forEach((l, k) => {
      const next = labels[k + 1];
      if ((next && next.col - l.col < 3) || l.col > weeks - 3) return;   // no room for the word
      const el = document.createElement("span"); el.textContent = l.m; el.style.left = l.col * (sq + gap) + "px"; months.append(el);
    });
    // Clawd on today's column, 2 px per cell of the approved front grid
    const today = cells[cells.length - 1];
    let cv = host.querySelector(".graph__clawd");
    if (!cv) { cv = document.createElement("canvas"); cv.className = "graph__clawd"; host.append(cv); }
    const pose = CLAWD_POSES[host.dataset.pose || "front"];
    cv.width = 22; cv.height = 16;
    const g = cv.getContext("2d"); g.clearRect(0, 0, 22, 16);
    pose.forEach((row, y) => [...row].forEach((ch, x) => { if (CLAWD_COLORS[ch]) { g.fillStyle = CLAWD_COLORS[ch]; g.fillRect(x, y, 1, 1); } }));
    const x = (today.col - first) * (sq + gap) + sq / 2 - 22;
    cv.style.left = Math.max(0, x) + "px";
    cv.style.top = (36 + today.row * (sq + gap) - 32 - 2) + "px";
    if (today.row > 0) cv.style.top = "0px";
    const sum = document.querySelector(".activity__summary .kw");
    if (sum) sum.textContent = total.toLocaleString("en-US");
  }

  // ---------- components
  function mountComponents() {
    if (!window.showcase) return;
    document.querySelectorAll("[data-showcase]").forEach((host) => window.showcase.mount(host));
  }

  // ---------- clock
  const clockEl = document.querySelector(".intro .clock");
  if (clockEl && window.startClock) startClock(clockEl);

  addEventListener("load", () => {
    setupDither();
    drawGraph();
    mountComponents();
  });
})();
