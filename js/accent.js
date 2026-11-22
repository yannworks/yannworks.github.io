// The orange dots on the page: where they are and what moves them.
// The engine and the three motions live in js/dots.js; this file only puts them
// in place (see style.css, "Orange dots"), always in space left empty for them:
//
//   - under each keyword of the intro: Sparkle. Appears once after the word has
//     printed; pointing at the word makes it crackle for under a second.
//   - at the foot of the active component card: Flow. Its patches drift slowly
//     while the card is active and on screen.
//   - at the end of the page: Drift. Rolls slowly whenever it is on screen.
//
// The active card is the one the visitor last pointed at, touched or reached
// with the keyboard (then without motion); the first card before that.

const ACCENT = {
  CELL: { kw: 2, fringe: 3, end: 3 },   // dot size in CSS px
};

(function () {
  if (typeof DOTS === "undefined") return;           // js/dots.js missing: no dots, nothing else changes
  const items = { kw: [], fringe: [], end: [] };
  const canvasIn = (host, className) => {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    if (className) canvas.className = className;
    host.append(canvas);
    return canvas;
  };

  document.querySelectorAll(".intro .kw").forEach((word, i) => {
    const field = new DOTS.Field(canvasIn(word, "kw__dots"), { shape: "kw", cell: ACCENT.CELL.kw, step: 4, salt: 3 + i });
    items.kw.push(DOTS.run(field, BEHAVIOURS.kwSparkle, { word }));
  });

  const cards = [...document.querySelectorAll(".showcase__item")];
  const strips = cards.map((card, i) => {
    const host = card.querySelector(".fringe");
    if (!host) return null;
    const field = new DOTS.Field(canvasIn(host), { shape: "fringe", cell: ACCENT.CELL.fringe, salt: 11 + i });
    const item = DOTS.run(field, BEHAVIOURS.fringeFlow, { card });
    items.fringe.push(item);
    return item;
  });

  document.querySelectorAll(".end").forEach((end) => {
    const field = new DOTS.Field(canvasIn(end), { shape: "end", cell: ACCENT.CELL.end, step: 9, salt: 99 });
    items.end.push(DOTS.run(field, BEHAVIOURS.endDrift));
  });

  // ---- The active card. It stays active when the pointer leaves, so the dots
  // never flicker while the mouse crosses the gap between two cards.
  function activate(card, instant = false) {
    cards.forEach((c, i) => {
      const on = c === card;
      c.classList.toggle("is-active", on);
      if (strips[i]) strips[i].behaviour.card.set(on, instant);
    });
  }
  // Focus that follows a click or a tap counts as the pointer; focus from the
  // keyboard (Tab) switches the dots at once, because keyboard actions get no motion.
  let pointerAt = -1e9;
  cards.forEach((card) => {
    card.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") activate(card); });
    card.addEventListener("pointerdown", () => { pointerAt = performance.now(); activate(card); });
    card.addEventListener("focusin", () => activate(card, performance.now() - pointerAt > 500));
  });
  // At rest, the card marked active in the HTML (the first); its dots appear in a
  // random order the first time it is seen.
  const first = cards.find((c) => c.classList.contains("is-active"));
  if (first) activate(first);

  window.accent = { items };            // for tests, the board and measurements
})();
