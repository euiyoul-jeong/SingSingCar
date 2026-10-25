import { GAME_W } from '../config.js';
import { makeSpecView } from './specView.js';
import { makeText } from './widgets.js';

const DEPTH = 90;
const TOP = 135;
const HEIGHT = 175;
const SLOT = 80;

// 화면 위쪽 미션판: 지금 할 일(제목)과 진행 칸을 보여 준다
export class MissionPanel {
  constructor(scene) {
    this.scene = scene;
    this.root = scene.add.container(0, 0).setDepth(DEPTH).setVisible(false);
    const bg = scene.add.graphics();
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(20, TOP, GAME_W - 40, HEIGHT, 32);
    bg.lineStyle(5, 0xff9800);
    bg.strokeRoundedRect(20, TOP, GAME_W - 40, HEIGHT, 32);
    this.title = makeText(scene, GAME_W / 2, TOP + 42, '', 46, '#37474f');
    this.slots = scene.add.container(GAME_W / 2, TOP + 120);
    this.root.add([bg, this.title, this.slots]);
  }

  show(model) {
    this.root.setVisible(true);
    this.render(model);
  }

  hide() {
    this.root.setVisible(false);
  }

  render({ title, slots }) {
    this.title.setText(title);
    this.scene.tweens.killTweensOf(this.slots.list);
    this.slots.removeAll(true);
    const gap = Math.min(SLOT + 8, (GAME_W - 80) / slots.length);
    const startX = (-(slots.length - 1) * gap) / 2;
    slots.forEach((slot, i) => {
      const view = this.makeSlot(slot);
      view.x = startX + i * gap;
      this.slots.add(view);
    });
  }

  makeSlot(slot) {
    const s = this.scene;
    const c = s.add.container(0, 0);
    const box = s.add.graphics();
    const half = SLOT / 2 - 2;

    if (slot.kind === 'symbol') {
      c.add(makeText(s, 0, 0, slot.v, 56, '#37474f'));
      return c;
    }
    if (slot.kind === 'dot') {
      if (slot.filled) {
        c.add(s.add.image(0, 0, 'star').setDisplaySize(70, 70));
      } else {
        box.fillStyle(0xeceff1);
        box.fillCircle(0, 0, 26);
        box.lineStyle(4, 0xb0bec5);
        box.strokeCircle(0, 0, 26);
        c.add(box);
      }
      return c;
    }

    const filled = slot.kind === 'show' || slot.filled;
    box.fillStyle(filled ? 0xfff8e1 : 0xf5f5f5);
    box.fillRoundedRect(-half, -half, half * 2, half * 2, 14);
    box.lineStyle(slot.next ? 6 : 3, slot.next ? 0xff9800 : 0xcfd8dc);
    box.strokeRoundedRect(-half, -half, half * 2, half * 2, 14);
    c.add(box);

    if (slot.kind === 'question' || (slot.kind === 'hidden' && !slot.filled)) {
      c.add(makeText(s, 0, 0, '?', 54, '#ff9800'));
    } else {
      const view = makeSpecView(s, slot.spec, 62);
      // 아직 못 먹은 칸은 흐리게, 다음에 먹을 칸은 또렷하게
      if (!filled && !slot.next) view.setAlpha(0.35);
      c.add(view);
    }
    if (slot.next) {
      s.tweens.add({ targets: c, scale: 1.12, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    return c;
  }
}
