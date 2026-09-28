// ==========================================================
//   STARFALL DASH 2.6 «ROGUELIKE EVOLUTION» — ЧАСТЬ 2/4
//   Константы • Миграция • Апгрейды • Реликвии • Классы
//   ⚠️ ВСЕ ФИКСЫ БАГОВ ВНЕДРЕНЫ
// ==========================================================

console.log('🚀 Starfall Dash 2.6 «Roguelike Evolution» — загрузка...');

// ===== POLYFILL roundRect =====
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

// ===== DOM =====
var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var hudScoreVal = document.getElementById('hud-score-val');
var hudLevelVal = document.getElementById('hud-level-val');
var hudProgressFill = document.getElementById('hud-progress-fill');
var hudLives = document.getElementById('hud-lives');
var hudTimer = document.getElementById('hud-timer');
var hudMode = document.getElementById('hud-mode');
var hudCombo = document.getElementById('hud-combo');
var buffStrip = document.getElementById('buff-strip');
var upgradeStrip = document.getElementById('upgrade-strip');
var levelToast = document.getElementById('level-toast');
var levelToastTitle = levelToast.querySelector('.lt-title');
var levelToastReward = levelToast.querySelector('.lt-reward');
var levelToastMult = levelToast.querySelector('.lt-mult');

var loginScreen = document.getElementById('login-screen');
var profilesList = document.getElementById('profiles-list');
var createProfileModal = document.getElementById('create-profile-modal');
var cpNick = document.getElementById('cp-nick');
var cpPasswordToggle = document.getElementById('cp-password-toggle');
var cpCheckbox = document.getElementById('cp-checkbox');
var cpPasswordField = document.getElementById('cp-password-field');
var cpPassword = document.getElementById('cp-password');
var cpCancel = document.getElementById('cp-cancel');
var cpCreate = document.getElementById('cp-create');
var cpError = document.getElementById('cp-error');

var passwordModal = document.getElementById('password-modal');
var pwNick = document.getElementById('pw-nick');
var pwInput = document.getElementById('pw-input');
var pwCancel = document.getElementById('pw-cancel');
var pwLogin = document.getElementById('pw-login');
var pwError = document.getElementById('pw-error');

var startScreen = document.getElementById('start-screen');
var modeScreen = document.getElementById('mode-screen');
var modeBack = document.getElementById('mode-back');
var classScreen = document.getElementById('class-screen');
var classBack = document.getElementById('class-back');
var classGrid = document.getElementById('class-grid');
var coreScreen = document.getElementById('core-screen');
var coreBack = document.getElementById('core-back');
var coreGrid = document.getElementById('core-grid');
var coreGold = document.getElementById('core-gold');
var coreCrystals = document.getElementById('core-crystals');
var coreShards = document.getElementById('core-shards');
var coreBadge = document.getElementById('core-badge');
var tileCore = document.getElementById('tile-core');
var profileBadge = document.getElementById('profile-badge');
var pbNick = document.getElementById('pb-nick');
var slBest = document.getElementById('sl-best');
var slTime = document.getElementById('sl-time');
var slBank = document.getElementById('sl-bank');
var slCrystals = document.getElementById('sl-crystals');
var slShards = document.getElementById('sl-shards');
var slLvl = document.getElementById('sl-lvl');
var tilePlay = document.getElementById('tile-play');
var tileShop = document.getElementById('tile-shop');
var tileAch = document.getElementById('tile-ach');
var tileDaily = document.getElementById('tile-daily');
var tileQuick = document.getElementById('tile-quick');
var btnSettings = document.getElementById('btn-settings');
var btnHelp = document.getElementById('btn-help');
var btnPause = document.getElementById('btn-pause');

var settingsModal = document.getElementById('settings-modal');
var settingsClose = document.getElementById('settings-close');
var toggleLevelToastBtn = document.getElementById('toggle-leveltoast');
var toggleWeatherBtn = document.getElementById('toggle-weather');
var helpModal = document.getElementById('help-modal');
var helpClose = document.getElementById('help-close');
var profileMenuModal = document.getElementById('profile-menu-modal');
var pmNick = document.getElementById('pm-nick');
var pmBest = document.getElementById('pm-best');
var pmTime = document.getElementById('pm-time');
var pmBank = document.getElementById('pm-bank');
var pmCrystals = document.getElementById('pm-crystals');
var pmShards = document.getElementById('pm-shards');
var pmCore = document.getElementById('pm-core');
var pmLvl = document.getElementById('pm-lvl');
var pmGames = document.getElementById('pm-games');
var pmBosses = document.getElementById('pm-bosses');
var pmRogue = document.getElementById('pm-rogue');
var pmTotaltime = document.getElementById('pm-totaltime');
var pmSwitch = document.getElementById('pm-switch');
var pmClose = document.getElementById('pm-close');

var shopModal = document.getElementById('shop-modal');
var shopClose = document.getElementById('shop-close');
var shopGrid = document.getElementById('shop-grid');
var shopBankVal = document.getElementById('shop-bank-val');

var caseModal = document.getElementById('case-modal');
var caseWindow = document.getElementById('case-window');
var caseTitle = document.getElementById('case-title');
var caseReel = document.getElementById('case-reel');
var caseResult = document.getElementById('case-result');
var caseCloseBtn = document.getElementById('case-close-btn');
var dailyModal = document.getElementById('daily-modal');
var dailyGrid = document.getElementById('daily-grid');
var dailyClaimBtn = document.getElementById('daily-claim-btn');

var achPopup = document.getElementById('achievement-popup');
var apIcon = document.getElementById('ap-icon');
var apName = document.getElementById('ap-name');
var apReward = document.getElementById('ap-reward');

var pauseModal = document.getElementById('pause-modal');
var pauseMode = document.getElementById('pause-mode');
var pauseScore = document.getElementById('pause-score');
var pauseLevel = document.getElementById('pause-level');
var pauseTime = document.getElementById('pause-time');
var pauseResume = document.getElementById('pause-resume');
var pauseMenu = document.getElementById('pause-menu');

var gameoverModal = document.getElementById('gameover-modal');
var goTitle = document.getElementById('go-title');
var goScore = document.getElementById('go-score');
var goScoreLabel = document.getElementById('go-score-label');
var goLevel = document.getElementById('go-level');
var goTime = document.getElementById('go-time');
var goGold = document.getElementById('go-gold');
var goCrystals = document.getElementById('go-crystals');
var goRecord = document.getElementById('go-record');
var goBest = document.getElementById('go-best');
var goBuild = document.getElementById('go-build');
var goRestart = document.getElementById('go-restart');
var goMenu = document.getElementById('go-menu');
var goShare = document.getElementById('go-share');

var upgradeModal = document.getElementById('upgrade-modal');
var upgradeTitle = document.getElementById('upgrade-title');
var upgradeCardsEl = document.getElementById('upgrade-cards');
var upgradeRerollBtn = document.getElementById('upgrade-reroll');

var waveModal = document.getElementById('wave-modal');
var waveBanner = document.getElementById('wave-banner');
var waveIcon = document.getElementById('wave-icon');
var waveName = document.getElementById('wave-name');
var waveDesc = document.getElementById('wave-desc');
var waveStartBtn = document.getElementById('wave-start');

var relicModal = document.getElementById('relic-modal');
var relicCardsEl = document.getElementById('relic-cards');

var toastEl = document.getElementById('toast');

var currentShopTab = 'skins';
var currentProfile = null;
var pendingProfile = null;
var currentMode = 'classic';
var selectedClass = 'scout';

// ==========================================================
//   РЕЖИМЫ
// ==========================================================
var MODES = {
    rogue: {
        id: 'rogue', name: 'Рогалик', icon: '🎲', color: '#7cffb2',
        startLives: 4, levelDuration: 15 * 60,
        enemyMultiplier: 1.2, goldMultiplier: 1.5,
        hasTimer: false, isRoguelike: true
    },
    classic: {
        id: 'classic', name: 'Классика', icon: '🎯', color: '#4fc3f7',
        startLives: 4, levelDuration: 15 * 60,
        enemyMultiplier: 1, goldMultiplier: 1,
        hasTimer: false, isRoguelike: false
    },
    survival: {
        id: 'survival', name: 'Выживание', icon: '🔥', color: '#ff5c7a',
        startLives: 1, levelDuration: 10 * 60,
        enemyMultiplier: 1.5, goldMultiplier: 1.5,
        hasTimer: false, isRoguelike: false
    },
    timeattack: {
        id: 'timeattack', name: 'Тайм-атака', icon: '⏱', color: '#ffd93d',
        startLives: 3, levelDuration: 90 * 60,
        enemyMultiplier: 1, goldMultiplier: 1,
        hasTimer: true, timeLimit: 90, isRoguelike: false
    },
    hardcore: {
        id: 'hardcore', name: 'Хардкор', icon: '💀', color: '#9c6bff',
        startLives: 3, levelDuration: 12 * 60,
        enemyMultiplier: 2, goldMultiplier: 2,
        hasTimer: false, isRoguelike: false
    }
};

// ===== ЯДРО =====
var CORE_STATS = {
    vitality: { id:'vitality', name:'Живучесть', icon:'❤️', color:'#ff5c7a',
    desc:'+1 HP за уровень. Максимум 3.', basePrice: 500, maxLevel: 3,
    effect: function(lvl) { return lvl; },
    format: function(lvl) { return '+' + lvl + ' HP'; } },
    speed: { id:'speed', name:'Скорость', icon:'⚡', color:'#7cffb2',
        desc:'+5% к скорости', basePrice: 120, maxLevel: 10,
        effect: function(lvl) { return 1 + lvl * 0.05; },
        format: function(lvl) { return '+' + (lvl * 5) + '%'; } },
    magnet: { id:'magnet', name:'Магнетизм', icon:'🧲', color:'#4fc3f7',
        desc:'+15 радиус магнита', basePrice: 150, maxLevel: 10,
        effect: function(lvl) { return lvl * 15; },
        format: function(lvl) { return '+' + (lvl * 15); } },
    greed: { id:'greed', name:'Жадность', icon:'🪙', color:'#ffd93d',
        desc:'+5% золота за уровень', basePrice: 200, maxLevel: 20,
        effect: function(lvl) { return 1 + lvl * 0.05; },
        format: function(lvl) { return '+' + (lvl * 5) + '%'; } },
    combo: { id:'combo', name:'Комбо-мастер', icon:'🔥', color:'#ff9800',
        desc:'+10 кадров к комбо', basePrice: 180, maxLevel: 10,
        effect: function(lvl) { return lvl * 10; },
        format: function(lvl) { return '+' + (lvl * 10) + ' кадр.'; } },
    luck: { id:'luck', name:'Удача', icon:'✨', color:'#e040fb',
        desc:'+2% шанс дропа', basePrice: 250, maxLevel: 15,
        effect: function(lvl) { return lvl * 0.02; },
        format: function(lvl) { return '+' + (lvl * 2) + '%'; } }
};

// ===== СКИНЫ =====
var SKINS = {
    default: { id:'default', name:'Новичок', desc:'Стандартный', price:0, rarity:'common',
        colors:{ top:'#b3e5ff', bottom:'#2196f3', glow:'#4fc3f7' } },
    fire: { id:'fire', name:'Огонь', desc:'Горячий', price:200, rarity:'common',
        colors:{ top:'#ffcc80', bottom:'#e65100', glow:'#ff5722' } },
    toxic: { id:'toxic', name:'Токсин', desc:'Радиоактивный', price:300, rarity:'common',
        colors:{ top:'#d4ff8a', bottom:'#33691e', glow:'#76ff03' } },
    ice: { id:'ice', name:'Лёд', desc:'Морозный', price:500, rarity:'rare',
        colors:{ top:'#e0f7ff', bottom:'#0277bd', glow:'#00e5ff' } },
    vampire: { id:'vampire', name:'Вампир', desc:'Кровавый', price:700, rarity:'rare',
        colors:{ top:'#ffb3c1', bottom:'#880e4f', glow:'#ff1744' } },
    ocean: { id:'ocean', name:'Океан', desc:'Бирюзовый', price:600, rarity:'rare',
        colors:{ top:'#80deea', bottom:'#00695c', glow:'#00bcd4' } },
    sakura: { id:'sakura', name:'Сакура', desc:'Розовый', price:650, rarity:'rare',
        colors:{ top:'#ffb3d1', bottom:'#ad1457', glow:'#ff4081' } },
    emerald: { id:'emerald', name:'Изумруд', desc:'Зелёный', price:800, rarity:'rare',
        colors:{ top:'#a5d6a7', bottom:'#1b5e20', glow:'#4caf50' } },
    tiger: { id:'tiger', name:'Тигр', desc:'Полоски', price:1000, rarity:'rare',
        colors:{ top:'#ffcc80', bottom:'#e65100', glow:'#ff5722', tiger:true } },
    zebra: { id:'zebra', name:'Зебра', desc:'Ч/Б', price:1000, rarity:'rare',
        colors:{ top:'#fff', bottom:'#000', glow:'#fff', zebra:true } },
    cosmic_cat: { id:'cosmic_cat', name:'Кот-космонавт', desc:'Мяу в космосе', price:2500, rarity:'epic',
        colors:{ top:'#b388ff', bottom:'#1a0033', glow:'#e040fb', cat:true, cosmic:true } },
    rainbow: { id:'rainbow', name:'Радуга', desc:'Легендарный', price:2000, rarity:'epic',
        colors:{ top:'#fff', bottom:'#9c27b0', glow:'#ff00ff', rainbow:true } },
    sunset: { id:'sunset', name:'Закат', desc:'Оранжево-фиолетовый', price:1500, rarity:'epic',
        colors:{ top:'#ffb74d', bottom:'#6a1b9a', glow:'#ff5722' } },
    nebula: { id:'nebula', name:'Туманность', desc:'Фиолетово-синий', price:1800, rarity:'epic',
        colors:{ top:'#b388ff', bottom:'#1a237e', glow:'#7c4dff' } },
    amethyst: { id:'amethyst', name:'Аметист', desc:'Лаванда', price:2000, rarity:'epic',
        colors:{ top:'#e1bee7', bottom:'#4a148c', glow:'#9c27b0' } },
    pulse: { id:'pulse', name:'Пульс', desc:'Пульсирует', price:2200, rarity:'epic',
        colors:{ top:'#ff80ab', bottom:'#880e4f', glow:'#ff4081', pulse:true } },
    crystal: { id:'crystal', name:'Кристалл', desc:'Геометрия внутри', price:2800, rarity:'epic',
        colors:{ top:'#b3e5fc', bottom:'#01579b', glow:'#40c4ff', crystal:true } },
    alien: { id:'alien', name:'Пришелец', desc:'Пиксель-арт', price:3000, rarity:'epic',
        colors:{ top:'#7cffb2', bottom:'#1b5e20', glow:'#00e676', alien:true } },
    hacker: { id:'hacker', name:'Хакер', desc:'Матрица', price:3500, rarity:'epic',
        colors:{ top:'#00ff41', bottom:'#003b00', glow:'#00ff41', hacker:true } },
    glow: { id:'glow', name:'Светящийся', desc:'Яркое свечение', price:3800, rarity:'epic',
        colors:{ top:'#fff59d', bottom:'#ff6f00', glow:'#ffeb3b', glow:true, pulse:true } },
    gold: { id:'gold', name:'Золотой', desc:'Элитный', price:5000, rarity:'legendary',
        colors:{ top:'#fff59d', bottom:'#ff6f00', glow:'#ffd700', gold:true } },
    police: { id:'police', name:'Полиция', desc:'Мигает', price:4000, rarity:'legendary',
        colors:{ top:'#2196f3', bottom:'#f44336', glow:'#fff', police:true } },
    toxicplus: { id:'toxicplus', name:'Яд+', desc:'Кислотный', price:4200, rarity:'legendary',
        colors:{ top:'#d4ff8a', bottom:'#000', glow:'#76ff03', pulse:true } },
    lightning: { id:'lightning', name:'Молния', desc:'Электрический', price:5000, rarity:'legendary',
        colors:{ top:'#fff59d', bottom:'#2962ff', glow:'#ffeb3b', lightning:true } },
    flame: { id:'flame', name:'Пламя', desc:'Горит', price:6000, rarity:'legendary',
        colors:{ top:'#ffcc80', bottom:'#bf360c', glow:'#ff5722', flame:true } },
    cat: { id:'cat', name:'Котик', desc:'Мяу!', price:4500, rarity:'legendary',
        colors:{ top:'#ffb74d', bottom:'#4e342e', glow:'#ff9800', cat:true } },
    dragon: { id:'dragon', name:'Дракончик', desc:'Крылышки', price:6500, rarity:'legendary',
        colors:{ top:'#ff8a80', bottom:'#b71c1c', glow:'#ff5252', dragon:true } },
    volcano: { id:'volcano', name:'Вулкан', desc:'Лава внутри', price:7000, rarity:'legendary',
        colors:{ top:'#ff5722', bottom:'#3e0a00', glow:'#ff1744', flame:true, pulse:true } },
    ghostly: { id:'ghostly', name:'Призрак', desc:'Полупрозрачный', price:5500, rarity:'legendary',
        colors:{ top:'#e0e0e0', bottom:'#616161', glow:'#bdbdbd', ghostly:true } },
    cosmic: { id:'cosmic', name:'Космос', desc:'За гранью', price:12000, rarity:'mythic',
        colors:{ top:'#b388ff', bottom:'#1a0033', glow:'#e040fb', cosmic:true } },
    diamond: { id:'diamond', name:'Алмаз', desc:'Прозрачный', price:10000, rarity:'mythic',
        colors:{ top:'#e0f7ff', bottom:'#0277bd', glow:'#00e5ff', diamond:true } },
    galaxy: { id:'galaxy', name:'Галактика', desc:'Туманность', price:14000, rarity:'mythic',
        colors:{ top:'#7c4dff', bottom:'#1a0033', glow:'#e040fb', galaxy:true } },
    magic: { id:'magic', name:'Магия', desc:'Руны', price:16000, rarity:'mythic',
        colors:{ top:'#ea80fc', bottom:'#4a0072', glow:'#e040fb', magic:true } },
    royal: { id:'royal', name:'Королевский', desc:'Корона', price:20000, rarity:'mythic',
        colors:{ top:'#ffd700', bottom:'#4a148c', glow:'#ffd700', royal:true } },
    blackhole: { id:'blackhole', name:'Чёрная дыра', desc:'Поглощает свет', price:25000, rarity:'mythic',
        colors:{ top:'#4a148c', bottom:'#000', glow:'#e040fb', blackhole:true } },
    robot: { id:'robot', name:'Робот', desc:'Металлический', price:11000, rarity:'mythic',
        colors:{ top:'#b0bec5', bottom:'#37474f', glow:'#4fc3f7', robot:true } },
    pizza: { id:'pizza', name:'Пицца', desc:'🍕 Шуточный', price:5000, rarity:'mythic',
        colors:{ top:'#ffcc80', bottom:'#bf360c', glow:'#ff9800', pizza:true } },
    cookie: { id:'cookie', name:'Печенька', desc:'🍪 Секретный', price:50000, rarity:'mythic',
        colors:{ top:'#ffb74d', bottom:'#4e342e', glow:'#ff9800', cookie:true } },
    legend: { id:'legend', name:'Легенда', desc:'Все эффекты', price:30000, rarity:'mythic',
        colors:{ top:'#fff', bottom:'#ff00ff', glow:'#ffd700', legend:true } }
};

var ITEMS = {
    shield: { id:'shield', name:'Щит', icon:'🛡', desc:'+1 жизнь на забег', price:200,
        apply: function(s) { s.startLives = 5; } },
    magnet: { id:'magnet', name:'Магнит', icon:'🧲', desc:'Притягивает монеты', price:300,
        apply: function(s) { s.magnetRadius = 110; } },
    speed: { id:'speed', name:'Скорость', icon:'⚡', desc:'+15% к скорости', price:400,
        apply: function(s) { s.playerSpeedBonus = 1.15; } },
    combo_master: { id:'combo_master', name:'Комбо-мастер', icon:'🔥', desc:'Комбо +20 кадров', price:500,
        apply: function(s) { s.comboBonus = true; } },
    premium: { id:'premium', name:'Премиум', icon:'💎', desc:'Всё сразу + Радуга', price:1500,
        apply: function(s) {
            s.startLives = 5; s.magnetRadius = 110; s.playerSpeedBonus = 1.15; s.comboBonus = true;
            if (s.ownedSkins.indexOf('rainbow') === -1) s.ownedSkins.push('rainbow');
        } }
};

var BOOSTS = {
    x2gold: { id:'x2gold', name:'×2 Золото', icon:'✨', desc:'×2 золото на забег', price:150 },
    shieldRun: { id:'shieldRun', name:'Щит-забег', icon:'🛡', desc:'+1 жизнь на забег', price:100 },
    startCoins: { id:'startCoins', name:'Старт-монеты', icon:'🪙', desc:'+10 монет сразу', price:80 },
    magnetRun: { id:'magnetRun', name:'Магнит-забег', icon:'🧲', desc:'Магнит 30с', price:180 },
    comboRun: { id:'comboRun', name:'Комбо-старт', icon:'🔥', desc:'Стартовое комбо ×2', price:200 }
};

var THEMES = {
    cosmos: { id:'cosmos', name:'Космос', desc:'Классика', price:0, rarity:'common',
        bg1:'#0f0f2e', bg2:'#1a1a3e', bg3:'#0a0a1a',
        coinSmall1:'#fff8b0', coinSmall2:'#ffd93d', coinSmall3:'#f0a500', glow:'#4fc3f7', weather:'stars' },
    neon: { id:'neon', name:'Неон', desc:'Розово-бирюза', price:900, rarity:'rare',
        bg1:'#1a0a2e', bg2:'#2e0a3e', bg3:'#0a0020',
        coinSmall1:'#b3ffff', coinSmall2:'#00ffcc', coinSmall3:'#00b3aa', glow:'#ff00ff', weather:'neon' },
    volcano: { id:'volcano', name:'Вулкан', desc:'Огненный', price:1800, rarity:'epic',
        bg1:'#2e0a0a', bg2:'#3e1a0a', bg3:'#1a0500',
        coinSmall1:'#ffe0b3', coinSmall2:'#ffaa00', coinSmall3:'#bf5f00', glow:'#ff3300', weather:'ember' },
    ocean: { id:'ocean', name:'Океан', desc:'Глубины', price:2400, rarity:'legendary',
        bg1:'#0a1a2e', bg2:'#0a3e3e', bg3:'#001a1a',
        coinSmall1:'#d0ffff', coinSmall2:'#88ffff', coinSmall3:'#00aaaa', glow:'#00ffff', weather:'bubbles' },
    matrix: { id:'matrix', name:'Матрица', desc:'Зелёный код', price:3600, rarity:'legendary',
        bg1:'#000a00', bg2:'#001a08', bg3:'#000000',
        coinSmall1:'#aaffaa', coinSmall2:'#00ff41', coinSmall3:'#008800', glow:'#00ff41', weather:'matrix' },
    sunset: { id:'sunset', name:'Закат', desc:'Оранжевый горизонт', price:3000, rarity:'legendary',
        bg1:'#2e0a2e', bg2:'#5e1a3e', bg3:'#1a0510',
        coinSmall1:'#ffe0cc', coinSmall2:'#ff8844', coinSmall3:'#cc4400', glow:'#ff6644', weather:'clouds' },
    station: { id:'station', name:'Станция', desc:'Металл и стекло', price:4200, rarity:'mythic',
        bg1:'#1a1a2e', bg2:'#2a2a3e', bg3:'#0a0a1a',
        coinSmall1:'#d0d8ff', coinSmall2:'#8899ff', coinSmall3:'#4455aa', glow:'#88aaff', weather:'sparks' }
};

var MONSTER_TYPES = {
    normal:   { c1:'#ff8aa0', c2:'#c62828', glow:'#ff5c7a', size:25, speed:3.5, unlock:1, hp:3, shape:'square' },
    flyer:    { c1:'#a5d6ff', c2:'#1565c0', glow:'#42a5f5', size:24, speed:3.0, unlock:1, hp:3, shape:'oval', flightTime:120 },
    zigzag:   { c1:'#b388ff', c2:'#6a1b9a', glow:'#9c6bff', size:24, speed:4.0, unlock:1, hp:3, shape:'diamond',
                zigzagAmp:3.5, zigzagFreq:0.15 },
    ghost:    { c1:'#e0e0e0', c2:'#616161', glow:'#bdbdbd', size:26, speed:3.2, unlock:2, hp:4, shape:'ghost' },
    hunter:   { c1:'#7cffb2', c2:'#1b5e20', glow:'#4caf50', size:22, speed:3.0, unlock:2, hp:4, shape:'triangle', homing:0.05 },
    snake:    { c1:'#aed581', c2:'#33691e', glow:'#8bc34a', size:26, speed:3.8, unlock:2, hp:4, shape:'snake',
                zigzagAmp:5, zigzagFreq:0.18, pushback:true },
    bomber:   { c1:'#ffab91', c2:'#bf360c', glow:'#ff5722', size:28, speed:2.8, unlock:3, hp:4, shape:'circle', explodes:true },
    splitter: { c1:'#ffd93d', c2:'#ff6f00', glow:'#ff9800', size:30, speed:2.6, unlock:3, hp:5, shape:'hex' },
    spider:   { c1:'#8d6e63', c2:'#3e2723', glow:'#a1887f', size:26, speed:2.4, unlock:4, hp:5, shape:'spider', leavesWeb:true },
    ice:      { c1:'#b3e5fc', c2:'#0277bd', glow:'#00e5ff', size:26, speed:3.0, unlock:4, hp:4, shape:'ice', freezes:true },
    star:     { c1:'#fff59d', c2:'#f57f17', glow:'#ffeb3b', size:26, speed:2.8, unlock:5, hp:5, shape:'star', shootsEvery:150 },
    miniboss: { c1:'#ff5252', c2:'#7f0000', glow:'#ff1744', size:44, speed:2.0, unlock:6, hp:12, shape:'boss',
                shootsEvery:90, homingShots:true },
    crystal: { c1:'#00e5ff', c2:'#0097a7', glow:'#00e5ff', size:32, speed:0.6, unlock:3, hp:6, shape:'crystal',
                shootsEvery:120, shootsCount:8 },
    barrier: { c1:'#ff9800', c2:'#4e342e', glow:'#ff9800', size:24, speed:2.5, unlock:4, hp:7, shape:'barrier',
                barWidth:60, vx:2.5 },
    teleporter: { c1:'#7c4dff', c2:'#1a0033', glow:'#e040fb', size:26, speed:0.3, unlock:5, hp:6, shape:'teleporter',
                teleportEvery:90 },
    magnet_enemy: { c1:'#f44336', c2:'#b71c1c', glow:'#ff1744', size:28, speed:2.0, unlock:5, hp:6, shape:'magnet_enemy',
                magnetForce:0.15, magnetRange:150 },
    doppel: { c1:'#e040fb', c2:'#4a0072', glow:'#e040fb', size:26, speed:0, unlock:6, hp:6, shape:'doppel', mirror:true },
    laser: { c1:'#ff1744', c2:'#fff', glow:'#ff1744', size:32, speed:1.8, unlock:7, hp:8, shape:'laser',
                chargeTime:60, laserDuration:30 }
};

var BOSS_TYPES = {
    dragon: { id:'dragon', name:'Космический дракон', icon:'🐉',
        c1:'#ff8a80', c2:'#b71c1c', glow:'#ff5252', size:80, hp:25, level:5, shape:'dragon',
        phases:3, reward:{ gold:500, crystals:5, skin:'dragon' } },
    titan: { id:'titan', name:'Ледяной титан', icon:'❄️',
        c1:'#b3e5fc', c2:'#0277bd', glow:'#00e5ff', size:90, hp:40, level:10, shape:'titan',
        phases:3, reward:{ gold:1000, crystals:10, skin:'ice' } },
    devourer: { id:'devourer', name:'Пожиратель звёзд', icon:'🕳',
        c1:'#7c4dff', c2:'#1a0033', glow:'#e040fb', size:100, hp:60, level:15, shape:'devourer',
        phases:3, reward:{ gold:2000, crystals:15, skin:'blackhole' } }
};

var DROP_STYLE = {
    killall:    { emoji:'💀', c1:'#ff8aa0', c2:'#ff1744', c3:'#880e4f', glow:'#ff1744' },
    bomb:       { emoji:'💣', c1:'#ffe082', c2:'#ff9800', c3:'#7f3f00', glow:'#ff9800' },
    magnet:     { emoji:'🧲', c1:'#b3e5ff', c2:'#4fc3f7', c3:'#0277bd', glow:'#4fc3f7' },
    freeze:     { emoji:'❄',  c1:'#d0ffff', c2:'#00e5ff', c3:'#0088aa', glow:'#00e5ff' },
    speedBoost: { emoji:'⚡', c1:'#d4ffb3', c2:'#7cffb2', c3:'#1b5e20', glow:'#7cffb2' },
    x2gold:     { emoji:'✨', c1:'#fff8b0', c2:'#ffd93d', c3:'#bf7f00', glow:'#ffd93d' },
    phantom:    { emoji:'👻', c1:'#ffffff', c2:'#e0e0e0', c3:'#9e9e9e', glow:'#ffffff' },
    medkit:     { emoji:'🩹', c1:'#ffb3c1', c2:'#ff5c7a', c3:'#880e4f', glow:'#ff5c7a' },
    chest:      { emoji:'🎁', c1:'#ffcc80', c2:'#ff9800', c3:'#bf5f00', glow:'#ff9800' },
    combo:      { emoji:'🔥', c1:'#ffb74d', c2:'#ff5722', c3:'#bf360c', glow:'#ff5722' }
};

var SOUND_PACKS = {
    classic: { id:'classic', name:'Классика', icon:'🔊', desc:'Стандарт', rarity:'common', price:0 },
    piano: { id:'piano', name:'Пианино', icon:'🎹', desc:'Мягкие ноты', rarity:'rare', price:400 },
    retro: { id:'retro', name:'Ретро', icon:'🕹', desc:'8-бит аркада', rarity:'rare', price:500 },
    rock: { id:'rock', name:'Рок', icon:'🎸', desc:'Гитара', rarity:'epic', price:1000 },
    space: { id:'space', name:'Космос', icon:'🌌', desc:'Эмбиент', rarity:'epic', price:1200 },
    nature: { id:'nature', name:'Природа', icon:'🌿', desc:'Птицы', rarity:'epic', price:1300 },
    synth: { id:'synth', name:'Синт', icon:'🎛', desc:'80-е', rarity:'legendary', price:2500 }
};

var MUSIC_TRACKS = {
    default: { id:'default', name:'Стандарт', icon:'🎼', desc:'Классика', rarity:'common', price:0,
        notes:[262, 330, 392, 523], tempo:300 },
    chiptune: { id:'chiptune', name:'Чиптюн', icon:'🎮', desc:'8-бит', rarity:'rare', price:800,
        notes:[262, 294, 330, 349], tempo:250 },
    synthwave: { id:'synthwave', name:'Синт-вейв', icon:'🌆', desc:'Ретро 80-е', rarity:'rare', price:1000,
        notes:[220, 277, 330, 440], tempo:320 },
    cosmic: { id:'cosmic', name:'Космос', icon:'🌠', desc:'Эмбиент', rarity:'epic', price:1800,
        notes:[196, 233, 262, 311], tempo:500 },
    techno: { id:'techno', name:'Техно', icon:'🎧', desc:'Быстрый бит', rarity:'epic', price:2200,
        notes:[147, 175, 220, 262], tempo:200 },
    epic: { id:'epic', name:'Эпик', icon:'⚔️', desc:'Оркестр', rarity:'legendary', price:4000,
        notes:[131, 165, 196, 262], tempo:400 },
    legend: { id:'legend', name:'Легенда', icon:'👑', desc:'Всё вместе', rarity:'mythic', price:8000,
        notes:[110, 139, 165, 220], tempo:350 }
};

var CARDS = {
    star:     { id:'star',     name:'Звезда',        icon:'⭐', rarity:'common',    price:150 },
    moon:     { id:'moon',     name:'Луна',          icon:'🌙', rarity:'common',    price:180 },
    comet:    { id:'comet',    name:'Комета',        icon:'☄️', rarity:'rare',      price:400 },
    saturn:   { id:'saturn',   name:'Сатурн',        icon:'🪐', rarity:'rare',      price:500 },
    galaxy:   { id:'galaxy',   name:'Галактика',     icon:'🌌', rarity:'epic',      price:1200 },
    phoenix:  { id:'phoenix',  name:'Феникс',        icon:'🔥', rarity:'legendary', price:2500 },
    eye:      { id:'eye',      name:'Око вселенной', icon:'👁', rarity:'mythic',    price:5000 },
    dragon:   { id:'dragon',   name:'Космодракон',   icon:'🐉', rarity:'mythic',    price:6000 },
    darklord: { id:'darklord', name:'Король тьмы',   icon:'💀', rarity:'mythic',    price:7000 },
    creator:  { id:'creator',  name:'Создатель',     icon:'🌟', rarity:'mythic',    price:9000 }
};

var CASES = {
    common: { id:'common', name:'Обычный кейс', icon:'📦', price:300, desc:'Скин + шанс на карту',
        dropTable: [{ rarity:'common', chance:75 }, { rarity:'rare', chance:20 },
                    { rarity:'epic', chance:4 }, { rarity:'legendary', chance:1 }] },
    rare: { id:'rare', name:'Редкий кейс', icon:'🎁', price:800, desc:'Скин + шанс на звук',
        dropTable: [{ rarity:'common', chance:30 }, { rarity:'rare', chance:50 },
                    { rarity:'epic', chance:17 }, { rarity:'legendary', chance:2.5 },
                    { rarity:'mythic', chance:0.5 }] },
    epic: { id:'epic', name:'Эпический кейс', icon:'🧰', price:2000, desc:'Скин + шанс на музыку',
        dropTable: [{ rarity:'rare', chance:25 }, { rarity:'epic', chance:55 },
                    { rarity:'legendary', chance:17 }, { rarity:'mythic', chance:3 }] },
    legendary: { id:'legendary', name:'Легендарный кейс', icon:'✦', price:4000, desc:'Топ-скин + карта + звук',
        dropTable: [{ rarity:'rare', chance:5 }, { rarity:'epic', chance:30 },
                    { rarity:'legendary', chance:55 }, { rarity:'mythic', chance:10 }] },
    mythic: { id:'mythic', name:'Мифический кейс', icon:'◈', price:10000, desc:'Гарантия mythic + всё',
        dropTable: [{ rarity:'epic', chance:10 }, { rarity:'legendary', chance:40 },
                    { rarity:'mythic', chance:50 }] }
};

var DUPLICATE_REFUND = { common:50, rare:150, epic:400, legendary:1000, mythic:2500 };

var DAILY_REWARDS = [
    { day:1, type:'gold', amount:300, icon:'💰', label:'300 золота' },
    { day:2, type:'gold', amount:450, icon:'💰', label:'450 золота' },
    { day:3, type:'case', caseId:'common', icon:'🥉', label:'Обычный кейс' },
    { day:4, type:'gold', amount:750, icon:'💰', label:'750 золота' },
    { day:5, type:'case', caseId:'rare', icon:'🥈', label:'Редкий кейс' },
    { day:6, type:'gold', amount:1200, icon:'💰', label:'1200 золота' },
    { day:7, type:'case', caseId:'epic', icon:'🥇', label:'Эпический кейс' }
];

var ACHIEVEMENTS = {
    first_step: { id:'first_step', name:'Первый шаг', icon:'🥉', desc:'Собери 100 монет',
        target:100, type:'totalCoins', reward:{ type:'gold', amount:300 } },
    collector:  { id:'collector',  name:'Коллекционер', icon:'🥈', desc:'Собери 1000 монет',
        target:1000, type:'totalCoins', reward:{ type:'gold', amount:800 } },
    millionaire:{ id:'millionaire',name:'Миллионер', icon:'🥇', desc:'Собери 10000 монет',
        target:10000, type:'totalCoins', reward:{ type:'gold', amount:2500 } },
    billionaire:{ id:'billionaire',name:'Миллиардер', icon:'💎', desc:'Собери 50000 монет',
        target:50000, type:'totalCoins', reward:{ type:'crystals', amount:50 } },
    beginner:   { id:'beginner',   name:'Новичок', icon:'🎯', desc:'Дойди до 3 уровня',
        target:3, type:'bestLevel', reward:{ type:'skin', skinId:'fire' } },
    warrior:    { id:'warrior',    name:'Воин', icon:'⚔', desc:'Дойди до 5 уровня',
        target:5, type:'bestLevel', reward:{ type:'skin', skinId:'toxic' } },
    veteran:    { id:'veteran',    name:'Ветеран', icon:'🏆', desc:'Дойди до 8 уровня',
        target:8, type:'bestLevel', reward:{ type:'skin', skinId:'crystal' } },
    legend:     { id:'legend_ach', name:'Легенда', icon:'👑', desc:'Дойди до 12 уровня',
        target:12, type:'bestLevel', reward:{ type:'skin', skinId:'cosmic' } },
    case_first: { id:'case_first', name:'Первый кейс', icon:'✨', desc:'Открой 1 кейс',
        target:1, type:'openedCases', reward:{ type:'gold', amount:150 } },
    case_hunter:{ id:'case_hunter',name:'Охотник за кейсами', icon:'📦', desc:'Открой 10 кейсов',
        target:10, type:'openedCases', reward:{ type:'case', caseId:'rare' } },
    case_master:{ id:'case_master',name:'Мастер кейсов', icon:'💎', desc:'Открой 50 кейсов',
        target:50, type:'openedCases', reward:{ type:'case', caseId:'epic' } },
    skins5:     { id:'skins5',     name:'Стилист', icon:'🎨', desc:'Собери 5 скинов',
        target:5, type:'skinsCount', reward:{ type:'gold', amount:500 } },
    skins10:    { id:'skins10',    name:'Модник', icon:'🌈', desc:'Собери 10 скинов',
        target:10, type:'skinsCount', reward:{ type:'case', caseId:'epic' } },
    skins15:    { id:'skins15',    name:'Кутюрье', icon:'👑', desc:'Собери 15 скинов',
        target:15, type:'skinsCount', reward:{ type:'skin', skinId:'galaxy' } },
    meloman:    { id:'meloman',    name:'Меломан', icon:'🔊', desc:'Купи 3 звуковых пака',
        target:3, type:'soundsCount', reward:{ type:'gold', amount:400 } },
    dj:         { id:'dj',         name:'DJ', icon:'🎵', desc:'Купи 3 музыкальные темы',
        target:3, type:'musicCount', reward:{ type:'gold', amount:600 } },
    survivor:   { id:'survivor',   name:'Выживший', icon:'🔥', desc:'Продержись 2 минуты в Выживании',
        target:120, type:'survivalBest', reward:{ type:'crystals', amount:5 } },
    speedrun:   { id:'speedrun',   name:'Спидран', icon:'⏱', desc:'Собери 100 монет за 90 сек',
        target:100, type:'timeattackBest', reward:{ type:'gold', amount:1500 } },
    hardcore_m: { id:'hardcore_m', name:'Хардкор-мастер', icon:'💀', desc:'Дойди до 10 уровня в Хардкоре',
        target:10, type:'hardcoreBest', reward:{ type:'skin', skinId:'blackhole' } },
    boss_slayer:{ id:'boss_slayer',name:'Убийца боссов', icon:'🐉', desc:'Победи любого босса',
        target:1, type:'bossesKilled', reward:{ type:'crystals', amount:5 } },
    all_modes:  { id:'all_modes',  name:'Мастер режимов', icon:'🎮', desc:'Сыграй во все 5 режимов',
        target:5, type:'modesPlayed', reward:{ type:'case', caseId:'legendary' } },
    core_first: { id:'core_first', name:'Первая ступень', icon:'🌟', desc:'Прокачай любую стат до 1',
        target:1, type:'coreMaxLevel', reward:{ type:'crystals', amount:2 } },
    core_master:{ id:'core_master',name:'Мастер Ядра', icon:'💠', desc:'Прокачай любую стат до 5',
        target:5, type:'coreMaxLevel', reward:{ type:'crystals', amount:10 } },
    core_legend:{ id:'core_legend',name:'Легенда Ядра', icon:'🌈', desc:'Прокачай стат до 10',
        target:10, type:'coreMaxLevel', reward:{ type:'crystals', amount:25 } },
    rogue_first:{ id:'rogue_first',name:'Первый выбор', icon:'🎲', desc:'Возьми 1 апгрейд в Рогалике',
        target:1, type:'rogueUpgrades', reward:{ type:'shards', amount:5 } },
    rogue_build:{ id:'rogue_build',name:'Билдостроитель', icon:'⚙️', desc:'Возьми 10 апгрейдов за забег',
        target:10, type:'rogueMaxUpgradesRun', reward:{ type:'shards', amount:20 } },
    rogue_synergy:{ id:'rogue_synergy',name:'Синергия!', icon:'🔥', desc:'Активируй синергию',
        target:1, type:'synergiesActivated', reward:{ type:'shards', amount:15 } },
    rogue_relic:{ id:'rogue_relic',name:'Коллекционер реликвий', icon:'🏺', desc:'Получи 5 реликвий за забег',
        target:5, type:'relicsMaxRun', reward:{ type:'shards', amount:30 } },
    rogue_wave10:{ id:'rogue_wave10',name:'Мастер волн', icon:'🌊', desc:'Дойди до 10 уровня в Рогалике',
        target:10, type:'rogueBest', reward:{ type:'shards', amount:50 } }
};

var CHARACTER_CLASSES = {
    scout: { id:'scout', name:'Разведчик', icon:'🏃',
        desc:'Быстрый и ловкий. Собирает больше монет.',
        startHp:3, speed:1.25, magnet:40, damage:0, critChance:0.05,
        passive:'Монеты дают +25% золота', passiveId:'coin_bonus',
        color:'#7cffb2', unlocked:true, unlockText:'Доступен сразу' },
    tank: { id:'tank', name:'Танк', icon:'🛡',
        desc:'Живучий, но медленный. Больше HP.',
        startHp:6, speed:0.85, magnet:20, damage:1, critChance:0,
        passive:'Урон от столкновения ×2', passiveId:'double_damage',
        color:'#4fc3f7', unlocked:false, unlockAchievement:'survivor',
        unlockText:'Продержись 2 минуты в Выживании' },
    mage: { id:'mage', name:'Маг', icon:'🔮',
        desc:'Аура урона вокруг. Слабое HP.',
        startHp:3, speed:1.0, magnet:30, damage:0, critChance:0,
        passive:'Аура 60px: 0.5 урона/сек врагам', passiveId:'aura',
        color:'#e040fb', unlocked:false, unlockAchievement:'warrior',
        unlockText:'Дойди до 5 уровня' },
    rogue: { id:'rogue', name:'Вор', icon:'🗡',
        desc:'Больше дропа, шанс крита.',
        startHp:4, speed:1.15, magnet:50, damage:0, critChance:0.2,
        passive:'20% шанс крита ×3 золота', passiveId:'crit',
        color:'#ffd93d', unlocked:false, unlockAchievement:'collector',
        unlockText:'Собери 1000 монет' }
};

var UPGRADE_POOL = {
    damage: { id:'damage', name:'Урон', icon:'⚔️', rarity:'common',
        desc:'+1 урон при столкновении', stacks:true, maxStacks:8, tags:['offense'] },
    pierce: { id:'pierce', name:'Пронзание', icon:'🏹', rarity:'rare',
        desc:'Монеты пробивают врагов', stacks:true, maxStacks:3, tags:['offense'] },
    thorns: { id:'thorns', name:'Шипы', icon:'🌵', rarity:'rare',
        desc:'Враги получают 2 урона при касании', stacks:true, maxStacks:4, tags:['defense','offense'] },
    explosive: { id:'explosive', name:'Взрывные монеты', icon:'💥', rarity:'legendary',
        desc:'Монеты взрываются при подборе', stacks:false, tags:['offense'] },
    chain: { id:'chain', name:'Цепная молния', icon:'⚡', rarity:'epic',
        desc:'Убитые враги бьют молнией ближайшего', stacks:true, maxStacks:3, tags:['offense'] },
    crit: { id:'crit', name:'Критический удар', icon:'🎯', rarity:'rare',
        desc:'+15% шанс крита ×3 золота', stacks:true, maxStacks:5, tags:['offense','economy'] },
    shield: { id:'shield', name:'Щит', icon:'🛡', rarity:'common',
        desc:'+1 щит, восстанавливается 12 сек', stacks:true, maxStacks:5, tags:['defense'] },
    dodge: { id:'dodge', name:'Уклонение', icon:'💨', rarity:'rare',
        desc:'+15% шанс избежать урона', stacks:true, maxStacks:4, tags:['defense'] },
    regen: { id:'regen', name:'Регенерация', icon:'💚', rarity:'epic',
        desc:'+1 HP каждые 25 сек', stacks:true, maxStacks:3, tags:['defense'] },
    magnet: { id:'magnet', name:'Магнит', icon:'🧲', rarity:'common',
        desc:'+40 радиус сбора монет', stacks:true, maxStacks:8, tags:['utility'] },
    speed: { id:'speed', name:'Скорость', icon:'⚡', rarity:'common',
        desc:'+8% скорость передвижения', stacks:true, maxStacks:8, tags:['utility'] },
    luck: { id:'luck', name:'Удача', icon:'🍀', rarity:'rare',
        desc:'+10% шанс дропа', stacks:true, maxStacks:6, tags:['utility'] },
    greed: { id:'greed', name:'Жадность', icon:'💰', rarity:'common',
        desc:'+20% золота', stacks:true, maxStacks:8, tags:['economy'] },
    combo_extend: { id:'combo_extend', name:'Комбо-мастер', icon:'🔥', rarity:'rare',
        desc:'+30 кадров к окну комбо', stacks:true, maxStacks:5, tags:['economy'] },
    orbit: { id:'orbit', name:'Спутник', icon:'🪐', rarity:'epic',
        desc:'Вращающийся шар наносит урон', stacks:true, maxStacks:4, tags:['offense'] },
    vampire: { id:'vampire', name:'Вампиризм', icon:'🧛', rarity:'legendary',
        desc:'5% урона восстанавливают HP', stacks:true, maxStacks:3, tags:['offense','defense'] },
    time_slow: { id:'time_slow', name:'Замедление', icon:'⏳', rarity:'epic',
        desc:'Враги -10% скорости', stacks:true, maxStacks:5, tags:['defense'] },
    glass_cannon: { id:'glass_cannon', name:'Стеклянная пушка', icon:'💎', rarity:'mythic',
        desc:'+3 урона, но -1 HP', stacks:true, maxStacks:3, tags:['offense','risk'] },
    berserk: { id:'berserk', name:'Берсерк', icon:'😡', rarity:'mythic',
        desc:'Чем меньше HP, тем больше урона (до ×3)', stacks:false, tags:['offense','risk'] }
};

var RELICS = {
    lucky_coin: { id:'lucky_coin', name:'Счастливая монета', icon:'🍀',
        desc:'+30% золота от монет', rarity:'common' },
    hourglass: { id:'hourglass', name:'Песочные часы', icon:'⏳',
        desc:'Комбо не сбрасывается 3 сек', rarity:'rare' },
    magnet_core: { id:'magnet_core', name:'Ядро магнита', icon:'🧲',
        desc:'Радиус магнита ×2', rarity:'rare' },
    aegis: { id:'aegis', name:'Эгида', icon:'🛡',
        desc:'+2 щита', rarity:'epic' },
    phoenix_heart: { id:'phoenix_heart', name:'Сердце феникса', icon:'🔥',
        desc:'Возрождение 1 раз за забег', rarity:'legendary' },
    midas: { id:'midas', name:'Прикосновение Мидаса', icon:'👑',
        desc:'Все монеты ×3 золота', rarity:'legendary' },
    chaos_orb: { id:'chaos_orb', name:'Сфера хаоса', icon:'🌀',
        desc:'Каждые 10 сек: случайный бафф', rarity:'mythic' },
    berserker_mask: { id:'berserker_mask', name:'Маска берсерка', icon:'😈',
        desc:'Урон ×2 при HP = 1', rarity:'mythic' },
    star_compass: { id:'star_compass', name:'Звёздный компас', icon:'🧭',
        desc:'+1 апгрейд на выбор', rarity:'legendary' },
    blood_fang: { id:'blood_fang', name:'Кровавый клык', icon:'🩸',
        desc:'Критические удары восстанавливают 1 HP', rarity:'legendary' },
    void_engine: { id:'void_engine', name:'Двигатель пустоты', icon:'🕳',
        desc:'+2 урона, но враги движутся на 10% быстрее', rarity:'mythic' },
    titan_mark: { id:'titan_mark', name:'Клеймо титана', icon:'❄️',
        desc:'Каждый третий контакт с боссом наносит ×2 урон', rarity:'mythic' }
};

var WAVE_MODIFIERS = {
    horde: { id:'horde', name:'ОРДА', icon:'👥', color:'#ff5c7a',
        desc:'×3 врагов, но ×0.5 HP', enemyMult:3, hpMult:0.5 },
    elite: { id:'elite', name:'ЭЛИТА', icon:'👑', color:'#9c6bff',
        desc:'Все враги с +1 HP', hpBonus:1, goldBonus:0.5 },
    fast: { id:'fast', name:'УСКОРЕНИЕ', icon:'💨', color:'#ffd93d',
        desc:'Враги +50% скорости', speedMult:1.5 },
    darkness: { id:'darkness', name:'ТЬМА', icon:'🌑', color:'#000',
        desc:'Видно только радиус вокруг', darkness:true },
    gold_rush: { id:'gold_rush', name:'ЗОЛОТАЯ ЛИХОРАДКА', icon:'💰', color:'#ffe082',
        desc:'×5 монет, ×2 врагов', enemyMult:2, goldMult:5 },
    no_hit: { id:'no_hit', name:'ИДЕАЛЬНО', icon:'✨', color:'#7cffb2',
        desc:'Бонус 500 золота без урона', noHitChallenge:true, reward:500 },
    boss_rush: { id:'boss_rush', name:'БОСС-РАШ', icon:'🐉', color:'#ff1744',
        desc:'Мини-босс появляется сразу', spawnMiniboss:true }
};

// ===== ХРАНИЛИЩЕ =====
var storage = (function() {
    var mem = {};
    var canUseLS = false;
    try {
        localStorage.setItem('__test__', '1');
        localStorage.removeItem('__test__');
        canUseLS = true;
        console.log('✓ localStorage доступен');
    } catch (e) {
        canUseLS = false;
        console.warn('⚠ localStorage заблокирован');
    }
    return {
        get: function(k) {
            if (canUseLS) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } }
            return mem[k] || null;
        },
        set: function(k, v) {
            if (canUseLS) { try { localStorage.setItem(k, v); return; } catch (e) { mem[k] = v; } }
            else { mem[k] = v; }
        },
        remove: function(k) {
            if (canUseLS) { try { localStorage.removeItem(k); return; } catch (e) { delete mem[k]; } }
            else { delete mem[k]; }
        }
    };
})();

var PROFILES_KEY = 'sfd_profiles_v1';
var CURRENT_KEY = 'sfd_current_v1';
var PROFILE_PREFIX = 'sfd_profile_v1_';

function simpleHash(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return 'h' + Math.abs(hash).toString(36);
}

function getProfiles() {
    try {
        var raw = storage.get(PROFILES_KEY);
        if (raw) return JSON.parse(raw);
        return [];
    } catch (e) { return []; }
}

function saveProfiles(list) { storage.set(PROFILES_KEY, JSON.stringify(list)); }
function getCurrentLogin() { return storage.get(CURRENT_KEY); }
function setCurrentLogin(login) { storage.set(CURRENT_KEY, login); }

function loadProfile(login) {
    try {
        var raw = storage.get(PROFILE_PREFIX + login);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) { return null; }
}

function saveProfile(login, profileData) { storage.set(PROFILE_PREFIX + login, JSON.stringify(profileData)); }
function deleteProfileData(login) { storage.remove(PROFILE_PREFIX + login); }

function makeDefaultSave() {
    return {
        bestCoins: 0, bank: 0, gamesPlayed: 0, bestLevel: 1,
        bestTime: 0, totalTime: 0,
        ownedSkins: ['default'], equippedSkin: 'default',
        ownedItems: [],
        ownedThemes: ['cosmos'], equippedTheme: 'cosmos',
        boosts: { x2gold:0, shieldRun:0, startCoins:0, magnetRun:0, comboRun:0 },
        startLives: 4, magnetRadius: 0, playerSpeedBonus: 1, gameSpeed: 1, comboBonus: false,
        ownedSoundPacks: ['classic'], equippedSoundPack: 'classic',
        ownedMusic: ['default'], equippedMusic: 'default',
        ownedCards: [],
        openedCases: 0, totalRefund: 0, totalCoins: 0,
        freeCases: { common:0, rare:0, epic:0, legendary:0, mythic:0 },
        claimedAchievements: [],
        dailyStreak: 0, lastDailyClaim: null, dailyHistory: [],
        showLevelToast: true, showWeather: true,
        modeBests: {
            rogue: { coins: 0, time: 0 },
            classic: { coins: 0, time: 0 },
            survival: { coins: 0, time: 0 },
            timeattack: { coins: 0, time: 0 },
            hardcore: { coins: 0, time: 0 }
        },
        modesPlayed: [],
        bossesKilled: 0, totalKills: 0,
        coreCrystals: 0,
        coreStats: { vitality:0, speed:0, magnet:0, greed:0, combo:0, luck:0 },
        starShards: 0,
        unlockedUpgrades: [], unlockedRelics: [], unlockedClasses: ['scout'],
        rogueStats: {
            totalUpgradesPicked: 0, maxUpgradesInRun: 0,
            synergiesActivated: 0, maxRelicsInRun: 0,
            bestLevel: 0, runsPlayed: 0
        },
        rogueProgress: { planetIndex: 0, stageIndex: 0, bossUnlocked: false },
        lastMode: 'rogue',
        lastDailyCrystals: null
    };
}

function migrateSave(d) {
    var changed = false;
    var defaults = makeDefaultSave();

    Object.keys(defaults).forEach(function(key) {
        if (typeof d[key] === 'undefined') {
            d[key] = defaults[key];
            changed = true;
        }
    });

    if (!d.coreStats) {
        d.coreStats = { vitality:0, speed:0, magnet:0, greed:0, combo:0, luck:0 };
        changed = true;
    }
    Object.keys(CORE_STATS).forEach(function(k) {
        if (typeof d.coreStats[k] !== 'number') {
            d.coreStats[k] = 0;
            changed = true;
        }
    });

    if (typeof d.coreCrystals !== 'number') { d.coreCrystals = 0; changed = true; }
    if (typeof d.starShards !== 'number') { d.starShards = 0; changed = true; }

    if (!d.modeBests) { d.modeBests = {}; changed = true; }
    Object.keys(MODES).forEach(function(m) {
        if (!d.modeBests[m]) {
            d.modeBests[m] = { coins: 0, time: 0 };
            changed = true;
        }
    });

    if (!d.modesPlayed) { d.modesPlayed = []; changed = true; }
    if (!d.boosts) { d.boosts = { x2gold:0, shieldRun:0, startCoins:0, magnetRun:0, comboRun:0 }; changed = true; }
    if (!d.freeCases) { d.freeCases = { common:0, rare:0, epic:0, legendary:0, mythic:0 }; changed = true; }

    if (!d.rogueStats) {
        d.rogueStats = {
            totalUpgradesPicked: 0, maxUpgradesInRun: 0,
            synergiesActivated: 0, maxRelicsInRun: 0,
            bestLevel: 0, runsPlayed: 0
        };
        changed = true;
    }
    if (!d.unlockedUpgrades) { d.unlockedUpgrades = []; changed = true; }
    if (!d.unlockedRelics) { d.unlockedRelics = []; changed = true; }
    if (!d.unlockedClasses) { d.unlockedClasses = ['scout']; changed = true; }

    Object.keys(CHARACTER_CLASSES).forEach(function(cid) {
        var cls = CHARACTER_CLASSES[cid];
        if (cls.unlocked && d.unlockedClasses.indexOf(cid) === -1) {
            d.unlockedClasses.push(cid);
            changed = true;
        }
    });

    if (changed) console.log('✓ Сейв мигрирован на 2.6');
    return d;
}

function getSave() {
    if (currentProfile && currentProfile.data) {
        currentProfile.data = migrateSave(currentProfile.data);
        return currentProfile.data;
    }
    return makeDefaultSave();
}

function persist() {
    if (!currentProfile) return;
    try { saveProfile(currentProfile.login, currentProfile); }
    catch (e) { console.warn('persist error:', e); }
}

function getTodayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
}

function getYesterdayStr() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
}

function formatTime(seconds) {
    seconds = Math.floor(seconds);
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
}

function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n;
}

function getCoreStatPrice(statId) {
    var stat = CORE_STATS[statId];
    var s = getSave();
    var lvl = s.coreStats[statId] || 0;
    // 🔧 ФИКС: для vitality цена растёт быстрее
    var multiplier = (statId === 'vitality') ? 2.5 : 1.5;
    return Math.floor(stat.basePrice * Math.pow(multiplier, lvl));
}

function getCoreStatCrystalPrice(statId) {
    var s = getSave();
    var lvl = s.coreStats[statId] || 0;
    // 🔧 ФИКС: для vitality кристаллы дороже
    var multiplier = (statId === 'vitality') ? 3 : 1.5;
    var base = (statId === 'vitality') ? 5 : 1;
    return Math.max(base, Math.floor(base * Math.pow(multiplier, lvl)));
}

function getCoreStatLevel(statId) {
    var s = getSave();
    return s.coreStats[statId] || 0;
}

function getCoreBonus(statId) {
    var stat = CORE_STATS[statId];
    var lvl = getCoreStatLevel(statId);
    return stat.effect(lvl);
}

function getCoreTotalLevel() {
    var s = getSave();
    var total = 0;
    Object.keys(CORE_STATS).forEach(function(id) {
        total += s.coreStats[id] || 0;
    });
    return total;
}

function getCoreMaxLevel() {
    var s = getSave();
    var maxLvl = 0;
    Object.keys(CORE_STATS).forEach(function(id) {
        var lvl = s.coreStats[id] || 0;
        if (lvl > maxLvl) maxLvl = lvl;
    });
    return maxLvl;
}

function isClassUnlocked(classId) {
    var s = getSave();
    if (!s.unlockedClasses) s.unlockedClasses = ['scout'];
    var cls = CHARACTER_CLASSES[classId];
    if (!cls) return false;
    if (cls.unlocked) return true;
    if (s.unlockedClasses.indexOf(classId) !== -1) return true;
    if (cls.unlockAchievement) {
        var ach = ACHIEVEMENTS[cls.unlockAchievement];
        if (ach) {
            var progress = getAchievementProgress(ach);
            if (progress >= ach.target) {
                if (s.unlockedClasses.indexOf(classId) === -1) {
                    s.unlockedClasses.push(classId);
                    persist();
                }
                return true;
            }
        }
    }
    return false;
}

function getClass(id) {
    return CHARACTER_CLASSES[id] || CHARACTER_CLASSES.scout;
}

function getUpgradeStacks(upgradeId) {
    if (!runUpgrades) return 0;
    return runUpgrades[upgradeId] || 0;
}

function canPickUpgrade(upgradeId) {
    var up = UPGRADE_POOL[upgradeId];
    if (!up) return false;
    if (!up.stacks) return getUpgradeStacks(upgradeId) === 0;
    var maxStacks = up.maxStacks || 99;
    return getUpgradeStacks(upgradeId) < maxStacks;
}

function pickRandomUpgrades(count, exclude) {
    exclude = exclude || [];
    var available = [];
    Object.keys(UPGRADE_POOL).forEach(function(id) {
        if (exclude.indexOf(id) !== -1) return;
        if (!canPickUpgrade(id)) return;
        available.push(id);
    });
    var rarityWeights = { common: 60, rare: 25, epic: 12, legendary: 2.5, mythic: 0.5 };
    var weighted = [];
    available.forEach(function(id) {
        var w = rarityWeights[UPGRADE_POOL[id].rarity] || 10;
        for (var i = 0; i < Math.ceil(w); i++) weighted.push(id);
    });
    var picks = [];
    var used = [];
    for (var c = 0; c < count && weighted.length > 0; c++) {
        var attempts = 0;
        var pick = null;
        while (attempts < 20) {
            var idx = Math.floor(Math.random() * weighted.length);
            pick = weighted[idx];
            if (used.indexOf(pick) === -1) break;
            attempts++;
        }
        if (pick && used.indexOf(pick) === -1) {
            picks.push(pick);
            used.push(pick);
        }
    }
    return picks;
}

function pickRandomRelics(count, exclude) {
    exclude = exclude || [];
    var available = [];
    Object.keys(RELICS).forEach(function(id) {
        if (exclude.indexOf(id) !== -1) return;
        if (runRelics && runRelics.indexOf(id) !== -1) return;
        available.push(id);
    });
    var picks = [];
    for (var c = 0; c < count && available.length > 0; c++) {
        var idx = Math.floor(Math.random() * available.length);
        picks.push(available[idx]);
        available.splice(idx, 1);
    }
    return picks;
}

// ==========================================================
//   ЗАГЛУШКИ ПЕРЕМЕННЫХ — С ВСЕМИ ФИКСАМИ
// ==========================================================
var running = false, paused = false, gameOver = false;
var score = 0, goldEarned = 0, crystalsEarned = 0, lives = 4;
var frame = 0, level = 1;
var levelTimer = 15 * 60, LEVEL_DURATION = 15 * 60;
var runTime = 0, runStartTime = 0;
var timeLeft = 0;
var combo = 0, comboTimer = 0, comboMax = 0, COMBO_WINDOW = 120;
var screenShake = 0, damageFlash = 0;
var buff = { magnet:0, freeze:0, speedBoost:0, x2gold:0, phantom:0, chest:0 };
var runBoosts = { x2gold:false, shield:false, magnetRun:false, comboRun:false };
var levelStats = { coinsThisLevel: 0, livesLostThisLevel: 0, levelStartTime: 0 };
var coins = [], enemies = [], enemyBullets = [], webs = [];
var particles = [], floatingTexts = [], drops = [], bosses = [];
var meteors = [], parallaxStars = [];
var weatherParticles = [], weatherType = 'stars';
var gradCache = { coinSmall:null, coinBig:null };
var newTimeRecord = false;
var lastErrorShown = '';

// 🎲 ROGUELIKE
var runUpgrades = {};
var runRelics = [];
var runSynergies = {};           // 🔧 ФИКС: объявлено явно
var playerDamage = 0;
var playerShields = 0;
var maxShields = 0;
var shieldRegenTimer = 0;
var critChance = 0;
var dodgeChance = 0;
var thornsDamage = 0;
var regenTimer = 0;
var vampiresHeal = 0;
var orbitals = [];
var currentWaveModifier = null;
var currentWaveLevel = 0;
var noHitWaveActive = false;
var noHitWaveDamage = 0;
var extraUpgradeChoice = false;
var comboGraceTimer = 0;
var revivesLeft = 0;
var chaosOrbTimer = 0;
var berserkerMask = false;
var explosiveCoins = false;
var pierceCount = 0;
var chainLightning = 0;
var enemySlowMult = 1;
var hpPenalty = 0;

var pendingUpgradeChoices = [];
var pendingRelicChoices = [];
var pendingUpgradeAfterWave = false;  // 🔧 ФИКС: флаг для элитной волны
var rerollCost = 50;
var isChoosingUpgrade = false;
var _finishRunCalled = false;  // 🔧 ФИКС: защита от двойного вызова finishRun

var coreBonusCache = {
    vitality: 0, speed: 1, magnet: 0, greed: 1, combo: 0, luck: 0
};

(function initParallaxStars() {
    for (var layer = 0; layer < 3; layer++) {
        var count = 15 - layer * 3;
        for (var i = 0; i < count; i++) {
            parallaxStars.push({
                x: Math.random() * 600, y: Math.random() * 400,
                size: 0.6 + layer * 0.5,
                speed: 0.08 + layer * 0.15,
                layer: layer, twinkle: Math.random() * Math.PI * 2
            });
        }
    }
})();

console.log('✓ Часть 2/4 загружена');
