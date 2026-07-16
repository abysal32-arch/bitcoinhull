# Task 07 notes — left by task 06 (2026-07-16)

Things learned in task 06 that save time here. Read after TASK.md.

## The stale drill takes 10+ minutes here — plan around it

Both of this panel's feeds (`difficulty`, `hashrate`) poll at 300 s, so the
panel-stale threshold (2× interval) is **10 minutes** of garbage BASE, not
task 06's 2. Start the drill FIRST (garbage BASE + `HULL.api.refresh()`),
do the full-file review during the wait, then check the tag. A background
`until`-loop wait works; foreground `Start-Sleep` gets blocked.

## Small facts (verified live in 06, not guessed)

- `/api/v1/difficulty-adjustment` payload shape — see the field list in
  `_SHARED.md`'s endpoint table; **check the units live before formatting**:
  verified live in the 06 session's store: `estimatedRetargetDate` is a
  millisecond epoch, and `remainingTime` + `timeAvg` are ms durations
  (fmt.dur/fmt.mins take SECONDS — divide by 1000). Sample payload:
  `{progressPercent: 36.4, difficultyChange: 0.05, remainingBlocks: 1282,
  remainingTime: 769861512, timeAvg: 600516, nextRetargetHeight: 959616}`.
- `/api/v1/mining/hashrate/3d` → `{currentHashrate, currentDifficulty}`,
  raw H/s and raw difficulty. `fmt.ehs` (number only, unit in markup) and
  `fmt.diffT` ("127.4 T", unit included) already match the placeholders;
  `fmt.pct(n, true)` gives the signed "+2.1%" for the adjustment estimate.
- The Mining panel-head `<h2>` has NO stale tag yet — add it exactly like
  05/06 did (`<span class="stale-tag" data-mining-stale hidden>STALE</span>`).
- Epoch bar row: set `data-mining-epochbar` `style.width` = progressPercent
  + `%` and `data-mining-epochpct` text via `fmt.pct` — the bar is the one
  value NOT covered by setVal/.loading (a dash has no width); on bad input
  set width `0%` and let the pct text carry the dash.

## Conventions 06 added (already in _SHARED.md)

- `HULL.supplyAt(height)` in `js/supply.js` — matters to task 08, not here.
- `.flash-dim` CSS class (dim→normal, the quiet change flash) exists if a
  value here ever wants one; the orange `.flash` stays for new blocks only.
- Hero-unit-in-markup pattern reconfirmed: hero number goes through
  `fmt.int`/`fmt.ehs`-style number-only formatters; the unit span ($, EH/s,
  vMB) lives in `index.html`.

## Verification quirks (unchanged from 05/06)

Pane `computer` screenshots time out; headless-Edge fallback per
`_SHARED.md`, PNG lands ~5 s AFTER msedge returns. `javascript_tool` can't
take top-level `await` — wrap in an IIFE returning a value. CoinGecko's
simple-price API worked keyless for the 06 cross-check if you need an
independent public figure.
