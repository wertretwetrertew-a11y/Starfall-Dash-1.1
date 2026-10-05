// ==========================================================
// STARFALL DASH — UI MODULE
// Extracted from legacy meta-ui.js; global API intentionally preserved.
// ==========================================================

//   HUD
// ==========================================================
function updateHUD() {
    hudScoreVal.textContent = score;
    hudLevelVal.textContent = level;
    if (hudLives) {
        if (currentMode === 'rogue') {
            hudLives.textContent = Math.max(0, Math.ceil(rogueHP)) + ' / ' + Math.ceil(rogueMaxHP || 100);
        } else {
            hudLives.textContent = '❤ ×' + Math.max(0, lives);
        }
    }
    // XP HUD: показываем реальный прогресс Roguelike, а не старый таймер уровня.
    var currentXP = (typeof rogueXP === 'number' && isFinite(rogueXP)) ? Math.max(0, rogueXP) : 0;
    var nextXP = (typeof rogueXPNext === 'number' && isFinite(rogueXPNext) && rogueXPNext > 0) ? rogueXPNext : 1;
    var xpPct = Math.max(0, Math.min(1, currentXP / nextXP));
    hudProgressFill.style.width = (xpPct * 100) + '%';
    var hudXpValueEl = document.getElementById('hud-xp-value');
    if (hudXpValueEl) {
        hudXpValueEl.textContent = Math.floor(currentXP) + ' / ' + Math.floor(nextXP);
    }

    if (hudMode) {
        hudMode.textContent = MODES[currentMode].name.toUpperCase();
        hudMode.className = currentMode;
    }

    if (hudTimer) {
        if (MODES[currentMode].hasTimer) {
            var remaining = Math.max(0, Math.ceil(timeLeft));
            hudTimer.textContent = '⏱ ' + remaining + 'с';
            hudTimer.style.color = remaining <= 10 ? '#ff1744' : '#4fc3f7';
        } else {
            hudTimer.textContent = formatTime(runTime);
        }
    }
}

function updateBuffBadges() {
    buffStrip.innerHTML = '';
    function add(cls, icon, sec) {
        var d = document.createElement('div');
        d.className = 'buff-dot ' + cls;
        d.textContent = icon;
        d.setAttribute('data-time', sec + 'с');
        buffStrip.appendChild(d);
    }
    if (buff.magnet > 0) add('', '🧲', Math.ceil(buff.magnet / 60));
    if (buff.freeze > 0) add('freeze', '❄', Math.ceil(buff.freeze / 60));
    if (buff.speedBoost > 0) add('speed', '⚡', Math.ceil(buff.speedBoost / 60));
    if (buff.x2gold > 0) add('x2', '✨', Math.ceil(buff.x2gold / 60));
    if (buff.phantom > 0) add('phantom', '👻', Math.ceil(buff.phantom / 60));
    if (buff.chest > 0) add('chest', '🎁', Math.ceil(buff.chest / 60));
}

function updateUpgradeStrip() {
    if (!upgradeStrip) return;
    upgradeStrip.innerHTML = '';
    if (currentMode !== 'rogue') {
        upgradeStrip.style.display = 'none';
        return;
    }
    upgradeStrip.style.display = 'flex';

    Object.keys(runUpgrades).forEach(function(id) {
        var up = UPGRADE_POOL[id];
        if (!up || runUpgrades[id] <= 0) return;
        var stack = document.createElement('div');
        stack.className = 'up-stack ' + up.rarity;
        stack.innerHTML = '<span>' + up.icon + '</span>' +
            '<span>' + up.name + '</span>' +
            '<span class="us-count">×' + runUpgrades[id] + '</span>';
        upgradeStrip.appendChild(stack);
    });

    runRelics.forEach(function(rid) {
        var rel = RELICS[rid];
        if (!rel) return;
        var stack = document.createElement('div');
        stack.className = 'up-stack ' + rel.rarity;
        stack.innerHTML = '<span>' + rel.icon + '</span>' +
            '<span>' + rel.name + '</span>';
        upgradeStrip.appendChild(stack);
    });
}

function applyTheme() {
    var s = getSave();
    var t = THEMES[s.equippedTheme] || THEMES.cosmos;
    canvas.style.background = 'linear-gradient(180deg, ' + t.bg1 + ' 0%, ' + t.bg2 + ' 50%, ' + t.bg3 + ' 100%)';
    canvas.style.boxShadow = '0 0 40px ' + t.glow + '44, inset 0 0 60px rgba(0,0,0,0.6)';
    canvas.style.borderColor = t.glow + '88';
    gradCache.coinSmall = null;
    gradCache.coinBig = null;
    if (typeof initWeather === 'function') initWeather();
}

var levelToastTimeout = null;
function showLevelToast(levelNum, goldReward, bonusStr, mult) {
    var s = getSave();
    if (!s.showLevelToast) return;
    levelToastTitle.textContent = '📈 УРОВЕНЬ ' + levelNum;
    levelToastReward.textContent = '+' + goldReward + '💰' + (bonusStr || '');
    levelToastMult.textContent = '🪙 ×' + mult + ' золота';
    levelToast.classList.add('show');
    if (levelToastTimeout) clearTimeout(levelToastTimeout);
    levelToastTimeout = setTimeout(function() {
        levelToast.classList.remove('show');
    }, 2200);
}

// ==========================================================