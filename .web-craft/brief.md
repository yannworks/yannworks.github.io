# Brief: yannworks.github.io

## Mandate and authorisation

- Source: Yann's request in a Claude Code session, 2026-11-19 (step 1), then his answer the same day choosing the theatre scene (step 2).
- Goal: a personal website, the start of a portfolio. One minimal, carefully made page: a short intro, links, a special font for highlighted words, smooth text animation, light and dark themes, and an animated pixel-art scene of Clawd seen through a black-and-white dithering shader. It is a showcase: details matter.
- Audience: people who find yannworks on X or GitHub. Main action: read who Yann is, then follow a link.
- Yann is a beginner and wants to understand the main ideas and edit the code later.
- Mode: new site. Local build and checks are authorised. Publishing to `main` waits for Yann's word "publish".

## Scope

- Content (English, plain and friendly). Name: Yann. Public name: yannworks, always lowercase. Approved intro: "Hi, I'm Yann, a student living in France. Online I go by yannworks. I like building apps with AI and learning how things work. I also enjoy writing and music." Highlighted: building apps, how things work, writing, music. (R1)
- No other personal information anywhere in the public repo (site, README, commits, these notes): no age, school, class level, city, last name, email or photo. (R1)
- Links, in this order: X https://x.com/yannworks, GitHub https://github.com/yannworks, Experiments https://yannworks.github.io/experiments/ (a separate Pages site; this repo must never contain an /experiments path). (R2)
- Fonts: Geist Serif (variable, `GeistSerifVF.woff2`, npm geist 1.9.2) for highlighted keywords, upright, at a size that makes them stand out; Geist Sans for the rest. woff2 files hosted in the repo with the OFL licence next to them. (R3)
- Look: minimal and precise, generous space, one column on phones, few finished elements, the scene is the only big visual. Two theme colours (ink, paper) plus Clawd's orange. Avoid: cream or beige background, italic words in headings, numbered sections, monospace labels, pill buttons, gradient blobs, glassy cards. (R4)
- Text entrance: intro and links appear with a short staggered fade plus slight rise, done within about 1 s; keywords may get one extra subtle touch. (R5) Links and buttons react clearly on hover and press. (R6)
- Themes: light and dark, default from the device, a toggle that remembers the choice, no flash of the wrong theme. (R7) Theme switch plays a dither dissolve across the whole page in the scene's dot pattern, about 0.5 s; cross-fade where unsupported. (R8)
- Favicon: a small Clawd from the clawd skill's icon preset. (R9)
- Scene style: Clawd in his usual orange from the clawd skill's approved grids and motions, never redrawn from memory, never dithered. Everything else goes through a 1-bit ordered (Bayer) dither: ink and paper only. Light theme black dots on white; dark theme white dots on black. Not the warm brown night-desk palette; keep whole-number scaling, crisp pixels, no anti-aliasing. (R10)
- Scene content: a little theatre (idea 1). Clawd walks in, plays an upright piano, types at a typewriter, peeks into a little robot which wakes up and waves, bows, walks off. Scripted loop of about 30 to 60 s with no visible jump. Must not resemble the X banner (desk at night, laptop, notepad, gears, hanging lamp, string lights, city window, moon, mug, headphones, music notes, books, plants). (R11)
- Light: one follow-spot that glows and flickers through the dither; follows the mouse on a computer, drifts on its own on a phone. (R12)
- Battery and robustness: pause when off screen or tab hidden, keep it light on phones, still dithered frame without WebGL. (R13) A small pause/play button; canvas `aria-label` describing the scene. (R14)
- Reduced motion: keep Clawd blinking and small moves in place, the glow, a shorter dissolve, the text fade. Remove walking, mouse-following light and text rise. Replaces the clawd skill's freeze-on-first-frame default. (R15)
- Code: plain HTML, CSS, JS; no framework, no build step; small readable files; colours, fonts, timings as CSS variables at the top; short comments; text and links in plain HTML so the page works without JS. (R16)
- Web-craft board: a browser page built from the real tokens and components. (R21)

## Observable success (done_when)

- Screenshots at 390 px and 1440 px, light and dark, normal and reduced motion; no horizontal scroll, no console errors. (R17)
- A recording of the full scene loop and one of the theme switch, as MP4 or GIF for an iPhone. (R18)
- All links work, keyboard focus visible, text contrast WCAG AA in both themes, Clawd's orange reads well on both backgrounds. (R19, R2, R6)
- The scene pauses off screen and the pause button works. (R13, R14)
- Final message: what was built, main decisions and why, what was checked, what could not be checked (for example a real iPhone).
- Notes of the main decisions in this folder. (R20)
- After "publish": site on `main`, https://yannworks.github.io checked. (R22)

## Additions

- 2026-11-19, Yann's step-2 answer: poses the clawd library lacks (bow, peeking into the robot) use the closest documented move (one-cell crouch, raised arm) and keep Clawd's body shape; if a moment really needs a new pose, name it in the final message instead of drawing it from memory. (R23)
- 2026-11-19, same answer: with reduced motion Clawd does not walk between props; the spot dims, and when it comes back up Clawd is already at the next prop. (part of R15)
- 2026-11-19, same answer, optional: Geist Serif's square dots (ELSH axis) on the keywords, if they look good next to the scene. (R24)
- 2026-11-19, same answer: intro approved as written; dark-mode solution (dim the scene's own lights so the spot still reads as light) approved. (R1, R10)
