import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { sfx } from './Sfx.js';

// 미션 문구를 소리로 읽어 준다.
// - 웹: 브라우저 내장 음성(speechSynthesis). 한국어 음성이 없으면 조용히 넘어간다.
// - 안드로이드 앱: WebView에는 speechSynthesis가 없어서 기기 음성 엔진(TTS 플러그인)을 쓴다.

const EMOJI = /\p{Extended_Pictographic}|️/gu;
const RATE = 0.95;
const PITCH = 1.15;
const NATIVE = Capacitor.isNativePlatform();

class Voice {
  constructor() {
    this.seq = 0;
    this.synth = !NATIVE && typeof window !== 'undefined' ? window.speechSynthesis : null;
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
    return NATIVE || !!this.voice;
  }

  say(text, { interrupt = true } = {}) {
    if (!this.available || sfx.muted || !text) return;
    const clean = text.replace(EMOJI, '').replace(/\n/g, ' ').trim();
    if (!clean) return;
    if (NATIVE) {
      this.sayNative(clean, interrupt);
      return;
    }
    if (interrupt) this.synth.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.voice = this.voice;
    u.lang = this.voice.lang;
    u.rate = RATE;
    u.pitch = PITCH;
    u.onstart = () => sfx.duck(true);
    u.onend = () => sfx.duck(false);
    u.onerror = () => sfx.duck(false);
    this.synth.speak(u);
  }

  // 말이 끝나면(또는 다음 말에 끊기면) Promise가 끝난다. 가장 최근 말이 끝났을 때만 배경음악을 되돌린다
  async sayNative(text, interrupt) {
    const id = ++this.seq;
    if (interrupt) await TextToSpeech.stop().catch(() => {});
    sfx.duck(true);
    try {
      await TextToSpeech.speak({ text, lang: 'ko-KR', rate: RATE, pitch: PITCH, category: 'ambient' });
    } catch {
      // 기기에 한국어 음성이 없으면 글자만으로 진행
    } finally {
      if (id === this.seq) sfx.duck(false);
    }
  }

  stop() {
    this.seq++;
    if (NATIVE) TextToSpeech.stop().catch(() => {});
    else this.synth?.cancel();
    sfx.duck(false);
  }
}

export const voice = new Voice();
