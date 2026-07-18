/* Bitcoin Hull — Bitcoin's Hull Integrity (recomposed per Joe 2026-07-17):
   the hull = the BODY's health of the Bitcoin network. Five structural
   stats, 20 points each, every one scored as CURRENT vs its own 3-YEAR
   AVERAGE:
     nodes      /20  Luke-estimate total vs 3-yr avg of the same series
     hashpower  /20  live hashrate vs 3-yr avg (mempool.space 3y series)
     tx/day     /20  newest daily tx count vs 3-yr avg (blockchain.info)
     sats per $ /20  LOWER is better (Joe) — ratio inverted
     UTXO growth/20  past-year growth vs the mean of the 3 prior yearly
                     growth rates (4-yr series)
   Within-stat curve (default Joe may retune): points = 20 × clamp of
   (ratio − 0.5)/0.5 — at half the 3-yr average → 0, at-or-above the
   average → full 20. All inputs are FEED-derived (averages anchored on
   the data's own dates, never the wall clock), so a stalled feed freezes
   its stat instead of drifting. Per-stat points are ROUNDED before
   summing (kept from the row-display era so the composition — and the
   live score — stays identical; the dropdown now lists the metrics
   without numbers, Joe 2026-07-18). Any missing input → the headline
   dash (no fabricated totals). */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt;

  var DASH = '—';
  var TICK_MS = 30000;
  var YEAR_S = 31536000;

  /* verdict bands on the integer score — label + tint always travel
     together, and pill + bar always carry the text label (house rule) */
  var BANDS = [
    { min: 85, label: 'SOLID',    cls: 'pill-good',     fill: 'fill-good' },
    { min: 65, label: 'HOLDING',  cls: 'pill-warn',     fill: 'fill-warn' },
    { min: 40, label: 'STRAINED', cls: 'pill-serious',  fill: 'fill-serious' },
    { min: 0,  label: 'BREACHED', cls: 'pill-critical', fill: 'fill-critical' }
  ];

  /* the strip's stale tag judges FETCH health of its inputs (2× interval
     convention); each stat's own freeze-when-stalled honesty rides on the
     values being feed-derived */
  var FEEDS = [
    { key: 'nodes',       intervalS: 21600 },
    { key: 'hashrate',    intervalS: 300 },
    { key: 'hashrate3y',  intervalS: 21600 },
    { key: 'prices',      intervalS: 60 },
    { key: 'priceSeries', intervalS: 21600 },
    { key: 'txSeries',    intervalS: 21600 },
    { key: 'utxoSeries',  intervalS: 21600 }
  ];

  var panel = document.getElementById('panel-integrity');
  var staleTag = panel.querySelector('[data-integrity-stale]');
  var scoreEl = panel.querySelector('[data-integrity-score]');
  var barEl = panel.querySelector('[data-integrity-bar]');
  var verdictEl = panel.querySelector('[data-integrity-verdict]');
  var verdictLabel = panel.querySelector('[data-integrity-verdict-label]');

  function setVal(el, text) {
    el.textContent = text;
    el.classList.toggle('loading', text === DASH);
  }

  /* same guard HULL.fmt applies: a real, usable number and nothing else */
  function bad(n) { return typeof n !== 'number' || !isFinite(n); }

  /* the shared curve: half-of-average → 0, at-or-above average → 20 */
  function ratioPts(r) {
    if (bad(r)) return NaN;
    return 20 * Math.min(1, Math.max(0, (r - 0.5) / 0.5));
  }

  /* y of the series point nearest targetX, NaN if none lands within tol */
  function seriesAt(vals, targetX, tolS) {
    var best = NaN, bestD = Infinity;
    for (var i = 0; i < vals.length; i++) {
      var p = vals[i];
      if (!p || bad(p.x) || bad(p.y)) continue;
      var d = Math.abs(p.x - targetX);
      if (d < bestD) { bestD = d; best = p.y; }
    }
    return bestD <= tolS ? best : NaN;
  }

  /* points /20 for a healthy stat, NaN while an input is missing */
  function compNodes() {
    var v = store.get('nodes');
    if (!v || bad(v.total) || !v.rows || v.rows.length < 90) return NaN;
    var from = v.ts - 3 * YEAR_S;
    var sum = 0, n = 0;
    for (var i = 0; i < v.rows.length; i++) {
      var r = v.rows[i];
      if (r && !bad(r.total) && r.ts >= from) { sum += r.total; n += 1; }
    }
    if (n < 90) return NaN;
    var avg = sum / n;
    return avg > 0 ? ratioPts(v.total / avg) : NaN;
  }

  function compHash() {
    var hr = (store.get('hashrate') || {}).currentHashrate;
    var h3y = store.get('hashrate3y');
    var series = h3y && h3y.hashrates;
    if (bad(hr) || hr < 0 || !series || series.length < 300) return NaN;
    var sum = 0, n = 0;
    for (var i = 0; i < series.length; i++) {
      var p = series[i];
      if (p && !bad(p.avgHashrate)) { sum += p.avgHashrate; n += 1; }
    }
    if (n < 300) return NaN;
    var avg = sum / n;
    return avg > 0 ? ratioPts(hr / avg) : NaN;
  }

  function compTx() {
    var s = store.get('txSeries');
    var vals = s && s.values;
    if (!vals || vals.length < 100) return NaN;
    var cur = vals[vals.length - 1] && vals[vals.length - 1].y;
    if (bad(cur)) return NaN;
    var sum = 0, n = 0;
    for (var i = 0; i < vals.length; i++) {
      if (vals[i] && !bad(vals[i].y)) { sum += vals[i].y; n += 1; }
    }
    if (n < 100) return NaN;
    var avg = sum / n;
    return avg > 0 ? ratioPts(cur / avg) : NaN;
  }

  /* LOWER is better (Joe): sats/$ falls as price rises — invert the ratio */
  function compSats() {
    var usd = (store.get('prices') || {}).USD;
    var s = store.get('priceSeries');
    var vals = s && s.values;
    if (bad(usd) || usd <= 0 || !vals || vals.length < 100) return NaN;
    var cur = 1e8 / usd;
    var sum = 0, n = 0;
    for (var i = 0; i < vals.length; i++) {
      var p = vals[i];
      if (p && !bad(p.y) && p.y > 0) { sum += 1e8 / p.y; n += 1; }
    }
    if (n < 100) return NaN;
    var avg = sum / n;
    return cur > 0 ? ratioPts(avg / cur) : NaN;
  }

  /* past-year growth vs the mean of the 3 PRIOR yearly growth rates */
  function compUtxo() {
    var s = store.get('utxoSeries');
    var vals = s && s.values;
    if (!vals || vals.length < 100) return NaN;
    var lastP = vals[vals.length - 1];
    if (!lastP || bad(lastP.x) || bad(lastP.y)) return NaN;
    var TOL = 45 * 86400;
    var y = [lastP.y];
    for (var k = 1; k <= 4; k++) y.push(seriesAt(vals, lastP.x - k * YEAR_S, TOL));
    var g = [];
    for (var j = 0; j < 4; j++) {
      if (bad(y[j]) || bad(y[j + 1]) || y[j + 1] <= 0) g.push(NaN);
      else g.push((y[j] - y[j + 1]) / y[j + 1]);
    }
    if (bad(g[0]) || bad(g[1]) || bad(g[2]) || bad(g[3])) return NaN;
    var baseline = (g[1] + g[2] + g[3]) / 3;
    /* a non-positive historical baseline can't anchor a ratio — score on
       the sign of current growth alone */
    var r = baseline > 0 ? g[0] / baseline : (g[0] >= 0 ? 1 : 0);
    return ratioPts(r);
  }

  function bandFor(score) {
    for (var i = 0; i < BANDS.length; i++) {
      if (score >= BANDS[i].min) return BANDS[i];
    }
    return BANDS[BANDS.length - 1];
  }

  /* seconds of the stalest feed this strip renders; 0 = nothing stale */
  function staleSeconds() {
    var worst = 0;
    for (var i = 0; i < FEEDS.length; i++) {
      /* a BAKED feed value never refreshes by design — its visible as-of
         line is the honesty mechanism (task-13 rule, same exemption as
         12-nodes.js). Fetch age on a bake measures tab uptime, not
         staleness. A live overwrite carries no baked flag, so the normal
         rule resumes the moment the source self-heals. */
      var v = store.get(FEEDS[i].key);
      if (v && v.baked) continue;
      var age = store.age(FEEDS[i].key);
      if (isFinite(age) && age > 2 * FEEDS[i].intervalS && age > worst) worst = age;
    }
    return worst;
  }

  function renderAll() {
    var pts = [compNodes(), compHash(), compTx(), compSats(), compUtxo()];

    var score = 0, missing = false;
    for (var i = 0; i < pts.length; i++) {
      if (bad(pts[i])) missing = true;
      else score += Math.round(pts[i]);
    }

    if (missing) {
      /* a dash has no width — the bar parks at 0, the pill goes neutral */
      setVal(scoreEl, DASH);
      barEl.style.width = '0%';
      barEl.className = 'bar-fill';
      verdictEl.className = 'pill pill-plain';
      verdictLabel.textContent = DASH;
    } else {
      var band = bandFor(score);
      setVal(scoreEl, fmt.int(score));
      barEl.style.width = score + '%';
      barEl.className = 'bar-fill ' + band.fill;
      verdictEl.className = 'pill ' + band.cls;
      verdictLabel.textContent = band.label;
    }

    var worst = staleSeconds();
    panel.classList.toggle('stale', worst > 0);
    staleTag.hidden = !worst;
    if (worst) staleTag.textContent = 'STALE ' + Math.max(1, Math.round(worst / 60)) + ' MIN';
  }

  store.on('nodes', renderAll);
  store.on('hashrate', renderAll);
  store.on('hashrate3y', renderAll);
  store.on('prices', renderAll);
  store.on('priceSeries', renderAll);
  store.on('txSeries', renderAll);
  store.on('utxoSeries', renderAll);

  setInterval(renderAll, TICK_MS); /* staleness stays honest between the slow polls */
  renderAll(); /* honest loading state before the first poll resolves */
})();
