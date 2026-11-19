// What the props look like, and how they are painted into the "props layer".
//
// Each prop is drawn as text, one character per cell:
//   "0" to "9"  how light the surface is (0 black, 9 white)
//   "."         empty
// The shader later lights these shades and turns them into black and white
// dots. Clawd is the only thing in colour; he is painted into his own layer.
// Every prop stands on the floor: its position is counted from STAGE.FLOOR.

// Upright piano seen from the side; the keyboard sticks out to the left,
// towards Clawd.
const PIANO = [
  "......77777777777777777777",
  "......11111111111111111111",
  ".......6222222222222222221",
  ".......6233333333333333321",
  ".......6233333333333333321",
  ".......6233333333333333321",
  ".......6233333333333333321",
  ".......6233333333333333321",
  ".......6233333333333333321",
  ".......6233333333333333321",
  ".......6233333333333333321",
  ".......6233333333333333321",
  ".......6233333333333333321",
  ".......6222222222222222221",
  ".......6222222222222222221",
  ".......6222222222222222221",
  ".......6222222222222222221",
  ".......6222222222222222221",
  ".......6222222222222222221",
  "......66222222222222222221",
  ".....662222222222222222221",
  ".....622222222222222222221",
  ".....622222222222222222221",
  ".9999999222222222222222221",
  ".1111111222222222222222221",
  "..22....622222222222222221",
  "..22....622222222222222221",
  "..22....622222222222222221",
  "..22.77.622222222222222221",
  ".2222222222222222222222222",
];

// Metronome on top of the piano; its rod is drawn separately and swings.
const METRONOME = [
  "...1...",
  "...1...",
  "..161..",
  "..181..",
  "..161..",
  ".16861.",
  ".16861.",
  "1668661",
  "1111111",
];

// Typewriter on a stool, seen from the side; the keys face Clawd.
const TYPEWRITER = [
  "......1111111111..",
  ".....122222222221.",
  "......1111111111..",
  ".....155555555551.",
  ".....111111111111.",
  ".......9155555551.",
  "......91555555551.",
  ".....915555555551.",
  "....9155555555551.",
  "...91555555555551.",
  "..915555555555551.",
  "..1111111111111111",
  ".99999999999999999",
  ".11111111111111111",
  "..11..........11..",
  "..11111111111111..",
  ".11............11.",
  ".11............11.",
];

// Finished pages on the floor next to the stool.
const PAGES = [
  ".888888.",
  "99999999",
  "55555555",
];

// Wooden crate the robot stands on.
const CRATE = [
  "1111111111111111",
  "1777777777777771",
  "1333333333333331",
  "1777777777777771",
  "1777777777777771",
  "1333333333333331",
  "1777777777777771",
  "1777777777777771",
  "1111111111111111",
];

// The little robot, facing the audience. B = antenna bulb, E = eyes:
// both glow only when it is awake. P = the hatch on its chest.
const ROBOT_HEAD = [
  "......B......",
  "......1......",
  "..111111111..",
  "..180000081..",
  "..180E0E081..",
  "..180000081..",
  "..188888881..",
  "..111111111..",
  "....11111....",
];
const ROBOT_BODY = [
  "..111111111..",
  "..18PPPPP81..",
  "..18PPPPP81..",
  "..18PPPPP81..",
  "..111111111..",
];
const ROBOT_LEGS = [
  "....1...1....",
  "...11...11...",
];
const HATCH_CLOSED = ["55555", "58885", "55555"];
const HATCH_OPEN = [["00000", "07970", "00000"], ["00000", "09790", "00000"]];   // the parts inside tick

// ---------------------------------------------------------------- the layer

// A layer is one byte array, 4 bytes per cell:
//   R = shade, G = casts a shadow (255) or not, B = glows (255), A = something is here.
function makeLayer(w, h) {
  return { w, h, data: new Uint8Array(w * h * 4) };
}

function plot(layer, x, y, shade, shadow = true, glow = false) {
  if (x < 0 || y < 0 || x >= layer.w || y >= layer.h) return;
  const i = (y * layer.w + x) * 4;
  layer.data[i] = Math.round((shade / 9) * 255);
  layer.data[i + 1] = shadow ? 255 : 0;
  layer.data[i + 2] = glow ? 255 : 0;
  layer.data[i + 3] = 255;
}

// Paints a text drawing. `swap` replaces letters with shades ("*" = white and glowing).
function draw(layer, x, y, rows, swap = {}) {
  rows.forEach((row, j) => {
    [...row].forEach((ch, i) => {
      if (swap[ch] !== undefined) ch = swap[ch];
      if (ch === ".") return;
      plot(layer, x + i, y + j, ch === "*" ? 9 : Number(ch), true, ch === "*");
    });
  });
}

// A straight line of cells (for the metronome rod).
function line(layer, x0, y0, x1, y1, shade) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let k = 0; k <= n; k++) {
    plot(layer, Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), shade);
  }
}

// Everything that is not Clawd, for one moment of the show (see show.js).
function paintProps(layer, s) {
  const F = STAGE.FLOOR;
  layer.data.fill(0);

  // Tape marks on the floor where Clawd stops (a theatre habit).
  for (const x of [41, 103, 157]) for (let i = -1; i <= 1; i++) plot(layer, x + i, F + 3, 9, false);

  // Piano, the keys pressed under Clawd's arm, and the metronome.
  draw(layer, 49, F - 30, PIANO);
  if (s.piano.keys) for (const x of [50, 51, 52]) plot(layer, x, F - 7, 4);
  draw(layer, 62, F - 39, METRONOME);
  line(layer, 65, F - 33, 65 + s.piano.tick, F - 43, 1);
  const wx = Math.round(65 + s.piano.tick * 0.5);
  plot(layer, wx, F - 38, 1); plot(layer, wx + 1, F - 38, 1);

  // Typewriter, its sheet of paper, the pile of finished pages.
  draw(layer, 113, F - 18, TYPEWRITER);
  draw(layer, 132, F - 3, PAGES);
  paintPaper(layer, s.paper, F - 18);

  // Crate and robot.
  draw(layer, 169, F - 9, CRATE);
  paintRobot(layer, 170, F - 25, s.robot);

  // Soft contact shadow under Clawd's feet (it casts no shadow itself).
  if (s.clawd) for (let x = s.clawd.x + 1; x < s.clawd.x + 22; x++) plot(layer, x, F, 3, false);
}

// The sheet in the typewriter rises one row per typed line.
function paintPaper(layer, p, platen) {
  const x = 121;
  if (p.lines >= 0) {
    const h = 3 + p.lines + p.extra;
    for (let j = 1; j <= h; j++) {
      const curl = j === h ? 1 : 0;                     // the top edge curls back a little
      const typed = j > p.extra && j <= p.extra + p.lines;
      for (let i = 0; i < 6; i++) {
        const edge = i === 0 || i === 5 || j === h;      // a thin dark edge keeps it visible in the light
        const ink = typed && i > 1 && i < 5 && (i + j) % 3 !== 0;
        plot(layer, x + i + curl, platen - j, edge ? 1 : ink ? 3 : 9);
      }
    }
  }
  if (p.flying >= 0) {
    // The finished page flies in an arc onto the pile.
    const path = [[122, -14], [125, -16], [128, -12], [130, -2], [132, 12]];
    const [fx, dy] = path[Math.min(4, p.flying)];
    for (let i = 0; i < 6; i++) { plot(layer, fx + i, platen + dy, i % 5 ? 9 : 1); plot(layer, fx + i, platen + dy + 1, 1); }
  }
}

function paintRobot(layer, x, y, r) {
  const down = r.bow;                                   // the bow lowers head and body
  const eyes = r.eyes ? "*" : "0";
  const bulb = r.awake ? "*" : "5";
  // Asleep, the head hangs one row lower (the neck disappears).
  draw(layer, x, y + r.head + down, ROBOT_HEAD.slice(0, r.head ? 8 : 9), { E: eyes, B: bulb });
  draw(layer, x, y + 9 + down, ROBOT_BODY, { P: "8" });
  const hatch = r.panel === "open" ? HATCH_OPEN[r.inside || 0] : HATCH_CLOSED;
  draw(layer, x + 4, y + 10 + down, hatch);
  if (r.panel === "open") for (let j = 0; j < 3; j++) plot(layer, x + 3, y + 10 + j + down, 9);   // the open door
  draw(layer, x, y + 14, ROBOT_LEGS);
  // Arms: the right one hangs down, the left one (towards Clawd) waves.
  for (let j = 0; j < 4; j++) {
    plot(layer, x + 11, y + 10 + j + down, 1); plot(layer, x + 12, y + 10 + j + down, 1);
    const ay = (r.arm === "up" ? y + 5 : y + 10) + j + down;
    plot(layer, x, ay, 1); plot(layer, x + 1, ay, 1);
  }
}

// Clawd in his own colours, from the approved grids in clawd-sprites.js.
function paintClawd(layer, s) {
  layer.data.fill(0);
  if (!s.clawd) return;
  const grid = CLAWD_POSES[s.clawd.pose];
  if (!grid) throw new Error("Unknown pose " + s.clawd.pose);
  const top = STAGE.FLOOR - grid.length;
  grid.forEach((row, j) => {
    [...row].forEach((ch, i) => {
      const hex = CLAWD_COLORS[ch];
      const x = s.clawd.x + i;
      if (!hex || x < 0 || x >= layer.w) return;
      const k = ((top + j) * layer.w + x) * 4;
      layer.data[k] = parseInt(hex.slice(1, 3), 16);
      layer.data[k + 1] = parseInt(hex.slice(3, 5), 16);
      layer.data[k + 2] = parseInt(hex.slice(5, 7), 16);
      layer.data[k + 3] = 255;
    });
  });
}
