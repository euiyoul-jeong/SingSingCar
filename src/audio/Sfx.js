import { STORAGE_KEYS } from '../config.js';
import { storage } from '../storage.js';

// 소리 파일 없이 WebAudio로 효과음과 배경음악을 합성한다

const MASTER_VOL = 0.8;

// 배경음악: 8분음표 32개(4마디) 멜로디 + 4분음표 베이스, MIDI 번호 (null = 쉼표)
const MELODY = [
  72, 76, 79, 76, 81, 79, 76, null,
  77, 81, 84, 81, 79, null, 76, null,
  74, 77, 81, 77, 79, 77, 76, 74,
  72, null, 76, null, 72, null, null, null,
];
const BASS = [
  48, 55, 48, 55,
  53, 60, 48, 55,
  43, 50, 43, 50,
  48, 55, 48, 48,
];
const BPM = 132;

const midiToFreq = (n) => 440 * Math.pow(2, (n - 69) / 12);

class Sfx {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = storage.get(STORAGE_KEYS.muted) === '1';
    this.bgmTimer = null;
    this.step = 0;
    this.nextTime = 0;
  }

  // 브라우저 자동재생 정책 때문에 사용자 입력 뒤에 호출해야 한다
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : MASTER_VOL;
      this.master.connect(this.ctx.destination);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.ctx.suspend();
        else this.ctx.resume();
      });
    }
    if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume();
  }

  setMuted(muted) {
    this.muted = muted;
    storage.set(STORAGE_KEYS.muted, muted ? '1' : '0');
    if (this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : MASTER_VOL, this.ctx.currentTime, 0.02);
    }
  }

  tone(freq, start, dur, { type = 'sine', vol = 0.3, slide = null } = {}) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(this.master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  noise(start, dur, vol) {
    const ctx = this.ctx;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(start);
  }

  star() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(988, t, 0.12, { type: 'triangle', vol: 0.35 });
    this.tone(1319, t + 0.08, 0.25, { type: 'triangle', vol: 0.35 });
  }

  crash() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(200, t, 0.35, { type: 'sawtooth', vol: 0.2, slide: 60 });
    this.noise(t, 0.25, 0.35);
  }

  move() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(520, t, 0.07, { type: 'square', vol: 0.06, slide: 760 });
  }

  honk() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const offset of [0, 0.24]) {
      this.tone(415, t + offset, 0.18, { type: 'square', vol: 0.1 });
      this.tone(523, t + offset, 0.18, { type: 'square', vol: 0.1 });
    }
  }

  praise() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => {
      this.tone(f, t + i * 0.1, 0.22, { type: 'triangle', vol: 0.3 });
    });
  }

  click() {
    if (!this.ctx) return;
    this.tone(660, this.ctx.currentTime, 0.08, { type: 'triangle', vol: 0.25 });
  }

  startBgm() {
    this.unlock();
    if (!this.ctx || this.bgmTimer) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.bgmTimer = setInterval(() => this.scheduleBgm(), 50);
  }

  stopBgm() {
    clearInterval(this.bgmTimer);
    this.bgmTimer = null;
  }

  scheduleBgm() {
    const eighth = 60 / BPM / 2;
    // 탭이 오래 숨겨졌다 돌아오면 밀린 음을 몰아서 내지 않도록 건너뛴다
    if (this.nextTime < this.ctx.currentTime - 0.5) this.nextTime = this.ctx.currentTime + 0.05;
    while (this.nextTime < this.ctx.currentTime + 0.25) {
      const i = this.step % MELODY.length;
      const note = MELODY[i];
      if (note) this.tone(midiToFreq(note), this.nextTime, eighth * 0.9, { type: 'square', vol: 0.05 });
      if (i % 2 === 0) {
        const bass = BASS[(i / 2) % BASS.length];
        this.tone(midiToFreq(bass), this.nextTime, eighth * 1.8, { type: 'triangle', vol: 0.12 });
      }
      this.nextTime += eighth;
      this.step++;
    }
  }
}

export const sfx = new Sfx();
