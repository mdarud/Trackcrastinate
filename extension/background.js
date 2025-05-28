/**
 * Trackcrastinate - Background Service Worker
 * 
 * This background script handles:
 * - Tab tracking and time monitoring
 * - Data syncing with Supabase
 * - Time limit enforcement
 * - Notifications and alarms
 * - Message handling from popup and content scripts
 */

// Constants
const IDLE_TIMEOUT = 60; // seconds
const SYNC_INTERVAL = 5 * 60; // 5 minutes in seconds
const DEFAULT_TIME_LIMIT = 60; // 60 minutes per day
const DEFAULT_WARNING_THRESHOLD = 80; // 80% of time limit

// Default settings
const DEFAULT_SETTINGS = {
  enableTracking: true,
  showNotifications: true,
  startAtLaunch: true,
  dailyLimit: DEFAULT_TIME_LIMIT,
  activityType: 'dino-game',
  mathDifficulty: 'medium',
  warningThreshold: DEFAULT_WARNING_THRESHOLD,
  notificationFrequency: 'medium',
  roastLevel: 'medium',
  darkMode: false,
  fontSize: 'medium',
  enableSync: true,
  offlineMode: false,
  dashboardUrl: 'http://localhost:3000'
};

// Default tracked sites
const DEFAULT_TRACKED_SITES = [
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

// State variables
let bg_activeTab = null;
let bg_sessionStartTime = null;
let bg_isTracking = true;
let bg_trackedSites = [];
let bg_dailyUsage = {};
let bg_timeLimit = DEFAULT_TIME_LIMIT;
let bg_siteTimeLimits = {};
let bg_currentUser = null;
let bg_isOfflineMode = false;
let failedSyncAttempts = 0;

// Initialize extension
function initialize() {
  console.log('Trackcrastinate: Background service worker initializing...');
  
  try {
    chrome.idle.setDetectionInterval(IDLE_TIMEOUT);
    chrome.alarms.create('syncData', { periodInMinutes: SYNC_INTERVAL / 60 });
    chrome.alarms.create('checkTimeLimits', { periodInMinutes: 1 });
    
    if (self.notificationManager && self.notificationManager.initialize) {
      self.notificationManager.initialize()
        .catch(error => console.error('Error initializing notification manager:', error));
    }
    
    if (self.onboardingManager && self.onboardingManager.initialize) {
      self.onboardingManager.initialize()
        .then(result => {
          if (result.success) {
            return self.onboardingManager.checkFirstRun();
          }
        })
        .catch(error => console.error('Error initializing onboarding manager:', error));
    }
    
    if (self.trackingModule && self.trackingModule.initialize) {
      self.trackingModule.initialize()
        .then(result => {
          if (result.success) {
            if (self.trackingActiveTab) bg_activeTab = self.trackingActiveTab;
            if (self.sessionStartTime) bg_sessionStartTime = self.sessionStartTime;
            if (typeof self.isTrackingEnabled === 'boolean') bg_isTracking = self.isTrackingEnabled;
            if (self.trackedSitesData) bg_trackedSites = self.trackedSitesData;
            if (self.dailyUsageData) bg_dailyUsage = self.dailyUsageData;
            if (self.timeLimitValue) bg_timeLimit = self.timeLimitValue;
            
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
              if (tabs.length > 0) {
                self.trackingModule.handleTabChange(tabs[0])
                  .catch(error => console.error('Error handling initial tab with tracking module:', error));
              }
            });
          } else {
            legacyInitialize();
          }
        })
        .catch(error => {
          console.error('Error during tracking module initialization:', error);
          legacyInitialize();
        });
    } else {
      legacyInitialize();
    }
    
    console.log('Trackcrastinate: Background service worker initialized successfully');
  } catch (error) {
    console.error('Error initializing background service worker:', error);
    try {
      legacyInitialize();
    } catch (fallbackError) {
      console.error('Error during legacy initialization:', fallbackError);
    }
  }
}

function legacyInitialize() {
  chrome.storage.local.get(['isTracking'], function(result) {
    if (typeof result.isTracking === 'boolean') {
      bg_isTracking = result.isTracking;
    }
  });
  
  chrome.storage.local.get(['trackedSites'], function(result) {
    if (Array.isArray(result.trackedSites) && result.trackedSites.length > 0) {
      bg_trackedSites = result.trackedSites;
    } else {
      bg_trackedSites = DEFAULT_TRACKED_SITES.slice();
      chrome.storage.local.set({ trackedSites: bg_trackedSites });
    }
  });
  
  chrome.storage.local.get(['timeLimit', 'settings'], function(result) {
    if (typeof result.timeLimit === 'number' && result.timeLimit > 0) {
      bg_timeLimit = result.timeLimit;
    } else if (result.settings && typeof result.settings.dailyLimit === 'number' && result.settings.dailyLimit > 0) {
      bg_timeLimit = result.settings.dailyLimit;
    }
  });
  
  chrome.storage.local.get(['siteTimeLimits'], function(result) {
    if (result.siteTimeLimits && typeof result.siteTimeLimits === 'object') {
      bg_siteTimeLimits = result.siteTimeLimits;
    } else {
      bg_siteTimeLimits = {};
    }
  });
  
  loadDailyUsage();
  
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length > 0) {
      handleTabChange(tabs[0]);
    }
  });
}

function loadDailyUsage() {
  const today = new Date().toISOString().split('T')[0];
  
  chrome.storage.local.get(['dailyUsage', 'usageDate'], function(result) {
    if (result.usageDate === today && result.dailyUsage) {
      let usageData = result.dailyUsage;
      
      if (result.dailyUsage.dailyUsage && typeof result.dailyUsage.dailyUsage === 'object') {
        usageData = result.dailyUsage.dailyUsage;
      }
      
      const filteredUsage = {};
      for (const key in usageData) {
        if (key === 'dailyUsage' || key === 'usageDate' || key === 'lastSaved' || key === 'version') {
          continue;
        }
        filteredUsage[key] = usageData[key];
      }
      
      bg_dailyUsage = filteredUsage;
    } else {
      bg_dailyUsage = {};
      chrome.storage.local.set({ 
        dailyUsage: bg_dailyUsage, 
        usageDate: today 
      });
    }
  });
}

function extractDomain(url) {
  if (!url) return '';
  
  try {
    if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0 && url.indexOf('file://') !== 0) {
      url = 'https://' + url;
    }
    
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error('Error extracting domain:', error);
    return '';
  }
}

function isTrackedDomain(domain) {
  if (!domain || !Array.isArray(bg_trackedSites) || bg_trackedSites.length === 0) {
    return false;
  }
  
  const normalizedDomain = domain.toLowerCase();
  
  for (let i = 0; i < bg_trackedSites.length; i++) {
    const site = bg_trackedSites[i];
    if (!site) continue;
    
    if (typeof site === 'string') {
      const siteDomain = site.toLowerCase();
      if (normalizedDomain === siteDomain || normalizedDomain.endsWith('.' + siteDomain)) {
        return true;
      }
    } else if (typeof site === 'object' && site.domain) {
      const siteDomain = site.domain.toLowerCase();
      if (normalizedDomain === siteDomain || normalizedDomain.endsWith('.' + siteDomain)) {
        return true;
      }
    }
  }
  
  return false;
}

function getSiteInfo(domain) {
  if (!domain || !Array.isArray(bg_trackedSites) || bg_trackedSites.length === 0) {
    return null;
  }
  
  const normalizedDomain = domain.toLowerCase();
  
  for (let i = 0; i < bg_trackedSites.length; i++) {
    const site = bg_trackedSites[i];
    if (!site) continue;
    
    if (typeof site === 'string') {
      const siteDomain = site.toLowerCase();
      if (normalizedDomain === siteDomain || normalizedDomain.endsWith('.' + siteDomain)) {
        return { domain: site, category: categorizeDomain(domain) };
      }
    }
    
    if (typeof site === 'object' && site.domain) {
      const siteDomain = site.domain.toLowerCase();
      if (normalizedDomain === siteDomain || normalizedDomain.endsWith('.' + siteDomain)) {
        return site;
      }
    }
  }
  
  return null;
}

function categorizeDomain(domain) {
  if (!domain) return 'uncategorized';
  
  const normalizedDomain = domain.toLowerCase();
  
  if (normalizedDomain === 'facebook.com' || normalizedDomain.endsWith('.facebook.com') ||
      normalizedDomain === 'twitter.com' || normalizedDomain.endsWith('.twitter.com') ||
      normalizedDomain === 'instagram.com' || normalizedDomain.endsWith('.instagram.com') ||
      normalizedDomain === 'reddit.com' || normalizedDomain.endsWith('.reddit.com') ||
      normalizedDomain === 'tiktok.com' || normalizedDomain.endsWith('.tiktok.com') ||
      normalizedDomain === 'linkedin.com' || normalizedDomain.endsWith('.linkedin.com') ||
      normalizedDomain === 'pinterest.com' || normalizedDomain.endsWith('.pinterest.com') ||
      normalizedDomain === 'snapchat.com' || normalizedDomain.endsWith('.snapchat.com')) {
    return 'social';
  }
  
  if (normalizedDomain === 'youtube.com' || normalizedDomain.endsWith('.youtube.com') ||
      normalizedDomain === 'netflix.com' || normalizedDomain.endsWith('.netflix.com') ||
      normalizedDomain === 'hulu.com' || normalizedDomain.endsWith('.hulu.com') ||
      normalizedDomain === 'disneyplus.com' || normalizedDomain.endsWith('.disneyplus.com') ||
      normalizedDomain === 'twitch.tv' || normalizedDomain.endsWith('.twitch.tv') ||
      normalizedDomain === 'vimeo.com' || normalizedDomain.endsWith('.vimeo.com') ||
      normalizedDomain === 'spotify.com' || normalizedDomain.endsWith('.spotify.com') ||
      normalizedDomain === 'pandora.com' || normalizedDomain.endsWith('.pandora.com')) {
    return 'entertainment';
  }
  
  if (normalizedDomain === 'amazon.com' || normalizedDomain.endsWith('.amazon.com') ||
      normalizedDomain === 'ebay.com' || normalizedDomain.endsWith('.ebay.com') ||
      normalizedDomain === 'etsy.com' || normalizedDomain.endsWith('.etsy.com') ||
      normalizedDomain === 'walmart.com' || normalizedDomain.endsWith('.walmart.com') ||
      normalizedDomain === 'target.com' || normalizedDomain.endsWith('.target.com') ||
      normalizedDomain === 'bestbuy.com' || normalizedDomain.endsWith('.bestbuy.com')) {
    return 'shopping';
  }
  
  if (normalizedDomain === 'cnn.com' || normalizedDomain.endsWith('.cnn.com') ||
      normalizedDomain === 'bbc.com' || normalizedDomain.endsWith('.bbc.com') ||
      normalizedDomain === 'nytimes.com' || normalizedDomain.endsWith('.nytimes.com') ||
      normalizedDomain === 'washingtonpost.com' || normalizedDomain.endsWith('.washingtonpost.com') ||
      normalizedDomain === 'foxnews.com' || normalizedDomain.endsWith('.foxnews.com') ||
      normalizedDomain.includes('news')) {
    return 'news';
  }
  
  if (normalizedDomain === 'espn.com' || normalizedDomain.endsWith('.espn.com') ||
      normalizedDomain === 'nba.com' || normalizedDomain.endsWith('.nba.com') ||
      normalizedDomain === 'nfl.com' || normalizedDomain.endsWith('.nfl.com') ||
      normalizedDomain === 'mlb.com' || normalizedDomain.endsWith('.mlb.com') ||
      normalizedDomain === 'nhl.com' || normalizedDomain.endsWith('.nhl.com') ||
      normalizedDomain.includes('sports')) {
    return 'sports';
  }
  
  return 'uncategorized';
}

function handleTabChange(tab) {
  try {
    if (!bg_isTracking || !tab || !tab.url || !tab.active) {
      return { success: true, tracked: false };
    }
    
    if (bg_activeTab && bg_sessionStartTime) {
      endSession();
    }
    
    const domain = extractDomain(tab.url);
    
    if (!domain) {
      return { success: true, tracked: false };
    }
    
    const shouldTrack = isTrackedDomain(domain);
    
    if (shouldTrack) {
      bg_activeTab = tab;
      bg_sessionStartTime = Date.now();
      checkTimeLimit(domain);
      return { success: true, tracked: true, domain };
    } else {
      bg_activeTab = null;
      bg_sessionStartTime = null;
      return { success: true, tracked: false, domain };
    }
  } catch (error) {
    console.error('Error handling tab change:', error);
    return { success: false, error: error };
  }
}

function endSession() {
  try {
    if (!bg_activeTab || !bg_sessionStartTime) {
      return { success: true, logged: false };
    }
    
    const domain = extractDomain(bg_activeTab.url);
    
    if (!domain) {
      bg_activeTab = null;
      bg_sessionStartTime = null;
      return { success: true, logged: false };
    }
    
    const endTime = Date.now();
    const duration = Math.floor((endTime - bg_sessionStartTime) / 1000);
    
    if (duration >= 1) {
      const siteInfo = getSiteInfo(domain) || {
        domain: domain,
        category: categorizeDomain(domain)
      };
      
      let normalizedDomain = domain.toLowerCase();
      if (normalizedDomain.startsWith('www.')) {
        normalizedDomain = normalizedDomain.substring(4);
      }
      
      if (!bg_dailyUsage[normalizedDomain]) {
        bg_dailyUsage[normalizedDomain] = 0;
      }
      
      bg_dailyUsage[normalizedDomain] += duration;
      
      const today = new Date().toISOString().split('T')[0];
      chrome.storage.local.set({ 
        dailyUsage: bg_dailyUsage,
        usageDate: today
      });
      
      const session = {
        domain: normalizedDomain,
        category: siteInfo.category,
        duration: duration,
        timestamp: bg_sessionStartTime,
        endTime: endTime
      };
      
      queueSessionForSync(session);
      
      const result = { success: true, logged: true, domain: normalizedDomain, duration: duration };
      bg_activeTab = null;
      bg_sessionStartTime = null;
      return result;
    } else {
      bg_activeTab = null;
      bg_sessionStartTime = null;
      return { success: true, logged: false, duration: duration };
    }
  } catch (error) {
    console.error('Error ending session:', error);
    bg_activeTab = null;
    bg_sessionStartTime = null;
    return { success: false, error: error };
  }
}

function queueSessionForSync(session) {
  chrome.storage.local.get(['syncQueue'], function(result) {
    const syncQueue = Array.isArray(result.syncQueue) ? result.syncQueue : [];
    syncQueue.push(session);
    chrome.storage.local.set({ syncQueue: syncQueue });
  });
}

function handleIdleStateChange(state) {
  try {
    if (state === 'active') {
      return { success: true, action: 'wait_for_tab' };
    } else {
      if (bg_activeTab && bg_sessionStartTime) {
        const result = endSession();
        return Object.assign({}, result, { action: 'ended_session' });
      } else {
        return { success: true, action: 'no_action' };
      }
    }
  } catch (error) {
    console.error('Error handling idle state change:', error);
    return { success: false, error: error };
  }
}

function checkTimeLimit(domain) {
  try {
    let totalSeconds = 0;
    for (const key in bg_dailyUsage) {
      if (Object.prototype.hasOwnProperty.call(bg_dailyUsage, key)) {
        totalSeconds += bg_dailyUsage[key];
      }
    }
    
    if (bg_activeTab && bg_sessionStartTime && bg_activeTab.url) {
      const currentDomain = extractDomain(bg_activeTab.url);
      if (currentDomain && isTrackedDomain(currentDomain)) {
        const currentSessionDuration = (Date.now() - bg_sessionStartTime) / 1000;
        totalSeconds += currentSessionDuration;
      }
    }
    
    const totalMinutes = totalSeconds / 60;
    const globalTimeLimit = bg_timeLimit;
    const globalPercentageUsed = (totalMinutes / globalTimeLimit) * 100;
    
    let domainTimeLimit = globalTimeLimit;
    let domainMinutes = 0;
    let domainPercentageUsed = 0;
    let hasSiteSpecificLimit = false;
    
    if (domain && domain !== 'stats') {
      let normalizedDomain = domain.toLowerCase();
      if (normalizedDomain.startsWith('www.')) {
        normalizedDomain = normalizedDomain.substring(4);
      }
      
      domainTimeLimit = getTimeLimitForDomain(normalizedDomain);
      hasSiteSpecificLimit = domainTimeLimit !== globalTimeLimit;
      
      if (bg_dailyUsage[normalizedDomain]) {
        domainMinutes = bg_dailyUsage[normalizedDomain] / 60;
      }
      
      if (bg_activeTab && bg_sessionStartTime && bg_activeTab.url) {
        const currentDomain = extractDomain(bg_activeTab.url);
        if (currentDomain) {
          let normalizedCurrentDomain = currentDomain.toLowerCase();
          if (normalizedCurrentDomain.startsWith('www.')) {
            normalizedCurrentDomain = normalizedCurrentDomain.substring(4);
          }
          
          if (normalizedCurrentDomain === normalizedDomain) {
            const currentSessionDuration = (Date.now() - bg_sessionStartTime) / 1000;
            domainMinutes += currentSessionDuration / 60;
          }
        }
      }
      
      domainPercentageUsed = (domainMinutes / domainTimeLimit) * 100;
    }
    
    const percentageUsed = Math.max(globalPercentageUsed, domainPercentageUsed);
    
    let limitStatus = 'ok';
    if (percentageUsed >= 100) {
      limitStatus = 'exceeded';
    } else if (percentageUsed >= 80) {
      limitStatus = 'warning';
    }
    
    return {
      success: true,
      domain: domain,
      currentTime: domainMinutes > 0 ? Math.round(domainMinutes) : Math.round(totalMinutes),
      timeLimit: domainTimeLimit,
      percentageUsed: percentageUsed,
      limitStatus: limitStatus,
      globalTimeLimit: globalTimeLimit,
      globalCurrentTime: Math.round(totalMinutes),
      globalPercentageUsed: globalPercentageUsed,
      hasSiteSpecificLimit: hasSiteSpecificLimit
    };
  } catch (error) {
    console.error('Error checking time limit:', error);
    return { 
      success: false, 
      error: error,
      domain: domain,
      currentTime: 0,
      timeLimit: bg_timeLimit,
      percentageUsed: 0,
      limitStatus: 'error',
      globalTimeLimit: bg_timeLimit,
      globalCurrentTime: 0,
      globalPercentageUsed: 0,
      hasSiteSpecificLimit: false
    };
  }
}

function setTrackingStatus(enabled) {
  try {
    bg_isTracking = !!enabled;
    chrome.storage.local.set({ isTracking: bg_isTracking });
    
    if (!bg_isTracking && bg_activeTab && bg_sessionStartTime) {
      endSession();
    }
    
    return { success: true, isTracking: bg_isTracking };
  } catch (error) {
    console.error('Error setting tracking status:', error);
    return { success: false, error: error };
  }
}

function setTimeLimit(minutes) {
  try {
    bg_timeLimit = minutes;
    chrome.storage.local.set({ timeLimit: bg_timeLimit });
    
    chrome.storage.local.get(['settings'], function(result) {
      const settings = result.settings || Object.assign({}, DEFAULT_SETTINGS);
      settings.dailyLimit = bg_timeLimit;
      chrome.storage.local.set({ settings: settings });
    });
    
    return { success: true, timeLimit: bg_timeLimit };
  } catch (error) {
    console.error('Error setting time limit:', error);
    return { success: false, error: error };
  }
}

function updateTrackedSites(sites) {
  try {
    if (!Array.isArray(sites) || sites.length === 0) {
      bg_trackedSites = DEFAULT_TRACKED_SITES.slice();
    } else {
      bg_trackedSites = sites.filter(function(site) {
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
    
    chrome.storage.local.set({ trackedSites: bg_trackedSites });
    return { success: true, trackedSites: bg_trackedSites };
  } catch (error) {
    console.error('Error updating tracked sites:', error);
    return { success: false, error: error };
  }
}

function getStats() {
  let currentSessionTime = 0;
  let currentDomain = null;
  
  if (bg_activeTab && bg_sessionStartTime && bg_activeTab.url) {
    currentDomain = extractDomain(bg_activeTab.url);
    if (currentDomain && isTrackedDomain(currentDomain)) {
      currentSessionTime = Math.floor((Date.now() - bg_sessionStartTime) / 1000);
      
      if (currentDomain.startsWith('www.')) {
        currentDomain = currentDomain.substring(4);
      }
    }
  }
  
  const currentUsage = {};
  
  for (const domain in bg_dailyUsage) {
    if (Object.prototype.hasOwnProperty.call(bg_dailyUsage, domain)) {
      let normalizedDomain = domain.toLowerCase();
      if (normalizedDomain.startsWith('www.')) {
        normalizedDomain = normalizedDomain.substring(4);
      }
      
      if (!currentUsage[normalizedDomain]) {
        currentUsage[normalizedDomain] = 0;
      }
      currentUsage[normalizedDomain] += bg_dailyUsage[domain];
    }
  }
  
  if (currentDomain && currentSessionTime > 0) {
    if (!currentUsage[currentDomain]) {
      currentUsage[currentDomain] = 0;
    }
    currentUsage[currentDomain] += currentSessionTime;
  }
  
  let totalSeconds = 0;
  for (const key in currentUsage) {
    if (Object.prototype.hasOwnProperty.call(currentUsage, key)) {
      totalSeconds += currentUsage[key];
    }
  }
  
  const detailedStats = {
    domainBreakdown: {},
    categoryBreakdown: {}
  };
  
  for (const domain in currentUsage) {
    if (Object.prototype.hasOwnProperty.call(currentUsage, domain)) {
      detailedStats.domainBreakdown[domain] = currentUsage[domain] / 60;
      
      const category = categorizeDomain(domain);
      if (!detailedStats.categoryBreakdown[category]) {
        detailedStats.categoryBreakdown[category] = 0;
      }
      detailedStats.categoryBreakdown[category] += currentUsage[domain] / 60;
    }
  }
  
  detailedStats.totalSeconds = totalSeconds;
  detailedStats.totalMinutes = totalSeconds / 60;
  
  return {
    isTracking: bg_isTracking,
    dailyUsage: currentUsage,
    timeLimit: bg_timeLimit,
    totalSeconds: totalSeconds,
    totalMinutes: totalSeconds / 60,
    percentageUsed: Math.min((totalSeconds / 60 / bg_timeLimit) * 100, 100),
    currentSession: bg_activeTab && bg_sessionStartTime ? {
      domain: currentDomain,
      duration: currentSessionTime
    } : null,
    detailed: detailedStats
  };
}

function syncData() {
  try {
    chrome.storage.local.get(['currentUser', 'isOfflineMode', 'syncQueue', 'lastSyncAttempt'], function(result) {
      const isAuthenticated = !!result.currentUser;
      const isOfflineMode = !!result.isOfflineMode;
      const syncQueue = Array.isArray(result.syncQueue) ? result.syncQueue : [];
      const lastSyncAttempt = result.lastSyncAttempt || 0;
      const now = Date.now();
      
      const timeSinceLastSync = now - lastSyncAttempt;
      const minSyncInterval = Math.min(5 * 60 * 1000, Math.pow(2, failedSyncAttempts) * 1000);
      
      if (timeSinceLastSync < minSyncInterval && lastSyncAttempt > 0) {
        return;
      }
      
      chrome.storage.local.set({ lastSyncAttempt: now });
      
      if (!isAuthenticated && !isOfflineMode) {
        return;
      }
      
      if (syncQueue.length === 0) {
        failedSyncAttempts = 0;
        return;
      }
      
      if (isOfflineMode) {
        chrome.storage.local.set({ syncQueue: [] });
        failedSyncAttempts = 0;
        return;
      }
      
      const userId = result.currentUser.uid;
      const processedItems = [];
      const failedItems = [];
      
      const promises = syncQueue.map((session, index) => {
        return new Promise((resolve) => {
          try {
            if (!session || !session.domain || !session.timestamp || !session.endTime) {
              failedItems.push(index);
              resolve();
              return;
            }
            
            let duration = session.duration;
            if (session.durationMs) {
              duration = Math.floor(session.durationMs / 1000);
            }
            
            // Fixed to use correct column names that match the dashboard expectations
            const timeEntry = {
              user_id: userId,
              domain: session.domain,
              category: session.category || 'uncategorized',
              duration: duration,
              day: new Date(session.timestamp).toISOString().split('T')[0],
              start_time: new Date(session.timestamp).toISOString(),
              end_time: new Date(session.endTime).toISOString(),
              created_at: new Date().toISOString()
            };
            
            if (self.supabaseModule && self.supabaseModule.saveTimeEntry) {
              self.supabaseModule.saveTimeEntry(userId, timeEntry)
                .then(() => {
                  processedItems.push(index);
                  resolve();
                })
                .catch((error) => {
                  console.error('Error saving time entry to Supabase:', error);
                  failedItems.push(index);
                  resolve();
                });
            } else {
              failedItems.push(index);
