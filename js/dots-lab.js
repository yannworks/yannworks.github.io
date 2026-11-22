// Living dots: the variants Yann did not choose (2026-11-22), kept on the design
// board for comparison only. Not loaded by the home page. Needs js/dots.js.

Object.assign(BEHAVIOURS, (function () {
  const { clamp01 } = DOTS;
  const { activity, dissolved } = BEHAVIOURS.helpers;

  // A. Shuffle: the band appears once, its cells in a random order. Pointing at the
  //    word deals a new pattern: old cells give way to new ones in a random order.
  function kwShuffle(f, item, { word }) {
    let t0 = null, swapAt = null, next = null, prev = null;
    if (word) word.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse" || t0 === null || swapAt !== null || DOTS.reduced) return;
      prev = Uint8Array.from(f.on);
      f.useNoise(DOTS.noise((f.random() * 4294967296) >>> 0, f.step));
      next = Uint8Array.from(f.base, (d, i) => (d > f.thr[i] ? 1 : 0));
      swapAt = item.time; item.poke();
    });
    return {
      seen(t) { if (t0 === null) t0 = t; },
      reset() { t0 = null; swapAt = null; },
      tick(t) {
        if (t0 === null) return false;
        if (swapAt !== null) {
          const p = (t - swapAt) / 500;
          f.paint((i) => (f.rank[i] < p ? next[i] : prev[i]));
          if (p >= 1) swapAt = null;
          return true;
        }
        f.paint((i) => f.still(i) && dissolved(f, i, t, t0, 700));
        return t - t0 < 700;
      },
    };
  }

  // C. Write: the band is written once from left to right, the front ragged.
  //    Pointing at the word writes it again over itself, with a new pattern.
  function kwWrite(f, item, { word }) {
    let t0 = null, writing = false, prev = null;
    if (word) word.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse" || t0 === null || writing || DOTS.reduced) return;
      prev = Uint8Array.from(f.on);
      f.useNoise(DOTS.noise((f.random() * 4294967296) >>> 0, f.step));
      t0 = item.time; writing = true; item.poke();
    });
    return {
      seen(t) { if (t0 === null) { t0 = t; writing = true; } },
      reset() { t0 = null; prev = null; writing = false; },
      tick(t) {
        if (t0 === null) return false;
        const p = (t - t0) / 600;
        f.paint((i, x) => {
          const front = x / f.cols + (f.rank[i] - 0.5) * 0.16;
          return front < p ? f.still(i) : prev ? prev[i] === 1 : false;
        });
        if (p >= 1.1) { writing = false; prev = null; return false; }
        return true;
      },
    };
  }

  // A. Breathe: the band slowly swells and settles, about every 5 s, its edge
  //    rising and falling cell by cell; a few cells near the edge twinkle.
  function fringeBreathe(f, item, { card }) {
    const a = activity(item, f);
    if (card) card.dots = a;
    return {
      card: a,
      still: (i) => a.active && f.still(i),
      tick(t) {
        const level = 0.82 + 0.18 * Math.sin((2 * Math.PI * t) / 5200);
        f.paint((i) => {
          const d = f.base[i] * level;
          const edge = Math.abs(d - f.thr[i]) < 0.06 && f.random() < 0.25;
          return a.gate(i, t) && (edge ? !(d > f.thr[i]) : d > f.thr[i]);
        });
        return a.active || a.settling(t);
      },
    };
  }

  // C. Embers: the band stays, and sparks leave it: a cell lights above the band
  //    and the next cell up takes over, for two to five steps, then goes out.
  function fringeEmbers(f, item, { card }) {
    const a = activity(item, f);
    if (card) card.dots = a;
    let sparks = [];
    return {
      card: a,
      still: (i) => a.active && f.still(i),
      reset() { sparks = []; },
      tick(t) {
        if (a.active) {
          for (let k = 0; k < Math.max(1, f.cols / 40); k++) {
            if (f.random() < 0.55) sparks.push({ x: Math.floor(f.random() * f.cols), y: f.rows - 2 - Math.floor(f.random() * f.rows * 0.4), life: 2 + Math.floor(f.random() * 4) });
          }
        }
        const lit = new Set(sparks.map((s) => s.y * f.cols + s.x));
        sparks = sparks.map((s) => ({ ...s, y: s.y - 1, life: s.life - 1 })).filter((s) => s.life > 0 && s.y >= 0);
        f.paint((i) => a.gate(i, t) && (f.still(i) || lit.has(i)));
        return a.active || a.settling(t) || sparks.length > 0;
      },
    };
  }

  // A. Tide: the field fills as the visitor reaches the end of the page, from the
  //    bottom row up, cells in a random order; scrolling back up drains it. Only
  //    scrolling moves it.
  function endTide(f, item, { root }) {
    let p = 0, shown = -1;
    const scroller = root || window;
    const measure = () => {
      const r = f.canvas.getBoundingClientRect();
      const bottom = root ? root.getBoundingClientRect().bottom : innerHeight;
      p = clamp01((bottom - r.top) / r.height);
    };
    scroller.addEventListener("scroll", () => { measure(); item.poke(); }, { passive: true });
    return {
      seen() { measure(); },
      still: (i) => f.still(i),
      tick() {
        measure();
        if (!f.fresh && Math.abs(p - shown) < 0.001) return false;
        shown = p;
        f.paint((i, x, y) => f.still(i) && p * 1.25 > (1 - y / f.rows) * 0.7 + f.rank[i] * 0.4);
        return true;
      },
    };
  }

  // B. Ripple: the field is still; the pointer moving over it (or a tap) sends a
  //    ring through it, flipping the cells it crosses.
  function endRipple(f, item) {
    let rings = [], lastAt = -1e9;
    const add = (e) => {
      if (item.time - lastAt < 280 && e.type === "pointermove") return;
      lastAt = item.time;
      const r = f.canvas.getBoundingClientRect();
      rings.push({ x: ((e.clientX - r.left) / r.width) * f.cols, y: ((e.clientY - r.top) / r.height) * f.rows, t: item.time });
      item.poke();
    };
    f.canvas.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") add(e); });
    f.canvas.addEventListener("pointerdown", add);
    let first = true;
    return {
      still: (i) => f.still(i),
      reset() { rings = []; first = true; },
      tick(t) {
        rings = rings.filter((r) => t - r.t < 1000);
        if (!rings.length && !first) { f.paint((i) => f.still(i)); return false; }
        first = false;
        f.paint((i, x, y) => {
          let flip = false;
          for (const r of rings) {
            const radius = ((t - r.t) / 1000) * 40, d = Math.hypot(x - r.x, (y - r.y) * 1.4);
            if (Math.abs(d - radius) < 1.2 && f.random() < 0.85 * (1 - (t - r.t) / 1000)) flip = !flip;
          }
          return flip ? !f.still(i) : f.still(i);
        });
        return true;
      },
    };
  }

  return { kwShuffle, kwWrite, fringeBreathe, fringeEmbers, endTide, endRipple };
})());
