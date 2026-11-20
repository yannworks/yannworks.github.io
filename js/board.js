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
  function themeColours(theme) {
    const before = root.dataset.theme;
    root.dataset.theme = theme;                     // same task: nothing is painted in between
    const css = getComputedStyle(root);
    const out = { paper: css.getPropertyValue("--paper").trim(), ink: css.getPropertyValue("--ink").trim() };
    root.dataset.theme = before;
    return out;
  }
  const list = document.getElementById("contrast");
  for (const theme of ["light", "dark"]) {
    const c = themeColours(theme);
    const rows = [
      [`${theme}: ink ${c.ink} on paper ${c.paper}`, ratio(c.ink, c.paper), 4.5],
      [`${theme}: Clawd orange on paper`, ratio("#d97757", c.paper), 3],
    ];
    for (const [label, r, need] of rows) {
      const li = document.createElement("li");
      li.textContent = `${label}: ${r.toFixed(2)}:1 (needs ${need}:1) ${r >= need ? "pass" : "fail"}`;
      list.append(li);
    }
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

  // ---- The show's timeline.
  const normal = buildTimeline(false), reduced = buildTimeline(true);
  const body = document.querySelector("#timeline tbody");
  normal.list.forEach((m, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${m.start.toFixed(1)} s</td><td>${reduced.list[i].start.toFixed(1)} s</td><td></td>`;
    tr.lastChild.textContent = m.name;
    body.append(tr);
  });
  const end = document.createElement("tr");
  end.innerHTML = `<td>${normal.length.toFixed(1)} s</td><td>${reduced.length.toFixed(1)} s</td><td>The loop starts again</td>`;
  body.append(end);

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

  // ---- Props in grey, as the shader receives them.
  const props = document.getElementById("props");
  for (const [label, t] of [["at the piano", 10], ["typing", 25], ["robot awake, waving", 40.05], ["robot open", 37]]) {
    const layer = makeLayer(STAGE.W, STAGE.H);
    paintProps(layer, showAt(normal, t));
    const k = 2, c = document.createElement("canvas");
    c.width = STAGE.W * k; c.height = STAGE.H * k;
    const g = c.getContext("2d");
    for (let y = 0; y < STAGE.H; y++) {
      for (let x = 0; x < STAGE.W; x++) {
        const i = (y * STAGE.W + x) * 4;
        if (!layer.data[i + 3]) continue;
        const v = layer.data[i];
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.fillRect(x * k, y * k, k, k);
      }
    }
    const f = document.createElement("figure");
    const cap = document.createElement("figcaption");
    cap.textContent = label + ` (t = ${t} s)`;
    f.append(c, cap);
    props.append(f);
  }

  // ---- The contribution graph: the five levels, then the live component.
  const legend = document.getElementById("levels-legend");
  const ink = getComputedStyle(root).getPropertyValue("--ink").trim();
  ACTIVITY.DOTS.forEach((n, level) => {
    const k = 8, c = document.createElement("canvas");
    c.width = c.height = 4 * k;
    const g = c.getContext("2d");
    g.fillStyle = ink;
    for (let i = 0; i < n; i++) g.fillRect(DOT_ORDER[i].x * k, DOT_ORDER[i].y * k, k, k);
    const f = document.createElement("figure");
    const cap = document.createElement("figcaption");
    cap.textContent = `level ${level}: ${n} dot${n > 1 ? "s" : ""}`;
    f.className = "swatch";
    f.style.margin = "0";
    f.append(c, cap);
    legend.append(f);
  });

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
  });
})();
