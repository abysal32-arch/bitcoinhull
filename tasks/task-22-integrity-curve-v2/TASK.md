# Task 22 — v1.2: integrity curve v2 (no free 100)

Joe, 2026-07-18: "it shouldn't necessarily be 100 if the stats were
better on average over the past 3 years on any of the metrics vs
today. calc it, and we will see right."

## The fix

Curve v1 saturated AT the average (r ≥ 1 → full 20), so barely-average
and double-average both read perfect — that's how the headline hit 100.
Curve v2 (`ratioPts` in 11-integrity.js):

- r ≤ 0.5 (half the 3-yr avg or worse) → 0
- 0.5 < r ≤ 1 → 30 × (r − 0.5)  — AT the average = **15/20**
- r > 1 → 15 + 10 × (r − 1), capped at 20 — full marks only at
  **1.5× the average** or better

Inverted metrics (sats/$, UTXO) feed the reciprocal ratio so
"average = 15" holds for them; a SHRINKING UTXO set still earns the
full 20 (Joe's lower-is-better polarity, task 21).

Live result at ship time: nodes 17 (1.23×) + hash 17 (1.19×) + tx 17
(1.19×) + sats 15 (1.03×) + UTXO 20 (shrinking) = **86 SOLID** (was
100). The headline can only read 100 when every stat beats its own
3-year history with real room.

## DONE when
Score verified live under the new curve, console clean, committed,
pushed, production-verified.
