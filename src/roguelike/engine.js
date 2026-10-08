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
        speed:1, startHp:100,
        desc:'Разгоняется и превращает скорость в силу удара.',
        color:'#7cffb2', unlocked:true, unlockText:'Доступен сразу',
        skillId:'kinetic_drive', skillName:'Кинетический разгон',
        skillDesc:'Удар сильнее при высокой скорости. После максимального разгона контакт получает дополнительный импульс.',
        skillMax:10, skillCost:function(lvl){ return 8 + lvl * 4; }
    },
    tank: {
        id:'tank', name:'Таран', icon:'🛡',
        speed:1, startHp:100,
        desc:'Выдерживает удар и отвечает мощным столкновением.',
        color:'#4fc3f7', unlocked:false, unlockAchievement:'survivor',
        unlockText:'Продержись 2 минуты в Выживании',
        skillId:'impact_core', skillName:'Ударное ядро',
        skillDesc:'Каждое столкновение наносит усиленный контактный урон. После получения урона следующий удар становится ещё сильнее.',
        skillMax:10, skillCost:function(lvl){ return 10 + lvl * 5; }
    },
    mage: {
        id:'mage', name:'Пульсар', icon:'🔮',
        speed:1, startHp:100,
        desc:'Помечает врагов и превращает повторные столкновения в импульс.',
        color:'#e040fb', unlocked:false, unlockAchievement:'warrior',
        unlockText:'Дойди до 5 уровня',
        skillId:'pulse_mark', skillName:'Пульс-метка',
        skillDesc:'Первый контакт ставит метку. Повторный контакт детонирует метку и поражает ближайших врагов.',
        skillMax:10, skillCost:function(lvl){ return 10 + lvl * 5; }
    },
    rogue: {
        id:'rogue', name:'Кровавый охотник', icon:'🩸',
        speed:1, startHp:100,
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
 poison:{id:'poison',name:'Яд',icon:'☠️',rarity:'common',stacks:true,maxStacks:3,desc:'Периодически создаёт вокруг героя ядовитую область. Враги внутри получают периодический урон.',tags:['status','area']},
 propagation:{id:'propagation',name:'Распространение',icon:'🦠',rarity:'common',stacks:true,maxStacks:3,desc:'Распространяет эффекты, которые поддерживают цепное распространение: яд и молнию — независимо друг от друга.',tags:['status','chain']},
 shield:{id:'shield',name:'Щит',icon:'🛡',rarity:'common',stacks:true,maxStacks:3,desc:'Блокирует один контактный или снарядный удар. Когда щит полностью пробит, следующий полученный урон восстанавливает запас щитов.',tags:['defense']},
 orbit:{id:'orbit',name:'Орбита',icon:'🪐',rarity:'common',stacks:true,maxStacks:3,desc:'Энергетический объект вращается вокруг куба и наносит контактный урон врагам.',tags:['contact','area']},
 lightning:{id:'lightning',name:'Молния',icon:'⚡',rarity:'common',stacks:true,maxStacks:3,desc:'Автоматически бьёт ближайшего врага и цепляется к следующим целям. С каждым прыжком урон уменьшается.',tags:['auto','chain']},
 vampirism:{id:'vampirism',name:'Вампиризм',icon:'🩸',rarity:'common',stacks:true,maxStacks:3,desc:'Возвращает часть фактически нанесённого врагам урона. Максимум лечения от Вампиризма — 100 HP в секунду.',tags:['sustain','damage']}
};

/* ---------- RUN STATE ---------- */
var rogueHP = 100;
var rogueMaxHP = 100;
var rogueXP = 0;
var rogueXPNext = 8;
var rogueXPOrbs = [];
var rogueHeat = 0;
var rogueOverload = 0;
var rogueBloodCharges = 0;
var rogueCounterTimer = 0;
var roguePhaseTimer = 0;
var roguePhaseReady = false;
var rogueContactTimer = 0;
var roguePulseMarks = {};
var rogueLastBossState = 'none';
var rogueNativeBoost = 0;
var rogueNativeTriggered = false;
var rogueImpactReady = false;
var rogueMovementSpeed = 0;
var roguePrevPlayerX = 0;
var roguePrevPlayerY = 0;
var rogueKillChainTimer = 0;
var roguePoisonZoneTimer = 0;
var roguePoisonZoneActive = false;
var roguePoisonZoneTick = 0;
var rogueLightningCooldown = 0;
var rogueLightningBolts = [];
var rogueVampirismSecond = -1;
var rogueVampirismHealedThisSecond = 0;

var _rogueSaveReady = false;
var _rogueSaveProfileRef = null;
function ensureRogueV3Save() {
    var profileRef = (typeof currentProfile !== 'undefined') ? currentProfile : null;
    if (_rogueSaveReady && _rogueSaveProfileRef === profileRef && profileRef && profileRef.data) {
        return profileRef.data;
    }
    var s = (profileRef && profileRef.data) ? profileRef.data : getSave();
    if (!s.classSkillLevels) s.classSkillLevels = {};
    Object.keys(CHARACTER_CLASSES).forEach(function(id) {
        if (typeof s.classSkillLevels[id] !== 'number') s.classSkillLevels[id] = 1;
    });
    if (!s.rogueProgress || typeof s.rogueProgress !== 'object') {
        s.rogueProgress = { planetIndex:0, stageIndex:0, bossUnlocked:false };
    }
    s.rogueProgress.planetIndex = Math.max(0, Math.min(2, Number(s.rogueProgress.planetIndex)||0));
    s.rogueProgress.stageIndex = Math.max(0, Math.min(3, Number(s.rogueProgress.stageIndex)||0));
    s.rogueProgress.bossUnlocked = !!s.rogueProgress.bossUnlocked;
    if (profileRef && profileRef.data === s) persist();
    _rogueSaveProfileRef = profileRef;
    _rogueSaveReady = true;
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
updateHUD = function updateHUD() {
    _rogueOldUpdateHUD();
    document.body.classList.toggle('rogue-hud', currentMode === 'rogue');
    if (currentMode === 'rogue') {
        // Roguelike HUD: one HP bar under the XP bar in the top HUD.
        var hpValue = Math.max(0, Math.min(Number(rogueMaxHP) || 100, Number(rogueHP) || 0));
        if (hudLives) {
            hudLives.textContent = Math.ceil(hpValue) + ' / ' + Math.ceil(Number(rogueMaxHP) || 100);
            hudLives.title = 'Здоровье';
        }
        var hpBar = document.getElementById('hud-hp-fill');
        if (hpBar) {
            var hpRatio = (Number(rogueMaxHP) || 100) > 0 ? hpValue / (Number(rogueMaxHP) || 100) : 0;
            hpBar.style.width = (Math.max(0, Math.min(1, hpRatio)) * 100) + '%';
            hpBar.classList.toggle('critical', hpRatio <= 0.3);
        }

        // Roguelike: XP is the upper bar of the top HUD.
        var xpBar = document.getElementById('hud-progress-fill');
        var xpTrack = document.getElementById('hud-progress');
        var xpValue = document.getElementById('hud-xp-value');
        if (xpBar && xpTrack) {
            var need = Math.max(1, Number(rogueXPNext) || 1);
            var current = Math.max(0, Number(rogueXP) || 0);
            var ratio = Math.max(0, Math.min(1, current / need));
            xpBar.style.width = (ratio * 100) + '%';
            if (xpValue) xpValue.textContent = current + ' / ' + need;
            xpTrack.title = 'Опыт: ' + current + ' / ' + need + ' XP';
            xpTrack.setAttribute('aria-label', 'Опыт до следующего уровня: ' + current + ' из ' + need);
        }
    }
}

/* ---------- RESET ---------- */
var _rogueOldReset = reset;
reset = function reset() {
    _rogueOldReset();
    if (currentMode !== 'rogue') return;

    ensureRogueV3Save();
    rogueHP = rogueMaxHP = 100;
    rogueXP = 0;
    rogueXPNext = 8;
    rogueXPOrbs = [];
    rogueHeat = 0;
    rogueOverload = 0;
    rogueBloodCharges = 0;
    rogueCounterTimer = 0;
    roguePhaseTimer = 0;
    playerShields = 0;
    maxShields = 0;
    rogueShieldBroken = false;
    roguePhaseReady = false;
    rogueContactTimer = 0;
    roguePulseMarks = {};
    rogueLastBossState = 'none';
    rogueNativeBoost = 0;
    rogueNativeTriggered = false;
    rogueImpactReady = false;
    rogueMovementSpeed = 0;
    roguePrevPlayerX = player.x;
    roguePrevPlayerY = player.y;
    rogueKillChainTimer = 0;
    roguePoisonZoneTimer = 0;
    roguePoisonZoneActive = false;
    roguePoisonZoneTick = 0;
    rogueLightningCooldown = 0;
    rogueLightningBolts = [];
    rogueVampirismSecond = -1;
    rogueVampirismHealedThisSecond = 0;

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
    rogueShieldBroken = false;
    enemySlowMult = 1;
    hpPenalty = 0;

    // Level Up теперь запускается убийствами, а не таймером.
    LEVEL_DURATION = 999999999;
    levelTimer = LEVEL_DURATION;

    applyNativeClassSkill();
    updateHUD();
}

/* ---------- NATIVE CLASS SKILLS ---------- */
function ensureFiniteRoguePlayerState() {
    if (currentMode !== 'rogue') return;
    var valid = Number.isFinite(player.x) && Number.isFinite(player.y) &&
                Number.isFinite(player.size) && player.size > 0 &&
                Number.isFinite(player.speed) && player.speed > 0;
    if (!valid) {
        console.warn('⚠ Rogue player state became non-finite; restoring player state');
        player.size = 30;
        player.speed = 7;
        player.x = canvas.width / 2 - player.size / 2;
        player.y = canvas.height * 0.57 - player.size / 2;
        player.vx = 0;
        player.vy = 0;
        player.lastDirX = 0;
        player.lastDirY = 1;
        player.frozen = 0;
        player.inWeb = false;
        player.tilt = 0;
    }
}

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
    var speedFactor = Math.max(0, rogueMovementSpeed);

    if (cls.skillId === 'kinetic_drive') {
        return Math.max(1, Math.floor(1 + lvl * 0.25 + speedFactor * 0.18));
    }
    if (cls.skillId === 'impact_core') {
        var base = 1 + lvl * 0.28;
        if (rogueImpactReady) base += 3 + lvl * 0.55;
        return Math.max(1, Math.floor(base));
    }
    if (cls.skillId === 'pulse_mark') {
        return 1 + Math.floor(lvl * 0.25);
    }
    if (cls.skillId === 'blood_rush') {
        return 1 + (rogueBloodCharges > 0 ? lvl : 0);
    }
    return 1;
}

/* ---------- UNIFIED ROGUELIKE DAMAGE ---------- */
/* Every actual enemy damage event goes through this function.
   Vampirism therefore works with contact, poison, lightning and all
   other run-only damage sources without creating extra healing paths. */
function rogueDealDamage(enemy, amount, source) {
    if (currentMode !== 'rogue' || !enemy || enemy.hp <= 0) return 0;
    amount = Math.max(0, Number(amount) || 0);
    var before = Math.max(0, Number(enemy.hp) || 0);
    var dealt = Math.min(before, amount);
    if (dealt <= 0) return 0;

    enemy.hp = Math.max(0, before - dealt);

    if (runUpgrades.vampirism) {
        var second = Math.floor((typeof frame === 'number' ? frame : 0) / 60);
        if (second !== rogueVampirismSecond) {
            rogueVampirismSecond = second;
            rogueVampirismHealedThisSecond = 0;
        }
        var vampLevel = Math.max(1, Math.min(3, runUpgrades.vampirism));
        var vampRatio = [0, 0.05, 0.10, 0.15][vampLevel];
        var wantedHeal = dealt * vampRatio;
        var room = Math.max(0, 100 - rogueVampirismHealedThisSecond);
        var heal = Math.min(wantedHeal, room, Math.max(0, rogueMaxHP - rogueHP));
        if (heal > 0) {
            rogueHP += heal;
            rogueVampirismHealedThisSecond += heal;
        }
    }
    return dealt;
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
        if (playerShields <= 0) rogueShieldBroken = true;
        var sx = player.x + player.size/2, sy = player.y + player.size/2;
        var shieldPower = 2 + Math.max(1, maxShields || 1);
        enemies.forEach(function(e){
            var d = Math.hypot((e.x+e.size/2)-sx, (e.y+e.size/2)-sy);
            if(d < 55){
                rogueDealDamage(e, shieldPower, 'shield');
                e.hitFlash = 8;
            }
        });
        addParticles(sx, sy, '#4fc3f7', 22, 12);
        addFloatingText(sx, player.y - 10, '🛡 ИМПУЛЬС', '#4fc3f7', 16);
        screenShake = 8;
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

    if (runUpgrades.shield && rogueShieldBroken) {
        rogueShieldBroken = false;
        rogueGrantShields(runUpgrades.shield);
        showToast('🛡 ЩИТ ВОССТАНОВЛЕН!', 'info');
    }
    if (getClass(selectedClass).skillId === 'impact_core') rogueImpactReady = true;
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
var _rogueOriginalPlayerTakeDamage = rogueLegacyPlayerTakeDamage;
/* Legacy handler is preserved from gameplay.js. */

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

function pickUpgrade(upgradeId){ applyUpgrade(upgradeId); closeUpgradeModal(); }

/* ---------- SMART DRAFT ---------- */
function pickRandomUpgrades(count, exclude) {
    exclude = exclude || [];
    var available = Object.keys(UPGRADE_POOL).filter(function(id){
        var u=UPGRADE_POOL[id];
        return exclude.indexOf(id)===-1 && (!u.stacks || (runUpgrades[id]||0)<(u.maxStacks||99));
    });

    // Временные навыки пока имеют одинаковую редкость и одинаковый шанс.
    // Никаких скрытых бонусов за совместимость или редкость: каждый доступный
    // навык имеет одинаковый вес в выборе.
    var weighted=[];
    available.forEach(function(id){
        weighted.push(id);
    });

    var picks=[];
    while(picks.length<count && weighted.length){
        var id=weighted[Math.floor(Math.random()*weighted.length)];
        if(picks.indexOf(id)===-1) picks.push(id);
        weighted=weighted.filter(function(x){return x!==id;});
    }
    return picks;
}

/* ---------- STAGE KILLS / RUN SYSTEM ---------- */
function rogueRegisterKill(enemy) {
    if (currentMode !== 'rogue' || !enemy || enemy._rogueXPAwarded) return;
    enemy._rogueXPAwarded = true;

    // XP is a field drop, not a kill reward. It is spawned by the gameplay
    // loop at a lower frequency than gold.

    var rapidKill = rogueKillChainTimer > 0;
    rogueKillChainTimer = 90;

    // Propagation is no longer death-triggered.
    // A debuff spreads while its persistent source area is active.
}
function rogueGrantShields(stacks) {
    stacks = Math.max(0, Number(stacks) || 0);
    maxShields = stacks;
    playerShields = Math.min(maxShields, playerShields + stacks);
    if (stacks > 0) {
        addFloatingText(player.x + player.size/2, player.y - 18, '🛡 +' + stacks, '#4fc3f7', 15);
        addParticles(player.x + player.size/2, player.y + player.size/2, '#4fc3f7', 10, 7);
    }
}
function rogueEnsureShieldCapacity() {
    if (!runUpgrades.shield) {
        playerShields = 0;
        maxShields = 0;
        return;
    }
    maxShields = Math.max(1, runUpgrades.shield);
    playerShields = Math.min(playerShields, maxShields);
}

/* ---------- LIGHTNING ---------- */
/* Lightning is a completely independent effect.
   Spread can extend its chain, but lightning never transfers poison
   and never turns poison into a lightning target/conductor. */
function rogueTriggerLightning() {
    if (currentMode !== 'rogue' || !running || gameOver || !runUpgrades.lightning || !enemies.length) return;

    var level = Math.max(1, Math.min(3, runUpgrades.lightning));
    var candidates = enemies.filter(function(e){ return e && e.hp > 0; });
    if (!candidates.length) return;

    var px = player.x + player.size / 2;
    var py = player.y + player.size / 2;
    candidates.sort(function(a,b){
        var ad=Math.hypot((a.x+a.size/2)-px,(a.y+a.size/2)-py);
        var bd=Math.hypot((b.x+b.size/2)-px,(b.y+b.size/2)-py);
        return ad-bd;
    });

    var chain = [candidates[0]];
    var used = {};
    used[candidates[0]._rogueId || (candidates[0]._rogueId='e'+Math.random())] = true;

    var spreadLevel = runUpgrades.propagation ? Math.max(1,Math.min(3,runUpgrades.propagation)) : 0;
    var spreadRadius = spreadLevel ? [0,180,220,260][spreadLevel] : 0;
    var normalJumpRadius = 220;

    // Lightning is a real chain at every level, not a single-target hit.
    // Level controls the base number of jumps; Propagation extends the chain.
    var maxTargets = [0,2,3,4][level] + (spreadLevel ? spreadLevel : 0);

    while (chain.length < candidates.length && chain.length < maxTargets) {
        var source = chain[chain.length - 1];
        var sx=source.x+source.size/2, sy=source.y+source.size/2;
        var best=null, bestD=Infinity;

        candidates.forEach(function(target){
            if (!target || target.hp<=0) return;
            var key=target._rogueId || (target._rogueId='e'+Math.random());
            if (used[key]) return;
            var d=Math.hypot((target.x+target.size/2)-sx,(target.y+target.size/2)-sy);
            var limit = spreadLevel ? spreadRadius : normalJumpRadius;
            if (d <= limit && d < bestD) {
                best=target;
                bestD=d;
            }
        });

        if (!best) break;
        chain.push(best);
        used[best._rogueId] = true;
    }

    var baseDamage = [0,8,12,16][level];
    var falloff = [1,1,0.70,0.50,0.35,0.25];
    var segments=[];
    for (var i=0;i<chain.length;i++) {
        var target=chain[i];
        var damage=Math.max(1,Math.floor(baseDamage * (falloff[Math.min(i,falloff.length-1)] || 0.25)));
        rogueDealDamage(target, damage, 'lightning');
        target.hitFlash=7;
        segments.push({
            x:target.x+target.size/2,
            y:target.y+target.size/2
        });
    }

    if (segments.length) {
        rogueLightningBolts.push({start:{x:px,y:py},points:segments,life:9,maxLife:9});
        addParticles(segments[0].x,segments[0].y,'#8fe8ff',10,8);
        screenShake=Math.max(screenShake,3);
    }
}

function rogueTickLightning() {
    if (rogueLightningCooldown > 0) rogueLightningCooldown--;
    if (runUpgrades.lightning && rogueLightningCooldown <= 0) {
        var level=Math.max(1,Math.min(3,runUpgrades.lightning));
        rogueTriggerLightning();
        rogueLightningCooldown=[0,180,140,100][level]; // 3.0 / 2.33 / 1.67 sec
    }
    for(var i=rogueLightningBolts.length-1;i>=0;i--){
        rogueLightningBolts[i].life--;
        if(rogueLightningBolts[i].life<=0) rogueLightningBolts.splice(i,1);
    }
}

function rogueDrawLightning() {
    if(currentMode!=='rogue' || !running || !rogueLightningBolts.length) return;
    ctx.save();
    rogueLightningBolts.forEach(function(bolt){
        var alpha=Math.max(0,bolt.life/bolt.maxLife);
        var pts=[bolt.start].concat(bolt.points);
        ctx.globalAlpha=alpha;
        ctx.lineWidth=5;
        ctx.strokeStyle='#8fe8ff';
        ctx.shadowColor='#8fe8ff';
        ctx.shadowBlur=14;
        ctx.beginPath();
        ctx.moveTo(pts[0].x,pts[0].y);
        for(var i=1;i<pts.length;i++){
            var p=pts[i], prev=pts[i-1];
            var mx=(prev.x+p.x)/2, my=(prev.y+p.y)/2;
            ctx.lineTo(mx + (i%2 ? 7 : -7), my + (i%2 ? -5 : 5));
            ctx.lineTo(p.x,p.y);
        }
        ctx.stroke();
    });
    ctx.restore();
}

/* ---------- RUN SYSTEM TICK ---------- */
function rogueTickSystems() {
    if (currentMode !== 'rogue' || !running || gameOver) return;
    rogueEnsureShieldCapacity();

    if (rogueCounterTimer > 0) rogueCounterTimer--;
    if (rogueKillChainTimer > 0) rogueKillChainTimer--;
    if (roguePhaseTimer > 0) {
        roguePhaseTimer--;
        if (roguePhaseTimer <= 0) roguePhaseReady = false;
    }

    // Poison zone: the run-only Poison upgrade creates a timed area that follows the player.
    if (runUpgrades.poison) {
        var poisonLevel = Math.max(1, Math.min(3, runUpgrades.poison));
        var poisonActiveFrames = [0, 210, 300, 390][poisonLevel]; // 3.5s / 5s / 6.5s
        var poisonCooldownFrames = [0, 360, 300, 240][poisonLevel]; // 6s / 5s / 4s
        if (roguePoisonZoneActive) {
            roguePoisonZoneTimer--;
            roguePoisonZoneTick++;
            var zoneCx = player.x + player.size / 2;
            var zoneCy = player.y + player.size / 2;
            var zoneRadius = [0, 90, 125, 165][poisonLevel];

            // Apply/refresh poison while an enemy remains inside the moving zone.
            if (roguePoisonZoneTick >= [0, 60, 45, 30][poisonLevel]) {
                roguePoisonZoneTick = 0;
                enemies.forEach(function(e) {
                    if (!e || e.hp <= 0) return;
                    var ex = e.x + e.size / 2, ey = e.y + e.size / 2;
                    var dx = ex - zoneCx, dy = ey - zoneCy;
                    if (dx * dx + dy * dy <= zoneRadius * zoneRadius) {
                        e._rogueWasPoisoned = true;
                        e._poisonTimer = Math.max(e._poisonTimer || 0, [0, 180, 240, 300][poisonLevel]);
                    }
                });
            }
            if (roguePoisonZoneTimer <= 0) {
                roguePoisonZoneActive = false;
                roguePoisonZoneTimer = poisonCooldownFrames;
                roguePoisonZoneTick = 0;
            }
        } else {
            roguePoisonZoneTimer--;
            if (roguePoisonZoneTimer <= 0) {
                roguePoisonZoneActive = true;
                roguePoisonZoneTimer = poisonActiveFrames;
                roguePoisonZoneTick = [0, 60, 45, 30][poisonLevel];
            }
        }
    } else {
        roguePoisonZoneActive = false;
        roguePoisonZoneTimer = 0;
        roguePoisonZoneTick = 0;
    }

    // Poison damage continues after leaving the zone for a short duration.
    enemies.forEach(function(e){
        if (e._poisonTimer > 0) {
            e._poisonTimer--;
            var poisonDamageTick = [0, 30, 24, 18][Math.max(1, Math.min(3, runUpgrades.poison || 1))];
            if (poisonDamageTick > 0 && frame % poisonDamageTick === 0) {
                rogueDealDamage(e, Math.max(1, runUpgrades.poison || 1), 'poison');
                e.hitFlash = 4;

                // First poison damage turns this enemy into a permanent propagation source.
                // The source area follows the enemy until it dies.
                if (runUpgrades.propagation && !e._rogueSpreadSource) {
                    e._rogueSpreadSource = 'poison';
                    e._rogueSpreadLevel = Math.max(1, Math.min(3, runUpgrades.poison || 1));
                }
            }
        }
    });

    // Spread is a universal propagation modifier. Poison uses it for poison,
    // while Lightning uses the same upgrade independently for lightning chaining.
    if (runUpgrades.poison && runUpgrades.propagation) {
        var propagationLevel = Math.max(1, Math.min(3, runUpgrades.propagation));
        var propagationRadius = [0,90,125,165][propagationLevel];
        var propagationPoisonLevel = Math.max(1, Math.min(3, runUpgrades.poison));
        var propagationPoisonDuration = [0,180,240,300][propagationPoisonLevel];

        enemies.forEach(function(source){
            if (!source || source.hp <= 0 || source._rogueSpreadSource !== 'poison') return;
            var sx = source.x + source.size / 2;
            var sy = source.y + source.size / 2;

            enemies.forEach(function(other){
                if (!other || other === source || other.hp <= 0) return;
                var ox = other.x + other.size / 2;
                var oy = other.y + other.size / 2;
                var dx = ox - sx, dy = oy - sy;
                if (dx * dx + dy * dy <= propagationRadius * propagationRadius) {
                    other._rogueWasPoisoned = true;
                    other._poisonTimer = Math.max(other._poisonTimer || 0, propagationPoisonDuration);
                }
            });
        });
    }

    rogueTickLightning();

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
                        rogueDealDamage(e, 1 + runUpgrades.orbit, 'orbit');
                        e.hitFlash=5;
                    }
                });
            }
        });
    }

}

/* ---------- CONTACT / CLASS TRIGGERS ---------- */
function rogueDetectContact() {
    if(currentMode!=='rogue' || !running || gameOver) return;

    var px=player.x+player.size/2, py=player.y+player.size/2;
    var cls=getClass(selectedClass), lvl=getClassSkillLevel(selectedClass);

    for(var i=0;i<enemies.length;i++){
        var hitEnemy=enemies[i];
        if(!hitEnemy || hitEnemy.hp<=0) continue;
        if(hitEnemy.rogueContactCooldown>0) continue;

        var collides = hitEnemy.x<player.x+player.size && hitEnemy.x+hitEnemy.size>player.x &&
                       hitEnemy.y<player.y+player.size && hitEnemy.y+hitEnemy.size>player.y;
        if(!collides) continue;
        if(hitEnemy.t && hitEnemy.t.shape==='ghost' && hitEnemy.ghostAlpha<0.5) continue;

        // One contact is one hit. Staying inside an enemy cannot melt it in a few frames.
        hitEnemy.rogueContactCooldown=12;

        var contactDamage=Math.max(1, Math.floor(playerDamage||1));
        rogueDealDamage(hitEnemy, contactDamage, 'contact');
        hitEnemy.hitFlash=8;
        addParticles(hitEnemy.x+hitEnemy.size/2,hitEnemy.y+hitEnemy.size/2,'#ffffff',4,5);

        // Native Pulsar: first contact marks, second contact detonates.
        if(cls.skillId==='pulse_mark'){
            var key=hitEnemy._rogueId || (hitEnemy._rogueId='e'+Math.random());
            if(roguePulseMarks[key]){
                roguePulseMarks[key]=false;
                var radius=45+lvl*5;
                enemies.forEach(function(e){
                    if(e===hitEnemy || e.hp<=0) return;
                    var d=Math.hypot((e.x+e.size/2)-px,(e.y+e.size/2)-py);
                    if(d<radius) rogueDealDamage(e, 1+Math.floor(lvl/2), 'pulse');
                });
                addParticles(px,py,'#e040fb',20,12);
            }else{
                roguePulseMarks[key]=true;
            }
        }

        // Native Blood Hunter: charged contact heals and consumes one charge.
        if(cls.skillId==='blood_rush' && rogueBloodCharges>0){
            rogueBloodCharges--;
            var heal=4+lvl;
            rogueHP=Math.min(rogueMaxHP,rogueHP+heal);
            addFloatingText(px,py,'+'+heal+' HP','#ff5c7a',14);
        }
        if(cls.skillId==='impact_core' && rogueImpactReady){
            rogueImpactReady=false;
            addParticles(px,py,'#4fc3f7',14,9);
            screenShake=Math.max(screenShake,7);
        }

    }
}

/* ---------- MAIN UPDATE WRAPPER ---------- */
var _rogueOldUpdate = update;
update = function update() {
    if(currentMode==='rogue'){
        ensureFiniteRoguePlayerState();
        rogueMovementSpeed=Math.hypot(player.x-roguePrevPlayerX,player.y-roguePrevPlayerY);
        roguePrevPlayerX=player.x;
        roguePrevPlayerY=player.y;
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

        if(roguePhaseTimer>0){
            buff.phantom=Math.max(buff.phantom,1);
        }else if(buff.phantom===1){
            buff.phantom=0;
        }

        rogueTickSystems();
        rogueDetectContact();
    }
    ensureFiniteRoguePlayerState();
    _rogueOldUpdate();
    ensureFiniteRoguePlayerState();

    if(currentMode==='rogue'){
        if(bossState!=='victory') rogueLastBossState=bossState;
    }
}

/* ---------- LEVEL UP: KILL-DROPPED XP ---------- */
var _rogueOldLevelUp = levelUp;
levelUp = function levelUp() {
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

        card.addEventListener('click',function(){pickUpgrade(id);});
        upgradeCardsEl.appendChild(card);
    });
}

function rogueProcessPendingXPLevel() {
    if(currentMode!=='rogue' || isChoosingUpgrade || !running) return;
    while(rogueXP >= rogueXPNext && !isChoosingUpgrade && running && !gameOver){
        rogueXP -= rogueXPNext;
        rogueXPNext = Math.floor(rogueXPNext * 1.32 + 3);
        levelUp();
        if(isChoosingUpgrade || !running) break;
    }
    updateHUD();
}

function closeUpgradeModal() {
    upgradeModal.classList.remove('open');
    isChoosingUpgrade=false;
    running=true;
    pendingUpgradeChoices=[];
    resetFrameClock();
    updateHUD();

    // If one pickup crossed multiple thresholds, finish the queued
    // level-up sequence after the current choice is closed.
    rogueProcessPendingXPLevel();
}

/* ---------- RUN RESULT ---------- */
var _rogueOldFinishRun=finishRun;
finishRun = function finishRun() {
    if(currentMode==='rogue'){
        // Stage/planet checkpoint is persistent. Run-only upgrades still reset on death.
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
        runRelics=[];
    rogueXP=0;
    rogueXPOrbs=[];
    rogueHeat=0;
    rogueOverload=0;
    rogueBloodCharges=0;
}

/* Ensure old reset cannot carry old upgrade data into the new run. */
ensureRogueV3Save();


/* Medkits heal HP in the new Roguelike instead of creating lives. */
var _rogueOldApplyDrop = applyDrop;
applyDrop = function applyDrop(type,x,y){
    if(currentMode==='rogue' && type==='medkit'){
        var heal=20;
        rogueHP=Math.min(rogueMaxHP,rogueHP+heal);
        addFloatingText(player.x+player.size/2,player.y-10,'+'+heal+' HP','#7cffb2',16);
        addParticles(player.x+player.size/2,player.y+player.size/2,'#7cffb2',12,7);
        updateHUD();
        return;
    }
    return _rogueOldApplyDrop(type,x,y);
}


function rogueDrawXPOrbs(){
    if(currentMode!=='rogue' || !running || !rogueXPOrbs.length) return;
    ctx.save();
    rogueXPOrbs.forEach(function(xp){
        var cx=xp.x+xp.size/2;
        var cy=xp.y+xp.size/2;
        var pulse=1+Math.sin((xp.phase||0))*0.12;
        var r=Math.max(4,(xp.size/2)*pulse);

        ctx.globalAlpha=0.18;
        ctx.fillStyle='#b388ff';
        ctx.beginPath();
        ctx.arc(cx,cy,r*2.2,0,Math.PI*2);
        ctx.fill();

        ctx.globalAlpha=0.95;
        ctx.fillStyle='#b388ff';
        ctx.beginPath();
        ctx.arc(cx,cy,r,0,Math.PI*2);
        ctx.fill();

        ctx.globalAlpha=1;
        ctx.strokeStyle='#e1bee7';
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.arc(cx,cy,r+1,0,Math.PI*2);
        ctx.stroke();

        ctx.fillStyle='#ffffff';
        ctx.beginPath();
        ctx.arc(cx-r*0.28,cy-r*0.28,Math.max(1.5,r*0.2),0,Math.PI*2);
        ctx.fill();
    });
    ctx.restore();
}

function rogueDrawPoisonZone(){
    if(currentMode!=='rogue' || !running || !roguePoisonZoneActive || !runUpgrades.poison) return;
    var lvl=Math.max(1,Math.min(3,runUpgrades.poison));
    var radius=[0,90,125,165][lvl];
    var cx=player.x+player.size/2, cy=player.y+player.size/2;
    var pulse=1+Math.sin(performance.now()*0.006)*0.045;
    ctx.save();
    ctx.globalAlpha=0.13;
    ctx.fillStyle='#76ff4f';
    ctx.beginPath();
    ctx.arc(cx,cy,radius*pulse,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha=0.42;
    ctx.strokeStyle='#9cff6a';
    ctx.lineWidth=3;
    ctx.setLineDash([8,6]);
    ctx.beginPath();
    ctx.arc(cx,cy,radius*pulse,0,Math.PI*2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha=0.2;
    ctx.strokeStyle='#d5ffb8';
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.arc(cx,cy,radius*0.72*pulse,0,Math.PI*2);
    ctx.stroke();
    ctx.restore();
}

function rogueDrawPropagationZones(){
    if(currentMode!=='rogue' || !running || !runUpgrades.poison || !runUpgrades.propagation) return;
    var lvl=Math.max(1,Math.min(3,runUpgrades.propagation));
    var radius=[0,90,125,165][lvl];
    var now=performance.now();
    ctx.save();
    enemies.forEach(function(e){
        if(!e || e.hp<=0 || e._rogueSpreadSource!=='poison') return;
        var cx=e.x+e.size/2, cy=e.y+e.size/2;
        var pulse=1+Math.sin(now*0.006+cx*0.01+cy*0.01)*0.025;
        ctx.globalAlpha=0.09;
        ctx.fillStyle='#76ff4f';
        ctx.beginPath();
        ctx.arc(cx,cy,radius*pulse,0,Math.PI*2);
        ctx.fill();
        ctx.globalAlpha=0.32;
        ctx.strokeStyle='#9cff6a';
        ctx.lineWidth=2;
        ctx.setLineDash([7,5]);
        ctx.beginPath();
        ctx.arc(cx,cy,radius*pulse,0,Math.PI*2);
        ctx.stroke();
        ctx.setLineDash([]);
    });
    ctx.restore();
}

function rogueDrawEnemyHealthBars(){
    if(currentMode!=='rogue' || !running || !enemies.length) return;
    ctx.save();
    enemies.forEach(function(e){
        if(!e || e.hp<=0 || !e.maxHp) return;
        var w=Math.max(22,Math.min(44,e.size*1.25));
        var h=4;
        var x=e.x+e.size/2-w/2;
        var y=e.y-8;
        var ratio=Math.max(0,Math.min(1,e.hp/e.maxHp));
        ctx.globalAlpha=.9;
        ctx.fillStyle='rgba(0,0,0,.65)';
        ctx.fillRect(x,y,w,h);
        ctx.fillStyle=ratio>.5?'#7cffb2':(ratio>.25?'#ffd93d':'#ff5c7a');
        ctx.fillRect(x,y,w*ratio,h);
    });
    ctx.restore();
}

var _rogueV3OldDraw=draw;
draw=function(){
    _rogueV3OldDraw();
    rogueDrawPoisonZone();
    rogueDrawPropagationZones();
    rogueDrawXPOrbs();
    rogueDrawEnemyHealthBars();
    rogueDrawLightning();
};
