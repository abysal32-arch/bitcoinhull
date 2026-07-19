# Task 26 — v1.2: branding +50% (verified math, fold preserved)

Joe, 2026-07-18: "i need the website name and logo bigger by at least
50%. do the math." (Same session: integrity math independently audited
— recompute matched the displayed 86 SOLID exactly; audit table in the
chat log and the numbers in task-22's row.)

## What shipped

- Wordmark 17 → 26 px (+53%); ship 88 → 132 px wide (+50%), box height
  kept to 63 px by cropping the SVG viewBox (0 4 280 134) to the
  artwork instead of scaling dead space.
- Fold reclaimed WITHOUT touching any font size: grid gap 6→5, header
  pad-bottom 6→3, integrity summary 6→5, panel bottom pad 6→5,
  chain-tile pad 4→3 + tile margins −1 → chain-tip bottom = 935 px at
  1280×940 (bar: ≤940).
- ≤720 px: brand scales to 20 px / 100 px so a 375 header line fits
  (no h-scroll, verified).

## DONE when
Fold measured ≤940 with the bigger brand, 375 clean, console clean,
committed, pushed, production-verified.
