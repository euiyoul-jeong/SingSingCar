import Phaser from 'phaser';
import {
  FIRST_ROW_GAP,
  GAME_H,
  LANE_X,
  MID_STAR_CHANCE,
  OBSTACLE_KEYS,
  ROW_GAP,
  STAR_CHANCE,
  TWO_CAR_CHANCE,
} from '../config.js';

const SPAWN_Y = -140;
const LANES = [0, 1, 2];

// 장애물 차와 별을 줄 단위로 만든다.
// 규칙: 한 줄에 차는 최대 2대 → 빠져나갈 차선이 항상 1개 이상 있다.
export class Spawner {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.cars = [];
    this.stars = [];
    this.untilNextRow = FIRST_ROW_GAP;
    this.midStarDone = true;
  }

  update(dy, level) {
    this.untilNextRow -= dy;
    if (!this.midStarDone && this.untilNextRow <= ROW_GAP / 2) {
      this.midStarDone = true;
      if (Math.random() < MID_STAR_CHANCE) this.addStar(Phaser.Utils.Array.GetRandom(LANES));
    }
    if (this.untilNextRow <= 0) {
      this.spawnRow(level);
      this.untilNextRow += ROW_GAP;
      this.midStarDone = false;
    }

    for (const obj of [...this.cars, ...this.stars]) obj.y += dy;
    this.cars = this.cull(this.cars);
    this.stars = this.cull(this.stars);
  }

  cull(list) {
    return list.filter((obj) => {
      if (obj.active && obj.y < GAME_H + 200) return true;
      this.scene.tweens.killTweensOf(obj);
      obj.destroy();
      return false;
    });
  }

  spawnRow(level) {
    let blocked;
    if (Math.random() < TWO_CAR_CHANCE[level]) {
      // 2대일 때 빈 차선은 내 차에서 한 칸 이내로 둔다 (양 끝을 가로지르지 않아도 되게)
      const near = LANES.filter((l) => Math.abs(l - this.player.lane) <= 1);
      const free = Phaser.Utils.Array.GetRandom(near);
      blocked = LANES.filter((l) => l !== free);
    } else {
      blocked = [Phaser.Utils.Array.GetRandom(LANES)];
    }
    for (const lane of blocked) this.addCar(lane);

    const freeLanes = LANES.filter((l) => !blocked.includes(l));
    if (Math.random() < STAR_CHANCE) this.addStar(Phaser.Utils.Array.GetRandom(freeLanes));
  }

  addCar(lane) {
    const key = Phaser.Utils.Array.GetRandom(OBSTACLE_KEYS);
    const car = this.scene.add.image(LANE_X[lane], SPAWN_Y, key).setDepth(5);
    this.cars.push(car);
  }

  addStar(lane) {
    const star = this.scene.add.image(LANE_X[lane], SPAWN_Y, 'star').setDepth(6);
    this.scene.tweens.add({ targets: star, scale: 1.15, duration: 400, yoyo: true, repeat: -1 });
    this.stars.push(star);
  }

  removeStar(star) {
    this.stars = this.stars.filter((s) => s !== star);
    this.scene.tweens.killTweensOf(star);
    star.destroy();
  }
}
