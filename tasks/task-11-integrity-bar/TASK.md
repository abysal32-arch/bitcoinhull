# Task 11 — BitcoinHull Integrity: the 0–100 network-health score, live

## Goal
The Hull's signature stat. One honest 0–100 number for "is the network
running clean right now", derived client-side from data already in
`HULL.store` — no new endpoints. The strip markup + dropdown shipped as
placeholder on 2026-07-16 (Joe's spec: bar 0–100, breakdown posted in the
dropdown below the "BitcoinHull Integrity" words); this task makes it live.

## Existing markup hooks (index.html, `#panel-integrity`)
`data-integrity-score` (number) · `data-integrity-bar` (fill width %) ·
`data-integrity-verdict` (pill) · component rows `data-int-cadence`,
`data-int-mining`, `data-int-fees`, `data-int-mempool`, `data-int-fresh`.
The dropdown is a native `<details>` — no JS needed for the toggle.

## Scoring model — PROPOSAL, confirm the weights with Joe at task start
Weighted sum, each component scored against protocol norms:

- **Block cadence /25** — minutes since last block (`blocks[0].timestamp`)
  and the average of the last 15 intervals vs the 10 min target. Full marks
  ≤10 min since last block; linear decay to 0 at ≥60 min.
- **Mining muscle /25** — `currentHashrate` vs the difficulty-implied
  baseline (`currentDifficulty × 2^32 / 600` H/s). Ratio ≥1 full; scale
  down as hashrate lags difficulty (miner flight signal).
- **Fee pressure /20** — `fees.fastestFee` on a log band: ≤5 sat/vB full,
  0 at ≥300 sat/vB.
- **Mempool congestion /20** — blocks-to-clear (`mempool.vsize / 1e6`):
  ≤3 blocks full, 0 at ≥50.
- **Feed freshness /10** — this page's own pipeline: all endpoints fresh
  = 10, scaled by stale count; `conn = down` → 0 (an unmeasured network
  can't claim a score).

## Spec
- `js/panels/11-integrity.js`, subscribed to its input keys; recompute on
  any input event. Formatters from `HULL.fmt` only.
- Score integer 0–100; bar width = score %.
- Verdict pill + bar fill use status colors, ALWAYS with the text label
  (house rule): **SOLID ≥85** `--good` · **HOLDING 65–84** `--warn` ·
  **STRAINED 40–64** `--serious` · **BREACHED <40** `--critical`.
- Component rows show live `NN/NN`. Any missing input → that row `—` and
  the score renders `—` (no fabricated totals).
- Stale/API-down per the panel contract (`.stale` + tag, last values kept).
- Remove "integrity bar still placeholder" from the footer line.
- Update the blurb line in the dropdown to describe the live model (drop
  the "placeholder until task 11" sentence).

## Files
`js/panels/11-integrity.js`, `index.html` (script tag + blurb + footer).

## DONE when
Score visibly recomputes as polls land; dropdown rows live; kill-network
case honest (stale tag, no console errors); verdict/color/label mapping
verified at least by forcing scores in the console; committed; ticked.

## Depends on
02 (data core). Independent of panels 03–08 — any order. MUST land before
task 10 ships.
