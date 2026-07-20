#!/usr/bin/env bash
# Daily origin watchdog (task 30) for the two hunted metrics (nodes + LN).
# Probes every task-28 watch item, quantizes to a small state file, and
# exits 1 ONLY when the state CHANGED since the last run — the workflow
# turns that into a failed run, which is the notification (GitHub emails
# the repo owner). Quiet green runs on no-change days; the step summary
# always carries the full current picture.
# Run locally from the repo root any time: bash scripts/origin-watch.sh
set -uo pipefail

ORIGIN='https://bitcoinhull.com'
STATE_DIR='.github/origin-watch'
STATE="$STATE_DIR/state.txt"
NEW=$(mktemp)
SUM="${GITHUB_STEP_SUMMARY:-/dev/stdout}"
now=$(date -u +%s)
notes=""

acao_count() { # url [extra curl args] -> ACAO header line count (browser-validity probe)
  local url=$1; shift || true
  curl -s -D - -o /dev/null -m 25 --retry 2 -H "Origin: $ORIGIN" "$@" "$url" 2>/dev/null \
    | tr -d '\r' | grep -ci '^access-control-allow-origin' || true
}
fetch() { curl -s -m 25 --retry 2 "$1" 2>/dev/null || true; }
added_date() { fetch "$1" | grep -o '"added":"[^"]*"' | head -1 | cut -d'"' -f4 | cut -dT -f1; }
age_days() { # ISO date -> whole days, or ERR
  local ts; ts=$(date -u -d "$1" +%s 2>/dev/null) || { echo ERR; return; }
  echo $(( (now - ts) / 86400 ))
}

# --- nodes metric ---------------------------------------------------------
luke=$(acao_count 'https://luke.dashjr.org/programs/bitcoin/files/charts/data/history.txt')
echo "luke_acao=${luke:-ERR}" >> "$NEW"   # 2 today; 1 = his header healed -> direct feed goes live
notes+="- luke.dashjr.org ACAO count: **${luke:-ERR}** (1 = header healed, direct feed self-heals)\n"

mrow=$(fetch 'https://raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/luke-jr/history.txt' \
       | awk 'NF>=3 && $1+0==$1 {ts=$1} END{print ts+0}')
if [ "${mrow:-0}" -gt 0 ]; then
  ageh=$(( (now - mrow) / 3600 ))
  if [ "$ageh" -lt 30 ]; then echo "mirror=OK" >> "$NEW"; else echo "mirror=STALE" >> "$NEW"; fi
  notes+="- bitcoin-data mirror: newest row **${ageh}h** old (STALE at ≥30h = missed nightly run; panel tags at 48h)\n"
else
  echo "mirror=ERROR" >> "$NEW"
  notes+="- bitcoin-data mirror: **UNFETCHABLE**\n"
fi

virtu=$(fetch 'https://raw.githubusercontent.com/bitcoin-data/virtu-p2p-metrics/master/p2p_reachable_node_count.csv' \
        | tail -1 | cut -d, -f1 | cut -dT -f1)
echo "virtu_last=${virtu:-ERR}" >> "$NEW" # frozen at 2025-11-04; a change = feeder restarted = instant top pick
notes+="- virtu-p2p-metrics last row: **${virtu:-ERR}** (movement past 2025-11-04 = the perfect reachable-count CSV is back)\n"

btcn=$(acao_count 'https://btcnodes.io/api/home')
echo "btcnodes_acao=${btcn:-ERR}" >> "$NEW" # 0 today; 1 = our #1 ask landed
notes+="- btcnodes.io ACAO count: **${btcn:-ERR}** (1 = the #1 CORS ask landed — real-time reachable count wireable)\n"

hackn=$(acao_count 'https://pesquisa.hacknodes.xyz/api/v1/snapshots/latest/')
echo "hacknodes_acao=${hackn:-ERR}" >> "$NEW"
notes+="- hacknodes ACAO count: **${hackn:-ERR}**\n"

# --- lightning metric -----------------------------------------------------
for f in "emzy https://mempool.emzy.de/api/v1/lightning/statistics/latest 3" \
         "guide https://mempool.guide/api/v1/lightning/statistics/latest 10"; do
  set -- $f
  d=$(added_date "$2")
  if [ -n "$d" ]; then
    ad=$(age_days "$d")
    if [ "$ad" = "ERR" ]; then echo "$1=ERROR" >> "$NEW"
    elif [ "$ad" -le "$3" ]; then echo "$1=OK" >> "$NEW"
    else echo "$1=STALE" >> "$NEW"; fi
    notes+="- mempool.$1 LN snapshot: **$d** (${ad:-?}d old; STALE past ${3}d)\n"
  else
    echo "$1=ERROR" >> "$NEW"
    notes+="- mempool.$1 LN snapshot: **UNFETCHABLE/unparseable**\n"
  fi
done

# mempool.space's stalled backend is SPLIT-BRAINED — different edges serve
# different stale dates (06-18 / 06-16 / 05-22 all observed 07-19..20), so
# the raw date would flap the state daily. Quantized: only a genuine
# recovery (snapshot within 7 d) flips this key.
space=$(added_date 'https://mempool.space/api/v1/lightning/statistics/latest')
if [ -n "$space" ]; then
  sd=$(age_days "$space")
  if [ "$sd" = "ERR" ]; then echo "space=ERROR" >> "$NEW"
  elif [ "$sd" -le 7 ]; then echo "space=RECOVERED" >> "$NEW"
  else echo "space=STALLED" >> "$NEW"; fi
  notes+="- mempool.space LN snapshot: **$space** (quantized; edges disagree while stalled — only a real recovery notifies)\n"
else
  echo "space=ERROR" >> "$NEW"
  notes+="- mempool.space LN snapshot: **UNFETCHABLE/unparseable**\n"
fi

bcv=$(acao_count 'https://bitcoinvisuals.com/static/data/data_daily.csv' -r 0-0)
echo "bitcoinvisuals_acao=${bcv:-ERR}" >> "$NEW"
notes+="- bitcoinvisuals ACAO count: **${bcv:-ERR}** (1 = freshest LN CSV becomes wireable)\n"

# --- compare + report -----------------------------------------------------
mkdir -p "$STATE_DIR"
{
  echo "## Origin watch — $(date -u +%FT%H:%MZ)"
  echo ""
  printf '%b' "$notes"
  echo ""
} >> "$SUM"

if [ ! -f "$STATE" ]; then
  cp "$NEW" "$STATE"
  echo "BASELINE state written — no notification." >> "$SUM"
  exit 0
fi
if diff -u "$STATE" "$NEW" > /tmp/watch.diff 2>&1; then
  echo "No state change." >> "$SUM"
  exit 0
fi
{
  echo '### STATE CHANGED (this run is red on purpose — that is the notification):'
  echo '```diff'
  cat /tmp/watch.diff
  echo '```'
} >> "$SUM"
cp "$NEW" "$STATE"
exit 1
