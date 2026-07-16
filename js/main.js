/* Bitcoin Helm — boot: start every REST poll (intervals per _SHARED.md)
   and drive the header status chip from the "conn" store key.
   Panels wire up in tasks 03–08. */
(function () {
  'use strict';

  var HELM = window.HELM;

  /* name, path, store key, interval — the _SHARED.md endpoint table */
  var POLLS = [
    ['tipHeight',     '/api/blocks/tip/height',        'tipHeight',     60000],
    ['blocks',        '/api/v1/blocks',                'blocks',        60000],
    ['fees',          '/api/v1/fees/recommended',      'fees',          30000],
    ['mempool',       '/api/mempool',                  'mempool',       30000],
    ['mempoolBlocks', '/api/v1/fees/mempool-blocks',   'mempoolBlocks', 30000],
    ['prices',        '/api/v1/prices',                'prices',        60000],
    ['difficulty',    '/api/v1/difficulty-adjustment', 'difficulty',    300000],
    ['hashrate',      '/api/v1/mining/hashrate/3d',    'hashrate',      300000]
  ];
  for (var i = 0; i < POLLS.length; i++) {
    HELM.api.poll(POLLS[i][0], POLLS[i][1], POLLS[i][2], POLLS[i][3]);
  }

  /* status chip: ● POLLING (boot only) / LIVE / DEGRADED / DOWN */
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
  HELM.store.on('conn', renderConn);
  renderConn(HELM.store.get('conn'));
})();
