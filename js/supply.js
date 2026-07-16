/* Bitcoin Hull — HULL.supplyAt(height): circulating supply, computed, never
   fetched. Exact era sum in integer satoshis (halving every 210,000 blocks),
   returned in BTC. Shipped by task 06 for market cap; task 08 (supply panel)
   reuses it. Theoretical issuance: treats every subsidy as fully claimed —
   genesis, the duplicate-coinbase pair, and under-claimed rewards overstate
   spendable reality by ~200 BTC, noise at this dashboard's precision. */
(function () {
  'use strict';

  var HULL = window.HULL = window.HULL || {};

  var ERA_BLOCKS = 210000;
  var GENESIS_SUBSIDY_SATS = 50e8;

  /* BTC issued once the block at `height` exists (blocks 0..height, so
     height + 1 subsidies). All-integer sat arithmetic: one era is at most
     210,000 × 5e9 = 1.05e15 and the running sum tops out at ~2.1e15, both
     safely under 2^53, so the sum is exact. Non-finite or negative input
     returns NaN — panels pipe that into HULL.fmt for the honest dash. */
  HULL.supplyAt = function (height) {
    if (typeof height !== 'number' || !isFinite(height) || height < 0) return NaN;
    var blocks = Math.floor(height) + 1;
    var subsidy = GENESIS_SUBSIDY_SATS;
    var sats = 0;
    while (blocks > 0 && subsidy > 0) {
      var n = Math.min(blocks, ERA_BLOCKS);
      sats += n * subsidy;
      blocks -= n;
      /* iterated floor-halving ≡ consensus `50*COIN >> eras` for positives
         (floor(floor(x/2)/2) = floor(x/4)); subsidy dies after era 33 */
      subsidy = Math.floor(subsidy / 2);
    }
    return sats / 1e8;
  };
})();
