# Task 09 — Live layer: WebSocket, new-block moment, live title

## Goal
Polling page → live instrument. Blocks land ON the Hull the moment they land
on the network.

## Spec
- `js/live.js`: connect `wss://mempool.space/api/v1/ws`, send
  `{"action":"want","data":["blocks","stats","mempool-blocks"]}`; map pushes
  into the SAME store keys the REST poller fills (`blocks` push → also bump
  `tipHeight`; `stats` → `mempool`/`fees`-relevant fields; `mempool-blocks`
  → `mempoolBlocks`). Panels don't change at all — that's the store contract
  paying off.
- While WS is healthy: lengthen REST polls for the covered keys (×5) instead
  of stopping them (belt and suspenders). WS down → reconnect with backoff,
  REST cadence restored; chip reflects it (LIVE = WS, POLLING = REST-only —
  add the state to the chip).
- **New-block moment**: strip prepends the new tile with a brief accent
  flash + the header height flashes; `document.title` = "⎈ 954,321 · $118k ·
  3 sat/vB" (height · price · fastest fee), updated on those keys.
- Respect `prefers-reduced-motion` (no flash animation).
- Leave a 2 h+ tab open during verification (or fake it): no reconnect storm,
  no memory growth in Task Manager, ages still ticking.

## Files
`js/live.js`, `js/main.js` (start WS), `js/api.js` (cadence hook),
`css/style.css` (flash), `index.html` (script tag).

## DONE when
A real block arrival visibly lands within ~1 s of mempool.space's own site
(watch both side by side); WS-kill test degrades to POLLING and recovers;
title live; reduced-motion honored; console clean over a long session;
committed; ticked (+ chip state noted in `_SHARED.md`).
