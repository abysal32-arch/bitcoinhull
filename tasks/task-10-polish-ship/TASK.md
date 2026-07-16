# Task 10 — Polish + ship (the v1 gate)

## Goal
Close every gap and put the Helm at a public URL. This task ends with v1
LIVE.

## Spec
- **QA sweep** (fix everything found):
  - 1440 / 1000 / 768 / 375 px; strip scroll on mobile; no horizontal page
    scroll ever.
  - API-down (garbage base URL): every panel stale-tags, zero console
    errors. Restore → full recovery without reload.
  - Fresh load on cold cache < 1 s to skeleton, values within one poll.
  - Cross-browser: Chrome + Edge + Firefox at minimum.
  - Number formatting audit: separators, units, no `NaN`/`undefined` ever
    visible, `tabular-nums` everywhere live.
  - Remove the static-preview footer notice; footer becomes: attribution
    ("data: mempool.space"), GitHub link, version `v1.0.0`.
- **Ship** (each web-facing step needs Joe's go-ahead in the moment:
  repo create/public, Pages enable — ASK, don't assume):
  - GitHub repo (Joe's account, suggest `bitcoinhelm`), push, enable Pages.
  - Verify the LIVE URL end-to-end incl. WS on https.
  - Tag `v1.0.0`. README updated with live URL + screenshot.
- **Evidence**: `tasks/task-10-polish-ship/QA.md` — the checklist above with
  results + final screenshot; commit it.
- Tick the full table in `tasks/README.md`; mark the project DONE there.

## Files
Anything the sweep requires + README.md + QA.md.

## DONE when
Public URL renders the live Helm on a phone and a desktop; QA.md all green
and committed; `v1.0.0` tagged; tasks table all ☑; Joe told v1 is live.
