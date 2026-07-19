# Origin health sweep — 2026-07-19 ~03:57Z (supplement, pre-edit-session)

Method: `curl` header probes with ACAO **line-counting** (the discipline that
caught Luke's doubled header — one probe per origin, GET where HEAD is 405).
Run from the SwitchBitcoin session as a task-18 supplement while the task-16
soak tab stays untouched. Every task-18 verdict RE-CONFIRMED tonight; nothing
flipped. Uncommitted on purpose — fold into the next task's commit.

## The sweep

| # | origin | result | verdict |
|---|--------|--------|---------|
| 1 | luke.dashjr.org history.txt | **ACAO ×2** | still browser-dead; baked nodes + live-armed self-heal remains correct |
| 2 | mempool.space LN statistics/latest | `added: 2026-06-18` (id 106271) | **still stalled, 31 days** — see new draft below |
| 3 | api.blockchair.com/bitcoin/stats | 200, ACAO `*` ×1 | healthy (no 430 tonight) |
| 4 | api.blockchain.info charts `cors=true` | 200, ACAO `*` ×1 | healthy |
| 5 | api.coingecko.com public_treasury | 200, ACAO `*` ×1 | healthy |
| 6 | bitcoinvisuals data_daily.csv | 200, 3.9 MB, **no ACAO** | still CORS-closed — email ask still needed |
| 7 | pesquisa.hacknodes.xyz snapshots (GET) | 200, **no ACAO** (HEAD → 405) | still CORS-closed — email ask still needed |
| 8 | bitnodes.io | curl exit 6 (NXDOMAIN) | domain still dead |
| 9 | bitcoinhull.com | 200, last-modified 00:22Z Jul 19 | prod serving the evening's final deploy |
| 10 | mempool.space /api/blocks/tip/height | 958654 | primary origin healthy |

## New finding tonight

**The mempool.space Lightning stall is UNTRACKED upstream.** Searched
mempool/mempool issues (web + issue-search fetch): no open issue mentions the
June-18 freeze; the only open 2026 hit is a docs task (#6377); every
statistics-stale issue is old and closed (#2600 Oct 2022, #2258 Aug 2022,
#4177 2023). Implication: it is invisible to them and may NOT self-heal —
filing a report is the realistic path. Draft added:
`ISSUE-mempool-lightning-stall.md` (Joe files it, same rule as the two email
drafts).

## Standing watch items (re-probe each visit; one header/DNS flip = a stat goes live)

1. Luke ACAO count 2 → 1 ⇒ nodes panel + Integrity self-heal, zero code.
2. mempool LN `added` advances past 2026-06-18 ⇒ Lightning freshens, zero code.
3. bitcoinvisuals ACAO appears ⇒ freshest LN data (needs the task-18 CSV plan).
4. hacknodes ACAO appears ⇒ live reachable-node count (code plan in task-18).
5. bitnodes.io resolves again ⇒ re-evaluate as the historical-lineage source.

## Confirmed / inferred / unknown

- Confirmed: rows 1–10 above (primary probes tonight); no upstream issue via
  two independent search routes.
- Inferred: "may not self-heal" (from untracked + 31 d duration); Pages
  last-modified = evening deploy (not verified against a specific commit).
- Unknown / not established: whether mempool's stall is instance-only or
  code-level (their self-hosted instances show similar symptoms historically,
  e.g. Start9 forum reports, but tonight's probe can't distinguish); KIT DSN
  not re-probed (no CORS as of 07-18, no reason to expect change).
