/* ==========================================================
   STARFALL DASH — ROGUELIKE PLANET SYSTEM 1.0
   3 planets • 12 stages • trials • planetary bosses
   Loaded after roguelike-v3.js.
   This layer replaces the old XP/level/boss progression only
   for Roguelike and leaves other modes untouched.
   ========================================================== */

console.log('🪐 Starfall Dash — Planet System loaded');

var ROGUE_PLANETS = {
    arden: {
        id:'arden', name:'АРДЕН', subtitle:'ПЕПЕЛЬНЫЙ МИР',
        icon:'🔥', color:'#ff7043', boss:'dragon',
        description:'Разрушенная планета. Метеориты и огненные разломы не дают остановиться.',
        stages:[
            {name:'Пепельное поле', type:'combat', desc:'Обычный бой. Освой управление и родную способность класса.'},
            {name:'Метеоритный дождь', type:'meteor', desc:'Сверху падают метеориты. Двигайся и атакуй одновременно.'},
            {name:'Огненные разломы', type:'hazard', desc:'Опасные зоны появляются прямо на арене.'},
            {name:'Охота', type:'elite', desc:'Усиленные враги преследуют тебя. Подготовь билд к Дракону.'}
        ]
    },
    nivara: {
        id:'nivara', name:'НИВАРА', subtitle:'МЁРТВЫЙ ЛЁД',
        icon:'❄️', color:'#4fc3f7', boss:'titan',
        description:'Замёрзший мир. Лёд меняет движение, а пространство постепенно сжимается.',
        stages:[
            {name:'Ледяное поле', type:'ice', desc:'Инерция усиливается. Точное движение становится важнее.'},
            {name:'Засада', type:'ambush', desc:'Враги появляются ближе к игроку и быстрее окружают его.'},
            {name:'Ледяная буря', type:'storm', desc:'Поле периодически закрывается морозной дымкой.'},
            {name:'Замёрзшая арена', type:'shrink', desc:'Безопасная зона уменьшается. Нужно идти на контакт.'}
        ]
    },
    exor: {
        id:'exor', name:'ЭКЗОР', subtitle:'МЁРТВАЯ ЗВЕЗДА',
        icon:'🌌', color:'#9c6bff', boss:'devourer',
        description:'Пространство разрушается. Гравитация и разломы меняют правила боя.',
        stages:[
            {name:'Разлом', type:'rift', desc:'Пространственные разломы создают опасные области.'},
            {name:'Гравитация', type:'gravity', desc:'Гравитационные поля притягивают игрока и врагов.'},
            {name:'Крах', type:'collapse', desc:'Безопасная область постоянно меняется.'},
            {name:'Последний рубеж', type:'finaltrial', desc:'Финальное испытание объединяет угрозы всех трёх миров.'}
        ]
    }
};

var roguePlanetState = {
    active:false, planetIndex:0, stageIndex:0, stageTimer:0,
    stageDuration:22*60, transitionTimer:0, bossPending:false,
    bossHandled:false, hazardTimer:0, hazards:[], lastBossState:'none',
    bannerTimer:0, bannerTitle:'', bannerSubtitle:'', completedStages:0
};

function roguePlanetCurrentPlanet() {
    return ROGUE_PLANETS[Object.keys(ROGUE_PLANETS)[roguePlanetState.planetIndex]];
}
function roguePlanetCurrentStage() {
    var p=roguePlanetCurrentPlanet();
    return p ? p.stages[roguePlanetState.stageIndex] : null;
}
function roguePlanetResetState() {
    roguePlanetState.active=true;
    roguePlanetState.planetIndex=0;
    roguePlanetState.stageIndex=0;
    roguePlanetState.stageTimer=0;
    roguePlanetState.transitionTimer=0;
    roguePlanetState.bossPending=false;
    roguePlanetState.bossHandled=false;
    roguePlanetState.hazardTimer=0;
    roguePlanetState.hazards=[];
    roguePlanetState.lastBossState='none';
    roguePlanetState.bannerTimer=180;
    roguePlanetState.completedStages=0;
    roguePlanetShowBanner('ПЛАНЕТА I', roguePlanetCurrentPlanet().name+' • '+roguePlanetCurrentPlanet().subtitle);
    roguePlanetApplyStage();
}

function roguePlanetShowBanner(title, subtitle) {
    roguePlanetState.bannerTitle=title;
    roguePlanetState.bannerSubtitle=subtitle;
    roguePlanetState.bannerTimer=180;
    showToast('🪐 '+title+' — '+subtitle, 'legendary');
}

function roguePlanetApplyStage() {
    var p=roguePlanetCurrentPlanet(), st=roguePlanetCurrentStage();
    if(!p || !st) return;

    currentWaveModifier = currentWaveModifier || {};
    currentWaveModifier.hpMult = 1;
    currentWaveModifier.speedMult = 1;
    currentWaveModifier.darkness = false;

    if(st.type==='elite'){
        currentWaveModifier.hpMult=1.35;
        currentWaveModifier.speedMult=1.12;
    } else if(st.type==='ambush'){
        currentWaveModifier.hpMult=1.12;
        currentWaveModifier.speedMult=1.16;
    } else if(st.type==='finaltrial'){
        currentWaveModifier.hpMult=1.28;
        currentWaveModifier.speedMult=1.18;
    }

    roguePlanetState.stageTimer=0;
    roguePlanetState.hazardTimer=0;
    roguePlanetState.hazards=[];
    roguePlanetState.bossPending=false;

    roguePlanetShowBanner(
        'ЭТАП '+(roguePlanetState.stageIndex+1),
        st.name+' • '+st.desc
    );

    // Elite stage starts with a single stronger pursuer.
    if(st.type==='elite' || st.type==='ambush'){
        setTimeout(function(){
            if(currentMode==='rogue' && running && !gameOver && !bossState){
                try { spawnEnemy('miniboss'); } catch(e) {}
            }
        }, 350);
    }
}

function roguePlanetStartBoss() {
    var p=roguePlanetCurrentPlanet();
    if(!p) return;
    roguePlanetState.bossPending=true;
    roguePlanetState.bossHandled=false;
    roguePlanetState.stageTimer=roguePlanetState.stageDuration;
    roguePlanetState.hazards=[];
    currentWaveModifier={};
    showToast(p.icon+' '+p.name+' завершена. ХРАНИТЕЛЬ ПЛАНЕТЫ!', 'legendary');

    // Boss spawning is explicitly controlled here; old level-based spawns are blocked below.
    setTimeout(function(){
        if(currentMode==='rogue' && !gameOver){
            roguePlanetManualBossSpawn=true;
            try { spawnBoss(p.boss); } finally { roguePlanetManualBossSpawn=false; }
        }
    }, 650);
}

function roguePlanetCompleteStage() {
    if(roguePlanetState.bossPending || gameOver) return;

    roguePlanetState.completedStages++;
    var isBossStage = roguePlanetState.stageIndex===3;

    if(isBossStage){
        roguePlanetStartBoss();
        return;
    }

    level++;
    levelStats={coinsThisLevel:0,livesLostThisLevel:0,levelStartTime:performance.now()};
    showLevelToast(level,0,'',getCoinMultiplier());
    addParticles(canvas.width/2,canvas.height/2,'#9c6bff',24,12);
    playSFX('level');

    // Every completed non-boss stage grants one temporary build choice.
    showUpgradeChoice();
}

function roguePlanetAdvanceAfterBoss() {
    var keys=Object.keys(ROGUE_PLANETS);
    var current=roguePlanetCurrentPlanet();

    if(roguePlanetState.planetIndex >= keys.length-1){
        roguePlanetState.active=false;
        showToast('🌌 ПУТЬ ОТКРЫТ. ПОЖИРАТЕЛЬ ЗВЁЗД ПОВЕРЖЕН!', 'legendary');
        setTimeout(function(){ finishRun(); }, 900);
        return;
    }

    roguePlanetState.planetIndex++;
    roguePlanetState.stageIndex=0;
    roguePlanetState.bossPending=false;
    roguePlanetState.bossHandled=false;
    roguePlanetState.hazards=[];
    roguePlanetState.stageTimer=0;
    level++;
    roguePlanetShowBanner(
        'ПЕРЕХОД НА НОВУЮ ПЛАНЕТУ',
        roguePlanetCurrentPlanet().icon+' '+roguePlanetCurrentPlanet().name
    );
    roguePlanetApplyStage();

    // Planet transition always gives the player one choice before continuing.
    setTimeout(function(){
        if(currentMode==='rogue' && !gameOver) showUpgradeChoice();
    }, 300);
}

var roguePlanetManualBossSpawn=false;
var _planetOriginalSpawnBoss = spawnBoss;
spawnBoss = function(id){
    if(currentMode==='rogue' && !roguePlanetManualBossSpawn){
        // Old progression used to summon bosses from level numbers.
        // Planet System owns all Roguelike boss encounters now.
        return;
    }
    return _planetOriginalSpawnBoss(id);
};

var _planetOriginalSpawnRogueXP = (typeof spawnRogueXP==='function') ? spawnRogueXP : null;
if(_planetOriginalSpawnRogueXP){
    spawnRogueXP=function(){
        // XP drops are retired in the new Roguelike structure.
        return;
    };
}

var _planetOriginalLevelUp = levelUp;
levelUp=function(){
    if(currentMode==='rogue'){
        // Prevent the legacy XP system from opening an unrelated level-up.
        return;
    }
    return _planetOriginalLevelUp();
};

var _planetOriginalStartRun = startRoguelikeRun;
startRoguelikeRun=function(){
    var result=_planetOriginalStartRun.apply(this,arguments);
    if(currentMode==='rogue'){
        roguePlanetResetState();
        // The first planet begins at level 1; progression is stage-based.
        level=1;
        rogueXP=0;
        rogueXPNext=999999;
        rogueXPOrbs=[];
    }
    return result;
};

var _planetOriginalReset = reset;
reset=function(){
    var result=_planetOriginalReset.apply(this,arguments);
    if(currentMode==='rogue'){
        roguePlanetResetState();
        level=1;
        rogueXP=0;
        rogueXPNext=999999;
        rogueXPOrbs=[];
    }
    return result;
};

var _planetOriginalUpdate = update;
update=function(){
    if(currentMode==='rogue' && roguePlanetState.active && running && !gameOver){
        roguePlanetState.stageTimer++;

        // Stage duration: roughly 22 seconds. Boss stages are entered after stage 4.
        if(!roguePlanetState.bossPending && roguePlanetState.stageTimer>=roguePlanetState.stageDuration){
            roguePlanetCompleteStage();
        }

        roguePlanetTickHazards();

        // Detect boss victory exactly once.
        if(roguePlanetState.bossPending && bossState==='victory' && !roguePlanetState.bossHandled){
            roguePlanetState.bossHandled=true;
            roguePlanetState.bossPending=false;
            setTimeout(function(){
                if(currentMode==='rogue' && !gameOver) roguePlanetAdvanceAfterBoss();
            }, 900);
        }
    }

    _planetOriginalUpdate();

    if(currentMode==='rogue' && roguePlanetState.active){
        roguePlanetState.lastBossState=bossState;
    }
};

function roguePlanetTickHazards(){
    var p=roguePlanetCurrentPlanet(), st=roguePlanetCurrentStage();
    if(!p || !st) return;

    roguePlanetState.hazardTimer++;

    // Clear expired hazards.
    roguePlanetState.hazards=roguePlanetState.hazards.filter(function(h){ return h.life>0; });
    roguePlanetState.hazards.forEach(function(h){ h.life--; });

    if(st.type==='meteor' && roguePlanetState.hazardTimer%75===0){
        roguePlanetSpawnMeteor();
    }

    if(st.type==='hazard' && roguePlanetState.hazardTimer%110===0){
        roguePlanetSpawnZone('#ff5722');
    }

    if(st.type==='storm' && roguePlanetState.hazardTimer%150===0){
        roguePlanetSpawnZone('#81d4fa');
    }

    if(st.type==='shrink' && roguePlanetState.hazardTimer%90===0){
        roguePlanetSpawnZone('#90caf9', true);
    }

    if(st.type==='rift' && roguePlanetState.hazardTimer%105===0){
        roguePlanetSpawnZone('#9c6bff');
    }

    if(st.type==='gravity' && roguePlanetState.hazardTimer%120===0){
        roguePlanetSpawnGravity();
    }

    if(st.type==='collapse' && roguePlanetState.hazardTimer%100===0){
        roguePlanetSpawnZone('#7c4dff', true);
    }

    if(st.type==='finaltrial'){
        if(roguePlanetState.hazardTimer%85===0) roguePlanetSpawnMeteor();
        if(roguePlanetState.hazardTimer%125===0) roguePlanetSpawnGravity();
    }

    roguePlanetApplyForcesAndDamage();
}

function roguePlanetSpawnMeteor(){
    roguePlanetState.hazards.push({
        type:'meteor', x:25+Math.random()*(canvas.width-50),
        y:-20, r:10+Math.random()*7, vy:5+Math.random()*2,
        life:110, telegraph:28, damage:10
    });
}

function roguePlanetSpawnZone(color, moving){
    roguePlanetState.hazards.push({
        type:'zone', x:35+Math.random()*(canvas.width-70),
        y:55+Math.random()*(canvas.height-110),
        r:28+Math.random()*18, life:120, color:color,
        moving:!!moving, vx:(Math.random()-.5)*1.4, vy:(Math.random()-.5)*1.4,
        damage:8
    });
}

function roguePlanetSpawnGravity(){
    roguePlanetState.hazards.push({
        type:'gravity', x:55+Math.random()*(canvas.width-110),
        y:65+Math.random()*(canvas.height-130),
        r:48+Math.random()*15, life:150, strength:0.8
    });
}

function roguePlanetApplyForcesAndDamage(){
    var px=player.x+player.size/2, py=player.y+player.size/2;

    roguePlanetState.hazards.forEach(function(h){
        if(h.type==='meteor'){
            h.y+=h.vy;
            if(h.y>canvas.height+30) h.life=0;
            var md=Math.hypot(px-h.x,py-h.y);
            if(h.telegraph<=0 && md<h.r+player.size/2){
                playerTakeDamage();
                h.life=0;
                addParticles(h.x,h.y,'#ff5722',18,9);
                screenShake=10;
            } else if(h.telegraph>0){
                h.telegraph--;
            }
        } else if(h.type==='zone'){
            if(h.moving){ h.x+=h.vx; h.y+=h.vy; }
            var zd=Math.hypot(px-h.x,py-h.y);
            if(zd<h.r+player.size/3 && frame%30===0){
                playerTakeDamage();
            }
        } else if(h.type==='gravity'){
            var dx=h.x-px, dy=h.y-py, d=Math.hypot(dx,dy);
            if(d>4 && d<h.r){
                player.x += dx/d*h.strength;
                player.y += dy/d*h.strength;
            }
        }
    });

    // Ice stages add controlled sliding/inertia without touching other modes.
    var st=roguePlanetCurrentStage();
    if(st && st.type==='ice' && running){
        player.x += (player.lastDirX||0)*0.45;
        player.y += (player.lastDirY||0)*0.45;
    }

    // Ambush: stronger enemy pressure near the player.
    if(st && st.type==='ambush' && roguePlanetState.hazardTimer%95===0){
        try{
            spawnEnemy();
            if(enemies.length>0){
                var e=enemies[enemies.length-1];
                e.x=Math.max(10,Math.min(canvas.width-e.size-10,px-e.size/2+(Math.random()-.5)*120));
                e.y=Math.max(10,Math.min(canvas.height-e.size-10,py-e.size/2+(Math.random()-.5)*120));
            }
        }catch(e){}
    }

    // Collapse stages continuously reduce the usable area through a soft pull.
    if(st && (st.type==='collapse' || st.type==='shrink')){
        var margin=35+Math.min(70,Math.floor(roguePlanetState.stageTimer/120));
        player.x=Math.max(margin,Math.min(canvas.width-player.size-margin,player.x));
        player.y=Math.max(margin,Math.min(canvas.height-player.size-margin,player.y));
    }
}

function drawRoguePlanetLayer(){
    if(currentMode!=='rogue' || !roguePlanetState.active) return;
    var p=roguePlanetCurrentPlanet(), st=roguePlanetCurrentStage();
    if(!p || !st) return;

    ctx.save();

    // Planet tint — subtle so the existing Starfall Dash art remains readable.
    var tint='rgba(255,112,67,.045)';
    if(p.id==='nivara') tint='rgba(79,195,247,.05)';
    if(p.id==='exor') tint='rgba(156,107,255,.06)';
    ctx.fillStyle=tint;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    roguePlanetState.hazards.forEach(function(h){
        if(h.type==='meteor'){
            ctx.globalAlpha=0.28;
            ctx.strokeStyle='#ff7043'; ctx.lineWidth=3;
            ctx.shadowColor='#ff5722'; ctx.shadowBlur=14;
            ctx.beginPath(); ctx.arc(h.x,h.y,h.r+8,0,Math.PI*2); ctx.stroke();
            ctx.globalAlpha=0.95;
            ctx.beginPath(); ctx.moveTo(h.x,h.y); ctx.lineTo(h.x-h.r*0.8,h.y-h.r*2.4); ctx.stroke();
        } else if(h.type==='zone'){
            ctx.globalAlpha=0.25;
            ctx.fillStyle=h.color;
            ctx.shadowColor=h.color; ctx.shadowBlur=18;
            ctx.beginPath(); ctx.arc(h.x,h.y,h.r,0,Math.PI*2); ctx.fill();
            ctx.globalAlpha=0.8;
            ctx.strokeStyle=h.color; ctx.lineWidth=2;
            ctx.beginPath(); ctx.arc(h.x,h.y,h.r,0,Math.PI*2); ctx.stroke();
        } else if(h.type==='gravity'){
            ctx.globalAlpha=0.24;
            ctx.strokeStyle='#b388ff'; ctx.lineWidth=2;
            ctx.shadowColor='#9c6bff'; ctx.shadowBlur=16;
            ctx.beginPath(); ctx.arc(h.x,h.y,h.r,0,Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.arc(h.x,h.y,h.r*0.55,0,Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.arc(h.x,h.y,h.r*0.18,0,Math.PI*2); ctx.stroke();
        }
    });

    // Top-left planet/stage marker.
    ctx.globalAlpha=0.92;
    ctx.fillStyle='rgba(5,8,20,.72)';
    ctx.roundRect(10,8,210,46,12);
    ctx.fill();
    ctx.strokeStyle=p.color; ctx.lineWidth=1;
    ctx.stroke();
    ctx.fillStyle='#fff';
    ctx.font='bold 12px Segoe UI,Arial';
    ctx.textAlign='left';
    ctx.fillText(p.icon+' '+p.name+' • '+p.subtitle,20,25);
    ctx.fillStyle=p.color;
    ctx.font='bold 11px Segoe UI,Arial';
    ctx.fillText('Этап '+(roguePlanetState.stageIndex+1)+'/4 • '+st.name,20,42);

    // Stage progress.
    var pct=Math.min(1,roguePlanetState.stageTimer/roguePlanetState.stageDuration);
    ctx.fillStyle='rgba(255,255,255,.12)';
    ctx.fillRect(10,58,210,4);
    ctx.fillStyle=p.color;
    ctx.fillRect(10,58,210*pct,4);

    if(roguePlanetState.bannerTimer>0){
        roguePlanetState.bannerTimer--;
        ctx.globalAlpha=Math.min(1,roguePlanetState.bannerTimer/45,1);
        ctx.textAlign='center';
        ctx.fillStyle='#fff';
        ctx.font='900 22px Segoe UI,Arial';
        ctx.shadowColor=p.color; ctx.shadowBlur=18;
        ctx.fillText(roguePlanetState.bannerTitle,canvas.width/2,70);
        ctx.font='bold 12px Segoe UI,Arial';
        ctx.shadowBlur=8;
        ctx.fillText(roguePlanetState.bannerSubtitle,canvas.width/2,89);
    }

    ctx.restore();
}

var _planetOriginalDraw=draw;
draw=function(){
    _planetOriginalDraw();
    // Layer is drawn on top of the field, below HUD DOM.
    if(currentMode==='rogue' && roguePlanetState.active){
        drawRoguePlanetLayer();
    }
};

/* Persist only the permanent milestone; the current run itself remains temporary. */
var _planetOriginalFinishRun=finishRun;
finishRun=function(){
    if(currentMode==='rogue'){
        var s=getSave();
        s.lastRoguePlanet=roguePlanetCurrentPlanet() ? roguePlanetCurrentPlanet().id : 'arden';
        s.lastRogueStage=roguePlanetState.stageIndex+1;
        persist();
    }
    return _planetOriginalFinishRun.apply(this,arguments);
};

console.log('✅ Planet System: 3 planets / 12 stages / 3 bosses / no XP progression');
