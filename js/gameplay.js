// ==========================================================
//   STARFALL DASH 2.6 — ЧАСТЬ 4/4
//   update • draw • reset • Апгрейды • Реликвии • Волны
//   ⚠️ ВСЕ ФИКСЫ БАГОВ ВНЕДРЕНЫ
// ==========================================================

// Явно получаем элемент итогового экрана. Не полагаемся на legacy-глобал
// от id="go-build": он не гарантирован во всех браузерах/режимах запуска.
var goBuild = document.getElementById('go-build');

// ===== ИГРОК =====
var player = {
    x: 285, y: 340, size: 30, speed: 7, frozen: 0, inWeb: false,
    breath: 0, tilt: 0, lastDirX: 0, lastDirY: 1,
    damageFlash: 0, blinkTimer: 0, isBlinking: false
};

// ==========================================================
//   КРИТИЧНЫЙ ФИКС: СБРОС НАКОПЛЕННОГО ВРЕМЕНИ
//   Предотвращает "ускорение" и "фарм монет" после модалок
// ==========================================================
var lastTime = performance.now();
var frameBudget = 1000 / 60;
var accumulated = 0;

function resetFrameClock() {
    accumulated = 0;
    lastTime = performance.now();
}

// ===== УТИЛИТЫ =====
function getCoinMultiplier() {
    var base;
    if (level <= 5) base = level + 1;
    else base = Math.floor(6 + (level - 5) * 2);
    var modeM = MODES[currentMode].goldMultiplier;
    var greedBonus = coreBonusCache.greed;
    var rogueMult = 1;
    if (currentMode === 'rogue') {
        rogueMult = runUpgrades.greed ? Math.pow(1.2, runUpgrades.greed) : 1;
    }
    return Math.floor(base * modeM * greedBonus * rogueMult);
}

function rectsCollide(a, b) {
    return a.x < b.x + b.size && a.x + a.size > b.x &&
           a.y < b.y + b.size && a.y + a.size > b.y;
}

function addParticles(x, y, color, count, spread) {
    count = count || 12;
    spread = spread || 6;
    if (particles.length > 200) count = Math.min(count, 4);
    for (var i = 0; i < count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * spread,
            vy: (Math.random() - 0.5) * spread,
            life: 1, color: color,
            size: 2 + Math.random() * 4,
            gravity: Math.random() * 0.1
        });
    }
}

function addFloatingText(x, y, text, color, size) {
    size = size || 20;
    if (floatingTexts.length > 30) return;
    floatingTexts.push({ x: x, y: y, text: text, color: color, life: 1, vy: -1.5, size: size });
}

// ===== КОМБО =====
function addCombo() {
    combo++;
    if (combo > comboMax) comboMax = combo;
    comboTimer = COMBO_WINDOW;
    if (combo >= 2) showComboBadge();
}

function showComboBadge() {
    if (combo < 2) { hudCombo.classList.remove('show'); return; }
    hudCombo.textContent = '🔥 COMBO ×' + combo;
    hudCombo.classList.add('show');
    hudCombo.classList.remove('pulse');
    void hudCombo.offsetWidth;
    hudCombo.classList.add('pulse');
    if (combo % 5 === 0) playSFX('combo');
}

function getComboMultiplier() {
    if (combo >= 20) return 5;
    if (combo >= 15) return 4;
    if (combo >= 10) return 3;
    if (combo >= 5) return 2;
    return 1;
}

function resetCombo() {
    if (comboGraceTimer > 0) {
        comboTimer = comboGraceTimer;
        return;
    }
    combo = 0;
    comboTimer = 0;
    hudCombo.classList.remove('show');
}

function getModeTimeLeft() {
    if (!MODES[currentMode].hasTimer) return 0;
    var elapsed = (performance.now() - runStartTime) / 1000;
    return Math.max(0, MODES[currentMode].timeLimit - elapsed);
}

// ===== ПОГОДА =====
function initWeather() {
    var s = getSave();
    var t = THEMES[s.equippedTheme] || THEMES.cosmos;
    weatherType = t.weather || 'stars';
    weatherParticles = [];
    if (!s.showWeather) return;

    var count = 0;
    if (weatherType === 'ember') count = 40;
    else if (weatherType === 'bubbles') count = 30;
    else if (weatherType === 'matrix') count = 60;
    else if (weatherType === 'clouds') count = 8;
    else if (weatherType === 'sparks') count = 25;
    else if (weatherType === 'neon') count = 15;
    else count = 0;

    for (var i = 0; i < count; i++) {
        weatherParticles.push(makeWeatherParticle(weatherType, true));
    }
}

function makeWeatherParticle(type, initial) {
    var p = { type: type, life: 1 };
    if (type === 'ember') {
        p.x = Math.random() * 600;
        p.y = initial ? Math.random() * 400 : 420;
        p.vx = (Math.random() - 0.5) * 0.8;
        p.vy = -0.5 - Math.random() * 1.2;
        p.size = 1 + Math.random() * 2.5;
        p.color = Math.random() < 0.5 ? '#ff5722' : '#ffab91';
    } else if (type === 'bubbles') {
        p.x = Math.random() * 600;
        p.y = initial ? Math.random() * 400 : 420;
        p.vx = (Math.random() - 0.5) * 0.4;
        p.vy = -0.8 - Math.random() * 1.5;
        p.size = 2 + Math.random() * 4;
        p.color = '#88ffff';
        p.wobble = Math.random() * Math.PI * 2;
    } else if (type === 'matrix') {
        p.x = Math.floor(Math.random() * 40) * 15;
        p.y = initial ? Math.random() * 400 : -20;
        p.vx = 0;
        p.vy = 1.5 + Math.random() * 2.5;
        p.size = 10;
        p.char = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
        p.color = '#00ff41';
    } else if (type === 'clouds') {
        p.x = Math.random() * 600;
        p.y = initial ? Math.random() * 200 : -50;
        p.vx = 0.2 + Math.random() * 0.3;
        p.vy = 0;
        p.size = 60 + Math.random() * 80;
        p.color = 'rgba(255,255,255,0.06)';
    } else if (type === 'sparks') {
        p.x = Math.random() * 600;
        p.y = Math.random() * 400;
        p.vx = (Math.random() - 0.5) * 0.3;
        p.vy = (Math.random() - 0.5) * 0.3;
        p.size = 1 + Math.random() * 2;
        p.color = '#88aaff';
        p.twinkle = Math.random() * Math.PI * 2;
    } else if (type === 'neon') {
        p.x = Math.floor(Math.random() * 30) * 20;
        p.y = Math.floor(Math.random() * 20) * 20;
        p.size = 3;
        p.color = Math.random() < 0.5 ? '#ff00ff' : '#00ffcc';
        p.twinkle = Math.random() * Math.PI * 2;
    }
    return p;
}

function updateWeather() {
    var s = getSave();
    if (!s.showWeather) return;

    for (var i = weatherParticles.length - 1; i >= 0; i--) {
        var p = weatherParticles[i];
        if (p.type === 'ember') {
            p.x += p.vx; p.y += p.vy; p.vy += 0.01;
            if (p.y < -20 || p.y > 420) weatherParticles.splice(i, 1);
        } else if (p.type === 'bubbles') {
            p.wobble += 0.05;
            p.x += Math.sin(p.wobble) * 0.5 + p.vx;
            p.y += p.vy;
            if (p.y < -20) weatherParticles.splice(i, 1);
        } else if (p.type === 'matrix') {
            p.y += p.vy; p.life -= 0.008;
            if (p.y > 420) weatherParticles.splice(i, 1);
        } else if (p.type === 'clouds') {
            p.x += p.vx;
            if (p.x > 650) weatherParticles.splice(i, 1);
        } else if (p.type === 'sparks') {
            p.x += p.vx; p.y += p.vy; p.twinkle += 0.1;
            if (p.x < 0 || p.x > 600 || p.y < 0 || p.y > 400) weatherParticles.splice(i, 1);
        } else if (p.type === 'neon') {
            p.twinkle += 0.08;
        }
    }

    if (frame % 8 === 0) {
        var count = 0;
        if (weatherType === 'ember') count = 2;
        else if (weatherType === 'bubbles') count = 1;
        else if (weatherType === 'matrix') count = 3;
        else if (weatherType === 'sparks') count = 1;
        for (var j = 0; j < count; j++) {
            if (weatherParticles.length < 80) {
                weatherParticles.push(makeWeatherParticle(weatherType, false));
            }
        }
    }
    if (weatherType === 'clouds' && weatherParticles.length < 8 && frame % 120 === 0) {
        weatherParticles.push(makeWeatherParticle('clouds', false));
    }
    if (weatherType === 'neon' && weatherParticles.length < 15 && frame % 60 === 0) {
        weatherParticles.push(makeWeatherParticle('neon', false));
    }
}

function drawWeather() {
    var s = getSave();
    if (!s.showWeather) return;
    for (var i = 0; i < weatherParticles.length; i++) {
        var p = weatherParticles[i];
        ctx.save();
        if (p.type === 'ember') {
            ctx.globalAlpha = 0.7;
            ctx.shadowColor = p.color; ctx.shadowBlur = 8;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        } else if (p.type === 'bubbles') {
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = p.color; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.stroke();
        } else if (p.type === 'matrix') {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
            ctx.shadowColor = '#00ff41'; ctx.shadowBlur = 6;
            ctx.fillText(p.char, p.x, p.y);
        } else if (p.type === 'clouds') {
            var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            grad.addColorStop(0, p.color); grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        } else if (p.type === 'sparks') {
            ctx.globalAlpha = 0.4 + Math.sin(p.twinkle) * 0.4;
            ctx.shadowColor = p.color; ctx.shadowBlur = 6;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        } else if (p.type === 'neon') {
            ctx.globalAlpha = 0.3 + Math.sin(p.twinkle) * 0.3;
            ctx.shadowColor = p.color; ctx.shadowBlur = 10;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.restore();
    }
}

// ==========================================================
//   СПАВН
// ==========================================================
function spawnCoin() {
    var value = getCoinMultiplier();
    coins.push({
        x: 20 + Math.random() * (canvas.width - 40),
        y: -20, size: 18,
        speed: 3.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        value: value
    });
}

function spawnDrop(type, x, y) {
    drops.push({
        type: type, x: x, y: y, size: 24, vy: 2.2,
        vx: (Math.random() - 0.5) * 2,
        wobble: Math.random() * Math.PI * 2,
        life: 1
    });
}

function pickMonsterType() {
    var avail = Object.keys(MONSTER_TYPES).filter(function(k) {
        return MONSTER_TYPES[k].unlock <= level;
    });
    var weights = avail.map(function(k) {
        if (k === 'normal') return Math.max(1, 6 - level * 0.5);
        if (k === 'miniboss') return 0.3;
        if (k === 'crystal' || k === 'barrier') return 1.5;
        if (k === 'teleporter' || k === 'magnet_enemy') return 1.2;
        if (k === 'doppel' || k === 'laser') return 1.0;
        return 1 + level * 0.3;
    });
    var total = weights.reduce(function(a, b) { return a + b; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < avail.length; i++) {
        r -= weights[i];
        if (r <= 0) return avail[i];
    }
    return 'normal';
}

function spawnEnemy(forcedType) {
    var typeKey = forcedType || pickMonsterType();
    var t = MONSTER_TYPES[typeKey];
    var speedBonus = (level - 1) * 0.4;
    var speedMultiplier = (level <= 3) ? 0.7 : 1;
    var e = {
        type: typeKey, t: t,
        x: 20 + Math.random() * (canvas.width - t.size - 20),
        y: -30, size: t.size,
        speed: (t.speed + speedBonus) * speedMultiplier,
        hp: t.hp, maxHp: t.hp,
        wobble: Math.random() * Math.PI * 2,
        zigzagPhase: Math.random() * Math.PI * 2,
        baseX: 0, hitFlash: 0,
        flightTime: 0, shootTimer: t.shootsEvery || 0,
        ghostPhase: 0, ghostAlpha: 1,
        rotation: Math.random() * Math.PI * 2,
        wingPhase: 0,
        vx: t.vx || 0,
        teleportTimer: t.teleportEvery || 0,
        magnetActive: false,
        laserCharging: false,
        laserTimer: 0
    };
    if (typeKey === 'barrier') {
        e.x = Math.random() < 0.5 ? 30 : canvas.width - 30 - (t.barWidth || 60);
        e.vx = Math.random() < 0.5 ? 2.5 : -2.5;
        e.baseY = -30;
    }
    if (typeKey === 'teleporter') e.teleportTimer = 90;
    if (typeKey === 'laser') e.laserTimer = t.chargeTime || 60;
    e.baseX = e.x;

    // Rogue-модификаторы
    if (currentMode === 'rogue' && currentWaveModifier) {
        var mod = currentWaveModifier;
        if (mod.hpMult) {
            e.hp = Math.max(1, Math.floor(e.hp * mod.hpMult));
            e.maxHp = e.hp;
        }
        if (mod.hpBonus) {
            e.hp += mod.hpBonus;
            e.maxHp = e.hp;
        }
        if (mod.speedMult) {
            e.speed *= mod.speedMult;
        }
    }
    if (enemySlowMult < 1) e.speed *= enemySlowMult;

    enemies.push(e);
}

function spawnBoss(bossId) {
    var b = BOSS_TYPES[bossId];
    if (!b) return;

    // Босс всегда выходит один на один: очищаем обычных врагов и их снаряды.
    enemies = [];
    enemyBullets = [];
    coins = [];
    webs = [];
    drops = [];
    meteors = [];
    bossState = 'intro';
    bossStateTimer = 120;
    bossAnnouncement = '⚠ BOSS INCOMING ⚠';
    bossAnnouncementTimer = 120;
    bossDuelId = bossId;

    var boss = {
        id: bossId, type: b,
        x: canvas.width / 2 - b.size / 2,
        y: -b.size - 20,
        size: b.size,
        hp: b.hp, maxHp: b.hp,
        phase: 1, wobble: 0, shootTimer: 60, specialTimer: 0,
        rotation: 0, hitFlash: 0, entering: true, defeatTimer: 0,
        telegraphTimer: 0, vulnerableTimer: 0, fireNow: false, contactCooldown: 0,
        reward: b.reward
    };
    bosses.push(boss);
    showToast('⚠️ ' + b.icon + ' ' + b.name + ' выходит на дуэль!', 'legendary');
    playSFX('boss');
    screenShake = 20;
    updateBossDuelHUD();
}

function spawnEnemyBullet(x, y, vx, vy, opts) {
    opts = opts || {};
    enemyBullets.push({
        x: x, y: y, vx: vx, vy: vy,
        size: opts.size || 7,
        color: opts.color || '#ff5c7a',
        homing: opts.homing || 0,
        life: opts.life || 180,
        type: opts.type || 'normal'
    });
}

function spawnWeb(x, y) {
    webs.push({ x: x, y: y, size: 60 + Math.random() * 20, life: 300 });
}

// ==========================================================
//   ROGUELIKE: СИНЕРГИИ
// ==========================================================
function checkSynergies() {
    var s = getSave();
    // Vampire + Thorns = Blood Thorns
    if (runUpgrades.vampire && runUpgrades.thorns && !runSynergies.blood_thorns) {
        runSynergies.blood_thorns = true;
        thornsDamage *= 2;
        showToast('🔥 СИНЕРГИЯ: Кровавые шипы!', 'legendary');
        playSFX('upgrade');
        s.rogueStats.synergiesActivated = (s.rogueStats.synergiesActivated || 0) + 1;
        persist();
    }
    // Greed + Luck = Jackpot
    if (runUpgrades.greed && runUpgrades.luck && !runSynergies.jackpot) {
        runSynergies.jackpot = true;
        showToast('💰 СИНЕРГИЯ: Джекпот!', 'legendary');
        playSFX('upgrade');
        s.rogueStats.synergiesActivated = (s.rogueStats.synergiesActivated || 0) + 1;
        persist();
    }
    // Speed + Dodge = Flash
    if (runUpgrades.speed && runUpgrades.dodge && !runSynergies.flash) {
        runSynergies.flash = true;
        dodgeChance += 0.1;
        showToast('💨 СИНЕРГИЯ: Вспышка!', 'legendary');
        playSFX('upgrade');
    }
    // Chain + Explosive = Chaos
    if (runUpgrades.chain && explosiveCoins && !runSynergies.chaos) {
        runSynergies.chaos = true;
        showToast('⚡ СИНЕРГИЯ: Хаос!', 'legendary');
        playSFX('upgrade');
    }
    // Кровавый клык + крит = Blood Hunt
    if (bloodFangActive && runUpgrades.crit && !runSynergies.blood_hunt) {
        runSynergies.blood_hunt = true;
        vampiresHeal += 0.03;
        showToast('🩸 СИНЕРГИЯ: Кровавая охота!', 'legendary');
        playSFX('upgrade');
        s.rogueStats.synergiesActivated = (s.rogueStats.synergiesActivated || 0) + 1;
        persist();
    }
    // Vampire + Berserk = Blood God
    if (runUpgrades.vampire && runUpgrades.berserk && !runSynergies.blood_god) {
        runSynergies.blood_god = true;
        vampiresHeal += 0.05;
        showToast('🧛 СИНЕРГИЯ: Бог крови!', 'legendary');
        playSFX('upgrade');
    }
}

// ==========================================================
//   ROGUELIKE: ПРИМЕНЕНИЕ АПГРЕЙДА
//   ⚠️ ФИКС: без бесполезного up.apply()
// ==========================================================
function applyUpgrade(upgradeId) {
    var up = UPGRADE_POOL[upgradeId];
    if (!up) return;

    runUpgrades[upgradeId] = (runUpgrades[upgradeId] || 0) + 1;

    switch (upgradeId) {
        case 'damage': playerDamage += 1; break;
        case 'pierce': pierceCount += 1; break;
        case 'thorns': thornsDamage += 2; break;
        case 'explosive': explosiveCoins = true; break;
        case 'chain': chainLightning += 1; break;
        case 'crit': critChance += 0.15; break;
        case 'shield': maxShields += 1; playerShields = Math.min(maxShields, playerShields + 1); break;
        case 'dodge': dodgeChance += 0.15; break;
        case 'regen': regenTimer = 25 * 60; break;
        case 'magnet': break;
        case 'speed': break;
        case 'luck': break;
        case 'greed': break;
        case 'combo_extend': COMBO_WINDOW += 30; break;
        case 'orbit': spawnOrbital(); break;
        case 'vampire': vampiresHeal += 0.05; break;
        case 'time_slow': enemySlowMult *= 0.90; break;
        case 'glass_cannon': playerDamage += 3; hpPenalty += 1; break;
        case 'berserk': break;
    }

    var s = getSave();
    s.rogueStats.totalUpgradesPicked = (s.rogueStats.totalUpgradesPicked || 0) + 1;
    var totalNow = Object.keys(runUpgrades).reduce(function(sum, k) { return sum + runUpgrades[k]; }, 0);
    if (totalNow > s.rogueStats.maxUpgradesInRun) {
        s.rogueStats.maxUpgradesInRun = totalNow;
    }
    persist();
    checkAchievements();
    updateUpgradeStrip();
    updateHUD();
}

function spawnOrbital() {
    orbitals.push({
        angle: Math.random() * Math.PI * 2,
        distance: 60 + orbitals.length * 15,
        size: 12,
        damageTimer: 0
    });
}

// ==========================================================
//   ROGUELIKE: ПРИМЕНЕНИЕ РЕЛИКВИИ
// ==========================================================
function applyRelic(relicId) {
    var rel = RELICS[relicId];
    if (!rel) return;
    runRelics.push(relicId);

    switch (relicId) {
        case 'lucky_coin': break;
        case 'hourglass': comboGraceTimer = 180; break;
        case 'magnet_core': buff.magnet = Math.max(buff.magnet, 120); break;
        case 'aegis': maxShields += 2; playerShields += 2; break;
        case 'phoenix_heart': revivesLeft += 1; break;
        case 'midas': break;
        case 'chaos_orb': chaosOrbTimer = 10 * 60; break;
        case 'berserker_mask': berserkerMask = true; break;
        case 'star_compass': extraUpgradeChoice = true; break;
        case 'blood_fang': bloodFangActive = true; break;
        case 'void_engine': playerDamage += 2; enemySlowMult *= 1.10; break;
        case 'titan_mark': titanMarkContacts = 0; break;
    }

    var s = getSave();
    if (runRelics.length > s.rogueStats.maxRelicsInRun) {
        s.rogueStats.maxRelicsInRun = runRelics.length;
    }
    persist();
    checkAchievements();
    updateUpgradeStrip();
    showToast('🏺 Реликвия: ' + rel.name + '!', 'legendary');
    playSFX('upgrade');
}

// ==========================================================
//   ROGUELIKE: МОДАЛКА АПГРЕЙДОВ
// ==========================================================
function showUpgradeChoice() {
    var count = 3 + (extraUpgradeChoice ? 1 : 0);
    pendingUpgradeChoices = pickRandomUpgrades(count);
    if (pendingUpgradeChoices.length === 0) {
        var s = getSave();
        var bonus = 100;
        s.bank += bonus;
        persist();
        showToast('💰 Все апгрейды выкуплены! +' + bonus, 'info');
        return;
    }

    isChoosingUpgrade = true;
    running = false;
    resetFrameClock();  // 🔧 ФИКС

    upgradeTitle.textContent = '🎉 УРОВЕНЬ ' + level + '!';
    renderUpgradeCards();
    upgradeModal.classList.add('open');
    updateRerollButton();
    playSFX('upgrade');
}

function updateRerollButton() {
    var s = getSave();
    var canReroll = s.bank >= rerollCost;
    upgradeRerollBtn.disabled = !canReroll;
    upgradeRerollBtn.innerHTML = '🎲 Реролл (' + rerollCost + '💰)';
}

function renderUpgradeCards() {
    upgradeCardsEl.innerHTML = '';
    pendingUpgradeChoices.forEach(function(id) {
        var up = UPGRADE_POOL[id];
        var stack = runUpgrades[id] || 0;
        var maxStacks = up.stacks ? (up.maxStacks || 99) : 1;
        var isMaxed = up.stacks && stack >= maxStacks;

        var card = document.createElement('div');
        card.className = 'upgrade-card ' + up.rarity;

        var rarity = document.createElement('div');
        rarity.className = 'upgrade-rarity ' + up.rarity;
        rarity.textContent = up.rarity;
        card.appendChild(rarity);

        var icon = document.createElement('div');
        icon.className = 'upgrade-icon';
        icon.textContent = up.icon;
        card.appendChild(icon);

        var name = document.createElement('div');
        name.className = 'upgrade-name';
        name.textContent = up.name;
        card.appendChild(name);

        var desc = document.createElement('div');
        desc.className = 'upgrade-desc';
        desc.textContent = up.desc;
        card.appendChild(desc);

        if (up.stacks && stack > 0) {
            var info = document.createElement('div');
            info.className = 'upgrade-stack-info' + (isMaxed ? ' maxed' : '');
            info.textContent = isMaxed ? '★ MAX' : 'Стак: ' + stack + '/' + maxStacks;
            card.appendChild(info);
        }

        var synHint = getSynergyHint(id);
        if (synHint) {
            var hint = document.createElement('div');
            hint.className = 'upgrade-hint';
            hint.textContent = '⚡ ' + synHint;
            card.appendChild(hint);
        }

        card.addEventListener('click', function() {
            pickUpgrade(id);
        });
        upgradeCardsEl.appendChild(card);
    });
}

function getSynergyHint(upgradeId) {
    if (upgradeId === 'vampire' && runUpgrades.thorns) return 'Синергия с шипами!';
    if (upgradeId === 'thorns' && runUpgrades.vampire) return 'Синергия с вампиризмом!';
    if (upgradeId === 'greed' && runUpgrades.luck) return 'Синергия с удачей!';
    if (upgradeId === 'luck' && runUpgrades.greed) return 'Синергия с жадностью!';
    if (upgradeId === 'speed' && runUpgrades.dodge) return 'Синергия с уклонением!';
    if (upgradeId === 'dodge' && runUpgrades.speed) return 'Синергия со скоростью!';
    if (upgradeId === 'berserk' && runUpgrades.vampire) return 'Синергия с вампиризмом!';
    if (upgradeId === 'vampire' && runUpgrades.berserk) return 'Синергия с берсерком!';
    if (upgradeId === 'crit' && bloodFangActive) return 'Кровавый клык усиливает криты!';
    if (upgradeId === 'explosive' && runUpgrades.chain) return 'Синергия с молниями!';
    if (upgradeId === 'chain' && explosiveCoins) return 'Синергия с взрывом!';
    return null;
}

function pickUpgrade(upgradeId) {
    applyUpgrade(upgradeId);
    checkSynergies();
    closeUpgradeModal();
}

function closeUpgradeModal() {
    upgradeModal.classList.remove('open');
    isChoosingUpgrade = false;
    running = true;
    pendingUpgradeChoices = [];
    resetFrameClock();  // 🔧 ФИКС
    updateHUD();
}

upgradeRerollBtn.addEventListener('click', function() {
    var s = getSave();
    if (s.bank < rerollCost) return;
    s.bank -= rerollCost;
    rerollCost += 25;
    persist();

    var exclude = pendingUpgradeChoices.slice();
    var count = 3 + (extraUpgradeChoice ? 1 : 0);
    var newPicks = pickRandomUpgrades(count, exclude);
    if (newPicks.length < count) {
        var extra = pickRandomUpgrades(count - newPicks.length);
        extra.forEach(function(id) {
            if (newPicks.indexOf(id) === -1) newPicks.push(id);
        });
    }
    if (newPicks.length === 0) {
        showToast('Больше нет апгрейдов', 'info');
        return;
    }
    pendingUpgradeChoices = newPicks;
    renderUpgradeCards();
    updateRerollButton();
});

// ==========================================================
//   ROGUELIKE: МОДАЛКА РЕЛИКВИЙ
// ==========================================================
function showRelicChoice() {
    if (isChoosingUpgrade) return;  // защита

    var picks = pickRandomRelics(3);
    if (picks.length === 0) {
        showToast('Все реликвии собраны!', 'info');
        return;
    }
    pendingRelicChoices = picks;
    isChoosingUpgrade = true;
    running = false;
    resetFrameClock();  // 🔧 ФИКС

    relicCardsEl.innerHTML = '';
    picks.forEach(function(id) {
        var rel = RELICS[id];
        var card = document.createElement('div');
        card.className = 'relic-card';

        var icon = document.createElement('div');
        icon.className = 'relic-icon';
        icon.textContent = rel.icon;
        card.appendChild(icon);

        var name = document.createElement('div');
        name.className = 'relic-name';
        name.textContent = rel.name;
        card.appendChild(name);

        var desc = document.createElement('div');
        desc.className = 'relic-desc';
        desc.textContent = rel.desc;
        card.appendChild(desc);

        var rarity = document.createElement('div');
        rarity.style.cssText = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-top:6px;';
        rarity.textContent = rel.rarity;
        if (rel.rarity === 'common') rarity.style.color = '#ddd';
        else if (rel.rarity === 'rare') rarity.style.color = '#4fc3f7';
        else if (rel.rarity === 'epic') rarity.style.color = '#b388ff';
        else if (rel.rarity === 'legendary') rarity.style.color = '#ffd93d';
        else rarity.style.color = '#ff5c7a';
        card.appendChild(rarity);

        card.addEventListener('click', function() { pickRelic(id); });
        relicCardsEl.appendChild(card);
    });

    relicModal.classList.add('open');
    playSFX('upgrade');
}

function pickRelic(relicId) {
    applyRelic(relicId);
    relicModal.classList.remove('open');
    isChoosingUpgrade = false;
    running = true;
    pendingRelicChoices = [];
    resetFrameClock();  // 🔧 ФИКС
    updateHUD();
}

// ==========================================================
//   ROGUELIKE: МОДАЛКА ВОЛНЫ
// ==========================================================
function showWaveBanner(modifier) {
    isChoosingUpgrade = true;
    running = false;
    resetFrameClock();  // 🔧 ФИКС

    waveIcon.textContent = modifier.icon;
    waveName.textContent = modifier.name;
    waveName.style.color = modifier.color || '#fff';
    waveDesc.textContent = modifier.desc;
    waveBanner.style.borderColor = modifier.color || '#9c6bff';
    waveBanner.style.boxShadow = '0 0 60px ' + (modifier.color || '#9c6bff') + '88';

    waveModal.classList.add('open');
    playSFX('boss');
}

waveStartBtn.addEventListener('click', function() {
    waveModal.classList.remove('open');
    isChoosingUpgrade = false;
    running = true;
    noHitWaveDamage = 0;
    resetFrameClock();  // 🔧 ФИКС
    updateHUD();
    finishWaveAndShowUpgrade();
});

// ==========================================================
//   ROGUELIKE: НАЧАЛО ЭЛИТНОЙ ВОЛНЫ
// ==========================================================
function startEliteWave() {
    var keys = Object.keys(WAVE_MODIFIERS);
    var modId = keys[Math.floor(Math.random() * keys.length)];
    var mod = WAVE_MODIFIERS[modId];
    currentWaveModifier = mod;
    currentWaveLevel = level;
    noHitWaveActive = !!mod.noHitChallenge;
    noHitWaveDamage = 0;

    if (mod.spawnMiniboss) {
        spawnEnemy('miniboss');
    }

    showWaveBanner(mod);
}



// 🔧 ФИКС: после закрытия волны — принудительно показать апгрейд
function finishWaveAndShowUpgrade() {
    if (pendingUpgradeAfterWave) {
        pendingUpgradeAfterWave = false;
        setTimeout(function() {
            if (!isChoosingUpgrade && running && currentMode === 'rogue') {
                showUpgradeChoice();
            }
        }, 250);
    }
}

// ==========================================================
//   RESET
// ==========================================================
function reset() {
    console.log('→ reset() вызван. Режим:', currentMode);

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
    window._bossSpawned5 = false;
    window._bossSpawned10 = false;
    window._bossSpawned15 = false; // 🔧 ФИКС

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
//   ДРОПЫ
// ==========================================================
function applyDrop(type, x, y) {
    var s = getSave();
    var px = player.x + player.size / 2;
    var py = player.y + player.size / 2;

    if (type === 'killall') {
        enemies.forEach(function(en) { addParticles(en.x + en.size/2, en.y + en.size/2, en.t.glow, 10, 10); });
        enemies = [];
        score += 50;
        screenShake = 22;
        addFloatingText(px, py - 10, '+50!', '#ff5c7a', 30);
        addParticles(px, py, '#ff5c7a', 30, 15);
        showToast('💥 ВСЕ ВРАГИ УНИЧТОЖЕНЫ!', 'success');
    } else if (type === 'bomb') {
        enemies.forEach(function(en) { addParticles(en.x + en.size/2, en.y + en.size/2, en.t.glow, 15, 12); });
        enemies = []; enemyBullets = [];
        score += 75;
        screenShake = 28;
        addFloatingText(px, py - 10, '+75!', '#ff9800', 32);
        addParticles(px, py, '#ff9800', 45, 18);
        addParticles(px, py, '#fff59d', 25, 12);
        showToast('💣 ЯДЕРНЫЙ ВЗРЫВ!', 'legendary');
    } else if (type === 'magnet') {
        buff.magnet = 10 * 60; updateBuffBadges();
        addParticles(px, py, '#4fc3f7', 20, 10);
        showToast('🧲 Магнит!', 'success');
    } else if (type === 'freeze') {
        buff.freeze = 3 * 60; updateBuffBadges();
        addParticles(px, py, '#00e5ff', 20, 10);
        showToast('❄ Заморозка!', 'success');
    } else if (type === 'speedBoost') {
        buff.speedBoost = 5 * 60; updateBuffBadges();
        addParticles(px, py, '#7cffb2', 20, 10);
        showToast('⚡ Ускорение ×2!', 'success');
    } else if (type === 'x2gold') {
        buff.x2gold = 15 * 60; updateBuffBadges();
        addParticles(px, py, '#ffd93d', 20, 10);
        showToast('✨ ×2 золото!', 'success');
    } else if (type === 'phantom') {
        buff.phantom = 5 * 60; updateBuffBadges();
        addParticles(px, py, '#fff', 20, 10);
        showToast('👻 Фантом!', 'success');
    } else if (type === 'medkit') {
        if (currentMode !== 'survival' && lives < 8) {
            lives++;
            addParticles(px, py, '#ff5c7a', 20, 10);
            showToast('🩹 +1 жизнь!', 'success');
        } else {
            score += 20;
            addFloatingText(px, py - 10, '+20', '#ff5c7a', 24);
            showToast('❤ Уже максимум — +20', 'info');
        }
    } else if (type === 'chest') {
        if (currentMode === 'rogue') {
            // Защита от повторного вызова
            if (isChoosingUpgrade) {
                var bonusGold = 200;
                s.bank += bonusGold;
                persist();
                showToast('🎁 +' + bonusGold + ' золота!', 'legendary');
            } else {
                showRelicChoice();
            }
        } else {
            buff.chest = 3 * 60; updateBuffBadges();
            addParticles(px, py, '#ff9800', 22, 10);
            showToast('🎁 Сундук открывается...', 'info');
        }
    } else if (type === 'combo') {
        combo += 5;
        comboTimer = COMBO_WINDOW;
        showComboBadge();
        addParticles(px, py, '#ff5722', 20, 10);
        showToast('🔥 +5 комбо!', 'success');
    }
}

function openChest() {
    var s = getSave();
    var roll = Math.random();
    if (roll < 0.3) {
        var bonus = 150 + Math.floor(Math.random() * 300);
        s.bank += bonus; persist();
        showToast('🎁 +' + bonus + ' золота!', 'legendary');
    } else if (roll < 0.55) {
        for (var i = 0; i < 15; i++) spawnCoin();
        showToast('🎁 15 монет!', 'legendary');
    } else if (roll < 0.75) {
        if (currentMode !== 'survival' && lives < 8) {
            lives++;
            showToast('🎁 +1 жизнь!', 'legendary');
        } else {
            s.bank += 100;
            persist();
            showToast('🎁 +100 золота!', 'legendary');
        }
    } else if (roll < 0.9) {
        buff.freeze = 3 * 60; buff.x2gold = 10 * 60; buff.speedBoost = 5 * 60;
        updateBuffBadges();
        showToast('🎁 Всё усиление!', 'legendary');
    } else {
        if (Math.random() < 0.3) {
            s.coreCrystals = (s.coreCrystals || 0) + 1;
            showToast('💎 +1 кристалл из сундука!', 'legendary');
        } else {
            var locked = Object.keys(SKINS).filter(function(k) {
                return s.ownedSkins.indexOf(k) === -1;
            });
            if (locked.length > 0) {
                var skinId = locked[Math.floor(Math.random() * locked.length)];
                s.ownedSkins.push(skinId);
                s.equippedSkin = skinId;
                showToast('🎁🎁 СКИН: ' + SKINS[skinId].name + '!', 'legendary');
            } else {
                s.bank += 1000;
                showToast('🎁 +1000 золота', 'legendary');
            }
        }
        persist();
    }
    checkAchievements();
}

function explodeBomber(e, offscreen) {
    var cx = e.x + e.size / 2;
    var cy = e.y + e.size / 2;
    addParticles(cx, cy, '#ff5722', 18, 12);
    addParticles(cx, cy, '#ffab91', 12, 8);
    var dirs = [0, Math.PI/3, 2*Math.PI/3, Math.PI, 4*Math.PI/3, 5*Math.PI/3];
    for (var i = 0; i < dirs.length; i++) {
        var a = dirs[i] + (Math.random() - 0.5) * 0.4;
        spawnEnemyBullet(cx, cy, Math.cos(a) * 3.2, Math.sin(a) * 3.2, { color:'#ff7043', size:6 });
    }
    if (!offscreen) {
        screenShake = 16;
    } else {
        var pxc = player.x + player.size/2, pyc = player.y + player.size/2;
        if (Math.hypot(pxc - cx, pyc - cy) < 100 && buff.phantom <= 0 && player.damageFlash <= 0) {
            playerTakeDamage();
        }
    }
}

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

function playerTakeDamage() {
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
//   UPDATE — КРИТИЧНЫЕ ФИКСЫ
// ==========================================================
function update() {
    if (!running || gameOver || paused || isChoosingUpgrade) return;
    frame++;
    // 🔧 ФИКС: защита от изменения running во время update
    var _wasRunning = running;

    runTime = Math.floor((performance.now() - runStartTime) / 1000);
    var mode = MODES[currentMode];

    // Таймер
    if (mode.hasTimer) {
        timeLeft = getModeTimeLeft();
        if (timeLeft <= 0) {
            gameOver = true;
            finishRun();
            return;
        }
    } else {
        levelTimer--;
        if (levelTimer <= 0) {
            levelTimer = LEVEL_DURATION;
            levelUp();
            // 🔧 Если открылась модалка/волна — прерываем update
            if (isChoosingUpgrade || !running) return;
        }
    }

    // Combo
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer <= 0 && combo > 0) {
            combo = 0;
            hudCombo.classList.remove('show');
        }
    }
    if (comboGraceTimer > 0) comboGraceTimer--;

    // Эффекты
    if (damageFlash > 0) damageFlash = Math.max(0, damageFlash - 0.04);
    if (player.damageFlash > 0) player.damageFlash--;
    if (screenShake > 0.3) screenShake *= 0.88;
    else screenShake = 0;
    player.breath += 0.03;

    // Мигание
    if (player.damageFlash <= 0) {
        player.blinkTimer--;
        if (player.blinkTimer <= 0) {
            player.isBlinking = !player.isBlinking;
            player.blinkTimer = player.isBlinking ? 6 : (120 + Math.floor(Math.random() * 180));
        }
    } else {
        player.isBlinking = (player.damageFlash % 6 < 3);
    }

    // Баффы
    var needBadge = false;
    ['magnet','freeze','speedBoost','x2gold','phantom'].forEach(function(k) {
        if (buff[k] > 0) {
            buff[k]--;
            if (buff[k] % 60 === 0) needBadge = true;
            if (buff[k] === 0) needBadge = true;
        }
    });
    if (buff.chest > 0) {
        buff.chest--;
        if (buff.chest === 0) { openChest(); needBadge = true; }
        else if (buff.chest % 60 === 0) needBadge = true;
    }
    if (needBadge) updateBuffBadges();

    // Реген щита
    if (maxShields > 0 && playerShields < maxShields) {
        shieldRegenTimer++;
        if (shieldRegenTimer >= 12 * 60) {
            shieldRegenTimer = 0;
            playerShields++;
            addParticles(player.x + player.size/2, player.y + player.size/2, '#4fc3f7', 10, 6);
        }
    }

    // Реген HP
    if (runUpgrades.regen && runUpgrades.regen > 0) {
        regenTimer++;
        var threshold = 25 * 60 / runUpgrades.regen;
        if (regenTimer >= threshold) {
            regenTimer = 0;
            if (currentMode !== 'survival' && lives < 10) {
                lives++;
                addFloatingText(player.x + player.size/2, player.y - 10, '+❤', '#7cffb2', 22);
                updateHUD();
            }
        }
    }

    // Chaos orb
    if (chaosOrbTimer > 0) {
        chaosOrbTimer--;
        if (chaosOrbTimer === 0) {
            chaosOrbTimer = 10 * 60;
            var chaosBuffs = ['magnet','freeze','speedBoost','x2gold','phantom'];
            var pick = chaosBuffs[Math.floor(Math.random() * chaosBuffs.length)];
            buff[pick] = 5 * 60;
            updateBuffBadges();
            showToast('🌀 Хаос: ' + pick + '!', 'epic');
        }
    }

    // Движение
    var dirX = 0, dirY = 0;
    if (player.frozen > 0) {
        player.frozen--;
    } else {
        var dx = 0, dy = 0;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= 1;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;
        if (keys['ArrowUp'] || keys['w'] || keys['W']) dy -= 1;
        if (keys['ArrowDown'] || keys['s'] || keys['S']) dy += 1;
        dx += joyVector.x;
        dy += joyVector.y;
        var mag = Math.hypot(dx, dy);
        if (mag > 1) { dx /= mag; dy /= mag; }
        dirX = dx; dirY = dy;

        var s = getSave();
        var spd = player.speed * (s.playerSpeedBonus || 1);
        spd *= coreBonusCache.speed;

        if (mode.isRoguelike) {
            spd *= getClass(selectedClass).speed;
            if (runUpgrades.speed) spd *= Math.pow(1.08, runUpgrades.speed);
        }

        if (buff.speedBoost > 0) spd *= 2;
        if (player.inWeb) spd *= 0.5;

        player.x += dx * spd;
        player.y += dy * spd;
    }
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    if (Math.abs(dirX) > 0.05 || Math.abs(dirY) > 0.05) {
        player.lastDirX = dirX;
        player.lastDirY = dirY;
    }
    var targetTilt = dirX * 0.12;
    player.tilt += (targetTilt - player.tilt) * 0.15;

    // Rogue: аура мага
    if (mode.isRoguelike && getClass(selectedClass).passiveId === 'aura') {
        var auraR = 60;
        var px = player.x + player.size/2;
        var py = player.y + player.size/2;
        if (frame % 30 === 0) {
            enemies.forEach(function(e) {
                var ex = e.x + e.size/2, ey = e.y + e.size/2;
                if (Math.hypot(px - ex, py - ey) < auraR) {
                    e.hp -= 0.5;
                    e.hitFlash = 6;
                    addParticles(ex, ey, '#e040fb', 3, 4);
                }
            });
        }
    }

    // Rogue: орбитали
    if (orbitals.length > 0) {
        var pxc = player.x + player.size/2;
        var pyc = player.y + player.size/2;
        orbitals.forEach(function(o) {
            o.angle += 0.04;
            var ox = pxc + Math.cos(o.angle) * o.distance;
            var oy = pyc + Math.sin(o.angle) * o.distance;
            o.x = ox; o.y = oy;
            if (frame % 15 === 0) {
                enemies.forEach(function(e) {
                    var ex = e.x + e.size/2, ey = e.y + e.size/2;
                    if (Math.hypot(ox - ex, oy - ey) < e.size/2 + o.size) {
                        e.hp -= 1;
                        e.hitFlash = 6;
                        addParticles(ex, ey, '#7c4dff', 5, 6);
                    }
                });
                bosses.forEach(function(b) {
                    var bx = b.x + b.size/2, by = b.y + b.size/2;
                    if (Math.hypot(ox - bx, oy - by) < b.size/2 + o.size) {
                        b.hp -= 1;
                        b.hitFlash = 6;
                        addParticles(bx, by, '#7c4dff', 8, 8);
                    }
                });
            }
        });
    }

    // Босс-дуэль: отдельный режим — никаких обычных врагов/опасностей.
    if (bossState === 'intro') {
        bossStateTimer--;
        bossAnnouncementTimer = Math.max(0, bossAnnouncementTimer - 1);
        updateBossDuelHUD();
        if (bossStateTimer <= 0) {
            bossState = 'duel';
            bossStateTimer = 0;
            bossAnnouncement = '⚔ ДУЭЛЬ 1 × 1';
            bossAnnouncementTimer = 70;
            updateBossDuelHUD();
        }
    } else if (bossState === 'victory' || bossState === 'lost') {
        bossStateTimer--;
        bossAnnouncementTimer = Math.max(0, bossAnnouncementTimer - 1);
        updateBossDuelHUD();
        if (bossState === 'victory' && bossStateTimer <= 0) {
            bossState = 'none';
            bossDuelId = null;
            bossAnnouncement = '';
            updateBossDuelHUD();
            levelTimer = LEVEL_DURATION;
            levelUp();
            if (isChoosingUpgrade || !running) return;
        }
        if (bossState === 'lost') return;
    }

    // Спавн монет
    if (bossState === 'none' && frame % 40 === 0) spawnCoin();

    // Спавн врагов
    var baseInterval;
    if (level <= 3) baseInterval = 75;
    else baseInterval = Math.max(15, 55 - (level - 1) * 6);
    var enemyMult = mode.enemyMultiplier || 1;

    if (mode.isRoguelike && currentWaveModifier) {
        if (currentWaveModifier.enemyMult) enemyMult *= currentWaveModifier.enemyMult;
    }

    if (bossState === 'none') {
        if (frame % Math.max(8, Math.floor(baseInterval / enemyMult)) === 0) spawnEnemy();
        if (level >= 3 && frame % Math.max(15, Math.floor(baseInterval * 2 / enemyMult)) === 0) spawnEnemy();
        if (level >= 6 && frame % Math.max(30, Math.floor(baseInterval * 4 / enemyMult)) === 0) spawnEnemy();
    }

    // Боссы
    if (bossState === 'none' && currentMode === 'rogue') {
       // Флаг для отслеживания, что босс этого уровня уже был заспавнен
if (level === BOSS_TYPES.dragon.level && !bosses.some(function(b){ return b.id === 'dragon'; }) && !window._bossSpawned5) {
    window._bossSpawned5 = true;
    spawnBoss('dragon');
}
if (level === BOSS_TYPES.titan.level && !bosses.some(function(b){ return b.id === 'titan'; }) && !window._bossSpawned10) {
    window._bossSpawned10 = true;
    spawnBoss('titan');
}
if (level === BOSS_TYPES.devourer.level && !bosses.some(function(b){ return b.id === 'devourer'; }) && !window._bossSpawned15) {
    window._bossSpawned15 = true;
    spawnBoss('devourer');
}
    }

    // Параллакс
    for (var psi = 0; psi < parallaxStars.length; psi++) {
        var ps = parallaxStars[psi];
        ps.y += ps.speed;
        ps.twinkle += 0.05;
        if (ps.y > canvas.height + 5) {
            ps.y = -5;
            ps.x = Math.random() * canvas.width;
        }
    }

    // Метеоры — во время босса арена чистая.
    if (bossState === 'none' && frame % 90 === 0 && Math.random() < 0.7) {
        meteors.push({
            x: Math.random() * canvas.width, y: -20,
            vx: -2 - Math.random() * 2, vy: 4 + Math.random() * 3,
            len: 30 + Math.random() * 40, life: 1,
            color: Math.random() < 0.3 ? '#9c6bff' : (Math.random() < 0.5 ? '#4fc3f7' : '#fff59d')
        });
    }
    for (var mi = meteors.length - 1; mi >= 0; mi--) {
        var m = meteors[mi];
        m.x += m.vx; m.y += m.vy; m.life -= 0.012;
        if (m.life <= 0 || m.y > canvas.height + 40 || m.x < -60) meteors.splice(mi, 1);
    }

    updateWeather();

    // Магнит
    var saveObj = getSave();
    var magnetRadiusBase = saveObj.magnetRadius + coreBonusCache.magnet;
    if (mode.isRoguelike && runUpgrades.magnet) magnetRadiusBase += runUpgrades.magnet * 40;
    if (magnetRadiusBase > 0 || buff.magnet > 0) {
        var radius = Math.max(magnetRadiusBase, buff.magnet > 0 ? 250 : 0);
        var pull = buff.magnet > 0 ? 0.3 : 0.18;
        for (var ci = 0; ci < coins.length; ci++) {
            var c = coins[ci];
            var cxc = c.x + c.size/2, cyc = c.y + c.size/2;
            var pxc2 = player.x + player.size/2, pyc2 = player.y + player.size/2;
            var ddx = pxc2 - cxc, ddy = pyc2 - cyc;
            var d = Math.hypot(ddx, ddy);
            if (d < radius && d > 0) {
                c.x += ddx * pull;
                c.y += ddy * pull;
            }
        }
    }

    // Монеты
    coins.forEach(function(c) { c.y += c.speed; c.phase += 0.18; });
    coins = coins.filter(function(c) {
        if (rectsCollide(player, c)) {
            score++;
            levelStats.coinsThisLevel++;

            var gained = c.value;
            if (runBoosts.x2gold) gained *= 2;
            if (buff.x2gold > 0) gained *= 2;
            if (mode.isRoguelike) {
                if (runUpgrades.greed) gained = Math.floor(gained * Math.pow(1.2, runUpgrades.greed));
                if (runRelics.indexOf('lucky_coin') !== -1) gained = Math.floor(gained * 1.3);
                if (runRelics.indexOf('midas') !== -1) gained = Math.floor(gained * 3);
                var cls = getClass(selectedClass);
                if (cls.passiveId === 'coin_bonus') gained = Math.floor(gained * 1.25);
            }

            addCombo();
            var comboMult = getComboMultiplier();
            gained = Math.floor(gained * comboMult);

            var isCrit = false;
            if (mode.isRoguelike && (critChance > 0) && Math.random() < critChance) {
                gained *= 3;
                isCrit = true;
            }

            goldEarned += gained;
            var sv = getSave();
            sv.bank += gained;
            sv.totalCoins = (sv.totalCoins || 0) + gained;

            addParticles(c.x + c.size/2, c.y + c.size/2, isCrit ? '#ff1744' : '#ffd93d', isCrit ? 12 : 6, 5);
            var textColor = isCrit ? '#ff1744' : (combo >= 5 ? '#ff9800' : '#ffd93d');
            var textSize = isCrit ? 32 : (gained >= 20 ? 28 : (gained >= 10 ? 24 : 20));
            addFloatingText(c.x + c.size/2, c.y, (isCrit ? 'КРИТ +' : '+') + gained, textColor, textSize);
            persist();
            playSFX('coin');

            if (mode.isRoguelike && explosiveCoins) {
                var ex = c.x + c.size/2, ey = c.y + c.size/2;
                addParticles(ex, ey, '#ff9800', 15, 12);
                enemies.forEach(function(en) {
                    var enx = en.x + en.size/2, eny = en.y + en.size/2;
                    if (Math.hypot(ex - enx, ey - eny) < 60) {
                        en.hp -= 1;
                        en.hitFlash = 6;
                    }
                });
                screenShake = 4;
            }

            return false;
        }
        return c.y < canvas.height + 20;
    });

    // Дропы
    drops.forEach(function(d) {
        d.y += d.vy;
        d.wobble += 0.12;
        d.x += Math.sin(d.wobble) * 1.0;
    });
    drops = drops.filter(function(d) {
        if (rectsCollide(player, d)) { applyDrop(d.type, player.x, player.y); return false; }
        return d.y < canvas.height + 30;
    });

    webs = webs.filter(function(w) { w.life--; return w.life > 0; });

    var px = player.x + player.size / 2;
    var py = player.y + player.size / 2;
    var frozen = buff.freeze > 0;

    // ВРАГИ
    for (var ei = 0; ei < enemies.length; ei++) {
        var e = enemies[ei];
        var et = e.t;
        e.wobble += 0.1;
        e.rotation = (e.rotation + 0.02) % (Math.PI * 2);
        e.wingPhase += 0.2;
        if (e.hitFlash > 0) e.hitFlash--;
        if (frozen) continue;

        // Движение по типам
        if (et.shape === 'oval') {
            e.flightTime++;
            if (e.flightTime < et.flightTime) {
                e.y += e.speed * 0.4;
                e.x += Math.sin(e.flightTime * 0.08) * 2.5;
            } else if (e.flightTime === et.flightTime) {
                e.y += e.speed * 4;
            } else {
                e.y += e.speed * 2.2;
            }
        } else if (et.shape === 'diamond' || et.shape === 'snake') {
            e.y += e.speed;
            e.zigzagPhase += et.zigzagFreq;
            e.x = e.baseX + Math.sin(e.zigzagPhase) * et.zigzagAmp * (level * 0.5);
            e.x = Math.max(0, Math.min(canvas.width - e.size, e.x));
        } else if (et.shape === 'ghost') {
            e.y += e.speed;
            e.x += Math.sin(e.wobble * 0.5) * 1.2;
            e.ghostPhase = (e.ghostPhase + 1) % 360;
            e.ghostAlpha = (e.ghostPhase < 120) ? 0.15 : 1;
        } else if (et.shape === 'triangle') {
            e.y += e.speed;
            e.x += ((px - e.size / 2) - e.x) * et.homing * (1 + level * 0.15);
        } else if (et.shape === 'circle' || et.shape === 'hex') {
            e.y += e.speed;
            e.x += Math.sin(e.wobble) * 1.5;
        } else if (et.shape === 'spider') {
            e.y += e.speed;
            e.x += Math.sin(e.wobble * 0.8) * 1.5;
            if (frame % 90 === 0 && e.y > 0 && e.y < canvas.height - 40) {
                spawnWeb(e.x + e.size / 2, e.y + e.size / 2);
            }
        } else if (et.shape === 'ice') {
            e.y += e.speed;
            e.x += Math.sin(e.wobble) * 0.8;
        } else if (et.shape === 'star') {
            e.y += e.speed * 0.6;
            e.x += Math.sin(e.wobble * 0.4) * 1.0;
            e.shootTimer--;
            if (e.shootTimer <= 0 && e.y > 30) {
                e.shootTimer = et.shootsEvery;
                var scx = e.x + e.size / 2, scy = e.y + e.size / 2;
                spawnEnemyBullet(scx, scy, 0, 3, { color:'#ffeb3b' });
                spawnEnemyBullet(scx, scy, 0, -3, { color:'#ffeb3b' });
                spawnEnemyBullet(scx, scy, 3, 0, { color:'#ffeb3b' });
                spawnEnemyBullet(scx, scy, -3, 0, { color:'#ffeb3b' });
            }
        } else if (et.shape === 'boss') {
            e.y += e.speed;
            if (e.y > 60 && e.y < canvas.height * 0.4) e.y -= e.speed;
            e.x += Math.sin(e.wobble * 0.3) * 1.5;
            e.x = Math.max(10, Math.min(canvas.width - e.size - 10, e.x));
            e.shootTimer--;
            if (e.shootTimer <= 0 && e.y > 20) {
                e.shootTimer = et.shootsEvery;
                var bcx = e.x + e.size / 2, bcy = e.y + e.size / 2;
                for (var j = -1; j <= 1; j++) {
                    var angle = Math.atan2(py - bcy, px - bcx) + j * 0.3;
                    spawnEnemyBullet(bcx, bcy, Math.cos(angle) * 3, Math.sin(angle) * 3,
                        { homing: 0.02, color: '#ff1744', size: 8 });
                }
            }
        } else if (et.shape === 'crystal') {
            e.shootTimer--;
            if (e.shootTimer <= 0 && e.y > 20) {
                e.shootTimer = et.shootsEvery || 120;
                var ccx = e.x + e.size / 2, ccy = e.y + e.size / 2;
                for (var cc = 0; cc < (et.shootsCount || 8); cc++) {
                    var ca = (cc / 8) * Math.PI * 2 + e.wobble * 0.1;
                    spawnEnemyBullet(ccx, ccy, Math.cos(ca) * 2.8, Math.sin(ca) * 2.8,
                        { color: '#00e5ff', size: 6 });
                }
            }
        } else if (et.shape === 'barrier') {
            e.x += e.vx;
            if (e.x <= 5 || e.x + (et.barWidth || 60) >= canvas.width - 5) {
                e.vx *= -1;
                e.x = Math.max(5, Math.min(canvas.width - (et.barWidth || 60) - 5, e.x));
            }
            e.y += e.speed;
        } else if (et.shape === 'teleporter') {
            e.teleportTimer--;
            if (e.teleportTimer <= 0) {
                e.teleportTimer = et.teleportEvery || 90;
                addParticles(e.x + e.size / 2, e.y + e.size / 2, '#e040fb', 15, 10);
                var tpx = player.x + (Math.random() - 0.5) * 200;
                var tpy = player.y - 100 - Math.random() * 100;
                e.x = Math.max(20, Math.min(canvas.width - e.size - 20, tpx));
                e.y = Math.max(20, tpy);
                e.baseX = e.x;
            }
        } else if (et.shape === 'magnet_enemy') {
            var mdx = (e.x + e.size / 2) - px;
            var mdy = (e.y + e.size / 2) - py;
            var mdist = Math.hypot(mdx, mdy) || 1;
            if (mdist < (et.magnetRange || 150)) {
                player.x += (mdx / mdist) * (et.magnetForce || 0.15);
                player.y += (mdy / mdist) * (et.magnetForce || 0.15);
            }
            e.y += e.speed;
        } else if (et.shape === 'doppel') {
            var mirrorX = canvas.width - player.x - player.size / 2;
            e.x += (mirrorX - e.size / 2 - e.x) * 0.05;
            e.y += (player.y - e.y) * 0.02 + 0.15;
        } else if (et.shape === 'laser') {
            e.laserTimer--;
            if (!e.laserCharging && e.laserTimer <= 0) {
                e.laserCharging = true;
                e.laserTimer = et.laserDuration || 30;
            } else if (e.laserCharging && e.laserTimer <= 0) {
                e.laserCharging = false;
                e.laserTimer = et.chargeTime || 60;
            }
            e.y += e.speed * 0.5;
        } else {
            e.y += e.speed;
            e.x += Math.sin(e.wobble) * 1.0;
        }

        // Лазер
        if (et.shape === 'laser' && e.laserCharging && buff.phantom <= 0) {
            var lx = e.x + e.size / 2;
            if (Math.abs(px - lx) < 5 && py < e.y + e.size) {
                if (player.damageFlash <= 0) playerTakeDamage();
            }
        }

        // Урон от игрока (фантом)
        if (mode.isRoguelike && playerDamage > 0 && buff.phantom > 0) {
            var collidesP = e.x < player.x + player.size && e.x + e.size > player.x &&
                            e.y < player.y + player.size && e.y + e.size > player.y;
            if (collidesP && frame % 12 === 0) {
                e.hp -= playerDamage;
                e.hitFlash = 6;
                addParticles(e.x + e.size/2, e.y + e.size/2, '#fff', 5, 6);
            }
        }

        // Столкновение
        var collideW = et.shape === 'barrier' ? (et.barWidth || 60) : e.size;
        var collideH = et.shape === 'barrier' ? 15 : e.size;
        var collides = e.x < player.x + player.size && e.x + collideW > player.x &&
                       e.y < player.y + player.size && e.y + collideH > player.y;

        if (collides) {
            if (buff.phantom > 0) continue;
            if (et.shape === 'ghost' && e.ghostAlpha < 0.5) continue;

            if (mode.isRoguelike && thornsDamage > 0) {
                e.hp -= thornsDamage;
                e.hitFlash = 6;
                addParticles(e.x + e.size/2, e.y + e.size/2, '#aed581', 6, 6);
            }

            if (mode.isRoguelike && playerDamage > 0) {
                e.hp -= playerDamage;
                e.hitFlash = 6;
            }

            if (et.shape === 'snake') {
                var sdx = px - (e.x + e.size / 2), sdy = py - (e.y + e.size / 2);
                var sd = Math.hypot(sdx, sdy) || 1;
                player.x += (sdx / sd) * 40;
                player.y += (sdy / sd) * 40;
                player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
                player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
            } else if (et.shape === 'ice') {
                if (player.frozen <= 0) {
                    player.frozen = 60;
                    player.damageFlash = 12;
                    damageFlash = 0.6;
                    addParticles(px, py, '#00e5ff', 15, 10);
                    showToast('🧊 Заморожен!', 'info');
                    resetCombo();
                }
            } else {
                if (player.damageFlash <= 0) playerTakeDamage();
            }
            if (e.hp <= 0) {
                if (et.explodes) explodeBomber(e);
            }
        }
    }

    // Уборка врагов
    enemies = enemies.filter(function(en) {
        if (en.hp <= 0) return false;
        if (en.y >= canvas.height + 30) {
    // 🔧 ФИКС: не даём бомберу убить игрока после его смерти
    if (en.t.explodes && lives > 0 && !gameOver) explodeBomber(en, true);
            var luckBonus = coreBonusCache.luck;
            if (mode.isRoguelike && runUpgrades.luck) luckBonus += runUpgrades.luck * 0.10;
            var rand = Math.random() + luckBonus;
            var ecx = en.x + en.size / 2, ecy = en.y + en.size / 2;
            if (rand < 0.03) spawnDrop('bomb', ecx, ecy);
            else if (rand < 0.06) spawnDrop('killall', ecx, ecy);
            else if (rand < 0.10) spawnDrop('magnet', ecx, ecy);
            else if (rand < 0.13) spawnDrop('freeze', ecx, ecy);
            else if (rand < 0.16) spawnDrop('speedBoost', ecx, ecy);
            else if (rand < 0.19) spawnDrop('x2gold', ecx, ecy);
            else if (rand < 0.215) spawnDrop('phantom', ecx, ecy);
            else if (rand < 0.235) spawnDrop('medkit', ecx, ecy);
            else if (rand < (mode.isRoguelike ? 0.30 : 0.245) + luckBonus) spawnDrop('chest', ecx, ecy);
            return false;
        }
        return true;
    });

    // Chain lightning
    if (mode.isRoguelike && chainLightning > 0 && frame % 20 === 0) {
        enemies.forEach(function(e) {
            if (e.hp <= 0 && !e._chainDone) {
                e._chainDone = true;
                var best = null, bestD = 200;
                var ex = e.x + e.size/2, ey = e.y + e.size/2;
                enemies.forEach(function(other) {
                    if (other === e) return;
                    var ox = other.x + other.size/2, oy = other.y + other.size/2;
                    var d = Math.hypot(ex - ox, ey - oy);
                    if (d < bestD) { bestD = d; best = other; }
                });
                if (best) {
                    best.hp -= chainLightning;
                    best.hitFlash = 8;
                    addParticles(best.x + best.size/2, best.y + best.size/2, '#fff59d', 6, 6);
                }
            }
        });
    }

    // Вражеские пули
    for (var bi = enemyBullets.length - 1; bi >= 0; bi--) {
        var b = enemyBullets[bi];
        if (b.homing > 0) {
            var bangle = Math.atan2(py - b.y, px - b.x);
            b.vx += Math.cos(bangle) * b.homing * 3;
            b.vy += Math.sin(bangle) * b.homing * 3;
        }
        b.x += b.vx; b.y += b.vy; b.life--;
        if (b.life <= 0 || b.x < -20 || b.x > canvas.width + 20 || b.y > canvas.height + 20 || b.y < -40) {
            enemyBullets.splice(bi, 1); continue;
        }
        if (rectsCollide(player, { x: b.x - b.size/2, y: b.y - b.size/2, size: b.size })) {
            if (buff.phantom <= 0 && player.damageFlash <= 0) playerTakeDamage();
            enemyBullets.splice(bi, 1);
        }
    }

    // Боссы — с защитой от индексов
    for (var bossI = bosses.length - 1; bossI >= 0; bossI--) {
        var boss = bosses[bossI];
        if (!boss) continue;

        if (boss.entering) {
            boss.y += 1.5;
            if (boss.y >= 60) { boss.y = 60; boss.entering = false; }
            continue;
        }
        if (bossState !== 'duel') continue;
        boss.wobble += 0.05;
        boss.rotation += 0.01;
        if (boss.hitFlash > 0) boss.hitFlash--;

        var hpPct = boss.hp / boss.maxHp;
        if (hpPct <= 0.33) boss.phase = 3;
        else if (hpPct <= 0.66) boss.phase = 2;
        else boss.phase = 1;

        // Босс работает по понятному циклу:
        // ожидание → телеграф → атака → короткое окно уязвимости.
        // Это даёт игроку честный момент для контратаки вместо постоянного
        // контакта, в котором раньше босс фактически не давал себя убить.
        if (boss.contactCooldown > 0) boss.contactCooldown--;
        if (boss.vulnerableTimer > 0) {
            boss.vulnerableTimer--;
        } else if (boss.telegraphTimer > 0) {
            boss.telegraphTimer--;
            if (boss.telegraphTimer <= 0) {
                boss.fireNow = true;
                boss.vulnerableTimer = 36;
            }
        } else if (!boss.fireNow) {
            boss.shootTimer--;
            if (boss.shootTimer <= 0) boss.telegraphTimer = 30;
        }

        if (boss.id === 'dragon') {
            boss.x = canvas.width / 2 - boss.size / 2 + Math.sin(boss.wobble * 0.5) * 150;
            boss.y = 60 + Math.sin(boss.wobble * 0.3) * 20;
            if (boss.fireNow) {
                var dbx = boss.x + boss.size / 2, dby = boss.y + boss.size / 2;
                for (var d2 = -boss.phase; d2 <= boss.phase; d2++) {
                    spawnEnemyBullet(dbx, dby + 20, d2 * 1.5, 3.5, { color: '#ff5252', size: 9 });
                }
                boss.shootTimer = 60 - boss.phase * 12;
                boss.fireNow = false;
            }
        } else if (boss.id === 'titan') {
            boss.x = canvas.width / 2 - boss.size / 2 + Math.sin(boss.wobble * 0.4) * 100;
            boss.y = 80 + Math.sin(boss.wobble * 0.5) * 15;
            if (boss.fireNow) {
                var tbx = boss.x + boss.size / 2, tby = boss.y + boss.size / 2;
                for (var t1 = -2; t1 <= 2; t1++) {
                    spawnEnemyBullet(tbx, tby + 20, t1 * 1.2, 2.5, { color: '#00e5ff', size: 10 });
                }
                boss.shootTimer = 80 - boss.phase * 15;
                boss.fireNow = false;
            }
        } else if (boss.id === 'devourer') {
            boss.x = canvas.width / 2 - boss.size / 2 + Math.sin(boss.wobble * 0.3) * 80;
            boss.y = 70 + Math.sin(boss.wobble * 0.4) * 20;
            var ddx = (boss.x + boss.size / 2) - px;
            var ddy = (boss.y + boss.size / 2) - py;
            var dd = Math.hypot(ddx, ddy) || 1;
            player.x += (ddx / dd) * 0.05 * boss.phase;
            player.y += (ddy / dd) * 0.05 * boss.phase;
            player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
            player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
            if (boss.fireNow) {
                var vbx = boss.x + boss.size / 2, vby = boss.y + boss.size / 2;
                for (var v1 = 0; v1 < 12; v1++) {
                    var va = (v1 / 12) * Math.PI * 2 + boss.wobble;
                    spawnEnemyBullet(vbx, vby, Math.cos(va) * 2.5, Math.sin(va) * 2.5, { color: '#e040fb', size: 9 });
                }
                boss.shootTimer = 50 - boss.phase * 10;
                boss.fireNow = false;
            }
        }

        var bx1 = boss.x, by1 = boss.y, bs = boss.size;
        if (player.x < bx1 + bs && player.x + player.size > bx1 &&
            player.y < by1 + bs && player.y + player.size > by1) {

            if (boss.vulnerableTimer > 0 && boss.contactCooldown <= 0) {
                // У любого билда есть базовый способ убивать босса.
                // Апгрейд "Урон" напрямую усиливает этот удар.
                var contactDamage = Math.max(1, 2 + playerDamage);
                var isCrit = critChance > 0 && Math.random() < critChance;
                if (isCrit) contactDamage *= 3;
                if (titanMarkContacts !== undefined && runRelics.indexOf('titan_mark') !== -1) {
                    titanMarkContacts++;
                    if (titanMarkContacts % 3 === 0) contactDamage *= 2;
                }
                if (isCrit && bloodFangActive) {
                    lives = Math.min(Math.max(1, getClass(selectedClass).startHp), lives + 1);
                    addFloatingText(player.x + player.size / 2, player.y - 8, '+1 HP', '#ff5c7a', 14);
                }
                if (runUpgrades.berserk && lives > 0) {
                    contactDamage *= 1 + Math.max(0, 1 - (lives / Math.max(1, getClass(selectedClass).startHp))) * 2;
                }
                boss.hp -= Math.max(1, Math.floor(contactDamage));
                boss.hitFlash = 8;
                boss.contactCooldown = 8;
                addFloatingText(bx1 + bs / 2, by1 - 8, '-' + Math.max(1, Math.floor(contactDamage)), '#7cffb2', 18);
                addParticles(bx1 + bs / 2, by1 + bs / 2, '#7cffb2', 8, 7);
                playSFX('hit');
            } else if (buff.phantom <= 0 && player.damageFlash <= 0) {
                // Защитный билд тоже должен иметь рабочий путь к победе:
                // шипы отражают часть урона босса обратно в окно контакта.
                if (thornsDamage > 0 && boss.contactCooldown <= 0) {
                    boss.hp -= thornsDamage;
                    boss.hitFlash = 6;
                    boss.contactCooldown = 18;
                    addFloatingText(bx1 + bs / 2, by1 - 8, '-' + thornsDamage + ' THORNS', '#aed581', 15);
                    addParticles(bx1 + bs / 2, by1 + bs / 2, '#aed581', 6, 5);
                }
                playerTakeDamage();
            }
        }

        if (boss.hp <= 0) {
            var b = boss.type;
            var saveB = getSave();
            var reward = boss.reward || {};
            bosses.splice(bossI, 1);

            bossState = 'victory';
            bossStateTimer = 75;
            bossAnnouncement = '✦ BOSS DEFEATED ✦';
            bossAnnouncementTimer = 75;
            bossDuelId = boss.id;
            enemies = [];
            enemyBullets = [];
            webs = [];
            meteors = [];
            updateBossDuelHUD();

            addParticles(bx1 + bs/2, by1 + bs/2, b.glow || '#fff', 60, 25);
            addParticles(bx1 + bs/2, by1 + bs/2, '#fff', 30, 18);
            screenShake = 40;
            playSFX('boss');
            showToast('🏆 ' + (b.icon || '') + ' ' + (b.name || 'Босс') + ' ПОВЕРЖЕН!', 'legendary');

            saveB.bossesKilled = (saveB.bossesKilled || 0) + 1;
            if (reward.gold) { saveB.bank += reward.gold; goldEarned += reward.gold; }
            if (reward.crystals) {
                saveB.coreCrystals = (saveB.coreCrystals || 0) + reward.crystals;
                crystalsEarned += reward.crystals;
            }
            if (reward.skin && SKINS[reward.skin] && saveB.ownedSkins.indexOf(reward.skin) === -1) {
                saveB.ownedSkins.push(reward.skin);
            }
            persist();
            updateMainMenuStats();
            checkAchievements();
            bossI--; // защита от сдвига индексов
        }
    }

    updateBossDuelHUD();

    // Паутина
    player.inWeb = false;
    for (var wi = 0; wi < webs.length; wi++) {
        var w = webs[wi];
        if (Math.hypot(px - w.x, py - w.y) < w.size / 2) { player.inWeb = true; break; }
    }

    // Частицы
    for (var pi = particles.length - 1; pi >= 0; pi--) {
        var p = particles[pi];
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.94; p.vy *= 0.94;
        p.vy += p.gravity || 0;
        p.life -= 0.028;
        if (p.life <= 0) particles.splice(pi, 1);
    }

    // Тексты
    for (var fi = floatingTexts.length - 1; fi >= 0; fi--) {
        var ft = floatingTexts[fi];
        ft.y += ft.vy;
        ft.life -= 0.022;
        if (ft.life <= 0) floatingTexts.splice(fi, 1);
    }

    if (frame % 6 === 0) updateHUD();
}

// ==========================================================
//   DRAW
// ==========================================================
function getCoinGradient(big) {
    if (big && gradCache.coinBig) return gradCache.coinBig;
    if (!big && gradCache.coinSmall) return gradCache.coinSmall;
    var s = getSave();
    var theme = THEMES[s.equippedTheme] || THEMES.cosmos;
    var size = 18;
    var g = ctx.createRadialGradient(-size * 0.12, -size * 0.12, size * 0.1, 0, 0, size / 2);
    if (big) {
        g.addColorStop(0, '#fff0f5'); g.addColorStop(0.5, '#ff5c7a'); g.addColorStop(1, '#c62828');
        gradCache.coinBig = g;
    } else {
        g.addColorStop(0, theme.coinSmall1); g.addColorStop(0.6, theme.coinSmall2); g.addColorStop(1, theme.coinSmall3);
        gradCache.coinSmall = g;
    }
    return g;
}

function drawPlayer() {
    var s = getSave();
    var skin = SKINS[s.equippedSkin] || SKINS.default;
    var c = skin.colors;
    var t = performance.now();

    // Аура мага
    if (currentMode === 'rogue' && getClass(selectedClass).passiveId === 'aura') {
        ctx.save();
        ctx.globalAlpha = 0.25 + Math.sin(t / 300) * 0.1;
        var ag = ctx.createRadialGradient(player.x + player.size/2, player.y + player.size/2, 0,
                                          player.x + player.size/2, player.y + player.size/2, 60);
        ag.addColorStop(0, 'rgba(224,64,251,0.5)');
        ag.addColorStop(1, 'rgba(224,64,251,0)');
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.arc(player.x + player.size/2, player.y + player.size/2, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Тень
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(player.x + player.size/2, player.y + player.size + 4, player.size*0.5, player.size*0.15, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Аура
    ctx.save();
    var auraGrad = ctx.createRadialGradient(
        player.x + player.size/2, player.y + player.size/2, player.size * 0.4,
        player.x + player.size/2, player.y + player.size/2, player.size * 1.2
    );
    var auraColor = player.frozen > 0 ? '0,229,255' : '79,195,247';
    auraGrad.addColorStop(0, 'rgba(' + auraColor + ',0.35)');
    auraGrad.addColorStop(1, 'rgba(' + auraColor + ',0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size*1.2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    if (player.isBlinking && player.damageFlash > 0) ctx.globalAlpha = 0.4;
    if (buff.phantom > 0) ctx.globalAlpha *= 0.5;
    if (c.ghostly) ctx.globalAlpha *= 0.65;
    if (c.pulse) {
        var p = 0.7 + Math.sin(t / 200) * 0.3;
        ctx.globalAlpha *= p;
    }

    var cx = player.x + player.size/2, cy = player.y + player.size/2;
    ctx.translate(cx, cy);
    ctx.rotate(player.tilt);
    var breathScale = 1 + Math.sin(player.breath) * 0.05;
    ctx.scale(breathScale, 2 - breathScale);
    ctx.translate(-player.size/2, -player.size/2);

    var topColor = c.top, bottomColor = c.bottom;
    if (c.rainbow || c.legend) {
        var hue = (t / 8) % 360;
        topColor = 'hsl(' + hue + ', 100%, 75%)';
        bottomColor = 'hsl(' + ((hue+60)%360) + ', 100%, 45%)';
    }
    if (c.police) {
        var flash = Math.floor(t / 300) % 2;
        topColor = flash ? '#2196f3' : '#f44336';
        bottomColor = flash ? '#0d47a1' : '#b71c1c';
    }
    if (player.frozen > 0) { topColor = '#b3e5fc'; bottomColor = '#0277bd'; }

    ctx.shadowColor = player.frozen > 0 ? '#00e5ff' : c.glow;
    ctx.shadowBlur = 24;
    var grad = ctx.createLinearGradient(0, 0, 0, player.size);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, player.size, player.size, 8);
    ctx.fill();

    // Глаза
    ctx.shadowBlur = 0;
    var eyeY = player.size * 0.38;
    var eyeSpacing = player.size * 0.22;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.size/2 - eyeSpacing, eyeY, 3.5, 0, Math.PI*2);
    ctx.arc(player.size/2 + eyeSpacing, eyeY, 3.5, 0, Math.PI*2);
    ctx.fill();
    var lookX = player.lastDirX, lookY = player.lastDirY;
    if (Math.abs(lookX) < 0.05 && Math.abs(lookY) < 0.05) { lookX = 0; lookY = 0.5; }
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.size/2 - eyeSpacing + lookX*1.8, eyeY + lookY*1.8, 1.8, 0, Math.PI*2);
    ctx.arc(player.size/2 + eyeSpacing + lookX*1.8, eyeY + lookY*1.8, 1.8, 0, Math.PI*2);
    ctx.fill();

    // Урон
    if (player.damageFlash > 0) {
        ctx.globalAlpha = player.damageFlash / 18 * 0.6;
        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.roundRect(0, 0, player.size, player.size, 8);
        ctx.fill();
    }

    // Щиты
    if (playerShields > 0) {
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 2;
        for (var sh = 0; sh < playerShields; sh++) {
            var shA = (t / 400 + sh * Math.PI * 2 / Math.max(1, playerShields)) % (Math.PI * 2);
            var shR = player.size / 2 + 12;
            var shX = player.size/2 + Math.cos(shA) * shR;
            var shY = player.size/2 + Math.sin(shA) * shR;
            ctx.beginPath();
            ctx.arc(shX, shY, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#4fc3f7';
            ctx.fill();
        }
    }

    ctx.restore();
}

function drawCoins() {
    var s = getSave();
    var theme = THEMES[s.equippedTheme] || THEMES.cosmos;
    for (var ci = 0; ci < coins.length; ci++) {
        var c = coins[ci];
        var isBig = c.value >= 5;
        ctx.save();
        ctx.shadowColor = isBig ? '#ff5c7a' : theme.glow;
        ctx.shadowBlur = isBig ? 18 : 12;
        var scaleX = Math.abs(Math.cos(c.phase));
        var scaleY = Math.abs(Math.cos(c.phase * 0.5) * 0.3 + 0.7);
        ctx.translate(c.x + c.size / 2, c.y + c.size / 2);
        ctx.scale(scaleX, scaleY);
        ctx.fillStyle = getCoinGradient(isBig);
        ctx.beginPath(); ctx.arc(0, 0, c.size / 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        if (c.value > 1) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px Segoe UI, Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000'; ctx.shadowBlur = 3;
            ctx.fillText('×' + c.value, c.x + c.size / 2, c.y + c.size / 2 + 4);
            ctx.shadowBlur = 0;
        }
    }
}

function drawDrop(d) {
    var style = DROP_STYLE[d.type] || DROP_STYLE.magnet;
    var t = performance.now();
    ctx.save();
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = 20;
    var pulse = 1 + Math.sin(t / 150) * 0.1;
    ctx.translate(d.x, d.y);
    ctx.scale(pulse, pulse);
    var g = ctx.createRadialGradient(0, -3, 2, 0, 0, d.size / 2);
    g.addColorStop(0, style.c1); g.addColorStop(0.6, style.c2); g.addColorStop(1, style.c3);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, d.size / 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(style.emoji, 0, 1);
    ctx.restore();
}

function drawEnemyBullet(b) {
    ctx.save();
    ctx.shadowColor = b.color; ctx.shadowBlur = 12;
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function drawWeb(w) {
    var alpha = Math.min(1, w.life / 60);
    var radius = w.size / 2;
    var spokes = 10;

    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.globalAlpha = alpha * 0.72;
    ctx.strokeStyle = '#dce7f7';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(190,220,255,.45)';
    ctx.shadowBlur = 5;

    // Радиальные нити — от центра к краям.
    ctx.lineWidth = 1.1;
    for (var i = 0; i < spokes; i++) {
        var a = (i / spokes) * Math.PI * 2;
        var endR = radius * (0.9 + 0.1 * Math.sin(i * 1.7));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * endR, Math.sin(a) * endR);
        ctx.stroke();
    }

    // Концентрические нити — именно они дают силуэту настоящей паутины.
    ctx.shadowBlur = 2;
    ctx.lineWidth = 0.9;
    var rings = 4;
    for (var r = 1; r <= rings; r++) {
        var ringR = radius * (r / rings) * 0.9;
        ctx.beginPath();
        for (var j = 0; j <= spokes; j++) {
            var a2 = (j / spokes) * Math.PI * 2;
            var wobble = 1 + 0.045 * Math.sin(j * 2.4 + r * 0.8);
            var rr = ringR * wobble;
            var x = Math.cos(a2) * rr;
            var y = Math.sin(a2) * rr;
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // Маленький узел в центре и мягкое свечение.
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f4f8ff';
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawMonster(e) {
    var t = e.t;
    ctx.save();
    ctx.shadowColor = t.glow;
    ctx.shadowBlur = e.hitFlash > 0 ? 30 : 14;
    var cx = e.x + e.size / 2, cy = e.y + e.size / 2, r = e.size / 2;
    if (t.shape === 'ghost') ctx.globalAlpha = e.ghostAlpha;
    if (e.hitFlash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.fill();
    }
    var g = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.size);
    g.addColorStop(0, t.c1);
    g.addColorStop(1, t.c2);
    ctx.fillStyle = g;
    if (t.shape === 'square' || t.shape === 'hex' || t.shape === 'boss' || t.shape === 'crystal') {
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    } else if (t.shape === 'barrier') {
        ctx.beginPath();
        ctx.roundRect(e.x, e.y, t.barWidth || 60, 15, 4);
        ctx.fill();
    } else if (t.shape === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(cx, e.y); ctx.lineTo(e.x + e.size, cy); ctx.lineTo(cx, e.y + e.size); ctx.lineTo(e.x, cy);
        ctx.closePath(); ctx.fill();
    } else if (t.shape === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + e.size, e.y); ctx.lineTo(cx, e.y + e.size);
        ctx.closePath(); ctx.fill();
    } else {
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }
    // Глаза
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 2, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 1, 1.2, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawBoss(boss) {
    var b = boss.type;
    ctx.save();
    ctx.shadowColor = boss.vulnerableTimer > 0 ? '#7cffb2' : b.glow;
    ctx.shadowBlur = boss.hitFlash > 0 ? 40 : (boss.vulnerableTimer > 0 ? 38 : (boss.telegraphTimer > 0 ? 32 : 25));
    var cx = boss.x + boss.size / 2, cy = boss.y + boss.size / 2, r = boss.size / 2;

    if (boss.telegraphTimer > 0) {
        var charge = 1 - boss.telegraphTimer / 30;
        ctx.strokeStyle = 'rgba(255,92,122,' + (0.35 + charge * 0.55) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 10 + charge * 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * charge);
        ctx.stroke();
    } else if (boss.vulnerableTimer > 0) {
        ctx.strokeStyle = 'rgba(124,255,178,.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 9, 0, Math.PI * 2);
        ctx.stroke();
    }
    if (boss.hitFlash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2); ctx.fill();
    }
    var g = ctx.createLinearGradient(cx, boss.y, cx, boss.y + boss.size);
    g.addColorStop(0, b.c1);
    g.addColorStop(1, b.c2);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - r*0.3, cy - r*0.15, 6, 0, Math.PI * 2);
    ctx.arc(cx + r*0.3, cy - r*0.15, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - r*0.3, cy - r*0.15, 3, 0, Math.PI * 2);
    ctx.arc(cx + r*0.3, cy - r*0.15, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // HP-бар
    ctx.save();
    var barW = 260, barH = 16;
    var barX = canvas.width / 2 - barW / 2;
    var barY = 10;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(barX - 3, barY - 3, barW + 6, barH + 6);
    ctx.fillStyle = 'rgba(60,0,20,0.9)';
    ctx.fillRect(barX, barY, barW, barH);
    var hpPct = boss.hp / boss.maxHp;
    ctx.fillStyle = hpPct > 0.5 ? '#ff1744' : (hpPct > 0.25 ? '#ff5722' : '#7f0000');
    ctx.fillRect(barX, barY, barW * hpPct, barH);
    ctx.strokeStyle = '#ffd93d'; ctx.lineWidth = 2;
    ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Segoe UI, Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
    ctx.fillText(b.icon + ' ' + b.name + '  —  Фаза ' + boss.phase + '/3', canvas.width / 2, barY + barH + 16);
    ctx.restore();
}

function drawOrbitals() {
    orbitals.forEach(function(o) {
        if (!o.x) return;
        ctx.save();
        ctx.shadowColor = '#7c4dff';
        ctx.shadowBlur = 20;
        var g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.size);
        g.addColorStop(0, '#fff');
        g.addColorStop(0.5, '#b388ff');
        g.addColorStop(1, '#4a148c');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });
}

function draw() {
    ctx.save();
    if (screenShake > 0.5) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    var s = getSave();
    var theme = THEMES[s.equippedTheme] || THEMES.cosmos;
    var bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, theme.bg1);
    bgGrad.addColorStop(0.5, theme.bg2);
    bgGrad.addColorStop(1, theme.bg3);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-30, -30, canvas.width + 60, canvas.height + 60);

    // Параллакс
    for (var psi = 0; psi < parallaxStars.length; psi++) {
        var ps = parallaxStars[psi];
        var alpha = 0.3 + Math.sin(ps.twinkle) * 0.3 + 0.3;
        ctx.globalAlpha = alpha * (ps.layer === 2 ? 1 : ps.layer === 1 ? 0.8 : 0.5);
        ctx.fillStyle = ps.layer === 2 ? '#fff' : (ps.layer === 1 ? '#b3d9ff' : '#8ab4ff');
        ctx.beginPath(); ctx.arc(ps.x, ps.y, ps.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    drawWeather();

    // Метеоры
    for (var mi = 0; mi < meteors.length; mi++) {
        var m = meteors[mi];
        ctx.save();
        ctx.globalAlpha = Math.max(0, m.life) * 0.85;
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = m.color; ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx / Math.hypot(m.vx, m.vy) * m.len, m.y - m.vy / Math.hypot(m.vx, m.vy) * m.len);
        ctx.stroke();
        ctx.restore();
    }

    // Темнота (волна)
    if (currentMode === 'rogue' && currentWaveModifier && currentWaveModifier.darkness) {
        var pxc = player.x + player.size/2, pyc = player.y + player.size/2;
        var darkGrad = ctx.createRadialGradient(pxc, pyc, 40, pxc, pyc, 200);
        darkGrad.addColorStop(0, 'rgba(0,0,0,0)');
        darkGrad.addColorStop(1, 'rgba(0,0,0,0.9)');
        ctx.fillStyle = darkGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (buff.freeze > 0) {
        ctx.fillStyle = 'rgba(0,229,255,0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (buff.phantom > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Частицы
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (var wi = 0; wi < webs.length; wi++) drawWeb(webs[wi]);
    drawPlayer();
    drawOrbitals();
    drawCoins();
    for (var di = 0; di < drops.length; di++) drawDrop(drops[di]);
    for (var ei = 0; ei < enemies.length; ei++) drawMonster(enemies[ei]);
    for (var bi = 0; bi < bosses.length; bi++) drawBoss(bosses[bi]);
    for (var bui = 0; bui < enemyBullets.length; bui++) drawEnemyBullet(enemyBullets[bui]);

    // Тексты
    for (var fi = 0; fi < floatingTexts.length; fi++) {
        var ft = floatingTexts[fi];
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold ' + (ft.size || 20) + 'px Segoe UI, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    if (damageFlash > 0) {
        ctx.fillStyle = 'rgba(255,0,0,' + (damageFlash * 0.4) + ')';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (currentMode === 'rogue' && noHitWaveActive) {
        ctx.save();
        ctx.fillStyle = noHitWaveDamage === 0 ? 'rgba(124,255,178,0.9)' : 'rgba(255,92,122,0.9)';
        ctx.font = 'bold 14px Segoe UI, Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
        ctx.fillText(noHitWaveDamage === 0 ? '✨ ИДЕАЛЬНО!' : '❌ Урон получен', canvas.width / 2, canvas.height - 30);
        ctx.restore();
    }

    if (combo >= 3) {
        ctx.save();
        var comboS = 1 + Math.sin(performance.now() / 150) * 0.08;
        ctx.translate(canvas.width - 60, canvas.height - 50);
        ctx.scale(comboS, comboS);
        ctx.globalAlpha = 0.9;
        ctx.shadowColor = '#ff9800'; ctx.shadowBlur = 20;
        ctx.fillStyle = '#ff9800';
        ctx.font = 'bold 22px Segoe UI, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('×' + getComboMultiplier(), 0, 0);
        ctx.font = 'bold 12px Segoe UI, Arial';
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 8;
        ctx.fillText(combo + ' подряд', 0, 16);
        ctx.restore();
    }

    ctx.restore();
}

// ==========================================================
//   ГЛАВНЫЙ ЦИКЛ — С ЗАЩИТОЙ ОТ НАКОПЛЕНИЯ
// ==========================================================
function loop(now) {
    if (!now) now = performance.now();
    var elapsed = now - lastTime;
    lastTime = now;
    if (elapsed > 100) elapsed = 100;

    var s = getSave();
    var speedMult = s.gameSpeed || 1;
    accumulated += elapsed * speedMult;

    // 🔧 ФИКС: если accumulated накопил слишком много — сбрасываем
    if (accumulated > frameBudget * 3) {
        accumulated = frameBudget;
    }

    var stepCount = 0;
    while (accumulated >= frameBudget && stepCount < 3) {
        try { update(); } catch (e) {
            console.error('❌ update() ERROR:', e.message);
            console.error('   stack:', e.stack);
            running = false;
            if (lastErrorShown !== e.message) {
                lastErrorShown = e.message;
                if (typeof showToast === 'function') showToast('⚠ ' + e.message, 'error');
            }
        }
        accumulated -= frameBudget;
        stepCount++;
    }

    try { draw(); } catch (e) {
        console.error('❌ draw() ERROR:', e.message);
    }
    requestAnimationFrame(loop);
}

// ==========================================================
//   ИНИЦИАЛИЗАЦИЯ
// ==========================================================
renderProfilesList();

var savedLogin = getCurrentLogin();
if (savedLogin) {
    var savedProfile = loadProfile(savedLogin);
    if (savedProfile) {
        var profileInfo = getProfiles().find(function(p) { return p.login === savedLogin; });
        if (profileInfo && profileInfo.passHash) {
            loginScreen.classList.remove('hidden');
            startScreen.classList.add('hidden');
        } else {
            enterProfile(savedLogin);
        }
    } else {
        loginScreen.classList.remove('hidden');
        startScreen.classList.add('hidden');
    }
} else {
    loginScreen.classList.remove('hidden');
    startScreen.classList.add('hidden');
}

applyTheme();

console.log('✅ Starfall Dash 2.6 «Roguelike Evolution» — полностью готов!');
console.log('🎲 Рогалик: выбирай апгрейды каждые 15 сек');
console.log('⚡ Синергии: комбинируй для мощных эффектов');
console.log('🏺 Реликвии: открывай сундуки');
console.log('🌊 Волны: каждые 5 уровней — элитный модификатор');
console.log('🔧 ВСЕ ФИКСЫ БАГОВ ВНЕДРЕНЫ');

lastTime = performance.now();
requestAnimationFrame(loop);
