/**
 * Trackcrastinate - Tracking Module Loader
 * 
 * This script loads the tracking module into the background script.
 * It creates a global trackingModule object that can be used by the background script.
 * 
 * Improved with better dependency management, error handling, and initialization sequence.
 */

// In service workers, we need to use importScripts instead of dynamic imports
// and self instead of window
(function() {
  console.log('Loading tracking module...');
  
  // Track dependencies and their loading status
  const dependencies = {
    storage: { loaded: false },
    domainUtils: { loaded: false },
    tracking: { loaded: false },
    notificationManager: { loaded: false },
    onboardingManager: { loaded: false }
  };
  
  /**
   * Load a dependency with error handling and retries
   * @param {string} name - The name of the dependency
   * @param {string} path - The path to the script
   * @param {number} retries - Number of retries left
   * @returns {Promise<boolean>} - Whether the dependency was loaded successfully
   */
  function loadDependency(name, path, retries = 3) {
    return new Promise((resolve) => {
      try {
        console.log(`Loading dependency: ${name} from ${path}`);
        importScripts(path);
        dependencies[name].loaded = true;
        console.log(`Successfully loaded dependency: ${name}`);
        resolve(true);
      } catch (error) {
        console.error(`Error loading dependency: ${name}`, error);
        
        if (retries > 0) {
          console.log(`Retrying ${name} load (${retries} attempts left)...`);
          setTimeout(() => {
            loadDependency(name, path, retries - 1).then(resolve);
          }, 500);
        } else {
          console.error(`Failed to load ${name} after multiple attempts`);
          resolve(false);
        }
      }
    });
  }
  
  /**
   * Initialize the tracking module with proper error handling
   * @returns {Promise<Object>} - Result of initialization
   */
  async function initializeTrackingModule() {
    try {
      // Check if tracking module is already initialized
      if (self.trackingModuleInitialized) {
        console.log('Tracking module already initialized, skipping initialization');
        return { success: true, alreadyInitialized: true };
      }
      
      // Create a global trackingModule object if it doesn't exist
      self.trackingModule = self.trackingModule || {};
      
      // Initialize the tracking module
      console.log('Initializing tracking module...');
      const initResult = await self.trackingModule.initialize();
      
      // Set a flag to prevent multiple initializations
      self.trackingModuleInitialized = true;
      
      if (initResult.success) {
        console.log('Tracking module initialized successfully');
        
        // Set up periodic state checking with error handling
        setInterval(() => {
          try {
            // Check time limits periodically
            getCurrentTab().then(currentTab => {
              if (currentTab && currentTab.url) {
                getDomainFromTab(currentTab).then(domain => {
                  if (domain) {
                    self.trackingModule.checkTimeLimit(domain).catch(error => {
                      console.error('Error checking time limit:', error);
                    });
                  }
                }).catch(error => {
                  console.error('Error getting domain from tab:', error);
                });
              }
            }).catch(error => {
              console.error('Error getting current tab:', error);
            });
          } catch (error) {
            console.error('Error during periodic time limit check:', error);
          }
        }, 60 * 1000); // Every minute
        
        return initResult;
      } else if (initResult.withDefaults) {
        console.warn('Tracking module initialized with defaults due to error:', initResult.originalError);
        return initResult;
      } else {
        console.error('Failed to initialize tracking module:', initResult.error);
        return initResult;
      }
    } catch (error) {
      console.error('Error during tracking module initialization:', error);
      return { success: false, error };
    }
  }
  
  // Main execution
  (async function main() {
    try {
      // First, check if tracking module is already loaded
      if (self.trackingModule && self.trackingModule.initialize && self.trackingModuleInitialized) {
        console.log('Tracking module already loaded and initialized, skipping load');
        return;
      }
      
      // Load dependencies in the correct order
      const storageLoaded = await loadDependency('storage', './storage.js');
      if (!storageLoaded) {
        throw new Error('Failed to load storage dependency');
      }
      
      const domainUtilsLoaded = await loadDependency('domainUtils', './domain-utils.js');
      if (!domainUtilsLoaded) {
        throw new Error('Failed to load domainUtils dependency');
      }
      
      // Load notification manager
      try {
        const notificationManagerLoaded = await loadDependency('notificationManager', './notification-manager.js');
        if (notificationManagerLoaded) {
          console.log('Notification manager loaded successfully');
        } else {
          console.warn('Failed to load notification manager, continuing without it');
        }
      } catch (error) {
        console.warn('Error loading notification manager:', error);
      }
      
      // Load onboarding manager
      try {
        const onboardingManagerLoaded = await loadDependency('onboardingManager', './onboarding-manager.js');
        if (onboardingManagerLoaded) {
          console.log('Onboarding manager loaded successfully');
        } else {
          console.warn('Failed to load onboarding manager, continuing without it');
        }
      } catch (error) {
        console.warn('Error loading onboarding manager:', error);
      }
      
      // Only load tracking.js if both core dependencies are loaded
      if (storageLoaded && domainUtilsLoaded) {
        const trackingLoaded = await loadDependency('tracking', './tracking.js');
        if (!trackingLoaded) {
          throw new Error('Failed to load tracking module');
        }
        
        // Initialize the tracking module
        await initializeTrackingModule();
      } else {
        throw new Error('Core dependencies not loaded, cannot load tracking module');
      }
    } catch (error) {
      console.error('Error in tracking module loader:', error);
      
      // Attempt recovery by using default implementations if available
      if (self.storage && self.domainUtils) {
        console.log('Attempting recovery with available dependencies...');
        try {
          // Try to load tracking module directly
          importScripts('./tracking.js');
          await initializeTrackingModule();
        } catch (recoveryError) {
          console.error('Recovery attempt failed:', recoveryError);
        }
      }
    }
  })();
})();

/**
 * Get the current active tab with error handling
 * @returns {Promise<Object>} The active tab
 */
function getCurrentTab() {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (tabs && tabs.length > 0) {
          resolve(tabs[0]);
        } else {
          resolve(null);
        }
      });
    } catch (error) {
      console.error('Error querying tabs:', error);
      reject(error);
    }
  });
}

/**
 * Get domain from a tab with error handling
 * @param {Object} tab - The tab to get domain from
 * @returns {Promise<string>} The domain
 */
function getDomainFromTab(tab) {
  return new Promise((resolve, reject) => {
    try {
      if (!tab || !tab.url) {
        resolve(null);
        return;
      }
      
      // Check if domainUtils is available
      if (!self.domainUtils || !self.domainUtils.extractDomain) {
        reject(new Error('domainUtils not available'));
        return;
      }
      
      const domain = self.domainUtils.extractDomain(tab.url);
      resolve(domain);
    } catch (error) {
      console.error('Error getting domain from tab:', error);
      reject(error);
    }
  });
}
