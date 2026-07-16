# Task 12 — Nodes panel (v1.1): Luke Dashjr node estimate, live

**v1.1 — do not start before task 10 ships.** Sanctioned by Joe 2026-07-16
(promotes node-count out of the README OUT-list; version stats stay out).

## Goal
Node-network health at a glance: total estimated nodes + reachable, with trend.

## Data source (verified live 2026-07-16 — don't re-derive)
- `https://luke.dashjr.org/programs/bitcoin/files/charts/data/history.txt`
- CORS-open (`access-control-allow-origin: *`) — browser-fetchable, no proxy.
- Plain text, ~74 KB, one row per day (~00:00 UTC): `unix_ts listening total_estimate`
  (e.g. `1784160004 5051 94580`); history back to 2017-04, ~3,130 rows.
- This is the file behind luke.dashjr.org/…/charts/historical.html (dygraph page).
- Luke's total EXTRAPOLATES non-listening nodes — it is an estimate, and the
  panel must say so ("est."). His infra is fragile; if the file stalls, the
  panel goes stale honestly, we never cache-bake it.

## Two api.js extensions this task needs (checked against task-05-era code)
1. `HULL.api.poll` builds `BASE + path` — Luke's file is a DIFFERENT origin.
   Extend poll to accept an absolute URL (skip the BASE prefix when the path
   starts with `https://`). Keep the garbage-BASE stale drill working for the
   mempool polls; drill THIS poll by overriding its URL from the console.
2. `attempt()` calls `res.json()` unconditionally — this file is text/plain.
   Add an optional per-poll parser (default stays JSON); the nodes parser
   returns `{ts, listening, total, rows}` from the split lines.
Also: add store key `nodes` to `store.KEYS` (store warns on unknown keys).

## Spec
- New panel markup in `index.html` (task 01 never scaffolded this panel) +
  `js/panels/12-nodes.js`, following the proven panel skeleton (FEEDS/staleness/
  setVal — see 05-mempool.js).
- Hero ← total estimate ("94,580"), unit/label carries "est.".
- Rows ← Listening (reachable) · 30-day change (row nearest now−30 d, % change
  of total estimate, `fmt.pct(x, true)`) · credit "data: luke.dashjr.org"
  (permanent, Clark-style).
- Poll interval 6 h. Staleness override: the FILE updates daily, so
  panel-stale = data older than 48 h, NOT 2× interval — note the deviation in
  a comment and in `_SHARED.md`.
- Amend `_SHARED.md` in the same commit: data-source section gains this file +
  the parser/absolute-URL conventions + the staleness override.

## DONE when
Numbers match Luke's chart page; 30-day trend sane against the file's own
history; stale drill passes (console-override URL); console clean; committed;
ticked in README.
