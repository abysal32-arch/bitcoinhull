# Task 29 — sharpen sweep (2026-07-20, Joe: "do the next 3 important things")

Picked (highest value for "sharp, clean, up to date"):

1. **Version truth → v1.3.0.** The site shipped/linked v1.2.0 while tasks
   25/27/28 (incl. BOTH remaining stats going live) sat untagged. Footer
   link + README version line + CLAUDE.md blurb (4 → 6 aux origins) bumped;
   `v1.3.0` tagged + GitHub release with the post-v1.2.0 changelog.
2. **Fresh `assets/hull.png`.** The README/GitHub image predated task 28
   (stale baked nodes, June LN snapshot, +4 footer). Re-shot at 1280×940 via
   headless Edge on the live build: Integrity 90 SOLID, nodes 102,348 with
   the mirror credit, Lightning snapshot 2026-07-20 · emzy.de, chain tip
   on-screen. (og.png untouched — it is the designed share card, not a
   dashboard capture.)
3. **Feed hardening + fresh boot floor.**
   - `parseLn` validator on BOTH Lightning polls: a 200 without a dated
     `latest` snapshot (mempool.space's interval routes already return `[]`
     in the wild) now counts as a FAILED attempt — backoff, no store write,
     no age refresh on unrenderable data. Closes the review's junk-200
     trace at the source (belt to task-28's rendered-feed-age suspenders).
     `lightning` also gains `backoffCapMs` 1 h (daily-cadence feed must not
     hammer at the 5-min cap forever).
   - `scripts/bake-nodes.sh`: bitcoin-data mirror as fetch fallback (bake
     refreshes even if Luke's server dies outright), header comments
     updated to the task-28 truth (bake = boot floor only).
   - Re-baked `js/data/nodes.js`: asOf 2026-07-20, 3,116 rows, newest row
     2026-07-20T00:00:03Z (fetched from Luke direct, server-side).

## Verification

- Boot on the re-baked build: bake asOf 2026-07-20; nodes panel shows
  102,348 — the BAKE's today-row outranks the mirror's yesterday-row via
  `acceptNodes` (exactly the reviewed interleave: fresher data always
  wins, whatever the transport); LN snapshot 2026-07-20 · emzy.de; conn
  LIVE; zero stale tags.
- Junk-200 drill: `setPath('lightningFresh', <emzy fees endpoint>)` — a
  real 200 with the wrong shape → parse throw counted as failure, store
  UNCHANGED, panel kept rendering the good snapshot; recovery clean
  (age 6 s). PASS
- Console: CLEAN (fresh tab, zero messages).
- Layout untouched this task (version string same length; fold contract
  unaffected — 935 ≤ 940 re-confirmed in the capture).
- Review: small mechanical diff, each piece empirically verified as it
  landed (junk drill, bake run + node-eval sanity, console, capture
  eyeballed); self-reviewed — no fan-out spent. Checked specifically:
  parseLn returns the full object (panel reads `.latest`); `lightning`
  is not in the WS-stretch key set (cadence untouched); integrity does
  not read the lightning key; drill recovery uses `refresh()` so the 1 h
  backoff cap cannot slow the recover drill.

## Deferred / watch

- virtu-p2p-metrics monthly recheck (perfect schema, frozen 2025-11-04).
- Joe-sends unchanged from task 28: btcnodes.io CORS ask (#1), mempool
  LN-stall issue, hacknodes optional.
- Firefox cross-browser gap remains named (browser not installed —
  installing software is Joe's call).
