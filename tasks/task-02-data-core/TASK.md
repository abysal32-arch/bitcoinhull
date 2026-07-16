# Task 02 — Data core: poller, store, formatters, live status chip

## Goal
The single data spine every panel plugs into. After this task the page knows
whether it's live, but panels still show placeholders (tasks 03–08 wire them).

## Spec
- `js/format.js` → `HELM.fmt`: `int(n)` (thousands separators), `btc(n)`,
  `usd(n)` (compact ≥1T → "$2.37T"), `satvb(n)`, `pct(n, signed)`,
  `ago(ts)` ("4 min ago"), `dur(secs)` ("8.8 d"), `ehs(hashrateHs)`,
  `diffT(d)` ("127.4 T"). Unit-test by console table in a `scratch/` page if
  needed — no test framework.
- `js/store.js` → `HELM.store`: `get(key)`, `set(key, value)` (stamps
  `updatedAt`), `on(key, fn)` (pub/sub), `age(key)` seconds. Keys:
  `tipHeight, blocks, fees, mempool, mempoolBlocks, prices, difficulty,
  hashrate, conn`.
- `js/api.js` → `HELM.api`: `poll(name, url, storeKey, intervalMs)` —
  staggered start, per-endpoint exponential backoff (max 5 min) on failure,
  browser `online`/`offline` aware. Sets `conn` to `live` (all fresh) /
  `degraded` (some stale >2× interval) / `down` (all stale). Base URL in ONE
  constant.
- `js/main.js`: start all REST polls per the `_SHARED.md` table; drive the
  header status chip from `conn`: ● LIVE (good) / ● DEGRADED (warn) /
  ● DOWN (critical) — replacing "STATIC".
- Update `index.html` script tags: format → store → api → main.

## Files
`js/format.js`, `js/store.js`, `js/api.js`, `js/main.js`, `index.html`.

## DONE when
Console shows all endpoints polling green (log once per poll in a `?debug=1`
mode only — silent by default); chip goes LIVE with real data, DOWN when the
base URL is pointed at a garbage host (temporarily, then restore), and
recovers; no console errors either way; committed; ticked.
