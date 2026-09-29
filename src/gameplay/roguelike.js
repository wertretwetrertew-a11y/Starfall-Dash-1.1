// ==========================================================
// STARFALL DASH — GAMEPLAY MODULE
// Extracted from legacy gameplay.js; global API intentionally preserved.
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

    /* Stage roster controls miniboss timing. The random elite-wave
       modifier must not leak a miniboss into early stages. */
    if (mod.spawnMiniboss && currentMode !== 'rogue') {
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