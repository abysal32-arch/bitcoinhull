# Task 13 — Treasuries panel (v1.1): baked bitcointreasuries snapshot

**v1.1 — do not start before task 10 ships.** Sanctioned by Joe 2026-07-16.

## Goal
How much BTC sits in tracked treasuries — four clean numbers, not a 140-row table.

## Data reality (checked 2026-07-16 — don't re-derive)
- bitcointreasuries.net has NO public API and NO CORS — a browser-only page
  cannot fetch it live, and we run no server.
- The data moves slowly (weekly-ish), so the honest pattern is a **baked
  snapshot with a visible "as of" date** — the same pattern as bitcoinburned's
  monthly OP_RETURN tally refresh.

## Spec
- `js/data/treasuries.js` (new dir):
  `window.HULL = window.HULL || {}; HULL.baked = HULL.baked || {};`
  `HULL.baked.treasuries = { asOf: 'YYYY-MM-DD', totalBtc, entityCount,
  corpBtc, etfBtc, topName, topBtc }` — values read manually from
  bitcointreasuries.net on refresh day.
- `js/panels/13-treasuries.js` renders from the baked object only: no fetch,
  no poll, no stale tag — **the always-visible `as of <date>` line IS the
  honesty mechanism** for baked data. Never dress it up as live.
- New panel markup in `index.html` (no task-01 scaffold exists).
- Hero ← total BTC (`fmt.btc`). Rows ← % of issued supply (issued computed
  from `tipHeight` via the era-sum supply helper that tasks 06/08 shipped) ·
  public companies vs ETFs split · top holder ("Strategy · N BTC") ·
  `as of YYYY-MM-DD` tag.
- Credit "data: bitcointreasuries.net" (permanent, Clark-style).
- Amend `_SHARED.md` in the same commit: add a baked-data convention section
  (`HULL.baked.*`, as-of tag rule, refresh cadence).

## Monthly refresh procedure (lives here — don't re-derive)
1. Open bitcointreasuries.net; read: total BTC, entity count, corp/ETF split,
   top holder name + amount.
2. Edit `js/data/treasuries.js`; bump `asOf`.
3. One commit: `treasuries: monthly re-bake YYYY-MM`.
4. Same rhythm as the bitcoinburned OP_RETURN tally refresh — do both in one
   sitting each month.

## DONE when
Panel renders the baked values + as-of date; % of issued supply cross-checks
against the supply panel; console clean; committed; ticked in README.
