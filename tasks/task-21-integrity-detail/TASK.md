# Task 21 — v1.2: integrity detail readout + full-page fit + bigger ship

Joe, 2026-07-18 (same-day spec): ship "definitely bigger"; grammar check
on the strip title; whole page incl. chain tip visible on landing
(desktop); dropdown shows each metric's current vs 3-yr average WITHOUT
stating the 20% weights; UTXO metric redefined.

## What shipped

1. **Ship 88×47** (from 58×31).
2. **Title stays "Bitcoin's Hull Integrity"** — grammatically correct:
   "hull integrity" is a compound noun possessed as a unit;
   "Bitcoin's Hull's Integrity" is a clunky double genitive. Reported
   to Joe, no change.
3. **Dropdown readout**: each row = metric label + "now · 3-yr avg"
   values (fmt-formatted); the 20-points-each weighting stays under the
   hood and is deliberately NOT displayed. "lower is better" notes on
   sats/$ and UTXO (`.int-note`).
4. **UTXO metric REDEFINED (lower is better)**: growth over the
   trailing 2016 blocks (tip-anchored epoch via HULL.hist) vs the
   average per-epoch growth over the last 3 years (3-yr total growth /
   epochs-in-3-years, heights from hist). Shrinking set = 20/20; at
   2× the historical pace = 0 (shared curve on the reciprocal ratio);
   negative-baseline guard = sign-based. ⚠ Known consequence: with the
   set currently shrinking, the score jumped 80 → 100 SOLID (the old
   composition scored shrinkage as 0/20; Joe's polarity is deliberate —
   "more utxos isnt great").
5. **Full-page fit**: density v4 (panel pad 5/10/6, rows 11px/2px, gap
   6, hero ≤20px, header/integrity trims) + chain-tip shrink (tiles
   92px, 4/7 pad, fonts −1..−2) → chain-tip strip bottom = 938 px at
   1280×940. All 12 panels + strip on one 1080p screen.

## DONE when
Values verified live (rows real, score consistent), fit measured,
console clean, 375 px clean, committed, pushed, production-verified.
