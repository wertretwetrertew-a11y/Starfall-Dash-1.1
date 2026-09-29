// STARFALL DASH — FINAL BOOTSTRAP
// Runs only after the full DOM and all runtime modules are loaded.

function showStarfallMainMenu() {
    // The menu is the recovery screen for all non-game states.
    // Keep the visibility transition independent from optional HUD/stat widgets.
    if (loginScreen) loginScreen.classList.add('hidden');
    if (modeScreen) modeScreen.classList.add('hidden');
    if (classScreen) classScreen.classList.add('hidden');
    if (coreScreen) coreScreen.classList.add('hidden');
    if (gameoverModal) gameoverModal.classList.remove('open');
    if (pauseModal) pauseModal.classList.remove('open');
    if (startScreen) startScreen.classList.remove('hidden');

    try {
        if (typeof updateMainMenuStats === 'function') updateMainMenuStats();
    } catch (e) {
        // A broken optional stat/widget must never hide the main menu.
        console.error('Starfall Dash menu stats error:', e);
    }

    try {
        if (typeof updateDailyTile === 'function') updateDailyTile();
    } catch (e) {
        console.error('Starfall Dash daily tile error:', e);
    }
}

(function bootstrapStarfallDash() {
    try {
        var login = getCurrentLogin();

        if (login && loadProfile(login)) {
            currentProfile = loadProfile(login);
            currentProfile.data = migrateSave(currentProfile.data);
            setCurrentLogin(login);
            showStarfallMainMenu();
            if (pbNick) pbNick.textContent = currentProfile.nick || 'Игрок';
            if (typeof applyTheme === 'function') applyTheme();
            console.log('✓ Starfall Dash UI bootstrap completed');
        } else {
            currentProfile = null;
            if (loginScreen) loginScreen.classList.remove('hidden');
            if (startScreen) startScreen.classList.add('hidden');
            if (modeScreen) modeScreen.classList.add('hidden');
            if (classScreen) classScreen.classList.add('hidden');
            if (coreScreen) coreScreen.classList.add('hidden');
            if (typeof renderProfilesList === 'function') renderProfilesList();
        }
    } catch (e) {
        // Last-resort recovery: a menu/widget initialization error must not
        // leave the application stuck on a blank/partial screen.
        console.error('Starfall Dash bootstrap error:', e);
        if (currentProfile) showStarfallMainMenu();
        else {
            if (loginScreen) loginScreen.classList.remove('hidden');
            if (startScreen) startScreen.classList.add('hidden');
        }
    }
})();
