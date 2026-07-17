/* Bitcoin Hull — supply + halving panels: issuance and the countdown to the
   next subsidy halving, computed EXACTLY from tip height — era math only,
   zero API calls beyond the height itself. One file drives both panels:
   they render the same single feed, so they load and go stale together.
   Issuance comes from HULL.supplyAt (js/supply.js) — never re-derived. */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt;

  var DASH = '—';
  var TICK_MS = 30000;

  var ERA_BLOCKS = 210000;
  var GENESIS_SUBSIDY_SATS = 5e9;
  var CAP_BTC = 21e6;
  var BLOCKS_PER_YEAR = 52560; /* 365 days × 144 ten-minute blocks */
  var TARGET_BLOCK_S = 600;

  /* the one feed both panels render; stale = data older than 2× its poll
     interval (never-fetched is the loading state, not stale) */
  var FEEDS = [
    { key: 'tipHeight', intervalS: 60 }
  ];

  var sPanel = document.getElementById('panel-supply');
  var sStaleTag = sPanel.querySelector('[data-supply-stale]');
  var sHeroEl = sPanel.querySelector('[data-supply-btc]');
  var sBarEl = sPanel.querySelector('[data-supply-bar]');
  var sPctEl = sPanel.querySelector('[data-supply-pct]');
  var sSubsidyEl = sPanel.querySelector('[data-supply-subsidy]');
  var sInflEl = sPanel.querySelector('[data-supply-inflation]');

  var hPanel = document.getElementById('panel-halving');
  var hStaleTag = hPanel.querySelector('[data-halving-stale]');
  var hHeroEl = hPanel.querySelector('[data-halving-blocks]');
  var hDateEl = hPanel.querySelector('[data-halving-date]');
  var hNextEl = hPanel.querySelector('[data-halving-next]');
  var hEraEl = hPanel.querySelector('[data-halving-era]');
  var hBarEl = hPanel.querySelector('[data-halving-erabar]');
  var hPctEl = hPanel.querySelector('[data-halving-erapct]');

  function setVal(el, text) {
    el.textContent = text;
    el.classList.toggle('loading', text === DASH);
  }

  /* same guard HULL.fmt applies: a real, usable number and nothing else */
  function bad(n) { return typeof n !== 'number' || !isFinite(n); }

  /* subsidy in BTC for an era (= floor(height / 210000)): integer-floor sat
     math like consensus, floor(5e9 / 2^era). 2**era, NOT >> — JS bitshift
     truncates to 32 bits and 5e9 doesn't fit. Hits 0 past era 33. */
  function subsidyBtc(era) {
    return Math.floor(GENESIS_SUBSIDY_SATS / Math.pow(2, era)) / 1e8;
  }

  /* seconds of the stalest feed these panels render; 0 = nothing stale */
  function staleSeconds() {
    var worst = 0;
    for (var i = 0; i < FEEDS.length; i++) {
      var age = store.age(FEEDS[i].key);
      if (isFinite(age) && age > 2 * FEEDS[i].intervalS && age > worst) worst = age;
    }
    return worst;
  }

  function renderAll() {
    var tip = store.get('tipHeight'); /* number payload — IS the height */
    var ok = !bad(tip) && tip >= 0;
    var height = ok ? Math.floor(tip) : NaN;
    var era = ok ? Math.floor(height / ERA_BLOCKS) : NaN;

    /* SUPPLY — issued counts blocks 0..tip inclusive (the tip block exists;
       semantics documented in js/supply.js). Hero is whole BTC. */
    var issued = HULL.supplyAt(height); /* NaN rides through to the dash */
    setVal(sHeroEl, fmt.int(issued));

    /* bar width and printed % come from the SAME formatted string, so they
       can never disagree; a dash has no width — on bad input the bar parks
       at 0 and the text carries the dash (07's convention) */
    var issuedPct = bad(issued) ? NaN : Math.min(100, Math.max(0, issued / CAP_BTC * 100));
    var issuedText = fmt.pct(issuedPct, null, 2);
    setVal(sPctEl, issuedText);
    sBarEl.style.width = bad(issuedPct) ? '0%' : issuedText;

    var subsidy = ok ? subsidyBtc(era) : NaN;
    setVal(sSubsidyEl, fmt.btc(subsidy));

    /* annual inflation: new BTC minted per year at the current subsidy vs
       what already exists — subsidy × 52,560 / supply */
    var infl = bad(issued) || bad(subsidy) || issued <= 0
      ? NaN : subsidy * BLOCKS_PER_YEAR / issued * 100;
    setVal(sInflEl, fmt.pct(infl, null, 2));

    /* HALVING — next multiple of 210,000; the halving block itself opens
       the next era, so at an exact boundary a full 210,000 remain */
    var nextHeight = ok ? (era + 1) * ERA_BLOCKS : NaN;
    var remaining = ok ? nextHeight - height : NaN;
    setVal(hHeroEl, fmt.int(remaining));

    /* ETA at the 10-min target — month precision is the honest ceiling for
       a multi-year block count */
    setVal(hDateEl, ok ? '≈ ' + fmt.monthYear(Date.now() / 1000 + remaining * TARGET_BLOCK_S) : DASH);

    setVal(hNextEl, ok ? fmt.btc(subsidyBtc(era + 1)) : DASH);

    /* era label is 1-indexed (4 halvings behind us = era 5), progress is
       blocks into the current 210,000 */
    setVal(hEraEl, fmt.int(ok ? era + 1 : NaN));
    var eraPct = ok ? Math.min(100, Math.max(0, (height % ERA_BLOCKS) / ERA_BLOCKS * 100)) : NaN;
    var eraText = fmt.pct(eraPct);
    setVal(hPctEl, eraText);
    hBarEl.style.width = bad(eraPct) ? '0%' : eraText;

    var worst = staleSeconds();
    var tagText = worst ? 'STALE ' + Math.max(1, Math.round(worst / 60)) + ' MIN' : '';
    sPanel.classList.toggle('stale', worst > 0);
    hPanel.classList.toggle('stale', worst > 0);
    sStaleTag.hidden = hStaleTag.hidden = !worst;
    if (worst) { sStaleTag.textContent = tagText; hStaleTag.textContent = tagText; }
  }

  store.on('tipHeight', renderAll);

  setInterval(renderAll, TICK_MS); /* staleness + ETA stay honest between polls */
  renderAll(); /* honest loading state before the first poll resolves */
})();
