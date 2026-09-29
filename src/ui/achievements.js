// ==========================================================
// STARFALL DASH — UI MODULE
// Extracted from legacy meta-ui.js; global API intentionally preserved.
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