import QRCode from 'qrcode';

// 웹(GitHub Pages)에서만 보이는 "안드로이드 앱 받기" 화면.
// - 넓은 화면(PC): 게임 오른쪽에 QR코드·다운로드 버튼·설치 방법 패널
// - 폰: 게임 아래 얇은 "앱 받기" 띠 → 누르면 다운로드 창 (게임은 멈춤)
// 안드로이드 앱 안과 아이폰에서는 만들지 않는다 (main.js에서 판단).

export const APK_URL = 'https://github.com/euiyoul-jeong/SingSingCar/releases/latest/download/SingSingCar.apk';

const STEPS = `
  <ol class="dl-steps">
    <li><b>APK 받기</b>를 눌러 내려받아요.</li>
    <li>파일을 열고 "알 수 없는 앱 설치"를 <b>허용</b>해요.</li>
    <li>"Play 프로텍트" 경고가 나오면 <b>무시하고 설치</b>를 눌러요.</li>
  </ol>`;

// 게임 캔버스가 자리를 잡기 전에 불러야 한다 (Phaser가 #game 크기를 읽으므로)
export function mountDownloadUi({ onOpen } = {}) {
  document.body.classList.add('web');

  const panel = document.createElement('aside');
  panel.className = 'dl-panel';
  panel.innerHTML = `
    <img class="dl-icon" src="icon.png" alt="" />
    <h2>안드로이드 앱</h2>
    <div class="dl-qr" aria-label="APK 다운로드 QR코드"></div>
    <p class="dl-hint">폰 카메라로 찍으면 바로 받아져요</p>
    <a class="dl-btn" href="${APK_URL}">📱 APK 받기</a>
    ${STEPS}`;

  const bar = document.createElement('button');
  bar.className = 'dl-bar';
  bar.type = 'button';
  bar.textContent = '📱 안드로이드 앱 받기';

  const modal = document.createElement('div');
  modal.className = 'dl-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="dl-sheet" role="dialog" aria-modal="true" aria-label="안드로이드 앱 받기">
      <img class="dl-icon" src="icon.png" alt="" />
      <h2>씽씽 자동차 앱</h2>
      <a class="dl-btn" href="${APK_URL}">📱 APK 받기</a>
      ${STEPS}
      <button type="button" class="dl-close">닫기</button>
    </div>`;

  bar.addEventListener('click', () => {
    onOpen?.();
    modal.hidden = false;
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('dl-close')) modal.hidden = true;
  });

  document.body.append(panel, bar, modal);

  QRCode.toString(APK_URL, { type: 'svg', margin: 1, color: { dark: '#37474f', light: '#ffffff' } })
    .then((svg) => {
      panel.querySelector('.dl-qr').innerHTML = svg;
    })
    .catch(() => {});
}
