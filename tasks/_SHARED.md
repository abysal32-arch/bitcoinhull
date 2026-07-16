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
| WS `wss://mempool.space/api/v1/ws` | send `{"action":"want","data":["blocks","stats","mempool-blocks"]}` | task 09 |

Supply/halving are NOT fetched — computed exactly from tip height
(sum of subsidy eras, halving every 210,000 blocks). Task 08 owns that math.

## File map

```
index.html          the whole page; script load order at the bottom
css/style.css       all styling; design tokens at the top in :root
js/format.js        HULL.fmt.*  number/time formatters (task 02)
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

## Data core (task 02) — facts panels rely on

- Store key `conn` ∈ `polling | live | degraded | down`; the header chip text
  is the uppercase state. `polling` exists only between boot and the first
  resolved request.
- An endpoint is **stale** when it has no data, has ≥2 consecutive failed
  fetches, or its data is older than 2× its poll interval. live = none
  stale · degraded = some · down = all (or browser offline). Failed polls
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
  one-decimal minutes, task 03) include their units.

## Every task, before its commit

1. Open `index.html` in the browser preview (`file://` is fine), hard-reload.
2. Console clean; values render; kill-network case shows stale states (panel
   tasks: verify by temporarily pointing base URL at a garbage host).
3. Screenshot as proof to Joe.
4. Full-file review of everything you touched (Fable-rigor self-review).
5. One commit, message `task-NN: <what shipped>`; tick `tasks/README.md`.
6. Tell Joe it's safe to `/clear`.

If you add a genuinely new convention (store event name, formatter,
endpoint), append it to the right section of THIS file in the same commit.
