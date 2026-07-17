/* Bitcoin Hull — HULL.live: the WebSocket layer (task 09). Pushes from
   mempool.space land in the SAME store keys the REST poller fills, so
   panels light up with zero panel changes. REST keeps polling as belt
   and suspenders — the keys the socket heartbeats (~1 s cadence live:
   fees, mempoolInfo, mempool-blocks, da) stretch to ×5 cadence while the
   socket is healthy; full cadence returns the moment it isn't. tipHeight
   and blocks REST polls are NOT stretched: those keys only move when a
   block lands, and a stretched poll would trip the panels' honest-stale
   thresholds between blocks.
   Health = data we consume actually flowing, not the socket claiming
   open: healthy on the first message carrying a wanted key, presumed
   dead after 60 s without one (the server pushes ~every second, so
   silence IS death; unparseable frames and unwanted channels never
   count as coverage).
   Stats pushes apply at most once per 10 s per key — store.set() fires
   subscribers even on unchanged values, and panels were built for a 30 s
   cadence, not 1 s. A message carrying a new block bypasses the throttle:
   the post-block fees/projections refresh is the moment itself.
   Console levers for the WS-kill drill (mirrors HULL.api.BASE):
     HULL.live.stop()            → chip falls back to POLLING
     HULL.live.start()           → chip returns to LIVE
     HULL.live.URL = '<garbage>' → next (re)connect fails, backoff visible
   ?debug=1 logs connects, pushes applied, and cadence flips. */
(function () {
  'use strict';

  var HULL = window.HULL = window.HULL || {};
  var store = HULL.store, api = HULL.api, fmt = HULL.fmt;

  var DEBUG = /[?&]debug=1(&|$)/.test(location.search);
  var WANT = { action: 'want', data: ['blocks', 'stats', 'mempool-blocks'] };
  var SLOW_KEYS = ['fees', 'mempool', 'mempoolBlocks', 'difficulty'];
  var SLOW_X = 5;
  var APPLY_MIN_MS = 10000;       /* stats-family throttle (see header) */
  var HIST_MAX_MS = 300000;       /* 2× the stretched mempool REST cadence — older is a lie, not a carry */
  var TITLE_STALE_S = 180;        /* any title key older than this = feeds stopped (worst honest cadence: fees 150 s) */
  var CONNECT_TIMEOUT_MS = 30000; /* open+first data, or it isn't a connection */
  var SILENT_MAX_MS = 60000;
  var BACKOFF_BASE_MS = 5000;
  var BACKOFF_MAX_MS = 300000;    /* 5 min hard cap, same ladder as REST */
  var WATCHDOG_MS = 15000;
  var FLAP_CLEAR_MS = 30000;      /* a connection must survive this long to clear the backoff ladder */
  var BLOCKS_KEPT = 15;           /* match the REST /api/v1/blocks window */

  var ws = null, wsSeq = 0, healthy = false, failures = 0;
  var reconnectTimer = null, connectTimer = null, flapTimer = null;
  var lastMsgAt = 0, stopped = false;
  var lastApply = { fees: 0, mempool: 0, mempoolBlocks: 0, difficulty: 0 };

  function log(msg) { if (DEBUG) console.log('[hull] ws ' + msg); }

  /* same guard HULL.fmt applies: a real, usable number and nothing else */
  function bad(n) { return typeof n !== 'number' || !isFinite(n); }

  var live = HULL.live = {
    /* the ONE socket URL — mutable on purpose, read at every (re)connect */
    URL: 'wss://mempool.space/api/v1/ws',
    start: function () { stopped = false; failures = 0; connect(); },
    stop: function () { stopped = true; teardown(); setHealthy(false); log('stopped (lever)'); }
  };

  function teardown() {
    clearTimeout(reconnectTimer);
    clearTimeout(connectTimer);
    if (ws) {
      ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
      try { ws.close(); } catch (e) { /* already closing */ }
      ws = null;
    }
  }

  function setHealthy(h) {
    if (healthy === h) return;
    healthy = h;
    clearTimeout(flapTimer);
    if (h) {
      /* don't clear the backoff ladder on the first message — a server
         that flaps every few seconds must keep escalating, not storm
         at the 5 s floor (and re-churn the REST cadence each time) */
      flapTimer = setTimeout(function () { failures = 0; }, FLAP_CLEAR_MS);
    }
    api.setCadence(SLOW_KEYS, h ? SLOW_X : 1);
    api.setPush(h);
    log(h ? 'healthy — covered REST polls ×' + SLOW_X : 'down — REST at full cadence');
  }

  function connect() {
    teardown();
    if (stopped) return;
    /* every path into a (re)connect means the old socket is gone — health
       is re-earned by the first message, never carried across, so the
       connect-timeout guard below is always live */
    setHealthy(false);
    if (navigator.onLine === false) {
      /* don't burn connects while offline — the "online" handler refires */
      reconnectTimer = setTimeout(connect, BACKOFF_MAX_MS);
      return;
    }
    var seq = ++wsSeq;
    var sock;
    try { sock = new WebSocket(live.URL); }
    catch (e) { log('connect refused (' + e.message + ')'); fail(seq); return; }
    ws = sock;
    log('connecting ' + live.URL);

    /* a socket that hasn't delivered data by now isn't a connection —
       covers hung handshakes AND servers that accept then go mute */
    connectTimer = setTimeout(function () {
      if (seq === wsSeq && !healthy) {
        log('no data ' + CONNECT_TIMEOUT_MS / 1000 + ' s after connect — retrying');
        try { sock.close(); } catch (e) { /* onclose does the rest */ }
      }
    }, CONNECT_TIMEOUT_MS);

    sock.onopen = function () {
      if (seq !== wsSeq) return;
      log('open — sending want');
      sock.send(JSON.stringify(WANT));
    };
    sock.onmessage = function (ev) { if (seq === wsSeq) onMessage(ev); };
    sock.onclose = function () {
      if (seq !== wsSeq) return;
      log('closed');
      fail(seq);
    };
    sock.onerror = function () { /* onclose always follows; handled there */ };
  }

  function fail(seq) {
    if (seq !== wsSeq || stopped) return;
    setHealthy(false);
    failures += 1;
    var wait = Math.min(BACKOFF_BASE_MS * Math.pow(2, failures - 1), BACKOFF_MAX_MS);
    log('reconnect in ' + Math.round(wait / 1000) + ' s');
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, wait);
  }

  /* ---- push -> store ---------------------------------------------------- */

  function onMessage(ev) {
    var m;
    try { m = JSON.parse(ev.data); }
    catch (e) { log('unparseable message skipped'); return; }
    if (!m || typeof m !== 'object') return;

    /* health is earned by data we actually consume — a socket chattering
       garbage or only unwanted channels (transactions arrives unasked)
       must not hold the chip at LIVE while the wanted channels stall */
    if (!(m.block || m.blocks || m['mempool-blocks'] || m.fees ||
          m.mempoolInfo || m.da || m.conversions)) return;
    lastMsgAt = Date.now();
    if (!healthy) { clearTimeout(connectTimer); setHealthy(true); }

    /* a new block resets the stats picture — its companions skip the throttle */
    var force = !!m.block;

    if (m.block) applyBlock(m.block);
    if (m.blocks) applyBlocks(m.blocks);
    if (m['mempool-blocks']) applyMempoolBlocks(m['mempool-blocks'], force);
    if (m.fees) applyFees(m.fees, force);
    if (m.mempoolInfo) applyMempoolInfo(m.mempoolInfo, force);
    if (m.da) applyDa(m.da, force);
    if (m.conversions) applyConversions(m.conversions);
  }

  /* stats-family gate: at ~1 push/s, applying every Nth is still live —
     panels were built for a 30 s world (see header) */
  function due(key, force) {
    var now = Date.now();
    if (!force && now - lastApply[key] < APPLY_MIN_MS) return false;
    lastApply[key] = now;
    return true;
  }

  /* single block push — THE new-block moment */
  function applyBlock(b) {
    if (!b || bad(b.height)) return;
    var cur = store.get('blocks') || [];
    var top = cur.length ? cur[0].height : NaN;
    if (!bad(top) && b.height <= top) {
      /* same-height or lower: reorg replacement or replay — refresh the
         entry if we hold it, never flash, never bump the tip (the 60 s
         REST blocks poll trues up anything deeper) */
      var next = cur.slice();
      for (var i = 0; i < next.length; i++) {
        if (next[i] && next[i].height === b.height) next[i] = b;
      }
      store.set('blocks', next);
      log('block ' + b.height + ' (replacement)');
      return;
    }
    store.set('blocks', [b].concat(cur).slice(0, BLOCKS_KEPT));
    bumpTip(b.height);
    flashNewBlock();
    log('block ' + b.height + ' landed');
  }

  /* the want-response dump (ascending, unlike REST) — adopt it if it
     parses as blocks and doesn't regress the window we already hold */
  function applyBlocks(arr) {
    if (!Array.isArray(arr) || !arr.length) return;
    var ok = [];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] && !bad(arr[i].height)) ok.push(arr[i]);
    }
    if (!ok.length) return;
    ok.sort(function (a, b) { return b.height - a.height; });
    ok = ok.slice(0, BLOCKS_KEPT);
    var cur = store.get('blocks') || [];
    if (cur.length && cur[0].height > ok[0].height) return;
    store.set('blocks', ok);
    bumpTip(ok[0].height);
    log('blocks dump adopted (tip ' + ok[0].height + ')');
  }

  /* NOTES rule: bump tipHeight only when the height actually moved —
     set() fires subscribers even on unchanged values */
  function bumpTip(h) {
    var cur = store.get('tipHeight');
    if (bad(cur) || h > cur) store.set('tipHeight', h);
  }

  function applyMempoolBlocks(arr, force) {
    if (!Array.isArray(arr) || !arr.length) return;
    if (!arr[0] || bad(arr[0].blockVSize)) return; /* not the shape REST serves */
    if (!due('mempoolBlocks', force)) return;
    store.set('mempoolBlocks', arr);
  }

  function applyFees(f, force) {
    if (!f || bad(f.fastestFee)) return;
    if (!due('fees', force)) return;
    store.set('fees', f);
  }

  /* bitcoind getmempoolinfo shape -> the /api/mempool shape panels read.
     size -> count, bytes -> vsize (both verified live). total_fee is NOT
     mapped: the push quotes BTC where REST quotes sats. fee_histogram
     only exists in REST — carry the last one forward while the slowed
     REST poll keeps refreshing it (every 150 s), but if REST stops
     succeeding the carry must EXPIRE: an aged histogram riding the
     socket's freshness would feed the fees panel's clearing-rate line a
     live-looking lie. Expired -> empty -> the panel's honest dash. */
  var EMPTY_HIST = [];
  var histRef = null, histAt = 0;
  function applyMempoolInfo(info, force) {
    if (!info || bad(info.size) || bad(info.bytes)) return;
    if (!due('mempool', force)) return;
    var cur = store.get('mempool') || {};
    var hist = cur.fee_histogram;
    /* an array we didn't write ourselves is a fresh REST delivery */
    if (hist && hist !== histRef && hist !== EMPTY_HIST) { histRef = hist; histAt = Date.now(); }
    var fresh = histRef && Date.now() - histAt <= HIST_MAX_MS;
    store.set('mempool', {
      count: info.size,
      vsize: info.bytes,
      /* same REST body, same clock: an expired carry must not leave a
         live-looking total_fee behind for a future consumer (task 11) */
      total_fee: fresh ? cur.total_fee : undefined,
      fee_histogram: fresh ? histRef : EMPTY_HIST
    });
  }

  /* same DifficultyAdjustment object the REST endpoint serves (verified
     live: every field panels 03/07 read is present) */
  function applyDa(da, force) {
    if (!da || bad(da.progressPercent) || bad(da.remainingBlocks)) return;
    if (!due('difficulty', force)) return;
    store.set('difficulty', da);
  }

  /* prices push — same {time, USD, ...} object as REST, but occasional
     (observed ~once/min, not a heartbeat), so the prices poll keeps full
     cadence and this is a freshness bonus */
  function applyConversions(c) {
    if (!c || bad(c.USD) || c.USD <= 0) return;
    store.set('prices', c);
  }

  /* ---- the new-block flash --------------------------------------------- */

  /* the strip's first real tile just became the new block — accent wash
     that settles back into the tile surface. The tiles are panel 03's
     fixed nodes (it re-texts them in place, never rebuilds), so the class
     survives the panel's own re-render. Runs AFTER store.set so the tile
     already shows the new numbers when the wash starts. */
  var flashTile = null;
  function flashNewBlock() {
    if (!flashTile) {
      flashTile = document.querySelector('[data-block-strip] .block-tile:not(.block-next)');
    }
    if (!flashTile) return;
    flashTile.classList.remove('flash-tile');
    void flashTile.offsetWidth; /* restart the animation */
    flashTile.classList.add('flash-tile');
  }

  /* ---- live title -------------------------------------------------------- */

  /* "⎈ 954,321 · $118k · 3 sat/vB" — height · spot · fastest fee.
     Subscribed to the store, not the socket: REST-delivered updates
     retitle too. Skips the DOM write when nothing changed (set() fires
     on unchanged values). The title is a display surface like any panel,
     so it gets the honest-states treatment: values kept but a leading
     "STALE ·" marker once any of its keys outlives every honest cadence
     (a backgrounded tab's title must not assert a frozen number all
     night). Never-fetched keys render the loading dash, not STALE. */
  var lastTitle = '';
  function titleStale() {
    var keys = ['tipHeight', 'prices', 'fees'], worst = 0;
    for (var i = 0; i < keys.length; i++) {
      var age = store.age(keys[i]);
      if (isFinite(age) && age > worst) worst = age;
    }
    return worst > TITLE_STALE_S;
  }
  function updateTitle() {
    var p = store.get('prices') || {};
    var f = store.get('fees') || {};
    var usd = (!bad(p.USD) && p.USD > 0) ? p.USD : NaN; /* a zero/negative quote is an API lie */
    /* STALE leads: a narrow tab truncates the tail, and the truncated,
       backgrounded tab is exactly where the marker matters most */
    var t = '⎈ ' + (titleStale() ? 'STALE · ' : '')
          + fmt.int(store.get('tipHeight'))
          + ' · ' + fmt.usdK(usd)
          + ' · ' + fmt.satvb(f.fastestFee) + ' sat/vB';
    if (t !== lastTitle) { lastTitle = t; document.title = t; }
  }
  store.on('tipHeight', updateTitle);
  store.on('prices', updateTitle);
  store.on('fees', updateTitle);
  setInterval(updateTitle, 30000); /* staleness appears without a store event */
  updateTitle();

  /* ---- liveness ----------------------------------------------------------- */

  /* the server pushes ~every second — a minute of silence is a dead
     socket even if the browser still calls it open */
  setInterval(function () {
    if (stopped || !ws || !healthy) return;
    if (Date.now() - lastMsgAt > SILENT_MAX_MS) {
      log('silent ' + SILENT_MAX_MS / 1000 + ' s — presuming dead, reconnecting');
      failures = 0;
      connect(); /* connect() drops health itself */
    }
  }, WATCHDOG_MS);

  window.addEventListener('online', function () {
    if (stopped) return;
    log('browser online — reconnecting now');
    failures = 0;
    connect();
  });

  /* background tabs throttle timers — on wake, don't wait for the watchdog */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || stopped) return;
    if (healthy && Date.now() - lastMsgAt > SILENT_MAX_MS) {
      log('woke to a silent socket — reconnecting');
      failures = 0;
      connect(); /* connect() drops health itself */
    }
  });
})();
