/* Bitcoin Hull — chain-tip panel: header height (flash on change), last-6
   block strip, NEXT tile, since-last-block + 24h-avg ticker. Renders from
   HULL.store only; a 30 s tick keeps ages and staleness honest between
   polls. */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt;

  var DASH = '—';
  var TICK_MS = 30000;
  var SLOW_WARN_S = 20 * 60;
  var SLOW_SERIOUS_S = 45 * 60;

  /* feeds this panel renders; stale = has data but older than 2× its poll
     interval (never-fetched is the loading state, not stale) */
  var FEEDS = [
    { key: 'tipHeight',     intervalS: 60 },
    { key: 'blocks',        intervalS: 60 },
    { key: 'mempoolBlocks', intervalS: 30 },
    { key: 'difficulty',    intervalS: 300 }
  ];

  var panel = document.getElementById('panel-chain');
  var staleTag = panel.querySelector('[data-chain-stale]');
  var tipNum = document.querySelector('[data-tip-height]');
  var sinceEl = panel.querySelector('[data-since-block]');
  var sinceTag = panel.querySelector('[data-since-tag]');
  var avgEl = panel.querySelector('[data-avg-interval]');
  var nextFee = panel.querySelector('[data-next-fee]');
  var nextTxs = panel.querySelector('[data-next-txs]');
  var nextVsize = panel.querySelector('[data-next-vsize]');
  var tiles = panel.querySelectorAll('.block-strip .block-tile:not(.block-next)');

  var lastHeight = null;

  function setVal(el, text) {
    el.textContent = text;
    el.classList.toggle('loading', text === DASH);
  }

  /* '2.9' -> '~2.9'; the loading dash passes through untouched */
  function approx(text) { return text === DASH ? text : '~' + text; }

  function renderTip() {
    var h = store.get('tipHeight');
    setVal(tipNum, fmt.int(h));
    if (typeof h === 'number' && isFinite(h) && h !== lastHeight) {
      if (lastHeight !== null) {
        tipNum.classList.remove('flash');
        void tipNum.offsetWidth; /* restart the animation */
        tipNum.classList.add('flash');
      }
      lastHeight = h;
    }
  }

  function renderStrip() {
    var blocks = store.get('blocks') || [];
    for (var i = 0; i < tiles.length; i++) {
      var b = blocks[i];
      var vals = tiles[i].querySelectorAll('.bt-line .val');
      setVal(tiles[i].querySelector('.bt-height'), fmt.int(b ? b.height : NaN));
      setVal(vals[0], approx(fmt.satvb(b && b.extras ? b.extras.medianFee : NaN)));
      setVal(vals[1], fmt.int(b ? b.tx_count : NaN));
      setVal(vals[2], fmt.mb(b ? b.size : NaN));
      tiles[i].querySelector('.bt-age').textContent = fmt.ago(b ? b.timestamp : NaN);
    }
  }

  function renderNext() {
    var mbs = store.get('mempoolBlocks');
    var nb = mbs && mbs.length ? mbs[0] : null;
    setVal(nextFee, approx(fmt.satvb(nb ? nb.medianFee : NaN)));
    setVal(nextTxs, fmt.int(nb ? nb.nTx : NaN));
    setVal(nextVsize, fmt.mb(nb ? nb.blockVSize : NaN));
  }

  function renderSide() {
    var blocks = store.get('blocks');
    var since = blocks && blocks.length
      ? Math.max(0, Date.now() / 1000 - blocks[0].timestamp) : NaN;
    setVal(sinceEl, fmt.dur(since));

    var level = '';
    if (since > SLOW_SERIOUS_S) level = 'since-serious';
    else if (since > SLOW_WARN_S) level = 'since-warn';
    sinceEl.classList.remove('since-warn', 'since-serious');
    sinceTag.classList.remove('since-warn', 'since-serious');
    sinceTag.hidden = !level;
    if (level) {
      sinceEl.classList.add(level);
      sinceTag.classList.add(level);
    }

    var diff = store.get('difficulty');
    setVal(avgEl, fmt.mins(diff ? diff.timeAvg / 1000 : NaN));
  }

  function renderStale() {
    var worst = 0;
    for (var i = 0; i < FEEDS.length; i++) {
      var age = store.age(FEEDS[i].key);
      if (isFinite(age) && age > 2 * FEEDS[i].intervalS && age > worst) worst = age;
    }
    panel.classList.toggle('stale', worst > 0);
    staleTag.hidden = !worst;
    if (worst) staleTag.textContent = 'STALE ' + Math.max(1, Math.round(worst / 60)) + ' MIN';
  }

  function renderAll() {
    renderTip();
    renderStrip();
    renderNext();
    renderSide();
    renderStale();
  }

  store.on('tipHeight', function () { renderTip(); renderStale(); });
  store.on('blocks', function () { renderStrip(); renderSide(); renderStale(); });
  store.on('mempoolBlocks', function () { renderNext(); renderStale(); });
  store.on('difficulty', function () { renderSide(); renderStale(); });

  setInterval(renderAll, TICK_MS); /* ages tick, staleness stays honest */
  renderAll(); /* honest loading state before the first poll resolves */
})();
