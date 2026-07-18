# Task 23 — v1.2 hardening: review + drill sweep (proposed by Claude,
# Joe re-scopes at boot if wanted)

WHY: tasks 17-22 shipped in ONE day (2026-07-18) at high velocity —
redesign, five new/changed data feeds, two integrity recompositions,
four density passes, the brand ship. Only the first commit of the day
got a multi-agent review. Velocity debt is the likeliest place bugs
are hiding, and v1.1's review famously caught 3 real >12h bugs.

## Scope

1. Multi-agent review fan-out (house standing opt-in, ≤20 agents) over
   the FULL v1.2 diff: `git diff 5df031b..HEAD` — correctness,
   honesty-contract regressions (stale/loading/fallback states),
   long-uptime reasoning (store.age on the new chairStats/utxoHourly/
   treasuries feeds), CSS density edge cases.
2. Drill regression pass, live in the browser: page-wide kill-network
   (garbage BASE) + recovery; WS-kill; per-origin failures — Blockchair
   430/dead (hero must fall back to the chart silently), CoinGecko
   down, blockchain.info down; boot-order honesty (slow cold load);
   reduced-motion.
3. Named-gap retirement attempts: Firefox pass (if installed), 1366×768
   laptop fold behavior.
4. Fix every confirmed finding; re-drill; one commit.

## DONE when
Review findings fixed & re-verified, drills green, committed, pushed,
production-verified, README row ticked.
