// ==========================================================
// STARFALL DASH — UI MODULE
// Extracted from legacy meta-ui.js; global API intentionally preserved.
// ==========================================================

// ===== ЭКРАН ВЫБОРА КЛАССА =====
classBack.addEventListener('click', function() {
    classScreen.classList.add('hidden');
    modeScreen.classList.remove('hidden');
});

function renderClassScreen() {
    classGrid.innerHTML = '';
    Object.keys(CHARACTER_CLASSES).forEach(function(cid) {
        var cls = CHARACTER_CLASSES[cid];
        var unlocked = isClassUnlocked(cid);
        var card = document.createElement('button');
        card.className = 'class-card ' + cid;
        if (!unlocked) card.classList.add('locked');

        var header = document.createElement('div');
        header.className = 'class-card-header';
        header.innerHTML = '<div class="class-icon">' + cls.icon + '</div>' +
            '<div><div class="class-name">' + cls.name + '</div>' +
            '<div class="class-sub">' + (unlocked ? 'Разблокирован' : 'Заблокирован') + '</div></div>';
        card.appendChild(header);

        var desc = document.createElement('div');
        desc.className = 'class-desc';
        desc.textContent = cls.desc;
        card.appendChild(desc);

        var stats = document.createElement('div');
        stats.className = 'class-stats';
        stats.innerHTML = 
            '<span class="class-stat">❤ ' + cls.startHp + ' HP</span>' +
            '<span class="class-stat">⚡ ' + Math.round(cls.speed * 100) + '%</span>' +
            '<span class="class-stat">🧲 ' + cls.magnet + '</span>';
        card.appendChild(stats);

        var passive = document.createElement('div');
        passive.className = 'class-passive';
        passive.textContent = '✨ ' + cls.passive;
        card.appendChild(passive);

        if (!unlocked) {
            var lock = document.createElement('div');
            lock.className = 'class-lock-hint';
            lock.textContent = '🔒 ' + (cls.unlockText || '');
            card.appendChild(lock);
        }

        card.addEventListener('click', function() {
            if (!unlocked) {
                showToast('Заблокировано: ' + (cls.unlockText || ''), 'error');
                return;
            }
            selectedClass = cid;
            startRoguelikeRun();
        });

        classGrid.appendChild(card);
    });
}

function startRoguelikeRun() {
    classScreen.classList.add('hidden');
    document.body.classList.add('playing');
    gameOver = false;
    paused = false;
    running = false;
    reset();
}
