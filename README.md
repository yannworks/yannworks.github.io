# yannworks.github.io

The personal site of yannworks: a pixel logo beside the name, then one page with a short intro (with Yann's local time) and three links, then three real components from Yann's lab, Experiments, to try on the spot, then a GitHub contribution graph where a small Clawd, the Claude Code mascot, stands on today. Ink on paper, with Clawd's orange as the only accent: dithered dots that appear in empty space, under the intro's keywords, at the foot of the card you are using and at the end of the page.

Plain HTML, CSS and JavaScript. No framework, no build step: GitHub Pages serves these files as they are.

## Files

| File | What it does |
| --- | --- |
| `index.html` | The page: name, intro, links, the showcase, the graph. Works without JavaScript. |
| `style.css` | All the styles. Colours, fonts, sizes and timings are variables at the top. |
| `js/dots.js` | The living dots: one engine (a grid per zone, one animation loop at 12 steps a second) and the three motions in use, Sparkle, Flow and Drift. |
| `js/accent.js` | Puts the dots in place: under the keywords, at the foot of the cards, at the end of the page; decides which card is active. |
| `js/dots-lab.js` | The six motions not chosen, kept on the board for comparison. Not loaded by the page. |
| `js/main.js` | Theme toggle with the dither dissolve, and the keywords printing in dots. |
| `js/clock.js` | Yann's local time in the intro, and how far it is from the visitor's time. |
| `js/activity.js` | The contribution graph: reads `contributions.json`, draws the squares, Clawd on today. |
| `js/showcase.js` | Loads the showcase (three Experiments components) when the visitor scrolls to it. |
| `showcase/` | The showcase bundle: the three components and React, built by `tools/showcase/`. Do not edit by hand. |
| `tools/showcase/` | Builds the bundle: `build.mjs`, the site's own `entry.tsx`, and `vendor/` (the components copied unchanged from Experiments, with the commit in `SOURCE.json`). |
| `contributions.json` | The contribution calendar, written once a day by the GitHub Action. |
| `.github/workflows/contributions.yml` | The GitHub Action that updates `contributions.json`. |
| `tools/fetch-contributions.mjs` | What the Action runs: asks GitHub for the calendar and writes the JSON. |
| `tools/sample-contributions.mjs` | Made-up data to try the graph on your computer (shown only on localhost). |
| `js/clawd-sprites.js` | Clawd's poses. Generated, do not edit by hand (see below). |
| `board.html`, `js/board.js` | The design board: the logo and its four directions, colours and their contrast, type, the orange dots, the graph, the cards, Clawd's poses. |
| `fonts/` | Geist and Geist Serif (woff2) with their licence, `OFL.txt`. |
| `favicon.svg`, `favicon.png`, `apple-touch-icon.png` | The icons: the logo in ink (light ink in a dark browser theme for the SVG). Made by `tools/make-logo.mjs`. |
| `img/share-v2.png` | The share image for Discord, X and others: logo, name, line, ink dots. Made by `tools/make-logo.mjs`. |
| `img/profile/` | Profile pictures for X, GitHub and Discord: 1024 px, light and dark, PNG and SVG. Made by `tools/make-logo.mjs`. |
| `tools/make-logo.mjs` | Draws the logo from its pixel grid and writes the icons, the profile pictures, the share image, the header logo and the board's data. |
| `js/logo-pistes.js`, `js/board-logo.js` | The four logo directions shown on the board (the data is generated). Not loaded by the page. |
| `tools/test-clock.mjs` | Browser tests for the local time (time zones, clock changes, midnight). |
| `tools/test-showcase.mjs` | Browser tests for the showcase and the rest of the page (loading, failure, copy, keyboard, touch). |
| `tools/measure-load.mjs` | Weight and load time of the page on a throttled phone, and of the showcase after scrolling. |
| `tools/capture.mjs` | Full-page screenshots at chosen widths, light and dark, reduced motion, without JavaScript. |
| `tools/measure-dots.mjs` | What the living dots cost on a slowed-down phone: script time per step and main-thread share, animated and still. |
| `tools/make-clawd.py` | Rebuilds `js/clawd-sprites.js`, Clawd's poses for the graph, from the clawd skill. |
| `.web-craft/` | Notes on the current piece of work: brief, decisions, checks. Earlier ones are in `.web-craft-history/`. |

## The logo

A heavy lowercase y whose tail breaks into dots, like the theme dissolve and the dots of the page. Yann chose it on 22 November 2026 among four directions (Dissolve, Note, Branch, Word), all four still on the board.

- **One grid.** The logo is 16 x 16 cells in `tools/make-logo.mjs` (`#` ink, `o` the accent cell, `.` empty). The favicon is exact at 16 px; the header shows it at 24 px (3 screen pixels a cell on most phones and laptops); the profile pictures at 40 px a cell. Every copy comes from that grid, so changing it and running the script changes them all.
- **Ink, not orange.** The icons, the profile pictures and the header are ink only: the accent cell is drawn in ink, and the logo is whole without it. The share image alone shows that last dot in orange. The site's orange is also Claude's, and orange pixels were what made the old icons read as Claude's.
- **Light and dark.** `favicon.svg` turns light in a dark browser theme (a `prefers-color-scheme` rule inside the file). The header logo uses `currentColor`, so it follows the theme like the name. `favicon.png` (for browsers without SVG icons) and `apple-touch-icon.png` are ink on white.
- **Profile pictures.** In `img/profile/`, light and dark, 1024 px: the grid takes the middle 640 px, so a round crop never touches it.
- **The share image** (`img/share-v2.png`, 1200 x 630): the logo, "yannworks", the line "Building apps with AI, learning how things work, writing and music.", and ink dots rising from the bottom (the same Bayer thresholds and soft noise as the page's dots, with a fixed seed). The text is set in Geist by Chrome, from the site's own font file.

**Regenerate:** `npm install --no-save playwright` once, then `node tools/make-logo.mjs`. It rewrites the files above and the logo in the headers of `index.html` and `board.html` (between the `<!-- logo -->` markers).

**Changing the share image:** give it a new name (`SHARE` at the top of the script, then `share-v3.png` and so on) and update `og:image` and `twitter:image` in `index.html`. Discord and X keep a preview cached under the same address for a long time, so a new name is how they see the new image. To refresh a link already posted on Discord, post it again with something after it (`https://yannworks.github.io/?v=3`): Discord caches previews by the whole address.

## How the orange dots work

The dots are Clawd's orange, `#d97757`, the only colour on the page besides ink, paper and two greys. They never sit under text or a component: only in space left empty for them.

1. **Where.** Under each keyword of the intro, a 4 px band of 2 px dots in the gap between lines. At the foot of each component card, a 40 px strip kept empty below the link. At the end of the page, a field of 56 px (72 px on wider screens).
2. **The grid** (`js/dots.js`). Each place gets a canvas cut into cells (2 px under the keywords, 3 px elsewhere). Every cell has a density (how much the place wants a dot there: dense at the bottom of a card, fading upwards, broken into patches by a soft noise) and a threshold from the 8 × 8 Bayer grid, the same grid as the theme dissolve. A cell is on when its density is above its threshold. The cells never move, never fade and are never cut: motion only changes which cells are on.
3. **One loop.** A single `requestAnimationFrame` loop moves all three places, but only 12 times a second, so the dots change in small jumps like pixels instead of gliding at 60 Hz. A place only gets steps while it is on screen (an `IntersectionObserver`), the tab is visible and its motion has something to do; when nothing does, the loop stops. Only the cells that change are painted. Every visit draws a new random seed, so the patterns are never the same twice.
4. **The three motions**, each chosen by Yann among three:
   - **Under the keywords: Sparkle.** The band appears once, its cells in a random order, after the word itself has printed. Pointing at the word makes it crackle for 600 ms, fewer and fewer cells flipping, then it is exactly as before. Nothing moves while you read.
   - **The active card: Flow.** The card the visitor last pointed at, touched or reached with the keyboard has the class `is-active` (the first card before that). Its strip lights in a random order in 300 ms, with a faint warm light behind it; the previous card's strip goes out in a random order in 200 ms. While the card stays active and on screen, the noise under its strip drifts sideways, about 1.5 cells a second: cells light ahead of a patch and go out behind it. Reached with the Tab key, the switch is immediate. Changed halfway, it carries on from the cells already lit.
   - **The end of the page: Drift.** Whenever it is on screen, the field rolls slowly up and sideways, like the glow of embers. It is the one place that moves without the visitor doing anything.
5. **Reduced motion and no JavaScript.** With reduced motion, each place shows one still image (today's seed) and never moves. Without JavaScript there are no dots at all.

**Cost** (`node tools/measure-dots.mjs`, phone 390 px with the processor slowed down 4 times): about 2.7 ms of script per step, 12 steps a second, so the main thread is about 9 to 11 % busy while a strip or the page end is on screen, under 0.5 % with reduced motion.

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

The drawing: one square per day for the last 26 weeks, on every screen, as large as the width allows (6 to 16 px). Empty days are grey; GitHub's levels 1 to 4 are four shades of Clawd's orange, each at least 3:1 against the background, darker for more in the light theme and brighter for more in the dark one. Month names sit under the columns. Hover a square, tap it, or focus the graph and use the arrow keys to read a day.

Clawd is drawn from the approved grids, 2 px per cell (44 × 32 px). The first time the graph comes on screen he walks in from the left to today's column, blinks and bounces a couple of times, then stands still. Point at him or tap him and he waves with his happy face. With reduced motion he is already there, and only blinks.

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

## How the showcase works

The section right under the intro holds three real components from [Experiments](https://github.com/yannworks/experiments): Shoji Bento, Gem Clip and Snooze Button, each on its own card. They are React components, and this site has no framework and no build step, so they arrive as one ready-made bundle.

- `tools/showcase/build.mjs` downloads each component's `.tsx` and `.css` from GitHub at one exact commit into `tools/showcase/vendor/`, unchanged, and writes that commit in `vendor/SOURCE.json`. It then bundles them, React 19.3.1 and `entry.tsx` (which components, with which content) into `showcase/showcase.js` and `showcase/showcase.css` with esbuild.
- The section's text and links are plain HTML in `index.html`. `js/showcase.js` waits until the page has loaded and the section has stayed on screen for a quarter of a second (on most screens that is right away, since it starts in the first screen), then adds the two files and calls `showcase.mount()`, which draws each component in its `data-demo` stage. If the files fail to load, the stages are hidden and the names, lines and links stay, as without JavaScript.
- The components keep their own look. Site-side adjustments live in `style.css`: the cards, the stage sizes (fixed, so nothing moves when the components arrive), and `touch-action: pan-y` on Shoji Bento's lines on touch screens, so a vertical swipe that starts on a line still scrolls the page.

**Update to a newer Experiments:** `cd tools/showcase`, `npm ci` once, then `node build.mjs latest` (or `node build.mjs <commit>`). To build from a commit that is not on GitHub yet, read it from a local clone: `node build.mjs --from ../../../experiments <commit>`, and push Experiments before publishing the site. Check the page, run `node tools/test-showcase.mjs`, and commit `tools/showcase/vendor/` and `showcase/` together. `node build.mjs` with no argument rebuilds from the commit already in `SOURCE.json`, and stops if a file in `vendor/` was edited by hand: changes to a component belong in Experiments.

**Tests and measures:** `node tools/test-showcase.mjs` (59 checks) and `node tools/measure-load.mjs`.

## How the theme dissolve works

Pressing the toggle starts a view transition: the browser keeps a picture of the page in the old theme, then shows the new theme on top through a mask cut from the same 8 × 8 Bayer grid, revealing a few more cells on every frame for 0.5 s. Browsers without view transitions get a plain colour fade. The theme is saved in `localStorage`, and a small script in `<head>` applies it before the page is drawn, so it never flashes.

## Changing things

- The logo, the icons, the profile pictures and the share image: the grid and the layout in `tools/make-logo.mjs`, then run it (see "The logo").
- Colours, fonts, sizes, timings: the variables at the top of `style.css`. The graph's four oranges are `--level-1` to `--level-4`.
- Text and links: `index.html`.
- The orange dots: their sizes in `ACCENT` at the top of `js/accent.js`; their shapes in `SHAPES`, the cadence in `FPS` and the three motions (speeds, durations) in `js/dots.js`; the card strip's height is `--fringe-h` in `style.css`. The board (`board.html`, "Living dots") shows the three motions in use and the six that were not chosen, with a button for a new seed and one for reduced motion.
- The graph: number of weeks, square sizes and Clawd's timing in `ACTIVITY` at the top of `js/activity.js`.
- The showcase: names and lines in `index.html`; what each component shows (the Shoji facts, the command Gem Clip copies, the Snooze labels) in `tools/showcase/entry.tsx`, then rebuild.
- The local time: the zone and the swap duration are in `CLOCK` at the top of `js/clock.js`; the wording is in `gapText()` and `showClock()`.

To try the site on your computer, serve the folder (for example `python3 -m http.server`) and open `http://localhost:8000`.

## Clawd

Clawd is the Claude Code mascot; this is fan art. He lives on the contribution graph only: the icons and the share image show the yannworks logo. His poses (the 18 the graph uses) come from the approved pixel grids of the clawd skill in the owner's AIOS workspace, never redrawn by hand. To regenerate them:

```
python3 tools/make-clawd.py /path/to/AIOS
```

## Credits

- Shoji Bento, Gem Clip and Snooze Button from Experiments (MIT, `tools/showcase/vendor/LICENSE`), bundled with React 19.3.1 (MIT).
- Geist and Geist Serif by Vercel, under the SIL Open Font License 1.1 (`fonts/OFL.txt`), from the `geist` npm package 1.9.2.
- Clawd, the Claude Code mascot, drawn as fan art. Not an official Anthropic page.
