// ==========================================================
// STARFALL DASH — UI MODULE
// Extracted from legacy meta-ui.js; global API intentionally preserved.
// ==========================================================

//   ЕЖЕДНЕВНЫЙ БОНУС
// ==========================================================
function openDailyModal() {
    var s = getSave();
    renderDailyGrid();
    dailyModal.classList.add('open');
    var canClaim = s.lastDailyClaim !== getTodayStr();
    dailyClaimBtn.disabled = !canClaim;
    dailyClaimBtn.textContent = canClaim ? 'Забрать' : 'Уже получено сегодня';
}

function renderDailyGrid() {
    var s = getSave();
    dailyGrid.innerHTML = '';
    var today = getTodayStr();
    var canClaim = s.lastDailyClaim !== today;
    var currentDay = canClaim ? (s.dailyStreak || 0) + 1 : (s.dailyStreak || 0);
    if (currentDay > 7) currentDay = 1;

    DAILY_REWARDS.forEach(function(r) {
        var div = document.createElement('div');
        div.className = 'daily-day';
        var claimed = r.day < currentDay || (r.day === currentDay && !canClaim);
        var isToday = r.day === currentDay && canClaim;
        if (claimed) div.classList.add('claimed');
        if (isToday) div.classList.add('today');
        div.innerHTML = '<div class="day-num">День ' + r.day + '</div>' +
            '<div class="day-reward">' + r.icon + '</div>' +
            '<div class="day-label">' + r.label + '</div>';
        dailyGrid.appendChild(div);
    });
}

function claimDaily() {
    var s = getSave();
    var today = getTodayStr();
    if (s.lastDailyClaim === today) return;
    var yesterday = getYesterdayStr();
    if (s.lastDailyClaim === yesterday) {
        s.dailyStreak = Math.min((s.dailyStreak || 0) + 1, 7);
    } else {
        s.dailyStreak = 1;
    }
    if (s.dailyStreak > 7) s.dailyStreak = 1;
    s.lastDailyClaim = today;
    if (!s.dailyHistory) s.dailyHistory = [];
    s.dailyHistory.push(today);
    if (s.dailyHistory.length > 30) s.dailyHistory.shift();
    var reward = DAILY_REWARDS[s.dailyStreak - 1];
    if (reward.type === 'gold') {
        s.bank += reward.amount;
        showToast('🎁 День ' + s.dailyStreak + ': +' + reward.amount + ' золота!', 'legendary');
    } else if (reward.type === 'case') {
        s.freeCases[reward.caseId] = (s.freeCases[reward.caseId] || 0) + 1;
        showToast('🎁 День ' + s.dailyStreak + ': ' + CASES[reward.caseId].name + '!', 'legendary');
    }

    if (s.lastDailyCrystals !== today) {
        s.lastDailyCrystals = today;
        s.coreCrystals = (s.coreCrystals || 0) + 3;
        s.starShards = (s.starShards || 0) + 10;
        setTimeout(function() {
            showToast('💎 +3 кристалла, ✨ +10 осколков!', 'epic');
        }, 1000);
    }

    persist();
    updateMainMenuStats();
    updateDailyTile();
    renderDailyGrid();
    dailyClaimBtn.disabled = true;
    dailyClaimBtn.textContent = 'Уже получено';
}

dailyClaimBtn.addEventListener('click', claimDaily);
dailyModal.addEventListener('click', function(e) {
    if (e.target === dailyModal) dailyModal.classList.remove('open');
});

// ==========================================================