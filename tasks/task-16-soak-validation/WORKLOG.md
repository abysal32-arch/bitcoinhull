# Task 16 — 24 h production soak WORKLOG

## Phase A — t0 (2026-07-18 17:59:11 UTC)

Tab: Claude browser pane, https://bitcoinhull.com (production, commit
`4336dc8` = task-17 redesign + `349dfd4` integrity restyle — Pages deploy
verified serving `panel-transactions` before the tab opened). The tab must
stay open (Claude desktop app stays open) until phase B.

⚠ Scope note: this soak now runs on the task-17 build. Of the three
>12 h-uptime fixes this task was written to observe:
- (a) Integrity false-STALE on baked nodes — STILL TESTABLE (nodes is
  still the one baked feed; Luke's CORS header re-verified broken today).
- (b) treasuries frozen USD — panel is now LIVE (CoinGecko hourly) as of
  task 17; the check becomes: no false STALE from the hourly feed and USD
  keeps tracking price between polls.
- (c) security 90-d window drift — panel DELETED in task 17; check is
  moot. Replacement long-window checks: the new tx panel's 6 h feeds +
  hourly treasuries survive >16 h without false staleness or drift.

### t0 state (all live, conn = LIVE over wss, 0 console messages)

| surface | value |
|---|---|
| Integrity | 80/100 HOLDING (bar 80%) |
| header tip | 958,593 |
| title | ⎈ 958,593 · $64.4k · 1 sat/vB |
| price | $64,419 |
| chain security (hashrate hero) | 901 EH/s |
| nodes | 99,854 est. · baked 2026-07-17 · store age 30 s at t0 |
| treasuries | 1,285,045 BTC · $82.8B · 6.41% (CoinGecko live) |
| transactions | 1,398,317,951 all-time · 7.8 tx/s · 4,694/block |
| blockchain | height 958,593 · UTXO 167,293,983 · 754.8 GB |
| mempool | 42 vMB |
| fees fast | 1 sat/vB |
| supply | 20,058,106 BTC |
| halving | 91,407 blocks |
| retarget | 1,023 blocks |
| lightning | 4,798.00 BTC (snapshot 2026-06-16) |
| stale panels | none |
| heap | usedJSHeapSize 2,837,702 · total 3,734,002 |

### Phase B checklist (run `task 16 verify` ≥16 h later, do NOT reload first)
1. Integrity strip NOT dimmed, no STALE tag (nodes age will be >16 h —
   the v.baked exemption must hold). Treasuries not falsely stale with
   healthy feeds; USD tracking. New panels (transactions) not falsely
   stale on their 6 h feeds.
2. Chip LIVE (or honestly POLLING with a reconnect story).
3. Title honest (no permanent leading STALE with healthy feeds).
4. No console errors accumulated.
5. Heap sane vs t0 (no monotonic growth).
6. Values current (tip matches mempool.space now).
7. Reload → identical fresh-boot behavior.
Then commit this WORKLOG + verdict, tick README.
