// ==========================================================
//   STARFALL DASH — CORE / PROGRESSION SYSTEM
//   Ядро • классы • выбор улучшений • реликвии
//   ⚠️ Глобальный API сохранён для совместимости.
// ==========================================================

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

