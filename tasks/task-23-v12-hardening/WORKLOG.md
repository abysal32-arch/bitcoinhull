# Task 23 — v1.2 hardening: review + drill sweep (2026-07-19 late)

Review: 5-finder fan-out (correctness / honesty-contracts / long-uptime /
CSS-responsive / integrity-math+API-contracts) over `5df031b..HEAD`, verified
+ fixed in the main session (Fable). Drills live on the local serve.

## Findings → outcomes

| # | Lens | Finding | Verdict | Outcome |
|---|------|---------|---------|---------|
| F5 | integrity-math | **compUtxo cross-anchored**: lookback anchored on the LIVE tip, endpoint on the fragile utxoSeries — a series stall shrinks the window toward zero and silently INFLATES the UTXO row (→ false 20/20 by day ~14, dash at ~18) instead of freezing | CONFIRMED HIGH | **FIXED** — both edges now anchor on the series' own newest point (`hLast = heightAtTs(lastP.x)`; epoch + 3-yr windows on the series clock). Proven: healthy value unchanged (−0% / +0.62%, score 89); synthetic 9-day-frozen series measures a full honest epoch (+0.17% vs +0.68%) instead of collapsing. Also removes the steady-state mild inflation from routine chart lag. |
| F2 | honesty + long-uptime (both finders, opposite directions) | Fresh-preferred fallback feeds stay in FEEDS: a lone stall of `chainSize`/`utxoSeries`/`txTotal` false-STALE-tags a panel whose displayed values are all fresh | CONFIRMED MED | **FIXED** — staleSeconds skips a fallback key while its fresh twin is covering (blockchain: utxoSeries↔utxoHourly, chainSize↔chairStats; transactions: txTotal↔chairTx). Tag returns the moment the fallback actually shows. Logic-verified + healthy-path drilled; the exact single-endpoint-stall trigger is not synthesizable quickly (store.set refreshes age) — named residual, mechanism is three-line and reviewed twice. |
| F4 | correctness | tx30d window edge `lastX+1d` past the tip → heightAtTs null → avg/block permanently dashes + rate under-reports whenever blockchain.info includes the in-progress day | PLAUSIBLE (mechanism certain, trigger regime empirically absent today — series ends yesterday) | **FIXED (hardening)** — end edge clamps to the tip when beyond it. Proven: synthetic current-day point → perBlock renders 4,724 (old code: dash); zero behavior change in today's regime (4,692 before/after restore). |
| F3 | CSS | STALE tag (amber #fab219) inside the now-orange (#f7931a) panel titles: ~1.25:1 hue contrast — tag no longer reads | CONFIRMED MED (introduced by tonight's recolor) | **FIXED** — .stale-tag is now a pill (amber on rgba(250,178,25,.14), 3px radius): the box carries the "tag" read, works on the white integrity title too. Computed-style verified. |
| F1 | honesty | Nodes panel shows a monthly BAKE with stale-exemption kept but NO visible as-of anywhere ("daily estimate" credit implies freshness) | CONFIRMED-as-described, but the line removal is **Joe's documented task-19 call** (in-code comment) | **REPORTED, not changed** — reversing Joe's explicit spec isn't mine to do. Cheap option if wanted: fold "· baked YYYY-MM-DD" into the existing credit line (no new line, no density cost). |
| — | long-uptime | Fallback-stale-while-fresh-covers over-warn (same as F2, LOW framing) | folded into F2 | fixed |
| — | integrity-math | "shrinking = full marks" header vs 10/20 half-credit branch for slower-than-baseline shrink | LOW, near-dead code (gAvg>0 always in practice) | documented here, no change |
| — | integrity-math | hist.interp /0 on equal adjacent anchors | theoretical, unreachable with sorted retarget anchors | no change |
| — | correctness/uptime/honesty finders | everything else | CLEAN | per-contract verdicts in the finder reports (session transcript) |

## Drill regression (all on the fixed build's predecessor + re-run where touched)

- WS-kill: stop → chip POLLING + Incoming dashed INSTANTLY, 0 tags; start → LIVE in 6 s. PASS
- Per-origin kills (Blockchair + blockchain.info-hourly + CoinGecko, dead origins, forced polls): silent, values held, 0 tags, 0 console msgs; restore → all ages 0 s. PASS
- Page-wide kill (garbage BASE + WS stop): chip DOWN, **13/14 panels tagged+dimmed, nodes correctly exempt**, title `⎈ STALE · …` past 180 s; restore → 0 tags, title clean, LIVE re-latch. PASS
- Reduced-motion: all 3 flash classes + both transitions guarded (static). PASS
- Fold: 1280×940 chain-tip bottom **935 ≤ 940** live (settles the CSS finder's fold LOW). 1366×768: no h-scroll, integrity + ~10 panels above fold, chain tip at 936 needs ~250 px scroll — inherent to 768-tall vs the 940 contract, recorded not fixed. 375: no h-scroll, brand fits, mobile scale rule active. PASS
- Firefox: still not installed — gap remains named.
- Pane screenshots time out today (renderer quirk) — all evidence is DOM/JS-probe + computed styles.

Post-fix full sanity: boot clean, console clean, score 89 SOLID, 0 tags, conn live, values restored exact.
