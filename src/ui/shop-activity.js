// ==========================================================
// STARFALL DASH — UI MODULE
// Extracted from legacy meta-ui.js; global API intentionally preserved.
// ==========================================================

// ===== МАГАЗИН / ДОСТИЖЕНИЯ / ЕЖЕДНЕВКА =====
var SHOP_CATEGORIES = {
    appearance: [
        { tab: 'skins', label: '🎨 Скины' },
        { tab: 'themes', label: '🌌 Темы' }
    ],
    effects: [
        { tab: 'boosts', label: '🛍 Бусты' },
        { tab: 'sound', label: '🔊 Звуки' },
        { tab: 'music', label: '🎵 Музыка' }
    ],
    collection: [
        { tab: 'cases', label: '📦 Кейсы' },
        { tab: 'cards', label: '🎴 Карты' },
        { tab: 'achievements', label: '🏆 Достижения' }
    ]
};

function getShopCategory(tab) {
    for (var key in SHOP_CATEGORIES) {
        if (SHOP_CATEGORIES[key].some(function(item) { return item.tab === tab; })) return key;
    }
    return 'appearance';
}

function renderShopNavigation() {
    var category = getShopCategory(currentShopTab);
    var categoryWrap = document.getElementById('shop-category-tabs');
    var subWrap = document.getElementById('shop-subtabs');
    if (!categoryWrap || !subWrap) return;

    var caseInventory = document.getElementById('shop-case-inventory');
    if (caseInventory) {
        caseInventory.classList.toggle('visible', currentShopTab === 'cases');
        if (currentShopTab === 'cases') {
            var liveCases = Object.keys(getSave().freeCases || {}).reduce(function(sum, id) {
                return sum + Math.max(0, Number(getSave().freeCases[id] || 0));
            }, 0);
            caseInventory.textContent = '🎁 В наличии: ' + liveCases;
        }
    }

    categoryWrap.querySelectorAll('.shop-category').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.category === category);
    });

    subWrap.innerHTML = '';
    SHOP_CATEGORIES[category].forEach(function(item) {
        var btn = document.createElement('button');
        btn.className = 'shop-subtab' + (item.tab === currentShopTab ? ' active' : '');
        btn.dataset.tab = item.tab;
        btn.textContent = item.label;
        subWrap.appendChild(btn);
    });
    updateShopBadges();
}

document.querySelectorAll('.shop-category').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var category = btn.dataset.category;
        currentShopTab = SHOP_CATEGORIES[category][0].tab;
        renderShopNavigation();
        renderShop();
    });
});

document.getElementById('shop-subtabs').addEventListener('click', function(e) {
    var btn = e.target.closest('.shop-subtab');
    if (!btn) return;
    currentShopTab = btn.dataset.tab;
    renderShopNavigation();
    renderShop();
});

tileShop.addEventListener('click', function() {
    renderShopNavigation();
    renderShop();
    shopModal.classList.add('open');
});

tileAch.addEventListener('click', function() {
    currentShopTab = 'achievements';
    renderShopNavigation();
    renderShop();
    shopModal.classList.add('open');
});

tileDaily.addEventListener('click', function() {
    openDailyModal();
});

profileBadge.addEventListener('click', function() {
    openProfileMenu();
});

function openProfileMenu() {
    var s = getSave();
    pmNick.textContent = currentProfile.nick;
    pmBest.textContent = s.bestCoins;
    pmTime.textContent = formatTime(s.bestTime);
    pmBank.textContent = s.bank;
    pmCrystals.textContent = s.coreCrystals || 0;
    pmShards.textContent = s.starShards || 0;
    pmCore.textContent = getCoreTotalLevel() + ' (' + getCoreMaxLevel() + ' макс)';
    pmLvl.textContent = s.bestLevel;
    pmGames.textContent = s.gamesPlayed;
    pmBosses.textContent = s.bossesKilled || 0;
    pmRogue.textContent = (s.rogueStats && s.rogueStats.bestLevel) || 0;
    pmTotaltime.textContent = formatTime(s.totalTime);
    profileMenuModal.classList.add('open');
}

pmClose.addEventListener('click', function() { profileMenuModal.classList.remove('open'); });
pmSwitch.addEventListener('click', function() {
    profileMenuModal.classList.remove('open');
    logoutToLogin();
});
