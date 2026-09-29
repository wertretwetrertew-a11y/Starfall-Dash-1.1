// ==========================================================
// STARFALL DASH — GAMEPLAY MODULE
// Extracted from legacy gameplay.js; global API intentionally preserved.
// ==========================================================

// ===== КОМБО =====
function addCombo() {
    combo++;
    if (combo > comboMax) comboMax = combo;
    comboTimer = COMBO_WINDOW;
    if (combo >= 2) showComboBadge();
}

function showComboBadge() {
    if (combo < 2) { hudCombo.classList.remove('show'); return; }
    hudCombo.textContent = '🔥 COMBO ×' + combo;
    hudCombo.classList.add('show');
    hudCombo.classList.remove('pulse');
    void hudCombo.offsetWidth;
    hudCombo.classList.add('pulse');
    if (combo % 5 === 0) playSFX('combo');
}

function getComboMultiplier() {
    if (combo >= 20) return 5;
    if (combo >= 15) return 4;
    if (combo >= 10) return 3;
    if (combo >= 5) return 2;
    return 1;
}

function resetCombo() {
    if (comboGraceTimer > 0) {
        comboTimer = comboGraceTimer;
        return;
    }
    combo = 0;
    comboTimer = 0;
    hudCombo.classList.remove('show');
}

function getModeTimeLeft() {
    if (!MODES[currentMode].hasTimer) return 0;
    var elapsed = (performance.now() - runStartTime) / 1000;
    return Math.max(0, MODES[currentMode].timeLimit - elapsed);
}
