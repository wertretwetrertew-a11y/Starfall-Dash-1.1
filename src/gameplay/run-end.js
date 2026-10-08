// ==========================================================
// STARFALL DASH — GAMEPLAY MODULE
// Extracted from legacy gameplay.js; global API intentionally preserved.
// ==========================================================

//   ЗАВЕРШЕНИЕ ИГРЫ
// ==========================================================

function finishRun() {
    // 🔧 ФИКС: защита от двойного вызова
    if (_finishRunCalled) return;
    _finishRunCalled = true;
    
    running = false;
    var s = getSave();
    runTime = Math.floor((performance.now() - runStartTime) / 1000);
    s.totalTime = (s.totalTime || 0) + runTime;

    var mode = MODES[currentMode];
    if (!s.modeBests) s.modeBests = {};
    if (!s.modeBests[currentMode]) s.modeBests[currentMode] = { coins: 0, time: 0 };

    var isNewRecord = false;

    if (currentMode === 'rogue') {
        var bestLvl = s.rogueStats.bestLevel || 0;
        if (level > bestLvl) {
            s.rogueStats.bestLevel = level;
            isNewRecord = true;
        }
        if (score > (s.modeBests.rogue.coins || 0)) {
            s.modeBests.rogue.coins = score;
            isNewRecord = true;
        }
        if (score > s.bestCoins) s.bestCoins = score;
        if (level > s.bestLevel) s.bestLevel = level;
    } else if (currentMode === 'classic') {
        if (score > s.bestCoins) s.bestCoins = score;
        if (level > s.bestLevel) s.bestLevel = level;
        if (score > s.modeBests.classic.coins) { s.modeBests.classic.coins = score; isNewRecord = true; }
        if (runTime > s.modeBests.classic.time) s.modeBests.classic.time = runTime;
    } else if (currentMode === 'survival') {
        if (runTime > s.modeBests.survival.time) { s.modeBests.survival.time = runTime; isNewRecord = true; }
        if (score > s.modeBests.survival.coins) s.modeBests.survival.coins = score;
    } else if (currentMode === 'timeattack') {
        if (score > s.modeBests.timeattack.coins) { s.modeBests.timeattack.coins = score; isNewRecord = true; }
    } else if (currentMode === 'hardcore') {
        if (score > s.modeBests.hardcore.coins) { s.modeBests.hardcore.coins = score; isNewRecord = true; }
        if (level > s.bestLevel) s.bestLevel = level;
    }

    if (score > s.bestCoins) s.bestCoins = score;
    if (level > s.bestLevel) s.bestLevel = level;

    if (isNewRecord) {
        crystalsEarned += 5;
        s.coreCrystals = (s.coreCrystals || 0) + 5;
        setTimeout(function() {
            showToast('💎 +5 за новый рекорд!', 'legendary');
        }, 500);
    }

    if (currentMode === 'rogue') {
        /*
         * Смерть в рогалике не сохраняет текущий этап как чекпоинт.
         * После проигрыша следующая попытка на этой же планете всегда
         * начинается с этапа 1. Саму открытую планету сохраняем.
         *
         * Важно: прогресс планеты (ядро/классы/награды) не сбрасывается.
         */
        if (typeof roguePlanetState !== 'undefined' && roguePlanetState.active &&
            typeof getSave === 'function') {
            var deathProgress = getSave();
            deathProgress.rogueProgress = {
                planetIndex: Math.max(0, Number(roguePlanetState.planetIndex) || 0),
                stageIndex: 0,
                bossUnlocked: false
            };
            persist();

            roguePlanetState.stageIndex = 0;
            roguePlanetState.stageStarted = false;
            roguePlanetState.bossUnlocked = false;
            roguePlanetState.bossActive = false;
            roguePlanetState.bossHandled = false;
        }
    }

    if (currentMode === 'rogue') {
        var shardsEarned = Math.floor(level * 2);
        s.starShards = (s.starShards || 0) + shardsEarned;
        setTimeout(function() {
            showToast('✨ +' + shardsEarned + ' осколков за забег!', 'epic');
        }, 1000);
    }

    s.gamesPlayed += 1;
    persist();
    clearBossDuelPresentation();
    updateMainMenuStats();
    stopMusic();
    checkAchievements();

    showGameOverModal(isNewRecord);
}

function showGameOverModal(isNewRecord) {
    var mode = MODES[currentMode];
    goTitle.textContent = mode.icon + ' ' + mode.name + ' — итог';

    if (currentMode === 'survival') {
        goScore.textContent = formatTime(runTime);
        goScoreLabel.textContent = 'продержался';
    } else {
        goScore.textContent = score;
        goScoreLabel.textContent = 'монет собрано';
    }

    goLevel.textContent = level;
    goTime.textContent = formatTime(runTime);
    goGold.textContent = formatNumber(goldEarned);
    goCrystals.textContent = crystalsEarned;

    var s = getSave();
    var mb = (s.modeBests && s.modeBests[currentMode]) || { coins: 0, time: 0 };
    var bestText = '';
    if (currentMode === 'survival') {
        bestText = 'Лучшее время: ' + formatTime(mb.time);
    } else if (currentMode === 'rogue') {
        bestText = 'Лучший уровень: ' + (s.rogueStats.bestLevel || 0) + ' • Лучший счёт: ' + mb.coins;
    } else {
        bestText = 'Лучший счёт: ' + mb.coins;
    }
    goBest.textContent = bestText;

    if (goBuild) {
        if (currentMode === 'rogue') {
            var buildParts = [];
            Object.keys(runUpgrades || {}).forEach(function(id) {
                var up = UPGRADE_POOL[id];
                if (up) buildParts.push(up.icon + ' ' + up.name + ' ×' + runUpgrades[id]);
            });
            (runRelics || []).forEach(function(id) {
                var rel = RELICS[id];
                if (rel) buildParts.push(rel.icon + ' ' + rel.name);
            });
            goBuild.innerHTML = '<div class="go-build-title">СБОРКА ЗАБЕГА</div>' +
                '<div class="go-build-list">' +
                (buildParts.length ? buildParts.slice(0, 10).join(' · ') : 'Билд ещё не собран') +
                '</div>' +
                '<div class="go-build-meta">⚡ Апгрейдов: ' +
                Object.keys(runUpgrades || {}).reduce(function(sum, id) { return sum + (runUpgrades[id] || 0); }, 0) +
                ' · 🏺 Реликвий: ' + (runRelics || []).length +
                ' · 🔥 Синергий: ' + Object.keys(runSynergies || {}).length + '</div>';
            goBuild.style.display = 'block';
        } else {
            goBuild.style.display = 'none';
        }
    }

    if (isNewRecord) {
        goRecord.style.display = 'block';
    } else {
        goRecord.style.display = 'none';
    }

    gameoverModal.classList.add('open');
    document.body.classList.remove('playing');
}

function togglePause() {
    if (!running || gameOver || isChoosingUpgrade) return;
    paused = !paused;
    resetFrameClock();  // 🔧 ФИКС
    if (paused) {
        pauseMode.textContent = MODES[currentMode].name;
        pauseScore.textContent = score;
        pauseLevel.textContent = level;
        pauseTime.textContent = formatTime(runTime);
        pauseModal.classList.add('open');
    } else {
        pauseModal.classList.remove('open');
    }
}

// ==========================================================