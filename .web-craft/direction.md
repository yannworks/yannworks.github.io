# Direction: contribution graph

## Intention

The graph is a second, quieter dot picture under the theatre. Same language (1-bit dots, ink on paper, only Clawd in colour), smaller dots, no lighting: dot density is data, not light.

- Placement: under the scene, in the scene's column (right column on wide screens, last on phones). Reasons: only that column is wide enough for 53 legible weeks at whole-pixel dots (848 px gives 3 px dots, a 798 px graph); the reading order stays "who I am, where to find me, the show, what I have been doing"; the graph sits next to the picture that shares its dots; and on a phone it scrolls into view, which is when the fill-in plays.
- Day square: 4 x 4 dots plus one dot of gap. Levels 0 to 4 show 1, 2, 4, 8, 16 dots in 4 x 4 Bayer order (the same recursive formula as the scene's 8 x 8 grid and the dissolve masks, one size down). An empty day keeps one dot, so the grid stays readable.
- Range: 53 weeks when a dot can be at least 2.4 CSS px (desktops and tablets), otherwise the last 26 weeks with that period's total ("in the last 6 months"). An iPhone gets 2.67 px dots and 10.7 px days.
- Size: the canvas is the graph in dots, enlarged by a whole number of device pixels (like the scene); one dot of margin keeps the frame around a selected day whole; a negative margin of one dot lines the squares up with the text.
- Summary line: links size (17 px), the number as a Geist Serif keyword (1.24 em, square dots). "updated <date>" appended in small text when the data is more than three days old.
- Clawd: the clawd library's grids at one cell per graph dot (23 x 16 dots walking, 22 x 16 facing front): 59 x 43 px on an iPhone, 66 x 48 px on a desktop. He stands one dot above the graph's top edge. Today is always the last column, so he is clamped to the right edge: his right legs stand on today's column.

## Motion

| What | How | Reduced motion |
| --- | --- | --- |
| Fill-in, first time 40% of the graph is on screen | Each dot appears at its Bayer rank, 0.8 s for 16 ranks, with a 0.2 s left-to-right sweep: about 1 s, busy days last | 0.4 s, no sweep |
| Clawd's walk | From off the left edge to today, the skill's 8-step walk cycle, 2 dots per 50 ms step (about 3.3 s on a phone, 6.6 s on a desktop) | No walk: Clawd is on today from the start |
| Arrival and idle | Turns front; a small bounce at +0.5 s and +4.2 s, blinks at +1.8 s and +6.4 s | Same, in place |
| Settle | Everything stops at max(10 s, arrival + 3 s); pausing the scene settles him too | Same |
| Tap or hover on Clawd | Happy "> <" face with two small bounces, 1 s | Same |
| Selection | One-dot frame around the day, line under the graph | Same |

The clock only runs while something moves, the graph is on screen and the tab is visible.

## Board

`board.html` shows the five levels and the live component (real file when present, otherwise generated sample data labelled "sample data, not real activity"), with a replay button.
