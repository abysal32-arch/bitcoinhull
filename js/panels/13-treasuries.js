/* Bitcoin Hull — corporate-treasuries minor card (task 13, minor tier per
   Joe 2026-07-17): baked public-company BTC total; USD value and share of
   supply are computed LIVE from the price feed + exact supply helper, so
   they track between monthly re-bakes. Honesty split (review catch,
   2026-07-17): the always-visible as-of date vouches for the BAKED BTC
   total only (no stale tag for the bake — task-13 rule), while the STALE
   tag covers the live-derived Value / Share-of-supply rows' feeds, exactly
   like the sibling Lightning card. */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt;

  var DASH = '—';
  var TICK_MS = 30000;

  /* the LIVE feeds the derived rows render from; the baked total is exempt */
  var FEEDS = [
    { key: 'prices',    intervalS: 60 },
    { key: 'tipHeight', intervalS: 60 }
  ];

  var panel = document.getElementById('panel-treasuries');
  var staleTag = panel.querySelector('[data-treasuries-stale]');
  var btcEl = panel.querySelector('[data-treasuries-btc]');
  var asOfEl = panel.querySelector('[data-treasuries-asof]');
  var valueEl = panel.querySelector('[data-treasuries-value]');
  var pctEl = panel.querySelector('[data-treasuries-pct]');

  function setVal(el, text) {
    el.textContent = text;
    el.classList.toggle('loading', text === DASH);
  }

  function bad(n) { return typeof n !== 'number' || !isFinite(n); }

  /* seconds of the stalest LIVE feed the derived rows use; 0 = fresh */
  function staleSeconds() {
    var worst = 0;
    for (var i = 0; i < FEEDS.length; i++) {
      var age = store.age(FEEDS[i].key);
      if (isFinite(age) && age > 2 * FEEDS[i].intervalS && age > worst) worst = age;
    }
    return worst;
  }

  function renderAll() {
    var t = HULL.baked && HULL.baked.treasuries;
    var btc = t ? t.totalBtc : NaN;
    setVal(btcEl, fmt.int(btc));
    asOfEl.textContent = t ? t.asOf : DASH;

    var prices = store.get('prices') || {};
    setVal(valueEl, bad(btc) || bad(prices.USD) ? DASH : fmt.usdBig(btc * prices.USD));

    var tip = store.get('tipHeight');
    var issued = bad(tip) ? NaN : HULL.supplyAt(tip);
    setVal(pctEl, bad(btc) || bad(issued) || issued <= 0
      ? DASH : fmt.pct(btc / issued * 100, false, 2));

    var worst = staleSeconds();
    panel.classList.toggle('stale', worst > 0);
    staleTag.hidden = !worst;
    if (worst) staleTag.textContent = 'STALE ' + Math.max(1, Math.round(worst / 60)) + ' MIN';
  }

  store.on('prices', renderAll);
  store.on('tipHeight', renderAll);

  setInterval(renderAll, TICK_MS); /* staleness appears without a store event */
  renderAll();
})();
