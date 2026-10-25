# 씽씽 자동차

만 5세용 자동차 피하기 게임 (Phaser 3 + Vite, 웹 우선 → 이후 Capacitor로 Android)

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

- 게임오버 없음. 부딪히면 별 -1, 1.5초 동안 깜빡이며 무적
- 30초마다 조금씩 빨라짐 (최대 5단계)
- 한 줄에 차는 최대 2대라 빠져나갈 차선이 항상 있음

## 구조

| 파일 | 역할 |
|---|---|
| `src/config.js` | 속도·확률·판정 등 튜닝 값 |
| `src/scenes/BootScene.js` | 모든 그림을 코드로 생성 (실제 그림으로 바꿀 때 같은 키로 load) |
| `src/scenes/TitleScene.js` | 차 고르기 |
| `src/scenes/GameScene.js` | 본 게임 |
| `src/scenes/PauseScene.js`, `ResultScene.js` | 멈춤 / 결과 |
| `src/objects/Spawner.js` | 장애물·별 생성 규칙 |
| `src/audio/Sfx.js` | WebAudio 합성 효과음·배경음악 |
