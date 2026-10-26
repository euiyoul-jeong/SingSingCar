// GitHub Pages용 사이트를 _site/에 만든다.
//   _site/index.html  다운로드 페이지 (QR코드 포함)
//   _site/icon.png    앱 아이콘
//   _site/play/       게임 웹 버전 (npm run build 결과)
// 실행: npm run build && node scripts/build-site.mjs
import fs from 'node:fs';
import QRCode from 'qrcode';

const PAGE_URL = 'https://euiyoul-jeong.github.io/SingSingCar/';
const OUT = '_site';

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync('dist', `${OUT}/play`, { recursive: true });
fs.copyFileSync('assets/icon-only.png', `${OUT}/icon.png`);

const qr = await QRCode.toString(PAGE_URL, { type: 'svg', margin: 1, color: { dark: '#37474f', light: '#ffffff' } });
const html = fs.readFileSync('site/index.html', 'utf8').replace('{{QR_SVG}}', qr);
fs.writeFileSync(`${OUT}/index.html`, html);
console.log(`사이트 생성: ${OUT}/ (${PAGE_URL})`);
