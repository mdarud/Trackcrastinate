/**
 * Trackcrastinate - Core Tracking Module
 * 
 * This module handles the core tracking functionality, including
 * session management, time calculation, and limit enforcement.
 * 
 * Rebuilt for maximum accuracy and consistency.
 */

// ======================================================================
// DEPENDENCY MANAGEMENT
// ======================================================================

// Safely access global objects with validation
function getStorage() {
  if (!self.storage) {
    console.error('Storage module not available');
    throw new Error('Storage module not available');
  }
  return self.storage;
}

function getDomainUtils() {
  if (!self.domainUtils) {
    console.error('DomainUtils module not available');
    throw new Error('DomainUtils module not available');
  }
  return self.domainUtils;
}

// ======================================================================
// STATE MANAGEMENT
// ======================================================================

// Core state object - single source of truth for all tracking data
const state = {
  // Session data
  activeTab: null,
  sessionStartTime: null,
  
  // Configuration
  isTracking: true,
  trackedSites: [],
  timeLimit: 60, // Default value in minutes
  siteTimeLimits: {}, // Format: { domain: timeInMinutes }
  
  // Usage data
  dailyUsage: {}, // Format: { domain: timeInMilliseconds }
  
  // Metadata
  lastSaveTime: Date.now(),
  lastUpdateTime: Date.now(),
  
  // Locking mechanism to prevent race conditions
  _isSessionLocked: false,
  _lockTimeout: null,
  _lockQueue: [],
  
  // Lock the session for exclusive access
  async lockSession() {
    return new Promise(resolve => {
      if (!this._isSessionLocked) {
        this._isSessionLocked = true;
        resolve();
      } else {
        // Add to queue
        this._lockQueue.push(resolve);
      }
    });
  },
  
  // Release the session lock
  releaseSessionLock() {
    // Clear any existing timeout
    if (this._lockTimeout) {
      clearTimeout(this._lockTimeout);
      this._lockTimeout = null;
    }
    
    // Set a safety timeout to release the lock after 5 seconds
    // This prevents deadlocks if an error occurs during processing
    this._lockTimeout = setTimeout(() => {
      console.warn('Session lock timeout expired, forcing release');
      this._isSessionLocked = false;
      this._processLockQueue();
    }, 5000);
    
    // Release the lock
    this._isSessionLocked = false;
    
    // Process the next item in the queue
    this._processLockQueue();
  },
  
  // Process the next item in the lock queue
  _processLockQueue() {
    if (this._lockQueue.length > 0 && !this._isSessionLocked) {
      const nextResolve = this._lockQueue.shift();
      this._isSessionLocked = true;
      nextResolve();
    }
  },
  
  // ======================================================================
  // GETTERS - All return exact values without rounding
  // ======================================================================
  
  getActiveTab() {
    return this.activeTab;
  },
  
  getSessionStartTime() {
    return this.sessionStartTime;
  },
  
  getIsTracking() {
    return this.isTracking;
  },
  
  getTrackedSites() {
    return this.trackedSites;
  },
  
  getDailyUsage() {
    return this.dailyUsage;
  },
  
  getTimeLimit() {
    return this.timeLimit;
  },
  
  getSiteTimeLimits() {
    return this.siteTimeLimits;
  },
  
  // Get time limit for a specific domain
  getTimeLimitForDomain(domain) {
    if (!domain) return this.timeLimit; // Default to global limit
    
    // Normalize domain
    let normalizedDomain = domain.toLowerCase();
    if (normalizedDomain.startsWith('www.')) {
      normalizedDomain = normalizedDomain.substring(4);
    }
    
    // Check if there's a specific limit for this domain
    if (this.siteTimeLimits[normalizedDomain]) {
      return this.siteTimeLimits[normalizedDomain];
    }
    
    // Fall back to global limit
    return this.timeLimit;
  },
  
  // Get current session duration in milliseconds (or 0 if no active session)
  getCurrentSessionDuration() {
    if (!this.sessionStartTime) return 0;
    return Date.now() - this.sessionStartTime;
  },
  
  // Get current session domain (or null if no active session)
  getCurrentSessionDomain() {
    if (!this.activeTab || !this.activeTab.url) return null;
    try {
      return getDomainUtils().extractDomain(this.activeTab.url);
    } catch (error) {
      console.error('Error extracting domain from active tab:', error);
      return null;
    }
  },
  
  // Get total time spent today in milliseconds (including current session)
  getTotalTimeToday() {
    // Sum all domain times
    let totalMs = 0;
    Object.values(this.dailyUsage).forEach(ms => {
      totalMs += ms;
    });
    
    // Add current session if active
    const currentDomain = this.getCurrentSessionDomain();
    if (currentDomain && this.sessionStartTime) {
      const currentSessionMs = this.getCurrentSessionDuration();
      totalMs += currentSessionMs;
    }
    
    return totalMs;
  },
  
  // ======================================================================
  // SETTERS - All with validation
  // ======================================================================
  
  setActiveTab(tab) {
    this.activeTab = tab;
    this.lastUpdateTime = Date.now();
    return this;
  },
  
  setSessionStartTime(time) {
    if (time !== null && (typeof time !== 'number' || isNaN(time) || time < 0)) {
      console.warn('Invalid session start time:', time);
      return this;
    }
    this.sessionStartTime = time;
    this.lastUpdateTime = Date.now();
    return this;
  },
  
  setIsTracking(value) {
    this.isTracking = !!value;
    this.lastUpdateTime = Date.now();
    return this;
  },
  
  setTrackedSites(sites) {
    if (!Array.isArray(sites)) {
      console.warn('Invalid tracked sites:', sites);
      return this;
    }
    this.trackedSites = sites;
    this.lastUpdateTime = Date.now();
    return this;
  },
  
  setDailyUsage(usage) {
    if (typeof usage !== 'object') {
      console.warn('Invalid daily usage:', usage);
      return this;
    }
    
    // Convert any seconds values to milliseconds for consistency
    const normalizedUsage = {};
    Object.entries(usage).forEach(([domain, time]) => {
      // If the value is small, it's likely in seconds, so convert to ms
      if (time < 10000 && time > 0) {
        normalizedUsage[domain] = time * 1000;
      } else {
        normalizedUsage[domain] = time;
      }
    });
    
    this.dailyUsage = normalizedUsage;
    this.lastUpdateTime = Date.now();
    return this;
  },
  
  setTimeLimit(limit) {
    if (typeof limit !== 'number' || isNaN(limit) || limit <= 0) {
      console.warn('Invalid time limit:', limit);
      return this;
    }
    this.timeLimit = limit;
    this.lastUpdateTime = Date.now();
    return this;
  },
  
  setSiteTimeLimits(limits) {
    if (typeof limits !== 'object') {
      console.warn('Invalid site time limits:', limits);
      return this;
    }
    this.siteTimeLimits = limits;
    this.lastUpdateTime = Date.now();
    return this;
  },
  
  // ======================================================================
  // STATE OPERATIONS
  // ======================================================================
  
  // Reset session state
  resetSession() {
    this.activeTab = null;
    this.sessionStartTime = null;
    this.lastUpdateTime = Date.now();
    return this;
  },
  
  // Update daily usage for a domain
  updateDailyUsage(domain, milliseconds) {
    if (!domain || typeof milliseconds !== 'number' || isNaN(milliseconds) || milliseconds < 0) {
      console.warn('Invalid parameters for updateDailyUsage:', domain, milliseconds);
      return this;
    }
    
    if (!this.dailyUsage[domain]) {
      this.dailyUsage[domain] = 0;
    }
    
    this.dailyUsage[domain] += milliseconds;
    this.lastSaveTime = Date.now();
    this.lastUpdateTime = Date.now();
    return this;
  }
};

// ======================================================================
// GLOBAL STATE SYNCHRONIZATION
// ======================================================================

// Initialize state from global variables if they exist
// This prevents redeclaration errors when the script is imported multiple times
if (typeof self.trackingActiveTab !== 'undefined') state.setActiveTab(self.trackingActiveTab);
if (typeof self.sessionStartTime !== 'undefined') state.setSessionStartTime(self.sessionStartTime);
if (typeof self.isTrackingEnabled !== 'undefined') state.setIsTracking(self.isTrackingEnabled);
if (typeof self.trackedSitesData !== 'undefined') state.setTrackedSites(self.trackedSitesData);
if (typeof self.dailyUsageData !== 'undefined') state.setDailyUsage(self.dailyUsageData);
if (typeof self.timeLimitValue !== 'undefined') state.setTimeLimit(self.timeLimitValue);

// Store state in global scope for backward compatibility
function syncStateToGlobals() {
  self.trackingActiveTab = state.activeTab;
  self.sessionStartTime = state.sessionStartTime;
  self.isTrackingEnabled = state.isTracking;
  self.trackedSitesData = state.trackedSites;
  self.dailyUsageData = state.dailyUsage;
  self.timeLimitValue = state.timeLimit;
}

// Initial sync
syncStateToGlobals();

// Create trackingModule object if it doesn't exist
if (!self.trackingModule) {
  self.trackingModule = {};
}

// ======================================================================
// PERIODIC STATE SAVING
// ======================================================================

// Set up periodic state saving to prevent data loss
const SAVE_INTERVAL = 30 * 1000; // 30 seconds
setInterval(async () => {
  try {
    // Only save if there have been changes since the last save
    if (Date.now() - state.lastSaveTime < SAVE_INTERVAL) {
      return;
    }
    
    // Save current state
    if (Object.keys(state.dailyUsage).length > 0) {
      const storage = getStorage();
      await storage.saveDailyUsage(state.dailyUsage);
      console.log('Periodic state save completed');
      state.lastSaveTime = Date.now();
    }
  } catch (error) {
    console.error('Error during periodic state save:', error);
  }
}, SAVE_INTERVAL);

// ======================================================================
// CORE TRACKING FUNCTIONS
// ======================================================================

/**
 * Initialize the tracking module
 * @returns {Promise<Object>} Result of the initialization
 */
async function initialize() {
  console.log('Tracking module initializing...');
  
  try {
    const storage = getStorage();
    
    // Load tracking status
    const trackingStatus = await storage.getTrackingStatus();
    state.setIsTracking(trackingStatus);
    console.log('Tracking status:', state.getIsTracking() ? 'enabled' : 'disabled');
    
    // Load tracked sites
    const sites = await storage.getTrackedSites();
    state.setTrackedSites(sites);
    console.log('Loaded tracked sites:', state.getTrackedSites().length);
    
    // Load time limit
    const limit = await storage.getTimeLimit();
    state.setTimeLimit(limit);
    console.log('Time limit:', state.getTimeLimit(), 'minutes');
    
    // Load site-specific time limits
    const siteLimits = await storage.getSiteTimeLimits();
    state.setSiteTimeLimits(siteLimits);
    console.log('Loaded site-specific time limits:', Object.keys(state.getSiteTimeLimits()).length);
    
    // Load daily usage
    const usageData = await storage.getDailyUsage();
    
  // Always ensure values are in milliseconds
  const normalizedUsage = {};
  Object.entries(usageData.dailyUsage).forEach(([domain, time]) => {
    // If the value is small, it's likely in seconds, so convert to ms
    if (time < 10000 && time > 0) {
      normalizedUsage[domain] = time * 1000;
    } else {
      normalizedUsage[domain] = time;
    }
    
    // Validate that the value is reasonable (not negative or NaN)
    if (isNaN(normalizedUsage[domain]) || normalizedUsage[domain] < 0) {
      console.warn(`Invalid time value for ${domain}: ${time}, setting to 0`);
      normalizedUsage[domain] = 0;
    }
  });
  
  state.setDailyUsage(normalizedUsage);
    
    if (usageData.isNewDay) {
      console.log('New day detected, resetting usage data');
      await storage.saveDailyUsage(state.getDailyUsage(), usageData.usageDate);
    } else {
      console.log('Loaded daily usage data for', usageData.usageDate);
    }
    
    // Sync state to global variables
    syncStateToGlobals();
    
    console.log('Tracking module initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing tracking module:', error);
    
    // Try to initialize with defaults if loading fails
    try {
      console.log('Attempting to initialize with defaults');
      const storage = getStorage();
      
      state.setIsTracking(true);
      state.setTrackedSites(storage.DEFAULT_TRACKED_SITES);
      state.setTimeLimit(storage.DEFAULT_TIME_LIMIT);
      state.setDailyUsage({});
      
      // Sync state to global variables
      syncStateToGlobals();
      
      return { 
        success: true, 
        withDefaults: true,
        originalError: error 
      };
    } catch (fallbackError) {
      console.error('Failed to initialize with defaults:', fallbackError);
      return { 
        success: false, 
        error,
        fallbackError 
      };
    }
  }
}

/**
 * Handle tab change (activation or URL update)
 * @param {Object} tab - The tab that changed
 * @returns {Promise<Object>} Result of the operation
 */
async function handleTabChange(tab) {
  try {
    // Validate tracking status
    if (!state.getIsTracking()) {
      console.log('Tracking is disabled, ignoring tab change');
      return { success: true, tracked: false };
    }
    
    // Validate tab
    if (!tab || !tab.url) {
      console.log('Tab has no URL, ignoring');
      return { success: true, tracked: false };
    }
    
    // Ensure tab is active - only track active tabs
    if (!tab.active) {
      console.log('Tab is not active, ignoring');
      return { success: true, tracked: false, reason: 'not_active' };
    }
    
    // Log tab details for debugging
    console.log('Tab change details:', {
      id: tab.id,
      url: tab.url,
      active: tab.active,
      title: tab.title
    });
    
    // Acquire session lock to prevent race conditions
    await state.lockSession();
    
    try {
      // Force end any previous session if there is one
      if (state.getActiveTab() && state.getSessionStartTime()) {
        console.log('Forcing end of previous session before handling new tab');
        
        // Store the previous domain for logging
        const prevDomain = state.getActiveTab().url ? 
          getDomainUtils().extractDomain(state.getActiveTab().url) : 'unknown';
        
        // End the session
        const endResult = await endSession(false, false); // Don't acquire lock again
        
        if (endResult.success && endResult.logged) {
          console.log(`Successfully ended previous session for ${prevDomain} (${endResult.durationMs}ms)`);
        }
      }
      
      // Extract domain from URL
      const domainUtils = getDomainUtils();
      const domain = domainUtils.extractDomain(tab.url);
      
      if (!domain) {
        console.log('Could not extract domain from URL:', tab.url);
        state.releaseSessionLock();
        return { success: true, tracked: false };
      }
      
      // Check if domain should be tracked
      const shouldTrack = domainUtils.isTrackedDomain(domain, state.getTrackedSites());
      
      if (shouldTrack) {
        // Start new session with precise timestamp
        state.setActiveTab(tab);
        state.setSessionStartTime(Date.now());
        
        // Sync state to global variables
        syncStateToGlobals();
        
        console.log('Started tracking session for:', domain);
        
        // Check time limit
        await checkTimeLimit(domain);
        
        state.releaseSessionLock();
        return { success: true, tracked: true, domain };
      } else {
        console.log('Domain not tracked:', domain);
        state.resetSession();
        
        // Sync state to global variables
        syncStateToGlobals();
        
        state.releaseSessionLock();
        return { success: true, tracked: false, domain };
      }
    } catch (innerError) {
      // Make sure we release the lock even if an error occurs
      state.releaseSessionLock();
      throw innerError;
    }
  } catch (error) {
    console.error('Error handling tab change:', error);
    return { success: false, error };
  }
}

/**
 * End the current tracking session
 * @param {boolean} [forceLog=false] - Whether to force logging even for short sessions
 * @param {boolean} [hasLock=true] - Whether the caller already has the session lock
 * @returns {Promise<Object>} Result of the operation
 */
async function endSession(forceLog = false, hasLock = true) {
  let lockAcquired = false;
  
  try {
    // Use state getters for validation
    if (!state.getActiveTab() || !state.getSessionStartTime()) {
      console.log('No active session to end');
      return { success: true, logged: false };
    }
    
    // Acquire lock if needed
    if (hasLock) {
      // Caller already has the lock, no need to acquire it
      console.log('Using existing session lock for endSession');
    } else {
      // Acquire lock
      console.log('Acquiring session lock for endSession');
      await state.lockSession();
      lockAcquired = true;
    }
    
    // Store session data before resetting to prevent data loss in case of errors
    const sessionTab = { ...state.getActiveTab() };
    const sessionStart = state.getSessionStartTime();
    
    // Reset session in state
    state.resetSession();
    
    // Sync state to global variables
    syncStateToGlobals();
    
    // Get domain utils with validation
    const domainUtils = getDomainUtils();
    
    // Extract domain from URL
    const domain = domainUtils.extractDomain(sessionTab.url);
    
    if (!domain) {
      console.log('Could not extract domain from URL:', sessionTab.url);
      if (lockAcquired) state.releaseSessionLock();
      return { success: true, logged: false };
    }
    
    // Normalize domain for storage (remove www. prefix if present)
    let normalizedDomain = domain.toLowerCase();
    if (normalizedDomain.startsWith('www.')) {
      normalizedDomain = normalizedDomain.substring(4);
    }
    
    // Calculate session duration with millisecond precision
    const endTime = Date.now();
    const durationMs = endTime - sessionStart;
    
    // Only log sessions longer than 500ms or if forced
    if (durationMs >= 500 || forceLog) {
      // Get site info
      const siteInfo = domainUtils.getSiteInfo(domain, state.getTrackedSites()) || {
        domain: normalizedDomain,
        category: domainUtils.categorizeDomain(domain)
      };
      
      // Update daily usage with normalized domain
      state.updateDailyUsage(normalizedDomain, durationMs);
      
      // Get storage with validation
      const storage = getStorage();
      
      // Save to storage
      await storage.saveDailyUsage(state.getDailyUsage());
      
      // Queue for sync
      const session = {
        domain: normalizedDomain,
        category: siteInfo.category,
        durationMs,
        timestamp: sessionStart,
        endTime
      };
      
      await storage.queueSessionForSync(session);
      
      // Sync state to global variables
      syncStateToGlobals();
      
      console.log(`Session ended for ${normalizedDomain}, duration: ${durationMs}ms, total today: ${state.getDailyUsage()[normalizedDomain]}ms`);
      
      if (lockAcquired) state.releaseSessionLock();
      return { 
        success: true, 
        logged: true, 
        domain: normalizedDomain, 
        durationMs,
        category: siteInfo.category,
        totalTodayMs: state.getDailyUsage()[normalizedDomain]
      };
    } else {
      console.log(`Session too short (${durationMs}ms), not logging`);
      if (lockAcquired) state.releaseSessionLock();
      return { 
        success: true, 
        logged: false, 
        domain,
        durationMs,
        reason: 'too_short' 
      };
    }
  } catch (error) {
    console.error('Error ending session:', error);
    if (lockAcquired) state.releaseSessionLock();
    return { success: false, error };
  }
}

/**
 * Handle idle state change
 * @param {string} idleState - The new idle state ('active', 'idle', or 'locked')
 * @returns {Promise<Object>} Result of the operation
 */
async function handleIdleStateChange(idleState) {
  let lockAcquired = false;
  
  try {
    if (idleState === 'active') {
      // User is back, but we'll wait for tab activation to start a new session
      console.log('User active again, waiting for tab activation');
      return { success: true, action: 'wait_for_tab' };
    } else {
      // User is idle or locked, end current session if one exists
      if (state.getActiveTab() && state.getSessionStartTime()) {
        // Acquire lock to prevent race conditions with tab changes
        await state.lockSession();
        lockAcquired = true;
        
        // Check again after acquiring lock in case another process ended the session
        if (state.getActiveTab() && state.getSessionStartTime()) {
          console.log(`User ${idleState}, ending current session`);
          const result = await endSession(false, false); // Don't acquire lock again
          state.releaseSessionLock();
          return { ...result, action: 'ended_session' };
        } else {
          console.log(`User ${idleState}, session already ended by another process`);
          state.releaseSessionLock();
          return { success: true, action: 'already_ended' };
        }
      } else {
        console.log(`User ${idleState}, no active session to end`);
        return { success: true, action: 'no_action' };
      }
    }
  } catch (error) {
    console.error('Error handling idle state change:', error);
    if (lockAcquired) state.releaseSessionLock();
    return { success: false, error };
  }
}

/**
 * Check if the user has exceeded their time limit
 * @param {string} domain - The domain to check
 * @param {boolean} [detailed=false] - Whether to include detailed breakdown in result
 * @returns {Promise<Object>} Result of the operation with limit status
 */
async function checkTimeLimit(domain, detailed = false) {
  try {
    // Get total time in milliseconds
    const totalMs = state.getTotalTimeToday();
    
    // Convert to minutes for limit comparison
    const totalMinutes = totalMs / (60 * 1000);
    
    // Get global time limit
    const globalTimeLimit = state.getTimeLimit();
    
    // Calculate global percentage
    const globalPercentageUsed = (totalMinutes / globalTimeLimit) * 100;
    
    // Check for site-specific time limit if domain is provided
    let domainTimeLimit = globalTimeLimit;
    let domainMinutes = 0;
    let domainPercentageUsed = 0;
    let hasSiteSpecificLimit = false;
    
    if (domain && domain !== 'stats') {
      // Normalize domain
      let normalizedDomain = domain.toLowerCase();
      if (normalizedDomain.startsWith('www.')) {
        normalizedDomain = normalizedDomain.substring(4);
      }
      
      // Get domain-specific time limit
      domainTimeLimit = state.getTimeLimitForDomain(normalizedDomain);
      hasSiteSpecificLimit = domainTimeLimit !== globalTimeLimit;
      
      // Get domain-specific usage
      if (state.getDailyUsage()[normalizedDomain]) {
        domainMinutes = state.getDailyUsage()[normalizedDomain] / (60 * 1000);
      }
      
      // Add current session if it's for this domain
      const currentDomain = state.getCurrentSessionDomain();
      if (currentDomain && state.getSessionStartTime()) {
        let normalizedCurrentDomain = currentDomain.toLowerCase();
        if (normalizedCurrentDomain.startsWith('www.')) {
          normalizedCurrentDomain = normalizedCurrentDomain.substring(4);
        }
        
        if (normalizedCurrentDomain === normalizedDomain) {
          const currentSessionMs = state.getCurrentSessionDuration();
          domainMinutes += currentSessionMs / (60 * 1000);
        }
      }
      
      // Calculate domain-specific percentage
      domainPercentageUsed = (domainMinutes / domainTimeLimit) * 100;
      
      console.log(`Domain time limit check for ${normalizedDomain}: ${domainMinutes.toFixed(2)}/${domainTimeLimit} minutes (${domainPercentageUsed.toFixed(1)}%)`);
    }
    
    console.log(`Global time limit check: ${totalMinutes.toFixed(2)}/${globalTimeLimit} minutes (${globalPercentageUsed.toFixed(1)}%)`);
    
    // Use the more restrictive percentage for limit status
    const percentageUsed = Math.max(globalPercentageUsed, domainPercentageUsed);
    
    // Determine limit status
    let limitStatus = 'ok';
    if (percentageUsed >= 100) {
      limitStatus = 'exceeded';
    } else if (percentageUsed >= 80) {
      limitStatus = 'warning';
    }
    
    // Prepare result
    const result = {
      success: true,
      domain,
      currentTime: domainMinutes > 0 ? domainMinutes : totalMinutes,
      timeLimit: domainTimeLimit,
      percentageUsed: Math.min(percentageUsed, 100), // Cap at 100% for UI purposes
      limitStatus,
      remainingMinutes: Math.max(0, domainTimeLimit - (domainMinutes > 0 ? domainMinutes : totalMinutes)), // Remaining time in minutes
      globalTimeLimit,
      globalCurrentTime: totalMinutes,
      globalPercentageUsed: Math.min(globalPercentageUsed, 100),
      hasSiteSpecificLimit
    };
    
    return result;
  } catch (error) {
    console.error('Error checking time limit:', error);
    return { 
      success: false, 
      error,
      domain,
      currentTime: 0,
      timeLimit: state.getTimeLimit(),
      percentageUsed: 0,
      limitStatus: 'error',
      remainingMinutes: state.getTimeLimit(),
      globalTimeLimit: state.getTimeLimit(),
      globalCurrentTime: 0,
      globalPercentageUsed: 0,
      hasSiteSpecificLimit: false
    };
  }
}

/**
 * Get current tracking stats
 * @param {boolean} [detailed=false] - Whether to include detailed breakdown in result
 * @returns {Promise<Object>} Current tracking stats
 */
async function getStats(detailed = false) {
  try {
    // Use checkTimeLimit to get consistent stats
    const timeLimitResult = await checkTimeLimit('stats', detailed);
    
    // Normalize domains in daily usage
    const normalizedDailyUsage = {};
    const dailyUsage = state.getDailyUsage();
    
    // Process each domain in the daily usage
    for (const domain in dailyUsage) {
      if (Object.prototype.hasOwnProperty.call(dailyUsage, domain)) {
        // Normalize domain (remove www. prefix if present)
        let normalizedDomain = domain.toLowerCase();
        if (normalizedDomain.startsWith('www.')) {
          normalizedDomain = normalizedDomain.substring(4);
        }
        
        // Add to normalized usage
        if (!normalizedDailyUsage[normalizedDomain]) {
          normalizedDailyUsage[normalizedDomain] = 0;
        }
        normalizedDailyUsage[normalizedDomain] += dailyUsage[domain];
      }
    }
    
    // Add current session if active
    const currentDomain = state.getCurrentSessionDomain();
    if (currentDomain && state.getSessionStartTime()) {
      // Normalize current domain
      let normalizedCurrentDomain = currentDomain.toLowerCase();
      if (normalizedCurrentDomain.startsWith('www.')) {
        normalizedCurrentDomain = normalizedCurrentDomain.substring(4);
      }
      
      const currentSessionMs = state.getCurrentSessionDuration();
      if (!normalizedDailyUsage[normalizedCurrentDomain]) {
        normalizedDailyUsage[normalizedCurrentDomain] = 0;
      }
      normalizedDailyUsage[normalizedCurrentDomain] += currentSessionMs;
    }
    
    // Convert milliseconds to seconds for consistency with background.js
    const secondsUsage = {};
    for (const domain in normalizedDailyUsage) {
      if (Object.prototype.hasOwnProperty.call(normalizedDailyUsage, domain)) {
        secondsUsage[domain] = Math.floor(normalizedDailyUsage[domain] / 1000);
      }
    }
    
    // Calculate total time in seconds
    let totalSeconds = 0;
    for (const domain in secondsUsage) {
      if (Object.prototype.hasOwnProperty.call(secondsUsage, domain)) {
        totalSeconds += secondsUsage[domain];
      }
    }
    
    // Prepare detailed stats if requested
    let detailedStats = null;
    if (detailed) {
      // Convert to minutes for detailed breakdown
      const domainBreakdown = {};
      for (const domain in secondsUsage) {
        if (Object.prototype.hasOwnProperty.call(secondsUsage, domain)) {
          domainBreakdown[domain] = secondsUsage[domain] / 60;
        }
      }
      
      // Create category breakdown
      const categoryBreakdown = {};
      for (const domain in secondsUsage) {
        if (Object.prototype.hasOwnProperty.call(secondsUsage, domain)) {
          const domainUtils = getDomainUtils();
          const category = domainUtils.categorizeDomain(domain);
          
          if (!categoryBreakdown[category]) {
            categoryBreakdown[category] = 0;
          }
          
          categoryBreakdown[category] += secondsUsage[domain] / 60; // Convert to minutes
        }
      }
      
      detailedStats = {
        domainBreakdown,
        categoryBreakdown,
        totalSeconds,
        totalMinutes: totalSeconds / 60
      };
    }
    
    // Add additional stats
    return {
      ...timeLimitResult,
      isTracking: state.getIsTracking(),
      trackedSitesCount: state.getTrackedSites().length,
      dailyUsage: secondsUsage,
      totalSeconds,
      totalMinutes: totalSeconds / 60,
      detailed: detailedStats
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    
    // Return basic stats in case of error
    return {
      success: false,
      error,
      isTracking: state.getIsTracking(),
      timeLimit: state.getTimeLimit(),
      currentTime: 0,
      totalSeconds: 0,
      totalMinutes: 0,
      percentageUsed: 0,
      limitStatus: 'error'
    };
  }
}

/**
 * Set tracking status
 * @param {boolean} enabled - Whether tracking should be enabled
 * @returns {Promise<Object>} Result of the operation
 */
async function setTrackingStatus(enabled) {
  let lockAcquired = false;
  
  try {
    // Acquire lock to prevent race conditions
    await state.lockSession();
    lockAcquired = true;
    
    // Update state
    state.setIsTracking(!!enabled);
    
    // Get storage with validation
    const storage = getStorage();
    
    // Save to storage
    await storage.saveTrackingStatus(state.getIsTracking());
    
    // Sync state to global variables
    syncStateToGlobals();
    
    // If tracking is disabled, end current session
    if (!state.getIsTracking() && state.getActiveTab() && state.getSessionStartTime()) {
      await endSession(false, false); // Don't acquire lock again
    }
    
    console.log('Tracking status set to:', state.getIsTracking() ? 'enabled' : 'disabled');
    
    // Release the lock
    state.releaseSessionLock();
    
    return { success: true, isTracking: state.getIsTracking() };
  } catch (error) {
    console.error('Error setting tracking status:', error);
    
    // Make sure to release the lock even if an error occurs
    if (lockAcquired) {
      state.releaseSessionLock();
    }
    
    return { success: false, error };
  }
}

/**
 * Set time limit
 * @param {number} minutes - The time limit in minutes
 * @returns {Promise<Object>} Result of the operation
 */
async function setTimeLimit(minutes) {
  let lockAcquired = false;
  
  try {
    // Validate input
    if (typeof minutes !== 'number' || isNaN(minutes) || minutes <= 0) {
      throw new Error('Invalid time limit: ' + minutes);
    }
    
    // Acquire lock to prevent race conditions
    await state.lockSession();
    lockAcquired = true;
    
    // Update state
    state.setTimeLimit(minutes);
    
    // Get storage with validation
    const storage = getStorage();
    
    // Save to storage
    await storage.saveTimeLimit(state.getTimeLimit());
    
    // Sync state to global variables
    syncStateToGlobals();
    
    console.log('Time limit set to:', state.getTimeLimit(), 'minutes');
    
    // Release the lock
    state.releaseSessionLock();
    
    return { success: true, timeLimit: state.getTimeLimit() };
  } catch (error) {
    console.error('Error setting time limit:', error);
    
    // Make sure to release the lock even if an error occurs
    if (lockAcquired) {
      state.releaseSessionLock();
    }
    
    return { success: false, error };
  }
}

/**
 * Update tracked sites
 * @param {Array} sites - The new tracked sites list
 * @returns {Promise<Object>} Result of the operation
 */
async function updateTrackedSites(sites) {
  let lockAcquired = false;
  
  try {
    // Validate input
    if (!Array.isArray(sites)) {
      throw new Error('Invalid tracked sites: not an array');
    }
    
    // Acquire lock to prevent race conditions
    await state.lockSession();
    lockAcquired = true;
    
    // Update state
    state.setTrackedSites(sites);
    
    // Get storage with validation
    const storage = getStorage();
    
    // Save to storage
    await storage.saveTrackedSites(state.getTrackedSites());
    
    // Sync state to global variables
    syncStateToGlobals();
    
    console.log('Updated tracked sites:', state.getTrackedSites().length);
    
    // Release the lock
    state.releaseSessionLock();
    
    return { success: true, trackedSites: state.getTrackedSites() };
  } catch (error) {
    console.error('Error updating tracked sites:', error);
    
    // Make sure to release the lock even if an error occurs
    if (lockAcquired) {
      state.releaseSessionLock();
    }
    
    return { success: false, error };
  }
}

/**
 * Update site-specific time limit
 * @param {string} domain - The domain to set a limit for
 * @param {number} minutes - The time limit in minutes
 * @returns {Promise<Object>} Result of the operation
 */
async function updateSiteTimeLimit(domain, minutes) {
  let lockAcquired = false;
  
  try {
    // Validate input
    if (!domain || typeof domain !== 'string') {
      throw new Error('Invalid domain: ' + domain);
    }
    
    if (typeof minutes !== 'number' || isNaN(minutes) || minutes <= 0) {
      throw new Error('Invalid time limit: ' + minutes);
    }
    
    // Normalize domain
    let normalizedDomain = domain.toLowerCase();
    if (normalizedDomain.startsWith('www.')) {
      normalizedDomain = normalizedDomain.substring(4);
    }
    
    // Acquire lock to prevent race conditions
    await state.lockSession();
    lockAcquired = true;
    
    // Get current site limits
    const siteLimits = { ...state.getSiteTimeLimits() };
    
    // Update limit for this domain
    siteLimits[normalizedDomain] = minutes;
    
    // Update state
    state.setSiteTimeLimits(siteLimits);
    
    // Get storage with validation
    const storage = getStorage();
    
    // Save to storage
    await storage.saveSiteTimeLimits(state.getSiteTimeLimits());
    
    // Sync state to global variables
    syncStateToGlobals();
    
    console.log(`Set time limit for ${normalizedDomain} to ${minutes} minutes`);
    
    // Release the lock
    state.releaseSessionLock();
    
    return { success: true, domain: normalizedDomain, timeLimit: minutes };
  } catch (error) {
    console.error('Error setting site time limit:', error);
    
    // Make sure to release the lock even if an error occurs
    if (lockAcquired) {
      state.releaseSessionLock();
    }
    
    return { success: false, error };
  }
}

/**
 * Remove site-specific time limit
 * @param {string} domain - The domain to remove the limit for
 * @returns {Promise<Object>} Result of the operation
 */
async function removeSiteTimeLimit(domain) {
  let lockAcquired = false;
  
  try {
    // Validate input
    if (!domain || typeof domain !== 'string') {
      throw new Error('Invalid domain: ' + domain);
    }
    
    // Normalize domain
    let normalizedDomain = domain.toLowerCase();
    if (normalizedDomain.startsWith('www.')) {
      normalizedDomain = normalizedDomain.substring(4);
    }
    
    // Acquire lock to prevent race conditions
    await state.lockSession();
    lockAcquired = true;
    
    // Get current site limits
    const siteLimits = { ...state.getSiteTimeLimits() };
    
    // Check if the domain has a limit
    if (!siteLimits[normalizedDomain]) {
      console.log(`No time limit found for ${normalizedDomain}`);
      state.releaseSessionLock();
      return { success: true, domain: normalizedDomain, removed: false };
    }
    
    // Remove limit for this domain
    delete siteLimits[normalizedDomain];
    
    // Update state
    state.setSiteTimeLimits(siteLimits);
    
    // Get storage with validation
    const storage = getStorage();
    
    // Save to storage
    await storage.saveSiteTimeLimits(state.getSiteTimeLimits());
    
    // Sync state to global variables
    syncStateToGlobals();
    
    console.log(`Removed time limit for ${normalizedDomain}`);
    
    // Release the lock
    state.releaseSessionLock();
    
    return { success: true, domain: normalizedDomain, removed: true };
  } catch (error) {
    console.error('Error removing site time limit:', error);
    
    // Make sure to release the lock even if an error occurs
    if (lockAcquired) {
      state.releaseSessionLock();
    }
    
    return { success: false, error };
  }
}

// ======================================================================
// EXPORT FUNCTIONS TO TRACKING MODULE
// ======================================================================

// Assign functions to the tracking module
self.trackingModule.initialize = initialize;
self.trackingModule.handleTabChange = handleTabChange;
self.trackingModule.endSession = endSession;
self.trackingModule.handleIdleStateChange = handleIdleStateChange;
self.trackingModule.checkTimeLimit = checkTimeLimit;
self.trackingModule.getStats = getStats;
self.trackingModule.setTrackingStatus = setTrackingStatus;
self.trackingModule.setTimeLimit = setTimeLimit;
self.trackingModule.updateTrackedSites = updateTrackedSites;
self.trackingModule.updateSiteTimeLimit = updateSiteTimeLimit;
self.trackingModule.removeSiteTimeLimit = removeSiteTimeLimit;

/**
 * Reset tracking data but save history
 * @returns {Promise<Object>} Result of the operation
 */
async function resetTracking() {
  let lockAcquired = false;
  
  try {
    // Acquire lock to prevent race conditions
    await state.lockSession();
    lockAcquired = true;
    
    // End current session if there is one
    if (state.getActiveTab() && state.getSessionStartTime()) {
      await endSession(true, false); // Force log the current session, don't acquire lock again
    }
    
    // Get current usage before resetting
    const currentUsage = { ...state.getDailyUsage() };
    
    // Save to reset history
    const storage = getStorage();
    await storage.saveResetHistory(currentUsage);
    
    // Increment reset count
    await storage.incrementResetCount();
    
    // Reset daily usage - ensure it's completely empty
    state.setDailyUsage({});
    
    // Save empty usage to storage
    await storage.saveDailyUsage(state.getDailyUsage());
    
    // Reset any cached values in the state
    state.lastSaveTime = Date.now();
    state.lastUpdateTime = Date.now();
    
    // Sync state to global variables
    syncStateToGlobals();
    
    // Also clear global variables directly to ensure they're reset
    self.dailyUsageData = {};
    
    console.log('Tracking reset successfully');
    
    // Release the lock
    state.releaseSessionLock();
    
    return { 
      success: true, 
      previousUsage: currentUsage,
      resetTime: Date.now()
    };
  } catch (error) {
    console.error('Error resetting tracking:', error);
    
    // Make sure to release the lock even if an error occurs
    if (lockAcquired) {
      state.releaseSessionLock();
    }
    
    return { success: false, error };
  }
}

// Export the state for direct access if needed
self.trackingModule.state = state;

// Add resetTracking to the tracking module
self.trackingModule.resetTracking = resetTracking;

// Log that the module is ready
console.log('Tracking module loaded and ready');
