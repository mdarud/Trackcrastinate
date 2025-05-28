/**
 * Trackcrastinate - Popup Script
 * 
 * This script handles the popup UI functionality, including:
 * - Displaying current tracking statistics
 * - Handling user authentication
 * - Navigation to dashboard and settings
 * - Toggling tracking on/off
 */

// DOM Elements
var trackingToggle = document.getElementById('tracking-toggle');
var totalTimeDisplay = document.getElementById('total-time');
var timeDetailToggle = document.getElementById('time-detail-toggle');
var limitDisplay = document.getElementById('limit-display');
var limitProgress = document.getElementById('limit-progress');
var topSitesList = document.getElementById('top-sites-list');
var categoryList = document.getElementById('category-list');
var roastMessage = document.getElementById('roast-message');
var dashboardBtn = document.getElementById('dashboard-btn');
var optionsBtn = document.getElementById('options-btn');
var signOutBtn = document.getElementById('sign-out-btn');
var authSection = document.getElementById('auth-section');
var mainContent = document.getElementById('main-content');
var userInfoBar = document.getElementById('user-info-bar');
var userEmail = document.getElementById('user-email');
var syncStatus = document.getElementById('sync-status');
var resetTrackingBtn = document.getElementById('reset-tracking-btn');
var resetCount = document.getElementById('reset-count');

// Auth elements
var signInEmailBtn = document.getElementById('sign-in-email-btn');
var signInGoogleBtn = document.getElementById('sign-in-google-btn');
var emailAuthForm = document.getElementById('email-auth-form');
var emailInput = document.getElementById('email-input');
var passwordInput = document.getElementById('password-input');
var signInBtn = document.getElementById('sign-in-btn');
var createAccountBtn = document.getElementById('create-account-btn');
var forgotPasswordBtn = document.getElementById('forgot-password-btn');
var backToOptionsBtn = document.getElementById('back-to-options-btn');
var offlineModeToggle = document.getElementById('offline-mode-toggle');

// State
var isTracking = true;
var currentUser = null;
var isOfflineMode = false;
var dailyUsage = {};
var timeLimit = 60; // Default 60 minutes
var showDetailedTime = false; // For time detail toggle

// Last displayed time values to prevent UI flickering
var lastDisplayedValues = {
  totalTime: null,
  limitDisplay: null,
  updateTime: 0
};

// Debounce time in milliseconds
const DEBOUNCE_TIME = 5000; // 5 seconds (increased to further prevent flickering)

// Roast messages
var roastMessages = [
  "Your productivity is inversely proportional to your social media usage.",
  "Congratulations on your impressive YouTube research skills.",
  "Your browser history suggests a PhD in procrastination.",
  "The Board is concerned about your dedication to cat videos.",
  "Your refinement metrics indicate exceptional skill in avoiding actual work.",
  "Perhaps consider a career in professional social media scrolling?",
  "Your deviation patterns suggest you're avoiding something important.",
  "The algorithm has determined you're 87% more distracted than yesterday.",
  "Your productivity score is lower than the company's expectations.",
  "Have you considered actually working during work hours?",
  "Your refinement metrics indicate a preference for digital distraction."
];

// Initialize popup
function initializePopup() {
  // Check authentication status
  checkAuthStatus();
  
  // Load stats
  loadStats();
  
  // Set up event listeners
  setupEventListeners();
  
  // Set random roast message
  setRandomRoast();
  
  // Update reset count display
  updateResetCount();
  
  console.log('Popup initialized');
}

// Update reset count display
function updateResetCount() {
  chrome.storage.local.get(['resetCount'], function(result) {
    const count = result.resetCount || 0;
    resetCount.textContent = count + (count === 1 ? ' reset today' : ' resets today');
  });
}

// Check authentication status
function checkAuthStatus() {
  try {
    // Get auth status from storage
    chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' }, function(response) {
      if (response && response.success) {
        isOfflineMode = response.isOfflineMode;
        
        if (response.isAuthenticated) {
          currentUser = response.user;
          updateUIForAuthenticatedUser();
        } else if (isOfflineMode) {
          updateUIForOfflineMode();
        } else {
          updateUIForUnauthenticatedUser();
        }
      } else {
        // Default to offline mode if there's an error
        isOfflineMode = true;
        updateUIForOfflineMode();
      }
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    // Default to offline mode if there's an error
    isOfflineMode = true;
    updateUIForOfflineMode();
  }
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser() {
  authSection.style.display = 'none';
  mainContent.style.display = 'block';
  userInfoBar.style.display = 'flex';
  signOutBtn.style.display = 'block';
  
  if (currentUser && currentUser.email) {
    userEmail.textContent = currentUser.email;
  }
}

// Update UI for offline mode
function updateUIForOfflineMode() {
  authSection.style.display = 'none';
  mainContent.style.display = 'block';
  userInfoBar.style.display = 'none';
  signOutBtn.style.display = 'none';
}

// Update UI for unauthenticated user
function updateUIForUnauthenticatedUser() {
  authSection.style.display = 'block';
  mainContent.style.display = 'none';
  userInfoBar.style.display = 'none';
  signOutBtn.style.display = 'none';
  
  // Reset auth form
  emailAuthForm.style.display = 'none';
  emailInput.value = '';
  passwordInput.value = '';
}

// Load stats from background script with improved error handling
function loadStats() {
  chrome.runtime.sendMessage({ type: 'GET_STATS', detailed: true }, function(response) {
    if (response) {
      console.log('Received stats from background:', response);
      updateStats(response);
    } else {
      console.error('No response received from background script');
      // Try to get stats directly from tracking module if available
      tryGetStatsDirectly();
    }
  });
  
  // Set up a refresh interval to keep stats updated
  setInterval(function() {
    chrome.runtime.sendMessage({ type: 'GET_STATS', detailed: true }, function(response) {
      if (response) {
        updateStats(response);
      } else {
        // Try to get stats directly from tracking module if available
        tryGetStatsDirectly();
      }
    });
  }, 10000); // Update every 10 seconds (reduced frequency to prevent flickering)
}

// Try to get stats directly from tracking module
function tryGetStatsDirectly() {
  try {
    // Check if we can access the tracking module directly
    chrome.runtime.getBackgroundPage(function(backgroundPage) {
      if (backgroundPage && backgroundPage.trackingModule && backgroundPage.trackingModule.getStats) {
        console.log('Trying to get stats directly from tracking module');
        backgroundPage.trackingModule.getStats(true)
          .then(function(stats) {
            console.log('Got stats directly from tracking module:', stats);
            updateStats(stats);
          })
          .catch(function(error) {
            console.error('Error getting stats directly from tracking module:', error);
          });
      } else {
        console.error('Could not access tracking module directly');
      }
    });
  } catch (error) {
    console.error('Error trying to get stats directly:', error);
  }
}

// Stabilize time display to prevent flickering with improved handling
function getStableTimeDisplay(newValue, type) {
  const now = Date.now();
  
  // If this is the first update or it's been a while since the last update, use the new value
  if (lastDisplayedValues.updateTime === 0 || 
      now - lastDisplayedValues.updateTime > DEBOUNCE_TIME || 
      lastDisplayedValues[type] === null) {
    
    lastDisplayedValues[type] = newValue;
    lastDisplayedValues.updateTime = now;
    return newValue;
  }
  
  // If the new value is significantly different, update immediately
  if (type === 'totalTime' && newValue !== lastDisplayedValues[type]) {
    try {
      // Extract numeric part for comparison - handle different formats
      let oldNum = 0;
      let newNum = 0;
      
      // Parse old value - handle both "X.Xm" and "Xh Ym" formats
      if (lastDisplayedValues[type].includes('h')) {
        const parts = lastDisplayedValues[type].split('h');
        oldNum = parseFloat(parts[0].trim()) * 60; // Hours to minutes
        if (parts[1]) {
          oldNum += parseFloat(parts[1].replace('m', '').trim()); // Add minutes
        }
      } else {
        oldNum = parseFloat(lastDisplayedValues[type].replace('m', '').trim());
      }
      
      // Parse new value - handle both "X.Xm" and "Xh Ym" formats
      if (newValue.includes('h')) {
        const parts = newValue.split('h');
        newNum = parseFloat(parts[0].trim()) * 60; // Hours to minutes
        if (parts[1]) {
          newNum += parseFloat(parts[1].replace('m', '').trim()); // Add minutes
        }
      } else {
        newNum = parseFloat(newValue.replace('m', '').trim());
      }
      
      // If difference is more than 2 minutes or 5% of the current value, update
      const threshold = Math.max(2, oldNum * 0.05);
      if (Math.abs(newNum - oldNum) > threshold) {
        lastDisplayedValues[type] = newValue;
        lastDisplayedValues.updateTime = now;
        return newValue;
      }
    } catch (error) {
      console.error('Error parsing time values:', error);
      // On error, use the new value to be safe
      lastDisplayedValues[type] = newValue;
      lastDisplayedValues.updateTime = now;
      return newValue;
    }
  }
  
  // Otherwise, keep the old value to prevent flickering
  return lastDisplayedValues[type];
}

// Update stats in the UI with improved handling and debouncing
function updateStats(stats) {
  if (!stats) return;
  
  console.log('Updating UI with stats:', stats);
  
  // Update tracking toggle
  isTracking = stats.isTracking !== undefined ? stats.isTracking : isTracking;
  trackingToggle.checked = isTracking;
  
  // Update time limit
  timeLimit = stats.timeLimit || timeLimit;
  
  // Calculate total time - handle different formats from different sources
  var totalMinutes = 0;
  if (stats.totalMinutes !== undefined) {
    totalMinutes = stats.totalMinutes; // Use exact value without rounding
  } else if (stats.currentTime !== undefined) {
    totalMinutes = stats.currentTime; // Use exact value without rounding
  } else if (stats.detailed && stats.detailed.totalSeconds !== undefined) {
    totalMinutes = stats.detailed.totalSeconds / 60; // Convert to minutes without rounding
  } else if (stats.totalSeconds !== undefined) {
    totalMinutes = stats.totalSeconds / 60; // Convert to minutes without rounding
  }
  
  // Format time with consistent rounding
  var formattedTime = formatTime(totalMinutes, showDetailedTime);
  
  // Stabilize the display to prevent flickering
  var stableFormattedTime = getStableTimeDisplay(formattedTime, 'totalTime');
  
  // Update total time display
  totalTimeDisplay.textContent = stableFormattedTime;
  
  // Check if this is a site-specific limit
  var hasSiteSpecificLimit = stats.hasSiteSpecificLimit || false;
  
  // Format limit display with precision
  var limitText;
  if (hasSiteSpecificLimit) {
    limitText = totalMinutes.toFixed(1) + '/' + stats.timeLimit + ' min (site limit)';
  } else {
    limitText = totalMinutes.toFixed(1) + '/' + timeLimit + ' min';
  }
  
  // Stabilize limit display
  var stableLimitText = getStableTimeDisplay(limitText, 'limitDisplay');
  
  // Update limit display
  limitDisplay.textContent = stableLimitText;
  
  // Add tooltip to show global limit if there's a site-specific limit
  if (hasSiteSpecificLimit && stats.globalTimeLimit) {
    limitDisplay.title = `Global limit: ${stats.globalTimeLimit} min`;
  } else {
    limitDisplay.title = '';
  }
  
  // Update progress bar
  var percentageUsed = stats.percentageUsed || 0;
  limitProgress.style.width = percentageUsed + '%';
  
  // Set progress bar color based on percentage
  if (percentageUsed >= 80) {
    limitProgress.style.backgroundColor = '#E63946'; // Red
  } else if (percentageUsed >= 50) {
    limitProgress.style.backgroundColor = '#F4A261'; // Orange
  } else {
    limitProgress.style.backgroundColor = '#4A9D7C'; // Green
  }
  
  // Update top sites list - handle different formats
  if (stats.dailyUsage) {
    // Check if dailyUsage contains time in seconds (from background.js) or milliseconds (from tracking.js)
    // If the values are very large, they're likely in milliseconds and need conversion
    const isMilliseconds = Object.values(stats.dailyUsage).some(time => time > 10000);
    
    if (isMilliseconds) {
      // Convert milliseconds to seconds
      const secondsUsage = {};
      Object.entries(stats.dailyUsage).forEach(([domain, time]) => {
        secondsUsage[domain] = Math.floor(time / 1000);
      });
      updateTopSites(secondsUsage);
      updateCategoryBreakdown(secondsUsage);
    } else {
      // Already in seconds
      updateTopSites(stats.dailyUsage);
      updateCategoryBreakdown(stats.dailyUsage);
    }
  } else if (stats.detailed && stats.detailed.domainBreakdown) {
    // Convert minutes to seconds for consistency with the existing functions
    var dailyUsage = {};
    Object.entries(stats.detailed.domainBreakdown).forEach(([domain, minutes]) => {
      dailyUsage[domain] = minutes * 60;
    });
    updateTopSites(dailyUsage);
    
    if (stats.detailed.categoryBreakdown) {
      var categoryUsage = {};
      Object.entries(stats.detailed.categoryBreakdown).forEach(([category, minutes]) => {
        categoryUsage[category] = minutes * 60;
      });
      updateCategoryBreakdown(categoryUsage, true);
    } else {
      updateCategoryBreakdown(dailyUsage);
    }
  }
}

// Update top sites list with improved domain handling
function updateTopSites(usage) {
  // Clear current list
  topSitesList.innerHTML = '';
  
  // Normalize and aggregate domains (combine www.domain.com with domain.com)
  var normalizedUsage = {};
  for (var domain in usage) {
    if (Object.prototype.hasOwnProperty.call(usage, domain)) {
      // Skip metadata keys that aren't actual domains
      if (domain === 'dailyUsage' || domain === 'usageDate' || domain === 'lastSaved' || domain === 'version') {
        console.log('Skipping metadata key:', domain);
        continue;
      }
      
      // Skip if domain doesn't look like a valid domain (must contain a dot)
      if (!domain.includes('.')) {
        console.log('Skipping invalid domain:', domain);
        continue;
      }
      
      // Normalize domain (remove www. prefix if present)
      var normalizedDomain = domain.toLowerCase();
      if (normalizedDomain.startsWith('www.')) {
        normalizedDomain = normalizedDomain.substring(4);
      }
      
      // Add to normalized usage
      if (!normalizedUsage[normalizedDomain]) {
        normalizedUsage[normalizedDomain] = 0;
      }
      normalizedUsage[normalizedDomain] += usage[domain];
    }
  }
  
  // Sort domains by time spent
  var sortedDomains = [];
  for (var domain in normalizedUsage) {
    if (Object.prototype.hasOwnProperty.call(normalizedUsage, domain)) {
      sortedDomains.push([domain, normalizedUsage[domain]]);
    }
  }
  
  sortedDomains.sort(function(a, b) {
    return b[1] - a[1];
  });
  
  // Take top 5
  sortedDomains = sortedDomains.slice(0, 5);
  
  if (sortedDomains.length === 0) {
    var li = document.createElement('li');
    li.className = 'placeholder';
    li.textContent = 'No data refinement yet';
    topSitesList.appendChild(li);
    return;
  }
  
  // Add each domain to the list
  for (var i = 0; i < sortedDomains.length; i++) {
    var domain = sortedDomains[i][0];
    var seconds = sortedDomains[i][1];
    
    var li = document.createElement('li');
    
    var domainSpan = document.createElement('span');
    domainSpan.className = 'domain';
    domainSpan.textContent = domain;
    
    var timeSpan = document.createElement('span');
    timeSpan.className = 'time mono-display';
    timeSpan.textContent = formatTime(seconds / 60, showDetailedTime); // Use exact value without rounding
    
    li.appendChild(domainSpan);
    li.appendChild(timeSpan);
    
    topSitesList.appendChild(li);
  }
}

// Update category breakdown with improved handling
function updateCategoryBreakdown(usage, isPreCategorized = false) {
  // Clear current list
  categoryList.innerHTML = '';
  
  // Create a simple category breakdown
  var categories = {
    social: 0,
    entertainment: 0,
    shopping: 0,
    news: 0,
    sports: 0,
    other: 0
  };
  
  if (isPreCategorized) {
    // If the data is already categorized, just use it directly
    categories = usage;
  } else {
// Categorize domains with improved matching
    for (var domain in usage) {
      if (Object.prototype.hasOwnProperty.call(usage, domain)) {
        // Skip metadata keys that aren't actual domains
        if (domain === 'dailyUsage' || domain === 'usageDate' || domain === 'lastSaved' || domain === 'version') {
          console.log('Skipping metadata key in category breakdown:', domain);
          continue;
        }
        
        // Skip if domain doesn't look like a valid domain (must contain a dot)
        if (!domain.includes('.')) {
          console.log('Skipping invalid domain in category breakdown:', domain);
          continue;
        }
        
        var seconds = usage[domain];
        var normalizedDomain = domain.toLowerCase();
        
        // Social media sites
        if (normalizedDomain === 'facebook.com' || normalizedDomain.endsWith('.facebook.com') ||
            normalizedDomain === 'twitter.com' || normalizedDomain.endsWith('.twitter.com') ||
            normalizedDomain === 'instagram.com' || normalizedDomain.endsWith('.instagram.com') ||
            normalizedDomain === 'reddit.com' || normalizedDomain.endsWith('.reddit.com') ||
            normalizedDomain === 'tiktok.com' || normalizedDomain.endsWith('.tiktok.com') ||
            normalizedDomain === 'linkedin.com' || normalizedDomain.endsWith('.linkedin.com') ||
            normalizedDomain === 'pinterest.com' || normalizedDomain.endsWith('.pinterest.com') ||
            normalizedDomain === 'snapchat.com' || normalizedDomain.endsWith('.snapchat.com')) {
          categories.social += seconds;
        } 
        // Entertainment sites
        else if (normalizedDomain === 'youtube.com' || normalizedDomain.endsWith('.youtube.com') ||
                normalizedDomain === 'netflix.com' || normalizedDomain.endsWith('.netflix.com') ||
                normalizedDomain === 'hulu.com' || normalizedDomain.endsWith('.hulu.com') ||
                normalizedDomain === 'disneyplus.com' || normalizedDomain.endsWith('.disneyplus.com') ||
                normalizedDomain === 'twitch.tv' || normalizedDomain.endsWith('.twitch.tv') ||
                normalizedDomain === 'vimeo.com' || normalizedDomain.endsWith('.vimeo.com') ||
                normalizedDomain === 'spotify.com' || normalizedDomain.endsWith('.spotify.com') ||
                normalizedDomain === 'pandora.com' || normalizedDomain.endsWith('.pandora.com')) {
          categories.entertainment += seconds;
        } 
        // Shopping sites
        else if (normalizedDomain === 'amazon.com' || normalizedDomain.endsWith('.amazon.com') ||
                normalizedDomain === 'ebay.com' || normalizedDomain.endsWith('.ebay.com') ||
                normalizedDomain === 'etsy.com' || normalizedDomain.endsWith('.etsy.com') ||
                normalizedDomain === 'walmart.com' || normalizedDomain.endsWith('.walmart.com') ||
                normalizedDomain === 'target.com' || normalizedDomain.endsWith('.target.com') ||
                normalizedDomain === 'bestbuy.com' || normalizedDomain.endsWith('.bestbuy.com')) {
          categories.shopping += seconds;
        } 
        // News sites
        else if (normalizedDomain === 'cnn.com' || normalizedDomain.endsWith('.cnn.com') ||
                normalizedDomain === 'bbc.com' || normalizedDomain.endsWith('.bbc.com') ||
                normalizedDomain === 'nytimes.com' || normalizedDomain.endsWith('.nytimes.com') ||
                normalizedDomain === 'washingtonpost.com' || normalizedDomain.endsWith('.washingtonpost.com') ||
                normalizedDomain === 'foxnews.com' || normalizedDomain.endsWith('.foxnews.com') ||
                normalizedDomain.includes('news')) {
          categories.news += seconds;
        } 
        // Sports sites
        else if (normalizedDomain === 'espn.com' || normalizedDomain.endsWith('.espn.com') ||
                normalizedDomain === 'nba.com' || normalizedDomain.endsWith('.nba.com') ||
                normalizedDomain === 'nfl.com' || normalizedDomain.endsWith('.nfl.com') ||
                normalizedDomain === 'mlb.com' || normalizedDomain.endsWith('.mlb.com') ||
                normalizedDomain === 'nhl.com' || normalizedDomain.endsWith('.nhl.com') ||
                normalizedDomain.includes('sports')) {
          categories.sports += seconds;
        } 
        // Other sites
        else {
          categories.other += seconds;
        }
      }
    }
  }
  
  // Check if we have any data
  var totalSeconds = 0;
  for (var category in categories) {
    if (Object.prototype.hasOwnProperty.call(categories, category)) {
      totalSeconds += categories[category];
    }
  }
  
  if (totalSeconds === 0) {
    var li = document.createElement('li');
    li.className = 'placeholder';
    li.textContent = 'No categories to analyze';
    categoryList.appendChild(li);
    return;
  }
  
  // Convert to array for sorting
  var categoryArray = [];
  for (var category in categories) {
    if (Object.prototype.hasOwnProperty.call(categories, category)) {
      var seconds = categories[category];
      if (seconds > 0) {
        categoryArray.push([category, seconds]);
      }
    }
  }
  
  // Sort by time spent
  categoryArray.sort(function(a, b) {
    return b[1] - a[1];
  });
  
  // Add each category to the list
  for (var i = 0; i < categoryArray.length; i++) {
    var category = categoryArray[i][0];
    var seconds = categoryArray[i][1];
    
    var li = document.createElement('li');
    
    var categorySpan = document.createElement('span');
    categorySpan.className = 'category';
    categorySpan.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    
    var timeSpan = document.createElement('span');
    timeSpan.className = 'time mono-display';
    timeSpan.textContent = formatTime(seconds / 60, showDetailedTime); // Use exact value without rounding
    
    li.appendChild(categorySpan);
    li.appendChild(timeSpan);
    
    categoryList.appendChild(li);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Tracking toggle
  trackingToggle.addEventListener('change', function() {
    isTracking = trackingToggle.checked;
    chrome.runtime.sendMessage({ 
      type: 'SET_TRACKING', 
      isTracking: isTracking 
    }, function(response) {
      if (response && response.success) {
        console.log('Tracking status updated:', isTracking);
      } else {
        console.error('Failed to update tracking status');
        // Revert toggle if update failed
        trackingToggle.checked = !isTracking;
        isTracking = !isTracking;
      }
    });
  });
  
  // Time detail toggle
  if (timeDetailToggle) {
    timeDetailToggle.addEventListener('click', function() {
      showDetailedTime = !showDetailedTime;
      
      // Update button text
      timeDetailToggle.textContent = showDetailedTime ? "Standard" : "Details";
      
      // Update time display
      chrome.runtime.sendMessage({ type: 'GET_STATS' }, function(response) {
        if (response) {
          updateStats(response);
        }
      });
      
      console.log('Time detail mode:', showDetailedTime ? 'detailed' : 'standard');
    });
  }
  
  // Dashboard button
  dashboardBtn.addEventListener('click', async function() {
    try {
      // Get settings to retrieve dashboard URL
      const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      const dashboardUrl = settings && settings.dashboardUrl 
        ? settings.dashboardUrl 
        : 'http://localhost:3000';
      
      // Check authentication status
      const authStatus = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' });
      
      // If user is not authenticated and not in offline mode, redirect to auth page
      if (authStatus && !authStatus.isAuthenticated && !authStatus.isOfflineMode) {
        // Redirect to auth page with return URL parameter
        chrome.tabs.create({ url: `${dashboardUrl}/auth?returnUrl=/` });
      } else {
        // Open dashboard in a new tab
        chrome.tabs.create({ url: dashboardUrl });
      }
    } catch (error) {
      console.error('Error opening dashboard:', error);
      // Fallback to local dashboard if there's an error
      chrome.tabs.create({ url: chrome.runtime.getURL('/dashboard/index.html') });
    }
  });
  
  // Options button
  optionsBtn.addEventListener('click', function() {
    // Open options page
    chrome.runtime.openOptionsPage();
  });
  
  // Sign out button
  signOutBtn.addEventListener('click', function() {
    try {
      chrome.runtime.sendMessage({ type: 'SIGN_OUT' }, function(response) {
        if (response && response.success) {
          currentUser = null;
          updateUIForUnauthenticatedUser();
        } else {
          console.error('Error signing out:', response && response.error);
        }
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  });
  
  // Auth section buttons
  signInEmailBtn.addEventListener('click', function() {
    emailAuthForm.style.display = 'block';
  });
  
  backToOptionsBtn.addEventListener('click', function() {
    emailAuthForm.style.display = 'none';
  });
  
  signInBtn.addEventListener('click', function() {
    var email = emailInput.value;
    var password = passwordInput.value;
    
    if (email && password) {
      chrome.runtime.sendMessage({
        type: 'SIGN_IN',
        email: email,
        password: password
      }, function(response) {
        if (response && response.success) {
          currentUser = response.user;
          updateUIForAuthenticatedUser();
        } else {
          console.error('Error signing in:', response && response.error);
          alert('Sign in failed. Please try again.');
        }
      });
    }
  });
  
  createAccountBtn.addEventListener('click', function() {
    var email = emailInput.value;
    var password = passwordInput.value;
    
    if (email && password) {
      chrome.runtime.sendMessage({
        type: 'CREATE_ACCOUNT',
        email: email,
        password: password
      }, function(response) {
        if (response && response.success) {
          currentUser = response.user;
          updateUIForAuthenticatedUser();
        } else {
          console.error('Error creating account:', response && response.error);
          alert('Account creation failed. Please try again.');
        }
      });
    }
  });
  
  signInGoogleBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({
      type: 'SIGN_IN_WITH_GOOGLE'
    }, function(response) {
      if (response && response.success) {
        currentUser = response.user;
        updateUIForAuthenticatedUser();
      } else {
        console.error('Error signing in with Google:', response && response.error);
        alert('Google sign in failed. Please try again.');
      }
    });
  });
  
  // Forgot password button
  forgotPasswordBtn.addEventListener('click', function() {
    var email = emailInput.value;
    
    if (!email) {
      alert('Please enter your email address to reset your password.');
      return;
    }
    
    // Import the password reset module
    import('../password-reset.js').then(function() {
      // Use the password reset module to initiate password reset
      window.passwordResetModule.initiatePasswordReset(email)
        .then(function(result) {
          if (result.success) {
            alert('Password reset instructions have been sent to your email.');
            emailAuthForm.style.display = 'none';
          } else {
            alert('Failed to send password reset email: ' + (result.error || 'Unknown error'));
          }
        })
        .catch(function(error) {
          console.error('Error initiating password reset:', error);
          alert('An error occurred while trying to reset your password. Please try again.');
        });
    }).catch(function(error) {
      console.error('Error importing password reset module:', error);
      alert('An error occurred while trying to reset your password. Please try again.');
    });
  });
  
  offlineModeToggle.addEventListener('change', function() {
    isOfflineMode = offlineModeToggle.checked;
    
    chrome.runtime.sendMessage({
      type: 'SET_OFFLINE_MODE',
      isOfflineMode: isOfflineMode
    }, function(response) {
      if (response && response.success) {
        if (isOfflineMode) {
          updateUIForOfflineMode();
        } else {
          updateUIForUnauthenticatedUser();
        }
      } else {
        console.error('Error setting offline mode:', response && response.error);
        // Revert toggle if update failed
        offlineModeToggle.checked = !isOfflineMode;
        isOfflineMode = !isOfflineMode;
      }
    });
  });
  
  // Reset tracking button
  resetTrackingBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to reset the timer? Current tracking data will be saved.')) {
      chrome.runtime.sendMessage({ 
        type: 'RESET_TRACKING'
      }, function(response) {
        if (response && response.success) {
          console.log('Tracking reset successfully');
          
          // Clear cached display values to force UI refresh
          lastDisplayedValues = {
            totalTime: null,
            limitDisplay: null,
            updateTime: 0
          };
          
          // Update the UI immediately
          updateResetCount();
          
          // Force update the timer display immediately
          totalTimeDisplay.textContent = "0.0m";
          limitDisplay.textContent = "0.0/" + timeLimit + " min";
          limitProgress.style.width = "0%";
          
          // Clear top sites and category lists
          topSitesList.innerHTML = '<li class="placeholder">No data refinement yet</li>';
          categoryList.innerHTML = '<li class="placeholder">No categories to analyze</li>';
          
          // Reload stats with a slight delay to ensure background has updated
          setTimeout(function() {
            chrome.runtime.sendMessage({ type: 'GET_STATS', detailed: true }, function(response) {
              if (response) {
                updateStats(response);
              }
            });
          }, 500);
        } else {
          console.error('Failed to reset tracking:', response && response.error);
          alert('Failed to reset tracking. Please try again.');
        }
      });
    }
  });
}

// Set random roast message
function setRandomRoast() {
  var randomIndex = Math.floor(Math.random() * roastMessages.length);
  roastMessage.textContent = roastMessages[randomIndex];
}

// Format time in minutes to a readable string with precise values
function formatTime(minutes, detailed = false) {
  // Ensure minutes is a number and handle NaN
  if (typeof minutes !== 'number' || isNaN(minutes)) {
    minutes = 0;
  }
  
  // Calculate hours, minutes, and seconds with precision
  var hours = Math.floor(minutes / 60);
  var mins = Math.floor(minutes % 60);
  var secs = Math.floor((minutes * 60) % 60);
  
  // For more precision, show one decimal place for minutes
  var minsWithDecimal = (minutes % 60).toFixed(1);
  
  // Format the time string
  var timeString;
  if (detailed) {
    if (hours > 0) {
      timeString = hours + 'h ' + mins + 'm ' + secs + 's';
    } else {
      timeString = mins + 'm ' + secs + 's';
    }
  } else {
    if (hours > 0) {
      timeString = hours + 'h ' + minsWithDecimal + 'm';
    } else {
      timeString = minsWithDecimal + 'm';
    }
  }
  
  return timeString;
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);
