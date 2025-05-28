/**
 * Trackcrastinate - Password Reset Utility
 * 
 * This module provides password reset functionality for the extension.
 */

// Function to initiate password reset
async function initiatePasswordReset(email) {
  try {
    if (!email) {
      throw new Error('Email is required');
    }
    
    const client = await window.supabaseModule.app;
    
    // Get the current origin for the redirect URL
    const origin = chrome.runtime.getURL('');
    const redirectUrl = `${origin}options/options.html?reset=true`;
    
    // Call Supabase to send password reset email
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send password reset email' 
    };
  }
}

// Function to update password after reset
async function updatePassword(newPassword) {
  try {
    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    const client = await window.supabaseModule.app;
    
    // Update the user's password
    const { error } = await client.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Password update error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update password' 
    };
  }
}

// Export functions
window.passwordResetModule = {
  initiatePasswordReset,
  updatePassword
};
