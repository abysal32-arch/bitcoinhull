# Task 08 — Supply + halving panels live (exact client-side math)

## Goal
Issuance and the halving computed EXACTLY from tip height — zero API calls,
zero rounding lies.

## Spec
- `js/panels/08-supply.js` + shared helper `HELM.supplyAt(height)`:
  exact era sum — subsidy starts 50 BTC, halves every 210,000 blocks
  (integer-floor sat math like consensus: `50e8 >> era` sats per block,
  era = floor(height/210000)); return BTC. If task 06 already inlined this
  helper, MOVE it to `js/format.js` and make both panels use it; record in
  `_SHARED.md`.
- SUPPLY panel: hero ← issued BTC (0 decimals); rows ← % of 21M (bar +
  text), current subsidy (BTC), annual inflation = subsidy × 52,560 /
  supply as %.
- HALVING panel: hero ← blocks remaining to next multiple of 210,000; rows ←
  est. date (now + remaining × 10 min → "≈ May 2028" month precision — be
  honest about variance), next subsidy, era progress bar (blocks into
  current 210,000-block era).
- Both re-render on `tipHeight` change only. Stale = height stale.
- Unit sanity in verification: supplyAt(0)=0, supplyAt(210000)=10,500,000,
  supplyAt(840000)=19,687,500 (check in console).

## Files
`js/panels/08-supply.js`, `js/format.js` (helper), `index.html` (script tag).

## DONE when
Console sanity checks pass exactly; live values agree with any public supply
figure to the block; halving countdown = next multiple of 210,000 − height;
stale test passes; console clean; committed; ticked (+ `_SHARED.md` note if
the helper moved).
