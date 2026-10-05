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
/* ===== ОРИЕНТАЦИЯ ЭКРАНА =====
   Сохраняем выбор отдельно, чтобы не ломать старые сохранения.
   На iPhone Safari Screen Orientation API может быть недоступен —
   в этом случае браузер оставляет системную ориентацию и показывает подсказку.
*/
var orientationButtons = document.querySelectorAll('#settings-modal [data-orientation]');

function getOrientationPreference() {
    try { return localStorage.getItem('starfallOrientationPreference') || 'auto'; }
    catch (e) { return 'auto'; }
}

function setOrientationButtonState(value) {
    orientationButtons.forEach(function(b) {
        var active = b.dataset.orientation === value;
        b.classList.toggle('primary', active);
        b.classList.toggle('ghost', !active);
    });
}

function requestOrientationLock(value) {
    if (!screen.orientation || !screen.orientation.lock) {
        showToast(
            value === 'auto'
                ? 'Ориентация: авто'
                : 'Браузер не разрешает принудительный поворот. Переверни телефон вручную.',
            'info'
        );
        return Promise.resolve(false);
    }

    return screen.orientation.lock(value).then(function() {
        showToast(value === 'portrait' ? '↕ Вертикальная ориентация' : '↔ Горизонтальная ориентация', 'success');
        return true;
    }).catch(function() {
        showToast(
            'Браузер не разрешил принудительный поворот. Переверни телефон вручную.',
            'info'
        );
        return false;
    });
}

function applyOrientationPreference(value) {
    value = value || 'auto';
    try {
        if (value === 'auto') {
            localStorage.removeItem('starfallOrientationPreference');
            if (screen.orientation && screen.orientation.unlock) {
                try { screen.orientation.unlock(); } catch (e) {}
            }
            showToast('Ориентация: авто', 'info');
            return;
        }
        localStorage.setItem('starfallOrientationPreference', value);
    } catch (e) {}

    requestOrientationLock(value);
}

orientationButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
        var value = btn.dataset.orientation;
        setOrientationButtonState(value);
        applyOrientationPreference(value);
    });
});

setOrientationButtonState(getOrientationPreference());


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