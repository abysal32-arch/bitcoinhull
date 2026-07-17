# Task 08 notes — left by task 07 (2026-07-16)

Things learned in task 07 that save time here. Read after TASK.md.

## The bar pattern is solved — copy it from 07-mining.js

Both of your panels have a `row-bar` (Issued, Era N). Task 07 set the
convention: derive the width and the printed % from the SAME `fmt.pct`
string so they can never disagree — `fmt.pct` output (one decimal, e.g.
`"95.5%"`) is a valid CSS width as-is. Clamp the raw
value to [0,100] BEFORE formatting; on bad input set width `'0%'` and let
the pct text carry the dash via `setVal` (a dash has no width — the bar is
the one value setVal/.loading can't cover). See the epoch-bar block in
`js/panels/07-mining.js`.

## Your feeds are FAST — the stale drill is 2 min, not 07's 10

`tipHeight` and `blocks` poll at 60 s, so panel-stale = 2 min of garbage
BASE. No background-wait choreography needed.

## Small facts (verified live in 07, not guessed)

- `HULL.supplyAt(height)` (js/supply.js, task 06) is your issuance source —
  returns BTC from exact integer-sat era math, NaN-safe. Never re-derive.
  The 06-price panel already computes market cap = spot × `supplyAt(tip)`;
  your Issued hero is `supplyAt(tip)` through `fmt.btc`.
- Halving/era math needs only `tipHeight` (number payload, not an object —
  `store.get('tipHeight')` IS the height).
- `fmt.pct` strips trailing zeros: 95.45 prints "95.5%", 54.40 → "54.4%",
  0 → "0%". `fmt.btc` keeps up to 8 decimals ("3.125").
- Sibling shape to copy: 06-price.js / 07-mining.js are near-twins
  (FEEDS table + setVal + bad + staleSeconds + 30 s tick + boot render).
  07 added the h2 stale tag as `<span class="stale-tag" data-mining-stale
  hidden>STALE</span>` — yours are `data-supply-stale` / `data-halving-stale`,
  same shape (05/06/07 all identical).
- Footer status line in index.html is updated per task — 07 left it saying
  supply/halving + integrity are the remaining placeholders; 08 rewrites it
  again (tasks 11 + 09 remain after you).

## Verification quirks (unchanged from 05/06/07)

Pane `computer` screenshots time out; headless-Edge fallback per
`_SHARED.md`, PNG lands ~5 s AFTER msedge returns (write to `$env:TEMP`,
then copy). `javascript_tool` can't take top-level `await` — wrap in an
IIFE. Independent cross-checks that worked: hitting the same mempool.space
endpoints from PowerShell `Invoke-RestMethod`, and the mempool.space site
UI itself in a second pane tab.
