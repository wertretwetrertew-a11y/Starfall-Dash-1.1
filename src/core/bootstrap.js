// STARFALL DASH — FINAL BOOTSTRAP
// Runs only after the full DOM and all runtime modules are loaded.

(function bootstrapStarfallDash() {
    try {
        var login = getCurrentLogin();

        if (login && loadProfile(login)) {
            enterProfile(login);
        } else {
            currentProfile = null;
            loginScreen.classList.remove('hidden');
            startScreen.classList.add('hidden');
            modeScreen.classList.add('hidden');
            classScreen.classList.add('hidden');
            coreScreen.classList.add('hidden');
            renderProfilesList();
        }

        console.log('✓ Starfall Dash UI bootstrap completed');
    } catch (e) {
        console.error('Starfall Dash bootstrap error:', e);
    }
})();
