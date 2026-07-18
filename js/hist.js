/* Bitcoin Hull — HULL.hist: derivations over the difficulty-retarget history
   (store key diffHistory = [[ts, height, difficulty, changePct], ...] one
   entry per retarget, API order newest-first — sorted ascending here).
   Heights and timestamps at retarget boundaries are EXACT; interpolating
   inside an epoch is honest to ~seconds/blocks because an epoch's 2016
   block times average out. The current (open) epoch is anchored on the
   newest block in the blocks feed — an exact height+timestamp pair.
   Every function returns null when its inputs aren't in the store yet, so
   panels pass the result straight to HULL.fmt for the honest dash. */
(function () {
  'use strict';

  var HULL = window.HULL = window.HULL || {};
  var store = HULL.store;

  var TWO32 = 4294967296; /* work per unit difficulty per block */

  var sortedFor = null; /* cache keyed on the store array's identity */
  var sorted = null;

  function entries() {
    var raw = store.get('diffHistory');
    if (!raw || !raw.length) return null;
    if (raw !== sortedFor) {
      sorted = raw.slice().sort(function (a, b) { return a[1] - b[1]; });
      sortedFor = raw;
    }
    return sorted;
  }

  /* the newest block we know exactly: [height, unixSeconds], or null */
  function tipAnchor() {
    var blocks = store.get('blocks');
    if (!blocks || !blocks.length) return null;
    var b = blocks[0];
    if (typeof b.height !== 'number' || typeof b.timestamp !== 'number') return null;
    return [b.height, b.timestamp];
  }

  /* piecewise-linear over [retarget0 … retargetN, tip] */
  function anchorsFor(es) {
    var tip = tipAnchor();
    var pts = [];
    for (var i = 0; i < es.length; i++) pts.push([es[i][1], es[i][0]]); /* [height, ts] */
    if (tip && (!pts.length || tip[0] > pts[pts.length - 1][0])) pts.push(tip);
    return pts.length >= 2 ? pts : null;
  }

  function interp(pts, x, xi, yi) {
    /* clamp outside the covered range — refuse to extrapolate */
    if (x <= pts[0][xi]) return null;
    for (var i = 1; i < pts.length; i++) {
      if (x <= pts[i][xi]) {
        var a = pts[i - 1], b = pts[i];
        var t = (x - a[xi]) / (b[xi] - a[xi]);
        return a[yi] + t * (b[yi] - a[yi]);
      }
    }
    return null;
  }

  HULL.hist = {

    /* unix seconds of a past height (null if unknown/uncovered) */
    tsAtHeight: function (h) {
      var es = entries();
      var pts = es && anchorsFor(es);
      return pts ? interp(pts, h, 0, 1) : null;
    },

    /* height at a past unix-seconds moment */
    heightAtTs: function (ts) {
      var es = entries();
      var pts = es && anchorsFor(es);
      return pts ? interp(pts, ts, 1, 0) : null;
    },

    /* mean block interval (s) over the last n blocks, tip-anchored */
    avgBlockTime: function (n) {
      var tip = tipAnchor();
      if (!tip || !(n > 0)) return null;
      var then = HULL.hist.tsAtHeight(tip[0] - n);
      return then == null ? null : (tip[1] - then) / n;
    },

    /* mean block interval (s) over the trailing year */
    priorYearBlockTime: function () {
      var tip = tipAnchor();
      if (!tip) return null;
      var yearAgo = tip[1] - 31536000;
      var hThen = HULL.hist.heightAtTs(yearAgo);
      if (hThen == null || tip[0] - hThen <= 0) return null;
      return 31536000 / (tip[0] - hThen);
    },

    /* total chain work in hashes. Work before the earliest retarget entry
       is counted at difficulty 1 — a lower bound whose log2 impact is far
       below the displayed 0.1-bit precision. */
    chainWork: function () {
      var es = entries();
      var tip = tipAnchor();
      if (!es || !tip) return null;
      var work = es[0][1] * 1 * TWO32; /* pre-history at difficulty ~1 */
      for (var i = 0; i < es.length; i++) {
        var upto = (i + 1 < es.length) ? es[i + 1][1] : tip[0];
        var span = upto - es[i][1];
        if (span > 0) work += span * es[i][2] * TWO32;
      }
      return work > 0 ? work : null;
    },

    /* total chain work as log2 ("bits") */
    chainWorkBits: function () {
      var w = HULL.hist.chainWork();
      return w == null ? null : Math.log2(w);
    },

    /* implied hashrate (H/s) over the last n blocks: the work those blocks
       actually encode divided by the time they actually took — spans
       difficulty boundaries correctly, unlike difficulty/target-time */
    impliedHashrate: function (n) {
      var es = entries();
      var tip = tipAnchor();
      if (!es || !tip || !(n > 0)) return null;
      var from = tip[0] - n;
      if (from < es[0][1]) return null; /* window predates the history */
      var work = 0;
      for (var i = 0; i < es.length; i++) {
        var lo = Math.max(es[i][1], from);
        var hi = (i + 1 < es.length) ? es[i + 1][1] : tip[0];
        if (hi > lo) work += (hi - lo) * es[i][2] * TWO32;
      }
      var elapsed = HULL.hist.avgBlockTime(n);
      return elapsed == null || elapsed <= 0 ? null : work / (elapsed * n);
    }
  };
})();
