/* Bitcoin Hull — chain-security panel (task 15): 90-day hashrate, total
   chain work (log2 "bits"), days to rewrite the chain at that hashrate,
   and annualized mining revenue. Chain work is derived from the full
   retarget history (HULL.hist) — an exact-boundary sum, labeled ≈ only
   through the pre-history difficulty-1 lower bound, which is invisible at
   0.1-bit display precision. Renders from HULL.store only. */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt, hist = HULL.hist;

  var DASH = '—';
  var TICK_MS = 30000;

  var FEEDS = [
    { key: 'hashrate3y',    intervalS: 21600 },
    { key: 'diffHistory',   intervalS: 21600 },
    { key: 'minersRevenue', intervalS: 21600 },
    { key: 'blocks',        intervalS: 60 }
  ];

  var panel = document.getElementById('panel-security');
  var staleTag = panel.querySelector('[data-security-stale]');
  var hr90El = panel.querySelector('[data-security-hr90]');
  var workEl = panel.querySelector('[data-security-work]');
  var rewriteEl = panel.querySelector('[data-security-rewrite]');
  var revenueEl = panel.querySelector('[data-security-revenue]');

  function setVal(el, text) {
    el.textContent = text;
    el.classList.toggle('loading', text === DASH);
  }

  function bad(n) { return typeof n !== 'number' || !isFinite(n); }

  /* mean of the daily average-hashrate points in the series' last 90 days —
     anchored on the DATA's own newest date, not the wall clock, so a
     stalled feed freezes this (and the derived rewrite days) at its last
     fresh-feed result instead of drifting (_SHARED.md wall-clock rule;
     with a fresh daily series the two anchors pick the same points) */
  function hashrate90() {
    var h3y = store.get('hashrate3y');
    var series = h3y && h3y.hashrates;
    if (!series || !series.length) return NaN;
    var newest = NaN;
    for (var j = series.length - 1; j >= 0; j--) {
      var q = series[j];
      if (q && !bad(q.avgHashrate) && !bad(q.timestamp)) { newest = q.timestamp; break; }
    }
    if (bad(newest)) return NaN;
    var cutoff = newest - 90 * 86400;
    var sum = 0, n = 0;
    for (var i = series.length - 1; i >= 0; i--) {
      var p = series[i];
      if (!p || bad(p.avgHashrate) || bad(p.timestamp)) continue;
      if (p.timestamp < cutoff) break; /* series is chronological */
      sum += p.avgHashrate; n += 1;
    }
    return n > 0 ? sum / n : NaN;
  }

  function staleSeconds() {
    var worst = 0;
    for (var i = 0; i < FEEDS.length; i++) {
      var age = store.age(FEEDS[i].key);
      if (isFinite(age) && age > 2 * FEEDS[i].intervalS && age > worst) worst = age;
    }
    return worst;
  }

  function renderAll() {
    var hr90 = hashrate90();
    setVal(hr90El, fmt.ehs(hr90));

    var bits = hist.chainWorkBits();
    setVal(workEl, fmt.bits(bits == null ? NaN : bits));

    /* days to redo all accumulated work at the 90-day hashrate */
    var work = hist.chainWork();
    setVal(rewriteEl, work == null || bad(hr90) || hr90 <= 0
      ? DASH : fmt.int(work / (hr90 * 86400)));

    /* trailing 365 days of ACTUAL revenue (Clark's semantics — measured
       USD/day summed, not today's rate projected forward) */
    var mr = store.get('minersRevenue');
    var vals = mr && mr.values;
    var revenue = NaN;
    if (vals && vals.length) {
      revenue = 0;
      for (var i = 0; i < vals.length; i++) {
        if (vals[i] && !bad(vals[i].y)) revenue += vals[i].y;
      }
    }
    setVal(revenueEl, fmt.usdBig(revenue));

    var worst = staleSeconds();
    panel.classList.toggle('stale', worst > 0);
    staleTag.hidden = !worst;
    if (worst) staleTag.textContent = 'STALE ' + Math.max(1, Math.round(worst / 60)) + ' MIN';
  }

  store.on('hashrate3y', renderAll);
  store.on('diffHistory', renderAll);
  store.on('minersRevenue', renderAll);
  store.on('blocks', renderAll);

  setInterval(renderAll, TICK_MS);
  renderAll();
})();
