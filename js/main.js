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

  /* name, path, store key, interval, accept — the _SHARED.md endpoint table */
  var POLLS = [
    ['tipHeight',     '/api/blocks/tip/height',        'tipHeight',     60000, acceptTip],
    ['blocks',        '/api/v1/blocks',                'blocks',        60000, acceptBlocks],
    ['fees',          '/api/v1/fees/recommended',      'fees',          30000],
    ['mempool',       '/api/mempool',                  'mempool',       30000],
    ['mempoolBlocks', '/api/v1/fees/mempool-blocks',   'mempoolBlocks', 30000],
    ['prices',        '/api/v1/prices',                'prices',        60000],
    ['difficulty',    '/api/v1/difficulty-adjustment', 'difficulty',    300000],
    ['hashrate',      '/api/v1/mining/hashrate/3d',    'hashrate',      300000]
  ];
  for (var i = 0; i < POLLS.length; i++) {
    HULL.api.poll(POLLS[i][0], POLLS[i][1], POLLS[i][2], POLLS[i][3], POLLS[i][4]);
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
