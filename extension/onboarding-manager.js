/**
 * Trackcrastinate - Onboarding Manager
 * 
 * This module handles the onboarding experience for new users, including:
 * - First-run detection
 * - Welcome page
 * - Guided setup
 * - Feature tutorials
 * - Progress tracking
 */

// Create onboarding manager object in global scope
self.onboardingManager = {};

// Constants
const ONBOARDING_STEPS = {
  WELCOME: {
    id: 'welcome',
    title: 'Welcome to Trackcrastinate',
    description: 'Your journey to mindful browsing begins here.',
    order: 1
  },
  TRACKED_SITES: {
    id: 'tracked-sites',
    title: 'Select Sites to Track',
    description: 'Choose which sites you want to monitor.',
    order: 2
  },
  TIME_LIMITS: {
    id: 'time-limits',
    title: 'Set Time Limits',
    description: 'Define how much time you want to spend on these sites.',
    order: 3
  },
  NOTIFICATIONS: {
    id: 'notifications',
    title: 'Configure Notifications',
    description: 'Set up how you want to be reminded about your time limits.',
    order: 4
  },
  DASHBOARD: {
    id: 'dashboard',
    title: 'Explore Your Dashboard',
    description: 'Learn how to use the dashboard to track your progress.',
    order: 5
  },
  COMPLETE: {
    id: 'complete',
    title: 'All Set!',
    description: 'You\'re ready to start using Trackcrastinate.',
    order: 6
  }
};

// Default onboarding state
const DEFAULT_ONBOARDING_STATE = {
  isFirstRun: true,
  currentStep: ONBOARDING_STEPS.WELCOME.id,
  completedSteps: {},
  lastUpdated: null,
  isComplete: false,
  skipped: false
};

// State
let onboardingState = { ...DEFAULT_ONBOARDING_STATE };

/**
 * Initialize the onboarding manager
 * @returns {Promise<Object>} Result of the initialization
 */
async function initialize() {
  console.log('Onboarding manager initializing...');
  
  try {
    // Load onboarding state from storage
    await loadOnboardingState();
    
    console.log('Onboarding manager initialized successfully');
    return { success: true, state: onboardingState };
  } catch (error) {
    console.error('Error initializing onboarding manager:', error);
    return { success: false, error };
  }
}

/**
 * Load onboarding state from storage
 * @returns {Promise<Object>} The onboarding state
 */
async function loadOnboardingState() {
  try {
    const storage = self.storage || chrome.storage;
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['onboardingState'], resolve);
    });
    
    if (result.onboardingState) {
      onboardingState = { ...DEFAULT_ONBOARDING_STATE, ...result.onboardingState };
      console.log('Loaded onboarding state:', onboardingState);
    } else {
      // First time loading, use defaults
      onboardingState = { ...DEFAULT_ONBOARDING_STATE };
      console.log('No existing onboarding state, using defaults');
      
      // Check if this is actually a first run by looking for other settings
      const settingsResult = await new Promise((resolve) => {
        chrome.storage.local.get(['settings', 'trackedSites'], resolve);
      });
      
      // If we already have settings or tracked sites, this is probably not a first run
      if (settingsResult.settings || 
          (Array.isArray(settingsResult.trackedSites) && settingsResult.trackedSites.length > 0)) {
        onboardingState.isFirstRun = false;
        onboardingState.isComplete = true;
        console.log('Detected existing settings, marking onboarding as complete');
        await saveOnboardingState();
      }
    }
    
    return onboardingState;
  } catch (error) {
    console.error('Error loading onboarding state:', error);
    return { ...DEFAULT_ONBOARDING_STATE };
  }
}

/**
 * Save onboarding state to storage
 * @returns {Promise<Object>} Result of the operation
 */
async function saveOnboardingState() {
  try {
    // Update last updated timestamp
    onboardingState.lastUpdated = Date.now();
    
    await new Promise((resolve) => {
      chrome.storage.local.set({ onboardingState }, resolve);
    });
    
    console.log('Saved onboarding state:', onboardingState);
    return { success: true };
  } catch (error) {
    console.error('Error saving onboarding state:', error);
    return { success: false, error };
  }
}

/**
 * Check if onboarding should be shown
 * @returns {Promise<boolean>} Whether onboarding should be shown
 */
async function shouldShowOnboarding() {
  try {
    // Load state if not already loaded
    if (!onboardingState.lastUpdated) {
      await loadOnboardingState();
    }
    
    // Check if onboarding is complete or skipped
    if (onboardingState.isComplete || onboardingState.skipped) {
      return false;
    }
    
    // Check if this is a first run
    return onboardingState.isFirstRun;
  } catch (error) {
    console.error('Error checking if onboarding should be shown:', error);
    return false;
  }
}

/**
 * Start the onboarding process
 * @returns {Promise<Object>} Result of the operation
 */
async function startOnboarding() {
  try {
    // Reset onboarding state
    onboardingState = { ...DEFAULT_ONBOARDING_STATE };
    onboardingState.lastUpdated = Date.now();
    
    // Save state
    await saveOnboardingState();
    
    // Open onboarding page
    await openOnboardingPage();
    
    return { success: true };
  } catch (error) {
    console.error('Error starting onboarding:', error);
    return { success: false, error };
  }
}

/**
 * Skip the onboarding process
 * @returns {Promise<Object>} Result of the operation
 */
async function skipOnboarding() {
  try {
    // Mark onboarding as skipped
    onboardingState.skipped = true;
    onboardingState.lastUpdated = Date.now();
    
    // Save state
    await saveOnboardingState();
    
    return { success: true };
  } catch (error) {
    console.error('Error skipping onboarding:', error);
    return { success: false, error };
  }
}

/**
 * Complete the onboarding process
 * @returns {Promise<Object>} Result of the operation
 */
async function completeOnboarding() {
  try {
    // Mark onboarding as complete
    onboardingState.isComplete = true;
    onboardingState.currentStep = ONBOARDING_STEPS.COMPLETE.id;
    onboardingState.lastUpdated = Date.now();
    
    // Mark all steps as completed
    Object.values(ONBOARDING_STEPS).forEach(step => {
      onboardingState.completedSteps[step.id] = true;
    });
    
    // Update settings to mark onboarding as complete
    const storage = self.storage || chrome.storage;
    const settings = await storage.getSettings();
    settings.onboardingComplete = true;
    await storage.saveSettings(settings);
    
    // Save state
    await saveOnboardingState();
    
    return { success: true };
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return { success: false, error };
  }
}

/**
 * Get the current onboarding step
 * @returns {Object} The current step
 */
function getCurrentStep() {
  const stepId = onboardingState.currentStep;
  const step = Object.values(ONBOARDING_STEPS).find(s => s.id === stepId) || ONBOARDING_STEPS.WELCOME;
  
  return {
    ...step,
    isCompleted: !!onboardingState.completedSteps[step.id]
  };
}

/**
 * Get all onboarding steps with completion status
 * @returns {Array} The steps with completion status
 */
function getAllSteps() {
  return Object.values(ONBOARDING_STEPS)
    .sort((a, b) => a.order - b.order)
    .map(step => ({
      ...step,
      isCompleted: !!onboardingState.completedSteps[step.id],
      isCurrent: step.id === onboardingState.currentStep
    }));
}

/**
 * Move to the next onboarding step
 * @returns {Promise<Object>} Result of the operation
 */
async function nextStep() {
  try {
    const currentStep = getCurrentStep();
    
    // Mark current step as completed
    onboardingState.completedSteps[currentStep.id] = true;
    
    // Find the next step
    const allSteps = Object.values(ONBOARDING_STEPS).sort((a, b) => a.order - b.order);
    const currentIndex = allSteps.findIndex(s => s.id === currentStep.id);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < allSteps.length) {
      // Move to next step
      onboardingState.currentStep = allSteps[nextIndex].id;
    } else {
      // Complete onboarding
      return await completeOnboarding();
    }
    
    // Save state
    await saveOnboardingState();
    
    return { 
      success: true, 
      currentStep: getCurrentStep(),
      isComplete: onboardingState.isComplete
    };
  } catch (error) {
    console.error('Error moving to next step:', error);
    return { success: false, error };
  }
}

/**
 * Move to the previous onboarding step
 * @returns {Promise<Object>} Result of the operation
 */
async function previousStep() {
  try {
    const currentStep = getCurrentStep();
    
    // Find the previous step
    const allSteps = Object.values(ONBOARDING_STEPS).sort((a, b) => a.order - b.order);
    const currentIndex = allSteps.findIndex(s => s.id === currentStep.id);
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      // Move to previous step
      onboardingState.currentStep = allSteps[prevIndex].id;
      
      // Save state
      await saveOnboardingState();
      
      return { 
        success: true, 
        currentStep: getCurrentStep()
      };
    } else {
      return { 
        success: false, 
        reason: 'Already at first step'
      };
    }
  } catch (error) {
    console.error('Error moving to previous step:', error);
    return { success: false, error };
  }
}

/**
 * Jump to a specific onboarding step
 * @param {string} stepId - The ID of the step to jump to
 * @returns {Promise<Object>} Result of the operation
 */
async function jumpToStep(stepId) {
  try {
    // Validate step ID
    const step = Object.values(ONBOARDING_STEPS).find(s => s.id === stepId);
    
    if (!step) {
      return { 
        success: false, 
        reason: `Invalid step ID: ${stepId}`
      };
    }
    
    // Update current step
    onboardingState.currentStep = step.id;
    
    // Save state
    await saveOnboardingState();
    
    return { 
      success: true, 
      currentStep: getCurrentStep()
    };
  } catch (error) {
    console.error('Error jumping to step:', error);
    return { success: false, error };
  }
}

/**
 * Open the onboarding page
 * @returns {Promise<boolean>} Whether the page was opened
 */
async function openOnboardingPage() {
  return new Promise((resolve) => {
    try {
      // Create onboarding URL
      const onboardingUrl = chrome.runtime.getURL('onboarding/welcome.html');
      
      // Open in a new tab
      chrome.tabs.create({ url: onboardingUrl }, function(tab) {
        resolve(!!tab);
      });
    } catch (error) {
      console.error('Error opening onboarding page:', error);
      resolve(false);
    }
  });
}

/**
 * Check if this is a first run and show onboarding if needed
 * @returns {Promise<Object>} Result of the operation
 */
async function checkFirstRun() {
  try {
    // Load state if not already loaded
    if (!onboardingState.lastUpdated) {
      await loadOnboardingState();
    }
    
    // Check if this is a first run and onboarding is not complete or skipped
    if (onboardingState.isFirstRun && !onboardingState.isComplete && !onboardingState.skipped) {
      console.log('First run detected, showing onboarding');
      
      // Open onboarding page
      const opened = await openOnboardingPage();
      
      return { 
        success: true, 
        isFirstRun: true,
        onboardingOpened: opened
      };
    }
    
    return { 
      success: true, 
      isFirstRun: false
    };
  } catch (error) {
    console.error('Error checking first run:', error);
    return { success: false, error };
  }
}

/**
 * Reset onboarding state (for testing)
 * @returns {Promise<Object>} Result of the operation
 */
async function resetOnboarding() {
  try {
    // Reset to default state
    onboardingState = { ...DEFAULT_ONBOARDING_STATE };
    
    // Save state
    await saveOnboardingState();
    
    return { success: true };
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    return { success: false, error };
  }
}

// Expose functions to the global onboarding manager object
self.onboardingManager.initialize = initialize;
self.onboardingManager.shouldShowOnboarding = shouldShowOnboarding;
self.onboardingManager.startOnboarding = startOnboarding;
self.onboardingManager.skipOnboarding = skipOnboarding;
self.onboardingManager.completeOnboarding = completeOnboarding;
self.onboardingManager.getCurrentStep = getCurrentStep;
self.onboardingManager.getAllSteps = getAllSteps;
self.onboardingManager.nextStep = nextStep;
self.onboardingManager.previousStep = previousStep;
self.onboardingManager.jumpToStep = jumpToStep;
self.onboardingManager.openOnboardingPage = openOnboardingPage;
self.onboardingManager.checkFirstRun = checkFirstRun;
self.onboardingManager.resetOnboarding = resetOnboarding;

// Expose constants
self.onboardingManager.STEPS = ONBOARDING_STEPS;

// Log that the module is ready
console.log('Onboarding manager loaded and ready');
