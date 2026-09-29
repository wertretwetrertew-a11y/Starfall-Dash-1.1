// ==========================================================
//   STARFALL DASH 2.6 «ROGUELIKE EVOLUTION» — ЧАСТЬ 2/4
//   Константы • Миграция • Апгрейды • Реликвии • Классы
//   ⚠️ ВСЕ ФИКСЫ БАГОВ ВНЕДРЕНЫ
// ==========================================================

console.log('🚀 Starfall Dash 2.6 «Roguelike Evolution» — загрузка...');

// ===== POLYFILL roundRect =====
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

// ===== DOM =====
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var hudScoreVal = document.getElementById('hud-score-val');
var hudLevelVal = document.getElementById('hud-level-val');
var hudProgressFill = document.getElementById('hud-progress-fill');
var hudLives = document.getElementById('hud-lives');
var hudTimer = document.getElementById('hud-timer');
var hudMode = document.getElementById('hud-mode');
var hudCombo = document.getElementById('hud-combo');
var buffStrip = document.getElementById('buff-strip');
var upgradeStrip = document.getElementById('upgrade-strip');
var levelToast = document.getElementById('level-toast');
var levelToastTitle = levelToast.querySelector('.lt-title');
var levelToastReward = levelToast.querySelector('.lt-reward');
var levelToastMult = levelToast.querySelector('.lt-mult');

var loginScreen = document.getElementById('login-screen');
var profilesList = document.getElementById('profiles-list');
var createProfileModal = document.getElementById('create-profile-modal');
var cpNick = document.getElementById('cp-nick');
var cpPasswordToggle = document.getElementById('cp-password-toggle');
var cpCheckbox = document.getElementById('cp-checkbox');
var cpPasswordField = document.getElementById('cp-password-field');
var cpPassword = document.getElementById('cp-password');
var cpCancel = document.getElementById('cp-cancel');
var cpCreate = document.getElementById('cp-create');
var cpError = document.getElementById('cp-error');

var passwordModal = document.getElementById('password-modal');
var pwNick = document.getElementById('pw-nick');
var pwInput = document.getElementById('pw-input');
var pwCancel = document.getElementById('pw-cancel');
var pwLogin = document.getElementById('pw-login');
var pwError = document.getElementById('pw-error');

var startScreen = document.getElementById('start-screen');
var modeScreen = document.getElementById('mode-screen');
var modeBack = document.getElementById('mode-back');
var classScreen = document.getElementById('class-screen');
var classBack = document.getElementById('class-back');
var classGrid = document.getElementById('class-grid');
var coreScreen = document.getElementById('core-screen');
var coreBack = document.getElementById('core-back');
var coreGrid = document.getElementById('core-grid');
var coreGold = document.getElementById('core-gold');
var coreCrystals = document.getElementById('core-crystals');
var coreShards = document.getElementById('core-shards');
var coreBadge = document.getElementById('core-badge');
var tileCore = document.getElementById('tile-core');
var profileBadge = document.getElementById('profile-badge');
var pbNick = document.getElementById('pb-nick');
var slBest = document.getElementById('sl-best');
var slTime = document.getElementById('sl-time');
var slBank = document.getElementById('sl-bank');
var slCrystals = document.getElementById('sl-crystals');
var slShards = document.getElementById('sl-shards');
var slLvl = document.getElementById('sl-lvl');
var tilePlay = document.getElementById('tile-play');
var tileShop = document.getElementById('tile-shop');
var tileAch = document.getElementById('tile-ach');
var tileDaily = document.getElementById('tile-daily');
var tileQuick = document.getElementById('tile-quick');
var btnSettings = document.getElementById('btn-settings');
var btnHelp = document.getElementById('btn-help');
var btnPause = document.getElementById('btn-pause');

var settingsModal = document.getElementById('settings-modal');
var settingsClose = document.getElementById('settings-close');
var toggleLevelToastBtn = document.getElementById('toggle-leveltoast');
var toggleWeatherBtn = document.getElementById('toggle-weather');
var helpModal = document.getElementById('help-modal');
var helpClose = document.getElementById('help-close');
var profileMenuModal = document.getElementById('profile-menu-modal');
var pmNick = document.getElementById('pm-nick');
var pmBest = document.getElementById('pm-best');
var pmTime = document.getElementById('pm-time');
var pmBank = document.getElementById('pm-bank');
var pmCrystals = document.getElementById('pm-crystals');
var pmShards = document.getElementById('pm-shards');
var pmCore = document.getElementById('pm-core');
var pmLvl = document.getElementById('pm-lvl');
var pmGames = document.getElementById('pm-games');
var pmBosses = document.getElementById('pm-bosses');
var pmRogue = document.getElementById('pm-rogue');
var pmTotaltime = document.getElementById('pm-totaltime');
var pmSwitch = document.getElementById('pm-switch');
var pmClose = document.getElementById('pm-close');

var shopModal = document.getElementById('shop-modal');
var shopClose = document.getElementById('shop-close');
var shopGrid = document.getElementById('shop-grid');
var shopBankVal = document.getElementById('shop-bank-val');

var caseModal = document.getElementById('case-modal');
var caseWindow = document.getElementById('case-window');
var caseTitle = document.getElementById('case-title');
var caseReel = document.getElementById('case-reel');
var caseResult = document.getElementById('case-result');
var caseCloseBtn = document.getElementById('case-close-btn');
var dailyModal = document.getElementById('daily-modal');
var dailyGrid = document.getElementById('daily-grid');
var dailyClaimBtn = document.getElementById('daily-claim-btn');

var achPopup = document.getElementById('achievement-popup');
var apIcon = document.getElementById('ap-icon');
var apName = document.getElementById('ap-name');
var apReward = document.getElementById('ap-reward');

var pauseModal = document.getElementById('pause-modal');
var pauseMode = document.getElementById('pause-mode');
var pauseScore = document.getElementById('pause-score');
var pauseLevel = document.getElementById('pause-level');
var pauseTime = document.getElementById('pause-time');
var pauseResume = document.getElementById('pause-resume');
var pauseMenu = document.getElementById('pause-menu');

var gameoverModal = document.getElementById('gameover-modal');
var goTitle = document.getElementById('go-title');
var goScore = document.getElementById('go-score');
var goScoreLabel = document.getElementById('go-score-label');
var goLevel = document.getElementById('go-level');
var goTime = document.getElementById('go-time');
var goGold = document.getElementById('go-gold');
var goCrystals = document.getElementById('go-crystals');
var goRecord = document.getElementById('go-record');
var goBest = document.getElementById('go-best');
var goBuild = document.getElementById('go-build');
var goRestart = document.getElementById('go-restart');
var goMenu = document.getElementById('go-menu');
var goShare = document.getElementById('go-share');

var upgradeModal = document.getElementById('upgrade-modal');
var upgradeTitle = document.getElementById('upgrade-title');
var upgradeCardsEl = document.getElementById('upgrade-cards');
var upgradeRerollBtn = document.getElementById('upgrade-reroll');

var waveModal = document.getElementById('wave-modal');
var waveBanner = document.getElementById('wave-banner');
var waveIcon = document.getElementById('wave-icon');
var waveName = document.getElementById('wave-name');
var waveDesc = document.getElementById('wave-desc');
var waveStartBtn = document.getElementById('wave-start');

var relicModal = document.getElementById('relic-modal');
var relicCardsEl = document.getElementById('relic-cards');

var toastEl = document.getElementById('toast');

var currentShopTab = 'skins';
var currentProfile = null;
var pendingProfile = null;
var currentMode = 'classic';
var selectedClass = 'scout';

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
        showLevelToast: true, showWeather: true,
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

function getSave() {
    if (currentProfile && currentProfile.data) {
        currentProfile.data = migrateSave(currentProfile.data);
        return currentProfile.data;
    }
    return makeDefaultSave();
}

function persist() {
    if (!currentProfile) return;
    try { saveProfile(currentProfile.login, currentProfile); }
    catch (e) { console.warn('persist error:', e); }
}

function getTodayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
}

function getYesterdayStr() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
}

function formatTime(seconds) {
    seconds = Math.floor(seconds);
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
}

function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n;
}

function getCoreStatPrice(statId) {
    var stat = CORE_STATS[statId];
    var s = getSave();
    var lvl = s.coreStats[statId] || 0;
    // 🔧 ФИКС: для vitality цена растёт быстрее
    var multiplier = (statId === 'vitality') ? 2.5 : 1.5;
    return Math.floor(stat.basePrice * Math.pow(multiplier, lvl));
}

function getCoreStatCrystalPrice(statId) {
    var s = getSave();
    var lvl = s.coreStats[statId] || 0;
    // 🔧 ФИКС: для vitality кристаллы дороже
    var multiplier = (statId === 'vitality') ? 3 : 1.5;
    var base = (statId === 'vitality') ? 5 : 1;
    return Math.max(base, Math.floor(base * Math.pow(multiplier, lvl)));
}

function getCoreStatLevel(statId) {
    var s = getSave();
    return s.coreStats[statId] || 0;
}

function getCoreBonus(statId) {
    var stat = CORE_STATS[statId];
    var lvl = getCoreStatLevel(statId);
    return stat.effect(lvl);
}

function getCoreTotalLevel() {
    var s = getSave();
    var total = 0;
    Object.keys(CORE_STATS).forEach(function(id) {
        total += s.coreStats[id] || 0;
    });
    return total;
}

function getCoreMaxLevel() {
    var s = getSave();
    var maxLvl = 0;
    Object.keys(CORE_STATS).forEach(function(id) {
        var lvl = s.coreStats[id] || 0;
        if (lvl > maxLvl) maxLvl = lvl;
    });
    return maxLvl;
}

function isClassUnlocked(classId) {
    var s = getSave();
    if (!s.unlockedClasses) s.unlockedClasses = ['scout'];
    var cls = CHARACTER_CLASSES[classId];
    if (!cls) return false;
    if (cls.unlocked) return true;
    if (s.unlockedClasses.indexOf(classId) !== -1) return true;
    if (cls.unlockAchievement) {
        var ach = ACHIEVEMENTS[cls.unlockAchievement];
        if (ach) {
            var progress = getAchievementProgress(ach);
            if (progress >= ach.target) {
                if (s.unlockedClasses.indexOf(classId) === -1) {
                    s.unlockedClasses.push(classId);
                    persist();
                }
                return true;
            }
        }
    }
    return false;
}

function getClass(id) {
    return CHARACTER_CLASSES[id] || CHARACTER_CLASSES.scout;
}

function getUpgradeStacks(upgradeId) {
    if (!runUpgrades) return 0;
    return runUpgrades[upgradeId] || 0;
}

function canPickUpgrade(upgradeId) {
    var up = UPGRADE_POOL[upgradeId];
    if (!up) return false;
    if (!up.stacks) return getUpgradeStacks(upgradeId) === 0;
    var maxStacks = up.maxStacks || 99;
    return getUpgradeStacks(upgradeId) < maxStacks;
}

function pickRandomUpgrades(count, exclude) {
    exclude = exclude || [];
    var available = [];
    Object.keys(UPGRADE_POOL).forEach(function(id) {
        if (exclude.indexOf(id) !== -1) return;
        if (!canPickUpgrade(id)) return;
        available.push(id);
    });
    var rarityWeights = { common: 60, rare: 25, epic: 12, legendary: 2.5, mythic: 0.5 };
    var weighted = [];
    available.forEach(function(id) {
        var w = rarityWeights[UPGRADE_POOL[id].rarity] || 10;
        for (var i = 0; i < Math.ceil(w); i++) weighted.push(id);
    });
    var picks = [];
    var used = [];
    for (var c = 0; c < count && weighted.length > 0; c++) {
        var attempts = 0;
        var pick = null;
        while (attempts < 20) {
            var idx = Math.floor(Math.random() * weighted.length);
            pick = weighted[idx];
            if (used.indexOf(pick) === -1) break;
            attempts++;
        }
        if (pick && used.indexOf(pick) === -1) {
            picks.push(pick);
            used.push(pick);
        }
    }
    return picks;
}

function pickRandomRelics(count, exclude) {
    exclude = exclude || [];
    var available = [];
    Object.keys(RELICS).forEach(function(id) {
        if (exclude.indexOf(id) !== -1) return;
        if (runRelics && runRelics.indexOf(id) !== -1) return;
        available.push(id);
    });
    var picks = [];
    for (var c = 0; c < count && available.length > 0; c++) {
        var idx = Math.floor(Math.random() * available.length);
        picks.push(available[idx]);
        available.splice(idx, 1);
    }
    return picks;
}

// ==========================================================
//   ЗАГЛУШКИ ПЕРЕМЕННЫХ — С ВСЕМИ ФИКСАМИ
// ==========================================================
var running = false, paused = false, gameOver = false;
var score = 0, goldEarned = 0, crystalsEarned = 0, lives = 4;
var frame = 0, level = 1;
var levelTimer = 15 * 60, LEVEL_DURATION = 15 * 60;
var runTime = 0, runStartTime = 0;
var timeLeft = 0;
var combo = 0, comboTimer = 0, comboMax = 0, COMBO_WINDOW = 120;
var screenShake = 0, damageFlash = 0;
var buff = { magnet:0, freeze:0, speedBoost:0, x2gold:0, phantom:0, chest:0 };
var runBoosts = { x2gold:false, shield:false, magnetRun:false, comboRun:false };
var levelStats = { coinsThisLevel: 0, livesLostThisLevel: 0, levelStartTime: 0 };
var coins = [], enemies = [], enemyBullets = [], webs = [];
var particles = [], floatingTexts = [], drops = [], bosses = [];
var meteors = [], parallaxStars = [];
var weatherParticles = [], weatherType = 'stars';
var gradCache = { coinSmall:null, coinBig:null };
var newTimeRecord = false;
var lastErrorShown = '';

// 🎲 ROGUELIKE
var runUpgrades = {};
var runRelics = [];
var runSynergies = {};           // 🔧 ФИКС: объявлено явно
var playerDamage = 0;
var playerShields = 0;
var maxShields = 0;
var shieldRegenTimer = 0;
var critChance = 0;
var dodgeChance = 0;
var thornsDamage = 0;
var regenTimer = 0;
var vampiresHeal = 0;
var orbitals = [];
var currentWaveModifier = null;
var currentWaveLevel = 0;
var noHitWaveActive = false;
var noHitWaveDamage = 0;
var extraUpgradeChoice = false;
var comboGraceTimer = 0;
var revivesLeft = 0;
var chaosOrbTimer = 0;
var berserkerMask = false;
var explosiveCoins = false;
var pierceCount = 0;
var chainLightning = 0;
var enemySlowMult = 1;
var hpPenalty = 0;

var pendingUpgradeChoices = [];
var pendingRelicChoices = [];
var pendingUpgradeAfterWave = false;  // 🔧 ФИКС: флаг для элитной волны
var rerollCost = 50;
var isChoosingUpgrade = false;
var _finishRunCalled = false;  // 🔧 ФИКС: защита от двойного вызова finishRun

var coreBonusCache = {
    vitality: 0, speed: 1, magnet: 0, greed: 1, combo: 0, luck: 0
};

(function initParallaxStars() {
    for (var layer = 0; layer < 3; layer++) {
        var count = 15 - layer * 3;
        for (var i = 0; i < count; i++) {
            parallaxStars.push({
                x: Math.random() * 600, y: Math.random() * 400,
                size: 0.6 + layer * 0.5,
                speed: 0.08 + layer * 0.15,
                layer: layer, twinkle: Math.random() * Math.PI * 2
            });
        }
    }
})();

console.log('✓ Часть 2/4 загружена');
