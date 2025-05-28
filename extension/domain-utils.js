/**
 * Trackcrastinate - Domain Utilities
 * 
 * This module provides utilities for working with domains, including
 * extraction, validation, and checking if a domain should be tracked.
 */

// Create domainUtils object in global scope
self.domainUtils = {};

/**
 * Extract domain from a URL
 * @param {string} url - The URL to extract domain from
 * @returns {string} The extracted domain or empty string if invalid
 */
function extractDomain(url) {
  if (!url) return '';
  
  try {
    // Handle URLs without protocol
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
      url = 'https://' + url;
    }
    
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error('Error extracting domain:', error);
    return '';
  }
}

/**
 * Check if a domain is valid
 * @param {string} domain - The domain to validate
 * @returns {boolean} Whether the domain is valid
 */
function isValidDomain(domain) {
  if (!domain) return false;
  
  // Simple validation: must contain at least one dot and no spaces
  return domain.includes('.') && !domain.includes(' ');
}

/**
 * Check if a domain should be tracked based on the tracked sites list
 * @param {string} domain - The domain to check
 * @param {Array} trackedSites - The list of tracked sites
 * @returns {boolean} Whether the domain should be tracked
 */
function isTrackedDomain(domain, trackedSites) {
  if (!domain || !Array.isArray(trackedSites) || trackedSites.length === 0) {
    return false;
  }
  
  // Normalize domain for comparison
  const normalizedDomain = domain.toLowerCase();
  
  return trackedSites.some(site => {
    if (!site) return false;
    
    if (typeof site === 'string') {
      const siteDomain = site.toLowerCase();
      // Check if domain exactly matches or is a subdomain of the tracked site
      return normalizedDomain === siteDomain || 
             normalizedDomain.endsWith('.' + siteDomain);
    }
    
    if (typeof site === 'object' && site.domain) {
      const siteDomain = site.domain.toLowerCase();
      // Check if domain exactly matches or is a subdomain of the tracked site
      return normalizedDomain === siteDomain || 
             normalizedDomain.endsWith('.' + siteDomain);
    }
    
    return false;
  });
}

/**
 * Get site info for a domain from the tracked sites list
 * @param {string} domain - The domain to get info for
 * @param {Array} trackedSites - The list of tracked sites
 * @returns {Object|null} The site info or null if not found
 */
function getSiteInfo(domain, trackedSites) {
  if (!domain || !Array.isArray(trackedSites) || trackedSites.length === 0) {
    return null;
  }
  
  // Normalize domain for comparison
  const normalizedDomain = domain.toLowerCase();
  
  for (const site of trackedSites) {
    if (!site) continue;
    
    if (typeof site === 'string') {
      const siteDomain = site.toLowerCase();
      // Check if domain exactly matches or is a subdomain of the tracked site
      if (normalizedDomain === siteDomain || normalizedDomain.endsWith('.' + siteDomain)) {
        return { domain: site, category: categorizeDomain(domain) };
      }
    }
    
    if (typeof site === 'object' && site.domain) {
      const siteDomain = site.domain.toLowerCase();
      // Check if domain exactly matches or is a subdomain of the tracked site
      if (normalizedDomain === siteDomain || normalizedDomain.endsWith('.' + siteDomain)) {
        return site;
      }
    }
  }
  
  return null;
}

/**
 * Categorize a domain based on common patterns
 * @param {string} domain - The domain to categorize
 * @returns {string} The category
 */
function categorizeDomain(domain) {
  if (!domain) return 'uncategorized';
  
  // Normalize domain for comparison
  const normalizedDomain = domain.toLowerCase();
  
  // Social media sites
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
  
  // Entertainment sites
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
  
  // Shopping sites
  if (normalizedDomain === 'amazon.com' || normalizedDomain.endsWith('.amazon.com') ||
      normalizedDomain === 'ebay.com' || normalizedDomain.endsWith('.ebay.com') ||
      normalizedDomain === 'etsy.com' || normalizedDomain.endsWith('.etsy.com') ||
      normalizedDomain === 'walmart.com' || normalizedDomain.endsWith('.walmart.com') ||
      normalizedDomain === 'target.com' || normalizedDomain.endsWith('.target.com') ||
      normalizedDomain === 'bestbuy.com' || normalizedDomain.endsWith('.bestbuy.com')) {
    return 'shopping';
  }
  
  // News sites
  if (normalizedDomain === 'cnn.com' || normalizedDomain.endsWith('.cnn.com') ||
      normalizedDomain === 'bbc.com' || normalizedDomain.endsWith('.bbc.com') ||
      normalizedDomain === 'nytimes.com' || normalizedDomain.endsWith('.nytimes.com') ||
      normalizedDomain === 'washingtonpost.com' || normalizedDomain.endsWith('.washingtonpost.com') ||
      normalizedDomain === 'foxnews.com' || normalizedDomain.endsWith('.foxnews.com') ||
      normalizedDomain.includes('news')) {
    return 'news';
  }
  
  // Sports sites
  if (normalizedDomain === 'espn.com' || normalizedDomain.endsWith('.espn.com') ||
      normalizedDomain === 'nba.com' || normalizedDomain.endsWith('.nba.com') ||
      normalizedDomain === 'nfl.com' || normalizedDomain.endsWith('.nfl.com') ||
      normalizedDomain === 'mlb.com' || normalizedDomain.endsWith('.mlb.com') ||
      normalizedDomain === 'nhl.com' || normalizedDomain.endsWith('.nhl.com') ||
      normalizedDomain.includes('sports')) {
    return 'sports';
  }
  
  // Default
  return 'uncategorized';
}

// Expose functions to the global domainUtils object
self.domainUtils.extractDomain = extractDomain;
self.domainUtils.isValidDomain = isValidDomain;
self.domainUtils.isTrackedDomain = isTrackedDomain;
self.domainUtils.getSiteInfo = getSiteInfo;
self.domainUtils.categorizeDomain = categorizeDomain;
