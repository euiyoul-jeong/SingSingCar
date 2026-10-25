import Phaser from 'phaser';
import { GAME_H, GAME_W, PLAYER_CARS, ROAD_W, ROAD_X, STORAGE_KEYS } from '../config.js';
import { sfx } from '../audio/Sfx.js';
import { storage } from '../storage.js';
import { makeButton, makeText } from '../ui/widgets.js';

const CARD_W = 260;
const CARD_H = 260;
const CARD_POS = [
  [215, 570],
  [505, 570],
  [215, 855],
  [505, 855],
];

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    this.road = this.add.tileSprite(ROAD_X + ROAD_W / 2, GAME_H / 2, ROAD_W, GAME_H, 'road');
    this.add.tileSprite(ROAD_X / 2, GAME_H / 2, ROAD_X, GAME_H, 'grass');
    this.add.tileSprite(GAME_W - ROAD_X / 2, GAME_H / 2, ROAD_X, GAME_H, 'grass').setFlipX(true);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.25);

    const title = makeText(this, GAME_W / 2, 170, '씽씽 자동차', 104, '#ffeb3b', {
      stroke: '#37474f',
      strokeThickness: 14,
    });
    this.tweens.add({ targets: title, y: 185, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    makeText(this, GAME_W / 2, 290, '차를 피하고 미션을 해결해요!', 48, '#ffffff', { stroke: '#37474f', strokeThickness: 8 });
    makeText(this, GAME_W / 2, 400, '내 차를 골라요', 52, '#ffffff', { stroke: '#37474f', strokeThickness: 8 });

    const saved = PLAYER_CARS.findIndex((c) => c.key === storage.get(STORAGE_KEYS.car));
    this.selected = saved >= 0 ? saved : 0;
    this.cards = PLAYER_CARS.map((car, i) => this.makeCard(car, i));
    this.refreshCards();

    makeButton(this, GAME_W / 2, 1110, '시작!', { width: 420, height: 150, fontSize: 76, onClick: () => this.start() });

    const best = Number(storage.get(STORAGE_KEYS.best)) || 0;
    if (best > 0) {
      makeText(this, GAME_W / 2, 1230, `최고 기록  ★ ${best}`, 44, '#ffffff', { stroke: '#37474f', strokeThickness: 6 });
    }

    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => this.select((this.selected + 3) % 4));
    kb.on('keydown-RIGHT', () => this.select((this.selected + 1) % 4));
    kb.on('keydown-UP', () => this.select((this.selected + 2) % 4));
    kb.on('keydown-DOWN', () => this.select((this.selected + 2) % 4));
    kb.on('keydown-ENTER', () => this.start());
    kb.on('keydown-SPACE', () => this.start());
  }

  makeCard(car, i) {
    const [x, y] = CARD_POS[i];
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    const img = this.add.image(0, -30, car.key);
    img.setScale(Math.min(1, 170 / img.height));
    const label = makeText(this, 0, 100, car.name, 44, '#37474f');
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
      img.setY(-30);
      if (on) {
        this.tweens.add({ targets: container, scale: 1.06, duration: 150, ease: 'Back.Out' });
        this.tweens.add({ targets: img, y: -42, duration: 350, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      }
    });
  }

  start() {
    sfx.unlock();
    this.scene.start('Game', { carKey: PLAYER_CARS[this.selected].key });
  }

  update(_time, delta) {
    this.road.tilePositionY -= 0.12 * delta;
  }
}
