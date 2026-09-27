// ==========================================================
//   STARFALL DASH 2.6 — ЧАСТЬ 3/4
//   Профили • Звук • HUD • Ядро • Классы • Магазин • Кейсы
// ==========================================================

// ===== ЭКРАН ВХОДА =====
function renderProfilesList() {
    profilesList.innerHTML = '';
    var profiles = getProfiles();

    profiles.forEach(function(p) {
        var card = document.createElement('div');
        card.className = 'profile-card';
        var data = loadProfile(p.login);
        var d = (data && data.data) ? migrateSave(data.data) : makeDefaultSave();

        var avatar = document.createElement('div');
        avatar.className = 'pc-avatar';
        avatar.textContent = '🎮';
        card.appendChild(avatar);

        var info = document.createElement('div');
        info.className = 'pc-info';
        var nick = document.createElement('div');
        nick.className = 'pc-nick';
        nick.textContent = p.nick;
        info.appendChild(nick);
        var stats = document.createElement('div');
        stats.className = 'pc-stats';
        var crystals = d.coreCrystals || 0;
        var shards = d.starShards || 0;
        stats.innerHTML = '<span>🏆 ' + d.bestCoins + '</span><span>💰 ' + d.bank + '</span><span>💎 ' + crystals + '</span><span>✨ ' + shards + '</span>';
        info.appendChild(stats);
        card.appendChild(info);

        if (p.passHash) {
            var lock = document.createElement('div');
            lock.className = 'pc-lock';
            lock.textContent = '🔒';
            card.appendChild(lock);
        }

        var del = document.createElement('div');
        del.className = 'pc-delete';
        del.textContent = '✕';
        del.title = 'Удалить профиль';
        del.addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm('Удалить профиль «' + p.nick + '»? Прогресс будет потерян!')) {
                var list = getProfiles().filter(function(x) { return x.login !== p.login; });
                saveProfiles(list);
                deleteProfileData(p.login);
                if (getCurrentLogin() === p.login) storage.remove(CURRENT_KEY);
                renderProfilesList();
                showToast('Профиль удалён', 'info');
            }
        });
        card.appendChild(del);

        card.addEventListener('click', function() {
            if (p.passHash) {
                pendingProfile = p;
                pwNick.textContent = p.nick;
                pwInput.value = '';
                pwError.textContent = '';
                passwordModal.classList.add('open');
                setTimeout(function() { pwInput.focus(); }, 100);
            } else {
                enterProfile(p.login);
            }
        });

        profilesList.appendChild(card);
    });

    var newCard = document.createElement('div');
    newCard.className = 'profile-card new-profile';
    newCard.innerHTML = '<div class="pc-avatar">➕</div>' +
        '<div class="pc-info"><div class="pc-nick" style="color:#4fc3f7;">Новый игрок</div>' +
        '<div class="pc-stats"><span>Создать профиль</span></div></div>';
    newCard.addEventListener('click', openCreateProfile);
    profilesList.appendChild(newCard);
}

function openCreateProfile() {
    cpNick.value = '';
    cpPassword.value = '';
    cpError.textContent = '';
    cpPasswordToggle.classList.remove('active');
    cpCheckbox.textContent = '';
    cpPasswordField.classList.add('hidden');
    cpCreate.disabled = true;
    createProfileModal.classList.add('open');
    setTimeout(function() { cpNick.focus(); }, 100);
}

cpNick.addEventListener('input', validateCreateForm);
cpPassword.addEventListener('input', validateCreateForm);

cpPasswordToggle.addEventListener('click', function() {
    var active = cpPasswordToggle.classList.toggle('active');
    cpCheckbox.textContent = active ? '✓' : '';
    if (active) {
        cpPasswordField.classList.remove('hidden');
        setTimeout(function() { cpPassword.focus(); }, 100);
    } else {
        cpPasswordField.classList.add('hidden');
        cpPassword.value = '';
    }
    validateCreateForm();
});

function validateCreateForm() {
    var nick = cpNick.value.trim();
    var usePassword = cpPasswordToggle.classList.contains('active');
    var pass = cpPassword.value;
    var ok = nick.length >= 2 && nick.length <= 16;
    if (usePassword) ok = ok && pass.length >= 3;
    var exists = getProfiles().some(function(p) {
        return p.nick.toLowerCase() === nick.toLowerCase();
    });
    if (exists) ok = false;
    cpCreate.disabled = !ok;
    if (exists && nick.length >= 2) cpError.textContent = 'Это имя уже занято';
    else if (usePassword && pass.length > 0 && pass.length < 3) cpError.textContent = 'Пароль минимум 3 символа';
    else if (nick.length > 0 && nick.length < 2) cpError.textContent = 'Имя минимум 2 символа';
    else cpError.textContent = '';
}

cpCreate.addEventListener('click', function() {
    var nick = cpNick.value.trim();
    var usePassword = cpPasswordToggle.classList.contains('active');
    var pass = cpPassword.value;
    if (!nick) return;
    var login = 'u_' + Date.now();
    var passHash = usePassword ? simpleHash(pass) : null;
    var profileData = { login: login, nick: nick, passHash: passHash, data: makeDefaultSave() };
    var list = getProfiles();
    list.push({ login: login, nick: nick, passHash: passHash });
    saveProfiles(list);
    saveProfile(login, profileData);
    createProfileModal.classList.remove('open');
    showToast('👤 Профиль создан!', 'success');
    enterProfile(login);
});

cpCancel.addEventListener('click', function() {
    createProfileModal.classList.remove('open');
});

pwLogin.addEventListener('click', function() {
    if (!pendingProfile) return;
    var pass = pwInput.value;
    var hash = simpleHash(pass);
    if (hash === pendingProfile.passHash) {
        passwordModal.classList.remove('open');
        enterProfile(pendingProfile.login);
        pendingProfile = null;
    } else {
        pwError.textContent = 'Неверный пароль';
        pwInput.value = '';
        pwInput.focus();
    }
});

pwInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') pwLogin.click();
});

pwCancel.addEventListener('click', function() {
    passwordModal.classList.remove('open');
    pendingProfile = null;
});

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

// ===== КНОПКИ МЕНЮ =====
tilePlay.addEventListener('click', function() {
    running = false;
    gameOver = false;
    paused = false;
    stopMusic();
    startScreen.classList.add('hidden');
    modeScreen.classList.remove('hidden');
    updateModeBests();
});

tileQuick.addEventListener('click', function() {
    currentMode = 'rogue';
    startScreen.classList.add('hidden');
    modeScreen.classList.add('hidden');
    classScreen.classList.remove('hidden');
    renderClassScreen();
});

modeBack.addEventListener('click', function() {
    modeScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

document.querySelectorAll('.mode-card').forEach(function(card) {
    card.addEventListener('click', function() {
        var modeId = card.dataset.mode;
        selectMode(modeId);
    });
});

function selectMode(modeId) {
    if (!MODES[modeId]) return;
    currentMode = modeId;
    var s = getSave();
    s.lastMode = modeId;
    if (!s.modesPlayed) s.modesPlayed = [];
    if (s.modesPlayed.indexOf(modeId) === -1) {
        s.modesPlayed.push(modeId);
        persist();
        checkAchievements();
    }
    persist();

    if (MODES[modeId].isRoguelike) {
        modeScreen.classList.add('hidden');
        classScreen.classList.remove('hidden');
        renderClassScreen();
    } else {
        modeScreen.classList.add('hidden');
        document.body.classList.add('playing');
        gameOver = false;
        paused = false;
        running = false;
        reset();
    }
}

// ===== ЭКРАН ВЫБОРА КЛАССА =====
classBack.addEventListener('click', function() {
    classScreen.classList.add('hidden');
    modeScreen.classList.remove('hidden');
});

function renderClassScreen() {
    classGrid.innerHTML = '';
    Object.keys(CHARACTER_CLASSES).forEach(function(cid) {
        var cls = CHARACTER_CLASSES[cid];
        var unlocked = isClassUnlocked(cid);
        var card = document.createElement('button');
        card.className = 'class-card ' + cid;
        if (!unlocked) card.classList.add('locked');

        var header = document.createElement('div');
        header.className = 'class-card-header';
        header.innerHTML = '<div class="class-icon">' + cls.icon + '</div>' +
            '<div><div class="class-name">' + cls.name + '</div>' +
            '<div class="class-sub">' + (unlocked ? 'Разблокирован' : 'Заблокирован') + '</div></div>';
        card.appendChild(header);

        var desc = document.createElement('div');
        desc.className = 'class-desc';
        desc.textContent = cls.desc;
        card.appendChild(desc);

        var stats = document.createElement('div');
        stats.className = 'class-stats';
        stats.innerHTML = 
            '<span class="class-stat">❤ ' + cls.startHp + ' HP</span>' +
            '<span class="class-stat">⚡ ' + Math.round(cls.speed * 100) + '%</span>' +
            '<span class="class-stat">🧲 ' + cls.magnet + '</span>';
        card.appendChild(stats);

        var passive = document.createElement('div');
        passive.className = 'class-passive';
        passive.textContent = '✨ ' + cls.passive;
        card.appendChild(passive);

        if (!unlocked) {
            var lock = document.createElement('div');
            lock.className = 'class-lock-hint';
            lock.textContent = '🔒 ' + (cls.unlockText || '');
            card.appendChild(lock);
        }

        card.addEventListener('click', function() {
            if (!unlocked) {
                showToast('Заблокировано: ' + (cls.unlockText || ''), 'error');
                return;
            }
            selectedClass = cid;
            startRoguelikeRun();
        });

        classGrid.appendChild(card);
    });
}

function startRoguelikeRun() {
    classScreen.classList.add('hidden');
    document.body.classList.add('playing');
    gameOver = false;
    paused = false;
    running = false;
    reset();
}

// ===== ЭКРАН ЯДРА =====
tileCore.addEventListener('click', function() {
    startScreen.classList.add('hidden');
    coreScreen.classList.remove('hidden');
    renderCore();
});

coreBack.addEventListener('click', function() {
    closeCoreScreen();
});

function closeCoreScreen() {
    coreScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    updateMainMenuStats();
}

coreScreen.addEventListener('click', function(e) {
    if (e.target === coreScreen) closeCoreScreen();
});

modeScreen.addEventListener('click', function(e) {
    if (e.target === modeScreen) {
        modeScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    }
});

classScreen.addEventListener('click', function(e) {
    if (e.target === classScreen) {
        classScreen.classList.add('hidden');
        modeScreen.classList.remove('hidden');
    }
});

function renderCore() {
    var s = getSave();
    coreGold.textContent = formatNumber(s.bank);
    coreCrystals.textContent = s.coreCrystals || 0;
    coreShards.textContent = s.starShards || 0;
    
    coreGrid.innerHTML = '';
    Object.keys(CORE_STATS).forEach(function(id) {
        var stat = CORE_STATS[id];
        var lvl = getCoreStatLevel(id);
        var maxed = lvl >= stat.maxLevel;
        var price = getCoreStatPrice(id);
        var canAfford = s.bank >= price && !maxed;
        var crystalPrice = getCoreStatCrystalPrice(id);
        var canCrystal = (s.coreCrystals || 0) >= crystalPrice && !maxed;
        
        var card = document.createElement('div');
        card.className = 'core-stat' + (maxed ? ' maxed' : '');
        
        var header = document.createElement('div');
        header.className = 'core-stat-header';
        header.innerHTML = 
            '<div class="core-stat-icon" style="color:' + stat.color + ';">' + stat.icon + '</div>' +
            '<div class="core-stat-info">' +
                '<div class="core-stat-name">' + stat.name + '</div>' +
                '<div class="core-stat-desc">' + stat.desc + '</div>' +
            '</div>' +
            '<div class="core-stat-level">' + (maxed ? '★ MAX' : lvl + '/' + stat.maxLevel) + '</div>';
        card.appendChild(header);
        
        var progress = document.createElement('div');
        progress.className = 'core-progress';
        for (var i = 0; i < stat.maxLevel; i++) {
            var dot = document.createElement('div');
            dot.className = 'core-dot' + (i < lvl ? ' filled' : '');
            progress.appendChild(dot);
        }
        card.appendChild(progress);
        
        var current = document.createElement('div');
        current.className = 'core-current';
        if (maxed) {
            current.innerHTML = 'Сейчас: <span class="cc-val">' + stat.format(lvl) + '</span>';
        } else {
            current.innerHTML = 'Сейчас: <span class="cc-val">' + stat.format(lvl) + '</span>' +
                ' → <span class="cc-val">' + stat.format(lvl + 1) + '</span>';
        }
        card.appendChild(current);
        
        if (!maxed) {
            var buttons = document.createElement('div');
            buttons.className = 'core-buttons';
            
            var upBtn = document.createElement('button');
            upBtn.className = 'core-btn upgrade';
            upBtn.disabled = !canAfford;
            upBtn.innerHTML = '💰 ' + formatNumber(price);
            upBtn.addEventListener('click', function() { upgradeCoreStat(id, false); });
            buttons.appendChild(upBtn);
            
            var crysBtn = document.createElement('button');
            crysBtn.className = 'core-btn crystal';
            crysBtn.disabled = !canCrystal;
            crysBtn.innerHTML = '💎 ' + crystalPrice;
            crysBtn.addEventListener('click', function() { upgradeCoreStat(id, true); });
            buttons.appendChild(crysBtn);
            
            card.appendChild(buttons);
        }
        
        coreGrid.appendChild(card);
    });
}

function upgradeCoreStat(statId, useCrystal) {
    var s = getSave();
    var stat = CORE_STATS[statId];
    var lvl = getCoreStatLevel(statId);
    
    if (lvl >= stat.maxLevel) {
        showToast('Максимальный уровень!', 'info');
        return;
    }
    
    if (useCrystal) {
        var crystalPrice = getCoreStatCrystalPrice(statId);
        if ((s.coreCrystals || 0) < crystalPrice) {
            showToast('Нужно ' + crystalPrice + ' 💎!', 'error');
            return;
        }
        s.coreCrystals -= crystalPrice;
        s.coreStats[statId] = lvl + 1;
        showToast('💎 ' + stat.name + ' → ур. ' + (lvl + 1) + '!', 'legendary');
        playSFX('level');
    } else {
        var price = getCoreStatPrice(statId);
        if (s.bank < price) {
            showToast('Не хватает золота!', 'error');
            return;
        }
        s.bank -= price;
        s.coreStats[statId] = lvl + 1;
        showToast('🌟 ' + stat.name + ' → ур. ' + (lvl + 1) + '!', 'success');
        playSFX('coin');
    }
    
    persist();
    renderCore();
    checkAchievements();
}

// ===== МАГАЗИН / ДОСТИЖЕНИЯ / ЕЖЕДНЕВКА =====
var SHOP_CATEGORIES = {
    appearance: [
        { tab: 'skins', label: '🎨 Скины' },
        { tab: 'themes', label: '🌌 Темы' }
    ],
    effects: [
        { tab: 'items', label: '⚡ Улучшения' },
        { tab: 'boosts', label: '🛍 Бусты' },
        { tab: 'sound', label: '🔊 Звуки' },
        { tab: 'music', label: '🎵 Музыка' }
    ],
    collection: [
        { tab: 'cases', label: '📦 Кейсы' },
        { tab: 'cards', label: '🎴 Карты' },
        { tab: 'achievements', label: '🏆 Достижения' }
    ]
};

function getShopCategory(tab) {
    for (var key in SHOP_CATEGORIES) {
        if (SHOP_CATEGORIES[key].some(function(item) { return item.tab === tab; })) return key;
    }
    return 'appearance';
}

function renderShopNavigation() {
    var category = getShopCategory(currentShopTab);
    var categoryWrap = document.getElementById('shop-category-tabs');
    var subWrap = document.getElementById('shop-subtabs');
    if (!categoryWrap || !subWrap) return;

    var caseInventory = document.getElementById('shop-case-inventory');
    if (caseInventory) {
        caseInventory.classList.toggle('visible', currentShopTab === 'cases');
    }

    categoryWrap.querySelectorAll('.shop-category').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.category === category);
    });

    subWrap.innerHTML = '';
    SHOP_CATEGORIES[category].forEach(function(item) {
        var btn = document.createElement('button');
        btn.className = 'shop-subtab' + (item.tab === currentShopTab ? ' active' : '');
        btn.dataset.tab = item.tab;
        btn.textContent = item.label;
        subWrap.appendChild(btn);
    });
    updateShopBadges();
}

document.querySelectorAll('.shop-category').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var category = btn.dataset.category;
        currentShopTab = SHOP_CATEGORIES[category][0].tab;
        renderShopNavigation();
        renderShop();
    });
});

document.getElementById('shop-subtabs').addEventListener('click', function(e) {
    var btn = e.target.closest('.shop-subtab');
    if (!btn) return;
    currentShopTab = btn.dataset.tab;
    renderShopNavigation();
    renderShop();
});

tileShop.addEventListener('click', function() {
    renderShopNavigation();
    renderShop();
    shopModal.classList.add('open');
});

tileAch.addEventListener('click', function() {
    currentShopTab = 'achievements';
    renderShopNavigation();
    renderShop();
    shopModal.classList.add('open');
});

tileDaily.addEventListener('click', function() {
    openDailyModal();
});

profileBadge.addEventListener('click', function() {
    openProfileMenu();
});

function openProfileMenu() {
    var s = getSave();
    pmNick.textContent = currentProfile.nick;
    pmBest.textContent = s.bestCoins;
    pmTime.textContent = formatTime(s.bestTime);
    pmBank.textContent = s.bank;
    pmCrystals.textContent = s.coreCrystals || 0;
    pmShards.textContent = s.starShards || 0;
    pmCore.textContent = getCoreTotalLevel() + ' (' + getCoreMaxLevel() + ' макс)';
    pmLvl.textContent = s.bestLevel;
    pmGames.textContent = s.gamesPlayed;
    pmBosses.textContent = s.bossesKilled || 0;
    pmRogue.textContent = (s.rogueStats && s.rogueStats.bestLevel) || 0;
    pmTotaltime.textContent = formatTime(s.totalTime);
    profileMenuModal.classList.add('open');
}

pmClose.addEventListener('click', function() { profileMenuModal.classList.remove('open'); });
pmSwitch.addEventListener('click', function() {
    profileMenuModal.classList.remove('open');
    logoutToLogin();
});

// ===== НАСТРОЙКИ =====
btnSettings.addEventListener('click', function() {
    var s = getSave();
    document.querySelectorAll('#settings-modal [data-speed]').forEach(function(b) {
        b.classList.toggle('primary', parseFloat(b.dataset.speed) === s.gameSpeed);
        b.classList.toggle('ghost', parseFloat(b.dataset.speed) !== s.gameSpeed);
    });
    toggleLevelToastBtn.textContent = s.showLevelToast ? 'Вкл' : 'Выкл';
    toggleLevelToastBtn.className = 'modal-btn ' + (s.showLevelToast ? 'primary' : 'ghost');
    toggleWeatherBtn.textContent = s.showWeather ? 'Вкл' : 'Выкл';
    toggleWeatherBtn.className = 'modal-btn ' + (s.showWeather ? 'primary' : 'ghost');
    settingsModal.classList.add('open');
});

settingsClose.addEventListener('click', function() { settingsModal.classList.remove('open'); });

document.querySelectorAll('#settings-modal [data-speed]').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var s = getSave();
        s.gameSpeed = parseFloat(btn.dataset.speed);
        persist();
        document.querySelectorAll('#settings-modal [data-speed]').forEach(function(b) {
            b.classList.toggle('primary', parseFloat(b.dataset.speed) === s.gameSpeed);
            b.classList.toggle('ghost', parseFloat(b.dataset.speed) !== s.gameSpeed);
        });
        showToast('Скорость: ' + btn.textContent.trim(), 'info');
    });
});

toggleLevelToastBtn.addEventListener('click', function() {
    var s = getSave();
    s.showLevelToast = !s.showLevelToast;
    persist();
    toggleLevelToastBtn.textContent = s.showLevelToast ? 'Вкл' : 'Выкл';
    toggleLevelToastBtn.className = 'modal-btn ' + (s.showLevelToast ? 'primary' : 'ghost');
});

toggleWeatherBtn.addEventListener('click', function() {
    var s = getSave();
    s.showWeather = !s.showWeather;
    persist();
    toggleWeatherBtn.textContent = s.showWeather ? 'Вкл' : 'Выкл';
    toggleWeatherBtn.className = 'modal-btn ' + (s.showWeather ? 'primary' : 'ghost');
});

btnHelp.addEventListener('click', function() { helpModal.classList.add('open'); });
helpClose.addEventListener('click', function() { helpModal.classList.remove('open'); });
settingsModal.addEventListener('click', function(e) {
    if (e.target === settingsModal) settingsModal.classList.remove('open');
});
helpModal.addEventListener('click', function(e) {
    if (e.target === helpModal) helpModal.classList.remove('open');
});
profileMenuModal.addEventListener('click', function(e) {
    if (e.target === profileMenuModal) profileMenuModal.classList.remove('open');
});

document.getElementById('reset-progress').addEventListener('click', function() {
    if (!currentProfile) return;
    if (confirm('Сбросить прогресс профиля «' + currentProfile.nick + '»? ВСЁ будет потеряно!')) {
        currentProfile.data = makeDefaultSave();
        persist();
        updateMainMenuStats();
        updateDailyTile();
        applyTheme();
        showToast('Прогресс сброшен', 'info');
    }
});

function showToast(text, type) {
    type = type || 'info';
    toastEl.textContent = text;
    toastEl.className = '';
    void toastEl.offsetWidth;
    toastEl.classList.add('show', type);
}

// ==========================================================
//   ЗВУК
// ==========================================================
var audioCtx = null;
var musicTimer = null;
var masterVolume = 0.3;

function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        console.log('✓ AudioContext создан');
    } catch (e) {}
}

function playTone(freq, duration, type, volume, when) {
    if (!audioCtx) return;
    type = type || 'sine';
    volume = (volume || 0.3) * masterVolume;
    when = when || audioCtx.currentTime;
    duration = duration || 0.15;
    try {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, when);
        gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(when);
        osc.stop(when + duration);
    } catch (e) {}
}

function playSFX(name) {
    if (!audioCtx) return;
    var s = getSave();
    var pack = s.equippedSoundPack || 'classic';
    var freq = 880, dur = 0.12, type = 'sine';
    if (pack === 'classic') {
        if (name === 'coin') freq = 880;
        else if (name === 'hit') freq = 220;
        else if (name === 'level') freq = 523;
        else if (name === 'case') freq = 1200;
        else if (name === 'combo') freq = 1300;
        else if (name === 'boss') freq = 110;
        else if (name === 'upgrade') freq = 660;
    } else if (pack === 'piano') {
        type='triangle'; dur=0.4;
        if (name === 'coin') freq = 1047;
        else if (name === 'hit') freq = 262;
        else if (name === 'level') freq = 523;
        else if (name === 'case') freq = 1319;
        else if (name === 'combo') freq = 1568;
        else if (name === 'boss') freq = 131;
        else if (name === 'upgrade') freq = 784;
    } else if (pack === 'retro') {
        type='square'; dur=0.08;
        if (name === 'coin') freq = 1200;
        else if (name === 'hit') freq = 200;
        else if (name === 'level') freq = 600;
        else if (name === 'case') freq = 1500;
        else if (name === 'combo') freq = 1800;
        else if (name === 'boss') freq = 100;
        else if (name === 'upgrade') freq = 700;
    } else if (pack === 'rock') {
        type='sawtooth'; dur=0.2;
        if (name === 'coin') freq = 660;
        else if (name === 'hit') freq = 110;
        else if (name === 'level') freq = 440;
        else if (name === 'case') freq = 880;
        else if (name === 'combo') freq = 990;
        else if (name === 'boss') freq = 82;
        else if (name === 'upgrade') freq = 550;
    } else if (pack === 'space') {
        type='sine'; dur=0.6;
        if (name === 'coin') freq = 784;
        else if (name === 'hit') freq = 196;
        else if (name === 'level') freq = 392;
        else if (name === 'case') freq = 1046;
        else if (name === 'combo') freq = 1175;
        else if (name === 'boss') freq = 98;
        else if (name === 'upgrade') freq = 587;
    } else if (pack === 'synth') {
        type='sawtooth'; dur=0.25;
        if (name === 'coin') freq = 1318;
        else if (name === 'hit') freq = 165;
        else if (name === 'level') freq = 659;
        else if (name === 'case') freq = 1760;
        else if (name === 'combo') freq = 1975;
        else if (name === 'boss') freq = 123;
        else if (name === 'upgrade') freq = 880;
    } else if (pack === 'nature') {
        type='sine'; dur=0.3;
        if (name === 'coin') freq = 1175;
        else if (name === 'hit') freq = 294;
        else if (name === 'level') freq = 587;
        else if (name === 'case') freq = 1480;
        else if (name === 'combo') freq = 1760;
        else if (name === 'boss') freq = 147;
        else if (name === 'upgrade') freq = 784;
    }
    playTone(freq, dur, type, 0.4);
}

function playMelody(notes, tempo) {
    if (!audioCtx) return;
    var t = audioCtx.currentTime;
    for (var i = 0; i < notes.length; i++) {
        playTone(notes[i], tempo / 1000 * 1.5, 'triangle', 0.15, t + i * tempo / 1000);
    }
}

function startMusic() {
    if (!audioCtx || musicTimer) return;
    var s = getSave();
    var track = MUSIC_TRACKS[s.equippedMusic] || MUSIC_TRACKS.default;
    function loopMusic() {
        if (!running || gameOver) { musicTimer = null; return; }
        playMelody(track.notes, track.tempo);
        musicTimer = setTimeout(loopMusic, track.notes.length * track.tempo + 800);
    }
    loopMusic();
}

function stopMusic() {
    if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
}

document.addEventListener('click', function initOnce() { initAudio(); }, { once: true });

// ==========================================================
//   HUD
// ==========================================================
function updateHUD() {
    hudScoreVal.textContent = score;
    hudLevelVal.textContent = level;
    var hearts = hudLives.querySelectorAll('.hud-heart');
    for (var i = 0; i < hearts.length; i++) {
        hearts[i].classList.toggle('lost', i >= lives);
    }
    var pct = 1 - (levelTimer / LEVEL_DURATION);
    hudProgressFill.style.width = (Math.max(0, Math.min(1, pct)) * 100) + '%';

    if (hudMode) {
        hudMode.textContent = MODES[currentMode].name.toUpperCase();
        hudMode.className = currentMode;
    }

    if (hudTimer) {
        if (MODES[currentMode].hasTimer) {
            var remaining = Math.max(0, Math.ceil(timeLeft));
            hudTimer.textContent = '⏱ ' + remaining + 'с';
            hudTimer.style.color = remaining <= 10 ? '#ff1744' : '#4fc3f7';
        } else {
            hudTimer.textContent = formatTime(runTime);
        }
    }
}

function updateBuffBadges() {
    buffStrip.innerHTML = '';
    function add(cls, icon, sec) {
        var d = document.createElement('div');
        d.className = 'buff-dot ' + cls;
        d.textContent = icon;
        d.setAttribute('data-time', sec + 'с');
        buffStrip.appendChild(d);
    }
    if (buff.magnet > 0) add('', '🧲', Math.ceil(buff.magnet / 60));
    if (buff.freeze > 0) add('freeze', '❄', Math.ceil(buff.freeze / 60));
    if (buff.speedBoost > 0) add('speed', '⚡', Math.ceil(buff.speedBoost / 60));
    if (buff.x2gold > 0) add('x2', '✨', Math.ceil(buff.x2gold / 60));
    if (buff.phantom > 0) add('phantom', '👻', Math.ceil(buff.phantom / 60));
    if (buff.chest > 0) add('chest', '🎁', Math.ceil(buff.chest / 60));
}

function updateUpgradeStrip() {
    if (!upgradeStrip) return;
    upgradeStrip.innerHTML = '';
    if (currentMode !== 'rogue') {
        upgradeStrip.style.display = 'none';
        return;
    }
    upgradeStrip.style.display = 'flex';

    Object.keys(runUpgrades).forEach(function(id) {
        var up = UPGRADE_POOL[id];
        if (!up || runUpgrades[id] <= 0) return;
        var stack = document.createElement('div');
        stack.className = 'up-stack ' + up.rarity;
        stack.innerHTML = '<span>' + up.icon + '</span>' +
            '<span>' + up.name + '</span>' +
            '<span class="us-count">×' + runUpgrades[id] + '</span>';
        upgradeStrip.appendChild(stack);
    });

    runRelics.forEach(function(rid) {
        var rel = RELICS[rid];
        if (!rel) return;
        var stack = document.createElement('div');
        stack.className = 'up-stack ' + rel.rarity;
        stack.innerHTML = '<span>' + rel.icon + '</span>' +
            '<span>' + rel.name + '</span>';
        upgradeStrip.appendChild(stack);
    });
}

function applyTheme() {
    var s = getSave();
    var t = THEMES[s.equippedTheme] || THEMES.cosmos;
    canvas.style.background = 'linear-gradient(180deg, ' + t.bg1 + ' 0%, ' + t.bg2 + ' 50%, ' + t.bg3 + ' 100%)';
    canvas.style.boxShadow = '0 0 40px ' + t.glow + '44, inset 0 0 60px rgba(0,0,0,0.6)';
    canvas.style.borderColor = t.glow + '88';
    gradCache.coinSmall = null;
    gradCache.coinBig = null;
    if (typeof initWeather === 'function') initWeather();
}

var levelToastTimeout = null;
function showLevelToast(levelNum, goldReward, bonusStr, mult) {
    var s = getSave();
    if (!s.showLevelToast) return;
    levelToastTitle.textContent = '📈 УРОВЕНЬ ' + levelNum;
    levelToastReward.textContent = '+' + goldReward + '💰' + (bonusStr || '');
    levelToastMult.textContent = '🪙 ×' + mult + ' золота';
    levelToast.classList.add('show');
    if (levelToastTimeout) clearTimeout(levelToastTimeout);
    levelToastTimeout = setTimeout(function() {
        levelToast.classList.remove('show');
    }, 2200);
}

// ==========================================================
//   ДОСТИЖЕНИЯ
// ==========================================================
function getAchievementProgress(ach) {
    var s = getSave();
    if (ach.type === 'totalCoins') return s.totalCoins || 0;
    if (ach.type === 'bestLevel') return s.bestLevel || 1;
    if (ach.type === 'openedCases') return s.openedCases || 0;
    if (ach.type === 'skinsCount') return s.ownedSkins.length;
    if (ach.type === 'soundsCount') return s.ownedSoundPacks.length;
    if (ach.type === 'musicCount') return s.ownedMusic.length;
    if (ach.type === 'survivalBest') return (s.modeBests && s.modeBests.survival && s.modeBests.survival.time) || 0;
    if (ach.type === 'timeattackBest') return (s.modeBests && s.modeBests.timeattack && s.modeBests.timeattack.coins) || 0;
    if (ach.type === 'hardcoreBest') return (s.modeBests && s.modeBests.hardcore && s.modeBests.hardcore.coins) || 0;
    if (ach.type === 'bossesKilled') return s.bossesKilled || 0;
    if (ach.type === 'modesPlayed') return (s.modesPlayed || []).length;
    if (ach.type === 'coreMaxLevel') return getCoreMaxLevel();
    if (ach.type === 'rogueUpgrades') return (s.rogueStats && s.rogueStats.totalUpgradesPicked) || 0;
    if (ach.type === 'rogueMaxUpgradesRun') return (s.rogueStats && s.rogueStats.maxUpgradesInRun) || 0;
    if (ach.type === 'synergiesActivated') return (s.rogueStats && s.rogueStats.synergiesActivated) || 0;
    if (ach.type === 'relicsMaxRun') return (s.rogueStats && s.rogueStats.maxRelicsInRun) || 0;
    if (ach.type === 'rogueBest') return (s.rogueStats && s.rogueStats.bestLevel) || 0;
    return 0;
}

function checkAchievements() {
    var s = getSave();
    Object.keys(ACHIEVEMENTS).forEach(function(k) {
        var a = ACHIEVEMENTS[k];
        if (s.claimedAchievements.indexOf(a.id) !== -1) return;
        var progress = getAchievementProgress(a);
        if (progress >= a.target) {
            showAchievementPopup(a);
        }
    });
    updateShopBadges();
}

function showAchievementPopup(ach) {
    apIcon.textContent = ach.icon;
    apName.textContent = ach.name;
    apReward.textContent = '→ Зайди в достижения!';
    achPopup.classList.add('show');
    playSFX('level');
    setTimeout(function() {
        achPopup.classList.remove('show');
    }, 3500);
}

function claimAchievement(ach) {
    var s = getSave();
    if (s.claimedAchievements.indexOf(ach.id) !== -1) return;
    var progress = getAchievementProgress(ach);
    if (progress < ach.target) return;
    s.claimedAchievements.push(ach.id);

    if (ach.reward.type === 'gold') {
        s.bank += ach.reward.amount;
        showToast('🏆 ' + ach.name + ': +' + ach.reward.amount + ' золота!', 'legendary');
    } else if (ach.reward.type === 'crystals') {
        s.coreCrystals = (s.coreCrystals || 0) + ach.reward.amount;
        showToast('🏆 ' + ach.name + ': +' + ach.reward.amount + ' 💎!', 'legendary');
    } else if (ach.reward.type === 'shards') {
        s.starShards = (s.starShards || 0) + ach.reward.amount;
        showToast('🏆 ' + ach.name + ': +' + ach.reward.amount + ' ✨!', 'epic');
    } else if (ach.reward.type === 'skin') {
        if (s.ownedSkins.indexOf(ach.reward.skinId) === -1) {
            s.ownedSkins.push(ach.reward.skinId);
            showToast('🏆 ' + ach.name + ': скин «' + SKINS[ach.reward.skinId].name + '»!', 'legendary');
        } else {
            s.bank += 500;
            showToast('🏆 ' + ach.name + ': +500 золота', 'legendary');
        }
    } else if (ach.reward.type === 'case') {
        s.freeCases[ach.reward.caseId] = (s.freeCases[ach.reward.caseId] || 0) + 1;
        showToast('🏆 ' + ach.name + ': ' + CASES[ach.reward.caseId].name + '!', 'legendary');
    }
    persist();
    updateMainMenuStats();
    updateShopBadges();
    if (shopModal.classList.contains('open')) renderShop();
    if (!coreScreen.classList.contains('hidden')) renderCore();
}

function updateShopBadges() {
    var s = getSave();
    var unclaimed = 0;
    Object.keys(ACHIEVEMENTS).forEach(function(k) {
        var a = ACHIEVEMENTS[k];
        var progress = getAchievementProgress(a);
        if (progress >= a.target && s.claimedAchievements.indexOf(a.id) === -1) unclaimed++;
    });
    var achTab = document.querySelector('.shop-subtab[data-tab="achievements"]');
    if (achTab) {
        var old = achTab.querySelector('.tab-badge');
        if (old) old.remove();
        if (unclaimed > 0) {
            var badge = document.createElement('span');
            badge.className = 'tab-badge';
            badge.textContent = unclaimed;
            achTab.appendChild(badge);
        }
    }
}

// ==========================================================
//   ЕЖЕДНЕВНЫЙ БОНУС
// ==========================================================
function openDailyModal() {
    var s = getSave();
    renderDailyGrid();
    dailyModal.classList.add('open');
    var canClaim = s.lastDailyClaim !== getTodayStr();
    dailyClaimBtn.disabled = !canClaim;
    dailyClaimBtn.textContent = canClaim ? 'Забрать' : 'Уже получено сегодня';
}

function renderDailyGrid() {
    var s = getSave();
    dailyGrid.innerHTML = '';
    var today = getTodayStr();
    var canClaim = s.lastDailyClaim !== today;
    var currentDay = canClaim ? (s.dailyStreak || 0) + 1 : (s.dailyStreak || 0);
    if (currentDay > 7) currentDay = 1;

    DAILY_REWARDS.forEach(function(r) {
        var div = document.createElement('div');
        div.className = 'daily-day';
        var claimed = r.day < currentDay || (r.day === currentDay && !canClaim);
        var isToday = r.day === currentDay && canClaim;
        if (claimed) div.classList.add('claimed');
        if (isToday) div.classList.add('today');
        div.innerHTML = '<div class="day-num">День ' + r.day + '</div>' +
            '<div class="day-reward">' + r.icon + '</div>' +
            '<div class="day-label">' + r.label + '</div>';
        dailyGrid.appendChild(div);
    });
}

function claimDaily() {
    var s = getSave();
    var today = getTodayStr();
    if (s.lastDailyClaim === today) return;
    var yesterday = getYesterdayStr();
    if (s.lastDailyClaim === yesterday) {
        s.dailyStreak = Math.min((s.dailyStreak || 0) + 1, 7);
    } else {
        s.dailyStreak = 1;
    }
    if (s.dailyStreak > 7) s.dailyStreak = 1;
    s.lastDailyClaim = today;
    if (!s.dailyHistory) s.dailyHistory = [];
    s.dailyHistory.push(today);
    if (s.dailyHistory.length > 30) s.dailyHistory.shift();
    var reward = DAILY_REWARDS[s.dailyStreak - 1];
    if (reward.type === 'gold') {
        s.bank += reward.amount;
        showToast('🎁 День ' + s.dailyStreak + ': +' + reward.amount + ' золота!', 'legendary');
    } else if (reward.type === 'case') {
        s.freeCases[reward.caseId] = (s.freeCases[reward.caseId] || 0) + 1;
        showToast('🎁 День ' + s.dailyStreak + ': ' + CASES[reward.caseId].name + '!', 'legendary');
    }

    if (s.lastDailyCrystals !== today) {
        s.lastDailyCrystals = today;
        s.coreCrystals = (s.coreCrystals || 0) + 3;
        s.starShards = (s.starShards || 0) + 10;
        setTimeout(function() {
            showToast('💎 +3 кристалла, ✨ +10 осколков!', 'epic');
        }, 1000);
    }

    persist();
    updateMainMenuStats();
    updateDailyTile();
    renderDailyGrid();
    dailyClaimBtn.disabled = true;
    dailyClaimBtn.textContent = 'Уже получено';
}

dailyClaimBtn.addEventListener('click', claimDaily);
dailyModal.addEventListener('click', function(e) {
    if (e.target === dailyModal) dailyModal.classList.remove('open');
});

// ==========================================================
//   МАГАЗИН
// ==========================================================
function makeCard(cls) {
    var c = document.createElement('div');
    c.className = 'shop-card ' + (cls || '');
    return c;
}

function renderShop() {
    var s = getSave();
    shopBankVal.textContent = formatNumber(s.bank);
    shopGrid.innerHTML = '';
    if (currentShopTab === 'skins') renderSkins();
    else if (currentShopTab === 'items') renderItems();
    else if (currentShopTab === 'boosts') renderBoosts();
    else if (currentShopTab === 'themes') renderThemes();
    else if (currentShopTab === 'cases') renderCases();
    else if (currentShopTab === 'sound') renderSoundPacks();
    else if (currentShopTab === 'music') renderMusic();
    else if (currentShopTab === 'cards') renderCards();
    else if (currentShopTab === 'achievements') renderAchievements();
}

function renderSkins() {
    var s = getSave();
    Object.keys(SKINS).forEach(function(k) {
        var skin = SKINS[k];
        var owned = s.ownedSkins.indexOf(skin.id) !== -1;
        var equipped = s.equippedSkin === skin.id;
        var canAfford = s.bank >= skin.price;
        var card = makeCard(skin.rarity);
        if (owned) card.classList.add('owned');
        if (equipped) card.classList.add('equipped');
        if (!owned && !canAfford) card.classList.add('cant-afford');
        if (!owned) card.classList.add('locked');

        var rb = document.createElement('div');
        rb.className = 'rarity-badge ' + skin.rarity;
        rb.textContent = skin.rarity;
        card.appendChild(rb);

        var prev = document.createElement('div');
        prev.className = 'skin-preview';
        prev.style.background = 'radial-gradient(circle, ' + skin.colors.glow + '33 0%, transparent 70%)';
        var inner = document.createElement('div');
        inner.className = 'skin-preview-inner';
        inner.style.background = 'linear-gradient(180deg, ' + skin.colors.top + ', ' + skin.colors.bottom + ')';
        inner.style.boxShadow = '0 0 16px ' + skin.colors.glow;
        prev.appendChild(inner);
        card.appendChild(prev);

        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = skin.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = skin.desc; card.appendChild(ds);

        var pr = document.createElement('div');
        if (equipped) { pr.className = 'shop-price equipped'; pr.textContent = '✓ НАДЕТ'; }
        else if (owned) { pr.className = 'shop-price bought'; pr.textContent = 'Надеть'; }
        else { pr.className = 'shop-price'; pr.textContent = '💰 ' + formatNumber(skin.price); }
        card.appendChild(pr);

        card.addEventListener('click', function() { handleSkinClick(skin); });
        shopGrid.appendChild(card);
    });
}

function renderItems() {
    var s = getSave();
    Object.keys(ITEMS).forEach(function(k) {
        var item = ITEMS[k];
        var owned = s.ownedItems.indexOf(item.id) !== -1;
        var canAfford = s.bank >= item.price;
        var card = makeCard('rare');
        if (owned) card.classList.add('owned');
        if (!owned && !canAfford) card.classList.add('cant-afford');
        var ic = document.createElement('div'); ic.className = 'shop-icon'; ic.textContent = item.icon;
        ic.style.color = item.id === 'premium' ? '#e040fb' : '#4fc3f7';
        card.appendChild(ic);
        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = item.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = item.desc; card.appendChild(ds);
        var pr = document.createElement('div');
        if (owned) { pr.className = 'shop-price bought'; pr.textContent = '✓ Активно'; }
        else { pr.className = 'shop-price'; pr.textContent = '💰 ' + formatNumber(item.price); }
        card.appendChild(pr);
        if (!owned) card.addEventListener('click', function() { handleItemClick(item); });
        shopGrid.appendChild(card);
    });
}

function renderBoosts() {
    var s = getSave();
    Object.keys(BOOSTS).forEach(function(k) {
        var boost = BOOSTS[k];
        var count = (s.boosts && s.boosts[boost.id]) || 0;
        var canAfford = s.bank >= boost.price;
        var card = makeCard('common');
        if (!canAfford) card.classList.add('cant-afford');
        if (count > 0) {
            var rb = document.createElement('div');
            rb.className = 'rarity-badge rare';
            rb.textContent = '×' + count;
            card.appendChild(rb);
        }
        var ic = document.createElement('div'); ic.className = 'shop-icon'; ic.textContent = boost.icon;
        ic.style.color = '#ffd93d';
        card.appendChild(ic);
        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = boost.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = boost.desc; card.appendChild(ds);
        var pr = document.createElement('div'); pr.className = 'shop-price'; pr.textContent = '💰 ' + formatNumber(boost.price);
        card.appendChild(pr);
        card.addEventListener('click', function() { handleBoostClick(boost); });
        shopGrid.appendChild(card);
    });
}

function renderThemes() {
    var s = getSave();
    Object.keys(THEMES).forEach(function(k) {
        var theme = THEMES[k];
        var owned = s.ownedThemes.indexOf(theme.id) !== -1;
        var equipped = s.equippedTheme === theme.id;
        var canAfford = s.bank >= theme.price;
        var card = makeCard(theme.rarity);
        if (owned) card.classList.add('owned');
        if (equipped) card.classList.add('equipped');
        if (!owned && !canAfford) card.classList.add('cant-afford');
        if (!owned) card.classList.add('locked');

        var rb = document.createElement('div');
        rb.className = 'rarity-badge ' + theme.rarity;
        rb.textContent = theme.rarity;
        card.appendChild(rb);

        var prev = document.createElement('div');
        prev.style.cssText = 'width:55px;height:55px;border-radius:12px;margin:4px auto 8px;' +
            'background:linear-gradient(180deg,' + theme.bg1 + ',' + theme.bg2 + ');' +
            'border:1px solid ' + theme.glow + ';';
        card.appendChild(prev);

        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = theme.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = theme.desc; card.appendChild(ds);

        var pr = document.createElement('div');
        if (equipped) { pr.className = 'shop-price equipped'; pr.textContent = '✓ ВЫБРАНА'; }
        else if (owned) { pr.className = 'shop-price bought'; pr.textContent = 'Выбрать'; }
        else { pr.className = 'shop-price'; pr.textContent = '💰 ' + formatNumber(theme.price); }
        card.appendChild(pr);

        card.addEventListener('click', function() { handleThemeClick(theme); });
        shopGrid.appendChild(card);
    });
}

function renderCases() {
    var s = getSave();
    var totalCases = Object.keys(s.freeCases || {}).reduce(function(sum, id) {
        return sum + Math.max(0, Number(s.freeCases[id] || 0));
    }, 0);
    var inventoryBadge = document.getElementById('shop-case-inventory');
    if (inventoryBadge) {
        inventoryBadge.textContent = '🎁 В наличии: ' + totalCases;
        inventoryBadge.classList.toggle('has-cases', totalCases > 0);
    }
    Object.keys(s.freeCases).forEach(function(cid) {
        if (s.freeCases[cid] <= 0) return;
        var c = CASES[cid];
        if (!c) return;
        var card = makeCard(c.id === 'mythic' ? 'mythic' :
                           c.id === 'legendary' ? 'legendary' :
                           c.id === 'epic' ? 'epic' : 'common');
        card.style.position = 'relative';
        var badge = document.createElement('div');
        badge.className = 'free-cases-badge';
        badge.textContent = '×' + s.freeCases[cid];
        card.appendChild(badge);

        var ic = document.createElement('div'); ic.className = 'shop-icon'; ic.textContent = c.icon;
        ic.style.fontSize = '48px';
        card.appendChild(ic);
        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = 'Бесплатный ' + c.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = 'Из инвентаря'; card.appendChild(ds);
        var pity = document.createElement('div'); pity.className = 'case-card-pity';
        var pityLimit = { common:8, rare:7, epic:6, legendary:5, mythic:3 }[cid] || 8;
        pity.textContent = 'Гарантия: ' + Math.min(pityLimit, Number((s.casePity || {})[cid] || 0)) + '/' + pityLimit;
        card.appendChild(pity);
        var pr = document.createElement('div'); pr.className = 'shop-price free'; pr.textContent = '🎁 ОТКРЫТЬ';
        card.appendChild(pr);

        card.addEventListener('click', function() { openCase(cid, true); });
        shopGrid.appendChild(card);
    });

    Object.keys(CASES).forEach(function(k) {
        var c = CASES[k];
        var canAfford = s.bank >= c.price;
        var card = makeCard(c.id === 'mythic' ? 'mythic' :
                           c.id === 'legendary' ? 'legendary' :
                           c.id === 'epic' ? 'epic' : 'common');
        if (!canAfford) card.classList.add('cant-afford');

        var ic = document.createElement('div'); ic.className = 'shop-icon'; ic.textContent = c.icon;
        ic.style.fontSize = '48px';
        card.appendChild(ic);
        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = c.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = c.desc; card.appendChild(ds);
        var pity = document.createElement('div'); pity.className = 'case-card-pity';
        var pityLimit = { common:8, rare:7, epic:6, legendary:5, mythic:3 }[c.id] || 8;
        pity.textContent = 'Гарантия: ' + Math.min(pityLimit, Number((s.casePity || {})[c.id] || 0)) + '/' + pityLimit;
        card.appendChild(pity);
        var pr = document.createElement('div'); pr.className = 'shop-price'; pr.textContent = '💰 ' + formatNumber(c.price);
        card.appendChild(pr);
        card.addEventListener('click', function() { openCase(c.id, false); });
        shopGrid.appendChild(card);
    });
}

function renderSoundPacks() {
    var s = getSave();
    Object.keys(SOUND_PACKS).forEach(function(k) {
        var sp = SOUND_PACKS[k];
        var owned = s.ownedSoundPacks.indexOf(sp.id) !== -1;
        var equipped = s.equippedSoundPack === sp.id;
        var canAfford = s.bank >= sp.price;
        var card = makeCard(sp.rarity);
        if (owned) card.classList.add('owned');
        if (equipped) card.classList.add('equipped');
        if (!owned && !canAfford) card.classList.add('cant-afford');
        if (!owned) card.classList.add('locked');

        var rb = document.createElement('div');
        rb.className = 'rarity-badge ' + sp.rarity;
        rb.textContent = sp.rarity;
        card.appendChild(rb);

        var ic = document.createElement('div');
        ic.className = 'shop-icon';
        ic.textContent = sp.icon;
        ic.style.color = '#4fc3f7';
        card.appendChild(ic);

        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = sp.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = sp.desc; card.appendChild(ds);

        var pr = document.createElement('div');
        if (equipped) { pr.className = 'shop-price equipped'; pr.textContent = '✓ ВЫБРАН'; }
        else if (owned) { pr.className = 'shop-price bought'; pr.textContent = 'Выбрать'; }
        else { pr.className = 'shop-price'; pr.textContent = '💰 ' + formatNumber(sp.price); }
        card.appendChild(pr);

        card.addEventListener('click', function() { handleSoundClick(sp); });
        shopGrid.appendChild(card);
    });
}

function renderMusic() {
    var s = getSave();
    Object.keys(MUSIC_TRACKS).forEach(function(k) {
        var mt = MUSIC_TRACKS[k];
        var owned = s.ownedMusic.indexOf(mt.id) !== -1;
        var equipped = s.equippedMusic === mt.id;
        var canAfford = s.bank >= mt.price;
        var card = makeCard(mt.rarity);
        if (owned) card.classList.add('owned');
        if (equipped) card.classList.add('equipped');
        if (!owned && !canAfford) card.classList.add('cant-afford');
        if (!owned) card.classList.add('locked');

        var rb = document.createElement('div');
        rb.className = 'rarity-badge ' + mt.rarity;
        rb.textContent = mt.rarity;
        card.appendChild(rb);

        var ic = document.createElement('div');
        ic.className = 'shop-icon';
        ic.textContent = mt.icon;
        ic.style.color = '#b388ff';
        card.appendChild(ic);

        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = mt.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = mt.desc; card.appendChild(ds);

        var pr = document.createElement('div');
        if (equipped) { pr.className = 'shop-price equipped'; pr.textContent = '✓ ИГРАЕТ'; }
        else if (owned) { pr.className = 'shop-price bought'; pr.textContent = 'Включить'; }
        else { pr.className = 'shop-price'; pr.textContent = '💰 ' + formatNumber(mt.price); }
        card.appendChild(pr);

        card.addEventListener('click', function() { handleMusicClick(mt); });
        shopGrid.appendChild(card);
    });
}

function renderCards() {
    var s = getSave();
    Object.keys(CARDS).forEach(function(k) {
        var cd = CARDS[k];
        var owned = s.ownedCards.indexOf(cd.id) !== -1;
        var canAfford = s.bank >= cd.price;
        var card = makeCard(cd.rarity);
        if (owned) card.classList.add('owned');
        if (!owned && !canAfford) card.classList.add('cant-afford');
        if (!owned) card.classList.add('locked');

        var rb = document.createElement('div');
        rb.className = 'rarity-badge ' + cd.rarity;
        rb.textContent = cd.rarity;
        card.appendChild(rb);

        var prev = document.createElement('div');
        prev.className = 'card-preview ' + cd.rarity;
        prev.textContent = cd.icon;
        card.appendChild(prev);

        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = cd.name; card.appendChild(nm);
        var pr = document.createElement('div');
        if (owned) { pr.className = 'shop-price bought'; pr.textContent = '✓ В КОЛЛЕКЦИИ'; }
        else { pr.className = 'shop-price'; pr.textContent = '💰 ' + formatNumber(cd.price); }
        card.appendChild(pr);

        if (!owned) card.addEventListener('click', function() { handleCardClick(cd); });
        shopGrid.appendChild(card);
    });
}

function renderAchievements() {
    var s = getSave();
    Object.keys(ACHIEVEMENTS).forEach(function(k) {
        var a = ACHIEVEMENTS[k];
        var progress = getAchievementProgress(a);
        var claimed = s.claimedAchievements.indexOf(a.id) !== -1;
        var done = progress >= a.target;

        var card = makeCard(done ? 'rare' : 'common');
        card.className = 'ach-card';
        if (done) card.classList.add('done');
        if (claimed) card.classList.add('claimed');

        var ic = document.createElement('div');
        ic.className = 'ach-icon';
        ic.textContent = a.icon;
        ic.style.color = claimed ? '#7cffb2' : (done ? '#ffd93d' : '#8ab4ff');
        card.appendChild(ic);

        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = a.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = a.desc; card.appendChild(ds);

        var bar = document.createElement('div');
        bar.className = 'ach-progress-bar';
        var fill = document.createElement('div');
        fill.className = 'ach-progress-fill';
        var pct = Math.min(100, (progress / a.target) * 100);
        fill.style.width = pct + '%';
        bar.appendChild(fill);
        card.appendChild(bar);

        var ptext = document.createElement('div');
        ptext.className = 'ach-progress-text';
        ptext.textContent = Math.min(progress, a.target) + ' / ' + a.target;
        card.appendChild(ptext);

        var rew = document.createElement('div');
        rew.className = 'ach-reward';
        if (a.reward.type === 'gold') rew.textContent = '💰 +' + formatNumber(a.reward.amount);
        else if (a.reward.type === 'crystals') rew.textContent = '💎 +' + a.reward.amount;
        else if (a.reward.type === 'shards') rew.textContent = '✨ +' + a.reward.amount;
        else if (a.reward.type === 'skin') rew.textContent = '🎨 ' + (SKINS[a.reward.skinId] ? SKINS[a.reward.skinId].name : 'Скин');
        else if (a.reward.type === 'case') rew.textContent = CASES[a.reward.caseId].icon + ' ' + CASES[a.reward.caseId].name;
        if (claimed) rew.classList.add('claimed');
        card.appendChild(rew);

        if (done && !claimed) {
            card.addEventListener('click', function() { claimAchievement(a); });
        } else if (!done) {
            card.style.cursor = 'default';
        }
        shopGrid.appendChild(card);
    });
}

// ===== ОБРАБОТЧИКИ =====
function handleSkinClick(skin) {
    var s = getSave();
    var owned = s.ownedSkins.indexOf(skin.id) !== -1;
    var equipped = s.equippedSkin === skin.id;
    if (equipped) { showToast('Уже надет', 'info'); return; }
    if (owned) {
        s.equippedSkin = skin.id;
        persist(); renderShop(); updateMainMenuStats();
        showToast('✓ Надет: ' + skin.name, 'success');
        return;
    }
    if (s.bank < skin.price) { showToast('Не хватает золота!', 'error'); return; }
    s.bank -= skin.price;
    s.ownedSkins.push(skin.id);
    s.equippedSkin = skin.id;
    persist(); renderShop(); updateMainMenuStats();
    checkAchievements();
    var t = (skin.rarity === 'legendary' || skin.rarity === 'mythic') ? 'legendary' : 'success';
    showToast('🛒 Куплено: ' + skin.name, t);
}

function handleItemClick(item) {
    var s = getSave();
    if (s.bank < item.price) { showToast('Не хватает золота!', 'error'); return; }
    s.bank -= item.price;
    s.ownedItems.push(item.id);
    item.apply(s);
    persist(); renderShop(); updateMainMenuStats();
    showToast('⚡ Куплено: ' + item.name, 'success');
}

function handleBoostClick(boost) {
    var s = getSave();
    if (s.bank < boost.price) { showToast('Не хватает золота!', 'error'); return; }
    s.bank -= boost.price;
    s.boosts[boost.id] = (s.boosts[boost.id] || 0) + 1;
    persist(); renderShop(); updateMainMenuStats();
    showToast('🛍 Куплено: ' + boost.name, 'success');
}

function handleThemeClick(theme) {
    var s = getSave();
    var owned = s.ownedThemes.indexOf(theme.id) !== -1;
    var equipped = s.equippedTheme === theme.id;
    if (equipped) { showToast('Уже выбрана', 'info'); return; }
    if (owned) {
        s.equippedTheme = theme.id;
        persist(); renderShop(); applyTheme();
        showToast('🌌 Выбрана: ' + theme.name, 'success');
        return;
    }
    if (s.bank < theme.price) { showToast('Не хватает золота!', 'error'); return; }
    s.bank -= theme.price;
    s.ownedThemes.push(theme.id);
    s.equippedTheme = theme.id;
    persist(); renderShop(); applyTheme();
    var t = (theme.rarity === 'legendary' || theme.rarity === 'mythic') ? 'legendary' : 'success';
    showToast('🌌 Куплено: ' + theme.name, t);
}

function handleSoundClick(sp) {
    var s = getSave();
    var owned = s.ownedSoundPacks.indexOf(sp.id) !== -1;
    var equipped = s.equippedSoundPack === sp.id;
    if (equipped) { showToast('Уже выбран', 'info'); return; }
    if (owned) {
        s.equippedSoundPack = sp.id;
        persist(); renderShop();
        showToast('🔊 Выбран: ' + sp.name, 'success');
        playSFX('coin');
        return;
    }
    if (s.bank < sp.price) { showToast('Не хватает золота!', 'error'); return; }
    s.bank -= sp.price;
    s.ownedSoundPacks.push(sp.id);
    s.equippedSoundPack = sp.id;
    persist(); renderShop(); updateMainMenuStats();
    checkAchievements();
    showToast('🔊 Куплено: ' + sp.name, 'success');
}

function handleMusicClick(mt) {
    var s = getSave();
    var owned = s.ownedMusic.indexOf(mt.id) !== -1;
    var equipped = s.equippedMusic === mt.id;
    if (equipped) { showToast('Уже играет', 'info'); return; }
    if (owned) {
        s.equippedMusic = mt.id;
        stopMusic();
        persist(); renderShop();
        showToast('🎵 Включено: ' + mt.name, 'success');
        if (running) startMusic();
        return;
    }
    if (s.bank < mt.price) { showToast('Не хватает золота!', 'error'); return; }
    s.bank -= mt.price;
    s.ownedMusic.push(mt.id);
    s.equippedMusic = mt.id;
    stopMusic();
    persist(); renderShop(); updateMainMenuStats();
    checkAchievements();
    showToast('🎵 Куплено: ' + mt.name, 'legendary');
}

function handleCardClick(cd) {
    var s = getSave();
    if (s.bank < cd.price) { showToast('Не хватает золота!', 'error'); return; }
    s.bank -= cd.price;
    s.ownedCards.push(cd.id);
    persist(); renderShop(); updateMainMenuStats();
    showToast('🎴 Карта: ' + cd.name + '!', 'legendary');
}

shopClose.addEventListener('click', function() { shopModal.classList.remove('open'); });
shopModal.addEventListener('click', function(e) {
    if (e.target === shopModal) shopModal.classList.remove('open');
});

// ==========================================================
//   КЕЙСЫ
// ==========================================================
function openCase(caseId, isFree) {
    var s = getSave();
    var c = CASES[caseId];
    if (!c) return;

    if (isFree) {
        if (!s.freeCases[caseId] || s.freeCases[caseId] <= 0) {
            showToast('Нет бесплатных кейсов', 'error');
            return;
        }
        s.freeCases[caseId]--;
    } else {
        if (s.bank < c.price) {
            showToast('Не хватает золота!', 'error');
            return;
        }
        s.bank -= c.price;
    }

    s.openedCases++;
    s.casePity = s.casePity || {};
    s.casePity[caseId] = Math.max(0, Number(s.casePity[caseId] || 0) + 1);

    // Guaranteed rarity threshold per case.
    var pityLimit = { common: 8, rare: 7, epic: 6, legendary: 5, mythic: 3 }[caseId] || 8;
    var pityThreshold = { common: 'epic', rare: 'epic', epic: 'legendary', legendary: 'mythic', mythic: 'mythic' }[caseId] || 'epic';
    var rarityRank = { common:1, rare:2, epic:3, legendary:4, mythic:5 };
    var forcePity = s.casePity[caseId] >= pityLimit;
    persist();
    updateMainMenuStats();
    updateShopBadges();
    playSFX('case');

    var roll = Math.random() * 100;
    var cum = 0;
    var droppedRarity = 'common';
    for (var i = 0; i < c.dropTable.length; i++) {
        cum += c.dropTable[i].chance;
        if (roll <= cum) { droppedRarity = c.dropTable[i].rarity; break; }
    }
    if (forcePity) {
        var eligible = c.dropTable.filter(function(entry) {
            return rarityRank[entry.rarity] >= rarityRank[pityThreshold];
        });
        if (eligible.length) {
            var total = eligible.reduce(function(sum, entry) { return sum + entry.chance; }, 0);
            var pityRoll = Math.random() * total, pityCum = 0;
            droppedRarity = eligible[eligible.length - 1].rarity;
            eligible.some(function(entry) {
                pityCum += entry.chance;
                if (pityRoll <= pityCum) { droppedRarity = entry.rarity; return true; }
                return false;
            });
        }
    }

    var allPool = [];
    Object.keys(SKINS).forEach(function(k) {
        var sk = SKINS[k];
        if (sk.rarity === droppedRarity)
            allPool.push({ type:'skin', id:sk.id, data:sk, icon:'🎨', label:'СКИН' });
    });
    if (caseId !== 'common') {
        Object.keys(SOUND_PACKS).forEach(function(k) {
            var sp = SOUND_PACKS[k];
            if (sp.rarity === droppedRarity)
                allPool.push({ type:'sound', id:sp.id, data:sp, icon:sp.icon, label:'ЗВУК' });
        });
    }
    if (caseId === 'epic' || caseId === 'legendary' || caseId === 'mythic') {
        Object.keys(MUSIC_TRACKS).forEach(function(k) {
            var mt = MUSIC_TRACKS[k];
            if (mt.rarity === droppedRarity)
                allPool.push({ type:'music', id:mt.id, data:mt, icon:mt.icon, label:'МУЗЫКА' });
        });
    }
    if (caseId === 'legendary' || caseId === 'mythic') {
        Object.keys(CARDS).forEach(function(k) {
            var cd = CARDS[k];
            if (cd.rarity === droppedRarity)
                allPool.push({ type:'card', id:cd.id, data:cd, icon:cd.icon, label:'КАРТА' });
        });
    }

    if (allPool.length === 0) {
        if (rarityRank[droppedRarity] >= rarityRank[pityThreshold]) s.casePity[caseId] = 0;
        var refund = DUPLICATE_REFUND[droppedRarity] || 50;
        var goldReward = {
            type: 'gold', id: 'gold_' + droppedRarity,
            data: { name: '+' + refund + ' золота', rarity: droppedRarity },
            icon: '💰', label: 'ЗОЛОТО', goldAmount: refund
        };
        s.bank += refund;
        s.totalRefund += refund;
        persist();
        updateMainMenuStats();
        showCaseAnimation(goldReward, caseId);
        return;
    }

    var reward = allPool[Math.floor(Math.random() * allPool.length)];
    var owned = false;
    if (reward.type === 'skin') owned = s.ownedSkins.indexOf(reward.id) !== -1;
    else if (reward.type === 'sound') owned = s.ownedSoundPacks.indexOf(reward.id) !== -1;
    else if (reward.type === 'music') owned = s.ownedMusic.indexOf(reward.id) !== -1;
    else if (reward.type === 'card') owned = s.ownedCards.indexOf(reward.id) !== -1;

    if (owned) {
        if (rarityRank[droppedRarity] >= rarityRank[pityThreshold]) s.casePity[caseId] = 0;
        var refundAmount = DUPLICATE_REFUND[droppedRarity] || 50;
        var goldReward2 = {
            type: 'gold', id: 'gold_' + droppedRarity + '_' + Date.now(),
            data: { name: '+' + refundAmount + ' золота', rarity: droppedRarity },
            icon: '💰', label: 'ДУБЛИКАТ', goldAmount: refundAmount
        };
        s.bank += refundAmount;
        s.totalRefund += refundAmount;
        persist();
        updateMainMenuStats();
        showCaseAnimation(goldReward2, caseId);
        return;
    }

    if (rarityRank[droppedRarity] >= rarityRank[pityThreshold]) s.casePity[caseId] = 0;
    if (reward.type === 'skin') s.ownedSkins.push(reward.id);
    else if (reward.type === 'sound') { s.ownedSoundPacks.push(reward.id); s.equippedSoundPack = reward.id; }
    else if (reward.type === 'music') { s.ownedMusic.push(reward.id); s.equippedMusic = reward.id; }
    else if (reward.type === 'card') s.ownedCards.push(reward.id);
    persist();
    updateMainMenuStats();
    updateShopBadges();
    showCaseAnimation(reward, caseId);
}

function showCaseAnimation(reward, caseId) {
    caseReel.innerHTML = '';
    caseResult.textContent = '';
    caseResult.classList.remove('show');
    caseWindow.className = 'case-window ' + (CASES[caseId] ? CASES[caseId].id : 'common');
    var caseHero = document.getElementById('case-hero');
    var caseVisual = document.getElementById('case-box-visual');
    var caseMeta = document.getElementById('case-meta');
    var pityText = document.getElementById('case-pity-text');
    var pityFill = document.getElementById('case-pity-fill');
    var pityLimit = { common:8, rare:7, epic:6, legendary:5, mythic:3 }[caseId] || 8;
    var pityCount = Math.min(pityLimit, Number((getSave().casePity || {})[caseId] || 0));
    caseTitle.textContent = CASES[caseId].name;
    if (caseVisual) {
        caseVisual.textContent = '📦';
        caseVisual.dataset.rarity = caseId;
    }
    if (caseMeta) {
        caseMeta.textContent = (isFree ? '🎁 Бесплатный' : '💰 ' + formatNumber(CASES[caseId].price)) + '  •  В наличии: ' +
            (isFree ? Number((getSave().freeCases || {})[caseId] || 0) : '—');
    }
    if (pityText) pityText.textContent = pityCount + ' / ' + pityLimit;
    if (pityFill) pityFill.style.width = (pityCount / pityLimit * 100) + '%';
    if (caseHero) caseHero.classList.remove('revealed');
    caseCloseBtn.disabled = true;
    caseCloseBtn.textContent = 'Крутим...';

    var backgroundItems = [];
    Object.keys(SKINS).forEach(function(k) {
        backgroundItems.push({ icon:'🎨', label:'СКИН', rarity:SKINS[k].rarity });
    });
    Object.keys(SOUND_PACKS).forEach(function(k) {
        backgroundItems.push({ icon:SOUND_PACKS[k].icon, label:'ЗВУК', rarity:SOUND_PACKS[k].rarity });
    });
    Object.keys(MUSIC_TRACKS).forEach(function(k) {
        backgroundItems.push({ icon:MUSIC_TRACKS[k].icon, label:'МУЗЫКА', rarity:MUSIC_TRACKS[k].rarity });
    });
    Object.keys(CARDS).forEach(function(k) {
        backgroundItems.push({ icon:CARDS[k].icon, label:'КАРТА', rarity:CARDS[k].rarity });
    });

    for (var i = 0; i < 25; i++) {
        var item = backgroundItems[Math.floor(Math.random() * backgroundItems.length)];
        var el = document.createElement('div');
        el.className = 'case-reel-item ' + item.rarity;
        el.innerHTML = '<div>' + item.icon + '</div><div class="reel-label">' + item.label + '</div>';
        caseReel.appendChild(el);
    }

    var winEl = document.createElement('div');
    var winRarity = reward.data.rarity || 'common';
    winEl.className = 'case-reel-item ' + winRarity;
    if (reward.type === 'gold') {
        winEl.innerHTML = '<div style="font-size:42px;">💰</div>' +
            '<div class="reel-label" style="color:#ffd93d;font-weight:800;">+' + reward.goldAmount + '</div>';
        winEl.style.borderColor = '#ffd93d';
        winEl.style.boxShadow = '0 0 22px rgba(255,217,61,0.9)';
    } else {
        winEl.innerHTML = '<div>' + reward.icon + '</div><div class="reel-label">' + reward.label + '</div>';
    }
    caseReel.appendChild(winEl);

    for (var j = 0; j < 5; j++) {
        var item2 = backgroundItems[Math.floor(Math.random() * backgroundItems.length)];
        var el2 = document.createElement('div');
        el2.className = 'case-reel-item ' + item2.rarity;
        el2.innerHTML = '<div>' + item2.icon + '</div><div class="reel-label">' + item2.label + '</div>';
        caseReel.appendChild(el2);
    }

    caseReel.style.transition = 'none';
    caseReel.style.transform = 'translateX(0px)';
    caseModal.classList.add('open');

    setTimeout(function() {
        var itemW = 108;
        var reelWrapW = caseReel.parentElement.offsetWidth;
        var targetIndex = 25;
        var targetX = -(targetIndex * itemW) - itemW / 2 + reelWrapW / 2;
        var jitter = (Math.random() - 0.5) * 60;
        targetX += jitter;
        caseReel.style.transition = 'transform 4s cubic-bezier(0.15, 0.9, 0.3, 1)';
        caseReel.style.transform = 'translateX(' + targetX + 'px)';
    }, 50);

    setTimeout(function() {
        if (reward.type === 'gold') {
            caseResult.innerHTML = '💰 <span style="color:#ffd93d;">+' + reward.goldAmount + ' золота</span>' +
                ' <span style="font-size:0.7em;color:#8ab4ff;">(дубликат)</span>';
        } else {
            caseResult.textContent = '✦ ' + reward.data.name + ' ✦';
        }
        caseResult.classList.add('show');
        caseCloseBtn.disabled = false;
        caseCloseBtn.textContent = 'Забрать';
        playSFX('level');
    }, 4100);
}

caseCloseBtn.addEventListener('click', function() { caseModal.classList.remove('open'); });

// ==========================================================
//   УПРАВЛЕНИЕ
// ==========================================================
var keys = {};
document.addEventListener('keydown', function(e) {
    keys[e.key] = true;
    if (e.key === 'r' || e.key === 'R') {
        if (typeof reset === 'function' && !paused && !isChoosingUpgrade) reset();
    }
    if (e.key === 'Escape' || e.key === 'Esc') {
        if (isChoosingUpgrade) return;
        if (running && !gameOver) togglePause();
    }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key) !== -1) e.preventDefault();
});
document.addEventListener('keyup', function(e) { keys[e.key] = false; });

var joyZone = document.getElementById('joystick-zone');
var joyKnob = document.getElementById('joystick-knob');
var joyActive = false, joyStartX = 0, joyStartY = 0;
var joyVector = { x: 0, y: 0 };
var JOY_MAX = 50;

function joyStart(e) {
    var t = e.touches ? e.touches[0] : e;
    var rect = joyZone.getBoundingClientRect();
    joyStartX = rect.left + rect.width / 2;
    joyStartY = rect.top + rect.height / 2;
    joyActive = true;
    joyMove(e);
}
function joyMove(e) {
    if (!joyActive) return;
    if (e.cancelable) e.preventDefault();
    var t = e.touches ? e.touches[0] : e;
    var dx = t.clientX - joyStartX;
    var dy = t.clientY - joyStartY;
    var dist = Math.hypot(dx, dy);
    if (dist > JOY_MAX) { dx = dx / dist * JOY_MAX; dy = dy / dist * JOY_MAX; }
    joyKnob.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    joyVector.x = dx / JOY_MAX;
    joyVector.y = dy / JOY_MAX;
}
function joyEnd() {
    joyActive = false;
    joyKnob.style.transform = 'translate(0,0)';
    joyVector.x = 0; joyVector.y = 0;
}
joyZone.addEventListener('touchstart', joyStart, { passive: false });
joyZone.addEventListener('touchmove', joyMove, { passive: false });
joyZone.addEventListener('touchend', joyEnd);
joyZone.addEventListener('touchcancel', joyEnd);
joyZone.addEventListener('mousedown', joyStart);
window.addEventListener('mousemove', joyMove);
window.addEventListener('mouseup', joyEnd);

var btnRestart = document.getElementById('btn-restart');
if (btnRestart) {
    btnRestart.addEventListener('click', function() { if (typeof reset === 'function' && !isChoosingUpgrade) reset(); });
    btnRestart.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (typeof reset === 'function' && !isChoosingUpgrade) reset();
    });
}

// 🔧 ФИКС: оборачиваем в функцию, чтобы togglePause был уже определён
if (typeof btnPause !== 'undefined' && btnPause) {
    btnPause.addEventListener('click', function() { togglePause(); });
}
if (typeof pauseResume !== 'undefined' && pauseResume) {
    pauseResume.addEventListener('click', function() { togglePause(); });
}
pauseMenu.addEventListener('click', function() {
    if (isChoosingUpgrade) return;
    paused = false;
    running = false;
    gameOver = false;
    pauseModal.classList.remove('open');
    document.body.classList.remove('playing');
    if (typeof finishRunSilent === 'function') finishRunSilent();
    stopMusic();
    startScreen.classList.remove('hidden');
    updateMainMenuStats();
});

// 🔧 ФИКС: обработчики gameover-кнопок перенесены с защитой
if (goRestart) {
    goRestart.addEventListener('click', function() {
        gameoverModal.classList.remove('open');
        document.body.classList.add('playing');
        gameOver = false;
        paused = false;
        running = false;
        isChoosingUpgrade = false;
        _finishRunCalled = false;
        setTimeout(function() { reset(); }, 0);
    });
}

if (goMenu) {
    goMenu.addEventListener('click', function() {
        gameoverModal.classList.remove('open');
        document.body.classList.remove('playing');
        startScreen.classList.remove('hidden');
        running = false;
        gameOver = false;
        paused = false;
        isChoosingUpgrade = false;
        _finishRunCalled = false;
        stopMusic();
        updateMainMenuStats();
    });
}

if (goShare) {
    goShare.addEventListener('click', function() {
        try {
            shareResult();
        } catch (e) {
            console.error('Share error:', e);
            showToast('Ошибка при отправке', 'error');
        }
    });
}

function shareResult() {
    var mode = MODES[currentMode] || MODES.classic;
    var text = '✦ Starfall Dash 2.6 «Roguelike» ✦\n' +
        'Режим: ' + mode.icon + ' ' + mode.name + '\n' +
        'Монет: ' + (score || 0) + '\n' +
        'Уровень: ' + (level || 1) + '\n' +
        'Время: ' + formatTime(runTime || 0) + '\n' +
        'Золота: ' + (goldEarned || 0) + '\n' +
        '💎 Кристаллов: ' + (crystalsEarned || 0);

    if (currentMode === 'rogue' && runUpgrades) {
        var upgradeNames = Object.keys(runUpgrades).map(function(id) {
            return UPGRADE_POOL[id] ? UPGRADE_POOL[id].name + '×' + runUpgrades[id] : id;
        }).join(', ');
        if (upgradeNames) text += '\n🎲 Апгрейды: ' + upgradeNames;
    }

    // 🔧 ФИКС: сначала пробуем clipboard (надёжнее на ПК), потом share
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            showToast('📋 Результат скопирован!', 'success');
        }).catch(function() {
            // fallback на navigator.share
            if (navigator.share) {
                navigator.share({ title: 'Starfall Dash 2.6', text: text }).catch(function(e) {});
            } else {
                showToast('Не удалось скопировать', 'error');
            }
        });
    } else if (navigator.share) {
        navigator.share({ title: 'Starfall Dash 2.6', text: text }).catch(function(e) {});
    } else {
        showToast('Share не поддерживается', 'info');
    }
}

console.log('✓ Часть 3/4 загружена');
