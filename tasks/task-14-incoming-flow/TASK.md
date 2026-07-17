# Task 14 — Incoming-flow row (v1.1): the honest vB/s stat task 05 wanted

**v1.1 — do not start before task 10's closers are done.** Laid out 2026-07-17
per Joe ("next 3": 12 → 13 → 14). Independent of 12/13 — any order works,
but this one closes the oldest honesty gap, so it goes last only because it's
the smallest.

## Goal
One new row on the mempool panel: live incoming transaction flow in vB/s —
the "Incoming" row task 05 DROPPED because the two-poll delta was sign-flipped
net flow, not inflow. Task 09 found the honest source; this task wires it.

## Data source (already arriving — don't add anything)
- The task-09 WebSocket already delivers `vBytesPerSecond` (~1 s pushes,
  see the WS row in `_SHARED.md`). `js/live.js` currently ignores it.
- It is SOCKET-ONLY. No REST endpoint carries it. That drives every honesty
  rule below.

## Spec
- `js/live.js`: map `vBytesPerSecond` pushes → new store key `vbps` (add to
  `store.KEYS` — the store warns on unknown keys). Apply the existing
  stats-family 10 s throttle; panels were built for a 30 s world.
- `index.html`: add an "Incoming" row to the mempool panel markup (task 05
  deliberately never scaffolded it).
- `js/panels/05-mempool.js`: render the row from the store like any value.
  New formatter `HULL.fmt.vbps(n)` in `js/format.js`: `—` for non-finite
  (house rule), integer `vB/s` below 1,000, one-decimal `kvB/s` at/above —
  unit INCLUDED in the return (it switches, precedent: `fmt.dur`).
- **Honesty rules (the whole point of this task):**
  - The row shows a value ONLY while the socket is healthy (store `conn`
    reads `live`). POLLING / DEGRADED / DOWN / pre-first-push → dash `—`.
    There is no REST fallback and we never fake one.
  - The row is EXCLUDED from the panel's stale-tag FEEDS math — a dead
    socket with healthy REST must not tag the whole mempool panel STALE.
    Comment the deviation at the exclusion site.
- Amend `_SHARED.md` in the same commit: WS row (`vBytesPerSecond` now used
  by task 14), store key `vbps`, the socket-only display rule.

## DONE when
Value is sane against mempool.space's own incoming-vB/s figure; drills pass:
`HULL.live.stop()` → row dashes while other values stay (and no STALE tag
from this row alone), `.start()` → value returns; cold boot shows `—` until
the first push; console clean in every state; no h-scroll at 375; one
commit; ticked in README. If 12 and 13 are already ☑ when this ticks,
tell Joe v1.1 is feature-complete and ask whether to tag `v1.1.0` (tagging
is a Joe call, not part of this task).
