/* ==========================================================
   STARFALL DASH — ROGUELIKE PLANET SYSTEM 2.0
   Safe planet/map layer. Loaded after roguelike-v3.js.
   ========================================================== */

console.log('🪐 Starfall Dash — Planet System 2.0 loaded');

/* gameplay.js used bossState before declaring it. Keep one shared
   global state so every script sees the same value. */
var bossState = (typeof bossState === 'undefined') ? 'none' : bossState;
var bossStateTimer = (typeof bossStateTimer === 'undefined') ? 0 : bossStateTimer;

var ROGUE_PLANETS = {
    arden: {
        id:'arden', name:'АРДЕН', subtitle:'ПЕПЕЛЬНЫЙ МИР', icon:'🔥', color:'#ff7043', boss:'dragon',
        description:'Пепел, метеориты и огненные разломы.',
        stages:[
            {name:'Пепельное поле', type:'distance', icon:'⚔️', desc:'Пройди 1400 единиц пути.', objective:{kind:'distance',target:2800,label:'Путь',unit:'ед.'}},
            {name:'Метеоритный дождь', type:'meteor', icon:'☄️', desc:'Продержись 30 секунд под метеорами.', objective:{kind:'time',target:60,label:'Время',unit:'с'}},
            {name:'Огненные разломы', type:'hazard', icon:'🔥', desc:'Победи 8 врагов в огненной зоне.', objective:{kind:'kills',target:15,label:'Враги',unit:''}},
            {name:'Охота', type:'elite', icon:'☠️', desc:'Победи 2 усиленных врага.', objective:{kind:'strongKills',target:4,label:'Сильные',unit:''}}
        ]
    },
    nivara: {
        id:'nivara', name:'НИВАРА', subtitle:'МЁРТВЫЙ ЛЁД', icon:'❄️', color:'#4fc3f7', boss:'titan',
        description:'Лёд меняет движение, а пространство сжимается.',
        stages:[
            {name:'Ледяное поле', type:'ice', icon:'❄️', desc:'Пройди 1800 единиц пути по льду.', objective:{kind:'distance',target:3200,label:'Путь',unit:'ед.'}},
            {name:'Засада', type:'ambush', icon:'⚠️', desc:'Победи 10 врагов в ближней засаде.', objective:{kind:'kills',target:18,label:'Враги',unit:''}},
            {name:'Ледяная буря', type:'storm', icon:'🌨️', desc:'Продержись 32 секунды в буре.', objective:{kind:'time',target:70,label:'Время',unit:'с'}},
            {name:'Замёрзшая арена', type:'shrink', icon:'🧊', desc:'Победи 3 усиленных врага в сужающейся зоне.', objective:{kind:'strongKills',target:5,label:'Сильные',unit:''}}
        ]
    },
    exor: {
        id:'exor', name:'ЭКЗОР', subtitle:'МЁРТВАЯ ЗВЕЗДА', icon:'🌌', color:'#9c6bff', boss:'devourer',
        description:'Разломы и гравитация разрушают пространство.',
        stages:[
            {name:'Разлом', type:'rift', icon:'🌀', desc:'Пройди 2000 единиц пути через разломы.', objective:{kind:'distance',target:3600,label:'Путь',unit:'ед.'}},
            {name:'Гравитация', type:'gravity', icon:'🕳️', desc:'Победи 12 врагов в гравитационных полях.', objective:{kind:'kills',target:22,label:'Враги',unit:''}},
            {name:'Крах', type:'collapse', icon:'💠', desc:'Победи 2 усиленных врага до полного коллапса.', objective:{kind:'strongKills',target:4,label:'Сильные',unit:''}},
            {name:'Последний рубеж', type:'finaltrial', icon:'⚡', desc:'Продержись 35 секунд перед Пожирателем.', objective:{kind:'time',target:80,label:'Время',unit:'с'}}
        ]
    }
};

var roguePlanetKeys = Object.keys(ROGUE_PLANETS);

var roguePlanetState = {
    active:false,
    planetIndex:0,
    stageIndex:0,
    stageStarted:false,
    stageTimer:0,
    stageDistance:0,
    stageKills:0,
    stageStrongKills:0,
    stageLastX:0,
    stageLastY:0,
    stageMinDuration:30*60,
    stageBanner:'',
    stageBannerTimer:0,
    stageDuration:90*60,
    hazardTimer:0,
    hazards:[],
    bossUnlocked:false,
    bossActive:false,
    bossHandled:false,
    awaitingMap:false,
    mapOpen:false,
    bannerTimer:0,
    bannerTitle:'',
    bannerSubtitle:''
};

function roguePlanetCurrentPlanet(){
    return ROGUE_PLANETS[roguePlanetKeys[roguePlanetState.planetIndex]] || null;
}
function roguePlanetCurrentStage(){
    var p=roguePlanetCurrentPlanet();
    return p && p.stages[roguePlanetState.stageIndex] ? p.stages[roguePlanetState.stageIndex] : null;
}
function roguePlanetBossState(){
    return typeof bossState === 'undefined' ? 'none' : bossState;
}

function roguePlanetInjectUI(){
    if(document.getElementById('rogue-planet-map')) return;

    var style=document.createElement('style');
    style.id='rogue-planet-map-style';
    style.textContent =
        '#rogue-planet-map{position:fixed;inset:0;z-index:12000;display:none;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 18%,rgba(40,55,110,.38),rgba(3,6,18,.97) 62%);font-family:Segoe UI,Arial,sans-serif;color:#fff;padding:18px;box-sizing:border-box}' +
        '#rogue-planet-map.open{display:flex}' +
        '.rpm-window{width:min(920px,96vw);max-height:92vh;overflow:auto;border:1px solid rgba(130,170,255,.28);border-radius:24px;background:rgba(7,12,29,.94);box-shadow:0 20px 70px rgba(0,0,0,.55),0 0 45px rgba(100,120,255,.12);padding:22px;box-sizing:border-box}' +
        '.rpm-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px}' +
        '.rpm-kicker{font-size:11px;letter-spacing:2px;opacity:.62;text-transform:uppercase}.rpm-title{font-size:27px;font-weight:900;letter-spacing:.5px}.rpm-sub{font-size:12px;opacity:.68;margin-top:4px}' +
        '.rpm-progress{display:flex;gap:7px;align-items:center}.rpm-planet-dot{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);font-size:16px}.rpm-planet-dot.active{box-shadow:0 0 18px currentColor;border-color:currentColor}.rpm-line{width:32px;height:2px;background:rgba(255,255,255,.13)}' +
        '.rpm-boss{display:flex;align-items:center;gap:12px;padding:13px 15px;border-radius:16px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);margin-bottom:18px}.rpm-boss-icon{font-size:30px}.rpm-boss-label{font-size:10px;opacity:.55;letter-spacing:1.5px}.rpm-boss-name{font-size:16px;font-weight:800;margin-top:2px}' +
        '.rpm-map{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:18px 4px 8px}.rpm-path{position:absolute;left:9%;right:9%;top:70px;height:2px;background:linear-gradient(90deg,rgba(255,255,255,.08),rgba(140,170,255,.3),rgba(255,255,255,.08));z-index:0}' +
        '.rpm-node{position:relative;z-index:1;min-height:142px;border:1px solid rgba(255,255,255,.09);border-radius:18px;background:rgba(255,255,255,.035);padding:13px 10px;box-sizing:border-box;text-align:center;color:#fff;transition:.16s;cursor:default}.rpm-node .n-icon{font-size:27px;margin:4px 0 9px}.rpm-node .n-num{font-size:9px;letter-spacing:1.5px;opacity:.5}.rpm-node .n-name{font-size:12px;font-weight:800;line-height:1.2}.rpm-node .n-desc{font-size:9px;opacity:.52;line-height:1.35;margin-top:7px}.rpm-node.done{opacity:.62}.rpm-node.done .n-icon{filter:grayscale(.2)}.rpm-node.current{border-color:var(--planet-color);box-shadow:0 0 24px color-mix(in srgb,var(--planet-color),transparent 78%);background:rgba(255,255,255,.075)}.rpm-node.available{cursor:pointer;border-color:var(--planet-color);box-shadow:0 0 22px color-mix(in srgb,var(--planet-color),transparent 84%)}.rpm-node.available:hover{transform:translateY(-3px);background:rgba(255,255,255,.1)}.rpm-node.locked{opacity:.3}.rpm-node.boss{grid-column:1/-1;min-height:105px;margin-top:5px;border-color:rgba(255,92,122,.35);background:rgba(255,92,122,.045)}.rpm-node.boss.available{cursor:pointer;box-shadow:0 0 28px rgba(255,92,122,.12)}' +
        '.rpm-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.07)}.rpm-status{font-size:11px;opacity:.58}.rpm-btn{border:0;border-radius:12px;padding:10px 16px;background:rgba(255,255,255,.08);color:#fff;font-weight:800;cursor:pointer}.rpm-btn.primary{background:linear-gradient(135deg,#7c6cff,#a46cff);box-shadow:0 0 18px rgba(124,108,255,.2)}' +
        '@media(max-width:700px){.rpm-window{padding:15px;border-radius:18px}.rpm-title{font-size:21px}.rpm-map{grid-template-columns:repeat(2,1fr)}.rpm-path{display:none}.rpm-node.boss{grid-column:1/-1}.rpm-progress{display:none}}';
    document.head.appendChild(style);

    var overlay=document.createElement('div');
    overlay.id='rogue-planet-map';
    overlay.innerHTML =
        '<div class="rpm-window" role="dialog" aria-label="Карта забега">' +
            '<div class="rpm-top">' +
                '<div><div class="rpm-kicker">МАРШРУТ ЗАБЕГА</div><div class="rpm-title" id="rpm-title">Планета</div><div class="rpm-sub" id="rpm-sub">Выбери следующий этап</div></div>' +
                '<div class="rpm-progress" id="rpm-progress"></div>' +
            '</div>' +
            '<div class="rpm-boss"><div class="rpm-boss-icon" id="rpm-boss-icon">☠️</div><div><div class="rpm-boss-label">ЦЕЛЬ ПЛАНЕТЫ</div><div class="rpm-boss-name" id="rpm-boss-name">Босс</div></div></div>' +
            '<div class="rpm-map" id="rpm-map"></div>' +
            '<div class="rpm-footer"><div class="rpm-status" id="rpm-status">Выбери этап</div><button class="rpm-btn" id="rpm-close">Закрыть карту</button></div>' +
        '</div>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click',function(e){
        if(e.target===overlay && !roguePlanetState.stageStarted && !roguePlanetState.bossActive){
            roguePlanetCloseMap();
        }
    });
    document.getElementById('rpm-close').addEventListener('click',function(){
        if(!roguePlanetState.stageStarted && !roguePlanetState.bossActive) roguePlanetCloseMap();
    });
}

function roguePlanetOpenMap(){
    /* ---- Stage kill tracking ---- */
var roguePlanetOriginalRegisterKill = (typeof rogueRegisterKill === 'function') ? rogueRegisterKill : null;
if(roguePlanetOriginalRegisterKill){
    rogueRegisterKill=function(enemy){
        roguePlanetOriginalRegisterKill(enemy);
        if(currentMode!=='rogue' || !roguePlanetState.active || !roguePlanetState.stageStarted || !enemy) return;
        roguePlanetState.stageKills++;
        var strong = enemy.type==='miniboss' || (enemy.maxHp||enemy.hp||0) >= 3;
        if(strong) roguePlanetState.stageStrongKills++;
    };
}

roguePlanetInjectUI();
    roguePlanetState.mapOpen=true;
    roguePlanetRenderMap();
    document.getElementById('rogue-planet-map').classList.add('open');
    running=false;
    resetFrameClock();
    stopMusic();
}

function roguePlanetCloseMap(){
    var el=document.getElementById('rogue-planet-map');
    if(el) el.classList.remove('open');
    roguePlanetState.mapOpen=false;
}

function roguePlanetRenderMap(){
    var p=roguePlanetCurrentPlanet();
    if(!p) return;
    var title=document.getElementById('rpm-title');
    var sub=document.getElementById('rpm-sub');
    var bossIcon=document.getElementById('rpm-boss-icon');
    var bossName=document.getElementById('rpm-boss-name');
    var map=document.getElementById('rpm-map');
    var progress=document.getElementById('rpm-progress');
    var status=document.getElementById('rpm-status');
    if(!title||!map) return;

    title.textContent=p.icon+' '+p.name;
    sub.textContent=p.subtitle+' • '+p.description;
    bossIcon.textContent=p.boss==='dragon'?'🐉':(p.boss==='titan'?'🧊':'🌌');
    bossName.textContent=p.boss==='dragon'?'ДРАКОН':(p.boss==='titan'?'ЛЕДЯНОЙ ТИТАН':'ПОЖИРАТЕЛЬ ЗВЁЗД');

    progress.innerHTML=roguePlanetKeys.map(function(id,i){
        var pp=ROGUE_PLANETS[id];
        return '<div class="rpm-planet-dot '+(i===roguePlanetState.planetIndex?'active':'')+'" style="color:'+pp.color+'">'+pp.icon+'</div>'+
               (i<roguePlanetKeys.length-1?'<div class="rpm-line"></div>':'');
    }).join('');

    map.innerHTML='<div class="rpm-path"></div>';
    p.stages.forEach(function(st,i){
        var done=i<roguePlanetState.stageIndex;
        var current=i===roguePlanetState.stageIndex && !roguePlanetState.bossUnlocked;
        var available=current && !roguePlanetState.stageStarted;
        var cls='rpm-node '+(done?'done ':'')+(current?'current ':'')+(available?'available ':'locked ');
        var statusText=done?'✓ ПРОЙДЕНО':(current?'ТЕКУЩИЙ ЭТАП':'ЗАБЛОКИРОВАН');
        var objective=st.objective || {kind:'time',target:60,label:'Время',unit:'с'};
        var objectiveText=objective.kind==='distance'
            ? 'Цель: '+objective.target+' '+objective.unit+' пути'
            : (objective.kind==='time'
                ? 'Цель: '+objective.target+' '+objective.unit
                : 'Цель: '+objective.target+' '+objective.label.toLowerCase());
        var node=document.createElement('button');
        node.className=cls;
        node.style.setProperty('--planet-color',p.color);
        node.innerHTML='<div class="n-num">'+(i+1)+' / '+p.stages.length+' • '+statusText+'</div><div class="n-icon">'+st.icon+'</div><div class="n-name">'+st.name+'</div><div class="n-desc">'+st.desc+'</div><div style="font-size:9px;opacity:.72;margin-top:7px;">'+objectiveText+'</div>';
        if(available) node.addEventListener('click',function(){roguePlanetStartStage(i);});
        map.appendChild(node);
    });

    if(roguePlanetState.bossUnlocked){
        var boss=document.createElement('button');
        boss.className='rpm-node boss available';
        boss.style.setProperty('--planet-color','#ff5c7a');
        boss.innerHTML='<div class="n-num">ФИНАЛ ПЛАНЕТЫ • ДОСТУПНО</div><div class="n-icon">'+(p.boss==='dragon'?'🐉':(p.boss==='titan'?'🧊':'🌌'))+'</div><div class="n-name">'+(p.boss==='dragon'?'ДРАКОН':(p.boss==='titan'?'ЛЕДЯНОЙ ТИТАН':'ПОЖИРАТЕЛЬ ЗВЁЗ'))+'</div><div class="n-desc">Один на один. Победи хранителя и открой следующую планету.</div>';
        boss.addEventListener('click',roguePlanetStartBoss);
        map.appendChild(boss);
    }

    var xpInfo=(typeof rogueXP!=='undefined' && typeof rogueXPNext!=='undefined')
        ? ' • Уровень '+level+' • XP '+rogueXP+' / '+rogueXPNext
        : '';
    status.textContent=(roguePlanetState.bossUnlocked
        ? 'Все этапы пройдены. Босс ждёт тебя.'
        : 'Выбери подсвеченный этап.')+xpInfo;
}

function roguePlanetPrepareRun(){
    roguePlanetState.active=true;
    roguePlanetState.planetIndex=0;
    roguePlanetState.stageIndex=0;
    roguePlanetState.stageStarted=false;
    roguePlanetState.stageTimer=0;
    roguePlanetState.stageDistance=0;
    roguePlanetState.stageKills=0;
    roguePlanetState.stageStrongKills=0;
    roguePlanetState.stageLastX=0;
    roguePlanetState.stageLastY=0;
    roguePlanetState.hazardTimer=0;
    roguePlanetState.hazards=[];
    roguePlanetState.bossUnlocked=false;
    roguePlanetState.bossActive=false;
    roguePlanetState.bossHandled=false;
    roguePlanetState.awaitingMap=false;
    roguePlanetShowBanner('ПЛАНЕТА I','🔥 АРДЕН • ПЕПЕЛЬНЫЙ МИР');
}

function roguePlanetShowBanner(title,subtitle){
    roguePlanetState.bannerTitle=title;
    roguePlanetState.bannerSubtitle=subtitle;
    roguePlanetState.bannerTimer=150;
    if(typeof showToast==='function') showToast('🪐 '+title+' — '+subtitle,'legendary');
}

function roguePlanetApplyStage(){
    var p=roguePlanetCurrentPlanet(), st=roguePlanetCurrentStage();
    if(!p||!st) return;
    currentWaveModifier=currentWaveModifier||{};
    currentWaveModifier.hpMult=1;
    currentWaveModifier.speedMult=1;
    if(st.type==='elite'){ currentWaveModifier.hpMult=1.35; currentWaveModifier.speedMult=1.12; }
    if(st.type==='ambush'){ currentWaveModifier.hpMult=1.12; currentWaveModifier.speedMult=1.16; }
    if(st.type==='finaltrial'){ currentWaveModifier.hpMult=1.28; currentWaveModifier.speedMult=1.18; }
    roguePlanetState.stageTimer=0;
    roguePlanetState.hazardTimer=0;
    roguePlanetState.hazards=[];
}

function roguePlanetStartStage(index){
    if(!roguePlanetState.active || roguePlanetState.stageStarted || roguePlanetState.bossUnlocked) return;
    if(index!==roguePlanetState.stageIndex) return;
    roguePlanetState.stageStarted=true;
    // Player level is a separate XP progression. A new stage never changes it.
    levelStats={coinsThisLevel:0,livesLostThisLevel:0,levelStartTime:performance.now()};
    if(typeof updateHUD==='function') updateHUD();
    roguePlanetState.stageTimer=0;
    roguePlanetState.stageDistance=0;
    roguePlanetState.stageKills=0;
    roguePlanetState.stageStrongKills=0;
    roguePlanetState.stageLastX=player.x;
    roguePlanetState.stageLastY=player.y;
    roguePlanetState.hazardTimer=0;
    roguePlanetState.hazards=[];
    roguePlanetState.stageBanner='ЭТАП '+(index+1)+' • '+roguePlanetCurrentStage().name;
    roguePlanetState.stageBannerTimer=180;
    roguePlanetApplyStage();
    roguePlanetCloseMap();
    document.body.classList.add('playing');
    running=true;
    gameOver=false;
    resetFrameClock();
    initAudio();
    startMusic();
    roguePlanetShowBanner('ЭТАП '+(index+1),roguePlanetCurrentStage().name);
}

function roguePlanetStageObjectiveMet(){
    var st=roguePlanetCurrentStage();
    if(!st || !st.objective) return false;
    var o=st.objective;
    if(o.kind==='distance') return roguePlanetState.stageDistance>=o.target;
    if(o.kind==='time') return roguePlanetState.stageTimer>=o.target*60;
    if(o.kind==='kills') return roguePlanetState.stageKills>=o.target;
    if(o.kind==='strongKills') return roguePlanetState.stageStrongKills>=o.target;
    return false;
}

function roguePlanetObjectiveText(){
    var st=roguePlanetCurrentStage();
    if(!st || !st.objective) return '';
    var o=st.objective, value=0;
    if(o.kind==='distance') value=Math.floor(roguePlanetState.stageDistance);
    else if(o.kind==='time') value=Math.floor(roguePlanetState.stageTimer/60);
    else if(o.kind==='kills') value=roguePlanetState.stageKills;
    else if(o.kind==='strongKills') value=roguePlanetState.stageStrongKills;
    return o.label+': '+Math.min(value,o.target)+' / '+o.target+(o.unit?' '+o.unit:'');
}

function roguePlanetShowStageComplete(){
    var el=document.getElementById('rogue-stage-complete');
    if(!el){
        el=document.createElement('div');
        el.id='rogue-stage-complete';
        el.style.cssText='position:fixed;inset:0;z-index:13000;display:flex;align-items:center;justify-content:center;pointer-events:none;background:rgba(2,6,18,.5);backdrop-filter:blur(3px);';
        el.innerHTML='<div style="text-align:center;padding:30px 44px;border:1px solid rgba(150,200,255,.3);border-radius:22px;background:rgba(7,13,30,.95);box-shadow:0 0 70px rgba(80,160,255,.2);"><div style="font-size:12px;letter-spacing:4px;opacity:.65;">ЭТАП ПРОЙДЕН</div><div id="rogue-stage-complete-name" style="font-size:30px;font-weight:900;margin-top:8px;"></div><div style="font-size:12px;opacity:.6;margin-top:10px;">Переход на карту...</div></div>';
        document.body.appendChild(el);
    }
    document.getElementById('rogue-stage-complete-name').textContent =
        roguePlanetState.stageIndex>=3 ? '🔥 БОСС ОТКРЫТ' : '✓ СЛЕДУЮЩИЙ ЭТАП ОТКРЫТ';
    el.style.display='flex';
    setTimeout(function(){
        el.style.display='none';
        if(currentMode==='rogue' && !gameOver) roguePlanetOpenMap();
    },1500);
}

function roguePlanetCompleteStage(){
    if(!roguePlanetState.active || !roguePlanetState.stageStarted || roguePlanetState.bossActive || gameOver) return;
    roguePlanetState.stageStarted=false;
    running=false;
    resetFrameClock();
    roguePlanetState.awaitingMap=false;

    if(roguePlanetState.stageIndex>=3){
        roguePlanetState.bossUnlocked=true;
    }else{
        roguePlanetState.stageIndex++;
    }

    roguePlanetRenderMap();
    roguePlanetShowStageComplete();
}

function roguePlanetStartBoss(){
    if(!roguePlanetState.active || !roguePlanetState.bossUnlocked || roguePlanetState.bossActive) return;
    var p=roguePlanetCurrentPlanet();
    roguePlanetState.bossActive=true;
    roguePlanetState.bossHandled=false;
    roguePlanetCloseMap();
    running=true;
    gameOver=false;
    resetFrameClock();
    roguePlanetManualBossSpawn=true;
    try { spawnBoss(p.boss); } finally { roguePlanetManualBossSpawn=false; }
}

function roguePlanetAdvanceAfterBoss(){
    if(roguePlanetState.bossHandled===false) return;
    if(typeof clearBossDuelPresentation==='function') clearBossDuelPresentation();
    var old=roguePlanetState.planetIndex;
    if(old>=roguePlanetKeys.length-1){
        roguePlanetState.active=false;
        roguePlanetState.bossActive=false;
        roguePlanetState.mapOpen=false;
        showToast('🌌 ФИНАЛ ПРОЙДЕН — СИСТЕМА СПАСЕНА!','legendary');
        setTimeout(function(){ finishRun(); },700);
        return;
    }

    roguePlanetState.planetIndex++;
    roguePlanetState.stageIndex=0;
    roguePlanetState.stageStarted=false;
    roguePlanetState.stageTimer=0;
    roguePlanetState.stageDistance=0;
    roguePlanetState.stageKills=0;
    roguePlanetState.stageStrongKills=0;
    roguePlanetState.stageLastX=0;
    roguePlanetState.stageLastY=0;
    roguePlanetState.hazardTimer=0;
    roguePlanetState.hazards=[];
    roguePlanetState.bossUnlocked=false;
    roguePlanetState.bossActive=false;
    roguePlanetState.bossHandled=false;

    // Small recovery between planets; it does not create an extra life.
    rogueHP=Math.min(rogueMaxHP,rogueHP+15);
    updateHUD();
    roguePlanetShowBanner('ПЛАНЕТА '+(roguePlanetState.planetIndex+1),roguePlanetCurrentPlanet().icon+' '+roguePlanetCurrentPlanet().name);
    setTimeout(function(){
        if(currentMode==='rogue' && !gameOver) roguePlanetOpenMap();
    },900);
}

/* ---- Disable the old level-based boss calls for Roguelike only. ---- */
var roguePlanetOriginalSpawnBoss=spawnBoss;
var roguePlanetManualBossSpawn=false;
spawnBoss=function(id){
    if(currentMode==='rogue' && !roguePlanetManualBossSpawn) return;
    return roguePlanetOriginalSpawnBoss(id);
};

/* XP is a separate falling resource. It is intentionally NOT tied to kills. */
if(typeof spawnRogueXP==='function'){
    // gameplay.js already owns the spawn implementation.
    // Do not overwrite it here: XP must keep falling from the top during stages.
}

/* ---- Start flow: class -> map -> selected stage -> gameplay. ---- */
var roguePlanetOriginalStartRun=startRoguelikeRun;
startRoguelikeRun=function(){
    roguePlanetOriginalStartRun.apply(this,arguments);
    running=false;
    stopMusic();
    resetFrameClock();
    roguePlanetPrepareRun();
    roguePlanetOpenMap();
};

/* ---- Do not reset the planet route every time the game resets internally. ---- */
var roguePlanetOriginalReset=reset;
reset=function(){
    var result=roguePlanetOriginalReset.apply(this,arguments);
    if(currentMode==='rogue'){
        running=false;
        resetFrameClock();
    }
    return result;
};

/* ---- Stage objectives + boss victory watcher. ---- */
var roguePlanetOriginalUpdate=update;
update=function(){
    var wasStageRunning = currentMode==='rogue' && roguePlanetState.active &&
        roguePlanetState.stageStarted && running && !gameOver && !isChoosingUpgrade;

    if(wasStageRunning){
        roguePlanetState.stageTimer++;
        roguePlanetState.hazardTimer++;
        roguePlanetTickHazards();
    }

    // Core gameplay runs first so movement and kills from this frame are counted.
    roguePlanetOriginalUpdate();

    if(currentMode==='rogue' && roguePlanetState.active && roguePlanetState.stageStarted && running && !gameOver && !isChoosingUpgrade){
        var dx=player.x-roguePlanetState.stageLastX;
        var dy=player.y-roguePlanetState.stageLastY;
        roguePlanetState.stageDistance += Math.hypot(dx,dy);
        roguePlanetState.stageLastX=player.x;
        roguePlanetState.stageLastY=player.y;

        if(roguePlanetState.stageTimer>=roguePlanetState.stageMinDuration &&
           roguePlanetStageObjectiveMet()){
            roguePlanetCompleteStage();
            return;
        }
    }

    if(currentMode==='rogue' && roguePlanetState.active && roguePlanetState.bossActive && !roguePlanetState.bossHandled){
        if(roguePlanetBossState()==='victory'){
            roguePlanetState.bossHandled=true;
            running=false;
            resetFrameClock();
            setTimeout(roguePlanetAdvanceAfterBoss,650);
        }
    }
};

function roguePlanetSpawnMeteor(){
    roguePlanetState.hazards.push({type:'meteor',x:25+Math.random()*(canvas.width-50),y:-25,r:10+Math.random()*7,vy:5+Math.random()*2,life:120,telegraph:30});
}
function roguePlanetSpawnZone(color,moving){
    roguePlanetState.hazards.push({type:'zone',x:35+Math.random()*(canvas.width-70),y:55+Math.random()*(canvas.height-110),r:28+Math.random()*18,life:120,color:color,moving:!!moving,vx:(Math.random()-.5)*1.4,vy:(Math.random()-.5)*1.4});
}
function roguePlanetSpawnGravity(){
    roguePlanetState.hazards.push({type:'gravity',x:55+Math.random()*(canvas.width-110),y:65+Math.random()*(canvas.height-130),r:48+Math.random()*15,life:150,strength:.8});
}

function roguePlanetTickHazards(){
    var p=roguePlanetCurrentPlanet(), st=roguePlanetCurrentStage();
    if(!p||!st) return;
    roguePlanetState.hazards.forEach(function(h){
        h.life--;
        if(h.type==='meteor'){
            h.y+=h.vy;
            if(h.telegraph>0) h.telegraph--;
            if(h.telegraph<=0 && Math.hypot(player.x+player.size/2-h.x,player.y+player.size/2-h.y)<h.r+player.size/2){
                playerTakeDamage(); h.life=0; screenShake=10;
            }
        }else if(h.type==='zone'){
            if(h.moving){h.x+=h.vx;h.y+=h.vy;}
            if(Math.hypot(player.x+player.size/2-h.x,player.y+player.size/2-h.y)<h.r+player.size/3 && frame%30===0) playerTakeDamage();
        }else if(h.type==='gravity'){
            var dx=h.x-(player.x+player.size/2),dy=h.y-(player.y+player.size/2),d=Math.hypot(dx,dy);
            if(d>4&&d<h.r){player.x+=dx/d*h.strength;player.y+=dy/d*h.strength;}
        }
    });
    roguePlanetState.hazards=roguePlanetState.hazards.filter(function(h){return h.life>0;});

    if(st.type==='meteor' && roguePlanetState.hazardTimer%75===0) roguePlanetSpawnMeteor();
    if(st.type==='hazard' && roguePlanetState.hazardTimer%105===0) roguePlanetSpawnZone('#ff5722');
    if(st.type==='storm' && roguePlanetState.hazardTimer%130===0) roguePlanetSpawnZone('#81d4fa');
    if(st.type==='shrink' && roguePlanetState.hazardTimer%90===0) roguePlanetSpawnZone('#90caf9',true);
    if(st.type==='rift' && roguePlanetState.hazardTimer%100===0) roguePlanetSpawnZone('#9c6bff');
    if(st.type==='gravity' && roguePlanetState.hazardTimer%110===0) roguePlanetSpawnGravity();
    if(st.type==='collapse' && roguePlanetState.hazardTimer%95===0) roguePlanetSpawnZone('#7c4dff',true);
    if(st.type==='finaltrial'){
        if(roguePlanetState.hazardTimer%80===0) roguePlanetSpawnMeteor();
        if(roguePlanetState.hazardTimer%115===0) roguePlanetSpawnGravity();
    }

    if(st.type==='ambush' && roguePlanetState.hazardTimer%100===0){
        try{
            spawnEnemy();
            var e=enemies[enemies.length-1];
            if(e){
                e.x=Math.max(10,Math.min(canvas.width-e.size-10,player.x+(Math.random()-.5)*120));
                e.y=Math.max(10,Math.min(canvas.height-e.size-10,player.y+(Math.random()-.5)*120));
            }
        }catch(err){}
    }

    // Strong-enemy stages explicitly spawn minibosses so their objective
    // is always achievable even if the player's XP level is still low.
    if(st.objective && st.objective.kind==='strongKills' && roguePlanetState.hazardTimer%240===0){
        try{ spawnEnemy('miniboss'); }catch(err){}
    }

    if(st.type==='ice' && running){
        player.x+=(player.lastDirX||0)*.35;
        player.y+=(player.lastDirY||0)*.35;
    }

    if(st.type==='shrink' || st.type==='collapse'){
        var margin=35+Math.min(65,Math.floor(roguePlanetState.stageTimer/120));
        player.x=Math.max(margin,Math.min(canvas.width-player.size-margin,player.x));
        player.y=Math.max(margin,Math.min(canvas.height-player.size-margin,player.y));
    }
}

function roguePlanetDrawLayer(){
    if(currentMode!=='rogue'||!roguePlanetState.active) return;
    var p=roguePlanetCurrentPlanet();
    if(!p) return;
    ctx.save();
    var tint=p.id==='arden'?'rgba(255,112,67,.035)':(p.id==='nivara'?'rgba(79,195,247,.04)':'rgba(156,107,255,.05)');
    ctx.fillStyle=tint;ctx.fillRect(0,0,canvas.width,canvas.height);

    roguePlanetState.hazards.forEach(function(h){
        if(h.type==='meteor'){
            ctx.globalAlpha=.3;ctx.strokeStyle='#ff7043';ctx.lineWidth=3;ctx.shadowColor='#ff5722';ctx.shadowBlur=14;
            ctx.beginPath();ctx.arc(h.x,h.y,h.r+8,0,Math.PI*2);ctx.stroke();
            ctx.globalAlpha=.9;ctx.beginPath();ctx.moveTo(h.x,h.y);ctx.lineTo(h.x-h.r*.8,h.y-h.r*2.4);ctx.stroke();
        }else if(h.type==='zone'){
            ctx.globalAlpha=.22;ctx.fillStyle=h.color;ctx.shadowColor=h.color;ctx.shadowBlur=18;
            ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.fill();
            ctx.globalAlpha=.75;ctx.strokeStyle=h.color;ctx.lineWidth=2;ctx.stroke();
        }else if(h.type==='gravity'){
            ctx.globalAlpha=.24;ctx.strokeStyle='#b388ff';ctx.lineWidth=2;ctx.shadowColor='#9c6bff';ctx.shadowBlur=16;
            ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.stroke();
            ctx.beginPath();ctx.arc(h.x,h.y,h.r*.55,0,Math.PI*2);ctx.stroke();
            ctx.beginPath();ctx.arc(h.x,h.y,h.r*.18,0,Math.PI*2);ctx.stroke();
        }
    });

    ctx.restore();
}

var roguePlanetOriginalDraw=draw;
draw=function(){
    roguePlanetOriginalDraw();
    roguePlanetDrawLayer();

    if(currentMode==='rogue' && roguePlanetState.active && roguePlanetState.stageStarted){
        var st=roguePlanetCurrentStage(), o=st && st.objective;
        if(o && typeof ctx!=='undefined'){
            var value=0;
            if(o.kind==='distance') value=Math.floor(roguePlanetState.stageDistance);
            else if(o.kind==='time') value=Math.floor(roguePlanetState.stageTimer/60);
            else if(o.kind==='kills') value=roguePlanetState.stageKills;
            else if(o.kind==='strongKills') value=roguePlanetState.stageStrongKills;
            var ratio=Math.min(1,value/o.target);
            var w=Math.min(370,canvas.width-24), x=(canvas.width-w)/2, y=52;
            ctx.save();
            ctx.fillStyle='rgba(4,9,25,.82)';
            ctx.strokeStyle='rgba(255,255,255,.16)';
            ctx.lineWidth=1;
            ctx.beginPath(); ctx.roundRect(x,y,w,48,12); ctx.fill(); ctx.stroke();
            ctx.textAlign='left';
            ctx.font='800 11px system-ui'; ctx.fillStyle='#fff';
            ctx.fillText(st.name,x+14,y+17);
            ctx.font='600 10px system-ui'; ctx.fillStyle='rgba(255,255,255,.72)';
            var label=o.kind==='distance'?'ПУТЬ':(o.kind==='time'?'ВРЕМЯ':o.label.toUpperCase());
            ctx.fillText(label+'  '+Math.min(value,o.target)+' / '+o.target+(o.unit?' '+o.unit:''),x+14,y+34);
            ctx.fillStyle='rgba(255,255,255,.12)'; ctx.fillRect(x+w-112,y+17,96,6);
            ctx.fillStyle='rgba(120,200,255,.9)'; ctx.fillRect(x+w-112,y+17,96*ratio,6);
            if(roguePlanetState.stageTimer<roguePlanetState.stageMinDuration){
                ctx.font='500 9px system-ui'; ctx.fillStyle='rgba(255,255,255,.55)';
                ctx.fillText('Минимум этапа: '+Math.ceil((roguePlanetState.stageMinDuration-roguePlanetState.stageTimer)/60)+' сек',x+w-112,y+36);
            }
            ctx.restore();
        }
        if(roguePlanetState.stageBannerTimer>0){
            roguePlanetState.stageBannerTimer--;
            ctx.save();
            ctx.textAlign='center';
            ctx.fillStyle='rgba(255,255,255,.96)';
            ctx.font='900 25px system-ui';
            ctx.fillText(roguePlanetState.stageBanner,canvas.width/2,canvas.height*.20);
            ctx.font='600 11px system-ui';
            ctx.fillStyle='rgba(255,255,255,.6)';
            ctx.fillText('ВЫПОЛНИ ЦЕЛЬ ЭТАПА',canvas.width/2,canvas.height*.20+23);
            ctx.restore();
        }
    }
};

/* Upgrade choices belong to XP level-ups only.
   Closing the modal resumes the same stage; it never advances the planet map. */
roguePlanetInjectUI();
