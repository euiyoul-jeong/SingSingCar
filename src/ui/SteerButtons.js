const DEPTH = 30;
const Y = 1190;
const ALPHA = 0.9;

// 화면 아래 양쪽의 좌우 버튼. 어디를 누르면 되는지 보여 주기만 한다.
// 일부러 setInteractive를 하지 않아서, 이동은 지금처럼 장면의 화면 절반 판정이 맡는다
export class SteerButtons {
  constructor(scene) {
    this.scene = scene;
    this.left = scene.add.image(100, Y, 'btn_steer').setFlipX(true);
    this.right = scene.add.image(620, Y, 'btn_steer');
    this.blinkTween = null;
    for (const b of [this.left, this.right]) b.setDepth(DEPTH).setAlpha(ALPHA);
  }

  // 누른 쪽 버튼이 눌린 것처럼 잠깐 작아졌다 돌아온다
  press(dir) {
    const b = dir < 0 ? this.left : this.right;
    this.scene.tweens.add({ targets: b, scale: { from: 0.85, to: 1 }, duration: 160, ease: 'Back.Out' });
  }

  // 처음 안내할 때 깜빡인다
  blink(on) {
    this.blinkTween?.stop();
    this.blinkTween = null;
    const both = [this.left, this.right];
    for (const b of both) b.setAlpha(ALPHA);
    if (on) this.blinkTween = this.scene.tweens.add({ targets: both, alpha: 0.35, duration: 500, yoyo: true, repeat: -1 });
  }
}
