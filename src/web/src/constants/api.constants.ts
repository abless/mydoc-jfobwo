/**
 * API Constants
 * 
 * This file defines API-related constants for the React Native mobile application,
 * including base URL, API version, timeout settings, retry configuration, and default headers.
 * These constants are used throughout the application for consistent API communication with the backend.
 */

import { APP_CONFIG } from './config'; // Version: 1.0.0

// API endpoint URLs for different environments
const DEV_API_URL = 'http://localhost:3000';
const PROD_API_URL = 'https://api.healthadvisor.com';

/**
 * Core API configuration constants used throughout the application for API requests
 */
export const API_CONSTANTS = {
  /**
   * Base URL for API requests
   * Determined based on environment (development or production)
   */
  BASE_URL: APP_CONFIG.IS_DEV ? DEV_API_URL : PROD_API_URL,

  /**
   * API version
   */
  VERSION: 'v1',

  /**
   * Default timeout for API requests in milliseconds
   * Set to 30 seconds based on performance requirements
   */
  TIMEOUT: 30000,

  /**
   * Number of times to retry a failed request before giving up
   */
  RETRY_COUNT: 3,

  /**
   * Delay between retry attempts in milliseconds
   * Implements exponential backoff starting with this base value
   */
  RETRY_DELAY: 1000,

  /**
   * Default headers to include with all API requests
   */
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': APP_CONFIG.APP_VERSION,
  },
  
  /**
   * API endpoints for various features
   */
  ENDPOINTS: {
    // Authentication endpoints (F-001: User Authentication)
    AUTH: {
      SIGNUP: '/api/authz/signup',
      LOGIN: '/api/authz/login',
      REFRESH: '/api/authz/refresh',
    },

    // Health data endpoints (F-002: Health Data Input, F-003: Health History Log)
    HEALTH: {
      BASE: '/api/health',
      DETAIL_PREFIX: '/api/health/', // For constructing detail URLs like `/api/health/${id}`
    },

    // Chat endpoints (F-004: LLM Health Chat)
    CHAT: {
      BASE: '/api/chat',
      CONVERSATION_PREFIX: '/api/chat/', // For constructing conversation URLs like `/api/chat/${id}`
    },

    // User profile endpoints (F-005: User Profile Management)
    PROFILE: {
      BASE: '/api/profile',
    },
  },
};

/**
 * HTTP status code constants for consistent status code handling
 */
export const HTTP_STATUS = {
  /**
   * Successful response (200)
   */
  OK: 200,
  
  /**
   * Resource created successfully (201)
   */
  CREATED: 201,
  
  /**
   * Bad request due to client error (400)
   */
  BAD_REQUEST: 400,
  
  /**
   * Unauthenticated access attempt (401)
   */
  UNAUTHORIZED: 401,
  
  /**
   * Authenticated but unauthorized access attempt (403)
   */
  FORBIDDEN: 403,
  
  /**
   * Resource not found (404)
   */
  NOT_FOUND: 404,
  
  /**
   * Server error (500)
   */
  INTERNAL_SERVER_ERROR: 500,
  
  /**
   * Service temporarily unavailable (503)
   */
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Standard error messages for API-related errors
 */
export const ERROR_MESSAGES = {
  /**
   * Error message for network connectivity issues
   */
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
  
  /**
   * Error message when a request times out
   */
  TIMEOUT_ERROR: 'The request took too long to complete. Please try again later.',
  
  /**
   * Error message for authentication failures
   */
  AUTHENTICATION_ERROR: 'Your session has expired or is invalid. Please log in again.',
  
  /**
   * Error message for server-side errors
   */
  SERVER_ERROR: 'Something went wrong on our end. We\'re working to fix the issue. Please try again later.',
  
  /**
   * Error message for LLM service unavailability
   */
  LLM_SERVICE_ERROR: 'The AI health advisor is temporarily unavailable. Please try again later.',
};