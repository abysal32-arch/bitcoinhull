# Task 24 — docs + version truth (proposed by Claude, Joe re-scopes at
# boot if wanted)

WHY: the repo still DESCRIBES v1.0. After the v1.2 wave the docs lie:
README says "ONE data source (mempool.space)" — there are now FIVE
origins (mempool.space, luke.dashjr.org, blockchain.info charts,
CoinGecko, Blockchair). Footer pins "v1.0.0". `assets/hull.png` shows
the old layout. CLAUDE.md's project blurb says "one data source". The
`<meta name=description>` predates the redesign.

## Scope

1. README.md: origins list (with the fragile-Blockchair caveat + the
   honest "what can't be live" note: nodes daily-baked, Lightning
   month-lagged snapshot), new layout screenshot (re-shoot
   assets/hull.png at 1280×940), brand-ship mention, version badge.
2. CLAUDE.md project blurb: data-source sentence → "mempool.space
   primary + 4 audited aux origins (see _SHARED.md)".
3. index.html: footer version link, meta description.
4. _SHARED.md: one consistency pass over the endpoint table (it grew
   organically across 15/17/18) — no behavior changes, wording only.
5. Tag `v1.2.0` AFTER task 23 is green; GitHub release notes = the
   task 17-23 README rows, condensed.

## DONE when
Docs match reality, screenshot fresh, v1.2.0 tagged + released,
committed, pushed, ticked.
