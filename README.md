# yannworks.github.io

The personal site of yannworks: one page with a short intro (with Yann's local time), three links, a GitHub contribution graph, and a small pixel-art theatre where Clawd, the Claude Code mascot, plays the piano, types and wakes up a little robot under a spotlight. Everything except Clawd is drawn in two colours by a dithering shader.

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
| `js/clock.js` | Yann's local time in the intro, and how far it is from the visitor's time. |
| `js/activity.js` | The contribution graph: reads `contributions.json`, draws the dots, Clawd on today. |
| `contributions.json` | The contribution calendar, written once a day by the GitHub Action. |
| `.github/workflows/contributions.yml` | The GitHub Action that updates `contributions.json`. |
| `tools/fetch-contributions.mjs` | What the Action runs: asks GitHub for the calendar and writes the JSON. |
| `tools/sample-contributions.mjs` | Made-up data to try the graph on your computer (shown only on localhost). |
| `js/clawd-sprites.js` | Clawd's poses. Generated, do not edit by hand (see below). |
| `board.html`, `js/board.js` | The design board: tokens, components, dither levels, poses, timeline. |
| `fonts/` | Geist and Geist Serif (woff2) with their licence, `OFL.txt`. |
| `img/` | Still frames of the scene (used without WebGL or JavaScript) and the share image. |
| `tools/test-clock.mjs` | Browser tests for the local time (time zones, clock changes, midnight). |
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

**If the total is lower than on your profile:** the Action sees your calendar as a visitor does. Your private contributions count only when "Private contributions" is ticked under **Contribution settings**, above the graph on your GitHub profile. Tick it, then run the workflow by hand.

**If the graph stops updating:** GitHub turns off scheduled workflows in a repository with no activity for 60 days. The daily commits should keep it active; if the Actions tab says the workflow is disabled, press **Enable workflow**. The page says "updated <date>" when its data is more than three days old.

**Until the first run** `contributions.json` holds no days and the section stays hidden. To see the graph on your computer, write made-up data with `node tools/sample-contributions.mjs contributions.json` and serve the folder; that file is marked as a sample and never shows on the real site. Do not commit it.

The drawing: each day is 4 × 4 dots; GitHub's levels 0 to 4 show 1, 2, 4, 8 and 16 of them, in the order of the 4 × 4 Bayer grid (the small version of the scene's grid). A computer shows the last 53 weeks, a phone the last 26. Clawd walks to today once, then stays still until you tap or hover him.

## How the local time works

The intro says "a student living in France, where it's 21:41", so a visitor can tell whether it is late in France before writing. When the visitor's device is set to another time zone, the gap follows in brackets: "(6 hours ahead of you)", "(3 hours behind you)", "(4½ hours behind you)". With the same time, nothing is added.

1. **Paris time.** The browser knows the rules of every time zone, daylight saving included. `js/clock.js` asks it what the wall clock says in `Europe/Paris` at this instant and shows hours and minutes, 24-hour style.
2. **The gap.** It takes Paris's distance from UTC (60 minutes in winter, 120 in summer) and the visitor's own (New York: −300 in winter), and subtracts: 60 − (−300) = 360 minutes, "6 hours ahead of you". Both are worked out again every minute, so the weeks when only one side has changed its clocks come out right (New York and Paris are 5 hours apart then).
3. **The minute.** One timer is set for the next whole minute, then the next, each time from the real clock, so it never drifts. When the tab comes back into view the time is refreshed at once. The digits that changed trade places in dots through the theme dissolve's masks, in 240 ms; with reduced motion they just change.
4. **No jump.** `js/clock.js` loads in `<head>` without `defer`, and a one-line script right after the intro writes the time before the page is first drawn. Geist's digits normally have different widths; `tabular-nums` makes them equal, so the sentence keeps its width when the minute changes. Without JavaScript the sentence ends at "France.".

Screen readers get a `<time>` element with the full date and offset, and no live region, so the time is not read out every minute.

**Limit:** the time comes from the visitor's own device. If its clock or time zone is set wrong, the time and the gap shown are wrong too.

**Try it:** add `?now=` (a moment, in ISO format; the clock runs on from there) and `?tz=` (pretend to be a visitor in that zone) to the address, on the page or on the board. For example `index.html?now=2026-03-15T20:40:55Z&tz=America/New_York` shows 21:40, 5 hours ahead, and the minute change five seconds later.

**Tests:** `npm install --no-save playwright` once, then `node tools/test-clock.mjs`. It opens the page in Chrome as visitors in Paris, Berlin, London, New York, Kolkata, Kathmandu and Auckland, at fixed moments (summer, winter, the weeks between the European and American clock changes, the night Paris changes, midnight), and checks the sentence, the minute change, reduced motion and the page without JavaScript.

## How the theme dissolve works

Pressing the toggle starts a view transition: the browser keeps a picture of the page in the old theme, then shows the new theme on top through a mask cut from the same 8 × 8 Bayer grid, revealing a few more cells on every frame for 0.5 s. Browsers without view transitions get a plain colour fade. The theme is saved in `localStorage`, and a small script in `<head>` applies it before the page is drawn, so it never flashes.

## Changing things

- Colours, fonts, sizes, timings: the variables at the top of `style.css`.
- Text and links: `index.html`.
- The show (order, durations): `moments()` in `js/show.js`. The board (`board.html`) lists every moment with its start time.
- A prop's look: its text drawing in `js/stage-art.js`.
- Light levels and the spot: `SCENE` at the top of `js/scene.js`.
- To see one moment without waiting: open `index.html?at=40` (the scene pauses there).
- The local time: the zone and the swap duration are in `CLOCK` at the top of `js/clock.js`; the wording is in `gapText()` and `showClock()`.

To try the site on your computer, serve the folder (for example `python3 -m http.server`) and open `http://localhost:8000`.

## Clawd

Clawd is the Claude Code mascot; this is fan art. Its poses come from the approved pixel grids of the clawd skill in the owner's AIOS workspace, never redrawn by hand. To regenerate them and the favicons:

```
python3 tools/make-clawd.py /path/to/AIOS
```

## Credits

- Geist and Geist Serif by Vercel, under the SIL Open Font License 1.1 (`fonts/OFL.txt`), from the `geist` npm package 1.9.2.
- Clawd, the Claude Code mascot, drawn as fan art. Not an official Anthropic page.
