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

// v3.2.1: burst budget. The old pool prevented allocations, but many
// addParticles() calls in one simulation tick could still create a large
// amount of work. Limit new particles per tick while preserving large,
// important bursts (boss deaths/explosions).
var SF_PARTICLE_FRAME_BUDGET = SF_PARTICLE_COARSE ? 34 : 56;
var SF_PARTICLE_CRITICAL_BUDGET = SF_PARTICLE_COARSE ? 48 : 72;
var SF_PARTICLE_BUDGET_FRAME = -1;
var SF_PARTICLE_BUDGET_USED = 0;
var SF_PARTICLE_POOL = [];

// v3.2.2: cache tiny particle sprites so draw() does not rebuild an arc/path
// for every particle on every render frame. The particle's alpha and size
// remain dynamic, while the circle geometry is rendered once per color.
var SF_PARTICLE_SPRITE_CACHE = Object.create(null);
var SF_PARTICLE_SPRITE_KEYS = [];
var SF_PARTICLE_SPRITE_CACHE_CAP = 48;

function sfGetParticleSprite(color) {
    color = color || '#fff';
    var cached = SF_PARTICLE_SPRITE_CACHE[color];
    if (cached) return cached;

    if (SF_PARTICLE_SPRITE_KEYS.length >= SF_PARTICLE_SPRITE_CACHE_CAP) {
        var oldKey = SF_PARTICLE_SPRITE_KEYS.shift();
        delete SF_PARTICLE_SPRITE_CACHE[oldKey];
    }

    var sprite = document.createElement('canvas');
    sprite.width = 16;
    sprite.height = 16;
    var sctx = sprite.getContext('2d');
    sctx.fillStyle = color;
    sctx.beginPath();
    sctx.arc(8, 8, 8, 0, Math.PI * 2);
    sctx.fill();

    SF_PARTICLE_SPRITE_CACHE[color] = sprite;
    SF_PARTICLE_SPRITE_KEYS.push(color);
    return sprite;
}

function sfAcquireParticle() {
    return SF_PARTICLE_POOL.length ? SF_PARTICLE_POOL.pop() : {};
}

function sfReleaseParticle(p) {
    if (SF_PARTICLE_POOL.length < SF_PARTICLE_POOL_CAP) SF_PARTICLE_POOL.push(p);
}

function sfParticleBudgetCount(requested) {
    if (requested <= 0) return 0;

    // frame is the simulation tick counter, so the budget resets once per
    // update tick rather than once per render frame.
    if (SF_PARTICLE_BUDGET_FRAME !== frame) {
        SF_PARTICLE_BUDGET_FRAME = frame;
        SF_PARTICLE_BUDGET_USED = 0;
    }

    // Large bursts are treated as visually important and get a larger
    // allowance, but are still bounded.
    var budget = requested >= 30 ? SF_PARTICLE_CRITICAL_BUDGET : SF_PARTICLE_FRAME_BUDGET;
    var remaining = budget - SF_PARTICLE_BUDGET_USED;
    if (remaining <= 0) return 0;

    var allowed = Math.min(requested, remaining);
    SF_PARTICLE_BUDGET_USED += allowed;
    return allowed;
}

function addParticles(x, y, color, count, spread) {
    count = count || 12;
    spread = spread || 6;

    count = sfParticleBudgetCount(count);
    if (count <= 0 || particles.length >= SF_PARTICLE_CAP) return;

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
