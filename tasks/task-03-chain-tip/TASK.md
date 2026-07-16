# Task 03 — Chain-tip panel live

## Goal
The strip becomes real: live height, live time-since-block, last 6 real
blocks, honest NEXT tile.

## Spec
- `js/panels/03-chain.js`: subscribe to `tipHeight`, `blocks`,
  `mempoolBlocks`.
- Header big height ← `tipHeight` (also flashes on change — simple CSS class,
  full flash polish is task 09).
- Block tiles ← first 6 of `blocks`: height, `~N sat/vB` (extras.medianFee),
  tx count, size (MB from bytes), age (re-rendered every 30 s so ages tick).
- NEXT tile ← first of `mempoolBlocks`: `~medianFee sat/vB`, nTx, vSize.
- Strip header right: "last block N min ago" (ticks every 30 s; turns
  `--warn` + label "SLOW" past 20 min, `--serious` past 45 — with text, not
  color alone) · "24h avg X.X min" from `difficulty.timeAvg` (ms → min).
- Loading/stale states per the `_SHARED.md` panel contract.

## Files
`js/panels/03-chain.js`, `index.html` (script tag), `css/style.css` (only if
a state class is missing).

## DONE when
Real testnet-of-nothing — this is MAINNET data (read-only, fine): heights
match mempool.space in a second tab; ages tick without reload; kill-network
test shows stale tags; console clean; committed; ticked.
