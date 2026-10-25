import { makeText } from './widgets.js';

// 미션 spec(그림/글자/도형)을 size 크기의 게임 오브젝트로 만든다
export function makeSpecView(scene, spec, size) {
  if (spec.t === 'shape') {
    return scene.add.image(0, 0, `shape_${spec.shape}_${spec.color}`).setDisplaySize(size * 0.96, size);
  }
  const fontSize = spec.t === 'emoji' ? size * 0.78 : size * 0.86;
  return makeText(scene, 0, 0, spec.v, Math.round(fontSize), spec.color || '#37474f', {
    padding: { x: 6, y: 6 },
  });
}

// 도로 위에 떨어지는 동그란 미션 토큰
export function makeToken(scene, x, y, spec) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.2);
  g.fillCircle(0, 8, 62);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(0, 0, 62);
  g.lineStyle(6, 0x37474f, 1);
  g.strokeCircle(0, 0, 62);
  c.add([g, makeSpecView(scene, spec, 84)]);
  c.spec = spec;
  return c;
}
