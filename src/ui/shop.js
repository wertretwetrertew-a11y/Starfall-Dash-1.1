// ==========================================================
// STARFALL DASH — UI MODULE
// Extracted from legacy meta-ui.js; global API intentionally preserved.
// ==========================================================

//   МАГАЗИН
// ==========================================================
function makeCard(cls) {
    var c = document.createElement('div');
    c.className = 'shop-card ' + (cls || '');
    return c;
}

function renderShop() {
    var s = getSave();
    shopBankVal.textContent = formatNumber(s.bank);
    shopGrid.innerHTML = '';
    if (currentShopTab === 'skins') renderSkins();
    else if (currentShopTab === 'items') renderItems();
    else if (currentShopTab === 'boosts') renderBoosts();
    else if (currentShopTab === 'themes') renderThemes();
    else if (currentShopTab === 'cases') renderCases();
    else if (currentShopTab === 'sound') renderSoundPacks();
    else if (currentShopTab === 'music') renderMusic();
    else if (currentShopTab === 'cards') renderCards();
    else if (currentShopTab === 'achievements') renderAchievements();
}

function refreshShopLiveState() {
    if (!shopModal.classList.contains('open')) return;
    // Кошелёк и инвентарь должны обновляться сразу после любой покупки/открытия кейса.
    shopBankVal.textContent = formatNumber(getSave().bank);
    renderShopNavigation();
    renderShop();
}

function renderSkins() {
    var s = getSave();
    Object.keys(SKINS).forEach(function(k) {
        var skin = SKINS[k];
        var owned = s.ownedSkins.indexOf(skin.id) !== -1;
        var equipped = s.equippedSkin === skin.id;
        var canAfford = s.bank >= skin.price;
        var card = makeCard(skin.rarity);
        if (owned) card.classList.add('owned');
        if (equipped) card.classList.add('equipped');
        if (!owned && !canAfford) card.classList.add('cant-afford');
        if (!owned) card.classList.add('locked');

        var rb = document.createElement('div');
        rb.className = 'rarity-badge ' + skin.rarity;
        rb.textContent = skin.rarity;
        card.appendChild(rb);

        var prev = document.createElement('div');
        prev.className = 'skin-preview';
        prev.style.background = 'radial-gradient(circle, ' + skin.colors.glow + '33 0%, transparent 70%)';
        var inner = document.createElement('div');
        inner.className = 'skin-preview-inner';
        inner.style.background = 'linear-gradient(180deg, ' + skin.colors.top + ', ' + skin.colors.bottom + ')';
        inner.style.boxShadow = '0 0 16px ' + skin.colors.glow;
        prev.appendChild(inner);
        card.appendChild(prev);

        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = skin.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = skin.desc; card.appendChild(ds);

        var pr = document.createElement('div');
        if (equipped) { pr.className = 'shop-price equipped'; pr.textContent = '✓ НАДЕТ'; }
        else if (owned) { pr.className = 'shop-price bought'; pr.textContent = 'Надеть'; }
        else { pr.className = 'shop-price'; pr.textContent = '💰 ' + formatNumber(skin.price); }
        card.appendChild(pr);

        card.addEventListener('click', function() { handleSkinClick(skin); });
        shopGrid.appendChild(card);
    });
}

function renderItems() {
    var s = getSave();
    Object.keys(ITEMS).forEach(function(k) {
        var item = ITEMS[k];
        var owned = s.ownedItems.indexOf(item.id) !== -1;
        var canAfford = s.bank >= item.price;
        var card = makeCard('rare');
        if (owned) card.classList.add('owned');
        if (!owned && !canAfford) card.classList.add('cant-afford');
        var ic = document.createElement('div'); ic.className = 'shop-icon'; ic.textContent = item.icon;
        ic.style.color = item.id === 'premium' ? '#e040fb' : '#4fc3f7';
        card.appendChild(ic);
        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = item.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = item.desc; card.appendChild(ds);
        var pr = document.createElement('div');
        if (owned) { pr.className = 'shop-price bought'; pr.textContent = '✓ Активно'; }
        else { pr.className = 'shop-price'; pr.textContent = '💰 ' + formatNumber(item.price); }
        card.appendChild(pr);
        if (!owned) card.addEventListener('click', function() { handleItemClick(item); });
        shopGrid.appendChild(card);
    });
}

function renderBoosts() {
    var s = getSave();
    Object.keys(BOOSTS).forEach(function(k) {
        var boost = BOOSTS[k];
        var count = (s.boosts && s.boosts[boost.id]) || 0;
        var canAfford = s.bank >= boost.price;
        var card = makeCard('common');
        if (!canAfford) card.classList.add('cant-afford');
        if (count > 0) {
            var rb = document.createElement('div');
            rb.className = 'rarity-badge rare';
            rb.textContent = '×' + count;
            card.appendChild(rb);
        }
        var ic = document.createElement('div'); ic.className = 'shop-icon'; ic.textContent = boost.icon;
        ic.style.color = '#ffd93d';
        card.appendChild(ic);
        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = boost.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = boost.desc; card.appendChild(ds);
        var pr = document.createElement('div'); pr.className = 'shop-price'; pr.textContent = '💰 ' + formatNumber(boost.price);
        card.appendChild(pr);
        card.addEventListener('click', function() { handleBoostClick(boost); });
        shopGrid.appendChild(card);
    });
}

function renderThemes() {
    var s = getSave();
    Object.keys(THEMES).forEach(function(k) {
        var theme = THEMES[k];
        var owned = s.ownedThemes.indexOf(theme.id) !== -1;
        var equipped = s.equippedTheme === theme.id;
        var canAfford = s.bank >= theme.price;
        var card = makeCard(theme.rarity);
        if (owned) card.classList.add('owned');
        if (equipped) card.classList.add('equipped');
        if (!owned && !canAfford) card.classList.add('cant-afford');
        if (!owned) card.classList.add('locked');

        var rb = document.createElement('div');
        rb.className = 'rarity-badge ' + theme.rarity;
        rb.textContent = theme.rarity;
        card.appendChild(rb);

        var prev = document.createElement('div');
        prev.style.cssText = 'width:55px;height:55px;border-radius:12px;margin:4px auto 8px;' +
            'background:linear-gradient(180deg,' + theme.bg1 + ',' + theme.bg2 + ');' +
            'border:1px solid ' + theme.glow + ';';
        card.appendChild(prev);

        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = theme.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = theme.desc; card.appendChild(ds);

        var pr = document.createElement('div');
        if (equipped) { pr.className = 'shop-price equipped'; pr.textContent = '✓ ВЫБРАНА'; }
        else if (owned) { pr.className = 'shop-price bought'; pr.textContent = 'Выбрать'; }
        else { pr.className = 'shop-price'; pr.textContent = '💰 ' + formatNumber(theme.price); }
        card.appendChild(pr);

        card.addEventListener('click', function() { handleThemeClick(theme); });
        shopGrid.appendChild(card);
    });
}

function renderCases() {
    var s = getSave();
    var totalCases = Object.keys(s.freeCases || {}).reduce(function(sum, id) {
        return sum + Math.max(0, Number(s.freeCases[id] || 0));
    }, 0);
    var inventoryBadge = document.getElementById('shop-case-inventory');
    if (inventoryBadge) {
        inventoryBadge.textContent = '🎁 В наличии: ' + totalCases;
        inventoryBadge.classList.toggle('has-cases', totalCases > 0);
    }
    Object.keys(s.freeCases).forEach(function(cid) {
        if (s.freeCases[cid] <= 0) return;
        var c = CASES[cid];
        if (!c) return;
        var card = makeCard(c.id === 'mythic' ? 'mythic' :
                           c.id === 'legendary' ? 'legendary' :
                           c.id === 'epic' ? 'epic' : 'common');
        card.style.position = 'relative';
        var badge = document.createElement('div');
        badge.className = 'free-cases-badge';
        badge.textContent = '×' + s.freeCases[cid];
        card.appendChild(badge);

        var ic = document.createElement('div'); ic.className = 'shop-icon'; ic.textContent = c.icon;
        ic.style.fontSize = '48px';
        card.appendChild(ic);
        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = 'Бесплатный ' + c.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = 'Из инвентаря'; card.appendChild(ds);
        var pity = document.createElement('div'); pity.className = 'case-card-pity';
        var pityLimit = { common:8, rare:7, epic:6, legendary:5, mythic:3 }[cid] || 8;
        pity.textContent = 'Гарантия: ' + Math.min(pityLimit, Number((s.casePity || {})[cid] || 0)) + '/' + pityLimit;
        card.appendChild(pity);
        var pr = document.createElement('div'); pr.className = 'shop-price free'; pr.textContent = '🎁 ОТКРЫТЬ';
        card.appendChild(pr);

        card.addEventListener('click', function() { openCase(cid, true); });
        shopGrid.appendChild(card);
    });

    Object.keys(CASES).forEach(function(k) {
        var c = CASES[k];
        var canAfford = s.bank >= c.price;
        var card = makeCard(c.id === 'mythic' ? 'mythic' :
                           c.id === 'legendary' ? 'legendary' :
                           c.id === 'epic' ? 'epic' : 'common');
        if (!canAfford) card.classList.add('cant-afford');

        var ic = document.createElement('div'); ic.className = 'shop-icon'; ic.textContent = c.icon;
        ic.style.fontSize = '48px';
        card.appendChild(ic);
        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = c.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = c.desc; card.appendChild(ds);
        var pity = document.createElement('div'); pity.className = 'case-card-pity';
        var pityLimit = { common:8, rare:7, epic:6, legendary:5, mythic:3 }[c.id] || 8;
        pity.textContent = 'Гарантия: ' + Math.min(pityLimit, Number((s.casePity || {})[c.id] || 0)) + '/' + pityLimit;
        card.appendChild(pity);
        var pr = document.createElement('div'); pr.className = 'shop-price'; pr.textContent = '💰 ' + formatNumber(c.price);
        card.appendChild(pr);
        card.addEventListener('click', function() { openCase(c.id, false); });
        shopGrid.appendChild(card);
    });
}

function renderSoundPacks() {
    var s = getSave();
    Object.keys(SOUND_PACKS).forEach(function(k) {
        var sp = SOUND_PACKS[k];
        var owned = s.ownedSoundPacks.indexOf(sp.id) !== -1;
        var equipped = s.equippedSoundPack === sp.id;
        var canAfford = s.bank >= sp.price;
        var card = makeCard(sp.rarity);
        if (owned) card.classList.add('owned');
        if (equipped) card.classList.add('equipped');
        if (!owned && !canAfford) card.classList.add('cant-afford');
        if (!owned) card.classList.add('locked');

        var rb = document.createElement('div');
        rb.className = 'rarity-badge ' + sp.rarity;
        rb.textContent = sp.rarity;
        card.appendChild(rb);

        var ic = document.createElement('div');
        ic.className = 'shop-icon';
        ic.textContent = sp.icon;
        ic.style.color = '#4fc3f7';
        card.appendChild(ic);

        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = sp.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = sp.desc; card.appendChild(ds);

        var pr = document.createElement('div');
        if (equipped) { pr.className = 'shop-price equipped'; pr.textContent = '✓ ВЫБРАН'; }
        else if (owned) { pr.className = 'shop-price bought'; pr.textContent = 'Выбрать'; }
        else { pr.className = 'shop-price'; pr.textContent = '💰 ' + formatNumber(sp.price); }
        card.appendChild(pr);

        card.addEventListener('click', function() { handleSoundClick(sp); });
        shopGrid.appendChild(card);
    });
}

function renderMusic() {
    var s = getSave();
    Object.keys(MUSIC_TRACKS).forEach(function(k) {
        var mt = MUSIC_TRACKS[k];
        var owned = s.ownedMusic.indexOf(mt.id) !== -1;
        var equipped = s.equippedMusic === mt.id;
        var canAfford = s.bank >= mt.price;
        var card = makeCard(mt.rarity);
        if (owned) card.classList.add('owned');
        if (equipped) card.classList.add('equipped');
        if (!owned && !canAfford) card.classList.add('cant-afford');
        if (!owned) card.classList.add('locked');

        var rb = document.createElement('div');
        rb.className = 'rarity-badge ' + mt.rarity;
        rb.textContent = mt.rarity;
        card.appendChild(rb);

        var ic = document.createElement('div');
        ic.className = 'shop-icon';
        ic.textContent = mt.icon;
        ic.style.color = '#b388ff';
        card.appendChild(ic);

        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = mt.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = mt.desc; card.appendChild(ds);

        var pr = document.createElement('div');
        if (equipped) { pr.className = 'shop-price equipped'; pr.textContent = '✓ ИГРАЕТ'; }
        else if (owned) { pr.className = 'shop-price bought'; pr.textContent = 'Включить'; }
        else { pr.className = 'shop-price'; pr.textContent = '💰 ' + formatNumber(mt.price); }
        card.appendChild(pr);

        card.addEventListener('click', function() { handleMusicClick(mt); });
        shopGrid.appendChild(card);
    });
}

function renderCards() {
    var s = getSave();
    Object.keys(CARDS).forEach(function(k) {
        var cd = CARDS[k];
        var owned = s.ownedCards.indexOf(cd.id) !== -1;
        var canAfford = s.bank >= cd.price;
        var card = makeCard(cd.rarity);
        if (owned) card.classList.add('owned');
        if (!owned && !canAfford) card.classList.add('cant-afford');
        if (!owned) card.classList.add('locked');

        var rb = document.createElement('div');
        rb.className = 'rarity-badge ' + cd.rarity;
        rb.textContent = cd.rarity;
        card.appendChild(rb);

        var prev = document.createElement('div');
        prev.className = 'card-preview ' + cd.rarity;
        prev.textContent = cd.icon;
        card.appendChild(prev);

        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = cd.name; card.appendChild(nm);
        var pr = document.createElement('div');
        if (owned) { pr.className = 'shop-price bought'; pr.textContent = '✓ В КОЛЛЕКЦИИ'; }
        else { pr.className = 'shop-price'; pr.textContent = '💰 ' + formatNumber(cd.price); }
        card.appendChild(pr);

        if (!owned) card.addEventListener('click', function() { handleCardClick(cd); });
        shopGrid.appendChild(card);
    });
}

function renderAchievements() {
    var s = getSave();
    Object.keys(ACHIEVEMENTS).forEach(function(k) {
        var a = ACHIEVEMENTS[k];
        var progress = getAchievementProgress(a);
        var claimed = s.claimedAchievements.indexOf(a.id) !== -1;
        var done = progress >= a.target;

        var card = makeCard(done ? 'rare' : 'common');
        card.className = 'ach-card';
        if (done) card.classList.add('done');
        if (claimed) card.classList.add('claimed');

        var ic = document.createElement('div');
        ic.className = 'ach-icon';
        ic.textContent = a.icon;
        ic.style.color = claimed ? '#7cffb2' : (done ? '#ffd93d' : '#8ab4ff');
        card.appendChild(ic);

        var nm = document.createElement('div'); nm.className = 'shop-name'; nm.textContent = a.name; card.appendChild(nm);
        var ds = document.createElement('div'); ds.className = 'shop-desc'; ds.textContent = a.desc; card.appendChild(ds);

        var bar = document.createElement('div');
        bar.className = 'ach-progress-bar';
        var fill = document.createElement('div');
        fill.className = 'ach-progress-fill';
        var pct = Math.min(100, (progress / a.target) * 100);
        fill.style.width = pct + '%';
        bar.appendChild(fill);
        card.appendChild(bar);

        var ptext = document.createElement('div');
        ptext.className = 'ach-progress-text';
        ptext.textContent = Math.min(progress, a.target) + ' / ' + a.target;
        card.appendChild(ptext);

        var rew = document.createElement('div');
        rew.className = 'ach-reward';
        if (a.reward.type === 'gold') rew.textContent = '💰 +' + formatNumber(a.reward.amount);
        else if (a.reward.type === 'crystals') rew.textContent = '💎 +' + a.reward.amount;
        else if (a.reward.type === 'shards') rew.textContent = '✨ +' + a.reward.amount;
        else if (a.reward.type === 'skin') rew.textContent = '🎨 ' + (SKINS[a.reward.skinId] ? SKINS[a.reward.skinId].name : 'Скин');
        else if (a.reward.type === 'case') rew.textContent = CASES[a.reward.caseId].icon + ' ' + CASES[a.reward.caseId].name;
        if (claimed) rew.classList.add('claimed');
        card.appendChild(rew);

        if (done && !claimed) {
            card.addEventListener('click', function() { claimAchievement(a); });
        } else if (!done) {
            card.style.cursor = 'default';
        }
        shopGrid.appendChild(card);
    });
}
