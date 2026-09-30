import process from "node:process";

const BOT_TOKEN = process.env.STARFALL_TELEGRAM_TOKEN;
const LAB_URL = process.env.STARFALL_BOT_LAB_URL || "http://127.0.0.1:4180";
const ALLOWED = new Set((process.env.STARFALL_TELEGRAM_ALLOWED_IDS || "").split(",").map(x=>x.trim()).filter(Boolean));
const POLL_MS = 1500;

if (!BOT_TOKEN) {
  console.error("STARFALL_TELEGRAM_TOKEN не задан.");
  process.exit(1);
}

const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;
let offset = 0;

async function tg(method, body) {
  const r = await fetch(`${TG}/${method}`, {
    method: "POST",
    headers: {"content-type":"application/json"},
    body: JSON.stringify(body || {})
  });
  const data = await r.json();
  if (!data.ok) throw new Error(data.description || "Telegram API error");
  return data.result;
}

async function lab(path, options={}) {
  const r = await fetch(LAB_URL + path, options);
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { throw new Error(text); }
  if (!r.ok || data.error) throw new Error(data.error || data.message || `Bot Lab HTTP ${r.status}`);
  return data;
}

function allowed(chatId) {
  return ALLOWED.size === 0 || ALLOWED.has(String(chatId));
}

function esc(s) {
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

async function send(chatId, text, extra={}) {
  return tg("sendMessage", {chat_id:chatId, text, parse_mode:"HTML", ...extra});
}

function menu() {
  return {
    inline_keyboard: [
      [{text:"🐞 Баги",callback_data:"bugs"},{text:"💡 Идеи",callback_data:"ideas"}],
      [{text:"📊 Статистика",callback_data:"stats"},{text:"📡 Аналитика",callback_data:"analytics"}],
      [{text:"⚙️ Баланс",callback_data:"balance"}],
      [{text:"➕ Добавить баг",callback_data:"add_bug"},{text:"➕ Добавить идею",callback_data:"add_idea"}]
    ]
  };
}

async function showBugs(chatId) {
  const d = await lab("/api/bugs");
  const open = d.bugs.filter(b=>b.status !== "fixed");
  if (!open.length) return send(chatId,"🐞 <b>Баги</b>\n\nОткрытых багов нет.");
  const lines = open.slice(0,20).map(b=>`#${b.id} • ${esc(b.title)}\nПриоритет: ${b.priority} • статус: ${b.status}`);
  return send(chatId,"🐞 <b>Открытые баги</b>\n\n"+lines.join("\n\n"));
}

async function showIdeas(chatId) {
  const d = await lab("/api/ideas");
  if (!d.ideas.length) return send(chatId,"💡 <b>Идеи</b>\n\nСписок идей пока пуст.");
  const lines = d.ideas.slice(0,20).map(i=>`#${i.id} • ${esc(i.title)}\nСтатус: ${i.status} • приоритет: ${i.priority}`);
  return send(chatId,"💡 <b>Идеи обновлений</b>\n\n"+lines.join("\n\n"));
}

async function showStats(chatId) {
  const d = await lab("/api/analytics");
  return send(chatId,
    "📊 <b>Статистика игры</b>\n\n"+
    `Событий: <b>${d.events}</b>\nСессий: <b>${d.sessions}</b>\nЗабегов: <b>${d.runs}</b>\nЗавершено: <b>${d.completed}</b>\nСмертей: <b>${d.deaths}</b>\nУбийств: <b>${d.totalKills}</b>\nXP: <b>${d.totalXP}</b>\nЗолото: <b>${d.totalGold}</b>\nПобед над боссами: <b>${d.bossWins}</b>`
  );
}

async function showAnalytics(chatId) {
  const d = await lab("/api/analytics");
  const modes = (d.byMode||[]).slice(0,5).map(([k,v])=>`• ${esc(k)}: ${v}`).join("\n") || "нет данных";
  const deaths = (d.byDeath||[]).slice(0,5).map(([k,v])=>`• ${esc(k)}: ${v}`).join("\n") || "нет данных";
  return send(chatId,"📡 <b>Аналитика</b>\n\n<b>Режимы</b>\n"+modes+"\n\n<b>Причины смерти</b>\n"+deaths);
}

async function showBalance(chatId) {
  const d = await lab("/api/balance");
  const r = d.rogue || {};
  const stages = Object.values(r.stages || {}).flat();
  const enemies = Object.keys(r.enemies || {}).length;
  const bosses = Object.keys(r.bosses || {}).length;
  return send(chatId,`⚙️ <b>Баланс</b>\n\nПланет/наборов этапов: <b>${Object.keys(r.stages||{}).length}</b>\nЭтапов: <b>${stages.length}</b>\nТипов врагов: <b>${enemies}</b>\nБоссов: <b>${bosses}</b>\n\nИзменение баланса через Telegram пока намеренно ограничено чтением. Полный редактор остаётся в Bot Lab.`);
}

async function saveBug(chatId, title, description="Добавлено через Telegram", priority="medium") {
  const d = await lab("/api/bugs");
  d.bugs.push({id:d.nextId||1,title,priority,status:"open",createdAt:new Date().toISOString().slice(0,10),fixedAt:null,commit:null,description,version:null});
  d.push = true;
  const saved = await lab("/api/bugs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(d)});
  return send(chatId, saved.success ? `✅ Баг #${d.bugs.at(-1).id} добавлен и сохранён в GitHub.` : "⚠️ Баг сохранён, но push в GitHub не выполнен.");
}

async function saveIdea(chatId, title, description="Добавлено через Telegram", priority="medium") {
  const d = await lab("/api/ideas");
  const id = d.nextId || 1;
  d.ideas.push({id,title,description,priority,status:"planned",createdAt:new Date().toISOString().slice(0,10)});
  const saved = await lab("/api/ideas",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(d)});
  return send(chatId, saved.success ? `✅ Идея #${id} добавлена и сохранена в GitHub.` : "⚠️ Идея сохранена, но push в GitHub не выполнен.");
}

async function handle(chatId, text) {
  if (!allowed(chatId)) return send(chatId,`🔒 Доступ закрыт. Твой Telegram ID: <code>${chatId}</code>\nДобавь этот ID в STARFALL_TELEGRAM_ALLOWED_IDS владельца бота.`);
  const [command,...rest] = text.trim().split(/\\s+/);
  const arg = rest.join(" ").trim();
  switch(command.split("@")[0].toLowerCase()) {
    case "/start": case "/menu":
      return send(chatId,"🤖 <b>Starfall Dash Bot</b>\n\nУправление существующим Starfall Bot Lab.",{reply_markup:menu()});
    case "/bugs": return showBugs(chatId);
    case "/ideas": return showIdeas(chatId);
    case "/stats": return showStats(chatId);
    case "/analytics": return showAnalytics(chatId);
    case "/balance": return showBalance(chatId);
    case "/bug":
      if(!arg) return send(chatId,"Использование: <code>/bug название бага</code>");
      return saveBug(chatId,arg);
    case "/idea":
      if(!arg) return send(chatId,"Использование: <code>/idea название идеи</code>");
      return saveIdea(chatId,arg);
    default:
      return send(chatId,"Неизвестная команда. Нажми /menu.",{reply_markup:menu()});
  }
}

async function poll() {
  while (true) {
    try {
      const updates = await tg("getUpdates",{offset,timeout:30,allowed_updates:["message","callback_query"]});
      for (const u of updates) {
        offset = u.update_id + 1;
        try {
          if (u.callback_query) {
            const q=u.callback_query; await tg("answerCallbackQuery",{callback_query_id:q.id});
            if (!allowed(q.message.chat.id)) { await send(q.message.chat.id,`🔒 Доступ закрыт. Telegram ID: <code>${q.message.chat.id}</code>`); continue; }
            const map={bugs:showBugs,ideas:showIdeas,stats:showStats,analytics:showAnalytics,balance:showBalance};
            if(map[q.data]) await map[q.data](q.message.chat.id);
            else if(q.data==="add_bug") await send(q.message.chat.id,"Добавить баг: <code>/bug название бага</code>");
            else if(q.data==="add_idea") await send(q.message.chat.id,"Добавить идею: <code>/idea название идеи</code>");
          } else if (u.message?.text) {
            await handle(u.message.chat.id,u.message.text);
          }
        } catch(e) { await send(u.message?.chat?.id || u.callback_query?.message?.chat?.id, "⚠️ Ошибка: "+esc(e.message)); }
      }
    } catch(e) {
      console.error("Polling error:",e.message);
      await new Promise(r=>setTimeout(r,3000));
    }
  }
}

console.log("🤖 Starfall Telegram Bot запущен. Bot Lab:",LAB_URL);
poll();
