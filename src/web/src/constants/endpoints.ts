/**
 * API Endpoint Constants
 * 
 * This file defines API endpoint constants for the React Native mobile application,
 * providing a centralized location for all backend API route paths. This ensures
 * consistent endpoint references across the application and simplifies endpoint management.
 */

import { API_CONSTANTS } from './api.constants'; // Version: 1.0.0

/**
 * Base path for all API endpoints, constructed from base URL and API version
 */
const API_BASE_PATH = `${API_CONSTANTS.BASE_URL}/api/${API_CONSTANTS.VERSION}`;

/**
 * Object containing all API endpoint URLs organized by feature domain
 */
export const ENDPOINTS = {
  /**
   * Authentication-related endpoint URLs for login, signup, and token validation
   * Addresses F-001: User Authentication requirement
   */
  AUTH: {
    /**
     * Endpoint for user login with email and password
     */
    LOGIN: `${API_BASE_PATH}/authz/login`,
    
    /**
     * Endpoint for user registration with email and password
     */
    SIGNUP: `${API_BASE_PATH}/authz/signup`,
    
    /**
     * Endpoint for validating JWT tokens
     */
    VALIDATE: `${API_BASE_PATH}/authz/validate`,
  },
  
  /**
   * Health data-related endpoint URLs for creating, retrieving, updating, and deleting health records
   * Addresses F-002: Health Data Input and F-003: Health History Log requirements
   */
  HEALTH: {
    /**
     * Endpoint for retrieving all health records with filtering support
     */
    GET_ALL: `${API_BASE_PATH}/health`,
    
    /**
     * Endpoint for retrieving a specific health record by ID
     */
    GET_BY_ID: `${API_BASE_PATH}/health/:id`,
    
    /**
     * Endpoint for creating new health records
     */
    CREATE: `${API_BASE_PATH}/health`,
    
    /**
     * Endpoint for updating existing health records
     */
    UPDATE: `${API_BASE_PATH}/health/:id`,
    
    /**
     * Endpoint for deleting health records
     */
    DELETE: `${API_BASE_PATH}/health/:id`,
  },
  
  /**
   * Chat-related endpoint URLs for sending messages to LLM, retrieving conversations, and managing chat history
   * Addresses F-004: LLM Health Chat requirement
   */
  CHAT: {
    /**
     * Endpoint for sending a message to the LLM
     */
    SEND_MESSAGE: `${API_BASE_PATH}/chat/message`,
    
    /**
     * Endpoint for retrieving all user conversations
     */
    GET_CONVERSATIONS: `${API_BASE_PATH}/chat/conversations`,
    
    /**
     * Endpoint for creating a new conversation
     */
    CREATE_CONVERSATION: `${API_BASE_PATH}/chat/conversations`,
    
    /**
     * Endpoint for retrieving a specific conversation by ID
     */
    GET_CONVERSATION: `${API_BASE_PATH}/chat/conversations/:id`,
    
    /**
     * Endpoint for retrieving messages within a specific conversation
     */
    GET_MESSAGES: `${API_BASE_PATH}/chat/conversations/:id/messages`,
  },
  
  /**
   * User profile-related endpoint URLs for retrieving and updating user information
   * Addresses F-005: User Profile Management requirement
   */
  USER: {
    /**
     * Endpoint for retrieving current user profile information
     */
    CURRENT_USER: `${API_BASE_PATH}/users/me`,
    
    /**
     * Endpoint for updating user profile information
     */
    UPDATE_PROFILE: `${API_BASE_PATH}/users/me`,
  },
};