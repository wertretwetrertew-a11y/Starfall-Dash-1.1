// ==========================================================
//   STARFALL DASH — SAVE SYSTEM
//   Профили • localStorage • миграция • сохранение
//   ⚠️ Сохраняем глобальный API для совместимости со старым кодом.
// ==========================================================

// ===== ХРАНИЛИЩЕ =====
var storage = (function() {
    var mem = {};
    var canUseLS = false;
    try {
        localStorage.setItem('__test__', '1');
        localStorage.removeItem('__test__');
        canUseLS = true;
        console.log('✓ localStorage доступен');
    } catch (e) {
        canUseLS = false;
        console.warn('⚠ localStorage заблокирован');
    }
    return {
        get: function(k) {
            if (canUseLS) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } }
            return mem[k] || null;
        },
        set: function(k, v) {
            if (canUseLS) { try { localStorage.setItem(k, v); return; } catch (e) { mem[k] = v; } }
            else { mem[k] = v; }
        },
        remove: function(k) {
            if (canUseLS) { try { localStorage.removeItem(k); return; } catch (e) { delete mem[k]; } }
            else { delete mem[k]; }
        }
    };
})();

var PROFILES_KEY = 'sfd_profiles_v1';
var CURRENT_KEY = 'sfd_current_v1';
var PROFILE_PREFIX = 'sfd_profile_v1_';

function simpleHash(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return 'h' + Math.abs(hash).toString(36);
}

function getProfiles() {
    try {
        var raw = storage.get(PROFILES_KEY);
        if (raw) return JSON.parse(raw);
        return [];
    } catch (e) { return []; }
}

function saveProfiles(list) { storage.set(PROFILES_KEY, JSON.stringify(list)); }
function getCurrentLogin() { return storage.get(CURRENT_KEY); }
function setCurrentLogin(login) { storage.set(CURRENT_KEY, login); }

function loadProfile(login) {
    try {
        var raw = storage.get(PROFILE_PREFIX + login);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) { return null; }
}

function saveProfile(login, profileData) { storage.set(PROFILE_PREFIX + login, JSON.stringify(profileData)); }
function deleteProfileData(login) { storage.remove(PROFILE_PREFIX + login); }

function makeDefaultSave() {
    return {
        bestCoins: 0, bank: 0, gamesPlayed: 0, bestLevel: 1,
        bestTime: 0, totalTime: 0,
        ownedSkins: ['default'], equippedSkin: 'default',
        ownedItems: [],
        ownedThemes: ['cosmos'], equippedTheme: 'cosmos',
        boosts: { x2gold:0, shieldRun:0, startCoins:0, magnetRun:0, comboRun:0 },
        startLives: 4, magnetRadius: 0, playerSpeedBonus: 1, gameSpeed: 1, comboBonus: false,
        ownedSoundPacks: ['classic'], equippedSoundPack: 'classic',
        ownedMusic: ['default'], equippedMusic: 'default',
        ownedCards: [],
        openedCases: 0, totalRefund: 0, totalCoins: 0,
        freeCases: { common:0, rare:0, epic:0, legendary:0, mythic:0 },
        claimedAchievements: [],
        dailyStreak: 0, lastDailyClaim: null, dailyHistory: [],
        showLevelToast: true, showWeather: true, joystickSide: 'left',
        modeBests: {
            rogue: { coins: 0, time: 0 },
            classic: { coins: 0, time: 0 },
            survival: { coins: 0, time: 0 },
            timeattack: { coins: 0, time: 0 },
            hardcore: { coins: 0, time: 0 }
        },
        modesPlayed: [],
        bossesKilled: 0, totalKills: 0,
        coreCrystals: 0,
        coreStats: { vitality:0, speed:0, magnet:0, greed:0, combo:0, luck:0 },
        starShards: 0,
        unlockedUpgrades: [], unlockedRelics: [], unlockedClasses: ['scout'],
        rogueStats: {
            totalUpgradesPicked: 0, maxUpgradesInRun: 0,
            synergiesActivated: 0, maxRelicsInRun: 0,
            bestLevel: 0, runsPlayed: 0
        },
        rogueProgress: { planetIndex: 0, stageIndex: 0, bossUnlocked: false },
        lastMode: 'rogue',
        lastDailyCrystals: null
    };
}

function migrateSave(d) {
    var changed = false;
    var defaults = makeDefaultSave();

    Object.keys(defaults).forEach(function(key) {
        if (typeof d[key] === 'undefined') {
            d[key] = defaults[key];
            changed = true;
        }
    });

    if (!d.coreStats) {
        d.coreStats = { vitality:0, speed:0, magnet:0, greed:0, combo:0, luck:0 };
        changed = true;
    }
    Object.keys(CORE_STATS).forEach(function(k) {
        if (typeof d.coreStats[k] !== 'number') {
            d.coreStats[k] = 0;
            changed = true;
        }
    });

    if (typeof d.coreCrystals !== 'number') { d.coreCrystals = 0; changed = true; }
    if (typeof d.starShards !== 'number') { d.starShards = 0; changed = true; }

    if (!d.modeBests) { d.modeBests = {}; changed = true; }
    Object.keys(MODES).forEach(function(m) {
        if (!d.modeBests[m]) {
            d.modeBests[m] = { coins: 0, time: 0 };
            changed = true;
        }
    });

    if (!d.modesPlayed) { d.modesPlayed = []; changed = true; }
    if (!d.boosts) { d.boosts = { x2gold:0, shieldRun:0, startCoins:0, magnetRun:0, comboRun:0 }; changed = true; }
    if (!d.freeCases) { d.freeCases = { common:0, rare:0, epic:0, legendary:0, mythic:0 }; changed = true; }

    if (!d.rogueStats) {
        d.rogueStats = {
            totalUpgradesPicked: 0, maxUpgradesInRun: 0,
            synergiesActivated: 0, maxRelicsInRun: 0,
            bestLevel: 0, runsPlayed: 0
        };
        changed = true;
    }
    if (!d.unlockedUpgrades) { d.unlockedUpgrades = []; changed = true; }
    if (!d.unlockedRelics) { d.unlockedRelics = []; changed = true; }
    if (!d.unlockedClasses) { d.unlockedClasses = ['scout']; changed = true; }

    Object.keys(CHARACTER_CLASSES).forEach(function(cid) {
        var cls = CHARACTER_CLASSES[cid];
        if (cls.unlocked && d.unlockedClasses.indexOf(cid) === -1) {
            d.unlockedClasses.push(cid);
            changed = true;
        }
    });

    if (changed) console.log('✓ Сейв мигрирован на 2.6');
    return d;
}

// Runtime reads are intentionally cheap: schema migration is performed when a
// profile is loaded/entered, not on every game-loop read.
function getSave() {
    if (currentProfile && currentProfile.data) {
        return currentProfile.data;
    }
    return makeDefaultSave();
}

function persist() {
    if (!currentProfile) return;
    try { saveProfile(currentProfile.login, currentProfile); }
    catch (e) { console.warn('persist error:', e); }
}

