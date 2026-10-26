import Phaser from 'phaser';
import { GAME_H, GAME_W, MISSION_GOAL, PLAYER_CARS, ROAD_W, ROAD_X, SPEED_PRESETS, STORAGE_KEYS } from '../config.js';
import { sfx } from '../audio/Sfx.js';
import { loadMissionGoal, loadSpeed, storage } from '../storage.js';
import { makeButton, makeText } from '../ui/widgets.js';

const CARD_W = 260;
const CARD_H = 220;
const CARD_POS = [
  [215, 460],
  [505, 460],
  [215, 695],
  [505, 695],
];
const IMG_Y = -22;
const GOAL_Y = 875;
const SPEED_Y = 970;
const SPEED_KEYS = Object.keys(SPEED_PRESETS);

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    this.road = this.add.tileSprite(ROAD_X + ROAD_W / 2, GAME_H / 2, ROAD_W, GAME_H, 'road');
    this.add.tileSprite(ROAD_X / 2, GAME_H / 2, ROAD_X, GAME_H, 'grass');
    this.add.tileSprite(GAME_W - ROAD_X / 2, GAME_H / 2, ROAD_X, GAME_H, 'grass').setFlipX(true);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.25);

    const title = makeText(this, GAME_W / 2, 140, '씽씽 자동차', 104, '#ffeb3b', {
      stroke: '#37474f',
      strokeThickness: 14,
    });
    this.tweens.add({ targets: title, y: 152, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    makeText(this, GAME_W / 2, 235, '차를 피하고 미션을 해결해요!', 48, '#ffffff', { stroke: '#37474f', strokeThickness: 8 });
    makeText(this, GAME_W / 2, 320, '내 차를 골라요', 52, '#ffffff', { stroke: '#37474f', strokeThickness: 8 });

    const saved = PLAYER_CARS.findIndex((c) => c.key === storage.get(STORAGE_KEYS.car));
    this.selected = saved >= 0 ? saved : 0;
    this.cards = PLAYER_CARS.map((car, i) => this.makeCard(car, i));
    this.refreshCards();

    this.missionGoal = loadMissionGoal();
    this.makeGoalStepper();
    this.speedKey = loadSpeed();
    this.makeSpeedPicker();

    makeButton(this, GAME_W / 2, 1092, '시작!', { width: 420, height: 130, fontSize: 72, onClick: () => this.start() });

    const best = Number(storage.get(STORAGE_KEYS.best)) || 0;
    if (best > 0) {
      makeText(this, GAME_W / 2, 1225, `최고 기록  ★ ${best}`, 44, '#ffffff', { stroke: '#37474f', strokeThickness: 6 });
    }

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
    kb.on('keydown-ENTER', () => this.start());
    kb.on('keydown-SPACE', () => this.start());
  }

  makeCard(car, i) {
    const [x, y] = CARD_POS[i];
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    const img = this.add.image(0, IMG_Y, car.key);
    img.setScale(Math.min(1, 140 / img.height));
    const label = makeText(this, 0, 80, car.name, 42, '#37474f');
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

  // 미션 개수·속도 줄의 흰 알약 바탕
  makePill(y) {
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.25);
    bg.fillRoundedRect(120, y - 42 + 6, 480, 84, 42);
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(120, y - 42, 480, 84, 42);
  }

  // "미션 ◀ 5 ▶ 개" — 한 판에 할 미션 개수
  makeGoalStepper() {
    this.makePill(GOAL_Y);
    makeText(this, 195, GOAL_Y, '미션', 46, '#37474f');
    makeText(this, 548, GOAL_Y, '개', 46, '#37474f');
    this.goalText = makeText(this, 385, GOAL_Y, '', 64, '#ff6f00');
    this.goalDown = this.makeArrowButton(300, GOAL_Y, -1);
    this.goalUp = this.makeArrowButton(470, GOAL_Y, 1);
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
    // 끝값에서는 더 못 누른다는 걸 흐리게 보여 준다
    this.goalDown.setAlpha(this.missionGoal > MISSION_GOAL.min ? 1 : 0.35);
    this.goalUp.setAlpha(this.missionGoal < MISSION_GOAL.max ? 1 : 0.35);
  }

  // "속도 [느림][보통][빠름]"
  makeSpeedPicker() {
    this.makePill(SPEED_Y);
    makeText(this, 195, SPEED_Y, '속도', 46, '#37474f');
    this.speedButtons = SPEED_KEYS.map((key, i) => {
      const c = this.add.container(305 + i * 115, SPEED_Y);
      const bg = this.add.graphics();
      const label = makeText(this, 0, 0, SPEED_PRESETS[key].name, 36, '#37474f');
      c.add([bg, label]);
      c.setSize(108, 66);
      c.setInteractive({ useHandCursor: true });
      c.on('pointerup', () => {
        sfx.unlock();
        this.setSpeed(key);
      });
      return { key, bg, label };
    });
    this.refreshSpeed();
  }

  setSpeed(key) {
    if (key === this.speedKey) return;
    this.speedKey = key;
    storage.set(STORAGE_KEYS.speed, key);
    sfx.click();
    this.refreshSpeed();
  }

  refreshSpeed() {
    for (const { key, bg, label } of this.speedButtons) {
      const on = key === this.speedKey;
      bg.clear();
      bg.fillStyle(on ? 0xff9800 : 0xeceff1, 1);
      bg.fillRoundedRect(-52, -31, 104, 62, 31);
      label.setColor(on ? '#ffffff' : '#78909c');
    }
  }

  start() {
    sfx.unlock();
    this.scene.start('Game', {
      carKey: PLAYER_CARS[this.selected].key,
      missionGoal: this.missionGoal,
      speed: this.speedKey,
    });
  }

  update(_time, delta) {
    this.road.tilePositionY -= 0.12 * delta;
  }
}
