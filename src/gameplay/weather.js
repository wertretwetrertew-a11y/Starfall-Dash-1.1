// ==========================================================
// STARFALL DASH — GAMEPLAY MODULE
// Extracted from legacy gameplay.js; global API intentionally preserved.
// ==========================================================

// ===== ПОГОДА =====
function initWeather() {
    var s = getSave();
    var t = THEMES[s.equippedTheme] || THEMES.cosmos;
    weatherType = t.weather || 'stars';
    weatherParticles = [];
    if (!s.showWeather) return;

    var count = 0;
    if (weatherType === 'ember') count = 40;
    else if (weatherType === 'bubbles') count = 30;
    else if (weatherType === 'matrix') count = 60;
    else if (weatherType === 'clouds') count = 8;
    else if (weatherType === 'sparks') count = 25;
    else if (weatherType === 'neon') count = 15;
    else count = 0;

    for (var i = 0; i < count; i++) {
        weatherParticles.push(makeWeatherParticle(weatherType, true));
    }
}

function makeWeatherParticle(type, initial) {
    var p = { type: type, life: 1 };
    if (type === 'ember') {
        p.x = Math.random() * 600;
        p.y = initial ? Math.random() * 400 : 420;
        p.vx = (Math.random() - 0.5) * 0.8;
        p.vy = -0.5 - Math.random() * 1.2;
        p.size = 1 + Math.random() * 2.5;
        p.color = Math.random() < 0.5 ? '#ff5722' : '#ffab91';
    } else if (type === 'bubbles') {
        p.x = Math.random() * 600;
        p.y = initial ? Math.random() * 400 : 420;
        p.vx = (Math.random() - 0.5) * 0.4;
        p.vy = -0.8 - Math.random() * 1.5;
        p.size = 2 + Math.random() * 4;
        p.color = '#88ffff';
        p.wobble = Math.random() * Math.PI * 2;
    } else if (type === 'matrix') {
        p.x = Math.floor(Math.random() * 40) * 15;
        p.y = initial ? Math.random() * 400 : -20;
        p.vx = 0;
        p.vy = 1.5 + Math.random() * 2.5;
        p.size = 10;
        p.char = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
        p.color = '#00ff41';
    } else if (type === 'clouds') {
        p.x = Math.random() * 600;
        p.y = initial ? Math.random() * 200 : -50;
        p.vx = 0.2 + Math.random() * 0.3;
        p.vy = 0;
        p.size = 60 + Math.random() * 80;
        p.color = 'rgba(255,255,255,0.06)';
    } else if (type === 'sparks') {
        p.x = Math.random() * 600;
        p.y = Math.random() * 400;
        p.vx = (Math.random() - 0.5) * 0.3;
        p.vy = (Math.random() - 0.5) * 0.3;
        p.size = 1 + Math.random() * 2;
        p.color = '#88aaff';
        p.twinkle = Math.random() * Math.PI * 2;
    } else if (type === 'neon') {
        p.x = Math.floor(Math.random() * 30) * 20;
        p.y = Math.floor(Math.random() * 20) * 20;
        p.size = 3;
        p.color = Math.random() < 0.5 ? '#ff00ff' : '#00ffcc';
        p.twinkle = Math.random() * Math.PI * 2;
    }
    return p;
}

function updateWeather() {
    var s = getSave();
    if (!s.showWeather) return;

    for (var i = weatherParticles.length - 1; i >= 0; i--) {
        var p = weatherParticles[i];
        if (p.type === 'ember') {
            p.x += p.vx; p.y += p.vy; p.vy += 0.01;
            if (p.y < -20 || p.y > 420) weatherParticles.splice(i, 1);
        } else if (p.type === 'bubbles') {
            p.wobble += 0.05;
            p.x += Math.sin(p.wobble) * 0.5 + p.vx;
            p.y += p.vy;
            if (p.y < -20) weatherParticles.splice(i, 1);
        } else if (p.type === 'matrix') {
            p.y += p.vy; p.life -= 0.008;
            if (p.y > 420) weatherParticles.splice(i, 1);
        } else if (p.type === 'clouds') {
            p.x += p.vx;
            if (p.x > 650) weatherParticles.splice(i, 1);
        } else if (p.type === 'sparks') {
            p.x += p.vx; p.y += p.vy; p.twinkle += 0.1;
            if (p.x < 0 || p.x > 600 || p.y < 0 || p.y > 400) weatherParticles.splice(i, 1);
        } else if (p.type === 'neon') {
            p.twinkle += 0.08;
        }
    }

    if (frame % 8 === 0) {
        var count = 0;
        if (weatherType === 'ember') count = 2;
        else if (weatherType === 'bubbles') count = 1;
        else if (weatherType === 'matrix') count = 3;
        else if (weatherType === 'sparks') count = 1;
        for (var j = 0; j < count; j++) {
            if (weatherParticles.length < 80) {
                weatherParticles.push(makeWeatherParticle(weatherType, false));
            }
        }
    }
    if (weatherType === 'clouds' && weatherParticles.length < 8 && frame % 120 === 0) {
        weatherParticles.push(makeWeatherParticle('clouds', false));
    }
    if (weatherType === 'neon' && weatherParticles.length < 15 && frame % 60 === 0) {
        weatherParticles.push(makeWeatherParticle('neon', false));
    }
}

function drawWeather() {
    var s = getSave();
    if (!s.showWeather) return;
    for (var i = 0; i < weatherParticles.length; i++) {
        var p = weatherParticles[i];
        if (p.type === 'ember') {
            ctx.globalAlpha = 0.7;
            ctx.shadowColor = p.color; ctx.shadowBlur = sfShadow(8);
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        } else if (p.type === 'bubbles') {
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = p.color; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.stroke();
        } else if (p.type === 'matrix') {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
            ctx.shadowColor = '#00ff41'; ctx.shadowBlur = sfShadow(6);
            ctx.fillText(p.char, p.x, p.y);
        } else if (p.type === 'clouds') {
            var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            grad.addColorStop(0, p.color); grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        } else if (p.type === 'sparks') {
            ctx.globalAlpha = 0.4 + Math.sin(p.twinkle) * 0.4;
            ctx.shadowColor = p.color; ctx.shadowBlur = sfShadow(6);
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        } else if (p.type === 'neon') {
            ctx.globalAlpha = 0.3 + Math.sin(p.twinkle) * 0.3;
            ctx.shadowColor = p.color; ctx.shadowBlur = sfShadow(10);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = sfShadow(0);
    // One save/restore for the whole weather pass is enough; particles do not transform the canvas.
}

// ==========================================================