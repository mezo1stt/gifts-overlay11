(function () {
  'use strict';

  function emptyLedger() {
    return { players: {}, spins: 0 };
  }

  function keyOf(userId, name) {
    var raw = userId != null && String(userId).trim() !== '' ? String(userId) : String(name || '');
    return raw.trim().toLowerCase();
  }

  function recordEntry(ledger, userId, name, coins, entriesAdded) {
    if (!ledger || !ledger.players) return ledger;
    var k = keyOf(userId, name);
    if (!k) return ledger;
    var addCoins = Math.max(0, Number(coins) || 0);
    var addEntries = Math.max(0, Math.floor(Number(entriesAdded) || 0));
    var cur = ledger.players[k];
    if (!cur) {
      cur = { name: name || userId || 'Player', coins: 0, entries: 0 };
      ledger.players[k] = cur;
    } else if (name) {
      cur.name = name;
    }
    cur.coins += addCoins;
    cur.entries += addEntries;
    return ledger;
  }

  function recordSpin(ledger) {
    if (!ledger) return ledger;
    ledger.spins = Math.max(0, Math.floor(Number(ledger.spins) || 0)) + 1;
    return ledger;
  }

  function totalPlayers(ledger) {
    if (!ledger || !ledger.players) return 0;
    return Object.keys(ledger.players).length;
  }

  function totalEntries(ledger) {
    if (!ledger || !ledger.players) return 0;
    var sum = 0;
    var keys = Object.keys(ledger.players);
    for (var i = 0; i < keys.length; i++) {
      sum += ledger.players[keys[i]].entries || 0;
    }
    return sum;
  }

  function statsFor(ledger, winner) {
    if (!ledger || !winner) {
      return { coinsSpent: 0, spinsCount: 0, playersBeaten: 0, totalPlayers: 0, winnerEntries: 0, totalEntries: 0 };
    }
    var k = keyOf(winner.userId, winner.name);
    var entry = k && ledger.players ? ledger.players[k] : null;
    var coins = entry ? entry.coins : Math.max(0, Number(winner.coins) || 0);
    var wEntries = entry ? entry.entries : 1;
    var allPlayers = totalPlayers(ledger);
    var allEntries = totalEntries(ledger);
    var effectiveTotal = Math.max(allPlayers, winner ? 1 : 0);
    return {
      coinsSpent: coins,
      spinsCount: Math.max(1, ledger.spins || 0),
      playersBeaten: Math.max(0, effectiveTotal - 1),
      totalPlayers: effectiveTotal,
      winnerEntries: wEntries,
      totalEntries: Math.max(allEntries, wEntries)
    };
  }

  window.LuckySpinSessionStats = {
    emptyLedger: emptyLedger,
    recordEntry: recordEntry,
    recordSpin: recordSpin,
    totalPlayers: totalPlayers,
    totalEntries: totalEntries,
    statsFor: statsFor
  };
})();