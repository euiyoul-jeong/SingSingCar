import { DEFAULT_SPEED, MISSION_GOAL, SPEED_PRESETS, STORAGE_KEYS } from './config.js';

// 저장된 속도(slow/normal/fast). 모르는 값이면 기본값
export function loadSpeed() {
  const key = storage.get(STORAGE_KEYS.speed);
  return key && Object.hasOwn(SPEED_PRESETS, key) ? key : DEFAULT_SPEED;
}

// 저장된 미션 개수. 없거나 범위를 벗어나면 기본값/끝값으로 맞춘다
export function loadMissionGoal() {
  const n = Number(storage.get(STORAGE_KEYS.missionGoal));
  if (!Number.isFinite(n) || n === 0) return MISSION_GOAL.default;
  return Math.min(MISSION_GOAL.max, Math.max(MISSION_GOAL.min, Math.round(n)));
}

// 거리 세는 기준이 10px=1m → 50px=1m로 바뀌어, 예전 피하기 최고 기록을 한 번만 1/5로 줄인다
export function migrateDodgeBest() {
  if (storage.get(STORAGE_KEYS.dodgeMeterV2)) return;
  const best = Number(storage.get(STORAGE_KEYS.bestDodgeM));
  if (best > 0) storage.set(STORAGE_KEYS.bestDodgeM, Math.floor(best / 5));
  storage.set(STORAGE_KEYS.dodgeMeterV2, '1');
}

// 사생활 보호 모드 등에서 localStorage가 막혀 있어도 게임은 돌아가야 한다
export const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // 저장 실패는 무시
    }
  },
};
