# Bitcoin Helm — the 10 tasks

GOAL: a live, sleek Bitcoin dashboard ("the Helm") in the spirit of Clark
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
| 03 | Chain-tip panel live: height, time-since-block, recent-blocks strip | 02 | ☐ TODO |
| 04 | Fees panel live: recommended tiers + plain-English fee verdict | 02 | ☐ TODO |
| 05 | Mempool panel live: depth, blocks-to-clear, projected-blocks mini-viz | 02 | ☐ TODO |
| 06 | Price panel live: USD, sats-per-dollar, market cap | 02 | ☐ TODO |
| 07 | Mining panel live: hashrate, difficulty, retarget ETA + estimate | 02 | ☐ TODO |
| 08 | Supply + halving panels live: exact client-side issuance math, countdown | 02, 03 | ☐ TODO |
| 09 | Live layer: WebSocket upgrade, new-block flash, live title, poll fallback | 03–08 | ☐ TODO |
| 10 | Polish + ship: final QA pass, GitHub repo + Pages deploy, README, evidence | ALL | ☐ TODO |

Chunking logic: 01 fixes the look so every later task is pure wiring; 02 is
the single shared data spine; 03–08 are independent panel tasks (any order,
one sitting each); 09 turns a polling page into a live instrument; 10 ships.

## "Done" definition (task 10 closes against this)

Page live on GitHub Pages at a public URL; every panel live with real data;
survives: API down (visible stale state, no console errors), tab left open
24 h (no leak, still ticking), phone-width viewport; zero console errors;
README + QA evidence committed; this table all ☑.

## Explicitly OUT of v1 (do not start without Joe)

- Lightning section, node-count/version stats, altcoin anything.
- Historical charts beyond what a panel needs (no time-series explorer).
- User accounts, settings persistence beyond localStorage, custom nodes.
- Light mode (the Helm is dark; revisit post-v1).
