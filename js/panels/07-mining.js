/* Bitcoin Hull — mining panel: hashrate hero, difficulty, and the two
   2016-block windows (implied hashrate + realized block time), plus the
   last retarget's actual change. The retarget FORECAST rows moved to the
   Difficulty-retarget panel (task 15). Renders from HULL.store only; a
   30 s tick keeps staleness honest between the slow polls. */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt, hist = HULL.hist;

  var DASH = '—';
  var TICK_MS = 30000;

  /* feeds this panel renders; stale = has data but older than 2× its poll
     interval (never-fetched is the loading state, not stale) */
  var FEEDS = [
    { key: 'hashrate',    intervalS: 300 },
    { key: 'difficulty',  intervalS: 300 },
    { key: 'blocks',      intervalS: 60 },
    { key: 'diffHistory', intervalS: 21600 }
  ];

  var panel = document.getElementById('panel-mining');
  var staleTag = panel.querySelector('[data-mining-stale]');
  var hashEl = panel.querySelector('[data-mining-hashrate]');
  var diffEl = panel.querySelector('[data-mining-diff]');
  var hr2016El = panel.querySelector('[data-mining-hr2016]');
  var lastAdjEl = panel.querySelector('[data-mining-lastadj]');
  var bt2016El = panel.querySelector('[data-mining-bt2016]');

  function setVal(el, text) {
    el.textContent = text;
    el.classList.toggle('loading', text === DASH);
  }

  /* seconds of the stalest feed this panel renders; 0 = nothing stale */
  function staleSeconds() {
    var worst = 0;
    for (var i = 0; i < FEEDS.length; i++) {
      var age = store.age(FEEDS[i].key);
      if (isFinite(age) && age > 2 * FEEDS[i].intervalS && age > worst) worst = age;
    }
    return worst;
  }

  function renderAll() {
    var hr = store.get('hashrate') || {};
    var adj = store.get('difficulty') || {};

    /* hero is the number only — the EH/s unit lives in markup */
    setVal(hashEl, fmt.ehs(hr.currentHashrate));
    setVal(diffEl, fmt.diffT(hr.currentDifficulty));

    /* 2016-block window, both faces of the same coin: the work those
       blocks encode over the time they actually took (hist derives both
       from exact retarget + tip anchors) */
    var ihr = hist.impliedHashrate(2016);
    setVal(hr2016El, fmt.ehs(ihr == null ? NaN : ihr));
    var bt = hist.avgBlockTime(2016);
    setVal(bt2016El, fmt.mmss(bt == null ? NaN : bt));

    /* sign is neutral news, not good/bad — plain ink, sign shown explicitly */
    setVal(lastAdjEl, fmt.pct(adj.previousRetarget, true));

    var worst = staleSeconds();
    panel.classList.toggle('stale', worst > 0);
    staleTag.hidden = !worst;
    if (worst) staleTag.textContent = 'STALE ' + Math.max(1, Math.round(worst / 60)) + ' MIN';
  }

  store.on('hashrate', renderAll);
  store.on('difficulty', renderAll);
  store.on('blocks', renderAll);
  store.on('diffHistory', renderAll);

  setInterval(renderAll, TICK_MS); /* staleness stays honest between polls */
  renderAll(); /* honest loading state before the first poll resolves */
})();
