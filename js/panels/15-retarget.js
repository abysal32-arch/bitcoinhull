/* Bitcoin Hull — difficulty-retarget panel (task 15): the forecast face of
   mining — blocks/date until the next retarget, estimated change, this
   epoch's realized block time, epoch number + progress. Renders from
   HULL.store only; a 30 s tick keeps staleness honest. */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt;

  var DASH = '—';
  var TICK_MS = 30000;
  var EPOCH_BLOCKS = 2016;

  var FEEDS = [
    { key: 'difficulty', intervalS: 300 },
    { key: 'tipHeight',  intervalS: 60 }
  ];

  var panel = document.getElementById('panel-retarget');
  var staleTag = panel.querySelector('[data-retarget-stale]');
  var blocksEl = panel.querySelector('[data-retarget-blocks]');
  var dateEl = panel.querySelector('[data-retarget-date]');
  var estEl = panel.querySelector('[data-retarget-est]');
  var btEl = panel.querySelector('[data-retarget-bt]');
  var epochEl = panel.querySelector('[data-retarget-epoch]');
  var barEl = panel.querySelector('[data-retarget-bar]');
  var pctEl = panel.querySelector('[data-retarget-pct]');

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
    var adj = store.get('difficulty') || {};
    var tip = store.get('tipHeight');

    setVal(blocksEl, fmt.int(adj.remainingBlocks));
    /* estimatedRetargetDate is unix MILLISECONDS (same payload the mining
       panel verified in task 07) */
    setVal(dateEl, fmt.dateLong(adj.estimatedRetargetDate));
    setVal(estEl, fmt.pct(adj.difficultyChange, true));
    /* timeAvg is a ms interval — realized mean block time this epoch */
    setVal(btEl, fmt.mmss(bad(adj.timeAvg) ? NaN : adj.timeAvg / 1000));

    /* Clark counts epochs 1-based: height 958,438 sits in epoch 476 */
    setVal(epochEl, bad(tip) ? DASH : fmt.int(Math.floor(tip / EPOCH_BLOCKS) + 1));

    /* bar width and printed % come from the SAME formatted string (house
       rule from task 07); on bad input the bar parks at 0, text dashes */
    var p = bad(adj.progressPercent) ? NaN : Math.min(100, Math.max(0, adj.progressPercent));
    var pText = fmt.pct(p);
    setVal(pctEl, pText);
    barEl.style.width = bad(p) ? '0%' : pText;

    var worst = staleSeconds();
    panel.classList.toggle('stale', worst > 0);
    staleTag.hidden = !worst;
    if (worst) staleTag.textContent = 'STALE ' + Math.max(1, Math.round(worst / 60)) + ' MIN';
  }

  store.on('difficulty', renderAll);
  store.on('tipHeight', renderAll);

  setInterval(renderAll, TICK_MS);
  renderAll();
})();
