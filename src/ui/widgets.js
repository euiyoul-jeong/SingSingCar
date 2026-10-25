import { FONT } from '../config.js';
import { sfx } from '../audio/Sfx.js';

export function makeText(scene, x, y, str, size = 56, color = '#ffffff', extra = {}) {
  return scene.add
    .text(x, y, str, {
      fontFamily: FONT,
      fontSize: `${size}px`,
      fontStyle: 'bold',
      color,
      align: 'center',
      resolution: 2,
      ...extra,
    })
    .setOrigin(0.5);
}

// 아이가 누르기 쉬운 큰 버튼. 손가락을 뗄 때 onClick이 실행된다
export function makeButton(scene, x, y, label, { width = 380, height = 130, color = 0x43a047, fontSize = 60, onClick } = {}) {
  const container = scene.add.container(x, y);
  const g = scene.add.graphics();
  const r = Math.min(40, height / 2);
  g.fillStyle(0x000000, 0.25);
  g.fillRoundedRect(-width / 2, -height / 2 + 10, width, height, r);
  g.fillStyle(color, 1);
  g.fillRoundedRect(-width / 2, -height / 2, width, height, r);
  g.fillStyle(0xffffff, 0.25);
  g.fillRoundedRect(-width / 2 + 16, -height / 2 + 10, width - 32, height * 0.3, r / 2);
  const text = makeText(scene, 0, -2, label, fontSize, '#ffffff', { stroke: '#00000055', strokeThickness: 6 });
  container.add([g, text]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });

  let pressed = false;
  container.on('pointerdown', () => {
    pressed = true;
    scene.tweens.add({ targets: container, scale: 0.92, duration: 60 });
  });
  container.on('pointerout', () => {
    pressed = false;
    scene.tweens.add({ targets: container, scale: 1, duration: 80 });
  });
  container.on('pointerup', () => {
    if (!pressed) return;
    pressed = false;
    scene.tweens.add({ targets: container, scale: 1, duration: 80 });
    sfx.unlock();
    sfx.click();
    onClick?.();
  });
  return container;
}
