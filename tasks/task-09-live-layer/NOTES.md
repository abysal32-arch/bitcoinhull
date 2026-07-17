# Task 09 notes — left by task 08 (2026-07-16)

Things learned in task 08 that save time here. Read after TASK.md.

## The store contract already pays off — don't touch panels

Every panel 03–08 subscribes to store keys and re-renders idempotently, so
your WS pushes into the same keys light them up with zero panel changes.
Verified relevant facts:

- `store.set()` fires subscribers even when the value is UNCHANGED (see
  js/store.js — no equality check). Panels are safe (renders are cheap and
  06's flash guards on value change), but don't push a `tipHeight` bump per
  WS message — only when the height actually moved, or you'll burn renders.
- 08's supply + halving panels render from `tipHeight` ALONE (number
  payload). Any bump re-renders both; bad/partial payloads dash out safely
  (guarded for undefined/string/negative/non-integer). Their halving ETA
  also refreshes on their own 30 s tick, so a quiet WS night still ticks.
- `blocks` push → also bump `tipHeight`: 03 (strip + header), 06 (mcap) and
  08 (both panels) all key off it — that one bump is the new-block moment
  for four panels.

## Title format needs a formatter that doesn't exist yet

`document.title` per spec is "⎈ 954,321 · $118k · 3 sat/vB". There is NO
compact-thousands USD formatter — `fmt.usd` gives "$118,420" (full) or "T"
only at ≥1e12. Add one to `HULL.fmt` (formatters-only rule) and record it
in `_SHARED.md`. `fmt.int` covers the height, `fmt.satvb` the fee.

## Chip: the states live in TWO files

`conn` values are computed in js/api.js but RENDERED by the `CHIP` map in
js/main.js (`polling/live/degraded/down` → class + text). Your new
semantics (LIVE = WS healthy, POLLING = REST-only) touch both, plus the
`_SHARED.md` "Data core" section which currently states `polling` exists
only between boot and first response — rewrite that sentence.

## Flash + reduced-motion

06 shipped `.flash-dim` (dim→normal, ~anti-pulse) in css/style.css and 03
flashes the header height on new blocks — reuse that vocabulary for the
new-tile flash rather than inventing a third animation. GAP (not checked
in 08): whether the existing 03/06 flashes honor `prefers-reduced-motion`
— your spec item says the new flash must; check the old ones while there
(one `@media (prefers-reduced-motion: reduce)` block can kill all three).

## Verification quirks (unchanged from 05–08, all hit again in 08)

- Pane `computer` screenshots time out; headless-Edge fallback per
  `_SHARED.md` (write to `$env:TEMP`, PNG lands ~5 s AFTER msedge returns).
- `javascript_tool` can't take top-level `await` — wrap in an IIFE.
- The `HULL.api.BASE` garbage-path drill only kills REST — it does NOT
  touch your WS URL. For the WS-kill test you'll need your own lever
  (e.g. `HULL.live.URL` mutable like BASE, or close the socket from the
  console) — build one in, the drill bar in TASK.md demands it.
- Independent cross-checks that worked: PowerShell `Invoke-RestMethod`
  against the same endpoints, and mempool.space's own site in a second
  pane tab (its front page shows new blocks ~instantly — that's your
  side-by-side race for the "~1 s" DONE bar).

## Footer status line

08 left it saying "ALL PANELS LIVE — integrity bar still placeholder
(task 11); websocket push lands in task 09". You ship the websocket —
rewrite it again (11 + 10 remain after you).
