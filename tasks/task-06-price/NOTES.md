# Task 06 notes — left by task 05 (2026-07-16)

Things learned in task 05 that save time here. Read after TASK.md.

## The one real decision: market cap needs circulating supply

Nothing fetchable returns supply — it's computed from tip height (sum of
subsidy eras, halving every 210,000 blocks), and **task 08 owns that math**.
Task 06 ships market cap first. Decide at boot:

- Recommended: implement the era-sum helper in `js/format.js` (or a small
  `js/supply.js`) in THIS task — it's ~8 lines — and let task 08 reuse it,
  rather than shipping a hardcoded supply that silently drifts stale.
  If you add it, append the convention to `_SHARED.md` in the same commit
  so 08 knows it exists.
- Store already polls `tipHeight` (60 s); subscribe to both `prices` and
  `tipHeight` for the mcap row.

## Small facts

- `/api/v1/prices` returns `{time, USD, EUR, GBP, …}`. `time` is the
  server's price timestamp; panel staleness still runs off `store.age()`
  (poll age) like every other panel — don't invent a second staleness from
  the payload field.
- Sats per dollar = `1e8 / USD`, through `fmt.int` (placeholder shows "845").
- `fmt.usd` renders `$2.37T` (no space before T); the task-01 placeholder
  markup shows `$2.37 T` (with space). Formatter wins — placeholders aren't
  a spec — but eyeball which reads better in place before committing.
- Copy the proven panel skeleton from `05-mempool.js` / `04-fees.js`:
  FEEDS array (`prices` intervalS 60) → staleSeconds → setVal(+`.loading`)
  → renderAll on store events + 30 s tick + `data-price-stale` tag in the
  `<h2>` (the mempool panel-head in `index.html` shows the exact markup —
  the price panel-head doesn't have its stale tag yet, add it like 05 did).

## Tooling quirk refinement (also appended to _SHARED.md)

The headless-Edge screenshot fallback writes its PNG a few seconds AFTER
msedge.exe returns — `Start-Sleep -Seconds 5` before copying, or the copy
fails with file-not-found. Pane `computer` screenshots still time out;
every other pane tool (javascript_tool, read_page, resize_window) works.

## Not for this task

Incoming/flow-rate stats: task 05 research proved per-poll deltas are
sign-flipped garbage around blocks; the honest source
(`/api/v1/statistics/2h`) is flagged for task 09's WS/stats scope, not 06.
