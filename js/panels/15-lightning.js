/* Bitcoin Hull — Lightning card (task 15, fresh-preferred since task 28):
   public-network capacity, value, nodes, channels, Tor share. The data is
   a dated SNAPSHOT and the snapshot date is always visible, task-13 style;
   the stale tag additionally covers fetch health. Two feeds carry the
   identical mempool-API payload: mempool.emzy.de ('lightningFresh', daily
   indexer, healthy) and mempool.space ('lightning', pipeline stalled since
   mid-June 2026). The panel renders whichever ALIVE feed holds the newest
   `added` date, so it self-heals in either direction with zero code churn.
   Tor CAPACITY share (Clark shows it) has no mempool endpoint — Tor NODES
   + their share is the honest substitute (gap named in _SHARED.md). */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt;

  var DASH = '—';
  var TICK_MS = 30000;
  var LN_INTERVAL_S = 21600;

  /* 'lightningFresh' is deliberately NOT here — the fresh feed's death must
     never tag a panel that silently falls back (task-18 chairStats rule);
     the 'lightning' key is skipped while the fresh feed covers (task-23). */
  var FEEDS = [
    { key: 'lightning', intervalS: LN_INTERVAL_S },
    { key: 'prices',    intervalS: 60 }
  ];

  var panel = document.getElementById('panel-lightning');
  var staleTag = panel.querySelector('[data-lightning-stale]');
  var capEl = panel.querySelector('[data-lightning-cap]');
  var srcEl = panel.querySelector('[data-lightning-src]');
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

  /* snapshot's own date (ms) — NaN for anything unrenderable */
  function snapshotTime(v) {
    var latest = (v || {}).latest;
    var t = latest && typeof latest.added === 'string' ? Date.parse(latest.added) : NaN;
    return isFinite(t) ? t : NaN;
  }

  /* task 28: pass 1 considers only feeds whose FETCH is alive (age ≤ 2×
     interval — the task-18 fresh-preferred rule) and takes the newest
     `added` among them; pass 2 (nothing alive) takes the newest snapshot
     ever stored, so the last data keeps rendering under the stale tag.
     freshCovers = the emzy feed is alive and renderable, which by
     construction means the display never depends on a stalled-out
     mempool.space fetch — the staleness skip below keys off it. */
  function pickLn() {
    var cands = [
      { v: store.get('lightningFresh'), age: store.age('lightningFresh') },
      { v: store.get('lightning'),      age: store.age('lightning') }
    ];
    var best = null, bestT = -1, bestIdx = 0, freshCovers = false, pass, i, t, alive;
    for (pass = 0; pass < 2 && !best; pass++) {
      for (i = 0; i < cands.length; i++) {
        t = snapshotTime(cands[i].v);
        if (!isFinite(t)) continue;
        alive = isFinite(cands[i].age) && cands[i].age <= 2 * LN_INTERVAL_S;
        if (pass === 0 && !alive) continue;
        if (pass === 0 && i === 0) freshCovers = true;
        if (t > bestT) { bestT = t; best = cands[i].v; bestIdx = i; }
      }
    }
    return { latest: (best || {}).latest || {}, freshCovers: freshCovers,
             fromFresh: bestIdx === 0 };
  }

  function staleSeconds(picked) {
    var worst = 0;
    for (var i = 0; i < FEEDS.length; i++) {
      if (FEEDS[i].key === 'lightning' && picked.freshCovers) continue;
      var age = store.age(FEEDS[i].key);
      if (isFinite(age) && age > 2 * FEEDS[i].intervalS && age > worst) worst = age;
    }
    /* task-28 review fix: the fresh feed stays out of FEEDS (while NOT
       rendered its death falls back silently, task-18 rule) — but whenever
       it IS the rendered feed its fetch age must be judged like any other
       rendered key (panel contract), else a dead emzy pipeline renders
       untagged forever once mempool.space holds nothing renderable. An
       ALIVE fresh feed never trips this (alive = age ≤ the same bar). */
    if (picked.fromFresh) {
      var fAge = store.age('lightningFresh');
      if (isFinite(fAge) && fAge > 2 * LN_INTERVAL_S && fAge > worst) worst = fAge;
    }
    return worst;
  }

  function renderAll() {
    var picked = pickLn();
    var ln = picked.latest;
    var prices = store.get('prices') || {};

    var capBtc = bad(ln.total_capacity) ? NaN : ln.total_capacity / 1e8;
    setVal(capEl, fmt.btc2(capBtc));
    /* snapshot date, not fetch date — the data's own age is the honest one;
       the credit anchor names whichever feed is actually rendering */
    asOfEl.textContent = typeof ln.added === 'string' ? ln.added.slice(0, 10) : DASH;
    srcEl.textContent = picked.fromFresh ? 'emzy.de' : 'mempool.space';
    srcEl.href = picked.fromFresh ? 'https://mempool.emzy.de' : 'https://mempool.space/lightning';

    setVal(capUsdEl, bad(capBtc) || bad(prices.USD) ? DASH : fmt.usdBig(capBtc * prices.USD));
    setVal(nodesEl, fmt.int(ln.node_count));
    setVal(chanEl, fmt.int(ln.channel_count));
    setVal(torEl, bad(ln.tor_nodes) || bad(ln.node_count) || ln.node_count <= 0
      ? DASH
      : fmt.int(ln.tor_nodes) + ' · ' + fmt.pct(ln.tor_nodes / ln.node_count * 100));

    var worst = staleSeconds(picked);
    panel.classList.toggle('stale', worst > 0);
    staleTag.hidden = !worst;
    if (worst) staleTag.textContent = 'STALE ' + Math.max(1, Math.round(worst / 60)) + ' MIN';
  }

  store.on('lightning', renderAll);
  store.on('lightningFresh', renderAll);
  store.on('prices', renderAll);

  setInterval(renderAll, TICK_MS);
  renderAll();
})();
