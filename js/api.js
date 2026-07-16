/* Bitcoin Hull — HULL.api: the only code that touches the network.
   One poll per endpoint: staggered start, per-endpoint exponential
   backoff (5 s doubling, capped at 5 min), browser online/offline aware.
   Derives the page-wide connection state into store key "conn":
     polling  — boot, no request resolved yet
     live     — every resolved endpoint fresh
     degraded — some endpoints stale (no data for >2× their interval,
                or ≥2 consecutive failures)
     down     — all endpoints stale, or the browser reports offline
   Open with ?debug=1 for one console line per poll attempt. */
(function () {
  'use strict';

  var HULL = window.HULL = window.HULL || {};
  var store = HULL.store;

  var DEBUG = /[?&]debug=1(&|$)/.test(location.search);
  var FETCH_TIMEOUT_MS = 15000;
  var BACKOFF_BASE_MS = 5000;
  var BACKOFF_MAX_MS = 300000; /* 5 min hard cap */
  var STAGGER_MS = 350;
  var CONN_TICK_MS = 10000;

  var polls = []; /* { name, path, storeKey, intervalMs, failures, hasSucceeded, timer, idx } */

  function log(msg) { if (DEBUG) console.log('[hull] ' + msg); }

  var api = {
    /* The ONE base URL. Deliberately a mutable property: point it at a
       garbage host from the console (then HULL.api.refresh()) to rehearse
       the down/recover path. */
    BASE: 'https://mempool.space',

    poll: function (name, path, storeKey, intervalMs) {
      var p = { name: name, path: path, storeKey: storeKey, intervalMs: intervalMs,
                failures: 0, hasSucceeded: false, timer: null, seq: 0, idx: polls.length };
      polls.push(p);
      schedule(p, p.idx * STAGGER_MS); /* staggered start */
    },

    /* re-run every poll now (keeps per-endpoint backoff counters) */
    refresh: function () {
      for (var i = 0; i < polls.length; i++) schedule(polls[i], polls[i].idx * 100);
    }
  };
  HULL.api = api;

  /* Every schedule() bumps p.seq, invalidating older timer chains AND older
     in-flight attempts: a hung fetch that settles late (e.g. after an
     online-recovery refresh) must not clobber the fresh timer with its
     stale backoff. */
  function schedule(p, delayMs) {
    clearTimeout(p.timer);
    var seq = ++p.seq;
    p.timer = setTimeout(function () { attempt(p, seq); }, delayMs);
  }

  function attempt(p, seq) {
    if (navigator.onLine === false) {
      /* browser says offline: don't burn a request — the "online" handler
         refires everything; this reschedule is just a safety net */
      schedule(p, BACKOFF_MAX_MS);
      updateConn();
      return;
    }
    var ctrl = new AbortController();
    var kill = setTimeout(function () { ctrl.abort(); }, FETCH_TIMEOUT_MS);
    var t0 = performance.now();

    fetch(api.BASE + p.path, { cache: 'no-store', signal: ctrl.signal })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (body) {
        /* fresh data is fresh data, even from a superseded attempt */
        p.failures = 0;
        p.hasSucceeded = true;
        store.set(p.storeKey, body);
        log(p.name + ' ok (' + Math.round(performance.now() - t0) + ' ms)');
        if (seq === p.seq) schedule(p, p.intervalMs);
      })
      .catch(function (err) {
        if (seq !== p.seq) return; /* superseded — the live chain measures its own failures */
        p.failures += 1;
        var wait = Math.min(BACKOFF_BASE_MS * Math.pow(2, p.failures - 1), BACKOFF_MAX_MS);
        log(p.name + ' failed (' + (err && err.message) + ') — retry in ' + Math.round(wait / 1000) + ' s');
        schedule(p, wait);
      })
      .then(function () {
        clearTimeout(kill);
        updateConn();
      });
  }

  function isStale(p) {
    if (!p.hasSucceeded) return true;
    if (p.failures >= 2) return true;
    return store.age(p.storeKey) > (2 * p.intervalMs) / 1000;
  }

  function updateConn() {
    var state;
    if (navigator.onLine === false) {
      state = 'down';
    } else {
      var resolved = [];
      for (var i = 0; i < polls.length; i++) {
        if (polls[i].hasSucceeded || polls[i].failures > 0) resolved.push(polls[i]);
      }
      if (resolved.length === 0) {
        state = 'polling';
      } else {
        var stale = 0;
        for (var j = 0; j < resolved.length; j++) { if (isStale(resolved[j])) stale += 1; }
        state = stale === 0 ? 'live' : (stale === resolved.length ? 'down' : 'degraded');
      }
    }
    if (store.get('conn') !== state) {
      store.set('conn', state);
      log('conn -> ' + state);
    }
  }

  window.addEventListener('offline', function () {
    log('browser offline');
    updateConn();
  });
  window.addEventListener('online', function () {
    log('browser online — repolling');
    for (var i = 0; i < polls.length; i++) polls[i].failures = 0;
    api.refresh();
  });

  /* staleness grows between fetch events — keep the chip honest */
  setInterval(updateConn, CONN_TICK_MS);

  store.set('conn', 'polling');
})();
