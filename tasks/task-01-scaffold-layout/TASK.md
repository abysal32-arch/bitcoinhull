# Task 01 — Scaffold + design system + full static layout

## Goal
The finished LOOK of the Helm, with placeholder data. Every later task is
pure wiring because this task fixes all markup and styling.

## Spec
- `index.html`: header (⎈ BITCOIN HELM wordmark · big block height · status
  chip "STATIC"), then the grid:
  - **CHAIN TIP** strip (full width): a dashed "NEXT" pending tile + last 6
    block tiles (height, ~median fee, tx count, size, age); strip header
    right side shows "last block N min ago · 24h avg X min".
  - Row of 3 panels: **FEES** (hero next-block sat/vB + verdict pill ● CALM;
    rows: 30 min / 1 hour / economy / floor), **MEMPOOL** (hero vMB; rows:
    pending txs, blocks to clear, incoming rate), **PRICE** (hero USD; rows:
    sats per dollar, market cap).
  - Row of 3: **MINING** (hero EH/s; rows: difficulty, est. adjustment %,
    retarget countdown + epoch progress bar), **SUPPLY** (hero BTC issued;
    rows: % of 21M + bar, block subsidy, annual inflation), **HALVING**
    (hero blocks remaining; rows: est. date, next subsidy, era progress bar).
  - Footer: static-preview notice ("live data arrives in task 02+"), data
    attribution, zero-build note.
- `css/style.css`: tokens from `_SHARED.md`, panel/tile/hero/row/bar/pill
  components, responsive grid (3-across → 2 → 1; strip scrolls on mobile).
- Placeholder values must be internally CONSISTENT (supply/halving/epoch all
  derived from the same placeholder height) and clearly marked in the footer.
- Every value element carries a `data-*` hook (e.g. `data-fee-fast`,
  `data-tip-height`) so panel tasks target values without touching layout.
- Favicon: inline SVG data-URI ⎈ on dark.

## Files
`index.html`, `css/style.css` (+ repo scaffold: CLAUDE.md, README, tasks/).

## DONE when
Page opens from `file://` looking finished (a stranger would think it's live
until reading the footer); no console errors; responsive at 1440/1000/375 px
widths; committed; ticked.
