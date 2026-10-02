// ==========================================================
//   STARFALL DASH — GLOBAL GAME STATE
//   Runtime state kept global for legacy script compatibility.
//   This file intentionally contains declarations only.
// ==========================================================

// ==========================================================
//   PHONE-NATIVE GAME VIEWPORT
//   The game logic uses one stable portrait coordinate space.
//   CSS scales this 9:16 world uniformly to the real device.
// ==========================================================
var GAME_WIDTH = 360;
var GAME_HEIGHT = 780;

if (typeof canvas !== 'undefined' && canvas) {
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
}

var currentShopTab = 'skins';
var currentProfile = null;
var pendingProfile = null;
var currentMode = 'classic';
var selectedClass = 'scout';

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
                x: Math.random() * GAME_WIDTH, y: Math.random() * GAME_HEIGHT,
                size: 0.6 + layer * 0.5,
                speed: 0.08 + layer * 0.15,
                layer: layer, twinkle: Math.random() * Math.PI * 2
            });
        }
    }
})();

console.log('✓ Часть 2/4 загружена');


// Runtime state moved from gameplay.js during modular migration.
// ===== BOSS DUEL STATE =====
// Declared explicitly so the Roguelike layer and gameplay always share one global state.
var bossState = 'none';
var bossStateTimer = 0;
var bossAnnouncement = '';
var bossAnnouncementTimer = 0;
var bossDuelId = null;

// Roguelike enemy telegraphs / area attacks. Kept separate from planet hazards.
var rogueEnemyHazards = [];
// Roguelike Stage 1: fragments of the Cosmic Core fall from some defeated enemies.
var rogueCoreFragments = [];
var rogueCoreFragmentMisses = 0;

// ===== ИГРОК =====
var player = {
    x: GAME_WIDTH / 2 - 15, y: GAME_HEIGHT * 0.57, size: 30, speed: 7, frozen: 0, inWeb: false,
    breath: 0, tilt: 0, lastDirX: 0, lastDirY: 1,
    damageFlash: 0, blinkTimer: 0, isBlinking: false
};

// ==========================================================
//   КРИТИЧНЫЙ ФИКС: СБРОС НАКОПЛЕННОГО ВРЕМЕНИ
//   Предотвращает "ускорение" и "фарм монет" после модалок
// ==========================================================
var lastTime = performance.now();
var frameBudget = 1000 / 60;
var accumulated = 0;

function resetFrameClock() {
    accumulated = 0;
    lastTime = performance.now();
}

