/* Bitcoin Hull — HULL.fmt: every number on the page goes through here.
   Formatters take the raw API value and return a display string.
   Non-finite input returns the loading dash, so panels can pipe a
   missing value straight through and get the honest loading state. */
(function () {
  'use strict';

  var HULL = window.HULL = window.HULL || {};

  var DASH = '—'; /* — */
  var intFmt = new Intl.NumberFormat('en-US');
  var btcFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 });

  function bad(n) { return typeof n !== 'number' || !isFinite(n); }

  /* "9.0" -> "9", "2.50" -> "2.5" — only ever fed toFixed() output */
  function strip(s) {
    return s.indexOf('.') === -1 ? s : s.replace(/0+$/, '').replace(/\.$/, '');
  }

  HULL.fmt = {

    /* 1234567.4 -> "1,234,567" */
    int: function (n) {
      if (bad(n)) return DASH;
      return intFmt.format(Math.round(n));
    },

    /* 20044753 -> "20,044,753" · 3.125 -> "3.125" */
    btc: function (n) {
      if (bad(n)) return DASH;
      return btcFmt.format(n);
    },

    /* 118420 -> "$118,420" · 2.37e12 -> "$2.37T" */
    usd: function (n) {
      if (bad(n)) return DASH;
      if (n >= 1e12) return '$' + strip((n / 1e12).toFixed(2)) + 'T';
      return '$' + intFmt.format(Math.round(n));
    },

    /* fee rates: one decimal below 10 sat/vB, whole numbers above */
    satvb: function (n) {
      if (bad(n)) return DASH;
      if (n >= 10) return intFmt.format(Math.round(n));
      return strip(n.toFixed(1));
    },

    /* 37.42 -> "37.4%" · pct(2.1, true) -> "+2.1%" */
    pct: function (n, signed) {
      if (bad(n)) return DASH;
      return (signed && n > 0 ? '+' : '') + strip(n.toFixed(1)) + '%';
    },

    /* unix seconds -> "just now" / "4 min ago" / "3 h ago" / "2 d ago" */
    ago: function (ts) {
      if (bad(ts)) return DASH;
      var d = Math.max(0, Date.now() / 1000 - ts);
      if (d < 60) return 'just now';
      if (d < 3600) return Math.floor(d / 60) + ' min ago';
      if (d < 172800) return Math.round(d / 3600) + ' h ago';
      return Math.round(d / 86400) + ' d ago';
    },

    /* seconds -> "45 s" / "12 min" / "3.4 h" / "8.8 d" */
    dur: function (secs) {
      if (bad(secs)) return DASH;
      var s = Math.max(0, secs);
      if (s < 60) return Math.round(s) + ' s';
      if (s < 3600) return Math.round(s / 60) + ' min';
      if (s < 86400) return strip((s / 3600).toFixed(1)) + ' h';
      return strip((s / 86400).toFixed(1)) + ' d';
    },

    /* raw H/s -> EH/s number only ("912", "91.2") — unit lives in markup */
    ehs: function (hs) {
      if (bad(hs)) return DASH;
      var v = hs / 1e18;
      if (v >= 100) return intFmt.format(Math.round(v));
      if (v >= 10) return strip(v.toFixed(1));
      return strip(v.toFixed(2));
    },

    /* raw difficulty -> "127.4 T" */
    diffT: function (d) {
      if (bad(d)) return DASH;
      return strip((d / 1e12).toFixed(1)) + ' T';
    }
  };
})();
