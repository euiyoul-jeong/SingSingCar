// 게임 튜닝 값은 모두 여기서 조정한다

export const GAME_W = 720;
export const GAME_H = 1280;

// 도로: 가운데 480px, 양옆 120px은 잔디
export const ROAD_X = 120;
export const ROAD_W = 480;
export const LANE_X = [200, 360, 520];
export const PLAYER_Y = 1060;

// 도로 속도(px/초). 30초마다 한 단계씩 빨라지고 마지막 단계에서 멈춘다
export const SPEED_STEPS = [240, 290, 340, 390, 430];
export const SPEED_UP_MS = 30000;

// 장애물 줄 사이 거리(px). 첫 줄은 조금 더 늦게 나온다
export const ROW_GAP = 460;
export const FIRST_ROW_GAP = 700;
// 속도 단계별로 한 줄에 차 2대가 나올 확률 (3대는 절대 안 나온다)
export const TWO_CAR_CHANCE = [0.1, 0.2, 0.3, 0.35, 0.4];
// 차 줄의 빈 차선에 별이 나올 확률, 줄과 줄 사이에 별이 나올 확률
export const STAR_CHANCE = 0.6;
export const MID_STAR_CHANCE = 0.3;

// 충돌 판정 (아이에게 너그럽게 히트박스를 줄인다)
export const HIT_DX = 80;
export const HIT_PAD = 30;
export const STAR_DX = 95;
export const STAR_DY = 120;
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

export const FONT = '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

export const STORAGE_KEYS = {
  car: 'cargame.car',
  best: 'cargame.best',
  muted: 'cargame.muted',
};
