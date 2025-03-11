/**
 * Application Configuration Constants
 * 
 * This file defines application-wide configuration constants for the React Native 
 * mobile application, including environment detection, app metadata, authentication 
 * settings, and feature-specific configurations.
 */

import { Platform } from 'react-native'; // react-native version 0.71+

// ==========================================
// Global Constants
// ==========================================
export const APP_VERSION = '1.0.0';
export const IS_DEV = process.env.NODE_ENV !== 'production';
export const IS_IOS = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';

// ==========================================
// App Configuration
// ==========================================
export const APP_CONFIG = {
  /**
   * Application name
   */
  APP_NAME: 'Health Advisor',
  
  /**
   * Application version
   */
  APP_VERSION,
  
  /**
   * Whether the app is running in development mode
   */
  IS_DEV,
  
  /**
   * Whether the app is running on iOS
   */
  IS_IOS,
  
  /**
   * Whether the app is running on Android
   */
  IS_ANDROID,
  
  /**
   * API endpoint for backend services
   */
  API_BASE_URL: IS_DEV
    ? 'http://localhost:3000/api'
    : 'https://api.healthadvisor.com/api'
};

// ==========================================
// Authentication Configuration
// ==========================================
export const AUTH_CONFIG = {
  /**
   * Minimum password length required for signup
   * Matches F-001-RQ-001 password security requirements
   */
  MIN_PASSWORD_LENGTH: 8,
  
  /**
   * AsyncStorage key for storing authentication token
   */
  TOKEN_STORAGE_KEY: '@HealthAdvisor:token',
  
  /**
   * AsyncStorage key for storing user data
   */
  USER_STORAGE_KEY: '@HealthAdvisor:user',
  
  /**
   * Time in milliseconds before token expiration to trigger token refresh
   * Set to 5 minutes (300,000 ms)
   */
  TOKEN_EXPIRATION_BUFFER: 300000,
  
  /**
   * Maximum number of failed login attempts before temporary lockout
   * Based on F-001-RQ-002 business rules
   */
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  
  /**
   * Duration of account lockout after exceeding failed login attempts (in milliseconds)
   * Set to 30 minutes (1,800,000 ms)
   */
  ACCOUNT_LOCKOUT_DURATION: 1800000
};

// ==========================================
// Chat Configuration
// ==========================================
export const CHAT_CONFIG = {
  /**
   * Maximum number of messages to store in chat history
   */
  MAX_CHAT_MESSAGES: 100,
  
  /**
   * Default number of tokens in the context window for LLM
   * Based on technical specification for LLM integration (8K-16K tokens)
   */
  DEFAULT_CHAT_CONTEXT_WINDOW: 8192,
  
  /**
   * Delay before showing typing indicator (in milliseconds)
   */
  TYPING_INDICATOR_DELAY: 500,
  
  /**
   * Maximum length of a message that can be sent to the LLM
   * Based on F-004-RQ-001 validation rules
   */
  MAX_MESSAGE_LENGTH: 500,
  
  /**
   * Default message to show when LLM service is unavailable
   */
  SERVICE_UNAVAILABLE_MESSAGE: 'I apologize, but I am currently unavailable. Please try again later.',
  
  /**
   * Maximum response time to wait for LLM before showing timeout message (in milliseconds)
   * Set to 10 seconds (10,000 ms) based on critical threshold in performance requirements
   */
  MAX_RESPONSE_TIME: 10000
};

// ==========================================
// Health Data Configuration
// ==========================================
export const HEALTH_DATA_CONFIG = {
  /**
   * Maximum image size in bytes (10MB)
   * Matches technical constraint for health data input
   */
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,
  
  /**
   * Supported image formats for health data
   * Based on F-002-RQ-001 and F-002-RQ-002 data requirements
   */
  SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png'],
  
  /**
   * Maximum duration for voice recording in seconds (2 minutes)
   * Matches F-002-RQ-003 business rules for recording length
   */
  MAX_VOICE_RECORDING_DURATION: 120,
  
  /**
   * Default number of items to load per page in health log
   * Based on F-003-RQ-001 performance criteria
   */
  DEFAULT_ITEMS_PER_PAGE: 20,
  
  /**
   * Types of health data the app supports
   * Based on F-002 health data management requirements
   */
  HEALTH_DATA_TYPES: {
    MEAL: 'meal',
    LAB_RESULT: 'labResult',
    SYMPTOM: 'symptom'
  },
  
  /**
   * Default date format for displaying dates in the health log
   */
  DEFAULT_DATE_FORMAT: 'MMM DD, YYYY'
};

// ==========================================
// UI Configuration
// ==========================================
export const UI_CONFIG = {
  /**
   * Standard animation duration in milliseconds
   */
  ANIMATION_DURATION: 300,
  
  /**
   * Debounce delay for search inputs in milliseconds
   */
  DEBOUNCE_DELAY: 500,
  
  /**
   * Duration for toast messages in milliseconds
   */
  TOAST_DURATION: 3000,
  
  /**
   * Minimum touch target size for accessibility (in points)
   * Follows accessibility guidelines of 44x44 points
   */
  MIN_TOUCH_TARGET_SIZE: 44,
  
  /**
   * Default pagination limit for lists
   */
  DEFAULT_PAGE_SIZE: 20,
  
  /**
   * Timeout for showing loading indicator (in milliseconds)
   */
  LOADING_INDICATOR_TIMEOUT: 500
};