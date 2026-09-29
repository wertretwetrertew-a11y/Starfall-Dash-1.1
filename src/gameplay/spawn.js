// ==========================================================
// STARFALL DASH — GAMEPLAY MODULE
// Extracted from legacy gameplay.js; global API intentionally preserved.
// ==========================================================

//   СПАВН
// ==========================================================
function spawnCoin() {
    var value = getCoinMultiplier();
    coins.push({
        x: 20 + Math.random() * (canvas.width - 40),
        y: -20, size: 18,
        speed: 3.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        value: value
    });
}

// Roguelike XP drops from defeated enemies.
// XP follows the same top-to-bottom fall as gold, but is intentionally rarer.
function spawnRogueXP() {
    if (currentMode !== 'rogue' || typeof rogueXPOrbs === 'undefined') return;

    // XP is a rare field drop independent of kills.
    // The caller controls how often it is spawned, just like the gold timer.
    rogueXPOrbs.push({
        x: 20 + Math.random() * (canvas.width - 40),
        y: -20,
        size: 18,
        speed: 3.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        value: 1,
        life: 1
    });
}

function spawnDrop(type, x, y) {
    drops.push({
        type: type, x: x, y: y, size: 24, vy: 2.2,
        vx: (Math.random() - 0.5) * 2,
        wobble: Math.random() * Math.PI * 2,
        life: 1
    });
}

function getRogueStageEnemyConfig(){
    if(currentMode!=='rogue' || typeof roguePlanetState==='undefined' || !roguePlanetState.active) return null;
    var cfg=null;
    try{
        var p=ROGUE_PLANETS[roguePlanetKeys[roguePlanetState.planetIndex]];
        var st=p && p.stages[roguePlanetState.stageIndex];
        cfg=st && st.enemyConfig ? Object.assign({}, st.enemyConfig) : null;
        if(cfg && typeof sfRogueStageBalance==='function'){
            var override=sfRogueStageBalance(roguePlanetKeys[roguePlanetState.planetIndex],roguePlanetState.stageIndex);
            if(override){
                cfg=Object.assign(cfg,override);
                if(override.objective && st.objective) cfg.objective=Object.assign({},st.objective,override.objective);
            }
        }
    }catch(e){ cfg=null; }
    return cfg;
}

function pickMonsterType() {
    var rogueCfg = getRogueStageEnemyConfig();
    var avail = rogueCfg && rogueCfg.pool && rogueCfg.pool.length
        ? rogueCfg.pool.filter(function(k){ return !!MONSTER_TYPES[k]; })
        : Object.keys(MONSTER_TYPES).filter(function(k) {
            return MONSTER_TYPES[k].unlock <= level;
        });
    var weights = avail.map(function(k) {
        if (k === 'normal') return Math.max(1, 6 - level * 0.5);
        if (k === 'miniboss') return 0.3;
        if (k === 'crystal' || k === 'barrier') return 1.5;
        if (k === 'teleporter' || k === 'magnet_enemy') return 1.2;
        if (k === 'doppel' || k === 'laser') return 1.0;
        return 1 + level * 0.3;
    });
    var total = weights.reduce(function(a, b) { return a + b; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < avail.length; i++) {
        r -= weights[i];
        if (r <= 0) return avail[i];
    }
    return 'normal';
}

function spawnEnemy(forcedType) {
    var rogueCfg = getRogueStageEnemyConfig();
    var balanceEnemy = null;
    var typeKey = forcedType || pickMonsterType();
    var t = MONSTER_TYPES[typeKey];
    balanceEnemy = (currentMode==='rogue' && typeof sfGetEnemyBalance==='function') ? sfGetEnemyBalance(typeKey) : null;
    var speedBonus = (level - 1) * 0.4;
    var speedMultiplier = (level <= 3) ? 0.7 : 1;
    var e = {
        type: typeKey, t: t,
        x: 20 + Math.random() * (canvas.width - ((balanceEnemy && Number.isFinite(balanceEnemy.size)) ? balanceEnemy.size : t.size) - 20),
        y: -30, size: (balanceEnemy && Number.isFinite(balanceEnemy.size)) ? balanceEnemy.size : t.size,
        speed: (((balanceEnemy && Number.isFinite(balanceEnemy.speed)) ? balanceEnemy.speed : t.speed) + speedBonus) * speedMultiplier,
        hp: (balanceEnemy && Number.isFinite(balanceEnemy.hp)) ? balanceEnemy.hp : t.hp, maxHp: (balanceEnemy && Number.isFinite(balanceEnemy.hp)) ? balanceEnemy.hp : t.hp,
        wobble: Math.random() * Math.PI * 2,
        zigzagPhase: Math.random() * Math.PI * 2,
        baseX: 0, hitFlash: 0,
        flightTime: 0, shootTimer: t.shootsEvery || 0,
        ghostPhase: 0, ghostAlpha: 1,
        rogueContactCooldown: 0,
        rotation: Math.random() * Math.PI * 2,
        wingPhase: 0,
        vx: t.vx || 0,
        teleportTimer: t.teleportEvery || 0,
        magnetActive: false,
        laserCharging: false,
        laserTimer: 0
    };
    if (typeKey === 'barrier') {
        e.x = Math.random() < 0.5 ? 30 : canvas.width - 30 - (t.barWidth || 60);
        e.vx = Math.random() < 0.5 ? 2.5 : -2.5;
        e.baseY = -30;
    }
    if (typeKey === 'teleporter') e.teleportTimer = 90;
    if (typeKey === 'laser') e.laserTimer = t.chargeTime || 60;
    e.baseX = e.x;

    // Rogue-модификаторы
    if (currentMode === 'rogue' && currentWaveModifier) {
        var mod = currentWaveModifier;
        if (mod.hpMult) {
            e.hp = Math.max(1, Math.floor(e.hp * mod.hpMult));
            e.maxHp = e.hp;
        }
        if (mod.hpBonus) {
            e.hp += mod.hpBonus;
            e.maxHp = e.hp;
        }
        if (mod.speedMult) {
            e.speed *= mod.speedMult;
        }
    }
    if (enemySlowMult < 1) e.speed *= enemySlowMult;

    /* Roguelike stages own their enemy roster and difficulty curve. Forced
       minibosses are kept outside this scaling so stage trials stay readable. */
    if (currentMode === 'rogue' && rogueCfg && !forcedType) {
        if (rogueCfg.speedMult) e.speed *= rogueCfg.speedMult;
        if (rogueCfg.hpMult) {
            e.hp = Math.max(1, Math.round(e.hp * rogueCfg.hpMult));
            e.maxHp = e.hp;
        }
    }

    enemies.push(e);
}

function spawnBoss(bossId) {
    var b = BOSS_TYPES[bossId];
    var balanceBoss = (currentMode==='rogue' && typeof sfGetBossBalance==='function') ? sfGetBossBalance(bossId) : null;
    if (!b) return;

    // Босс всегда выходит один на один: очищаем обычных врагов и их снаряды.
    enemies = [];
    enemyBullets = [];
    rogueEnemyHazards = [];
    coins = [];
    webs = [];
    drops = [];
    meteors = [];
    rogueCoreFragments = [];
    rogueCoreFragmentMisses = 0;
    bossState = 'intro';
    bossStateTimer = 120;
    bossAnnouncement = '⚠ BOSS INCOMING ⚠';
    bossAnnouncementTimer = 120;
    bossDuelId = bossId;

    var boss = {
        id: bossId, type: b,
        x: canvas.width / 2 - b.size / 2,
        y: -b.size - 20,
        size: balanceBoss && Number.isFinite(balanceBoss.size) ? balanceBoss.size : b.size,
        hp: balanceBoss && Number.isFinite(balanceBoss.hp) ? balanceBoss.hp : b.hp, maxHp: balanceBoss && Number.isFinite(balanceBoss.hp) ? balanceBoss.hp : b.hp,
        phase: 1, wobble: 0, shootTimer: 60, specialTimer: 0,
        rotation: 0, hitFlash: 0, entering: true, defeatTimer: 0,
        telegraphTimer: 0, vulnerableTimer: 0, fireNow: false, contactCooldown: 0,
        reward: {
            gold: balanceBoss && Number.isFinite(balanceBoss.rewardGold) ? balanceBoss.rewardGold : b.reward.gold,
            crystals: balanceBoss && Number.isFinite(balanceBoss.rewardCrystals) ? balanceBoss.rewardCrystals : b.reward.crystals,
            skin: b.reward.skin
        }
    };
    bosses.push(boss);
    showToast('⚠️ ' + b.icon + ' ' + b.name + ' выходит на дуэль!', 'legendary');
    playSFX('boss');
    screenShake = 20;
    updateBossDuelHUD();
}

function spawnEnemyBullet(x, y, vx, vy, opts) {
    opts = opts || {};
    enemyBullets.push({
        x: x, y: y, vx: vx, vy: vy,
        size: opts.size || 7,
        color: opts.color || '#ff5c7a',
        homing: opts.homing || 0,
        life: opts.life || 180,
        type: opts.type || 'normal'
    });
}

function spawnWeb(x, y) {
    webs.push({ x: x, y: y, size: 60 + Math.random() * 20, life: 300 });
}

function spawnRogueCoreFragmentFromEnemy(enemy) {
    if (currentMode !== 'rogue' || typeof roguePlanetState === 'undefined' || !roguePlanetState.active || !roguePlanetState.stageStarted) return;
    var st = typeof roguePlanetCurrentStage === 'function' ? roguePlanetCurrentStage() : null;
    if (!st || !st.objective || st.objective.kind !== 'coreFragments') return;

    // The fragment is a chance drop, not a guaranteed reward from every kill.
    // Around one third of kills produce one, tuned so the first stage usually
    // resolves after roughly a minute of active play without using a timer.
    var chance = 0.38;
    if (enemy && enemy.type === 'miniboss') chance = 0.55;
    if (rogueCoreFragmentMisses >= 10) chance = 0.52;
    if (Math.random() >= chance) {
        rogueCoreFragmentMisses++;
        return;
    }

    rogueCoreFragmentMisses = 0;
    var size = 20;
    rogueCoreFragments.push({
        x: Math.max(2, Math.min(canvas.width - size - 2, (enemy.x || 0) + (enemy.size || size) / 2 - size / 2)),
        y: Math.max(0, (enemy.y || 0) + (enemy.size || size) / 2 - size / 2),
        size: size,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 0.8 + Math.random() * 0.8,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.08,
        phase: Math.random() * Math.PI * 2,
        life: 1
    });
    addParticles(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, '#80deea', 14, 7);
    addFloatingText(enemy.x + enemy.size / 2, enemy.y, '💠 ОСКОЛОК', '#80deea', 14);
    playSFX('upgrade');
}

function spawnRogueEnemyHazard(x, y, radius, life, color, kind) {
    if (currentMode !== 'rogue') return;
    rogueEnemyHazards.push({
        x:x, y:y, radius:radius, life:life, maxLife:life,
        color:color || '#ff5c7a', kind:kind || 'blast',
        hitCooldown:0, warning:Math.min(35, Math.floor(life * 0.45))
    });
    if (rogueEnemyHazards.length > 12) rogueEnemyHazards.shift();
}

function updateRogueEnemyHazards() {
    if (currentMode !== 'rogue') {
        rogueEnemyHazards.length = 0;
        return;
    }
    var px = player.x + player.size / 2;
    var py = player.y + player.size / 2;
    for (var i = rogueEnemyHazards.length - 1; i >= 0; i--) {
        var h = rogueEnemyHazards[i];
        h.life--;
        if (h.hitCooldown > 0) h.hitCooldown--;
        if (h.warning > 0) h.warning--;

        if (h.life <= 0) {
            rogueEnemyHazards.splice(i, 1);
            continue;
        }

        if (h.warning <= 0 && h.hitCooldown <= 0 && buff.phantom <= 0 &&
            Math.hypot(px - h.x, py - h.y) < h.radius + player.size * 0.35) {
            if (h.kind === 'freeze') {
                player.frozen = Math.max(player.frozen, 45);
                showToast('🧊 ЗОНА ЛЬДА!', 'info');
            }
            playerTakeDamage();
            h.hitCooldown = h.kind === 'freeze' ? 55 : 45;
        }
    }
}

// ==========================================================