import Phaser from 'phaser';
import { ROAD_W, ROAD_X } from '../config.js';
import { COLORS, SHAPES } from '../missions/data.js';

// 그림 파일 없이 모든 텍스처를 코드로 그린다.
// 나중에 실제 그림으로 바꿀 때는 같은 키로 preload()에서 load.image 하면 된다.

const CAR_W = 104;
const CAR_H = 170;
const GLASS = 0x90caf9;

function shade(color, amt) {
  const f = (c) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  const r = f((color >> 16) & 255);
  const g = f((color >> 8) & 255);
  const b = f(color & 255);
  return (r << 16) | (g << 8) | b;
}

function drawWheels(g, w, ys) {
  g.fillStyle(0x263238);
  for (const y of ys) {
    g.fillRoundedRect(2, y, 16, 36, 5);
    g.fillRoundedRect(w - 18, y, 16, 36, 5);
  }
}

function drawEyes(g, cx, cy, gap) {
  for (const x of [cx - gap, cx + gap]) {
    g.fillStyle(0xffffff);
    g.fillCircle(x, cy, 12);
    g.fillStyle(0x212121);
    g.fillCircle(x, cy - 2, 6);
    g.fillStyle(0xffffff);
    g.fillCircle(x + 2, cy - 4, 2);
  }
}

function drawSedan(g, w, h, body, { eyes = false, police = false } = {}) {
  drawWheels(g, w, [h * 0.17, h * 0.66]);
  g.fillStyle(shade(body, -0.3));
  g.fillRoundedRect(8, 6, w - 16, h - 8, 26);
  g.fillStyle(body);
  g.fillRoundedRect(8, 2, w - 16, h - 10, 26);
  if (police) {
    g.fillStyle(0x263238);
    g.fillRoundedRect(8, 2, w - 16, h * 0.2, { tl: 26, tr: 26, bl: 0, br: 0 });
    g.fillRoundedRect(8, h * 0.8 - 8, w - 16, h * 0.2, { tl: 0, tr: 0, bl: 26, br: 26 });
  }
  g.fillStyle(GLASS);
  g.fillRoundedRect(18, h * 0.24, w - 36, h * 0.17, 10);
  g.fillStyle(police ? 0xffffff : shade(body, 0.2));
  g.fillRoundedRect(20, h * 0.43, w - 40, h * 0.2, 8);
  g.fillStyle(GLASS);
  g.fillRoundedRect(20, h * 0.65, w - 40, h * 0.1, 8);
  g.fillStyle(0xfff59d);
  g.fillCircle(26, 14, 8);
  g.fillCircle(w - 26, 14, 8);
  g.fillStyle(0xe53935);
  g.fillRoundedRect(18, h - 20, 18, 7, 3);
  g.fillRoundedRect(w - 36, h - 20, 18, 7, 3);
  if (police) {
    g.fillStyle(0xf44336);
    g.fillRoundedRect(24, h * 0.49, (w - 48) / 2, 16, 4);
    g.fillStyle(0x2196f3);
    g.fillRoundedRect(w / 2, h * 0.49, (w - 48) / 2, 16, 4);
  }
  if (eyes) drawEyes(g, w / 2, h * 0.325, 20);
}

function drawFireTruck(g, w, h) {
  const body = 0xe53935;
  drawWheels(g, w, [h * 0.12, h * 0.55, h * 0.76]);
  g.fillStyle(shade(body, -0.3));
  g.fillRoundedRect(8, 6, w - 16, h - 8, 22);
  g.fillStyle(body);
  g.fillRoundedRect(8, 2, w - 16, h - 10, 22);
  g.fillStyle(GLASS);
  g.fillRoundedRect(18, h * 0.1, w - 36, h * 0.13, 10);
  // 경광등
  g.fillStyle(0x2196f3);
  g.fillRoundedRect(24, h * 0.26, w - 48, 12, 4);
  // 사다리
  g.lineStyle(6, 0xeeeeee);
  const top = h * 0.33;
  const bottom = h * 0.92;
  g.lineBetween(30, top, 30, bottom);
  g.lineBetween(w - 30, top, w - 30, bottom);
  for (let y = top + 12; y < bottom; y += 22) g.lineBetween(30, y, w - 30, y);
  g.fillStyle(0xfff59d);
  g.fillCircle(26, 14, 8);
  g.fillCircle(w - 26, 14, 8);
  drawEyes(g, w / 2, h * 0.165, 20);
}

function drawTruck(g, w, h) {
  drawWheels(g, w, [h * 0.1, h * 0.6, h * 0.8]);
  // 운전석
  g.fillStyle(0x1565c0);
  g.fillRoundedRect(10, 2, w - 20, h * 0.26, 18);
  g.fillStyle(GLASS);
  g.fillRoundedRect(20, h * 0.06, w - 40, h * 0.1, 8);
  g.fillStyle(0xfff59d);
  g.fillCircle(26, 12, 7);
  g.fillCircle(w - 26, 12, 7);
  // 짐칸
  g.fillStyle(0xbdbdbd);
  g.fillRoundedRect(6, h * 0.28 + 4, w - 12, h * 0.72 - 8, 10);
  g.fillStyle(0xfafafa);
  g.fillRoundedRect(6, h * 0.28, w - 12, h * 0.72 - 10, 10);
  g.fillStyle(0xffb300);
  g.fillRect(6, h * 0.55, w - 12, 18);
}

function drawStar(g, cx, cy, outer, inner) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  g.fillStyle(0xffd600);
  g.fillPoints(pts, true);
  g.lineStyle(6, 0xff8f00);
  g.strokePoints(pts, true);
  // 귀여운 눈
  g.fillStyle(0x5d4037);
  g.fillCircle(cx - 9, cy + 2, 4);
  g.fillCircle(cx + 9, cy + 2, 4);
}

// 미션 토큰용 색깔 도형 (아래에 진한 그림자를 깔아 윤곽을 만든다)
function drawShape(g, shape, color, s) {
  const pass = (fill, dy) => {
    g.fillStyle(fill);
    if (shape === 'circle') {
      g.fillCircle(s / 2, s / 2 + dy, s * 0.42);
    } else if (shape === 'square') {
      g.fillRoundedRect(s * 0.1, s * 0.1 + dy, s * 0.8, s * 0.8, s * 0.1);
    } else if (shape === 'triangle') {
      g.fillTriangle(s / 2, s * 0.06 + dy, s * 0.95, s * 0.9 + dy, s * 0.05, s * 0.9 + dy);
    } else if (shape === 'heart') {
      g.fillCircle(s * 0.31, s * 0.36 + dy, s * 0.22);
      g.fillCircle(s * 0.69, s * 0.36 + dy, s * 0.22);
      g.fillTriangle(s * 0.1, s * 0.45 + dy, s * 0.9, s * 0.45 + dy, s / 2, s * 0.92 + dy);
    }
  };
  pass(shade(color, -0.35), 4);
  pass(color, 0);
}

function drawSpeaker(g) {
  g.fillStyle(0x37474f);
  g.fillRect(24, 40, 14, 20);
  g.fillPoints(
    [
      new Phaser.Math.Vector2(36, 40),
      new Phaser.Math.Vector2(54, 26),
      new Phaser.Math.Vector2(54, 74),
      new Phaser.Math.Vector2(36, 60),
    ],
    true,
  );
}

function drawRoundIcon(g) {
  g.fillStyle(0xffffff, 0.92);
  g.fillCircle(50, 50, 46);
  g.lineStyle(5, 0x37474f);
  g.strokeCircle(50, 50, 46);
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  bake(key, w, h, draw) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  create() {
    // 내 차
    this.bake('car_red', CAR_W, CAR_H, (g) => drawSedan(g, CAR_W, CAR_H, 0xe53935, { eyes: true }));
    this.bake('car_blue', CAR_W, CAR_H, (g) => drawSedan(g, CAR_W, CAR_H, 0x1e88e5, { eyes: true }));
    this.bake('car_police', CAR_W, CAR_H, (g) => drawSedan(g, CAR_W, CAR_H, 0xffffff, { eyes: true, police: true }));
    this.bake('car_fire', 110, 200, (g) => drawFireTruck(g, 110, 200));

    // 피해야 할 차
    const obstacleColors = { obs_yellow: 0xfdd835, obs_green: 0x43a047, obs_purple: 0x8e24aa, obs_orange: 0xfb8c00, obs_teal: 0x00acc1 };
    for (const [key, color] of Object.entries(obstacleColors)) {
      this.bake(key, CAR_W, CAR_H, (g) => drawSedan(g, CAR_W, CAR_H, color));
    }
    this.bake('obs_truck', 112, 220, (g) => drawTruck(g, 112, 220));

    this.bake('star', 100, 100, (g) => drawStar(g, 50, 52, 44, 20));

    for (const shape of Object.keys(SHAPES)) {
      for (const [key, { hex }] of Object.entries(COLORS)) {
        this.bake(`shape_${shape}_${key}`, 96, 100, (g) => drawShape(g, shape, hex, 96));
      }
    }

    // 도로 한 칸(세로로 반복). 차선 점선 2개와 양쪽 흰 선
    this.bake('road', ROAD_W, 200, (g) => {
      g.fillStyle(0x5c6370);
      g.fillRect(0, 0, ROAD_W, 200);
      g.fillStyle(0xffffff);
      g.fillRect(10, 0, 8, 200);
      g.fillRect(ROAD_W - 18, 0, 8, 200);
      g.fillRect(160 - 4, 0, 8, 100);
      g.fillRect(320 - 4, 0, 8, 100);
    });

    this.bake('grass', ROAD_X, 200, (g) => {
      g.fillStyle(0x7cc84a);
      g.fillRect(0, 0, ROAD_X, 200);
      g.fillStyle(0x6ab43c);
      for (const [x, y] of [[20, 30], [70, 80], [40, 140], [95, 170], [90, 20]]) {
        g.fillEllipse(x, y, 18, 8);
      }
      g.fillStyle(0xd9d9d9);
      g.fillRect(ROAD_X - 10, 0, 10, 200);
    });

    this.bake('tree', 90, 90, (g) => {
      g.fillStyle(0x2e7d32);
      g.fillCircle(48, 50, 38);
      g.fillStyle(0x43a047);
      g.fillCircle(44, 44, 36);
      g.fillStyle(0x66bb6a);
      g.fillCircle(34, 34, 14);
    });

    this.bake('flower', 44, 44, (g) => {
      g.fillStyle(0xf48fb1);
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        g.fillCircle(22 + Math.cos(a) * 11, 22 + Math.sin(a) * 11, 9);
      }
      g.fillStyle(0xffeb3b);
      g.fillCircle(22, 22, 7);
    });

    this.bake('spark', 16, 16, (g) => {
      g.fillStyle(0xffffff);
      g.fillCircle(8, 8, 8);
    });

    this.bake('arrow', 140, 140, (g) => {
      g.fillStyle(0xffffff);
      g.fillPoints(
        [new Phaser.Math.Vector2(30, 20), new Phaser.Math.Vector2(125, 70), new Phaser.Math.Vector2(30, 120)],
        true,
      );
    });

    this.bake('icon_pause', 100, 100, (g) => {
      drawRoundIcon(g);
      g.fillStyle(0x37474f);
      g.fillRoundedRect(32, 28, 12, 44, 3);
      g.fillRoundedRect(56, 28, 12, 44, 3);
    });

    this.bake('icon_sound_on', 100, 100, (g) => {
      drawRoundIcon(g);
      drawSpeaker(g);
      g.lineStyle(6, 0x37474f);
      for (const r of [12, 24]) {
        g.beginPath();
        g.arc(56, 50, r, -0.8, 0.8);
        g.strokePath();
      }
    });

    this.bake('icon_sound_off', 100, 100, (g) => {
      drawRoundIcon(g);
      drawSpeaker(g);
      g.lineStyle(7, 0xe53935);
      g.lineBetween(62, 38, 80, 62);
      g.lineBetween(80, 38, 62, 62);
    });

    this.scene.start('Title');
  }
}
