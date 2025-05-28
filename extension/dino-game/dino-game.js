/**
 * Trackcrastinate - Dino Game
 * 
 * A Severance-themed version of the Chrome Dino game that appears
 * when users reach their daily time limit on unproductive sites.
 */

// Game constants
const GAME_CONFIG = {
  GRAVITY: 0.6,
  JUMP_FORCE: -10,
  SPEED: 6,
  ACCELERATION: 0.001,
  OBSTACLE_FREQUENCY: 0.02,
  SCORE_INCREMENT: 0.1,
  REQUIRED_SCORE: 100 // Score required to unlock continue button
};

// Game state
let gameState = {
  isRunning: false,
  isGameOver: false,
  score: 0,
  highScore: 0,
  speed: GAME_CONFIG.SPEED,
  groundY: 0,
  obstacles: [],
  lastObstacleTime: 0
};

// Game elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const restartButton = document.getElementById('restart-btn');
const continueButton = document.getElementById('continue-btn');

// Player object
const player = {
  x: 50,
  y: 0,
  width: 40,
  height: 40,
  velocityY: 0,
  isJumping: false,
  isDucking: false,
  
  update() {
    // Apply gravity
    this.velocityY += GAME_CONFIG.GRAVITY;
    this.y += this.velocityY;
    
    // Check ground collision
    if (this.y + this.height > gameState.groundY) {
      this.y = gameState.groundY - this.height;
      this.velocityY = 0;
      this.isJumping = false;
    }
  },
  
  jump() {
    if (!this.isJumping) {
      this.velocityY = GAME_CONFIG.JUMP_FORCE;
      this.isJumping = true;
      playSound('jump');
    }
  },
  
  duck(isDucking) {
    this.isDucking = isDucking;
    this.height = isDucking ? 20 : 40;
  },
  
  draw() {
    ctx.fillStyle = '#4A9D7C'; // Lumon green
    
    if (this.isDucking) {
      // Draw ducking player (smaller height, same width)
      ctx.fillRect(this.x, this.y + 20, this.width, this.height);
    } else {
      // Draw standing player
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  },
  
  reset() {
    this.y = 0;
    this.velocityY = 0;
    this.isJumping = false;
    this.isDucking = false;
    this.height = 40;
  }
};

// Obstacle class
class Obstacle {
  constructor(x, width, height) {
    this.x = x;
    this.y = 0;
    this.width = width;
    this.height = height;
  }
  
  update() {
    this.x -= gameState.speed;
  }
  
  draw() {
    ctx.fillStyle = '#1A535C'; // Darker teal
    this.y = gameState.groundY - this.height;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
  
  collidesWith(player) {
    return (
      player.x < this.x + this.width &&
      player.x + player.width > this.x &&
      player.y < this.y + this.height &&
      player.y + player.height > this.y
    );
  }
}

// Initialize game
function init() {
  // Set ground position
  gameState.groundY = canvas.height - 20;
  
  // Load high score from storage
  chrome.storage.local.get(['dinoHighScore'], (result) => {
    if (result.dinoHighScore) {
      gameState.highScore = result.dinoHighScore;
      highScoreElement.textContent = Math.floor(gameState.highScore);
    }
  });
  
  // Reset player position
  player.y = gameState.groundY - player.height;
  
  // Add event listeners
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  restartButton.addEventListener('click', restartGame);
  continueButton.addEventListener('click', continueBrowsing);
  
  // Draw initial game state
  drawGame();
}

// Game loop
function gameLoop() {
  if (!gameState.isRunning) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Update game state
  updateGame();
  
  // Draw game elements
  drawGame();
  
  // Continue loop
  requestAnimationFrame(gameLoop);
}

// Update game state
function updateGame() {
  // Update player
  player.update();
  
  // Update obstacles
  for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
    const obstacle = gameState.obstacles[i];
    obstacle.update();
    
    // Check collision
    if (obstacle.collidesWith(player)) {
      gameOver();
      return;
    }
    
    // Remove obstacles that are off-screen
    if (obstacle.x + obstacle.width < 0) {
      gameState.obstacles.splice(i, 1);
    }
  }
  
  // Generate new obstacles
  if (Math.random() < GAME_CONFIG.OBSTACLE_FREQUENCY && 
      Date.now() - gameState.lastObstacleTime > 1000) {
    const height = 20 + Math.random() * 30;
    const width = 20 + Math.random() * 30;
    const obstacle = new Obstacle(canvas.width, width, height);
    gameState.obstacles.push(obstacle);
    gameState.lastObstacleTime = Date.now();
  }
  
  // Update score
  gameState.score += GAME_CONFIG.SCORE_INCREMENT;
  scoreElement.textContent = Math.floor(gameState.score);
  
  // Increase speed over time
  gameState.speed += GAME_CONFIG.ACCELERATION;
  
  // Check if player has earned enough score to continue
  if (gameState.score >= GAME_CONFIG.REQUIRED_SCORE && continueButton.disabled) {
    continueButton.disabled = false;
    playSound('success');
  }
}

// Draw game elements
function drawGame() {
  // Draw ground
  ctx.fillStyle = '#E9ECEF';
  ctx.fillRect(0, gameState.groundY, canvas.width, canvas.height - gameState.groundY);
  
  // Draw player
  player.draw();
  
  // Draw obstacles
  gameState.obstacles.forEach(obstacle => obstacle.draw());
  
  // Draw game over message
  if (gameState.isGameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px "IBM Plex Sans"';
    ctx.textAlign = 'center';
    ctx.fillText('REFINEMENT FAILED', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = '16px "IBM Plex Sans"';
    ctx.fillText('Press SPACE or click RESTART to try again', canvas.width / 2, canvas.height / 2 + 20);
  }
}

// Handle key down events
function handleKeyDown(event) {
  if (event.code === 'Space') {
    event.preventDefault();
    
    if (gameState.isGameOver) {
      restartGame();
    } else if (!gameState.isRunning) {
      startGame();
    } else {
      player.jump();
    }
  } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
    event.preventDefault();
    player.duck(true);
  }
}

// Handle key up events
function handleKeyUp(event) {
  if (event.code === 'ArrowDown' || event.code === 'KeyS') {
    player.duck(false);
  }
}

// Start game
function startGame() {
  gameState.isRunning = true;
  gameState.isGameOver = false;
  gameState.score = 0;
  gameState.speed = GAME_CONFIG.SPEED;
  gameState.obstacles = [];
  player.reset();
  continueButton.disabled = true;
  
  // Start game loop
  gameLoop();
}

// Game over
function gameOver() {
  gameState.isRunning = false;
  gameState.isGameOver = true;
  
  // Update high score
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    highScoreElement.textContent = Math.floor(gameState.highScore);
    
    // Save high score to storage
    chrome.storage.local.set({ dinoHighScore: gameState.highScore });
  }
  
  playSound('gameOver');
}

// Restart game
function restartGame() {
  startGame();
}

// Continue browsing
function continueBrowsing() {
  // Notify the extension that the user has completed the game
  chrome.runtime.sendMessage({
    type: 'LIMIT_ENFORCED',
    action: 'GAME_COMPLETED',
    score: Math.floor(gameState.score)
  });
  
  // Check if we're in an iframe
  if (window.parent !== window) {
    try {
      // Send message to parent window
      window.parent.postMessage({
        type: 'DINO_GAME_COMPLETED',
        score: Math.floor(gameState.score)
      }, '*');
    } catch (error) {
      console.error('Error sending message to parent:', error);
    }
  } else {
    // Close the window if not in iframe
    window.close();
  }
}

// Play sound (placeholder function)
function playSound(sound) {
  // In a real implementation, this would play actual sounds
  console.log(`Playing sound: ${sound}`);
}

// Initialize the game when the page loads
window.addEventListener('load', init);
