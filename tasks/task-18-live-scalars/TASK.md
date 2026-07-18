# Task 18 — v1.2: live scalars for the lagging stats (+ the honest "no" list)

Laid out AND executed 2026-07-18 per Joe: "do a bit more research, try to
find an honest current node assessment we can use and anything else for
the other stats that are lagging if possible."

## Research verdicts (3-agent Sonnet-MAX fan-out, primary fetches,
##  ACAO-line-counted; full detail in `_SHARED.md` §Live-source verdicts)

| lagging stat | verdict |
|---|---|
| Transactions all-time (~2 d lag) | ✅ FIXED — Blockchair live (71 s cadence), chart fallback |
| Chain size (daily) | ✅ FIXED — same Blockchair poll (same semantics, docs-confirmed) |
| UTXO set size (daily) | ✅ FIXED — blockchain.info utxo-count at 1-week timespan is HOURLY |
| Node count (baked daily) | ❌ NONE EXISTS — bitnodes domain expired; the 2 live crawlers (hacknodes.xyz revival, KIT DSN) both lack CORS; bitnod.es has no API |
| Lightning (~32 d snapshot) | ❌ NONE CORS-open is fresher — the stall is mempool.space-side; bitcoinvisuals (1-2 d) has zero CORS |

## What shipped

- `chairStats` poll (15 min, aux, parse to {tx, sizeBytes}, backoff cap
  1 h) + `utxoHourly` poll (30 min, aux). Both browser-CORS-verified from
  the REAL production origin.
- Fresh-preferred rendering: Transactions hero and the Blockchain panel's
  chain-size + UTXO rows prefer the fresh feed (age ≤ 2× interval) and
  silently fall back to the daily charts. Neither fresh feed joins any
  stale-tag FEEDS — a Blockchair 430/CORS-drop degrades the page to
  exactly what it showed before task 18, no tags, no errors (drilled:
  bad-value fallback, dead-origin poll, recovery).
- Blockchair risk contract written into main.js + `_SHARED.md` (docs
  discourage client-side use; anti-bot 430s at low volume; CORS revocable
  without notice; never read `nodes`/`outputs`).
- Transactions panel credit: Blockchair · blockchain.info.
- Email drafts (Joe sends): `EMAIL-hacknodes-cors.md` (node crawler),
  `EMAIL-bitcoinvisuals-cors.md` (Lightning daily data). Either adding
  one header flips their stat live for us with ~zero code.

## DONE when
Verified in-browser (live values, fallback drills, 375 px, console
clean), committed, pushed, production-verified.
