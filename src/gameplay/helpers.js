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
var SF_PARTICLE_POOL_CAP = SF_PARTICLE_COARSE ? 180 : 260;
var SF_PARTICLE_POOL = [];

function sfAcquireParticle() {
    return SF_PARTICLE_POOL.length ? SF_PARTICLE_POOL.pop() : {};
}

function sfReleaseParticle(p) {
    if (SF_PARTICLE_POOL.length < SF_PARTICLE_POOL_CAP) SF_PARTICLE_POOL.push(p);
}

function addParticles(x, y, color, count, spread) {
    count = count || 12;
    spread = spread || 6;
    if (particles.length >= SF_PARTICLE_CAP) return;
    if (particles.length > SF_PARTICLE_CAP - 25) count = Math.min(count, 5);
    var room = SF_PARTICLE_CAP - particles.length;
    count = Math.min(count, room);
    for (var i = 0; i < count; i++) {
        var p = sfAcquireParticle();
        p.x = x; p.y = y;
        p.vx = (Math.random() - 0.5) * spread;
        p.vy = (Math.random() - 0.5) * spread;
        p.life = 1; p.color = color;
        p.size = 2 + Math.random() * 4;
        p.gravity = Math.random() * 0.1;
        particles.push(p);
    }
}

function addFloatingText(x, y, text, color, size) {
    size = size || 20;
    if (floatingTexts.length > 30) return;
    floatingTexts.push({ x: x, y: y, text: text, color: color, life: 1, vy: -1.5, size: size });
}
