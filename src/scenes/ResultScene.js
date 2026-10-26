import Phaser from 'phaser';
import { GAME_H, GAME_W, STORAGE_KEYS } from '../config.js';
import { sfx } from '../audio/Sfx.js';
import { storage } from '../storage.js';
import { makeButton, makeText } from '../ui/widgets.js';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  init(data) {
    this.stars = data.stars ?? 0;
    this.missions = data.missions ?? 0;
    this.goal = data.goal;
    this.cleared = !!data.cleared;
    this.carKey = data.carKey || 'car_red';
  }

  replay() {
    this.scene.start('Game', { carKey: this.carKey, missionGoal: this.goal });
  }

  create() {
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x81d4fa);
    this.add.rectangle(GAME_W / 2, GAME_H - 160, GAME_W, 320, 0x7cc84a);

    const best = Number(storage.get(STORAGE_KEYS.best)) || 0;
    const newBest = this.stars > best;
    if (newBest) storage.set(STORAGE_KEYS.best, this.stars);

    const stroke = { stroke: '#37474f', strokeThickness: 10 };
    const title = this.cleared ? '미션 완료!' : this.stars > 0 ? '잘했어요!' : '수고했어요!';
    makeText(this, GAME_W / 2, this.cleared ? 150 : 160, title, 96, '#ffeb3b', stroke);

    const star = this.add.image(GAME_W / 2, this.cleared ? 345 : 380, 'star').setScale(this.cleared ? 2 : 2.2);
    star.setAngle(-12);
    this.tweens.add({ targets: star, angle: 12, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.tweens.add({ targets: star, scale: star.scale + 0.3, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    let recordY = 670;
    if (this.cleared) {
      // 다 해낸 판: 미션 완료를 가장 크게, 별은 그 아래에
      makeText(this, GAME_W / 2, 525, `미션 ${this.missions}개 모두 성공!`, 68, '#ffffff', stroke);
      makeText(this, GAME_W / 2, 615, `별 ${this.stars}개 모았어!`, 52, '#ffffff', { stroke: '#37474f', strokeThickness: 8 });
      recordY = 700;
    } else {
      if (this.stars > 0) {
        makeText(this, GAME_W / 2, 560, `별 ${this.stars}개 모았어!`, 80, '#ffffff', stroke);
      } else {
        makeText(this, GAME_W / 2, 560, '다음엔 별을 모아 봐요!', 60, '#ffffff', stroke);
      }
      if (this.missions > 0) {
        makeText(this, GAME_W / 2, 1110, `미션 ${this.missions}개 성공!`, 52, '#ffffff', { stroke: '#37474f', strokeThickness: 8 });
      }
    }

    if (newBest) {
      const badge = makeText(this, GAME_W / 2, recordY, '새 기록!', 64, '#ff4081', { stroke: '#ffffff', strokeThickness: 10 });
      this.tweens.add({ targets: badge, scale: 1.15, duration: 400, yoyo: true, repeat: -1 });
      sfx.praise();
    } else if (best > 0) {
      makeText(this, GAME_W / 2, recordY, `최고 기록  ★ ${best}`, 48, '#37474f');
    }

    makeButton(this, GAME_W / 2, 830, '다시 하기', {
      color: 0x43a047,
      width: 440,
      onClick: () => this.replay(),
    });
    makeButton(this, GAME_W / 2, 1000, '차 바꾸기', {
      color: 0x1e88e5,
      width: 440,
      onClick: () => this.scene.start('Title'),
    });

    const car = this.add.image(-100, 1215, this.carKey).setAngle(90).setScale(0.7);
    this.tweens.add({ targets: car, x: GAME_W + 100, duration: 3500, repeat: -1 });

    this.input.keyboard.on('keydown-ENTER', () => this.replay());
  }
}
