/**
 * Trackcrastinate - Onboarding JavaScript
 * 
 * This script handles the onboarding experience for new users.
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
  // Initialize variables
  let currentStep = null;
  let allSteps = [];
  let trackedSites = [];
  let siteTimeLimits = {};
  let settings = {};
  
  // DOM elements
  const stepContainer = document.getElementById('step-container');
  const stepIndicators = document.getElementById('step-indicators');
  const progressFill = document.getElementById('progress-fill');
  const btnBack = document.getElementById('btn-back');
  const btnSkip = document.getElementById('btn-skip');
  const btnNext = document.getElementById('btn-next');
  
  // Initialize onboarding
  await initialize();
  
  // Event listeners
  btnBack.addEventListener('click', goToPreviousStep);
  btnSkip.addEventListener('click', skipOnboarding);
  btnNext.addEventListener('click', goToNextStep);
  
  /**
   * Initialize the onboarding process
   */
  async function initialize() {
    try {
      console.log('Initializing onboarding...');
      
      // Load onboarding manager
      if (!self.onboardingManager) {
        console.error('Onboarding manager not found');
        return;
      }
      
      // Initialize onboarding manager
      await self.onboardingManager.initialize();
      
      // Get all steps
      allSteps = self.onboardingManager.getAllSteps();
      
      // Get current step
      currentStep = self.onboardingManager.getCurrentStep();
      
      // Load settings
      settings = await self.storage.getSettings();
      
      // Load tracked sites
      trackedSites = await self.storage.getTrackedSites();
      
      // Load site time limits
      siteTimeLimits = await self.storage.getSiteTimeLimits();
      
      // Create step indicators
      createStepIndicators();
      
      // Load current step content
      loadStepContent(currentStep.id);
      
      // Update UI
      updateUI();
      
      console.log('Onboarding initialized successfully');
    } catch (error) {
      console.error('Error initializing onboarding:', error);
    }
  }
  
  /**
   * Create step indicators
   */
  function createStepIndicators() {
    // Clear existing indicators
    stepIndicators.innerHTML = '';
    
    // Create indicators for each step
    allSteps.forEach(step => {
      // Skip complete step
      if (step.id === 'complete') return;
      
      const indicator = document.createElement('div');
      indicator.className = 'step-indicator';
      indicator.dataset.stepId = step.id;
      
      const dot = document.createElement('div');
      dot.className = 'step-dot';
      if (step.id === currentStep.id) dot.classList.add('active');
      if (step.isCompleted) dot.classList.add('completed');
      
      const label = document.createElement('div');
      label.className = 'step-label';
      if (step.id === currentStep.id) label.classList.add('active');
      label.textContent = step.title;
      
      indicator.appendChild(dot);
      indicator.appendChild(label);
      stepIndicators.appendChild(indicator);
    });
  }
  
  /**
   * Load step content
   * @param {string} stepId - The ID of the step to load
   */
  function loadStepContent(stepId) {
    // Clear existing content
    stepContainer.innerHTML = '';
    
    // Get template for this step
    const template = document.getElementById(`step-${stepId}`);
    
    if (!template) {
      console.error(`Template not found for step: ${stepId}`);
      return;
    }
    
    // Clone template content
    const content = template.content.cloneNode(true);
    
    // Add content to container
    stepContainer.appendChild(content);
    
    // Initialize step-specific functionality
    initializeStepFunctionality(stepId);
  }
  
  /**
   * Initialize step-specific functionality
   * @param {string} stepId - The ID of the step
   */
  function initializeStepFunctionality(stepId) {
    switch (stepId) {
      case 'welcome':
        // Nothing special needed for welcome step
        break;
        
      case 'tracked-sites':
        initializeTrackedSitesStep();
        break;
        
      case 'time-limits':
        initializeTimeLimitsStep();
        break;
        
      case 'notifications':
        initializeNotificationsStep();
        break;
        
      case 'dashboard':
        initializeDashboardStep();
        break;
        
      case 'complete':
        initializeCompleteStep();
        break;
    }
  }
  
  /**
   * Initialize tracked sites step
   */
  function initializeTrackedSitesStep() {
    const siteList = document.getElementById('site-list');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const customSiteInput = document.getElementById('custom-site-input');
    const customSiteCategory = document.getElementById('custom-site-category');
    const btnAddSite = document.getElementById('btn-add-site');
    
    // Populate site list
    populateSiteList();
    
    // Add event listeners for category buttons
    categoryButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove active class from all buttons
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Filter sites by category
        const category = this.dataset.category;
        filterSitesByCategory(category);
      });
    });
    
    // Add event listener for add site button
    btnAddSite.addEventListener('click', function() {
      addCustomSite();
    });
    
    // Add event listener for enter key in custom site input
    customSiteInput.addEventListener('keyup', function(event) {
      if (event.key === 'Enter') {
        addCustomSite();
      }
    });
    
    /**
     * Populate site list with tracked sites
     */
    function populateSiteList() {
      // Clear existing items
      siteList.innerHTML = '';
      
      // Get default tracked sites
      const defaultSites = self.storage.DEFAULT_TRACKED_SITES;
      
      // Create a map of tracked sites for quick lookup
      const trackedSitesMap = {};
      trackedSites.forEach(site => {
        if (typeof site === 'string') {
          trackedSitesMap[site] = { domain: site, category: 'uncategorized' };
        } else {
          trackedSitesMap[site.domain] = site;
        }
      });
      
      // Add default sites to list
      defaultSites.forEach(site => {
        const isTracked = trackedSitesMap[site.domain] !== undefined;
        
        const item = createSiteItem(site.domain, site.category, isTracked);
        siteList.appendChild(item);
      });
      
      // Add any custom tracked sites that aren't in the default list
      trackedSites.forEach(site => {
        const domain = typeof site === 'string' ? site : site.domain;
        const category = typeof site === 'string' ? 'uncategorized' : site.category;
        
        // Check if this site is already in the list
        const isDefaultSite = defaultSites.some(defaultSite => defaultSite.domain === domain);
        
        if (!isDefaultSite) {
          const item = createSiteItem(domain, category, true);
          siteList.appendChild(item);
        }
      });
    }
    
    /**
     * Create a site item element
     * @param {string} domain - The domain
     * @param {string} category - The category
     * @param {boolean} checked - Whether the site is tracked
     * @returns {HTMLElement} The site item element
     */
    function createSiteItem(domain, category, checked) {
      const item = document.createElement('div');
      item.className = 'site-item';
      item.dataset.category = category;
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'site-checkbox';
      checkbox.checked = checked;
      checkbox.dataset.domain = domain;
      
      checkbox.addEventListener('change', function() {
        updateTrackedSites();
      });
      
      const label = document.createElement('label');
      label.className = 'site-label';
      label.textContent = domain;
      
      const categorySpan = document.createElement('span');
      categorySpan.className = `site-category ${category}`;
      categorySpan.textContent = category;
      
      item.appendChild(checkbox);
      item.appendChild(label);
      item.appendChild(categorySpan);
      
      return item;
    }
    
    /**
     * Filter sites by category
     * @param {string} category - The category to filter by
     */
    function filterSitesByCategory(category) {
      const items = siteList.querySelectorAll('.site-item');
      
      items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    }
    
    /**
     * Add a custom site
     */
    function addCustomSite() {
      const domain = customSiteInput.value.trim();
      const category = customSiteCategory.value;
      
      if (!domain) {
        alert('Please enter a domain');
        return;
      }
      
      // Simple domain validation
      if (!domain.includes('.')) {
        alert('Please enter a valid domain (e.g., example.com)');
        return;
      }
      
      // Check if domain already exists
      const existingCheckbox = siteList.querySelector(`input[data-domain="${domain}"]`);
      if (existingCheckbox) {
        existingCheckbox.checked = true;
        updateTrackedSites();
        customSiteInput.value = '';
        return;
      }
      
      // Create and add new site item
      const item = createSiteItem(domain, category, true);
      siteList.appendChild(item);
      
      // Update tracked sites
      updateTrackedSites();
      
      // Clear input
      customSiteInput.value = '';
    }
    
    /**
     * Update tracked sites based on checkboxes
     */
    function updateTrackedSites() {
      const checkboxes = siteList.querySelectorAll('.site-checkbox');
      const newTrackedSites = [];
      
      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          const domain = checkbox.dataset.domain;
          const categoryElement = checkbox.closest('.site-item').querySelector('.site-category');
          const category = categoryElement ? categoryElement.textContent : 'uncategorized';
          
          newTrackedSites.push({ domain, category });
        }
      });
      
      // Update tracked sites
      trackedSites = newTrackedSites;
      
      // Save to storage
      self.storage.saveTrackedSites(trackedSites);
    }
  }
  
  /**
   * Initialize time limits step
   */
  function initializeTimeLimitsStep() {
    const globalTimeLimitSlider = document.getElementById('global-time-limit');
    const globalTimeLimitValue = document.getElementById('global-time-limit-value');
    const presetButtons = document.querySelectorAll('.preset-btn');
    const siteLimitList = document.getElementById('site-limit-list');
    const siteLimitSelect = document.getElementById('site-limit-select');
    const siteLimitValue = document.getElementById('site-limit-value');
    const btnAddSiteLimit = document.getElementById('btn-add-site-limit');
    
    // Set initial value
    globalTimeLimitSlider.value = settings.dailyLimit || 60;
    globalTimeLimitValue.textContent = globalTimeLimitSlider.value;
    
    // Add event listener for slider
    globalTimeLimitSlider.addEventListener('input', function() {
      globalTimeLimitValue.textContent = this.value;
      updateGlobalTimeLimit(parseInt(this.value));
    });
    
    // Add event listeners for preset buttons
    presetButtons.forEach(button => {
      button.addEventListener('click', function() {
        const value = parseInt(this.dataset.value);
        globalTimeLimitSlider.value = value;
        globalTimeLimitValue.textContent = value;
        updateGlobalTimeLimit(value);
      });
    });
    
    // Populate site limit select
    populateSiteLimitSelect();
    
    // Populate site limit list
    populateSiteLimitList();
    
    // Add event listener for add site limit button
    btnAddSiteLimit.addEventListener('click', function() {
      addSiteLimit();
    });
    
    /**
     * Update global time limit
     * @param {number} value - The new time limit in minutes
     */
    function updateGlobalTimeLimit(value) {
      settings.dailyLimit = value;
      self.storage.saveSettings(settings);
    }
    
    /**
     * Populate site limit select with tracked sites
     */
    function populateSiteLimitSelect() {
      // Clear existing options (except the first one)
      while (siteLimitSelect.options.length > 1) {
        siteLimitSelect.remove(1);
      }
      
      // Add tracked sites as options
      trackedSites.forEach(site => {
        const domain = typeof site === 'string' ? site : site.domain;
        
        // Skip if already has a specific limit
        if (siteTimeLimits[domain]) return;
        
        const option = document.createElement('option');
        option.value = domain;
        option.textContent = domain;
        siteLimitSelect.appendChild(option);
      });
    }
    
    /**
     * Populate site limit list with existing limits
     */
    function populateSiteLimitList() {
      // Clear existing items
      siteLimitList.innerHTML = '';
      
      // Add items for each site limit
      Object.entries(siteTimeLimits).forEach(([domain, limit]) => {
        const item = createSiteLimitItem(domain, limit);
        siteLimitList.appendChild(item);
      });
    }
    
    /**
     * Create a site limit item element
     * @param {string} domain - The domain
     * @param {number} limit - The time limit in minutes
     * @returns {HTMLElement} The site limit item element
     */
    function createSiteLimitItem(domain, limit) {
      const item = document.createElement('div');
      item.className = 'site-limit-item';
      
      const domainSpan = document.createElement('span');
      domainSpan.className = 'site-limit-domain';
      domainSpan.textContent = domain;
      
      const timeSpan = document.createElement('span');
      timeSpan.className = 'site-limit-time';
      timeSpan.textContent = `${limit} min`;
      
      const removeButton = document.createElement('button');
      removeButton.className = 'site-limit-remove';
      removeButton.innerHTML = '&times;';
      removeButton.title = 'Remove limit';
      
      removeButton.addEventListener('click', function() {
        removeSiteLimit(domain);
      });
      
      item.appendChild(domainSpan);
      item.appendChild(timeSpan);
      item.appendChild(removeButton);
      
      return item;
    }
    
    /**
     * Add a site-specific time limit
     */
    function addSiteLimit() {
      const domain = siteLimitSelect.value;
      const limit = parseInt(siteLimitValue.value);
      
      if (!domain) {
        alert('Please select a site');
        return;
      }
      
      if (isNaN(limit) || limit <= 0) {
        alert('Please enter a valid time limit');
        return;
      }
      
      // Add to site time limits
      siteTimeLimits[domain] = limit;
      
      // Save to storage
      self.storage.saveSiteTimeLimits(siteTimeLimits);
      
      // Update UI
      populateSiteLimitList();
      populateSiteLimitSelect();
      
      // Reset select
      siteLimitSelect.selectedIndex = 0;
    }
    
    /**
     * Remove a site-specific time limit
     * @param {string} domain - The domain to remove the limit for
     */
    function removeSiteLimit(domain) {
      // Remove from site time limits
      delete siteTimeLimits[domain];
      
      // Save to storage
      self.storage.saveSiteTimeLimits(siteTimeLimits);
      
      // Update UI
      populateSiteLimitList();
      populateSiteLimitSelect();
    }
  }
  
  /**
   * Initialize notifications step
   */
  function initializeNotificationsStep() {
    // Notification types
    const browserNotifications = document.getElementById('browser-notifications');
    const inPageBanners = document.getElementById('in-page-banners');
    const popupAlerts = document.getElementById('popup-alerts');
    
    // Notification thresholds
    const threshold50 = document.getElementById('threshold-50');
    const threshold75 = document.getElementById('threshold-75');
    const threshold90 = document.getElementById('threshold-90');
    const threshold95 = document.getElementById('threshold-95');
    
    // Sound alerts
    const soundAlerts = document.getElementById('sound-alerts');
    const soundVolume = document.getElementById('sound-volume');
    const volumeValue = document.getElementById('volume-value');
    const volumeContainer = document.getElementById('volume-container');
    
    // Notification frequency
    const frequencyLow = document.getElementById('frequency-low');
    const frequencyMedium = document.getElementById('frequency-medium');
    const frequencyHigh = document.getElementById('frequency-high');
    
    // Snooze options
    const snoozeEnabled = document.getElementById('snooze-enabled');
    const snoozeDuration = document.getElementById('snooze-duration');
    const snoozeDurationContainer = document.getElementById('snooze-duration-container');
    
    // Set initial values
    browserNotifications.checked = settings.notificationTypes?.browser ?? true;
    inPageBanners.checked = settings.notificationTypes?.inPage ?? true;
    popupAlerts.checked = settings.notificationTypes?.popupAlerts ?? true;
    
    threshold50.checked = settings.notificationThresholds?.includes(50) ?? true;
    threshold75.checked = settings.notificationThresholds?.includes(75) ?? true;
    threshold90.checked = settings.notificationThresholds?.includes(90) ?? true;
    threshold95.checked = settings.notificationThresholds?.includes(95) ?? true;
    
    soundAlerts.checked = settings.soundAlerts ?? false;
    soundVolume.value = settings.soundVolume ?? 50;
    volumeValue.textContent = `${soundVolume.value}%`;
    volumeContainer.style.display = soundAlerts.checked ? 'flex' : 'none';
    
    switch (settings.notificationFrequency) {
      case 'low':
        frequencyLow.checked = true;
        break;
      case 'high':
        frequencyHigh.checked = true;
        break;
      case 'medium':
      default:
        frequencyMedium.checked = true;
        break;
    }
    
    snoozeEnabled.checked = settings.snoozeEnabled ?? true;
    snoozeDuration.value = settings.snoozeDuration ?? 5;
    snoozeDurationContainer.style.display = snoozeEnabled.checked ? 'flex' : 'none';
    
    // Add event listeners
    browserNotifications.addEventListener('change', updateNotificationSettings);
    inPageBanners.addEventListener('change', updateNotificationSettings);
    popupAlerts.addEventListener('change', updateNotificationSettings);
    
    threshold50.addEventListener('change', updateNotificationSettings);
    threshold75.addEventListener('change', updateNotificationSettings);
    threshold90.addEventListener('change', updateNotificationSettings);
    threshold95.addEventListener('change', updateNotificationSettings);
    
    soundAlerts.addEventListener('change', function() {
      volumeContainer.style.display = this.checked ? 'flex' : 'none';
      updateNotificationSettings();
    });
    
    soundVolume.addEventListener('input', function() {
      volumeValue.textContent = `${this.value}%`;
      updateNotificationSettings();
    });
    
    frequencyLow.addEventListener('change', updateNotificationSettings);
    frequencyMedium.addEventListener('change', updateNotificationSettings);
    frequencyHigh.addEventListener('change', updateNotificationSettings);
    
    snoozeEnabled.addEventListener('change', function() {
      snoozeDurationContainer.style.display = this.checked ? 'flex' : 'none';
      updateNotificationSettings();
    });
    
    snoozeDuration.addEventListener('change', updateNotificationSettings);
    
    /**
     * Update notification settings
     */
    function updateNotificationSettings() {
      // Update notification types
      settings.notificationTypes = {
        browser: browserNotifications.checked,
        inPage: inPageBanners.checked,
        popupAlerts: popupAlerts.checked
      };
      
      // Update notification thresholds
      settings.notificationThresholds = [];
      if (threshold50.checked) settings.notificationThresholds.push(50);
      if (threshold75.checked) settings.notificationThresholds.push(75);
      if (threshold90.checked) settings.notificationThresholds.push(90);
      if (threshold95.checked) settings.notificationThresholds.push(95);
      
      // Update sound alerts
      settings.soundAlerts = soundAlerts.checked;
      settings.soundVolume = parseInt(soundVolume.value);
      
      // Update notification frequency
      if (frequencyLow.checked) {
        settings.notificationFrequency = 'low';
      } else if (frequencyHigh.checked) {
        settings.notificationFrequency = 'high';
      } else {
        settings.notificationFrequency = 'medium';
      }
      
      // Update snooze options
      settings.snoozeEnabled = snoozeEnabled.checked;
      settings.snoozeDuration = parseInt(snoozeDuration.value);
      
      // Save settings
      self.storage.saveSettings(settings);
    }
  }
  
  /**
   * Initialize dashboard step
   */
  function initializeDashboardStep() {
    const dashboardUrl = document.getElementById('dashboard-url');
    const btnOpenDashboard = document.getElementById('btn-open-dashboard');
    
    // Set dashboard URL
    dashboardUrl.textContent = settings.dashboardUrl || 'http://localhost:3000';
    
    // Add event listener for open dashboard button
    btnOpenDashboard.addEventListener('click', function() {
      chrome.tabs.create({ url: settings.dashboardUrl || 'http://localhost:3000' });
    });
  }
  
  /**
   * Initialize complete step
   */
  function initializeCompleteStep() {
    const btnOptions = document.getElementById('btn-options');
    const btnFinish = document.getElementById('btn-finish');
    
    // Add event listener for options button
    btnOptions.addEventListener('click', function() {
      chrome.runtime.openOptionsPage();
    });
    
    // Add event listener for finish button
    btnFinish.addEventListener('click', function() {
      completeOnboarding();
    });
  }
  
  /**
   * Go to the next step
   */
  async function goToNextStep() {
    try {
      // Call onboarding manager to move to next step
      const result = await self.onboardingManager.nextStep();
      
      if (result.success) {
        // Update current step
        currentStep = result.currentStep;
        
        // Load step content
        loadStepContent(currentStep.id);
        
        // Update UI
        updateUI();
        
        // If onboarding is complete, close the page after a delay
        if (result.isComplete) {
          setTimeout(function() {
            window.close();
          }, 3000);
        }
      } else {
        console.error('Error moving to next step:', result.error);
      }
    } catch (error) {
      console.error('Error going to next step:', error);
    }
  }
  
  /**
   * Go to the previous step
   */
  async function goToPreviousStep() {
    try {
      // Call onboarding manager to move to previous step
      const result = await self.onboardingManager.previousStep();
      
      if (result.success) {
        // Update current step
        currentStep = result.currentStep;
        
        // Load step content
        loadStepContent(currentStep.id);
        
        // Update UI
        updateUI();
      } else {
        console.log('Already at first step');
      }
    } catch (error) {
      console.error('Error going to previous step:', error);
    }
  }
  
  /**
   * Skip the onboarding process
   */
  async function skipOnboarding() {
    try {
      // Confirm with user
      if (confirm('Are you sure you want to skip the onboarding process? You can always access it later from the options page.')) {
        // Call onboarding manager to skip onboarding
        const result = await self.onboardingManager.skipOnboarding();
        
        if (result.success) {
          // Close the page
          window.close();
        } else {
          console.error('Error skipping onboarding:', result.error);
        }
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  }
  
  /**
   * Complete the onboarding process
   */
  async function completeOnboarding() {
    try {
      // Call onboarding manager to complete onboarding
      const result = await self.onboardingManager.completeOnboarding();
      
      if (result.success) {
        // Close the page
        window.close();
      } else {
        console.error('Error completing onboarding:', result.error);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  }
  
  /**
   * Update UI based on current step
   */
  function updateUI() {
    // Update step indicators
    const indicators = stepIndicators.querySelectorAll('.step-indicator');
    indicators.forEach(indicator => {
      const dot = indicator.querySelector('.step-dot');
      const label = indicator.querySelector('.step-label');
      
      if (indicator.dataset.stepId === currentStep.id) {
        dot.classList.add('active');
        label.classList.add('active');
      } else {
        dot.classList.remove('active');
        label.classList.remove('active');
      }
      
      if (self.onboardingManager.STEPS[indicator.dataset.stepId].order < self.onboardingManager.STEPS[currentStep.id].order) {
        dot.classList.add('completed');
      }
    });
    
    // Update progress bar
    const totalSteps = Object.keys(self.onboardingManager.STEPS).length - 1; // Exclude complete step
    const currentStepOrder = self.onboardingManager.STEPS[currentStep.id].order;
    const progress = ((currentStepOrder - 1) / (totalSteps - 1)) * 100;
    progressFill.style.width = `${progress}%`;
    
    // Update buttons
    btnBack.style.visibility = currentStep.id === 'welcome' ? 'hidden' : 'visible';
    btnSkip.style.display = currentStep.id === 'complete' ? 'none' : 'block';
    btnNext.textContent = currentStep.id === 'complete' ? 'Finish' : 'Next';
  }
});
