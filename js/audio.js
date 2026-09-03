/**
 * PokeTrunfo - Audio Engine (Web Audio API Synthesizer)
 * Gera efeitos sonoros arcade e Pokémon sem dependência de arquivos de áudio externos.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.volume = 0.4;
  }

  init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // v vai de 0 a 1
  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
  }

  // Som de clique de botão
  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Som de giro da moeda (Cara ou Coroa)
  playCoinToss() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(900 + (i % 2 === 0 ? 300 : 0), this.ctx.currentTime);
        gain.gain.setValueAtTime(this.volume * 0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
      }, i * 120);
    }
  }

  // Moeda caindo e decidindo
  playCoinLand() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.16); // G5
    osc.frequency.setValueAtTime(1046.50, this.ctx.currentTime + 0.24); // C6

    gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }

  // Som de carta sendo virada / revelada
  playCardFlip() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  // Som de combate / golpe
  playClash() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(this.volume * 0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // Som de vitória de rodada
  playRoundWin() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [587.33, 739.99, 880.00]; // D5, F#5, A5
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
      }, idx * 100);
    });
  }

  // Som de derrota de rodada / dano recebido
  playRoundLoss() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [300, 220, 160];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
      }, idx * 90);
    });
  }

  // Som de evolução brilhante
  playEvolution() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
      }, idx * 80);
    });
  }

  // Som de Vantagem / Super Efetivo (agudo, impactante)
  playSuperEffective() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [587.33, 880, 1174.66, 1760]; // D5, A5, D6, A6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, this.ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
      }, idx * 45);
    });
  }

  // Som de Desvantagem / Pouco Efetivo / Penalidade (grave, metálico/opaco)
  playNotVeryEffective() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [220, 196, 164.81]; // A3, G3, E3
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(this.volume * 0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
      }, idx * 70);
    });
  }

  // Fanfarra de Vitória Final
  playVictoryFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const sequence = [
      { f: 523.25, d: 0.15 },
      { f: 523.25, d: 0.15 },
      { f: 523.25, d: 0.15 },
      { f: 523.25, d: 0.35 },
      { f: 415.30, d: 0.35 },
      { f: 466.16, d: 0.35 },
      { f: 523.25, d: 0.25 },
      { f: 466.16, d: 0.15 },
      { f: 523.25, d: 0.7 }
    ];

    let timeOffset = 0;
    sequence.forEach(item => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, this.ctx.currentTime);

        gain.gain.setValueAtTime(this.volume * 0.45, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + item.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + item.d);
      }, timeOffset * 1000);
      timeOffset += item.d + 0.02;
    });
  }

  // Som de Abertura de Pacote / Booster
  playBoosterOpen() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
      }, idx * 80);
    });
  }

  // Som ao virar carta com raridade
  playRarityReveal(rank = 'C') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const rankFreqs = {
      C: [523.25],
      B: [523.25, 659.25],
      A: [523.25, 659.25, 783.99],
      S: [523.25, 659.25, 783.99, 1046.50],
      SS: [523.25, 659.25, 783.99, 1046.50, 1318.51]
    };

    const freqs = rankFreqs[rank] || rankFreqs.C;
    freqs.forEach((f, i) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = rank === 'SS' || rank === 'S' ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        gain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
      }, i * 70);
    });
  }

  // Som suave de virar carta
  playCardFlip() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(this.volume * 0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }
}

export const sound = new SoundEngine();
