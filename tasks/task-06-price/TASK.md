# Task 06 — Price panel live

## Goal
Price without the casino: spot, sats-per-dollar, market cap. No candles, no
24h-change theater.

## Spec
- `js/panels/06-price.js`: subscribe to `prices`, `tipHeight`.
- Hero ← USD spot (`HULL.fmt.usd`, no decimals ≥ $1,000).
- Rows: **sats per dollar** = round(1e8 / USD) ("845 sats"); **market cap** =
  USD × circulating supply — supply from `HULL.supplyAt(height)` if task 08
  already landed, else inline the exact era-sum helper here and task 08
  adopts it (whichever task runs second refactors to the shared one —
  note it in `_SHARED.md`).
- Price flashes dim→normal on change (CSS class, subtle).
- Loading/stale per the panel contract.

## Files
`js/panels/06-price.js`, `index.html` (script tag).

## DONE when
USD matches mempool.space price within a poll; sats/$ math checks by hand;
market cap within 1% of a public figure; stale test passes; console clean;
committed; ticked.
