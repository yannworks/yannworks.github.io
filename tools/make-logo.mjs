// The yannworks logo and everything made from it, drawn from one pixel grid.
//
// Run once: npm install --no-save playwright   (it renders the PNGs in Chrome)
// Then:     node tools/make-logo.mjs
//
// The logo is a heavy lowercase y whose tail breaks into dots ("Dissolve",
// chosen by Yann on 22 November 2026 among four directions). It is drawn on a
// 16 x 16 grid, so the favicon is exact at 16 px and every other size is a
// whole multiple. "#" is ink, "o" is the accent cell, "." is empty. The icons
// are ink only (the accent cell is ink); only the share image shows it orange.
//
// Writes:
//   favicon.svg                 16 x 16 cells, ink; light ink in a dark browser theme
//   favicon.png                 96 px, ink on paper (browsers without SVG icons)
//   apple-touch-icon.png        180 px, ink on paper, 10 px a cell
//   img/profile/yannworks-light.{svg,png}, img/profile/yannworks-dark.{svg,png}
//                               1024 px profile pictures; the grid takes 640 px in the
//                               middle, so a round crop never touches it
//   img/share-v2.png            1200 x 630 share image: logo, name, line, ink dots
//   index.html, board.html      the logo in the header, between <!-- logo --> markers
//   js/logo-pistes.js           the four directions, for the board
//
// The share image is versioned in its file name: Discord and X keep a preview
// cached under the same URL, so a new image gets a new name (share-v3.png...),
// and the og:image and twitter:image tags in index.html follow.

import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const SITE = fileURLToPath(new URL("..", import.meta.url));
const SHARE = "img/share-v2.png";

const INK = "#111111", PAPER = "#ffffff";            // the light theme (style.css)
const INK_DARK = "#ededed", PAPER_DARK = "#0d0d0d";  // the dark theme
const ORANGE = "#d97757";                            // the site's one accent

const LOGO = `
................
..###......###..
..###......###..
..###......###..
..###......###..
..###......###..
..###......###..
..####....####..
...###########..
.....#########..
...........###..
...........###..
......#.######..
....#..######...
..o....####.....
................`;

// The four directions shown to Yann, kept on the board for comparison.
const PISTES = [
  { id: "dissolve", name: "Dissolve", chosen: true, rows: LOGO,
    idea: "A heavy y whose tail breaks into dots, like the theme dissolve and the dots of the page.",
    accent: "The last stray dot, the one furthest from the letter." },
  { id: "note", name: "Note",
    idea: "A y whose stem ends in a note head: a letter for writing, a note for music.",
    accent: "The dot after the note (in music it makes the note half as long again).",
    rows: `
................
..##......##....
..##......##....
..##......##....
..##......##....
..###....###....
...#########....
....#######.....
..........##....
..........##....
..........##....
..........##....
.......#####....
......######.o..
.......####.....
................` },
  { id: "branch", name: "Branch",
    idea: "A y drawn as a commit graph: a branch merges into the main line, which ends on the latest commit.",
    accent: "The latest commit, like today's square in the contribution graph.",
    rows: `
................
................
..###....###....
..#.#....#.#....
..###....###....
....#.....#.....
.....#....#.....
......#...#.....
.......#..#.....
........#.#.....
.........##.....
..........#.....
.........ooo....
.........ooo....
.........ooo....
................` },
  { id: "word", name: "Word",
    idea: "yannworks set in a pixel alphabet drawn for it; at small sizes, its first and middle letters, yw.",
    accent: "None in the mark; the word can take one orange dot.",
    rows: `
................
................
................
.#...#..#..#..#.
.#...#..#..#..#.
.#...#..#..#..#.
.#...#..#..#..#.
.#...#..#..#..#.
.#...#..#..#..#.
..####...##.##..
.....#..........
.....#..........
.####...........
................
................
................` },
];

// The pixel alphabet of the "word" direction (x-height 7, 1-cell strokes).
const FONT = {
  y: [..."#...#,#...#,#...#,#...#,#...#,#...#,.####,....#,....#,####.".split(",")],
  a: ".###.,....#,.####,#...#,#...#,#...#,.####".split(","),
  n: "####.,#...#,#...#,#...#,#...#,#...#,#...#".split(","),
  w: "#..#..#,#..#..#,#..#..#,#..#..#,#..#..#,#..#..#,.##.##.".split(","),
  o: ".###.,#...#,#...#,#...#,#...#,#...#,.###.".split(","),
  r: "#.##,##..,#...,#...,#...,#...,#...".split(","),
  k: "#...,#...,#...,#..#,#.#.,##..,##..,#.#.,#..#,#..#".split(","),
  s: ".###,#...,#...,.##.,...#,...#,###.".split(","),
};
function wordRows(word) {
  const rows = Array(13).fill("");
  [...word].forEach((ch, i) => {
    const g = FONT[ch], w = g[0].length, top = ch === "k" ? 0 : 3;
    for (let j = 0; j < 13; j++) rows[j] += (g[j - top] ?? ".".repeat(w)) + (i < word.length - 1 ? "." : "");
  });
  return rows;
}

const parse = (text) => {
  const rows = text.trim().split("\n");
  if (rows.length !== 16 || rows.some((r) => r.length !== 16 || /[^#o.]/.test(r))) throw new Error("bad grid");
  return rows;
};
const GRID = parse(LOGO);

// One horizontal run per row of same-kind cells, as an SVG path ("M x y h w v 1 h -w z").
function path(rows, kinds) {
  let d = "";
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      let end = x;
      while (end < row.length && kinds.includes(row[end]) === kinds.includes(row[x])) end++;
      if (kinds.includes(row[x])) d += `M${x} ${y}h${end - x}v1h${x - end}z`;
      x = end;
    }
  });
  return d;
}
const INK_PATH = path(GRID, "#o");           // the whole logo, accent cell in ink

// ---- SVG files

const favicon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">` +
  `<style>path{fill:${INK}}@media (prefers-color-scheme:dark){path{fill:${INK_DARK}}}</style>` +
  `<path d="${INK_PATH}"/></svg>\n`;

// 1024 px: 16 cells of 40 px in the middle, 192 px of paper around.
const profile = (ink, paper) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024" shape-rendering="crispEdges">` +
  `<rect width="1024" height="1024" fill="${paper}"/>` +
  `<path transform="translate(192 192) scale(40)" fill="${ink}" d="${INK_PATH}"/></svg>\n`;

// Paper square with the logo at `cell` px a cell, centred.
const tile = (px, cell) => {
  const off = (px - 16 * cell) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${px} ${px}" width="${px}" height="${px}" shape-rendering="crispEdges">` +
    `<rect width="${px}" height="${px}" fill="${PAPER}"/>` +
    `<path transform="translate(${off} ${off}) scale(${cell})" fill="${INK}" d="${INK_PATH}"/></svg>`;
};

// The header logo: currentColor, so it follows the theme like the name beside it.
const HEADER_PX = 24;
const headerSvg =
  `<svg class="name__logo" viewBox="0 0 16 16" width="${HEADER_PX}" height="${HEADER_PX}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">` +
  `<path fill="currentColor" d="${INK_PATH}"/></svg>`;

// ---- The share image: logo, name and line on paper, ink dots rising from the bottom.

function shareHtml(fontSans) {
  const W = 1200, H = 630, CELL = 6;              // dots of 6 px: still dots in a 400 px preview
  const cols = W / CELL, rows = H / CELL;
  // Same maths as js/dots.js: 8 x 8 Bayer thresholds, smooth noise on a lattice, fixed seed.
  const b2 = (x, y) => ((x % 2) * 0.5 + (y % 2) * 0.75) % 1;
  const bayer8 = (x, y) => (b2(x >> 2, y >> 2) * 0.25 + b2(x >> 1, y >> 1)) * 0.25 + b2(x, y);
  const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const hash = (i, j) => {                       // a repeatable random value per lattice point
    let t = (Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ 0x5bd1e995) >>> 0;
    t = Math.imul(t ^ (t >>> 15), 2246822519); t = Math.imul(t ^ (t >>> 13), 3266489917);
    return ((t ^ (t >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y, step = 14) => {
    const i = Math.floor(x / step), j = Math.floor(y / step);
    const e = (t) => t * t * (3 - 2 * t), fx = e(x / step - i), fy = e(y / step - j);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  const FIELD = 20;                                // rows of dots at the bottom (120 px)
  let dots = "";
  for (let y = rows - FIELD; y < rows; y++) {
    const v = (y - (rows - FIELD)) / (FIELD - 1);
    for (let x = 0; x < cols; x++) {
      const dens = smooth(0.05, 1, v) ** 1.5 * (0.05 + 1.05 * noise(x, y));
      if (dens > bayer8(x & 7, y & 7)) dots += `M${x * CELL} ${y * CELL}h${CELL}v${CELL}h-${CELL}z`;
    }
  }
  const LOGO_CELL = 18;                            // 288 px
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Geist; src: url(data:font/woff2;base64,${fontSans}) format("woff2"); font-weight: 100 900; }
html, body { margin: 0; }
body { width: ${W}px; height: ${H}px; background: ${PAPER}; color: ${INK}; font-family: Geist, sans-serif; position: relative; overflow: hidden; -webkit-font-smoothing: antialiased; }
.dots { position: absolute; inset: 0; }
.card { position: absolute; left: 112px; top: 120px; display: flex; align-items: center; gap: 64px; }
.logo { flex: none; }
h1 { margin: 0; font-size: 104px; font-weight: 600; letter-spacing: -0.035em; line-height: 1; }
p { margin: 26px 0 0; max-width: 620px; font-size: 40px; font-weight: 400; line-height: 1.3; letter-spacing: -0.015em; text-wrap: pretty; }
</style></head><body>
<svg class="dots" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges"><path fill="${INK}" d="${dots}"/></svg>
<div class="card">
  <svg class="logo" viewBox="0 0 16 16" width="${16 * LOGO_CELL}" height="${16 * LOGO_CELL}" shape-rendering="crispEdges">
    <path fill="${INK}" d="${path(GRID, "#")}"/><path fill="${ORANGE}" d="${path(GRID, "o")}"/>
  </svg>
  <div><h1>yannworks</h1><p>Building apps with AI, learning how things work, writing and music.</p></div>
</div></body></html>`;
}

// ---- Write everything

const write = async (rel, data) => { await writeFile(join(SITE, rel), data); console.log("wrote", rel); };

await write("favicon.svg", favicon);
await mkdir(join(SITE, "img/profile"), { recursive: true });
await write("img/profile/yannworks-light.svg", profile(INK, PAPER));
await write("img/profile/yannworks-dark.svg", profile(INK_DARK, PAPER_DARK));

// The header logo, in the page and on the board.
for (const file of ["index.html", "board.html"]) {
  const html = await readFile(join(SITE, file), "utf8");
  const re = /<!-- logo -->[\s\S]*?<!-- \/logo -->/;
  if (!re.test(html)) throw new Error(`${file}: no <!-- logo --> markers`);
  await write(file, html.replace(re, `<!-- logo -->${headerSvg}<!-- /logo -->`));
}

await write("js/logo-pistes.js", [
  "// The four logo directions, written by tools/make-logo.mjs. Board only; do not edit by hand.",
  '// "#" ink, "o" accent (orange, or ink when the accent is off), "." empty.',
  `const LOGO_PISTES = ${JSON.stringify(PISTES.map((p) => ({ ...p, chosen: !!p.chosen, rows: parse(p.rows) })), null, 2)};`,
  `const LOGO_WORD = ${JSON.stringify(wordRows("yannworks"))};`,
  "",
].join("\n"));

// PNGs: each SVG or page drawn by Chrome at exactly its size.
const browser = await chromium.launch({ channel: "chrome" });
async function png(rel, html, w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(html.startsWith("<!doctype") ? html
    : `<!doctype html><style>html,body{margin:0}svg{display:block}</style>${html}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(SITE, rel), clip: { x: 0, y: 0, width: w, height: h } });
  await page.close();
  console.log("wrote", rel);
}
await png("favicon.png", tile(96, 6), 96, 96);
await png("apple-touch-icon.png", tile(180, 10), 180, 180);
await png("img/profile/yannworks-light.png", profile(INK, PAPER), 1024, 1024);
await png("img/profile/yannworks-dark.png", profile(INK_DARK, PAPER_DARK), 1024, 1024);
const sans = (await readFile(join(SITE, "fonts/Geist-Variable.woff2"))).toString("base64");
await png(SHARE, shareHtml(sans), 1200, 630);
await browser.close();
