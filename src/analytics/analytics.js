/* ==========================================================
   STARFALL DASH — ANALYTICS
   Local-first telemetry. No external network requests.
   Data is stored per browser and can later be sent to a backend.
   ========================================================== */
(function () {
  'use strict';

  var DB_NAME = 'starfall_dash_analytics';
  var DB_VERSION = 1;
  var EVENT_STORE = 'events';
  var RUN_STORE = 'runs';
  var META_STORE = 'meta';
  var currentRun = null;
  var ready = false;
  var queue = [];

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' +
      Math.random().toString(36).slice(2, 10);
  }

  function nowIso() { return new Date().toISOString(); }

  function getDb() {
    return new Promise(function(resolve, reject) {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB is not supported'));
        return;
      }
      var request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(EVENT_STORE)) {
          var events = db.createObjectStore(EVENT_STORE, { keyPath: 'id' });
          events.createIndex('timestamp', 'timestamp');
          events.createIndex('event', 'event');
          events.createIndex('runId', 'runId');
        }
        if (!db.objectStoreNames.contains(RUN_STORE)) {
          var runs = db.createObjectStore(RUN_STORE, { keyPath: 'runId' });
          runs.createIndex('startedAt', 'startedAt');
          runs.createIndex('mode', 'mode');
          runs.createIndex('endedAt', 'endedAt');
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'key' });
        }
      };
      request.onsuccess = function() { resolve(request.result); };
      request.onerror = function() { reject(request.error); };
    });
  }

  function put(storeName, value) {
    return getDb().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(value);
        tx.oncomplete = function() { resolve(value); };
        tx.onerror = function() { reject(tx.error); };
      });
    });
  }

  function add(storeName, value) {
    return getDb().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).add(value);
        tx.oncomplete = function() { resolve(value); };
        tx.onerror = function() { reject(tx.error); };
      });
    });
  }

  function all(storeName) {
    return getDb().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(storeName, 'readonly');
        var req = tx.objectStore(storeName).getAll();
        req.onsuccess = function() { resolve(req.result || []); };
        req.onerror = function() { reject(req.error); };
      });
    });
  }

  function safeProfile() {
    try {
      return (typeof currentProfile !== 'undefined' && currentProfile) ?
        (currentProfile.nick || 'Игрок') : 'Игрок';
    } catch (e) { return 'Игрок'; }
  }

  function safeValue(v, fallback) {
    return v === undefined || v === null ? fallback : v;
  }

  function flush() {
    if (!ready || !queue.length) return;
    var items = queue.splice(0);
    items.forEach(function(item) {
      add(EVENT_STORE, item).catch(function(err) {
        console.warn('Analytics event write failed:', err);
      });
    });
  }

  function track(eventName, data) {
    var payload = data || {};
    var event = {
      id: uid('evt'),
      event: String(eventName),
      timestamp: nowIso(),
      sessionId: sessionId,
      runId: currentRun ? currentRun.runId : null,
      profile: safeProfile(),
      mode: safeValue(typeof currentMode !== 'undefined' ? currentMode : null, 'unknown'),
      version: '3.0',
      data: payload
    };
    queue.push(event);
    flush();
    return event.id;
  }

  var sessionId = uid('session');

  function startRun() {
    var mode = typeof currentMode !== 'undefined' ? currentMode : 'unknown';
    var run = {
      runId: uid('run'),
      sessionId: sessionId,
      profile: safeProfile(),
      mode: mode,
      selectedClass: safeValue(typeof selectedClass !== 'undefined' ? selectedClass : null, null),
      startedAt: nowIso(),
      endedAt: null,
      durationSec: 0,
      result: 'running',
      score: 0,
      gold: 0,
      crystals: 0,
      level: 1,
      deaths: 0,
      kills: 0,
      bossWins: 0
    };
    currentRun = run;
    put(RUN_STORE, run).catch(function(err) {
      console.warn('Analytics run write failed:', err);
    });
    track('run_started', {
      mode: run.mode,
      selectedClass: run.selectedClass
    });
    return run.runId;
  }

  function updateRun(fields) {
    if (!currentRun) return;
    Object.keys(fields || {}).forEach(function(k) {
      currentRun[k] = fields[k];
    });
    put(RUN_STORE, currentRun).catch(function(err) {
      console.warn('Analytics run update failed:', err);
    });
  }

  function endRun(result) {
    if (!currentRun) return;
    var duration = 0;
    try {
      duration = Math.max(0, Math.floor((performance.now() - (currentRun._startedPerf || performance.now())) / 1000));
    } catch (e) {}
    currentRun.endedAt = nowIso();
    currentRun.durationSec = duration;
    currentRun.result = result || 'finished';
    currentRun.score = safeValue(typeof score !== 'undefined' ? score : 0, 0);
    currentRun.gold = safeValue(typeof goldEarned !== 'undefined' ? goldEarned : 0, 0);
    currentRun.crystals = safeValue(typeof crystalsEarned !== 'undefined' ? crystalsEarned : 0, 0);
    currentRun.level = safeValue(typeof level !== 'undefined' ? level : 1, 1);
    put(RUN_STORE, currentRun).catch(function(err) {
      console.warn('Analytics final run write failed:', err);
    });
    track('run_finished', {
      result: currentRun.result,
      durationSec: currentRun.durationSec,
      score: currentRun.score,
      gold: currentRun.gold,
      crystals: currentRun.crystals,
      level: currentRun.level
    });
    currentRun = null;
  }

  function init() {
    getDb().then(function() {
      ready = true;
      track('session_started', { userAgent: navigator.userAgent.slice(0, 120) });
      flush();
    }).catch(function(err) {
      console.warn('Starfall Analytics disabled:', err);
    });
  }

  window.StarfallAnalytics = {
    track: track,
    startRun: startRun,
    endRun: endRun,
    updateRun: updateRun,
    getEvents: function() { return all(EVENT_STORE); },
    getRuns: function() { return all(RUN_STORE); },
    clear: function() {
      return getDb().then(function(db) {
        return new Promise(function(resolve, reject) {
          var tx = db.transaction([EVENT_STORE, RUN_STORE], 'readwrite');
          tx.objectStore(EVENT_STORE).clear();
          tx.objectStore(RUN_STORE).clear();
          tx.oncomplete = resolve;
          tx.onerror = function() { reject(tx.error); };
        });
      });
    },
    exportJson: function() {
      return Promise.all([all(EVENT_STORE), all(RUN_STORE)]).then(function(parts) {
        return {
          exportedAt: nowIso(),
          schemaVersion: 1,
          events: parts[0],
          runs: parts[1]
        };
      });
    }
  };

  /* Hook the final game API after all gameplay modules are loaded. */
  function installHooks() {
    if (typeof window.reset === 'function') {
      var originalReset = window.reset;
      window.reset = function() {
        var result = originalReset.apply(this, arguments);
        if (typeof running !== 'undefined' && running) {
          if (currentRun) StarfallAnalytics.endRun('restarted');
          StarfallAnalytics.startRun();
          if (currentRun) currentRun._startedPerf = performance.now();
        }
        return result;
      };
    }

    if (typeof window.finishRun === 'function') {
      var originalFinish = window.finishRun;
      window.finishRun = function() {
        var result = originalFinish.apply(this, arguments);
        StarfallAnalytics.endRun(gameOver ? 'death' : 'finished');
        return result;
      };
    }

    if (typeof window.pickUpgrade === 'function') {
      var originalPickUpgrade = window.pickUpgrade;
      window.pickUpgrade = function(id) {
        StarfallAnalytics.track('upgrade_selected', {
          upgradeId: id,
          level: typeof level !== 'undefined' ? level : null,
          mode: typeof currentMode !== 'undefined' ? currentMode : null
        });
        return originalPickUpgrade.apply(this, arguments);
      };
    }

    if (typeof window.levelUp === 'function') {
      var originalLevelUp = window.levelUp;
      window.levelUp = function() {
        StarfallAnalytics.track('level_up', {
          fromLevel: typeof level !== 'undefined' ? level : null
        });
        return originalLevelUp.apply(this, arguments);
      };
    }
  }

  /* Event helpers for future/other modules. */
  window.trackGameEvent = function(name, data) {
    return StarfallAnalytics.track(name, data);
  };

  init();
  installHooks();
  console.log('✓ Starfall Analytics loaded');
})();