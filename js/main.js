// Page behaviour: the theme toggle with its dither dissolve, and the
// keywords "printing" in dots as the intro appears.

(function () {
  const root = document.documentElement;
  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const darkQuery = matchMedia("(prefers-color-scheme: dark)");
  const toggle = document.querySelector(".theme-toggle");
  const scene = startScene();
  startActivity();                     // the GitHub graph (js/activity.js)

  // ---- Dither masks.
  // The same 8 x 8 Bayer thresholds as the shader in stage.js. Mask number
  // `level` (0 to 64) shows the cells whose threshold is below level / 64:
  // stepping through them makes something appear dot by dot, in the same
  // pattern as the scene.
  const bayer2 = (x, y) => ((x % 2) * 0.5 + (y % 2) * (y % 2) * 0.75) % 1;
  const bayer8 = (x, y) => (bayer2(x >> 2, y >> 2) * 0.25 + bayer2(x >> 1, y >> 1)) * 0.25 + bayer2(x, y);
  const MASKS = [];
  for (let level = 0; level <= 64; level++) {
    let path = "";
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) if (bayer8(x, y) * 64 < level) path += `M${x} ${y}h1v1h-1z`;
    }
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' shape-rendering='crispEdges'><path d='${path}'/></svg>`;
    MASKS.push(`url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
  }

  // Calls set(level) on every frame for `ms` milliseconds, level 0 -> 64.
  function stepMasks(ms, set, done) {
    const start = performance.now();
    requestAnimationFrame(function frame(now) {
      const k = Math.min(1, (now - start) / ms);
      set(Math.round(k * 64));
      if (k < 1) requestAnimationFrame(frame);
      else if (done) done();
    });
  }

  // Shared with board.html (the design-system page), which replays them.
  window.dither = { MASKS, stepMasks };

  // ---- Theme
  function storedTheme() {
    try { return localStorage.getItem("theme"); } catch (e) { return null; }
  }

  function applyTheme(theme, ms) {
    root.dataset.theme = theme;
    const dark = theme === "dark";
    toggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.content = getComputedStyle(root).getPropertyValue("--paper").trim();
    });
    if (scene) scene.setTheme(dark, ms);
  }

  // Lines the page's dots up with the scene's dots, so both use one grid.
  function alignDots() {
    const canvas = document.querySelector(".scene__canvas");
    const cell = parseFloat(getComputedStyle(root).getPropertyValue("--cell")) || 2;
    const tile = cell * 8;
    const r = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
    root.style.setProperty("--dither-x", (((r.left % tile) + tile) % tile) + "px");
    root.style.setProperty("--dither-y", (((r.top % tile) + tile) % tile) + "px");
  }

  function switchTheme(theme, remember = true) {
    if (theme === root.dataset.theme) return;
    if (remember) {
      try { localStorage.setItem("theme", theme); } catch (e) { /* private mode: not remembered */ }
    }
    const ms = reducedQuery.matches ? 250 : 500;
    root.style.setProperty("--dissolve", ms + "ms");

    // The dissolve: the browser keeps a picture of the old page, draws the
    // new theme, and we reveal the new one through the dither masks.
    if (document.startViewTransition && CSS.supports("mask-image", "none")) {
      alignDots();
      root.style.setProperty("--dither-mask", MASKS[0]);
      const transition = document.startViewTransition(() => applyTheme(theme, ms));
      transition.ready
        .then(() => stepMasks(ms, (level) => root.style.setProperty("--dither-mask", MASKS[level])))
        .catch(() => {});
      transition.finished.finally(() => root.style.removeProperty("--dither-mask"));
      return;
    }

    // Older browsers: a plain cross-fade of the colours.
    root.classList.add("theme-fading");
    applyTheme(theme, ms);
    setTimeout(() => root.classList.remove("theme-fading"), ms + 50);
  }

  toggle.hidden = false;
  toggle.addEventListener("click", () => switchTheme(root.dataset.theme === "dark" ? "light" : "dark"));
  // Follow the device while the visitor has not chosen a theme here.
  darkQuery.addEventListener("change", (e) => {
    if (!storedTheme()) switchTheme(e.matches ? "dark" : "light", false);
  });
  applyTheme(root.dataset.theme, 0);

  // ---- Keywords: while the intro fades in, they print in dots instead.
  const words = document.querySelectorAll(".kw");
  const intro = document.querySelector(".intro");
  const entrance = intro && intro.getAnimations ? intro.getAnimations()[0] : null;
  const elapsed = entrance ? Number(entrance.currentTime) : Infinity;
  if (words.length && CSS.supports("mask-image", "none") && elapsed < 200) {
    const set = (level) => words.forEach((w) => {
      w.style.maskImage = w.style.webkitMaskImage = MASKS[level];
    });
    words.forEach((w) => w.classList.add("is-printing"));
    set(0);
    const delay = parseFloat(getComputedStyle(intro).animationDelay) * 1000 || 0;   // start with the intro
    setTimeout(() => {
      stepMasks(720, set, () => words.forEach((w) => {
        w.classList.remove("is-printing");
        w.style.maskImage = w.style.webkitMaskImage = "";
      }));
    }, Math.max(0, delay + 40 - elapsed));
  }
})();
