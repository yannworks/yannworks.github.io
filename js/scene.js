// The scene on the page: size, animation loop, follow-spot, pause button.
// show.js says what happens, stage-art.js paints it, stage.js lights and
// dithers it. This file runs the clock and connects it all to the page.

const SCENE = {
  FPS: 30,              // frames per second (pixel art does not need more; saves battery)
  HOUSE_LIGHT: 0.9,     // house lights in the light theme
  HOUSE_DARK: 0.13,     // house lights in the dark theme: the spot does the lighting
  SPOT_RADIUS: 22,      // in cells
  LABEL:
    "Animated pixel art in black and white dots: a small theatre stage under a follow-spot. " +
    "Clawd, the orange Claude Code mascot, walks on, plays an upright piano, types at a typewriter, " +
    "opens a little robot that wakes up and waves, bows with it, and walks off.",
};

function startScene() {
  const figure = document.querySelector(".scene");
  if (!figure) return null;
  const frame = figure.querySelector(".scene__frame");
  const still = figure.querySelector(".scene__still img");
  const pauseButton = figure.querySelector(".scene__pause");
  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const params = new URLSearchParams(location.search);
  const root = document.documentElement;

  // ---- Size: the stage grid is enlarged by a whole number of screen pixels.
  const canvas = document.createElement("canvas");
  canvas.width = STAGE.W;
  canvas.height = STAGE.H;
  canvas.className = "scene__canvas";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", SCENE.LABEL);

  function fit() {
    const dpr = window.devicePixelRatio || 1;
    const k = Math.max(1, Math.floor((figure.clientWidth * dpr) / STAGE.W));
    const w = (STAGE.W * k) / dpr;
    const h = (STAGE.H * k) / dpr;
    for (const el of [canvas, still]) {
      el.style.width = w + "px";
      el.style.height = h + "px";
    }
    root.style.setProperty("--scene-w", w + "px");      // the graph below uses the same width
    root.style.setProperty("--cell", k / dpr + "px");    // dot size, used by the dissolve
  }
  fit();
  new ResizeObserver(fit).observe(figure);

  let stage = null;
  try { stage = createStage(canvas); } catch (e) { stage = null; }
  if (!stage) return stillOnly();                         // no WebGL: keep the still frame
  frame.prepend(canvas);
  figure.classList.add("is-live");
  pauseButton.hidden = false;

  // ---- State
  const props = makeLayer(STAGE.W, STAGE.H);
  const clawd = makeLayer(STAGE.W, STAGE.H);
  let timeline = buildTimeline(reducedQuery.matches);
  let time = params.has("at") ? Number(params.get("at")) || 0 : 0;   // ?at=12 shows a fixed moment
  let playing = !params.has("at");
  let inView = true;
  let raf = 0, last = null, lastKey = "", frames = 0;
  const spot = { x: FOCUS.wingLeft.x, y: FOCUS.wingLeft.y, vx: 0, vy: 0, ready: false };
  const pointer = { x: 0, y: 0, active: false, until: -1 };
  let dark = root.dataset.theme === "dark";
  let house = dark ? SCENE.HOUSE_DARK : SCENE.HOUSE_LIGHT;
  let fade = null;                                        // house lights changing with the theme
  let colours = readColours();

  function readColours() {
    const css = getComputedStyle(root);
    const paper = css.getPropertyValue("--paper").trim();
    const ink = css.getPropertyValue("--ink").trim();
    return dark ? { light: ink, dark: paper } : { light: paper, dark: ink };
  }

  // The arc lamp hums a little and sometimes sputters.
  function flicker(t) {
    const hum = 0.96 + 0.04 * Math.sin(t * 23) * Math.sin(t * 7.3);
    const n = Math.floor(t / 4.3);
    const sputter = Math.abs(Math.sin(n * 91.7) * 4375.85) % 1 > 0.5 && t - n * 4.3 < 0.14;
    return hum * (sputter ? (timeline.reduced ? 0.88 : 0.72) : 1);
  }

  // ---- One frame. dt = seconds since the previous frame (0 when paused).
  function render(dt) {
    const s = showAt(timeline, time);
    const key = JSON.stringify([s.clawd, s.piano, s.paper, s.robot]);
    if (key !== lastKey) {                                // repaint the layers only when something changed
      paintProps(props, s);
      paintClawd(clawd, s);
      stage.upload("props", props);
      stage.upload("clawd", clawd);
      lastKey = key;
    }

    // Where the spot wants to go: the mouse, a tap, or the operator's choice.
    // Slow cycles (drift, breathing, flicker, curtain sway) run on the loop's own
    // clock, a whole number of times per loop, so the end meets the start exactly.
    const reduced = timeline.reduced;
    const L = timeline.length;
    const cycle = (n) => (2 * Math.PI * n * s.t) / L;
    let target = s.focus;
    const aimed = !reduced && (pointer.active || time < pointer.until);
    if (aimed) target = pointer;
    else if (!reduced) target = { x: s.focus.x + 3 * Math.sin(cycle(4)), y: s.focus.y + 2 * Math.sin(cycle(3) + 1) };
    if (reduced || !spot.ready) {
      Object.assign(spot, { x: target.x, y: target.y, vx: 0, vy: 0, ready: true });
    } else if (dt > 0) {
      // A critically damped spring: smooth, no overshoot. Faster for the mouse.
      const w = aimed ? 6 : 3.5;
      spot.vx += (w * w * (target.x - spot.x) - 2 * w * spot.vx) * dt;
      spot.vy += (w * w * (target.y - spot.y) - 2 * w * spot.vy) * dt;
      spot.x += spot.vx * dt;
      spot.y += spot.vy * dt;
    }

    if (fade) {
      const k = Math.min(1, (performance.now() - fade.start) / fade.ms);
      house = fade.from + (fade.to - fade.from) * (k * k * (3 - 2 * k));
      if (k >= 1) fade = null;
    }

    const centre = s.clawd ? s.clawd.x + 11.5 : -99;
    const push = s.walking && !reduced
      ? [Math.max(0, 1 - Math.abs(centre - 19) / 14), Math.max(0, 1 - Math.abs(centre - 193) / 14)]
      : [0, 0];

    stage.draw({
      time: s.t,
      loop: L,
      motion: reduced ? 0 : 1,
      ambient: house,
      spot: { x: spot.x, y: spot.y, r: SCENE.SPOT_RADIUS + 0.6 * Math.sin(cycle(10)) },
      power: s.dim * flicker(s.t),
      push,
      light: colours.light,
      dark: colours.dark,
    });
    frames++;
  }

  // ---- The clock. Runs only when playing (or fading the lights), on screen, tab visible.
  function shouldRun() {
    return Boolean(stage) && inView && !document.hidden && (playing || fade);
  }
  function tick(now) {
    raf = 0;
    if (!shouldRun()) return;
    raf = requestAnimationFrame(tick);
    if (last !== null && now - last < 1000 / SCENE.FPS - 2) return;
    const dt = last === null ? 0 : Math.min(0.1, (now - last) / 1000);
    last = now;
    if (playing) time += dt;
    render(playing ? dt : 0);
  }
  function wake() {
    if (!raf && shouldRun()) {
      last = null;
      raf = requestAnimationFrame(tick);
    }
  }

  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; wake(); }).observe(figure);
  document.addEventListener("visibilitychange", wake);
  reducedQuery.addEventListener("change", () => {
    timeline = buildTimeline(reducedQuery.matches);
    lastKey = "";
    spot.ready = false;
    render(0);
    wake();
  });

  // ---- Pause / play
  function updateButton() {
    pauseButton.setAttribute("aria-label", playing ? "Pause the scene" : "Play the scene");
    pauseButton.dataset.state = playing ? "playing" : "paused";
  }
  pauseButton.addEventListener("click", () => {
    playing = !playing;
    updateButton();
    document.dispatchEvent(new CustomEvent("scenepause", { detail: { playing } }));   // the graph's Clawd stops too
    wake();
  });
  updateButton();

  // ---- The mouse aims the spot; on a phone a tap aims it for a few seconds.
  function aim(e) {
    const r = canvas.getBoundingClientRect();
    pointer.x = Math.min(STAGE.W - 24, Math.max(24, ((e.clientX - r.left) / r.width) * STAGE.W));
    pointer.y = Math.min(96, Math.max(28, ((e.clientY - r.top) / r.height) * STAGE.H));
  }
  frame.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    aim(e);
    pointer.active = true;
  });
  frame.addEventListener("pointerleave", () => { pointer.active = false; });
  frame.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch") return;
    aim(e);
    pointer.until = time + 3;
  });

  // ---- If the graphics card resets, fall back to the still frame until it is back.
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    stage = null;
    figure.classList.remove("is-live");
  });
  canvas.addEventListener("webglcontextrestored", () => {
    stage = createStage(canvas);
    if (!stage) return;
    lastKey = "";
    figure.classList.add("is-live");
    render(0);
    wake();
  });

  render(0);
  wake();

  // Helpers for checking the scene from the browser console or a test script.
  window.sceneDebug = {
    get time() { return time; },
    get frames() { return frames; },
    get playing() { return playing; },
    get length() { return timeline.length; },
    seek(t) { time = t; spot.ready = false; render(0); },
    step(dt) { time += dt; render(dt); },
    capture() { render(0); return canvas.toDataURL("image/png"); },   // read right after drawing
  };

  return {
    // Called by main.js when the theme changes: the house lights go down or up.
    setTheme(isDark, ms) {
      dark = isDark;
      colours = readColours();
      const to = dark ? SCENE.HOUSE_DARK : SCENE.HOUSE_LIGHT;
      if (ms > 0) fade = { from: house, to, start: performance.now(), ms };
      else { house = to; fade = null; }
      if (stage) { render(0); wake(); }
    },
  };

  // Without WebGL the still frame stays; it only has to follow the theme.
  function stillOnly() {
    figure.classList.add("is-still");
    const source = figure.querySelector(".scene__still source");
    return {
      setTheme(isDark) {
        if (source) source.remove();
        still.src = isDark ? "img/stage-dark.png" : "img/stage-light.png";
      },
    };
  }
}
