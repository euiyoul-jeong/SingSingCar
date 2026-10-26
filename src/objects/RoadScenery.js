import Phaser from 'phaser';
import { GAME_H, GAME_W, ROAD_W, ROAD_X } from '../config.js';

// 바람 줄무늬는 양쪽 잔디와 갓길에만 (가운데 차선의 토큰을 가리지 않게)
const STREAK_ZONES = [
  [15, 105],
  [615, 705],
  [130, 145],
  [575, 590],
];
const STREAK_COUNT = 12;
const STREAK_SPEED = 1.5; // 배경보다 이만큼 더 빠르게

// 미션 놀이·피하기 놀이가 함께 쓰는 배경: 도로·잔디·나무·꽃·바람 줄무늬.
// update(bgDy)에 배경이 흐를 거리를 넘기면 된다 (차·토큰보다 BG_SPEED_FACTOR배 빠름)
export class RoadScenery {
  constructor(scene) {
    this.scene = scene;
    this.road = scene.add.tileSprite(ROAD_X + ROAD_W / 2, GAME_H / 2, ROAD_W, GAME_H, 'road');
    this.grassL = scene.add.tileSprite(ROAD_X / 2, GAME_H / 2, ROAD_X, GAME_H, 'grass');
    this.grassR = scene.add.tileSprite(GAME_W - ROAD_X / 2, GAME_H / 2, ROAD_X, GAME_H, 'grass').setFlipX(true);
    this.decor = [];
    this.untilDecor = 0;
    this.streaks = Array.from({ length: STREAK_COUNT }, () => {
      const s = scene.add.rectangle(0, 0, 5, 100, 0xffffff).setDepth(3);
      this.placeStreak(s, Phaser.Math.Between(0, GAME_H));
      return s;
    });
  }

  update(bgDy) {
    this.road.tilePositionY -= bgDy;
    this.grassL.tilePositionY -= bgDy;
    this.grassR.tilePositionY -= bgDy;
    this.updateDecor(bgDy);
    this.updateStreaks(bgDy * STREAK_SPEED);
  }

  placeStreak(s, y) {
    const [from, to] = Phaser.Utils.Array.GetRandom(STREAK_ZONES);
    s.setPosition(Phaser.Math.Between(from, to), y);
    s.setDisplaySize(Phaser.Math.Between(4, 6), Phaser.Math.Between(60, 140));
    s.setAlpha(Phaser.Math.FloatBetween(0.35, 0.6));
  }

  // 화면 아래로 나간 줄무늬는 새로 만들지 않고 위로 돌려 다시 쓴다
  updateStreaks(dy) {
    for (const s of this.streaks) {
      s.y += dy;
      if (s.y - s.displayHeight / 2 > GAME_H) this.placeStreak(s, -Phaser.Math.Between(80, 400));
    }
  }

  updateDecor(dy) {
    this.untilDecor -= dy;
    if (this.untilDecor <= 0) {
      this.untilDecor = Phaser.Math.Between(200, 420);
      const left = Math.random() < 0.5;
      const x = left ? Phaser.Math.Between(30, 85) : Phaser.Math.Between(635, 690);
      const key = Math.random() < 0.6 ? 'tree' : 'flower';
      this.decor.push(this.scene.add.image(x, -60, key).setDepth(2));
    }
    this.decor = this.decor.filter((d) => {
      d.y += dy;
      if (d.y < GAME_H + 80) return true;
      d.destroy();
      return false;
    });
  }
}
