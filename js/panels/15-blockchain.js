/* Bitcoin Hull — blockchain panel (task 15; height-first per Joe
   2026-07-18): block-height hero, then UTXO-set size, chain size,
   prior-year realized block time. UTXO and chain size come from
   blockchain.info charts (aux third-party, 6 h) — since task 18 both
   prefer a FRESHER feed when it's alive (UTXO: the hourly-resolution
   utxo-count chart; chain size: Blockchair's live scalar, docs-confirmed
   same semantics as the chart = raw block files excl. indexes/undo) and
   fall back to the daily charts otherwise. The fresh feeds are NOT in
   FEEDS: their death degrades honestly to the chart values instead of
   tagging a healthy panel. The baked OP_RETURN row
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

  /* a stale fallback chart nobody is looking at must not STALE-tag the
     panel while its fresh twin drives the row; the tag returns the moment
     the fresh feed ages out and the fallback actually shows */
  function fallbackCovered(key) {
    if (key === 'utxoSeries') return !bad(freshY('utxoHourly', 1800));
    if (key === 'chainSize') {
      var c = store.get('chairStats'), a = store.age('chairStats');
      return !!(c && !bad(c.sizeBytes) && isFinite(a) && a <= 2 * 900);
    }
    return false;
  }

  function staleSeconds() {
    var worst = 0;
    for (var i = 0; i < FEEDS.length; i++) {
      if (fallbackCovered(FEEDS[i].key)) continue;
      var age = store.age(FEEDS[i].key);
      if (isFinite(age) && age > 2 * FEEDS[i].intervalS && age > worst) worst = age;
    }
    return worst;
  }

  /* newest y of `key` if that feed is fresh (2x freshS), else NaN */
  function freshY(key, freshS) {
    var age = store.age(key);
    return isFinite(age) && age <= 2 * freshS ? lastY(key) : NaN;
  }

  function renderAll() {
    var tip = store.get('tipHeight');
    setVal(heightEl, fmt.int(bad(tip) ? NaN : tip));

    var utxoFresh = freshY('utxoHourly', 1800);
    setVal(utxoEl, fmt.int(bad(utxoFresh) ? lastY('utxoSeries') : utxoFresh));

    /* Blockchair live bytes when fresh; else the chart's MB (decimal) */
    var chair = store.get('chairStats');
    var chairAge = store.age('chairStats');
    var gb = NaN;
    if (chair && !bad(chair.sizeBytes) && isFinite(chairAge) && chairAge <= 2 * 900) {
      gb = chair.sizeBytes / 1e9;
    } else {
      var mb = lastY('chainSize');
      if (!bad(mb)) gb = mb / 1000;
    }
    setVal(sizeEl, fmt.gb(gb));

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
  store.on('chairStats', renderAll);
  store.on('utxoHourly', renderAll);

  setInterval(renderAll, TICK_MS);
  renderAll();
})();
