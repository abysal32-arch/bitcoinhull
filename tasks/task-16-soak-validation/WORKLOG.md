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

### Build drift during the soak (expected, noted)

Production advanced to `f7fdbf9` (task 18: Blockchair live tx/size +
hourly UTXO, fresh-preferred with chart fallbacks) at ~18:5x UTC, then
to `d1b0618` (task 19: one equal tier, grid re-order, nodes baked-line
removed, all-12-on-screen density) at ~19:1x UTC — REVERTED minutes
later (`869475a`, Joe wanted a mockup first) — then re-applied WITH the
task-20 brand ship (`36fb134` + `450cde2`) at ~19:5x UTC after Joe
approved, then task 21 (`c97be5b`, ~20:4x UTC: integrity now-vs-avg
dropdown + UTXO metric redefined LOWER-is-better — headline score is
now ~100 SOLID on fresh boots vs the soaking build's 80 HOLDING; also
full-page fit + bigger ship), then task 26 (`6f0f5e9`, ~00:2x UTC
07-19: branding +50%, fold re-preserved at 935px), then task 22 (`afb5010`, ~20:5x UTC:
curve v2 — at-average = 15/20, no saturation cliff; fresh boots now
read ~86 SOLID). The soak tab keeps running the `4336dc8` build it
loaded at t0 throughout; check 7's reload boots `afb5010` — expect
score ~86 SOLID + the now-vs-avg dropdown there, NOT in checks 1-6
(the soaking build still reads 80 HOLDING with its own composition). Checks
1–6 run against the tab's loaded build (4336dc8 — chairStats/utxoHourly
polls do NOT exist in it; do not look for them). Check 7's reload will
boot `f7fdbf9` — its fresh-boot bar is the task-18 behavior (hero
1,399,5xx,xxx-scale live tx value, UTXO hourly). Also noted: this
WORKLOG's t0 section was swept into the task-18 commit by `git add -A`
(phase A intended no commit — harmless, phase B amends + commits the
verdict as planned).

## Phase B — verify (2026-07-19 22:22–22:45 UTC, t0+28.5 h) — **PASS 7/7**

Run from the swap-key session on Joe's blanket "do the rest" go (the pane is
app-global; tab-3 still held the t0 build). All in-place checks ran BEFORE the
reload, read-only.

1. **No false staleness anywhere** — zero visible stale tags at +28.5 h.
   Nodes: "baked 2026-07-17" line shown, NO stale tag at >2 d age (the
   v.baked exemption HELD — fix (a) verified). Treasuries: USD tracked
   price the whole soak ($82.8B t0 → $83B at $64,613; fix (b) verified).
   Transactions' 6 h feeds advanced 1,398,317,951 → 1,398,895,803 with no
   false stale. Fix (c) moot (panel deleted) — replacement checks green.
2. **Chip LIVE** at verify. 3. **Title honest** (⎈ 958,788 · $64.6k ·
   1.6 sat/vB — no STALE prefix). 4. **Console: ZERO messages in 28.5 h.**
5. **Heap flat**: used 3,002,067 vs t0 2,837,702 (+164 KB / +5.8%) — no
   leak signature. 6. **Values current**: tab tip 958,788 == mempool.space
   958,788 (curl, same minute), price/fees live.
7. **Reload** (navigate-force) → fresh boot on prod `6f0f5e9`: chip
   POLLING → LIVE inside the 30 s flap window, score **89 SOLID** (curve-v2
   composition, consistent with live inputs: hash 924 vs 763 avg), zero
   stale tags, console clean, heap fresh ~3.3 MB, and the task-21 dropdown
   lazily builds all 5 now-vs-3-yr rows with live values (nodes 99,854 vs
   81,366 · hash 924 vs 763 EH/s · tx 857,711 vs 486,247/day · sats 1,543
   vs 1,599 · UTXO −0% vs +0.62%/epoch).

Named gap: pane screenshots timed out (×3, renderer quirk) — evidence is
DOM-text + JS probes + the curl cross-check, no pixels. The tab is now on
the current build; the soak-tab constraint is LIFTED (preview_start usable).

**VERDICT: PASS — 28.5 h unattended production soak: zero console errors,
zero false staleness, no heap growth, honest reconnect, clean fresh boot.**

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
