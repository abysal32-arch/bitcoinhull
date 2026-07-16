# Task 10 — Polish + ship (the v1 gate)

## Goal
Close every gap and put the Hull at a public URL. This task ends with v1
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
  - GitHub repo (Joe's account, suggest `bitcoinhull`), push, enable Pages.
  - **Custom domain: bitcoinhull.com (Joe already owns it).** Commit a
    `CNAME` file containing `bitcoinhull.com`; Joe sets DNS at his registrar
    (apex A records → GitHub Pages IPs 185.199.108/109/110/111.153, plus
    `www` CNAME → `<user>.github.io`); set the custom domain in Pages
    settings and tick Enforce HTTPS once the cert issues (can take ~1 h;
    same flow as bitcoinburned.com).
  - Verify the LIVE URL end-to-end incl. WS on https — at bitcoinhull.com,
    not just the github.io URL.
  - Tag `v1.0.0`. README updated with live URL + screenshot.
- **Evidence**: `tasks/task-10-polish-ship/QA.md` — the checklist above with
  results + final screenshot; commit it.
- Tick the full table in `tasks/README.md`; mark the project DONE there.

## Files
Anything the sweep requires + README.md + QA.md.

## DONE when
Public URL renders the live Hull on a phone and a desktop; QA.md all green
and committed; `v1.0.0` tagged; tasks table all ☑; Joe told v1 is live.
