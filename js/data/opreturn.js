/* Bitcoin Hull — baked data: total OP_RETURN payload bytes on-chain.
   No public CORS-open API serves this (Clark computes it from his own
   node). Baked with a visible as-of date; value read 2026-07-17 from
   Clark Moody's dashboard (0.4 GB). Refresh monthly via the BigQuery
   sitting Joe already runs for the bitcoinburned OP_RETURN tally —
   SUM(LENGTH(outputs.script_hex))/2 over OP_RETURN outputs gives the
   exact figure from the public bitcoin dataset. */
(function () {
  'use strict';
  var HULL = window.HULL = window.HULL || {};
  HULL.baked = HULL.baked || {};
  HULL.baked.opreturn = {
    asOf: '2026-07-17',
    gb: 0.4
  };
})();
