/**
 * Navigation route constants for the Health Advisor application.
 * This file centralizes all route names to ensure consistency 
 * and prevent typos across the application.
 */

/**
 * Constants for root navigation stack routes
 */
export const ROOT_ROUTES = {
  AUTH: 'Auth',
  MAIN: 'Main',
} as const;

/**
 * Constants for authentication stack routes
 */
export const AUTH_ROUTES = {
  LOGIN: 'Login',
  SIGNUP: 'Signup',
} as const;

/**
 * Constants for main bottom tab navigator routes
 */
export const MAIN_TAB_ROUTES = {
  CHAT: 'Chat',
  HEALTH_LOG: 'HealthLog',
  DATA_ENTRY: 'DataEntry',
  INSIGHTS: 'Insights',
  PROFILE: 'Profile',
} as const;

/**
 * Constants for data entry stack navigator routes
 */
export const DATA_ENTRY_ROUTES = {
  OPTIONS: 'DataEntryOptions',
  MEAL_ENTRY: 'MealEntry',
  LAB_RESULT_ENTRY: 'LabResultEntry',
  SYMPTOM_ENTRY: 'SymptomEntry',
} as const;

/**
 * Constants for health stack navigator routes
 */
export const HEALTH_ROUTES = {
  HEALTH_LOG: 'HealthLog',
  HEALTH_DATA_DETAIL: 'HealthDataDetail',
} as const;

/**
 * Grouped navigation route constants for export
 * Provides a single import point for all navigation constants
 */
export const NAVIGATION_ROUTES = {
  ROOT: ROOT_ROUTES,
  AUTH: AUTH_ROUTES,
  MAIN_TAB: MAIN_TAB_ROUTES,
  DATA_ENTRY: DATA_ENTRY_ROUTES,
  HEALTH: HEALTH_ROUTES,
} as const;