// ==========================================================
// STARFALL DASH — GAMEPLAY MODULE
// Extracted from legacy gameplay.js; global API intentionally preserved.
// ==========================================================

//   УРОВЕНЬ
// ==========================================================
function levelUp() {
    var s = getSave();
    var mode = MODES[currentMode];

    var baseGold = 15 + level * 5;
    var bonusHP = (levelStats.livesLostThisLevel === 0) ? 10 : 0;
    var bonusCoins = (levelStats.coinsThisLevel >= 10) ? 15 : 0;
    var bonusSpeed = 0;
    var levelTime = (performance.now() - levelStats.levelStartTime) / 1000;
    if (levelTime < 12) bonusSpeed = Math.floor(baseGold * 0.5);

    var rogueGoldMult = 1;
    if (mode.isRoguelike && runUpgrades.greed) rogueGoldMult = Math.pow(1.2, runUpgrades.greed);

    var totalGold = Math.floor((baseGold + bonusHP + bonusCoins + bonusSpeed) *
        mode.goldMultiplier * coreBonusCache.greed * rogueGoldMult);
    s.bank += totalGold;
    goldEarned += totalGold;
    persist();

    levelStats = { coinsThisLevel: 0, livesLostThisLevel: 0, levelStartTime: performance.now() };
    level++;
    var mult = getCoinMultiplier();

    var bonusText = [];
    if (bonusHP > 0) bonusText.push('+' + bonusHP + ' за HP');
    if (bonusCoins > 0) bonusText.push('+' + bonusCoins + ' за монеты');
    if (bonusSpeed > 0) bonusText.push('+' + bonusSpeed + ' за скорость');
    var bonusStr = bonusText.length > 0 ? ' (' + bonusText.join(', ') + ')' : '';

    showLevelToast(level, totalGold, bonusStr, mult);
    addParticles(canvas.width / 2, canvas.height / 2, '#9c6bff', 20, 10);
    playSFX('level');
    updateHUD();

    if (level % 3 === 0) {
        var caseType = 'common';
        if (level >= 15) caseType = 'mythic';
        else if (level >= 12) caseType = 'legendary';
        else if (level >= 9) caseType = 'epic';
        else if (level >= 6) caseType = 'rare';
        s.freeCases[caseType] = (s.freeCases[caseType] || 0) + 1;
        persist();
        // Кейсы выдаются в инвентарь без всплывающего уведомления поверх игрового поля.
    }

    // 🎲 ROGUELIKE
       if (mode.isRoguelike) {
        if (level % 5 === 0 && level > 1) {
            pendingUpgradeAfterWave = true;
            startEliteWave();
        } else {
            showUpgradeChoice();
        }
    }

    checkAchievements();
}

function rogueLegacyPlayerTakeDamage() {
    if (dodgeChance > 0 && Math.random() < dodgeChance) {
        addFloatingText(player.x + player.size/2, player.y - 10, 'MISS', '#7cffb2', 22);
        return;
    }
    if (playerShields > 0) {
        playerShields--;
        addParticles(player.x + player.size/2, player.y + player.size/2, '#4fc3f7', 15, 10);
        addFloatingText(player.x + player.size/2, player.y - 10, '🛡', '#4fc3f7', 24);
        playSFX('hit');
        return;
    }

    lives--;
    levelStats.livesLostThisLevel++;
    player.damageFlash = 18;
    damageFlash = 1;
    addParticles(player.x + player.size/2, player.y + player.size/2, '#ff5c7a', 12, 8);
    addFloatingText(player.x + player.size/2, player.y - 20, '-1', '#ff5c7a', 24);
    screenShake = 14;
    playSFX('hit');
    resetCombo();

    if (currentMode === 'rogue') {
        noHitWaveDamage++;
    }

    if (lives <= 0) {
        if (revivesLeft > 0 && currentMode !== 'survival') {
            revivesLeft--;
            lives = 2;
            buff.phantom = 3 * 60;
            updateBuffBadges();
            showToast('🔥 ВОЗРОЖДЕНИЕ!', 'legendary');
            addParticles(player.x + player.size/2, player.y + player.size/2, '#ffd93d', 40, 20);
            screenShake = 30;
            return;
        }
        // Смерть должна немедленно остановить игровой тик: иначе текущий update
        // может продолжить обрабатывать врагов/снаряды уже после gameOver.
        gameOver = true;
        running = false;
        resetFrameClock();
        if (bossState === 'duel' || bossState === 'intro') {
            bossState = 'lost';
            bossStateTimer = 45;
            bossAnnouncement = '☠ DUEL LOST';
            bossAnnouncementTimer = 45;
            updateBossDuelHUD();
            setTimeout(function() { finishRun(); }, 650);
            return;
        }
        finishRun();
    }
}

function clearBossDuelPresentation() {
    bossState = 'none';
    bossStateTimer = 0;
    bossAnnouncement = '';
    bossAnnouncementTimer = 0;
    bossDuelId = null;
    bosses = [];
    // Boss cleanup must also remove every duel-only visual/effect so a
    // defeated boss can never leak into the next stage or main menu.
    if (typeof rogueEnemyHazards !== 'undefined') rogueEnemyHazards.length = 0;
    if (typeof rogueCoreFragments !== 'undefined') rogueCoreFragments.length = 0;
    updateBossDuelHUD();
}

function updateBossDuelHUD() {
    var overlay = document.getElementById('boss-duel-overlay');
    var banner = document.getElementById('boss-duel-banner');
    var name = document.getElementById('boss-duel-name');
    var hp = document.getElementById('boss-duel-hp-fill');
    var hpText = document.getElementById('boss-duel-hp-text');
    if (!overlay || !banner || !name || !hp || !hpText) return;

    var boss = bosses.length ? bosses[0] : null;
    var active = bossState !== 'none';
    overlay.classList.toggle('active', active);
    overlay.classList.toggle('duel', bossState === 'duel');
    overlay.classList.toggle('victory', bossState === 'victory');
    overlay.classList.toggle('lost', bossState === 'lost');

    if (boss) {
        name.textContent = (boss.type.icon || '☠') + ' ' + (boss.type.name || 'БОСС');
        var pct = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
        hp.style.width = (pct * 100) + '%';
        hpText.textContent = Math.ceil(Math.max(0, boss.hp)) + ' / ' + boss.maxHp;
    } else {
        name.textContent = bossDuelId && BOSS_TYPES[bossDuelId] ? (BOSS_TYPES[bossDuelId].icon + ' ' + BOSS_TYPES[bossDuelId].name) : 'БОСС';
        hp.style.width = bossState === 'victory' ? '0%' : '100%';
        hpText.textContent = bossState === 'victory' ? '0 / 0' : '';
    }

    var bossIsVulnerable = boss && bossState === 'duel' && boss.vulnerableTimer > 0;
    banner.textContent = bossIsVulnerable ? '⚡ ОКНО УРОНА — АТАКУЙ' : (bossAnnouncement || (bossState === 'duel' ? '⚔ ДУЭЛЬ 1 × 1' : ''));
    banner.classList.toggle('show', bossIsVulnerable || (bossAnnouncementTimer > 0 && !!bossAnnouncement));
}

// ==========================================================