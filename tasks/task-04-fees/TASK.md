# Task 04 — Fees panel live + fee verdict

## Goal
The fees panel answers "what do I pay, and is now a good time?" in one glance.

## Spec
- `js/panels/04-fees.js`: subscribe to `fees` (`/api/v1/fees/recommended`)
  and `mempool`.
- Hero ← `fastestFee` sat/vB; rows ← `halfHourFee`, `hourFee`, `economyFee`,
  `minimumFee` (label it "floor").
- **The verdict** (the Hull's own stat — plain English, icon + label + tint,
  never color alone):
  - `CALM` (good): fastestFee ≤ 5 sat/vB
  - `NORMAL` (ink, no tint): ≤ 20
  - `BUSY` (warn): ≤ 80
  - `SURGE` (serious): ≤ 200
  - `MAYHEM` (critical): > 200
  Plus a one-line subtext, e.g. "next block clears at ~3 sat/vB".
  Thresholds go in ONE const table at the top of the file with a comment
  that they're judgment values (Joe may retune).
- Loading/stale per the panel contract; verdict falls back to `—` when stale.

## Files
`js/panels/04-fees.js`, `index.html` (script tag).

## DONE when
Values match mempool.space live; verdict matches the threshold table (force
each band by temporarily hardcoding store values in console, then reload
clean); stale test passes; console clean; committed; ticked.
