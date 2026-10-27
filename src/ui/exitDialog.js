import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { GAME_H, GAME_W } from '../config.js';
import { sfx } from '../audio/Sfx.js';
import { voice } from '../audio/Voice.js';
import { makeButton, makeText } from './widgets.js';

const DEPTH = 500;

// 아래 화면 터치를 막는 반투명 막
function makeCover(scene, alpha) {
  return scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, alpha).setInteractive();
}

// "그만할까요?" 확인 창. 열려 있는 동안은 키보드를 꺼서 ENTER로 게임이 시작되지 않게 한다
export function openExitDialog(scene) {
  if (scene.exitDialog) return;
  const layer = scene.add.container(0, 0).setDepth(DEPTH);
  scene.exitDialog = layer;
  scene.input.keyboard.enabled = false;

  const panel = scene.add.graphics();
  panel.fillStyle(0xffffff, 1);
  panel.fillRoundedRect(80, 400, GAME_W - 160, 480, 48);
  layer.add([makeCover(scene, 0.55), panel, makeText(scene, GAME_W / 2, 520, '그만할까요?', 72, '#37474f')]);

  const reset = () => {
    scene.exitDialog = null;
    scene.input.keyboard.enabled = true;
  };
  const close = () => {
    layer.destroy();
    reset();
    scene.events.off('shutdown', reset);
  };
  // 작별 화면에서 다른 화면으로 넘어가도 다음에 이 화면에 오면 키보드가 되살아나게
  scene.events.once('shutdown', reset);
  layer.add([
    makeButton(scene, 215, 730, '네', { color: 0xe53935, width: 240, onClick: () => quitApp(scene) }),
    makeButton(scene, 505, 730, '아니요', { color: 0x43a047, width: 240, fontSize: 52, onClick: close }),
  ]);
}

// 앱은 바로 끄고, 웹은 탭을 닫아 보고 안 닫히면 작별 화면을 띄운다 (누르면 시작 화면)
function quitApp(scene) {
  sfx.stopBgm();
  voice.stop();
  if (Capacitor.isNativePlatform()) {
    App.exitApp();
    return;
  }
  window.close();

  const bye = scene.add.container(0, 0).setDepth(DEPTH + 1);
  const cover = makeCover(scene, 1).setFillStyle(0x81d4fa);
  bye.add([
    cover,
    makeText(scene, GAME_W / 2, 480, '👋', 180, '#ffffff'),
    makeText(scene, GAME_W / 2, 700, '다음에 또 만나요!', 80, '#ffeb3b', { stroke: '#37474f', strokeThickness: 12 }),
    makeText(scene, GAME_W / 2, 840, '누르면 다시 놀 수 있어요', 44, '#37474f'),
  ]);
  cover.once('pointerup', () => scene.scene.start('Title'));
}
