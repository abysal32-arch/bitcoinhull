/* Bitcoin Hull — Lightning minor card (task 15): public-network capacity,
   value, nodes, channels, Tor share — from mempool.space's lightning
   statistics. Their stats are a dated SNAPSHOT (observed a month behind
   real time), so the snapshot date is always visible, task-13 style; the
   stale tag additionally covers fetch health. Tor CAPACITY share (Clark
   shows it) has no mempool.space endpoint — Tor NODES + their share is
   the honest substitute (gap named in _SHARED.md). */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt;

  var DASH = '—';
  var TICK_MS = 30000;

  var FEEDS = [
    { key: 'lightning', intervalS: 21600 },
    { key: 'prices',    intervalS: 60 }
  ];

  var panel = document.getElementById('panel-lightning');
  var staleTag = panel.querySelector('[data-lightning-stale]');
  var capEl = panel.querySelector('[data-lightning-cap]');
  var asOfEl = panel.querySelector('[data-lightning-asof]');
  var capUsdEl = panel.querySelector('[data-lightning-capusd]');
  var nodesEl = panel.querySelector('[data-lightning-nodes]');
  var chanEl = panel.querySelector('[data-lightning-channels]');
  var torEl = panel.querySelector('[data-lightning-tor]');

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
    var ln = (store.get('lightning') || {}).latest || {};
    var prices = store.get('prices') || {};

    var capBtc = bad(ln.total_capacity) ? NaN : ln.total_capacity / 1e8;
    setVal(capEl, fmt.btc2(capBtc));
    /* snapshot date, not fetch date — the data's own age is the honest one */
    asOfEl.textContent = typeof ln.added === 'string' ? ln.added.slice(0, 10) : DASH;

    setVal(capUsdEl, bad(capBtc) || bad(prices.USD) ? DASH : fmt.usdBig(capBtc * prices.USD));
    setVal(nodesEl, fmt.int(ln.node_count));
    setVal(chanEl, fmt.int(ln.channel_count));
    setVal(torEl, bad(ln.tor_nodes) || bad(ln.node_count) || ln.node_count <= 0
      ? DASH
      : fmt.int(ln.tor_nodes) + ' · ' + fmt.pct(ln.tor_nodes / ln.node_count * 100));

    var worst = staleSeconds();
    panel.classList.toggle('stale', worst > 0);
    staleTag.hidden = !worst;
    if (worst) staleTag.textContent = 'STALE ' + Math.max(1, Math.round(worst / 60)) + ' MIN';
  }

  store.on('lightning', renderAll);
  store.on('prices', renderAll);

  setInterval(renderAll, TICK_MS);
  renderAll();
})();
