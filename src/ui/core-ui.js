// ==========================================================
// STARFALL DASH — UI MODULE
// Extracted from legacy meta-ui.js; global API intentionally preserved.
// ==========================================================

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
