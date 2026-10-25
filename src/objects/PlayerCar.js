import Phaser from 'phaser';
import { INVINCIBLE_MS, LANE_X, MOVE_MS, PLAYER_Y } from '../config.js';

export class PlayerCar extends Phaser.GameObjects.Image {
  constructor(scene, textureKey) {
    super(scene, LANE_X[1], PLAYER_Y, textureKey);
    scene.add.existing(this);
    this.setDepth(10);
    this.lane = 1;
    this.invincibleUntil = 0;
    this.moveTween = null;
  }

  // 한 칸 이동. 끝 차선이라 못 움직이면 false
  move(dir) {
    const next = Phaser.Math.Clamp(this.lane + dir, 0, LANE_X.length - 1);
    if (next === this.lane) return false;
    this.lane = next;
    this.moveTween?.stop();
    this.moveTween = this.scene.tweens.add({
      targets: this,
      x: LANE_X[next],
      duration: MOVE_MS,
      ease: 'Sine.Out',
    });
    this.scene.tweens.add({
      targets: this,
      angle: dir * 10,
      duration: MOVE_MS / 2,
      yoyo: true,
      onComplete: () => this.setAngle(0),
    });
    return true;
  }

  isInvincible(now) {
    return now < this.invincibleUntil;
  }

  hit(now) {
    this.invincibleUntil = now + INVINCIBLE_MS;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.25,
      duration: INVINCIBLE_MS / 10,
      yoyo: true,
      repeat: 4,
      onComplete: () => this.setAlpha(1),
    });
  }
}
