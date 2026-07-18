# Task 17 — v1.2: real-time data + density redesign

Laid out AND executed 2026-07-18 per Joe's same-day spec (verbatim intent,
cleaned wording): find free APIs so nothing on the page is hand-baked with
a "baked + date" label; shrink all stat blocks ~50% (minors half of THAT)
so more fits on screen; re-order the majors around Price top-middle; new
Transactions major; Blockchain leads with height; the standalone Chain
security panel dies but the Mining panel takes its name.

## What shipped

1. **Layout (3 per row):** Chain security (renamed mining panel — ids/hooks
   keep `mining`) | Price | Nodes; Supply | Mempool | Transactions (NEW);
   Fees | Blockchain (height hero, UTXO 2nd) | Difficulty retarget;
   Halving. Minors (half the new major scale) below, chain-tip strip last.
   The task-15 standalone security panel + its `minersRevenue` poll:
   deleted.
2. **Density:** majors at ~half their v1.1 footprint (hero 38→24 px,
   rows 13→11.5 px, panel padding roughly halved, grid gap 14→10);
   minors at half the major scale (hero 13 px, rows 9.5 px). Literal 50%
   type would be sub-legible — floors are deliberate, reported to Joe.
3. **Transactions panel** (Clark parity, NO Clark data — house rule):
   blockchain.info charts `n-transactions-total` (cumulative hero) +
   exact 30-day `n-transactions` (count / rate via `fmt.txs` / avg-per-
   block via HULL.hist heights at the series' own edges). Both CORS-
   verified in-browser 2026-07-18. Named gap: the total is day-bucketed
   — it lags a live counter (Clark's) by up to ~2 days. Blockchair's
   live total corroborated to 0.09% but its keyless quota is too fragile
   to ship.
4. **Treasuries LIVE** via CoinGecko `companies/public_treasury/bitcoin`
   (keyless, single ACAO, hourly aux poll, parsed to {btc, companies}).
   ⚠ Data correction: the task-13 bake (2,286,345 BTC) matched NO current
   category anywhere — bitcointreasuries.net itself, CoinGecko, bitbo and
   press all cluster 1.2–1.31M for public companies (#1 holder identical
   across sources). The card now reads ~1.29M: that is a FIX, not a
   regression.
5. **OP_RETURN row dropped.** Research to exhaustion (3-agent fan-out,
   primary fetches): no free/CORS live source exists; opreturn.org — the
   one site that had the metric — died ~May 2026. Joe vetoed baked-as-of
   labels; the honesty convention requires them on bakes; therefore no
   stat. Restorable as bake+label on Joe's word.
6. **Still baked (unchanged):** nodes — Luke's CORS header is still
   doubled (re-tested in-browser 2026-07-18), no alternative source has
   current data + history (task-12 verdict stands), and the live poll
   stays armed to self-heal. Real-time node counts DO NOT EXIST publicly;
   the daily estimate is the frontier.

## DONE when
Everything above verified in the browser (values live, kill-network stale
drill, 375 px, console clean), committed, pushed, production-verified.
