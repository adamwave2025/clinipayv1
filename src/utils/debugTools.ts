
/**
 * Debug tools for troubleshooting navigation and authentication issues
 */

// Debug flags that can be enabled via localStorage
export const DEBUG_FLAGS = {
  AUTH: 'DEBUG_AUTH',
  ROLES: 'DEBUG_ROLES',
  ROUTES: 'DEBUG_ROUTES',
  SETTINGS: 'DEBUG_SETTINGS',
  NOTIFICATIONS: 'DEBUG_NOTIFICATIONS'
};

/**
 * Enable a debug flag in localStorage
 */
export const enableDebugFlag = (flag: string): void => {
  try {
    localStorage.setItem(flag, 'true');
    console.log(`Debug flag ${flag} enabled`);
  } catch (e) {
    console.error(`Error enabling debug flag ${flag}:`, e);
  }
};

/**
 * Disable a debug flag in localStorage
 */
export const disableDebugFlag = (flag: string): void => {
  try {
    localStorage.removeItem(flag);
    console.log(`Debug flag ${flag} disabled`);
  } catch (e) {
    console.error(`Error disabling debug flag ${flag}:`, e);
  }
};

/**
 * Check if a debug flag is enabled
 */
export const isDebugFlagEnabled = (flag: string): boolean => {
  try {
    return localStorage.getItem(flag) === 'true';
  } catch (e) {
    console.error(`Error checking debug flag ${flag}:`, e);
    return false;
  }
};

/**
 * Clear auth-related caches
 * Useful when troubleshooting authentication issues
 */
export const clearAuthCaches = (): void => {
  try {
    // Clear role cache
    localStorage.removeItem('user_role_cache');
    localStorage.removeItem('user_role_cache_user');
    localStorage.removeItem('user_role_cache_expiry');
    
    // Clear clinic ID cache
    localStorage.removeItem('user_clinic_id');
    localStorage.removeItem('user_clinic_id_expiry');
    
    console.log('Auth caches cleared successfully');
  } catch (e) {
    console.error('Error clearing auth caches:', e);
  }
};

/**
 * Enable all debug flags
 */
export const enableAllDebugFlags = (): void => {
  Object.values(DEBUG_FLAGS).forEach(flag => enableDebugFlag(flag));
  console.log('All debug flags enabled');
};

/**
 * Disable all debug flags
 */
export const disableAllDebugFlags = (): void => {
  Object.values(DEBUG_FLAGS).forEach(flag => disableDebugFlag(flag));
  console.log('All debug flags disabled');
};

/**
 * Print the current state of all debug flags to console
 */
export const printDebugFlags = (): void => {
  console.group('Debug Flags Status:');
  Object.values(DEBUG_FLAGS).forEach(flag => {
    console.log(`${flag}: ${isDebugFlagEnabled(flag) ? 'Enabled' : 'Disabled'}`);
  });
  console.groupEnd();
};

/**
 * Run this function to enable debugging mode
 * Will activate all debug flags and clear caches
 */
export const troubleshootNavigationIssues = (): void => {
  enableAllDebugFlags();
  clearAuthCaches();
  console.log('%cNavigation troubleshooting mode enabled', 'color: green; font-weight: bold');
  console.log('Please refresh the page to see detailed debug logs');
  console.log('You may need to sign out and sign back in for all changes to take effect');
};

// Export the troubleshooting function as a global for easy access from console
if (typeof window !== 'undefined') {
  // @ts-ignore - Adding property to window
  window.troubleshootNavigationIssues = troubleshootNavigationIssues;
  // @ts-ignore - Adding property to window
  window.clearAuthCaches = clearAuthCaches;
}
