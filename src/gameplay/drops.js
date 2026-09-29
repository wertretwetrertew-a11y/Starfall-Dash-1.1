// ==========================================================
// STARFALL DASH — GAMEPLAY MODULE
// Extracted from legacy gameplay.js; global API intentionally preserved.
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
        if (currentMode === 'rogue') {
            // Взрыв — настоящая радиусная атака с коротким визуальным следом.
            spawnRogueEnemyHazard(cx, cy, e.t.blastRadius || 95, 16, '#ff5722', 'blast');
            var pxc = player.x + player.size/2, pyc = player.y + player.size/2;
            if (Math.hypot(pxc - cx, pyc - cy) < (e.t.blastRadius || 95) &&
                buff.phantom <= 0 && player.damageFlash <= 0) {
                playerTakeDamage();
            }
        }
    } else {
        var pxc = player.x + player.size/2, pyc = player.y + player.size/2;
        if (Math.hypot(pxc - cx, pyc - cy) < (e.t.blastRadius || 100) && buff.phantom <= 0 && player.damageFlash <= 0) {
            playerTakeDamage();
        }
    }
}

// ==========================================================