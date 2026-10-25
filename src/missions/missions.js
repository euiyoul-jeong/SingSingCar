import {
  BASIC_COLORS,
  BASIC_CONSONANTS,
  CATEGORIES,
  COLORS,
  CONFUSABLE,
  CONSONANTS,
  NATIVE_COUNT,
  NUMBER_COLORS,
  FRUITS,
  SHAPES,
  WORDS_2,
  WORDS_3,
  objectJosa,
} from './data.js';

// 미션 공통 규칙
// - intro: 시작 카드 { text, speech, show: [spec], ms }
// - panel(): 위쪽 미션판 { title, slots }
// - correct()/distractor(): 도로에 내보낼 정답/오답 토큰 spec
// - judge(spec): 먹었을 때 { result: 'good' | 'bad' | 'neutral', say? }
// - done, wrong(틀린 횟수), reminder(틀렸을 때 다시 알려 줄 말)
//
// spec: 토큰 하나의 모양. { t: 'emoji' | 'text' | 'shape', id, ... }
// slot: { kind: 'dot' | 'spec' | 'hidden' | 'question' | 'symbol' | 'show', ... }

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const without = (arr, exclude) => arr.filter((x) => !exclude.includes(x));
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

const emojiSpec = (item, cat) => ({ t: 'emoji', v: item.e, name: item.name, cat, id: item.e });
const shapeSpec = (shape, color) => ({ t: 'shape', shape, color, id: `${shape}_${color}` });
const numberSpec = (n) => ({ t: 'text', v: String(n), color: NUMBER_COLORS[n % NUMBER_COLORS.length], id: `n${n}` });
const letterSpec = (v) => ({ t: 'text', v, color: '#37474f', id: `l${v}` });

// 숫자를 한자어로 읽을 때의 조사: 1(일)은 2(이)는 3(삼)은 4(사)는 5(오)는 6(육)은
const NUM_TOPIC = ['', '은', '는', '은', '는', '는', '은'];

const dots = (goal, got) => Array.from({ length: goal }, (_, i) => ({ kind: 'dot', filled: i < got }));

// ───────── 주의력: 골라 먹기 ─────────
class SelectMission {
  constructor(level) {
    this.area = 'attention';
    this.level = level;
    this.goal = level === 1 ? 5 : 6;
    this.got = 0;
    this.wrong = 0;
    this.variant = pick(level === 1 ? ['color', 'shape', 'category'] : ['color', 'category', 'both', 'both']);
    const shapes = Object.keys(SHAPES);
    const colors = level === 1 ? BASIC_COLORS : Object.keys(COLORS);

    if (this.variant === 'color') {
      const c = pick(colors);
      this.test = (s) => s.color === c;
      this.correct = () => shapeSpec(pick(shapes), c);
      this.distractor = () => shapeSpec(pick(shapes), pick(without(colors, [c])));
      this.rule = `${COLORS[c].name}만 먹어요!`;
    } else if (this.variant === 'shape') {
      const sh = pick(shapes);
      this.test = (s) => s.shape === sh;
      this.correct = () => shapeSpec(sh, pick(colors));
      this.distractor = () => shapeSpec(pick(without(shapes, [sh])), pick(colors));
      this.rule = `${SHAPES[sh].name}만 먹어요!`;
    } else if (this.variant === 'category') {
      const cat = pick(Object.keys(CATEGORIES));
      const others = without(Object.keys(CATEGORIES), [cat]);
      this.test = (s) => s.cat === cat;
      this.correct = () => emojiSpec(pick(CATEGORIES[cat].items), cat);
      this.distractor = () => {
        const o = pick(others);
        return emojiSpec(pick(CATEGORIES[o].items), o);
      };
      this.rule = `${CATEGORIES[cat].name}만 먹어요!`;
    } else {
      // 색과 모양을 함께 봐야 하는 어려운 단계: 오답은 둘 중 하나만 맞는다
      const c = pick(colors);
      const sh = pick(shapes);
      this.test = (s) => s.color === c && s.shape === sh;
      this.correct = () => shapeSpec(sh, c);
      this.distractor = () =>
        Math.random() < 0.5
          ? shapeSpec(sh, pick(without(colors, [c])))
          : shapeSpec(pick(without(shapes, [sh])), c);
      this.rule = `${COLORS[c].adj} ${SHAPES[sh].name}만 먹어요!`;
    }
    this.reminder = this.rule;
    // 예시는 규칙만 같고 나머지는 서로 다르게 보여 줘야 규칙을 헷갈리지 않는다
    // (동그라미 미션에 파란 동그라미 하나만 보이면 '파란 것'으로 오해할 수 있다)
    let examples;
    if (this.variant === 'color') {
      examples = shuffle(shapes).slice(0, 3).map((sh) => shapeSpec(sh, this.correct().color));
    } else if (this.variant === 'shape') {
      examples = shuffle(colors).slice(0, 3).map((c) => shapeSpec(this.correct().shape, c));
    } else if (this.variant === 'category') {
      const cat = this.correct().cat;
      examples = shuffle(CATEGORIES[cat].items).slice(0, 3).map((it) => emojiSpec(it, cat));
    } else {
      examples = [this.correct()];
    }
    this.intro = { text: this.rule, speech: this.rule, show: examples };
  }

  panel() {
    return { title: this.rule.replace(' 먹어요', ''), slots: dots(this.goal, this.got) };
  }

  judge(spec) {
    if (!this.test(spec)) return { result: 'bad' };
    this.got++;
    return { result: 'good' };
  }

  get done() {
    return this.got >= this.goal;
  }
}

// ───────── 숫자: 세기 ─────────
class CountMission {
  constructor(level) {
    this.area = 'number';
    this.variant = 'count';
    this.level = level;
    this.wrong = 0;
    this.fruit = pick(FRUITS);
    this.goal = level === 1 ? 3 : pick([4, 5]);
    this.got = 0;
    const text = `${this.fruit.name} ${this.goal}개를 먹어요!`;
    this.intro = { text, speech: text, show: [emojiSpec(this.fruit, 'fruit')] };
    this.reminder = `${this.fruit.name}만 먹어요!`;
  }

  correct() {
    return emojiSpec(this.fruit, 'fruit');
  }

  distractor() {
    return emojiSpec(pick(without(FRUITS, [this.fruit])), 'fruit');
  }

  panel() {
    const spec = this.correct();
    return {
      title: `${this.fruit.name} ${this.goal}개`,
      slots: Array.from({ length: this.goal }, (_, i) => ({ kind: 'spec', spec, filled: i < this.got, next: i === this.got })),
    };
  }

  judge(spec) {
    if (spec.id !== this.fruit.e) return { result: 'bad' };
    if (this.done) return { result: 'neutral' };
    this.got++;
    return { result: 'good', say: NATIVE_COUNT[this.got - 1] };
  }

  get done() {
    return this.got >= this.goal;
  }
}

// ───────── 숫자: 차례대로 ─────────
class SequenceMission {
  constructor(level) {
    this.area = 'number';
    this.variant = 'sequence';
    this.level = level;
    this.wrong = 0;
    this.max = level === 1 ? 3 : 5;
    this.next = 1;
    const list = range(1, this.max).join(', ');
    this.intro = { text: `${list}\n차례대로 먹어요!`, speech: `${list}, 차례대로 먹어요!`, show: [numberSpec(1)] };
    this.reminder = '1부터 차례대로 먹어요!';
  }

  correct() {
    return numberSpec(this.next);
  }

  distractor() {
    return numberSpec(pick(without(range(1, this.max + 2), range(1, this.next))));
  }

  panel() {
    return {
      title: '차례대로!',
      slots: range(1, this.max).map((n) => ({ kind: 'spec', spec: numberSpec(n), filled: n < this.next, next: n === this.next })),
    };
  }

  judge(spec) {
    const n = Number(spec.v);
    if (n === this.next) {
      this.next++;
      return { result: 'good', say: String(n) };
    }
    return { result: n < this.next ? 'neutral' : 'bad' };
  }

  get done() {
    return this.next > this.max;
  }
}

// ───────── 숫자: 더하기 ─────────
class AddMission {
  constructor(level) {
    this.area = 'number';
    this.variant = 'add';
    this.level = level;
    this.wrong = 0;
    this.rounds = 3;
    this.round = 0;
    this.newRound();
    this.intro = {
      text: '더하기 놀이!\n정답 숫자를 먹어요',
      speech: '더하기 놀이! 정답 숫자를 먹어요!',
      show: [],
      ms: 2600,
      after: this.roundSpeech,
    };
  }

  newRound() {
    this.a = pick(range(1, 3));
    this.b = pick(range(1, 5 - this.a));
    this.answer = this.a + this.b;
    this.item = pick(FRUITS);
    this.roundSpeech = `${this.a} 더하기 ${this.b}${NUM_TOPIC[this.b]}?`;
    this.reminder = this.roundSpeech;
  }

  correct() {
    return numberSpec(this.answer);
  }

  distractor() {
    return numberSpec(pick(without(range(1, 6), [this.answer])));
  }

  panel() {
    const spec = emojiSpec(this.item, 'fruit');
    const group = (n) => Array.from({ length: n }, () => ({ kind: 'show', spec }));
    return {
      title: `${this.a} + ${this.b} = ?   (${this.round + 1}/${this.rounds})`,
      slots: [...group(this.a), { kind: 'symbol', v: '+' }, ...group(this.b), { kind: 'symbol', v: '=' }, { kind: 'question' }],
    };
  }

  judge(spec) {
    if (Number(spec.v) !== this.answer) return { result: 'bad' };
    const say = `${this.a} 더하기 ${this.b}${NUM_TOPIC[this.b]} ${this.answer}!`;
    this.round++;
    if (!this.done) {
      this.newRound();
      this.roundChanged = true;
    }
    return { result: 'good', say };
  }

  get done() {
    return this.round >= this.rounds;
  }
}

// ───────── 한글: 자음 찾기 ─────────
class ConsonantMission {
  constructor(level) {
    this.area = 'hangul';
    this.variant = 'consonant';
    this.level = level;
    this.wrong = 0;
    this.pool = level === 1 ? BASIC_CONSONANTS : Object.keys(CONSONANTS);
    this.target = pick(this.pool);
    this.goal = 4;
    this.got = 0;
    const name = CONSONANTS[this.target];
    this.intro = {
      text: `${this.target}(${name})을 찾아요!`,
      speech: `${name}을 찾아요!`,
      show: [letterSpec(this.target)],
    };
    this.reminder = `${name}을 찾아요!`;
  }

  correct() {
    return letterSpec(this.target);
  }

  distractor() {
    const twin = CONFUSABLE[this.target];
    if (this.level > 1 && twin && Math.random() < 0.5) return letterSpec(twin);
    return letterSpec(pick(without(this.pool, [this.target])));
  }

  panel() {
    const spec = this.correct();
    return {
      title: `${this.target} 찾기!`,
      slots: Array.from({ length: this.goal }, (_, i) => ({ kind: 'spec', spec, filled: i < this.got, next: i === this.got })),
    };
  }

  judge(spec) {
    if (spec.v !== this.target) return { result: 'bad' };
    this.got++;
    return { result: 'good', say: CONSONANTS[this.target] };
  }

  get done() {
    return this.got >= this.goal;
  }
}

// ───────── 한글: 낱말 만들기 ─────────
class WordMission {
  constructor(level) {
    this.area = 'hangul';
    this.variant = 'word';
    this.level = level;
    this.wrong = 0;
    this.words = shuffle(level === 1 ? WORDS_2 : WORDS_3).slice(0, 2);
    this.syllablePool = [...new Set([...WORDS_2, ...WORDS_3].flatMap((w) => [...w.word]))];
    this.round = 0;
    this.setWord();
    const w = this.current.word;
    this.intro = {
      text: `글자를 차례대로 먹어서\n${w}${objectJosa(w)} 만들어요!`,
      speech: `글자를 차례대로 먹어서 ${w}${objectJosa(w)} 만들어요!`,
      show: [{ t: 'emoji', v: this.current.e, id: 'w' }],
      ms: 3400,
    };
  }

  setWord() {
    this.current = this.words[this.round];
    this.syllables = [...this.current.word];
    this.idx = 0;
    const w = this.current.word;
    this.roundSpeech = `이번엔 ${w}${objectJosa(w)} 만들어요!`;
    this.reminder = `${this.syllables[0]}부터 차례대로 먹어요!`;
  }

  correct() {
    return letterSpec(this.syllables[this.idx]);
  }

  distractor() {
    return letterSpec(pick(without(this.syllablePool, [this.syllables[this.idx]])));
  }

  panel() {
    return {
      title: `${this.current.e} ${this.current.word} 만들기`,
      slots: this.syllables.map((s, i) => ({ kind: 'spec', spec: letterSpec(s), filled: i < this.idx, next: i === this.idx })),
    };
  }

  judge(spec) {
    if (spec.v === this.syllables[this.idx]) {
      this.idx++;
      if (this.idx < this.syllables.length) return { result: 'good', say: spec.v };
      const say = `${this.current.word}!`;
      this.round++;
      if (!this.done) {
        this.setWord();
        this.roundChanged = true;
      }
      return { result: 'good', say };
    }
    return { result: this.syllables.slice(0, this.idx).includes(spec.v) ? 'neutral' : 'bad' };
  }

  get done() {
    return this.round >= this.words.length;
  }
}

// ───────── 기억: 잘 보고 기억하기 ─────────
class MemoryMission {
  constructor(level) {
    this.area = 'memory';
    this.variant = 'memory';
    this.level = level;
    this.wrong = 0;
    const catKey = pick(Object.keys(CATEGORIES));
    const items = CATEGORIES[catKey].items;
    const count = level === 1 ? 2 : 3;
    this.targets = shuffle(items).slice(0, count).map((it) => emojiSpec(it, catKey));
    this.others = without(items, items.filter((it) => this.targets.some((t) => t.id === it.e))).map((it) =>
      emojiSpec(it, catKey),
    );
    this.eaten = new Set();
    this.intro = {
      text: '잘 보고 기억해요!',
      speech: '잘 보고 기억해요!',
      show: this.targets,
      ms: level === 1 ? 4000 : 5000,
      after: '기억한 것을 먹어요!',
    };
    this.reminder = '아까 본 것만 먹어요!';
  }

  correct() {
    const left = this.targets.filter((t) => !this.eaten.has(t.id));
    return pick(left.length ? left : this.targets);
  }

  distractor() {
    return pick(this.others);
  }

  panel() {
    return {
      title: '기억한 것 먹기!',
      slots: this.targets.map((t) => ({ kind: 'hidden', spec: t, filled: this.eaten.has(t.id) })),
    };
  }

  judge(spec) {
    if (!this.targets.some((t) => t.id === spec.id)) return { result: 'bad' };
    if (this.eaten.has(spec.id)) return { result: 'neutral' };
    this.eaten.add(spec.id);
    return { result: 'good', say: spec.name };
  }

  get done() {
    return this.eaten.size >= this.targets.length;
  }
}

// ───────── 기억: 규칙 찾기 ─────────
class PatternMission {
  constructor(level) {
    this.area = 'memory';
    this.variant = 'pattern';
    this.level = level;
    this.wrong = 0;
    this.rounds = 3;
    this.round = 0;
    this.newRound();
    this.intro = { text: '규칙을 찾아서\n다음 것을 먹어요!', speech: '규칙을 찾아서 다음 것을 먹어요!', show: [], ms: 2800 };
    this.roundSpeech = null;
    this.reminder = '다음에 올 것을 먹어요!';
  }

  newRound() {
    // 모양+색 또는 동물 그림으로 AB / ABC / AAB 규칙을 만든다
    let pool;
    if (Math.random() < 0.5) {
      const shapes = shuffle(Object.keys(SHAPES));
      const colors = shuffle(BASIC_COLORS);
      pool = [0, 1, 2, 3].map((i) => shapeSpec(shapes[i], colors[i]));
    } else {
      pool = shuffle(CATEGORIES.animal.items).slice(0, 4).map((it) => emojiSpec(it, 'animal'));
    }
    const [A, B, C, D] = pool;
    const kind = this.level === 1 ? 'AB' : pick(['ABC', 'AAB']);
    const unit = kind === 'AB' ? [A, B] : kind === 'ABC' ? [A, B, C] : [A, A, B];
    const seq = Array.from({ length: 6 }, (_, i) => unit[i % unit.length]);
    this.shown = seq.slice(0, 5);
    this.answer = seq[5];
    this.wrongPool = [...new Set(unit)].filter((s) => s.id !== this.answer.id).concat(kind === 'AB' ? [C] : [D]);
  }

  correct() {
    return this.answer;
  }

  distractor() {
    return pick(this.wrongPool);
  }

  panel() {
    return {
      title: `다음은 뭘까?   (${this.round + 1}/${this.rounds})`,
      slots: [...this.shown.map((spec) => ({ kind: 'show', spec })), { kind: 'question' }],
    };
  }

  judge(spec) {
    if (spec.id !== this.answer.id) return { result: 'bad' };
    this.round++;
    if (!this.done) {
      this.newRound();
      this.roundChanged = true;
      this.roundSpeech = '다음은 뭘까?';
    }
    return { result: 'good', say: '맞았어!' };
  }

  get done() {
    return this.round >= this.rounds;
  }
}

const FACTORIES = {
  attention: () => [SelectMission],
  number: (level) => (level === 1 ? [CountMission, SequenceMission] : [CountMission, SequenceMission, AddMission]),
  hangul: () => [ConsonantMission, WordMission],
  memory: () => [MemoryMission, PatternMission],
};

export const AREA_NAMES = { attention: '골라 먹기', number: '숫자', hangul: '한글', memory: '기억·규칙' };

// 영역을 번갈아 내고, 영역별 난이도를 아이 실력에 맞춰 올리고 내린다
export class MissionDirector {
  constructor(areas) {
    this.areas = areas;
    this.levels = Object.fromEntries(areas.map((a) => [a, 1]));
    this.queue = [];
    this.lastVariant = null;
    this.completed = 0;
  }

  next() {
    if (!this.queue.length) this.queue = shuffle(this.areas);
    const area = this.queue.shift();
    const level = this.levels[area];
    let mission;
    for (let tries = 0; tries < 6; tries++) {
      const Kind = pick(FACTORIES[area](level));
      mission = new Kind(level);
      if (mission.variant !== this.lastVariant) break;
    }
    this.lastVariant = mission.variant;
    return mission;
  }

  finish(mission) {
    this.completed++;
    const lv = this.levels[mission.area];
    if (mission.wrong <= 1) this.levels[mission.area] = Math.min(2, lv + 1);
    else if (mission.wrong >= 4) this.levels[mission.area] = Math.max(1, lv - 1);
  }
}
