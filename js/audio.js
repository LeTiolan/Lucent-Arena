// js/audio.js

export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = audioCtx.createGain();
const musicGain = audioCtx.createGain();
const sfxGain = audioCtx.createGain();

masterGain.connect(audioCtx.destination);
musicGain.connect(masterGain);
sfxGain.connect(masterGain);

masterGain.gain.value = 0.5;
musicGain.gain.value = 0.5;
sfxGain.gain.value = 0.5;

export const AudioSystem = {
    init: () => {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        AudioSystem.startBGM();
    },

    setMasterVolume: (val) => { masterGain.gain.value = val / 100; },
    setMusicVolume: (val) => { musicGain.gain.value = val / 100; },
    setSFXVolume: (val) => { sfxGain.gain.value = val / 100; },

    playShoot: () => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    },

    playHit: () => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    },

    playKill: () => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    },

    playLevelUp: () => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.2);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
    },

    startBGM: () => {
        const osc = audioCtx.createOscillator();
        const lfo = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = 110; // A2

        lfo.type = 'sine';
        lfo.frequency.value = 0.2; // Slow modulation

        filter.type = 'lowpass';
        filter.frequency.value = 400;

        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 100;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        gain.gain.value = 0.15;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(musicGain);

        osc.start();
        lfo.start();
    }
};
