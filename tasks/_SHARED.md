# _SHARED.md — conventions every task builds on

Read this + your one TASK.md. That's the whole boot.

## The bar

The Hull is a **command point**: one dark screen you can read from across the
room. Every number earns its place. If a stat needs a paragraph to matter, it
doesn't ship. Clark Moody's dashboard is the ancestor; the Hull is fewer
numbers, bigger type, honest states.

Clark Moody policy (Joe, 2026-07-16): his dashboard is the **metric reference
catalog** — panels cherry-pick the stats he's proven useful, skip the rest,
and add Hull originals (e.g. Integrity). It is NOT a data source (no public
API; never scrape his infra) — bytes come only from mempool.space, above.
The footer credit to Clark is **permanent**: task 10 polish must keep it as
the last line of the page.

## Hard stack rules

- Vanilla HTML/CSS/JS. **Zero build step, zero dependencies, zero frameworks.**
- Plain `<script>` files (NOT ES modules — they break over `file://`), all
  state under the single `window.HULL` namespace, load order set in
  `index.html`.
- Must work opened straight from disk (`file:///…/index.html`) AND on GitHub
  Pages. No API keys, no server of ours.
- Read-only instrument: no wallet, no keys, no transactions, ever.

## Data source (the only one): mempool.space

REST base `https://mempool.space` — CORS-open, no key. Endpoints:

| Endpoint | Returns | Poll |
|---|---|---|
| `/api/blocks/tip/height` | number | 60 s |
| `/api/v1/blocks` | last 15 blocks: `{id,height,timestamp,tx_count,size,weight,extras:{medianFee,totalFees,pool:{name}}}` | 60 s |
| `/api/v1/fees/recommended` | `{fastestFee,halfHourFee,hourFee,economyFee,minimumFee}` sat/vB | 30 s |
| `/api/mempool` | `{count,vsize,total_fee,fee_histogram}` | 30 s |
| `/api/v1/fees/mempool-blocks` | projected blocks `[{blockVSize,nTx,medianFee,feeRange}]` | 30 s |
| `/api/v1/prices` | `{time,USD,EUR,GBP,…}` spot | 60 s |
| `/api/v1/difficulty-adjustment` | `{progressPercent,difficultyChange,estimatedRetargetDate,remainingBlocks,remainingTime,nextRetargetHeight,timeAvg}` | 5 min |
| `/api/v1/mining/hashrate/3d` | `{currentHashrate,currentDifficulty}` (H/s, raw) | 5 min |
| WS `wss://mempool.space/api/v1/ws` | send `{"action":"want","data":["blocks","stats","mempool-blocks"]}` → dump on connect (`blocks` ASCENDING, unlike REST), then ~1 s pushes: `fees`/`mempoolInfo`/`mempool-blocks`/`da`/`vBytesPerSecond` (+ `block` per new block, `conversions` occasionally). `mempoolInfo` is bitcoind shape: `size`→count, `bytes`→vsize, `total_fee` in BTC (REST quotes sats — never map it). `vBytesPerSecond` = live incoming flow, unused (the honest source task 05 wanted — v1.1 candidate). | push (task 09) |

Supply/halving are NOT fetched — computed exactly from tip height
(sum of subsidy eras, halving every 210,000 blocks). The era-sum helper
shipped in task 06 as `HULL.supplyAt(height)` (`js/supply.js`, exact
integer-sat math, returns BTC, NaN-safe); task 08 reuses it — never
re-derive or hardcode supply.

## File map

```
index.html          the whole page; script load order at the bottom
css/style.css       all styling; design tokens at the top in :root
js/format.js        HULL.fmt.*  number/time formatters (task 02)
js/supply.js        HULL.supplyAt(height) exact issuance (task 06)
js/store.js         HULL.store  state + pub/sub          (task 02)
js/api.js           HULL.api    poll scheduler + backoff (task 02)
js/panels/NN-*.js   one file per panel, subscribes to store (tasks 03–08)
js/live.js          WebSocket layer                      (task 09)
js/main.js          boot: start polls, init panels      (task 02+)
tasks/              this system
```

## Design tokens (locked in task 01 — do not re-derive)

Dark-only. Defined in `:root` of `css/style.css`:
`--bg` page `#0b0e13` · `--surface` panel `#131822` · `--surface-2` tile
`#1a2130` · `--border` `rgba(255,255,255,.08)` · `--ink` `#f2f4f8` ·
`--ink-2` `#aab3c2` · `--ink-mut` `#6b7484` · `--accent` bitcoin orange
`#f7931a` · status (validated, never reuse as series colors): `--good`
`#0ca30c` `--warn` `#fab219` `--serious` `#ec835a` `--critical` `#d03b3b`.
System sans everywhere; `tabular-nums` on every live value (no width jitter);
labels 11px uppercase muted; hero values use `.metric-hero`.

Status colors NEVER carry meaning alone — always pair with a text label
(e.g. the ● dot + "LIVE"). Any task that draws an actual chart (bars,
histogram, sparkline) must load the **dataviz skill** first and run its
palette validator; stat tiles/text don't need it.

## Panel contract (every panel task follows this)

- Panel markup already exists in `index.html` (task 01) with `data-*` hooks —
  wiring a panel means filling values, not restructuring layout.
- A panel renders from `HULL.store` state only; it never fetches.
- Three honest states per value: **loading** `—` (dim), **live** (normal),
  **stale** (last value kept, panel gets `.stale` = dimmed + "STALE n min"
  tag). NEVER show a fabricated or frozen-looking number without the tag.
- No console errors/warnings in any state, including API-down.
- Formatters from `HULL.fmt` only — no ad-hoc `toFixed` in panels.
- Panel staleness (convention set in task 03): a panel is stale when ANY
  store key it renders has data older than 2× that key's poll interval
  (`store.age()`); a never-fetched key is the loading state, not stale.
  Tag text `STALE n MIN`, n = age of the stalest key. Values with `—` get
  the `.loading` class (task 03's `setVal` pattern); recheck staleness on a
  ~30 s tick so it appears without a store event.
- Wall-clock-derived values freeze while blind (task 11): a value computed
  from `Date.now()` against feed data (e.g. Integrity's cadence score) must
  freeze at its last fresh-feed result while that feed is stale — letting
  the clock keep scoring misattributes a measurement outage to the network.
  (Display clocks like panel 03's "since last block" keep ticking — they
  report elapsed time, not a judgment.) Integrity's bar fill may use status
  colors (`.bar-fill.fill-good/-warn/-serious/-critical`) because the
  verdict pill beside it always carries the text label.

## Data core (task 02) — facts panels rely on

- Store key `conn` ∈ `polling | live | degraded | down`; the header chip text
  is the uppercase state. Task-09 semantics: `live` = the WebSocket is
  healthy (push data flowing); `polling` = REST-only — endpoints fresh but
  no socket (boot before the socket connects looks like this too);
  `degraded`/`down` = stale endpoints as below, except all-stale with a
  healthy socket reads `degraded`, not `down`.
- An endpoint is **stale** when it has no data, has ≥2 consecutive failed
  fetches, or its data is older than 2× its EFFECTIVE poll interval —
  the table interval × any live-layer cadence stretch (task 09: ×5 on
  fees/mempool/mempoolBlocks/difficulty while the socket is healthy, so
  those are judged at 2×5× while stretched; socket pushes keep their
  store age near zero anyway). live = none stale · degraded = some ·
  down = all (or browser offline — unless the socket is still
  delivering, which outranks the browser's offline verdict). Failed polls
  retry on exponential backoff: 5 s doubling, capped at 5 min; a 15 s abort
  kills hung fetches.
- `HULL.api.BASE` is the single base URL, deliberately mutable at runtime;
  `HULL.api.refresh()` refires every poll now. Down/recover rehearsal from
  the console: set BASE to `'https://mempool.space/garbage'` (same-origin
  404s — a made-up HOST wedges the preview pane's origin permissions),
  refresh(), watch DOWN; restore BASE, refresh(), watch LIVE.
- `?debug=1` = one `[hull]` console line per poll attempt + conn
  transitions; silent by default.
- Every `HULL.fmt` formatter returns `—` for non-finite input, so panels
  pass missing values straight through to get the honest loading state.
  `fmt.ehs()` and `fmt.mb()` (bytes or vB → MB/MvB number, task 03) return
  the number only (unit lives in markup); `dur`/`diffT`/`mins` (seconds →
  one-decimal minutes, task 03) include their units. `fmt.pct` takes an
  optional 3rd arg `dp` (decimals, default 1) — task 08 uses 2 for issued-%
  and inflation. `fmt.monthYear(unixSeconds)` → `"May 2028"` (task 08,
  halving ETA — month precision). `fmt.usdK(n)` → compact USD for tight
  spots (`118420` → `"$118k"`, task 09, the live title).

## Live layer (task 09) — facts later tasks rely on

- `js/live.js` (`HULL.live`) maps WS pushes into the SAME store keys REST
  fills — panels never know the transport. `HULL.live.URL` is mutable and
  `HULL.live.stop()` / `.start()` are the WS-kill drill levers (the
  `HULL.api.BASE` garbage drill does NOT touch the socket).
- Socket health = data flowing (healthy on first message; silent 60 s =
  dead → reconnect on the same 5 s→5 min backoff ladder as REST). While
  healthy, REST cadence stretches ×5 via `HULL.api.setCadence` for
  `fees`/`mempool`/`mempoolBlocks`/`difficulty` ONLY — those are the keys
  the socket heartbeats ~every second. `tipHeight`/`blocks` REST polls
  stay at 60 s: they only move per block, and a stretched poll would trip
  the panels' hardcoded 2×-interval stale thresholds between blocks.
  `prices` stays at 60 s too (`conversions` pushes are occasional, not a
  heartbeat).
- Stats-family pushes apply at most once per 10 s per key (`store.set`
  fires subscribers even on unchanged values; panels were built for a
  30 s world). A message carrying a new `block` bypasses the throttle.
- `fee_histogram` exists only in REST — the `mempoolInfo` mapper carries
  the last one forward (clearing-rate line can lag ≤150 s while REST is
  healthy), but the carry EXPIRES after 5 min without a fresh REST
  delivery: the line dashes out rather than quote an aged histogram that
  rides the socket's freshness.
- New-block moment: `.flash-tile` accent wash on the strip's first tile
  (applied by live.js onto panel 03's static tile nodes) + panel 03's own
  header flash; all three flash classes die under
  `prefers-reduced-motion: reduce`. `document.title` =
  `"⎈ <height> · <usdK> · <fastest> sat/vB"`, rebuilt on
  `tipHeight`/`prices`/`fees` store events + a 30 s tick, written only on
  change; it is a display surface, so it leads with `STALE ·` (front,
  because narrow tabs truncate the tail) when any of its keys outlives
  every honest cadence (>180 s) — a frozen title is a lie like any other.
  Socket health is earned only by parsed messages carrying wanted keys —
  unparseable frames or unwanted-channel chatter never hold LIVE. REST tipHeight/blocks responses that would regress
  a newer pushed tip are rejected (`accept` filters in main.js).

## Every task, before its commit

Tooling quirks (learned task 03 — don't re-derive):
- The Claude browser pane DENIES `file://` — use the dev server:
  `preview_start` name `bitcoinhull` (swap-key sessions) or `hull` (sessions
  booted here); both serve http://localhost:8765 (`scripts/hull-server.js`,
  dev-only — the site itself needs no server).
- Pane `computer` screenshots can time out while every other pane tool works.
  Fallback: headless Edge —
  `& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
  --headless=new --screenshot="$env:TEMP\shot.png" --window-size=1280,1100
  --virtual-time-budget=8000 http://localhost:8765/index.html`
  (write to `$env:TEMP` — writing straight to the scratchpad gets
  Access-denied — then copy; the PNG lands a few seconds AFTER msedge
  returns, so `Start-Sleep -Seconds 5` before copying).

1. Open `index.html` in the browser preview, hard-reload.
2. Console clean; values render; kill-network case shows stale states (panel
   tasks: verify by temporarily pointing base URL at a garbage host).
3. Screenshot as proof to Joe.
4. Full-file review of everything you touched (Fable-rigor self-review).
5. One commit, message `task-NN: <what shipped>`; tick `tasks/README.md`.
6. Tell Joe it's safe to `/clear`.

If you add a genuinely new convention (store event name, formatter,
endpoint), append it to the right section of THIS file in the same commit.
