/**
 * Trackcrastinate - Math Challenge Activity
 * 
 * This script implements a math calculation game that appears
 * when users reach their daily time limit on unproductive sites.
 * It offers different difficulty levels for math problems.
 */

// DOM Elements
const problemElement = document.getElementById('problem');
const answerInput = document.getElementById('answer-input');
const submitButton = document.getElementById('submit-btn');
const resultElement = document.getElementById('result');
const progressElement = document.getElementById('progress');
const solvedCountElement = document.getElementById('solved-count');
const correctCountElement = document.getElementById('correct-count');
const timerElement = document.getElementById('timer');
const difficultyLevelElement = document.getElementById('difficulty-level');
const continueButton = document.getElementById('continue-btn');
const newGameButton = document.getElementById('new-game-btn');

// Game state
let currentProblem = null;
let currentAnswer = null;
let problemsSolved = 0;
let correctAnswers = 0;
let timerSeconds = 0;
let timerInterval;
let difficulty = 'medium'; // Default difficulty

// Game constants
const REQUIRED_PROBLEMS = 5; // Number of problems to solve before continuing

/**
 * Initialize the math challenge
 */
function initialize() {
  console.log('Math Challenge initialized');
  
  // Parse URL parameters for difficulty
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('difficulty')) {
    difficulty = urlParams.get('difficulty').toLowerCase();
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      difficulty = 'medium'; // Default to medium if invalid
    }
  }
  
  // Update difficulty display
  difficultyLevelElement.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  
  // Set up event listeners
  setupEventListeners();
  
  // Start timer
  startTimer();
  
  // Generate first problem
  generateProblem();
}

/**
 * Start the timer
 */
function startTimer() {
  timerInterval = setInterval(function() {
    timerSeconds++;
    
    // Update timer display
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

/**
 * Generate a new math problem based on difficulty
 */
function generateProblem() {
  let problem = '';
  let answer = 0;
  
  switch (difficulty) {
    case 'easy':
      // Simple addition and subtraction with small numbers
      const easyOperation = Math.random() < 0.5 ? '+' : '-';
      const num1Easy = Math.floor(Math.random() * 20) + 1; // 1-20
      const num2Easy = Math.floor(Math.random() * 20) + 1; // 1-20
      
      if (easyOperation === '+') {
        problem = `${num1Easy} + ${num2Easy}`;
        answer = num1Easy + num2Easy;
      } else {
        // Ensure subtraction doesn't result in negative numbers
        const larger = Math.max(num1Easy, num2Easy);
        const smaller = Math.min(num1Easy, num2Easy);
        problem = `${larger} - ${smaller}`;
        answer = larger - smaller;
      }
      break;
      
    case 'hard':
      // More complex operations with larger numbers
      const hardOperation = Math.random();
      
      if (hardOperation < 0.25) {
        // Addition with larger numbers
        const num1Hard = Math.floor(Math.random() * 100) + 50; // 50-149
        const num2Hard = Math.floor(Math.random() * 100) + 50; // 50-149
        problem = `${num1Hard} + ${num2Hard}`;
        answer = num1Hard + num2Hard;
      } else if (hardOperation < 0.5) {
        // Subtraction with larger numbers
        const num1Hard = Math.floor(Math.random() * 100) + 100; // 100-199
        const num2Hard = Math.floor(Math.random() * 100); // 0-99
        problem = `${num1Hard} - ${num2Hard}`;
        answer = num1Hard - num2Hard;
      } else if (hardOperation < 0.75) {
        // Multiplication with larger numbers
        const num1Hard = Math.floor(Math.random() * 20) + 5; // 5-24
        const num2Hard = Math.floor(Math.random() * 10) + 5; // 5-14
        problem = `${num1Hard} × ${num2Hard}`;
        answer = num1Hard * num2Hard;
      } else {
        // Two-step operation
        const num1Hard = Math.floor(Math.random() * 20) + 10; // 10-29
        const num2Hard = Math.floor(Math.random() * 10) + 5; // 5-14
        const num3Hard = Math.floor(Math.random() * 10) + 5; // 5-14
        problem = `(${num1Hard} + ${num2Hard}) × ${num3Hard}`;
        answer = (num1Hard + num2Hard) * num3Hard;
      }
      break;
      
    case 'medium':
    default:
      // Addition, subtraction, multiplication, and simple division
      const medOperation = Math.random();
      
      if (medOperation < 0.3) {
        // Addition
        const num1Med = Math.floor(Math.random() * 50) + 10; // 10-59
        const num2Med = Math.floor(Math.random() * 50) + 10; // 10-59
        problem = `${num1Med} + ${num2Med}`;
        answer = num1Med + num2Med;
      } else if (medOperation < 0.6) {
        // Subtraction
        const num1Med = Math.floor(Math.random() * 50) + 50; // 50-99
        const num2Med = Math.floor(Math.random() * 50); // 0-49
        problem = `${num1Med} - ${num2Med}`;
        answer = num1Med - num2Med;
      } else if (medOperation < 0.9) {
        // Multiplication
        const num1Med = Math.floor(Math.random() * 10) + 2; // 2-11
        const num2Med = Math.floor(Math.random() * 10) + 2; // 2-11
        problem = `${num1Med} × ${num2Med}`;
        answer = num1Med * num2Med;
      } else {
        // Division (ensuring whole number results)
        const num2Med = Math.floor(Math.random() * 10) + 2; // 2-11
        const num1Med = num2Med * (Math.floor(Math.random() * 10) + 1); // Ensures clean division
        problem = `${num1Med} ÷ ${num2Med}`;
        answer = num1Med / num2Med;
      }
      break;
  }
  
  // Update the problem display
  problemElement.textContent = problem;
  
  // Store the current problem and answer
  currentProblem = problem;
  currentAnswer = answer;
  
  // Clear previous answer and result
  answerInput.value = '';
  resultElement.textContent = '';
  resultElement.className = 'result';
  
  // Focus on the answer input
  answerInput.focus();
}

/**
 * Check the user's answer
 */
function checkAnswer() {
  // Get the user's answer
  const userAnswer = parseFloat(answerInput.value);
  
  // Check if the answer is empty
  if (answerInput.value.trim() === '') {
    showResult('Please enter an answer', 'error');
    answerInput.focus();
    return;
  }
  
  // Check if the answer is correct
  if (userAnswer === currentAnswer) {
    showResult('Correct!', 'success');
    correctAnswers++;
    correctCountElement.textContent = correctAnswers;
    
    // Add pulse animation to problem
    problemElement.classList.add('pulse');
    setTimeout(() => {
      problemElement.classList.remove('pulse');
    }, 500);
  } else {
    showResult(`Incorrect. The answer is ${currentAnswer}.`, 'error');
    
    // Add shake animation to answer input
    answerInput.classList.add('shake');
    setTimeout(() => {
      answerInput.classList.remove('shake');
    }, 500);
  }
  
  // Increment problems solved
  problemsSolved++;
  solvedCountElement.textContent = `${problemsSolved}/${REQUIRED_PROBLEMS}`;
  
  // Update progress bar
  const progressPercentage = (problemsSolved / REQUIRED_PROBLEMS) * 100;
  progressElement.style.width = `${progressPercentage}%`;
  
  // Check if enough problems have been solved
  if (problemsSolved >= REQUIRED_PROBLEMS) {
    gameCompleted();
  } else {
    // Generate a new problem after a delay
    setTimeout(generateProblem, 1500);
  }
}

/**
 * Show a result message
 * @param {string} message - Message to show
 * @param {string} type - Type of message (success or error)
 */
function showResult(message, type) {
  resultElement.textContent = message;
  resultElement.className = `result ${type}`;
}

/**
 * Game completed
 */
function gameCompleted() {
  // Stop the timer
  clearInterval(timerInterval);
  
  // Calculate score based on correct answers and time
  const score = Math.round((correctAnswers / REQUIRED_PROBLEMS) * 100);
  
  // Show completion message
  showResult(`Completed! You got ${correctAnswers} out of ${REQUIRED_PROBLEMS} correct.`, 'success');
  
  // Enable continue button
  continueButton.disabled = false;
  
  // Disable submit button
  submitButton.disabled = true;
  answerInput.disabled = true;
}

/**
 * Start a new game
 */
function startNewGame() {
  // Reset game state
  problemsSolved = 0;
  correctAnswers = 0;
  timerSeconds = 0;
  
  // Reset UI
  solvedCountElement.textContent = `0/${REQUIRED_PROBLEMS}`;
  correctCountElement.textContent = '0';
  timerElement.textContent = '00:00';
  progressElement.style.width = '0%';
  
  // Enable submit button
  submitButton.disabled = false;
  answerInput.disabled = false;
  
  // Disable continue button
  continueButton.disabled = true;
  
  // Clear previous intervals
  clearInterval(timerInterval);
  
  // Start timer
  startTimer();
  
  // Generate first problem
  generateProblem();
}

/**
 * Continue browsing
 */
function continueBrowsing() {
  // Notify parent window that activity is completed
  try {
    window.parent.postMessage({
      type: 'ACTIVITY_COMPLETED',
      activityType: 'math-challenge',
      score: Math.round((correctAnswers / REQUIRED_PROBLEMS) * 100),
      difficulty: difficulty
    }, '*');
  } catch (error) {
    console.error('Error sending message to parent:', error);
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Submit button
  submitButton.addEventListener('click', checkAnswer);
  
  // Enter key in answer input
  answerInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  });
  
  // New game button
  newGameButton.addEventListener('click', startNewGame);
  
  // Continue button
  continueButton.addEventListener('click', continueBrowsing);
}

// Initialize when the page loads
window.addEventListener('load', initialize);
