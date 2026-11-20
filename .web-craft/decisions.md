# Decisions

Date | decision | source or reason | scope | to check

- 2026-11-20 | New targeted mission; the finished site mission moved to `.web-craft-history/2026-11-19-site/` | web-craft continuity: never overwrite a mission folder | notes | -
- 2026-11-20 | Data by a daily GitHub Action (22:47 UTC, plus the Run workflow button) running `tools/fetch-contributions.mjs`, saving `contributions.json` at the site root, one day per line | Yann's design: a browser cannot hold a key; readable daily diffs | data | live run after publishing
- 2026-11-20 | Built-in `GITHUB_TOKEN`; a `CONTRIBUTIONS_TOKEN` secret, if Yann ever adds one, is used first without changing code | Yann: fallback is a fine-grained token stored as a secret | data | -
- 2026-11-20 | Tested the workflow on the branch before publishing with a temporary push trigger; the commit step is limited to `main`, so the branch run committed nothing; trigger removed afterwards | answer "can the token read it" and "do the totals match" before publishing | data | done: 42 = profile's 42
- 2026-11-20 | The JSON file is rewritten only when days or total change (the fetch time is kept otherwise), so the Action commits only on change | Yann: commit only when the data changed | data | -
- 2026-11-20 | An empty `contributions.json` (no days) ships until the first run | a missing file makes the browser log a 404 on every visit; with no days the section stays hidden | page | -
- 2026-11-20 | Sample files carry `"sample": true` and only show on localhost; tests serve sample data by intercepting the request, no sample file in the repo | Yann: never publish sample data as if it were real | page | tested on a public host name
- 2026-11-20 | Placement under the scene (see direction.md) | width for 53 weeks, reading order, shared dot language | layout | -
- 2026-11-20 | 4 x 4 Bayer order for the dots of a day | a day square is 4 x 4 dots; the scene's 8 x 8 grid is built from the same 2 x 2 rule | look | -
- 2026-11-20 | 53 or 26 weeks chosen by width (dot at least 2.4 CSS px for a full year), not by device type | a landscape phone or tablet gets the full year when it fits | layout | -
- 2026-11-20 | Clawd clamped to the right edge (right legs on today's column) instead of centred over it | today is always the last column; centring would push half of him outside the graph | Clawd | -
- 2026-11-20 | Walk speed 2 dots per 50 ms | 1 dot per step (as in the scene) would take 13 s on a desktop; at 2 the walk ends before the 10 s settle on every screen | motion | -
- 2026-11-20 | The scene's pause button also settles the graph's Clawd | one "stop the motion" control for the page | motion | tested
- 2026-11-20 | `role="application"` on the graph so screen readers in browse mode pass the arrow keys through; the summary is its description; the selected day is a polite live region | Yann: one focusable element, arrows, summary and selected day for screen readers | accessibility | DOM checked, no screen reader available
- 2026-11-20 | The `js` class is set by the head script; it hides the no-JavaScript link before the first paint | no flash of the fallback link | page | -
- 2026-11-20 | Published on Yann's word; first run by hand: the Action committed with the built-in token and its commit started a Pages build by itself (no extra build step needed) | observed on main (published.txt) | data | -
- 2026-11-20 | Proofs re-run after publishing into evidence/after-publish/, because contributions.json (part of the snapshot) changes with every Action commit; they will go stale daily by design | the mission checker hashes every file | notes | -
- 2026-11-20 | No independent reviewer (sub-agents only on Yann's request) | environment rule | review | self-review instead
