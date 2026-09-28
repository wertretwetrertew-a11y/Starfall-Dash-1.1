/* ==========================================================
   STARFALL DASH — ROGUELIKE 3.0
   Class cores + 100 HP + run-only build system
   Loaded after gameplay.js so the new rules become the active layer.
   ========================================================== */

console.log('★ Starfall Dash Roguelike 3.0 loaded');

var ROGUE_V3 = true;

/* ---------- PERMANENT CLASS CORES ---------- */
CHARACTER_CLASSES = {
    scout: {
        id:'scout', name:'Разведчик', icon:'🏃',
        desc:'Разгоняется и превращает скорость в силу удара.',
        color:'#7cffb2', unlocked:true, unlockText:'Доступен сразу',
        skillId:'kinetic_drive', skillName:'Кинетический разгон',
        skillDesc:'Удар сильнее при высокой скорости. После максимального разгона контакт получает дополнительный импульс.',
        skillMax:10, skillCost:function(lvl){ return 8 + lvl * 4; }
    },
    tank: {
        id:'tank', name:'Таран', icon:'🛡',
        desc:'Выдерживает удар и отвечает мощным столкновением.',
        color:'#4fc3f7', unlocked:false, unlockAchievement:'survivor',
        unlockText:'Продержись 2 минуты в Выживании',
        skillId:'impact_core', skillName:'Ударное ядро',
        skillDesc:'Каждое столкновение наносит усиленный контактный урон. После получения урона следующий удар становится ещё сильнее.',
        skillMax:10, skillCost:function(lvl){ return 10 + lvl * 5; }
    },
    mage: {
        id:'mage', name:'Пульсар', icon:'🔮',
        desc:'Помечает врагов и превращает повторные столкновения в импульс.',
        color:'#e040fb', unlocked:false, unlockAchievement:'warrior',
        unlockText:'Дойди до 5 уровня',
        skillId:'pulse_mark', skillName:'Пульс-метка',
        skillDesc:'Первый контакт ставит метку. Повторный контакт детонирует метку и поражает ближайших врагов.',
        skillMax:10, skillCost:function(lvl){ return 10 + lvl * 5; }
    },
    rogue: {
        id:'rogue', name:'Кровавый охотник', icon:'🩸',
        desc:'Превращает полученный урон в возможность для ответного удара.',
        color:'#ffd93d', unlocked:false, unlockAchievement:'collector',
        unlockText:'Собери 1000 монет',
        skillId:'blood_rush', skillName:'Кровавый рывок',
        skillDesc:'После получения урона следующий контакт становится усиленным и частично восстанавливает HP.',
        skillMax:10, skillCost:function(lvl){ return 12 + lvl * 5; }
    }
};

/* ---------- RUN BUILD ---------- */
UPGRADE_POOL = {
    blood: {
        id:'blood', name:'Кровь', icon:'🩸', rarity:'common', stacks:true, maxStacks:3,
        desc:'Полученный урон создаёт заряд. Следующий контакт расходует его и наносит дополнительный урон.',
        tags:['risk','contact']
    },
    impact: {
        id:'impact', name:'Импакт', icon:'💥', rarity:'common', stacks:true, maxStacks:4,
        desc:'Сила столкновения зависит от скорости куба.',
        tags:['contact','movement']
    },
    counter: {
        id:'counter', name:'Контрудар', icon:'⚔️', rarity:'rare', stacks:true, maxStacks:3,
        desc:'После получения урона открывается короткое окно усиленного следующего контакта.',
        tags:['risk','contact']
    },
    poison: {
        id:'poison', name:'Яд', icon:'☠️', rarity:'common', stacks:true, maxStacks:4,
        desc:'Контакт накладывает яд. Яд наносит периодический урон.',
        tags:['status','contact']
    },
    propagation: {
        id:'propagation', name:'Распространение', icon:'🦠', rarity:'rare', stacks:true, maxStacks:3,
        desc:'Отравленный враг при смерти заражает ближайших врагов.',
        tags:['status','synergy']
    },
    overload: {
        id:'overload', name:'Перегрузка', icon:'⚡', rarity:'rare', stacks:true, maxStacks:3,
        desc:'Убийства заряжают шкалу. При полном заряде происходит мощный импульс вокруг куба.',
        tags:['kills','contact']
    },
    overheat: {
        id:'overheat', name:'Перегрев', icon:'🔥', rarity:'rare', stacks:true, maxStacks:3,
        desc:'Быстрые убийства повышают Heat и усиливают контакт. На критическом Heat игрок получает урон.',
        tags:['risk','kills']
    },
    singularity: {
        id:'singularity', name:'Сингулярность', icon:'🕳️', rarity:'epic', stacks:true, maxStacks:3,
        desc:'Убийства создают гравитационные точки, притягивающие врагов к месту смерти.',
        tags:['control','kills']
    },
    echo: {
        id:'echo', name:'Эхо', icon:'👻', rarity:'rare', stacks:true, maxStacks:3,
        desc:'После смерти врага остаётся Эхо. Следующий враг, коснувшийся его, получает дополнительный эффект.',
        tags:['chain','kills']
    },
    phase: {
        id:'phase', name:'Фаза', icon:'🌌', rarity:'epic', stacks:true, maxStacks:3,
        desc:'После получения урона куб на короткое время становится неуязвимым. Следующий контакт получает Phase Rift.',
        tags:['defense','contact']
    },
    shield: {
        id:'shield', name:'Щит', icon:'🛡', rarity:'common', stacks:true, maxStacks:3,
        desc:'Блокирует один контактный или снарядный удар. При разрушении создаёт короткий импульс.',
        tags:['defense']
    },
    orbit: {
        id:'orbit', name:'Орбита', icon:'🪐', rarity:'epic', stacks:true, maxStacks:3,
        desc:'Энергетический объект вращается вокруг куба и наносит контактный урон врагам.',
        tags:['contact','area']
    }
};

var ROGUE_SYNERGIES = {
    plague: {
        needs:['poison','propagation'], name:'ЧУМА', icon:'☣️',
        desc:'Смерть заражённого врага создаёт усиленную волну заражения.'
    },
    kinetic_engine: {
        needs:['impact','overheat'], name:'КИНЕТИЧЕСКИЙ ДВИГАТЕЛЬ', icon:'🚀',
        desc:'Высокая скорость ускоряет накопление Heat, а Heat усиливает столкновения.'
    },
    blood_revenge: {
        needs:['blood','counter'], name:'КРОВАВАЯ МЕСТЬ', icon:'🩸',
        desc:'Получение урона заряжает сразу Blood и Counter.'
    },
    phase_break: {
        needs:['phase','echo'], name:'РАЗРЫВ ФАЗЫ', icon:'🌀',
        desc:'Контакт после Phase создаёт дополнительный пространственный импульс.'
    },
    supernova: {
        needs:['overload','overheat'], name:'СВЕРХНОВАЯ', icon:'🌟',
        desc:'Полная перегрузка при высоком Heat создаёт два последовательных импульса.'
    },
    gravity_well: {
        needs:['singularity','overload'], name:'ГРАВИТАЦИОННЫЙ КОЛОДЕЦ', icon:'🌌',
        desc:'Полный Overload усиливает притяжение всех активных сингулярностей.'
    }
};

/* ---------- RUN STATE ---------- */
var rogueHP = 100;
var rogueMaxHP = 100;
var rogueXP = 0;
var rogueXPNext = 12;
var rogueHeat = 0;
var rogueOverload = 0;
var rogueBloodCharges = 0;
var rogueCounterTimer = 0;
var roguePhaseTimer = 0;
var roguePhaseReady = false;
var rogueContactTimer = 0;
var roguePulseMarks = {};
var rogueEchoes = [];
var rogueSingularities = [];
var rogueLastBossState = 'none';
var rogueNativeBoost = 0;
var rogueNativeTriggered = false;

function ensureRogueV3Save() {
    var s = getSave();
    if (!s.classSkillLevels) {
        s.classSkillLevels = {};
        persist();
    }
    Object.keys(CHARACTER_CLASSES).forEach(function(id) {
        if (typeof s.classSkillLevels[id] !== 'number') s.classSkillLevels[id] = 1;
    });
    return s;
}

function getClassSkillLevel(id) {
    var s = ensureRogueV3Save();
    return Math.max(1, Math.min(CHARACTER_CLASSES[id].skillMax || 10, s.classSkillLevels[id] || 1));
}

function upgradeClassSkill(id) {
    var cls = CHARACTER_CLASSES[id];
    if (!cls) return;
    var s = ensureRogueV3Save();
    var lvl = getClassSkillLevel(id);
    if (lvl >= cls.skillMax) {
        showToast('★ Навык уже максимального уровня', 'info');
        return;
    }
    var cost = cls.skillCost(lvl);
    if ((s.starShards || 0) < cost) {
        showToast('Нужно ' + cost + ' ✨', 'error');
        return;
    }
    s.starShards -= cost;
    s.classSkillLevels[id] = lvl + 1;
    persist();
    showToast(cls.icon + ' ' + cls.skillName + ' → ур. ' + (lvl + 1), 'legendary');
    if (typeof renderClassScreen === 'function') renderClassScreen();
    if (typeof updateMainMenuStats === 'function') updateMainMenuStats();
}

/* ---------- CLASS SELECT SCREEN ---------- */
function renderClassScreen() {
    ensureRogueV3Save();
    classGrid.innerHTML = '';
    Object.keys(CHARACTER_CLASSES).forEach(function(cid) {
        var cls = CHARACTER_CLASSES[cid];
        var unlocked = isClassUnlocked(cid);
        var lvl = getClassSkillLevel(cid);
        var cost = lvl < cls.skillMax ? cls.skillCost(lvl) : 0;

        var card = document.createElement('button');
        card.className = 'class-card ' + cid + (unlocked ? '' : ' locked');

        var header = document.createElement('div');
        header.className = 'class-card-header';
        header.innerHTML = '<div class="class-icon">' + cls.icon + '</div>' +
            '<div><div class="class-name">' + cls.name + '</div>' +
            '<div class="class-sub">' + (unlocked ? 'Уровень навыка ' + lvl : 'Заблокирован') + '</div></div>';
        card.appendChild(header);

        var desc = document.createElement('div');
        desc.className = 'class-desc';
        desc.textContent = cls.desc;
        card.appendChild(desc);

        var skill = document.createElement('div');
        skill.className = 'class-passive';
        skill.innerHTML = '<b>◆ ' + cls.skillName + ' ' + toRoman(lvl) + '</b><br>' + cls.skillDesc;
        card.appendChild(skill);

        if (unlocked) {
            var actions = document.createElement('div');
            actions.style.cssText = 'display:flex;gap:8px;margin-top:10px;align-items:center;';

            var upgrade = document.createElement('button');
            upgrade.type = 'button';
            upgrade.className = 'modal-btn ghost';
            upgrade.style.cssText = 'flex:1;font-size:11px;';
            upgrade.textContent = lvl >= cls.skillMax ? '★ MAX' : 'Прокачать • ' + cost + ' ✨';
            upgrade.disabled = lvl >= cls.skillMax;
            upgrade.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                upgradeClassSkill(cid);
            });
            actions.appendChild(upgrade);

            var start = document.createElement('span');
            start.style.cssText = 'font-size:10px;opacity:.65;white-space:nowrap;';
            start.textContent = '100 HP';
            actions.appendChild(start);
            card.appendChild(actions);
        } else {
            var lock = document.createElement('div');
            lock.className = 'class-lock-hint';
            lock.textContent = '🔒 ' + (cls.unlockText || '');
            card.appendChild(lock);
        }

        card.addEventListener('click', function() {
            if (!unlocked) {
                showToast('Заблокировано: ' + (cls.unlockText || ''), 'error');
                return;
            }
            selectedClass = cid;
            startRoguelikeRun();
        });
        classGrid.appendChild(card);
    });
}

function toRoman(n) {
    return ['0','I','II','III','IV','V','VI','VII','VIII','IX','X'][n] || String(n);
}

/* ---------- HUD ---------- */
var _rogueOldUpdateHUD = updateHUD;
function updateHUD() {
    _rogueOldUpdateHUD();
    if (currentMode === 'rogue' && hudLives) {
        hudLives.textContent = Math.max(0, Math.ceil(rogueHP)) + ' / ' + rogueMaxHP;
        hudLives.title = 'Здоровье';
    }
}

/* ---------- RESET ---------- */
var _rogueOldReset = reset;
function reset() {
    _rogueOldReset();
    if (currentMode !== 'rogue') return;

    ensureRogueV3Save();
    rogueHP = rogueMaxHP = 100;
    rogueXP = 0;
    rogueXPNext = 12;
    rogueHeat = 0;
    rogueOverload = 0;
    rogueBloodCharges = 0;
    rogueCounterTimer = 0;
    roguePhaseTimer = 0;
    roguePhaseReady = false;
    rogueContactTimer = 0;
    roguePulseMarks = {};
    rogueEchoes = [];
    rogueSingularities = [];
    rogueLastBossState = 'none';
    rogueNativeBoost = 0;
    rogueNativeTriggered = false;

    // lives остаётся техническим флагом совместимости со старым кодом,
    // но больше не является здоровьем Roguelike.
    lives = 1;

    // У всех классов одна и та же базовая выживаемость.
    // Разница идёт через родной навык.
    playerDamage = 1;
    dodgeChance = 0;
    thornsDamage = 0;
    regenTimer = 0;
    vampiresHeal = 0;
    maxShields = 0;
    playerShields = 0;
    enemySlowMult = 1;
    hpPenalty = 0;

    // Level Up теперь запускается убийствами, а не таймером.
    LEVEL_DURATION = 999999999;
    levelTimer = LEVEL_DURATION;

    applyNativeClassSkill();
    updateHUD();
}

/* ---------- NATIVE CLASS SKILLS ---------- */
function applyNativeClassSkill() {
    var cls = getClass(selectedClass);
    var lvl = getClassSkillLevel(selectedClass);

    playerDamage = 1;

    if (cls.skillId === 'kinetic_drive') {
        // Реальный бонус вычисляется перед каждым кадром по скорости.
        rogueNativeBoost = lvl;
    } else if (cls.skillId === 'impact_core') {
        rogueNativeBoost = 1 + lvl * 0.35;
    } else if (cls.skillId === 'pulse_mark') {
        rogueNativeBoost = lvl;
    } else if (cls.skillId === 'blood_rush') {
        rogueNativeBoost = 2 + lvl;
    }
}

function nativeContactDamage() {
    var cls = getClass(selectedClass);
    var lvl = getClassSkillLevel(selectedClass);
    var speedFactor = Math.hypot(player.lastDirX || 0, player.lastDirY || 0);

    if (cls.skillId === 'kinetic_drive') {
        // lastDir is direction, therefore use actual configured movement speed
        // through the class multiplier without creating ranged attacks.
        return Math.max(1, Math.floor(1 + lvl * 0.25 + Math.abs(player.speed || 0) * 0.06));
    }
    if (cls.skillId === 'impact_core') {
        return Math.max(1, Math.floor(1 + lvl * 0.45 + rogueNativeBoost));
    }
    if (cls.skillId === 'pulse_mark') {
        return 1 + Math.floor(lvl * 0.25);
    }
    if (cls.skillId === 'blood_rush') {
        return 1 + (rogueBloodCharges > 0 ? lvl : 0);
    }
    return 1;
}

/* ---------- DAMAGE / 100 HP ---------- */
function playerTakeDamage() {
    if (currentMode !== 'rogue') {
        // Non-Roguelike keeps the old life system.
        if (typeof _rogueOriginalPlayerTakeDamage === 'function') {
            return _rogueOriginalPlayerTakeDamage();
        }
        return;
    }

    if (roguePhaseTimer > 0) return;

    if (playerShields > 0) {
        playerShields--;
        addParticles(player.x + player.size/2, player.y + player.size/2, '#4fc3f7', 15, 10);
        addFloatingText(player.x + player.size/2, player.y - 10, '🛡', '#4fc3f7', 24);
        if (runUpgrades.blood) rogueBloodCharges = Math.min(3, rogueBloodCharges + runUpgrades.blood);
        if (runUpgrades.counter) rogueCounterTimer = 90;
        return;
    }

    var damage = 10;

    rogueHP = Math.max(0, rogueHP - damage);
    levelStats.livesLostThisLevel++;
    player.damageFlash = 18;
    damageFlash = 1;
    screenShake = 14;
    addParticles(player.x + player.size/2, player.y + player.size/2, '#ff5c7a', 12, 8);
    addFloatingText(player.x + player.size/2, player.y - 20, '-' + damage, '#ff5c7a', 24);
    playSFX('hit');
    resetCombo();

    if (runUpgrades.blood) rogueBloodCharges = Math.min(3, rogueBloodCharges + runUpgrades.blood);
    if (runUpgrades.counter) rogueCounterTimer = 90;
    if (runUpgrades.phase) {
        roguePhaseTimer = 45 + runUpgrades.phase * 15;
        roguePhaseReady = true;
    }

    var cls = getClass(selectedClass);
    if (cls.skillId === 'blood_rush') {
        rogueBloodCharges = Math.min(3, rogueBloodCharges + getClassSkillLevel(selectedClass));
    }

    if (rogueHP <= 0) {
        gameOver = true;
        running = false;
        resetFrameClock();
        if (bossState === 'duel' || bossState === 'intro') {
            bossState = 'lost';
            bossStateTimer = 45;
            bossAnnouncement = '☠ DUEL LOST';
            bossAnnouncementTimer = 45;
            updateBossDuelHUD();
            setTimeout(function(){ finishRun(); }, 650);
        } else {
            finishRun();
        }
    }
}

/* Preserve old damage function for non-rogue modes. */
var _rogueOriginalPlayerTakeDamage = null;
(function captureOldDamage(){
    // The original function is no longer directly reachable after the override,
    // so non-Roguelike modes use a compact compatible implementation.
    _rogueOriginalPlayerTakeDamage = function(){
        if (playerShields > 0) { playerShields--; return; }
        lives--;
        if (lives <= 0) { gameOver=true; running=false; finishRun(); }
    };
})();

/* ---------- APPLY RUN SKILLS ---------- */
function applyUpgrade(upgradeId) {
    var up = UPGRADE_POOL[upgradeId];
    if (!up || currentMode !== 'rogue') return;

    runUpgrades[upgradeId] = (runUpgrades[upgradeId] || 0) + 1;
    var stack = runUpgrades[upgradeId];

    if (upgradeId === 'shield') {
        maxShields = Math.min(3, maxShields + 1);
        playerShields = Math.min(maxShields, playerShields + 1);
    }
    if (upgradeId === 'orbit') {
        spawnOrbital();
    }

    var s = getSave();
    s.rogueStats.totalUpgradesPicked = (s.rogueStats.totalUpgradesPicked || 0) + 1;
    var totalNow = Object.keys(runUpgrades).reduce(function(sum,k){return sum+(runUpgrades[k]||0);},0);
    if (totalNow > (s.rogueStats.maxUpgradesInRun || 0)) s.rogueStats.maxUpgradesInRun = totalNow;
    persist();
    updateUpgradeStrip();
    updateHUD();
}

function checkSynergies() {
    if (currentMode !== 'rogue') return;
    var s = getSave();

    Object.keys(ROGUE_SYNERGIES).forEach(function(id){
        var syn = ROGUE_SYNERGIES[id];
        var active = syn.needs.every(function(n){ return !!runUpgrades[n]; });
        if (active && !runSynergies[id]) {
            runSynergies[id] = true;
            if (s.rogueStats) s.rogueStats.synergiesActivated = (s.rogueStats.synergiesActivated || 0) + 1;
            showToast(syn.icon + ' СИНЕРГИЯ: ' + syn.name, 'legendary');
            playSFX('upgrade');
        }
    });
    persist();
}

function getSynergyHint(id) {
    var names = [];
    Object.keys(ROGUE_SYNERGIES).forEach(function(k){
        var syn = ROGUE_SYNERGIES[k];
        if (syn.needs.indexOf(id) !== -1) {
            var other = syn.needs.filter(function(n){return n!==id;});
            if (other.some(function(n){return runUpgrades[n];})) names.push('→ ' + syn.name);
        }
    });
    return names.join(' • ');
}

function pickUpgrade(upgradeId) {
    applyUpgrade(upgradeId);
    checkSynergies();
    closeUpgradeModal();
}

/* ---------- SMART DRAFT ---------- */
function pickRandomUpgrades(count, exclude) {
    exclude = exclude || [];
    var available = Object.keys(UPGRADE_POOL).filter(function(id){
        var u=UPGRADE_POOL[id];
        return exclude.indexOf(id)===-1 && (!u.stacks || (runUpgrades[id]||0)<(u.maxStacks||99));
    });

    // Bias towards compatible pieces, but never force a build.
    var weighted=[];
    available.forEach(function(id){
        var u=UPGRADE_POOL[id], weight=10;
        if (u.tags.some(function(t){
            return Object.keys(runUpgrades).some(function(r){
                return UPGRADE_POOL[r] && UPGRADE_POOL[r].tags.indexOf(t)!==-1;
            });
        })) weight += 7;
        Object.keys(ROGUE_SYNERGIES).forEach(function(k){
            var syn=ROGUE_SYNERGIES[k];
            if (syn.needs.indexOf(id)!==-1 && syn.needs.some(function(n){return n!==id && runUpgrades[n];})) weight += 12;
        });
        var rarity={common:60,rare:25,epic:10,legendary:4,mythic:1}[u.rarity]||10;
        weight += rarity/10;
        for(var i=0;i<Math.ceil(weight);i++) weighted.push(id);
    });

    var picks=[];
    while(picks.length<count && weighted.length){
        var id=weighted[Math.floor(Math.random()*weighted.length)];
        if(picks.indexOf(id)===-1) picks.push(id);
        weighted=weighted.filter(function(x){return x!==id;});
    }
    return picks;
}

/* ---------- XP BY KILLS ---------- */
function rogueRegisterKill(enemy) {
    if (currentMode !== 'rogue' || !enemy || enemy._rogueXPAwarded) return;
    enemy._rogueXPAwarded = true;

    var xp = enemy.type && enemy.type.shape === 'boss' ? 10 : (enemy.t && enemy.t.hp > 1 ? 2 : 1);
    rogueXP += xp;
    addFloatingText(enemy.x + enemy.size/2, enemy.y - 8, '+' + xp + ' XP', '#9c6bff', 13);

    if (runUpgrades.overload) {
        rogueOverload = Math.min(100, rogueOverload + 12 * runUpgrades.overload);
    }
    if (runUpgrades.overheat) {
        rogueHeat = Math.min(100, rogueHeat + 7 * runUpgrades.overheat);
    }
    if (runUpgrades.singularity) {
        rogueSingularities.push({x:enemy.x+enemy.size/2,y:enemy.y+enemy.size/2,life:240,power:runUpgrades.singularity});
    }
    if (runUpgrades.echo) {
        rogueEchoes.push({x:enemy.x+enemy.size/2,y:enemy.y+enemy.size/2,life:180,power:runUpgrades.echo});
    }

    while (rogueXP >= rogueXPNext) {
        rogueXP -= rogueXPNext;
        rogueXPNext = Math.floor(rogueXPNext * 1.32 + 3);
        if (typeof _rogueOldLevelUp === 'function') _rogueOldLevelUp();
    }
}

/* ---------- RUN SYSTEM TICK ---------- */
function rogueTickSystems() {
    if (currentMode !== 'rogue' || !running || gameOver) return;

    if (rogueCounterTimer > 0) rogueCounterTimer--;
    if (roguePhaseTimer > 0) {
        roguePhaseTimer--;
        if (roguePhaseTimer <= 0) roguePhaseReady = false;
    }

    // Poison
    enemies.forEach(function(e){
        if (e._poisonTimer > 0) {
            e._poisonTimer--;
            if (frame % 20 === 0) {
                e.hp -= Math.max(1, runUpgrades.poison || 1);
                e.hitFlash = 4;
            }
        }
    });

    // Singularity
    rogueSingularities.forEach(function(g){
        g.life--;
        var radius=85+g.power*15;
        enemies.forEach(function(e){
            var ex=e.x+e.size/2, ey=e.y+e.size/2;
            var dx=g.x-ex, dy=g.y-ey, d=Math.hypot(dx,dy);
            if(d>2 && d<radius){
                var force=(g.power/25)*(1-d/radius);
                e.x += dx*force; e.y += dy*force;
            }
        });
    });
    rogueSingularities=rogueSingularities.filter(function(g){return g.life>0;});

    // Echo visuals/effects
    rogueEchoes.forEach(function(e){e.life--;});
    rogueEchoes=rogueEchoes.filter(function(e){return e.life>0;});

    // Heat decays slowly.
    if (frame % 30 === 0 && rogueHeat > 0) rogueHeat = Math.max(0, rogueHeat-1);

    // Overload pulse.
    if (rogueOverload >= 100) {
        rogueOverload = 0;
        var radius = 80 + (runUpgrades.overload||1)*15;
        enemies.forEach(function(e){
            var d=Math.hypot((e.x+e.size/2)-(player.x+player.size/2),(e.y+e.size/2)-(player.y+player.size/2));
            if(d<radius) e.hp -= 2 + (runUpgrades.overload||1)*2;
        });
        addParticles(player.x+player.size/2,player.y+player.size/2,'#fff59d',35,18);
        screenShake=12;
        showToast('⚡ ПЕРЕГРУЗКА!', 'epic');
        if(runSynergies.supernova && rogueHeat>=70){
            enemies.forEach(function(e){
                var d=Math.hypot((e.x+e.size/2)-(player.x+player.size/2),(e.y+e.size/2)-(player.y+player.size/2));
                if(d<radius*1.35) e.hp -= 3;
            });
        }
    }

    // Orbiters.
    if (runUpgrades.orbit) {
        orbitals.forEach(function(o){
            o.angle += 0.055;
            o.damageTimer++;
            if(o.damageTimer>=18){
                o.damageTimer=0;
                var ox=player.x+player.size/2+Math.cos(o.angle)*o.distance;
                var oy=player.y+player.size/2+Math.sin(o.angle)*o.distance;
                enemies.forEach(function(e){
                    if(Math.hypot(ox-(e.x+e.size/2),oy-(e.y+e.size/2))<e.size/2+10){
                        e.hp -= 1 + runUpgrades.orbit;
                        e.hitFlash=5;
                    }
                });
            }
        });
    }

    // Heat risk.
    if(runUpgrades.overheat && rogueHeat>=100 && frame%90===0){
        rogueHP=Math.max(0,rogueHP-3);
        addFloatingText(player.x+player.size/2,player.y-10,'OVERHEAT -3','#ff5722',14);
        if(rogueHP<=0) playerTakeDamage();
    }
}

/* ---------- CONTACT / CLASS TRIGGERS ---------- */
function rogueDetectContact() {
    if(currentMode!=='rogue' || !running || gameOver) return;

    var px=player.x+player.size/2, py=player.y+player.size/2;
    var hitEnemy=null;
    for(var i=0;i<enemies.length;i++){
        var e=enemies[i];
        if(e.x<player.x+player.size && e.x+e.size>player.x &&
           e.y<player.y+player.size && e.y+e.size>player.y){
            hitEnemy=e; break;
        }
    }

    if(!hitEnemy) return;
    if(rogueContactTimer>0) return;
    rogueContactTimer=8;

    var cls=getClass(selectedClass), lvl=getClassSkillLevel(selectedClass);

    // Native Mage: mark on first contact, detonate on the next.
    if(cls.skillId==='pulse_mark'){
        var key=hitEnemy._rogueId || (hitEnemy._rogueId='e'+Math.random());
        if(roguePulseMarks[key]){
            roguePulseMarks[key]=false;
            var radius=45+lvl*5;
            enemies.forEach(function(e){
                var d=Math.hypot((e.x+e.size/2)-px,(e.y+e.size/2)-py);
                if(d<radius) e.hp-=1+Math.floor(lvl/2);
            });
            addParticles(px,py,'#e040fb',20,12);
        }else{
            roguePulseMarks[key]=true;
        }
    }

    // Native Blood class heals when the charged hit lands.
    if(cls.skillId==='blood_rush' && rogueBloodCharges>0){
        rogueBloodCharges--;
        var heal=4+lvl;
        rogueHP=Math.min(rogueMaxHP,rogueHP+heal);
        addFloatingText(px,py,'+'+heal+' HP','#ff5c7a',14);
    }

    // Generic Blood / Counter.
    if(runUpgrades.blood && rogueBloodCharges>0){
        rogueBloodCharges=Math.max(0,rogueBloodCharges-1);
        hitEnemy.hp-=runUpgrades.blood*2;
    }
    if(runUpgrades.counter && rogueCounterTimer>0){
        hitEnemy.hp-=2+runUpgrades.counter*2;
        rogueCounterTimer=0;
    }

    // Phase Rift.
    if(runUpgrades.phase && roguePhaseReady && roguePhaseTimer>0){
        roguePhaseReady=false;
        var pr=45+runUpgrades.phase*10;
        enemies.forEach(function(e){
            var d=Math.hypot((e.x+e.size/2)-px,(e.y+e.size/2)-py);
            if(d<pr) e.hp-=2+runUpgrades.phase;
        });
        addParticles(px,py,'#7c4dff',18,10);
    }

    // Poison.
    if(runUpgrades.poison){
        hitEnemy._poisonTimer=Math.max(hitEnemy._poisonTimer||0,90+runUpgrades.poison*45);
    }

    // Echo consumes on contact.
    if(runUpgrades.echo){
        for(var ei=0;ei<rogueEchoes.length;ei++){
            var ec=rogueEchoes[ei];
            if(Math.hypot(ec.x-(hitEnemy.x+hitEnemy.size/2),ec.y-(hitEnemy.y+hitEnemy.size/2))<30){
                hitEnemy.hp-=2+ec.power;
                rogueEchoes.splice(ei,1);
                break;
            }
        }
    }

    // Plague propagation.
    if(runSynergies.plague && hitEnemy._poisonTimer>0 && Math.random()<0.18){
        enemies.forEach(function(e){
            if(e===hitEnemy) return;
            var d=Math.hypot((e.x+e.size/2)-(hitEnemy.x+hitEnemy.size/2),(e.y+e.size/2)-(hitEnemy.y+hitEnemy.size/2));
            if(d<55) e._poisonTimer=Math.max(e._poisonTimer||0,80);
        });
    }
}

/* ---------- MAIN UPDATE WRAPPER ---------- */
var _rogueOldUpdate = update;
function update() {
    if(currentMode==='rogue'){
        if(rogueContactTimer>0) rogueContactTimer--;
        applyNativeClassSkill();

        var cls=getClass(selectedClass);
        if(cls.skillId==='kinetic_drive'){
            // playerDamage is the contact attack, never a projectile.
            playerDamage=nativeContactDamage();
        }else if(cls.skillId==='impact_core'){
            playerDamage=nativeContactDamage();
        }else{
            playerDamage=Math.max(1,nativeContactDamage());
        }

        if(runUpgrades.impact){
            playerDamage += Math.floor(runUpgrades.impact * Math.min(3, (player.speed||7)/7));
        }
        if(runUpgrades.overheat){
            playerDamage += Math.floor(rogueHeat/35) * runUpgrades.overheat;
        }
        if(rogueCounterTimer>0) playerDamage += 1 + (runUpgrades.counter||0);
        if(rogueBloodCharges>0 && runUpgrades.blood) playerDamage += runUpgrades.blood;

        if(roguePhaseTimer>0){
            buff.phantom=Math.max(buff.phantom,1);
        }else if(buff.phantom===1){
            buff.phantom=0;
        }

        rogueTickSystems();
        rogueDetectContact();
    }
    _rogueOldUpdate();

    if(currentMode==='rogue'){
        // Boss victory grants a meaningful XP burst without creating a second level system.
        if(rogueLastBossState!=='victory' && bossState==='victory'){
            rogueLastBossState='victory';
            rogueXP += 8;
            if(rogueXP>=rogueXPNext && typeof _rogueOldLevelUp==='function'){
                rogueXP-=rogueXPNext;
                rogueXPNext=Math.floor(rogueXPNext*1.32+3);
                _rogueOldLevelUp();
            }
        }
        if(bossState!=='victory') rogueLastBossState=bossState;
    }
}

/* ---------- LEVEL UP: XP ONLY ---------- */
var _rogueOldLevelUp = levelUp;
function levelUp() {
    if(currentMode!=='rogue') return _rogueOldLevelUp();

    var s=getSave();
    var mode=MODES[currentMode];
    var baseGold=15+level*5;
    var totalGold=Math.floor(baseGold*mode.goldMultiplier*coreBonusCache.greed);
    s.bank+=totalGold; goldEarned+=totalGold;

    level++;
    levelStats={coinsThisLevel:0,livesLostThisLevel:0,levelStartTime:performance.now()};

    showLevelToast(level,totalGold,'',getCoinMultiplier());
    addParticles(canvas.width/2,canvas.height/2,'#9c6bff',20,10);
    playSFX('level');
    updateHUD();

    // Every level in Roguelike is a new temporary skill choice.
    showUpgradeChoice();
    checkAchievements();
    persist();
}

/* ---------- LEVEL CHOICE ---------- */
function showUpgradeChoice() {
    var count=3;
    pendingUpgradeChoices=pickRandomUpgrades(count);
    if(!pendingUpgradeChoices.length){
        showToast('Больше временных навыков нет', 'info');
        return;
    }
    isChoosingUpgrade=true;
    running=false;
    resetFrameClock();
    upgradeTitle.textContent='🎉 УРОВЕНЬ '+level+' — НОВЫЙ НАВЫК';
    renderUpgradeCards();
    upgradeModal.classList.add('open');
    updateRerollButton();
    playSFX('upgrade');
}

function renderUpgradeCards() {
    upgradeCardsEl.innerHTML='';
    pendingUpgradeChoices.forEach(function(id){
        var up=UPGRADE_POOL[id], stack=runUpgrades[id]||0;
        var card=document.createElement('div');
        card.className='upgrade-card '+up.rarity;

        var rarity=document.createElement('div');
        rarity.className='upgrade-rarity '+up.rarity;
        rarity.textContent=up.rarity.toUpperCase();
        card.appendChild(rarity);

        var icon=document.createElement('div');
        icon.className='upgrade-icon'; icon.textContent=up.icon; card.appendChild(icon);

        var name=document.createElement('div');
        name.className='upgrade-name'; name.textContent=up.name; card.appendChild(name);

        var desc=document.createElement('div');
        desc.className='upgrade-desc'; desc.textContent=up.desc; card.appendChild(desc);

        if(up.stacks){
            var info=document.createElement('div');
            info.className='upgrade-stack-info';
            info.textContent='Уровень навыка: '+(stack+1)+' / '+up.maxStacks;
            card.appendChild(info);
        }

        var hint=getSynergyHint(id);
        if(hint){
            var h=document.createElement('div');
            h.className='upgrade-hint'; h.textContent='⚡ '+hint; card.appendChild(h);
        }

        card.addEventListener('click',function(){pickUpgrade(id);});
        upgradeCardsEl.appendChild(card);
    });
}

function closeUpgradeModal() {
    upgradeModal.classList.remove('open');
    isChoosingUpgrade=false;
    running=true;
    pendingUpgradeChoices=[];
    resetFrameClock();
    updateHUD();
}

/* ---------- RUN RESULT ---------- */
var _rogueOldFinishRun=finishRun;
function finishRun() {
    if(currentMode==='rogue'){
        // Run-only state is intentionally discarded after result screen.
        var s=getSave();
        s.lastRogueClass=selectedClass;
        s.lastRogueClassSkillLevel=getClassSkillLevel(selectedClass);
        persist();
    }
    _rogueOldFinishRun();
}

/* ---------- CLASS-ONLY PERSISTENCE RULE ---------- */
function clearRogueRunState() {
    runUpgrades={};
    runSynergies={};
    runRelics=[];
    rogueXP=0;
    rogueHeat=0;
    rogueOverload=0;
    rogueBloodCharges=0;
    rogueEchoes=[];
    rogueSingularities=[];
}

/* Ensure old reset cannot carry old upgrade data into the new run. */
ensureRogueV3Save();
