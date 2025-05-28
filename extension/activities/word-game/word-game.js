/**
 * Trackcrastinate - Word Game Activity
 * 
 * This script implements a Wordle-like word guessing game that appears
 * when users reach their daily time limit on unproductive sites.
 */

// DOM Elements
const gameBoardElement = document.getElementById('game-board');
const keyboardElement = document.getElementById('keyboard');
const messageElement = document.getElementById('game-message');
const continueButton = document.getElementById('continue-btn');
const newGameButton = document.getElementById('new-game-btn');

// Game state
let targetWord = '';
let currentRow = 0;
let currentTile = 0;
let isGameOver = false;
let hasWon = false;

// Game constants
const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;
const KEYBOARD_LAYOUT = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

// Word list - common 5-letter words
const WORD_LIST = [
  'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ADAPT', 'ADMIT', 'ADOPT', 'AFTER', 'AGAIN', 'AGREE',
  'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIKE', 'ALIVE', 'ALLOW', 'ALONE', 'ALONG', 'ALTER',
  'AMONG', 'ANGER', 'ANGLE', 'ANGRY', 'APART', 'APPLE', 'APPLY', 'ARENA', 'ARGUE', 'ARISE',
  'ARRAY', 'ASIDE', 'ASSET', 'AUDIO', 'AUDIT', 'AVOID', 'AWARD', 'AWARE', 'BADLY', 'BAKER',
  'BASIS', 'BEACH', 'BEGAN', 'BEGIN', 'BEGUN', 'BEING', 'BELOW', 'BENCH', 'BILLY', 'BIRTH',
  'BLACK', 'BLAME', 'BLIND', 'BLOCK', 'BLOOD', 'BOARD', 'BOOST', 'BOOTH', 'BOUND', 'BRAIN',
  'BRAND', 'BREAD', 'BREAK', 'BREED', 'BRIEF', 'BRING', 'BROAD', 'BROKE', 'BROWN', 'BUILD',
  'BUILT', 'BUYER', 'CABLE', 'CALIF', 'CARRY', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHART',
  'CHASE', 'CHEAP', 'CHECK', 'CHEST', 'CHIEF', 'CHILD', 'CHINA', 'CHOSE', 'CIVIL', 'CLAIM',
  'CLASS', 'CLEAN', 'CLEAR', 'CLICK', 'CLOCK', 'CLOSE', 'COACH', 'COAST', 'COULD', 'COUNT',
  'COURT', 'COVER', 'CRAFT', 'CRASH', 'CREAM', 'CRIME', 'CROSS', 'CROWD', 'CROWN', 'CURVE',
  'CYCLE', 'DAILY', 'DANCE', 'DATED', 'DEALT', 'DEATH', 'DEBUT', 'DELAY', 'DEPTH', 'DOING',
  'DOUBT', 'DOZEN', 'DRAFT', 'DRAMA', 'DRAWN', 'DREAM', 'DRESS', 'DRILL', 'DRINK', 'DRIVE',
  'DROVE', 'DYING', 'EAGER', 'EARLY', 'EARTH', 'EIGHT', 'ELITE', 'EMPTY', 'ENEMY', 'ENJOY',
  'ENTER', 'ENTRY', 'EQUAL', 'ERROR', 'EVENT', 'EVERY', 'EXACT', 'EXIST', 'EXTRA', 'FAITH',
  'FALSE', 'FAULT', 'FIBER', 'FIELD', 'FIFTH', 'FIFTY', 'FIGHT', 'FINAL', 'FIRST', 'FIXED',
  'FLASH', 'FLEET', 'FLOOR', 'FLUID', 'FOCUS', 'FORCE', 'FORTH', 'FORTY', 'FORUM', 'FOUND',
  'FRAME', 'FRANK', 'FRAUD', 'FRESH', 'FRONT', 'FRUIT', 'FULLY', 'FUNNY', 'GIANT', 'GIVEN',
  'GLASS', 'GLOBE', 'GOING', 'GRACE', 'GRADE', 'GRAND', 'GRANT', 'GRASS', 'GREAT', 'GREEN',
  'GROSS', 'GROUP', 'GROWN', 'GUARD', 'GUESS', 'GUEST', 'GUIDE', 'HAPPY', 'HARRY', 'HEART',
  'HEAVY', 'HENCE', 'HENRY', 'HORSE', 'HOTEL', 'HOUSE', 'HUMAN', 'IDEAL', 'IMAGE', 'INDEX',
  'INNER', 'INPUT', 'ISSUE', 'JAPAN', 'JIMMY', 'JOINT', 'JONES', 'JUDGE', 'KNOWN', 'LABEL',
  'LARGE', 'LASER', 'LATER', 'LAUGH', 'LAYER', 'LEARN', 'LEASE', 'LEAST', 'LEAVE', 'LEGAL',
  'LEVEL', 'LEWIS', 'LIGHT', 'LIMIT', 'LINKS', 'LIVES', 'LOCAL', 'LOGIC', 'LOOSE', 'LOWER',
  'LUCKY', 'LUNCH', 'LYING', 'MAGIC', 'MAJOR', 'MAKER', 'MARCH', 'MARIA', 'MATCH', 'MAYBE',
  'MAYOR', 'MEANT', 'MEDIA', 'METAL', 'MIGHT', 'MINOR', 'MINUS', 'MIXED', 'MODEL', 'MONEY',
  'MONTH', 'MORAL', 'MOTOR', 'MOUNT', 'MOUSE', 'MOUTH', 'MOVIE', 'MUSIC', 'NEEDS', 'NEVER',
  'NEWLY', 'NIGHT', 'NOISE', 'NORTH', 'NOTED', 'NOVEL', 'NURSE', 'OCCUR', 'OCEAN', 'OFFER',
  'OFTEN', 'ORDER', 'OTHER', 'OUGHT', 'PAINT', 'PANEL', 'PAPER', 'PARTY', 'PEACE', 'PETER',
  'PHASE', 'PHONE', 'PHOTO', 'PIECE', 'PILOT', 'PITCH', 'PLACE', 'PLAIN', 'PLANE', 'PLANT',
  'PLATE', 'POINT', 'POUND', 'POWER', 'PRESS', 'PRICE', 'PRIDE', 'PRIME', 'PRINT', 'PRIOR',
  'PRIZE', 'PROOF', 'PROUD', 'PROVE', 'QUEEN', 'QUICK', 'QUIET', 'QUITE', 'RADIO', 'RAISE',
  'RANGE', 'RAPID', 'RATIO', 'REACH', 'READY', 'REFER', 'RIGHT', 'RIVAL', 'RIVER', 'ROBIN',
  'ROGER', 'ROMAN', 'ROUGH', 'ROUND', 'ROUTE', 'ROYAL', 'RURAL', 'SCALE', 'SCENE', 'SCOPE',
  'SCORE', 'SENSE', 'SERVE', 'SEVEN', 'SHALL', 'SHAPE', 'SHARE', 'SHARP', 'SHEET', 'SHELF',
  'SHELL', 'SHIFT', 'SHIRT', 'SHOCK', 'SHOOT', 'SHORT', 'SHOWN', 'SIGHT', 'SINCE', 'SIXTH',
  'SIXTY', 'SIZED', 'SKILL', 'SLEEP', 'SLIDE', 'SMALL', 'SMART', 'SMILE', 'SMITH', 'SMOKE',
  'SOLID', 'SOLVE', 'SORRY', 'SOUND', 'SOUTH', 'SPACE', 'SPARE', 'SPEAK', 'SPEED', 'SPEND',
  'SPENT', 'SPLIT', 'SPOKE', 'SPORT', 'STAFF', 'STAGE', 'STAKE', 'STAND', 'START', 'STATE',
  'STEAM', 'STEEL', 'STICK', 'STILL', 'STOCK', 'STONE', 'STOOD', 'STORE', 'STORM', 'STORY',
  'STRIP', 'STUCK', 'STUDY', 'STUFF', 'STYLE', 'SUGAR', 'SUITE', 'SUPER', 'SWEET', 'TABLE',
  'TAKEN', 'TASTE', 'TAXES', 'TEACH', 'TEETH', 'TERRY', 'TEXAS', 'THANK', 'THEFT', 'THEIR',
  'THEME', 'THERE', 'THESE', 'THICK', 'THING', 'THINK', 'THIRD', 'THOSE', 'THREE', 'THREW',
  'THROW', 'TIGHT', 'TIMES', 'TIRED', 'TITLE', 'TODAY', 'TOPIC', 'TOTAL', 'TOUCH', 'TOUGH',
  'TOWER', 'TRACK', 'TRADE', 'TRAIN', 'TREAT', 'TREND', 'TRIAL', 'TRIED', 'TRIES', 'TRUCK',
  'TRULY', 'TRUST', 'TRUTH', 'TWICE', 'UNDER', 'UNDUE', 'UNION', 'UNITY', 'UNTIL', 'UPPER',
  'UPSET', 'URBAN', 'USAGE', 'USUAL', 'VALID', 'VALUE', 'VIDEO', 'VIRUS', 'VISIT', 'VITAL',
  'VOICE', 'WASTE', 'WATCH', 'WATER', 'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE', 'WHOLE',
  'WHOSE', 'WOMAN', 'WOMEN', 'WORLD', 'WORRY', 'WORSE', 'WORST', 'WORTH', 'WOULD', 'WOUND',
  'WRITE', 'WRONG', 'WROTE', 'YIELD', 'YOUNG', 'YOUTH'
];

// Severance-themed words to include in the word list
const THEMED_WORDS = [
  'LUMON', 'SEVER', 'MACRO', 'MICRO', 'REFIN', 'INNIE', 'OUTIE', 'BREAK', 'FOCUS', 'CLEAN',
  'BOARD', 'QUOTA', 'WAFFLE', 'DANCE', 'GOATS', 'MELON', 'BRAIN', 'SPLIT', 'FLOOR', 'TRACK'
];

// Combined word list
const COMBINED_WORD_LIST = [...WORD_LIST, ...THEMED_WORDS.filter(word => word.length === 5)];

/**
 * Initialize the game
 */
function initialize() {
  console.log('Word Game initialized');
  
  // Create game board
  createGameBoard();
  
  // Create keyboard
  createKeyboard();
  
  // Start new game
  startNewGame();
  
  // Set up event listeners
  setupEventListeners();
}

/**
 * Create the game board
 */
function createGameBoard() {
  gameBoardElement.innerHTML = '';
  
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const row = document.createElement('div');
    row.className = 'board-row';
    
    for (let j = 0; j < WORD_LENGTH; j++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.row = i;
      tile.dataset.col = j;
      row.appendChild(tile);
    }
    
    gameBoardElement.appendChild(row);
  }
}

/**
 * Create the keyboard
 */
function createKeyboard() {
  keyboardElement.innerHTML = '';
  
  KEYBOARD_LAYOUT.forEach(row => {
    const keyboardRow = document.createElement('div');
    keyboardRow.className = 'keyboard-row';
    
    row.forEach(key => {
      const keyButton = document.createElement('div');
      keyButton.className = 'key';
      keyButton.textContent = key;
      keyButton.dataset.key = key;
      
      if (key === 'ENTER' || key === 'BACKSPACE') {
        keyButton.classList.add('wide');
      }
      
      keyButton.addEventListener('click', () => handleKeyPress(key));
      keyboardRow.appendChild(keyButton);
    });
    
    keyboardElement.appendChild(keyboardRow);
  });
}

/**
 * Start a new game
 */
function startNewGame() {
  // Reset game state
  currentRow = 0;
  currentTile = 0;
  isGameOver = false;
  hasWon = false;
  
  // Clear board
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach(tile => {
    tile.textContent = '';
    tile.className = 'tile';
  });
  
  // Reset keyboard
  const keys = document.querySelectorAll('.key');
  keys.forEach(key => {
    key.classList.remove('correct', 'present', 'absent');
  });
  
  // Clear message
  messageElement.textContent = '';
  messageElement.className = 'game-message';
  
  // Disable continue button
  continueButton.disabled = true;
  
  // Select a random word
  targetWord = getRandomWord();
  console.log('Target word:', targetWord);
}

/**
 * Get a random word from the word list
 * @returns {string} Random word
 */
function getRandomWord() {
  // 20% chance to get a themed word if available
  if (Math.random() < 0.2 && THEMED_WORDS.filter(word => word.length === 5).length > 0) {
    const filteredWords = THEMED_WORDS.filter(word => word.length === 5);
    return filteredWords[Math.floor(Math.random() * filteredWords.length)];
  }
  
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
}

/**
 * Handle key press
 * @param {string} key - Key pressed
 */
function handleKeyPress(key) {
  if (isGameOver) return;
  
  if (key === 'BACKSPACE') {
    deleteLetter();
  } else if (key === 'ENTER') {
    submitGuess();
  } else if (/^[A-Z]$/.test(key) && currentTile < WORD_LENGTH) {
    addLetter(key);
  }
}

/**
 * Add a letter to the current tile
 * @param {string} letter - Letter to add
 */
function addLetter(letter) {
  if (currentTile < WORD_LENGTH) {
    const tile = document.querySelector(`.tile[data-row="${currentRow}"][data-col="${currentTile}"]`);
    tile.textContent = letter;
    tile.classList.add('filled');
    currentTile++;
  }
}

/**
 * Delete the last letter
 */
function deleteLetter() {
  if (currentTile > 0) {
    currentTile--;
    const tile = document.querySelector(`.tile[data-row="${currentRow}"][data-col="${currentTile}"]`);
    tile.textContent = '';
    tile.classList.remove('filled');
  }
}

/**
 * Submit the current guess
 */
function submitGuess() {
  if (currentTile < WORD_LENGTH) {
    showMessage('Not enough letters', 'error-message');
    shakeRow();
    return;
  }
  
  // Get the current guess
  let guess = '';
  for (let i = 0; i < WORD_LENGTH; i++) {
    const tile = document.querySelector(`.tile[data-row="${currentRow}"][data-col="${i}"]`);
    guess += tile.textContent;
  }
  
  // Check if the guess is a valid word
  if (!isValidWord(guess)) {
    showMessage('Not in word list', 'error-message');
    shakeRow();
    return;
  }
  
  // Check the guess against the target word
  const result = checkGuess(guess);
  
  // Update the tiles with the result
  updateTiles(result);
  
  // Update the keyboard
  updateKeyboard(guess, result);
  
  // Check if the game is over
  if (guess === targetWord) {
    gameWon();
  } else if (currentRow === MAX_ATTEMPTS - 1) {
    gameLost();
  } else {
    // Move to the next row
    currentRow++;
    currentTile = 0;
  }
}

/**
 * Check if a word is valid
 * @param {string} word - Word to check
 * @returns {boolean} Whether the word is valid
 */
function isValidWord(word) {
  return COMBINED_WORD_LIST.includes(word);
}

/**
 * Check a guess against the target word
 * @param {string} guess - Guess to check
 * @returns {Array} Array of results for each letter
 */
function checkGuess(guess) {
  const result = Array(WORD_LENGTH).fill('absent');
  const targetLetters = targetWord.split('');
  
  // First pass: check for correct letters
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === targetWord[i]) {
      result[i] = 'correct';
      targetLetters[i] = null; // Mark as used
    }
  }
  
  // Second pass: check for present letters
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'absent') {
      const index = targetLetters.indexOf(guess[i]);
      if (index !== -1) {
        result[i] = 'present';
        targetLetters[index] = null; // Mark as used
      }
    }
  }
  
  return result;
}

/**
 * Update the tiles with the result
 * @param {Array} result - Array of results for each letter
 */
function updateTiles(result) {
  for (let i = 0; i < WORD_LENGTH; i++) {
    const tile = document.querySelector(`.tile[data-row="${currentRow}"][data-col="${i}"]`);
    
    // Add a delay for the flip animation
    setTimeout(() => {
      tile.classList.add('flip');
      
      // Add the result class after a delay
      setTimeout(() => {
        tile.classList.add(result[i]);
      }, 250);
    }, i * 100);
  }
}

/**
 * Update the keyboard with the result
 * @param {string} guess - Guess
 * @param {Array} result - Array of results for each letter
 */
function updateKeyboard(guess, result) {
  for (let i = 0; i < WORD_LENGTH; i++) {
    const letter = guess[i];
    const key = document.querySelector(`.key[data-key="${letter}"]`);
    
    // Only update if the key doesn't already have a better status
    if (result[i] === 'correct') {
      key.classList.remove('present', 'absent');
      key.classList.add('correct');
    } else if (result[i] === 'present' && !key.classList.contains('correct')) {
      key.classList.remove('absent');
      key.classList.add('present');
    } else if (result[i] === 'absent' && !key.classList.contains('correct') && !key.classList.contains('present')) {
      key.classList.add('absent');
    }
  }
}

/**
 * Show a message
 * @param {string} message - Message to show
 * @param {string} className - Class name to add
 */
function showMessage(message, className) {
  messageElement.textContent = message;
  messageElement.className = 'game-message ' + className;
  
  // Clear the message after a delay
  setTimeout(() => {
    messageElement.textContent = '';
    messageElement.className = 'game-message';
  }, 3000);
}

/**
 * Shake the current row
 */
function shakeRow() {
  const tiles = document.querySelectorAll(`.tile[data-row="${currentRow}"]`);
  tiles.forEach(tile => {
    tile.classList.add('shake');
    setTimeout(() => {
      tile.classList.remove('shake');
    }, 500);
  });
}

/**
 * Game won
 */
function gameWon() {
  isGameOver = true;
  hasWon = true;
  
  // Add dance animation to tiles
  const tiles = document.querySelectorAll(`.tile[data-row="${currentRow}"]`);
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add('dance');
    }, index * 100);
  });
  
  // Show success message
  setTimeout(() => {
    showMessage('Excellent work, refinement complete!', 'success-message');
    
    // Enable continue button
    continueButton.disabled = false;
  }, 1500);
}

/**
 * Game lost
 */
function gameLost() {
  isGameOver = true;
  
  // Show failure message
  setTimeout(() => {
    showMessage(`The word was ${targetWord}`, 'error-message');
    
    // Enable continue button
    continueButton.disabled = false;
  }, 1500);
}

/**
 * Continue browsing
 */
function continueBrowsing() {
  // Notify parent window that activity is completed
  try {
    window.parent.postMessage({
      type: 'ACTIVITY_COMPLETED',
      activityType: 'word-game',
      score: hasWon ? 100 : 50
    }, '*');
  } catch (error) {
    console.error('Error sending message to parent:', error);
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Keyboard input
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Backspace') {
      handleKeyPress('BACKSPACE');
    } else if (e.key === 'Enter') {
      handleKeyPress('ENTER');
    } else {
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        handleKeyPress(key);
      }
    }
  });
  
  // New game button
  newGameButton.addEventListener('click', startNewGame);
  
  // Continue button
  continueButton.addEventListener('click', continueBrowsing);
}

// Initialize when the page loads
window.addEventListener('load', initialize);
