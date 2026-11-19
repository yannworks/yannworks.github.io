# Self-review, 2026-11-19

Reviewer: the building agent itself (no independent reviewer: this session only starts sub-agents when Yann asks). Not a substitute for an independent review or a real-device test.

## Covered

- Home page at 390 × 844 (@3x, touch) and 1440 × 900 (@2x), light and dark, normal and reduced motion (screens/).
- Scene: every moment of both timelines from recorded frames (normal 50.5 s, reduced 35.1 s); station close-ups at 4x; loop seam; spot position against Clawd over the whole loop (0 frames off); Clawd cells against the clawd library (clawd-fidelity.txt).
- Theme switch: screencast of the dissolve both ways; reload with a stored theme (no-flash.txt); no-WebGL and no-JavaScript versions.
- Keyboard: tab order and focus rings (screens/focus-*.png). Pause button, off-screen and hidden-tab pausing (verify.json).
- Board page in both themes.

## Found and fixed during the build

- Stage read as noise: fewer, flatter tones; shorter stage (118 rows) so the action is not lost under the curtain.
- Spot washed dark props to white in the light theme: spot strength now depends on the house lights.
- Shadow too large, displaced the pool: short offset instead.
- Typewriter unreadable and white paper invisible in the pool: redrawn with outlines.
- Spot drifted to the left wing during short "stops": every stop now aims the spot at its prop.
- Keywords left holes in the sentence for 300 ms: they now print during the fade.
- Links wrapped unevenly: vertical list. Focus ring touched the Experiments note: wider gap.
- A recorded loop jumped at its seam (curtain sway, spot drift and breathing ran on the absolute clock): they now repeat a whole number of times per loop; seam 22 cells against a median step of 20.

## Known, minor

- The light theme scene is busier than the dark one (house lights up, more dots). Intended, but a matter of taste.
- The robot is small (13 × 16 cells); it reads best inside the spot.
- The typewriter's paper shows its typed lines although it is seen from the side: a readability choice.
- Clawd's orange on white paper is 3.12:1, just above the 3:1 needed for graphics; inside the scene he mostly stands on dots or in the white pool.
- In headless Chromium the dissolve starts about 0.2 s after the click (screen capture of the page); on real devices it should start within a frame or two, not measured.

## Not checked

- A real iPhone (Safari), Safari and Firefox on a computer: only Chromium was available.
- Real GPU performance and battery use: the test browser renders WebGL in software.
- Screen readers: names and labels were read from the DOM, not with VoiceOver.
