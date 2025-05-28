/**
 * Trackcrastinate - Supabase Module (Fixed)
 * 
 * This module provides integration with Supabase for authentication and data storage.
 * It provides the same interface as the Firebase implementation for compatibility.
 * Fixed to use correct column names that match the dashboard expectations.
 */

// Make the module available globally
self.supabaseModule = {};

// Supabase configuration
var supabaseUrl = 'https://ykpjjpgoteqxqzzrsxue.supabase.co';
var supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcGpqcGdvdGVxeHF6enJzeHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1OTEyNzQsImV4cCI6MjA2MzE2NzI3NH0.fCpZRCJUQrTOcfM4Qhp-AqO1yG-RK_VvTBo6cPL_WZE';

// Collection references (table names)
var usersCollection = 'users';
var timeEntriesCollection = 'time_entries';
var dailySummariesCollection = 'daily_summaries';

// Default user settings
var DEFAULT_USER_SETTINGS = {
  timeLimit: 60, // 60 minutes per day
  roastLevel: 'medium',
  shareStats: false,
  offlineMode: false
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

// Create a more robust mock Supabase client for service worker environment
function loadSupabaseClient() {
  return new Promise((resolve, reject) => {
    try {
      console.log('Creating enhanced mock Supabase client');
      
      // In-memory storage for mock data
      const mockStorage = {
        users: {},
        time_entries: [],
        daily_summaries: {},
        auth: {
          currentUser: null,
          sessions: {}
        }
      };
      
      // Generate a unique ID
      const generateId = () => 'mock-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      
      // Create a mock Supabase client with the necessary methods
      const mockSupabase = {
        auth: {
          signInWithPassword: async function(credentials) {
            console.log('Mock signInWithPassword called with:', credentials);
            try {
              // Check if user exists in mock storage
              const userId = Object.keys(mockStorage.users).find(id => 
                mockStorage.users[id].email === credentials.email
              );
              
              if (!userId) {
                return { 
                  data: null, 
                  error: { message: 'User not found' } 
                };
              }
              
              const user = mockStorage.users[userId];
              const sessionId = generateId();
              
              // Create a session
              mockStorage.auth.currentUser = user;
              mockStorage.auth.sessions[sessionId] = {
                user,
                created_at: new Date().toISOString(),
                access_token: 'mock-token-' + sessionId
              };
              
              return { 
                data: { 
                  user, 
                  session: mockStorage.auth.sessions[sessionId]
                },
                error: null
              };
            } catch (error) {
              console.error('Error in mock signInWithPassword:', error);
              return { data: null, error: { message: error.message } };
            }
          },
          signUp: async function(credentials) {
            console.log('Mock signUp called with:', credentials);
            try {
              // Check if user already exists
              const existingUser = Object.values(mockStorage.users).find(user => 
                user.email === credentials.email
              );
              
              if (existingUser) {
                return { 
                  data: null, 
                  error: { message: 'User already exists' } 
                };
              }
              
              // Create new user
              const userId = generateId();
              const user = { 
                id: userId, 
                email: credentials.email,
                created_at: new Date().toISOString()
              };
              
              mockStorage.users[userId] = user;
              mockStorage.auth.currentUser = user;
              
              return { 
                data: { user }, 
                error: null 
              };
            } catch (error) {
              console.error('Error in mock signUp:', error);
              return { data: null, error: { message: error.message } };
            }
          },
          signInWithOAuth: async function(options) {
            console.log('Mock signInWithOAuth called with:', options);
            // In a real environment, this would redirect to OAuth provider
            return { data: null, error: null };
          },
          signOut: async function() {
            console.log('Mock signOut called');
            try {
              mockStorage.auth.currentUser = null;
              return { error: null };
            } catch (error) {
              console.error('Error in mock signOut:', error);
              return { error: { message: error.message } };
            }
          },
          getSession: async function() {
            console.log('Mock getSession called');
            try {
              if (!mockStorage.auth.currentUser) {
                return { data: null, error: null };
              }
              
              // Find the first session for the current user
              const sessionId = Object.keys(mockStorage.auth.sessions).find(id => 
                mockStorage.auth.sessions[id].user.id === mockStorage.auth.currentUser.id
              );
              
              if (!sessionId) {
                return { data: null, error: null };
              }
              
              return { 
                data: { 
                  session: mockStorage.auth.sessions[sessionId] 
                }, 
                error: null 
              };
            } catch (error) {
              console.error('Error in mock getSession:', error);
              return { data: null, error: { message: error.message } };
            }
          },
          onAuthStateChange: function(callback) {
            console.log('Mock onAuthStateChange called');
            // Call the callback immediately with the current auth state
            if (mockStorage.auth.currentUser) {
              setTimeout(function() {
                callback('SIGNED_IN', { user: mockStorage.auth.currentUser });
              }, 0);
            }
            
            return { 
              data: { 
                subscription: { 
                  unsubscribe: function() {
                    console.log('Mock auth subscription unsubscribed');
                  } 
                } 
              } 
            };
          }
        },
        from: function(table) {
          return {
            select: function(columns = '*') {
              return {
                eq: function(field, value) {
                  return {
                    single: async function() {
                      console.log(`Mock select from ${table} where ${field} = ${value}`);
                      try {
                        if (table === 'users' && field === 'id') {
                          return { 
                            data: mockStorage.users[value] || null, 
                            error: null 
                          };
                        } else if (table === 'daily_summaries') {
                          const key = `${value}_${field}`;
                          return { 
                            data: mockStorage.daily_summaries[key] || null, 
                            error: null 
                          };
                        }
                        return { data: null, error: null };
                      } catch (error) {
                        console.error(`Error in mock select from ${table}:`, error);
                        return { data: null, error: { message: error.message } };
                      }
                    }
                  };
                },
                neq: function(field, value) { return this; },
                gt: function(field, value) { return this; },
                gte: function(field, value) { return this; },
                lt: function(field, value) { return this; },
                lte: function(field, value) { return this; },
                contains: function(field, value) { return this; },
                single: async function() {
                  console.log(`Mock select from ${table}`);
                  return { data: null, error: null };
                }
              };
            },
            insert: function(data) {
              return {
                select: function(returnColumns = '*') {
                  return {
                    single: async function() {
                      console.log(`Mock insert into ${table}:`, data);
                      try {
                        const id = data.id || generateId();
                        
                        if (table === 'users') {
                          mockStorage.users[id] = { ...data, id };
                          return { data: { id }, error: null };
                        } else if (table === 'time_entries') {
                          const entry = { ...data, id };
                          mockStorage.time_entries.push(entry);
                          return { data: { id }, error: null };
                        } else if (table === 'daily_summaries') {
                          const key = data.id || `${data.user_id}_${data.date}`;
                          mockStorage.daily_summaries[key] = { ...data, id: key };
                          return { data: { id: key }, error: null };
                        }
                        
                        return { data: { id }, error: null };
                      } catch (error) {
                        console.error(`Error in mock insert into ${table}:`, error);
                        return { data: null, error: { message: error.message } };
                      }
                    }
                  };
                }
              };
            },
            update: function(data) {
              return {
                eq: function(field, value) {
                  return {
                    single: async function() {
                      console.log(`Mock update ${table} where ${field} = ${value}:`, data);
                      try {
                        if (table === 'users' && field === 'id') {
                          if (mockStorage.users[value]) {
                            mockStorage.users[value] = { ...mockStorage.users[value], ...data };
                            return { data: mockStorage.users[value], error: null };
                          }
                        } else if (table === 'daily_summaries') {
                          const key = `${value}_${field}`;
                          if (mockStorage.daily_summaries[key]) {
                            mockStorage.daily_summaries[key] = { ...mockStorage.daily_summaries[key], ...data };
                            return { data: mockStorage.daily_summaries[key], error: null };
                          }
                        }
                        
                        return { data: null, error: null };
                      } catch (error) {
                        console.error(`Error in mock update ${table}:`, error);
                        return { data: null, error: { message: error.message } };
                      }
                    }
                  };
                }
              };
            },
            upsert: function(data) {
              console.log(`Mock upsert into ${table}:`, data);
              try {
                const id = data.id || generateId();
                
                if (table === 'users') {
                  mockStorage.users[id] = { ...mockStorage.users[id] || {}, ...data, id };
                } else if (table === 'time_entries') {
                  // Find existing entry or add new one
                  const existingIndex = mockStorage.time_entries.findIndex(entry => entry.id === id);
                  if (existingIndex >= 0) {
                    mockStorage.time_entries[existingIndex] = { ...mockStorage.time_entries[existingIndex], ...data };
                  } else {
                    mockStorage.time_entries.push({ ...data, id });
                  }
                } else if (table === 'daily_summaries') {
                  const key = data.id || `${data.user_id}_${data.date}`;
                  mockStorage.daily_summaries[key] = { ...mockStorage.daily_summaries[key] || {}, ...data, id: key };
                }
                
                return { data: { id }, error: null };
              } catch (error) {
                console.error(`Error in mock upsert into ${table}:`, error);
                return { error: { message: error.message } };
              }
            }
          };
        }
      };
      
      self.supabase = mockSupabase;
      console.log('Enhanced mock Supabase client created successfully');
      resolve(mockSupabase);
    } catch (error) {
      console.error('Error setting up Supabase client:', error);
      reject(error);
    }
  });
}

// Initialize Supabase client
var supabaseClientPromise = loadSupabaseClient();

// Supabase client wrapper with Firebase-compatible interface
var supabase = {
  auth: {
    // Current user state
    currentUser: null,
    
    // Sign in with email and password
    signInWithEmailAndPassword: async function(email, password, rememberMe = false) {
      try {
        const client = await supabaseClientPromise;
        
        // Configure session based on rememberMe preference
        const sessionOptions = {
          // If rememberMe is true, set a longer expiration (30 days)
          // Otherwise, use the default (1 day)
          expiresIn: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24
        };
        
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password,
          options: sessionOptions
        });
        
        if (error) throw error;
        
        // Store rememberMe preference for future sessions
        chrome.storage.local.set({ rememberMe: rememberMe });
        
        // Convert Supabase user to Firebase-like format
        const user = {
          uid: data.user.id,
          email: data.user.email,
          displayName: data.user.email.split('@')[0],
          metadata: {
            creationTime: data.user.created_at,
            lastSignInTime: new Date().toISOString()
          }
        };
        
        supabase.auth.currentUser = user;
        return { user };
      } catch (error) {
        console.error('Error signing in with email:', error);
        throw error;
      }
    },
    
    // Create user with email and password
    createUserWithEmailAndPassword: async function(email, password) {
      try {
        const client = await supabaseClientPromise;
        const { data, error } = await client.auth.signUp({
          email,
          password
        });
        
        if (error) throw error;
        
        // Convert Supabase user to Firebase-like format
        const user = {
          uid: data.user.id,
          email: data.user.email,
          displayName: data.user.email.split('@')[0],
          metadata: {
            creationTime: data.user.created_at,
            lastSignInTime: new Date().toISOString()
          }
        };
        
        supabase.auth.currentUser = user;
        
        // Create initial user document
        await createUserDocument(user.uid);
        
        return { user };
      } catch (error) {
        console.error('Error creating user with email:', error);
        throw error;
      }
    },
    
    // Sign in with Google
    signInWithPopup: async function(provider) {
      try {
        const client = await supabaseClientPromise;
        const { data, error } = await client.auth.signInWithOAuth({
          provider: 'google'
        });
        
        if (error) throw error;
        
        // This will redirect to Google, so we won't have user data immediately
        // The user will be handled by onAuthStateChanged after redirect
        return { user: null };
      } catch (error) {
        console.error('Error signing in with Google:', error);
        throw error;
      }
    },
    
    // Sign out
    signOut: async function() {
      try {
        const client = await supabaseClientPromise;
        const { error } = await client.auth.signOut();
        
        if (error) throw error;
        
        supabase.auth.currentUser = null;
        return { success: true };
      } catch (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    },
    
    // Auth state change listener
    onAuthStateChanged: function(callback) {
      let unsubscribe = null;
      
      supabaseClientPromise.then(client => {
        // Get current session
        client.auth.getSession().then(({ data }) => {
          if (data && data.session) {
            const user = {
              uid: data.session.user.id,
              email: data.session.user.email,
              displayName: data.session.user.email.split('@')[0],
              metadata: {
                creationTime: data.session.user.created_at,
                lastSignInTime: new Date().toISOString()
              }
            };
            
            supabase.auth.currentUser = user;
            callback(user);
          } else {
            supabase.auth.currentUser = null;
            callback(null);
          }
        });
        
        // Set up auth state change listener
        const { data } = client.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            const user = {
              uid: session.user.id,
              email: session.user.email,
              displayName: session.user.email.split('@')[0],
              metadata: {
                creationTime: session.user.created_at,
                lastSignInTime: new Date().toISOString()
              }
            };
            
            supabase.auth.currentUser = user;
            callback(user);
            
            // Create user document if it doesn't exist
            createUserDocument(user.uid);
          } else if (event === 'SIGNED_OUT') {
            supabase.auth.currentUser = null;
            callback(null);
          }
        });
        
        unsubscribe = data.subscription.unsubscribe;
      }).catch(error => {
        console.error('Error setting up auth state change listener:', error);
      });
      
      // Return unsubscribe function
      return function() {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  },
  
  // Firestore-like methods for compatibility
  collection: function(collectionName) {
    return {
      doc: function(docId) {
        return {
          get: async function() {
            try {
              const client = await supabaseClientPromise;
              const { data, error } = await client
                .from(collectionName)
                .select('*')
                .eq('id', docId)
                .single();
              
              if (error) throw error;
              
              return {
                exists: !!data,
                data: function() {
                  return data || null;
                }
              };
            } catch (error) {
              console.error(`Error getting document ${collectionName}/${docId}:`, error);
              return {
                exists: false,
                data: function() {
                  return null;
                }
              };
            }
          },
          set: async function(data) {
            try {
              const client = await supabaseClientPromise;
              const { error } = await client
                .from(collectionName)
                .upsert({ id: docId, ...data });
              
              if (error) throw error;
              
              return { success: true };
            } catch (error) {
              console.error(`Error setting document ${collectionName}/${docId}:`, error);
              throw error;
            }
          },
          update: async function(data) {
            try {
              const client = await supabaseClientPromise;
              const { error } = await client
                .from(collectionName)
                .update(data)
                .eq('id', docId);
              
              if (error) throw error;
              
              return { success: true };
            } catch (error) {
              console.error(`Error updating document ${collectionName}/${docId}:`, error);
              throw error;
            }
          }
        };
      },
      where: function(field, operator, value) {
        return {
          get: async function() {
            try {
              const client = await supabaseClientPromise;
              let query = client.from(collectionName).select('*');
              
              // Convert Firebase operators to Supabase
              switch (operator) {
                case '==':
                  query = query.eq(field, value);
                  break;
                case '!=':
                  query = query.neq(field, value);
                  break;
                case '>':
                  query = query.gt(field, value);
                  break;
                case '>=':
                  query = query.gte(field, value);
                  break;
                case '<':
                  query = query.lt(field, value);
                  break;
                case '<=':
                  query = query.lte(field, value);
                  break;
                case 'array-contains':
                  // This is a simplification, might need adjustment based on data structure
                  query = query.contains(field, [value]);
                  break;
                default:
                  throw new Error(`Operator ${operator} not supported`);
              }
              
              const { data, error } = await query;
              
              if (error) throw error;
              
              return {
                empty: !data || data.length === 0,
                docs: (data || []).map(doc => ({
                  id: doc.id,
                  data: function() {
                    return doc;
                  }
                }))
              };
            } catch (error) {
              console.error(`Error querying ${collectionName} where ${field} ${operator} ${value}:`, error);
              return {
                empty: true,
                docs: []
              };
            }
          }
        };
      },
      add: async function(data) {
        try {
          const client = await supabaseClientPromise;
          const { data: result, error } = await client
            .from(collectionName)
            .insert(data)
            .select('id')
            .single();
          
          if (error) throw error;
          
          return { id: result.id };
        } catch (error) {
          console.error(`Error adding document to ${collectionName}:`, error);
          throw error;
        }
      }
    };
  }
};

/**
 * Create a user document if it doesn't exist
 * @param {string} userId - The user's ID
 * @returns {Promise<void>}
 */
async function createUserDocument(userId) {
  try {
    const client = await supabaseClientPromise;
    
    // Check if user document exists
    const { data, error } = await client
      .from(usersCollection)
      .select('id')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
      throw error;
    }
    
    // If user document doesn't exist, create it
    if (!data) {
      const { error: insertError } = await client
        .from(usersCollection)
        .insert({
          id: userId,
          settings: DEFAULT_USER_SETTINGS,
          tracked_sites: DEFAULT_TRACKED_SITES,
          created_at: new Date().toISOString()
        });
      
      if (insertError) throw insertError;
      
      console.log('Created user document for', userId);
    }
  } catch (error) {
    console.error('Error creating user document:', error);
  }
}

// User data functions

/**
 * Get a user's settings
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - The user's settings
 */
async function getUserSettings(userId) {
  try {
    const client = await supabaseClientPromise;
    const { data, error } = await client
      .from(usersCollection)
      .select('settings')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return data && data.settings ? data.settings : DEFAULT_USER_SETTINGS;
  } catch (error) {
    console.error('Error getting user settings:', error);
    return DEFAULT_USER_SETTINGS;
  }
}

/**
 * Save a user's settings
 * @param {string} userId - The user's ID
 * @param {Object} settings - The settings to save
 * @returns {Promise<void>}
 */
async function saveUserSettings(userId, settings) {
  try {
    const client = await supabaseClientPromise;
    const { error } = await client
      .from(usersCollection)
      .update({ settings })
      .eq('id', userId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error saving user settings:', error);
    throw error;
  }
}

/**
 * Get a user's tracked sites
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} - The user's tracked sites
 */
async function getTrackedSites(userId) {
  try {
    const client = await supabaseClientPromise;
    const { data, error } = await client
      .from(usersCollection)
      .select('tracked_sites')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return data && data.tracked_sites ? data.tracked_sites : DEFAULT_TRACKED_SITES;
  } catch (error) {
    console.error('Error getting tracked sites:', error);
    return DEFAULT_TRACKED_SITES;
  }
}

/**
 * Save a user's tracked sites
 * @param {string} userId - The user's ID
 * @param {Array} sites - The sites to save
 * @returns {Promise<void>}
 */
async function saveTrackedSites(userId, sites) {
  try {
    const client = await supabaseClientPromise;
    const { error } = await client
      .from(usersCollection)
      .update({ tracked_sites: sites })
      .eq('id', userId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error saving tracked sites:', error);
    throw error;
  }
}

/**
 * Save a time entry - FIXED to use correct column names
 * @param {string} userId - The user's ID
 * @param {Object} timeEntry - The time entry to save
 * @returns {Promise<string>} - The ID of the created entry
 */
async function saveTimeEntry(userId, timeEntry) {
  try {
    const client = await supabaseClientPromise;
    
    // Map the data to use correct column names that match the dashboard expectations
    const entry = {
      user_id: userId,  // Use user_id instead of userId
      domain: timeEntry.domain,
      category: timeEntry.category || 'uncategorized',
      duration: timeEntry.duration,
      day: timeEntry.day,
      start_time: timeEntry.startTime,  // Use start_time instead of startTime
      end_time: timeEntry.endTime,      // Use end_time instead of endTime
      created_at: new Date().toISOString()  // Use created_at instead of createdAt
    };
    
    const { data, error } = await client
      .from(timeEntriesCollection)
      .insert(entry)
      .select('id')
      .single();
    
    if (error) throw error;
    
    return data.id;
  } catch (error) {
    console.error('Error saving time entry:', error);
    throw error;
  }
}

/**
 * Get a user's time entries for a specific day - FIXED to use correct column names
 * @param {string} userId - The user's ID
 * @param {string} day - The day in YYYY-MM-DD format
 * @returns {Promise<Array>} - Array of time entries
 */
async function getTimeEntriesForDay(userId, day) {
  try {
    const client = await supabaseClientPromise;
    const { data, error } = await client
      .from(timeEntriesCollection)
      .select('*')
      .eq('user_id', userId)  // Use user_id instead of userId
      .eq('day', day);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting time entries for day:', error);
    return [];
  }
}

/**
 * Get a user's daily summary - FIXED to use correct column names
 * @param {string} userId - The user's ID
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {Promise<Object>} - The daily summary
 */
async function getDailySummary(userId, date) {
  try {
    const client = await supabaseClientPromise;
    const { data, error } = await client
      .from(dailySummariesCollection)
      .select('*')
      .eq('user_id', userId)  // Use user_id instead of userId
      .eq('date', date)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
      throw error;
    }
    
    if (data) {
      // Convert back to Firebase-like format for compatibility
      return {
        id: data.id,
        userId: data.user_id,  // Convert back to userId
        date: data.date,
        totalTime: data.total_time || 0,
        siteBreakdown: data.site_breakdown || {},
        categoryBreakdown: data.category_breakdown || {}
      };
    }
    
    // If no summary exists, create one from time entries
    const entries = await getTimeEntriesForDay(userId, date);
    
    if (entries.length === 0) {
      return {
        id: `${userId}_${date}`,
        userId,
        date,
        totalTime: 0,
        siteBreakdown: {},
        categoryBreakdown: {}
      };
    }
    
    // Calculate summary from entries
    const siteBreakdown = {};
    const categoryBre
