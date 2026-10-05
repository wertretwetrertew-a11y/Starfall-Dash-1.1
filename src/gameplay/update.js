// ==========================================================
// STARFALL DASH — GAMEPLAY MODULE
// Extracted from legacy gameplay.js; global API intentionally preserved.
// ==========================================================

var meteorSprite = new Image();
meteorSprite.decoding = 'async';
meteorSprite.src = 'assets/meteor-sprite.svg?v=20261002-meteor-2';

var gameBackgroundSprite = new Image();
gameBackgroundSprite.decoding = 'async';
gameBackgroundSprite.src = 'assets/game-background.svg?v=20261002-bg-1';

//   UPDATE — КРИТИЧНЫЕ ФИКСЫ
// ==========================================================
function update() {
    if (!running || gameOver || paused || isChoosingUpgrade) return;
    frame++;
    // Cache the active save object for this simulation tick.
    var saveObj = getSave();
    // 🔧 ФИКС: защита от изменения running во время update
    var _wasRunning = running;

    runTime = Math.floor((performance.now() - runStartTime) / 1000);
    var mode = MODES[currentMode];

    // Таймер
    if (mode.hasTimer) {
        timeLeft = getModeTimeLeft();
        if (timeLeft <= 0) {
            gameOver = true;
            finishRun();
            return;
        }
    } else {
        // Roguelike levels are earned from enemy-kill XP only.
        // The legacy global timer must never grant a free level in a run.
        if (currentMode === 'rogue') {
            levelTimer = LEVEL_DURATION;
        } else {
            levelTimer--;
            if (levelTimer <= 0) {
                levelTimer = LEVEL_DURATION;
                levelUp();
                // 🔧 Если открылась модалка/волна — прерываем update
                if (isChoosingUpgrade || !running) return;
            }
        }
    }

    // Combo
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer <= 0 && combo > 0) {
            combo = 0;
            hudCombo.classList.remove('show');
        }
    }
    if (comboGraceTimer > 0) comboGraceTimer--;

    // Эффекты
    if (damageFlash > 0) damageFlash = Math.max(0, damageFlash - 0.04);
    if (player.damageFlash > 0) player.damageFlash--;
    if (screenShake > 0.3) screenShake *= 0.88;
    else screenShake = 0;
    player.breath += 0.03;

    // Мигание
    if (player.damageFlash <= 0) {
        player.blinkTimer--;
        if (player.blinkTimer <= 0) {
            player.isBlinking = !player.isBlinking;
            player.blinkTimer = player.isBlinking ? 6 : (120 + Math.floor(Math.random() * 180));
        }
    } else {
        player.isBlinking = (player.damageFlash % 6 < 3);
    }

    // Баффы
    var needBadge = false;
    ['magnet','freeze','speedBoost','x2gold','phantom'].forEach(function(k) {
        if (buff[k] > 0) {
            buff[k]--;
            if (buff[k] % 60 === 0) needBadge = true;
            if (buff[k] === 0) needBadge = true;
        }
    });
    if (buff.chest > 0) {
        buff.chest--;
        if (buff.chest === 0) { openChest(); needBadge = true; }
        else if (buff.chest % 60 === 0) needBadge = true;
    }
    if (needBadge) updateBuffBadges();

    // Реген щита
    if (maxShields > 0 && playerShields < maxShields) {
        shieldRegenTimer++;
        if (shieldRegenTimer >= 12 * 60) {
            shieldRegenTimer = 0;
            playerShields++;
            addParticles(player.x + player.size/2, player.y + player.size/2, '#4fc3f7', 10, 6);
        }
    }

    // Реген HP
    if (runUpgrades.regen && runUpgrades.regen > 0) {
        regenTimer++;
        var threshold = 25 * 60 / runUpgrades.regen;
        if (regenTimer >= threshold) {
            regenTimer = 0;
            if (currentMode !== 'survival' && lives < 10) {
                lives++;
                addFloatingText(player.x + player.size/2, player.y - 10, '+❤', '#7cffb2', 22);
                updateHUD();
            }
        }
    }

    // Chaos orb
    if (chaosOrbTimer > 0) {
        chaosOrbTimer--;
        if (chaosOrbTimer === 0) {
            chaosOrbTimer = 10 * 60;
            var chaosBuffs = ['magnet','freeze','speedBoost','x2gold','phantom'];
            var pick = chaosBuffs[Math.floor(Math.random() * chaosBuffs.length)];
            buff[pick] = 5 * 60;
            updateBuffBadges();
            showToast('🌀 Хаос: ' + pick + '!', 'epic');
        }
    }

    // Движение
    var dirX = 0, dirY = 0;
    if (player.frozen > 0) {
        player.frozen--;
    } else {
        var dx = 0, dy = 0;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= 1;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;
        if (keys['ArrowUp'] || keys['w'] || keys['W']) dy -= 1;
        if (keys['ArrowDown'] || keys['s'] || keys['S']) dy += 1;
        dx += joyVector.x;
        dy += joyVector.y;
        var mag = Math.hypot(dx, dy);
        if (mag > 1) { dx /= mag; dy /= mag; }
        dirX = dx; dirY = dy;

        var s = saveObj;
        var spd = player.speed * (s.playerSpeedBonus || 1);
        spd *= coreBonusCache.speed;

        if (mode.isRoguelike) {
            spd *= getClass(selectedClass).speed;
            if (runUpgrades.speed) spd *= Math.pow(1.08, runUpgrades.speed);
        }

        if (buff.speedBoost > 0) spd *= 2;
        if (player.inWeb) spd *= 0.5;

        // Быстрый отклик без видимого джойстика: небольшая инерция помогает
        // маневрировать, но разворот происходит почти мгновенно.
        var targetVx = dx * spd;
        var targetVy = dy * spd;
        var accel = (dx !== 0 || dy !== 0) ? 0.48 : 0.62;
        if ((dx * player.vx + dy * player.vy) < -0.05) accel = 0.78;
        player.vx += (targetVx - player.vx) * accel;
        player.vy += (targetVy - player.vy) * accel;
    }
    player.x += player.vx;
    player.y += player.vy;
    if (player.x <= 0 || player.x >= canvas.width - player.size) player.vx = 0;
    if (player.y <= 0 || player.y >= canvas.height - player.size) player.vy = 0;
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    if (Math.abs(dirX) > 0.05 || Math.abs(dirY) > 0.05) {
        player.lastDirX = dirX;
        player.lastDirY = dirY;
    }
    var targetTilt = dirX * 0.12;
    player.tilt += (targetTilt - player.tilt) * 0.15;

    // Rogue: аура мага
    if (mode.isRoguelike && getClass(selectedClass).passiveId === 'aura') {
        var auraR = 60;
        var px = player.x + player.size/2;
        var py = player.y + player.size/2;
        if (frame % 30 === 0) {
            enemies.forEach(function(e) {
                var ex = e.x + e.size/2, ey = e.y + e.size/2;
                if (Math.hypot(px - ex, py - ey) < auraR) {
                    e.hp -= 0.5;
                    e.hitFlash = 6;
                    addParticles(ex, ey, '#e040fb', 3, 4);
                }
            });
        }
    }

    // Rogue: орбитали
    if (orbitals.length > 0) {
        var pxc = player.x + player.size/2;
        var pyc = player.y + player.size/2;
        orbitals.forEach(function(o) {
            o.angle += 0.04;
            var ox = pxc + Math.cos(o.angle) * o.distance;
            var oy = pyc + Math.sin(o.angle) * o.distance;
            o.x = ox; o.y = oy;
            if (frame % 15 === 0) {
                enemies.forEach(function(e) {
                    var ex = e.x + e.size/2, ey = e.y + e.size/2;
                    if (Math.hypot(ox - ex, oy - ey) < e.size/2 + o.size) {
                        e.hp -= 1;
                        e.hitFlash = 6;
                        addParticles(ex, ey, '#7c4dff', 5, 6);
                    }
                });
                bosses.forEach(function(b) {
                    var bx = b.x + b.size/2, by = b.y + b.size/2;
                    if (Math.hypot(ox - bx, oy - by) < b.size/2 + o.size) {
                        b.hp -= 1;
                        b.hitFlash = 6;
                        addParticles(bx, by, '#7c4dff', 8, 8);
                    }
                });
            }
        });
    }

    // Босс-дуэль: отдельный режим — никаких обычных врагов/опасностей.
    if (bossState === 'intro') {
        bossStateTimer--;
        bossAnnouncementTimer = Math.max(0, bossAnnouncementTimer - 1);
        updateBossDuelHUD();
        if (bossStateTimer <= 0) {
            bossState = 'duel';
            bossStateTimer = 0;
            bossAnnouncement = '⚔ ДУЭЛЬ 1 × 1';
            bossAnnouncementTimer = 70;
            updateBossDuelHUD();
        }
    } else if (bossState === 'victory' || bossState === 'lost') {
        bossStateTimer--;
        bossAnnouncementTimer = Math.max(0, bossAnnouncementTimer - 1);
        updateBossDuelHUD();
        if (bossState === 'victory' && bossStateTimer <= 0) {
            bossState = 'none';
            bossDuelId = null;
            bossAnnouncement = '';
            updateBossDuelHUD();
            levelTimer = LEVEL_DURATION;
            // Roguelike progression is driven only by XP pickups; enemy kills do not grant XP.
            // Boss victory advances the planet route; it must not create a free level.
            if (currentMode !== 'rogue') {
                levelUp();
                if (isChoosingUpgrade || !running) return;
            }
        }
        if (bossState === 'lost') return;
    }

    // Спавн монет
    if (bossState === 'none' && frame % 40 === 0) spawnCoin();

    // Roguelike XP — самостоятельный редкий небесный дроп.
    // XP НЕ создаётся при убийстве врага: он спавнится независимо и падает сверху, как золото.
    if (currentMode === 'rogue' && bossState === 'none' && frame % 120 === 0) {
        if (typeof spawnRogueXP === 'function') spawnRogueXP();
    }

    // Спавн врагов
    var baseInterval;
    if (level <= 3) baseInterval = 75;
    else baseInterval = Math.max(15, 55 - (level - 1) * 6);
    var enemyMult = mode.enemyMultiplier || 1;

    if (mode.isRoguelike && currentWaveModifier) {
        if (currentWaveModifier.enemyMult) enemyMult *= currentWaveModifier.enemyMult;
    }

    if (bossState === 'none') {
        if (currentMode === 'rogue' && typeof getRogueStageEnemyConfig === 'function') {
            var rogueSpawnCfg = getRogueStageEnemyConfig();
            if (rogueSpawnCfg) {
                var rogueMinInterval = (typeof sfRogueBalance==='function' && sfRogueBalance() && sfRogueBalance().spawn) ? sfRogueBalance().spawn.minIntervalFrames : 55;
                var rogueInterval = Math.max(rogueMinInterval, rogueSpawnCfg.spawnInterval || 90);
                var rogueMaxAlive = Math.max(3, rogueSpawnCfg.maxAlive || 5);
                if (currentWaveModifier && currentWaveModifier.enemyMult) {
                    rogueInterval = Math.max(55, Math.floor(rogueInterval / currentWaveModifier.enemyMult));
                }
                if (enemies.length < rogueMaxAlive && frame % rogueInterval === 0) {
                    spawnEnemy();
                }
            }
        } else {
            if (frame % Math.max(8, Math.floor(baseInterval / enemyMult)) === 0) spawnEnemy();
            if (level >= 3 && frame % Math.max(15, Math.floor(baseInterval * 2 / enemyMult)) === 0) spawnEnemy();
            if (level >= 6 && frame % Math.max(30, Math.floor(baseInterval * 4 / enemyMult)) === 0) spawnEnemy();
        }
    }

    // Roguelike bosses are controlled exclusively by rogue-planets.js.
    // The legacy level 5/10/15 boss triggers were removed so a run can
    // only enter a boss duel after completing the planet's four stages.
    
    // Параллакс
    for (var psi = 0; psi < parallaxStars.length; psi++) {
        var ps = parallaxStars[psi];
        ps.y += ps.speed;
        ps.twinkle += 0.05;
        if (ps.y > canvas.height + 5) {
            ps.y = -5;
            ps.x = Math.random() * canvas.width;
        }
    }

    // Метеоры — ЕДИНСТВЕННАЯ система метеоритов.
    // Старые длинные линии здесь больше не рисуются: каждый метеорит
    // является одним компактным объектом со спрайт-анимацией из 12 кадров.
    // Механика метеоритов оставлена от старой версии:
    // тот же спавн, количество, траектории, скорость и затухание.
    // Меняется только внешний вид — теперь он берётся из нового спрайта.
    if (bossState === 'none' && frame % 90 === 0 && Math.random() < 0.7) {
        var meteorAngle = Math.PI * (0.55 + Math.random() * 0.18);
        var meteorSpeed = 3.8 + Math.random() * 1.8;
        var meteorSize = 14 + Math.random() * 5;
        meteors.push({
            x: Math.random() * canvas.width,
            y: -24,
            vx: Math.cos(meteorAngle) * meteorSpeed,
            vy: Math.sin(meteorAngle) * meteorSpeed,
            size: meteorSize,
            life: 1,
            age: 0,
            animFrame: Math.floor(Math.random() * 12),
            animTimer: 0,
            rotation: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.045
        });
    }

    for (var mi = meteors.length - 1; mi >= 0; mi--) {
        var m = meteors[mi];
        m.x += m.vx;
        m.y += m.vy;
        m.age++;
        m.rotation += m.spin;
        m.animTimer++;

        // Анимация нового визуала.
        if (m.animTimer >= 4) {
            m.animTimer = 0;
            m.animFrame = (m.animFrame + 1) % 12;
        }

        // Старое поведение: метеорит постепенно исчезает.
        m.life -= 0.012;
        if (m.life <= 0 || m.y > canvas.height + 50 || m.x < -70 || m.x > canvas.width + 70) {
            meteors.splice(mi, 1);
        }
    }

    updateWeather();

    // Магнит
    var magnetRadiusBase = saveObj.magnetRadius + coreBonusCache.magnet;
    if (mode.isRoguelike && runUpgrades.magnet) magnetRadiusBase += runUpgrades.magnet * 40;
    if (magnetRadiusBase > 0 || buff.magnet > 0) {
        var radius = Math.max(magnetRadiusBase, buff.magnet > 0 ? 250 : 0);
        var pull = buff.magnet > 0 ? 0.3 : 0.18;
        for (var ci = 0; ci < coins.length; ci++) {
            var c = coins[ci];
            var cxc = c.x + c.size/2, cyc = c.y + c.size/2;
            var ddx = px - cxc, ddy = py - cyc;
            var d = Math.hypot(ddx, ddy);
            if (d < radius && d > 0) {
                c.x += ddx * pull;
                c.y += ddy * pull;
            }
        }
    }

    // Монеты
    coins.forEach(function(c) { c.y += c.speed; c.phase += 0.18; });
    coins = coins.filter(function(c) {
        if (rectsCollide(player, c)) {
            score++;
            levelStats.coinsThisLevel++;

            var gained = c.value;
            if (runBoosts.x2gold) gained *= 2;
            if (buff.x2gold > 0) gained *= 2;
            if (mode.isRoguelike) {
                if (runUpgrades.greed) gained = Math.floor(gained * Math.pow(1.2, runUpgrades.greed));
                if (runRelics.indexOf('lucky_coin') !== -1) gained = Math.floor(gained * 1.3);
                if (runRelics.indexOf('midas') !== -1) gained = Math.floor(gained * 3);
                var cls = getClass(selectedClass);
                if (cls.passiveId === 'coin_bonus') gained = Math.floor(gained * 1.25);
            }

            addCombo();
            var comboMult = getComboMultiplier();
            gained = Math.floor(gained * comboMult);

            var isCrit = false;
            if (mode.isRoguelike && (critChance > 0) && Math.random() < critChance) {
                gained *= 3;
                isCrit = true;
            }

            goldEarned += gained;
            var sv = saveObj;
            sv.bank += gained;
            sv.totalCoins = (sv.totalCoins || 0) + gained;

            addParticles(c.x + c.size/2, c.y + c.size/2, isCrit ? '#ff1744' : '#ffd93d', isCrit ? 12 : 6, 5);
            var textColor = isCrit ? '#ff1744' : (combo >= 5 ? '#ff9800' : '#ffd93d');
            var textSize = isCrit ? 32 : (gained >= 20 ? 28 : (gained >= 10 ? 24 : 20));
            addFloatingText(c.x + c.size/2, c.y, (isCrit ? 'КРИТ +' : '+') + gained, textColor, textSize);
            persist();
            playSFX('coin');

            if (mode.isRoguelike && explosiveCoins) {
                var ex = c.x + c.size/2, ey = c.y + c.size/2;
                addParticles(ex, ey, '#ff9800', 15, 12);
                enemies.forEach(function(en) {
                    var enx = en.x + en.size/2, eny = en.y + en.size/2;
                    if (Math.hypot(ex - enx, ey - eny) < 60) {
                        en.hp -= 1;
                        en.hitFlash = 6;
                    }
                });
                screenShake = 4;
            }

            return false;
        }
        return c.y < canvas.height + 20;
    });

    // Roguelike XP — редкий самостоятельный падающий предмет, остающийся на поле до подбора.
    if (currentMode === 'rogue') {
        var xpMagnetRadius = (saveObj.magnetRadius || 0) + coreBonusCache.magnet;
        if (runUpgrades.magnet) xpMagnetRadius += runUpgrades.magnet * 40;
        if (buff.magnet > 0) xpMagnetRadius = Math.max(xpMagnetRadius, 250);

        rogueXPOrbs.forEach(function(xp) {
            // XP uses the same vertical fall as coins: no artificial floor.
            // It must keep moving down and disappear after leaving the field.
            xp.y += xp.speed;
            xp.phase += 0.14;

            if (xpMagnetRadius > 0 || buff.magnet > 0) {
                var xpcx = xp.x + xp.size / 2;
                var xpcy = xp.y + xp.size / 2;
                var pxc = player.x + player.size / 2;
                var pyc = player.y + player.size / 2;
                var dx = pxc - xpcx;
                var dy = pyc - xpcy;
                var dist = Math.hypot(dx, dy);
                if (dist < xpMagnetRadius && dist > 0) {
                    var pull = buff.magnet > 0 ? 0.3 : 0.18;
                    xp.x += dx * pull;
                    xp.y += dy * pull;
                }
            }
        });

        rogueXPOrbs = rogueXPOrbs.filter(function(xp) {
            if (rectsCollide(player, xp)) {
                var gainedXP = xp.value || 1;
                rogueXP += gainedXP;
                addParticles(xp.x + xp.size / 2, xp.y + xp.size / 2, '#b388ff', 10, 6);
                addFloatingText(xp.x + xp.size / 2, xp.y, '+' + gainedXP + ' XP', '#b388ff', 16);
                playSFX('coin');

                while (rogueXP >= rogueXPNext) {
                    rogueXP -= rogueXPNext;
                    rogueXPNext = Math.floor(rogueXPNext * 1.32 + 3);
                    // Call the active levelUp wrapper so Roguelike uses XP progression.
                    if (typeof levelUp === 'function') levelUp();
                    if (isChoosingUpgrade || !running) break;
                }
                updateHUD();
                return false;
            }
            // Same lifetime rule as coins: once it leaves the bottom,
            // it is gone instead of getting stuck on the edge.
            return xp.y < canvas.height + 20;
        });
    }

    // Осколки космического ядра: они выпадают из убитых врагов и падают
    // с места смерти. Их можно подобрать магнитом или обычным движением.
    if (currentMode === 'rogue') {
        var coreMagnetRadius = (saveObj.magnetRadius || 0) + coreBonusCache.magnet;
        if (runUpgrades.magnet) coreMagnetRadius += runUpgrades.magnet * 40;
        if (buff.magnet > 0) coreMagnetRadius = Math.max(coreMagnetRadius, 250);

        rogueCoreFragments.forEach(function(fragment) {
            fragment.phase += 0.12;
            fragment.rotation += fragment.spin;
            fragment.vy = Math.min(5, fragment.vy + 0.035);
            fragment.x += fragment.vx;
            fragment.y += fragment.vy;
            if (fragment.x <= 0 || fragment.x + fragment.size >= canvas.width) fragment.vx *= -0.75;

            if (coreMagnetRadius > 0 || buff.magnet > 0) {
                var fcx = fragment.x + fragment.size / 2;
                var fcy = fragment.y + fragment.size / 2;
                var pfx = player.x + player.size / 2;
                var pfy = player.y + player.size / 2;
                var fdx = pfx - fcx;
                var fdy = pfy - fcy;
                var fd = Math.hypot(fdx, fdy);
                if (fd < coreMagnetRadius && fd > 0) {
                    var fpull = buff.magnet > 0 ? 0.3 : 0.18;
                    fragment.x += fdx * fpull;
                    fragment.y += fdy * fpull;
                }
            }
        });

        rogueCoreFragments = rogueCoreFragments.filter(function(fragment) {
            if (rectsCollide(player, fragment)) {
                roguePlanetState.stageCoreFragments = (roguePlanetState.stageCoreFragments || 0) + 1;
                addParticles(fragment.x + fragment.size / 2, fragment.y + fragment.size / 2, '#80deea', 18, 8);
                addFloatingText(fragment.x + fragment.size / 2, fragment.y, 'ОСКОЛОК ЯДРА  +1', '#80deea', 15);
                playSFX('upgrade');
                return false;
            }
            // Осколки ядра не должны теряться за нижней границей:
            // если игрок не успел подобрать, они остаются у края поля.
            fragment.y = Math.min(canvas.height - fragment.size - 2, fragment.y);
            return true;
        });
    }

    // Дропы
    drops.forEach(function(d) {
        d.y += d.vy;
        d.wobble += 0.12;
        d.x += Math.sin(d.wobble) * 1.0;
    });
    drops = drops.filter(function(d) {
        if (rectsCollide(player, d)) { applyDrop(d.type, player.x, player.y); return false; }
        return d.y < canvas.height + 30;
    });

    webs = webs.filter(function(w) { w.life--; return w.life > 0; });

    var px = player.x + player.size / 2;
    var py = player.y + player.size / 2;
    var frozen = buff.freeze > 0;

    // Вражеские радиусные атаки обновляются отдельно от столкновений.
    updateRogueEnemyHazards();

    // ВРАГИ
    for (var ei = 0; ei < enemies.length; ei++) {
        var e = enemies[ei];
        var et = e.t;
        e.wobble += 0.1;
        e.rotation = (e.rotation + 0.02) % (Math.PI * 2);
        e.wingPhase += 0.2;
        if (e.hitFlash > 0) e.hitFlash--;
        if (e.rogueContactCooldown > 0) e.rogueContactCooldown--;
        if (frozen) continue;

        // Движение по типам
        if (et.shape === 'oval') {
            e.flightTime++;
            if (e.flightTime < et.flightTime) {
                e.y += e.speed * 0.4;
                e.x += Math.sin(e.flightTime * 0.08) * 2.5;
            } else if (e.flightTime === et.flightTime) {
                e.y += e.speed * 4;
            } else {
                e.y += e.speed * 2.2;
            }
            // Дистанционная атака: летун держит темп и периодически стреляет в куб.
            e.shootTimer--;
            if (e.shootTimer <= 0 && e.y > 25 && e.y < canvas.height - 40) {
                e.shootTimer = et.shootsEvery || 150;
                var fcx = e.x + e.size / 2, fcy = e.y + e.size / 2;
                var fa = Math.atan2(py - fcy, px - fcx);
                spawnEnemyBullet(fcx, fcy,
                    Math.cos(fa) * (et.projectileSpeed || 3.2),
                    Math.sin(fa) * (et.projectileSpeed || 3.2),
                    {color:'#42a5f5', size:6, life:150});
            }
        } else if (et.shape === 'diamond' || et.shape === 'snake') {
            e.y += e.speed;
            e.zigzagPhase += et.zigzagFreq;
            e.x = e.baseX + Math.sin(e.zigzagPhase) * et.zigzagAmp * (level * 0.5);
            e.x = Math.max(0, Math.min(canvas.width - e.size, e.x));
        } else if (et.shape === 'ghost') {
            e.y += e.speed;
            e.x += Math.sin(e.wobble * 0.5) * 1.2;
            e.ghostPhase = (e.ghostPhase + 1) % 360;
            e.ghostAlpha = (e.ghostPhase < 120) ? 0.15 : 1;
        } else if (et.shape === 'triangle') {
            e.y += e.speed;
            e.x += ((px - e.size / 2) - e.x) * et.homing * (1 + level * 0.15);
        } else if (et.shape === 'circle' || et.shape === 'hex') {
            e.y += e.speed;
            e.x += Math.sin(e.wobble) * 1.5;
        } else if (et.shape === 'spider') {
            e.y += e.speed;
            e.x += Math.sin(e.wobble * 0.8) * 1.5;
            if (frame % 90 === 0 && e.y > 0 && e.y < canvas.height - 40) {
                spawnWeb(e.x + e.size / 2, e.y + e.size / 2);
            }
        } else if (et.shape === 'ice') {
            e.y += e.speed;
            e.x += Math.sin(e.wobble) * 0.8;
            // Ледяная зона появляется рядом с игроком, но сначала предупреждает.
            e.shootTimer--;
            if (e.shootTimer <= 0 && e.y > 20 && e.y < canvas.height - 40) {
                e.shootTimer = et.zoneEvery || 150;
                spawnRogueEnemyHazard(
                    px + (Math.random() - 0.5) * 90,
                    py + (Math.random() - 0.5) * 90,
                    et.zoneRadius || 58, 80, '#00e5ff', 'freeze'
                );
            }
        } else if (et.shape === 'star') {
            e.y += e.speed * 0.6;
            e.x += Math.sin(e.wobble * 0.4) * 1.0;
            e.shootTimer--;
            if (e.shootTimer <= 0 && e.y > 30) {
                e.shootTimer = et.shootsEvery;
                var scx = e.x + e.size / 2, scy = e.y + e.size / 2;
                spawnEnemyBullet(scx, scy, 0, 3, { color:'#ffeb3b' });
                spawnEnemyBullet(scx, scy, 0, -3, { color:'#ffeb3b' });
                spawnEnemyBullet(scx, scy, 3, 0, { color:'#ffeb3b' });
                spawnEnemyBullet(scx, scy, -3, 0, { color:'#ffeb3b' });
            }
        } else if (et.shape === 'boss') {
            e.y += e.speed;
            if (e.y > 60 && e.y < canvas.height * 0.4) e.y -= e.speed;
            e.x += Math.sin(e.wobble * 0.3) * 1.5;
            e.x = Math.max(10, Math.min(canvas.width - e.size - 10, e.x));
            e.shootTimer--;
            if (e.shootTimer <= 0 && e.y > 20) {
                e.shootTimer = et.shootsEvery;
                var bcx = e.x + e.size / 2, bcy = e.y + e.size / 2;
                for (var j = -1; j <= 1; j++) {
                    var angle = Math.atan2(py - bcy, px - bcx) + j * 0.3;
                    spawnEnemyBullet(bcx, bcy, Math.cos(angle) * 3, Math.sin(angle) * 3,
                        { homing: 0.02, color: '#ff1744', size: 8 });
                }
            }
        } else if (et.shape === 'crystal') {
            // Кристалл не должен зависать у верхней границы после спавна.
            // Он медленно входит в поле, а затем продолжает двигаться вниз.
            e.y += e.speed * 0.7;
            e.x += Math.sin(e.wobble * 0.45) * 0.7;
            e.x = Math.max(0, Math.min(canvas.width - e.size, e.x));

            e.shootTimer--;
            if (e.shootTimer <= 0 && e.y > 20) {
                e.shootTimer = et.shootsEvery || 120;
                var ccx = e.x + e.size / 2, ccy = e.y + e.size / 2;
                for (var cc = 0; cc < (et.shootsCount || 5); cc++) {
                    var ca = (cc / (et.shootsCount || 5)) * Math.PI * 2 + e.wobble * 0.1;
                    spawnEnemyBullet(ccx, ccy, Math.cos(ca) * 2.6, Math.sin(ca) * 2.6,
                        { color: '#00e5ff', size: 6 });
                }
            }
        } else if (et.shape === 'barrier') {
            e.x += e.vx;
            if (e.x <= 5 || e.x + (et.barWidth || 60) >= canvas.width - 5) {
                e.vx *= -1;
                e.x = Math.max(5, Math.min(canvas.width - (et.barWidth || 60) - 5, e.x));
            }
            e.y += e.speed;
        } else if (et.shape === 'teleporter') {
            e.teleportTimer--;
            if (e.teleportTimer <= 0) {
                e.teleportTimer = et.teleportEvery || 90;
                addParticles(e.x + e.size / 2, e.y + e.size / 2, '#e040fb', 15, 10);
                var tpx = player.x + (Math.random() - 0.5) * 200;
                var tpy = player.y - 100 - Math.random() * 100;
                e.x = Math.max(20, Math.min(canvas.width - e.size - 20, tpx));
                e.y = Math.max(20, tpy);
                e.baseX = e.x;
            }
        } else if (et.shape === 'magnet_enemy') {
            var mdx = (e.x + e.size / 2) - px;
            var mdy = (e.y + e.size / 2) - py;
            var mdist = Math.hypot(mdx, mdy) || 1;
            if (mdist < (et.magnetRange || 150)) {
                player.x += (mdx / mdist) * (et.magnetForce || 0.15);
                player.y += (mdy / mdist) * (et.magnetForce || 0.15);
            }
            e.y += e.speed;
        } else if (et.shape === 'doppel') {
            var mirrorX = canvas.width - player.x - player.size / 2;
            e.x += (mirrorX - e.size / 2 - e.x) * 0.05;
            e.y += (player.y - e.y) * 0.02 + 0.15;
        } else if (et.shape === 'laser') {
            e.laserTimer--;
            if (!e.laserCharging && e.laserTimer <= 0) {
                e.laserCharging = true;
                e.laserTimer = et.laserDuration || 30;
            } else if (e.laserCharging && e.laserTimer <= 0) {
                e.laserCharging = false;
                e.laserTimer = et.chargeTime || 60;
            }
            e.y += e.speed * 0.5;
        } else {
            e.y += e.speed;
            e.x += Math.sin(e.wobble) * 1.0;
        }

        // Лазер
        if (et.shape === 'laser' && e.laserCharging && buff.phantom <= 0) {
            var lx = e.x + e.size / 2;
            if (Math.abs(px - lx) < 5 && py < e.y + e.size) {
                if (player.damageFlash <= 0) playerTakeDamage();
            }
        }

        // Урон от игрока (фантом)
        if (mode.isRoguelike && playerDamage > 0 && buff.phantom > 0) {
            var collidesP = e.x < player.x + player.size && e.x + e.size > player.x &&
                            e.y < player.y + player.size && e.y + e.size > player.y;
            if (collidesP && frame % 12 === 0) {
                e.hp -= playerDamage;
                e.hitFlash = 6;
                addParticles(e.x + e.size/2, e.y + e.size/2, '#fff', 5, 6);
            }
        }

        // Столкновение
        var collideW = et.shape === 'barrier' ? (et.barWidth || 60) : e.size;
        var collideH = et.shape === 'barrier' ? 15 : e.size;
        var collides = e.x < player.x + player.size && e.x + collideW > player.x &&
                       e.y < player.y + player.size && e.y + collideH > player.y;

        if (collides) {
            if (buff.phantom > 0) continue;
            if (et.shape === 'ghost' && e.ghostAlpha < 0.5) continue;

            if (mode.isRoguelike && thornsDamage > 0) {
                e.hp -= thornsDamage;
                e.hitFlash = 6;
                addParticles(e.x + e.size/2, e.y + e.size/2, '#aed581', 6, 6);
            }

            if (!mode.isRoguelike && playerDamage > 0) {
                e.hp -= playerDamage;
                e.hitFlash = 6;
            }

            if (et.shape === 'snake') {
                var sdx = px - (e.x + e.size / 2), sdy = py - (e.y + e.size / 2);
                var sd = Math.hypot(sdx, sdy) || 1;
                player.x += (sdx / sd) * 40;
                player.y += (sdy / sd) * 40;
                player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
                player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
            } else if (et.shape === 'ice') {
                if (player.frozen <= 0) {
                    player.frozen = 60;
                    player.damageFlash = 12;
                    damageFlash = 0.6;
                    addParticles(px, py, '#00e5ff', 15, 10);
                    showToast('🧊 Заморожен!', 'info');
                    resetCombo();
                }
            } else {
                if (player.damageFlash <= 0) playerTakeDamage();
            }
            if (e.hp <= 0) {
                if (et.explodes) explodeBomber(e);
            }
        }
    }

    // Финальная граница игрового поля: враги и их силы не могут вытолкнуть игрока наружу.
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    // Уборка врагов
    enemies = enemies.filter(function(en) {
        if (en.hp <= 0) {
            spawnRogueCoreFragmentFromEnemy(en);
            if (typeof rogueRegisterKill === "function") rogueRegisterKill(en);
            return false;
        }
        // Враг никогда не рисуется за боковыми границами поля.
        en.x = Math.max(0, Math.min(canvas.width - en.size, en.x));
        // Верхняя граница также безопасна: враг может войти только через неё.
        if (en.y < 0) en.y = 0;
        // Нижняя граница — край поля: удаляем врага сразу при достижении края,
        // вместо того чтобы позволять ему вылететь за пределы canvas.
        if (en.y + en.size >= canvas.height) {
    // 🔧 ФИКС: не даём бомберу убить игрока после его смерти
    if (en.t.explodes && lives > 0 && !gameOver) explodeBomber(en, true);
            var luckBonus = coreBonusCache.luck;
            if (mode.isRoguelike && runUpgrades.luck) luckBonus += runUpgrades.luck * 0.10;
            var rand = Math.random() + luckBonus;
            var ecx = en.x + en.size / 2, ecy = en.y + en.size / 2;
            if (rand < 0.03) spawnDrop('bomb', ecx, ecy);
            else if (rand < 0.06) spawnDrop('killall', ecx, ecy);
            else if (rand < 0.10) spawnDrop('magnet', ecx, ecy);
            else if (rand < 0.13) spawnDrop('freeze', ecx, ecy);
            else if (rand < 0.16) spawnDrop('speedBoost', ecx, ecy);
            else if (rand < 0.19) spawnDrop('x2gold', ecx, ecy);
            else if (rand < 0.215) spawnDrop('phantom', ecx, ecy);
            else if (rand < 0.235) spawnDrop('medkit', ecx, ecy);
            else if (rand < (mode.isRoguelike ? 0.30 : 0.245) + luckBonus) spawnDrop('chest', ecx, ecy);
            return false;
        }
        return true;
    });

    // Chain lightning
    if (mode.isRoguelike && chainLightning > 0 && frame % 20 === 0) {
        enemies.forEach(function(e) {
            if (e.hp <= 0 && !e._chainDone) {
                e._chainDone = true;
                var best = null, bestD = 200;
                var ex = e.x + e.size/2, ey = e.y + e.size/2;
                enemies.forEach(function(other) {
                    if (other === e) return;
                    var ox = other.x + other.size/2, oy = other.y + other.size/2;
                    var d = Math.hypot(ex - ox, ey - oy);
                    if (d < bestD) { bestD = d; best = other; }
                });
                if (best) {
                    best.hp -= chainLightning;
                    best.hitFlash = 8;
                    addParticles(best.x + best.size/2, best.y + best.size/2, '#fff59d', 6, 6);
                }
            }
        });
    }

    // Вражеские пули
    for (var bi = enemyBullets.length - 1; bi >= 0; bi--) {
        var b = enemyBullets[bi];
        if (b.homing > 0) {
            var bangle = Math.atan2(py - b.y, px - b.x);
            b.vx += Math.cos(bangle) * b.homing * 3;
            b.vy += Math.sin(bangle) * b.homing * 3;
        }
        b.x += b.vx; b.y += b.vy; b.life--;
        if (b.life <= 0 || b.x < -20 || b.x > canvas.width + 20 || b.y > canvas.height + 20 || b.y < -40) {
            enemyBullets.splice(bi, 1); continue;
        }
        if (rectsCollide(player, { x: b.x - b.size/2, y: b.y - b.size/2, size: b.size })) {
            if (buff.phantom <= 0 && player.damageFlash <= 0) playerTakeDamage();
            enemyBullets.splice(bi, 1);
        }
    }

    // Боссы — с защитой от индексов
    for (var bossI = bosses.length - 1; bossI >= 0; bossI--) {
        var boss = bosses[bossI];
        if (!boss) continue;

        if (boss.entering) {
            boss.y += 1.5;
            if (boss.y >= 60) { boss.y = 60; boss.entering = false; }
            continue;
        }
        if (bossState !== 'duel') continue;
        boss.wobble += 0.05;
        boss.rotation += 0.01;
        if (boss.hitFlash > 0) boss.hitFlash--;

        var hpPct = boss.hp / boss.maxHp;
        if (hpPct <= 0.33) boss.phase = 3;
        else if (hpPct <= 0.66) boss.phase = 2;
        else boss.phase = 1;

        // Босс работает по понятному циклу:
        // ожидание → телеграф → атака → короткое окно уязвимости.
        // Это даёт игроку честный момент для контратаки вместо постоянного
        // контакта, в котором раньше босс фактически не давал себя убить.
        if (boss.contactCooldown > 0) boss.contactCooldown--;
        if (boss.vulnerableTimer > 0) {
            boss.vulnerableTimer--;
        } else if (boss.telegraphTimer > 0) {
            boss.telegraphTimer--;
            if (boss.telegraphTimer <= 0) {
                boss.fireNow = true;
                boss.vulnerableTimer = 36;
            }
        } else if (!boss.fireNow) {
            boss.shootTimer--;
            if (boss.shootTimer <= 0) boss.telegraphTimer = 30;
        }

        if (boss.id === 'dragon') {
            boss.x = canvas.width / 2 - boss.size / 2 + Math.sin(boss.wobble * 0.5) * 150;
            boss.y = 60 + Math.sin(boss.wobble * 0.3) * 20;
            boss.x = Math.max(0, Math.min(canvas.width - boss.size, boss.x));
            boss.y = Math.max(0, Math.min(canvas.height - boss.size, boss.y));
            if (boss.fireNow) {
                var dbx = boss.x + boss.size / 2, dby = boss.y + boss.size / 2;
                for (var d2 = -boss.phase; d2 <= boss.phase; d2++) {
                    spawnEnemyBullet(dbx, dby + 20, d2 * 1.5, 3.5, { color: '#ff5252', size: 9 });
                }
                boss.shootTimer = 60 - boss.phase * 12;
                boss.fireNow = false;
            }
        } else if (boss.id === 'titan') {
            boss.x = canvas.width / 2 - boss.size / 2 + Math.sin(boss.wobble * 0.4) * 100;
            boss.y = 80 + Math.sin(boss.wobble * 0.5) * 15;
            if (boss.fireNow) {
                var tbx = boss.x + boss.size / 2, tby = boss.y + boss.size / 2;
                for (var t1 = -2; t1 <= 2; t1++) {
                    spawnEnemyBullet(tbx, tby + 20, t1 * 1.2, 2.5, { color: '#00e5ff', size: 10 });
                }
                boss.shootTimer = 80 - boss.phase * 15;
                boss.fireNow = false;
            }
        } else if (boss.id === 'devourer') {
            boss.x = canvas.width / 2 - boss.size / 2 + Math.sin(boss.wobble * 0.3) * 80;
            boss.y = 70 + Math.sin(boss.wobble * 0.4) * 20;
            var ddx = (boss.x + boss.size / 2) - px;
            var ddy = (boss.y + boss.size / 2) - py;
            var dd = Math.hypot(ddx, ddy) || 1;
            player.x += (ddx / dd) * 0.05 * boss.phase;
            player.y += (ddy / dd) * 0.05 * boss.phase;
            player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
            player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
            if (boss.fireNow) {
                var vbx = boss.x + boss.size / 2, vby = boss.y + boss.size / 2;
                for (var v1 = 0; v1 < 12; v1++) {
                    var va = (v1 / 12) * Math.PI * 2 + boss.wobble;
                    spawnEnemyBullet(vbx, vby, Math.cos(va) * 2.5, Math.sin(va) * 2.5, { color: '#e040fb', size: 9 });
                }
                boss.shootTimer = 50 - boss.phase * 10;
                boss.fireNow = false;
            }
        }

        var bx1 = boss.x, by1 = boss.y, bs = boss.size;
        if (player.x < bx1 + bs && player.x + player.size > bx1 &&
            player.y < by1 + bs && player.y + player.size > by1) {

            if (boss.vulnerableTimer > 0 && boss.contactCooldown <= 0) {
                // У любого билда есть базовый способ убивать босса.
                // Апгрейд "Урон" напрямую усиливает этот удар.
                var contactDamage = Math.max(1, 2 + playerDamage);
                var isCrit = critChance > 0 && Math.random() < critChance;
                if (isCrit) contactDamage *= 3;
                if (titanMarkContacts !== undefined && runRelics.indexOf('titan_mark') !== -1) {
                    titanMarkContacts++;
                    if (titanMarkContacts % 3 === 0) contactDamage *= 2;
                }
                if (isCrit && bloodFangActive) {
                    lives = Math.min(Math.max(1, getClass(selectedClass).startHp), lives + 1);
                    addFloatingText(player.x + player.size / 2, player.y - 8, '+1 HP', '#ff5c7a', 14);
                }
                if (runUpgrades.berserk && lives > 0) {
                    contactDamage *= 1 + Math.max(0, 1 - (lives / Math.max(1, getClass(selectedClass).startHp))) * 2;
                }
                boss.hp -= Math.max(1, Math.floor(contactDamage));
                boss.hitFlash = 8;
                boss.contactCooldown = 8;
                addFloatingText(bx1 + bs / 2, by1 - 8, '-' + Math.max(1, Math.floor(contactDamage)), '#7cffb2', 18);
                addParticles(bx1 + bs / 2, by1 + bs / 2, '#7cffb2', 8, 7);
                playSFX('hit');
            } else if (buff.phantom <= 0 && player.damageFlash <= 0) {
                // Защитный билд тоже должен иметь рабочий путь к победе:
                // шипы отражают часть урона босса обратно в окно контакта.
                if (thornsDamage > 0 && boss.contactCooldown <= 0) {
                    boss.hp -= thornsDamage;
                    boss.hitFlash = 6;
                    boss.contactCooldown = 18;
                    addFloatingText(bx1 + bs / 2, by1 - 8, '-' + thornsDamage + ' THORNS', '#aed581', 15);
                    addParticles(bx1 + bs / 2, by1 + bs / 2, '#aed581', 6, 5);
                }
                playerTakeDamage();
            }
        }

        if (boss.hp <= 0) {
            var b = boss.type;
            var saveB = getSave();
            var reward = boss.reward || {};
            bosses.splice(bossI, 1);

            bossState = 'victory';
            bossStateTimer = 75;
            bossAnnouncement = '✦ BOSS DEFEATED ✦';
            bossAnnouncementTimer = 75;
            bossDuelId = boss.id;
            enemies = [];
            enemyBullets = [];
            webs = [];
            meteors = [];
            updateBossDuelHUD();

            addParticles(bx1 + bs/2, by1 + bs/2, b.glow || '#fff', 60, 25);
            addParticles(bx1 + bs/2, by1 + bs/2, '#fff', 30, 18);
            screenShake = 40;
            playSFX('boss');
            showToast('🏆 ' + (b.icon || '') + ' ' + (b.name || 'Босс') + ' ПОВЕРЖЕН!', 'legendary');

            saveB.bossesKilled = (saveB.bossesKilled || 0) + 1;
            if (reward.gold) { saveB.bank += reward.gold; goldEarned += reward.gold; }
            if (reward.crystals) {
                saveB.coreCrystals = (saveB.coreCrystals || 0) + reward.crystals;
                crystalsEarned += reward.crystals;
            }
            if (reward.skin && SKINS[reward.skin] && saveB.ownedSkins.indexOf(reward.skin) === -1) {
                saveB.ownedSkins.push(reward.skin);
            }
            persist();
            updateMainMenuStats();
            checkAchievements();
            bossI--; // защита от сдвига индексов
        }
    }

    updateBossDuelHUD();

    // Паутина
    player.inWeb = false;
    for (var wi = 0; wi < webs.length; wi++) {
        var w = webs[wi];
        if (Math.hypot(px - w.x, py - w.y) < w.size / 2) { player.inWeb = true; break; }
    }

    // Частицы
    for (var pi = particles.length - 1; pi >= 0; pi--) {
        var p = particles[pi];
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.94; p.vy *= 0.94;
        p.vy += p.gravity || 0;
        p.life -= 0.028;
        if (p.life <= 0) {
            // v3.1.6: возвращаем объект в пул вместо splice/new allocation.
            var lastParticle = particles.pop();
            if (lastParticle !== p) {
                particles[pi] = lastParticle;
            }
            sfReleaseParticle(p);
        }
    }

    // Тексты
    for (var fi = floatingTexts.length - 1; fi >= 0; fi--) {
        var ft = floatingTexts[fi];
        ft.y += ft.vy;
        ft.life -= 0.022;
        if (ft.life <= 0) floatingTexts.splice(fi, 1);
    }

    if (frame % 6 === 0) updateHUD();
}

// ==========================================================
//   DRAW
// ==========================================================
function getCoinGradient(big) {
    if (big && gradCache.coinBig) return gradCache.coinBig;
    if (!big && gradCache.coinSmall) return gradCache.coinSmall;
    var s = getSave();
    var theme = THEMES[s.equippedTheme] || THEMES.cosmos;
    var size = 18;
    var g = ctx.createRadialGradient(-size * 0.12, -size * 0.12, size * 0.1, 0, 0, size / 2);
    if (big) {
        g.addColorStop(0, '#fff0f5'); g.addColorStop(0.5, '#ff5c7a'); g.addColorStop(1, '#c62828');
        gradCache.coinBig = g;
    } else {
        g.addColorStop(0, theme.coinSmall1); g.addColorStop(0.6, theme.coinSmall2); g.addColorStop(1, theme.coinSmall3);
        gradCache.coinSmall = g;
    }
    return g;
}

/* ==========================================================
   MOBILE RENDER OPTIMIZER
   Keeps gameplay logic unchanged; only reduces expensive Canvas
   effects on touch devices. The FPS counter remains enabled.
   ========================================================== */
var SF_COARSE_DEVICE = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
var SF_RENDER_FACTOR = SF_COARSE_DEVICE ? 0.72 : 1;
var SF_BG_GRADIENT = null;
var SF_BG_THEME_KEY = '';

function sfShadow(value) {
    // v3.1.4: Roguelike glow-off test.
    // Keep all gameplay/rendering intact, but skip Canvas shadow/glow work in Roguelike.
    if (typeof currentMode !== 'undefined' && currentMode === 'rogue') return 0;
    return value * SF_RENDER_FACTOR;
}
function sfGetBackgroundGradient(theme, key) {
    if (SF_BG_GRADIENT && SF_BG_THEME_KEY === key) return SF_BG_GRADIENT;
    var g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, theme.bg1);
    g.addColorStop(0.5, theme.bg2);
    g.addColorStop(1, theme.bg3);
    SF_BG_GRADIENT = g;
    SF_BG_THEME_KEY = key;
    return g;
}

function drawPlayer() {
    var s = getSave();
    var skin = SKINS[s.equippedSkin] || SKINS.default;
    var c = skin.colors;
    var t = performance.now();

    // Аура мага
    if (currentMode === 'rogue' && getClass(selectedClass).passiveId === 'aura') {
        ctx.save();
        ctx.globalAlpha = 0.25 + Math.sin(t / 300) * 0.1;
        var ag = ctx.createRadialGradient(player.x + player.size/2, player.y + player.size/2, 0,
                                          player.x + player.size/2, player.y + player.size/2, 60);
        ag.addColorStop(0, 'rgba(224,64,251,0.5)');
        ag.addColorStop(1, 'rgba(224,64,251,0)');
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.arc(player.x + player.size/2, player.y + player.size/2, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Тень
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(player.x + player.size/2, player.y + player.size + 4, player.size*0.5, player.size*0.15, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Аура
    ctx.save();
    var auraGrad = ctx.createRadialGradient(
        player.x + player.size/2, player.y + player.size/2, player.size * 0.4,
        player.x + player.size/2, player.y + player.size/2, player.size * 1.2
    );
    var auraColor = player.frozen > 0 ? '0,229,255' : '79,195,247';
    auraGrad.addColorStop(0, 'rgba(' + auraColor + ',0.35)');
    auraGrad.addColorStop(1, 'rgba(' + auraColor + ',0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size*1.2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    if (player.isBlinking && player.damageFlash > 0) ctx.globalAlpha = 0.4;
    if (buff.phantom > 0) ctx.globalAlpha *= 0.5;
    if (c.ghostly) ctx.globalAlpha *= 0.65;
    if (c.pulse) {
        var p = 0.7 + Math.sin(t / 200) * 0.3;
        ctx.globalAlpha *= p;
    }

    var cx = player.x + player.size/2, cy = player.y + player.size/2;
    ctx.translate(cx, cy);
    ctx.rotate(player.tilt);
    var breathScale = 1 + Math.sin(player.breath) * 0.05;
    ctx.scale(breathScale, 2 - breathScale);
    ctx.translate(-player.size/2, -player.size/2);

    var topColor = c.top, bottomColor = c.bottom;
    if (c.rainbow || c.legend) {
        var hue = (t / 8) % 360;
        topColor = 'hsl(' + hue + ', 100%, 75%)';
        bottomColor = 'hsl(' + ((hue+60)%360) + ', 100%, 45%)';
    }
    if (c.police) {
        var flash = Math.floor(t / 300) % 2;
        topColor = flash ? '#2196f3' : '#f44336';
        bottomColor = flash ? '#0d47a1' : '#b71c1c';
    }
    if (player.frozen > 0) { topColor = '#b3e5fc'; bottomColor = '#0277bd'; }

    ctx.shadowColor = player.frozen > 0 ? '#00e5ff' : c.glow;
    ctx.shadowBlur = sfShadow(24);
    var grad = ctx.createLinearGradient(0, 0, 0, player.size);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, player.size, player.size, 8);
    ctx.fill();

    // Предупреждение лазера: сначала игрок видит линию, потом получает урон.
    if (t.shape === 'laser' && e.laserCharging) {
        ctx.save();
        var lcx = e.x + e.size / 2;
        ctx.globalAlpha = 0.22 + 0.18 * Math.sin(performance.now() / 70);
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = sfShadow(16);
        ctx.beginPath();
        ctx.moveTo(lcx, 0);
        ctx.lineTo(lcx, e.y + e.size);
        ctx.stroke();
        ctx.restore();
    }

    // Глаза
    ctx.shadowBlur = sfShadow(0);
    var eyeY = player.size * 0.38;
    var eyeSpacing = player.size * 0.22;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.size/2 - eyeSpacing, eyeY, 3.5, 0, Math.PI*2);
    ctx.arc(player.size/2 + eyeSpacing, eyeY, 3.5, 0, Math.PI*2);
    ctx.fill();
    var lookX = player.lastDirX, lookY = player.lastDirY;
    if (Math.abs(lookX) < 0.05 && Math.abs(lookY) < 0.05) { lookX = 0; lookY = 0.5; }
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.size/2 - eyeSpacing + lookX*1.8, eyeY + lookY*1.8, 1.8, 0, Math.PI*2);
    ctx.arc(player.size/2 + eyeSpacing + lookX*1.8, eyeY + lookY*1.8, 1.8, 0, Math.PI*2);
    ctx.fill();

    // Урон
    if (player.damageFlash > 0) {
        ctx.globalAlpha = player.damageFlash / 18 * 0.6;
        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.roundRect(0, 0, player.size, player.size, 8);
        ctx.fill();
    }

    // Щиты
    if (playerShields > 0) {
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 2;
        for (var sh = 0; sh < playerShields; sh++) {
            var shA = (t / 400 + sh * Math.PI * 2 / Math.max(1, playerShields)) % (Math.PI * 2);
            var shR = player.size / 2 + 12;
            var shX = player.size/2 + Math.cos(shA) * shR;
            var shY = player.size/2 + Math.sin(shA) * shR;
            ctx.beginPath();
            ctx.arc(shX, shY, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#4fc3f7';
            ctx.fill();
        }
    }

    ctx.restore();
}

function drawCoins() {
    var s = getSave();
    var theme = THEMES[s.equippedTheme] || THEMES.cosmos;
    for (var ci = 0; ci < coins.length; ci++) {
        var c = coins[ci];
        var isBig = c.value >= 5;
        ctx.save();
        ctx.shadowColor = isBig ? '#ff5c7a' : theme.glow;
        ctx.shadowBlur = sfShadow(isBig ? 18 : 12);
        var scaleX = Math.abs(Math.cos(c.phase));
        var scaleY = Math.abs(Math.cos(c.phase * 0.5) * 0.3 + 0.7);
        ctx.translate(c.x + c.size / 2, c.y + c.size / 2);
        ctx.scale(scaleX, scaleY);
        ctx.fillStyle = getCoinGradient(isBig);
        ctx.beginPath(); ctx.arc(0, 0, c.size / 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        if (c.value > 1) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px Segoe UI, Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000'; ctx.shadowBlur = sfShadow(3);
            ctx.fillText('×' + c.value, c.x + c.size / 2, c.y + c.size / 2 + 4);
            ctx.shadowBlur = sfShadow(0);
        }
    }
}

function drawRogueXP() {
    var t = performance.now();
    for (var i = 0; i < rogueXPOrbs.length; i++) {
        var xp = rogueXPOrbs[i];
        var pulse = 1 + Math.sin(t / 130 + xp.phase) * 0.10;
        ctx.save();
        ctx.translate(xp.x + xp.size / 2, xp.y + xp.size / 2);
        ctx.scale(pulse, pulse);
        ctx.shadowColor = '#9c6bff';
        ctx.shadowBlur = sfShadow(18);
        var g = ctx.createRadialGradient(0, -3, 1, 0, 0, xp.size / 2);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.35, '#d1b3ff');
        g.addColorStop(0.72, '#9c6bff');
        g.addColorStop(1, '#4a148c');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, -xp.size / 2);
        ctx.lineTo(xp.size / 2, 0);
        ctx.lineTo(0, xp.size / 2);
        ctx.lineTo(-xp.size / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = sfShadow(0);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (xp.value > 1) ctx.fillText('+' + xp.value, 0, 1);
        ctx.restore();
    }
}

function drawDrop(d) {
    var style = DROP_STYLE[d.type] || DROP_STYLE.magnet;
    var t = performance.now();
    ctx.save();
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = sfShadow(20);
    var pulse = 1 + Math.sin(t / 150) * 0.1;
    ctx.translate(d.x, d.y);
    ctx.scale(pulse, pulse);
    var g = ctx.createRadialGradient(0, -3, 2, 0, 0, d.size / 2);
    g.addColorStop(0, style.c1); g.addColorStop(0.6, style.c2); g.addColorStop(1, style.c3);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, d.size / 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = sfShadow(0);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(style.emoji, 0, 1);
    ctx.restore();
}

function drawRogueCoreFragments() {
    if (currentMode !== 'rogue') return;
    var now = performance.now();
    for (var i = 0; i < rogueCoreFragments.length; i++) {
        var fragment = rogueCoreFragments[i];
        var pulse = 1 + Math.sin(now / 120 + fragment.phase) * 0.08;
        ctx.save();
        ctx.translate(fragment.x + fragment.size / 2, fragment.y + fragment.size / 2);
        ctx.rotate(fragment.rotation);
        ctx.scale(pulse, pulse);
        ctx.shadowColor = '#80deea';
        ctx.shadowBlur = sfShadow(22);
        var g = ctx.createLinearGradient(-fragment.size / 2, -fragment.size / 2, fragment.size / 2, fragment.size / 2);
        g.addColorStop(0, '#e0f7fa');
        g.addColorStop(0.45, '#80deea');
        g.addColorStop(1, '#00838f');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, -fragment.size / 2);
        ctx.lineTo(fragment.size * 0.32, -fragment.size * 0.12);
        ctx.lineTo(fragment.size * 0.22, fragment.size / 2);
        ctx.lineTo(-fragment.size * 0.30, fragment.size * 0.30);
        ctx.lineTo(-fragment.size / 2, -fragment.size * 0.18);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}

function drawRogueEnemyHazards() {
    if (currentMode !== 'rogue') return;
    var now = performance.now();
    for (var i = 0; i < rogueEnemyHazards.length; i++) {
        var h = rogueEnemyHazards[i];
        var warning = h.warning > 0;
        var pulse = 1 + Math.sin(now / 90) * 0.06;

        // Опасная зона теперь выглядит как настоящий метеорит.
        // Механика зоны остаётся прежней: меняется только визуал.
        if (typeof meteorSprite !== 'undefined' && meteorSprite.complete && meteorSprite.naturalWidth > 0) {
            var frame = Math.floor(now / 70) % 12;
            var drawSize = Math.max(46, Math.min(68, h.radius * 0.72)) * pulse;
            var meteorAngle = Math.atan2(3.8, -0.8);

            ctx.save();
            ctx.translate(h.x, h.y);
            ctx.rotate(meteorAngle);
            ctx.globalAlpha = warning ? 1 : 0.88;
            ctx.shadowColor = h.color || '#ff6b18';
            ctx.shadowBlur = sfShadow(warning ? 16 : 11);
            ctx.drawImage(
                meteorSprite,
                frame * 48, 0, 48, 48,
                -drawSize / 2, -drawSize / 2, drawSize, drawSize
            );
            ctx.restore();
        }

        // Во время предупреждения оставляем только маленький индикатор,
        // чтобы было понятно, что именно эта точка наносит урон.
        if (warning) {
            ctx.save();
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Segoe UI, Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚠', h.x, h.y + h.radius * 0.62);
            ctx.restore();
        }
    }
}

function drawEnemyBullet(b) {
    ctx.save();
    ctx.shadowColor = b.color; ctx.shadowBlur = sfShadow(12);
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function drawWeb(w) {
    var alpha = Math.min(1, w.life / 60);
    var radius = w.size / 2;
    var spokes = 10;

    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.globalAlpha = alpha * 0.72;
    ctx.strokeStyle = '#dce7f7';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(190,220,255,.45)';
    ctx.shadowBlur = sfShadow(5);

    // Радиальные нити — от центра к краям.
    ctx.lineWidth = 1.1;
    for (var i = 0; i < spokes; i++) {
        var a = (i / spokes) * Math.PI * 2;
        var endR = radius * (0.9 + 0.1 * Math.sin(i * 1.7));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * endR, Math.sin(a) * endR);
        ctx.stroke();
    }

    // Концентрические нити — именно они дают силуэту настоящей паутины.
    ctx.shadowBlur = sfShadow(2);
    ctx.lineWidth = 0.9;
    var rings = 4;
    for (var r = 1; r <= rings; r++) {
        var ringR = radius * (r / rings) * 0.9;
        ctx.beginPath();
        for (var j = 0; j <= spokes; j++) {
            var a2 = (j / spokes) * Math.PI * 2;
            var wobble = 1 + 0.045 * Math.sin(j * 2.4 + r * 0.8);
            var rr = ringR * wobble;
            var x = Math.cos(a2) * rr;
            var y = Math.sin(a2) * rr;
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // Маленький узел в центре и мягкое свечение.
    ctx.shadowBlur = sfShadow(8);
    ctx.fillStyle = '#f4f8ff';
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawMonster(e) {
    var t = e.t;
    ctx.save();
    ctx.shadowColor = t.glow;
    ctx.shadowBlur = sfShadow(e.hitFlash > 0 ? 30 : 14);
    var cx = e.x + e.size / 2, cy = e.y + e.size / 2, r = e.size / 2;
    if (t.shape === 'ghost') ctx.globalAlpha = e.ghostAlpha;
    if (e.hitFlash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.fill();
    }
    var g = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.size);
    g.addColorStop(0, t.c1);
    g.addColorStop(1, t.c2);
    ctx.fillStyle = g;
    if (t.shape === 'square' || t.shape === 'hex' || t.shape === 'boss' || t.shape === 'crystal') {
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    } else if (t.shape === 'barrier') {
        ctx.beginPath();
        ctx.roundRect(e.x, e.y, t.barWidth || 60, 15, 4);
        ctx.fill();
    } else if (t.shape === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(cx, e.y); ctx.lineTo(e.x + e.size, cy); ctx.lineTo(cx, e.y + e.size); ctx.lineTo(e.x, cy);
        ctx.closePath(); ctx.fill();
    } else if (t.shape === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + e.size, e.y); ctx.lineTo(cx, e.y + e.size);
        ctx.closePath(); ctx.fill();
    } else {
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }
    // Глаза
    ctx.shadowBlur = sfShadow(0);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 2, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 1, 1.2, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawBoss(boss) {
    var b = boss.type;
    ctx.save();
    ctx.shadowColor = boss.vulnerableTimer > 0 ? '#7cffb2' : b.glow;
    ctx.shadowBlur = sfShadow(boss.hitFlash > 0 ? 40 : (boss.vulnerableTimer > 0 ? 38 : (boss.telegraphTimer > 0 ? 32 : 25)));
    var cx = boss.x + boss.size / 2, cy = boss.y + boss.size / 2, r = boss.size / 2;

    if (boss.telegraphTimer > 0) {
        var charge = 1 - boss.telegraphTimer / 30;
        ctx.strokeStyle = 'rgba(255,92,122,' + (0.35 + charge * 0.55) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 10 + charge * 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * charge);
        ctx.stroke();
    } else if (boss.vulnerableTimer > 0) {
        ctx.strokeStyle = 'rgba(124,255,178,.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 9, 0, Math.PI * 2);
        ctx.stroke();
    }
    if (boss.hitFlash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2); ctx.fill();
    }
    var g = ctx.createLinearGradient(cx, boss.y, cx, boss.y + boss.size);
    g.addColorStop(0, b.c1);
    g.addColorStop(1, b.c2);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = sfShadow(0);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - r*0.3, cy - r*0.15, 6, 0, Math.PI * 2);
    ctx.arc(cx + r*0.3, cy - r*0.15, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - r*0.3, cy - r*0.15, 3, 0, Math.PI * 2);
    ctx.arc(cx + r*0.3, cy - r*0.15, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // HP-бар
    ctx.save();
    var barW = 260, barH = 16;
    var barX = canvas.width / 2 - barW / 2;
    var barY = 10;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(barX - 3, barY - 3, barW + 6, barH + 6);
    ctx.fillStyle = 'rgba(60,0,20,0.9)';
    ctx.fillRect(barX, barY, barW, barH);
    var hpPct = boss.hp / boss.maxHp;
    ctx.fillStyle = hpPct > 0.5 ? '#ff1744' : (hpPct > 0.25 ? '#ff5722' : '#7f0000');
    ctx.fillRect(barX, barY, barW * hpPct, barH);
    ctx.strokeStyle = '#ffd93d'; ctx.lineWidth = 2;
    ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Segoe UI, Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000'; ctx.shadowBlur = sfShadow(4);
    ctx.fillText(b.icon + ' ' + b.name + '  —  Фаза ' + boss.phase + '/3', canvas.width / 2, barY + barH + 16);
    ctx.restore();
}

function drawOrbitals() {
    orbitals.forEach(function(o) {
        if (!o.x) return;
        ctx.save();
        ctx.shadowColor = '#7c4dff';
        ctx.shadowBlur = sfShadow(20);
        var g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.size);
        g.addColorStop(0, '#fff');
        g.addColorStop(0.5, '#b388ff');
        g.addColorStop(1, '#4a148c');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });
}

function draw() {
    var lowResRender = sfBeginRender();
    ctx.save();
    if (screenShake > 0.5) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    var s = getSave();
    var theme = THEMES[s.equippedTheme] || THEMES.cosmos;
    var themeKey = (s.equippedTheme || 'cosmos') + '|' + theme.bg1 + '|' + theme.bg2 + '|' + theme.bg3;
    var bgGrad = sfGetBackgroundGradient(theme, themeKey);
    if (gameBackgroundSprite.complete && gameBackgroundSprite.naturalWidth > 0) {
        // Новый вертикальный космический фон. Растягиваем ровно на логическое поле 360x780.
        ctx.drawImage(gameBackgroundSprite, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = bgGrad;
        ctx.fillRect(-30, -30, canvas.width + 60, canvas.height + 60);
    }

    // Параллакс
    for (var psi = 0; psi < parallaxStars.length; psi++) {
        var ps = parallaxStars[psi];
        var alpha = 0.3 + Math.sin(ps.twinkle) * 0.3 + 0.3;
        ctx.globalAlpha = alpha * (ps.layer === 2 ? 1 : ps.layer === 1 ? 0.8 : 0.5);
        ctx.fillStyle = ps.layer === 2 ? '#fff' : (ps.layer === 1 ? '#b3d9ff' : '#8ab4ff');
        ctx.beginPath(); ctx.arc(ps.x, ps.y, ps.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    drawWeather();
    drawRogueEnemyHazards();

    // Метеоры — компактный 12-кадровый спрайт.
    // Важно: это единственный renderer метеоритов. Старый ctx.stroke()
    // со светящимися длинными линиями полностью удалён.
    if (typeof meteorSprite !== 'undefined' && meteorSprite.complete && meteorSprite.naturalWidth > 0) {
        for (var mi = 0; mi < meteors.length; mi++) {
            var m = meteors[mi];
            var meteorAngle = Math.atan2(m.vy, m.vx);
            var drawSize = m.size * 2.55;

            ctx.save();
            ctx.translate(m.x, m.y);
            // Хвост всегда строго позади метеорита: направление определяется только его скоростью.\n            // Вращение корпуса не может развернуть огонь вперёд.\n            ctx.rotate(meteorAngle);
            ctx.globalAlpha = Math.max(0, m.life) * 0.92;
            ctx.shadowColor = '#ff6b18';
            ctx.shadowBlur = sfShadow(8);

            ctx.drawImage(
                meteorSprite,
                m.animFrame * 48, 0, 48, 48,
                -drawSize / 2, -drawSize / 2, drawSize, drawSize
            );

            ctx.restore();
        }
    }

    // Темнота (волна)
    if (currentMode === 'rogue' && currentWaveModifier && currentWaveModifier.darkness) {
        var pxc = player.x + player.size/2, pyc = player.y + player.size/2;
        var darkGrad = ctx.createRadialGradient(pxc, pyc, 40, pxc, pyc, 200);
        darkGrad.addColorStop(0, 'rgba(0,0,0,0)');
        darkGrad.addColorStop(1, 'rgba(0,0,0,0.9)');
        ctx.fillStyle = darkGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (buff.freeze > 0) {
        ctx.fillStyle = 'rgba(0,229,255,0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (buff.phantom > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Частицы
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (var wi = 0; wi < webs.length; wi++) drawWeb(webs[wi]);
    drawPlayer();
    drawOrbitals();
    drawCoins();
    if (currentMode === 'rogue') drawRogueXP();
    if (currentMode === 'rogue') drawRogueCoreFragments();
    for (var di = 0; di < drops.length; di++) drawDrop(drops[di]);
    for (var ei = 0; ei < enemies.length; ei++) drawMonster(enemies[ei]);
    for (var bi = 0; bi < bosses.length; bi++) drawBoss(bosses[bi]);
    for (var bui = 0; bui < enemyBullets.length; bui++) drawEnemyBullet(enemyBullets[bui]);

    // Тексты
    for (var fi = 0; fi < floatingTexts.length; fi++) {
        var ft = floatingTexts[fi];
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold ' + (ft.size || 20) + 'px Segoe UI, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    if (damageFlash > 0) {
        ctx.fillStyle = 'rgba(255,0,0,' + (damageFlash * 0.4) + ')';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (currentMode === 'rogue' && noHitWaveActive) {
        ctx.save();
        ctx.fillStyle = noHitWaveDamage === 0 ? 'rgba(124,255,178,0.9)' : 'rgba(255,92,122,0.9)';
        ctx.font = 'bold 14px Segoe UI, Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000'; ctx.shadowBlur = sfShadow(4);
        ctx.fillText(noHitWaveDamage === 0 ? '✨ ИДЕАЛЬНО!' : '❌ Урон получен', canvas.width / 2, canvas.height - 30);
        ctx.restore();
    }

    if (combo >= 3) {
        ctx.save();
        var comboS = 1 + Math.sin(performance.now() / 150) * 0.08;
        ctx.translate(canvas.width - 60, canvas.height - 50);
        ctx.scale(comboS, comboS);
        ctx.globalAlpha = 0.9;
        ctx.shadowColor = '#ff9800'; ctx.shadowBlur = sfShadow(20);
        ctx.fillStyle = '#ff9800';
        ctx.font = 'bold 22px Segoe UI, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('×' + getComboMultiplier(), 0, 0);
        ctx.font = 'bold 12px Segoe UI, Arial';
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = sfShadow(8);
        ctx.fillText(combo + ' подряд', 0, 16);
        ctx.restore();
    }

    ctx.restore();
    sfEndRender(lowResRender);
}

// ==========================================================
//   FPS DEBUG COUNTER — временный тестовый счётчик
//   Чтобы скрыть после тестов: FPS_COUNTER_ENABLED = false
// ==========================================================
var FPS_COUNTER_ENABLED = true;
var fpsCounterEl = null;
var fpsFrameCount = 0;
var fpsWindowStart = 0;
var fpsValue = 0;
var fpsLastFrameTime = 0;

function ensureFpsCounter() {
    if (!FPS_COUNTER_ENABLED) {
        if (fpsCounterEl) fpsCounterEl.style.display = 'none';
        return;
    }

    if (!fpsCounterEl) {
        fpsCounterEl = document.createElement('div');
        fpsCounterEl.id = 'fps-counter';
        fpsCounterEl.textContent = 'FPS: --';
        fpsCounterEl.style.cssText = [
            'position:absolute',
            'z-index:40',
            'display:none',
            'padding:3px 8px',
            'border:1px solid rgba(156,107,255,.45)',
            'border-radius:9px',
            'background:rgba(8,10,28,.82)',
            'color:#fff',
            'font:700 11px/1.1 Segoe UI,Arial,sans-serif',
            'letter-spacing:.2px',
            'white-space:nowrap',
            'pointer-events:none',
            'box-shadow:0 0 10px rgba(156,107,255,.18)',
            'backdrop-filter:blur(4px)',
            '-webkit-backdrop-filter:blur(4px)'
        ].join(';');
        var wrap = document.getElementById('game-wrap');
        if (wrap) wrap.appendChild(fpsCounterEl);
    }

    var hud = document.getElementById('hud');
    if (hud && fpsCounterEl) {
        var hudRect = hud.getBoundingClientRect();
        var wrapRect = hud.parentElement.getBoundingClientRect();
        fpsCounterEl.style.left = '50%';
        fpsCounterEl.style.top = Math.max(0, hudRect.bottom - wrapRect.top + 5) + 'px';
        fpsCounterEl.style.transform = 'translateX(-50%)';
    }

    fpsCounterEl.style.display = 'block';
}

function updateFpsCounter(now) {
    if (!running || gameOver) {
        if (fpsCounterEl) fpsCounterEl.style.display = 'none';
        return;
    }

    if (!FPS_COUNTER_ENABLED) {
        if (fpsCounterEl) fpsCounterEl.style.display = 'none';
        return;
    }

    ensureFpsCounter();

    if (!fpsWindowStart) fpsWindowStart = now;
    fpsFrameCount++;

    // Обновляем почти каждый кадр: FPS берётся из интервала между кадрами.
    // Это заметно быстрее реагирует на просадки, чем старое окно 500 мс.
    if (fpsLastFrameTime > 0) {
        var frameDelta = now - fpsLastFrameTime;
        if (frameDelta > 0) fpsValue = Math.round(1000 / frameDelta);
    }
    fpsLastFrameTime = now;

    // Перерисовываем текст раз в ~50 мс, чтобы сам счётчик не создавал лишнюю нагрузку.
    if (fpsCounterEl && (!fpsCounterEl._fpsUiTime || now - fpsCounterEl._fpsUiTime >= 50)) {
        fpsCounterEl.textContent = 'FPS: ' + fpsValue;
        fpsCounterEl._fpsUiTime = now;
    }
}

// ==========================================================
//   ГЛАВНЫЙ ЦИКЛ — С ЗАЩИТОЙ ОТ НАКОПЛЕНИЯ
// ==========================================================
function loop(now) {
    if (!now) now = performance.now();
    updateFpsCounter(now);
    var elapsed = now - lastTime;
    lastTime = now;
    if (elapsed > 100) elapsed = 100;

    var s = getSave();
    var speedMult = s.gameSpeed || 1;
    accumulated += elapsed * speedMult;

    // 🔧 ФИКС: если accumulated накопил слишком много — сбрасываем
    if (accumulated > frameBudget * 3) {
        accumulated = frameBudget;
    }

    // v3.1.5: не допускаем каскад из 2–3 update() за один render-frame.
    // Если устройство не успело обработать кадр, выполняем максимум один
    // игровой тик и сбрасываем накопившийся backlog. Это не меняет механику
    // игры в штатном режиме, но предотвращает CPU-пики и цепную просадку FPS.
    if (accumulated >= frameBudget) {
        try { update(); } catch (e) {
            console.error('❌ update() ERROR:', e.message);
            console.error('   stack:', e.stack);
            running = false;
            if (lastErrorShown !== e.message) {
                lastErrorShown = e.message;
                if (typeof showToast === 'function') showToast('⚠ ' + e.message, 'error');
            }
        }

        accumulated -= frameBudget;

        // Не пытаемся догонять пропущенные тики в этом же кадре.
        // Остаток больше одного тика отбрасываем, чтобы следующая RAF
        // не получила ещё один/два update() подряд.
        if (accumulated >= frameBudget) {
            accumulated = 0;
        }
    }

    try { draw(); } catch (e) {
        console.error('❌ draw() ERROR:', e.message);
    }
    requestAnimationFrame(loop);
}

// ==========================================================
//   ИНИЦИАЛИЗАЦИЯ
// ==========================================================
renderProfilesList();

var savedLogin = getCurrentLogin();
if (savedLogin) {
    var savedProfile = loadProfile(savedLogin);
    if (savedProfile) {
        var profileInfo = getProfiles().find(function(p) { return p.login === savedLogin; });
        if (profileInfo && profileInfo.passHash) {
            loginScreen.classList.remove('hidden');
            startScreen.classList.add('hidden');
        } else {
            enterProfile(savedLogin);
        }
    } else {
        loginScreen.classList.remove('hidden');
        startScreen.classList.add('hidden');
    }
} else {
    loginScreen.classList.remove('hidden');
    startScreen.classList.add('hidden');
}

applyTheme();

console.log('✅ Starfall Dash 2.6 «Roguelike Evolution» — полностью готов!');
console.log('🎲 Рогалик: выбирай апгрейды каждые 15 сек');
console.log('⚡ Синергии: комбинируй для мощных эффектов');
console.log('🏺 Реликвии: открывай сундуки');
console.log('🌊 Волны: каждые 5 уровней — элитный модификатор');
console.log('🔧 ВСЕ ФИКСЫ БАГОВ ВНЕДРЕНЫ');

lastTime = performance.now();
requestAnimationFrame(loop);