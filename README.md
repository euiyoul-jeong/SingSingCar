# 영우의 씽씽 자동차

만 5세용 자동차 피하기 + 두뇌 발달 미션 게임 (Phaser 3 + Vite, Capacitor로 Android 앱)

## 바로 플레이 / 앱 받기

**https://euiyoul-jeong.github.io/SingSingCar/** — 들어가면 바로 게임이 시작된다.

- PC: 게임 오른쪽 패널의 **QR코드**를 폰으로 찍으면 APK가 바로 받아진다
- 폰: 게임 아래 **📱 안드로이드 앱 받기** 띠를 누르면 다운로드 창
- APK 직접 링크(항상 최신): https://github.com/euiyoul-jeong/SingSingCar/releases/latest/download/SingSingCar.apk

앱 설치 방법: APK를 내려받아 열고 → "알 수 없는 앱 설치" 허용 → Play 프로텍트 경고가 나오면 "무시하고 설치".

## 배포 구조

- `main`에 푸시하면 GitHub Actions가 자동으로
  - `.github/workflows/android.yml`: 서명된 APK를 만들어 릴리스 `v1.0.<빌드번호>`에 첨부
  - `.github/workflows/pages.yml`: 웹 게임을 GitHub Pages 루트에 배포 (앱 받기 패널은 웹에서만, `src/web/downloadUi.js`)
- 서명 키는 GitHub Secrets(`ANDROID_KEYSTORE_BASE64` 등)에 있고, 백업은 개발 PC의 `문서\SingSingCar-서명키\`에만 있다. **잃어버리면 기존 앱 위에 업데이트할 수 없다.**
- 아이콘 다시 만들기: `node scripts/make-icons.mjs && npx capacitor-assets generate --android`

## 실행

```bash
npm install
npm run dev      # http://localhost:5173 (같은 와이파이의 폰에서는 Network 주소로 접속)
npm run build    # dist/ 생성 (Capacitor용 상대 경로 빌드)
```

## 조작

- 화면 왼쪽 절반 탭 = 왼쪽 차선, 오른쪽 절반 탭 = 오른쪽 차선
- PC: ←/→ 또는 A/D, Esc/P = 멈춤

## 규칙

시작 화면의 "놀이 [미션][피하기]"로 고른다. 두 놀이는 규칙이 따로다.
속도는 공통으로 느림 230→370 / 보통 290→480(기본) / 빠름 360→580.

### 피하기 놀이 (`src/scenes/DodgeScene.js`, 설정 `DODGE`)

- 별(생명) 3개로 시작, 차에 부딪히면 -1 (1.5초 무적), 0개가 되면 끝
- 먹을 별은 15~25초마다 하나만 나온다 (최대 5개, 5개면 안 나옴)
- 20초마다 한 단계씩 빨라지고, 단계가 오를수록 차 2대 줄이 늘어난다
- 점수 = 버틴 시간(초). 최고 기록은 피하기 놀이용으로 따로 저장

### 미션 놀이 (`src/scenes/GameScene.js`)

- 차를 피하면서, 미션에 맞는 토큰(동그란 그림/글자)을 골라 먹는다
- 미션 N개를 해내면 한 판이 끝난다 (기본 5개, 시작 화면의 ◀ ▶로 3~10개). 중간에 끝내려면 ⏸ → 그만하기
- 게임오버 없음. 차에 부딪히면 별 -1, 1.5초 동안 깜빡이며 무적
- 틀린 토큰은 별을 빼지 않고 부드러운 소리 + 음성으로 규칙을 다시 알려 준다
- 미션 성공 시 별 +3
- 미션 2개마다 한 단계씩 빨라짐 (최대 5단계)
- 도로·잔디는 차보다 1.6배 빠르게 흐르고 양옆에 바람 줄무늬가 지나간다 (속도감만, 난이도는 그대로)
- 한 줄에 차는 최대 2대라 빠져나갈 차선이 항상 있음

## 두뇌 발달 미션

네 영역이 번갈아 나오고, 영역마다 실력에 맞춰 난이도가 바뀐다
(틀린 게 1번 이하면 2단계로, 4번 이상이면 1단계로).

| 영역 | 미션 | 기르는 힘 |
|---|---|---|
| 골라 먹기 | 빨간색만 / 세모만 / 동물만 / (2단계) 빨간 동그라미만 | 선택적 주의, 충동 조절, 분류 |
| 숫자 | 사과 3개 먹기, 1→2→3 차례대로, (2단계) 더하기 | 수 세기, 순서, 기초 연산 |
| 한글 | ㄱ 찾기(2단계는 ㄱ/ㅋ처럼 헷갈리는 글자 섞기), 사→과 낱말 만들기 | 자음 구별, 글자 순서 |
| 기억·규칙 | 잠깐 본 그림 기억해서 먹기, ●▲●▲ 다음 찾기 | 작업 기억, 규칙 찾기 |

- 미션 문구는 브라우저 내장 음성(TTS, 한국어 음성이 있을 때)으로 읽어 준다
- 영역 켜고 끄기: `src/config.js`의 `MISSION_AREAS`
- 낱말·그림 추가: `src/missions/data.js`
- Android(Capacitor)로 감쌀 때는 WebView에 TTS가 없으므로 `src/audio/Voice.js`를 TTS 플러그인으로 바꿔야 한다

## 구조

| 파일 | 역할 |
|---|---|
| `src/config.js` | 속도·확률·판정 등 튜닝 값 |
| `src/scenes/BootScene.js` | 모든 그림을 코드로 생성 (실제 그림으로 바꿀 때 같은 키로 load) |
| `src/scenes/TitleScene.js` | 차 고르기 |
| `src/scenes/GameScene.js` | 본 게임 |
| `src/scenes/PauseScene.js`, `ResultScene.js` | 멈춤 / 결과 |
| `src/objects/Spawner.js` | 장애물·미션 토큰 생성 규칙 |
| `src/missions/missions.js` | 미션 8종과 난이도 조절(MissionDirector) |
| `src/missions/data.js` | 그림·낱말·자음 데이터 |
| `src/ui/MissionPanel.js` | 위쪽 미션판 |
| `src/audio/Sfx.js` | WebAudio 합성 효과음·배경음악 |
| `src/audio/Voice.js` | 음성 안내(TTS) |
