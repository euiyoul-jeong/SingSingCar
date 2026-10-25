import { sfx } from '../audio/Sfx.js';
import { voice } from '../audio/Voice.js';
import { makeText } from './widgets.js';

const DEPTH = 100;

export class Hud {
  constructor(scene, { onPause }) {
    this.scene = scene;

    const panel = scene.add.graphics().setDepth(DEPTH);
    panel.fillStyle(0xffffff, 0.9);
    panel.fillRoundedRect(20, 20, 240, 100, 30);
    panel.lineStyle(5, 0x37474f);
    panel.strokeRoundedRect(20, 20, 240, 100, 30);

    this.starIcon = scene.add.image(78, 70, 'star').setScale(0.75).setDepth(DEPTH);
    this.starText = makeText(scene, 130, 72, '0', 64, '#37474f').setOrigin(0, 0.5).setDepth(DEPTH);

    const pause = scene.add.image(650, 70, 'icon_pause').setDepth(DEPTH).setInteractive({ useHandCursor: true });
    pause.on('pointerup', () => onPause());

    const sound = scene.add
      .image(535, 70, sfx.muted ? 'icon_sound_off' : 'icon_sound_on')
      .setDepth(DEPTH)
      .setInteractive({ useHandCursor: true });
    sound.on('pointerup', () => {
      sfx.setMuted(!sfx.muted);
      if (sfx.muted) voice.stop();
      sound.setTexture(sfx.muted ? 'icon_sound_off' : 'icon_sound_on');
    });
  }

  setStars(n) {
    this.starText.setText(String(n));
    // 연달아 불려도 크기가 커진 채 남지 않게 매번 원래 크기에서 시작한다
    this.scene.tweens.killTweensOf(this.starIcon);
    this.starIcon.setScale(0.75);
    this.scene.tweens.add({ targets: this.starIcon, scale: 1, duration: 100, yoyo: true });
  }
}
