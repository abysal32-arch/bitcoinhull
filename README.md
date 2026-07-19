# ⎈ Bitcoinhull

**Live at [bitcoinhull.com](https://bitcoinhull.com)** (also
[abysal32-arch.github.io/bitcoinhull](https://abysal32-arch.github.io/bitcoinhull/)).

A live Bitcoin command point — the chain, the mempool, fees, price, mining,
supply, the halving, and the **BitcoinHull Integrity** score (one honest
0–100 for "is the network running clean right now"), readable at a glance.

![the Hull](assets/hull.png)

- **Stack:** vanilla HTML/CSS/JS, zero build step, zero dependencies, zero trackers.
- **Data:** [mempool.space](https://mempool.space) is the primary source (WebSocket
  push + REST fallback) plus four audited aux origins, all keyless and fetched
  directly by your browser: [blockchain.info charts](https://api.blockchain.info)
  (UTXO count, chain size, historical baselines),
  [CoinGecko](https://www.coingecko.com) (corporate treasuries, hourly),
  [Blockchair](https://blockchair.com) (live all-time tx count + chain size —
  a fragile origin by their own docs; if it goes away the page silently falls
  back to the daily charts), and [luke.dashjr.org](https://luke.dashjr.org)
  (node-count estimate). Aux origins never gate the connection verdict.
- **What can't be live (honestly):** the node count is a baked monthly estimate —
  no CORS-open live node crawl exists anywhere today; Lightning stats are
  mempool.space's dated snapshot (their pipeline runs behind — the snapshot date
  is shown). Everything else on the page is live.
- **Honesty rules:** every value is loading `—`, live, or visibly `STALE n MIN` —
  the page never shows a frozen number without telling you. The connection chip
  (`LIVE`/`POLLING`/`DEGRADED`/`DOWN`) tells the truth about the transport.
- **Brand:** the warship "hull" logo — hull number ₿-21, genesis-block hash on
  the armor belt — with the wordmark and panel chrome in Bitcoin orange (#f7931a).
- **Deployment story:** open `index.html` in a browser. That's it. GitHub Pages
  serves this repo as-is.

In the spirit of [Clark Moody's Bitcoin Dashboard](https://bitcoin.clarkmoody.com/dashboard) —
fewer numbers, bigger type, honest states. Read-only: no wallet, no keys, ever.

v1.2.0 · QA evidence in [`tasks/task-10-polish-ship/QA.md`](tasks/task-10-polish-ship/QA.md) ·
v1.2 hardening evidence in [`tasks/task-23-v12-hardening/WORKLOG.md`](tasks/task-23-v12-hardening/WORKLOG.md)
