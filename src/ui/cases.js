// ==========================================================
// STARFALL DASH — UI MODULE
// Extracted from legacy meta-ui.js; global API intentionally preserved.
// ==========================================================

//   КЕЙСЫ
// ==========================================================
function openCase(caseId, isFree) {
    var s = getSave();
    var c = CASES[caseId];
    if (!c) return;

    if (isFree) {
        if (!s.freeCases[caseId] || s.freeCases[caseId] <= 0) {
            showToast('Нет бесплатных кейсов', 'error');
            return;
        }
        s.freeCases[caseId]--;
    } else {
        if (s.bank < c.price) {
            showToast('Не хватает золота!', 'error');
            return;
        }
        s.bank -= c.price;
    }

    s.openedCases++;
    s.casePity = s.casePity || {};
    s.casePity[caseId] = Math.max(0, Number(s.casePity[caseId] || 0) + 1);

    // Guaranteed rarity threshold per case.
    var pityLimit = { common: 8, rare: 7, epic: 6, legendary: 5, mythic: 3 }[caseId] || 8;
    var pityThreshold = { common: 'epic', rare: 'epic', epic: 'legendary', legendary: 'mythic', mythic: 'mythic' }[caseId] || 'epic';
    var rarityRank = { common:1, rare:2, epic:3, legendary:4, mythic:5 };
    var forcePity = s.casePity[caseId] >= pityLimit;
    persist();
    updateMainMenuStats();
    updateShopBadges();
    refreshShopLiveState();
    playSFX('case');

    var roll = Math.random() * 100;
    var cum = 0;
    var droppedRarity = 'common';
    for (var i = 0; i < c.dropTable.length; i++) {
        cum += c.dropTable[i].chance;
        if (roll <= cum) { droppedRarity = c.dropTable[i].rarity; break; }
    }
    if (forcePity) {
        var eligible = c.dropTable.filter(function(entry) {
            return rarityRank[entry.rarity] >= rarityRank[pityThreshold];
        });
        if (eligible.length) {
            var total = eligible.reduce(function(sum, entry) { return sum + entry.chance; }, 0);
            var pityRoll = Math.random() * total, pityCum = 0;
            droppedRarity = eligible[eligible.length - 1].rarity;
            eligible.some(function(entry) {
                pityCum += entry.chance;
                if (pityRoll <= pityCum) { droppedRarity = entry.rarity; return true; }
                return false;
            });
        }
    }

    var allPool = [];
    Object.keys(SKINS).forEach(function(k) {
        var sk = SKINS[k];
        if (sk.rarity === droppedRarity)
            allPool.push({ type:'skin', id:sk.id, data:sk, icon:'🎨', label:'СКИН' });
    });
    if (caseId !== 'common') {
        Object.keys(SOUND_PACKS).forEach(function(k) {
            var sp = SOUND_PACKS[k];
            if (sp.rarity === droppedRarity)
                allPool.push({ type:'sound', id:sp.id, data:sp, icon:sp.icon, label:'ЗВУК' });
        });
    }
    if (caseId === 'epic' || caseId === 'legendary' || caseId === 'mythic') {
        Object.keys(MUSIC_TRACKS).forEach(function(k) {
            var mt = MUSIC_TRACKS[k];
            if (mt.rarity === droppedRarity)
                allPool.push({ type:'music', id:mt.id, data:mt, icon:mt.icon, label:'МУЗЫКА' });
        });
    }
    if (caseId === 'legendary' || caseId === 'mythic') {
        Object.keys(CARDS).forEach(function(k) {
            var cd = CARDS[k];
            if (cd.rarity === droppedRarity)
                allPool.push({ type:'card', id:cd.id, data:cd, icon:cd.icon, label:'КАРТА' });
        });
    }

    if (allPool.length === 0) {
        if (rarityRank[droppedRarity] >= rarityRank[pityThreshold]) s.casePity[caseId] = 0;
        var refund = DUPLICATE_REFUND[droppedRarity] || 50;
        var goldReward = {
            type: 'gold', id: 'gold_' + droppedRarity,
            data: { name: '+' + refund + ' золота', rarity: droppedRarity },
            icon: '💰', label: 'ЗОЛОТО', goldAmount: refund
        };
        s.bank += refund;
        s.totalRefund += refund;
        persist();
        updateMainMenuStats();
        refreshShopLiveState();
        showCaseAnimation(goldReward, caseId, isFree);
        return;
    }

    var reward = allPool[Math.floor(Math.random() * allPool.length)];
    var owned = false;
    if (reward.type === 'skin') owned = s.ownedSkins.indexOf(reward.id) !== -1;
    else if (reward.type === 'sound') owned = s.ownedSoundPacks.indexOf(reward.id) !== -1;
    else if (reward.type === 'music') owned = s.ownedMusic.indexOf(reward.id) !== -1;
    else if (reward.type === 'card') owned = s.ownedCards.indexOf(reward.id) !== -1;

    if (owned) {
        if (rarityRank[droppedRarity] >= rarityRank[pityThreshold]) s.casePity[caseId] = 0;
        var refundAmount = DUPLICATE_REFUND[droppedRarity] || 50;
        var goldReward2 = {
            type: 'gold', id: 'gold_' + droppedRarity + '_' + Date.now(),
            data: { name: '+' + refundAmount + ' золота', rarity: droppedRarity },
            icon: '💰', label: 'ДУБЛИКАТ', goldAmount: refundAmount
        };
        s.bank += refundAmount;
        s.totalRefund += refundAmount;
        persist();
        updateMainMenuStats();
        refreshShopLiveState();
        showCaseAnimation(goldReward2, caseId, isFree);
        return;
    }

    if (rarityRank[droppedRarity] >= rarityRank[pityThreshold]) s.casePity[caseId] = 0;
    if (reward.type === 'skin') s.ownedSkins.push(reward.id);
    else if (reward.type === 'sound') { s.ownedSoundPacks.push(reward.id); s.equippedSoundPack = reward.id; }
    else if (reward.type === 'music') { s.ownedMusic.push(reward.id); s.equippedMusic = reward.id; }
    else if (reward.type === 'card') s.ownedCards.push(reward.id);
    persist();
    updateMainMenuStats();
    updateShopBadges();
    refreshShopLiveState();
    showCaseAnimation(reward, caseId, isFree);
}

function showCaseAnimation(reward, caseId, isFree) {
    caseReel.innerHTML = '';
    caseResult.textContent = '';
    caseResult.classList.remove('show');
    caseWindow.className = 'case-window ' + (CASES[caseId] ? CASES[caseId].id : 'common');
    var caseHero = document.getElementById('case-hero');
    var caseVisual = document.getElementById('case-box-visual');
    var caseMeta = document.getElementById('case-meta');
    var pityText = document.getElementById('case-pity-text');
    var pityFill = document.getElementById('case-pity-fill');
    var pityLimit = { common:8, rare:7, epic:6, legendary:5, mythic:3 }[caseId] || 8;
    var pityCount = Math.min(pityLimit, Number((getSave().casePity || {})[caseId] || 0));
    caseTitle.textContent = CASES[caseId].name;
    if (caseVisual) {
        caseVisual.textContent = '📦';
        caseVisual.dataset.rarity = caseId;
    }
    if (caseMeta) {
        caseMeta.textContent = (isFree ? '🎁 Бесплатный' : '💰 ' + formatNumber(CASES[caseId].price)) + '  •  В наличии: ' +
            (isFree ? Number((getSave().freeCases || {})[caseId] || 0) : '—');
    }
    if (pityText) pityText.textContent = pityCount + ' / ' + pityLimit;
    if (pityFill) pityFill.style.width = (pityCount / pityLimit * 100) + '%';
    if (caseHero) caseHero.classList.remove('revealed');
    caseCloseBtn.disabled = true;
    caseCloseBtn.textContent = 'Крутим...';

    var backgroundItems = [];
    Object.keys(SKINS).forEach(function(k) {
        backgroundItems.push({ icon:'🎨', label:'СКИН', rarity:SKINS[k].rarity });
    });
    Object.keys(SOUND_PACKS).forEach(function(k) {
        backgroundItems.push({ icon:SOUND_PACKS[k].icon, label:'ЗВУК', rarity:SOUND_PACKS[k].rarity });
    });
    Object.keys(MUSIC_TRACKS).forEach(function(k) {
        backgroundItems.push({ icon:MUSIC_TRACKS[k].icon, label:'МУЗЫКА', rarity:MUSIC_TRACKS[k].rarity });
    });
    Object.keys(CARDS).forEach(function(k) {
        backgroundItems.push({ icon:CARDS[k].icon, label:'КАРТА', rarity:CARDS[k].rarity });
    });

    for (var i = 0; i < 25; i++) {
        var item = backgroundItems[Math.floor(Math.random() * backgroundItems.length)];
        var el = document.createElement('div');
        el.className = 'case-reel-item ' + item.rarity;
        el.innerHTML = '<div>' + item.icon + '</div><div class="reel-label">' + item.label + '</div>';
        caseReel.appendChild(el);
    }

    var winEl = document.createElement('div');
    var winRarity = reward.data.rarity || 'common';
    winEl.className = 'case-reel-item ' + winRarity;
    if (reward.type === 'gold') {
        winEl.innerHTML = '<div style="font-size:42px;">💰</div>' +
            '<div class="reel-label" style="color:#ffd93d;font-weight:800;">+' + reward.goldAmount + '</div>';
        winEl.style.borderColor = '#ffd93d';
        winEl.style.boxShadow = '0 0 22px rgba(255,217,61,0.9)';
    } else {
        winEl.innerHTML = '<div>' + reward.icon + '</div><div class="reel-label">' + reward.label + '</div>';
    }
    caseReel.appendChild(winEl);

    for (var j = 0; j < 5; j++) {
        var item2 = backgroundItems[Math.floor(Math.random() * backgroundItems.length)];
        var el2 = document.createElement('div');
        el2.className = 'case-reel-item ' + item2.rarity;
        el2.innerHTML = '<div>' + item2.icon + '</div><div class="reel-label">' + item2.label + '</div>';
        caseReel.appendChild(el2);
    }

    caseReel.style.transition = 'none';
    caseReel.style.transform = 'translateX(0px)';
    caseModal.classList.add('open');
    caseWindow.classList.remove('opening','revealed');
    void caseWindow.offsetWidth;
    caseWindow.classList.add('opening');

    setTimeout(function() {
        var itemW = 108;
        var reelWrapW = caseReel.parentElement.offsetWidth;
        var targetIndex = 25;
        var targetX = -(targetIndex * itemW) - itemW / 2 + reelWrapW / 2;
        var jitter = (Math.random() - 0.5) * 60;
        targetX += jitter;
        caseReel.style.transition = 'transform 4s cubic-bezier(0.15, 0.9, 0.3, 1)';
        caseReel.style.transform = 'translateX(' + targetX + 'px)';
    }, 50);

    setTimeout(function() {
        if (reward.type === 'gold') {
            caseResult.innerHTML = '💰 <span style="color:#ffd93d;">+' + reward.goldAmount + ' золота</span>' +
                ' <span style="font-size:0.7em;color:#8ab4ff;">(дубликат)</span>';
        } else {
            caseResult.textContent = '✦ ' + reward.data.name + ' ✦';
        }
        caseResult.classList.add('show');
        caseWindow.classList.remove('opening');
        caseWindow.classList.add('revealed');
        caseCloseBtn.disabled = false;
        caseCloseBtn.textContent = 'Забрать';
        playSFX('level');
    }, 4100);
}

caseCloseBtn.addEventListener('click', function() { caseModal.classList.remove('open'); });

// ==========================================================