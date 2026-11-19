// The show: what happens on stage, second by second.
//
// Everything here is a pure function of time: showAt(timeline, t) always
// returns the same picture for the same t. That keeps the loop exact (the
// end leads straight into the start) and makes any moment easy to inspect.
// Positions are in cells of the 212 x 118 stage grid, (0, 0) at the top left.

const STAGE = {
  W: 212,
  H: 118,
  FLOOR: 92,          // first floor row under everyone's feet (Clawd stands on rows 76 to 91)
  PIANO: 30,          // where Clawd stands at each prop (left edge of his sprite)
  TYPEWRITER: 92,
  ROBOT: 146,
  ENTER: -24,         // off stage, behind the left curtain
  EXIT: 194,          // off stage, behind the right curtain
  STEP: 0.1,          // seconds per walking step; one step moves one cell
};

// Where the follow-spot aims when nobody moves the mouse.
const FOCUS = {
  wingLeft: { x: 22, y: 81 },
  piano: { x: 50, y: 80 },
  typewriter: { x: 112, y: 80 },
  robot: { x: 166, y: 80 },
};

// The walk cycle of the clawd skill: [legs lifted, crouch] for each step.
const WALK = [["A", 0], ["A", 0], [null, 0], [null, 1], ["B", 0], ["B", 0], [null, 0], [null, 1]];

// Builds a pose name from js/clawd-sprites.js, e.g. "side_right/typing/crouch".
function pose(view, o = {}) {
  const parts = [view];
  if (o.face && o.face !== "normal") parts.push(o.face);
  if (o.arm) parts.push(o.arm);
  if (o.crouch) parts.push("crouch");
  if (o.legs) parts.push("legs" + o.legs);
  return parts.join("/");
}

const between = (t, a, b) => t >= a && t < b;
const ROBOT_ASLEEP = { awake: false, head: 1, eyes: false, panel: "closed", arm: "down", bow: 0 };
const ROBOT_AWAKE = { awake: true, head: 0, eyes: true, panel: "closed", arm: "down", bow: 0 };

function standAt(s, x, blink, view = "side_right") {
  s.clawd = { pose: pose(view, { face: blink ? "blink" : "normal" }), x };
  s.focus = stationFocus(x);
}

// ---------------------------------------------------------------- moments

function piano(t, s) {
  // 32 steps of 0.2 s. "x" = Clawd's arm presses the keys on that step.
  const RHYTHM = "x.x.xx.xx.x.x.xxx.x.xx.xx.x.xx..";
  const step = Math.min(31, Math.floor(t / 0.2));
  const press = RHYTHM[step] === "x" && t % 0.2 < 0.14;
  const bob = step % 8 === 0 && t % 0.2 < 0.16;          // small dip on each bar
  const blink = step === 13 || step === 27;
  s.clawd = {
    pose: pose("side_right", { face: blink ? "blink" : "normal", arm: press ? "typing" : null, crouch: bob }),
    x: STAGE.PIANO,
  };
  s.piano = { keys: press, tick: Math.round(3 * Math.sin((2 * Math.PI * t) / 1.6)) };
  s.focus = FOCUS.piano;
}

function tada(x, focus) {
  // Turns to the audience: happy face, a blink, back to normal.
  return (t, s) => {
    const face = t < 0.75 ? "happy" : between(t, 0.75, 0.9) ? "blink" : "normal";
    s.clawd = { pose: pose("front", { face }), x };
    s.focus = focus;
  };
}

function typewriter(t, s) {
  // Four lines of typing (1.5 s each), then the page comes out and lands
  // on the pile next to the stool, and a fresh sheet is in the machine.
  const LINES = ["x.xx.x.xxx.x", "xx.x.xx.x.xx", "x.x.xxx.x.x.", "xx.xx.x.x.xx"];
  let arm = null, blink = false;
  const paper = { lines: 0, extra: 0, flying: -1 };
  if (t < 6) {
    const line = Math.floor(t / 1.5), lt = t % 1.5;
    paper.lines = line;
    if (lt < 1.25) {
      const k = Math.floor(lt / 0.11);
      arm = LINES[line][k % 12] === "x" && lt % 0.11 < 0.075 ? "typing" : null;
    } else if (lt >= 1.32) {
      paper.lines = line + 1;                              // line feed
    }
    blink = between(t, 3.05, 3.2);
  } else if (t < 6.3) {
    paper.lines = 4;
    paper.extra = 2 * (1 + Math.floor((t - 6) / 0.1));     // the sheet slides up
  } else if (t < 6.8) {
    paper.lines = -1;                                      // the machine is empty
    paper.flying = Math.floor((t - 6.3) / 0.1);           // 5 steps of flight
  } else {
    blink = between(t, 6.9, 7.05);
  }
  s.clawd = { pose: pose("side_right", { face: blink ? "blink" : "normal", arm }), x: STAGE.TYPEWRITER };
  s.paper = paper;
  s.focus = FOCUS.typewriter;
}

function nod(t, s) {
  const crouch = between(t, 0.1, 0.35);
  const blink = between(t, 0.5, 0.62);
  s.clawd = { pose: pose("side_right", { face: blink ? "blink" : "normal", crouch }), x: STAGE.TYPEWRITER };
  s.focus = FOCUS.typewriter;
}

function robot(t, s) {
  // Peek inside the robot (crouch), close it, it wakes up and waves,
  // Clawd waves back with his raised arm, then both bow (crouch).
  const r = { ...ROBOT_ASLEEP };
  let c;
  if (t < 0.4) {
    c = pose("side_right");
  } else if (t < 2.8) {
    c = pose("side_right", { crouch: 1, face: between(t, 1.5, 1.65) ? "blink" : "normal" });
    if (between(t, 0.6, 2.4)) {
      r.panel = "open";
      r.inside = Math.floor(t / 0.2) % 2;                 // the little parts tick
    }
  } else if (t < 3.6) {
    c = pose("side_right", { face: between(t, 3.2, 3.32) ? "blink" : "normal" });
  } else {
    c = pose("front");
  }
  if (t >= 3.0) {
    r.eyes = !between(t, 3.1, 3.2);                       // eyes flicker on
    r.awake = r.eyes;
  }
  if (t >= 3.4) r.head = 0;                               // head comes up
  if (between(t, 3.8, 5.4)) r.arm = Math.floor((t - 3.8) / 0.3) % 2 === 0 ? "up" : "down";
  if (between(t, 4.0, 5.6)) {
    const wave = between(t, 4.4, 4.8) || between(t, 5.0, 5.4);
    c = pose("front", { face: "happy", arm: wave ? "right_up" : null });
  }
  if (between(t, 5.9, 6.9)) {
    c = pose("front", { face: "blink", crouch: 1 });      // the bow
  }
  if (between(t, 6.0, 6.9)) r.bow = 1;
  if (between(t, 7.0, 7.8)) c = pose("front", { face: "happy" });
  if (between(t, 8.2, 8.35)) c = pose("front", { face: "blink" });
  s.clawd = { pose: c, x: STAGE.ROBOT };
  s.robot = r;
  s.focus = FOCUS.robot;
}

function turnSide(t, s) {
  s.clawd = { pose: pose("side_right"), x: STAGE.ROBOT };
  s.robot = { ...ROBOT_AWAKE };
  s.focus = FOCUS.robot;
}

// The robot during Clawd's exit: waves goodbye, then goes back to sleep.
function robotDuringExit(t, s) {
  const r = { ...ROBOT_AWAKE };
  if (between(t, 0.8, 1.0) || between(t, 1.2, 1.4)) r.arm = "up";
  if (t >= 3.4) { r.eyes = false; r.awake = false; }
  if (t >= 3.6) r.head = 1;
  s.robot = r;
}

// ---------------------------------------------------------------- timeline

// A walk moves one cell per step with the skill's walk cycle. With reduced
// motion it becomes a cut: the spot dims, Clawd is moved in the dark, the
// spot comes back up.
function walk(from, to, during) {
  return { walk: [from, to], dur: (Math.abs(to - from) * STAGE.STEP), during };
}

function moments() {
  return [
    { name: "Empty stage; the spot waits at the left wing", dur: 1.2, run: (t, s) => { s.focus = FOCUS.wingLeft; } },
    { name: "Clawd walks in", ...walk(STAGE.ENTER, STAGE.PIANO) },
    { name: "He stops and blinks", dur: 0.6, run: (t, s) => standAt(s, STAGE.PIANO, between(t, 0.25, 0.4)) },
    { name: "Piano: keys under his arm, the metronome swings", dur: 6.4, run: piano },
    { name: "He turns to the audience, happy", dur: 1.2, run: tada(STAGE.PIANO, FOCUS.piano) },
    { name: "Walk to the typewriter", ...walk(STAGE.PIANO, STAGE.TYPEWRITER) },
    { name: "He stops and blinks", dur: 0.5, run: (t, s) => standAt(s, STAGE.TYPEWRITER, between(t, 0.2, 0.33)) },
    { name: "Typewriter: four lines, the page flies onto the pile", dur: 7.2, run: typewriter },
    { name: "A satisfied nod", dur: 0.8, run: nod },
    { name: "Walk to the robot", ...walk(STAGE.TYPEWRITER, STAGE.ROBOT) },
    { name: "He stops; the robot is asleep", dur: 0.6, run: (t, s) => standAt(s, STAGE.ROBOT, between(t, 0.3, 0.42)) },
    { name: "Robot: peek inside, it wakes up, waves, both bow", dur: 8.4, run: robot },
    { name: "He turns to leave", dur: 0.4, run: turnSide },
    { name: "Walk off; the robot waves, then falls asleep", ...walk(STAGE.ROBOT, STAGE.EXIT, robotDuringExit) },
    { name: "Empty stage; the spot swings back to the left", dur: 1.4, run: (t, s) => { s.focus = FOCUS.wingLeft; } },
  ];
}

// Gives every moment its start time. reduced = prefers-reduced-motion.
function buildTimeline(reduced) {
  let start = 0;
  const list = moments().map((m) => {
    const dur = m.walk && reduced ? 1.6 : m.dur;
    const item = { ...m, dur, start };
    start += dur;
    return item;
  });
  return { list, length: start, reduced };
}

const dimCurve = (t) => (t < 0.6 ? 1 - 0.85 * smooth(t / 0.6) : t < 1 ? 0.15 : 0.15 + 0.85 * smooth((t - 1) / 0.6));
function smooth(x) { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); }

const onStage = (x) => x > -23 && x < STAGE.W;

function stationFocus(x) {
  if (x === STAGE.TYPEWRITER) return FOCUS.typewriter;
  if (x === STAGE.ROBOT) return FOCUS.robot;
  return FOCUS.piano;   // the piano, and the wings: the next loop starts there
}

// The state of the stage at time t (seconds, any value: it wraps around).
function showAt(timeline, t) {
  t = ((t % timeline.length) + timeline.length) % timeline.length;
  const m = timeline.list.find((it) => t < it.start + it.dur) || timeline.list[timeline.list.length - 1];
  const lt = t - m.start;
  const s = {
    t,
    clawd: null,
    focus: FOCUS.wingLeft,
    dim: 1,                         // spot brightness factor (reduced-motion cuts)
    walking: false,
    piano: { keys: false, tick: 0 },
    paper: { lines: 0, extra: 0, flying: -1 },
    robot: { ...ROBOT_ASLEEP },
  };
  if (m.walk) {
    const [from, to] = m.walk;
    if (timeline.reduced) {
      // The cut: Clawd changes place at 0.8 s, while the spot is dark.
      const x = lt < 0.8 ? from : to;
      if (onStage(x)) standAt(s, x, false);
      if (from === STAGE.ENTER) s.dim = lt < 0.8 ? 0.15 : dimCurve(lt);      // stage was already dark
      else if (to === STAGE.EXIT) s.dim = lt < 0.6 ? dimCurve(lt) : 0.15;   // stays dark after
      else s.dim = dimCurve(lt);
      s.focus = stationFocus(lt < 0.8 ? from : to);
    } else {
      const steps = Math.floor(lt / STAGE.STEP);
      const x = from + Math.sign(to - from) * steps;
      const [legs, crouch] = WALK[steps % WALK.length];
      if (onStage(x)) s.clawd = { pose: pose("side_right", { legs, crouch }), x };
      s.walking = true;
      s.focus = { x: x + 11.5, y: 81 };
    }
    if (m.during) m.during(timeline.reduced ? (lt < 0.8 ? 0 : 9) : lt, s);
  } else {
    m.run(lt, s);
  }
  // With reduced motion the stage is dim while it is empty between loops.
  if (timeline.reduced && !m.walk && !s.clawd) { s.dim = 0.15; s.focus = FOCUS.piano; }
  return s;
}
