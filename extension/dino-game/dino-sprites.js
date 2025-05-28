/**
 * Trackcrastinate - Dino Game Sprites
 * 
 * This file contains sprite definitions for the Dino game.
 * In a full implementation, this would contain actual sprite data and rendering logic.
 * For now, it's a minimal placeholder to ensure the game loads properly.
 */

// Sprite definitions (placeholder)
const SPRITES = {
  // Player sprites
  PLAYER: {
    RUNNING: [
      { x: 0, y: 0, width: 40, height: 40 },
      { x: 40, y: 0, width: 40, height: 40 }
    ],
    JUMPING: { x: 80, y: 0, width: 40, height: 40 },
    DUCKING: [
      { x: 120, y: 0, width: 40, height: 20 },
      { x: 160, y: 0, width: 40, height: 20 }
    ]
  },
  
  // Obstacle sprites
  OBSTACLES: {
    SMALL_CACTUS: { x: 200, y: 0, width: 20, height: 40 },
    LARGE_CACTUS: { x: 220, y: 0, width: 20, height: 60 },
    PTERODACTYL: [
      { x: 240, y: 0, width: 40, height: 30 },
      { x: 280, y: 0, width: 40, height: 30 }
    ]
  },
  
  // Environment sprites
  CLOUD: { x: 320, y: 0, width: 40, height: 20 },
  GROUND: { x: 0, y: 40, width: 600, height: 20 },
  
  // UI sprites
  GAME_OVER: { x: 0, y: 60, width: 200, height: 40 },
  RESTART: { x: 0, y: 100, width: 40, height: 40 }
};

// Sprite sheet (placeholder)
const spriteSheet = {
  image: null,
  loaded: false,
  
  // In a real implementation, this would load an actual image
  load() {
    console.log('Sprite sheet loaded (placeholder)');
    this.loaded = true;
  }
};

// Initialize sprites
function initSprites() {
  spriteSheet.load();
}

// Draw sprite (placeholder function)
function drawSprite(ctx, sprite, x, y) {
  // In a real implementation, this would draw from the sprite sheet
  // For now, just draw colored rectangles
  
  ctx.fillStyle = '#4A9D7C'; // Lumon green
  ctx.fillRect(x, y, sprite.width, sprite.height);
}

// Export functions and objects
window.SPRITES = SPRITES;
window.spriteSheet = spriteSheet;
window.initSprites = initSprites;
window.drawSprite = drawSprite;

// Initialize sprites when the script loads
initSprites();
