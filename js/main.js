/* Bitcoin Hull — boot: start every REST poll (intervals per _SHARED.md)
   and drive the header status chip from the "conn" store key.
   Panels wire up in tasks 03–08. */
(function () {
  'use strict';

  var HULL = window.HULL;

  /* task 09: the websocket can out-run these two polls around a block
     arrival — a response serialized pre-block must not regress the newer
     pushed tip (backward header flash, vanishing strip tile) */
  function acceptTip(nv, cur) {
    return !(typeof cur === 'number' && typeof nv === 'number' && nv < cur);
  }
  function acceptBlocks(nv, cur) {
    return !(cur && cur.length && nv && nv.length &&
             typeof nv[0].height === 'number' && typeof cur[0].height === 'number' &&
             nv[0].height < cur[0].height);
  }

  /* task 12: Luke Dashjr's node-count history is plain text, one row per
     day: "ts listening est_nonlistening [knots core30 rdts]". His own
     chart page sums col2+col3 for "Total node count" — col3 ALONE is the
     extrapolated non-listening estimate, NOT the total; the trailing
     version-split columns stay unused (version stats are out of scope).
     Malformed rows are skipped; an empty parse throws so the poll records
     a failure instead of storing junk. Newest row found by timestamp, not
     file position — his infra is fragile enough not to trust ordering. */
  function parseNodes(text) {
    var lines = text.split('\n'), rows = [], last = null;
    for (var i = 0; i < lines.length; i++) {
      var f = lines[i].trim().split(/\s+/);
      if (f.length < 3) continue;
      var ts = +f[0], listening = +f[1], total = +f[1] + +f[2];
      if (!isFinite(ts) || !isFinite(listening) || !isFinite(total)) continue;
      var row = { ts: ts, listening: listening, total: total };
      rows.push(row);
      if (!last || ts >= last.ts) last = row;
    }
    if (!last) throw new Error('no parsable rows');
    return { ts: last.ts, listening: last.listening, total: last.total, rows: rows };
  }

  /* name, path, store key, interval, accept, opts — the _SHARED.md endpoint
     table. nodes (task 12) is the one second-origin feed: absolute URL,
     text parser, 6 h cadence, aux = never gates the conn chip. */
  var POLLS = [
    ['tipHeight',     '/api/blocks/tip/height',        'tipHeight',     60000, acceptTip],
    ['blocks',        '/api/v1/blocks',                'blocks',        60000, acceptBlocks],
    ['fees',          '/api/v1/fees/recommended',      'fees',          30000],
    ['mempool',       '/api/mempool',                  'mempool',       30000],
    ['mempoolBlocks', '/api/v1/fees/mempool-blocks',   'mempoolBlocks', 30000],
    ['prices',        '/api/v1/prices',                'prices',        60000],
    ['difficulty',    '/api/v1/difficulty-adjustment', 'difficulty',    300000],
    ['hashrate',      '/api/v1/mining/hashrate/3d',    'hashrate',      300000],
    ['nodes',         'https://luke.dashjr.org/programs/bitcoin/files/charts/data/history.txt',
                                                       'nodes',       21600000, null,
                                                       { parse: parseNodes, aux: true, backoffCapMs: 3600000 }],
    /* task 15 (Clark expansion, 2026-07-17): slow-moving 6 h feeds. ALL are
       aux — none of them is the page's live pulse, so none may flip the conn
       chip. Same-origin mempool.space first, then blockchain.info charts
       (CORS verified: exactly one ACAO header with cors=true). */
    ['lightning',     '/api/v1/lightning/statistics/latest',
                                                       'lightning',   21600000, null, { aux: true }],
    ['minersRevenue', 'https://api.blockchain.info/charts/miners-revenue?timespan=1year&format=json&cors=true',
                                                       'minersRevenue', 21600000, null, { aux: true, backoffCapMs: 3600000 }],
    ['diffHistory',   '/api/v1/mining/difficulty-adjustments',
                                                       'diffHistory', 21600000, null, { aux: true }],
    ['hashrate3y',    '/api/v1/mining/hashrate/3y',
                                                       'hashrate3y',  21600000, null, { aux: true }],
    ['utxoSeries',    'https://api.blockchain.info/charts/utxo-count?timespan=4years&format=json&sampled=true&cors=true',
                                                       'utxoSeries',  21600000, null, { aux: true, backoffCapMs: 3600000 }],
    ['chainSize',     'https://api.blockchain.info/charts/blocks-size?timespan=1weeks&format=json&cors=true',
                                                       'chainSize',   21600000, null, { aux: true, backoffCapMs: 3600000 }],
    ['priceSeries',   'https://api.blockchain.info/charts/market-price?timespan=3years&format=json&sampled=true&cors=true',
                                                       'priceSeries', 21600000, null, { aux: true, backoffCapMs: 3600000 }],
    ['txSeries',      'https://api.blockchain.info/charts/n-transactions?timespan=3years&format=json&sampled=true&cors=true',
                                                       'txSeries',    21600000, null, { aux: true, backoffCapMs: 3600000 }]
  ];
  /* task 12: seed the nodes store from the baked Luke history BEFORE the
     polls start — his server's duplicate CORS header blocks every browser
     today, so the bake is the floor; a live poll success simply overwrites
     it (identical shape, no baked flag) and the page self-heals the day he
     fixes the header. */
  if (HULL.baked && HULL.baked.nodes && HULL.baked.nodes.rows.length) {
    var bakedRows = HULL.baked.nodes.rows.map(function (r) {
      return { ts: r[0], listening: r[1], total: r[2] };
    });
    var bakedLast = bakedRows[bakedRows.length - 1];
    HULL.store.set('nodes', { ts: bakedLast.ts, listening: bakedLast.listening,
                              total: bakedLast.total, rows: bakedRows,
                              baked: HULL.baked.nodes.asOf });
  }

  for (var i = 0; i < POLLS.length; i++) {
    HULL.api.poll(POLLS[i][0], POLLS[i][1], POLLS[i][2], POLLS[i][3], POLLS[i][4], POLLS[i][5]);
  }

  /* status chip: ● LIVE (websocket healthy) / POLLING (REST-only) /
     DEGRADED / DOWN — task 09 semantics, computed in js/api.js */
  var chip = document.querySelector('[data-conn-chip]');
  var label = chip.querySelector('[data-conn-label]');
  var CHIP = {
    polling:  { cls: 'chip-polling',  text: 'POLLING' },
    live:     { cls: 'chip-live',     text: 'LIVE' },
    degraded: { cls: 'chip-degraded', text: 'DEGRADED' },
    down:     { cls: 'chip-down',     text: 'DOWN' }
  };
  function renderConn(state) {
    var s = CHIP[state] || CHIP.polling;
    chip.className = 'chip ' + s.cls;
    label.textContent = s.text;
  }
  HULL.store.on('conn', renderConn);
  renderConn(HULL.store.get('conn'));

  HULL.live.start(); /* task 09: the websocket layer — LIVE means this */
})();
