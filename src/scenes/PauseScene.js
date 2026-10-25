import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config.js';
import { sfx } from '../audio/Sfx.js';
import { makeButton, makeText } from '../ui/widgets.js';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create() {
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.55).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(0xffffff, 1);
    panel.fillRoundedRect(80, 340, GAME_W - 160, 600, 48);
    makeText(this, GAME_W / 2, 450, '잠깐 쉬어요', 72, '#37474f');

    makeButton(this, GAME_W / 2, 620, '계속하기', { color: 0x43a047, width: 440, onClick: () => this.resumeGame() });
    makeButton(this, GAME_W / 2, 800, '그만하기', { color: 0xfb8c00, width: 440, onClick: () => this.quit() });

    const kb = this.input.keyboard;
    kb.on('keydown-ESC', () => this.resumeGame());
    kb.on('keydown-P', () => this.resumeGame());
    kb.on('keydown-ENTER', () => this.resumeGame());
  }

  resumeGame() {
    this.scene.resume('Game');
    this.scene.stop();
    sfx.startBgm();
  }

  quit() {
    const game = this.scene.get('Game');
    const data = { stars: game.stars, carKey: game.carKey, missions: game.director.completed };
    this.scene.stop('Game');
    this.scene.start('Result', data);
  }
}
