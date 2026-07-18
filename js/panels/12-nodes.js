/* Bitcoin Hull — nodes panel: Luke Dashjr's daily node-count estimate (the
   file behind luke.dashjr.org's historical chart). The total EXTRAPOLATES
   non-listening nodes — it is an estimate, and the panel says so ("est.").
   Renders from HULL.store only; a 30 s tick keeps staleness honest.
   STALENESS DEVIATION (documented in _SHARED.md): the file updates daily,
   so the 2×-poll-interval convention doesn't fit — this panel is stale
   when the newest ROW is older than 48 h, judged on the row's own
   timestamp, so a stalled file and an unreachable server trip the same
   tag; the tag counts hours, not minutes. */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt;

  var DASH = '—';
  var TICK_MS = 30000;
  var STALE_AFTER_S = 48 * 3600;
  var TREND_BACK_S = 30 * 86400;

  var panel = document.getElementById('panel-nodes');
  var staleTag = panel.querySelector('[data-nodes-stale]');
  var totalEl = panel.querySelector('[data-nodes-total]');
  var listenEl = panel.querySelector('[data-nodes-listening]');
  var trendEl = panel.querySelector('[data-nodes-trend]');
  var asOfEl = panel.querySelector('[data-nodes-asof]');

  function setVal(el, text) {
    el.textContent = text;
    el.classList.toggle('loading', text === DASH);
  }

  /* same guard HULL.fmt applies: a real, usable number and nothing else */
  function bad(n) { return typeof n !== 'number' || !isFinite(n); }

  /* % change of the total estimate over the 30 days ending at the newest
     row — anchored to the DATA's own date, not the wall clock, so a
     stalled feed freezes the trend instead of letting it drift
     (_SHARED.md wall-clock rule); with fresh daily data the two anchors
     pick the same row */
  function trendText(v) {
    if (!v || !v.rows || v.rows.length < 2 || bad(v.total)) return DASH;
    var target = v.ts - TREND_BACK_S;
    var best = null, bestD = Infinity;
    for (var i = 0; i < v.rows.length; i++) {
      var d = Math.abs(v.rows[i].ts - target);
      if (d < bestD) { bestD = d; best = v.rows[i]; }
    }
    /* a "trend" against the newest row itself (history shorter than the
       window) or a junk baseline is no trend */
    if (!best || bad(best.total) || best.total <= 0 || best.ts >= v.ts) return DASH;
    return fmt.pct(((v.total - best.total) / best.total) * 100, true);
  }

  /* age of the newest row once past the 48 h freshness bar; 0 = fresh.
     A never-fetched key is the loading state, not stale. BAKED data is
     exempt: its visible "baked YYYY-MM-DD" line is the honesty mechanism
     (task-13 rule) — an aging bake is disclosed, not alarmed. */
  function staleSeconds() {
    var v = store.get('nodes');
    if (!v || bad(v.ts) || v.baked) return 0;
    var age = Date.now() / 1000 - v.ts;
    return age > STALE_AFTER_S ? age : 0;
  }

  function renderAll() {
    var v = store.get('nodes');
    var worst = staleSeconds();
    setVal(totalEl, fmt.int(v && v.total));
    setVal(listenEl, fmt.int(v && v.listening));
    setVal(trendEl, trendText(v));
    asOfEl.textContent = v && v.baked ? ' · baked ' + v.baked : '';
    panel.classList.toggle('stale', worst > 0);
    staleTag.hidden = !worst;
    if (worst) staleTag.textContent = 'STALE ' + Math.round(worst / 3600) + ' H';
  }

  store.on('nodes', renderAll);
  setInterval(renderAll, TICK_MS); /* staleness stays honest between polls */
  renderAll(); /* honest loading state before the first poll resolves */
})();
