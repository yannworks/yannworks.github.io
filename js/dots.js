// Living dots: the engine behind the orange dither.
//
// The dots never slide. Every cell stays on its grid; what moves is which cells
// are on. Each zone is a Field: a canvas, a grid of cells, and for each cell a
// density (how much the zone wants a dot there) and a threshold from the 8 x 8
// Bayer grid. A cell is on when its density is above its threshold. A behaviour
// changes the densities, or picks cells at random, over time.
//
// - One requestAnimationFrame loop for every field, stepping at a pixel cadence
//   (FPS below), not at the screen's 60 Hz: the dots change in small jumps.
// - A field only gets frames while it is on screen (IntersectionObserver), the
//   tab is visible, and its behaviour says it is busy. With nothing busy, the
//   loop stops.
// - A new seed on every visit (crypto), plus randomness in time.
// - Reduced motion: each field shows one still image, today's, and never moves.
// - Only the cells that change are painted (fillRect / clearRect).

const DOTS = (function () {
  const COLOUR = "#d97757";
  const FPS = 12;
  const STEP = 1000 / FPS;

  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = reducedQuery.matches;
  let visit = crypto.getRandomValues(new Uint32Array(1))[0];

  // ---- maths
  const b2 = (x, y) => ((x % 2) * 0.5 + (y % 2) * 0.75) % 1;
  const bayer8 = (x, y) => (b2(x >> 2, y >> 2) * 0.25 + b2(x >> 1, y >> 1)) * 0.25 + b2(x, y);
  const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  function rng(seed) {                                   // mulberry32
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Smooth noise between 0 and 1 from random values on a coarse lattice; x and y
  // may be fractions, so a moving offset makes the patches drift.
  function noise(seed, step) {
    const lattice = new Map();
    const at = (i, j) => {
      const key = i * 7919 + j;
      let v = lattice.get(key);
      if (v === undefined) {
        // Drifting noise keeps meeting new lattice points; every value can be recomputed.
        if (lattice.size > 4096) lattice.clear();
        v = rng(seed ^ Math.imul(i, 374761393) ^ Math.imul(j, 668265263))();
        lattice.set(key, v);
      }
      return v;
    };
    const ease = (t) => t * t * (3 - 2 * t);
    return (x, y) => {
      const i = Math.floor(x / step), j = Math.floor(y / step);
      const fx = ease(x / step - i), fy = ease(y / step - j);
      const a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
  }

  // ---- shapes: how dense a zone wants its dots at (u, v), 0 to 1 across the canvas
  const SHAPES = {
    kw: (u, v, n) => (1 - 0.6 * v) * (0.05 + 0.6 * n * n),
    fringe: (u, v, n) => smooth(0.1, 1, v) ** 1.4 * (0.1 + 0.75 * n),
    end: (u, v, n) => smooth(0.1, 1, v) ** 1.8 * (0.1 + 0.8 * n),
  };

  // ---- a field: one canvas and its grid
  class Field {
    constructor(canvas, { shape, cell = 3, step = 7, salt = 1 }) {
      this.canvas = canvas;
      this.shape = typeof shape === "string" ? SHAPES[shape] : shape;
      this.cell = cell;
      this.step = step;
      this.salt = salt;
      this.g = canvas.getContext("2d");
      this.width = -1;
      this.reseed();
    }
    reseed() {
      this.seed = (visit ^ Math.imul(this.salt, 2654435761)) >>> 0;
      this.noise = noise(this.seed, this.step);
      this.random = rng(this.seed + 1);
      this.width = -1;
      this.layout();
    }
    // Sizes the grid to the canvas; false when nothing changed.
    layout() {
      const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
      if (!w || !h || w === this.width) return false;
      this.width = w;
      const dpr = window.devicePixelRatio || 1;
      const c = (this.c = Math.max(1, Math.round(this.cell * dpr)));
      this.canvas.width = Math.ceil((w * dpr) / c) * c;
      this.canvas.height = Math.ceil((h * dpr) / c) * c;
      const cols = (this.cols = this.canvas.width / c), rows = (this.rows = this.canvas.height / c);
      const count = cols * rows;
      this.thr = new Float32Array(count);
      this.base = new Float32Array(count);
      this.rank = new Float32Array(count);     // a random order of the cells, for dissolves
      this.on = new Uint8Array(count);
      for (let y = 0, i = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++, i++) {
          this.thr[i] = bayer8(x & 7, y & 7);
          this.base[i] = this.density(x, y, 0, 0);
          this.rank[i] = this.random();
        }
      }
      this.g.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.fresh = true;                       // nothing painted on the new grid yet
      return true;
    }
    // Uses another noise from now on (a new pattern), and recomputes the densities.
    useNoise(n) {
      this.noise = n;
      for (let y = 0, i = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++, i++) this.base[i] = this.density(x, y, 0, 0);
    }
    // The zone's density at cell (x, y), with the noise read at an offset (ox, oy).
    density(x, y, ox, oy, noiseFn = this.noise) {
      return this.shape(x / (this.cols - 1 || 1), y / (this.rows - 1 || 1), noiseFn(x + ox, y + oy));
    }
    // Paints want(i, x, y) for every cell, touching only the cells that change.
    paint(want) {
      const { cols, rows, c, g, on } = this;
      this.fresh = false;
      g.fillStyle = COLOUR;
      for (let y = 0, i = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++, i++) {
          const w = want(i, x, y) ? 1 : 0;
          if (w === on[i]) continue;
          on[i] = w;
          if (w) g.fillRect(x * c, y * c, c, c);
          else g.clearRect(x * c, y * c, c, c);
        }
      }
    }
    still(i) { return this.base[i] > this.thr[i]; }
  }

  // ---- the loop
  const items = new Set();
  const stats = { steps: 0, ms: 0, worst: 0 };   // script time spent in steps (for measurements)
  let raf = 0, last = 0, acc = 0;
  function wake() { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
  function frame(now) {
    raf = 0;
    if (document.hidden) return;
    const dt = last ? Math.min(250, now - last) : 0;
    last = now;
    acc += dt;
    let busy = false;
    const tick = acc >= STEP;
    if (tick) acc %= STEP;
    const t0 = tick ? performance.now() : 0;
    for (const item of items) {
      if (!item.visible || reduced) continue;
      if (tick) {
        item.time += STEP;
        item.busy = item.behaviour.tick(item.time) !== false;
      }
      busy = busy || item.busy;
    }
    if (tick) {
      const spent = performance.now() - t0;
      stats.steps++; stats.ms += spent; stats.worst = Math.max(stats.worst, spent);
    }
    if (busy) raf = requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) wake(); });

  // Puts a behaviour on a field and keeps it running while it is on screen.
  function run(field, make, options = {}) {
    const item = { field, time: 0, visible: false, busy: true };
    item.behaviour = make(field, item, options);
    item.poke = () => { item.busy = true; wake(); };
    items.add(item);
    const still = () => { field.layout(); field.paint(item.behaviour.still ? (i, x, y) => item.behaviour.still(i, x, y) : (i) => field.still(i)); };
    item.still = still;
    new IntersectionObserver(([e]) => {
      item.visible = e.isIntersecting;
      if (item.visible && item.behaviour.seen) item.behaviour.seen(item.time);
      if (item.visible) item.poke();
    }, { root: options.root || null }).observe(field.canvas);
    new ResizeObserver(() => { if (field.layout()) { reduced ? still() : item.poke(); } }).observe(field.canvas);
    if (reduced) still();
    return item;
  }

  function setReduced(on) {
    reduced = on;
    for (const item of items) { item.field.width = -1; item.field.layout(); reduced ? item.still() : item.poke(); }
  }
  reducedQuery.addEventListener("change", (e) => setReduced(e.matches));

  function newVisit() {
    visit = crypto.getRandomValues(new Uint32Array(1))[0];
    for (const item of items) {
      item.field.reseed();
      if (item.behaviour.reset) item.behaviour.reset(item.time);
      reduced ? item.still() : item.poke();
    }
  }

  return { COLOUR, FPS, stats, Field, run, setReduced, newVisit, noise, rng, smooth, clamp01, SHAPES, get reduced() { return reduced; } };
})();

// ------------------------------------------------------------------ behaviours
// Each behaviour is make(field, item, options) -> { tick(time) -> busy?, still?, seen?, reset? }.
// `time` is the item's own clock in ms; it only runs while the field is on screen.

const BEHAVIOURS = (function () {
  const { smooth, clamp01 } = DOTS;

  // Cells appear in their random rank order between t0 and t0 + ms.
  const dissolved = (f, i, t, t0, ms) => f.rank[i] < clamp01((t - t0) / ms);

  // ---------------- under a keyword (kw): one-off triggers only, never while reading

  // Sparkle (chosen for the keywords). The band appears once, its cells in a
  // random order, after the word itself has printed. Pointing at the word makes
  // it crackle: random cells flip for 600 ms, fewer and fewer, then it is
  // exactly as before. Nothing moves while the visitor reads.
  function kwSparkle(f, item, { word }) {
    let t0 = null, sparkAt = null;
    if (word) word.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse" || t0 === null || DOTS.reduced) return;
      sparkAt = item.time; item.poke();
    });
    return {
      seen(t) { if (t0 === null) t0 = t; },
      reset() { t0 = null; sparkAt = null; },
      tick(t) {
        if (t0 === null) return false;
        if (word && word.classList.contains("is-printing")) { t0 = t; return true; }   // wait for the print
        const q = sparkAt === null ? 0 : 0.45 * (1 - clamp01((t - sparkAt) / 600)) ** 2;   // most flips in the first 250 ms
        f.paint((i) => {
          const on = f.still(i) && dissolved(f, i, t, t0, 700);
          return q && f.random() < q * (on ? 0.6 : 0.35) ? !on : on;
        });
        return t - t0 < 700 || (sparkAt !== null && t - sparkAt < 650);
      },
    };
  }

  // ---------------- the active card's strip (fringe): lives while active and on screen

  // Shared: switching cards. The strip lights in a random order (300 ms) when its
  // card becomes active and goes out in a random order (200 ms) when it stops.
  // instant: reached with the keyboard, so the change is immediate (no motion).
  function activity(item, f) {
    let active = false, changedAt = -1e9;
    return {
      set(on, instant = false) {
        if (on === active) return;
        // Reversed halfway: carry on from the share of cells lit now, not from zero (M11).
        const k = this.share(item.time);
        active = on;
        changedAt = instant ? item.time - 1000 : on ? item.time - k * 300 : item.time - (1 - k) * 200;
        DOTS.reduced ? item.still() : item.poke();
      },
      // Share of the strip's cells allowed on at time t: 0 (out) to 1 (lit).
      share(t) { return active ? clamp01((t - changedAt) / 300) : 1 - clamp01((t - changedAt) / 200); },
      get active() { return active; },
      // Is cell i allowed on at time t? All of them once lit, none once out,
      // and in between the share given by the clock, in the cells' random order.
      gate(i, t) { return f.rank[i] < this.share(t); },
      settling(t) { return t - changedAt < 320; },
    };
  }

  // Flow (chosen for the active card). The noise under the band drifts sideways,
  // about 1.5 cells a second, swaying a little up and down: cells light ahead of a
  // patch and go out behind it, so the band seems to flow while the grid stays put.
  // Only while its card is active and on screen.
  function fringeFlow(f, item, { card }) {
    const a = activity(item, f);
    if (card) card.dots = a;
    return {
      card: a,
      still: (i) => a.active && f.still(i),
      tick(t) {
        const ox = t * 0.0015, oy = Math.sin(t / 3100) * 0.8;
        f.paint((i, x, y) => a.gate(i, t) && f.density(x, y, ox, oy) > f.thr[i]);
        return a.active || a.settling(t);
      },
    };
  }

  // ---------------- the end of the page (end): drifts while on screen

  // Drift (chosen for the end of the page). Whenever the field is on screen, its
  // noise rolls slowly up and sideways (about 1.1 and 0.6 cells a second), like the
  // glow of embers: the page ends on something quietly alive. The one zone that
  // moves without the visitor doing anything (a deliberate exception, see STATE.md).
  function endDrift(f) {
    return {
      still: (i) => f.still(i),
      tick(t) {
        const ox = t * 0.0011, oy = -t * 0.0006;
        f.paint((i, x, y) => f.density(x, y, ox, oy) > f.thr[i]);
        return true;
      },
    };
  }

  return { kwSparkle, fringeFlow, endDrift, helpers: { activity, dissolved } };
})();
