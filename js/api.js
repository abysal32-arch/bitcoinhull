/* Bitcoin Hull — HULL.api: the only code that touches the network.
   One poll per endpoint: staggered start, per-endpoint exponential
   backoff (5 s doubling, capped at 5 min), browser online/offline aware.
   Derives the page-wide connection state into store key "conn"
   (task 09 semantics — LIVE means the push layer, not just REST):
     live     — WebSocket healthy (HULL.live reports via setPush)
     polling  — REST-only: socket not delivering, REST endpoints fresh
                (boot before the socket connects looks like this too)
     degraded — some endpoints stale (no data for >2× their effective
                interval, or ≥2 consecutive failures); also all-stale
                while the socket is healthy (push data still flowing)
     down     — all endpoints stale with no socket, or browser offline
   setCadence(keys, factor) stretches covered polls while the socket is
   healthy — belt and suspenders, not a stop.
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

  var polls = []; /* { name, path, storeKey, intervalMs, cadence, failures, hasSucceeded, timer, idx } */
  var pushHealthy = false; /* HULL.live's verdict, via setPush() */

  function log(msg) { if (DEBUG) console.log('[hull] ' + msg); }

  var api = {
    /* The ONE base URL. Deliberately a mutable property: point it at a
       garbage host from the console (then HULL.api.refresh()) to rehearse
       the down/recover path. */
    BASE: 'https://mempool.space',

    /* accept (optional): accept(newBody, currentValue) -> false to keep
       the current store value (the endpoint still counts as healthy).
       Task 09: the socket can out-run a poll around a block arrival — a
       response serialized pre-block must not regress the newer push. */
    poll: function (name, path, storeKey, intervalMs, accept) {
      var p = { name: name, path: path, storeKey: storeKey, intervalMs: intervalMs,
                accept: accept || null, cadence: 1, failures: 0, hasSucceeded: false,
                timer: null, seq: 0, idx: polls.length };
      polls.push(p);
      schedule(p, p.idx * STAGGER_MS); /* staggered start */
    },

    /* re-run every poll now (keeps per-endpoint backoff counters) */
    refresh: function () {
      for (var i = 0; i < polls.length; i++) schedule(polls[i], polls[i].idx * 100);
    },

    /* task 09: stretch (or restore) the success cadence of the polls
       whose store keys the push layer covers. Restoring fires the
       affected polls now — they may be up to factor× behind. */
    setCadence: function (keys, factor) {
      for (var i = 0; i < polls.length; i++) {
        var p = polls[i];
        if (keys.indexOf(p.storeKey) === -1 || p.cadence === factor) continue;
        var speedup = factor < p.cadence;
        p.cadence = factor;
        if (speedup) schedule(p, p.idx * 100);
        log(p.name + ' cadence ×' + factor);
      }
    },

    /* task 09: HULL.live reports socket health; conn folds it in */
    setPush: function (healthy) {
      if (pushHealthy === !!healthy) return;
      pushHealthy = !!healthy;
      updateConn();
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
        if (!p.accept || p.accept(body, store.get(p.storeKey))) {
          store.set(p.storeKey, body);
          log(p.name + ' ok (' + Math.round(performance.now() - t0) + ' ms)');
        } else {
          log(p.name + ' ok but superseded by a newer push — kept current');
        }
        if (seq === p.seq) schedule(p, p.intervalMs * p.cadence);
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
    /* effective interval: a stretched poll isn't late, it's on its own
       schedule (push writes keep the store age near zero anyway) */
    return store.age(p.storeKey) > (2 * p.intervalMs * p.cadence) / 1000;
  }

  function updateConn() {
    var state;
    if (navigator.onLine === false && !pushHealthy) {
      /* the browser's offline verdict can be a false negative (VPN and
         virtual adapters) — a socket that is still delivering outranks it */
      state = 'down';
    } else {
      var resolved = [];
      for (var i = 0; i < polls.length; i++) {
        if (polls[i].hasSucceeded || polls[i].failures > 0) resolved.push(polls[i]);
      }
      if (resolved.length === 0) {
        /* boot: nothing resolved yet — but a healthy socket has already
           filled the store, and that IS live data */
        state = pushHealthy ? 'live' : 'polling';
      } else {
        var stale = 0;
        for (var j = 0; j < resolved.length; j++) { if (isStale(resolved[j])) stale += 1; }
        if (stale === 0) state = pushHealthy ? 'live' : 'polling';
        else if (stale === resolved.length) state = pushHealthy ? 'degraded' : 'down';
        else state = 'degraded';
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
