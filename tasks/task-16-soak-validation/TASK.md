# Task 16 — v1.2 opener: the real 24 h soak (validate the >12 h fixes)

Laid out 2026-07-18 per Joe. The task-10 QA named "24 h soak" as an
INFERRED gap (heap-flat from task 09, never a real sit). Then the
task-12/15 review confirmed three real defects that only manifest after
>12 h of tab uptime (Integrity false-STALE on the baked nodes feed;
treasuries frozen USD; security 90-d window drift). All three were fixed
— but no fix has ever been OBSERVED over a real long window. This task
closes that honestly.

## Two-phase protocol (two sessions)

**Phase A — `task 16 begin` (evening):** open https://bitcoinhull.com in
the browser pane (NOT localhost — soak the production build), record t0
state (score, verdict, per-panel values, `performance.memory` if
available, conn), note t0 in a WORKLOG.md in this folder. Then STOP —
tell Joe to leave the Claude desktop app (and the pane tab) OPEN
overnight. ⚠ The whole protocol rides on that tab surviving; if the app
gets closed, just restart phase A another evening. No commit.

**Phase B — `task 16 verify` (next day, ≥16 h later, 24 h+ ideal):**
drive the SAME pane tab (do not reload before reading!). Check, in
order:
1. **The three fixed bugs, specifically:** Integrity strip NOT dimmed,
   no STALE tag from the baked nodes feed (store.age('nodes') will be
   >16 h — the v.baked exemption must be holding); treasuries card
   fresh (no frozen-looking USD; tag hidden with live feeds healthy);
   security hero/rewrite-days unchanged-or-sane vs a fresh reload
   (window anchored on data dates, no drift).
2. Chip still LIVE (or honestly POLLING with a reconnect story in
   console debug — overnight WS drops + reconnects are expected and
   fine; what's not fine is a dead socket claiming LIVE).
3. Title honest (no permanent leading STALE with healthy feeds).
4. No console errors accumulated overnight.
5. Heap sane vs t0 (no monotonic growth).
6. Values current (tip height matches mempool.space now).
7. THEN reload and confirm identical fresh-boot behavior.
Log everything in WORKLOG.md, commit `task-16: 24h soak — <verdict>`,
tick README. If ANY check fails: the failure is the finding — document
it, fix it (main session), re-soak.

## DONE when
A real ≥16 h production soak is logged with all 7 checks green (or
failures found, fixed, and re-soaked green); committed; ticked.
