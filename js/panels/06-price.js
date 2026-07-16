/* Bitcoin Hull — price panel: USD spot hero, sats per dollar, market cap
   (spot × HULL.supplyAt — computed supply, never fetched). No candles, no
   24h-change theater; a change registers as a dim→normal flash, not a pulse.
   Renders from HULL.store only; a 30 s tick keeps staleness honest between
   polls. */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt;

  var DASH = '—';
  var TICK_MS = 30000;

  /* feeds this panel renders; stale = has data but older than 2× its poll
     interval (never-fetched is the loading state, not stale) */
  var FEEDS = [
    { key: 'prices',    intervalS: 60 },
    { key: 'tipHeight', intervalS: 60 } /* market cap = spot × supply(tip) */
  ];

  var panel = document.getElementById('panel-price');
  var staleTag = panel.querySelector('[data-price-stale]');
  var usdEl = panel.querySelector('[data-price-usd]');
  var satsEl = panel.querySelector('[data-price-sats]');
  var mcapEl = panel.querySelector('[data-price-mcap]');

  var lastUsd = null;

  function setVal(el, text) {
    el.textContent = text;
    el.classList.toggle('loading', text === DASH);
  }

  /* same guard HULL.fmt applies: a real, usable number and nothing else */
  function bad(n) { return typeof n !== 'number' || !isFinite(n); }

  /* USD spot, or NaN — a zero/negative quote is an API lie, not a price */
  function usdSpot() {
    var p = store.get('prices') || {};
    return bad(p.USD) || p.USD <= 0 ? NaN : p.USD;
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
    var usd = usdSpot();

    /* hero is the number only — the raised $ lives in markup (hero-cur),
       the same unit-in-markup convention as the vMB and EH/s heroes */
    setVal(usdEl, fmt.int(usd));

    if (!bad(usd) && usd !== lastUsd) {
      if (lastUsd !== null) {
        usdEl.classList.remove('flash-dim');
        void usdEl.offsetWidth; /* restart the animation */
        usdEl.classList.add('flash-dim');
      }
      lastUsd = usd;
    }

    setVal(satsEl, fmt.int(bad(usd) ? NaN : 1e8 / usd));

    /* NaN from either input rides through fmt.usd to the honest dash */
    setVal(mcapEl, fmt.usd(usd * HULL.supplyAt(store.get('tipHeight'))));

    var worst = staleSeconds();
    panel.classList.toggle('stale', worst > 0);
    staleTag.hidden = !worst;
    if (worst) staleTag.textContent = 'STALE ' + Math.max(1, Math.round(worst / 60)) + ' MIN';
  }

  store.on('prices', renderAll);
  store.on('tipHeight', renderAll);

  setInterval(renderAll, TICK_MS); /* staleness stays honest between polls */
  renderAll(); /* honest loading state before the first poll resolves */
})();
