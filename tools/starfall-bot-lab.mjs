import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {execFileSync,execFile} from "node:child_process";
import {randomBytes} from "node:crypto";

const ROOT=process.cwd();
const CONFIG=path.join(ROOT,"config","roguelike-balance.json");
const RUNTIME=path.join(ROOT,"js","balance-config.js");
const GAME_RUNTIME=path.join(ROOT,"src","data","roguelike-balance.js");
const BUGS=path.join(ROOT,"config","bugs.json");
const IDEAS=path.join(ROOT,"config","ideas.json");
const ANALYTICS=path.join(ROOT,"config","analytics-events.json");
const PAGE=fs.readFileSync(path.join(ROOT,"tools","starfall-bot-lab.html"),"utf8");
const IDEAS_PAGE=fs.readFileSync(path.join(ROOT,"tools","starfall-bot-ideas.html"),"utf8");
const PORT=Number(process.env.STARFALL_BOT_PORT||4180);
const TOKEN=randomBytes(18).toString("hex");

function load(){return JSON.parse(fs.readFileSync(CONFIG,"utf8"))}
function gameVersion(){try{const index=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");const m=index.match(/class=["']game-version["'][^>]*>\s*v?([^<\s]+)\s*</i);return m?m[1]:"неизвестна"}catch(e){return "неизвестна"}}
function loadAnalytics(){
  try{const d=JSON.parse(fs.readFileSync(ANALYTICS,"utf8"));return Array.isArray(d.events)?d.events:[]}catch{return []}
}
function saveAnalytics(events){
  const trimmed=events.slice(-30000);
  fs.writeFileSync(ANALYTICS,JSON.stringify({version:1,events:trimmed},null,2)+"\n");
}
function analyticsSummary(events){
  const count={}; const byMode={}; const byStage={}; const byCharacter={}; const byUpgrade={}; const byDeath={};
  const sessions=new Set(), runs=new Set(); let completed=0,deaths=0,totalTime=0,totalLevel=0,levelN=0,totalKills=0,totalXP=0,totalGold=0,bosses=0,bossWins=0;
  for(const e of events){
    const d=e.data||{}; count[e.event]=(count[e.event]||0)+1;
    if(d.sessionId)sessions.add(d.sessionId);
    if(e.event==="run_started"){
      runs.add(d.sessionId+"|"+(d.ts||"")); const m=d.mode||"unknown";byMode[m]=(byMode[m]||0)+1;
      const ch=d.character||"unknown";byCharacter[ch]=(byCharacter[ch]||0)+1;
    }
    if(e.event==="run_finished"){
      if(d.result==="completed")completed++; else deaths++;
      totalTime+=Number(d.runTime)||0; totalLevel+=Number(d.level)||0; levelN++;
      totalKills+=Number(d.kills)||0;
      const reason=d.deathReason||d.boss||null;if(reason)byDeath[reason]=(byDeath[reason]||0)+1;
    }
    if(e.event==="xp_collected") totalXP+=Number(d.amount)||0;
    if(e.event==="gold_earned") totalGold+=Number(d.amount)||0;
    if(e.event==="boss_started"||e.event==="boss_duel_started") bosses++;
    if(e.event==="boss_defeated") bossWins++;
    if(e.event==="stage_started"||e.event==="stage_completed"){
      const key="P"+(d.planet||"?")+" / Э"+(d.stage||"?");byStage[key]=(byStage[key]||0)+1;
    }
    if(e.event==="upgrade_selected"){const k=d.upgradeId||"unknown";byUpgrade[k]=(byUpgrade[k]||0)+1;}
  }
  const safe=(obj)=>Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,20);
  return {events:events.length,sessions:sessions.size,runs:runs.size,completed,deaths,completionRate:runs?completed/runs:0,avgRunTime:levelN?totalTime/levelN:0,avgLevel:levelN?totalLevel/levelN:0,totalKills,totalXP,totalGold,bosses,bossWins,counts:count,byMode:safe(byMode),byStage:safe(byStage),byCharacter:safe(byCharacter),byUpgrade:safe(byUpgrade),byDeath:safe(byDeath),updatedAt:new Date().toISOString()};
}
function loadBugs(){
  const data=JSON.parse(fs.readFileSync(BUGS,"utf8"));
  data.bugs=Array.isArray(data.bugs)?data.bugs:[];
  data.bugs.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))||Number(b.id)-Number(a.id));
  return data;
}
function saveBugs(data){
  data.bugs=Array.isArray(data.bugs)?data.bugs:[];
  for(const bug of data.bugs){
    bug.status=bug.status==="fixed"?"fixed":"open";
    if(bug.status==="fixed"){if(!bug.fixedAt) bug.fixedAt=new Date().toISOString().slice(0,10);}
    else bug.fixedAt=null;
  }
  data.bugs.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))||Number(b.id)-Number(a.id));
  data.nextId=data.bugs.reduce((m,b)=>Math.max(m,Number(b.id)||0),0)+1;
  fs.writeFileSync(BUGS,JSON.stringify(data,null,2)+"\n");
}
function loadIdeas(){
  const data=JSON.parse(fs.readFileSync(IDEAS,"utf8"));
  data.ideas=Array.isArray(data.ideas)?data.ideas:[];
  data.ideas.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))||Number(b.id)-Number(a.id));
  return data;
}
function saveIdeas(data){
  data.ideas=Array.isArray(data.ideas)?data.ideas:[];
  for(const idea of data.ideas){
    idea.status=["planned","done","rejected"].includes(idea.status)?idea.status:"planned";
    idea.priority=["high","medium","low"].includes(idea.priority)?idea.priority:"medium";
    if(!idea.createdAt) idea.createdAt=new Date().toISOString().slice(0,10);
  }
  data.ideas.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))||Number(b.id)-Number(a.id));
  data.nextId=data.ideas.reduce((m,x)=>Math.max(m,Number(x.id)||0),0)+1;
  fs.writeFileSync(IDEAS,JSON.stringify(data,null,2)+"\n");
}
function runtime(data){
  return "// AUTO-GENERATED FROM config/roguelike-balance.json\nvar STARFALL_BALANCE = "+JSON.stringify(data,null,2)+";\nfunction sfBalance(){return (typeof STARFALL_BALANCE==='object'&&STARFALL_BALANCE)?STARFALL_BALANCE:null;}\nfunction sfRogueBalance(){var b=sfBalance();return b&&b.rogue?b.rogue:null;}\nfunction sfRogueStageBalance(planetKey,stageIndex){var b=sfRogueBalance();var list=b&&b.stages&&b.stages[planetKey];return list&&list[stageIndex]?list[stageIndex]:null;}\nfunction sfGetEnemyBalance(typeKey){var b=sfRogueBalance();return b&&b.enemies&&b.enemies[typeKey]?b.enemies[typeKey]:null;}\nfunction sfGetBossBalance(bossKey){var b=sfRogueBalance();return b&&b.bosses&&b.bosses[bossKey]?b.bosses[bossKey]:null;}\n";
}
function save(data){
  fs.writeFileSync(CONFIG,JSON.stringify(data,null,2)+"\n");
  fs.writeFileSync(RUNTIME,runtime(data));
  fs.writeFileSync(GAME_RUNTIME,runtime(data));
}
function commit(){
  execFileSync("git",["add","config/roguelike-balance.json","js/balance-config.js","src/data/roguelike-balance.js"],{cwd:ROOT,stdio:"pipe"});
  return execFileSync("git",["commit","-m","Balance: update Roguelike tuning"],{cwd:ROOT,encoding:"utf8"});
}
function ensureRemote(){
  let remote="";
  try{remote=execFileSync("git",["remote","get-url","origin"],{cwd:ROOT,encoding:"utf8",stdio:"pipe"}).trim()}catch{}
  if(!remote) execFileSync("git",["remote","add","origin","https://github.com/wertretwetrertew-a11y/Starfall-Dash-1.1.git"],{cwd:ROOT,stdio:"pipe"});
}
function push(){
  ensureRemote();
  try{execFileSync("git",["fetch","origin","main"],{cwd:ROOT,encoding:"utf8",stdio:"pipe"})}catch(e){}
  return execFileSync("git",["push","origin","HEAD:main"],{cwd:ROOT,encoding:"utf8",stdio:"pipe"});
}
function commitBugs(){
  execFileSync("git",["add","config/bugs.json"],{cwd:ROOT,stdio:"pipe"});
  return execFileSync("git",["commit","-m","Dev: update bug registry"],{cwd:ROOT,encoding:"utf8"});
}
function commitIdeas(){
  execFileSync("git",["add","config/ideas.json"],{cwd:ROOT,stdio:"pipe"});
  return execFileSync("git",["commit","-m","Dev: update ideas registry"],{cwd:ROOT,encoding:"utf8"});
}
function headSha(){return execFileSync("git",["rev-parse","HEAD"],{cwd:ROOT,encoding:"utf8"}).trim()}
function send(res,status,type,body){res.writeHead(status,{"Content-Type":type,"Cache-Control":"no-store","Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type"});res.end(body)}

function mulberry32(seed){
  let a=seed>>>0;
  return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=(t+Math.imul(t^t>>>7,61|t))^t;return ((t^t>>>14)>>>0)/4294967296}
}
const HAZARD={
  normal:.9, flyer:1.0, zigzag:1.15, ghost:.9, hunter:1.2, snake:1.25,
  bomber:1.45, splitter:1.0, spider:1.3, ice:1.1, star:1.2, miniboss:1.8,
  crystal:.55, barrier:1.05, teleporter:1.25, magnet_enemy:1.3, doppel:1.1, laser:1.55
};
const PROFILE={
  novice:{label:"Новичок",contact:.34,objective:.86,damage:.88,move:.92,upgradeBias:["shield","speed","damage","regen","dodge"]},
  average:{label:"Обычный",contact:.20,objective:1,damage:1,move:1,upgradeBias:["damage","dodge","speed","crit","shield","thorns","magnet","regen"]},
  optimal:{label:"Оптимальный",contact:.09,objective:1.08,damage:1.12,move:1.08,upgradeBias:["damage","crit","dodge","speed","thorns","vampire","chain","pierce","time_slow","glass_cannon","berserk"]}
};
const UPGRADE_INFO={
  damage:{label:"Урон",score:10},crit:{label:"Крит",score:8},dodge:{label:"Уклонение",score:8},
  speed:{label:"Скорость",score:7},shield:{label:"Щит",score:7},thorns:{label:"Шипы",score:6},
  regen:{label:"Регенерация",score:5},vampire:{label:"Вампир",score:5},chain:{label:"Цепная молния",score:6},
  pierce:{label:"Пробитие",score:4},time_slow:{label:"Замедление",score:5},glass_cannon:{label:"Стеклянная пушка",score:6},
  berserk:{label:"Берсерк",score:5},magnet:{label:"Магнит",score:3},luck:{label:"Удача",score:3},greed:{label:"Жадность",score:2}
};

function simulate(balance,opts){
  const profile=PROFILE[opts.profile]||PROFILE.average;
  const runs=Math.max(1,Math.min(10000,Number(opts.runs)||100));
  const baseDamage=Math.max(0,Number(opts.baseDamage)||1);
  const baseHp=Math.max(1,Number(opts.baseHp)||3);
  const rng=mulberry32(Number(opts.seed)||20260929);
  const planets=Object.entries(balance.rogue.stages);
  const result={
    meta:{runs,profile:profile.label,seed:Number(opts.seed)||20260929,baseDamage,baseHp,model:"Balance Simulator v1"},
    summary:{started:runs,completed:0,planetCompleted:0,stagesCompleted:0,deaths:0,avgSurvivalSeconds:0,avgKills:0,avgGold:0,avgCrystals:0,avgLevels:0,avgUpgrades:0,avgDamageTaken:0,bossesDefeated:0,bossesAttempted:0},
    stages:[], enemies:{}, bosses:{}, upgrades:{}
  };
  for(const [planet,stages] of planets) for(let si=0;si<stages.length;si++) result.stages.push({planet,stage:si+1,attempts:0,completed:0,deaths:0,avgSeconds:0,avgKills:0,avgDamageTaken:0});
  for(const k of Object.keys(balance.rogue.enemies)) result.enemies[k]={spawned:0,killed:0,damageTaken:0,deaths:0};
  for(const k of Object.keys(balance.rogue.bosses)) result.bosses[k]={attempted:0,defeated:0,deaths:0,avgFightSeconds:0};
  for(const k of Object.keys(UPGRADE_INFO)) result.upgrades[k]={picked:0,label:UPGRADE_INFO[k].label};

  let totalSurvival=0,totalKills=0,totalGold=0,totalCrystals=0,totalLevels=0,totalUpgrades=0,totalDamage=0;
  for(let run=0;run<runs;run++){
    let hp=baseHp,shields=0,damage=baseDamage*profile.damage,speed=profile.move;
    let crit=0,dodge=0,thorns=0,regen=0,vampire=0,chain=0,slow=1;
    let gold=0,crystals=0,kills=0,levels=1,upgrades=0,damageTaken=0,elapsed=0,alive=true,upgradeCursor=0;
    const pickUpgrade=()=>{
      const bias=profile.upgradeBias;
      const pool=Object.keys(UPGRADE_INFO).slice().sort((a,b)=>{const ai=bias.indexOf(a),bi=bias.indexOf(b);return (bi<0?99:bi)-(ai<0?99:ai)||rng()-.5});
      const id=pool[(upgradeCursor+Math.floor(rng()*Math.min(4,pool.length)))%pool.length];upgradeCursor++;upgrades++;result.upgrades[id].picked++;
      if(id==="damage")damage+=1;if(id==="crit")crit=Math.min(.75,crit+.15);if(id==="dodge")dodge=Math.min(.75,dodge+.15);if(id==="speed")speed*=1.06;if(id==="shield")shields++;if(id==="thorns")thorns+=2;if(id==="regen")regen+=.35;if(id==="vampire")vampire+=.05;if(id==="chain")chain++;if(id==="time_slow")slow*=.9;if(id==="glass_cannon"){damage+=3;hp-=1}if(id==="berserk")damage*=1.04;
    };
    outer:
    for(let pi=0;pi<planets.length&&alive;pi++){
      const [planet,stages]=planets[pi];
      for(let si=0;si<stages.length&&alive;si++){
        const s=stages[si],row=result.stages[pi*4+si];row.attempts++;
        const pool=s.pool.filter(k=>balance.rogue.enemies[k]),spawnRate=60/Math.max(20,s.spawnInterval);
        const avgHp=pool.reduce((a,k)=>a+balance.rogue.enemies[k].hp,0)/Math.max(1,pool.length);
        const avgThreat=pool.reduce((a,k)=>a+(HAZARD[k]||1),0)/Math.max(1,pool.length);
        const dps=(damage*8*(1+crit*.6)+thorns*2+chain*.35)*profile.damage,killRate=Math.max(.05,Math.min(spawnRate*1.8,dps/Math.max(1,avgHp)*.72));
        let targetTime;const kind=s.objective?.kind||"time",target=Number(s.objective?.target)||90;
        if(kind==="time")targetTime=target;else if(kind==="kills")targetTime=target/Math.max(.05,killRate*profile.objective);else if(kind==="strongKills")targetTime=target/Math.max(.04,killRate*.45*profile.objective);else if(kind==="coreFragments")targetTime=target/Math.max(.04,killRate*.18*profile.objective);else if(kind==="distance")targetTime=target/(7*60*speed);else targetTime=60;
        targetTime=Math.max(8,Math.min(240,targetTime));
        const pressure=Math.max(1,(s.maxAlive||5)/5),incomingPerSec=spawnRate*avgThreat*pressure*profile.contact*(1-dodge*.65)*(1+(s.speedMult-1)*.5)*slow;
        const expectedHits=incomingPerSec*targetTime,effectiveHp=hp+shields+regen*targetTime/3+vampire*kills,randomHits=expectedHits*(.72+.56*rng()),lethal=randomHits>=effectiveHp,stageDamage=Math.max(0,randomHits);
        damageTaken+=stageDamage;elapsed+=targetTime;
        const stageKills=Math.max(0,Math.floor(killRate*targetTime*(.82+.3*rng())));kills+=stageKills;gold+=Math.floor(stageKills*(2+levels*.4));if(stageKills>=8)levels+=Math.floor(stageKills/8);
        for(let n=0;n<stageKills;n++){const k=pool[Math.floor(rng()*pool.length)]||"normal";result.enemies[k].killed++;if(rng()<.18)crystals++}
        for(const k of pool)result.enemies[k].spawned+=Math.max(0,Math.floor(spawnRate*targetTime/pool.length));
        if(stageDamage>0)for(const k of pool)result.enemies[k].damageTaken+=stageDamage/pool.length;
        while(upgrades<Math.floor(kills/8))pickUpgrade();
        if(lethal){alive=false;row.deaths++;result.summary.deaths++;const dk=pool[Math.floor(rng()*pool.length)]||"normal";result.enemies[dk].deaths++;totalSurvival+=elapsed;totalKills+=kills;totalGold+=gold;totalCrystals+=crystals;totalLevels+=levels;totalUpgrades+=upgrades;totalDamage+=damageTaken;break outer}
        hp=Math.min(baseHp+shields,Math.max(1,hp-stageDamage*.55+regen*targetTime/4+vampire*stageKills));row.completed++;row.avgSeconds+=targetTime;row.avgKills+=stageKills;row.avgDamageTaken+=stageDamage;result.summary.stagesCompleted++;
      }
      if(alive){
        result.summary.planetCompleted++;const bossKey=pi===0?"dragon":pi===1?"titan":"devourer",b=balance.rogue.bosses[bossKey];
        if(b){result.summary.bossesAttempted++;result.bosses[bossKey].attempted++;const bossDps=Math.max(.1,(2+damage)*8*(1+crit*.6)*.42),fight=Math.max(1,b.hp/bossDps),bossHits=fight*(.06+profile.contact*.35)*(1-dodge*.55),bossEffectiveHp=hp+shields+regen*fight/3+vampire*kills;result.bosses[bossKey].avgFightSeconds+=fight;
          if(bossHits>=bossEffectiveHp){alive=false;result.bosses[bossKey].deaths++;result.summary.deaths++;elapsed+=fight;totalSurvival+=elapsed;totalKills+=kills;totalGold+=gold;totalCrystals+=crystals;totalLevels+=levels;totalUpgrades+=upgrades;totalDamage+=damageTaken+bossHits;break outer}
          elapsed+=fight;result.bosses[bossKey].defeated++;result.summary.bossesDefeated++;gold+=b.rewardGold||0;crystals+=b.rewardCrystals||0;hp=Math.min(baseHp+shields,Math.max(1,hp-bossHits*.6+regen*fight/3));
        }
      }
    }
    if(alive)result.summary.completed++;totalSurvival+=alive?elapsed:0;totalKills+=kills;totalGold+=gold;totalCrystals+=crystals;totalLevels+=levels;totalUpgrades+=upgrades;totalDamage+=damageTaken;
  }
  const denom=runs||1;result.summary.avgSurvivalSeconds=totalSurvival/denom;result.summary.avgKills=totalKills/denom;result.summary.avgGold=totalGold/denom;result.summary.avgCrystals=totalCrystals/denom;result.summary.avgLevels=totalLevels/denom;result.summary.avgUpgrades=totalUpgrades/denom;result.summary.avgDamageTaken=totalDamage/denom;
  for(const r of result.stages)if(r.completed){r.avgSeconds/=r.completed;r.avgKills/=r.completed;r.avgDamageTaken/=r.completed}
  for(const k of Object.keys(result.bosses))if(result.bosses[k].defeated)result.bosses[k].avgFightSeconds/=result.bosses[k].defeated;
  return result;
}

const server=http.createServer(async(req,res)=>{
  try{
    const u=new URL(req.url,"http://127.0.0.1");
    if(u.pathname==="/")return send(res,200,"text/html; charset=utf-8",PAGE);
    if(u.pathname==="/ideas")return send(res,200,"text/html; charset=utf-8",IDEAS_PAGE);
    const localRequest=req.socket.remoteAddress==="127.0.0.1"||req.socket.remoteAddress==="::1"||req.socket.remoteAddress==="::ffff:127.0.0.1";
    if(!localRequest&&u.searchParams.get("token")!==TOKEN)return send(res,403,"application/json",JSON.stringify({error:"Forbidden"}));
    if(u.pathname==="/api/analytics"&&req.method==="OPTIONS")return send(res,204,"text/plain","");
    if(u.pathname==="/api/analytics"&&req.method==="DELETE"){saveAnalytics([]);return send(res,200,"application/json",JSON.stringify({success:true}))}
    if(u.pathname==="/api/analytics"&&req.method==="POST"){let body="";for await(const chunk of req)body+=chunk;let batch=JSON.parse(body);if(!Array.isArray(batch))batch=[batch];batch=batch.filter(e=>e&&typeof e.event==="string"&&e.data&&typeof e.data==="object").slice(0,500);const events=loadAnalytics();events.push(...batch);saveAnalytics(events);return send(res,200,"application/json",JSON.stringify({success:true,accepted:batch.length,total:Math.min(events.length,30000)}))}
    if(u.pathname==="/api/analytics"&&req.method==="GET")return send(res,200,"application/json",JSON.stringify(analyticsSummary(loadAnalytics())));
    if(u.pathname==="/api/version"&&req.method==="GET")return send(res,200,"application/json",JSON.stringify({version:gameVersion(),source:"index.html"}));
    if(u.pathname==="/api/balance"&&req.method==="GET")return send(res,200,"application/json",JSON.stringify(load()));
    if(u.pathname==="/api/bugs"&&req.method==="GET")return send(res,200,"application/json",JSON.stringify(loadBugs()));
    if(u.pathname==="/api/bugs"&&req.method==="POST"){let body="";for await(const chunk of req)body+=chunk;const data=JSON.parse(body);saveBugs(data);let commitSha=headSha();try{commitBugs();commitSha=headSha()}catch(e){if(!String(e.message).includes("nothing to commit"))throw e}if(data.push){try{push();const sha=headSha();return send(res,200,"application/json",JSON.stringify({success:true,sha,commitUrl:"https://github.com/wertretwetrertew-a11y/Starfall-Dash-1.1/commit/"+sha,bugs:data.bugs}))}catch(e){return send(res,200,"application/json",JSON.stringify({success:false,message:"Баги сохранены и закоммичены, но push не выполнен: "+e.message,bugs:data.bugs}))}}return send(res,200,"application/json",JSON.stringify({success:true,bugs:data.bugs}))}
    if(u.pathname==="/api/ideas"&&req.method==="GET")return send(res,200,"application/json",JSON.stringify(loadIdeas()));
    if(u.pathname==="/api/ideas"&&req.method==="POST"){let body="";for await(const chunk of req)body+=chunk;const data=JSON.parse(body);saveIdeas(data);let commitSha=headSha();try{commitIdeas();commitSha=headSha()}catch(e){if(!String(e.message).includes("nothing to commit"))throw e}try{push();const sha=headSha();return send(res,200,"application/json",JSON.stringify({success:true,sha,commitUrl:"https://github.com/wertretwetrertew-a11y/Starfall-Dash-1.1/commit/"+sha,ideas:data.ideas}))}catch(e){return send(res,200,"application/json",JSON.stringify({success:false,message:"Идеи сохранены локально, но push не выполнен: "+e.message,ideas:data.ideas}))}}
    if(u.pathname==="/api/run"&&req.method==="POST"){let body="";for await(const chunk of req)body+=chunk;const p=JSON.parse(body);const data=load();return send(res,200,"application/json",JSON.stringify(simulate(data,p)))}
    if(u.pathname==="/api/save"&&req.method==="POST"){let body="";for await(const chunk of req)body+=chunk;const p=JSON.parse(body);save(p.data);let message="Баланс сохранён.";if(p.push||p.commit){try{commit();message+=" Git commit создан."}catch(e){if(!p.push)message+=" Git commit не создан: "+e.message;else if(!String(e.message).includes("nothing to commit"))throw e}}if(p.push){try{push();const sha=headSha();return send(res,200,"application/json",JSON.stringify({success:true,message:message+" Изменения отправлены в GitHub.",sha,commitUrl:"https://github.com/wertretwetrertew-a11y/Starfall-Dash-1.1/commit/"+sha,data:p.data}))}catch(e){return send(res,200,"application/json",JSON.stringify({success:false,message:"GitHub не принял push. Локальное сохранение выполнено.\n"+e.message,data:p.data}))}}return send(res,200,"application/json",JSON.stringify({message,data:p.data}))}
    return send(res,404,"application/json",JSON.stringify({error:"Not found"}));
  }catch(e){return send(res,500,"application/json",JSON.stringify({error:e.message}))}
});
server.listen(PORT,"127.0.0.1",()=>{const url="http://127.0.0.1:"+PORT+"/?token="+TOKEN;console.log("🤖 Starfall Dash Bot Lab: "+url);});
