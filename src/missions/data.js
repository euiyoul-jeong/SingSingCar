// 미션에 쓰는 낱말·그림 데이터

export const ANIMALS = [
  { e: '🐶', name: '강아지' },
  { e: '🐱', name: '고양이' },
  { e: '🐰', name: '토끼' },
  { e: '🐻', name: '곰' },
  { e: '🐷', name: '돼지' },
  { e: '🐸', name: '개구리' },
  { e: '🐵', name: '원숭이' },
  { e: '🐯', name: '호랑이' },
  { e: '🦁', name: '사자' },
  { e: '🐘', name: '코끼리' },
];

export const FRUITS = [
  { e: '🍎', name: '사과' },
  { e: '🍌', name: '바나나' },
  { e: '🍇', name: '포도' },
  { e: '🍓', name: '딸기' },
  { e: '🍊', name: '귤' },
  { e: '🍉', name: '수박' },
  { e: '🍑', name: '복숭아' },
  { e: '🍒', name: '체리' },
];

export const VEHICLES = [
  { e: '🚗', name: '자동차' },
  { e: '🚌', name: '버스' },
  { e: '🚒', name: '소방차' },
  { e: '🚓', name: '경찰차' },
  { e: '🚂', name: '기차' },
  { e: '🚲', name: '자전거' },
  { e: '🚀', name: '로켓' },
  { e: '🚁', name: '헬리콥터' },
];

export const CATEGORIES = {
  animal: { name: '동물', items: ANIMALS },
  fruit: { name: '과일', items: FRUITS },
  vehicle: { name: '탈것', items: VEHICLES },
};

// adj: "빨간 동그라미"처럼 꾸밀 때
export const COLORS = {
  red: { name: '빨간색', adj: '빨간', hex: 0xe53935 },
  blue: { name: '파란색', adj: '파란', hex: 0x1e88e5 },
  yellow: { name: '노란색', adj: '노란', hex: 0xfdd835 },
  green: { name: '초록색', adj: '초록', hex: 0x43a047 },
  purple: { name: '보라색', adj: '보라', hex: 0x8e24aa },
};
export const BASIC_COLORS = ['red', 'blue', 'yellow', 'green'];

export const SHAPES = {
  circle: { name: '동그라미' },
  triangle: { name: '세모' },
  square: { name: '네모' },
  heart: { name: '하트' },
};

export const CONSONANTS = {
  ㄱ: '기역', ㄴ: '니은', ㄷ: '디귿', ㄹ: '리을', ㅁ: '미음', ㅂ: '비읍', ㅅ: '시옷',
  ㅇ: '이응', ㅈ: '지읒', ㅊ: '치읓', ㅋ: '키읔', ㅌ: '티읕', ㅍ: '피읖', ㅎ: '히읗',
};
export const BASIC_CONSONANTS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ'];
// 헷갈리기 쉬운 짝 (2단계에서 일부러 섞는다)
export const CONFUSABLE = { ㄱ: 'ㅋ', ㅋ: 'ㄱ', ㄷ: 'ㅌ', ㅌ: 'ㄷ', ㅂ: 'ㅍ', ㅍ: 'ㅂ', ㅈ: 'ㅊ', ㅊ: 'ㅈ', ㅇ: 'ㅎ', ㅎ: 'ㅇ', ㄴ: 'ㄷ', ㅁ: 'ㅂ', ㄹ: 'ㄷ', ㅅ: 'ㅈ' };

export const WORDS_2 = [
  { word: '사과', e: '🍎' },
  { word: '포도', e: '🍇' },
  { word: '기차', e: '🚂' },
  { word: '나비', e: '🦋' },
  { word: '오리', e: '🦆' },
  { word: '하마', e: '🦛' },
  { word: '토끼', e: '🐰' },
  { word: '우유', e: '🥛' },
  { word: '모자', e: '🧢' },
  { word: '사자', e: '🦁' },
];
export const WORDS_3 = [
  { word: '바나나', e: '🍌' },
  { word: '자동차', e: '🚗' },
  { word: '비행기', e: '✈️' },
  { word: '고양이', e: '🐱' },
  { word: '강아지', e: '🐶' },
  { word: '코끼리', e: '🐘' },
  { word: '원숭이', e: '🐵' },
  { word: '자전거', e: '🚲' },
];

export const NATIVE_COUNT = ['하나', '둘', '셋', '넷', '다섯', '여섯'];

export const NUMBER_COLORS = ['#e53935', '#fb8c00', '#43a047', '#1e88e5', '#8e24aa', '#00897b', '#d81b60'];

// 받침이 있으면 '을', 없으면 '를'
export function objectJosa(word) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return '을';
  return code % 28 === 0 ? '를' : '을';
}
