/* Bitcoin Hull — corporate-treasuries minor card (task 13; LIVE since
   task 17, Joe 2026-07-18): total BTC held by public companies from
   CoinGecko's keyless public_treasury endpoint (browser-CORS-verified,
   single ACAO header, server-side refresh ~5 min, polled hourly as an aux
   third-party feed). USD value and share of supply still compute from OUR
   price feed + exact supply helper so they track between polls. All three
   surfaces carry the standard 2×-interval stale treatment — no bake, no
   as-of line, no exemptions.
   Source note (2026-07-18 research, adversarially corroborated): CoinGecko
   ~1.29M BTC agrees with bitcointreasuries.net itself, bitbo.io, and press
   aggregates (all 1.2–1.3M, #1 holder identical); the retired task-13 bake
   (2.29M) matched no current category and looks to have been a misread. */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt;

  var DASH = '—';
  var TICK_MS = 30000;

  var FEEDS = [
    { key: 'treasuries', intervalS: 3600 },
    { key: 'prices',     intervalS: 60 },
    { key: 'tipHeight',  intervalS: 60 }
  ];

  var panel = document.getElementById('panel-treasuries');
  var staleTag = panel.querySelector('[data-treasuries-stale]');
  var btcEl = panel.querySelector('[data-treasuries-btc]');
  var companiesEl = panel.querySelector('[data-treasuries-companies]');
  var valueEl = panel.querySelector('[data-treasuries-value]');
  var pctEl = panel.querySelector('[data-treasuries-pct]');

  function setVal(el, text) {
    el.textContent = text;
    el.classList.toggle('loading', text === DASH);
  }

  function bad(n) { return typeof n !== 'number' || !isFinite(n); }

  function staleSeconds() {
    var worst = 0;
    for (var i = 0; i < FEEDS.length; i++) {
      var age = store.age(FEEDS[i].key);
      if (isFinite(age) && age > 2 * FEEDS[i].intervalS && age > worst) worst = age;
    }
    return worst;
  }

  function renderAll() {
    var t = store.get('treasuries') || {};
    var btc = bad(t.btc) ? NaN : t.btc;
    setVal(btcEl, fmt.int(btc));
    setVal(companiesEl, fmt.int(t.companies));

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

  store.on('treasuries', renderAll);
  store.on('prices', renderAll);
  store.on('tipHeight', renderAll);

  setInterval(renderAll, TICK_MS); /* staleness appears without a store event */
  renderAll();
})();
