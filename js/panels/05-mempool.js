/* Bitcoin Hull — mempool panel: backlog hero (vMB), pending count, blocks to
   clear, and the projected-blocks mini-viz built from mempool.space's own
   block templates. Renders from HULL.store only; a 30 s tick keeps staleness
   honest between polls. */
(function () {
  'use strict';

  var HULL = window.HULL;
  var store = HULL.store, fmt = HULL.fmt;

  var DASH = '—';
  var TICK_MS = 30000;
  var BLOCK_VSIZE = 1e6; /* one block of room, vB — protocol, not judgment */
  var MAX_SEGS = 8;

  /* The API's last projected block is an uncapped "rest of the mempool"
     stack — live today it is ~39 normal blocks in one entry. Drawn truly
     proportional it would squash every real block template to a sliver, so
     its WIDTH is capped at this multiple of the widest normal segment while
     its LABEL ("+N blocks") carries the real magnitude. */
  var TAIL_CAP_X = 2;

  /* Ordinal ramp, next block → deepest backlog: one hue (the accent's
     family, hue spread 16°), monotone lightness. Validated with the dataviz
     skill's validator in --ordinal mode against BOTH --surface #131822 and
     --surface-2 #1a2130 (all checks pass) — NOT the status palette; depth
     is a position, not a judgment. */
  var RAMP = ['#f7d7bd', '#e8c19f', '#d9aa80', '#ca9462',
              '#bb7d43', '#ac671c', '#9c5100', '#8c3a00'];

  /* label ink flips by fill (computed against the ramp, not eyeballed):
     dark ink ≥5.6:1 on steps 0–4, light ink ≥5.3:1 on 6–7. Step 5 is a
     dead zone (dark 4.34:1, a hair under AA's 4.5) — reachable only when
     malformed entries shift the overflow stack there, and a marginal
     label beats a missing honesty anchor. */
  var DARK_INK_LAST_STEP = 5;

  /* a label renders only when its true text width + this breathing room
     fits the segment's pixel share (measured, not estimated) */
  var LABEL_PAD_PX = 6;

  /* feeds this panel renders; stale = has data but older than 2× its poll
     interval (never-fetched is the loading state, not stale).
     vbps is deliberately NOT here (task 14): it is socket-only — its row
     dashes the moment conn leaves "live", and a dead socket with healthy
     REST must not tag the whole panel STALE. */
  var FEEDS = [
    { key: 'mempool',       intervalS: 30 },
    { key: 'mempoolBlocks', intervalS: 30 }
  ];

  var panel = document.getElementById('panel-mempool');
  var staleTag = panel.querySelector('[data-mempool-stale]');
  var vsizeEl = panel.querySelector('[data-mempool-vsize]');
  var countEl = panel.querySelector('[data-mempool-count]');
  var incomingEl = panel.querySelector('[data-mempool-incoming]');
  var depthEl = panel.querySelector('[data-mempool-depth]');
  var vizEl = panel.querySelector('[data-mempool-viz]');

  /* hidden ruler for true label widths — same type styles as .seg-label */
  var probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;' +
                        'font-size:10px;font-weight:600;font-variant-numeric:tabular-nums;';
  panel.appendChild(probe);

  function textPx(text) {
    probe.textContent = text;
    return probe.getBoundingClientRect().width;
  }

  function setVal(el, text) {
    el.textContent = text;
    el.classList.toggle('loading', text === DASH);
  }

  /* same guard HULL.fmt applies: a real, usable number and nothing else */
  function bad(n) { return typeof n !== 'number' || !isFinite(n); }

  function renderHero() {
    var mp = store.get('mempool') || {};
    setVal(vsizeEl, fmt.mb(mp.vsize));
    setVal(countEl, fmt.int(mp.count));
    /* task 14: incoming flow is socket-only — a value ONLY while the push
       layer is healthy; POLLING/DEGRADED/DOWN/pre-first-push all dash.
       There is no REST fallback and we never fake one. */
    setVal(incomingEl, store.get('conn') === 'live' ? fmt.vbps(store.get('vbps')) : DASH);
  }

  /* Blocks to clear = how many block templates the whole backlog fills.
     A backlog that fits in one template gets words, not "~1 (≈ 10 min)" —
     same condition the fees panel voices as "clears the whole backlog". */
  function renderDepth() {
    var mp = store.get('mempool') || {};
    var text = DASH;
    if (!bad(mp.vsize)) {
      var n = Math.ceil(mp.vsize / BLOCK_VSIZE);
      text = n <= 1 ? 'Next block clears it'
                    : '~' + fmt.int(n) + ' (≈ ' + fmt.dur(n * 600) + ')';
    }
    setVal(depthEl, text);
  }

  /* ---- mini-viz -------------------------------------------------------- */

  /* the first ~8 projected blocks, malformed entries skipped: a segment
     with no usable blockVSize has no width to draw */
  function vizEntries() {
    var mbs = store.get('mempoolBlocks');
    var out = [];
    if (!mbs || !mbs.length) return out;
    for (var i = 0; i < mbs.length && out.length < MAX_SEGS; i++) {
      var b = mbs[i];
      if (b && !bad(b.blockVSize) && b.blockVSize > 0) out.push(b);
    }
    return out;
  }

  /* keep DOM nodes when the segment count is unchanged (no flicker, hover
     survives); rebuild only when the count itself changes */
  function segNodes(count) {
    var segs = vizEl.children;
    if (segs.length !== count) {
      vizEl.textContent = '';
      for (var i = 0; i < count; i++) {
        var seg = document.createElement('span');
        seg.className = 'seg';
        seg.appendChild(document.createElement('span')).className = 'seg-label';
        vizEl.appendChild(seg);
      }
      segs = vizEl.children;
    }
    return segs;
  }

  function renderViz() {
    var entries = vizEntries();
    var segs = segNodes(entries.length);
    if (!entries.length) {
      vizEl.setAttribute('aria-label', 'projected next blocks by size');
      return;
    }

    /* width basis: the widest NORMAL template; the overflow stack (the API
       only ever exempts the last entry from its ~1 MvB cap) is clamped to
       TAIL_CAP_X × that. If every entry somehow reads as overflow, draw raw. */
    var maxNormal = 0, flexes = [], total = 0, i;
    for (i = 0; i < entries.length; i++) {
      if (entries[i].blockVSize <= BLOCK_VSIZE && entries[i].blockVSize > maxNormal) {
        maxNormal = entries[i].blockVSize;
      }
    }
    for (i = 0; i < entries.length; i++) {
      var v = entries[i].blockVSize;
      var isOverflow = v > BLOCK_VSIZE;
      flexes.push(isOverflow && maxNormal > 0 ? Math.min(v, TAIL_CAP_X * maxNormal) : v);
      total += flexes[i];
    }

    /* label fit measures against the flexable width — the 2px gaps between
       segments aren't distributable, so exclude them before projecting.
       clientWidth is 0 only if unlaid-out; then labels wait a tick. */
    var fitPx = Math.max(0, vizEl.clientWidth - 2 * (entries.length - 1));
    for (i = 0; i < entries.length; i++) {
      var b = entries[i];
      var seg = segs[i];
      var overflow = b.blockVSize > BLOCK_VSIZE;
      var segPx = total > 0 ? (flexes[i] / total) * fitPx : 0;

      seg.style.flex = String(flexes[i]);
      seg.style.background = RAMP[i];

      /* direct labels, selectively: the two nearest templates carry their
         median fee; the overflow stack carries its true size in blocks */
      var label = '';
      if (overflow) {
        var stackN = fmt.int(Math.ceil(b.blockVSize / BLOCK_VSIZE));
        /* tooltip says "across the tail" — this median spans ~N blocks and
           must not read like a single template's median */
        seg.title = '+' + stackN + ' blocks queued · ' + fmt.int(b.nTx) + ' tx · '
                  + fmt.mb(b.blockVSize) + ' vMB · ~' + fmt.satvb(b.medianFee)
                  + ' sat/vB median across the tail';
        /* the label is the honesty anchor for the clamped width — it
           compacts rather than disappears when space runs out */
        label = '+' + stackN + ' blocks';
        if (segPx < textPx(label) + LABEL_PAD_PX) label = '+' + stackN;
      } else {
        seg.title = fmt.satvb(b.medianFee) + ' sat/vB median · '
                  + fmt.int(b.nTx) + ' tx · ' + fmt.mb(b.blockVSize) + ' vMB';
        if (i < 2) {
          label = fmt.satvb(b.medianFee);
          if (label === DASH) label = ''; /* a dash inside a 14px bar is noise */
          if (label && segPx < textPx(label) + LABEL_PAD_PX) label = '';
        }
      }

      var labelEl = seg.firstChild;
      labelEl.textContent = label;
      labelEl.classList.toggle('seg-label-dark', i <= DARK_INK_LAST_STEP);
    }

    /* screen readers can't hover the titles — the container summarizes */
    var tail = entries[entries.length - 1];
    var aria = 'Projected next blocks: ~' + fmt.satvb(entries[0].medianFee)
             + ' sat/vB median next block';
    if (tail.blockVSize > BLOCK_VSIZE) {
      aria += ', +' + fmt.int(Math.ceil(tail.blockVSize / BLOCK_VSIZE)) + ' blocks queued behind';
    } else if (entries.length > 1) {
      aria += ', ' + entries.length + ' blocks shown';
    }
    vizEl.setAttribute('aria-label', aria);
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
    renderHero();
    renderDepth();
    renderViz();
    panel.classList.toggle('stale', worst > 0);
    staleTag.hidden = !worst;
    if (worst) staleTag.textContent = 'STALE ' + Math.max(1, Math.round(worst / 60)) + ' MIN';
  }

  store.on('mempool', renderAll);
  store.on('mempoolBlocks', renderAll);
  store.on('vbps', renderAll);
  store.on('conn', renderAll); /* the incoming row follows the chip, instantly */

  /* label fit depends on the bar's pixel width — recheck after resizes */
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderViz, 250);
  });

  setInterval(renderAll, TICK_MS); /* staleness stays honest between polls */
  renderAll(); /* honest loading state before the first poll resolves */
})();
