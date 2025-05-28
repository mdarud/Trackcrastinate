/**
 * Trackcrastinate - Notification Manager
 * 
 * This module handles all notification-related functionality, including:
 * - Graduated warnings at different thresholds
 * - Browser notifications
 * - In-page banners
 * - Popup alerts
 * - Sound alerts
 * - Snooze functionality
 */

// Create notification manager object in global scope
self.notificationManager = {};

// Constants
const NOTIFICATION_MESSAGES = {
  50: {
    title: "Halfway There",
    message: "You've used 50% of your daily time limit. Consider planning your remaining time wisely.",
    severity: "info"
  },
  75: {
    title: "Time Check",
    message: "You've used 75% of your daily time limit. Time to start wrapping things up.",
    severity: "warning"
  },
  90: {
    title: "Almost at Limit",
    message: "You've used 90% of your daily time limit. Only a few minutes remaining.",
    severity: "warning"
  },
  95: {
    title: "Final Warning",
    message: "You've used 95% of your daily time limit. Prepare for refinement activities.",
    severity: "danger"
  },
  100: {
    title: "Time Limit Reached",
    message: "You've reached your daily time limit. Time for a productive activity.",
    severity: "danger"
  }
};

// State
let notificationState = {
  lastNotificationTime: 0,
  lastNotificationThreshold: 0,
  snoozedUntil: 0,
  notifiedThresholds: new Set(),
  soundContext: null,
  soundBuffer: null
};

/**
 * Initialize the notification manager
 * @returns {Promise<Object>} Result of the initialization
 */
async function initialize() {
  console.log('Notification manager initializing...');
  
  try {
    // Reset notification state
    resetNotificationState();
    
    // Initialize audio context if browser supports it
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      notificationState.soundContext = new AudioContextClass();
      
      // Load notification sound
      await loadNotificationSound();
    }
    
    console.log('Notification manager initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing notification manager:', error);
    return { success: false, error };
  }
}

/**
 * Reset notification state
 */
function resetNotificationState() {
  notificationState = {
    lastNotificationTime: 0,
    lastNotificationThreshold: 0,
    snoozedUntil: 0,
    notifiedThresholds: new Set(),
    soundContext: notificationState.soundContext,
    soundBuffer: notificationState.soundBuffer
  };
}

/**
 * Load notification sound
 * @returns {Promise<void>}
 */
async function loadNotificationSound() {
  try {
    if (!notificationState.soundContext) return;
    
    // Create a simple beep sound
    const sampleRate = notificationState.soundContext.sampleRate;
    const buffer = notificationState.soundContext.createBuffer(1, sampleRate * 0.5, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate a simple beep tone
    for (let i = 0; i < buffer.length; i++) {
      // Simple sine wave at 440Hz
      data[i] = Math.sin(440 * Math.PI * 2 * i / sampleRate) * 
                // Fade in and out to avoid clicks
                Math.min(1, 10 * i / sampleRate) * 
                Math.min(1, 10 * (buffer.length - i) / sampleRate);
    }
    
    notificationState.soundBuffer = buffer;
    console.log('Notification sound loaded');
  } catch (error) {
    console.error('Error loading notification sound:', error);
  }
}

/**
 * Play notification sound
 * @param {number} volume - Volume level (0-100)
 */
function playNotificationSound(volume = 50) {
  try {
    if (!notificationState.soundContext || !notificationState.soundBuffer) return;
    
    // Create sound source
    const source = notificationState.soundContext.createBufferSource();
    source.buffer = notificationState.soundBuffer;
    
    // Create gain node for volume control
    const gainNode = notificationState.soundContext.createGain();
    gainNode.gain.value = volume / 100;
    
    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(notificationState.soundContext.destination);
    
    // Play sound
    source.start();
    console.log('Notification sound played at volume', volume);
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}

/**
 * Check if notification should be shown based on settings and state
 * @param {Object} settings - User settings
 * @param {Object} timeInfo - Time limit information
 * @returns {Object|null} Notification info or null if no notification should be shown
 */
function checkNotificationThresholds(settings, timeInfo) {
  try {
    // If notifications are disabled, return null
    if (!settings.showNotifications) {
      return null;
    }
    
    // If snoozed, check if snooze period has ended
    const now = Date.now();
    if (notificationState.snoozedUntil > now) {
      console.log('Notifications snoozed until', new Date(notificationState.snoozedUntil));
      return null;
    }
    
    // Get percentage used
    const percentageUsed = timeInfo.percentageUsed;
    
    // Check if we've reached any notification thresholds
    const thresholds = settings.notificationThresholds.concat([100]); // Always include 100%
    
    // Find the highest threshold that has been reached but not yet notified
    let highestReachedThreshold = null;
    
    for (const threshold of thresholds) {
      if (percentageUsed >= threshold && !notificationState.notifiedThresholds.has(threshold)) {
        highestReachedThreshold = threshold;
      }
    }
    
    // If no new threshold reached, check frequency for repeated notifications
    if (highestReachedThreshold === null) {
      // Check if we should send a repeat notification based on frequency
      const timeSinceLastNotification = now - notificationState.lastNotificationTime;
      let repeatInterval;
      
      switch (settings.notificationFrequency) {
        case 'low':
          repeatInterval = 15 * 60 * 1000; // 15 minutes
          break;
        case 'high':
          repeatInterval = 2 * 60 * 1000; // 2 minutes
          break;
        case 'medium':
        default:
          repeatInterval = 5 * 60 * 1000; // 5 minutes
          break;
      }
      
      // If it's time for a repeat notification and we're over the warning threshold
      if (timeSinceLastNotification >= repeatInterval && 
          percentageUsed >= settings.warningThreshold) {
        // Use the last notified threshold or the warning threshold
        const repeatThreshold = notificationState.lastNotificationThreshold || 
                               Math.floor(percentageUsed / 10) * 10; // Round to nearest 10%
        
        return {
          threshold: repeatThreshold,
          percentageUsed: percentageUsed,
          timeInfo: timeInfo,
          isRepeat: true
        };
      }
      
      return null;
    }
    
    // Mark this threshold as notified
    notificationState.notifiedThresholds.add(highestReachedThreshold);
    notificationState.lastNotificationThreshold = highestReachedThreshold;
    notificationState.lastNotificationTime = now;
    
    return {
      threshold: highestReachedThreshold,
      percentageUsed: percentageUsed,
      timeInfo: timeInfo,
      isRepeat: false
    };
  } catch (error) {
    console.error('Error checking notification thresholds:', error);
    return null;
  }
}

/**
 * Show notification based on threshold and settings
 * @param {Object} notificationInfo - Notification information
 * @param {Object} settings - User settings
 * @returns {Promise<Object>} Result of the operation
 */
async function showNotification(notificationInfo, settings) {
  try {
    if (!notificationInfo) return { success: false, reason: 'No notification info' };
    
    const { threshold, percentageUsed, timeInfo, isRepeat } = notificationInfo;
    
    // Get notification content
    const notificationContent = NOTIFICATION_MESSAGES[threshold] || {
      title: `Time Check: ${threshold}%`,
      message: `You've used ${Math.round(percentageUsed)}% of your daily time limit.`,
      severity: percentageUsed >= 90 ? "danger" : percentageUsed >= 75 ? "warning" : "info"
    };
    
    // Track which notification types were shown
    const shownTypes = [];
    
    // Show browser notification if enabled
    if (settings.notificationTypes.browser) {
      await showBrowserNotification(notificationContent, timeInfo);
      shownTypes.push('browser');
    }
    
    // Send message to content script for in-page banner if enabled
    if (settings.notificationTypes.inPage) {
      await sendInPageNotification(notificationContent, timeInfo);
      shownTypes.push('inPage');
    }
    
    // Send message to popup for alert if enabled
    if (settings.notificationTypes.popupAlerts) {
      await sendPopupNotification(notificationContent, timeInfo);
      shownTypes.push('popup');
    }
    
    // Play sound if enabled
    if (settings.soundAlerts && !isRepeat) {
      playNotificationSound(settings.soundVolume);
      shownTypes.push('sound');
    }
    
    console.log(`Showed ${threshold}% notification (${shownTypes.join(', ')})`);
    
    return { 
      success: true, 
      threshold, 
      shownTypes,
      isRepeat
    };
  } catch (error) {
    console.error('Error showing notification:', error);
    return { success: false, error };
  }
}

/**
 * Show browser notification
 * @param {Object} content - Notification content
 * @param {Object} timeInfo - Time limit information
 * @returns {Promise<boolean>} Whether notification was shown
 */
async function showBrowserNotification(content, timeInfo) {
  return new Promise((resolve) => {
    try {
      // Check if browser notifications are supported
      if (!("Notification" in window)) {
        console.log("Browser notifications not supported");
        resolve(false);
        return;
      }
      
      // Check permission
      if (Notification.permission === "granted") {
        // Create and show notification
        const notification = new Notification(content.title, {
          body: content.message,
          icon: '/icons/icon.svg'
        });
        
        // Add click handler
        notification.onclick = function() {
          // Open options page
          chrome.runtime.openOptionsPage();
          notification.close();
        };
        
        resolve(true);
      } else if (Notification.permission !== "denied") {
        // Request permission
        Notification.requestPermission().then(function (permission) {
          if (permission === "granted") {
            showBrowserNotification(content, timeInfo).then(resolve);
          } else {
            resolve(false);
          }
        });
      } else {
        console.log("Browser notification permission denied");
        resolve(false);
      }
    } catch (error) {
      console.error('Error showing browser notification:', error);
      resolve(false);
    }
  });
}

/**
 * Send notification to content script for in-page banner
 * @param {Object} content - Notification content
 * @param {Object} timeInfo - Time limit information
 * @returns {Promise<boolean>} Whether notification was sent
 */
async function sendInPageNotification(content, timeInfo) {
  return new Promise((resolve) => {
    try {
      // Get active tab
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs.length === 0) {
          resolve(false);
          return;
        }
        
        const activeTab = tabs[0];
        
        // Send message to content script
        chrome.tabs.sendMessage(activeTab.id, {
          type: 'SHOW_NOTIFICATION',
          data: {
            title: content.title,
            message: content.message,
            severity: content.severity,
            percentageUsed: timeInfo.percentageUsed,
            timeLimit: timeInfo.timeLimit,
            currentTime: timeInfo.currentTime,
            remainingMinutes: timeInfo.remainingMinutes
          }
        }, function(response) {
          resolve(response && response.success);
        });
      });
    } catch (error) {
      console.error('Error sending in-page notification:', error);
      resolve(false);
    }
  });
}

/**
 * Send notification to popup
 * @param {Object} content - Notification content
 * @param {Object} timeInfo - Time limit information
 * @returns {Promise<boolean>} Whether notification was sent
 */
async function sendPopupNotification(content, timeInfo) {
  return new Promise((resolve) => {
    try {
      // Store notification in local storage for popup to read
      chrome.storage.local.set({
        popupNotification: {
          title: content.title,
          message: content.message,
          severity: content.severity,
          timestamp: Date.now(),
          timeInfo: timeInfo
        }
      }, function() {
        resolve(true);
      });
    } catch (error) {
      console.error('Error sending popup notification:', error);
      resolve(false);
    }
  });
}

/**
 * Snooze notifications for a specified duration
 * @param {number} minutes - Duration in minutes
 * @returns {Object} Result of the operation
 */
function snoozeNotifications(minutes = 5) {
  try {
    // Validate input
    const snoozeMinutes = Math.min(Math.max(minutes, 1), 60); // Between 1 and 60 minutes
    
    // Calculate snooze end time
    const snoozeEndTime = Date.now() + (snoozeMinutes * 60 * 1000);
    
    // Update state
    notificationState.snoozedUntil = snoozeEndTime;
    
    console.log(`Notifications snoozed for ${snoozeMinutes} minutes until ${new Date(snoozeEndTime)}`);
    
    return { 
      success: true, 
      snoozedUntil: snoozeEndTime,
      snoozedForMinutes: snoozeMinutes
    };
  } catch (error) {
    console.error('Error snoozing notifications:', error);
    return { success: false, error };
  }
}

/**
 * Cancel notification snooze
 * @returns {Object} Result of the operation
 */
function cancelSnooze() {
  try {
    const wasSnoozing = notificationState.snoozedUntil > Date.now();
    
    // Reset snooze time
    notificationState.snoozedUntil = 0;
    
    console.log('Notification snooze cancelled');
    
    return { 
      success: true, 
      wasSnoozing
    };
  } catch (error) {
    console.error('Error cancelling snooze:', error);
    return { success: false, error };
  }
}

/**
 * Check if notifications are currently snoozed
 * @returns {Object} Snooze status
 */
function getSnoozeStatus() {
  const now = Date.now();
  const snoozedUntil = notificationState.snoozedUntil;
  const isSnoozed = snoozedUntil > now;
  
  return {
    isSnoozed,
    snoozedUntil: isSnoozed ? snoozedUntil : null,
    remainingSeconds: isSnoozed ? Math.floor((snoozedUntil - now) / 1000) : 0
  };
}

/**
 * Process time limit check and show notifications if needed
 * @param {Object} timeInfo - Time limit information
 * @returns {Promise<Object>} Result of the operation
 */
async function processTimeLimitCheck(timeInfo) {
  try {
    // Get settings
    const storage = self.storage || chrome.storage;
    const settings = await storage.getSettings();
    
    // Check if we should show a notification
    const notificationInfo = checkNotificationThresholds(settings, timeInfo);
    
    if (notificationInfo) {
      // Show notification
      return await showNotification(notificationInfo, settings);
    }
    
    return { success: true, shown: false };
  } catch (error) {
    console.error('Error processing time limit check:', error);
    return { success: false, error };
  }
}

// Expose functions to the global notification manager object
self.notificationManager.initialize = initialize;
self.notificationManager.processTimeLimitCheck = processTimeLimitCheck;
self.notificationManager.snoozeNotifications = snoozeNotifications;
self.notificationManager.cancelSnooze = cancelSnooze;
self.notificationManager.getSnoozeStatus = getSnoozeStatus;
self.notificationManager.resetNotificationState = resetNotificationState;

// Log that the module is ready
console.log('Notification manager loaded and ready');
