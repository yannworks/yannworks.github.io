# Brief: GitHub contribution graph

## Mandate and authorisation

- Source: Yann's request in the Claude Code session, 2026-11-20. Targeted mission on the published site (previous mission: `.web-craft-history/2026-11-19-site/`).
- Goal: add Yann's GitHub contribution graph to the page, in the same black-and-white dither style as the scene, with a tiny animated Clawd on today's column.
- Work on a new branch from the current `main`. Nothing goes live until Yann writes "publish". Local build, checks and a test run of the workflow on the branch (no commit) are within the mandate.

## Scope

- Data (R1): a GitHub Action in the site repo runs once a day and has a manual "Run workflow" button. It fetches the contribution calendar of the account `yannworks` through GitHub's GraphQL API (account renamed from `ultrararebinary` on 2026-11-19; history kept) and saves a small JSON file next to the page: each day's date, count and GitHub level, the total, and when it was fetched. It commits only when the data changed. The page reads that file.
- Token (R2): the workflow's built-in `GITHUB_TOKEN`. If it cannot read the calendar, stop and tell Yann; the fallback is a fine-grained token he stores as a repository secret, never in the code.
- Totals (R3): the profile includes private contributions (counts only); totals should roughly match the GitHub profile. If clearly lower, tell Yann.
- Sample data (R4): test the page with a sample file, never publish sample data as if it were real. Until the real file exists, the graph section stays hidden.
- After publishing (R5): run the workflow once (or tell Yann where to tap "Run workflow"), then check that the live graph shows real data.
- Repo settings (R6): if pushing the workflow file is refused, or the Action cannot commit because of a setting, tell Yann exactly what to change, or give him the file to add on the GitHub website.
- Look (R7): each day is a small square drawn with the scene's Bayer threshold grid; dot density shows activity. No contributions: one faint dot. GitHub levels 1 to 4: 2, 4, 8 and 16 dots out of 16. Ink on paper, following the theme. Squares a whole multiple of the dot size so dots stay crisp.
- Summary line (R8): above the graph, in the page's style, e.g. "312 contributions in the last year", the number in Geist Serif like the other keywords.
- Range (R9): desktop shows the full year (53 weeks); the phone shows the last 26 weeks, the line saying "in the last 6 months" with that period's own total.
- Placement (R10): where it fits best in the page's order, with the reason given to Yann.
- Fill-in (R11): the first time the graph scrolls into view, it fills in dot by dot, each square adding its dots in Bayer order up to its level (busy days take longest), about 1 s, once.
- Day details (R12): hovering or tapping a day shows one line under the graph, like "5 contributions · Nov 12". Keyboard: the graph takes focus as one element; arrow keys move between days. Screen readers get the summary line and the selected day.
- Clawd (R13): a tiny animated Clawd on top of today's column, in its orange (the only colour in the graph), built from the clawd library's approved grids and loops. As large as needed to read at phone width without hiding the graph; ideally its cells match the graph's dots.
- Clawd motion (R14): after the fill-in, Clawd walks along the top edge from the left to today's column, turns to face front and settles; then idles with a blink now and then and an occasional small bounce. Tap or hover: a bounce with the happy "> <" face.
- Stopping (R15): motion longer than 5 s needs a way to stop: Clawd settles after about 10 s and only moves again when tapped. Pauses off screen and when the tab is hidden.
- Reduced motion (R16): no walk; Clawd is already on today's column and still blinks and bounces in place; the graph appears with a shorter dissolve.
- Edge cases (R17): data file missing or broken: page still works, section hidden. Data more than three days old: shown with "updated <date>". Without JavaScript: a plain link "See my activity on GitHub" instead of the graph. No contributions today: Clawd still stands on today's column.
- Board, README, notes (R18): add the graph to `board.html`, explain in the README how the Action works and how to run it by hand, record decisions in `.web-craft/`.
- Regression (R19): the rest of the page keeps working: no console errors, no horizontal scroll, contrast still passing, scene, themes and dissolve unchanged.

## Observable success (done_when)

- Screenshots with the sample data at 390 and 1440 px, light and dark, normal and reduced motion. (R20)
- An MP4 of the graph filling in and Clawd walking to today. (R21)
- No console errors, no horizontal scroll, contrast still passing. (R19)
- Everything sent to Yann; wait for "publish". Final message explains simply how the Action, the JSON file and the page fit together.

## Additions

None yet.
