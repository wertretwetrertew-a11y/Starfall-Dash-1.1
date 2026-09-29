// ==========================================================
// STARFALL DASH — GAMEPLAY MODULE
// Extracted from legacy gameplay.js; global API intentionally preserved.
// ==========================================================

//   RESET
// ==========================================================
function reset() {
    console.log('→ reset() вызван. Режим:', currentMode);

    // Reset can be triggered from menus as well as from game-over.
    // Clear the duel presentation immediately instead of waiting for finishRun().
    if (typeof clearBossDuelPresentation === 'function') {
        clearBossDuelPresentation();
    }

    try {
        gameoverModal.classList.remove('open');
        pauseModal.classList.remove('open');
        upgradeModal.classList.remove('open');
        waveModal.classList.remove('open');
        relicModal.classList.remove('open');
        modeScreen.classList.add('hidden');
        classScreen.classList.add('hidden');
        startScreen.classList.add('hidden');
        coreScreen.classList.add('hidden');
        shopModal.classList.remove('open');
        caseModal.classList.remove('open');
        profileMenuModal.classList.remove('open');
        settingsModal.classList.remove('open');
        helpModal.classList.remove('open');
        loginScreen.classList.add('hidden');
    } catch (e) { console.warn('reset: modal close err', e); }

    paused = false;
    gameOver = false;
    running = false;
    isChoosingUpgrade = false;
    frame = 0;
    levelTimer = 0;
    screenShake = 0;
    damageFlash = 0;
    _finishRunCalled = false;  // 🔧 ФИКС: сбрасываем флаг завершения
    resetFrameClock();  // 🔧 ФИКС

    if (!currentProfile) {
        console.error('❌ currentProfile = null');
        loginScreen.classList.remove('hidden');
        startScreen.classList.add('hidden');
        return;
    }

    var s, mode;
    try {
        s = getSave();
        mode = MODES[currentMode];
        if (!mode) { currentMode = 'classic'; mode = MODES.classic; }
    } catch (e) { console.error('❌ reset err', e); return; }

    // Core-кэш
    coreBonusCache.vitality = getCoreStatLevel('vitality');
    coreBonusCache.speed = getCoreBonus('speed');
    coreBonusCache.magnet = getCoreBonus('magnet');
    coreBonusCache.greed = getCoreBonus('greed');
    coreBonusCache.combo = getCoreBonus('combo');
    coreBonusCache.luck = getCoreBonus('luck');
    COMBO_WINDOW = 120 + coreBonusCache.combo;

    // Сброс игровых
    score = 0; goldEarned = 0; crystalsEarned = 0;
    lives = Math.max(s.startLives || 4, mode.startLives);
    if (mode.id === 'survival') lives = 1;

    var cls = getClass(selectedClass);
    if (mode.isRoguelike) {
        lives = cls.startHp;
        playerDamage = 0;
        critChance = cls.critChance || 0;
        if (cls.passiveId === 'crit') critChance = 0.2;
    } else {
        lives += coreBonusCache.vitality;
        playerDamage = 0;
        critChance = 0;
    }

    // Survival всегда начинается и остаётся с одной жизнью.
    if (mode.id === 'survival') lives = 1;

    level = 1;
    LEVEL_DURATION = mode.levelDuration;
    levelTimer = LEVEL_DURATION;
    coins = []; enemies = []; enemyBullets = []; webs = [];
    particles = []; floatingTexts = []; drops = []; bosses = [];
    meteors = [];
    buff = { magnet:0, freeze:0, speedBoost:0, x2gold:0, phantom:0, chest:0 };
    runBoosts = { x2gold:false, shield:false, magnetRun:false, comboRun:false };
    levelStats = { coinsThisLevel: 0, livesLostThisLevel: 0, levelStartTime: performance.now() };
    runStartTime = performance.now();
    runTime = 0;
    newTimeRecord = false;
    timeLeft = mode.timeLimit || 0;
    combo = 0;
    comboTimer = 0;
    comboMax = 0;
    if (hudCombo) hudCombo.classList.remove('show');

    // 🎲 Сброс рогалик-состояния
    runUpgrades = {};
    runRelics = [];
    runSynergies = {};
    playerDamage = 0;
    playerShields = 0;
    maxShields = 0;
    shieldRegenTimer = 0;
    critChance = 0;
    dodgeChance = 0;
    thornsDamage = 0;
    regenTimer = 0;
    vampiresHeal = 0;
    orbitals = [];
    currentWaveModifier = null;
    currentWaveLevel = 0;
    bossState = 'none';
    bossStateTimer = 0;
    bossAnnouncement = '';
    bossAnnouncementTimer = 0;
    bossDuelId = null;
    noHitWaveActive = false;
    noHitWaveDamage = 0;
    extraUpgradeChoice = false;
    comboGraceTimer = 0;
    revivesLeft = 0;
    chaosOrbTimer = 0;
    berserkerMask = false;
    titanMarkContacts = 0;
    bloodFangActive = false;
    explosiveCoins = false;
    pierceCount = 0;
    chainLightning = 0;
    enemySlowMult = 1;
    hpPenalty = 0;
    rerollCost = 50;
    pendingUpgradeChoices = [];
    pendingRelicChoices = [];
    pendingUpgradeAfterWave = false; 

    // Классовые бонусы
    if (mode.isRoguelike) {
        if (cls.passiveId === 'double_damage') playerDamage += 1;
        if (cls.magnet) buff.magnet = Math.max(buff.magnet, 5 * 60);
    }

    // Бусты
    if (s.boosts) {
        if (s.boosts.x2gold > 0) { s.boosts.x2gold--; runBoosts.x2gold = true; }
        if (s.boosts.shieldRun > 0) { s.boosts.shieldRun--; if (currentMode !== 'survival') lives += 1; runBoosts.shield = true; }
        if (s.boosts.startCoins > 0) { s.boosts.startCoins--; score = 10; goldEarned = 10; s.bank += 10; }
        if (s.boosts.magnetRun > 0) { s.boosts.magnetRun--; buff.magnet = 30 * 60; runBoosts.magnetRun = true; }
        if (s.boosts.comboRun > 0) { s.boosts.comboRun--; combo = 2; comboTimer = COMBO_WINDOW; runBoosts.comboRun = true; }
    }
    if (coreBonusCache.magnet > 0 && !mode.isRoguelike) buff.magnet = 5 * 60;

    persist();

    player.x = canvas.width / 2 - player.size / 2;
    player.y = canvas.height - 60;
    player.frozen = 0;
    player.inWeb = false;
    player.breath = 0;
    player.tilt = 0;
    player.lastDirX = 0;
    player.lastDirY = 1;
    player.damageFlash = 0;
    player.blinkTimer = 0;
    player.isBlinking = false;

    if (mode.isRoguelike) {
        s.rogueStats.runsPlayed = (s.rogueStats.runsPlayed || 0) + 1;
        persist();
    }

    updateHUD();
    updateBuffBadges();
    updateUpgradeStrip();
    initWeather();
    document.body.classList.add('playing');

    running = true;
    console.log('✓ Игра запущена:', mode.name);
    initAudio();
    startMusic();
}

function finishRunSilent() {
    var s = getSave();
    runTime = Math.floor((performance.now() - runStartTime) / 1000);
    s.totalTime = (s.totalTime || 0) + runTime;
}

// ==========================================================