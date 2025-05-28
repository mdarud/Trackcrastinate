/**
 * Trackcrastinate - Content Script: Limit Enforcer
 * 
 * This script is injected into web pages to enforce time limits on unproductive sites.
 * When a user reaches their daily time limit, it can display warnings or redirect to the
 * Chrome Dino game.
 */

(function() {
  // Constants
  var EXTENSION_ID = chrome.runtime.id;
  var ACTIVITY_PATHS = {
    'dino-game': 'chrome-extension://' + EXTENSION_ID + '/dino-game/dino-game.html',
    'task-reminder': 'chrome-extension://' + EXTENSION_ID + '/activities/task-reminder/task-reminder.html',
    'focus-links': 'chrome-extension://' + EXTENSION_ID + '/activities/focus-links/focus-links.html',
    'word-game': 'chrome-extension://' + EXTENSION_ID + '/activities/word-game/word-game.html',
    'math-challenge': 'chrome-extension://' + EXTENSION_ID + '/activities/math-challenge/math-challenge.html'
  };
  
  // State
  var isLimitEnforced = false;
  var warningShown = false;
  var lastPercentageUsed = 0;
  var limitStatus = 'ok';
  var notificationFrequency = 'medium'; // Default frequency
  var lastNotificationTime = 0;
  var currentSettings = {
    activityType: 'dino-game', // Default activity type
    mathDifficulty: 'medium'   // Default math difficulty
  };
  var roasts = [
    "Your productivity is inversely proportional to your time on this site.",
    "The Board is displeased with your deviation from optimal work patterns.",
    "Your quarterly metrics indicate excessive digital leisure activities.",
    "Department policy requires immediate cessation of non-work browsing.",
    "Your severance benefits may be at risk due to suboptimal time management.",
    "Lumon Industries reminds you that time is a non-renewable resource.",
    "Your outie would be disappointed in your current browsing choices.",
    "The data refinement quota remains unfulfilled while you browse here.",
    "This digital deviation has been logged in your permanent record.",
    "Your MDR colleagues are outperforming you while you procrastinate."
  ];
  
  console.log('%cTrackcrastinate: Limit Enforcer initialized on ' + window.location.href, 'color: red; font-size: 20px; font-weight: bold;');
  
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('Content script received message:', message.type);
    
    if (message.type === 'CHECK_TIME_LIMIT') {
      handleTimeLimitCheck(message.data);
      sendResponse({ success: true });
    } else if (message.type === 'UPDATE_SETTINGS') {
      updateSettings(message.data);
      sendResponse({ success: true });
    }
    
    return true; // Keep the message channel open for async responses
  });
  
  /**
   * Update settings from background script
   * @param {Object} settings - Settings object
   */
  function updateSettings(settings) {
    if (settings) {
      if (settings.notificationFrequency) {
        notificationFrequency = settings.notificationFrequency;
        console.log('Updated notification frequency to:', notificationFrequency);
      }
      
      if (settings.activityType) {
        currentSettings.activityType = settings.activityType;
        console.log('Updated activity type to:', currentSettings.activityType);
      }
      
      if (settings.mathDifficulty) {
        currentSettings.mathDifficulty = settings.mathDifficulty;
        console.log('Updated math difficulty to:', currentSettings.mathDifficulty);
      }
    }
  }
  
  /**
   * Handle time limit check message from background script
   * Improved with better validation and error handling
   * @param {Object} data - Time limit data
   */
  function handleTimeLimitCheck(data) {
    try {
      // Validate input data
      if (!data) {
        console.error('Invalid time limit data received:', data);
        return;
      }
      
      // Extract data with validation and defaults
      var currentTime = typeof data.currentTime === 'number' ? data.currentTime : 0;
      var timeLimit = typeof data.timeLimit === 'number' ? data.timeLimit : 60; // Default to 60 minutes
      var percentageUsed = typeof data.percentageUsed === 'number' ? data.percentageUsed : 0;
      var newLimitStatus = data.limitStatus || 'ok';
      
      console.log('Time limit check: ' + currentTime + '/' + timeLimit + ' minutes (' + percentageUsed.toFixed(1) + '%)');
      
      // Reset warning if usage has decreased (e.g., new day)
      if (percentageUsed < lastPercentageUsed) {
        console.log('Usage decreased, resetting warnings and overlays');
        warningShown = false;
        isLimitEnforced = false;
        
        // Remove any existing warnings or overlays
        removeWarning();
        removeOverlay();
      }
      
      // Update state
      lastPercentageUsed = percentageUsed;
      limitStatus = newLimitStatus;
      
      // Get current time for frequency checks
      var now = Date.now();
      var frequencyInterval = getFrequencyInterval();
      
      // Handle different limit statuses
      if (limitStatus === 'exceeded' && (!isLimitEnforced || (now - lastNotificationTime > frequencyInterval))) {
        console.log('Time limit exceeded, enforcing limit');
        enforceLimit(currentTime, timeLimit);
        isLimitEnforced = true;
        lastNotificationTime = now;
      } else if (limitStatus === 'warning' && (!warningShown || (now - lastNotificationTime > frequencyInterval)) && !isLimitEnforced) {
        console.log('Time limit warning, showing notification');
        showWarning(currentTime, timeLimit);
        warningShown = true;
        lastNotificationTime = now;
      } else {
        console.log('No action needed for current limit status:', limitStatus);
      }
    } catch (error) {
      console.error('Error handling time limit check:', error);
    }
  }
  
  /**
   * Get interval in milliseconds based on notification frequency setting
   * @returns {number} Interval in milliseconds
   */
  function getFrequencyInterval() {
    switch (notificationFrequency) {
      case 'low':
        return 15 * 60 * 1000; // 15 minutes
      case 'medium':
        return 5 * 60 * 1000;  // 5 minutes
      case 'high':
        return 2 * 60 * 1000;  // 2 minutes
      default:
        return 5 * 60 * 1000;  // Default to medium (5 minutes)
    }
  }
  
  /**
   * Notify the background script that the content script is loaded
   * Enhanced with robust error handling and exponential backoff retry mechanism
   */
  function notifyBackgroundScript(retryCount = 0) {
    try {
      console.log('Notifying background script that content script is loaded on:', window.location.href);
      
      // Add domain information to the message
      const domain = window.location.hostname;
      
      // Maximum number of retries
      const MAX_RETRIES = 5;
      
      // Calculate exponential backoff delay
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
      
      chrome.runtime.sendMessage({ 
        type: 'CONTENT_SCRIPT_LOADED',
        url: window.location.href,
        domain: domain,
        timestamp: Date.now(),
        retryCount: retryCount
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.warn('Could not notify background script:', chrome.runtime.lastError);
          
          // Check if we should retry
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            setTimeout(() => notifyBackgroundScript(retryCount + 1), delay);
          } else {
            console.error('Max retries reached, giving up on notifying background script');
          }
        } else if (response && response.success) {
          console.log('Background script acknowledged content script load:', response);
          
          // If the response includes time limit data, handle it immediately
          if (response.timeLimit) {
            handleTimeLimitCheck(response.timeLimit);
          }
          
          // Reset retry count on success for future notifications
          window.trackcrastinateRetryCount = 0;
        } else {
          console.warn('Background script responded but with unexpected data:', response);
          
          // Check if we should retry
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying with better data in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            setTimeout(() => notifyBackgroundScript(retryCount + 1), delay);
          } else {
            console.error('Max retries reached, giving up on notifying background script');
          }
        }
      });
    } catch (error) {
      console.error('Error notifying background script:', error);
      
      // Check if we should retry
      if (retryCount < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        console.log(`Retrying after error in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        setTimeout(() => notifyBackgroundScript(retryCount + 1), delay);
      } else {
        console.error('Max retries reached, giving up on notifying background script');
      }
    }
  }
  
  /**
   * Shows a warning notification when approaching the time limit
   * @param {number} currentTime - Current time spent in minutes
   * @param {number} timeLimit - Time limit in minutes
   */
  function showWarning(currentTime, timeLimit) {
    try {
      // Remove any existing warning
      removeWarning();
      
      // Get a random roast
      var roast = getRandomRoast();
      
      // Create a warning element
      var warningEl = document.createElement('div');
      warningEl.id = 'trackcrastinate-warning';
      warningEl.style.cssText = 
        'position: fixed;' +
        'top: 0;' +
        'left: 0;' +
        'width: 100vw;' +
        'height: 100vh;' +
        'background-color: rgba(26, 83, 92, 0.85);' +
        'backdrop-filter: blur(3px);' +
        'color: white;' +
        'z-index: 2147483647;' + // Maximum z-index value
        'font-family: "IBM Plex Sans", sans-serif;' +
        'display: flex;' +
        'align-items: center;' +
        'justify-content: center;' +
        'animation: trackcrastinate-fadeIn 0.5s ease-out;';
      
      // Create warning content container
      var contentContainer = document.createElement('div');
      contentContainer.style.cssText = 
        'background-color: #4A9D7C;' +
        'padding: 30px;' +
        'border-radius: 8px;' +
        'max-width: 500px;' +
        'text-align: center;' +
        'box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);';
      
      // Add warning content
      contentContainer.innerHTML = 
        '<div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(to right, #7DCFB6, #E63946, #7DCFB6);"></div>' +
        '<h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Department Notice</h3>' +
        '<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5;">' + roast + '</p>' +
        '<div style="width: 100%; height: 1px; background: linear-gradient(to right, transparent, white, transparent); margin: 24px 0;"></div>' +
        '<div style="display: flex; justify-content: space-between; font-size: 14px; font-family: \'IBM Plex Mono\', monospace; margin-bottom: 24px;">' +
          '<span>CURRENT: ' + formatTime(currentTime) + '</span>' +
          '<span>LIMIT: ' + formatTime(timeLimit) + '</span>' +
        '</div>' +
        '<button id="trackcrastinate-warning-continue" style="background-color: #1A535C; color: white; border: none; padding: 12px 24px; border-radius: 4px; font-size: 14px; cursor: pointer; font-family: \'IBM Plex Mono\', monospace; letter-spacing: 1px; transition: background-color 0.2s;">ACKNOWLEDGE</button>';
      
      // Add styles
      addStyles();
      
      // Add content to warning
      warningEl.appendChild(contentContainer);
      
      // Add to document
      document.body.appendChild(warningEl);
      
      console.log('Warning notification displayed');
      
      // Add continue button functionality
      document.getElementById('trackcrastinate-warning-continue').addEventListener('click', function() {
        warningEl.style.animation = 'trackcrastinate-fadeOut 0.3s ease-out forwards';
        setTimeout(function() {
          if (document.body.contains(warningEl)) {
            warningEl.remove();
          }
        }, 300);
      });
    } catch (error) {
      console.error('Error showing warning:', error);
    }
  }
  
  /**
   * Remove warning notification
   */
  function removeWarning() {
    var existingWarning = document.getElementById('trackcrastinate-warning');
    if (existingWarning) existingWarning.remove();
  }
  
  /**
   * Enforces the time limit by showing an overlay
   * @param {number} currentTime - Current time spent in minutes
   * @param {number} timeLimit - Time limit in minutes
   */
  function enforceLimit(currentTime, timeLimit) {
    try {
      console.log('%cTrackcrastinate: Enforcing limit!', 'color: red; font-size: 20px; font-weight: bold;');
      
      // Remove any existing overlay
      removeOverlay();
      
      // Get a random roast
      var roast = getRandomRoast();
      
      // Create an overlay to prevent interaction with the page
      var overlayEl = document.createElement('div');
      overlayEl.id = 'trackcrastinate-overlay';
      overlayEl.style.cssText = 
        'position: fixed;' +
        'top: 0;' +
        'left: 0;' +
        'width: 100vw;' +
        'height: 100vh;' +
        'background-color: rgba(26, 83, 92, 0.95);' +
        'backdrop-filter: blur(8px);' +
        'z-index: 2147483647;' + // Maximum z-index value
        'display: flex;' +
        'flex-direction: column;' +
        'align-items: center;' +
        'justify-content: center;' +
        'color: white;' +
        'font-family: "IBM Plex Sans", sans-serif;' +
        'animation: trackcrastinate-fadeIn 0.5s ease-out;';
      
      // Create content container
      var contentContainer = document.createElement('div');
      contentContainer.style.cssText = 
        'text-align: center;' +
        'max-width: 550px;' +
        'background-color: #1A535C;' +
        'padding: 40px;' +
        'border-radius: 8px;' +
        'box-shadow: 0 12px 36px rgba(0, 0, 0, 0.3);';
      
      // Add content
      contentContainer.innerHTML = 
        '<div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(to right, #7DCFB6, #E63946, #7DCFB6);"></div>' +
        '<h2 style="margin: 0 0 24px; font-size: 28px; font-weight: 600; letter-spacing: 1px;">Severance Protocol Activated</h2>' +
        '<p style="margin: 0 0 32px; font-size: 18px; line-height: 1.6;">' + roast + '</p>' +
        '<div style="width: 100%; height: 2px; background: linear-gradient(to right, transparent, white, transparent); margin: 32px 0;"></div>' +
        '<p style="margin: 0 0 32px; font-size: 16px; font-family: \'IBM Plex Mono\', monospace; letter-spacing: 1px;">PLEASE ENJOY EACH DEVIATION EQUALLY</p>' +
        '<button id="trackcrastinate-play-btn" style="background-color: #4A9D7C; color: white; border: none; padding: 16px 32px; border-radius: 4px; font-size: 18px; cursor: pointer; font-family: \'IBM Plex Mono\', monospace; letter-spacing: 1px; transition: background-color 0.2s; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);">PLAY TO CONTINUE</button>';
      
      // Add styles
      addStyles();
      
      // Add content to overlay
      overlayEl.appendChild(contentContainer);
      
      // Add to document
      document.body.appendChild(overlayEl);
      
      console.log('Limit enforcement overlay displayed');
      
  // Create iframe container for the activity with improved loading
  const activityContainer = document.createElement('div');
  activityContainer.id = 'trackcrastinate-activity-container';
  activityContainer.style.cssText = 
    'display: none;' +
    'width: 100%;' +
    'height: 400px;' +
    'margin-top: 20px;' +
    'border-radius: 8px;' +
    'overflow: hidden;' +
    'box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);' +
    'position: relative;';
  
  // Add loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'trackcrastinate-loading-indicator';
  loadingIndicator.style.cssText = 
    'position: absolute;' +
    'top: 0;' +
    'left: 0;' +
    'width: 100%;' +
    'height: 100%;' +
    'background-color: #1A535C;' +
    'display: flex;' +
    'flex-direction: column;' +
    'align-items: center;' +
    'justify-content: center;' +
    'color: white;' +
    'font-family: "IBM Plex Mono", monospace;' +
    'z-index: 1;';
  
  loadingIndicator.innerHTML = 
    '<div style="width: 50px; height: 50px; border: 5px solid #4A9D7C; border-top-color: transparent; border-radius: 50%; animation: trackcrastinate-spin 1s linear infinite;"></div>' +
    '<p style="margin-top: 20px;">LOADING ACTIVITY...</p>';
  
  // Add loading indicator to container
  activityContainer.appendChild(loadingIndicator);
  
  // Get the appropriate activity path with fallback
  const activityType = currentSettings.activityType || 'dino-game';
  let activityPath = ACTIVITY_PATHS[activityType];
  
  // Fallback to dino game if path is invalid
  if (!activityPath) {
    console.warn(`Invalid activity type: ${activityType}, falling back to dino-game`);
    activityPath = ACTIVITY_PATHS['dino-game'];
  }
  
  // Add query parameters for math challenge difficulty
  if (activityType === 'math-challenge') {
    activityPath += '?difficulty=' + (currentSettings.mathDifficulty || 'medium');
  }
  
  // Add iframe for the activity with load event handling
  const activityIframe = document.createElement('iframe');
  activityIframe.id = 'trackcrastinate-activity-iframe';
  activityIframe.style.cssText = 
    'width: 100%;' +
    'height: 100%;' +
    'border: none;' +
    'position: relative;' +
    'z-index: 0;';
  
  // Add load event listener to hide loading indicator
  activityIframe.addEventListener('load', function() {
    const loadingIndicator = document.getElementById('trackcrastinate-loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.animation = 'trackcrastinate-fadeOut 0.5s ease-out forwards';
      setTimeout(function() {
        if (loadingIndicator.parentNode) {
          loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
      }, 500);
    }
    
    console.log('Activity iframe loaded successfully:', activityType);
    
    // Notify background script that activity was loaded
    chrome.runtime.sendMessage({
      type: 'LIMIT_ENFORCED',
      action: 'activity_loaded',
      domain: window.location.hostname,
      activityType: activityType
    });
  });
  
  // Add error handling
  activityIframe.addEventListener('error', function() {
    console.error('Failed to load activity iframe:', activityType);
    
    // Update loading indicator to show error
    const loadingIndicator = document.getElementById('trackcrastinate-loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.innerHTML = 
        '<p style="color: #E63946;">ERROR LOADING ACTIVITY</p>' +
        '<p style="margin-top: 10px; font-size: 14px;">Falling back to text message</p>';
    }
    
    // Notify background script of failure
    chrome.runtime.sendMessage({
      type: 'LIMIT_ENFORCED',
      action: 'activity_load_failed',
      domain: window.location.hostname,
      activityType: activityType
    });
  });
  
  // Set iframe source
  activityIframe.src = activityPath;
  
  // Add iframe to container
  activityContainer.appendChild(activityIframe);
  
  // Add container to content
  contentContainer.appendChild(activityContainer);
  
  // Add spin animation to styles
  const styleEl = document.getElementById('trackcrastinate-styles');
  if (styleEl) {
    styleEl.textContent += 
      '@keyframes trackcrastinate-spin {' +
        'from { transform: rotate(0deg); }' +
        'to { transform: rotate(360deg); }' +
      '}';
  }
  
  // Get button text based on activity type
  let buttonText = 'PLAY TO CONTINUE';
  if (activityType === 'task-reminder') {
    buttonText = 'VIEW TASKS';
  } else if (activityType === 'focus-links') {
    buttonText = 'VIEW FOCUS LINKS';
  } else if (activityType === 'word-game') {
    buttonText = 'PLAY WORD GAME';
  } else if (activityType === 'math-challenge') {
    buttonText = 'SOLVE MATH CHALLENGE';
  }
  
  // Update button text
  document.getElementById('trackcrastinate-play-btn').textContent = buttonText;
  
  // Add button functionality
  document.getElementById('trackcrastinate-play-btn').addEventListener('click', function() {
    try {
      // Show the embedded activity instead of opening in a new tab
      const activityContainer = document.getElementById('trackcrastinate-activity-container');
      if (activityContainer) {
        activityContainer.style.display = 'block';
      }
      
      // Change button text
      this.textContent = 'CLOSE ACTIVITY';
      this.addEventListener('click', function() {
        // Hide the activity when clicked again
        if (activityContainer) {
          activityContainer.style.display = 'none';
        }
        
        // Remove the overlay
        if (document.body.contains(overlayEl)) {
          overlayEl.remove();
        }
      }, { once: true });
      
      // Notify the background script that the user has chosen to play/view the activity
      chrome.runtime.sendMessage({
        type: 'LIMIT_ENFORCED',
        action: 'ACTIVITY_STARTED',
        activityType: activityType,
        domain: window.location.hostname
      });
      
      console.log('User clicked button, showing embedded activity:', activityType);
    } catch (error) {
      console.error('Error handling activity button click:', error);
    }
  });
      
      // Notify the background script that the limit has been enforced
      chrome.runtime.sendMessage({
        type: 'LIMIT_ENFORCED',
        action: 'OVERLAY_SHOWN',
        domain: window.location.hostname
      });
    } catch (error) {
      console.error('Error enforcing limit:', error);
    }
  }
  
  /**
   * Remove overlay
   */
  function removeOverlay() {
    var existingOverlay = document.getElementById('trackcrastinate-overlay');
    if (existingOverlay) existingOverlay.remove();
  }
  
  /**
   * Add styles to the document
   */
  function addStyles() {
    if (!document.getElementById('trackcrastinate-styles')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'trackcrastinate-styles';
      styleEl.textContent = 
        '@keyframes trackcrastinate-slideIn {' +
          'from { transform: translateX(100%); opacity: 0; }' +
          'to { transform: translateX(0); opacity: 1; }' +
        '}' +
        
        '@keyframes trackcrastinate-fadeOut {' +
          'from { opacity: 1; }' +
          'to { opacity: 0; }' +
        '}' +
        
        '@keyframes trackcrastinate-fadeIn {' +
          'from { opacity: 0; }' +
          'to { opacity: 1; }' +
        '}' +
        
        '#trackcrastinate-warning button:hover, #trackcrastinate-overlay button:hover {' +
          'background-color: #3D8369 !important;' +
        '}';
      document.head.appendChild(styleEl);
    }
  }
  
  /**
   * Get a random roast message
   * @returns {string} Random roast message
   */
  function getRandomRoast() {
    return roasts[Math.floor(Math.random() * roasts.length)];
  }
  
  /**
   * Formats time in minutes to a readable string
   * @param {number} minutes - Time in minutes
   * @returns {string} Formatted time string
   */
  function formatTime(minutes) {
    var hours = Math.floor(minutes / 60);
    var mins = minutes % 60;
    
    if (hours > 0) {
      return hours + 'h ' + mins + 'm';
    } else {
      return mins + 'm';
    }
  }
  
  // Listen for messages from the activity iframe
  window.addEventListener('message', function(event) {
    try {
      // Check if the message is from our activity
      if (event.data && (event.data.type === 'DINO_GAME_COMPLETED' || event.data.type === 'ACTIVITY_COMPLETED')) {
        console.log('Received activity completion message from iframe:', event.data);
        
        // Remove the overlay
        removeOverlay();
        
        // Notify the background script
        chrome.runtime.sendMessage({
          type: 'LIMIT_ENFORCED',
          action: 'ACTIVITY_COMPLETED',
          activityType: currentSettings.activityType,
          score: event.data.score || 0,
          domain: window.location.hostname
        });
      }
    } catch (error) {
      console.error('Error handling iframe message:', error);
    }
  });
  
  // Initial notification to background script
  notifyBackgroundScript();
})();
