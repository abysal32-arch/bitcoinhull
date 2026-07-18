# Task 19 — v1.2: one equal tier, all 12 on screen

Laid out AND executed 2026-07-18 per Joe: "take off the baked line for
nodes tab - put fees below mempool - blockchain where supply is - take
off the words minor in all tabs - shrink all tabs to the same size but
so that we can see all 12 at the same time."

## What shipped

1. Grid re-order (3 per row): Chain security | Price | Nodes /
   **Blockchain** | Mempool | Transactions / **Supply** | **Fees** |
   Difficulty retarget / Halving | Treasuries | Lightning.
   (Blockchain↔Supply swapped; Fees under Mempool; the two ex-minor
   cards fill Halving's row — 12 exactly.)
2. Minor tier RETIRED: `.panel-minor` + `.asof` CSS deleted; treasuries
   and Lightning render at the one panel scale. ("The word minor" never
   appeared on the live page — it was a label in the chat mockup only.)
3. Nodes: the `· baked <date>` line removed (Joe's call, overrides the
   task-13 as-of rule for this panel; the stale-tag exemption for baked
   data stays so an aging bake doesn't false-alarm; "est." + the
   luke.dashjr.org "daily estimate" credit remain the disclosure).
4. Density: one more notch (panel padding 7/12/8, row pad 3px, grid gap
   8, header/integrity trims) → 12th panel bottom = 902 px at 1280×940;
   all 12 + the Integrity strip fit a 1080p viewport.

## DONE when
Verified (order, fit measurement, console clean, 375 px), committed,
pushed, production-verified.
