/* Bitcoin Hull — fees panel: recommended tiers + the Hull's own plain-English
   fee verdict. Renders from HULL.store only; a 30 s tick keeps staleness
   honest between polls. */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt;

  var DASH = '—';
  var TICK_MS = 30000;
  var BLOCK_VSIZE = 1e6; /* one block of room, vB — protocol, not judgment */

  /* THE VERDICT BANDS — sat/vB ceilings on fastestFee. These are JUDGMENT
     VALUES, not protocol constants: they encode "what does this fee level
     feel like to someone spending today", and Joe may retune them without
     touching anything else in this file. First band the fee falls at or
     under wins; the last is the catch-all. Label + tint always travel
     together, and the pill always carries text — never color alone. */
  var BANDS = [
    { max: 5,        label: 'CALM',   cls: 'pill-good' },
    { max: 20,       label: 'NORMAL', cls: 'pill-plain' },
    { max: 80,       label: 'BUSY',   cls: 'pill-warn' },
    { max: 200,      label: 'SURGE',  cls: 'pill-serious' },
    { max: Infinity, label: 'MAYHEM', cls: 'pill-critical' }
  ];

  /* feeds this panel renders; stale = has data but older than 2× its poll
     interval (never-fetched is the loading state, not stale) */
  var FEEDS = [
    { key: 'fees',    intervalS: 30 },
    { key: 'mempool', intervalS: 30 }
  ];

  var panel = document.getElementById('panel-fees');
  var staleTag = panel.querySelector('[data-fees-stale]');
  var verdictEl = panel.querySelector('[data-fee-verdict]');
  var verdictLabel = panel.querySelector('[data-fee-verdict-label]');
  var fastEl = panel.querySelector('[data-fee-fast]');
  var subEl = panel.querySelector('[data-fee-sub]');
  var halfEl = panel.querySelector('[data-fee-half]');
  var hourEl = panel.querySelector('[data-fee-hour]');
  var econEl = panel.querySelector('[data-fee-econ]');
  var minEl = panel.querySelector('[data-fee-min]');

  function setVal(el, text) {
    el.textContent = text;
    el.classList.toggle('loading', text === DASH);
  }

  /* same guard HULL.fmt applies: a real, usable number and nothing else */
  function bad(n) { return typeof n !== 'number' || !isFinite(n); }

  function bandFor(fee) {
    for (var i = 0; i < BANDS.length; i++) {
      if (fee <= BANDS[i].max) return BANDS[i];
    }
    return BANDS[BANDS.length - 1];
  }

  /* The cheapest fee rate that still buys a seat in the next block: walk the
     mempool's fee histogram (descending [satVb, vsize] pairs) down until a
     block's worth of vB is spoken for. If the whole backlog fits, nothing is
     competing and there is no clearing rate to quote. */
  function clearRate(mp) {
    var h = mp && mp.fee_histogram;
    if (!h || !h.length) return { rate: NaN, clearsAll: false };
    var acc = 0;
    for (var i = 0; i < h.length; i++) {
      var pair = h[i];
      /* a malformed pair means we can't trust the walk — say nothing rather
         than mistake a broken histogram for an empty backlog */
      if (!pair || bad(pair[0]) || bad(pair[1])) {
        return { rate: NaN, clearsAll: false };
      }
      acc += pair[1];
      if (acc >= BLOCK_VSIZE) return { rate: pair[0], clearsAll: false };
    }
    return { rate: NaN, clearsAll: true };
  }

  function renderTiers() {
    var f = store.get('fees') || {};
    setVal(fastEl, fmt.satvb(f.fastestFee));
    setVal(halfEl, fmt.satvb(f.halfHourFee));
    setVal(hourEl, fmt.satvb(f.hourFee));
    setVal(econEl, fmt.satvb(f.economyFee));
    setVal(minEl, fmt.satvb(f.minimumFee));
  }

  function renderSub() {
    var cr = clearRate(store.get('mempool'));
    var text = DASH;
    if (cr.clearsAll) text = 'next block clears the whole backlog';
    else if (!bad(cr.rate)) text = 'next block clears at ~' + fmt.satvb(cr.rate) + ' sat/vB';
    setVal(subEl, text);
  }

  /* A verdict is a claim about right now, so stale data buys silence, not a
     guess: dash + the neutral pill until the feed is trustworthy again. */
  function renderVerdict(stale) {
    var fast = (store.get('fees') || {}).fastestFee;
    var band = (!stale && !bad(fast)) ? bandFor(fast) : null;
    verdictEl.className = 'pill ' + (band ? band.cls : 'pill-plain');
    verdictLabel.textContent = band ? band.label : DASH;
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
    var worst = staleSeconds();
    renderTiers();
    renderSub();
    renderVerdict(worst > 0);
    panel.classList.toggle('stale', worst > 0);
    staleTag.hidden = !worst;
    if (worst) staleTag.textContent = 'STALE ' + Math.max(1, Math.round(worst / 60)) + ' MIN';
  }

  store.on('fees', renderAll);
  store.on('mempool', renderAll);

  setInterval(renderAll, TICK_MS); /* staleness stays honest between polls */
  renderAll(); /* honest loading state before the first poll resolves */
})();
