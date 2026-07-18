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
   its stat instead of drifting. The score is the SUM OF THE ROUNDED rows
   so the breakdown always adds up; any missing input → that row AND the
   headline dash (no fabricated totals). */
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
  var rowEls = {
    nodes: { val: panel.querySelector('[data-int-nodes]'), cmp: panel.querySelector('[data-int-nodes-cmp]') },
    hash:  { val: panel.querySelector('[data-int-hash]'),  cmp: panel.querySelector('[data-int-hash-cmp]') },
    tx:    { val: panel.querySelector('[data-int-tx]'),    cmp: panel.querySelector('[data-int-tx-cmp]') },
    sats:  { val: panel.querySelector('[data-int-sats]'),  cmp: panel.querySelector('[data-int-sats-cmp]') },
    utxo:  { val: panel.querySelector('[data-int-utxo]'),  cmp: panel.querySelector('[data-int-utxo-cmp]') }
  };

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

  /* {pts, cmp} for a healthy stat, or null while an input is missing */
  function compNodes() {
    var v = store.get('nodes');
    if (!v || bad(v.total) || !v.rows || v.rows.length < 90) return null;
    var from = v.ts - 3 * YEAR_S;
    var sum = 0, n = 0;
    for (var i = 0; i < v.rows.length; i++) {
      var r = v.rows[i];
      if (r && !bad(r.total) && r.ts >= from) { sum += r.total; n += 1; }
    }
    if (n < 90) return null;
    var avg = sum / n;
    return avg > 0 ? { pts: ratioPts(v.total / avg),
                       cmp: fmt.int(v.total) + ' vs ' + fmt.int(avg) + ' avg' } : null;
  }

  function compHash() {
    var hr = (store.get('hashrate') || {}).currentHashrate;
    var h3y = store.get('hashrate3y');
    var series = h3y && h3y.hashrates;
    if (bad(hr) || hr < 0 || !series || series.length < 300) return null;
    var sum = 0, n = 0;
    for (var i = 0; i < series.length; i++) {
      var p = series[i];
      if (p && !bad(p.avgHashrate)) { sum += p.avgHashrate; n += 1; }
    }
    if (n < 300) return null;
    var avg = sum / n;
    return avg > 0 ? { pts: ratioPts(hr / avg),
                       cmp: fmt.ehs(hr) + ' vs ' + fmt.ehs(avg) + ' EH/s avg' } : null;
  }

  function compTx() {
    var s = store.get('txSeries');
    var vals = s && s.values;
    if (!vals || vals.length < 100) return null;
    var cur = vals[vals.length - 1] && vals[vals.length - 1].y;
    if (bad(cur)) return null;
    var sum = 0, n = 0;
    for (var i = 0; i < vals.length; i++) {
      if (vals[i] && !bad(vals[i].y)) { sum += vals[i].y; n += 1; }
    }
    if (n < 100) return null;
    var avg = sum / n;
    return avg > 0 ? { pts: ratioPts(cur / avg),
                       cmp: fmt.int(cur) + ' vs ' + fmt.int(avg) + ' avg' } : null;
  }

  /* LOWER is better (Joe): sats/$ falls as price rises — invert the ratio */
  function compSats() {
    var usd = (store.get('prices') || {}).USD;
    var s = store.get('priceSeries');
    var vals = s && s.values;
    if (bad(usd) || usd <= 0 || !vals || vals.length < 100) return null;
    var cur = 1e8 / usd;
    var sum = 0, n = 0;
    for (var i = 0; i < vals.length; i++) {
      var p = vals[i];
      if (p && !bad(p.y) && p.y > 0) { sum += 1e8 / p.y; n += 1; }
    }
    if (n < 100) return null;
    var avg = sum / n;
    return cur > 0 ? { pts: ratioPts(avg / cur),
                       cmp: fmt.int(cur) + ' vs ' + fmt.int(avg) + ' sats avg' } : null;
  }

  /* past-year growth vs the mean of the 3 PRIOR yearly growth rates */
  function compUtxo() {
    var s = store.get('utxoSeries');
    var vals = s && s.values;
    if (!vals || vals.length < 100) return null;
    var lastP = vals[vals.length - 1];
    if (!lastP || bad(lastP.x) || bad(lastP.y)) return null;
    var TOL = 45 * 86400;
    var y = [lastP.y];
    for (var k = 1; k <= 4; k++) y.push(seriesAt(vals, lastP.x - k * YEAR_S, TOL));
    var g = [];
    for (var j = 0; j < 4; j++) {
      if (bad(y[j]) || bad(y[j + 1]) || y[j + 1] <= 0) g.push(NaN);
      else g.push((y[j] - y[j + 1]) / y[j + 1]);
    }
    if (bad(g[0]) || bad(g[1]) || bad(g[2]) || bad(g[3])) return null;
    var baseline = (g[1] + g[2] + g[3]) / 3;
    /* a non-positive historical baseline can't anchor a ratio — score on
       the sign of current growth alone */
    var r = baseline > 0 ? g[0] / baseline : (g[0] >= 0 ? 1 : 0);
    return { pts: ratioPts(r),
             cmp: fmt.pct(g[0] * 100) + ' vs ' + fmt.pct(baseline * 100) + ' avg/yr' };
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
    var parts = [
      { el: rowEls.nodes, c: compNodes() },
      { el: rowEls.hash,  c: compHash()  },
      { el: rowEls.tx,    c: compTx()    },
      { el: rowEls.sats,  c: compSats()  },
      { el: rowEls.utxo,  c: compUtxo()  }
    ];

    var score = 0, missing = false;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p.c || bad(p.c.pts)) {
        missing = true;
        setVal(p.el.val, DASH);
        p.el.cmp.textContent = '';
      } else {
        score += Math.round(p.c.pts); /* fmt.int rounds the same way below */
        setVal(p.el.val, fmt.int(p.c.pts) + '/20');
        p.el.cmp.textContent = p.c.cmp;
      }
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
