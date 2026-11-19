# Direction

## Intention

A quiet page with one loud object. The first look goes to the intro (big, plain Geist, four serif keywords); the second to the theatre, the only image. Then the three links. Nothing else competes: no cards, no sections, no decoration.

- Composition: one column on phones and tablets (name bar, intro, links, scene, caption). From 1280 px wide, two columns: text left (27rem), scene right (up to 848 px), both centred vertically so the whole page fits one screen at 1440 × 900.
- Typography: Geist variable for everything; intro 21 px (phone) to 26 px (wide), line height 1.4, slight negative tracking. Keywords in Geist Serif at 1.24 em, upright, ELSH 25 (square dots that echo the pixels). The serif has one weight only (its only axis is ELSH), so the keywords stand out by size and contrast; `font-synthesis: none` stops fake bold.
- Colour: ink and paper only (light #111 on #fff, dark #ededed on #0d0d0d), plus Clawd's #d97757 inside the scene. Hover states invert ink and paper instead of adding a colour.
- Components: underlined text links with a 5 × 5 pixel arrow; square icon buttons with pixel icons (theme: half solid, half dithered disc; pause; play). No pills, no rounded cards, no gradients, no monospace labels.
- Asset that carries the identity: the dithered theatre, rendered live by a shader. Its still frames (`img/`) come from the same shader.

## Alternatives considered

- Scene first, text below: rejected; the page is about Yann, the intro should be read first.
- Links as a row: they wrapped unevenly at 1440 px; a vertical list reads cleaner and gives bigger tap targets.
- A variable-width stage (wider curtains on wide screens): rejected for a fixed 212 × 118 grid, so the still image and the canvas have the same shape and nothing shifts when WebGL takes over.
- 4 × 4 Bayer grid: looked almost the same at this dot size; 8 × 8 gives the spotlight halo 64 steps instead of 16. Switching is one line in `stage.js`.

## References

Ordered (Bayer) dithering as used in 1-bit games and early Macintosh art: the visual language comes from the technique itself; no specific work is reproduced. Clawd's grids come from the clawd skill (fan art of the Claude Code mascot).

## Motion

| What | Why | How | Reduced motion |
| --- | --- | --- | --- |
| Page entrance (name, intro, links, scene) | Rare, once per visit: a calm arrival | CSS keyframes, fade + 10 px rise, 640 ms, 65 ms stagger, ends before 1 s | Fade only |
| Keywords "printing" | The one extra touch: the keywords arrive through the scene's dot pattern while the sentence fades in | 65 Bayer masks stepped over 720 ms (JS, `mask-image`) | Kept (no movement) |
| Link hover | Clear feedback without a new colour | Inverted copy revealed with `clip-path`, 200 ms ease-out; arrow nudges 1 px | Kept |
| Press (links, buttons) | Confirms the tap | `scale(0.97)` / `scale(0.92)`, 140 ms | Kept |
| Theme dissolve | Ties the theme to the scene | View transition, new page revealed through the Bayer masks, 500 ms | 250 ms |
| Theme icon turn | Shows the state changed | 180° rotate, 360 ms | Instant |
| Scene: walks, moments, curtain sway, dust in the beam | The show | Pure function of time, 30 fps, pixel steps of 0.1 s | Cuts in the dark instead of walks; no sway, no dust |
| Spot follows the mouse | Lets visitors play | Critically damped spring (ω 6 for the mouse, 3.5 for the operator) | Off; the spot stays on Clawd |
| Spot hum and sputter | "Glows and flickers" | Small sine hum, a dip every few seconds | Gentler dip |

Rejected: smooth scroll, scroll-linked effects, a custom cursor (the spot lags behind on purpose; hiding the cursor would make it feel slow).

## Board

`board.html` (served with the site, `noindex`) uses the real `style.css` and scripts: colours with live contrast ratios for both themes, type, link and button states, the 65 dither masks, entrance and keyword replays, the live scene, the show's timeline (normal and reduced), all 42 Clawd poses, and the props before lighting.
