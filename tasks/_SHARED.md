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

## Data sources: mempool.space (primary)

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
| WS `wss://mempool.space/api/v1/ws` | send `{"action":"want","data":["blocks","stats","mempool-blocks"]}` → dump on connect (`blocks` ASCENDING, unlike REST), then ~1 s pushes: `fees`/`mempoolInfo`/`mempool-blocks`/`da`/`vBytesPerSecond` (+ `block` per new block, `conversions` occasionally). `mempoolInfo` is bitcoind shape: `size`→count, `bytes`→vsize, `total_fee` in BTC (REST quotes sats — never map it). `vBytesPerSecond` = live incoming flow → store key `vbps` (task 14, 10 s throttle): SOCKET-ONLY, so the mempool panel's Incoming row shows a value ONLY while conn is `live` (dash otherwise, no REST fallback ever faked) and the row is EXCLUDED from the panel's stale-tag FEEDS — a dead socket with healthy REST must not tag the panel. `fmt.vbps` switches units (vB/s → kvB/s). | push (task 09) |
| `/api/v1/lightning/statistics/latest` | `{latest:{added(ISO date!), channel_count, node_count, total_capacity(sats), tor_nodes, clearnet_nodes, unannounced_nodes,…}}` — a dated SNAPSHOT; mempool.space's own indexer is STALLED (since mid-June 2026, snapshot even regressed 06-18→06-16) so this key is the FALLBACK: task 28 polls the identical API on mempool.emzy.de as `lightningFresh` and the panel renders whichever alive feed has the newest `added` (see Sixth/seventh origins below). Panels must show `added` visibly. NO capacity-by-network split exists (Tor capacity % is a named gap — we show Tor nodes instead). | 6 h (task 15) |
| `/api/v1/mining/difficulty-adjustments` | full retarget history `[[ts, height, difficulty, changePct],…]` NEWEST-FIRST, ~28 KB — powers `HULL.hist` (chain work, implied hashrates, block-time windows, height↔time interpolation) | 6 h (task 15) |
| `/api/v1/mining/hashrate/3y` | `{hashrates:[{timestamp, avgHashrate}], currentHashrate, currentDifficulty}` daily, chronological — 90-day avg + Integrity's 3-year baseline | 6 h (task 15) |
| `/api/v1/difficulty-adjustment` extra fields (task 15) | `previousRetarget` (last change %), `timeAvg` (ms, realized epoch block time), `estimatedRetargetDate` (MILLISECONDS) — all in the payload task 07 already polls | — |

### Third origin (task 15): blockchain.info charts

- `https://api.blockchain.info/charts/<chart>?timespan=…&format=json&sampled=true&cors=true`
  — keyless, CORS VERIFIED (exactly one ACAO header with an Origin set,
  curl-checked 2026-07-17, re-verified in-browser 2026-07-18; `cors=true`
  is REQUIRED — without it there is NO ACAO header at all). Response
  `{values:[{x(unixSec), y}]}` oldest→newest. Charts in use: `utxo-count`
  (4y, Integrity + Blockchain panel), `blocks-size` (MB — excludes undo
  data/indexes, so reads ~100 GB under Clark's on-disk figure; 1-week
  window, we only show the latest point), `market-price` (3y, Integrity
  sats/$ baseline), `n-transactions` (3y sampled, Integrity tx/day
  baseline; PLUS a separate exact `timespan=30days` unsampled poll, store
  key `tx30d`, task 17), `n-transactions-total` (30d window, newest point
  = cumulative all-time tx count, store key `txTotal`, task 17 — the
  chart is DAY-BUCKETED, so it lags a live counter like Clark's by up to
  ~2 days; named gap, accepted). All registered aux with backoffCapMs 1 h.
  `miners-revenue` RETIRED in task 17 with the standalone security panel.
- Transactions panel derivations (task 17): 30-day count = sum of the
  exact daily series; rate = count / the series' own covered seconds;
  avg-per-block = count / (HULL.hist height at the series end-edge minus
  height at its start-edge) — all anchored on the series' own dates.
  `fmt.txs` formats the rate ("7.8 tx/s").

### Fifth origin (task 18): Blockchair live scalars — FRESH-PREFERRED ONLY

- `https://api.blockchair.com/bitcoin/stats` — keyless, single ACAO `*`
  (curl-counted twice 51 min apart + real-browser fetch from the
  bitcoinhull.com origin, 2026-07-18), server cache ~71 s. Parsed to
  `{tx: transactions (cumulative all-time, docs-confirmed), sizeBytes:
  blockchain_size (raw block files EXCL. indexes/undo — docs-confirmed
  same semantics as the blocks-size chart)}`, store key `chairStats`,
  poll 15 min aux. ⚠ FRAGILE BY DESIGN — their docs say web apps
  "shouldn't make direct API requests" client-side, the CORS policy "may
  be changed in the future without any warnings", an anti-bot heuristic
  can 430-blacklist an IP at very low volume (observed at ~5 rapid
  calls; one GitHub report at 1-2/day), quota 1,440/day + 30/min, and
  the v2 API carries maintenance-mode signals. CONTRACT: panels PREFER a
  fresh `chairStats` (age ≤ 2× its 15-min interval) and silently FALL
  BACK to the daily charts otherwise; `chairStats` never sits in any
  panel's stale-tag FEEDS (its death must not tag a healthy panel);
  never poll faster; NEVER read its `nodes` (broken non-metric, reads
  303) or `outputs` (cumulative incl. spent — NOT the UTXO set).
- `utxo-count?timespan=1weeks` (same blockchain.info charts origin) —
  SUB-HOURLY resolution (period=hour, newest point ~1.3 h old when
  verified), store key `utxoHourly`, poll 30 min aux; the Blockchain
  panel prefers it fresh and falls back to the 4y daily `utxoSeries`
  (which stays untouched — Integrity's baseline still reads ONLY the
  4y series).

### Live-source verdicts (task-28 hunt, 2026-07-20 — SUPERSEDES task 18's; don't re-derive)

Task 28 hunted both gaps to exhaustion (8 researchers, ~120 probes, all
finalists judged by a real in-browser fetch from the bitcoinhull.com
origin — full log + verdict tables in `tasks/task-28-live-nodes-ln-hunt/
WORKLOG.md`). BOTH stats are now live:

- **Node count: LIVE-DAILY via the bitcoin-data GitHub mirror** of Luke's
  history.txt (`raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/
  luke-jr/history.txt` — ACAO ×1, nightly 00:00Z Actions cron, commit
  ~02:30Z, row ≤ ~26.5 h old; same file → same parser). Runner-up PASS:
  willcl-ark.github.io/dnsseedrs data.json (GitHub Pages, ~6 h fresh) but a
  DIFFERENT metric (DNS-seed crawl). Best CORS-ask target found:
  **btcnodes.io** (real-time bitnodes successor, `ratelimit-remaining:
  unlimited`, zero ACAO — one header from best-in-class; draft in the
  task-28 folder). Still no CORS: hacknodes, KIT DSN, census.yonson.dev,
  IMDEA (15-min fresh academic crawl, Dash-app only). bitcoin-data/
  virtu-p2p-metrics has the PERFECT csv schema but froze 2025-11-04 —
  recheck monthly, instant top pick if its feeder restarts.
- **Lightning: FRESH via mempool.emzy.de** (`lightningFresh` poll,
  identical mempool API, daily indexer confirmed two ways, operator =
  Stephan Oeste/Emzy, ≥5 y of Bitcoin infra). mempool.space stays as the
  silent fallback and self-heals to newest-snapshot-wins if it ever
  recovers (its stall is instance-side: two independent public instances
  index fine). Backup fresh instance if emzy dies: mempool.guide (fresh,
  ACAO ×1, operator unidentified). Everything else failed: Bitfinex has
  NO LN-aggregate endpoint and NO CORS host-wide (the "api-pub is
  CORS-open" folklore is false); Amboss allowlists; Lightning Labs' live
  API has no CORS; LnRouter's CORS-open graph.json is a 29 MB dump
  (contingency only); bitcoinvisuals still zero ACAO (ask downgraded —
  emzy covers the freshness need).

### Fourth origin (task 17): CoinGecko treasuries — LIVE

- `https://api.coingecko.com/api/v3/companies/public_treasury/bitcoin` —
  keyless, CORS verified in-browser 2026-07-18 (single ACAO `*`), server
  refresh ~5 min, polled HOURLY (aux, backoffCapMs 1 h; their per-IP
  burst limit 429s after ~5-9 rapid calls — never poll fast). Parsed to
  `{btc: total_holdings, companies}` (store key `treasuries`). Research
  2026-07-18 (adversarially corroborated 4-way: CoinGecko 1.285M,
  bitcointreasuries.net itself 1.263M, bitbo.io 1.20M, press 1.26-1.31M,
  identical #1 holder): the retired task-13 bake (2.29M) matched NO
  current category — treat pre-task-17 treasuries history as suspect.

### Sixth + seventh origins (task 28): emzy Lightning + bitcoin-data nodes mirror

- `https://mempool.emzy.de/api/v1/lightning/statistics/latest` — poll
  `lightningFresh` (store key `lightningFresh`, 6 h, aux, backoffCapMs 1 h).
  Identical payload to the mempool.space endpoint above; Emzy's LN indexer
  is healthy (daily snapshots) while mempool.space's is stalled. CONTRACT:
  the lightning panel renders whichever ALIVE feed (fetch age ≤ 2× 21600 s)
  carries the newest `added`; with nothing alive it renders the newest
  stored snapshot under the stale tag. `lightningFresh` NEVER sits in any
  panel's stale-tag FEEDS (chairStats rule: its death falls back silently);
  the `lightning` key is SKIPPED in the FEEDS scan while the fresh feed
  covers (task-23 covered-fallback rule). The visible snapshot date + a
  dynamic `[data-lightning-src]` credit anchor (names the feed actually
  rendered) are the honesty surface. Drill via
  `HULL.api.setPath('lightningFresh', '<garbage>')`.
- `https://raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/luke-jr/history.txt`
  — poll `nodesMirror` (store key `nodes` — SAME key as Luke's poll, same
  `parseNodes`, 6 h, aux, backoffCapMs 1 h). A nightly GitHub-Actions
  mirror of Luke's exact file (00:00Z cron, commit ~02:30Z → newest row
  2.5–26.5 h old, comfortably inside the panel's 48 h stale bar); GitHub
  raw serves exactly ONE ACAO header, so this poll is what actually
  reaches browsers today. Both nodes polls carry `acceptNodes` (an older
  newest-row never regresses a newer one), so if Luke ever fixes his
  doubled header his ~2 h-fresher direct file wins automatically. The
  task-12 bake stays as the boot floor only — the monthly re-bake sitting
  is now belt-and-suspenders, not the data path. Drill via
  `HULL.api.setPath('nodesMirror', '<garbage>')`.
- jsDelivr mirrors the same branch but with a 12 h edge cache — use
  GitHub raw (cache 300 s), not jsDelivr.

### Second origin (task 12): Luke Dashjr node counts

⚠ UPDATE (task 28, 2026-07-20): the delivery path is now the bitcoin-data
GitHub mirror above — the panel is LIVE-DAILY, not baked-monthly. Everything
in this section (file format, parseNodes, col2+col3, 48 h stale rule, bake
seed) still applies verbatim; only "no browser can fetch it" is obsolete.

⚠ RESOLUTION 2026-07-17 (researched to exhaustion, 12 agents, adversarially
verified): Luke's server sends the ACAO header TWICE → every browser rejects
the CORS response even though curl "sees" the header. NO alternative source
has both current data and history (bitnodes.io DEAD since 2026-05-03;
Blockchair = its own ~300 crawler connections, wrong metric, no history;
KIT DSN no CORS; statoshi = one node's own peers; no maintained mirrors).
Shipped design: **baked fallback + live upgrade** — `js/data/nodes.js`
(re-bake: `scripts/bake-nodes.sh`, monthly sitting) seeds the store at boot
with `baked: '<asOf>'`; the live poll stays registered and OVERWRITES the
bake whenever his header gets fixed (panel + Integrity self-heal, zero code
changes). Baked mode shows `· baked <date>` and suppresses the 48 h stale
tag (task-13 rule: as-of IS the honesty for baked data).

- `https://luke.dashjr.org/programs/bitcoin/files/charts/data/history.txt` —
  CORS-open plain text, one row per day (~00:00 UTC), history to 2017-04.
  Poll 6 h → store key `nodes`. Columns: `ts listening est_nonlistening
  [knots core30 rdts]` — ⚠ col3 ALONE is the extrapolated non-listening
  estimate; Luke's own chart page sums col2+col3 for "Total node count"
  (his page's JS is ground truth; task-12's TASK.md example read col3 as
  the total — wrong). Parsed by `parseNodes` (main.js) to
  `{ts, listening, total, rows:[{ts,listening,total}]}` with
  total = col2+col3; the total is an ESTIMATE — panels must carry "est.".
  Trailing version-split columns stay unused (version stats are out of
  scope).
- `HULL.api.poll` extensions (task 12, +15): an absolute `http(s)://` path
  skips BASE; 6th arg opts = `{ parse: fn(text)->value }` (default stays
  JSON — a throwing parser counts as a failed attempt), `{ aux: true }` =
  the poll never gates the page-wide `conn` verdict (slow/third-party
  feeds must not flip the chip while the live pulse is healthy; their
  panels carry their own stale tags), and `{ backoffCapMs }` = failure-
  retry ceiling above the global 5-min cap (a daily-file host must not be
  hammered forever by every open tab). Drill an absolute-URL poll with
  `HULL.api.setPath('nodes', '<garbage-url>')` — the BASE drill can't
  reach it; setPath back to the real URL to recover.
- Staleness override (nodes panel — deviates from the 2×-interval
  convention below): the file updates daily, so the panel is stale when
  the newest ROW is >48 h old, judged on the row's own timestamp (a
  stalled file and an unreachable server trip the same tag); tag text
  `STALE n H` (hours, not minutes).

### Baked data (task 13 convention)

- Values with no browser-fetchable source live in `js/data/*.js` as
  `HULL.baked.<name> = { asOf: 'YYYY-MM-DD', … }`. A baked VALUE shows NO
  stale tag and never fetches — **the always-visible `as of <date>` line IS
  the honesty mechanism**; never dress baked data up as live. Derived rows
  (USD value, % of supply) compute from LIVE feeds so they track between
  re-bakes — and those rows DO carry the standard 2×-interval stale
  treatment on their live feeds (review catch 2026-07-17: the no-tag rule
  covers the bake only; a frozen live-derived dollar figure without a tag
  is the exact lie the contract forbids). Same rule inside Integrity: a
  baked feed value (`v.baked`) is exempt from the strip's fetch-age
  staleness — fetch age on a bake measures tab uptime, not data health.
- Currently baked: ONLY `nodes` (the task-12 Luke fallback — since task 28
  it is the BOOT FLOOR only; the bitcoin-data mirror poll overwrites it
  within seconds of load, so a visitor sees baked data only while offline
  or before the first mirror response). Task 17
  (Joe, 2026-07-18) retired the other two: `treasuries` went LIVE via
  CoinGecko (above), and `opreturn` was DROPPED from the page — Joe
  vetoed baked-as-of labels, and 2026-07-18 research re-confirmed no
  live source exists (opreturn.org, the one site that carried the
  metric, died ~May 2026; label-required + no-live-source = no stat).
  The monthly BigQuery OP_RETURN sitting continues for bitcoinburned
  only.

### One equal tier (task 19 — the minor tier is RETIRED)

- Joe, 2026-07-18 (task 19): ONE size for all 12 panels, and ALL TWELVE
  must fit on screen at once (verified: 12th panel bottom = 902 px at
  1280×940). `.panel-minor` and `.asof` classes are gone. Density
  tightened again (panel padding 7/12/8, rows 3px pad, grid gap 8).
- Grid order (3 per row): Chain security (the RENAMED mining panel —
  ids/hooks keep `mining`; the task-15 standalone security panel + its
  `minersRevenue` feed are GONE) | Price | Nodes; Blockchain (height
  hero, UTXO 2nd) | Mempool | Transactions; Supply | Fees | Difficulty
  retarget; Halving | Corporate treasuries | Lightning. Chain-tip strip
  below, footer last.
- ⚠ Nodes panel: the visible `· baked <date>` line was REMOVED per Joe
  (task 19). The baked stale-tag exemption REMAINS (an aging bake must
  not alarm); disclosure now rides only on "est." + the luke.dashjr.org
  "daily estimate" credit + the monthly re-bake sitting. This overrides
  the task-13 "as-of line IS the honesty" rule for THIS panel only —
  any future bake still shows its date unless Joe says otherwise.
- Task 21 (Joe, 2026-07-18): the FIT BAR is now the WHOLE page — 12
  panels + the chain-tip strip ≤ 940 px at 1280 wide (measured 938).
  Integrity dropdown shows per-metric "now · 3-yr avg" values and must
  NOT state the 20-pt weights (they stay under the hood). UTXO metric
  = trailing-2016-block growth vs 3-yr per-epoch average, LOWER is
  better (shrinking set = full marks) — composition details in
  11-integrity.js's header. Title confirmed "Bitcoin's Hull Integrity"
  (compound noun, correct grammar — don't add a second possessive).
- Task 22 curve v2: per-stat points are NOT a cliff — at the 3-yr
  average = 15/20, full 20 only at 1.5× the average, ≤ half = 0
  (reciprocal ratio for the two lower-is-better metrics). A 100
  headline requires every stat to beat its own history with room.

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
js/hist.js          HULL.hist   retarget-history derivations: chain work,
                    implied hashrate, block-time windows (task 15)
js/data/*.js        HULL.baked.* baked values + as-of (task 13 convention)
js/api.js           HULL.api    poll scheduler + backoff (task 02)
js/panels/NN-*.js   one file per panel, NN = the task that shipped it
                    (tasks 03–08, 11–13, 15 — task 15 shipped several)
js/live.js          WebSocket layer                      (task 09)
js/main.js          boot: start polls, init panels      (task 02+)
tasks/              this system
```

## The brand ship (task 20 — do not redraw casually)

Inline SVG in the header (`.brand-ship`, 58×31, right of the wordmark).
Iterated with Joe in-chat 2026-07-18; the load-bearing details are
DELIBERATE: ₿-21 hull number = the 21M cap; the armor-belt stencil is
the first 32 chars of the GENESIS BLOCK hash (SHA-256 easter egg); ₿ on
the pennant; the watertight hull is the only solid-orange element. The
favicon is the hull+₿ (data-URI in index.html). Change only on Joe's
word.

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
