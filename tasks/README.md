# Bitcoinhull — the 10 tasks

GOAL: a live, sleek Bitcoin dashboard ("the Hull") in the spirit of Clark
Moody's dashboard — more readable, cleaner, fewer useless stats, a few new
ones. After task 10 closes, v1 is LIVE on GitHub Pages.

## How to use (token-efficient)

Each task is self-contained and ≈10% of the project. To execute one:
`/clear`, then read ONLY `tasks/_SHARED.md` + the one `tasks/task-NN-…/TASK.md`.
Do the work, verify in the browser, commit (one commit per task), tick it off
here, tell Joe it's safe to `/clear`, stop.

Standing rules live in `_SHARED.md` (stack, data source, design tokens, panel
conventions, verification bar). Rules of the house live in `CLAUDE.md`.

## The tasks (execution order = priority order)

| # | Task | Depends on | Status |
|---|------|-----------|--------|
| 01 | Scaffold + design system + full static layout (every panel, placeholder data) | — | ☑ DONE (2026-07-16; 7 panels + strip, tokens locked, consistent placeholders from height 954,321; verified 1280/1000/375, console clean, no page h-scroll) |
| 02 | Data core: REST poller, store (pub/sub), formatters, live status chip | 01 | ☑ DONE (2026-07-16; 8 endpoints polling, chip POLLING→LIVE/DEGRADED/DOWN all exercised live incl. down→recover, backoff 5s→5min cap + 15s abort + stale-attempt seq guard, 20/20 formatter checks, console clean in every state, silent without ?debug=1) |
| 03 | Chain-tip panel live: height, time-since-block, recent-blocks strip | 02 | ☑ DONE (2026-07-16; header height + 6-block strip + NEXT tile live (matched mempool.space, caught 2 real blocks mid-test), ages/since tick on 30 s, SLOW warn/serious + STALE tag + recovery all exercised live, flash on new height, console clean in every state) |
| 04 | Fees panel live: recommended tiers + plain-English fee verdict | 02 | ☑ DONE (2026-07-16; tiers + hero live, matched mempool.space; verdict bands all 5 forced at both edges incl. missing-input → dash; clearing rate derived from the fee histogram, cross-checked against mempool.space's own next-block floor; stale drill live — last values kept + STALE 2 MIN + verdict dashes, then recovered to LIVE; console clean in every state) |
| 05 | Mempool panel live: depth, blocks-to-clear, projected-blocks mini-viz | 02 | ☑ DONE (2026-07-16; hero/pending/blocks-to-clear live + matched API; 8-seg ordinal ramp validated (--ordinal, both surfaces), overflow tail capped 2× + "+N blocks" honesty label with compact fallback, gap-aware measured label fit, role=img + live aria summary, caption w/ units; Incoming row DROPPED (research: two-poll delta is sign-flipped net flow — see task 09 for the honest source); stale drill + quiet/boundary/malformed/empty forced; console clean; no h-scroll at 375) |
| 06 | Price panel live: USD, sats-per-dollar, market cap | 02 | ☑ DONE (2026-07-16; hero matched mempool.space exactly, sats/$ hand-checked, mcap within 0.13% of CoinGecko's public figure; `HULL.supplyAt` shipped in js/supply.js — exact integer-sat era sum, boundary values at 0/209,999/840,000/asymptote all textbook-exact, NaN-safe (task 08 reuses it, noted in _SHARED.md); dim→normal `.flash-dim` on change, no re-flash on unchanged tick; stale drill live — values kept + STALE 3 MIN + dimmed, then recovered to LIVE; console clean in every state; no h-scroll at 375) |
| 07 | Mining panel live: hashrate, difficulty, retarget ETA + estimate | 02 | ☑ DONE (2026-07-16; hero 888 EH/s + difficulty 127.2 T matched mempool.space's mining page exactly, adjustment estimate within a poll of theirs (−0.7→−0.9%), retarget 1,280 blocks · ≈ 9 d matched API; hashrate ≈ diff×2³²/600 cross-check within 2.4%; epoch bar width == printed % by construction (both from one fmt.pct string, clamped, dash ⇒ 0-width); 10-min stale drill live — at 4 min the 300 s feeds correctly held un-dimmed while fast panels staled, at 11 min STALE 11 MIN + dim with last values kept, then recovered to LIVE with a fresh estimate; console clean in every state; no h-scroll at 375) |
| 08 | Supply + halving panels live: exact client-side issuance math, countdown | 02, 03 | ☑ DONE (2026-07-16; issued 20,057,309 BTC / 95.51% bar / 3.125 subsidy / 0.82% inflation + halving 91,662 blocks · ≈ Apr 2028 · 1.5625 next · Era 5 at 56.4% all live at tip 958,338, tracked a real block mid-test; supplyAt boundary checks textbook-exact — NOTE: TASK.md's literal sanity heights assumed first-H-blocks semantics, the shipped helper counts blocks 0..H incl. the tip (equivalent checks at 209,999/839,999 pass exactly; deviation reported to Joe); supply matches blockchain.info's public figure to 2 blocks of counter lag; fmt.pct grew an optional dp arg (backward-compatible) + new fmt.monthYear, both noted in _SHARED.md; stale drill live — both panels dim together + STALE 2 MIN + last values kept, then recovered to LIVE; console clean in every state) |
| 09 | Live layer: WebSocket upgrade, new-block flash, live title, poll fallback | 03–08 | ☑ DONE (2026-07-16; js/live.js pushes → same store keys, ZERO panel changes; 5 real blocks landed live (958,341–345), tile+header flash + instant title, beat mempool.space's own page by 5.0 s (bar: ~1 s); chip LIVE=WS/POLLING=REST-only, REST ×5 on the 4 WS-heartbeated keys ONLY (tipHeight/blocks/prices full cadence — stretched block polls would flap panel staleness; deviation documented); drills: stop()→POLLING, garbage-URL→5s→10s backoff, REST-garbage+WS→DEGRADED, all recovered; histogram carry expires 5 min→honest dash (drilled live 5m20s), title appends ·STALE >180s (drilled + cleared); REST regression guard (accept filters, drilled with planted tip); flap protection 30 s; fmt.usdK 16/16; reduced-motion cascade-proven on all 3 flash classes; Fable review fan-out 4 finders+8 verifiers+critic — 7 real findings all fixed & re-verified; console clean every state; heap flat) |
| 11 | BitcoinHull Integrity: 0–100 network-health score live (bar + breakdown dropdown; markup shipped 2026-07-16) | 02 | ☑ DONE (2026-07-17; weights 25/25/20/20/10 as spec'd (Joe confirmed at start) — cadence = worse of since-block/15-block-avg on the 10→60 min ramp, mining vs diff×2³²/600 baseline, fees log-band 5→300, mempool 3→50 blocks-to-clear, freshness meters all 8 pipeline keys + conn=down→0; score = sum of rounded rows so the breakdown always adds up; all 4 verdict bands + missing-input dash forced live; kill-network drills (socket dead + REST garbage): STALE tag + dim, score sags ONLY via freshness — cadence freezes at its last fresh-feed value (review catch: the since-clock must not score a measurement outage), full recovery both times; review fan-out 3 finders + 5 adversarial verifiers + critic → every confirmed finding fixed & re-drilled; caret aria-hidden; console clean in every state; no h-scroll at 375) |
| 10 | Polish + ship: final QA pass, GitHub repo + Pages deploy + bitcoinhull.com, README, evidence | ALL | ☐ TODO |
| 12 | v1.1 — Nodes panel: Luke Dashjr daily node file (CORS verified), est. total + listening + 30d trend | 10 | ☐ v1.1 (after 10) |
| 13 | v1.1 — Treasuries panel: baked bitcointreasuries.net snapshot + as-of tag, monthly re-bake | 10 | ☐ v1.1 (after 10) |

Chunking logic: 01 fixes the look so every later task is pure wiring; 02 is
the single shared data spine; 03–08 are independent panel tasks (any order,
one sitting each); 09 turns a polling page into a live instrument; 11 (added
2026-07-16, Joe) wires the Integrity bar — any time after 02, before 10;
10 ships. The table row order above (…09, 11, 10) is execution order.
Tasks 12–13 (added 2026-07-16, Joe) are **v1.1** — new data sources beyond
mempool.space (Luke Dashjr's CORS-open daily node file; a baked
bitcointreasuries.net snapshot), sources verified live in their TASK.md
files. They do not gate v1 and must not start before 10 ships.

## "Done" definition (task 10 closes against this)

Page live on GitHub Pages at a public URL; every panel live with real data;
survives: API down (visible stale state, no console errors), tab left open
24 h (no leak, still ticking), phone-width viewport; zero console errors;
README + QA evidence committed; this table all ☑.

## Explicitly OUT of v1 (do not start without Joe)

- Lightning section, version stats, altcoin anything. (Node-COUNT stats:
  promoted out of this list to v1.1 task 12 by Joe, 2026-07-16.)
- Historical charts beyond what a panel needs (no time-series explorer).
- User accounts, settings persistence beyond localStorage, custom nodes.
- Light mode (the Hull is dark; revisit post-v1).
