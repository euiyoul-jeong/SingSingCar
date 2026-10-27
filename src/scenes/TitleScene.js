import Phaser from 'phaser';
import {
  DEFAULT_MODE,
  GAME_H,
  GAME_W,
  MISSION_GOAL,
  MODES,
  PLAYER_CARS,
  ROAD_W,
  ROAD_X,
  SPEED_PRESETS,
  STORAGE_KEYS,
} from '../config.js';
import { sfx } from '../audio/Sfx.js';
import { loadMissionGoal, loadSpeed, storage } from '../storage.js';
import { openExitDialog } from '../ui/exitDialog.js';
import { makeButton, makeText } from '../ui/widgets.js';

const CARD_W = 260;
const CARD_H = 200;
const CARD_POS = [
  [215, 455],
  [505, 455],
  [215, 670],
  [505, 670],
];
const IMG_Y = -20;
const MODE_Y = 845;
const GOAL_Y = 935;
const SPEED_Y = 1025;
const SPEED_KEYS = Object.keys(SPEED_PRESETS);
const MODE_KEYS = Object.keys(MODES);
const SUBTITLE = {
  mission: '차를 피하고 미션을 해결해요!',
  dodge: '별이 없어질 때까지 차를 피해요!',
};
const outline = (n) => ({ stroke: '#37474f', strokeThickness: n });

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    this.road = this.add.tileSprite(ROAD_X + ROAD_W / 2, GAME_H / 2, ROAD_W, GAME_H, 'road');
    this.add.tileSprite(ROAD_X / 2, GAME_H / 2, ROAD_X, GAME_H, 'grass');
    this.add.tileSprite(GAME_W - ROAD_X / 2, GAME_H / 2, ROAD_X, GAME_H, 'grass').setFlipX(true);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.25);

    // 제목: 작은 "영우의" + 큰 "씽씽 자동차"
    const owner = makeText(this, GAME_W / 2, 72, '영우의', 50, '#ffffff', outline(10));
    const title = makeText(this, GAME_W / 2, 150, '씽씽 자동차', 100, '#ffeb3b', outline(14));
    this.tweens.add({ targets: [owner, title], y: '+=10', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    // 오른쪽 위 X: 게임 끝내기 (제목과 겹치지 않게 조금 작게)
    const exit = this.add.image(660, 60, 'icon_close').setScale(0.8).setInteractive({ useHandCursor: true });
    exit.on('pointerup', () => {
      sfx.unlock();
      sfx.click();
      openExitDialog(this);
    });
    this.subtitle = makeText(this, GAME_W / 2, 238, '', 46, '#ffffff', outline(8));
    makeText(this, GAME_W / 2, 315, '내 차를 골라요', 50, '#ffffff', outline(8));

    const saved = PLAYER_CARS.findIndex((c) => c.key === storage.get(STORAGE_KEYS.car));
    this.selected = saved >= 0 ? saved : 0;
    this.cards = PLAYER_CARS.map((car, i) => this.makeCard(car, i));
    this.refreshCards();

    const savedMode = storage.get(STORAGE_KEYS.mode);
    this.mode = MODE_KEYS.includes(savedMode) ? savedMode : DEFAULT_MODE;
    this.modePicker = this.makeSegments(MODE_Y, '놀이', MODE_KEYS.map((k) => [k, MODES[k].name]), (k) => this.setMode(k));

    this.missionGoal = loadMissionGoal();
    this.makeGoalStepper();

    this.speedKey = loadSpeed();
    this.speedPicker = this.makeSegments(SPEED_Y, '속도', SPEED_KEYS.map((k) => [k, SPEED_PRESETS[k].name]), (k) =>
      this.setSpeed(k),
    );
    this.speedPicker.refresh(this.speedKey);

    makeButton(this, GAME_W / 2, 1135, '시작!', { width: 420, height: 120, fontSize: 68, onClick: () => this.start() });
    this.bestText = makeText(this, GAME_W / 2, 1240, '', 42, '#ffffff', outline(6));

    this.refreshMode();

    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => this.select((this.selected + 3) % 4));
    kb.on('keydown-RIGHT', () => this.select((this.selected + 1) % 4));
    kb.on('keydown-UP', () => this.select((this.selected + 2) % 4));
    kb.on('keydown-DOWN', () => this.select((this.selected + 2) % 4));
    kb.on('keydown-MINUS', () => this.changeGoal(-1));
    kb.on('keydown-NUMPAD_SUBTRACT', () => this.changeGoal(-1));
    kb.on('keydown-PLUS', () => this.changeGoal(1));
    kb.on('keydown-NUMPAD_ADD', () => this.changeGoal(1));
    kb.on('keydown-S', () => this.setSpeed(SPEED_KEYS[(SPEED_KEYS.indexOf(this.speedKey) + 1) % SPEED_KEYS.length]));
    kb.on('keydown-M', () => this.setMode(MODE_KEYS[(MODE_KEYS.indexOf(this.mode) + 1) % MODE_KEYS.length]));
    kb.on('keydown-ENTER', () => this.start());
    kb.on('keydown-SPACE', () => this.start());
  }

  makeCard(car, i) {
    const [x, y] = CARD_POS[i];
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    const img = this.add.image(0, IMG_Y, car.key);
    img.setScale(Math.min(1, 125 / img.height));
    const label = makeText(this, 0, 72, car.name, 40, '#37474f');
    container.add([bg, img, label]);
    container.setSize(CARD_W, CARD_H);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerup', () => {
      sfx.unlock();
      this.select(i);
    });
    return { container, bg, img };
  }

  select(i) {
    if (i === this.selected) return;
    this.selected = i;
    storage.set(STORAGE_KEYS.car, PLAYER_CARS[i].key);
    sfx.click();
    this.refreshCards();
  }

  refreshCards() {
    this.cards.forEach(({ container, bg, img }, i) => {
      const on = i === this.selected;
      bg.clear();
      bg.fillStyle(0x000000, 0.25);
      bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2 + 8, CARD_W, CARD_H, 32);
      bg.fillStyle(on ? 0xfff59d : 0xffffff, 1);
      bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 32);
      bg.lineStyle(on ? 12 : 4, on ? 0xff9800 : 0x90a4ae);
      bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 32);
      this.tweens.killTweensOf([container, img]);
      container.setScale(1);
      img.setY(IMG_Y);
      if (on) {
        this.tweens.add({ targets: container, scale: 1.06, duration: 150, ease: 'Back.Out' });
        this.tweens.add({ targets: img, y: IMG_Y - 12, duration: 350, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      }
    });
  }

  // 놀이·미션 개수·속도 줄의 흰 알약 바탕
  makePill(y) {
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.25);
    bg.fillRoundedRect(120, y - 42 + 6, 480, 84, 42);
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(120, y - 42, 480, 84, 42);
    return bg;
  }

  // "이름 [A][B][C]" 고르기 줄. items: [키, 글자]. 고른 칸은 주황 바탕에 흰 글씨
  makeSegments(y, name, items, onPick) {
    this.makePill(y);
    makeText(this, 195, y, name, 46, '#37474f');
    const left = 250;
    const width = 340;
    const w = width / items.length - 8;
    const buttons = items.map(([key, text], i) => {
      const c = this.add.container(left + (width / items.length) * (i + 0.5), y);
      const bg = this.add.graphics();
      const label = makeText(this, 0, 0, text, 36, '#37474f');
      c.add([bg, label]);
      c.setSize(w + 4, 66);
      c.setInteractive({ useHandCursor: true });
      c.on('pointerup', () => {
        sfx.unlock();
        onPick(key);
      });
      return { key, bg, label };
    });
    return {
      refresh(current) {
        for (const { key, bg, label } of buttons) {
          const on = key === current;
          bg.clear();
          bg.fillStyle(on ? 0xff9800 : 0xeceff1, 1);
          bg.fillRoundedRect(-w / 2, -31, w, 62, 31);
          label.setColor(on ? '#ffffff' : '#78909c');
        }
      },
    };
  }

  // "미션 ◀ 5 ▶ 개" — 한 판에 할 미션 개수 (피하기 놀이에서는 흐리게, 누를 수 없음)
  makeGoalStepper() {
    const pill = this.makePill(GOAL_Y);
    const label = makeText(this, 195, GOAL_Y, '미션', 46, '#37474f');
    const unit = makeText(this, 548, GOAL_Y, '개', 46, '#37474f');
    this.goalText = makeText(this, 385, GOAL_Y, '', 64, '#ff6f00');
    this.goalDown = this.makeArrowButton(300, GOAL_Y, -1);
    this.goalUp = this.makeArrowButton(470, GOAL_Y, 1);
    this.goalParts = [pill, label, unit, this.goalText];
    this.refreshGoal();
  }

  makeArrowButton(x, y, dir) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0xff9800, 1);
    g.fillCircle(0, 0, 36);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(dir * 16, 0, -dir * 10, -16, -dir * 10, 16);
    c.add(g);
    c.setSize(84, 84);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => this.tweens.add({ targets: c, scale: 0.88, duration: 60 }));
    c.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 80 }));
    c.on('pointerup', () => {
      this.tweens.add({ targets: c, scale: 1, duration: 80 });
      sfx.unlock();
      this.changeGoal(dir);
    });
    return c;
  }

  changeGoal(dir) {
    if (this.mode !== 'mission') return;
    const next = Phaser.Math.Clamp(this.missionGoal + dir, MISSION_GOAL.min, MISSION_GOAL.max);
    if (next === this.missionGoal) return;
    this.missionGoal = next;
    storage.set(STORAGE_KEYS.missionGoal, next);
    sfx.click();
    this.refreshGoal();
    this.tweens.add({ targets: this.goalText, scale: 1.3, duration: 90, yoyo: true });
  }

  refreshGoal() {
    this.goalText.setText(String(this.missionGoal));
    const active = this.mode !== 'dodge';
    for (const part of this.goalParts) part.setAlpha(active ? 1 : 0.35);
    // 끝값에서는 더 못 누른다는 걸 흐리게 보여 준다
    this.goalDown.setAlpha(active && this.missionGoal > MISSION_GOAL.min ? 1 : 0.35);
    this.goalUp.setAlpha(active && this.missionGoal < MISSION_GOAL.max ? 1 : 0.35);
  }

  setSpeed(key) {
    if (key === this.speedKey) return;
    this.speedKey = key;
    storage.set(STORAGE_KEYS.speed, key);
    sfx.click();
    this.speedPicker.refresh(key);
  }

  setMode(key) {
    if (key === this.mode) return;
    this.mode = key;
    storage.set(STORAGE_KEYS.mode, key);
    sfx.click();
    this.refreshMode();
  }

  // 놀이에 따라 바뀌는 것: 부제, 미션 개수 줄, 최고 기록 줄
  refreshMode() {
    this.modePicker.refresh(this.mode);
    this.subtitle.setText(SUBTITLE[this.mode]);
    if (this.goalParts) this.refreshGoal();
    const dodge = this.mode === 'dodge';
    const best = Number(storage.get(dodge ? STORAGE_KEYS.bestDodgeM : STORAGE_KEYS.best)) || 0;
    this.bestText.setText(best > 0 ? (dodge ? `최고 기록  🏁 ${best.toLocaleString('ko-KR')}m` : `최고 기록  ★ ${best}`) : '');
  }

  start() {
    sfx.unlock();
    this.scene.start(MODES[this.mode].scene, {
      carKey: PLAYER_CARS[this.selected].key,
      missionGoal: this.missionGoal,
      speed: this.speedKey,
    });
  }

  update(_time, delta) {
    this.road.tilePositionY -= 0.12 * delta;
  }
}
