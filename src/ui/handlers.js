// ==========================================================
// STARFALL DASH — UI MODULE
// Extracted from legacy meta-ui.js; global API intentionally preserved.
// ==========================================================

// ===== ОБРАБОТЧИКИ =====
function handleSkinClick(skin) {
    var s = getSave();
    var owned = s.ownedSkins.indexOf(skin.id) !== -1;
    var equipped = s.equippedSkin === skin.id;
    if (equipped) { showToast('Уже надет', 'info'); return; }
    if (owned) {
        s.equippedSkin = skin.id;
        persist(); renderShop(); updateMainMenuStats();
        showToast('✓ Надет: ' + skin.name, 'success');
        return;
    }
    if (s.bank < skin.price) { showToast('Не хватает золота!', 'error'); return; }
    s.bank -= skin.price;
    s.ownedSkins.push(skin.id);
    s.equippedSkin = skin.id;
    persist(); renderShop(); updateMainMenuStats();
    checkAchievements();
    var t = (skin.rarity === 'legendary' || skin.rarity === 'mythic') ? 'legendary' : 'success';
    showToast('🛒 Куплено: ' + skin.name, t);
}

function handleItemClick(item) {
    var s = getSave();
    if (s.bank < item.price) { showToast('Не хватает золота!', 'error'); return; }
    s.bank -= item.price;
    s.ownedItems.push(item.id);
    item.apply(s);
    persist(); renderShop(); updateMainMenuStats();
    showToast('⚡ Куплено: ' + item.name, 'success');
}

function handleBoostClick(boost) {
    var s = getSave();
    if (s.bank < boost.price) { showToast('Не хватает золота!', 'error'); return; }
    s.bank -= boost.price;
    s.boosts[boost.id] = (s.boosts[boost.id] || 0) + 1;
    persist(); renderShop(); updateMainMenuStats();
    showToast('🛍 Куплено: ' + boost.name, 'success');
}

function handleThemeClick(theme) {
    var s = getSave();
    var owned = s.ownedThemes.indexOf(theme.id) !== -1;
    var equipped = s.equippedTheme === theme.id;
    if (equipped) { showToast('Уже выбрана', 'info'); return; }
    if (owned) {
        s.equippedTheme = theme.id;
        persist(); renderShop(); applyTheme();
        showToast('🌌 Выбрана: ' + theme.name, 'success');
        return;
    }
    if (s.bank < theme.price) { showToast('Не хватает золота!', 'error'); return; }
    s.bank -= theme.price;
    s.ownedThemes.push(theme.id);
    s.equippedTheme = theme.id;
    persist(); renderShop(); applyTheme();
    var t = (theme.rarity === 'legendary' || theme.rarity === 'mythic') ? 'legendary' : 'success';
    showToast('🌌 Куплено: ' + theme.name, t);
}

function handleSoundClick(sp) {
    var s = getSave();
    var owned = s.ownedSoundPacks.indexOf(sp.id) !== -1;
    var equipped = s.equippedSoundPack === sp.id;
    if (equipped) { showToast('Уже выбран', 'info'); return; }
    if (owned) {
        s.equippedSoundPack = sp.id;
        persist(); renderShop();
        showToast('🔊 Выбран: ' + sp.name, 'success');
        playSFX('coin');
        return;
    }
    if (s.bank < sp.price) { showToast('Не хватает золота!', 'error'); return; }
    s.bank -= sp.price;
    s.ownedSoundPacks.push(sp.id);
    s.equippedSoundPack = sp.id;
    persist(); renderShop(); updateMainMenuStats();
    checkAchievements();
    showToast('🔊 Куплено: ' + sp.name, 'success');
}

function handleMusicClick(mt) {
    var s = getSave();
    var owned = s.ownedMusic.indexOf(mt.id) !== -1;
    var equipped = s.equippedMusic === mt.id;
    if (equipped) { showToast('Уже играет', 'info'); return; }
    if (owned) {
        s.equippedMusic = mt.id;
        stopMusic();
        persist(); renderShop();
        showToast('🎵 Включено: ' + mt.name, 'success');
        if (running) startMusic();
        return;
    }
    if (s.bank < mt.price) { showToast('Не хватает золота!', 'error'); return; }
    s.bank -= mt.price;
    s.ownedMusic.push(mt.id);
    s.equippedMusic = mt.id;
    stopMusic();
    persist(); renderShop(); updateMainMenuStats();
    checkAchievements();
    showToast('🎵 Куплено: ' + mt.name, 'legendary');
}

function handleCardClick(cd) {
    var s = getSave();
    if (s.bank < cd.price) { showToast('Не хватает золота!', 'error'); return; }
    s.bank -= cd.price;
    s.ownedCards.push(cd.id);
    persist(); renderShop(); updateMainMenuStats();
    showToast('🎴 Карта: ' + cd.name + '!', 'legendary');
}

shopClose.addEventListener('click', function() { shopModal.classList.remove('open'); });
shopModal.addEventListener('click', function(e) {
    if (e.target === shopModal) shopModal.classList.remove('open');
});

// ==========================================================