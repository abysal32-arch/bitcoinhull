#!/usr/bin/env bash
# Re-bake js/data/nodes.js from Luke Dashjr's node-count history.
# Since task 28 the bake is the BOOT FLOOR only: the in-page nodesMirror
# poll (bitcoin-data's nightly GitHub mirror, CORS-clean) overwrites it
# within seconds of load, and Luke's direct poll stays armed on top. Run
# on the periodic bake sitting or any time; commit the result.
# Luke's origin is tried first (freshest); the mirror is the fallback so
# the bake still refreshes even if his server is down entirely.
set -euo pipefail

URL='https://luke.dashjr.org/programs/bitcoin/files/charts/data/history.txt'
MIRROR='https://raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/luke-jr/history.txt'
OUT='js/data/nodes.js'
ASOF=$(date -u +%F)
TMP=$(mktemp)

if ! curl -sf --max-time 60 "$URL" -o "$TMP" || [ ! -s "$TMP" ]; then
  echo "luke.dashjr.org fetch failed — falling back to the bitcoin-data mirror"
  curl -sf --max-time 60 "$MIRROR" -o "$TMP"
fi
[ -s "$TMP" ] || { echo "empty fetch from both sources — aborting, $OUT untouched"; exit 1; }

awk -v asof="$ASOF" 'BEGIN{
  print "/* Bitcoin Hull — baked data: Luke Dashjr node-count history (task 12;";
  print "   role reduced in task 28). BOOT FLOOR ONLY: main.js seeds the store";
  print "   from this at boot, and the nodesMirror poll (bitcoin-data nightly";
  print "   GitHub mirror of the same file, CORS-clean) overwrites it within";
  print "   seconds — a visitor sees baked data only while offline. Luke\x27s own";
  print "   origin still sends a doubled ACAO header (browser-dead; his direct";
  print "   poll stays armed and wins if he ever fixes it).";
  print "   Rows are [unixTs, listening, total] with total = col2+col3 of his file";
  print "   (his own chart sums them — col3 alone is the non-listening estimate).";
  print "   Refresh on the periodic bake sitting: scripts/bake-nodes.sh */";
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
