/**
 * Constants for AsyncStorage keys used throughout the application
 * This file centralizes all storage key definitions to ensure consistent usage
 * and prevent key collisions with other applications potentially using AsyncStorage.
 * 
 * @version 1.0.0
 */

/**
 * Prefix for all storage keys to avoid conflicts with other applications
 * This ensures a unique namespace for our application's storage keys
 */
export const STORAGE_PREFIX = 'health_advisor_';

/**
 * Object containing all storage key constants used throughout the application
 * This centralized approach makes it easier to maintain and prevent duplicated keys
 */
export const STORAGE_KEYS = {
  /**
   * Key for storing the JWT authentication token
   * Used for authenticating API requests to the backend
   */
  AUTH_TOKEN: `${STORAGE_PREFIX}auth_token`,

  /**
   * Key for storing the refresh token
   * Used to obtain a new JWT token when the current one expires without requiring re-login
   */
  REFRESH_TOKEN: `${STORAGE_PREFIX}refresh_token`,

  /**
   * Key for storing user profile information
   * Contains basic user data like email, user ID, etc.
   */
  USER_INFO: `${STORAGE_PREFIX}user_info`,

  /**
   * Key for storing user's theme preference
   * Can be 'light', 'dark', or 'system'
   */
  THEME_PREFERENCE: `${STORAGE_PREFIX}theme_preference`,

  /**
   * Key for tracking whether the user has completed onboarding
   * Used to determine whether to show onboarding screens
   */
  ONBOARDING_COMPLETED: `${STORAGE_PREFIX}onboarding_completed`,

  /**
   * Key for storing the timestamp of the last data synchronization
   * Used for determining what data needs to be synced with the backend
   */
  LAST_SYNC_TIMESTAMP: `${STORAGE_PREFIX}last_sync_timestamp`,
};