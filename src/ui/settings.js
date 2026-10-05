// ==========================================================
// STARFALL DASH — UI MODULE
// Extracted from legacy meta-ui.js; global API intentionally preserved.
// ==========================================================

// ===== НАСТРОЙКИ =====
btnSettings.addEventListener('click', function() {
    var s = getSave();
    document.querySelectorAll('#settings-modal [data-speed]').forEach(function(b) {
        b.classList.toggle('primary', parseFloat(b.dataset.speed) === s.gameSpeed);
        b.classList.toggle('ghost', parseFloat(b.dataset.speed) !== s.gameSpeed);
    });
    toggleLevelToastBtn.textContent = s.showLevelToast ? 'Вкл' : 'Выкл';
    toggleLevelToastBtn.className = 'modal-btn ' + (s.showLevelToast ? 'primary' : 'ghost');
    toggleWeatherBtn.textContent = s.showWeather ? 'Вкл' : 'Выкл';
    toggleWeatherBtn.className = 'modal-btn ' + (s.showWeather ? 'primary' : 'ghost');
    settingsModal.classList.add('open');
});

settingsClose.addEventListener('click', function() { settingsModal.classList.remove('open'); });

document.querySelectorAll('#settings-modal [data-speed]').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var s = getSave();
        s.gameSpeed = parseFloat(btn.dataset.speed);
        persist();
        document.querySelectorAll('#settings-modal [data-speed]').forEach(function(b) {
            b.classList.toggle('primary', parseFloat(b.dataset.speed) === s.gameSpeed);
            b.classList.toggle('ghost', parseFloat(b.dataset.speed) !== s.gameSpeed);
        });
        showToast('Скорость: ' + btn.textContent.trim(), 'info');
    });
});

toggleLevelToastBtn.addEventListener('click', function() {
    var s = getSave();
    s.showLevelToast = !s.showLevelToast;
    persist();
    toggleLevelToastBtn.textContent = s.showLevelToast ? 'Вкл' : 'Выкл';
    toggleLevelToastBtn.className = 'modal-btn ' + (s.showLevelToast ? 'primary' : 'ghost');
});

toggleWeatherBtn.addEventListener('click', function() {
    var s = getSave();
    s.showWeather = !s.showWeather;
    persist();
    toggleWeatherBtn.textContent = s.showWeather ? 'Вкл' : 'Выкл';
    toggleWeatherBtn.className = 'modal-btn ' + (s.showWeather ? 'primary' : 'ghost');
});

btnHelp.addEventListener('click', function() { helpModal.classList.add('open'); });
helpClose.addEventListener('click', function() { helpModal.classList.remove('open'); });
settingsModal.addEventListener('click', function(e) {
    if (e.target === settingsModal) settingsModal.classList.remove('open');
});
helpModal.addEventListener('click', function(e) {
    if (e.target === helpModal) helpModal.classList.remove('open');
});
profileMenuModal.addEventListener('click', function(e) {
    if (e.target === profileMenuModal) profileMenuModal.classList.remove('open');
});

document.getElementById('reset-progress').addEventListener('click', function() {
    if (!currentProfile) return;
    if (confirm('Сбросить прогресс профиля «' + currentProfile.nick + '»? ВСЁ будет потеряно!')) {
        currentProfile.data = makeDefaultSave();
        persist();
        updateMainMenuStats();
        updateDailyTile();
        applyTheme();
        showToast('Прогресс сброшен', 'info');
    }
});

function showToast(text, type) {
    type = type || 'info';
    toastEl.textContent = text;
    toastEl.className = '';
    void toastEl.offsetWidth;
    toastEl.classList.add('show', type);
}

// ==========================================================

// ===== ОРИЕНТАЦИЯ ИГРЫ =====
var orientationButtons = document.querySelectorAll('#settings-modal [data-orientation]');

function getOrientationPreference() {
    var s = getSave();
    return s.orientationPreference || 'auto';
}

function applyOrientationPreference(preference) {
    preference = preference || getOrientationPreference();
    document.body.classList.remove('orientation-auto', 'orientation-portrait', 'orientation-landscape');
    document.body.classList.add('orientation-' + preference);
    orientationButtons.forEach(function(btn) {
        var active = btn.dataset.orientation === preference;
        btn.classList.toggle('primary', active);
        btn.classList.toggle('ghost', !active);
    });

    // Use the native API when the browser allows it (Android/installed PWA).
    // iPhone Safari may reject lock(); the CSS fallback still applies.
    if (preference !== 'auto' && screen.orientation && typeof screen.orientation.lock === 'function') {
        screen.orientation.lock(preference).catch(function() {});
    }
}

function setOrientationPreference(preference) {
    var s = getSave();
    s.orientationPreference = preference;
    persist();
    applyOrientationPreference(preference);
    var labels = {auto:'Авто', portrait:'Вертикально', landscape:'Горизонтально'};
    showToast('Ориентация: ' + labels[preference], 'info');
}

orientationButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
        setOrientationPreference(btn.dataset.orientation);
    });
});

applyOrientationPreference(getOrientationPreference());
