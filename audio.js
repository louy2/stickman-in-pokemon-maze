// ==================== 音频管理器 ====================

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.currentMusic = null;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.isPlaying = false;
        this.currentTrack = null;

        // Music parameters for different scenes
        this.musicParams = {
            dungeon: {
                baseFreq: 110,
                scale: [0, 2, 3, 5, 7, 8, 10], // Minor scale
                tempo: 0.5,
                atmosphere: 'dark'
            },
            surface: {
                baseFreq: 130,
                scale: [0, 2, 4, 5, 7, 9, 11], // Major scale
                tempo: 0.6,
                atmosphere: 'tense'
            },
            boss: {
                baseFreq: 82,
                scale: [0, 1, 4, 5, 7, 8, 10], // Phrygian scale
                tempo: 0.8,
                atmosphere: 'intense'
            },
            victory: {
                baseFreq: 196,
                scale: [0, 4, 7, 12],
                tempo: 1.0,
                atmosphere: 'bright'
            },
            gameover: {
                baseFreq: 98,
                scale: [0, 3, 6, 9],
                tempo: 0.3,
                atmosphere: 'sad'
            }
        };
    }

    init() {
        // Create audio context on user interaction
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);

            // Music gain
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = 0.5;
            this.musicGain.connect(this.masterGain);

            // SFX gain
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = 0.6;
            this.sfxGain.connect(this.masterGain);
        }

        // Resume if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Generate a note frequency
    getFrequency(baseFreq, semitones) {
        return baseFreq * Math.pow(2, semitones / 12);
    }

    // Create an oscillator with envelope
    createNote(freq, duration, type = 'sine', startTime = 0, gain = 0.1) {
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        osc.connect(gainNode);
        gainNode.connect(this.musicGain);

        const now = this.audioContext.currentTime + startTime;

        // ADSR envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(gain, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(gain * 0.7, now + duration * 0.3);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);

        osc.start(now);
        osc.stop(now + duration);

        return osc;
    }

    // Create ambient pad sound
    createPad(freq, duration, startTime = 0) {
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const filter = this.audioContext.createBiquadFilter();
        const gainNode = this.audioContext.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.value = freq;
        osc2.frequency.value = freq * 1.005; // Slight detune for thickness

        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.musicGain);

        const now = this.audioContext.currentTime + startTime;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.08, now + duration * 0.3);
        gainNode.gain.linearRampToValueAtTime(0.05, now + duration * 0.7);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
    }

    // Create bass note
    createBass(freq, duration, startTime = 0) {
        const osc = this.audioContext.createOscillator();
        const filter = this.audioContext.createBiquadFilter();
        const gainNode = this.audioContext.createGain();

        osc.type = 'sawtooth';
        osc.frequency.value = freq / 2;

        filter.type = 'lowpass';
        filter.frequency.value = 200;

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.musicGain);

        const now = this.audioContext.currentTime + startTime;

        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + duration * 0.5);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    }

    // Generate a music loop
    generateMusicLoop(trackName) {
        if (!this.audioContext || !this.musicEnabled) return;

        const params = this.musicParams[trackName];
        if (!params) return;

        const loopDuration = 8; // 8 seconds per loop
        const beatDuration = loopDuration / 16;

        // Generate melody pattern
        for (let i = 0; i < 16; i++) {
            const time = i * beatDuration;

            // Bass on beats 0, 4, 8, 12
            if (i % 4 === 0) {
                const bassNote = params.scale[Math.floor(Math.random() * 3)];
                this.createBass(this.getFrequency(params.baseFreq, bassNote), beatDuration * 3, time);
            }

            // Pad every 4 beats
            if (i % 4 === 0) {
                const padNote = params.scale[Math.floor(Math.random() * params.scale.length)];
                this.createPad(this.getFrequency(params.baseFreq * 2, padNote), beatDuration * 4, time);
            }

            // Melody notes
            if (Math.random() < params.tempo) {
                const noteIndex = Math.floor(Math.random() * params.scale.length);
                const note = params.scale[noteIndex];
                const octave = Math.random() < 0.3 ? 12 : 0;
                const freq = this.getFrequency(params.baseFreq * 2, note + octave);
                const type = params.atmosphere === 'dark' ? 'triangle' : 'sine';
                this.createNote(freq, beatDuration * (Math.random() * 2 + 0.5), type, time, 0.06);
            }
        }

        // Schedule next loop
        if (this.isPlaying && this.currentTrack === trackName) {
            this.musicTimeout = setTimeout(() => {
                this.generateMusicLoop(trackName);
            }, loopDuration * 1000 - 100);
        }
    }

    // Play background music
    playMusic(trackName) {
        this.init();

        if (!this.musicEnabled) return;

        // Stop current music
        this.stopMusic();

        this.isPlaying = true;
        this.currentTrack = trackName;

        // Start the loop
        this.generateMusicLoop(trackName);
    }

    // Stop music
    stopMusic() {
        this.isPlaying = false;
        this.currentTrack = null;

        if (this.musicTimeout) {
            clearTimeout(this.musicTimeout);
            this.musicTimeout = null;
        }
    }

    // Play sound effect
    playSFX(type) {
        if (!this.sfxEnabled) return;
        this.init();

        switch (type) {
            case 'attack':
                this.playAttackSound();
                break;
            case 'hit':
                this.playHitSound();
                break;
            case 'pickup':
                this.playPickupSound();
                break;
            case 'levelup':
                this.playLevelUpSound();
                break;
            case 'stairs':
                this.playStairsSound();
                break;
            case 'heal':
                this.playHealSound();
                break;
            case 'victory':
                this.playVictorySound();
                break;
            case 'defeat':
                this.playDefeatSound();
                break;
            case 'boss':
                this.playBossIntroSound();
                break;
        }
    }

    playAttackSound() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    playHitSound() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.15);

        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);
    }

    playPickupSound() {
        const now = this.audioContext.currentTime;
        [440, 554, 659].forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, now + i * 0.05);
            gain.gain.linearRampToValueAtTime(0.1, now + i * 0.05 + 0.02);
            gain.gain.linearRampToValueAtTime(0, now + i * 0.05 + 0.15);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.15);
        });
    }

    playLevelUpSound() {
        const now = this.audioContext.currentTime;
        [262, 330, 392, 523].forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.05);
            gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.3);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    }

    playStairsSound() {
        const now = this.audioContext.currentTime;
        [196, 262, 330].forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.1, now + i * 0.08);
            gain.gain.linearRampToValueAtTime(0, now + i * 0.08 + 0.2);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.2);
        });
    }

    playHealSound() {
        const now = this.audioContext.currentTime;
        [392, 494, 587, 784].forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.08, now + i * 0.12);
            gain.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.25);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.25);
        });
    }

    playVictorySound() {
        const now = this.audioContext.currentTime;
        const melody = [523, 659, 784, 1047, 784, 1047];
        melody.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.12, now + i * 0.15);
            gain.gain.linearRampToValueAtTime(0, now + i * 0.15 + 0.3);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.3);
        });
    }

    playDefeatSound() {
        const now = this.audioContext.currentTime;
        [392, 370, 349, 330].forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sawtooth';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.08, now + i * 0.2);
            gain.gain.linearRampToValueAtTime(0, now + i * 0.2 + 0.4);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + i * 0.2);
            osc.stop(now + i * 0.2 + 0.4);
        });
    }

    playBossIntroSound() {
        const now = this.audioContext.currentTime;

        // Dramatic low rumble
        const noise = this.audioContext.createOscillator();
        const noiseGain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        noise.type = 'sawtooth';
        noise.frequency.setValueAtTime(40, now);
        noise.frequency.linearRampToValueAtTime(80, now + 1);

        filter.type = 'lowpass';
        filter.frequency.value = 100;

        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.2, now + 0.3);
        noiseGain.gain.linearRampToValueAtTime(0, now + 1);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 1);

        // Dramatic chord
        [82, 98, 123, 147].forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sawtooth';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, now + 0.5);
            gain.gain.linearRampToValueAtTime(0.1, now + 0.7);
            gain.gain.linearRampToValueAtTime(0.05, now + 1.5);
            gain.gain.linearRampToValueAtTime(0, now + 2);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + 0.5);
            osc.stop(now + 2);
        });
    }

    // Toggle music
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;

        if (!this.musicEnabled) {
            this.stopMusic();
        }

        return this.musicEnabled;
    }

    // Toggle SFX
    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    }

    // Set master volume
    setVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, value));
        }
    }
}

// Global audio manager instance
const audioManager = new AudioManager();
