# Task 28 — deep source hunt: live node count + Lightning stats (2026-07-19)

Mission: find a SHIPPABLE live source for (1) node count (baked monthly from
Luke, ACAO ×2 = browser-dead) and (2) Lightning aggregates (mempool.space
pipeline frozen at 2026-06-18). Shippable = fetchable from every visitor's
browser on the static site: keyless (or public-by-design key), EXACTLY ONE
Access-Control-Allow-Origin header, datable payload, sane rate limits,
stable operator.

Empirical bar: every candidate probed with
`curl -s -D - -o /dev/null -H "Origin: https://bitcoinhull.com" <url>`
+ ACAO line-COUNT (GET, not HEAD) + a freshness read of the actual payload.
Finalists must also pass a real in-browser `fetch()` from the page served by
the `bitcoinhull` launch config. The browser is the judge, not curl.

Research fan-out: Sonnet at MAX effort, HARD 20-agent ceiling (house rule).

## Probe log

Every probe, negatives included. ACAO = count of
`access-control-allow-origin` lines in the response headers.

### Batch A — re-verify the ruled-out list (probe only, no re-research)

Probed 2026-07-20 ~00:30Z from the main session.

| URL | Status | ACAO | Freshness / note |
|---|---|---|---|
| `https://bitnodes.io/api/v1/snapshots/latest/` | curl exit 6 | — | NXDOMAIN — domain still dead |
| `https://pesquisa.hacknodes.xyz/api/v1/snapshots/latest/` | 200 | **0** | still CORS-closed — email ask stands |
| `https://www.dsn.kastel.kit.edu/bitcoin/` | 200 | **0** | KIT DSN still no CORS |
| `https://bitnod.es/` | 200 | **0** | site up, still no API |
| `https://api.blockchair.com/bitcoin/stats` | 200 | 1 (`*`) | healthy, but `nodes` = their crawler connections (wrong metric, unchanged) |
| `https://coin.dance/nodes` | 200 | **0** | page loads; frozen per task-18 (not re-researched) |
| `https://luke.dashjr.org/…/history.txt` | 200 | **2** | ⚠ STILL DOUBLED = browser-dead. Data itself is LIVE: last row ts 1784505603 = 2026-07-20 00:00:03Z (33 min old at probe) |
| `https://1ml.com/statistics?json=true` | 200 | **0** | still no CORS |
| `https://api.amboss.space/graphql` | 400 (GET) | **0** | allowlist unchanged |
| `https://bitcoinvisuals.com/static/data/data_daily.csv` | 200 | **0** | still CORS-closed — email ask stands |
| `https://mempool.space/api/v1/lightning/statistics/latest` | 200 | 1 (`*`) | ⚠ `added: 2026-06-16` id 107927 — went BACKWARD from the 07-19 sweep (06-18, id 106271). Still stalled AND churning oddly |

### Batch B — prime fresh candidates (main session)

| URL | Status | ACAO | Freshness / note |
|---|---|---|---|
| `https://mempool.emzy.de/api/v1/lightning/statistics/latest` | 200 | **1 (`*`)** | ⭐ `added: 2026-07-20T00:00Z` id 114681 — **33 MINUTES old at probe**, daily cadence (`previous` = 07-19 present). Keyless. THE candidate |
| `https://mempool.ninja/api/v1/lightning/statistics/latest` | 200 | 1 (`*`) | `added: 2026-06-18` id 106271 — stalled, mirrors mempool.space's OLD payload exactly |
| `https://mempool.bisq.services/api/v1/lightning/statistics/latest` | curl exit 6 | — | NXDOMAIN |
| `https://api-pub.bitfinex.com/v2/platform/status` | 200 | **0** | ⚠ contradicts the "api-pub is CORS-open" premise — deep-probe assigned to agent L2 |
| `https://raw.githubusercontent.com/bitcoin/bitcoin/master/README.md` | 200 | 1 (`*`) | control probe — GitHub raw IS CORS-open (validates the published-data angle + Plan B substrate) |

### In-browser judge (finalists)

- **mempool.emzy.de** `/api/v1/lightning/statistics/latest` — real `fetch()`
  from the page (dev server, 2026-07-20 ~00:50Z): **PASS** — status 200 in
  371 ms, JSON parsed, `added: 2026-07-20T00:00:00.000Z` id 114681,
  node_count 17371, channel_count 39107, total_capacity 441419450397 sats,
  `previous` day present. Identical payload shape to mempool.space —
  zero-parse-change compatible.

### Batch C — research-agent probes

8 researchers (Sonnet at MAX effort, fixed fan-out, hard-20 ceiling respected;
11 agents total this task incl. the 3-finder review below). Full per-probe log
in the appendix at the bottom of this file — every URL, ACAO count, freshness
and rate-limit note, negatives included. ~120 probes total.

### In-browser judge, round 2 — from the REAL production origin

Run 2026-07-20 ~01:20Z in a pane tab sitting on https://bitcoinhull.com
(stronger than the dev-server test: the exact production origin):

- **bitcoin-data mirror** `raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/luke-jr/history.txt`
  — **PASS**: 200 in 155 ms, 74,504 bytes, 3,131 lines; last row
  `1784419208 5152 97262 21586 28447 14968` = 2026-07-19T00:00:08Z (25.5 h at
  test); parse semantics verified in-page: listening 5,152, total est.
  102,414 (col2+col3 — identical to Luke's live file, same parser fits).
- **luke.dashjr.org direct** — still **BLOCKED** in-browser
  (`TypeError: Failed to fetch`; his data row is 33 min old but the doubled
  ACAO kills every browser) — the exact failure the mirror fixes.
- **mempool.emzy.de** LN statistics — **PASS** from the production origin
  too: 200 in 340 ms, `added: 2026-07-20T00:00Z`, node_count 17,384 (up from
  17,371 forty minutes earlier — the instance is actively re-indexing).

## Verdict table

Shippable bar: keyless · ACAO ×1 · datable payload · sane rate limits ·
stable operator · real in-browser fetch(). ✅ = wired this task.

### Node count

| Source | Metric | ACAO | Freshness | Rate limit | Verdict |
|---|---|---|---|---|---|
| **bitcoin-data/bitcoin-stats-archive `luke-jr` branch (raw.githubusercontent.com)** | Luke's daily listening + est. non-listening — SAME file, our parser fits verbatim | **1** (`*`) | row ≤ ~26.5 h (nightly 00:00Z cron, commit ~02:30Z; verified in the workflow YAML + commit log) | none observed; Fastly CDN, cache 300 s | ✅ **WINNER — wired.** Operator bitcoin-data org / 0xB10C, automated end-to-end via in-repo Actions |
| jsDelivr mirror of same branch | same | 1 | s-maxage 12 h — can lag raw by up to 12 h | CDN | PASS but strictly worse than raw — documented alternate only |
| willcl-ark.github.io/dnsseedrs `data.json` | DNS-seed crawl "good/known" counts (27,747) — different methodology | 1 | `generated_at` ~6 h | static, cache 600 s | PASS technically; NOT wired — non-comparable metric, solo-maintainer crawl. Documented alternate |
| api.bitbo.io/all-data (`publicNodes`) | reachable ~23,984 + Tor + user agents | 1 | live (s-maxage=3) but **NO date field in payload** | none observed | LEAD — fails datable-payload bar; undocumented internal frontend API, operator anonymous |
| btcnodes.io `/api/home` | real-time validated reachable (24,463), bitnodes-modeled | **0** (+ OPTIONS 501) | `generated_at` = live | `ratelimit-remaining: unlimited` | FAIL CORS only — **the new #1 ask target** (one header away from best-in-class) |
| census.yonson.dev `census.jsonl` | periodic reachable census (13,772) | **0** | last run 2 d old, ~12.5 h per run | static file | FAIL CORS + cadence |
| IMDEA p2pobservatory.networks.imdea.org | daily active nodes, 13 chains, academic | **0** (incl. preflight) | ~15 min (!) | — | FAIL — no CORS and data only via Dash POST callbacks; freshest+stablest operator found, no fetch path |
| KIT DSN mirror (bitcoin-data `dsn-bitcoin-monitoring` branch) | ~30 undocumented .gpd files; no clean total column found (btcpings magnitudes 45–260 = their connection metric) | 1 | ~24–48 h | CDN | LEAD — right infra, wrong/unidentifiable file. Not needed with the luke-jr win |
| bitcoin-data/virtu-p2p-metrics `p2p_reachable_node_count.csv` | perfect schema (`time,total,ipv4,ipv6,torv2,torv3,i2p,cjdns`) | 1 | **FROZEN 2025-11-04** (feeder decommissioned) | CDN | FAIL freshness — recheck monthly; instant top pick if it restarts |
| 0xB10C peer-observer / fork-observer | honeynodes' own connections — wrong metric | 0 | live | — | FAIL both grounds |
| statoshi.info | one node's own peers — wrong metric | 1 | live | — | FAIL metric |
| blockchain.info charts | **no node-count chart exists** (~40 slugs enumerated + 5 guesses 404) | 1 w/ `cors=true` | — | — | FAIL — metric absent from platform |
| Clark Moody dashboard | own proprietary WS backend, upstream unknown (off-limits infra anyway) | n/a | live | — | FAIL — no REST surface exists at all |
| timechainstats.com / 2140data | **broken in prod right now** (renders 303 nodes + NaN; Diamondback 404) | 1 on working siblings | — | — | FAIL — no working node route located |
| bitref.com /nodes/ | 79,817 total / 15,540 reachable, daily | **0** (page); 2nd key-gated endpoint unresolved | ~7 h | — | FAIL page CORS; LEAD unresolved on the `/node/map?key=` surface |
| newhedge.io, bitdis.org, 21.ninja | frozen (bitnodes-fed) / unmapped | 0 | — | — | FAIL (shallow probes only — browser tool refused two domains; named gap) |
| bitnodes relaunch / bitnodes.21.co / 319 forks | no successor exists; repo silent on the death | — | — | — | FAIL — confirmed no official successor anywhere |

### Lightning aggregates

| Source | Metric | ACAO | Freshness | Rate limit | Verdict |
|---|---|---|---|---|---|
| **mempool.emzy.de** `/api/v1/lightning/statistics/latest` | identical mempool LN API: nodes/channels/capacity/Tor + dated snapshot | **1** (`*`), also on `/1m` | `added` = TODAY; `/1m` = 30 daily rows ending today (double-confirmed unstalled) | none observed; cache 10 s; Tor mirror | ✅ **WINNER — wired fresh-preferred.** Operator CONFIRMED: Stephan Oeste ("Emzy") — Bitcoin Core support infra, Electrum servers, DNS seed, LN routing node; Wayback ≥2020 |
| mempool.guide | same API | 1 | fresh — same current snapshot (added 2026-07-20) | none observed | PASS technically; operator UNIDENTIFIABLE after multi-angle search — documented as fallback candidate, not wired |
| mempool.space (current source) | same API | 1 | **STALLED — `added` REGRESSED 06-18 → 06-16 between our sweeps** | — | kept as silent fallback; issue draft updated with the regression evidence |
| mempool.ninja | same API | 1 | stalled 06-18 (mirrors space's old payload) | — | FAIL freshness |
| mempool.bullbitcoin.com | — | unobservable | 502 ×3 | — | UNKNOWN — down at probe time |
| mempool.bitaroo.net / mempool.nixbitcoin.org / btcmempool.org | LN route 404 — module not enabled (needs operator-run LN node; most clones skip it) | 1 (even on 404) | — | — | FAIL — no LN data; healthy explorers otherwise |
| api-pub.bitfinex.com | **no LN-aggregate endpoint exists anywhere in the API** (2 independent enumerations agree; only LN call = authenticated own-deposit invoice) | **0** on 4 endpoints + preflight (host-wide) | — | — | FAIL on two independent grounds — the "CORS-open" premise is disproven |
| terminal.lightning.engineering `/_next/data/<buildId>/explore.json` | per-node rankings; only aggregate = 11,531 SCORED subset count | **0** | live | — | FAIL — CORS + not network totals + buildId churns every deploy |
| ln-scores.prod.lightningcluster.com (Lightning Labs legacy) | real aggregates | 1 | **DEAD — 2022-04-25** | — | FAIL freshness (orphaned infra) |
| LnRouter `graph.json` (GCS) | full graph — totals derivable (their own site computes 11,456 nodes / 39,157 channels from it) | 1 | ~3 h | GCS, cache 1 h | PASS technically but 2.2 MB br / 29 MB raw per fetch — unshippable weight for a stat tile. Contingency only |
| LnRouter GraphQL `api.lnrouter.app/graphql` | schema exists, introspection off, aggregate query unknown | 1 (uniquely open) | live | — | LEAD — the one unresolved promising item |
| Amboss (both hosts, real POST + preflight) | network stats exist for their own frontend | **0 for our Origin** (reflective allowlist, `vary: Origin` proves inspection) | live | — | FAIL — allowlist excludes third parties; no REST/RSS/CDN alternative exists |
| lightningnetwork.plus | total-nodes figure is CORS-less HTML; JSON API is per-node only (19 endpoints enumerated) | 0 aggregate / 1 per-node | ~11 min per-node | undocumented | FAIL for aggregates |
| Blink/Galoy GraphQL | full root-query introspection: 17 fields, all wallet/price-scoped | 1 | — | — | FAIL — metric absent |
| LN Markets / Voltage / Breez / Phoenix / WoS / Blockstream | trading data / per-node authed / wallets / esplora (0 of 455 API.md lines mention lightning) | 0 | — | — | FAIL — no network-stats product at any of them |
| GitHub daily-cron LN-stats repos (4 search variants) | none active (best: lnresearch/topology, >2 y stale, binary gossip format) | — | — | — | FAIL — no CDN-published LN aggregates exist |
| 1ml.com / bitcoinvisuals.com | (settled pre-task; re-probed Batch A) | 0 | 1–2 d (bitcoinvisuals) | — | FAIL CORS — bitcoinvisuals ask now DOWNGRADED (emzy daily beats needing their CSV) |

## Ask list — updated

1. **NEW #1: btcnodes.io (Rodrigo Martínez / @brunneis)** — ask for one
   `Access-Control-Allow-Origin: *` header. Real-time validated reachable
   count, bitnodes-modeled taxonomy, documented public API, response header
   literally says `ratelimit-remaining: unlimited`, OPTIONS currently 501.
   One header line = best-in-class live nodes source. Draft:
   `ASK-btcnodes-cors.md` (this folder).
2. **mempool.space LN-stall GitHub issue — STILL FILE IT, draft updated**:
   new evidence added — their `latest` snapshot REGRESSED (06-18 id 106271 →
   06-16 id 107927 between our 07-19 and 07-20 sweeps), and two independent
   public instances (emzy, guide) index fresh LN data on the same codebase,
   isolating the fault to their instance's LN backend, not the software.
   (`ISSUE-mempool-lightning-stall.md` in the task-18 folder.)
3. hacknodes email — DOWNGRADED to optional: the Luke mirror covers nodes;
   hacknodes would add a bitnodes-lineage *reachable* count (nice redundancy,
   no longer load-bearing). Draft stays in task-18 folder.
4. bitcoinvisuals email — DOWNGRADED to skip-unless-bored: their value was
   freshness; emzy's daily snapshot now covers it. Draft stays for the
   record.

## Plan B (not needed — recorded as contingency only)

Both metrics found passing sources, so the GitHub-Action same-origin design
was NOT built. Contingency worth knowing: the winning nodes source IS
someone else's Plan B — bitcoin-data's mirror workflow is a public 15-line
YAML (wget → commit → push, nightly). If that org ever stops, we stand up
the identical action in OUR repo publishing `js/data/nodes-auto.json`
same-origin and repoint one URL. Same shape works for any server-only LN
source. Zero runtime backend either way.

## Confirmed / inferred / unknown

**Confirmed (empirical, this task):**
- emzy LN stats fresh + ACAO ×1 + in-browser PASS from the production origin;
  operator identity + ≥5 y history (two primary sources + Wayback).
- bitcoin-data luke-jr mirror: ACAO ×1 (two agents independently + our
  in-browser run), nightly cron in the workflow YAML, row ≤ ~26.5 h, file
  byte-compatible with our parser (verified by running the parse semantics
  in-page from bitcoinhull.com).
- luke.dashjr.org STILL ACAO ×2 and still browser-dead (fetch throws), data
  itself 33 min fresh — mirror is the correct fix, self-heal poll stays.
- mempool.space LN stalled AND regressed; ninja stalled; bitfinex api-pub
  sends zero ACAO host-wide and has NO LN-aggregate endpoint (two
  independent enumerations); Amboss allowlist excludes us (real preflight +
  POST with our Origin); no bitnodes successor exists anywhere.
- Every FAIL row above carries its own empirical probe (appendix).

**Inferred (stated as such):**
- raw.githubusercontent.com rate limits are sane for per-visitor 6 h polls —
  from CDN role + absence of rate-limit headers; not load-tested.
- emzy serving the full REST namespace (whole-BASE fallback potential) —
  from mempool's single-backend architecture; NOT probed (only LN routes).
- mempool clones skipping LN = operator burden (needs own LN node) — from
  the 3×404 pattern.
- "may not self-heal" for mempool.space's stall — now reinforced by the
  regression, still inference.

**Unknown / gaps (named):**
- mempool.guide's operator (multi-angle search failed) — why it stays a
  fallback candidate, not a wired source.
- Whether bullbitcoin's 502 is transient; bitref's key-gated second
  endpoint; LnRouter's GraphQL aggregate query (introspection off);
  bitdis.org + newhedge.io deep surfaces (browser tool refused both
  domains); X/Twitter-only announcements (not indexable this pass);
  Retropex/tutwidi bitnodes forks not individually opened.
- No ToS review for any mempool clone — polling sanity is observed
  behavior, not published policy.
- Luke's current 6-column format has NO written legend anywhere; col2+col3
  = total rests on his own chart JS (settled task 12) — methodology itself
  remains undocumented upstream ("not publicly known" per the mirror's
  README).

## Wiring + verification (2026-07-20 ~01:40–02:40Z)

Wired in the main session:

- `js/main.js` — `nodesMirror` poll (bitcoin-data raw URL → store key
  `nodes`, same `parseNodes`, 6 h aux, backoffCapMs 1 h) + `acceptNodes`
  newest-row guard on BOTH nodes polls; `lightningFresh` poll (emzy, 6 h
  aux, backoffCapMs 1 h).
- `js/panels/15-lightning.js` — `pickLn()`: alive-feeds-first (fetch age ≤
  2× 21600 s), newest `added` wins, two-pass fallback to anything stored;
  `lightning` skipped in FEEDS while the fresh feed covers (task-23 rule);
  `lightningFresh` never in FEEDS (task-18 rule); dynamic
  `[data-lightning-src]` credit follows the rendered feed.
- `js/store.js` — `lightningFresh` registered in KEYS (caught live: the
  unregistered key warned on every set — console-clean contract).
- `index.html` — nodes credit + "bitcoin-data mirror"; lightning credit
  merged INTO the hero-sub (a separate `.panel-credit` line grew row 4 and
  broke the task-21 fold: 955 > 940 — caught by measurement, moved to the
  hero-sub on the price-panel precedent, fold back to 935); footer +4→+6.
- `css/style.css` — `.hero-sub a` muted-link rule (mirrors `.panel-credit a`).

Verification (dev serve, fresh tab):

- Boot: mirror overwrote the bake in seconds — store `baked:false`,
  ts 2026-07-19T00:00:08Z, panel 102,414 est / 5,152 listening / +13.7%
  30-day; lightning rendered emzy's snapshot 2026-07-20 (17,390 nodes,
  39,153 channels, 4,419.63 BTC, $286.5M) with credit "emzy.de"; conn LIVE.
- Drill 1 (fresh-feed data loss): panel fell back to mempool.space's dated
  snapshot (2026-06-16, 17,420 nodes, 4,798.00) with credit flipped to
  "mempool.space" and NO false stale tag; restore → emzy back. PASS
- Drill 2 (dead origins ×2 via setPath): silent failures, stores intact,
  values held, zero tags; recovery → both re-fetched in ~5 s (ages 6 s). PASS
- Console: CLEAN (zero messages, fresh tab, no ?debug).
- Fold: chain-tip bottom **935 ≤ 940** @1280×940. 375 px: no h-scroll,
  hero-sub + credit single-line, no panel overflow. PASS
- Screenshot: `proof-1280.png` (headless Edge — pane screenshots still time
  out, known quirk).
- Review fan-out: 3 finders over the diff (findings + outcomes below).

## Review findings → outcomes (3 finders: correctness / honesty-contracts / regressions)

38 clean checks across the three reports (pick logic state-table, acceptNodes
interleaves, aux/conn immunity, drills, KEYS, load order, fold at probed
widths, mobile order, tabular-nums, reduced-motion, file://, footer count).

| # | Severity | Finding | Verdict | Outcome |
|---|---|---|---|---|
| R1 | MED (all 3 finders converged; one reproduced it live) | Dead `lightningFresh` renders UNTAGGED forever when `lightning` holds nothing renderable (never-fetched = loading-not-stale, or junk-200 keeps its age fresh while unrenderable) — the rendered feed's fetch health was invisible to the FEEDS scan | CONFIRMED | **FIXED** — `staleSeconds(picked)`: whenever the fresh feed IS the rendered feed, its fetch age is judged like any rendered key (panel contract); while NOT rendered it stays silent (task-18 rule intact). Empirically re-drilled: patched `lightning`→unrenderable + `lightningFresh` age 50000 s → `STALE 833 MIN` + dim; healthy path untagged; restore clean. Bonus: also repairs the understated-minutes sub-facet whenever emzy is the rendered-and-older feed |
| R2 | MED | Nodes 48 h row-age bar vs mirror lag — finder argued worst healthy age ~54 h (mirror captures BEFORE Luke's 00:00 write) | REFUTED on the premise | **NO CHANGE** — commit evidence: the 07-19 02:34Z mirror commit CONTAINS the 07-19 00:00:08 row (capture runs ~2.5 h AFTER the write; Actions cron delay makes pre-write capture ~never). Worst healthy stored-row age ≈ 26.5 h + 6 h poll ≈ 32.5 h < 48 h — independently verified by the regressions finder. Named residual: ONE missed mirror night → row ~50-56 h → tag fires on genuinely 2-day-old data — honest by design (same as Luke's own file skipping a day) |
| R3 | LOW | accept-rejected mirror successes don't refresh `store.age('nodes')` → Integrity's fetch-age meter can sag ≤ ~14.5 h in the exotic Luke-heals-then-re-breaks window | CONFIRMED mechanism, exotic trigger | **DOCUMENTED, not changed** — requires Luke's header to heal AND re-break; self-resolves when the mirror catches up; the cure (api.js touching store age on rejected writes) is more invasive than the disease. The nodes PANEL is immune (judges row ts, not fetch age) |

## Appendix — full research-agent probe log (Batch C, verbatim)

#### Agent N1-github-node-data (16 probes)

- `https://raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/luke-jr/history.txt` — 200; ACAO=1 (access-control-allow-origin: *); content-type text/plain; last row timestamp 1784419208 = 2026-07-19 00:00:08 UTC (~24-25h old at mission time); 3131 lines total; served via GitHub's Varnish/Fastly CDN with cache-control max-age=300
- `https://cdn.jsdelivr.net/gh/bitcoin-data/bitcoin-stats-archive@luke-jr/history.txt` — 200; ACAO=1 (access-control-allow-origin: * — plus access-control-expose-headers:* and timing-allow-origin:*); content byte-identical last line to the raw.githubusercontent.com copy at check time; cache-control public, max-age=604800, s-maxage=43200 (12h edge cache) — possible staleness window not directly observed in this single check
- `https://raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/master/.github/workflows/luke-jr.yml` — 200; confirms cron '0 0 * * *' (nightly, 00:00 UTC), wget of Luke's files + git commit/push to the luke-jr branch via actions/checkout + ad-m/github-push-action
- `https://raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/master/.github/workflows/dsn-bitcoin-monitoring.yml` — 200; confirms identical nightly cron pattern ('0 0 * * *') feeding the dsn-bitcoin-monitoring branch
- `https://raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/dsn-bitcoin-monitoring/invstat.gpd` — 200; ACAO=1; data rows through 2026-07-17T23:03 / 2026-07-18T00:03 UTC (~24-48h old); but the metric is TX/block propagation-delay percentiles, not a node count
- `https://raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/dsn-bitcoin-monitoring/churn0.gpd (+ churn1.gpd)` — 200 (content fetched, ACAO not independently re-probed on this specific file — same host/repo/branch as the invstat.gpd check above); documented header format is per-monitor-node connection churn + unique-IP count, not a network-wide reachable-node total; earliest visible rows are from 2016 (head of a long append-only log, not a freshness signal by itself)
- `https://raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/dsn-bitcoin-monitoring/versionid_all.gp` — 200 (content fetched, ACAO not independently re-probed); this is a gnuplot SCRIPT with per-protocol-version data embedded as separate plot blocks (e.g. title '70016'), not a clean tabular total — deriving a total node count would require client-side parsing and summation across all version blocks per timestamp
- `https://raw.githubusercontent.com/bitcoin-data/virtu-p2p-metrics/master/p2p_reachable_node_count.csv` — 200; ACAO=1; header row 'time,total,ipv4,ipv6,torv2,torv3,i2p,cjdns' is exactly the right schema; BUT last data row is 2025-11-04 — STALE by ~8.5 months. Commit log confirms the external 'p2p-metrics-exporter' cron that fed this file stopped pushing after 2025-11-04T22:00:50Z; repo has zero GitHub Actions workflows and zero runs (feeder lived outside the repo); no open issues explain the stoppage
- `https://api.github.com/repos/ifuensan/alt-bitnodes (+ /branches, + /git/trees/main?recursive=true)` — 200; has_pages=false; single branch 'main'; pushed_at 2026-07-19T23:11:08Z (very active); full recursive tree (742 entries) contains zero .json/.csv/.parquet files and no data/ directory; README confirms this IS the codebase behind pesquisa.hacknodes.xyz (already known from prior probing: 200, no ACAO); snapshot JSON exports live only in data/export/ on the operator's own EC2 disk + Redis, never committed to git; deploy.yml pushes to a self-managed EC2 host via SSH, not GitHub Pages
- `https://api.github.com/repos/ifuensan/bitnodes (+ /branches, + /git/trees/master?recursive=true)` — 200; fork of ayeowch/bitnodes, pushed_at 2026-07-19T09:53:03Z; has_pages=false; branches = master, fix/empty-include-asns, feat/i2p-sam-crawl, 2 dependabot; tree contains data/.empty (placeholder proving crawl output is deliberately gitignored) and only one 2022-dated unit-test fixture JSON (tests/data/1663113591.json) — no live published data
- `https://api.github.com/repos/brunneis/btcnodes (+ /branches, + /git/trees/master?recursive=true)` — 200; fork of ayeowch/bitnodes, pushed_at 2026-05-10T02:18:05Z, homepage=https://btcnodes.io; has_pages=false; single 'master' branch; tree shows the same data/.empty gitignore pattern, no committed data files
- `https://btcnodes.io/ (bonus root probe, not GitHub-hosted)` — 200 via Cloudflare; ZERO access-control-allow-origin header lines — not CORS-open; also confirms it is a self-hosted service, not published to GitHub
- `https://api.github.com/repos/ayeowch/bitnodes/forks?sort=newest&per_page=100 (319 forks total)` — 200; the large majority of forks share pushed_at IDENTICAL to upstream's own tip-commit timestamp (2026-04-13T23:42:24Z), meaning they were forked and never independently touched — not evidence of 2026 crawler activity. Only ~5 forks (ifuensan, brunneis, Retropex, tutwidi, Manny27nyc) show genuinely independent/later commit timestamps; the two most active were opened individually (both FAIL, see candidates)
- `GitHub repo searches: q=bitnodes+snapshot, q=bitcoin+node+count+json, topic:bitnodes, topic:bitcoin-nodes, q=reachable+nodes+bitcoin (sort=updated)` — 200 each; no additional 2026-active, GH-Actions-cron-publishing node-count repo found beyond the bitcoin-data org; hits were old (2017-2024) student projects, wallet/hardware directories, nmap OS-fingerprinting tools, or monitoring scripts that don't publish data
- `https://www.dsn.kastel.kit.edu/bitcoin/ (WebFetch)` — 200; confirms operator = KIT's Decentralized Systems and Network Services (DSN) group; page references a 'Connection Count' chart but the fetched text excerpt exposed no file-format documentation or explicit reachable-node-total definition
- `https://luke.dashjr.org/programs/bitcoin/files/charts/historical.html (WebFetch)` — 200; page is chart/JS-rendered; fetched text excerpt contained no written column legend for history.txt's current field layout

#### Agent N2-monitoring-projects (39 probes)

- `https://api.github.com/repos/bitcoin-data/bitcoin-stats-archive/branches` — 200; discovery call (GitHub API, not a candidate itself) — found luke-jr, dsn-bitcoin-monitoring, master, 2025-10-txstats-data branches
- `https://api.github.com/repos/bitcoin-data/bitcoin-stats-archive/contents/?ref=dsn-bitcoin-monitoring` — 200; listed root files/dirs (I/, N/, btcpings.gpd, churn*.gpd, invstat.gpd, services_all.gp, versionid_all.gp, whois*.gp) — no ACAO relevant (metadata API, not the data host)
- `https://api.github.com/repos/bitcoin-data/bitcoin-stats-archive/contents/?ref=luke-jr` — 200; single file history.txt, 74504 bytes, download_url points to raw.githubusercontent.com
- `https://public.peer.observer/` — 200 text/html nginx, 0 ACAO lines, 22656 bytes; body = static info page listing honeynodes (alice, etc.), not a node-count API
- `https://statoshi.info/` — 200 text/html Apache, ACAO 1 line '*', Access-Control-Allow-Methods GET/OPTIONS also present
- `https://api.github.com/repos/0xB10C/fork-observer/contents/www` — 200; discovery call — found css/, fullscreen.html, img/, index.html, js/
- `https://public.peer.observer/forks/` — 200 text/html nginx, 0 ACAO lines, 5203 bytes; static fork-observer frontend shell
- `https://statoshi.info/api/health` — 200 application/json, ACAO 1 line '*', 101 bytes, cache-control no-store
- `https://statoshi.info/api/frontend/settings` — 200 application/json, ACAO 1 line '*'
- `https://api.blockchain.info/charts/transactions-per-second?format=json&timespan=1days` — 200 application/json (cloudflare), 0 ACAO lines (no cors param)
- `https://api.blockchain.info/charts/{n-nodes,nodes,reachable-nodes,node-count,network-nodes}?format=json` — all 5 guessed slugs → HTTP 404; no node-count chart exists under common naming
- `https://api.github.com/repos/bitcoin-data/bitcoin-stats-archive/contents/N?ref=dsn-bitcoin-monitoring` — 200; discovery — N/ subfolder file listing, btcpings.gpd = 419253 bytes
- `https://raw.githubusercontent.com/0xB10C/fork-observer/main/www/js/main.js` — 200 text/javascript; revealed real API paths: api/networks.json, api/{id}/data.json, api/changes (SSE)
- `https://api.blockchain.info/charts/transactions-per-second?format=json&timespan=1days&cors=true` — 200, ACAO 1 line '*' — confirmed CORS requires the cors=true param on this platform
- `https://raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/master/README.md` — 200 text/plain, ACAO not checked (doc-only fetch); confirmed luke-jr branch = Luke's node counts, dsn-bitcoin-monitoring = KIT raw data, methodology 'not publicly known' per Luke's data
- `https://raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/dsn-bitcoin-monitoring/N/btcpings.gpd` — 200/206, ACAO 1 line '*'; 2-col (timestamp, count) time series, values 174-264, latest row ~46.5h old at probe time
- `https://raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/dsn-bitcoin-monitoring/btcpings.gpd (root, not N/)` — 206 partial (Range), values ~45-52 recent / ~68-78 in 2015 head — different magnitude than N/ variant, neither matches network-scale node counts
- `https://raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/luke-jr/history.txt (tail via Range)` — 206, ACAO 1 line '*', source-age 4s (CDN-fresh); latest row timestamp ~24.7h old, 5-column values e.g. '5152 97262 21586 28447 14968'
- `https://raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/luke-jr/history.txt (head via Range)` — 200/206; earliest rows (2017) only 2 columns (e.g. 7449 37358) — no header row anywhere, column count grew over the years
- `https://public.peer.observer/api/networks.json` — 404 — wrong path (app is served under /forks/ subpath, not root)
- `https://public.peer.observer/forks/api/networks.json` — 200 application/json, 0 ACAO lines, 121 bytes; content shows only 1 network configured ('mainnet ... attached to peer-observer nodes')
- `https://public.peer.observer/forks/api/1/data.json` — 200 application/json, 0 ACAO lines, 78455 bytes; payload = block header/chain-tip data, not a node/peer count
- `https://demo.peer.observer/` — 200 text/html nginx, 0 ACAO lines, 6232 bytes; nav reveals /monitoring/ (Grafana), /debug-logs/, /addrman-snapshots/, /websocket/
- `https://mainnet.observer/` — 200 text/html nginx, 0 ACAO lines; not pursued further — metric type (block/fee stats) is off-topic for node counts
- `https://demo.peer.observer/monitoring/api/health` — 200 application/json (Grafana 13.0.2), 0 ACAO lines, cache-control no-store
- `https://demo.peer.observer/monitoring/api/search?query=%25` — 200 application/json, 0 ACAO lines; dashboard list incl. '[connections] total peers by network type (IPv4, IPv6, Onion, I2P, CJDNS)' — honeynodes' own aggregate, not network census
- `https://luke.dashjr.org/programs/bitcoin/files/charts/historical.html` — WebFetch only (doc lookup, not a live-fetch candidate); JS-chart page, only page title extractable as text — could not recover column legend
- `https://api.github.com/orgs/bitcoin-data/repos?per_page=100` — 200; discovery call — surfaced virtu-p2p-metrics ('Health metrics for Bitcoin's P2P network') among ~15 repos
- `https://api.github.com/repos/bitcoin-data/virtu-p2p-metrics/contents/` — 200; discovery — found p2p_reachable_node_count.csv, p2p_unique_reachable_node_count.csv, p2p_long_term_reachable_node_count.csv, dns_seed_*.csv
- `https://raw.githubusercontent.com/bitcoin-data/virtu-p2p-metrics/main/README.md` — 404 — wrong branch name (guessed 'main' before checking)
- `https://api.github.com/repos/bitcoin-data/virtu-p2p-metrics` — 200; default_branch=master, pushed_at=2025-11-04T22:00:52Z — repo metadata confirms staleness
- `https://raw.githubusercontent.com/bitcoin-data/virtu-p2p-metrics/master/p2p_reachable_node_count.csv` — 206 (Range), ACAO 1 line '*'; header row 'time,total,ipv4,ipv6,torv2,torv3,i2p,cjdns'; LAST ROW DATED 2025-11-04 (~259 days / 8.5mo stale at probe time)
- `https://raw.githubusercontent.com/bitcoin-data/virtu-p2p-metrics/master/README.md` — 200; full methodology docs confirming exact semantics of every CSV column — best-documented candidate found, undermined only by staleness
- `https://api.github.com/repos/virtu/p2p-crawler` — 200; pushed_at=2024-12-17T09:35:31Z, archived=false — origin crawler repo itself inactive well before the mirror went stale
- `https://www.dsn.kastel.kit.edu/bitcoin/` — WebFetch (doc lookup); chart categories listed incl. 'Nodes' and separately 'Connection Count' (has an explicit raw-data-file link) — supports the inference that btcpings.gpd = connections, not total nodes
- `https://arxiv.org/html/2511.15388v1` — WebFetch (doc lookup); revealed live dashboard URL p2pobservatory.networks.imdea.org, 9-month Dec2024-Jul2025 study period, notes data 'available by request for academic use' (no public API stated)
- `https://p2pobservatory.networks.imdea.org/` — 200 text/html nginx, 0 ACAO lines; JS SPA — rendered live in browser: 'Updated: 2026-07-20 00:30 (UTC)', 13 networks incl. Bitcoin, 'Daily Active Nodes' chart
- `https://p2pobservatory.networks.imdea.org/_dash-layout` — 200 application/json, 0 ACAO lines, 5529 bytes; UI-structure only, 0 occurrences of 'bitcoin' — actual data not embedded here
- `https://p2pobservatory.networks.imdea.org/_dash-update-component (OPTIONS preflight)` — 200, Allow: OPTIONS/POST/GET/HEAD, but 0 ACAO lines — a real browser CORS preflight for the actual data-serving POST endpoint would fail

#### Agent N3-clark-and-dashboards (18 probes)

- `https://bitcoin.clarkmoody.com` — 200 OK; marketing shell only, zero node-count text in DOM (only 'parentNode' false-positive); links out to dashboard.clarkmoody.com as 'Dashboard'
- `https://bitcoin.clarkmoody.com/js/app.js?18` — 200 OK; last-modified 2020-08-25 (stale legacy bundle); contains wss://bitcoin.clarkmoody.com/dashboard/ws and wss://bitcoin.clarkmoody.com/tickers/ws — Clark's own infra, not probed further per house rule
- `https://dashboard.clarkmoody.com` — 200 OK; SPA shell, div id="bitnodes" module renders 'Reachable Bitcoin Nodes 24,463 / Tor 11,427 / 46.7%' after JS runs; no embedded SSR JSON, no timestamp field in markup
- `https://dashboard.clarkmoody.com/dashboard.js?v=d5fddf1a0e57...` — 200 OK; WS endpoint built as `${protocol}//${location.host}/ws` = wss://dashboard.clarkmoody.com/ws; zero fetch()/XHR/'/api' literal strings in 58KB bundle; zero literal string 'bitnodes'
- `(live browser) https://dashboard.clarkmoody.com` — network log = same-origin JS+font assets only, 0 third-party/XHR calls, 0 console errors; rendered value 24,463 nodes confirmed live at 2026-07-20 ~00:50 UTC
- `https://bitbo.io` — 200 OK; Nuxt SSR — inline JSON has publicNodes:{total:23984,torNodes:15505,userAgents:[...]}; rendered 'Reachable Bitcoin Nodes 23,984 / Tor 15,505 / 64.65%'
- `https://bitbo.io/_nuxt/{2ee7f67,5760ae6,5cb8c93,5ee0252,6d3fa09,76ca7bc,c879dea,e4c4503,e653055}.js` — all 200 OK; located base https://api.bitbo.io with endpoints /all-data, /price-history, /exchange-rate called via axios in asyncData
- `https://api.bitbo.io/all-data (headers, Origin: bitcoinhull.com)` — 200 OK; ACAO = 1 line (wildcard *); cache-control public max-age=0 s-maxage=3 stale-while-revalidate=10; no rate-limit headers present
- `https://api.bitbo.io/all-data (body)` — 200 OK; publicNodes.total=23984, torNodes=15505, userAgents[] with %; NO per-field timestamp on node data (sibling sections commodities/etp DO carry 'updated' epoch fields, publicNodes does not)
- `(live browser) https://bitbo.io` — network log = same-origin JS/CSS/img only (tool doesn't capture fetch/XHR — known limitation); console clean, 0 errors; rendered 23,984/15,505 matches direct API probe, live at 2026-07-20 ~00:51 UTC
- `https://timechainstats.com` — 200 OK; page itself sends ACAO:* (1 line) but irrelevant — 6.7KB React SPA shell, zero embedded data
- `https://timechainstats.com/static/js/main.87483996.js` — 200 OK, 2.28MB; located https://2140data.com/api, https://2140data.net/api, wss://2140data.io, wss://2140data.org, credited 'Built by @2140data'; found consumption path ec.s03.bitcoin_stats.bitcoin_data.nodes feeding the 'Reachable Nodes' label
- `https://2140data.com/api/v1/stats/network?period=144 (exact literal string from bundle)` — HTTP 404; ACAO = 1 line (wildcard, present even on error page); body 'Cannot GET /api/v1/v1/stats/network' (server-side path-duplication bug) — independently reproduced live via browser console (see below)
- `https://2140data.net/api/stats/network?period=144 (route-map reconstruction, .net host)` — HTTP 404; ACAO = 0 lines (absent); body 'Cannot GET /api/stats/network'
- `https://2140data.com/api/stats/network?period=144 (route-map reconstruction, .com host)` — HTTP 200; ACAO = 1 line (wildcard); payload has timestamp=1784508891157 (ms-epoch, fresh) but fields are mining/fee stats only — no 'nodes' field
- `https://2140data.com/api/blockchain/stats` — HTTP 200; ACAO = 1 line (wildcard); payload source:'diamondback', timestamp=1784508869322 (ms-epoch, fresh), cached:true — still no 'nodes' field
- `(live browser) https://timechainstats.com` — rendered 'Reachable Nodes: 303 Nodes' (vs bitbo 23,984 / Clark 24,463) plus literal 'NaN' on neighboring Active/New Addresses(24h); console: '[BlockchainStatsFallback] Diamondback fetch failed: Diamondback error: 404' — confirms production breakage live at 2026-07-20 ~00:56-00:58 UTC, matching the manual curl 404 above
- `https://statoshi.info` — 200 OK; ACAO = 1 line (wildcard) on base HTML; confirmed self-hosted Grafana (grafana.app/*.css, grafana_mask_icon assets) instrumenting one operator's own bitcoind — wrong metric (single-node peer count, not network-wide census), not pursued further

#### Agent N4-post-bitnodes-newcomers (22 probes)

- `https://census.yonson.dev/` — 200 OK, HTML shell; no ACAO on this page (not the data source — census.js/census.jsonl load same-origin)
- `https://census.yonson.dev/census.jsonl` — 200, ACAO=0 (confirmed via exact mission grep -ci command), content-type application/x-ndjson, last-modified 2026-07-17T22:58:49Z (~2d2h stale at probe), no rate-limit headers, 114 historical crawl entries, ~12.5h duration per crawl run
- `https://census.labs.yonson.dev/` — DNS resolution failed — 'Could not resolve host' (dead secondary domain)
- `https://btcnodes.io/` — 200 OK, HTML shell, ACAO=0
- `https://btcnodes.io/api/home` — 200, ACAO=0 tested 3 ways (Origin: bitcoinhull.com / Origin: example.com / no Origin header — byte-identical response headers each time, rules out an allowlist); OPTIONS preflight -> HTTP 501 Not Implemented; header 'ratelimit-remaining: unlimited'; payload generated_at unix 1784508895 = 2026-07-20T00:54:55Z, essentially real-time
- `https://btcnodes.io/api/live/current?limit=5&offset=0` — 200, ACAO=0, ratelimit-remaining: 59, cache-control: no-store, per-node live JSON listing (lat/lon/ASN/user_agent/etc.)
- `https://willcl-ark.github.io/dnsseedrs/` — 200, ACAO=1 (*) on the HTML shell (GitHub Pages default)
- `https://willcl-ark.github.io/dnsseedrs/data.json` — 200, ACAO=1 (*) confirmed via the exact mission grep -ci command (result: '1'); content-type application/json; generated_at 2026-07-19T19:03:39.797539+00:00 (~5h53m stale at probe); cache-control max-age=600; no rate-limit headers (static Fastly-cached file)
- `https://bitdis.org/` — 200, ACAO=0; Claude Browser tool refused to open this domain under its own content policy, so only a shallow curl probe of the homepage was possible — no JS/network-call inspection done
- `https://21.ninja/` — 200, ACAO=0; homepage HTML references many /nodes/* chart-path strings (node-age-histogram.svg, node-version-count/, nodes-by-net-type/, etc.)
- `https://21.ninja/nodes/` — 404 — guessed path was wrong; true URL structure not mapped
- `https://21.ninja/nodes/methodology/` — Fetched, no useful content surfaced via static grep — page structure not resolved
- `https://bitref.com/nodes/` — 200, ACAO=0 on this page (the one showing '79,817 Total Public Nodes / 15,540 Reachable Nodes / Last Updated 7 hours ago', JS-populated); underlying theme/js/scripts.js contains fetch(server+'/node/map?key='+e,...) referencing a second, unresolved host + required key
- `https://newhedge.io/bitcoin/node-map` — 200, ACAO=0, 5.4KB SPA shell with no server-rendered data and no JS bundle src found via static grep; Claude Browser tool refused to open this domain under its own content policy, so the JS-rendered page could not be loaded to directly confirm freshness
- `https://bitnodes.21.co/` — DNS resolution failed — 'Could not resolve host' (historical 21 Inc-era domain is dead, no 2026 lineage)
- `https://p2pobservatory.networks.imdea.org/` — 200, ACAO=0; footer text reads 'Updated: 2026-07-20 00:30 (UTC)' (~10min old when first loaded)
- `https://p2pobservatory.networks.imdea.org/_dash-layout` — 200, content-type application/json, ACAO=0
- `https://p2pobservatory.networks.imdea.org/_dash-dependencies` — 200, content-type application/json, ACAO=0
- `https://github.com/ayeowch/bitnodes` — README fetched via WebFetch: still describes bitnodes.io as live, links to the (dead) site/API, zero mention of the May 2026 expiry or any successor
- `https://github.com/ayeowch/bitnodes/issues?q=is%3Aissue+domain` — No open or recent issues discussing the domain expiry, relaunch, or a successor were found
- `https://github.com/bitnet-io/bitnodes-bitnet` — Fork of ayeowch/bitnodes confirmed via WebFetch; its own README still points to https://bitnodes.io/ and https://bitnodes.io/api/ as 'the' live instance — no independent deployment evidence
- `https://x.com/bitnodesnet` — Blocked by Claude Browser tool's own content policy — could not inspect; account existence surfaced only via WebSearch indexing, content unconfirmed

#### Agent L2-bitfinex (6 probes)

- `https://api-pub.bitfinex.com/v2/tickers?symbols=tBTCUSD` — GET w/ Origin header -> HTTP 200, ACAO line count = 0, content-length 109 (live ticker payload), last-modified = request timestamp (fresh/real-time), cf-cache-status HIT, no rate-limit headers present, x-permitted-cross-domain-policies: none
- `https://api-pub.bitfinex.com/v2/stats1/pos.size:1m:tBTCUSD:long/last` — GET w/ Origin header -> HTTP 200, ACAO line count = 0, content-length 30, last-modified = request timestamp, cf-cache-status MISS, x-permitted-cross-domain-policies: none
- `https://api-pub.bitfinex.com/v2/conf/pub:list:pair:exchange` — GET w/ Origin header -> HTTP 200, ACAO line count = 0, cf-cache-status MISS, x-permitted-cross-domain-policies: none
- `https://api-pub.bitfinex.com/v2/platform/status` — GET w/ Origin header -> HTTP 200, ACAO line count = 0 (re-confirms the premise's own prior probe; not a fluke)
- `OPTIONS https://api-pub.bitfinex.com/v2/tickers?symbols=tBTCUSD (Origin + Access-Control-Request-Method: GET)` — HTTP 200, Allow: GET, HEAD -- but ZERO Access-Control-* headers of any kind in the preflight response, confirming the server never emits CORS headers on this endpoint family, preflight or actual
- `https://status.bitfinex.com/api/v2/summary.json` — curl exit 6, DNS resolution failure -- host does not resolve at all. Side-check only (not an api-pub/Lightning candidate); left unresolved, not pursued further

#### Agent L1-mempool-instances (14 probes)

- `https://mempool.bitaroo.net/api/v1/lightning/statistics/latest (header probe)` — HTTP 404; ACAO=1 (single, clean) even on the error page; full mempool-standard CORS headers present; no rate-limit headers
- `https://mempool.bitaroo.net/api/v1/lightning/statistics/latest (payload fetch)` — HTTP 404; body='Cannot GET /api/v1/lightning/statistics/latest' — confirms route unimplemented, not a transient error; no freshness field available
- `https://mempool.bullbitcoin.com/api/v1/lightning/statistics/latest (header probe)` — HTTP 502 Bad Gateway; ACAO=0 (bare nginx error page, no app headers); no payload
- `https://mempool.bullbitcoin.com/api/v1/lightning/statistics/latest (payload fetch)` — HTTP 502; generic nginx 502 HTML body; no JSON/freshness obtainable
- `https://mempool.nixbitcoin.org/api/v1/lightning/statistics/latest (header probe)` — HTTP 404; ACAO=1 clean; full standard mempool CORS set (methods/headers/expose-headers) present; no rate-limit headers
- `https://mempool.nixbitcoin.org/api/v1/lightning/statistics/latest (payload fetch)` — HTTP 404; body='Cannot GET ...' — Lightning module not enabled, base API otherwise healthy
- `https://mempool.guide/api/v1/lightning/statistics/latest (header probe)` — HTTP 200; ACAO=1 clean; content-type application/json; cache-control: public, no-transform; no rate-limit headers
- `https://mempool.guide/api/v1/lightning/statistics/latest (payload fetch)` — HTTP 200; added=2026-07-20T00:00:00.000Z (id 77657), previous=2026-07-13T00:00:00.000Z (id 76671) — fresh, exactly matches emzy's current-week snapshot cadence; ~66min old at fetch (01:06 UTC)
- `https://mempool.bullbitcoin.com/api/v1/lightning/statistics/latest (retry, ~90s later)` — Still HTTP 502; ACAO=0 — confirms an ongoing outage, not a single-moment blip
- `https://btcmempool.org/api/v1/lightning/statistics/latest (header probe)` — HTTP 404 (Cloudflare-fronted); ACAO=1 clean; full standard mempool CORS set present, confirming a genuine mempool/mempool clone not previously catalogued; Lightning module not enabled; only generic Cloudflare NEL/report-to headers, no app rate-limit headers
- `https://mempool.emzy.de/api/v1/lightning/statistics/1m (header probe)` — HTTP 200; ACAO=1 clean; cache-control max-age=10; onion-location Tor-mirror header present; X-Total-Count:806 header present but does not match actual row count (likely a generic/reused header, not literal); no X-RateLimit-* headers
- `https://mempool.emzy.de/api/v1/lightning/statistics/1m (full body fetch — final permitted emzy request)` — HTTP 200; 30 daily rows (verified by count), newest added=1784505600 = 2026-07-20T00:00:00Z (today, ~67min old), oldest=1782000000 = 2026-06-21T00:00:00Z — daily history series independently confirmed current, not stalled
- `http://web.archive.org/cdx/search/cdx?url=mempool.emzy.de (Wayback CDX — operator/longevity check, not a shippability probe)` — Earliest 200 snapshot 2020-11-01; continuous yearly snapshots through 2021/2022/2023/2024 — confirms >=5 years continuous operation
- `http://web.archive.org/cdx/search/cdx?url=mempool.guide (Wayback CDX — longevity check, not a shippability probe)` — Earliest 200 snapshot 2024-10-22; further snapshots 2025-01-04 and 2026-01-07 — confirms >=20 months continuous operation; operator identity still unresolved

#### Agent L3-ln-ecosystem-a (26 probes)

- `https://ln-scores.prod.lightningcluster.com/availability/v1/btc_summary.json` — 200; ACAO=1 (*); payload last_updated 2022-04-25 (4+yr stale); 9.7MB; has num_scored/num_stable/num_unstable/num_non_connectable aggregates + full per-node scores; Access-Control-Max-Age 3600
- `https://nodes.lightning.computer/availability/v1/btc.json` — 200; ACAO=1 (*); GCS-hosted (x-guploader headers); last_updated 2022-01-20 (4+yr stale); flat per-node array only, no aggregate object
- `https://bos.lightning.jorijn.com/data/export.json` — DNS resolution failure ('Could not resolve host'), confirmed on 2 separate attempts incl. curl -v; root domain jorijn.com itself resolves fine (301)
- `https://terminal.lightning.engineering/explore (raw HTML)` — 200; ACAO=0 (grep for access-control|HTTP/ matched only the status line); Cloudflare-fronted, cf-cache-status DYNAMIC
- `https://terminal.lightning.engineering/_next/data/d0c843ce/explore.json` — 200; ACAO=0 (full header dump inspected, no such line); content live (totalCapacity/totalPeers for rank #1 node changed between two fetches 90s apart); totalCount=11531 SCORED nodes/231 pages(50 ea); cache-control no-store, x-nextjs-cache HIT upstream; buildId in path changes per deploy
- `https://terminal.lightning.engineering/dashboard` — 200; page text shows 'This page contains sample data on a mock node' — requires login+own node for real data, not a public network-data source
- `https://storage.googleapis.com/lnrouter-public/lnrouter.app/graph.json` — 200; ACAO=1 (*) via grep -ci; Last-Modified ~3h before probe, Age 1547s (26min) CDN copy, cache-control public max-age=3600; 2,242,290 bytes content-encoding:br / 29,001,214 bytes decompressed; per-node id/label/channelCount/capacitySat/x/y — matches the 11,456 nodes/39,157 channels shown live on lnrouter.app/graph
- `https://storage.googleapis.com/lnrouter-public/lnrouter.app/{stats,summary,graph-stats,network-stats,meta}.json` — all 5 guesses → 404; no lighter aggregate-only file exists alongside the full graph dump
- `https://storage.googleapis.com/lnrouter-public/?prefix=lnrouter.app/ (bucket listing)` — 200 XML listing; oldest entries dated 2021-06-24 (betweenness-centrality files) still present alongside current graph.json — long-lived, accreting bucket
- `https://api.lnrouter.app/graphql (OPTIONS preflight, Origin: bitcoinhull.com)` — 204; ACAO=1 (*) — open to ALL origins, no allowlist; Access-Control-Allow-Methods GET,HEAD,PUT,PATCH,POST,DELETE
- `https://api.lnrouter.app/graphql (GET)` — 404 (expected, needs POST) but still carries ACAO=1 (*)
- `https://api.lnrouter.app/graphql (POST introspection __schema query)` — 200; GraphQL error: 'introspection is not allowed by Apollo Server ... in production' — schema hidden
- `https://api.lnrouter.app/graphql (POST guessed queries: networkStats/stats/graphStats/network)` — 200 x4; all rejected with live schema-validation errors ('Cannot query field X on type Query') — endpoint real and validating, exact field names not discovered
- `https://explorer.acinq.co/` — DNS resolution failure ('Could not resolve host'), confirmed via curl -v; ACINQ's own 2017-era LN explorer is dead
- `https://lightning-explorer.acinq.co/ and https://stats.acinq.co/` — both DNS resolution failures (guessed alternate subdomains, also dead)
- `https://api.github.com/orgs/ACINQ/repos?per_page=100` — 200; 29 repos listed (eclair, phoenix, phoenixd, secp256k1-kmp, etc.) — none is a stats/dataset publisher
- `https://raw.githubusercontent.com/ACINQ/phoenixd/master/src/commonMain/kotlin/fr/acinq/phoenixd/Api.kt` — 200; primary source; ~25 route definitions, all node-scoped (getinfo/getbalance/listchannels/payments-.../closechannel); zero network-wide endpoint
- `https://phoenix.acinq.co/server/api` — 403 to both curl (browser UA) and WebFetch — Cloudflare bot-protection; had to rely on source code instead (see row above)
- `https://amboss.space/stats (live browser load, network capture)` — 200 page load; only data call captured was POST https://amboss.space/graphql — confirms GraphQL-only, same-origin-proxied frontend
- `https://amboss.space/graphql (OPTIONS, Origin: bitcoinhull.com)` — 204; vary:Origin + access-control-allow-credentials/methods present, but ACAO=0 lines — origin not on the allowlist
- `https://amboss.space/graphql (POST {__typename}, Origin: bitcoinhull.com)` — 200, valid 32-byte GraphQL response returned server-side, but ACAO=0 lines — a real browser would still block reading it
- `https://api.amboss.space/graphql (OPTIONS, Origin: bitcoinhull.com)` — 204; same signature as amboss.space/graphql — vary:Origin present, ACAO=0 lines, confirms allowlist excludes bitcoinhull.com on the dedicated API host too
- `https://api.amboss.space/ (bare)` — 200 HTML; canonical tag points back to amboss.space/ — same Next.js app, not a distinct REST host
- `https://docs.amboss.tech/ , /space/network-explorer , /developer , /space/api-reference` — all 200; current docs confirm GraphQL (api.amboss.space/graphql) is the sole public API; no REST/RSS/CDN-JSON alternative documented in the site nav
- `https://amboss.space/{rss.xml,feed,feed.xml,blog/rss.xml,api/status,.well-known/status}` — all 6 guesses → 404; https://amboss.space/sitemap.xml → 200 but only lists page URLs, no data
- `https://docs.amboss.space/ and https://space.amboss.tech/` — both DNS resolution failures — stale/incorrect hostnames surfaced by search-index snippets; correct current domains are docs.amboss.tech and amboss.space

#### Agent L4-ln-ecosystem-b (20 probes)

- `https://lightningnetwork.plus/nodes` — GET, HTTP 200; ACAO=0 (no CORS headers at all); payload = server-rendered HTML showing '53,925 Total Nodes' text only, no timestamp, no channels/capacity aggregate; cache-control max-age=0 private must-revalidate; no rate-limit headers.
- `https://lightningnetwork.plus/api_documentation` — (WebFetch, not curl — docs enumeration) 19 endpoints listed; only get_message, verify_signature, get_swaps, get_swap/id=, get_node/pubkey= are keyless; none is a network-wide aggregate; no rate limits documented anywhere on the page.
- `https://lightningnetwork.plus/api/2/get_node/pubkey=03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f` — GET, HTTP 200; ACAO=1 line ('access-control-allow-origin: *', clean); payload PER-NODE only (ACINQ: open_channels 1764, capacity 34,541,285,982 sats, lnp_updated_at=2026-07-20T01:09:45.516Z, ~11 min old at probe time = date header 01:20:13 GMT); no rate-limit headers; not a network aggregate.
- `https://api.lnmarkets.com/v3/` — GET, HTTP 200; ACAO=0; payload = Scalar API-reference HTML/JS shell (182KB); full-text grep for network/node/channel/capacity keywords = 0 matches; wrong data domain (trading API).
- `https://docs.lnmarkets.com/api/` — GET, HTTP 200; ACAO=0; payload = 4.3KB client-rendered JS shell, no static content to verify further via curl.
- `https://docs.voltage.cloud/` — GET, HTTP 200; ACAO=0; payload = 64KB, appears JS-rendered (keyword grep for surge/macaroon/read-only returned nothing — inconclusive on its own, see gaps).
- `https://voltage.cloud/` — GET, HTTP 200; ACAO=0; payload = marketing homepage; references a separate 'status.voltage[.cloud]' uptime page (not stats).
- `https://raw.githubusercontent.com/Blockstream/esplora/master/API.md` — GET, HTTP 200; ACAO=1 (raw.githubusercontent.com standard wildcard); payload = 455-line primary API reference; 0 mentions of 'lightning' anywhere — confirms Esplora is on-chain/Liquid only.
- `https://api.github.com/repos/lnresearch/topology` — GET, HTTP 200; ACAO=1 (GitHub API default); pushed_at=2024-03-21T09:56:08Z (stale, >2yr); default_branch main, size 52; data format is raw gossip binary snapshots, not simple JSON.
- `https://api.blink.sv/graphql (POST, query: globals{network,buildInformation{commitHash}})` — HTTP 200; ACAO=1 ('*', clean); payload = {network:'mainnet', commitHash:'66e312de...'} only — no LN graph data; no rate-limit headers observed.
- `https://api.blink.sv/graphql (POST, query: __type(name:"Query"){fields{name}})` — HTTP 200; ACAO=1; payload = 17 root Query fields enumerated (price/fee/wallet-account scoped: welcomeLeaderboard, accountDefaultWallet, authorization, btcPriceList, businessMapMarkers, currencyConversionEstimation, currencyList, globals, lnInvoicePaymentStatusByHash/ByPaymentRequest, me, mobileVersions, onChainTxFee variants, payoutSpeeds, realtimePrice, usernameAvailable) — zero nodes/channels/capacity fields.
- `https://breez.technology/` — GET, HTTP 200; ACAO=0; no /api/ or stats references found in HTML.
- `https://phoenix.acinq.co/` — GET, HTTP 200; ACAO=0; no /api/ or stats references found in HTML (only CSS-class noise 'static' matched).
- `https://www.walletofsatoshi.com/` — GET, HTTP 200; ACAO=0; no /api/ or stats references found in HTML (only CSS/JS noise 'state' matched).
- `https://api.github.com/search/repositories?q=lightning+network+stats+daily+json` — GET, HTTP 200; total_count=0.
- `https://api.github.com/search/repositories?q=lnstats` — GET, HTTP 200; total_count=2 (kyleivy/LNstats-feed: pushed once 2026-03-19, dormant since; Czino/lnstats: pushed 2021-09-23, stale, single-node tool).
- `https://api.github.com/search/repositories?q=topic:lightning-network+stats` — GET, HTTP 200; total_count=1 (jesusgraterol/bitcoin-lightning-network-stats-dataset-builder: pushed 2023-11-29, wraps Mempool.space's own API into a static Kaggle CSV).
- `https://api.github.com/search/repositories?q=%22lightning+network%22+capacity+channels+snapshot` — GET, HTTP 200; total_count=0.
- `https://api.github.com/repos/kyleivy/LNstats-feed/contents/` — GET, HTTP 200; contents = README.md (14B) + server.js (594B) only — no data files, not a static JSON feed.
- `https://api.github.com/repos/kyleivy/LNstats-feed/actions/runs` — GET, HTTP 200; total_count=0 — zero GitHub Actions runs ever on this repo.
