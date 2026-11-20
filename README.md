# yannworks.github.io

The personal site of yannworks: one page with a short intro, three links, a GitHub contribution graph, and a small pixel-art theatre where Clawd, the Claude Code mascot, plays the piano, types and wakes up a little robot under a spotlight. Everything except Clawd is drawn in two colours by a dithering shader.

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
| `js/activity.js` | The contribution graph: reads `contributions.json`, draws the dots, Clawd on today. |
| `contributions.json` | The contribution calendar, written once a day by the GitHub Action. |
| `.github/workflows/contributions.yml` | The GitHub Action that updates `contributions.json`. |
| `tools/fetch-contributions.mjs` | What the Action runs: asks GitHub for the calendar and writes the JSON. |
| `tools/sample-contributions.mjs` | Made-up data to try the graph on your computer (shown only on localhost). |
| `js/clawd-sprites.js` | Clawd's poses. Generated, do not edit by hand (see below). |
| `board.html`, `js/board.js` | The design board: tokens, components, dither levels, poses, timeline. |
| `fonts/` | Geist and Geist Serif (woff2) with their licence, `OFL.txt`. |
| `img/` | Still frames of the scene (used without WebGL or JavaScript) and the share image. |
| `tools/make-clawd.py` | Rebuilds `js/clawd-sprites.js` and the favicons from the clawd skill. |
| `.web-craft/` | Notes on the current piece of work: brief, decisions, checks. Earlier ones are in `.web-craft-history/`. |

## How the scene works

1. **The show** (`show.js`) is a list of moments with durations. `showAt(t)` returns the state of the stage at any time `t`: where Clawd stands, which pose he has, what the props are doing, where the spot aims.
2. **The art** (`stage-art.js`) paints that state into a small grid of 212 × 118 cells. Each prop is a text drawing where a digit is a shade: `0` black, `9` white.
3. **The shader** (`stage.js`) runs once per cell, every frame. It adds the curtains, floor and seats, lights everything with the house lights plus the follow-spot (with shadows), then compares each cell's brightness with a threshold from an 8 × 8 Bayer grid: brighter gives the light colour, darker the dark one. That is ordered dithering. Clawd is drawn last, in his orange, never dithered.
4. **The page** (`scene.js`) enlarges the canvas by a whole number of screen pixels so every dot stays a sharp square, runs at 30 frames per second, and stops when the scene is off screen, the tab is hidden, or the pause button is pressed.

In the dark theme the colours swap and the house lights go down, so the spot does the lighting. With reduced motion, Clawd does not walk: the spot dims, and when it comes back up he is at the next prop.

## How the contribution graph works

Three pieces, each with one job:

1. **The Action** (`.github/workflows/contributions.yml`) runs on GitHub's computers once a day, at 22:47 UTC. It runs `tools/fetch-contributions.mjs`, which asks GitHub's GraphQL API for the contribution calendar of `yannworks`, the same calendar as on the profile. It uses the workflow's built-in token, so no key is stored anywhere.
2. **The JSON file** (`contributions.json`) is what the Action saves: one line per day with its date, its count and GitHub's level (0 to 4), plus the total and the time it was fetched. The Action commits it to `main` only when something changed, which is about once a day since a new day appears every day. That commit makes GitHub Pages publish the new file.
3. **The page** (`js/activity.js`) downloads that file when someone visits and draws it. A browser could not ask GitHub for the calendar itself without a key, and a key cannot live in a public page: this is why the Action does the asking.

**Run it by hand:** on GitHub, open the repository, tap **Actions**, then **Contributions** in the list on the left, then **Run workflow** (and confirm with the green **Run workflow** button). After about a minute, `contributions.json` is updated, and the site a minute later.

**If it fails:** the Actions tab shows the run in red with a message (GitHub normally emails you about failed scheduled runs too). If the message says the token cannot read the calendar, create a fine-grained personal access token (GitHub settings, Developer settings), then add it in the repository under Settings, Secrets and variables, Actions, as a secret named `CONTRIBUTIONS_TOKEN`. The workflow uses that secret first when it exists. Never put a token in the code.

**If the graph stops updating:** GitHub turns off scheduled workflows in a repository with no activity for 60 days. The daily commits should keep it active; if the Actions tab says the workflow is disabled, press **Enable workflow**. The page says "updated <date>" when its data is more than three days old.

**Until the first run** `contributions.json` holds no days and the section stays hidden. To see the graph on your computer, write made-up data with `node tools/sample-contributions.mjs contributions.json` and serve the folder; that file is marked as a sample and never shows on the real site. Do not commit it.

The drawing: each day is 4 × 4 dots; GitHub's levels 0 to 4 show 1, 2, 4, 8 and 16 of them, in the order of the 4 × 4 Bayer grid (the small version of the scene's grid). A computer shows the last 53 weeks, a phone the last 26. Clawd walks to today once, then stays still until you tap or hover him.

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
