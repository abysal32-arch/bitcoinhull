#!/usr/bin/env bash
# Re-bake js/data/nodes.js from Luke Dashjr's live node-count history.
# Run from the repo root on the monthly bake sitting (with the treasuries
# and OP_RETURN refreshes), or any time; commit the result.
# The live in-page poll supersedes this bake automatically whenever Luke's
# CORS header is fixed — the bake just keeps the floor fresh.
set -euo pipefail

URL='https://luke.dashjr.org/programs/bitcoin/files/charts/data/history.txt'
OUT='js/data/nodes.js'
ASOF=$(date -u +%F)
TMP=$(mktemp)

curl -sf --max-time 60 "$URL" -o "$TMP"
[ -s "$TMP" ] || { echo "empty fetch — aborting, $OUT untouched"; exit 1; }

awk -v asof="$ASOF" 'BEGIN{
  print "/* Bitcoin Hull — baked data: Luke Dashjr node-count history (task 12).";
  print "   FALLBACK ONLY: main.js seeds the store from this at boot, and the live";
  print "   poll of luke.dashjr.org OVERWRITES it the moment his server serves a";
  print "   single valid CORS header (today it sends Access-Control-Allow-Origin";
  print "   twice, which every browser rejects — verified 2026-07-17, and no";
  print "   alternative source with history exists: bitnodes.io is dead, Blockchair";
  print "   counts only its own ~300 crawler connections, KIT DSN has no CORS).";
  print "   Rows are [unixTs, listening, total] with total = col2+col3 of his file";
  print "   (his own chart sums them — col3 alone is the non-listening estimate).";
  print "   Refresh on the monthly bake sitting: scripts/bake-nodes.sh */";
  print "(function () {";
  print "  \x27use strict\x27;";
  print "  var HULL = window.HULL = window.HULL || {};";
  print "  HULL.baked = HULL.baked || {};";
  print "  HULL.baked.nodes = {";
  printf "  asOf: \x27%s\x27,\n", asof;
  printf "  rows: [";
  n=0
}
NF>=3 && $1+0==$1 && $2+0==$2 && $3+0==$3 {
  if (n>0) printf ",";
  if (n%6==0) printf "\n  ";
  printf "[%d,%d,%d]", $1, $2, $2+$3;
  n++
}
END{ print "]"; print "  };"; print "})();" }' "$TMP" > "$OUT"

rm -f "$TMP"
echo "baked $(grep -c '\[1' "$OUT" || true) chunks -> $OUT (asOf $ASOF)"
