import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {randomBytes} from "node:crypto";
const ROOT=process.cwd(), CONFIG=path.join(ROOT,"config","roguelike-balance.json"), RUNTIME=path.join(ROOT,"js","balance-config.js");
const PORT=Number(process.env.STARFALL_BALANCE_PORT||4179), TOKEN=randomBytes(18).toString("hex");
const PAGE=fs.readFileSync(path.join(ROOT,"tools","balance-editor.html"),"utf8");
function load(){return JSON.parse(fs.readFileSync(CONFIG,"utf8"))}
function runtime(data){return "// AUTO-GENERATED FROM config/roguelike-balance.json\n// Edit the JSON with: node tools/balance-editor.mjs\nvar STARFALL_BALANCE = "+JSON.stringify(data,null,2)+";\nfunction sfBalance(){ return (typeof STARFALL_BALANCE==='object' && STARFALL_BALANCE) ? STARFALL_BALANCE : null; }\nfunction sfRogueBalance(){ var b=sfBalance(); return b && b.rogue ? b.rogue : null; }\nfunction sfRogueStageBalance(planetKey, stageIndex){ var b=sfRogueBalance(); var list=b && b.stages && b.stages[planetKey]; return list && list[stageIndex] ? list[stageIndex] : null; }\nfunction sfGetEnemyBalance(typeKey){ var b=sfRogueBalance(); return b&&b.enemies&&b.enemies[typeKey] ? b.enemies[typeKey] : null; }\nfunction sfGetBossBalance(bossKey){ var b=sfRogueBalance(); return b&&b.bosses&&b.bosses[bossKey] ? b.bosses[bossKey] : null; }\n"}
function save(data){fs.writeFileSync(CONFIG,JSON.stringify(data,null,2)+"\n");fs.writeFileSync(RUNTIME,runtime(data))}
function commit(){execFileSync("git",["add","config/roguelike-balance.json","js/balance-config.js"],{cwd:ROOT,stdio:"pipe"});return execFileSync("git",["commit","-m","Balance: update Roguelike tuning"],{cwd:ROOT,encoding:"utf8"})}
function send(res,status,type,body){res.writeHead(status,{"Content-Type":type,"Cache-Control":"no-store"});res.end(body)}
const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,"http://127.0.0.1");if(u.pathname==="/"){return send(res,200,"text/html; charset=utf-8",PAGE.replace("</body>","<script>location.hash="+JSON.stringify(TOKEN)+"</script></body>"))}if(u.searchParams.get("token")!==TOKEN)return send(res,403,"application/json",JSON.stringify({error:"Forbidden"}));if(u.pathname==="/api/balance"&&req.method==="GET")return send(res,200,"application/json",JSON.stringify(load()));if(u.pathname==="/api/save"&&req.method==="POST"){let body="";for await(const chunk of req)body+=chunk;const p=JSON.parse(body);save(p.data);let message="Баланс сохранён.";if(p.commit){try{commit();message+=" Git commit создан."}catch(e){message+=" Git commit не создан: "+e.message}}return send(res,200,"application/json",JSON.stringify({message,data:p.data}))}return send(res,404,"application/json",JSON.stringify({error:"Not found"}))}catch(e){return send(res,500,"application/json",JSON.stringify({error:e.message}))}});
server.listen(PORT,"127.0.0.1",()=>console.log("🛠 Balance Editor: http://127.0.0.1:"+PORT+"#"+TOKEN));
