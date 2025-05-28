/**
 * Trackcrastinate - Storage Module
 * 
 * This module handles all storage operations for the extension, providing a clean API
 * for reading and writing settings, tracked domains, and usage data.
 */

// Create storage object in global scope
self.storage = {};

// Constants
self.storage.DEFAULT_TIME_LIMIT = 60; // 60 minutes per day
self.storage.DEFAULT_WARNING_THRESHOLD = 80; // 80% of time limit

// Default settings
self.storage.DEFAULT_SETTINGS = {
  enableTracking: true,
  showNotifications: true,
  startAtLaunch: true,
  dailyLimit: self.storage.DEFAULT_TIME_LIMIT,
  enableDino: true,
  warningThreshold: self.storage.DEFAULT_WARNING_THRESHOLD,
  notificationFrequency: 'medium', // medium frequency (5 minutes)
  notificationThresholds: [50, 75, 90, 95], // percentage thresholds for notifications
  notificationTypes: {
    browser: true,     // browser notifications
    inPage: true,      // in-page banners
    popupAlerts: true  // alerts in the popup
  },
  soundAlerts: false,  // sound alerts for warnings
  soundVolume: 50,     // volume for sound alerts (0-100)
  snoozeEnabled: true, // allow snoozing notifications
  snoozeDuration: 5,   // snooze duration in minutes
  roastLevel: 'medium',
  darkMode: false,
  fontSize: 'medium',
  enableSync: true,
  offlineMode: false,
  dashboardUrl: 'http://localhost:3000',
  onboardingComplete: false // track if onboarding is complete
};

// Default tracked sites
self.storage.DEFAULT_TRACKED_SITES = [
  { domain: "facebook.com", category: "social" },
  { domain: "twitter.com", category: "social" },
  { domain: "instagram.com", category: "social" },
  { domain: "reddit.com", category: "social" },
  { domain: "youtube.com", category: "entertainment" },
  { domain: "netflix.com", category: "entertainment" },
  { domain: "hulu.com", category: "entertainment" },
  { domain: "disneyplus.com", category: "entertainment" },
  { domain: "tiktok.com", category: "social" },
  { domain: "pinterest.com", category: "social" },
  { domain: "linkedin.com", category: "social" },
  { domain: "twitch.tv", category: "entertainment" },
  { domain: "amazon.com", category: "shopping" },
  { domain: "ebay.com", category: "shopping" },
  { domain: "espn.com", category: "sports" },
  { domain: "cnn.com", category: "news" },
  { domain: "buzzfeed.com", category: "entertainment" },
  { domain: "vimeo.com", category: "entertainment" }
];

/**
 * Get settings from storage
 * @returns {Promise<Object>} The user settings
 */
async function getSettings() {
  try {
    const result = await chrome.storage.local.get(['settings']);
    return result.settings ? { ...DEFAULT_SETTINGS, ...result.settings } : { ...DEFAULT_SETTINGS };
  } catch (error) {
    console.error('Error getting settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save settings to storage
 * @param {Object} settings - The settings to save
 * @returns {Promise<void>}
 */
async function saveSettings(settings) {
  try {
    // Validate settings
    const validatedSettings = validateSettings(settings);
    
    // Save to storage
    await chrome.storage.local.set({ 
      settings: validatedSettings,
      // Also save timeLimit directly for backward compatibility
      timeLimit: validatedSettings.dailyLimit 
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, error };
  }
}

/**
 * Validate settings object
 * @param {Object} settings - The settings to validate
 * @returns {Object} - Validated settings
 */
function validateSettings(settings) {
  const validated = { ...DEFAULT_SETTINGS };
  
  // Copy valid properties
  if (typeof settings.enableTracking === 'boolean') validated.enableTracking = settings.enableTracking;
  if (typeof settings.showNotifications === 'boolean') validated.showNotifications = settings.showNotifications;
  if (typeof settings.startAtLaunch === 'boolean') validated.startAtLaunch = settings.startAtLaunch;
  if (typeof settings.enableDino === 'boolean') validated.enableDino = settings.enableDino;
  if (typeof settings.darkMode === 'boolean') validated.darkMode = settings.darkMode;
  if (typeof settings.enableSync === 'boolean') validated.enableSync = settings.enableSync;
  if (typeof settings.offlineMode === 'boolean') validated.offlineMode = settings.offlineMode;
  if (typeof settings.soundAlerts === 'boolean') validated.soundAlerts = settings.soundAlerts;
  if (typeof settings.snoozeEnabled === 'boolean') validated.snoozeEnabled = settings.snoozeEnabled;
  if (typeof settings.onboardingComplete === 'boolean') validated.onboardingComplete = settings.onboardingComplete;
  
  // Validate numeric values
  if (typeof settings.dailyLimit === 'number' && settings.dailyLimit > 0) {
    validated.dailyLimit = Math.min(Math.max(settings.dailyLimit, 1), 1440); // Between 1 and 1440 (24 hours)
  }
  
  if (typeof settings.warningThreshold === 'number' && settings.warningThreshold > 0) {
    validated.warningThreshold = Math.min(Math.max(settings.warningThreshold, 1), 100); // Between 1 and 100
  }
  
  if (typeof settings.soundVolume === 'number') {
    validated.soundVolume = Math.min(Math.max(settings.soundVolume, 0), 100); // Between 0 and 100
  }
  
  if (typeof settings.snoozeDuration === 'number' && settings.snoozeDuration > 0) {
    validated.snoozeDuration = Math.min(Math.max(settings.snoozeDuration, 1), 60); // Between 1 and 60 minutes
  }
  
  // Validate string values
  if (settings.roastLevel && ['mild', 'medium', 'spicy'].includes(settings.roastLevel)) {
    validated.roastLevel = settings.roastLevel;
  }
  
  if (settings.fontSize && ['small', 'medium', 'large'].includes(settings.fontSize)) {
    validated.fontSize = settings.fontSize;
  }
  
  if (settings.notificationFrequency && ['low', 'medium', 'high'].includes(settings.notificationFrequency)) {
    validated.notificationFrequency = settings.notificationFrequency;
  }
  
  // Validate dashboard URL
  if (settings.dashboardUrl && typeof settings.dashboardUrl === 'string' && settings.dashboardUrl.trim().length > 0) {
    validated.dashboardUrl = settings.dashboardUrl.trim();
  }
  
  // Validate notification thresholds array
  if (Array.isArray(settings.notificationThresholds) && settings.notificationThresholds.length > 0) {
    // Filter valid thresholds (numbers between 1 and 100)
    validated.notificationThresholds = settings.notificationThresholds
      .filter(threshold => typeof threshold === 'number' && threshold >= 1 && threshold <= 100)
      .sort((a, b) => a - b); // Sort in ascending order
    
    // If no valid thresholds, use defaults
    if (validated.notificationThresholds.length === 0) {
      validated.notificationThresholds = DEFAULT_SETTINGS.notificationThresholds;
    }
  }
  
  // Validate notification types object
  if (settings.notificationTypes && typeof settings.notificationTypes === 'object') {
    validated.notificationTypes = {
      browser: typeof settings.notificationTypes.browser === 'boolean' 
        ? settings.notificationTypes.browser 
        : DEFAULT_SETTINGS.notificationTypes.browser,
      inPage: typeof settings.notificationTypes.inPage === 'boolean' 
        ? settings.notificationTypes.inPage 
        : DEFAULT_SETTINGS.notificationTypes.inPage,
      popupAlerts: typeof settings.notificationTypes.popupAlerts === 'boolean' 
        ? settings.notificationTypes.popupAlerts 
        : DEFAULT_SETTINGS.notificationTypes.popupAlerts
    };
  }
  
  return validated;
}

/**
 * Get tracked sites from storage
 * @returns {Promise<Array>} The tracked sites
 */
async function getTrackedSites() {
  try {
    const result = await chrome.storage.local.get(['trackedSites']);
    return Array.isArray(result.trackedSites) && result.trackedSites.length > 0 
      ? result.trackedSites 
      : [...DEFAULT_TRACKED_SITES];
  } catch (error) {
    console.error('Error getting tracked sites:', error);
    return [...DEFAULT_TRACKED_SITES];
  }
}

/**
 * Save daily usage data to storage with improved reliability
 * @param {Object} dailyUsage - Daily usage data
 * @param {string} [date] - Optional date string (YYYY-MM-DD)
 * @returns {Promise<Object>} Result of the operation
 */
async function saveDailyUsage(dailyUsage, date) {
  try {
    // Validate input
    if (!dailyUsage || typeof dailyUsage !== 'object') {
      console.warn('Invalid daily usage data:', dailyUsage);
      dailyUsage = {};
    }
    
    // Get current date if not provided
    const today = date || new Date().toISOString().split('T')[0];
    
    // Create a deep copy to prevent reference issues
    const dailyUsageCopy = JSON.parse(JSON.stringify(dailyUsage));
    
    // Add metadata for debugging
    const saveData = {
      dailyUsage: dailyUsageCopy,
      usageDate: today,
      lastSaved: new Date().toISOString(),
      version: 2 // Increment version to track format changes
    };
    
    // Save to storage with retry mechanism
    return await saveWithRetry('dailyUsage', saveData, 3);
  } catch (error) {
    console.error('Error saving daily usage:', error);
    
    // Try emergency save with minimal data
    try {
      console.log('Attempting emergency save of daily usage data');
      const emergencyData = {
        dailyUsage: dailyUsage || {},
        usageDate: date || new Date().toISOString().split('T')[0],
        emergency: true,
        timestamp: Date.now()
      };
      
      await new Promise((resolve) => {
        chrome.storage.local.set({ emergencyDailyUsage: emergencyData }, resolve);
      });
      
      return { success: false, error, emergencySaved: true };
    } catch (emergencyError) {
      console.error('Emergency save failed:', emergencyError);
      return { success: false, error, emergencySaved: false };
    }
  }
}

/**
 * Helper function to save data with retry
 * @param {string} key - Storage key
 * @param {any} data - Data to save
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<Object>} Result of the operation
 */
async function saveWithRetry(key, data, maxRetries = 3) {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      return await new Promise((resolve, reject) => {
        const saveObj = {};
        saveObj[key] = data;
        
        chrome.storage.local.set(saveObj, function() {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve({ success: true, data: data });
          }
        });
      });
    } catch (error) {
      retries++;
      console.warn(`Save attempt ${retries}/${maxRetries} failed:`, error);
      
      if (retries > maxRetries) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, retries - 1), 10000)));
    }
  }
}

/**
 * Save tracked sites to storage
 * @param {Array} sites - The tracked sites to save
 * @returns {Promise<Object>} Result of the operation
 */
async function saveTrackedSites(sites) {
  try {
    // Validate sites
    const validatedSites = validateTrackedSites(sites);
    
    // Save to storage
    await chrome.storage.local.set({ trackedSites: validatedSites });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving tracked sites:', error);
    return { success: false, error };
  }
}

/**
 * Validate tracked sites array
 * @param {Array} sites - The sites to validate
 * @returns {Array} - Validated sites
 */
function validateTrackedSites(sites) {
  // If not an array or empty, return default sites
  if (!Array.isArray(sites) || sites.length === 0) {
    return [...DEFAULT_TRACKED_SITES];
  }
  
  // Filter out invalid items
  return sites.filter(site => {
    if (!site) return false;
    
    if (typeof site === 'string') {
      return site.trim().length > 0;
    }
    
    if (typeof site === 'object' && site.domain) {
      return site.domain.trim().length > 0;
    }
    
    return false;
  });
}

/**
 * Get daily usage data from storage
 * @returns {Promise<Object>} The daily usage data and date
 */
async function getDailyUsage() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const result = await chrome.storage.local.get(['dailyUsage', 'usageDate']);
    
    // Check if we have data for today
    if (result.usageDate === today && result.dailyUsage) {
      // Handle both formats: direct object or nested object
      let usageData = result.dailyUsage;
      
      // If it's the new format with nested dailyUsage property
      if (result.dailyUsage.dailyUsage && typeof result.dailyUsage.dailyUsage === 'object') {
        usageData = result.dailyUsage.dailyUsage;
        console.log('Using nested dailyUsage format');
      }
      
      return { 
        dailyUsage: usageData, 
        usageDate: today,
        isNewDay: false
      };
    } else {
      // New day, reset usage
      console.log('New day detected or no usage data found, resetting');
      return { 
        dailyUsage: {}, 
        usageDate: today,
        isNewDay: true
      };
    }
  } catch (error) {
    console.error('Error getting daily usage:', error);
    return { 
      dailyUsage: {}, 
      usageDate: new Date().toISOString().split('T')[0],
      isNewDay: true
    };
  }
}

// This function has been replaced by the improved version above

/**
 * Get time limit from storage
 * @returns {Promise<number>} The time limit in minutes
 */
async function getTimeLimit() {
  try {
    const result = await chrome.storage.local.get(['timeLimit', 'settings']);
    
    // First check direct timeLimit
    if (typeof result.timeLimit === 'number' && result.timeLimit > 0) {
      return result.timeLimit;
    }
    
    // Then check settings.dailyLimit
    if (result.settings && typeof result.settings.dailyLimit === 'number' && result.settings.dailyLimit > 0) {
      return result.settings.dailyLimit;
    }
    
    // Default
    return DEFAULT_TIME_LIMIT;
  } catch (error) {
    console.error('Error getting time limit:', error);
    return DEFAULT_TIME_LIMIT;
  }
}

/**
 * Save time limit to storage
 * @param {number} timeLimit - The time limit in minutes
 * @returns {Promise<Object>} Result of the operation
 */
async function saveTimeLimit(timeLimit) {
  try {
    // Validate time limit
    const validatedTimeLimit = Math.min(Math.max(timeLimit, 1), 1440); // Between 1 and 1440 (24 hours)
    
    // Save to storage
    await chrome.storage.local.set({ timeLimit: validatedTimeLimit });
    
    // Also update in settings for consistency
    const settings = await getSettings();
    settings.dailyLimit = validatedTimeLimit;
    await saveSettings(settings);
    
    return { success: true };
  } catch (error) {
    console.error('Error saving time limit:', error);
    return { success: false, error };
  }
}

/**
 * Get tracking status from storage
 * @returns {Promise<boolean>} Whether tracking is enabled
 */
async function getTrackingStatus() {
  try {
    const result = await chrome.storage.local.get(['isTracking']);
    return typeof result.isTracking === 'boolean' ? result.isTracking : true;
  } catch (error) {
    console.error('Error getting tracking status:', error);
    return true; // Default to enabled
  }
}

/**
 * Save tracking status to storage
 * @param {boolean} isTracking - Whether tracking is enabled
 * @returns {Promise<Object>} Result of the operation
 */
async function saveTrackingStatus(isTracking) {
  try {
    await chrome.storage.local.set({ isTracking: !!isTracking });
    return { success: true };
  } catch (error) {
    console.error('Error saving tracking status:', error);
    return { success: false, error };
  }
}

/**
 * Add a session to the sync queue
 * @param {Object} session - The session to queue
 * @returns {Promise<Object>} Result of the operation
 */
async function queueSessionForSync(session) {
  try {
    const result = await chrome.storage.local.get(['syncQueue']);
    const syncQueue = Array.isArray(result.syncQueue) ? result.syncQueue : [];
    
    syncQueue.push(session);
    await chrome.storage.local.set({ syncQueue });
    
    return { success: true };
  } catch (error) {
    console.error('Error queuing session for sync:', error);
    return { success: false, error };
  }
}

/**
 * Get the sync queue from storage
 * @returns {Promise<Array>} The sync queue
 */
async function getSyncQueue() {
  try {
    const result = await chrome.storage.local.get(['syncQueue']);
    return Array.isArray(result.syncQueue) ? result.syncQueue : [];
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
}

/**
 * Clear the sync queue
 * @returns {Promise<Object>} Result of the operation
 */
async function clearSyncQueue() {
  try {
    await chrome.storage.local.set({ syncQueue: [] });
    return { success: true };
  } catch (error) {
    console.error('Error clearing sync queue:', error);
    return { success: false, error };
  }
}

/**
 * Get user authentication status
 * @returns {Promise<Object>} The user authentication status
 */
async function getAuthStatus() {
  try {
    const result = await chrome.storage.local.get(['currentUser', 'isOfflineMode']);
    
    return {
      isAuthenticated: !!result.currentUser,
      isOfflineMode: !!result.isOfflineMode,
      user: result.currentUser || null
    };
  } catch (error) {
    console.error('Error getting auth status:', error);
    return {
      isAuthenticated: false,
      isOfflineMode: false,
      user: null
    };
  }
}

/**
 * Save user authentication status
 * @param {Object} user - The user object
 * @param {boolean} isOfflineMode - Whether offline mode is enabled
 * @returns {Promise<Object>} Result of the operation
 */
async function saveAuthStatus(user, isOfflineMode) {
  try {
    await chrome.storage.local.set({ 
      currentUser: user,
      isOfflineMode: !!isOfflineMode
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving auth status:', error);
    return { success: false, error };
  }
}

/**
 * Clear all storage data
 * @returns {Promise<Object>} Result of the operation
 */
async function clearAllData() {
  try {
    await chrome.storage.local.clear();
    return { success: true };
  } catch (error) {
    console.error('Error clearing all data:', error);
    return { success: false, error };
  }
}

/**
 * Get reset count from storage
 * @returns {Promise<number>} The number of resets today
 */
async function getResetCount() {
  try {
    const result = await chrome.storage.local.get(['resetCount']);
    return result.resetCount || 0;
  } catch (error) {
    console.error('Error getting reset count:', error);
    return 0;
  }
}

/**
 * Increment reset count in storage
 * @returns {Promise<Object>} Result of the operation
 */
async function incrementResetCount() {
  try {
    const currentCount = await getResetCount();
    await chrome.storage.local.set({ resetCount: currentCount + 1 });
    return { success: true, resetCount: currentCount + 1 };
  } catch (error) {
    console.error('Error incrementing reset count:', error);
    return { success: false, error };
  }
}

/**
 * Save current usage to reset history
 * @param {Object} dailyUsage - The daily usage data to save
 * @returns {Promise<Object>} Result of the operation
 */
async function saveResetHistory(dailyUsage) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const result = await chrome.storage.local.get(['resetHistory']);
    const resetHistory = result.resetHistory || {};
    
    if (!resetHistory[today]) {
      resetHistory[today] = [];
    }
    
    // Add current usage to history with timestamp
    resetHistory[today].push({
      timestamp: new Date().toISOString(),
      usage: { ...dailyUsage }
    });
    
    await chrome.storage.local.set({ resetHistory });
    return { success: true };
  } catch (error) {
    console.error('Error saving reset history:', error);
    return { success: false, error };
  }
}

/**
 * Get reset history from storage
 * @returns {Promise<Object>} The reset history
 */
async function getResetHistory() {
  try {
    const result = await chrome.storage.local.get(['resetHistory']);
    return result.resetHistory || {};
  } catch (error) {
    console.error('Error getting reset history:', error);
    return {};
  }
}

/**
 * Get site-specific time limits from storage
 * @returns {Promise<Object>} The site-specific time limits
 */
async function getSiteTimeLimits() {
  try {
    const result = await chrome.storage.local.get(['siteTimeLimits']);
    return result.siteTimeLimits || {};
  } catch (error) {
    console.error('Error getting site time limits:', error);
    return {};
  }
}

/**
 * Save site-specific time limits to storage
 * @param {Object} limits - The site-specific time limits to save
 * @returns {Promise<Object>} Result of the operation
 */
async function saveSiteTimeLimits(limits) {
  try {
    // Validate limits
    if (!limits || typeof limits !== 'object') {
      console.warn('Invalid site time limits:', limits);
      limits = {};
    }
    
    // Validate each limit
    const validatedLimits = {};
    for (const [domain, limit] of Object.entries(limits)) {
      if (typeof limit === 'number' && limit > 0) {
        // Ensure limit is between 1 and 1440 (24 hours)
        validatedLimits[domain] = Math.min(Math.max(limit, 1), 1440);
      }
    }
    
    // Save to storage
    await chrome.storage.local.set({ siteTimeLimits: validatedLimits });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving site time limits:', error);
    return { success: false, error };
  }
}

// Expose functions to the global storage object
self.storage.getSettings = getSettings;
self.storage.saveSettings = saveSettings;
self.storage.validateSettings = validateSettings;

self.storage.getTrackedSites = getTrackedSites;
self.storage.saveTrackedSites = saveTrackedSites;
self.storage.validateTrackedSites = validateTrackedSites;

self.storage.getDailyUsage = getDailyUsage;
self.storage.saveDailyUsage = saveDailyUsage;

self.storage.getTimeLimit = getTimeLimit;
self.storage.saveTimeLimit = saveTimeLimit;

self.storage.getSiteTimeLimits = getSiteTimeLimits;
self.storage.saveSiteTimeLimits = saveSiteTimeLimits;

self.storage.getTrackingStatus = getTrackingStatus;
self.storage.saveTrackingStatus = saveTrackingStatus;

self.storage.queueSessionForSync = queueSessionForSync;
self.storage.getSyncQueue = getSyncQueue;
self.storage.clearSyncQueue = clearSyncQueue;

self.storage.getAuthStatus = getAuthStatus;
self.storage.saveAuthStatus = saveAuthStatus;

self.storage.getResetCount = getResetCount;
self.storage.incrementResetCount = incrementResetCount;
self.storage.saveResetHistory = saveResetHistory;
self.storage.getResetHistory = getResetHistory;

self.storage.clearAllData = clearAllData;
