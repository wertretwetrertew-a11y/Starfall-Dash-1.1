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
    // После КАЖДОГО обновления игры начинаем с вертикального режима.
    // Пользователь может выбрать горизонтальный режим заново в настройках.
    return 'portrait';
}

function setOrientationButtonState(value) {
    orientationButtons.forEach(function(b) {
        var active = b.dataset.orientation === value;
        b.classList.toggle('primary', active);
        b.classList.toggle('ghost', !active);
    });
}

function applyVisualOrientation(value) {
    document.body.classList.remove('manual-orientation-landscape', 'manual-orientation-portrait');
    if (value === 'landscape') {
        document.body.classList.add('manual-orientation-landscape');
    } else if (value === 'portrait') {
        document.body.classList.add('manual-orientation-portrait');
    }
}

function requestOrientationLock(value) {
    if (!screen.orientation || !screen.orientation.lock) {
        return Promise.resolve(false);
    }
    return screen.orientation.lock(value).then(function() {
        return true;
    }).catch(function() {
        return false;
    });
}

function applyOrientationPreference(value, notify) {
    value = value || 'auto';

    if (value === 'auto') {
        try { localStorage.removeItem('starfallOrientationPreference'); } catch (e) {}
        applyVisualOrientation('auto');
        if (screen.orientation && screen.orientation.unlock) {
            try { screen.orientation.unlock(); } catch (e) {}
        }
        if (notify) showToast('Ориентация: авто', 'info');
        return;
    }

    try { localStorage.setItem('starfallOrientationPreference', value); } catch (e) {}

    // iPhone Safari обычно не разрешает screen.orientation.lock().
    // Поэтому визуальный fallback применяется сразу и работает без API.
    applyVisualOrientation(value);

    requestOrientationLock(value).then(function(locked) {
        if (locked) {
            // Системный поворот уже выполнен — убираем визуальный fallback,
            // чтобы не повернуть интерфейс дважды.
            applyVisualOrientation('auto');
        }
    });

    if (notify) {
        showToast(
            value === 'portrait' ? '↕ Вертикальный режим' : '↔ Горизонтальный режим',
            'success'
        );
    }
}

applyOrientationPreference(getOrientationPreference(), false);

orientationButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
        var value = btn.dataset.orientation;
        setOrientationButtonState(value);
        applyOrientationPreference(value, true);
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