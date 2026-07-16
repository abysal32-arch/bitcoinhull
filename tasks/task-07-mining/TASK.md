# Task 07 — Mining panel live

## Goal
Hashrate, difficulty, and the retarget — the security dial of the network.

## Spec
- `js/panels/07-mining.js`: subscribe to `hashrate`, `difficulty`.
- Hero ← `currentHashrate` via `HELM.fmt.ehs` ("912 EH/s").
- Rows: difficulty via `HELM.fmt.diffT` ("127.4 T"); **est. adjustment** ←
  `difficultyChange` signed % — tint text with delta colors (green when
  negative? NO: sign is neutral news; keep ink, show sign explicitly "+2.1%");
  **retarget** ← `remainingBlocks` + `dur(remainingTime)` ("1,263 blocks ·
  ≈ 8.8 d").
- Epoch progress bar ← `progressPercent` (thin bar, `--accent` fill on
  `--surface-2` track, % as text beside it — bar is decoration, text is
  the datum).
- Sanity cross-check in verification: hashrate ≈ difficulty × 2^32 / 600.
- Loading/stale per the panel contract.

## Files
`js/panels/07-mining.js`, `index.html` (script tag).

## DONE when
All values match mempool.space's mining page within a poll; cross-check
holds within a few %; bar width == printed %; stale test passes; console
clean; committed; ticked.
