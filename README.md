# yannworks.github.io

The personal site of yannworks: one page with a short intro, three links, and a small pixel-art theatre where Clawd, the Claude Code mascot, plays the piano, types and wakes up a little robot under a spotlight. Everything except Clawd is drawn in two colours by a dithering shader.

Plain HTML, CSS and JavaScript. No framework, no build step: GitHub Pages serves these files as they are.

## Files

| File | What it does |
| --- | --- |
| `index.html` | The page: name, intro, links, the scene. Works without JavaScript. |
| `style.css` | All the styles. Colours, fonts, sizes and timings are variables at the top. |
| `js/show.js` | The show: what happens on stage at each second of the 50 s loop. |
| `js/stage-art.js` | The props (piano, typewriter, robot...) drawn as text grids, and Clawd's layer. |
| `js/stage.js` | The WebGL shader that lights the stage and turns it into black and white dots. |
| `js/scene.js` | Runs the scene on the page: size, clock, follow-spot, pause button. |
| `js/main.js` | Theme toggle with the dither dissolve, and the keywords printing in dots. |
| `js/clawd-sprites.js` | Clawd's poses. Generated, do not edit by hand (see below). |
| `board.html`, `js/board.js` | The design board: tokens, components, dither levels, poses, timeline. |
| `fonts/` | Geist and Geist Serif (woff2) with their licence, `OFL.txt`. |
| `img/` | Still frames of the scene (used without WebGL or JavaScript) and the share image. |
| `tools/make-clawd.py` | Rebuilds `js/clawd-sprites.js` and the favicons from the clawd skill. |
| `.web-craft/` | Notes on how the site was made: brief, direction, decisions, checks. |

## How the scene works

1. **The show** (`show.js`) is a list of moments with durations. `showAt(t)` returns the state of the stage at any time `t`: where Clawd stands, which pose he has, what the props are doing, where the spot aims.
2. **The art** (`stage-art.js`) paints that state into a small grid of 212 × 118 cells. Each prop is a text drawing where a digit is a shade: `0` black, `9` white.
3. **The shader** (`stage.js`) runs once per cell, every frame. It adds the curtains, floor and seats, lights everything with the house lights plus the follow-spot (with shadows), then compares each cell's brightness with a threshold from an 8 × 8 Bayer grid: brighter gives the light colour, darker the dark one. That is ordered dithering. Clawd is drawn last, in his orange, never dithered.
4. **The page** (`scene.js`) enlarges the canvas by a whole number of screen pixels so every dot stays a sharp square, runs at 30 frames per second, and stops when the scene is off screen, the tab is hidden, or the pause button is pressed.

In the dark theme the colours swap and the house lights go down, so the spot does the lighting. With reduced motion, Clawd does not walk: the spot dims, and when it comes back up he is at the next prop.

## How the theme dissolve works

Pressing the toggle starts a view transition: the browser keeps a picture of the page in the old theme, then shows the new theme on top through a mask cut from the same 8 × 8 Bayer grid, revealing a few more cells on every frame for 0.5 s. Browsers without view transitions get a plain colour fade. The theme is saved in `localStorage`, and a small script in `<head>` applies it before the page is drawn, so it never flashes.

## Changing things

- Colours, fonts, sizes, timings: the variables at the top of `style.css`.
- Text and links: `index.html`.
- The show (order, durations): `moments()` in `js/show.js`. The board (`board.html`) lists every moment with its start time.
- A prop's look: its text drawing in `js/stage-art.js`.
- Light levels and the spot: `SCENE` at the top of `js/scene.js`.
- To see one moment without waiting: open `index.html?at=40` (the scene pauses there).

To try the site on your computer, serve the folder (for example `python3 -m http.server`) and open `http://localhost:8000`.

## Clawd

Clawd is the Claude Code mascot; this is fan art. Its poses come from the approved pixel grids of the clawd skill in the owner's AIOS workspace, never redrawn by hand. To regenerate them and the favicons:

```
python3 tools/make-clawd.py /path/to/AIOS
```

## Credits

- Geist and Geist Serif by Vercel, under the SIL Open Font License 1.1 (`fonts/OFL.txt`), from the `geist` npm package 1.9.2.
- Clawd, the Claude Code mascot, drawn as fan art. Not an official Anthropic page.
