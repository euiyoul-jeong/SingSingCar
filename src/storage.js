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
