# Decisions

Date | decision | source or reason | scope | to check

- 2026-11-19 | Scene: the little theatre (idea 1 of 3) | Yann's choice | scene | done
- 2026-11-19 | Dark theme: swap the colours and dim the scene's house lights, so the spot still reads as light (a plain colour swap would turn it into a dark hole) | proposed, approved by Yann | scene | both themes looked at, frames in evidence
- 2026-11-19 | Intro approved as written; keywords: building apps, how things work, writing, music | Yann | content | done
- 2026-11-19 | Missing poses use documented moves: bow = front crouch + blink; peek = side crouch; wave back = front raised arm with the happy face | Yann's instruction | Clawd | no new pose was needed
- 2026-11-19 | Reduced motion: walks become 1.6 s cuts (spot dims, Clawd moved in the dark, spot back up); loop 35 s instead of 50 s | Yann's instruction | scene | verified on recorded frames
- 2026-11-19 | Plain classic scripts (not ES modules), so `index.html` also works when opened as a file | Yann wants to open and edit the files himself | code | -
- 2026-11-19 | Stage grid fixed at 212 × 118 cells, enlarged by a whole number of device pixels (k = floor(width × dpr / 212)); the frame is that exact width | crisp dots: a non-integer scale breaks dither patterns into stripes | scene | phone 390 px @3x gives 353 px, desktop 848 px
- 2026-11-19 | 8 × 8 Bayer thresholds (64 levels) for the scene, the dissolve and the keyword print, all on the same grid and dot size | smoother spot halo than 4 × 4; one pattern everywhere | scene, page | -
- 2026-11-19 | The spot adds less light where the house lights are high: `ambient + pool × (1.15 − 0.6 × ambient)` | in the light theme the pool washed the dark piano and the robot out to white | scene | checked at the three stations
- 2026-11-19 | Shadows: a short offset (3 cells up) instead of a large projected copy | the big shadow pushed the lit area away from Clawd and read as a misplaced pool | scene | -
- 2026-11-19 | Props drawn as text grids in `stage-art.js` with dark outlines and light fills; the paper of the typewriter has a dark edge | white paper vanished inside the white pool | scene | -
- 2026-11-19 | House lights: 0.9 (light theme), 0.13 (dark theme) | light theme close to "black dots on white", dark theme hints at the curtains | scene | -
- 2026-11-19 | Geist Serif with ELSH 25 (square dots) | optional idea from Yann; square dots match the pixels and stay legible | type | compared with round dots
- 2026-11-19 | Keywords print in dots during the intro fade (not after it) | printing after the fade left holes in a readable sentence for 300 ms, like a font failing | motion | screencast of the load
- 2026-11-19 | Links as a vertical list with a short note on Experiments ("my lab of UI components", Yann's own words) | a row wrapped unevenly | layout | -
- 2026-11-19 | `?at=SECONDS` shows a fixed moment, paused; `window.sceneDebug` exposes seek/step/capture | screenshots, recordings and Yann's own tests | code | -
- 2026-11-19 | Pause state is not remembered between visits | a frozen scene on a later visit could look broken; reduced-motion visitors already get the calmer show | scene | -
- 2026-11-19 | Fan-art note kept to the README and the canvas label; no logo | clawd skill rule | content | -
- 2026-11-19 | No independent reviewer: this session only spawns sub-agents when Yann asks | environment rule | review | self-review recorded instead
