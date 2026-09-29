// ==========================================================
// STARFALL DASH — UI MODULE
// Extracted from legacy meta-ui.js; global API intentionally preserved.
// ==========================================================

// ===== КНОПКИ МЕНЮ =====
// Быстрый запуск Roguelike из главного меню.
if (tileQuick) {
    tileQuick.addEventListener('click', function() {
        running = false;
        gameOver = false;
        paused = false;
        stopMusic();
        startScreen.classList.add('hidden');
        modeScreen.classList.add('hidden');
        classScreen.classList.remove('hidden');
        currentMode = 'rogue';
        var s = getSave();
        s.lastMode = 'rogue';
        persist();
        renderClassScreen();
    });
}

tilePlay.addEventListener('click', function() {
    running = false;
    gameOver = false;
    paused = false;
    stopMusic();
    startScreen.classList.add('hidden');
    modeScreen.classList.remove('hidden');
    updateModeBests();
});

modeBack.addEventListener('click', function() {
    modeScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

document.querySelectorAll('.mode-card').forEach(function(card) {
    card.addEventListener('click', function() {
        var modeId = card.dataset.mode;
        selectMode(modeId);
    });
});

function selectMode(modeId) {
    if (!MODES[modeId]) return;
    currentMode = modeId;
    var s = getSave();
    s.lastMode = modeId;
    if (!s.modesPlayed) s.modesPlayed = [];
    if (s.modesPlayed.indexOf(modeId) === -1) {
        s.modesPlayed.push(modeId);
        persist();
        checkAchievements();
    }
    persist();

    if (MODES[modeId].isRoguelike) {
        modeScreen.classList.add('hidden');
        classScreen.classList.remove('hidden');
        renderClassScreen();
    } else {
        modeScreen.classList.add('hidden');
        document.body.classList.add('playing');
        gameOver = false;
        paused = false;
        running = false;
        reset();
    }
}
