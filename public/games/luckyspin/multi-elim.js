(function (global) {
  'use strict';

  var MIN_SURVIVORS = 1;
  var MAX_ANIM_MS = 2600;

  function keyOf(player) {
    return (player && (player.userId || player.name)) || '';
  }

  function uniqueKeys(players) {
    var seen = Object.create(null);
    var list = [];
    for (var i = 0; i < (players || []).length; i++) {
      var k = keyOf(players[i]);
      if (!k || seen[k]) continue;
      seen[k] = true;
      list.push(k);
    }
    return list;
  }

  function resolveCount(totalSlices, multiElimEnabled, requestedCount) {
    if (!multiElimEnabled) return 1;
    var count = Math.floor(Number(requestedCount) || 0);
    if (count <= 1) return 1;
    var maxAllowed = totalSlices - MIN_SURVIVORS;
    if (maxAllowed <= 0) return 1;
    return Math.max(1, Math.min(count, maxAllowed));
  }

  function pickExtras(slices, primarySlice, totalToEliminate) {
    var result = [];
    if (!slices || totalToEliminate <= 1) return result;
    var primaryKey = keyOf(primarySlice);
    var primaryId = primarySlice && primarySlice.id;
    var seenKeys = new Set();
    if (primaryKey) seenKeys.add(primaryKey);

    // Pick distinct participants first
    var distinctPool = [];
    for (var i = 0; i < slices.length; i++) {
      var s = slices[i];
      if (primaryId !== undefined && s.id === primaryId) continue;
      var k = keyOf(s);
      if (!k || seenKeys.has(k)) continue;
      seenKeys.add(k);
      distinctPool.push(s);
    }
    for (var i = distinctPool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = distinctPool[i]; distinctPool[i] = distinctPool[j]; distinctPool[j] = tmp;
    }
    var needed = totalToEliminate - 1;
    var extraDistinct = distinctPool.slice(0, needed);
    result = [...extraDistinct];

    if (result.length < needed) {
      var remainingPool = [];
      var chosenIds = new Set([primaryId, ...result.map(x => x.id)]);
      for (var i = 0; i < slices.length; i++) {
        if (!chosenIds.has(slices[i].id)) remainingPool.push(slices[i]);
      }
      for (var i = remainingPool.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = remainingPool[i]; remainingPool[i] = remainingPool[j]; remainingPool[j] = tmp;
      }
      result.push(...remainingPool.slice(0, needed - result.length));
    }
    return result;
  }

  function animationPlan(extraCount) {
    if (extraCount <= 0) {
      return { total: 0, step: 0, rollMs: 0 };
    }
    // Cap total animation time to max 2600ms so 100 eliminations NEVER take 30 seconds!
    var maxAnimTime = extraCount <= 2 ? 800 : Math.min(2600, Math.max(1200, extraCount * 40));
    var step = Math.max(15, Math.floor(maxAnimTime / extraCount));
    var total = step * extraCount;
    return {
      total: total,
      step: step,
      rollMs: Math.max(15, Math.floor(step / 2))
    };
  }

  global.LuckySpinMultiElim = {
    MIN_SURVIVORS: MIN_SURVIVORS,
    MAX_ANIM_MS: MAX_ANIM_MS,
    keyOf: keyOf,
    uniqueKeys: uniqueKeys,
    resolveCount: resolveCount,
    pickExtras: pickExtras,
    animationPlan: animationPlan
  };
})(typeof window !== 'undefined' ? window : globalThis);