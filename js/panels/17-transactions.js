/* Bitcoin Hull — transactions panel (task 17, Joe 2026-07-18): the
   Clark-catalog transaction stats, from blockchain.info charts (aux
   third-party origin, 6 h cadence, CORS via cors=true):
     hero        cumulative all-time tx count (n-transactions-total,
                 newest point of a 30-day window — the chart updates daily)
     count 30d   sum of the exact daily series (n-transactions, ~30 points)
     rate 30d    count / the series' own covered seconds
     avg/block   count / blocks actually mined over that SAME window —
                 heights from HULL.hist at the series' own edge dates
                 (feed-anchored, never the wall clock)
   The three 30-day rows demand a complete, fully-numeric series; any gap
   dashes all three rather than quote a partial window as a full one. */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt, hist = HULL.hist;

  var DASH = '—';
  var TICK_MS = 30000;
  var DAY_S = 86400;

  var FEEDS = [
    { key: 'txTotal',     intervalS: 21600 },
    { key: 'tx30d',       intervalS: 21600 },
    { key: 'diffHistory', intervalS: 21600 },
    { key: 'blocks',      intervalS: 60 }
  ];

  var panel = document.getElementById('panel-transactions');
  var staleTag = panel.querySelector('[data-transactions-stale]');
  var totalEl = panel.querySelector('[data-tx-total]');
  var rateEl = panel.querySelector('[data-tx-rate]');
  var countEl = panel.querySelector('[data-tx-count]');
  var perBlockEl = panel.querySelector('[data-tx-perblock]');

  function setVal(el, text) {
    el.textContent = text;
    el.classList.toggle('loading', text === DASH);
  }

  function bad(n) { return typeof n !== 'number' || !isFinite(n); }

  /* newest y of a blockchain.info charts payload ({values:[{x,y}...]}) */
  function lastY(key) {
    var v = store.get(key);
    var vals = v && v.values;
    if (!vals || !vals.length) return NaN;
    var y = vals[vals.length - 1] && vals[vals.length - 1].y;
    return bad(y) ? NaN : y;
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
    setVal(totalEl, fmt.int(lastY('txTotal')));

    var s = store.get('tx30d');
    var vals = s && s.values;
    var count = NaN, spanS = NaN, hStart = null, hEnd = null;
    if (vals && vals.length >= 25) { /* tolerate the API trimming a few days */
      var sum = 0, ok = true;
      for (var i = 0; i < vals.length; i++) {
        var p = vals[i];
        if (!p || bad(p.x) || bad(p.y)) { ok = false; break; }
        sum += p.y;
      }
      if (ok) {
        count = sum;
        /* each x stamps the START of its day — the window runs to lastX+1d */
        spanS = vals[vals.length - 1].x + DAY_S - vals[0].x;
        hStart = hist.heightAtTs(vals[0].x);
        hEnd = hist.heightAtTs(vals[vals.length - 1].x + DAY_S);
      }
    }
    setVal(countEl, fmt.int(count));
    setVal(rateEl, bad(count) || bad(spanS) || spanS <= 0 ? DASH : fmt.txs(count / spanS));

    var blocksIn = (hStart != null && hEnd != null) ? Math.round(hEnd - hStart) : NaN;
    setVal(perBlockEl, bad(count) || bad(blocksIn) || blocksIn <= 0
      ? DASH : fmt.int(count / blocksIn));

    var worst = staleSeconds();
    panel.classList.toggle('stale', worst > 0);
    staleTag.hidden = !worst;
    if (worst) staleTag.textContent = 'STALE ' + Math.max(1, Math.round(worst / 60)) + ' MIN';
  }

  store.on('txTotal', renderAll);
  store.on('tx30d', renderAll);
  store.on('diffHistory', renderAll);
  store.on('blocks', renderAll);

  setInterval(renderAll, TICK_MS); /* staleness stays honest between slow polls */
  renderAll(); /* honest loading state before the first poll resolves */
})();
