import Phaser from 'phaser';
import {
  BG_SPEED_FACTOR,
  GAME_W,
  HIT_DX,
  HIT_PAD,
  MISSION_AREAS,
  MISSION_BONUS,
  MISSIONS_PER_SPEED_UP,
  PAIR_CHANCE,
  PRAISE,
  SPEED_PRESETS,
  TOKEN_DX,
  TOKEN_DY,
} from '../config.js';
import { sfx } from '../audio/Sfx.js';
import { voice } from '../audio/Voice.js';
import { MissionDirector } from '../missions/missions.js';
import { PlayerCar } from '../objects/PlayerCar.js';
import { RoadScenery } from '../objects/RoadScenery.js';
import { Spawner } from '../objects/Spawner.js';
import { loadMissionGoal, loadSpeed } from '../storage.js';
import { Hud } from '../ui/Hud.js';
import { MissionPanel } from '../ui/MissionPanel.js';
import { makeSpecView } from '../ui/specView.js';
import { makeText } from '../ui/widgets.js';

const REMINDER_COOLDOWN_MS = 3500;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.carKey = data.carKey || 'car_red';
    this.missionGoal = data.missionGoal ?? loadMissionGoal();
    this.speedKey = data.speed ?? loadSpeed();
    this.speedSteps = SPEED_PRESETS[this.speedKey].steps;
    this.stars = 0;
    this.level = 0;
    this.director = new MissionDirector(MISSION_AREAS);
    this.mission = null;
    this.phase = 'ready';
    this.rowsSinceGood = 0;
    this.lastReminder = -Infinity;
  }

  create() {
    this.scenery = new RoadScenery(this);

    this.player = new PlayerCar(this, this.carKey);
    this.spawner = new Spawner(this, this.player);
    this.sparks = this.add
      .particles(0, 0, 'spark', {
        speed: { min: 150, max: 380 },
        lifespan: 600,
        scale: { start: 1.3, end: 0 },
        tint: [0xffeb3b, 0xffffff, 0xffc107, 0xff80ab, 0x80d8ff],
        emitting: false,
      })
      .setDepth(70);
    this.hud = new Hud(this, { onPause: () => this.pauseGame() });
    this.hud.setMission(1, this.missionGoal);
    this.panel = new MissionPanel(this);

    // 화면 왼쪽 절반 = 왼쪽, 오른쪽 절반 = 오른쪽. 버튼 위를 누른 건 무시
    this.input.on('pointerdown', (pointer, over) => {
      if (over.length) return;
      this.steer(pointer.x < GAME_W / 2 ? -1 : 1);
    });
    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => this.steer(-1));
    kb.on('keydown-A', () => this.steer(-1));
    kb.on('keydown-RIGHT', () => this.steer(1));
    kb.on('keydown-D', () => this.steer(1));
    kb.on('keydown-ESC', () => this.pauseGame());
    kb.on('keydown-P', () => this.pauseGame());

    // 다른 앱/탭으로 나가면 자동으로 멈춤 화면을 띄운다
    const onHidden = () => this.pauseGame();
    this.game.events.on(Phaser.Core.Events.HIDDEN, onHidden);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.HIDDEN, onHidden);
      sfx.stopBgm();
      voice.stop();
    });

    this.showHint();
    this.popup('출발!', '#ffeb3b');
    sfx.startBgm();
    sfx.honk();
    this.time.delayedCall(1700, () => this.startMission());
  }

  steer(dir) {
    if (this.player.move(dir)) {
      sfx.move();
      this.hideHint();
    }
  }

  pauseGame() {
    // 다 끝나고 결과 화면으로 넘어가는 중에는 멈춤 창을 띄우지 않는다
    if (!this.scene.isActive() || this.phase === 'finished') return;
    sfx.stopBgm();
    voice.stop();
    this.scene.pause();
    this.scene.launch('Pause');
  }

  // ───────── 미션 흐름: 소개 카드 → 플레이 → 성공 → 다음 미션 ─────────

  startMission() {
    const m = this.director.next();
    this.mission = m;
    this.phase = 'intro';
    this.rowsSinceGood = 0;
    this.level = Math.min(this.speedSteps.length - 1, Math.floor(this.director.completed / MISSIONS_PER_SPEED_UP));
    const current = this.director.completed + 1;
    const last = current === this.missionGoal;
    this.hud.setMission(current, this.missionGoal);
    this.panel.hide();
    voice.say(last ? `마지막 미션! ${m.intro.speech}` : m.intro.speech);
    this.showIntro(
      m.intro,
      () => {
        this.phase = 'play';
        this.panel.show(m.panel());
        if (m.intro.after) voice.say(m.intro.after);
        this.spawner.start((n) => this.rowItems(n));
      },
      last,
    );
  }

  // 빈 차선 수에 맞춰 이번 줄에 놓을 토큰을 정한다. 정답이 두 줄 넘게 안 나오는 일은 없게 한다
  rowItems(freeCount) {
    const m = this.mission;
    if (freeCount >= 2 && Math.random() < PAIR_CHANCE) {
      this.rowsSinceGood = 0;
      return Phaser.Utils.Array.Shuffle([m.correct(), m.distractor()]);
    }
    const wantGood = this.rowsSinceGood >= 1 || Math.random() < 0.5;
    this.rowsSinceGood = wantGood ? 0 : this.rowsSinceGood + 1;
    const spec = wantGood ? m.correct() : m.distractor();
    if (freeCount === 1) return [spec];
    return Math.random() < 0.5 ? [spec, null] : [null, spec];
  }

  eat(item) {
    this.spawner.removeItem(item);
    const m = this.mission;
    const { result, say } = m.judge(item.spec);

    if (result === 'good') {
      this.sparks.explode(16, item.x, item.y);
      this.floatText(item.x, item.y - 40, '+1', '#ffeb3b', 56);
      this.stars++;
      this.hud.setStars(this.stars);
      sfx.star();
      this.tweens.add({ targets: item, scale: 1.6, alpha: 0, duration: 200, onComplete: () => item.destroy() });
      if (m.done) {
        this.completeMission(say);
        return;
      }
      this.panel.render(m.panel());
      if (m.roundChanged) {
        m.roundChanged = false;
        voice.say([say, m.roundSpeech].filter(Boolean).join(' '));
      } else if (say) {
        voice.say(say);
      }
    } else if (result === 'bad') {
      m.wrong++;
      sfx.wrong();
      this.floatText(item.x, item.y - 50, '앗!', '#ff7043', 60);
      this.tweens.add({ targets: item, x: item.x + 14, duration: 50, yoyo: true, repeat: 3 });
      this.tweens.add({ targets: item, alpha: 0, scale: 0.4, delay: 250, duration: 200, onComplete: () => item.destroy() });
      this.tweens.add({ targets: this.panel.title, scale: 1.2, duration: 150, yoyo: true, repeat: 1 });
      const now = this.time.now;
      if (now - this.lastReminder > REMINDER_COOLDOWN_MS) {
        this.lastReminder = now;
        voice.say(m.reminder);
      }
    } else {
      this.tweens.add({ targets: item, alpha: 0, duration: 150, onComplete: () => item.destroy() });
    }
  }

  completeMission(say) {
    const m = this.mission;
    this.phase = 'success';
    this.director.finish(m);
    this.spawner.stop();
    this.spawner.clearItems();
    this.panel.render(m.panel());

    this.stars += MISSION_BONUS;
    this.hud.setStars(this.stars);
    sfx.success();
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 140, () =>
        this.sparks.explode(24, Phaser.Math.Between(160, 560), Phaser.Math.Between(380, 760)),
      );
    }
    const praise = Phaser.Utils.Array.GetRandom(PRAISE);
    this.popup('미션 성공!', '#ff80ab');
    this.floatText(GAME_W / 2, 600, `${praise}  ★+${MISSION_BONUS}`, '#ffeb3b', 60, 1400);
    voice.say([say, '미션 성공!', praise].filter(Boolean).join(' '));

    const allDone = this.director.completed >= this.missionGoal;
    this.time.delayedCall(2900, () => (allDone ? this.finishGame() : this.startMission()));
  }

  // 정해진 미션을 모두 해내면 한 판이 끝난다
  finishGame() {
    this.phase = 'finished';
    this.panel.hide();
    sfx.success();
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 160, () =>
        this.sparks.explode(28, Phaser.Math.Between(120, 600), Phaser.Math.Between(300, 900)),
      );
    }
    const t = makeText(this, GAME_W / 2, 560, '모든 미션\n완료!', 120, '#ffeb3b', {
      stroke: '#37474f',
      strokeThickness: 14,
      lineSpacing: 10,
    })
      .setDepth(80)
      .setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 450, ease: 'Back.Out' });
    this.tweens.add({ targets: t, angle: { from: -4, to: 4 }, duration: 400, yoyo: true, repeat: -1, delay: 450 });
    voice.say('오늘의 미션을 모두 해냈어요!');

    this.time.delayedCall(2800, () =>
      this.scene.start('Result', {
        stars: this.stars,
        carKey: this.carKey,
        missions: this.director.completed,
        goal: this.missionGoal,
        speed: this.speedKey,
        cleared: true,
      }),
    );
  }

  showIntro(intro, onDone, last = false) {
    const shows = intro.show ?? [];
    const h = shows.length ? 500 : 360;
    const c = this.add.container(GAME_W / 2, 650).setDepth(60).setScale(0.5).setAlpha(0);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.25);
    bg.fillRoundedRect(-310, -h / 2 + 12, 620, h, 44);
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(-310, -h / 2, 620, h, 44);
    bg.lineStyle(8, 0xff9800);
    bg.strokeRoundedRect(-310, -h / 2, 620, h, 44);
    const badgeW = last ? 340 : 220;
    bg.fillStyle(last ? 0xe91e63 : 0xff9800, 1);
    bg.fillRoundedRect(-badgeW / 2, -h / 2 - 36, badgeW, 72, 36);
    const badge = makeText(this, 0, -h / 2, last ? '마지막 미션!' : '미션!', 46, '#ffffff');
    const label = makeText(this, 0, shows.length ? -h / 2 + 130 : 10, intro.text, 50, '#37474f', {
      lineSpacing: 12,
    });
    c.add([bg, badge, label]);

    shows.forEach((spec, i) => {
      const view = makeSpecView(this, spec, 130);
      view.x = (i - (shows.length - 1) / 2) * 170;
      view.y = h / 2 - 125;
      c.add(view);
      this.tweens.add({ targets: view, y: view.y - 14, duration: 400, yoyo: true, repeat: -1, delay: i * 120 });
    });

    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 350, ease: 'Back.Out' });
    this.time.delayedCall(intro.ms ?? 3000, () => {
      this.tweens.add({
        targets: c,
        scale: 0.6,
        alpha: 0,
        duration: 250,
        onComplete: () => {
          this.tweens.killTweensOf(c.list);
          c.destroy();
          onDone();
        },
      });
    });
  }

  // ───────── 매 프레임 ─────────

  update(_time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const dy = this.speedSteps[this.level] * dt; // 차·토큰 (난이도)
    this.scenery.update(dy * BG_SPEED_FACTOR); // 도로·잔디·나무 (속도감)
    this.spawner.update(dy, this.level);
    this.checkHits();
  }


  checkHits() {
    const p = this.player;
    for (const car of this.spawner.cars) {
      const reachY = (car.displayHeight + p.displayHeight) / 2 - HIT_PAD;
      if (Math.abs(car.x - p.x) < HIT_DX && Math.abs(car.y - p.y) < reachY) {
        this.crash();
        break;
      }
    }
    if (this.phase !== 'play') return;
    for (const item of [...this.spawner.items]) {
      if (Math.abs(item.x - p.x) < TOKEN_DX && Math.abs(item.y - p.y) < TOKEN_DY) {
        this.eat(item);
        if (this.phase !== 'play') break;
      }
    }
  }

  crash() {
    const now = this.time.now;
    if (this.player.isInvincible(now)) return;
    this.player.hit(now);
    this.stars = Math.max(0, this.stars - 1);
    this.hud.setStars(this.stars);
    sfx.crash();
    this.cameras.main.shake(200, 0.01);
    this.floatText(this.player.x, this.player.y - 120, '쿵!', '#ff7043', 72);
  }


  showHint() {
    const style = { stroke: '#37474f', strokeThickness: 8 };
    const leftArrow = this.add.image(140, 1200, 'arrow').setFlipX(true).setScale(0.7);
    const rightArrow = this.add.image(580, 1200, 'arrow').setScale(0.7);
    const leftText = makeText(this, 140, 1110, '눌러요', 44, '#ffffff', style);
    const rightText = makeText(this, 580, 1110, '눌러요', 44, '#ffffff', style);
    this.hint = [leftArrow, rightArrow, leftText, rightText];
    for (const h of this.hint) h.setDepth(30);
    this.tweens.add({ targets: this.hint, alpha: 0.35, duration: 500, yoyo: true, repeat: -1 });
    this.time.delayedCall(8000, () => this.hideHint());
  }

  hideHint() {
    if (!this.hint) return;
    const hint = this.hint;
    this.hint = null;
    this.tweens.killTweensOf(hint);
    this.tweens.add({ targets: hint, alpha: 0, duration: 300, onComplete: () => hint.forEach((h) => h.destroy()) });
  }

  popup(str, color) {
    const t = makeText(this, GAME_W / 2, 470, str, 110, color, { stroke: '#37474f', strokeThickness: 12 })
      .setDepth(80)
      .setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 350, ease: 'Back.Out' });
    this.tweens.add({
      targets: t,
      alpha: 0,
      y: 400,
      delay: 1100,
      duration: 400,
      onComplete: () => t.destroy(),
    });
  }

  floatText(x, y, str, color, size, holdMs = 0) {
    const t = makeText(this, x, y, str, size, color, { stroke: '#37474f', strokeThickness: 8 }).setDepth(80);
    this.tweens.add({ targets: t, y: y - 80, alpha: 0, delay: holdMs, duration: 700, onComplete: () => t.destroy() });
  }
}
