// ==========================================================
// STARFALL DASH — UI MODULE
// Extracted from legacy meta-ui.js; global API intentionally preserved.
// ==========================================================

//   УПРАВЛЕНИЕ
// ==========================================================
var keys = {};
document.addEventListener('keydown', function(e) {
    keys[e.key] = true;
    if (e.key === 'r' || e.key === 'R') {
        if (typeof reset === 'function' && !paused && !isChoosingUpgrade) reset();
    }
    if (e.key === 'Escape' || e.key === 'Esc') {
        if (isChoosingUpgrade) return;
        if (running && !gameOver) togglePause();
    }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key) !== -1) e.preventDefault();
});
document.addEventListener('keyup', function(e) { keys[e.key] = false; });

var joyZone = document.getElementById('joystick-zone');
var joyKnob = document.getElementById('joystick-knob');
var gameWrap = document.getElementById('game-wrap');
var joyActive = false, joyStartX = 0, joyStartY = 0, joyPointerId = null;
var joyVector = { x: 0, y: 0 };
var JOY_MAX = 50;

function positionFloatingJoystick(x, y) {
    if (!joyZone) return;
    var size = joyZone.getBoundingClientRect().width || 150;
    joyZone.style.left = (x - size / 2) + 'px';
    joyZone.style.top = (y - size / 2) + 'px';
    joyZone.style.right = 'auto';
    joyZone.style.bottom = 'auto';
}

function joyStart(e) {
    if (!e) return;
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen' && window.matchMedia && !window.matchMedia('(pointer: coarse)').matches) return;

    var target = e.target;
    if (target && target.closest && target.closest('#action-buttons, #btn-pause, #hud, #joystick-zone, button, input, select, textarea, a')) return;
    if (e.cancelable) e.preventDefault();

    joyPointerId = e.pointerId;
    joyStartX = e.clientX;
    joyStartY = e.clientY;
    joyActive = true;

    positionFloatingJoystick(joyStartX, joyStartY);
    if (joyZone) joyZone.classList.add('active');

    if (gameWrap && gameWrap.setPointerCapture && e.pointerId != null) {
        try { gameWrap.setPointerCapture(e.pointerId); } catch (_) {}
    }
    joyMove(e);
}

function joyMove(e) {
    if (!joyActive || (joyPointerId != null && e.pointerId !== joyPointerId)) return;
    if (e.cancelable) e.preventDefault();

    var dx = e.clientX - joyStartX;
    var dy = e.clientY - joyStartY;
    var dist = Math.hypot(dx, dy);
    if (dist > JOY_MAX) {
        dx = dx / dist * JOY_MAX;
        dy = dy / dist * JOY_MAX;
    }
    joyKnob.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    joyVector.x = dx / JOY_MAX;
    joyVector.y = dy / JOY_MAX;
}

function joyEnd(e) {
    if (e && joyPointerId != null && e.pointerId != null && e.pointerId !== joyPointerId) return;
    if (e && e.cancelable) e.preventDefault();

    joyActive = false;
    joyPointerId = null;
    if (joyKnob) joyKnob.style.transform = 'translate(0,0)';
    if (joyZone) joyZone.classList.remove('active');
    joyVector.x = 0;
    joyVector.y = 0;
}

/* Floating joystick: the player can touch anywhere on the game field. */
if (gameWrap) {
    gameWrap.addEventListener('pointerdown', joyStart, { passive: false });
    gameWrap.addEventListener('pointermove', joyMove, { passive: false });
    gameWrap.addEventListener('pointerup', joyEnd, { passive: false });
    gameWrap.addEventListener('pointercancel', joyEnd, { passive: false });
    gameWrap.addEventListener('lostpointercapture', joyEnd);
}
var btnRestart = document.getElementById('btn-restart');
if (btnRestart) {
    btnRestart.addEventListener('click', function() {
        if (isChoosingUpgrade) return;
        if (currentMode === 'rogue' && typeof startRoguelikeRun === 'function') startRoguelikeRun();
        else if (typeof reset === 'function') reset();
    });
    btnRestart.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (isChoosingUpgrade) return;
        if (currentMode === 'rogue' && typeof startRoguelikeRun === 'function') startRoguelikeRun();
        else if (typeof reset === 'function') reset();
    });
}

// 🔧 ФИКС: оборачиваем в функцию, чтобы togglePause был уже определён
if (typeof btnPause !== 'undefined' && btnPause) {
    btnPause.addEventListener('click', function() { togglePause(); });
}
if (typeof pauseResume !== 'undefined' && pauseResume) {
    pauseResume.addEventListener('click', function() { togglePause(); });
}
pauseMenu.addEventListener('click', function() {
    if (isChoosingUpgrade) return;
    paused = false;
    running = false;
    gameOver = false;
    pauseModal.classList.remove('open');
    document.body.classList.remove('playing');
    if (typeof finishRunSilent === 'function') finishRunSilent();
    stopMusic();
    if (typeof clearBossDuelPresentation === 'function') clearBossDuelPresentation();
    startScreen.classList.remove('hidden');
    updateMainMenuStats();
});

// 🔧 ФИКС: обработчики gameover-кнопок перенесены с защитой
function closeRogueMapAfterRun() {
    var map = document.getElementById('rogue-planet-map');
    if (map) map.classList.remove('open');

    // One centralized invalidation point for every delayed Roguelike callback.
    // Incrementing the token makes every callback from the old run stale.
    if (typeof roguePlanetState !== 'undefined') {
        roguePlanetState.transitionToken = (roguePlanetState.transitionToken || 0) + 1;
        roguePlanetState.mapOpen = false;
        roguePlanetState.stageStarted = false;
        roguePlanetState.bossActive = false;
        roguePlanetState.bossHandled = false;
        roguePlanetState.awaitingMap = false;
        roguePlanetState.active = false;
    }

    var stageComplete = document.getElementById('rogue-stage-complete');
    if (stageComplete) stageComplete.style.display = 'none';

    var stageObjective = document.getElementById('rogue-stage-objective');
    if (stageObjective) stageObjective.remove();
}

function resetRoguelikeTransitionState() {
    if (typeof roguePlanetState === 'undefined') return;
    roguePlanetState.transitionToken = (roguePlanetState.transitionToken || 0) + 1;
    roguePlanetState.mapOpen = false;
    roguePlanetState.awaitingMap = false;
    roguePlanetState.bossActive = false;
    roguePlanetState.bossHandled = false;
    roguePlanetState.stageStarted = false;
}

function returnToMainMenu() {
    gameoverModal.classList.remove('open');
    resetRoguelikeTransitionState();
    closeRogueMapAfterRun();
    document.body.classList.remove('playing');
    running = false;
    gameOver = false;
    paused = false;
    isChoosingUpgrade = false;
    _finishRunCalled = false;
    if (typeof clearBossDuelPresentation === 'function') clearBossDuelPresentation();
    stopMusic();
    resetFrameClock();
    if (typeof showStarfallMainMenu === 'function') {
        showStarfallMainMenu();
    } else {
        startScreen.classList.remove('hidden');
        modeScreen.classList.add('hidden');
        classScreen.classList.add('hidden');
        coreScreen.classList.add('hidden');
        try { updateMainMenuStats(); } catch (e) { console.error('Menu refresh error:', e); }
    }
}

if (goRestart) {
    goRestart.addEventListener('click', function() {
        gameoverModal.classList.remove('open');
        resetRoguelikeTransitionState();
        closeRogueMapAfterRun();
        document.body.classList.add('playing');
        gameOver = false;
        paused = false;
        running = false;
        isChoosingUpgrade = false;
        _finishRunCalled = false;
        setTimeout(function() {
            if (currentMode === 'rogue' && typeof startRoguelikeRun === 'function') {
                startRoguelikeRun();
            } else {
                reset();
            }
        }, 0);
    });
}

if (goMenu) {
    goMenu.addEventListener('click', function() {
        returnToMainMenu();
    });
}

if (goShare) {
    goShare.addEventListener('click', function() {
        try {
            shareResult();
        } catch (e) {
            console.error('Share error:', e);
            showToast('Ошибка при отправке', 'error');
        }
    });
}

function shareResult() {
    var mode = MODES[currentMode] || MODES.classic;
    var text = '✦ Starfall Dash 2.6 «Roguelike» ✦\n' +
        'Режим: ' + mode.icon + ' ' + mode.name + '\n' +
        'Монет: ' + (score || 0) + '\n' +
        'Уровень: ' + (level || 1) + '\n' +
        'Время: ' + formatTime(runTime || 0) + '\n' +
        'Золота: ' + (goldEarned || 0) + '\n' +
        '💎 Кристаллов: ' + (crystalsEarned || 0);

    if (currentMode === 'rogue' && runUpgrades) {
        var upgradeNames = Object.keys(runUpgrades).map(function(id) {
            return UPGRADE_POOL[id] ? UPGRADE_POOL[id].name + '×' + runUpgrades[id] : id;
        }).join(', ');
        if (upgradeNames) text += '\n🎲 Апгрейды: ' + upgradeNames;
    }

    // 🔧 ФИКС: сначала пробуем clipboard (надёжнее на ПК), потом share
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            showToast('📋 Результат скопирован!', 'success');
        }).catch(function() {
            // fallback на navigator.share
            if (navigator.share) {
                navigator.share({ title: 'Starfall Dash 2.6', text: text }).catch(function(e) {});
            } else {
                showToast('Не удалось скопировать', 'error');
            }
        });
    } else if (navigator.share) {
        navigator.share({ title: 'Starfall Dash 2.6', text: text }).catch(function(e) {});
    } else {
        showToast('Share не поддерживается', 'info');
    }
}

console.log('✓ Часть 3/4 загружена');
