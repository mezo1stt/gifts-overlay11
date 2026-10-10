(function () {
  'use strict';

  var MIN_SURVIVORS = 1;
  var TOTAL_ANIM_MS = 2200;
  var MIN_STEP_MS = 80;
  var MAX_STEP_MS = 450;
  var ROLL_TICK_MS = 70;

  function resolveCount(sliceCount, enabled, requested) {
    var total = Math.max(0, Math.floor(Number(sliceCount) || 0));
    if (!enabled) return 1;
    var want = Math.max(1, Math.floor(Number(requested) || 1));
    if (total <= MIN_SURVIVORS) return 1;
    var maxAllowed = total - MIN_SURVIVORS;
    return Math.max(1, Math.min(want, maxAllowed));
  }

  function pickExtras(slices, primary, totalCount, rng) {
    if (!Array.isArray(slices) || !primary) return [];
    var extraCount = Math.max(0, Math.floor(Number(totalCount) || 0) - 1);
    if (extraCount === 0) return [];
    var random = typeof rng === 'function' ? rng : Math.random;
    var pool = slices.filter(function (s) {
      return s && s.id !== primary.id;
    });
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    return pool.slice(0, Math.min(extraCount, pool.length));
  }

  function animationPlan(extraCount) {
    var n = Math.max(0, Math.floor(Number(extraCount) || 0));
    if (n === 0) return { step: 0, total: 0, rollMs: ROLL_TICK_MS };
    var raw = Math.floor(TOTAL_ANIM_MS / n);
    var step = Math.max(MIN_STEP_MS, Math.min(MAX_STEP_MS, raw));
    return {
      step: step,
      total: step * n,
      rollMs: Math.min(ROLL_TICK_MS, Math.max(30, Math.floor(step / 2)))
    };
  }

  window.LuckySpinMultiElim = {
    MIN_SURVIVORS: MIN_SURVIVORS,
    resolveCount: resolveCount,
    pickExtras: pickExtras,
    animationPlan: animationPlan
  };
})();