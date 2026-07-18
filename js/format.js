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
  var monthFmt = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

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

    /* compact USD for tight spots (the live title, task 09):
       845 -> "$845" · 9420 -> "$9.42k" · 118420 -> "$118k" · 2.37e12 -> "$2.37T" */
    usdK: function (n) {
      if (bad(n)) return DASH;
      if (n < 1e3) return '$' + intFmt.format(Math.round(n));
      var units = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'k']], i;
      for (i = 0; i < units.length - 1 && n < units[i][0]; i++) { /* pick */ }
      var v = n / units[i][0];
      /* rounding can carry into the next unit up: 999,600 is "$1M", not
         "$1,000k" — test the rounding the >=100 branch will actually do */
      if (Math.round(v) >= 1000 && i > 0) { i -= 1; v = n / units[i][0]; }
      var u = units[i][1];
      if (v >= 100) return '$' + intFmt.format(Math.round(v)) + u;
      if (v >= 10) return '$' + strip(v.toFixed(1)) + u;
      return '$' + strip(v.toFixed(2)) + u;
    },

    /* fee rates: one decimal below 10 sat/vB, whole numbers above */
    satvb: function (n) {
      if (bad(n)) return DASH;
      if (n >= 10) return intFmt.format(Math.round(n));
      return strip(n.toFixed(1));
    },

    /* 37.42 -> "37.4%" · pct(2.1, true) -> "+2.1%" · pct(95.447, null, 2) -> "95.45%" */
    pct: function (n, signed, dp) {
      if (bad(n)) return DASH;
      return (signed && n > 0 ? '+' : '') + strip(n.toFixed(dp == null ? 1 : dp)) + '%';
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

    /* unix seconds -> "May 2028" — month precision only; anything finer is a
       lie for multi-year block-count ETAs */
    monthYear: function (ts) {
      if (bad(ts)) return DASH;
      return monthFmt.format(new Date(ts * 1000));
    },

    /* bytes or vB -> millions, number only ("1.6", "0.42") — unit (MB/MvB) lives in markup */
    mb: function (n) {
      if (bad(n)) return DASH;
      var v = n / 1e6;
      if (v >= 10) return intFmt.format(Math.round(v));
      if (v >= 1) return strip(v.toFixed(1));
      return strip(v.toFixed(2));
    },

    /* seconds -> one-decimal minutes: 588 -> "9.8 min" */
    mins: function (secs) {
      if (bad(secs)) return DASH;
      return strip(Math.max(0, secs / 60).toFixed(1)) + ' min';
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
    },

    /* seconds -> "10:01" (block-interval clock face; Clark-style) */
    mmss: function (secs) {
      if (bad(secs)) return DASH;
      var s = Math.max(0, Math.round(secs));
      var m = Math.floor(s / 60), r = s % 60;
      return m + ':' + (r < 10 ? '0' : '') + r;
    },

    /* unix MILLISECONDS -> "July 26, 2026" (retarget-date precision is
       day-scale honest, unlike the multi-year halving ETA) */
    dateLong: function (ms) {
      if (bad(ms)) return DASH;
      return new Intl.DateTimeFormat('en-US',
        { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(ms));
    },

    /* big USD with 1dp unit: 145.4e9 -> "$145.4B" · 273.7e6 -> "$273.7M" */
    usdBig: function (n) {
      if (bad(n)) return DASH;
      var units = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M']];
      for (var i = 0; i < units.length; i++) {
        if (n >= units[i][0]) return '$' + strip((n / units[i][0]).toFixed(1)) + units[i][1];
      }
      return '$' + intFmt.format(Math.round(n));
    },

    /* BTC to 2dp: 4788.78771889 -> "4,788.79" (fmt.btc keeps all 8 decimals) */
    btc2: function (n) {
      if (bad(n)) return DASH;
      return new Intl.NumberFormat('en-US',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    },

    /* gigabytes (already GB) -> "860.3 GB" · "0.4 GB" */
    gb: function (n) {
      if (bad(n)) return DASH;
      return strip(n.toFixed(1)) + ' GB';
    },

    /* chain work log2 -> "96.2 bits" */
    bits: function (n) {
      if (bad(n)) return DASH;
      return strip(n.toFixed(1)) + ' bits';
    },

    /* incoming flow: 845 -> "845 vB/s" · 2340 -> "2.3 kvB/s" — unit
       included because it switches (precedent: fmt.dur) */
    vbps: function (n) {
      if (bad(n)) return DASH;
      if (n < 1000) return intFmt.format(Math.round(n)) + ' vB/s';
      return strip((n / 1000).toFixed(1)) + ' kvB/s';
    },

    /* transaction rate: 7.83 -> "7.8 tx/s" · 12.4 -> "12 tx/s" (task 17) */
    txs: function (n) {
      if (bad(n)) return DASH;
      if (n >= 10) return intFmt.format(Math.round(n)) + ' tx/s';
      return strip(n.toFixed(1)) + ' tx/s';
    }
  };
})();
