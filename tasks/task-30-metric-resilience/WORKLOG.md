# Task 30 — metric resilience (2026-07-20, Joe: "next 3 for those metrics, no permissions")

The three highest-value moves for the nodes + Lightning metrics:

## 1. Second fresh Lightning feed — mempool.guide joins the pick pool

emzy alone was a single point of freshness: its death meant falling back
to mempool.space's ~5-week-stale snapshot. mempool.guide re-probed at
wiring time (ACAO ×1, snapshot dated today, `parseLn`-valid). The panel's
pick generalized to a preference-ordered `LN_FEEDS` pool
(emzy > guide > space for equal `added`; newest alive snapshot wins;
rendered feed's fetch age always judged; credit anchor names the rendered
feed). Guide ranks BELOW emzy deliberately: its operator could not be
identified in the task-28 hunt — it renders only when it genuinely holds
the newest alive snapshot.

Drills (all PASS, dev serve):
- Boot: three stores populated (emzy 07-20, guide 07-20, space 06-16);
  emzy wins the tie by pool order.
- emzy data gone → GUIDE renders (07-20, credit "mempool.guide") — the
  new resilience path, no tag.
- guide gone too → space's dated snapshot renders, credit flips, no
  false tag (space fetch healthy).
- guide rendered while its fetch is dead (emzy+space unrenderable) →
  STALE 1000 MIN + dim — the task-28 review rule generalized to feed #2.
- Dead-origin setPath on `lightningGuide` → silent, store intact, panel
  stays on emzy; recovery ~5 s.
- Console clean (fresh tab); fold 935 ≤ 940 @1280×940; 375 no h-scroll.
- Footer/README/CLAUDE.md origin count 6 → 7.

Note (honesty): each instance's LN node sees a slightly different gossip
graph (emzy 17,394 nodes vs guide 16,551 vs space's stale 17,420 at
wiring) — inherent to the metric; the credit + snapshot date disclose
which view is shown.

## 2. Daily origin watchdog — `.github/workflows/origin-watch.yml`

`scripts/origin-watch.sh` probes every task-28 watch item with the ACAO
line-count discipline: Luke header (2→1 = self-heal live), mirror row age
(≥30 h = missed nightly), emzy/guide snapshot ages (quantized OK/STALE),
mempool.space `added` date (movement = fallback recovery/churn), virtu
CSV last row (movement past 2025-11-04 = the perfect reachable-count
source restarts), btcnodes/hacknodes/bitcoinvisuals ACAO counts (0→1 = an
ask landed, a stat becomes wireable). Quantized state in
`.github/origin-watch/state.txt`, committed ONLY on change; a state
change makes the run RED — the failure email IS the notification, and the
step summary carries the diff + full picture. Quiet days: green run, zero
commits. Verified locally: baseline run (exit 0, state written, all 9
keys match reality) + no-change re-run (exit 0, "No state change") +
first CI run green.

## 3. Monthly bake auto-refresh — `.github/workflows/bake-refresh.yml`

Re-runs `scripts/bake-nodes.sh` (Luke direct → mirror fallback) on the
1st, gates on a node-eval sanity check (≥3000 rows, newest row < 8 d,
asOf present — a failed gate commits NOTHING and the red run notifies),
commits only when the file changed. The manual monthly bake sitting for
the Hull is RETIRED (bitcoinburned's BigQuery sitting is unaffected).
Verified: CI dispatch run green end-to-end (bake → sane → freshly-baked
file unchanged → no-op commit path).

## Costs / trust (named)

- +1 request per visitor per 6 h (guide) on the Lightning panel.
- The repo now self-commits from Actions (watch state on change; bake
  monthly). Both writers are narrow (one state file / one data file),
  sanity-gated, and use the default GITHUB_TOKEN. A bot commit triggers a
  Pages redeploy — content-identical except the intended file.
- Watch-notification semantics: red run = something flipped (good OR
  bad) — read the step summary before reacting.
