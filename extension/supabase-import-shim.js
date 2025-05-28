/**
 * Trackcrastinate - Supabase Import Shim
 * 
 * This file serves as a bridge for importing Supabase modules in the extension.
 * It handles the module import paths to ensure proper access to Supabase functionality.
 * Modified for service worker environment.
 */

// Check if we're in a service worker context or a regular script context
console.log('Loading Supabase script');

try {
  // Check if we're in a service worker context (where importScripts is available)
  // or a regular script context (where we need to use a different approach)
  if (typeof importScripts === 'function') {
    // Service worker context
    console.log('Using importScripts in service worker context');
    importScripts('./supabase.js');
  } else {
    // Regular script context - supabase.js should be loaded via a script tag
    console.log('In regular script context, assuming supabase.js is loaded via script tag');
    // No need to do anything here as the script should be loaded via HTML
  }
  
  console.log('Supabase script loaded successfully');
  
  // Get the global object (self in service workers, window in regular scripts)
  const globalObj = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : {});
  
  // Make Supabase available globally
  if (!globalObj.supabase) {
    globalObj.supabase = globalObj.supabaseModule || {};
  }
  
  if (!globalObj.auth) {
    globalObj.auth = globalObj.supabase.auth || {};
  }
  
  if (!globalObj.db) {
    globalObj.db = globalObj.supabase.db || {};
  }
  
  if (!globalObj.app) {
    globalObj.app = globalObj.supabase.app || {};
  }
  
  // Set up default constants
  globalObj.DEFAULT_SETTINGS = {
    enableTracking: true,
    showNotifications: true,
    startAtLaunch: true,
    dailyLimit: 60, // 60 minutes per day
    enableDino: true,
    warningThreshold: 80, // 80% of time limit
    roastLevel: 'medium',
    darkMode: false,
    fontSize: 'medium',
    enableSync: true,
    offlineMode: false
  };
  
  globalObj.DEFAULT_TRACKED_SITES = [
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
  
  globalObj.DEFAULT_TIME_LIMIT = 60; // 60 minutes per day
  globalObj.DEFAULT_WARNING_THRESHOLD = 80; // 80% of time limit
  
  console.log('Trackcrastinate: Module import shim loaded successfully');
} catch (error) {
  console.error('Error loading Supabase import shim:', error);
}
