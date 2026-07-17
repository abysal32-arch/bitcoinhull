/* Bitcoin Hull — mining panel: hashrate hero, difficulty, the retarget
   estimate, epoch progress. The security dial: how much muscle guards the
   chain and when the difficulty next moves. Renders from HULL.store only;
   a 30 s tick keeps staleness honest between the slow 5-min polls. */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt;

  var DASH = '—';
  var TICK_MS = 30000;

  /* feeds this panel renders; stale = has data but older than 2× its poll
     interval (never-fetched is the loading state, not stale) */
  var FEEDS = [
    { key: 'hashrate',   intervalS: 300 },
    { key: 'difficulty', intervalS: 300 }
  ];

  var panel = document.getElementById('panel-mining');
  var staleTag = panel.querySelector('[data-mining-stale]');
  var hashEl = panel.querySelector('[data-mining-hashrate]');
  var diffEl = panel.querySelector('[data-mining-diff]');
  var adjEl = panel.querySelector('[data-mining-adj]');
  var retargetEl = panel.querySelector('[data-mining-retarget]');
  var barEl = panel.querySelector('[data-mining-epochbar]');
  var pctEl = panel.querySelector('[data-mining-epochpct]');

  function setVal(el, text) {
    el.textContent = text;
    el.classList.toggle('loading', text === DASH);
  }

  /* same guard HULL.fmt applies: a real, usable number and nothing else */
  function bad(n) { return typeof n !== 'number' || !isFinite(n); }

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

    /* sign is neutral news, not good/bad — plain ink, sign shown explicitly */
    setVal(adjEl, fmt.pct(adj.difficultyChange, true));

    /* remainingTime is a ms duration (verified live in task 06) — fmt.dur
       takes seconds; both halves come from the same payload, so one bad
       field means the whole row isn't trustworthy */
    setVal(retargetEl, bad(adj.remainingBlocks) || bad(adj.remainingTime)
      ? DASH
      : fmt.int(adj.remainingBlocks) + ' blocks · ≈ ' + fmt.dur(adj.remainingTime / 1000));

    /* bar width and printed % come from the SAME formatted string, so they
       can never disagree; a dash has no width — on bad input the bar parks
       at 0 and the text carries the dash */
    var p = bad(adj.progressPercent) ? NaN : Math.min(100, Math.max(0, adj.progressPercent));
    var pText = fmt.pct(p);
    setVal(pctEl, pText);
    barEl.style.width = bad(p) ? '0%' : pText;

    var worst = staleSeconds();
    panel.classList.toggle('stale', worst > 0);
    staleTag.hidden = !worst;
    if (worst) staleTag.textContent = 'STALE ' + Math.max(1, Math.round(worst / 60)) + ' MIN';
  }

  store.on('hashrate', renderAll);
  store.on('difficulty', renderAll);

  setInterval(renderAll, TICK_MS); /* staleness stays honest between polls */
  renderAll(); /* honest loading state before the first poll resolves */
})();
