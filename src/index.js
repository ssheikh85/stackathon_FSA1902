import { animationLoop } from './animate';
/** @type {import("../typings/phaser")} */

// Bring in all the scenes
import 'phaser';
import config from './config/config'

class Game extends Phaser.Game {
  constructor() {
    // Add the config file to the game
    super(config);

    // Add all the scenes
    // << ADD ALL SCENES HERE >>

    // Start the game with the mainscene
    // << START GAME WITH MAIN SCENE HERE >>
  }
}
// Create new instance of game
window.onload = function () {
  window.game = new Game();
}

animationLoop();
