import Phaser from 'phaser';
import {
  GAME_H,
  GAME_W,
  HIT_DX,
  HIT_PAD,
  PRAISE,
  ROAD_W,
  ROAD_X,
  SPEED_STEPS,
  SPEED_UP_MS,
  STAR_DX,
  STAR_DY,
} from '../config.js';
import { sfx } from '../audio/Sfx.js';
import { PlayerCar } from '../objects/PlayerCar.js';
import { Spawner } from '../objects/Spawner.js';
import { Hud } from '../ui/Hud.js';
import { makeText } from '../ui/widgets.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.carKey = data.carKey || 'car_red';
    this.stars = 0;
    this.level = 0;
    this.playMs = 0;
    this.lastPraise = 0;
    this.untilDecor = 0;
    this.decor = [];
  }

  create() {
    this.road = this.add.tileSprite(ROAD_X + ROAD_W / 2, GAME_H / 2, ROAD_W, GAME_H, 'road');
    this.grassL = this.add.tileSprite(ROAD_X / 2, GAME_H / 2, ROAD_X, GAME_H, 'grass');
    this.grassR = this.add.tileSprite(GAME_W - ROAD_X / 2, GAME_H / 2, ROAD_X, GAME_H, 'grass').setFlipX(true);

    this.player = new PlayerCar(this, this.carKey);
    this.spawner = new Spawner(this, this.player);
    this.sparks = this.add
      .particles(0, 0, 'spark', {
        speed: { min: 150, max: 380 },
        lifespan: 500,
        scale: { start: 1.3, end: 0 },
        tint: [0xffeb3b, 0xffffff, 0xffc107],
        emitting: false,
      })
      .setDepth(20);
    this.hud = new Hud(this, { onPause: () => this.pauseGame() });

    // 화면 왼쪽 절반 = 왼쪽, 오른쪽 절반 = 오른쪽. 버튼 위를 누른 건 무시
    this.input.on('pointerdown', (pointer, over) => {
      if (over.length) return;
      this.steer(pointer.x < GAME_W / 2 ? -1 : 1);
    });
    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => this.steer(-1));
    kb.on('keydown-A', () => this.steer(-1));
    kb.on('keydown-RIGHT', () => this.steer(1));
    kb.on('keydown-D', () => this.steer(1));
    kb.on('keydown-ESC', () => this.pauseGame());
    kb.on('keydown-P', () => this.pauseGame());

    // 다른 앱/탭으로 나가면 자동으로 멈춤 화면을 띄운다
    const onHidden = () => this.pauseGame();
    this.game.events.on(Phaser.Core.Events.HIDDEN, onHidden);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.HIDDEN, onHidden);
      sfx.stopBgm();
    });

    this.showHint();
    this.popup('출발!', '#ffeb3b');
    sfx.startBgm();
    sfx.honk();
  }

  steer(dir) {
    if (this.player.move(dir)) {
      sfx.move();
      this.hideHint();
    }
  }

  pauseGame() {
    if (!this.scene.isActive()) return;
    sfx.stopBgm();
    this.scene.pause();
    this.scene.launch('Pause');
  }

  update(_time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.playMs += delta;

    const level = Math.min(SPEED_STEPS.length - 1, Math.floor(this.playMs / SPEED_UP_MS));
    if (level > this.level) {
      this.level = level;
      this.popup('더 빨리!', '#4fc3f7');
      sfx.honk();
    }

    const dy = SPEED_STEPS[this.level] * dt;
    this.road.tilePositionY -= dy;
    this.grassL.tilePositionY -= dy;
    this.grassR.tilePositionY -= dy;
    this.updateDecor(dy);
    this.spawner.update(dy, this.level);
    this.checkHits();
  }

  checkHits() {
    const p = this.player;
    for (const car of this.spawner.cars) {
      const reachY = (car.displayHeight + p.displayHeight) / 2 - HIT_PAD;
      if (Math.abs(car.x - p.x) < HIT_DX && Math.abs(car.y - p.y) < reachY) {
        this.crash();
        break;
      }
    }
    for (const star of [...this.spawner.stars]) {
      if (Math.abs(star.x - p.x) < STAR_DX && Math.abs(star.y - p.y) < STAR_DY) {
        this.collect(star);
      }
    }
  }

  crash() {
    const now = this.time.now;
    if (this.player.isInvincible(now)) return;
    this.player.hit(now);
    this.stars = Math.max(0, this.stars - 1);
    this.hud.setStars(this.stars);
    sfx.crash();
    this.cameras.main.shake(200, 0.01);
    this.floatText(this.player.x, this.player.y - 120, '쿵!', '#ff7043', 72);
  }

  collect(star) {
    this.sparks.explode(14, star.x, star.y);
    this.floatText(star.x, star.y - 40, '+1', '#ffeb3b', 56);
    this.spawner.removeStar(star);
    this.stars++;
    this.hud.setStars(this.stars);
    sfx.star();

    // 별 10개마다 칭찬 (한 번 칭찬한 단계는 다시 하지 않는다)
    const milestone = Math.floor(this.stars / 10) * 10;
    if (milestone > this.lastPraise) {
      this.lastPraise = milestone;
      this.popup(PRAISE[(milestone / 10 - 1) % PRAISE.length], '#ff80ab');
      sfx.praise();
    }
  }

  updateDecor(dy) {
    this.untilDecor -= dy;
    if (this.untilDecor <= 0) {
      this.untilDecor = Phaser.Math.Between(200, 420);
      const left = Math.random() < 0.5;
      const x = left ? Phaser.Math.Between(30, 85) : Phaser.Math.Between(635, 690);
      const key = Math.random() < 0.6 ? 'tree' : 'flower';
      this.decor.push(this.add.image(x, -60, key).setDepth(2));
    }
    this.decor = this.decor.filter((d) => {
      d.y += dy;
      if (d.y < GAME_H + 80) return true;
      d.destroy();
      return false;
    });
  }

  showHint() {
    const style = { stroke: '#37474f', strokeThickness: 8 };
    const leftArrow = this.add.image(140, 1200, 'arrow').setFlipX(true).setScale(0.7);
    const rightArrow = this.add.image(580, 1200, 'arrow').setScale(0.7);
    const leftText = makeText(this, 140, 1110, '눌러요', 44, '#ffffff', style);
    const rightText = makeText(this, 580, 1110, '눌러요', 44, '#ffffff', style);
    this.hint = [leftArrow, rightArrow, leftText, rightText];
    for (const h of this.hint) h.setDepth(30);
    this.tweens.add({ targets: this.hint, alpha: 0.35, duration: 500, yoyo: true, repeat: -1 });
    this.time.delayedCall(6000, () => this.hideHint());
  }

  hideHint() {
    if (!this.hint) return;
    const hint = this.hint;
    this.hint = null;
    this.tweens.killTweensOf(hint);
    this.tweens.add({ targets: hint, alpha: 0, duration: 300, onComplete: () => hint.forEach((h) => h.destroy()) });
  }

  popup(str, color) {
    const t = makeText(this, GAME_W / 2, 470, str, 110, color, { stroke: '#37474f', strokeThickness: 12 })
      .setDepth(50)
      .setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 350, ease: 'Back.Out' });
    this.tweens.add({
      targets: t,
      alpha: 0,
      y: 400,
      delay: 1100,
      duration: 400,
      onComplete: () => t.destroy(),
    });
  }

  floatText(x, y, str, color, size) {
    const t = makeText(this, x, y, str, size, color, { stroke: '#37474f', strokeThickness: 8 }).setDepth(40);
    this.tweens.add({ targets: t, y: y - 80, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }
}
