// 앱 아이콘·스플래시를 SVG로 그려서 Edge(playwright-core)로 PNG로 만든다.
//   assets/icon-only.png                      다운로드 페이지용 1024px 아이콘
//   android/.../mipmap-*/ic_launcher*.png     안드로이드 아이콘 (일반·둥근·적응형 앞/뒤)
//   android/.../drawable*/splash.png          시작 화면 (기존 파일과 같은 크기로 덮어씀)
// 실행: node scripts/make-icons.mjs   (Windows의 Edge 사용, `npx cap add android` 이후)
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const RES = 'android/app/src/main/res';
const GRASS = '#7cc84a';
const ROAD = '#5c6370';

// 게임 속 빨간 차(눈 달린) — BootScene의 drawSedan과 같은 모양
function car(x, y, w, h) {
  const r = w * 0.25;
  const wheel = (wx, wy) =>
    `<rect x="${wx}" y="${wy}" width="${w * 0.16}" height="${h * 0.21}" rx="${w * 0.05}" fill="#263238"/>`;
  const eye = (cx) => `
    <circle cx="${cx}" cy="${y + h * 0.325}" r="${w * 0.115}" fill="#fff"/>
    <circle cx="${cx}" cy="${y + h * 0.312}" r="${w * 0.058}" fill="#212121"/>
    <circle cx="${cx + w * 0.02}" cy="${y + h * 0.3}" r="${w * 0.02}" fill="#fff"/>`;
  return `
    ${wheel(x, y + h * 0.17)}${wheel(x + w * 0.84, y + h * 0.17)}
    ${wheel(x, y + h * 0.66)}${wheel(x + w * 0.84, y + h * 0.66)}
    <rect x="${x + w * 0.08}" y="${y + h * 0.04}" width="${w * 0.84}" height="${h * 0.95}" rx="${r}" fill="#a12825"/>
    <rect x="${x + w * 0.08}" y="${y}" width="${w * 0.84}" height="${h * 0.94}" rx="${r}" fill="#e53935"/>
    <rect x="${x + w * 0.17}" y="${y + h * 0.24}" width="${w * 0.66}" height="${h * 0.17}" rx="${w * 0.1}" fill="#90caf9"/>
    <rect x="${x + w * 0.19}" y="${y + h * 0.43}" width="${w * 0.62}" height="${h * 0.2}" rx="${w * 0.08}" fill="#ef7471"/>
    <rect x="${x + w * 0.19}" y="${y + h * 0.65}" width="${w * 0.62}" height="${h * 0.1}" rx="${w * 0.08}" fill="#90caf9"/>
    <circle cx="${x + w * 0.25}" cy="${y + h * 0.08}" r="${w * 0.08}" fill="#fff59d"/>
    <circle cx="${x + w * 0.75}" cy="${y + h * 0.08}" r="${w * 0.08}" fill="#fff59d"/>
    <rect x="${x + w * 0.17}" y="${y + h * 0.88}" width="${w * 0.17}" height="${h * 0.04}" rx="3" fill="#ff5252"/>
    <rect x="${x + w * 0.66}" y="${y + h * 0.88}" width="${w * 0.17}" height="${h * 0.04}" rx="3" fill="#ff5252"/>
    ${eye(x + w * 0.31)}${eye(x + w * 0.69)}`;
}

// 잔디 위 세로 도로 (가운데 점선)
function scene(w, h, roadRatio = 0.5) {
  const roadW = Math.min(w, h) * roadRatio;
  const rx = (w - roadW) / 2;
  const unit = Math.min(w, h);
  const dashes = [];
  for (let dy = -unit * 0.05; dy < h; dy += unit * 0.2) {
    dashes.push(`<rect x="${w / 2 - unit * 0.012}" y="${dy}" width="${unit * 0.024}" height="${unit * 0.1}" fill="#fff" opacity="0.85"/>`);
  }
  return `
    <rect width="${w}" height="${h}" fill="${GRASS}"/>
    <rect x="${rx}" width="${roadW}" height="${h}" fill="${ROAD}"/>
    <rect x="${rx + unit * 0.015}" width="${unit * 0.012}" height="${h}" fill="#fff"/>
    <rect x="${rx + roadW - unit * 0.027}" width="${unit * 0.012}" height="${h}" fill="#fff"/>
    ${dashes.join('')}`;
}

// 1024 기준 좌표. 적응형 아이콘은 가운데 약 66%만 보이므로 차를 그 안에 둔다
const S = 1024;
const CAR = [(S - 330) / 2, (S - 540) / 2, 330, 540];
const svg = (w, h, inner, viewW = w, viewH = h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${viewW} ${viewH}">${inner}</svg>`;

const ICON = scene(S, S) + car(...CAR);
const ROUND = `<defs><clipPath id="c"><circle cx="${S / 2}" cy="${S / 2}" r="${S / 2}"/></clipPath></defs><g clip-path="url(#c)">${ICON}</g>`;
const FOREGROUND = car(...CAR);
const BACKGROUND = scene(S, S);

function splash(w, h) {
  const ch = Math.min(w, h) * 0.42;
  const cw = ch * (330 / 540);
  return svg(w, h, scene(w, h, 0.55) + car((w - cw) / 2, (h - ch) / 2, cw, ch));
}

// PNG 헤더에서 크기 읽기
function pngSize(file) {
  const b = fs.readFileSync(file);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage();
async function render(markup, w, h, out, transparent = false) {
  // 창이 너무 작으면 스크린샷이 멈추므로 최소 512px 창에서 필요한 부분만 잘라 낸다
  await page.setViewportSize({ width: Math.max(w, 512), height: Math.max(h, 512) });
  await page.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
  console.log(`${out} (${w}x${h})`);
}

await render(svg(S, S, ICON), S, S, 'assets/icon-only.png');

for (const [name, scale] of Object.entries(DENSITIES)) {
  const dir = `${RES}/mipmap-${name}`;
  const legacy = Math.round(48 * scale);
  const adaptive = Math.round(108 * scale);
  await render(svg(legacy, legacy, ICON, S, S), legacy, legacy, `${dir}/ic_launcher.png`);
  await render(svg(legacy, legacy, ROUND, S, S), legacy, legacy, `${dir}/ic_launcher_round.png`, true);
  await render(svg(adaptive, adaptive, FOREGROUND, S, S), adaptive, adaptive, `${dir}/ic_launcher_foreground.png`, true);
  await render(svg(adaptive, adaptive, BACKGROUND, S, S), adaptive, adaptive, `${dir}/ic_launcher_background.png`);
}

// 적응형 아이콘 배경을 단색 대신 잔디·도로 그림으로
for (const xml of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  const file = `${RES}/mipmap-anydpi-v26/${xml}`;
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8').replace(/<background android:drawable="[^"]*"\s*\/>/, '<background android:drawable="@mipmap/ic_launcher_background"/>');
  fs.writeFileSync(file, text);
}

// Capacitor가 만든 splash.png를 모두 같은 크기로 다시 그린다
for (const dir of fs.readdirSync(RES).filter((d) => d.startsWith('drawable'))) {
  const file = `${RES}/${dir}/splash.png`;
  if (!fs.existsSync(file)) continue;
  const [w, h] = pngSize(file);
  await render(splash(w, h), w, h, file);
}

// Windows에서 browser.close()가 끝나지 않을 때가 있어 기다리지 않고 종료한다
browser.close().catch(() => {});
setTimeout(() => process.exit(0), 2000);
