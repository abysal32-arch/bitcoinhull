/* Bitcoin Hull — baked data: corporate treasuries (task 13).
   bitcointreasuries.net has no API and no CORS (checked 2026-07-16), and the
   number moves weekly-ish — so this is a BAKED value with a visible as-of
   date as the honesty mechanism (never dressed up as live). USD value and
   supply-% are NOT baked: panels compute them from the live price feed and
   the exact supply helper, so they track between re-bakes.
   Refresh procedure lives in tasks/task-13-treasuries-panel/TASK.md
   (monthly, same sitting as the bitcoinburned OP_RETURN tally).
   totalBtc = "Total of all public companies" on bitcointreasuries.net,
   read 2026-07-17 (Clark's dashboard showed 2,285,604 the same day — the
   two lag each other by hours; bitcointreasuries.net is the canonical
   source per task 13). */
(function () {
  'use strict';
  var HULL = window.HULL = window.HULL || {};
  HULL.baked = HULL.baked || {};
  HULL.baked.treasuries = {
    asOf: '2026-07-17',
    totalBtc: 2286345
  };
})();
