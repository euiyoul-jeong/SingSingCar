import Phaser from 'phaser';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { GAME_H, GAME_W } from './config.js';
import { sfx } from './audio/Sfx.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { GameScene } from './scenes/GameScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { ResultScene } from './scenes/ResultScene.js';

// 첫 터치/키 입력 때 소리를 켠다 (브라우저 자동재생 정책)
window.addEventListener('pointerdown', () => sfx.unlock());
window.addEventListener('keydown', () => sfx.unlock());

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#2e7d32',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,
  },
  scene: [BootScene, TitleScene, GameScene, PauseScene, ResultScene],
});

// 안드로이드 뒤로 가기: 게임 중이면 멈춤, 멈춤 창이면 계속, 결과면 시작 화면, 시작 화면이면 앱 종료
if (Capacitor.isNativePlatform()) {
  App.addListener('backButton', () => {
    const active = game.scene.getScenes(true).map((s) => s.scene.key);
    if (active.includes('Pause')) game.scene.getScene('Pause').resumeGame();
    else if (active.includes('Game')) game.scene.getScene('Game').pauseGame();
    else if (active.includes('Result')) game.scene.getScene('Result').scene.start('Title');
    else App.exitApp();
  });
}

// 디버그·자동 테스트용
window.__game = game;
