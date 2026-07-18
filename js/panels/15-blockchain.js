/* Bitcoin Hull — blockchain panel (task 15; height-first per Joe
   2026-07-18): block-height hero, then UTXO-set size, chain size,
   prior-year realized block time. UTXO and chain size come from
   blockchain.info charts (aux third-party, 6 h). The baked OP_RETURN row
   retired in task 17: Joe vetoed baked-as-of labels, and 2026-07-18
   research re-confirmed NO live source exists (opreturn.org, the one site
   that had it, died ~May 2026) — no label allowed + no live feed = no
   stat. Renders from HULL.store only. */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt, hist = HULL.hist;

  var DASH = '—';
  var TICK_MS = 30000;

  var FEEDS = [
    { key: 'tipHeight',   intervalS: 60 },
    { key: 'utxoSeries',  intervalS: 21600 },
    { key: 'chainSize',   intervalS: 21600 },
    { key: 'diffHistory', intervalS: 21600 },
    { key: 'blocks',      intervalS: 60 }
  ];

  var panel = document.getElementById('panel-blockchain');
  var staleTag = panel.querySelector('[data-blockchain-stale]');
  var heightEl = panel.querySelector('[data-blockchain-height]');
  var utxoEl = panel.querySelector('[data-blockchain-utxo]');
  var sizeEl = panel.querySelector('[data-blockchain-size]');
  var btYearEl = panel.querySelector('[data-blockchain-btyear]');

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
    var tip = store.get('tipHeight');
    setVal(heightEl, fmt.int(bad(tip) ? NaN : tip));

    setVal(utxoEl, fmt.int(lastY('utxoSeries')));

    /* charts serve MB (decimal) — display GB */
    var mb = lastY('chainSize');
    setVal(sizeEl, fmt.gb(bad(mb) ? NaN : mb / 1000));

    var bt = hist.priorYearBlockTime();
    setVal(btYearEl, fmt.mmss(bt == null ? NaN : bt));

    var worst = staleSeconds();
    panel.classList.toggle('stale', worst > 0);
    staleTag.hidden = !worst;
    if (worst) staleTag.textContent = 'STALE ' + Math.max(1, Math.round(worst / 60)) + ' MIN';
  }

  store.on('tipHeight', renderAll);
  store.on('utxoSeries', renderAll);
  store.on('chainSize', renderAll);
  store.on('diffHistory', renderAll);
  store.on('blocks', renderAll);

  setInterval(renderAll, TICK_MS);
  renderAll();
})();
