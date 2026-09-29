// ==========================================================
// STARFALL DASH — UI MODULE
// Extracted from legacy meta-ui.js; global API intentionally preserved.
// ==========================================================

// ===== ЭКРАН ВХОДА =====
function renderProfilesList() {
    profilesList.innerHTML = '';
    var profiles = getProfiles();

    profiles.forEach(function(p) {
        var card = document.createElement('div');
        card.className = 'profile-card';
        var data = loadProfile(p.login);
        var d = (data && data.data) ? migrateSave(data.data) : makeDefaultSave();

        var avatar = document.createElement('div');
        avatar.className = 'pc-avatar';
        avatar.textContent = '🎮';
        card.appendChild(avatar);

        var info = document.createElement('div');
        info.className = 'pc-info';
        var nick = document.createElement('div');
        nick.className = 'pc-nick';
        nick.textContent = p.nick;
        info.appendChild(nick);
        var stats = document.createElement('div');
        stats.className = 'pc-stats';
        var crystals = d.coreCrystals || 0;
        var shards = d.starShards || 0;
        stats.innerHTML = '<span>🏆 ' + d.bestCoins + '</span><span>💰 ' + d.bank + '</span><span>💎 ' + crystals + '</span><span>✨ ' + shards + '</span>';
        info.appendChild(stats);
        card.appendChild(info);

        if (p.passHash) {
            var lock = document.createElement('div');
            lock.className = 'pc-lock';
            lock.textContent = '🔒';
            card.appendChild(lock);
        }

        var del = document.createElement('div');
        del.className = 'pc-delete';
        del.textContent = '✕';
        del.title = 'Удалить профиль';
        del.addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm('Удалить профиль «' + p.nick + '»? Прогресс будет потерян!')) {
                var list = getProfiles().filter(function(x) { return x.login !== p.login; });
                saveProfiles(list);
                deleteProfileData(p.login);
                if (getCurrentLogin() === p.login) storage.remove(CURRENT_KEY);
                renderProfilesList();
                showToast('Профиль удалён', 'info');
            }
        });
        card.appendChild(del);

        card.addEventListener('click', function() {
            if (p.passHash) {
                pendingProfile = p;
                pwNick.textContent = p.nick;
                pwInput.value = '';
                pwError.textContent = '';
                passwordModal.classList.add('open');
                setTimeout(function() { pwInput.focus(); }, 100);
            } else {
                enterProfile(p.login);
            }
        });

        profilesList.appendChild(card);
    });

    var newCard = document.createElement('div');
    newCard.className = 'profile-card new-profile';
    newCard.innerHTML = '<div class="pc-avatar">➕</div>' +
        '<div class="pc-info"><div class="pc-nick" style="color:#4fc3f7;">Новый игрок</div>' +
        '<div class="pc-stats"><span>Создать профиль</span></div></div>';
    newCard.addEventListener('click', openCreateProfile);
    profilesList.appendChild(newCard);
}

function openCreateProfile() {
    cpNick.value = '';
    cpPassword.value = '';
    cpError.textContent = '';
    cpPasswordToggle.classList.remove('active');
    cpCheckbox.textContent = '';
    cpPasswordField.classList.add('hidden');
    cpCreate.disabled = true;
    createProfileModal.classList.add('open');
    setTimeout(function() { cpNick.focus(); }, 100);
}

cpNick.addEventListener('input', validateCreateForm);
cpPassword.addEventListener('input', validateCreateForm);

cpPasswordToggle.addEventListener('click', function() {
    var active = cpPasswordToggle.classList.toggle('active');
    cpCheckbox.textContent = active ? '✓' : '';
    if (active) {
        cpPasswordField.classList.remove('hidden');
        setTimeout(function() { cpPassword.focus(); }, 100);
    } else {
        cpPasswordField.classList.add('hidden');
        cpPassword.value = '';
    }
    validateCreateForm();
});

function validateCreateForm() {
    var nick = cpNick.value.trim();
    var usePassword = cpPasswordToggle.classList.contains('active');
    var pass = cpPassword.value;
    var ok = nick.length >= 2 && nick.length <= 16;
    if (usePassword) ok = ok && pass.length >= 3;
    var exists = getProfiles().some(function(p) {
        return p.nick.toLowerCase() === nick.toLowerCase();
    });
    if (exists) ok = false;
    cpCreate.disabled = !ok;
    if (exists && nick.length >= 2) cpError.textContent = 'Это имя уже занято';
    else if (usePassword && pass.length > 0 && pass.length < 3) cpError.textContent = 'Пароль минимум 3 символа';
    else if (nick.length > 0 && nick.length < 2) cpError.textContent = 'Имя минимум 2 символа';
    else cpError.textContent = '';
}

cpCreate.addEventListener('click', function() {
    var nick = cpNick.value.trim();
    var usePassword = cpPasswordToggle.classList.contains('active');
    var pass = cpPassword.value;
    if (!nick) return;
    var login = 'u_' + Date.now();
    var passHash = usePassword ? simpleHash(pass) : null;
    var profileData = { login: login, nick: nick, passHash: passHash, data: makeDefaultSave() };
    var list = getProfiles();
    list.push({ login: login, nick: nick, passHash: passHash });
    saveProfiles(list);
    saveProfile(login, profileData);
    createProfileModal.classList.remove('open');
    showToast('👤 Профиль создан!', 'success');
    enterProfile(login);
});

cpCancel.addEventListener('click', function() {
    createProfileModal.classList.remove('open');
});

pwLogin.addEventListener('click', function() {
    if (!pendingProfile) return;
    var pass = pwInput.value;
    var hash = simpleHash(pass);
    if (hash === pendingProfile.passHash) {
        passwordModal.classList.remove('open');
        enterProfile(pendingProfile.login);
        pendingProfile = null;
    } else {
        pwError.textContent = 'Неверный пароль';
        pwInput.value = '';
        pwInput.focus();
    }
});

pwInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') pwLogin.click();
});

pwCancel.addEventListener('click', function() {
    passwordModal.classList.remove('open');
    pendingProfile = null;
});
