# Task 10 — QA evidence (2026-07-17)

Every check run against the task-11-complete tree (integrity live), local
dev server http://localhost:8765, live mempool.space data, then re-verified
at the public URL post-deploy (see Ship section).

## QA sweep

| Check | Result |
|---|---|
| 1440 px | ✅ no page h-scroll |
| 1000 px | ✅ no page h-scroll |
| 768 px | ✅ no page h-scroll |
| 375 px | ✅ no page h-scroll; block strip scrolls inside itself (`overflow-x: auto`, scrollWidth > clientWidth verified); integrity dropdown open = zero overflowing elements |
| API-down drill (socket stopped + REST at garbage path, 135 s) | ✅ chip → DOWN, tab title leads with `STALE ·`, 7/8 panels dimmed + `STALE 3 MIN` tag; mining honestly un-tagged (its 300 s feeds weren't past the 2× threshold yet — that panel's 11-min drill is task-07 DONE evidence). Integrity score sagged only via its freshness component (cadence frozen at last fresh-feed value). Zero console errors throughout. |
| Recovery without reload | ✅ restore BASE + `live.start()` → LIVE, 0 stale panels, title cleared, fresh values — no reload |
| Cold load | ✅ DOMContentLoaded 49 ms, load event 52 ms (skeleton « 1 s); values land on the first poll (staggered 350 ms starts) |
| Cross-browser | ✅ Chromium pane (interactive drills) + headless Chrome + headless Edge — identical renders (screenshots in session log; Chrome render committed as `assets/hull.png`). ⚠ GAP: Firefox is not installed on this machine and was NOT tested — plain ES5-style JS + standard CSS, risk judged low, but this is untested, not verified. |
| Number formatting | ✅ DOM scan: no `NaN` / `undefined` / `null` / `Infinity` anywhere in rendered text; 54/54 value nodes computed `tabular-nums`; all values via `HULL.fmt` |
| Footer | ✅ static-preview notice removed; now `data: mempool.space · GitHub · v1.0.0`, stack line, Clark Moody credit kept as the permanent last line |
| Console | ✅ zero errors in every state: boot, live, page-wide down drill, recovery. Silent without `?debug=1`. |
| 24 h soak | ⚠ INFERRED, not directly observed (a 24 h tab-open run doesn't fit a session): task-09 heap-flat evidence + all timers are fixed-count `setInterval`s (no accumulation) + staleness design keeps a quiet tab honest. Named as the one soak claim resting on inference. |

## Integrity (task 11) spot-evidence rolled in

All 4 verdict bands forced live (SOLID 100 / HOLDING real / STRAINED 47 /
BREACHED 37), missing-input → row + score dash (no fabricated totals),
rows always sum to the headline, kill-network freeze drill: cadence held
23/25 while blind for 3 min, score moved only by freshness (80→70), full
recovery. Review fan-out (3 finders + 5 adversarial verifiers + critic)
findings all fixed and re-drilled.

## Ship

- Repo: https://github.com/abysal32-arch/bitcoinhull (public)
- Pages: master branch root, custom domain bitcoinhull.com (CNAME file committed)
- DNS (Joe's registrar action, same flow as bitcoinburned.com):
  apex A records → 185.199.108.153 / 185.199.109.153 / 185.199.110.153 / 185.199.111.153,
  `www` CNAME → `abysal32-arch.github.io`
- Enforce HTTPS: ticked once the cert issues (requires DNS to land first)
- Tag: v1.0.0
- Live verification: github.io URL end-to-end incl. WebSocket (LIVE chip);
  bitcoinhull.com re-verified after DNS propagation — status recorded below.

### Live-URL verification log (2026-07-17)

- Pages build: `built` from `bac7805`, no errors, ~30 s after push.
- `https://abysal32-arch.github.io/bitcoinhull/` → `301 → http://bitcoinhull.com/`
  (server: GitHub.com) — custom domain wired.
- GitHub edge already serves the Hull for the custom hostname pre-DNS
  (verified via `curl --resolve bitcoinhull.com:80:185.199.108.153`):
  `200 OK`, `<title>Bitcoinhull</title>`, integrity markup and the v1.0.0
  footer present. The site is live the moment DNS flips.
- `v1.0.0` tag pushed.
- ~~PENDING: DNS + Enforce HTTPS + in-browser pass~~ → **ALL CLOSED
  2026-07-17, log below. v1 done-definition complete.**

### Post-DNS closers (2026-07-17) — CLOSED

- DNS flip (Joe, GoDaddy): apex A → the four GitHub IPs, `www` CNAME →
  `abysal32-arch.github.io`. Two snags worth remembering: GoDaddy publishes
  edits to its authoritative NS within ~1 min, BUT (1) the parking IPs
  (76.223.105.230 / 13.248.243.5) came from a **"WebsiteBuilder Site" A
  record** whose value renders as a friendly label, not IPs — it, not
  Forwarding, was re-asserting parking; (2) verify against
  `ns31/ns32.domaincontrol.com` directly, resolver caches lie for ~1 h.
- Cert: GitHub does NOT restart provisioning on a same-value cname re-save
  (silent no-op) — the unstick is **remove + re-add the custom domain**
  (`PUT` cname null, then cname back; NOTE the API verb is `PUT`, the
  `-X PATCH` in the Ship list above 404s). Cert `approved` ~12 min later,
  covers bitcoinhull.com + www.bitcoinhull.com, expires 2026-10-15.
- Enforce HTTPS: ticked via `PUT -F https_enforced=true` → `true`.
  Verified: `https://bitcoinhull.com` 200 (Server: GitHub.com), `http://`
  301 → https, `https://www` 301 → apex 200.
- In-browser bitcoinhull.com pass (Chromium pane, the last box): chip
  **LIVE** = WebSocket healthy over `wss://mempool.space/api/v1/ws` from
  the https origin; real blocks landing (tip 958,433, strip + NEXT live);
  live title `⎈ 958,433 · $63.4k · 2.5 sat/vB`; Integrity 81 HOLDING;
  fees CALM 2.5 sat/vB; mempool 46 vMB; DOM scan: 0 NaN/undefined/null/
  Infinity nodes, 0 loading dashes, 0 stale tags; **console: zero
  messages**. Screenshot in session log.
