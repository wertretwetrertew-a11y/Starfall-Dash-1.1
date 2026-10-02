// ==========================================================
// STARFALL DASH — GAMEPLAY MODULE
// Extracted from legacy gameplay.js; global API intentionally preserved.
// ==========================================================

// ===== УТИЛИТЫ =====
function getCoinMultiplier() {
    var base;
    if (level <= 5) base = level + 1;
    else base = Math.floor(6 + (level - 5) * 2);
    var modeM = MODES[currentMode].goldMultiplier;
    var greedBonus = coreBonusCache.greed;
    var rogueMult = 1;
    if (currentMode === 'rogue') {
        rogueMult = runUpgrades.greed ? Math.pow(1.2, runUpgrades.greed) : 1;
    }
    return Math.floor(base * modeM * greedBonus * rogueMult);
}

function rectsCollide(a, b) {
    return a.x < b.x + b.size && a.x + a.size > b.x &&
           a.y < b.y + b.size && a.y + a.size > b.y;
}

var SF_PARTICLE_COARSE = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
var SF_PARTICLE_CAP = SF_PARTICLE_COARSE ? 140 : 200;

function addParticles(x, y, color, count, spread) {
    count = count || 12;
    spread = spread || 6;

    // Mobile Safari/Chrome can spend a disproportionate amount of time
    // drawing large particle batches. Keep the normal visual effect, but
    // prevent burst effects from growing into an expensive queue.
    if (particles.length > SF_PARTICLE_CAP) count = Math.min(count, 3);
    else if (particles.length > SF_PARTICLE_CAP - 25) count = Math.min(count, 5);

    for (var i = 0; i < count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * spread,
            vy: (Math.random() - 0.5) * spread,
            life: 1, color: color,
            size: 2 + Math.random() * 4,
            gravity: Math.random() * 0.1
        });
    }
}

function addFloatingText(x, y, text, color, size) {
    size = size || 20;
    if (floatingTexts.length > 30) return;
    floatingTexts.push({ x: x, y: y, text: text, color: color, life: 1, vy: -1.5, size: size });
}
