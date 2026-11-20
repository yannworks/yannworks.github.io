# Self-review, 2026-11-20 (contribution graph)

Reviewer: the building agent itself, not independent (sub-agents only on Yann's request).

## Covered

- The graph at 390 px (@3x, touch) and 1440 px (@2x), light and dark, normal and reduced motion, with a rich sample (941) and a sparse sample shaped like the real data (42 over 9 days).
- Fill-in and walk frame by frame (recordings), walk frames close up, Clawd cells against the clawd library.
- Hover, keyboard (Tab, arrows, Home, End), Clawd hover, scene pause, off screen, hidden tab, settle.
- Missing, broken, wrongly shaped, stale and sample-on-a-public-host data; no JavaScript; theme switch.
- The workflow: a test run on the branch with the built-in token; the fetch script against a fake GitHub (write only on change).
- The rest of the site: the full site suite rerun with the empty placeholder file.

## Found and fixed

- The frame around a selected day was cut at the graph's right and bottom edges: one dot of margin added, compensated so the squares line up with the text.
- A missing `contributions.json` makes the browser log a 404 on every visit: an empty placeholder ships until the first run.
- My first theme check sampled one of Clawd's colours instead of a graph dot: check rewritten, dots follow the ink colour.

## Known, minor

- On a desktop, Clawd's walk across 53 weeks takes about 6.7 s (3.3 s on a phone); he settles at 10.7 s.
- Clawd stands at the right edge, so only his right legs are on today's column (today is always the last column).
- The real calendar is sparse (9 active days in a year), so the live graph will mostly show the one-dot grid.

## Not checked

- The workflow on `main`: its schedule, its commit and whether that commit triggers a Pages build. Checked right after publishing.
- Safari, Firefox, a real iPhone, a screen reader.
