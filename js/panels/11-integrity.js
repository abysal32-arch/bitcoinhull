/* Bitcoin Hull — Bitcoin's Hull Integrity (recomposed per Joe
   2026-07-17; dropdown + UTXO metric reworked per Joe 2026-07-18,
   task 21): five structural stats, 20 points each under the hood — the
   dropdown shows each stat's CURRENT vs 3-YEAR-AVERAGE values and
   deliberately does NOT state the per-stat weighting (Joe):
     nodes      /20  Luke-estimate total vs 3-yr avg of the same series
     hashpower  /20  live hashrate vs 3-yr avg (mempool.space 3y series)
     tx/day     /20  newest daily tx count vs 3-yr avg (blockchain.info)
     sats per $ /20  LOWER is better (Joe) — ratio inverted
     UTXO growth/20  REDEFINED (Joe 2026-07-18): growth over the
                     trailing 2016 blocks (one epoch, tip-anchored via
                     HULL.hist) vs the average per-epoch growth over the
                     last 3 years — LOWER is better (a bloating set is
                     not health); shrinking set = full marks
   Within-stat curve: points = 20 × clamp of (ratio − 0.5)/0.5 — at half
   the 3-yr average → 0, at-or-above → full 20 (inverted metrics feed
   the reciprocal ratio, so at-or-better-than-average = full 20). All
   inputs are FEED-derived (averages anchored on the data's own dates,
   never the wall clock), so a stalled feed freezes its stat instead of
   drifting. Score = SUM of per-stat ROUNDED points; any missing input →
   that row AND the headline dash (no fabricated totals). */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt, hist = HULL.hist;

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
    { key: 'utxoSeries',  intervalS: 21600 },
    /* task 21: the epoch-anchored UTXO metric reads these two as well */
    { key: 'blocks',      intervalS: 60 },
    { key: 'diffHistory', intervalS: 21600 }
  ];

  var panel = document.getElementById('panel-integrity');
  var staleTag = panel.querySelector('[data-integrity-stale]');
  var scoreEl = panel.querySelector('[data-integrity-score]');
  var barEl = panel.querySelector('[data-integrity-bar]');
  var verdictEl = panel.querySelector('[data-integrity-verdict]');
  var verdictLabel = panel.querySelector('[data-integrity-verdict-label]');
  var rowEls = {
    nodes: panel.querySelector('[data-int-nodes]'),
    hash:  panel.querySelector('[data-int-hash]'),
    tx:    panel.querySelector('[data-int-tx]'),
    sats:  panel.querySelector('[data-int-sats]'),
    utxo:  panel.querySelector('[data-int-utxo]')
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

  /* {pts, cmp} for a healthy stat (cmp = "now vs 3-yr avg" display text,
     NO points — Joe doesn't want the weighting stated), null while an
     input is missing */
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
    if (!(avg > 0)) return null;
    return { pts: ratioPts(v.total / avg),
             cmp: fmt.int(v.total) + ' now · ' + fmt.int(avg) + ' 3-yr avg' };
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
    if (!(avg > 0)) return null;
    return { pts: ratioPts(hr / avg),
             cmp: fmt.ehs(hr) + ' EH/s now · ' + fmt.ehs(avg) + ' 3-yr avg' };
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
    if (!(avg > 0)) return null;
    return { pts: ratioPts(cur / avg),
             cmp: fmt.int(cur) + '/day now · ' + fmt.int(avg) + ' 3-yr avg' };
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
    if (!(cur > 0)) return null;
    return { pts: ratioPts(avg / cur),
             cmp: fmt.int(cur) + ' now · ' + fmt.int(avg) + ' 3-yr avg' };
  }

  /* REDEFINED (Joe 2026-07-18): UTXO-set growth over the trailing 2016
     blocks (one epoch, tip-anchored via HULL.hist) vs the average
     per-epoch growth over the last 3 years — LOWER is better (a
     bloating set is not health). Shrinking set = full marks; growing
     at the historical average = full marks fade begins; at 2× the
     average pace = 0 (the shared curve on the reciprocal ratio). */
  function compUtxo() {
    var s = store.get('utxoSeries');
    var vals = s && s.values;
    var blocks = store.get('blocks');
    if (!vals || vals.length < 100 || !blocks || !blocks.length) return null;
    var tip = blocks[0];
    if (!tip || bad(tip.height) || bad(tip.timestamp)) return null;
    var lastP = vals[vals.length - 1];
    if (!lastP || bad(lastP.x) || bad(lastP.y)) return null;

    var TOL_EPOCH = 4 * 86400, TOL_3Y = 45 * 86400;
    var tsEpoch = hist.tsAtHeight(tip.height - 2016);
    if (tsEpoch == null) return null;
    var uEpoch = seriesAt(vals, tsEpoch, TOL_EPOCH);
    if (bad(uEpoch) || uEpoch <= 0) return null;
    var gCur = (lastP.y - uEpoch) / uEpoch;

    var u3y = seriesAt(vals, lastP.x - 3 * YEAR_S, TOL_3Y);
    if (bad(u3y) || u3y <= 0) return null;
    var h3y = hist.heightAtTs(tip.timestamp - 3 * YEAR_S);
    if (h3y == null || tip.height - h3y <= 0) return null;
    var epochs = (tip.height - h3y) / 2016;
    var gAvg = ((lastP.y - u3y) / u3y) / epochs;

    var pts;
    if (gAvg > 0) pts = gCur <= 0 ? 20 : ratioPts(gAvg / gCur);
    /* historically-shrinking baseline: match-or-beat the shrink = full;
       still shrinking but slower = half credit; growing = 0 */
    else pts = gCur <= gAvg ? 20 : (gCur <= 0 ? 10 : 0);
    return { pts: pts,
             cmp: fmt.pct(gCur * 100, true, 2) + ' this epoch · ' +
                  fmt.pct(gAvg * 100, true, 2) + '/epoch 3-yr avg' };
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
        setVal(p.el, DASH);
      } else {
        score += Math.round(p.c.pts);
        setVal(p.el, p.c.cmp);
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
  store.on('blocks', renderAll);
  store.on('diffHistory', renderAll);

  setInterval(renderAll, TICK_MS); /* staleness stays honest between the slow polls */
  renderAll(); /* honest loading state before the first poll resolves */
})();
