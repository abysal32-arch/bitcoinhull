# Task 25 — responsive + mid-width polish (proposed by Claude, Joe
# re-scopes at boot if wanted)

WHY: the v1.2 density passes were tuned and verified at exactly two
widths — 1280 (fold math) and 375 (no-h-scroll). The band between is
unaudited: 720-1100px renders span-6 two-column with the new tiny
type; 1100-1280 is untested; 1366×768 laptops (the most common small
desktop) cannot fit the full fold target and nobody has decided what
they SHOULD see.

## Scope

1. Sweep 1366×768, 1440×900, 1100, 900, 768, 540, 375 — screenshot
   each; fix anything broken (overflow, wrapped headers, orphan
   panels, the ship at narrow widths).
2. Decide + implement the 1366×768 story (likely: fold shows the 12
   panels, chain tip scrolls — verify it degrades exactly like that
   and nothing worse).
3. Consider bumping type floors on ≤720px where vertical space isn't
   scarce (the 50%-density fonts exist for the DESKTOP fold; phones
   scroll anyway — 11px rows can go back up toward 12.5-13px on
   mobile if it reads better). Joe eyeballs the result.
4. Keep the desktop fold bar intact: chain-tip bottom ≤ 940 at 1280
   must survive every change (re-measure before commit).

## DONE when
All widths screenshotted clean, mobile type decision made with Joe,
fold bar re-verified, committed, pushed, ticked.
