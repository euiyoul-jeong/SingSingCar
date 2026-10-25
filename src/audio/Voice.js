import { sfx } from './Sfx.js';

// 브라우저 내장 음성(TTS)으로 미션 문구를 읽어 준다.
// 한국어 음성이 없는 환경에서는 조용히 넘어간다 (화면 글자만으로도 진행 가능).
// Android(Capacitor) 앱에서는 WebView에 speechSynthesis가 없으므로 TTS 플러그인으로 바꿔야 한다.

const EMOJI = /\p{Extended_Pictographic}|️/gu;

class Voice {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voice = null;
    if (!this.synth) return;
    const choose = () => {
      const voices = this.synth.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('ko'));
      // 자연스러운 온라인 음성이 있으면 우선
      this.voice = voices.find((v) => /natural|online/i.test(v.name)) || voices[0] || null;
    };
    choose();
    this.synth.addEventListener?.('voiceschanged', choose);
  }

  get available() {
    return !!this.voice;
  }

  say(text, { interrupt = true } = {}) {
    if (!this.voice || sfx.muted || !text) return;
    const clean = text.replace(EMOJI, '').replace(/\n/g, ' ').trim();
    if (!clean) return;
    if (interrupt) this.synth.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.voice = this.voice;
    u.lang = this.voice.lang;
    u.rate = 0.95;
    u.pitch = 1.15;
    u.onstart = () => sfx.duck(true);
    u.onend = () => sfx.duck(false);
    u.onerror = () => sfx.duck(false);
    this.synth.speak(u);
  }

  stop() {
    this.synth?.cancel();
    sfx.duck(false);
  }
}

export const voice = new Voice();
