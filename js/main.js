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

  /* task 29: both LN feeds ride third-party indexers that already serve
     junk-shaped 200s in the wild (mempool.space's interval routes return
     []) — a payload without a dated `latest` snapshot must count as a
     FAILED attempt (backoff, no store write), never refresh the key's age
     with unrenderable data. */
  function parseLn(text) {
    var j = JSON.parse(text);
    if (!j || !j.latest || typeof j.latest.added !== 'string' ||
        !isFinite(Date.parse(j.latest.added))) {
      throw new Error('unexpected lightning payload');
    }
    return j;
  }

  /* task 28: TWO polls feed the 'nodes' store key — Luke's own origin
     (browser-dead today: doubled ACAO header; kept armed to self-heal) and
     the bitcoin-data nightly GitHub mirror of the same file, which lags the
     origin by up to ~a day. Whichever answers, an older newest-row must
     never regress a newer one (also protects a fresh row against the boot
     bake re-seeding order). */
  function acceptNodes(nv, cur) {
    return !(cur && nv && typeof cur.ts === 'number' && typeof nv.ts === 'number' &&
             nv.ts < cur.ts);
  }

  /* task 17: CoinGecko treasuries payload -> the small shape the minor
     card needs. A missing total throws so the poll records a failure
     instead of storing junk. */
  function parseTreasuries(text) {
    var j = JSON.parse(text);
    if (!j || typeof j.total_holdings !== 'number' || !isFinite(j.total_holdings)) {
      throw new Error('unexpected treasuries payload');
    }
    return { btc: j.total_holdings,
             companies: j.companies && j.companies.length ? j.companies.length : NaN };
  }

  /* task 18: Blockchair live scalars — a FRAGILE origin (their docs
     discourage client-side use, the anti-bot heuristic can 430 an IP at
     low volume, and they reserve the right to drop CORS without notice).
     Contract: gentle 15-min poll, failures are an EXPECTED state (panels
     fall back to the daily charts when this feed isn't fresh — see
     17-transactions.js / 15-blockchain.js), and never read its `nodes`
     (broken non-metric, reads 303) or `outputs` (includes spent). */
  function parseChairStats(text) {
    var j = JSON.parse(text);
    var d = j && j.data;
    if (!d || typeof d.transactions !== 'number' || !isFinite(d.transactions)) {
      throw new Error('unexpected blockchair payload');
    }
    return { tx: d.transactions, sizeBytes: d.blockchain_size };
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
                                                       'nodes',       21600000, acceptNodes,
                                                       { parse: parseNodes, aux: true, backoffCapMs: 3600000 }],
    /* task 28: nightly GitHub-Actions mirror of the SAME file (bitcoin-data/
       bitcoin-stats-archive, luke-jr branch). raw.githubusercontent.com sends
       exactly ONE ACAO header, so unlike Luke's origin this one reaches real
       browsers (fetched in-page from the bitcoinhull.com origin, 2026-07-20)
       — turns the monthly node bake into a live daily feed; the bake stays
       as the boot floor and Luke's direct poll stays armed above. */
    ['nodesMirror',   'https://raw.githubusercontent.com/bitcoin-data/bitcoin-stats-archive/luke-jr/history.txt',
                                                       'nodes',       21600000, acceptNodes,
                                                       { parse: parseNodes, aux: true, backoffCapMs: 3600000 }],
    /* task 15 (Clark expansion, 2026-07-17): slow-moving 6 h feeds. ALL are
       aux — none of them is the page's live pulse, so none may flip the conn
       chip. Same-origin mempool.space first, then blockchain.info charts
       (CORS verified: exactly one ACAO header with cors=true). */
    ['lightning',     '/api/v1/lightning/statistics/latest',
                                                       'lightning',   21600000, null,
                                                       { parse: parseLn, aux: true, backoffCapMs: 3600000 }],
    /* task 28: mempool.space's LN statistics pipeline has been stalled since
       mid-June 2026 (its snapshot even regressed 06-18 -> 06-16); Emzy's
       public instance runs the identical API with a healthy DAILY indexer
       (ACAO ×1 + in-page fetch from the bitcoinhull.com origin, 2026-07-20).
       The panel shows whichever feed carries the newest dated snapshot (see
       15-lightning.js); this key must never join a panel's stale FEEDS —
       its death silently falls back to the mempool.space snapshot. */
    ['lightningFresh','https://mempool.emzy.de/api/v1/lightning/statistics/latest',
                                                       'lightningFresh', 21600000, null,
                                                       { parse: parseLn, aux: true, backoffCapMs: 3600000 }],
    /* task 30: second fresh LN instance — emzy alone was a single point of
       freshness (its death would fall back to the ~5-week-stale
       mempool.space snapshot). mempool.guide runs the same API, ACAO ×1,
       snapshot dated today at wiring (operator unidentified — that is why
       it ranks BELOW emzy in the panel's tie-break, and why it renders
       only when it genuinely holds the newest alive snapshot). */
    ['lightningGuide','https://mempool.guide/api/v1/lightning/statistics/latest',
                                                       'lightningGuide', 21600000, null,
                                                       { parse: parseLn, aux: true, backoffCapMs: 3600000 }],
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
                                                       'txSeries',    21600000, null, { aux: true, backoffCapMs: 3600000 }],
    /* task 17 (Joe, 2026-07-18): transactions panel — cumulative all-time
       total + EXACT (unsampled) 30-day daily counts. Same charts origin,
       same aux rules; both browser-CORS-verified 2026-07-18. */
    ['txTotal',       'https://api.blockchain.info/charts/n-transactions-total?timespan=30days&format=json&sampled=true&cors=true',
                                                       'txTotal',     21600000, null, { aux: true, backoffCapMs: 3600000 }],
    ['tx30d',         'https://api.blockchain.info/charts/n-transactions?timespan=30days&format=json&cors=true',
                                                       'tx30d',       21600000, null, { aux: true, backoffCapMs: 3600000 }],
    /* task 17: treasuries went LIVE — CoinGecko keyless public_treasury
       endpoint (browser-CORS-verified 2026-07-18, single ACAO header,
       server refresh ~5 min). Hourly is polite headroom under their
       per-IP burst limit (~5-9 rapid calls -> 429). */
    ['treasuries',    'https://api.coingecko.com/api/v3/companies/public_treasury/bitcoin',
                                                       'treasuries',   3600000, null,
                                                       { parse: parseTreasuries, aux: true, backoffCapMs: 3600000 }],
    /* task 18: fresh-preferred live scalars (fallbacks stay: the daily
       charts above). utxo-count at a short timespan serves SUB-HOURLY
       points (verified 2026-07-18: period=hour, newest ~76 min old). */
    ['chairStats',    'https://api.blockchair.com/bitcoin/stats',
                                                       'chairStats',    900000, null,
                                                       { parse: parseChairStats, aux: true, backoffCapMs: 3600000 }],
    ['utxoHourly',    'https://api.blockchain.info/charts/utxo-count?timespan=1weeks&format=json&cors=true',
                                                       'utxoHourly',   1800000, null, { aux: true, backoffCapMs: 3600000 }]
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
