# Task 20 — v1.2: the brand ship

Designed 2026-07-18 in-chat with Joe (three mockup iterations: tug →
warship → bigger centered hull number → ₿ pennant + SHA-256 belt), then
applied together with the un-parked task-19 layout on his "Put the new
logo up ... show me what the site looks like now".

## The mark

Angular warship, right-facing, inline SVG (`.brand-ship`, 58×31 px) to
the RIGHT of the wordmark (Joe offered right-or-below; right keeps the
header at ~50 px so the all-12-fit bar holds — measured 902 px, still
≤ 940). Design vocabulary:
- reverse-raked (Zumwalt) bow; the watertight hull is the ONE solid
  bitcoin-orange element; everything above deck in slate tones
- hull number **₿-21** (the 21M cap), naval-pennant style, centered
- armor belt below the waterline carries
  `SHA-256 ▸ 000000000019D6689C085AE165831E93` — the first 32 chars of
  the GENESIS BLOCK hash: the ship's protection layer is literally the
  hash the chain hangs off (easter egg at header scale)
- ₿ on the masthead pennant; choppy hard-angle seas
- favicon swapped from the BH monogram to hull+₿ (same data-URI
  technique; page-visible favicon row in the mockups was preview-only)

## DONE when
Header renders the ship at 1280/375 (no h-scroll, brand fits), 12-panel
fit still ≤ 940 px, console clean, committed, pushed,
production-verified.
