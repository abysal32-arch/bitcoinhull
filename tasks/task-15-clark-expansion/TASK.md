# Task 15 — Clark expansion (v1.1): minor-stat tier + missing majors

Spec'd live by Joe 2026-07-17 (chat, superseding parts of tasks 11–13):

1. **Layout**: chain-tip strip moves BELOW the stat grid; page order =
   Integrity bar → major panels → minor cards → chain tip → footer.
2. **Rename**: integrity strip = "Bitcoin's Hull Integrity".
3. **Minor-stat tier** (~2/3 scale, `.panel-minor`): Corporate treasuries
   (absorbs task 13's deliverable — baked bitcointreasuries.net total;
   USD value + supply % computed live) · Lightning public network
   (mempool.space statistics snapshot; Tor CAPACITY split unavailable →
   Tor nodes + share shown instead, gap named in _SHARED.md).
4. **New/expanded majors** (Clark Moody catalog picks):
   - Mining rework: difficulty + implied 2016-block hashrate + last
     adjustment + realized 2016-block time (forecast rows moved out).
   - Difficulty retarget: blocks/date/est-change/epoch block time/epoch #
     + progress bar (all from the existing difficulty feed).
   - Chain security: 90-day hashrate, chain work (bits), chain rewrite
     days, trailing-365d mining revenue.
   - Blockchain: UTXO set size hero, chain size, baked OP_RETURN total,
     prior-year block time.
5. **Integrity recomposition** (pends task-12 research): five stats,
   20% each, current vs 3-year average — nodes, hashrate, tx/day,
   sats-per-dollar (LOWER is better), UTXO-set 1y growth vs 3y-avg
   growth. Note under the bar: the hull = the body's health of the
   Bitcoin network. Within-stat curve (default, Joe may retune): linear
   0→20 as current goes half-of-average → at-average.

Infrastructure shipped with this task: `HULL.hist` (retarget-history
derivations), blockchain.info charts origin (CORS-verified), baked-data
convention (`HULL.baked.*`), poll opts `aux`/`backoffCapMs`, minor tier
CSS. Everything documented in `_SHARED.md`.

## DONE when
Every listed stat renders live (or baked-with-as-of), values cross-check
against Clark's dashboard within timing drift, drills pass, console
clean, committed, ticked in README.
