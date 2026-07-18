/* Bitcoin Hull — HULL.store: the one state atom. Panels read + subscribe
   here and never fetch. set() stamps updatedAt so staleness is always
   computable; age() is seconds since the key was last written. */
(function () {
  'use strict';

  var HULL = window.HULL = window.HULL || {};

  var KEYS = ['tipHeight', 'blocks', 'fees', 'mempool', 'mempoolBlocks',
              'prices', 'difficulty', 'hashrate', 'nodes', 'conn',
              /* task 15 (Clark expansion) + Integrity history feeds */
              'lightning', 'minersRevenue', 'diffHistory', 'hashrate3y',
              'utxoSeries', 'chainSize', 'priceSeries', 'txSeries'];

  var data = {}; /* key -> { value, updatedAt(ms) } */
  var subs = {}; /* key -> [fn] */

  HULL.store = {
    KEYS: KEYS,

    get: function (key) {
      return data[key] ? data[key].value : undefined;
    },

    /* seconds since last set(); Infinity if never set */
    age: function (key) {
      return data[key] ? (Date.now() - data[key].updatedAt) / 1000 : Infinity;
    },

    set: function (key, value) {
      if (KEYS.indexOf(key) === -1) {
        console.warn('[hull] store.set: unknown key "' + key + '" — add it to store.KEYS');
      }
      data[key] = { value: value, updatedAt: Date.now() };
      var fns = (subs[key] || []).slice(); /* snapshot: unsubscribe during dispatch can't skip anyone */
      for (var i = 0; i < fns.length; i++) {
        try { fns[i](value, key); }
        catch (err) { console.error('[hull] subscriber for "' + key + '" threw:', err); }
      }
    },

    /* subscribe; returns an unsubscribe function */
    on: function (key, fn) {
      (subs[key] = subs[key] || []).push(fn);
      return function off() {
        var fns = subs[key] || [];
        var i = fns.indexOf(fn);
        if (i !== -1) fns.splice(i, 1);
      };
    }
  };
})();
