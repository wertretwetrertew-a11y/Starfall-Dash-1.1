// ==========================================================
// STARFALL DASH — UI MODULE
// Extracted from legacy meta-ui.js; global API intentionally preserved.
// ==========================================================

// ===== ВХОД В ПРОФИЛЬ =====
function enterProfile(login) {
    var profileData = loadProfile(login);
    if (!profileData) { showToast('Профиль не найден', 'error'); return; }
    currentProfile = profileData;
    currentProfile.data = migrateSave(currentProfile.data);
    setCurrentLogin(login);
    loginScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    pbNick.textContent = currentProfile.nick;
    updateMainMenuStats();
    updateDailyTile();
    applyTheme();
    console.log('✓ Вход в профиль:', currentProfile.nick);
}

function logoutToLogin() {
    if (running) {
        if (!confirm('Игра идёт. Выйти в меню профилей?')) return;
        running = false;
        gameOver = true;
        paused = false;
    }
    stopMusic();
    currentProfile = null;
    storage.remove(CURRENT_KEY);
    startScreen.classList.add('hidden');
    modeScreen.classList.add('hidden');
    classScreen.classList.add('hidden');
    coreScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    renderProfilesList();
}


function updateCommandDeck() {
    var s = getSave();
    var cls = getClass(selectedClass || 'scout');
    var mode = MODES[s.lastMode] || MODES.rogue;
    var deckAvatar = document.getElementById('deck-avatar');
    var deckClass = document.getElementById('deck-class');
    var deckDesc = document.getElementById('deck-class-desc');
    var deckLevel = document.getElementById('deck-level');
    var deckLastScore = document.getElementById('deck-last-score');
    var deckLastMode = document.getElementById('deck-last-mode');
    var deckLastTime = document.getElementById('deck-last-time');
    if (deckAvatar) deckAvatar.textContent = cls.icon;
    if (deckClass) { deckClass.textContent = cls.name; deckClass.style.color = cls.color; }
    if (deckDesc) deckDesc.textContent = cls.desc;
    if (deckLevel) deckLevel.textContent = s.bestLevel || 1;
    if (deckLastScore) deckLastScore.textContent = formatNumber(s.bestCoins || 0);
    if (deckLastMode) { deckLastMode.textContent = mode.icon + ' ' + mode.name; deckLastMode.style.color = mode.color; }
    if (deckLastTime) deckLastTime.textContent = formatTime(s.bestTime || 0);

    var totalCore = 0, maxCore = 0, readyCore = 0;
    Object.keys(CORE_STATS).forEach(function(id) {
        var stat = CORE_STATS[id], lvl = s.coreStats[id] || 0;
        totalCore += lvl; maxCore += stat.maxLevel || 10;
        if (lvl < (stat.maxLevel || 10) && s.bank >= getCoreStatPrice(id)) readyCore++;
    });
    var coreFill = document.getElementById('core-progress-fill');
    if (coreFill) coreFill.style.width = Math.min(100, (totalCore / Math.max(1,maxCore))*100) + '%';
    var coreMeta = document.getElementById('core-tile-meta');
    var coreSub = document.getElementById('core-tile-sub');
    if (coreMeta) coreMeta.textContent = readyCore ? readyCore + ' улучшений доступно' : 'Уровень ' + totalCore;
    if (coreSub) coreSub.textContent = totalCore + ' / ' + maxCore + ' уровней';

    var achTotal = (typeof ACHIEVEMENTS !== 'undefined') ? Object.keys(ACHIEVEMENTS).length : 28;
    var achDone = (s.claimedAchievements || []).length;
    var achFill = document.getElementById('ach-progress-fill');
    if (achFill) achFill.style.width = Math.min(100, (achDone / Math.max(1,achTotal))*100) + '%';
    var achMeta = document.getElementById('ach-tile-meta');
    var achSub = document.getElementById('ach-tile-sub');
    if (achMeta) achMeta.textContent = achDone + ' / ' + achTotal + ' открыто';
    if (achSub) achSub.textContent = achTotal + ' наград';

    var today = getTodayStr();
    var dailyReady = s.lastDailyClaim !== today;
    var dailyMeta = document.getElementById('daily-tile-meta');
    var dailySub = document.getElementById('daily-tile-sub');
    if (dailyReady) {
        if (dailyMeta) dailyMeta.textContent = '🎁 НАГРАДА ГОТОВА';
        if (dailySub) dailySub.textContent = 'Забрать сейчас';
    } else {
        if (dailyMeta) dailyMeta.textContent = '✓ Получено сегодня';
        if (dailySub) dailySub.textContent = 'Следующий бонус завтра';
    }

    var shopMeta = document.getElementById('shop-tile-meta');
    if (shopMeta) shopMeta.textContent = (s.ownedSkins || []).length + ' скинов открыто';

    var focus = document.getElementById('deck-focus-list');
    if (focus) {
        var items = [];
        if (dailyReady) items.push('<div class="focus-item ready"><b>🎁 Бонус</b> — ежедневная награда готова</div>');
        if (readyCore) items.push('<div class="focus-item warn"><b>🌟 Ядро</b> — доступно ' + readyCore + ' улучш.</div>');
        if (achTotal - achDone > 0) items.push('<div class="focus-item"><b>🏆 Цель</b> — ' + (achTotal-achDone) + ' достижений впереди</div>');
        if (!items.length) items.push('<div class="focus-item ready"><b>✦ Всё готово</b> — выбирай режим и начинай новый забег</div>');
        focus.innerHTML = items.slice(0,3).join('');
    }
}

function updateMainMenuStats() {
    var s = getSave();
    slBest.textContent = s.bestCoins;
    slTime.textContent = formatTime(s.bestTime);
    slBank.textContent = s.bank;
    slCrystals.textContent = s.coreCrystals || 0;
    slShards.textContent = s.starShards || 0;
    slLvl.textContent = s.bestLevel;
    updateModeBests();
    updateCoreBadge();
    updateCommandDeck();
}

function updateModeBests() {
    var s = getSave();
    var mb = s.modeBests || {};
    var elements = {
        'best-rogue': mb.rogue ? mb.rogue.coins : 0,
        'best-classic': mb.classic ? mb.classic.coins : 0,
        'best-timeattack': mb.timeattack ? mb.timeattack.coins : 0,
        'best-hardcore': mb.hardcore ? mb.hardcore.coins : 0
    };
    Object.keys(elements).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = '🏆 ' + elements[id];
    });
    var survivalEl = document.getElementById('best-survival');
    if (survivalEl) survivalEl.textContent = '🏆 ' + formatTime((mb.survival && mb.survival.time) || 0);
}

function updateCoreBadge() {
    var s = getSave();
    var canAfford = 0;
    Object.keys(CORE_STATS).forEach(function(id) {
        var lvl = s.coreStats[id] || 0;
        if (lvl >= CORE_STATS[id].maxLevel) return;
        var price = getCoreStatPrice(id);
        if (s.bank >= price || (s.coreCrystals || 0) >= 1) canAfford++;
    });
    if (canAfford > 0) {
        coreBadge.textContent = canAfford;
        coreBadge.style.display = 'flex';
    } else {
        coreBadge.style.display = 'none';
    }
}

function updateDailyTile() {
    var s = getSave();
    var today = getTodayStr();
    var canClaim = s.lastDailyClaim !== today;
    if (canClaim) tileDaily.classList.add('has-reward');
    else tileDaily.classList.remove('has-reward');
}
