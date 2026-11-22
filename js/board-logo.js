// The "Logo" section of board.html: the candidate marks from js/logo-pistes.js
// (written by tools/make-logo.mjs), at 16, 32, 180 and 1024 px, light and dark,
// with and without the orange accent, in a browser tab and beside the name.
// Board only.

(function () {
  const ORANGE = "#d97757";
  const host = document.getElementById("logo-pistes");
  if (!host || typeof LOGO_PISTES === "undefined") return;

  // One <rect> per run of same-colour cells in a row. Ink is currentColor, so
  // the tile's colour decides it; the accent is orange or ink.
  function svg(rows, px, accent, label) {
    const h = rows.length, w = rows[0].length;
    const parts = [];
    rows.forEach((row, y) => {
      let x = 0;
      while (x < w) {
        const ch = row[x];
        let end = x;
        while (end < w && row[end] === ch) end++;
        if (ch !== ".") {
          const fill = ch === "o" && accent ? ORANGE : "currentColor";
          parts.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${fill}"/>`);
        }
        x = end;
      }
    });
    const height = Math.round((px * h) / w);
    return `<svg viewBox="0 0 ${w} ${h}" width="${px}" height="${height}" shape-rendering="crispEdges"` +
      (label ? ` role="img" aria-label="${label}"` : ` aria-hidden="true"`) + `>${parts.join("")}</svg>`;
  }

  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  function figure(theme, inner, caption) {
    const f = el("figure", "lg-fig");
    f.append(el("div", `lg-tile lg-${theme}`, inner), el("figcaption", "", caption));
    return f;
  }

  LOGO_PISTES.forEach((p, i) => {
    const sec = el("section", "lg-piste");
    sec.setAttribute("aria-labelledby", `lg-${p.id}`);
    sec.append(el("h3", "", `<span id="lg-${p.id}">${String.fromCharCode(65 + i)}. ${p.name}${p.chosen ? " (chosen)" : " (not chosen)"}</span>`));
    sec.append(el("p", "", `${p.idea} <span class="lg-muted">Orange accent: ${p.accent.charAt(0).toLowerCase() + p.accent.slice(1)}</span>`));

    for (const theme of ["light", "dark"]) {
      const row = el("div", "lg-row");
      row.append(
        figure(theme, svg(p.rows, 16, true, `${p.name}, 16 px, ${theme}`), "16"),
        figure(theme, svg(p.rows, 32, true), "32"),
        figure(theme, svg(p.rows, 180, true), "180"),
        figure(theme, svg(p.rows, 180, false), "180, ink only"),
        // The profile picture: the grid takes 640 of 1024 px, centred, then the round crop.
        figure(theme, `<div class="lg-avatar">${svg(p.rows, 112, false)}</div>`, "profile, round crop"),
      );
      // A browser tab, as the favicon will sit in it.
      const tab = el("div", `lg-tab lg-tab-${theme}`,
        `<span class="lg-tabitem">${svg(p.rows, 16, true)}<span>yannworks</span></span>`);
      // Beside the name, as in the page header.
      const head = el("div", `lg-head lg-${theme}`,
        `<span>${svg(p.rows, 16, true)}<b>yannworks</b></span><span>${svg(p.rows, 24, true)}<b>yannworks</b></span>`);
      const ctx = el("div", "lg-ctx");
      ctx.append(figure(theme, tab.outerHTML, "in a tab"), figure(theme, head.outerHTML, "beside the name, 16 and 24"));
      row.append(ctx);
      sec.append(row);
    }

    if (p.id === "word") {
      sec.append(el("p", "lg-muted", "The whole word in the same alphabet, 4 px a cell:"));
      const words = el("div", "lg-row");
      for (const theme of ["light", "dark"]) words.append(figure(theme, svg(LOGO_WORD, LOGO_WORD[0].length * 4, true), theme));
      sec.append(words);
    }

    const big = el("div", "lg-big");
    big.setAttribute("tabindex", "0");
    big.setAttribute("aria-label", `${p.name} at 1024 px, scrolls sideways`);
    for (const theme of ["light", "dark"]) big.append(figure(theme, svg(p.rows, 1024, true), `1024, ${theme}`));
    sec.append(big);
    host.append(sec);
  });
})();
