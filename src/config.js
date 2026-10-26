// 게임 튜닝 값은 모두 여기서 조정한다

export const GAME_W = 720;
export const GAME_H = 1280;

// 도로: 가운데 480px, 양옆 120px은 잔디
export const ROAD_X = 120;
export const ROAD_W = 480;
export const LANE_X = [200, 360, 520];
export const PLAYER_Y = 1060;

// 도로 속도(px/초). 미션을 2개 해낼 때마다 한 단계씩 빨라지고 마지막 단계에서 멈춘다.
// 토큰을 보고 생각할 시간이 필요하므로 느리게 시작한다
export const SPEED_STEPS = [190, 220, 250, 280, 310];
export const MISSIONS_PER_SPEED_UP = 2;

// 장애물 줄 사이 거리(px). 미션이 시작되면 첫 줄은 조금 빨리 나온다
export const ROW_GAP = 520;
export const FIRST_ROW_GAP = 300;
// 속도 단계별로 한 줄에 차 2대가 나올 확률 (3대는 절대 안 나온다)
export const TWO_CAR_CHANCE = [0.1, 0.15, 0.2, 0.25, 0.3];
// 빈 차선이 2개일 때: 정답+오답을 함께 낼 확률 (나머지는 하나만)
export const PAIR_CHANCE = 0.7;

// 두뇌 발달 미션 영역: attention(골라 먹기) number(숫자) hangul(한글) memory(기억·규칙)
export const MISSION_AREAS = ['attention', 'number', 'hangul', 'memory'];
// 미션 성공 보너스 별
export const MISSION_BONUS = 3;
// 한 판의 미션 개수: 이만큼 해내면 한 판이 끝난다 (시작 화면에서 조절)
export const MISSION_GOAL = { default: 5, min: 3, max: 10 };

// 충돌 판정 (아이에게 너그럽게 히트박스를 줄인다)
export const HIT_DX = 80;
export const HIT_PAD = 30;
export const TOKEN_DX = 95;
export const TOKEN_DY = 120;
export const INVINCIBLE_MS = 1500;

export const MOVE_MS = 150;

export const PLAYER_CARS = [
  { key: 'car_red', name: '빨간 차' },
  { key: 'car_blue', name: '파란 차' },
  { key: 'car_police', name: '경찰차' },
  { key: 'car_fire', name: '소방차' },
];

export const OBSTACLE_KEYS = ['obs_yellow', 'obs_green', 'obs_purple', 'obs_orange', 'obs_teal', 'obs_truck'];

export const PRAISE = ['잘했어!', '최고야!', '멋져!', '대단해!', '짱이야!'];

export const FONT =
  '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

export const STORAGE_KEYS = {
  car: 'cargame.car',
  best: 'cargame.best',
  muted: 'cargame.muted',
  missionGoal: 'cargame.missionGoal',
};
