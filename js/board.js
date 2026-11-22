// Fills board.html (the design board) from the site's real data and styles.
// Not loaded by the home page.

(function () {
  const root = document.documentElement;

  // ---- Contrast ratios (WCAG), read from the live CSS variables of both themes.
  function luminance(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const ratio = (a, b) => {
    const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  const NAMES = ["paper", "ink", "muted", "surface", "line", "clawd", "level-1", "level-2", "level-3", "level-4"];
  function themeColours(theme) {
    const before = root.dataset.theme;
    root.dataset.theme = theme;                     // same task: nothing is painted in between
    const css = getComputedStyle(root);
    const out = {};
    NAMES.forEach((n) => { out[n] = css.getPropertyValue("--" + n).trim(); });
    root.dataset.theme = before;
    return out;
  }
  const list = document.getElementById("contrast");
  for (const theme of ["light", "dark"]) {
    const c = themeColours(theme);
    const rows = [
      [`${theme}: ink ${c.ink} on paper ${c.paper}`, ratio(c.ink, c.paper), 4.5],
      [`${theme}: ink on a card ${c.surface}`, ratio(c.ink, c.surface), 4.5],
      [`${theme}: muted text ${c.muted} on paper`, ratio(c.muted, c.paper), 4.5],
      [`${theme}: muted text on a card`, ratio(c.muted, c.surface), 4.5],
      [`${theme}: Clawd orange on paper (shapes, dots)`, ratio(c.clawd, c.paper), 3],
      ...[1, 2, 3, 4].map((l) => [`${theme}: graph level ${l} ${c["level-" + l]} on paper`, ratio(c["level-" + l], c.paper), 3]),
    ];
    for (const [label, r, need] of rows) {
      const li = document.createElement("li");
      li.textContent = `${label}: ${r.toFixed(2)}:1 (needs ${need}:1) ${r >= need ? "pass" : "fail"}`;
      list.append(li);
    }
  }
  // ---- Showcase: the components' own colours, measured once they are mounted.
  // Their CSS mixes colours with transparency (color-mix), so each colour is
  // painted over its real background on a 1 x 1 canvas and read back.
  const showcase = document.querySelector(".showcase:not(.is-failed)");
  const pixel = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  function painted(colour, over) {
    pixel.fillStyle = over; pixel.fillRect(0, 0, 1, 1);
    pixel.fillStyle = colour; pixel.fillRect(0, 0, 1, 1);
    const [r, g, b] = pixel.getImageData(0, 0, 1, 1).data;
    return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
  }
  function measureShowcase() {
    const out = document.getElementById("showcase-contrast");
    const q = (sel) => showcase.querySelector(sel);
    // A variable such as --shoji-fg holds light-dark() or color-mix() as text:
    // a probe element inside the component turns it into the colour in use.
    const css = (el, prop) => {
      if (!prop.startsWith("--")) return getComputedStyle(el).getPropertyValue(prop).trim();
      const probe = el.appendChild(document.createElement("i"));
      probe.style.color = `var(${prop})`;
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return colour;
    };
    const rows = [];
    const before = root.dataset.theme;
    // Colour transitions would report the old theme's colour: off while measuring.
    const still = document.head.appendChild(document.createElement("style"));
    still.textContent = "*, *::before, *::after { transition: none !important; }";
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;                   // same task: nothing is painted in between
      const paper = painted(css(root, "--paper"), "#000");
      const shoji = q(".shoji"), solid = q(".shoji__cell[data-solid]");
      const fg = painted(css(shoji, "--shoji-fg"), paper);
      const block = painted(css(q(".gem-clip__block"), "background-color"), paper);
      const pill = painted(css(q(".snooze-button"), "background-color"), paper);
      const pairs = [
        ["Shoji label on the page", painted(css(q(".shoji__cell:not([data-solid]) .shoji__label"), "color"), paper), paper, 4.5],
        ["Shoji label in the filled box", painted(css(solid.querySelector(".shoji__label"), "color"), fg), fg, 4.5],
        ["Shoji line (shape)", painted(css(shoji, "--shoji-line"), paper), paper, 3],
        ["Gem Clip command", painted(css(q(".gem-clip__block"), "color"), block), block, 4.5],
        ["Gem Clip clip at rest (shape)", painted(css(q(".gem-clip__clip--front"), "color"), paper), paper, 3],
        ["Gem Clip note \"Copied\"", painted(css(q(".gem-clip"), "--gem-clip-muted"), paper), paper, 4.5],
        ["Snooze label on the pill", painted(css(q(".snooze-button"), "color"), pill), pill, 4.5],
        ["Snooze pill on the page (shape)", pill, paper, 3],
      ];
      for (const [label, a, b, need] of pairs) rows.push(`${theme}: ${label}: ${a} on ${b}, ${ratio(a, b).toFixed(2)}:1 (needs ${need}:1) ${ratio(a, b) >= need ? "pass" : "fail"}`);
    }
    root.dataset.theme = before;
    still.remove();
    out.replaceChildren(...rows.map((t) => Object.assign(document.createElement("li"), { textContent: t })));
  }
  if (showcase) {
    new MutationObserver((_, seen) => {
      if (!showcase.classList.contains("is-live")) return;
      seen.disconnect();
      requestAnimationFrame(measureShowcase);
      document.getElementById("showcase-source").textContent =
        `Built from Experiments at ${window.showcase.commit.slice(0, 7)}.`;
    }).observe(showcase, { attributes: true, attributeFilter: ["class"] });
  }

  document.querySelectorAll("[data-var]").forEach((el) => {
    el.textContent = getComputedStyle(root).getPropertyValue(el.dataset.var).trim();
  });

  // ---- Dither levels and replays.
  const levels = document.getElementById("levels");
  window.dither.MASKS.forEach((mask) => {
    const s = document.createElement("span");
    s.style.maskImage = s.style.webkitMaskImage = mask;
    levels.append(s);
  });
  document.getElementById("replay-print").addEventListener("click", () => {
    const words = document.querySelectorAll(".board .kw");
    words.forEach((w) => w.classList.add("is-printing"));
    window.dither.stepMasks(720, (level) => words.forEach((w) => {
      w.style.maskImage = w.style.webkitMaskImage = window.dither.MASKS[level];
    }), () => words.forEach((w) => { w.classList.remove("is-printing"); w.style.maskImage = w.style.webkitMaskImage = ""; }));
  });
  document.getElementById("replay-enter").addEventListener("click", () => {
    document.querySelectorAll("#enter-demo .enter").forEach((el) => {
      el.classList.remove("enter");
      void el.offsetWidth;                            // restart the CSS animation
      el.classList.add("enter");
    });
  });

  // ---- Local time: one line per case, each at a fixed moment and visitor zone.
  const STATES = [
    ["Same time zone (Paris, Berlin)", "2026-11-21T20:41:00Z", "Europe/Paris"],
    ["Paris ahead (New York)", "2026-11-21T20:41:00Z", "America/New_York"],
    ["The weeks when only one side has changed the clocks (New York, 15 March)", "2026-03-15T20:41:00Z", "America/New_York"],
    ["Paris behind (Auckland)", "2026-11-21T20:41:00Z", "Pacific/Auckland"],
    ["Half-hour zone (Kolkata)", "2026-11-21T20:41:00Z", "Asia/Kolkata"],
    ["Quarter-hour zone (Kathmandu)", "2026-11-21T20:41:00Z", "Asia/Kathmandu"],
    ["Midnight in Paris (New York)", "2026-11-21T23:00:00Z", "America/New_York"],
  ];
  const states = document.getElementById("clock-states");
  const clocks = STATES.map(([label, at, zone]) => {
    const row = document.createElement("div");
    row.innerHTML = '<span class="label"></span><p class="intro">Hi, I\'m Yann, a student living in France<span class="clock"></span>.</p>';
    row.querySelector(".label").textContent = `${label}: ${at}, visitor in ${zone}`;
    const clock = row.querySelector(".clock");
    showClock(clock, clockAt(new Date(at), zone), false);
    states.append(row);
    return clock;
  });
  startClock(document.getElementById("live-clock"));
  document.getElementById("replay-clock").addEventListener("click", () => {
    const zone = STATES[0][2];
    showClock(clocks[0], clockAt(new Date("2026-11-21T20:59:00Z"), zone), false);
    setTimeout(() => showClock(clocks[0], clockAt(new Date("2026-11-21T21:00:00Z"), zone), true), 600);
  });

  // ---- Clawd's poses, cell by cell.
  const poses = document.getElementById("poses");
  for (const [name, grid] of Object.entries(CLAWD_POSES)) {
    const k = 3, c = document.createElement("canvas");
    c.width = grid[0].length * k; c.height = grid.length * k;
    const g = c.getContext("2d");
    grid.forEach((row, y) => [...row].forEach((ch, x) => {
      if (!CLAWD_COLORS[ch]) return;
      g.fillStyle = CLAWD_COLORS[ch];
      g.fillRect(x * k, y * k, k, k);
    }));
    const f = document.createElement("figure");
    const cap = document.createElement("figcaption");
    cap.textContent = name;
    f.append(c, cap);
    poses.append(f);
  }

  // ---- Living dots: three variants per zone, side by side (js/dots.js).
  const live = [];
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
  const CHOSEN = { kw: "kwSparkle", fringe: "fringeFlow", end: "endDrift" };   // Yann, 2026-11-22
  const VARIANTS = {
    kw: [
      ["A. Shuffle", "kwShuffle", "Appears once, its cells in a random order. Point at the word: a new pattern replaces the old one, cell by cell, in a random order."],
      ["B. Sparkle", "kwSparkle", "Appears once in a random order. Point at the word: it crackles for under a second, then settles back exactly as it was."],
      ["C. Write", "kwWrite", "Written once from left to right, the front ragged. Point at the word: it is written again with a new pattern."],
    ],
    fringe: [
      ["A. Breathe", "fringeBreathe", "The band swells and settles about every 5 s, its edge rising and falling cell by cell; a few edge cells twinkle."],
      ["B. Flow", "fringeFlow", "The patches drift sideways through the band, about 1.5 cells a second: cells light ahead of a patch and go out behind it."],
      ["C. Embers", "fringeEmbers", "The band stays; sparks leave it, each lighting the cell above it for two to five steps, then going out."],
    ],
    end: [
      ["A. Tide", "endTide", "Fills as you reach the end, from the bottom row up, in a random order; scrolling back up drains it. Only scrolling moves it."],
      ["B. Ripple", "endRipple", "Still; the pointer moving over it (or a tap) sends a ring through it, flipping the cells it crosses."],
      ["C. Drift", "endDrift", "Whenever it is on screen, its patches roll slowly up and sideways, like the light of embers."],
    ],
  };
  VARIANTS.kw.forEach(([name, key, text], v) => {
    const row = document.getElementById(CHOSEN.kw === key ? "live-kw" : "live-other-kw");
    const box = el("div", "live");
    box.append(el("h3", "", name), el("p", "", text));
    const intro = el("p", "live-intro");
    intro.append("I like ");
    const word = el("b", "kw", "building apps");
    intro.append(word, " with AI.");
    box.append(intro);
    row.append(box);
    const canvas = el("canvas", "kw__dots");
    word.append(canvas);
    requestAnimationFrame(() => live.push(DOTS.run(new DOTS.Field(canvas, { shape: "kw", cell: 2, step: 4, salt: 10 + v }), BEHAVIOURS[key], { word })));
  });
  VARIANTS.fringe.forEach(([name, key, text], v) => {
    const row = document.getElementById(CHOSEN.fringe === key ? "live-fringe" : "live-other-fringe");
    const box = el("div", "live");
    box.append(el("h3", "", name), el("p", "", text));
    const cards = el("div", "live-cards");
    box.append(cards);
    row.append(box);
    const pair = [0, 1].map((k) => {
      const card = el("div", "live-card");
      card.tabIndex = 0;
      card.append(el("b", "", k ? "Gem Clip" : "Shoji Bento"), el("span", "", "Open in Experiments"));
      const strip = el("div", "live-strip");
      const canvas = el("canvas");
      strip.append(canvas);
      card.append(strip);
      cards.append(card);
      return { card, canvas };
    });
    requestAnimationFrame(() => {
      const items = pair.map(({ card, canvas }, k) => {
        const item = DOTS.run(new DOTS.Field(canvas, { shape: "fringe", cell: 3, salt: 20 + v * 2 + k }), BEHAVIOURS[key], { card });
        live.push(item);
        return { card, item };
      });
      const activate = (which) => items.forEach(({ card, item }) => {
        const on = card === which;
        card.classList.toggle("is-on", on);
        item.behaviour.card.set(on);
      });
      items.forEach(({ card }) => {
        card.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") activate(card); });
        card.addEventListener("pointerdown", () => activate(card));
        card.addEventListener("focusin", () => activate(card));
      });
      activate(items[0].card);
    });
  });
  VARIANTS.end.forEach(([name, key, text], v) => {
    const row = document.getElementById(CHOSEN.end === key ? "live-end" : "live-other-end");
    const box = el("div", "live");
    box.append(el("h3", "", name), el("p", "", text));
    const scroll = el("div", "live-scroll");
    const filler = el("div", "filler");
    for (let i = 0; i < 6; i++) filler.append(el("p", "", "The rest of the page. Scroll down to its end."));
    const end = el("div", "live-end");
    const canvas = el("canvas");
    end.append(canvas);
    scroll.append(filler, end);
    box.append(scroll);
    row.append(box);
    requestAnimationFrame(() => live.push(DOTS.run(new DOTS.Field(canvas, { shape: "end", cell: 3, step: 9, salt: 30 + v }), BEHAVIOURS[key], { root: scroll })));
  });
  document.getElementById("live-seed").addEventListener("click", () => DOTS.newVisit());
  const reducedButton = document.getElementById("live-reduced");
  reducedButton.addEventListener("click", () => {
    const on = reducedButton.getAttribute("aria-pressed") !== "true";
    reducedButton.setAttribute("aria-pressed", String(on));
    DOTS.setReduced(on);
  });
  document.getElementById("live-replay").addEventListener("click", () => {
    live.filter((item) => item.field.shape === DOTS.SHAPES.kw).forEach((item) => { item.behaviour.reset(); item.behaviour.seen(item.time); item.field.paint(() => false); item.poke(); });
  });
  window.liveDots = live;

  // ---- The contribution graph, live.
  // Made-up data for the board only, clearly labelled, when the real file is not there yet.
  function sampleData() {
    let seed = 7;
    const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    const last = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
    const first = last - (52 * 7 + new Date(last).getUTCDay()) * 864e5;
    const days = [];
    for (let t = first; t <= last; t += 864e5) {
      const count = random() < 0.4 ? 1 + Math.floor(random() ** 2 * 12) : 0;
      days.push({ date: new Date(t).toISOString().slice(0, 10), count, level: count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 9 ? 3 : 4 });
    }
    return { login: "sample", fetchedAt: new Date().toISOString(), total: days.reduce((n, d) => n + d.count, 0), days };
  }
  loadContributions().then((real) => {
    const data = real && !real.sample ? real : sampleData();
    document.getElementById("graph-source").textContent = data === real
      ? "Data: contributions.json (real)."
      : "Data: sample data, not real activity (contributions.json is not there yet).";
    const section = document.getElementById("board-activity");
    section.querySelector(".activity__fallback").hidden = true;
    const graph = mountActivity(section, data);
    document.getElementById("replay-graph").addEventListener("click", () => graph.replay());
    document.getElementById("poke-graph").addEventListener("click", () => graph.poke());
  });
})();
