/**
 * Trackcrastinate - Focus Links Activity
 * 
 * This script handles the focus links functionality when users reach their time limit.
 * It allows users to view, add, open, and delete productive links they should be focusing on.
 */

// DOM Elements
const linksListElement = document.getElementById('links-list');
const emptyStateElement = document.getElementById('empty-state');
const linkTitleInput = document.getElementById('link-title');
const linkUrlInput = document.getElementById('link-url');
const addLinkButton = document.getElementById('add-link-btn');
const continueButton = document.getElementById('continue-btn');
const timerElement = document.getElementById('timer');

// State
let links = [];
let timerSeconds = 0;
let timerInterval;

// Constants
const REQUIRED_VIEW_TIME = 30; // Seconds required before continue button is enabled

/**
 * Initialize the focus links
 */
function initialize() {
  console.log('Focus Links initialized');
  
  // Load links from storage
  loadLinks();
  
  // Set up event listeners
  setupEventListeners();
  
  // Start timer
  startTimer();
}

/**
 * Load links from Chrome storage
 */
function loadLinks() {
  chrome.storage.local.get(['focusLinks'], function(result) {
    if (result.focusLinks && Array.isArray(result.focusLinks)) {
      links = result.focusLinks;
    } else {
      // Default links if none exist
      links = [
        { id: 1, title: 'Project Documentation', url: 'https://docs.google.com/document/d/project' },
        { id: 2, title: 'Company Dashboard', url: 'https://dashboard.company.com' },
        { id: 3, title: 'Work Email', url: 'https://mail.google.com' }
      ];
      
      // Save default links
      saveLinks();
    }
    
    // Render links
    renderLinks();
  });
}

/**
 * Save links to Chrome storage
 */
function saveLinks() {
  chrome.storage.local.set({ focusLinks: links }, function() {
    console.log('Links saved:', links.length);
  });
}

/**
 * Render links in the UI
 */
function renderLinks() {
  // Clear existing links (except empty state)
  const linkItems = linksListElement.querySelectorAll('.link-item');
  linkItems.forEach(item => item.remove());
  
  // Show/hide empty state
  if (links.length === 0) {
    emptyStateElement.style.display = 'block';
  } else {
    emptyStateElement.style.display = 'none';
    
    // Add each link to the list
    links.forEach(link => {
      const linkElement = createLinkElement(link);
      linksListElement.appendChild(linkElement);
    });
  }
}

/**
 * Create a link element
 * @param {Object} link - Link object
 * @returns {HTMLElement} Link element
 */
function createLinkElement(link) {
  const linkElement = document.createElement('div');
  linkElement.className = 'link-item';
  linkElement.dataset.id = link.id;
  
  const linkIcon = document.createElement('div');
  linkIcon.className = 'link-icon';
  linkIcon.innerHTML = '🔗';
  
  const linkContent = document.createElement('div');
  linkContent.className = 'link-content';
  
  const linkTitle = document.createElement('div');
  linkTitle.className = 'link-title';
  linkTitle.textContent = link.title;
  
  const linkUrl = document.createElement('div');
  linkUrl.className = 'link-url';
  linkUrl.textContent = link.url;
  
  linkContent.appendChild(linkTitle);
  linkContent.appendChild(linkUrl);
  
  const linkActions = document.createElement('div');
  linkActions.className = 'link-actions';
  
  const openButton = document.createElement('button');
  openButton.className = 'link-open';
  openButton.textContent = '↗️';
  openButton.title = 'Open Link';
  openButton.addEventListener('click', function() {
    openLink(link.url);
  });
  
  const deleteButton = document.createElement('button');
  deleteButton.className = 'link-delete';
  deleteButton.textContent = '×';
  deleteButton.title = 'Delete Link';
  deleteButton.addEventListener('click', function() {
    deleteLink(link.id);
  });
  
  linkActions.appendChild(openButton);
  linkActions.appendChild(deleteButton);
  
  linkElement.appendChild(linkIcon);
  linkElement.appendChild(linkContent);
  linkElement.appendChild(linkActions);
  
  return linkElement;
}

/**
 * Add a new link
 */
function addLink() {
  const title = linkTitleInput.value.trim();
  let url = linkUrlInput.value.trim();
  
  // Validate inputs
  if (!title) {
    alert('Please enter a title for the link');
    return;
  }
  
  if (!url) {
    alert('Please enter a URL');
    return;
  }
  
  // Add https:// if not present
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Create new link
  const newLink = {
    id: Date.now(), // Use timestamp as ID
    title: title,
    url: url
  };
  
  // Add to links array
  links.push(newLink);
  
  // Save links
  saveLinks();
  
  // Render links
  renderLinks();
  
  // Clear inputs
  linkTitleInput.value = '';
  linkUrlInput.value = '';
}

/**
 * Open a link in a new tab
 * @param {string} url - URL to open
 */
function openLink(url) {
  try {
    // Try to open in a new tab
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error opening link:', error);
    alert('Could not open link. Please check the URL and try again.');
  }
}

/**
 * Delete a link
 * @param {number} linkId - Link ID
 */
function deleteLink(linkId) {
  // Filter out the link
  links = links.filter(link => link.id !== linkId);
  
  // Save links
  saveLinks();
  
  // Render links
  renderLinks();
}

/**
 * Start the timer
 */
function startTimer() {
  // Disable continue button initially
  continueButton.disabled = true;
  
  // Start interval
  timerInterval = setInterval(function() {
    timerSeconds++;
    
    // Update timer display
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Enable continue button after required time
    if (timerSeconds >= REQUIRED_VIEW_TIME && continueButton.disabled) {
      continueButton.disabled = false;
    }
  }, 1000);
}

/**
 * Continue browsing
 */
function continueBrowsing() {
  // Clear timer
  clearInterval(timerInterval);
  
  // Notify parent window that activity is completed
  try {
    window.parent.postMessage({
      type: 'ACTIVITY_COMPLETED',
      activityType: 'focus-links'
    }, '*');
  } catch (error) {
    console.error('Error sending message to parent:', error);
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Add link button
  addLinkButton.addEventListener('click', addLink);
  
  // Enter key in inputs
  linkTitleInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      linkUrlInput.focus();
    }
  });
  
  linkUrlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addLink();
    }
  });
  
  // Continue button
  continueButton.addEventListener('click', continueBrowsing);
}

// Initialize when the page loads
window.addEventListener('load', initialize);
