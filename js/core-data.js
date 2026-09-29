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


var currentShopTab = 'skins';
var currentProfile = null;
var pendingProfile = null;
var currentMode = 'classic';
var selectedClass = 'scout';

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
