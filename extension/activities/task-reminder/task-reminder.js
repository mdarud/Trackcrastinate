/**
 * Trackcrastinate - Task Reminder Activity
 * 
 * This script handles the task reminder functionality when users reach their time limit.
 * It allows users to view, add, complete, and delete tasks to help them refocus on productive work.
 */

// DOM Elements
const taskListElement = document.getElementById('task-list');
const emptyStateElement = document.getElementById('empty-state');
const newTaskInput = document.getElementById('new-task');
const addTaskButton = document.getElementById('add-task-btn');
const continueButton = document.getElementById('continue-btn');
const timerElement = document.getElementById('timer');

// State
let tasks = [];
let timerSeconds = 0;
let timerInterval;

// Constants
const REQUIRED_VIEW_TIME = 30; // Seconds required before continue button is enabled

/**
 * Initialize the task reminder
 */
function initialize() {
  console.log('Task Reminder initialized');
  
  // Load tasks from storage
  loadTasks();
  
  // Set up event listeners
  setupEventListeners();
  
  // Start timer
  startTimer();
}

/**
 * Load tasks from Chrome storage
 */
function loadTasks() {
  chrome.storage.local.get(['tasks'], function(result) {
    if (result.tasks && Array.isArray(result.tasks)) {
      tasks = result.tasks;
    } else {
      // Default tasks if none exist
      tasks = [
        { id: 1, text: 'Complete your primary work assignment', completed: false },
        { id: 2, text: 'Review project documentation', completed: false },
        { id: 3, text: 'Respond to important emails', completed: false }
      ];
      
      // Save default tasks
      saveTasks();
    }
    
    // Render tasks
    renderTasks();
  });
}

/**
 * Save tasks to Chrome storage
 */
function saveTasks() {
  chrome.storage.local.set({ tasks: tasks }, function() {
    console.log('Tasks saved:', tasks.length);
  });
}

/**
 * Render tasks in the UI
 */
function renderTasks() {
  // Clear existing tasks (except empty state)
  const taskItems = taskListElement.querySelectorAll('.task-item');
  taskItems.forEach(item => item.remove());
  
  // Show/hide empty state
  if (tasks.length === 0) {
    emptyStateElement.style.display = 'block';
  } else {
    emptyStateElement.style.display = 'none';
    
    // Add each task to the list
    tasks.forEach(task => {
      const taskElement = createTaskElement(task);
      taskListElement.appendChild(taskElement);
    });
  }
}

/**
 * Create a task element
 * @param {Object} task - Task object
 * @returns {HTMLElement} Task element
 */
function createTaskElement(task) {
  const taskElement = document.createElement('div');
  taskElement.className = 'task-item' + (task.completed ? ' task-completed' : '');
  taskElement.dataset.id = task.id;
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.completed;
  checkbox.addEventListener('change', function() {
    toggleTaskCompletion(task.id);
  });
  
  const taskText = document.createElement('div');
  taskText.className = 'task-text';
  taskText.textContent = task.text;
  
  const deleteButton = document.createElement('button');
  deleteButton.className = 'task-delete';
  deleteButton.textContent = '×';
  deleteButton.addEventListener('click', function() {
    deleteTask(task.id);
  });
  
  taskElement.appendChild(checkbox);
  taskElement.appendChild(taskText);
  taskElement.appendChild(deleteButton);
  
  return taskElement;
}

/**
 * Add a new task
 */
function addTask() {
  const taskText = newTaskInput.value.trim();
  
  if (taskText) {
    // Create new task
    const newTask = {
      id: Date.now(), // Use timestamp as ID
      text: taskText,
      completed: false
    };
    
    // Add to tasks array
    tasks.push(newTask);
    
    // Save tasks
    saveTasks();
    
    // Render tasks
    renderTasks();
    
    // Clear input
    newTaskInput.value = '';
  }
}

/**
 * Toggle task completion status
 * @param {number} taskId - Task ID
 */
function toggleTaskCompletion(taskId) {
  // Find task
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  
  if (taskIndex !== -1) {
    // Toggle completed status
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    
    // Save tasks
    saveTasks();
    
    // Update UI
    const taskElement = taskListElement.querySelector(`.task-item[data-id="${taskId}"]`);
    if (taskElement) {
      if (tasks[taskIndex].completed) {
        taskElement.classList.add('task-completed');
      } else {
        taskElement.classList.remove('task-completed');
      }
    }
  }
}

/**
 * Delete a task
 * @param {number} taskId - Task ID
 */
function deleteTask(taskId) {
  // Filter out the task
  tasks = tasks.filter(task => task.id !== taskId);
  
  // Save tasks
  saveTasks();
  
  // Render tasks
  renderTasks();
}

/**
 * Start the timer
 */
function startTimer() {
  // Disable continue button initially
  continueButton.disabled = true;
  
  // Start interval
  timerInterval = setInterval(function() {
    timerSeconds++;
    
    // Update timer display
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Enable continue button after required time
    if (timerSeconds >= REQUIRED_VIEW_TIME && continueButton.disabled) {
      continueButton.disabled = false;
    }
  }, 1000);
}

/**
 * Continue browsing
 */
function continueBrowsing() {
  // Clear timer
  clearInterval(timerInterval);
  
  // Notify parent window that activity is completed
  try {
    window.parent.postMessage({
      type: 'ACTIVITY_COMPLETED',
      activityType: 'task-reminder'
    }, '*');
  } catch (error) {
    console.error('Error sending message to parent:', error);
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Add task button
  addTaskButton.addEventListener('click', addTask);
  
  // Enter key in new task input
  newTaskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addTask();
    }
  });
  
  // Continue button
  continueButton.addEventListener('click', continueBrowsing);
}

// Initialize when the page loads
window.addEventListener('load', initialize);
