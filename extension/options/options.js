/**
 * Trackcrastinate - Options Page
 * 
 * This script handles the options page functionality, including:
 * - Loading and saving user settings
 * - Managing tracked sites
 * - Tab navigation
 * - UI interactions
 */

// State
var currentSettings = null;
var trackedSites = [];
var siteTimeLimits = {};
var currentUser = null;

// DOM Elements
var tabButtons = document.querySelectorAll('.tab-btn');
var tabPanes = document.querySelectorAll('.tab-pane');
var saveButton = document.getElementById('save-btn');
var resetButton = document.getElementById('reset-btn');
var addSiteButton = document.getElementById('add-site');
var newSiteInput = document.getElementById('new-site');
var siteCategorySelect = document.getElementById('site-category');
var siteList = document.getElementById('site-list');
var exportDataButton = document.getElementById('export-data');
var clearDataButton = document.getElementById('clear-data');
var userInfoElement = document.getElementById('user-info');
var resetPasswordBtn = document.getElementById('reset-password-btn');

// Default settings
var DEFAULT_SETTINGS = {
  enableTracking: true,
  showNotifications: true,
  startAtLaunch: true,
  dailyLimit: 60, // 60 minutes per day
  activityType: 'dino-game', // Default to dino game for backward compatibility
  mathDifficulty: 'medium', // Default math difficulty
  warningThreshold: 80, // 80% of time limit
  notificationFrequency: 'medium', // medium frequency (5 minutes)
  roastLevel: 'medium',
  darkMode: false,
  fontSize: 'medium',
  enableSync: true,
  offlineMode: false,
  dashboardUrl: 'http://localhost:3000' // Default dashboard URL
};

// Default tracked sites
var DEFAULT_TRACKED_SITES = [
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

// Initialize the options page
function initialize() {
  console.log('Options page initializing...');
  
  try {
    // Load settings
    chrome.storage.local.get(['settings'], function(result) {
      if (result.settings) {
        currentSettings = Object.assign({}, DEFAULT_SETTINGS, result.settings);
      } else {
        currentSettings = Object.assign({}, DEFAULT_SETTINGS);
      }
      console.log('Loaded settings:', currentSettings);
      
      // Update UI with loaded settings
      updateSettingsUI();
    });
    
    // Load tracked sites
    chrome.storage.local.get(['trackedSites'], function(result) {
      if (Array.isArray(result.trackedSites) && result.trackedSites.length > 0) {
        trackedSites = result.trackedSites;
      } else {
        trackedSites = DEFAULT_TRACKED_SITES.slice();
      }
      console.log('Loaded tracked sites:', trackedSites.length);
      
      // Update tracked sites list
      updateSiteList();
    });
    
    // Load site-specific time limits
    chrome.storage.local.get(['siteTimeLimits'], function(result) {
      if (result.siteTimeLimits && typeof result.siteTimeLimits === 'object') {
        siteTimeLimits = result.siteTimeLimits;
      } else {
        siteTimeLimits = {};
      }
      console.log('Loaded site-specific time limits:', Object.keys(siteTimeLimits).length);
      
      // Update site limits list
      updateSiteLimitsList();
    });
    
    // Set up event listeners
    setupEventListeners();
    
    // Check authentication status
    chrome.storage.local.get(['currentUser', 'isOfflineMode'], function(result) {
      currentUser = result.currentUser;
      var isOfflineMode = result.isOfflineMode;
      
      updateAuthUI({
        isAuthenticated: !!currentUser,
        isOfflineMode: !!isOfflineMode,
        user: currentUser
      });
    });
    
    console.log('Options page initialized successfully');
  } catch (error) {
    console.error('Error initializing options page:', error);
  }
}

// Update UI with current settings
function updateSettingsUI() {
  // General settings
  document.getElementById('enable-tracking').checked = currentSettings.enableTracking;
  document.getElementById('show-notifications').checked = currentSettings.showNotifications;
  document.getElementById('start-at-launch').checked = currentSettings.startAtLaunch;
  
  // Time limits
  document.getElementById('daily-limit').value = currentSettings.dailyLimit;
  document.getElementById('activity-type').value = currentSettings.activityType || 'dino-game';
  document.getElementById('math-difficulty').value = currentSettings.mathDifficulty || 'medium';
  document.getElementById('warning-threshold').value = currentSettings.warningThreshold;
  document.getElementById('notification-frequency').value = currentSettings.notificationFrequency || 'medium';
  
  // Show/hide math difficulty based on selected activity
  toggleMathDifficultyVisibility();
  
  // Appearance
  document.getElementById('roast-level').value = currentSettings.roastLevel;
  document.getElementById('dark-mode').checked = currentSettings.darkMode;
  document.getElementById('font-size').value = currentSettings.fontSize;
  
  // Sync & Data
  document.getElementById('enable-sync').checked = currentSettings.enableSync;
  document.getElementById('offline-mode').checked = currentSettings.offlineMode;
  document.getElementById('dashboard-url').value = currentSettings.dashboardUrl || 'http://localhost:3000';
}

// Toggle visibility of math difficulty setting based on selected activity
function toggleMathDifficultyVisibility() {
  var activityType = document.getElementById('activity-type').value;
  var mathDifficultyContainer = document.getElementById('math-difficulty-container');
  
  if (activityType === 'math-challenge') {
    mathDifficultyContainer.style.display = 'block';
  } else {
    mathDifficultyContainer.style.display = 'none';
  }
}

// Update the site list UI
function updateSiteList() {
  // Clear the current list
  siteList.innerHTML = '';
  
  // Add each site to the list
  for (var i = 0; i < trackedSites.length; i++) {
    var site = trackedSites[i];
    var index = i;
    
    var li = document.createElement('li');
    
    var siteInfo = document.createElement('div');
    siteInfo.innerHTML = 
      '<span class="site-domain">' + site.domain + '</span>' +
      '<span class="site-category">' + site.category + '</span>';
    
    var siteActions = document.createElement('div');
    siteActions.className = 'site-actions';
    
    var editButton = document.createElement('button');
    editButton.className = 'icon-btn';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', createEditHandler(index));
    
    var deleteButton = document.createElement('button');
    deleteButton.className = 'icon-btn';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', createDeleteHandler(index));
    
    siteActions.appendChild(editButton);
    siteActions.appendChild(deleteButton);
    
    li.appendChild(siteInfo);
    li.appendChild(siteActions);
    
    siteList.appendChild(li);
  }
  
  // If no sites, show a message
  if (trackedSites.length === 0) {
    var li = document.createElement('li');
    li.textContent = 'No sites tracked. Add some below.';
    siteList.appendChild(li);
  }
}

// Create an edit handler for a specific index
function createEditHandler(index) {
  return function() {
    editSite(index);
  };
}

// Create a delete handler for a specific index
function createDeleteHandler(index) {
  return function() {
    deleteSite(index);
  };
}

// Update authentication UI
function updateAuthUI(authStatus) {
  if (authStatus.isAuthenticated && authStatus.user) {
    userInfoElement.textContent = 'Signed in as: ' + authStatus.user.email;
    resetPasswordBtn.style.display = 'inline-block';
  } else if (authStatus.isOfflineMode) {
    userInfoElement.textContent = 'Offline Mode (No Sync)';
    resetPasswordBtn.style.display = 'none';
  } else {
    userInfoElement.textContent = 'Not signed in';
    resetPasswordBtn.style.display = 'none';
  }
}

// Handle password reset
function handlePasswordReset() {
  try {
    // Get current user email
    chrome.storage.local.get(['currentUser'], function(result) {
      if (!result.currentUser || !result.currentUser.email) {
        alert('You must be signed in to reset your password.');
        return;
      }
      
      const email = result.currentUser.email;
      
      // Confirm with user
      if (!confirm(`Send password reset instructions to ${email}?`)) {
        return;
      }
      
      // Import the password reset module
      import('../password-reset.js').then(function() {
        // Use the password reset module to initiate password reset
        window.passwordResetModule.initiatePasswordReset(email)
          .then(function(result) {
            if (result.success) {
              alert('Password reset instructions have been sent to your email.');
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
  } catch (error) {
    console.error('Error handling password reset:', error);
    alert('An error occurred while trying to reset your password. Please try again.');
  }
}

// Add a new site to the tracked sites
function addSite() {
  var domain = newSiteInput.value.trim();
  var category = siteCategorySelect.value;
  
  if (!domain) {
    alert('Please enter a domain');
    return;
  }
  
  // Validate domain
  if (!isValidDomain(domain)) {
    alert('Please enter a valid domain (e.g., facebook.com)');
    return;
  }
  
  // Check if domain already exists
  var exists = false;
  for (var i = 0; i < trackedSites.length; i++) {
    if (trackedSites[i].domain === domain) {
      exists = true;
      break;
    }
  }
  
  if (exists) {
    alert('This domain is already being tracked');
    return;
  }
  
  // Add the new site
  trackedSites.push({ domain: domain, category: category });
  
  // Update the UI
  updateSiteList();
  
  // Clear the input
  newSiteInput.value = '';
  
  // Show confirmation
  showSaveConfirmation('Site added successfully');
}

// Check if a domain is valid
function isValidDomain(domain) {
  if (!domain) return false;
  
  // Simple validation: must contain at least one dot and no spaces
  return domain.indexOf('.') !== -1 && domain.indexOf(' ') === -1;
}

// Edit a site in the tracked sites
function editSite(index) {
  var site = trackedSites[index];
  
  // Simple prompt for editing
  var newDomain = prompt('Edit domain:', site.domain);
  if (newDomain === null) return; // User cancelled
  
  var newCategory = prompt('Edit category (social, entertainment, shopping, news, sports, other):', site.category);
  if (newCategory === null) return; // User cancelled
  
  // Validate domain
  if (!isValidDomain(newDomain)) {
    alert('Please enter a valid domain (e.g., facebook.com)');
    return;
  }
  
  // Update the site
  trackedSites[index] = {
    domain: newDomain.trim(),
    category: newCategory.trim()
  };
  
  // Update the UI
  updateSiteList();
  
  // Show confirmation
  showSaveConfirmation('Site updated successfully');
}

// Delete a site from the tracked sites
function deleteSite(index) {
  if (confirm('Are you sure you want to delete this site?')) {
    trackedSites.splice(index, 1);
    updateSiteList();
    showSaveConfirmation('Site deleted successfully');
  }
}

// Save settings to storage
function saveSettings() {
  try {
    // Get values from UI
    currentSettings.enableTracking = document.getElementById('enable-tracking').checked;
    currentSettings.showNotifications = document.getElementById('show-notifications').checked;
    currentSettings.startAtLaunch = document.getElementById('start-at-launch').checked;
    currentSettings.dailyLimit = parseInt(document.getElementById('daily-limit').value);
    currentSettings.activityType = document.getElementById('activity-type').value;
    currentSettings.mathDifficulty = document.getElementById('math-difficulty').value;
    currentSettings.warningThreshold = parseInt(document.getElementById('warning-threshold').value);
    currentSettings.notificationFrequency = document.getElementById('notification-frequency').value;
    currentSettings.roastLevel = document.getElementById('roast-level').value;
    currentSettings.darkMode = document.getElementById('dark-mode').checked;
    currentSettings.fontSize = document.getElementById('font-size').value;
    currentSettings.enableSync = document.getElementById('enable-sync').checked;
    currentSettings.offlineMode = document.getElementById('offline-mode').checked;
    currentSettings.dashboardUrl = document.getElementById('dashboard-url').value.trim() || 'http://localhost:3000';
    
    console.log('Saving settings:', currentSettings);
    
    // Validate time limit
    if (currentSettings.dailyLimit < 1 || currentSettings.dailyLimit > 1440) {
      alert('Time limit must be between 1 and 1440 minutes');
      return;
    }
    
    // Validate warning threshold
    if (currentSettings.warningThreshold < 1 || currentSettings.warningThreshold > 100) {
      alert('Warning threshold must be between 1 and 100 percent');
      return;
    }
    
    // Save to Chrome storage
    chrome.storage.local.set({
      settings: currentSettings,
      trackedSites: trackedSites,
      timeLimit: currentSettings.dailyLimit // Also save timeLimit directly for backward compatibility
    }, function() {
      // Notify background script about the time limit change
      chrome.runtime.sendMessage({ 
        type: 'SET_TIME_LIMIT', 
        timeLimit: currentSettings.dailyLimit 
      }, function(response) {
        if (response && response.success) {
          console.log('Time limit updated in background script:', currentSettings.dailyLimit);
        } else {
          console.error('Failed to update time limit in background script:', chrome.runtime.lastError);
        }
      });
      
      // Notify background script about tracked sites change
      chrome.runtime.sendMessage({ 
        type: 'SET_TRACKED_SITES', 
        trackedSites: trackedSites 
      }, function(response) {
        if (response && response.success) {
          console.log('Tracked sites updated in background script');
        } else {
          console.error('Failed to update tracked sites in background script:', chrome.runtime.lastError);
        }
      });
      
      showSaveConfirmation('Settings saved successfully');
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Error saving settings: ' + error.message);
  }
}

// Reset settings to defaults
function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    currentSettings = Object.assign({}, DEFAULT_SETTINGS);
    trackedSites = DEFAULT_TRACKED_SITES.slice();
    
    updateSettingsUI();
    updateSiteList();
    
    showSaveConfirmation('Settings reset to defaults');
  }
}

// Export data as JSON
function exportData() {
  try {
    // Get all data
    chrome.storage.local.get(['settings', 'trackedSites', 'dailyUsage', 'usageDate'], function(result) {
      var data = {
        settings: result.settings || DEFAULT_SETTINGS,
        trackedSites: result.trackedSites || DEFAULT_TRACKED_SITES,
        dailyUsage: result.dailyUsage || {},
        usageDate: result.usageDate || new Date().toISOString().split('T')[0]
      };
      
      // Create and download JSON file
      var dataStr = JSON.stringify(data, null, 2);
      var dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      var exportFileDefaultName = 'trackcrastinate-data-' + new Date().toISOString().split('T')[0] + '.json';
      
      var linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      showSaveConfirmation('Data exported successfully');
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Error exporting data: ' + error.message);
  }
}

// Clear all data
function clearData() {
  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    try {
      chrome.storage.local.clear(function() {
        alert('All data has been cleared. The page will now reload.');
        window.location.reload();
      });
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Error clearing data: ' + error.message);
    }
  }
}

// Show save confirmation
function showSaveConfirmation(message) {
  var confirmation = document.createElement('div');
  confirmation.className = 'save-confirmation';
  confirmation.textContent = message;
  confirmation.style.position = 'fixed';
  confirmation.style.bottom = '20px';
  confirmation.style.right = '20px';
  confirmation.style.backgroundColor = 'var(--success-color)';
  confirmation.style.color = 'white';
  confirmation.style.padding = '10px 20px';
  confirmation.style.borderRadius = 'var(--border-radius)';
  confirmation.style.boxShadow = 'var(--box-shadow)';
  
  document.body.appendChild(confirmation);
  
  setTimeout(function() {
    confirmation.style.opacity = '0';
    confirmation.style.transition = 'opacity 0.5s ease';
    
    setTimeout(function() {
      document.body.removeChild(confirmation);
    }, 500);
  }, 3000);
}

/**
 * Update the site limits list UI
 */
function updateSiteLimitsList() {
  var siteLimitsList = document.getElementById('site-limits-list');
  
  // Clear the current list
  siteLimitsList.innerHTML = '';
  
  // Get the domains and sort them alphabetically
  var domains = Object.keys(siteTimeLimits).sort();
  
  // If no site limits, show a message
  if (domains.length === 0) {
    siteLimitsList.innerHTML = '<p class="empty-message">No site-specific limits set. Add one below.</p>';
    return;
  }
  
  // Add each site limit to the list
  domains.forEach(function(domain) {
    var limit = siteTimeLimits[domain];
    
    // Create site limit item
    var itemElement = document.createElement('div');
    itemElement.className = 'site-limit-item';
    itemElement.dataset.domain = domain;
    
    // Add domain
    var domainElement = document.createElement('div');
    domainElement.className = 'site-limit-domain';
    domainElement.textContent = domain;
    
    // Add limit input
    var limitInput = document.createElement('input');
    limitInput.type = 'number';
    limitInput.className = 'site-limit-value';
    limitInput.min = 1;
    limitInput.max = 1440;
    limitInput.value = limit;
    limitInput.addEventListener('change', function() {
      updateSiteTimeLimit(domain, parseInt(this.value, 10));
    });
    
    // Add delete button
    var deleteButton = document.createElement('button');
    deleteButton.className = 'site-limit-delete';
    deleteButton.textContent = '×';
    deleteButton.title = 'Remove limit';
    deleteButton.addEventListener('click', function() {
      removeSiteTimeLimit(domain);
    });
    
    // Add elements to item
    itemElement.appendChild(domainElement);
    itemElement.appendChild(limitInput);
    itemElement.appendChild(deleteButton);
    
    // Add item to list
    siteLimitsList.appendChild(itemElement);
  });
}

/**
 * Add a new site-specific time limit
 */
function addSiteLimit() {
  var domain = document.getElementById('site-domain').value.trim();
  var limit = parseInt(document.getElementById('site-limit').value, 10);
  
  // Validate inputs
  if (!domain) {
    alert('Please enter a domain');
    return;
  }
  
  if (isNaN(limit) || limit < 1 || limit > 1440) {
    alert('Please enter a valid time limit between 1 and 1440 minutes');
    return;
  }
  
  // Validate domain
  if (!isValidDomain(domain)) {
    alert('Please enter a valid domain (e.g., facebook.com)');
    return;
  }
  
  // Normalize domain (remove protocol, www, and path)
  var normalizedDomain = normalizeDomain(domain);
  
  // Update site time limit
  updateSiteTimeLimit(normalizedDomain, limit);
  
  // Clear inputs
  document.getElementById('site-domain').value = '';
  document.getElementById('site-limit').value = '30';
}

/**
 * Normalize a domain (remove protocol, www, and path)
 * @param {string} domain - The domain to normalize
 * @returns {string} The normalized domain
 */
function normalizeDomain(domain) {
  var normalizedDomain = domain.toLowerCase();
  normalizedDomain = normalizedDomain.replace(/^(https?:\/\/)?(www\.)?/, '');
  normalizedDomain = normalizedDomain.split('/')[0];
  return normalizedDomain;
}

/**
 * Update a site-specific time limit
 * @param {string} domain - The domain to update
 * @param {number} limit - The new time limit in minutes
 */
function updateSiteTimeLimit(domain, limit) {
  // Validate limit
  if (isNaN(limit) || limit < 1 || limit > 1440) {
    alert('Time limit must be between 1 and 1440 minutes');
    updateSiteLimitsList(); // Refresh the list with original values
    return;
  }
  
  // Update in memory
  siteTimeLimits[domain] = limit;
  
  // Save to storage
  chrome.storage.local.set({ siteTimeLimits: siteTimeLimits }, function() {
    console.log(`Updated time limit for ${domain} to ${limit} minutes`);
    
    // Notify background script
    chrome.runtime.sendMessage({ 
      type: 'UPDATE_SITE_TIME_LIMIT', 
      domain: domain,
      limit: limit
    }, function(response) {
      if (response && response.success) {
        console.log('Site time limit updated in background script');
      } else {
        console.error('Failed to update site time limit in background script:', chrome.runtime.lastError);
      }
    });
    
    // Show confirmation
    showSaveConfirmation(`Updated time limit for ${domain} to ${limit} minutes`);
    
    // Update the UI
    updateSiteLimitsList();
  });
}

/**
 * Remove a site-specific time limit
 * @param {string} domain - The domain to remove the limit for
 */
function removeSiteTimeLimit(domain) {
  if (confirm(`Are you sure you want to remove the time limit for ${domain}?`)) {
    // Remove from memory
    delete siteTimeLimits[domain];
    
    // Save to storage
    chrome.storage.local.set({ siteTimeLimits: siteTimeLimits }, function() {
      console.log(`Removed time limit for ${domain}`);
      
      // Notify background script
      chrome.runtime.sendMessage({ 
        type: 'REMOVE_SITE_TIME_LIMIT', 
        domain: domain
      }, function(response) {
        if (response && response.success) {
          console.log('Site time limit removed in background script');
        } else {
          console.error('Failed to remove site time limit in background script:', chrome.runtime.lastError);
        }
      });
      
      // Show confirmation
      showSaveConfirmation(`Removed time limit for ${domain}`);
      
      // Update the UI
      updateSiteLimitsList();
    });
  }
}

// Set up event listeners
function setupEventListeners() {
  // Tab navigation
  for (var i = 0; i < tabButtons.length; i++) {
    tabButtons[i].addEventListener('click', createTabClickHandler(tabButtons[i]));
  }
  
  // Save button
  saveButton.addEventListener('click', saveSettings);
  
  // Reset button
  resetButton.addEventListener('click', resetSettings);
  
  // Add site button
  addSiteButton.addEventListener('click', addSite);
  
  // Export data button
  exportDataButton.addEventListener('click', exportData);
  
  // Clear data button
  clearDataButton.addEventListener('click', clearData);
  
  // Reset password button
  resetPasswordBtn.addEventListener('click', handlePasswordReset);
  
  // Enter key in new site input
  newSiteInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addSite();
    }
  });
  
  // Activity type change
  document.getElementById('activity-type').addEventListener('change', toggleMathDifficultyVisibility);
  
  // Add site limit button
  document.getElementById('add-site-limit-btn').addEventListener('click', addSiteLimit);
  
  // Enter key in site domain input
  document.getElementById('site-domain').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('site-limit').focus();
    }
  });
  
  // Enter key in site limit input
  document.getElementById('site-limit').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addSiteLimit();
    }
  });
}

// Create a tab click handler
function createTabClickHandler(button) {
  return function() {
    var tabId = button.getAttribute('data-tab');
    
    // Update active tab button
    for (var i = 0; i < tabButtons.length; i++) {
      tabButtons[i].classList.remove('active');
    }
    button.classList.add('active');
    
    // Update active tab pane
    for (var j = 0; j < tabPanes.length; j++) {
      tabPanes[j].classList.remove('active');
    }
    document.getElementById(tabId).classList.add('active');
  };
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
