/* ==========================================================
   STARFALL DASH — ANALYTICS
   Реальная игровая телеметрия для локального Bot Lab.
   Не отправляет никнеймы/пароли: профиль идентифицируется хэшем.
   ========================================================== */
(function(){
    'use strict';
    var ENDPOINT='http://127.0.0.1:4180/api/analytics';
    var SESSION='sfd_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);
    var QUEUE=[];
    var started=false;
    var pendingDeathReason=null;
    var last={xp:0,gold:0,level:1,stage:null};
    var sessionStartedAt=new Date().toISOString();
    var sessionEnded=false;
    var sessionEventCounts={};
    var sessionRuns=[];

    function hash(s){
        s=String(s||'guest'); var h=0;
        for(var i=0;i<s.length;i++) h=((h<<5)-h)+s.charCodeAt(i)|0;
        return 'p_'+Math.abs(h).toString(36);
    }
    function profileId(){
        try{return hash(window.currentProfile&&currentProfile.login?currentProfile.login:'guest');}catch(e){return 'p_guest';}
    }
    function currentGameVersion(){
        try{
            if(window.STARFALL_BALANCE&&STARFALL_BALANCE.gameVersion)return String(STARFALL_BALANCE.gameVersion);
        }catch(e){}
        try{
            var el=document.querySelector('.game-version');
            if(el)return String(el.textContent||'').replace(/^v/i,'').trim();
        }catch(e){}
        return 'unknown';
    }
    function context(extra){
        var o={
            sessionId:SESSION,
            playerId:profileId(),
            mode:window.currentMode||null,
            character:window.selectedClass||null,
            level:Number(window.level)||0,
            gameVersion:currentGameVersion(),
            ts:new Date().toISOString()
        };
        if(extra) Object.keys(extra).forEach(function(k){o[k]=extra[k];});
        return o;
    }
    function track(event,props){
        sessionEventCounts[event]=(sessionEventCounts[event]||0)+1;
        QUEUE.push({event:event,data:context(props)});
        if(QUEUE.length>=12) flush();
    }
    function flush(){
        if(!QUEUE.length) return;
        var batch=QUEUE.splice(0,QUEUE.length);
        try{
            fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(batch),keepalive:true}).catch(function(){});
        }catch(e){}
    }
    function wrap(name,before,after){
        var original=window[name];
        if(typeof original!=='function') return;
        if(original.__sfdAnalyticsWrapped) return;
        var wrapped=function(){
            var args=arguments;
            try{if(before)before.apply(this,args);}catch(e){}
            var result=original.apply(this,args);
            try{if(after)after.apply(this,args);}catch(e){}
            return result;
        };
        wrapped.__sfdAnalyticsWrapped=true;
        wrapped.__sfdOriginal=original;
        window[name]=wrapped;
    }
    function startRun(){
        started=true;
        pendingDeathReason=null;
        last={xp:Number(window.rogueXP)||0,gold:Number(window.goldEarned)||0,level:Number(window.level)||1,stage:null};
        track('run_started',{
            mode:window.currentMode||null,
            character:window.selectedClass||null,
            coreLevel:(function(){try{return Object.values(getSave().coreStats||{}).reduce(function(a,b){return a+Number(b||0)},0)}catch(e){return 0}})()
        });
    }

    wrap('finishRun',function(){
        if(!started && window.runStartTime) startRun();
        if(!started)return;
        var runResult=window.gameOver?'death':'completed';
        var runSummary={
            result:runResult,
            mode:window.currentMode||null,
            character:window.selectedClass||null,
            level:Number(window.level)||0,
            runTime:Number(window.runTime)||0,
            score:Number(window.score)||0,
            gold:Number(window.goldEarned)||0,
            crystals:Number(window.crystalsEarned)||0,
            kills:(function(){try{return Number(getSave().totalKills)||0}catch(e){return 0}})(),
            deathReason:pendingDeathReason||null,
            upgrades:Object.assign({},window.runUpgrades||{}),
            relics:(window.runRelics||[]).slice(),
            endedAt:new Date().toISOString()
        };
        sessionRuns.push(runSummary);
        track('run_finished',{
            result:runResult,
            score:Number(window.score)||0,
            gold:Number(window.goldEarned)||0,
            crystals:Number(window.crystalsEarned)||0,
            level:Number(window.level)||0,
            runTime:Number(window.runTime)||0,
            kills:(function(){try{return Number(getSave().totalKills)||0}catch(e){return 0}})(),
            deathReason:pendingDeathReason||null,
            upgrades:Object.assign({},window.runUpgrades||{}),
            relics:(window.runRelics||[]).slice()
        });
        started=false;
    });
    wrap('playerTakeDamage',function(){
        if(Number(window.lives)<=1){
            pendingDeathReason=(window.bossState&&window.bossState!=='none')?'boss':((window.rogueEnemyHazards&&window.rogueEnemyHazards.length)?'hazard':((window.enemyBullets&&window.enemyBullets.length)?'projectile':'contact'));
        }
        track('damage_taken',{
            livesBefore:Number(window.lives)||0,
            boss:window.bossDuelId||null,
            stage:window.roguePlanetState?Number(window.roguePlanetState.stageIndex)+1:null
        });
    });
    wrap('rogueRegisterKill',function(enemy){
        track('enemy_killed',{enemyType:enemy&&enemy.type||'unknown',stage:window.roguePlanetState?Number(window.roguePlanetState.stageIndex)+1:null});
    });
    wrap('applyUpgrade',function(id){
        track('upgrade_selected',{upgradeId:id});
    });
    wrap('applyRelic',function(id){
        track('relic_selected',{relicId:id});
    });
    wrap('levelUp',function(){
        track('level_up',{fromLevel:Number(window.level)||0});
    });
    wrap('spawnBoss',function(id){
        track('boss_started',{bossId:id});
    });
    wrap('roguePlanetCompleteStage',function(){
        var r=window.roguePlanetState||{};
        track('stage_completed',{planet:Number(r.planetIndex)+1,stage:Number(r.stageIndex)+1});
    });
    wrap('roguePlanetStartBoss',function(){
        var r=window.roguePlanetState||{};
        track('boss_duel_started',{planet:Number(r.planetIndex)+1});
    });
    wrap('roguePlanetAdvanceAfterBoss',function(){
        var r=window.roguePlanetState||{};
        track('boss_defeated',{planet:Number(r.planetIndex)+1,bossId:window.bossDuelId||null});
    });

    function persistSession(finalize){
        if(finalize){if(sessionEnded)return;sessionEnded=true;}
        var now=new Date();
        var record={
            sessionId:SESSION,
            playerId:profileId(),
            startedAt:sessionStartedAt,
            endedAt:finalize?now.toISOString():null,
            durationSec:Math.max(0,(now.getTime()-new Date(sessionStartedAt).getTime())/1000),
            gameVersion:currentGameVersion(),
            lastMode:window.currentMode||null,
            lastCharacter:window.selectedClass||null,
            eventCount:Object.values(sessionEventCounts).reduce(function(a,b){return a+b},0),
            eventTypes:Object.assign({},sessionEventCounts),
            runs:sessionRuns.slice(),
            userAgent:navigator.userAgent,
            screen:{width:window.innerWidth||0,height:window.innerHeight||0,devicePixelRatio:window.devicePixelRatio||1}
        };
        try{
            fetch(ENDPOINT+'/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(record),keepalive:true}).catch(function(){});
        }catch(e){}
        if(finalize)flush();
    }
    function sendSession(){persistSession(true);}
    function poll(){
        if(!started){
            if(window.running && !window.gameOver) startRun();
        }else{
            var xp=Number(window.rogueXP)||0, gold=Number(window.goldEarned)||0, lvl=Number(window.level)||1;
            if(xp>last.xp) track('xp_collected',{amount:xp-last.xp,totalXp:xp});
            if(gold>last.gold) track('gold_earned',{amount:gold-last.gold,totalGold:gold});
            if(lvl>last.level) last.level=lvl;
            var r=window.roguePlanetState;
            if(r&&r.active&&r.stageStarted){
                var key=String(Number(r.planetIndex)+1)+':'+String(Number(r.stageIndex)+1);
                if(key!==last.stage){last.stage=key;track('stage_started',{planet:Number(r.planetIndex)+1,stage:Number(r.stageIndex)+1});}
            }
        }
        if(QUEUE.length) flush();
        setTimeout(poll,5000);
    }

    window.sfdAnalytics={track:track,flush:flush,session:SESSION};
    window.addEventListener('beforeunload',function(){sendSession();});
    window.addEventListener('pagehide',function(){sendSession();});
    setInterval(function(){if(!sessionEnded)persistSession(false);},30000);
    setTimeout(function(){
        track('session_started');
        poll();
    },1000);
})();