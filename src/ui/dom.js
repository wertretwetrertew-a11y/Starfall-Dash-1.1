// STARFALL DASH — DOM REFERENCES
// Extracted from js/core-data.js without renaming any globals.
// Must load before runtime modules.

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
