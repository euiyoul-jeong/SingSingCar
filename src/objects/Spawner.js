import Phaser from 'phaser';
import { FIRST_ROW_GAP, GAME_H, LANE_X, OBSTACLE_KEYS, ROW_GAP, TWO_CAR_CHANCE } from '../config.js';
import { makeToken } from '../ui/specView.js';

const SPAWN_Y = -140;
const LANES = [0, 1, 2];

// 장애물 차와 미션 토큰을 줄 단위로 만든다.
// 규칙: 한 줄에 차는 최대 2대 → 빠져나갈 차선이 항상 1개 이상 있다.
// itemProvider(빈 차선 수) → 빈 차선에 놓을 spec 배열 (null은 빈 칸)
export class Spawner {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.cars = [];
    this.items = [];
    this.enabled = false;
    this.itemProvider = null;
    this.untilNextRow = FIRST_ROW_GAP;
    // 단계별 "한 줄에 차 2대" 확률. 피하기 놀이는 자기 표로 바꿔 끼운다
    this.twoCarChance = (level) => TWO_CAR_CHANCE[level];
  }

  start(itemProvider) {
    this.itemProvider = itemProvider;
    this.enabled = true;
    this.untilNextRow = FIRST_ROW_GAP;
  }

  stop() {
    this.enabled = false;
    this.itemProvider = null;
  }

  update(dy, level) {
    if (this.enabled) {
      this.untilNextRow -= dy;
      if (this.untilNextRow <= 0) {
        this.spawnRow(level);
        this.untilNextRow += ROW_GAP;
      }
    }

    for (const obj of [...this.cars, ...this.items]) obj.y += dy;
    this.cars = this.cull(this.cars);
    this.items = this.cull(this.items);
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
    if (Math.random() < this.twoCarChance(level)) {
      // 2대일 때 빈 차선은 내 차에서 한 칸 이내로 둔다 (양 끝을 가로지르지 않아도 되게)
      const near = LANES.filter((l) => Math.abs(l - this.player.lane) <= 1);
      const free = Phaser.Utils.Array.GetRandom(near);
      blocked = LANES.filter((l) => l !== free);
    } else {
      blocked = [Phaser.Utils.Array.GetRandom(LANES)];
    }
    for (const lane of blocked) this.addCar(lane);

    const freeLanes = LANES.filter((l) => !blocked.includes(l));
    const specs = this.itemProvider?.(freeLanes.length) ?? [];
    specs.forEach((spec, i) => spec && this.addItem(freeLanes[i], spec));
  }

  addCar(lane) {
    const key = Phaser.Utils.Array.GetRandom(OBSTACLE_KEYS);
    const car = this.scene.add.image(LANE_X[lane], SPAWN_Y, key).setDepth(5);
    this.cars.push(car);
  }

  addItem(lane, spec) {
    const token = makeToken(this.scene, LANE_X[lane], SPAWN_Y, spec).setDepth(6);
    this.scene.tweens.add({ targets: token, scale: 1.08, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.items.push(token);
    return token;
  }

  removeItem(item) {
    this.items = this.items.filter((s) => s !== item);
    this.scene.tweens.killTweensOf(item);
  }

  // 미션이 끝나면 남은 토큰은 사라지게 한다
  clearItems() {
    for (const item of this.items) {
      this.scene.tweens.killTweensOf(item);
      this.scene.tweens.add({ targets: item, alpha: 0, scale: 0.3, duration: 250, onComplete: () => item.destroy() });
    }
    this.items = [];
  }
}
