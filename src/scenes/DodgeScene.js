import Phaser from 'phaser';
import { BG_SPEED_FACTOR, DODGE, GAME_W, HIT_DX, HIT_PAD, SPEED_PRESETS, TOKEN_DX, TOKEN_DY } from '../config.js';
import { sfx } from '../audio/Sfx.js';
import { voice } from '../audio/Voice.js';
import { PlayerCar } from '../objects/PlayerCar.js';
import { RoadScenery } from '../objects/RoadScenery.js';
import { Spawner } from '../objects/Spawner.js';
import { loadSpeed } from '../storage.js';
import { Hud } from '../ui/Hud.js';
import { GameScene } from './GameScene.js';

const STAR_SPEC = { t: 'star', id: 'star' };

// 피하기 놀이: 미션 없이 차만 피한다. 미션 놀이(GameScene)와 규칙이 다르다.
// - 별(생명) 3개로 시작, 부딪히면 -1, 0개면 끝
// - 15~25초마다 먹을 별이 하나 나온다 (최대 5개)
// - 20초마다 빨라진다
// - 점수 = 버틴 시간
export class DodgeScene extends Phaser.Scene {
  constructor() {
    super('Dodge');
  }

  init(data) {
    this.carKey = data.carKey || 'car_red';
    this.speedKey = data.speed ?? loadSpeed();
    this.speedSteps = SPEED_PRESETS[this.speedKey].steps;
    this.speedCap = this.speedSteps.at(-1) * DODGE.speedCapFactor;
    this.lives = DODGE.startLives;
    this.level = 0;
    this.playMs = 0;
    this.untilStarMs = this.nextStarDelay();
    this.phase = 'ready'; // ready → play → over
  }

  nextStarDelay() {
    return Phaser.Math.Between(...DODGE.starEveryMs);
  }

  // 속도 표 5단계까지는 표대로, 그 뒤로는 단계마다 +5%씩 (최대값 × 1.25에서 멈춤)
  speedFor(level) {
    const steps = this.speedSteps;
    if (level < steps.length) return steps[level];
    const extra = level - steps.length + 1;
    return Math.min(this.speedCap, steps.at(-1) * (1 + DODGE.speedUpAfterMax * extra));
  }

  create() {
    this.scenery = new RoadScenery(this);
    this.player = new PlayerCar(this, this.carKey);
    this.spawner = new Spawner(this, this.player);
    this.spawner.twoCarChance = (level) => DODGE.twoCarChance[Math.min(level, DODGE.twoCarChance.length - 1)];
    this.sparks = this.add
      .particles(0, 0, 'spark', {
        speed: { min: 150, max: 380 },
        lifespan: 600,
        scale: { start: 1.3, end: 0 },
        tint: [0xffeb3b, 0xffffff, 0xffc107],
        emitting: false,
      })
      .setDepth(70);
    this.hud = new Hud(this, { onPause: () => this.pauseGame() });
    this.hud.setStars(this.lives);
    this.hud.setCenter('⏱ 0초');

    this.input.on('pointerdown', (pointer, over) => {
      if (over.length || this.phase === 'over') return;
      this.steer(pointer.x < GAME_W / 2 ? -1 : 1);
    });
    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => this.steer(-1));
    kb.on('keydown-A', () => this.steer(-1));
    kb.on('keydown-RIGHT', () => this.steer(1));
    kb.on('keydown-D', () => this.steer(1));
    kb.on('keydown-ESC', () => this.pauseGame());
    kb.on('keydown-P', () => this.pauseGame());

    const onHidden = () => this.pauseGame();
    this.game.events.on(Phaser.Core.Events.HIDDEN, onHidden);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.HIDDEN, onHidden);
      sfx.stopBgm();
      voice.stop();
    });

    this.showHint();
    this.popup('출발!', '#ffeb3b');
    voice.say('차를 피해요! 별을 먹으면 더 오래 달릴 수 있어요.');
    sfx.startBgm();
    sfx.honk();
    this.time.delayedCall(1200, () => {
      this.phase = 'play';
      this.spawner.start((n) => this.rowItems(n));
    });
  }

  pauseGame() {
    if (!this.scene.isActive() || this.phase === 'over') return;
    sfx.stopBgm();
    voice.stop();
    this.scene.pause();
    this.scene.launch('Pause', { from: 'Dodge' });
  }

  // 먹을 별은 정해진 간격마다 빈 차선 하나에만. 별이 가득(5개)이면 내보내지 않고 다시 기다린다
  rowItems(freeCount) {
    if (this.untilStarMs > 0) return [];
    this.untilStarMs = this.nextStarDelay();
    if (this.lives >= DODGE.maxLives) return [];
    const at = Phaser.Math.Between(0, freeCount - 1);
    return Array.from({ length: freeCount }, (_, i) => (i === at ? STAR_SPEC : null));
  }

  update(_time, delta) {
    if (this.phase === 'over') return; // 끝나면 화면을 멈춘다
    const dt = Math.min(delta, 50) / 1000;
    if (this.phase === 'play') {
      this.playMs += delta;
      this.untilStarMs -= delta;
      const level = Math.floor(this.playMs / DODGE.levelUpMs);
      if (level > this.level) {
        this.level = level;
        this.popup('더 빨리!', '#4fc3f7');
        sfx.honk();
      }
      this.hud.setCenter(`⏱ ${Math.floor(this.playMs / 1000)}초`);
    }
    const dy = this.speedFor(this.level) * dt;
    this.scenery.update(dy * BG_SPEED_FACTOR);
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
    if (this.phase === 'over') return;
    for (const item of [...this.spawner.items]) {
      if (Math.abs(item.x - p.x) < TOKEN_DX && Math.abs(item.y - p.y) < TOKEN_DY) this.eatStar(item);
    }
  }

  crash() {
    const now = this.time.now;
    if (this.phase === 'over' || this.player.isInvincible(now)) return;
    this.player.hit(now);
    this.lives = Math.max(0, this.lives - 1);
    this.hud.setStars(this.lives);
    sfx.crash();
    this.cameras.main.shake(200, 0.01);
    this.floatText(this.player.x, this.player.y - 120, '쿵!', '#ff7043', 72);
    if (this.lives === 0) {
      this.gameOver();
    } else if (this.lives === 1) {
      this.hud.setDanger(true);
      this.popup('조심!', '#ff5252');
    }
  }

  eatStar(item) {
    this.spawner.removeItem(item);
    this.sparks.explode(16, item.x, item.y);
    this.floatText(item.x, item.y - 40, '+1', '#ffeb3b', 56);
    this.tweens.add({ targets: item, scale: 1.6, alpha: 0, duration: 200, onComplete: () => item.destroy() });
    this.lives = Math.min(DODGE.maxLives, this.lives + 1);
    this.hud.setStars(this.lives);
    if (this.lives > 1) this.hud.setDanger(false);
    sfx.star();
  }

  gameOver() {
    this.phase = 'over';
    this.spawner.stop();
    this.hud.setDanger(false);
    sfx.stopBgm();
    const seconds = Math.round(this.playMs / 100) / 10;
    this.time.delayedCall(DODGE.endDelayMs, () => this.scene.start('Result', this.resultData(seconds)));
  }

  resultData(seconds = Math.round(this.playMs / 100) / 10) {
    return { mode: 'dodge', seconds, carKey: this.carKey, speed: this.speedKey };
  }
}

// 미션 놀이와 같은 화면 연출(안내 화살표, 큰 글자, 떠오르는 글자)과 차선 이동은 그대로 빌려 쓴다
for (const name of ['steer', 'showHint', 'hideHint', 'popup', 'floatText']) {
  DodgeScene.prototype[name] = GameScene.prototype[name];
}
