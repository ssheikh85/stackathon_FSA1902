export default {
  type: Phaser.AUTO, // Specify the underlying browser rendering engine (AUTO, CANVAS, WEBGL)
  // AUTO will attempt to use WEBGL, but if not available it'll default to CANVAS
  width: window.innerWidth, // Game width in pixels
  height: window.innerHeight, // Game height in pixels
  //  We will be expanding physics later
  physics: {
    default: 'arcade'
  }
};
