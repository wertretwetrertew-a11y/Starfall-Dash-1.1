// ==========================================================
// STARFALL DASH — UI MODULE
// Extracted from legacy meta-ui.js; global API intentionally preserved.
// ==========================================================

//   ЗВУК
// ==========================================================
var audioCtx = null;
var musicTimer = null;
var masterVolume = 0.3;

function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        console.log('✓ AudioContext создан');
    } catch (e) {}
}

function playTone(freq, duration, type, volume, when) {
    if (!audioCtx) return;
    type = type || 'sine';
    volume = (volume || 0.3) * masterVolume;
    when = when || audioCtx.currentTime;
    duration = duration || 0.15;
    try {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, when);
        gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(when);
        osc.stop(when + duration);
    } catch (e) {}
}

function playSFX(name) {
    if (!audioCtx) return;
    var s = getSave();
    var pack = s.equippedSoundPack || 'classic';
    var freq = 880, dur = 0.12, type = 'sine';
    if (pack === 'classic') {
        if (name === 'coin') freq = 880;
        else if (name === 'hit') freq = 220;
        else if (name === 'level') freq = 523;
        else if (name === 'case') freq = 1200;
        else if (name === 'combo') freq = 1300;
        else if (name === 'boss') freq = 110;
        else if (name === 'upgrade') freq = 660;
    } else if (pack === 'piano') {
        type='triangle'; dur=0.4;
        if (name === 'coin') freq = 1047;
        else if (name === 'hit') freq = 262;
        else if (name === 'level') freq = 523;
        else if (name === 'case') freq = 1319;
        else if (name === 'combo') freq = 1568;
        else if (name === 'boss') freq = 131;
        else if (name === 'upgrade') freq = 784;
    } else if (pack === 'retro') {
        type='square'; dur=0.08;
        if (name === 'coin') freq = 1200;
        else if (name === 'hit') freq = 200;
        else if (name === 'level') freq = 600;
        else if (name === 'case') freq = 1500;
        else if (name === 'combo') freq = 1800;
        else if (name === 'boss') freq = 100;
        else if (name === 'upgrade') freq = 700;
    } else if (pack === 'rock') {
        type='sawtooth'; dur=0.2;
        if (name === 'coin') freq = 660;
        else if (name === 'hit') freq = 110;
        else if (name === 'level') freq = 440;
        else if (name === 'case') freq = 880;
        else if (name === 'combo') freq = 990;
        else if (name === 'boss') freq = 82;
        else if (name === 'upgrade') freq = 550;
    } else if (pack === 'space') {
        type='sine'; dur=0.6;
        if (name === 'coin') freq = 784;
        else if (name === 'hit') freq = 196;
        else if (name === 'level') freq = 392;
        else if (name === 'case') freq = 1046;
        else if (name === 'combo') freq = 1175;
        else if (name === 'boss') freq = 98;
        else if (name === 'upgrade') freq = 587;
    } else if (pack === 'synth') {
        type='sawtooth'; dur=0.25;
        if (name === 'coin') freq = 1318;
        else if (name === 'hit') freq = 165;
        else if (name === 'level') freq = 659;
        else if (name === 'case') freq = 1760;
        else if (name === 'combo') freq = 1975;
        else if (name === 'boss') freq = 123;
        else if (name === 'upgrade') freq = 880;
    } else if (pack === 'nature') {
        type='sine'; dur=0.3;
        if (name === 'coin') freq = 1175;
        else if (name === 'hit') freq = 294;
        else if (name === 'level') freq = 587;
        else if (name === 'case') freq = 1480;
        else if (name === 'combo') freq = 1760;
        else if (name === 'boss') freq = 147;
        else if (name === 'upgrade') freq = 784;
    }
    playTone(freq, dur, type, 0.4);
}

function playMelody(notes, tempo) {
    if (!audioCtx) return;
    var t = audioCtx.currentTime;
    for (var i = 0; i < notes.length; i++) {
        playTone(notes[i], tempo / 1000 * 1.5, 'triangle', 0.15, t + i * tempo / 1000);
    }
}

function startMusic() {
    if (!audioCtx || musicTimer) return;
    var s = getSave();
    var track = MUSIC_TRACKS[s.equippedMusic] || MUSIC_TRACKS.default;
    function loopMusic() {
        if (!running || gameOver) { musicTimer = null; return; }
        playMelody(track.notes, track.tempo);
        musicTimer = setTimeout(loopMusic, track.notes.length * track.tempo + 800);
    }
    loopMusic();
}

function stopMusic() {
    if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
}

document.addEventListener('click', function initOnce() { initAudio(); }, { once: true });

// ==========================================================