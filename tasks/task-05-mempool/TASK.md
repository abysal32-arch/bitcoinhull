# Task 05 — Mempool panel live + projected-blocks mini-viz

## Goal
Mempool depth at a glance: how much is queued and how long to drain it.

## Spec
- `js/panels/05-mempool.js`: subscribe to `mempool`, `mempoolBlocks`.
- Hero ← vsize as vMB ("8.4 vMB"); rows ← pending tx count, **blocks to
  clear** = ceil(vsize / 1,000,000 vB) with "~N blocks (≈ X h)" using 10-min
  blocks, incoming rate if cheaply derivable from consecutive `mempool`
  snapshots (else drop the row — don't fake it).
- **Mini-viz**: a single thin horizontal segmented bar of the first ~8
  `mempoolBlocks` (segment width ∝ blockVSize, label = medianFee of first
  segments). This IS a chart: **load the dataviz skill first**, follow mark
  specs (2px surface gaps, thin marks, direct labels, no color-only
  meaning). One hue stepped by depth (sequential), NOT the status palette.
- Tooltip-on-hover per segment (median fee, nTx, vSize) if it stays simple;
  otherwise labels on the first two segments only.

## Files
`js/panels/05-mempool.js`, `css/style.css` (bar segments), `index.html`
(script tag).

## DONE when
Numbers match mempool.space; bar segments sum sanely and re-render on poll;
dataviz mark rules followed (gaps, labels, sequential hue validated against
`--surface`); stale test passes; console clean; committed; ticked.
