/* Bitcoin Hull — BitcoinHull Integrity: the Hull's signature stat. One
   honest 0–100 for "is the network running clean right now", derived
   client-side from data already in HULL.store — no new endpoints.
   Weighted sum, each component scored against protocol norms (weights
   confirmed by Joe at task-11 start):
     block cadence      /25  minutes since last block AND the kept-window
                             average interval vs the 10 min target — full
                             ≤10 min, zero ≥60 min, the worse one wins
     mining muscle      /25  hashrate vs the difficulty-implied baseline
                             (difficulty × 2³² / 600) — full at ratio ≥1,
                             scales down as hashrate lags difficulty
     fee pressure       /20  fastestFee on a log band: ≤5 sat/vB full,
                             zero at ≥300
     mempool congestion /20  blocks-to-clear (vsize/1e6): ≤3 full, zero ≥50
     feed freshness     /10  this page's own pipeline, scaled by stale
                             endpoint count; conn=down → 0 (an unmeasured
                             network can't claim a score)
   The score is the SUM OF THE ROUNDED rows, so the breakdown always adds
   up to the headline. Any missing input → that row AND the score render
   the dash (no fabricated totals). Renders from HULL.store only; a 30 s
   tick keeps the since-block clock and staleness honest between events. */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt;

  var DASH = '—';
  var TICK_MS = 30000;

  /* verdict bands on the integer score — label + tint always travel
     together, and pill + bar always carry the text label (house rule) */
  var BANDS = [
    { min: 85, label: 'SOLID',    cls: 'pill-good',     fill: 'fill-good' },
    { min: 65, label: 'HOLDING',  cls: 'pill-warn',     fill: 'fill-warn' },
    { min: 40, label: 'STRAINED', cls: 'pill-serious',  fill: 'fill-serious' },
    { min: 0,  label: 'BREACHED', cls: 'pill-critical', fill: 'fill-critical' }
  ];

  /* the whole REST pipeline (table intervals, _SHARED.md) — the freshness
     component meters ALL of it, not just this panel's own score inputs */
  var PIPELINE = [
    { key: 'tipHeight',     intervalS: 60 },
    { key: 'blocks',        intervalS: 60 },
    { key: 'fees',          intervalS: 30 },
    { key: 'mempool',       intervalS: 30 },
    { key: 'mempoolBlocks', intervalS: 30 },
    { key: 'prices',        intervalS: 60 },
    { key: 'difficulty',    intervalS: 300 },
    { key: 'hashrate',      intervalS: 300 }
  ];

  /* feeds the score inputs render from — the stale tag judges these; the
     freshness row is a meter OF staleness, so it can't itself go stale */
  var FEEDS = [
    { key: 'blocks',   intervalS: 60 },
    { key: 'fees',     intervalS: 30 },
    { key: 'mempool',  intervalS: 30 },
    { key: 'hashrate', intervalS: 300 }
  ];

  var panel = document.getElementById('panel-integrity');
  var staleTag = panel.querySelector('[data-integrity-stale]');
  var scoreEl = panel.querySelector('[data-integrity-score]');
  var barEl = panel.querySelector('[data-integrity-bar]');
  var verdictEl = panel.querySelector('[data-integrity-verdict]');
  var verdictLabel = panel.querySelector('[data-integrity-verdict-label]');
  var rowEls = {
    cadence: panel.querySelector('[data-int-cadence]'),
    mining:  panel.querySelector('[data-int-mining]'),
    fees:    panel.querySelector('[data-int-fees]'),
    mempool: panel.querySelector('[data-int-mempool]'),
    fresh:   panel.querySelector('[data-int-fresh]')
  };

  function setVal(el, text) {
    el.textContent = text;
    el.classList.toggle('loading', text === DASH);
  }

  /* same guard HULL.fmt applies: a real, usable number and nothing else */
  function bad(n) { return typeof n !== 'number' || !isFinite(n); }

  /* 1 at or under lo, 0 at or over hi, linear between */
  function ramp(v, lo, hi) {
    if (v <= lo) return 1;
    if (v >= hi) return 0;
    return (hi - v) / (hi - lo);
  }

  var lastCadence = NaN; /* kept-value cache — see the stale guard below */

  /* /25 — slow cadence is the danger signal; fast blocks are a healthy
     hashrate surge, so an under-target average scores full, not weird */
  function compCadence() {
    /* while the blocks feed is stale the since-clock would keep decaying
       this row, misattributing a MEASUREMENT gap to network cadence — the
       contract says last values kept, and the freshness component already
       meters the outage. Never-fetched age is Infinity → NaN → loading. */
    if (store.age('blocks') > 2 * 60) return lastCadence;
    var blocks = store.get('blocks');
    if (!blocks || !blocks.length || !blocks[0] || bad(blocks[0].timestamp)) return NaN;
    var sinceMin = Math.max(0, Date.now() / 1000 - blocks[0].timestamp) / 60;
    var s = ramp(sinceMin, 10, 60);
    /* the average over the kept window (15 blocks = 14 intervals) catches
       a slow-motion stall the since-clock alone would forgive; clamped at
       0 because miner timestamps aren't monotonic */
    var n = Math.min(blocks.length, 15);
    if (n >= 2 && blocks[n - 1] && !bad(blocks[n - 1].timestamp)) {
      var avgMin = Math.max(0, blocks[0].timestamp - blocks[n - 1].timestamp) / (n - 1) / 60;
      var a = ramp(avgMin, 10, 60);
      if (a < s) s = a; /* the worse signal wins */
    }
    lastCadence = 25 * s;
    return lastCadence;
  }

  /* /25 — both fields ride the same payload, so one bad field means the
     ratio isn't trustworthy */
  function compMining() {
    var hr = store.get('hashrate') || {};
    if (bad(hr.currentHashrate) || hr.currentHashrate < 0 ||
        bad(hr.currentDifficulty) || hr.currentDifficulty <= 0) return NaN;
    var baseline = hr.currentDifficulty * Math.pow(2, 32) / 600;
    return 25 * Math.min(1, Math.max(0, hr.currentHashrate / baseline));
  }

  /* /20 — log band: fee pain is multiplicative (5→50 hurts like 50→500) */
  function compFees() {
    var f = (store.get('fees') || {}).fastestFee;
    if (bad(f) || f <= 0) return NaN;
    return 20 * ramp(Math.log(f), Math.log(5), Math.log(300));
  }

  /* /20 — backlog depth in blocks-to-clear */
  function compMempool() {
    var v = (store.get('mempool') || {}).vsize;
    if (bad(v) || v < 0) return NaN;
    return 20 * ramp(v / 1e6, 3, 50);
  }

  /* /10 — judged at the panels' table-interval convention (2×); while the
     socket is healthy its pushes keep the stretched keys' store age near
     zero, so this stays truthful under the ×5 REST cadence too.
     Never-fetched is the loading state, not stale — boot doesn't start
     at 0/10, and until ANYTHING has ever landed the row is loading, not
     a 10/10 claim on zero bytes. Computable once any data exists, and by
     then some other row exists too, so this alone never dashes a score. */
  function compFresh() {
    var stale = 0, everMeasured = false;
    for (var i = 0; i < PIPELINE.length; i++) {
      var age = store.age(PIPELINE[i].key);
      if (isFinite(age)) {
        everMeasured = true;
        if (age > 2 * PIPELINE[i].intervalS) stale += 1;
      }
    }
    if (!everMeasured) return NaN;
    if (store.get('conn') === 'down') return 0; /* an unmeasured network can't claim a score */
    return 10 * (1 - stale / PIPELINE.length);
  }

  function bandFor(score) {
    for (var i = 0; i < BANDS.length; i++) {
      if (score >= BANDS[i].min) return BANDS[i];
    }
    return BANDS[BANDS.length - 1];
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
    var parts = [
      { el: rowEls.cadence, val: compCadence(), outOf: 25 },
      { el: rowEls.mining,  val: compMining(),  outOf: 25 },
      { el: rowEls.fees,    val: compFees(),    outOf: 20 },
      { el: rowEls.mempool, val: compMempool(), outOf: 20 },
      { el: rowEls.fresh,   val: compFresh(),   outOf: 10 }
    ];

    var score = 0, missing = false;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (bad(p.val)) {
        missing = true;
        setVal(p.el, DASH);
      } else {
        score += Math.round(p.val); /* fmt.int rounds the same way below */
        setVal(p.el, fmt.int(p.val) + '/' + p.outOf);
      }
    }

    if (missing) {
      /* a dash has no width — the bar parks at 0, the pill goes neutral */
      setVal(scoreEl, DASH);
      barEl.style.width = '0%';
      barEl.className = 'bar-fill';
      verdictEl.className = 'pill pill-plain';
      verdictLabel.textContent = DASH;
    } else {
      var band = bandFor(score);
      setVal(scoreEl, fmt.int(score));
      barEl.style.width = score + '%';
      barEl.className = 'bar-fill ' + band.fill;
      verdictEl.className = 'pill ' + band.cls;
      verdictLabel.textContent = band.label;
    }

    var worst = staleSeconds();
    panel.classList.toggle('stale', worst > 0);
    staleTag.hidden = !worst;
    if (worst) staleTag.textContent = 'STALE ' + Math.max(1, Math.round(worst / 60)) + ' MIN';
  }

  store.on('blocks', renderAll);
  store.on('fees', renderAll);
  store.on('mempool', renderAll);
  store.on('hashrate', renderAll);
  store.on('conn', renderAll); /* freshness folds in down/recover instantly */
  /* freshness meters the WHOLE pipeline, so the rest are input events too —
     without these, a recovering endpoint clears the fresh row up to a tick late */
  store.on('tipHeight', renderAll);
  store.on('mempoolBlocks', renderAll);
  store.on('prices', renderAll);
  store.on('difficulty', renderAll);

  setInterval(renderAll, TICK_MS); /* since-block + staleness stay honest between events */
  renderAll(); /* honest loading state before the first poll resolves */
})();
