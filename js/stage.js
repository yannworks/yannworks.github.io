// The stage renderer: one WebGL shader that lights the scene and dithers it.
//
// The canvas is only 212 x 118 pixels, one pixel per cell; CSS enlarges it
// by a whole number so every dot stays a sharp square. For each cell the
// shader (FRAGMENT below) runs once per frame and does four things:
//   1. finds the shade of what is there: curtain, floor, a prop...
//   2. lights it: the house lights (uAmbient) plus the follow-spot,
//      with shadows behind whatever stands in the spot;
//   3. compares that brightness with the Bayer threshold of the cell:
//      brighter -> the light colour, darker -> the dark colour;
//   4. draws Clawd on top, in his own colours, never dithered.

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uProps;   // props layer (see stage-art.js)
uniform sampler2D uClawd;   // Clawd, in colour
uniform vec2 uSize;         // 212, 118
uniform float uTime;        // seconds, for the curtain sway and the dust
uniform float uMotion;      // 1 = full motion, 0 = reduced motion
uniform float uAmbient;     // house lights: high in the light theme, low in the dark one
uniform vec3 uSpot;         // spot centre x, y and radius, in cells
uniform float uPower;       // spot brightness, flicker included
uniform vec2 uPush;         // how much Clawd pushes the left / right curtain
uniform vec3 uLight;        // the lighter theme colour
uniform vec3 uDark;         // the darker theme colour

const float BACK = 78.0;    // row where the floor meets the back curtain
const float LIP = 100.0;    // row of the front edge of the stage

// Ordered dithering thresholds. bayer8 gives each cell of an 8 x 8 tile a
// different threshold between 0 and 1 (64 levels), built from 2 x 2 tiles.
float bayer2(vec2 a) { a = mod(floor(a), 2.0); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

// Threshold of a cell: change bayer8 / 64.0 to bayer4 / 16.0 for coarser patterns.
#define BAYER(c) (bayer8(c) + 0.5 / 64.0)

float wave(float x) { return 0.5 + 0.5 * cos(x * 6.28318); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec4 cell(sampler2D tex, vec2 p) { return texture2D(tex, (floor(p) + 0.5) / uSize); }

// The shade of the empty stage at p. front = 1 for the curtains and the
// border at the top, which hide Clawd when he walks behind them.
float stage(vec2 p, out float front) {
  front = 0.0;
  float x = p.x, y = p.y;

  // Side curtains: broad folds, a slow sway, a bulge when Clawd passes behind.
  float sway = uMotion * 0.8 * sin(uTime * 0.7 + y * 0.06);
  float low = smoothstep(56.0, 98.0, y);
  float left = 19.0 + sway + uPush.x * 3.0 * low;
  float right = uSize.x - 19.0 + sway - uPush.y * 3.0 * low;
  if (y < LIP && (x < left || x > right)) {
    front = 1.0;
    float d = x < left ? left - x : x - right;      // distance from the inner edge
    float s = 0.24 + 0.18 * wave((x - sway * 1.5) / 9.0);
    s *= mix(1.0, 0.7, smoothstep(0.0, 18.0, d));
    if (d < 1.0) s = 0.7;                           // the edge of the drape catches light
    return s;
  }

  // Border at the top, hanging in swags, with a fringe.
  float swag = 9.0 + 4.0 * sin(3.14159 * fract(x / 26.5));
  if (y < swag) {
    front = 1.0;
    return y < 2.0 ? 0.04 : 0.22 + 0.14 * wave(x / 6.0);
  }
  if (y < swag + 1.0) { front = 1.0; return mod(x, 2.0) < 1.0 ? 0.9 : 0.3; }

  // Back curtain: lighter, wide soft folds, a shadow where it meets the floor.
  if (y < BACK) {
    float s = 0.7 + 0.1 * wave(x / 14.0);
    s *= mix(0.82, 1.0, smoothstep(14.0, 50.0, y));
    if (y > BACK - 3.0) s *= 0.72;
    return s;
  }

  // Floor boards, running towards the middle of the back.
  if (y < LIP) {
    float u = (x - uSize.x * 0.5) / (y - 16.0) * 9.33;
    float seam = abs(fract(u + 0.5) - 0.5);
    float s = mix(0.7, 0.82, (y - BACK) / (LIP - BACK));
    if (seam < 4.7 / (y - 16.0)) s *= 0.7;
    return s;
  }
  if (y < LIP + 1.0) return 0.92;                    // front edge of the stage

  // Backs of the front-row seats (rounded tops), dark against the front of the stage.
  float seat = mod(x + 4.0, 19.0);
  float edge = min(seat, 15.0 - seat);              // distance to the side of a seat
  float top = 106.0 + (edge < 1.0 ? 2.0 : edge < 2.0 ? 1.0 : 0.0);
  if (seat < 16.0 && y >= top) { front = 1.0; return y < top + 1.0 ? 0.36 : 0.02; }
  return mod(x, 26.0) < 1.0 ? 0.18 : 0.34;
}

void main() {
  // Cell coordinates with y going down, like the drawings.
  vec2 c = vec2(floor(gl_FragCoord.x), uSize.y - 1.0 - floor(gl_FragCoord.y));
  vec2 p = c + 0.5;

  float front;
  float shade = stage(p, front);
  vec4 prop = cell(uProps, p);
  vec4 clawd = cell(uClawd, p);
  bool hasProp = prop.a > 0.5 && front < 0.5;
  if (hasProp) shade = prop.r;
  float glow = hasProp ? prop.b : 0.0;

  // The pool of light: a soft ellipse, plus a faint halo around it.
  vec2 d = (p - uSpot.xy) / vec2(uSpot.z * 1.12, uSpot.z);
  float r = length(d);
  float pool = smoothstep(1.0, 0.8, r) + 0.22 * smoothstep(1.4, 1.0, r);

  // Shadows: the light comes from above the audience, so whatever stands in
  // the spot throws its shadow just above and behind itself.
  bool caster = (hasProp && prop.g > 0.5) || clawd.a > 0.5;
  if (!caster && front < 0.5) {
    vec2 q = p + vec2((p.x - uSpot.x) * 0.06, 3.0);
    if (cell(uProps, q).g > 0.5 || cell(uClawd, q).a > 0.5) pool *= 0.3;
  }
  if (p.y >= LIP) pool = 0.0;                        // the seats stay in the dark

  // The beam: faint haze from above the audience down to the pool.
  vec2 src = vec2(uSize.x * 0.5 + (uSpot.x - uSize.x * 0.5) * 0.35, -60.0);
  vec2 ab = uSpot.xy - src;
  float k = clamp(dot(p - src, ab) / dot(ab, ab), 0.0, 1.0);
  float width = mix(5.0, uSpot.z * 0.95, k);
  float beam = (1.0 - smoothstep(width * 0.45, width, length(p - src - ab * k)));
  beam *= smoothstep(0.35, 0.8, k) * step(p.y, uSpot.y);
  float dust = uMotion * step(0.993, hash(floor(p + vec2(uTime * 0.7, uTime * 2.2))));
  beam *= (0.12 + 0.5 * dust) * uPower * (1.0 - 0.7 * uAmbient);

  // The spot adds less where the house lights are already up, so dark props
  // keep their shape inside the pool in the light theme.
  float light = uAmbient + pool * uPower * (1.15 - 0.6 * uAmbient);
  float brightness = shade * light + beam + glow;

  // 1-bit ordered dithering.
  float threshold = BAYER(c);
  vec3 colour = brightness > threshold ? uLight : uDark;

  // Clawd on top, unless a curtain is in front of him.
  if (clawd.a > 0.5 && front < 0.5) colour = clawd.rgb;
  gl_FragColor = vec4(colour, 1.0);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function hexToRgb(hex) {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? [...h].map((ch) => ch + ch).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
}

// Returns a small object with upload() and draw(), or null without WebGL.
function createStage(canvas) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, powerPreference: "low-power" });
  if (!gl) return null;
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // One triangle that covers the whole canvas.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = {};
  for (const name of ["uProps", "uClawd", "uSize", "uTime", "uMotion", "uAmbient", "uSpot", "uPower", "uPush", "uLight", "uDark"]) {
    u[name] = gl.getUniformLocation(program, name);
  }

  // Two textures, read cell by cell (no smoothing).
  function texture(unit) {
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST],
      [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    return tex;
  }
  const textures = { props: texture(0), clawd: texture(1) };
  gl.uniform1i(u.uProps, 0);
  gl.uniform1i(u.uClawd, 1);
  gl.uniform2f(u.uSize, canvas.width, canvas.height);

  return {
    upload(which, layer) {
      gl.activeTexture(which === "props" ? gl.TEXTURE0 : gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, textures[which]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, layer.w, layer.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, layer.data);
    },
    draw(v) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, v.time);
      gl.uniform1f(u.uMotion, v.motion);
      gl.uniform1f(u.uAmbient, v.ambient);
      gl.uniform3f(u.uSpot, v.spot.x, v.spot.y, v.spot.r);
      gl.uniform1f(u.uPower, v.power);
      gl.uniform2f(u.uPush, v.push[0], v.push[1]);
      gl.uniform3fv(u.uLight, hexToRgb(v.light));
      gl.uniform3fv(u.uDark, hexToRgb(v.dark));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
