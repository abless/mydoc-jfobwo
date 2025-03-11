/**
 * Controllers Index Module
 * 
 * This module aggregates and re-exports all controller modules for the Health Advisor
 * backend application. It serves as a central point of access for all controller functions,
 * making them available to the route definitions.
 * 
 * @module controllers
 */

// Import authentication controller functions
import {
  signupHandler,
  loginHandler,
  validateSignup,
  validateLogin,
  authenticateToken
} from './auth.controller';

// Import chat controller functions
import {
  handleSendMessage,
  handleGetConversations,
  handleCreateConversation,
  handleGetConversation,
  handleGetChatHistory
} from './chat.controller';

// Import health data controller class
import { HealthController } from './health.controller';

// Import user controller namespace
import { UserController } from './user.controller';

/**
 * Authentication controller namespace
 * Provides functions for user registration, login, and token validation
 */
export const AuthController = {
  signupHandler,
  loginHandler,
  validateSignup,
  validateLogin,
  authenticateToken
};

/**
 * Chat controller namespace
 * Provides functions for LLM interactions and conversation management
 */
export const ChatController = {
  handleSendMessage,
  handleGetConversations,
  handleCreateConversation,
  handleGetConversation,
  handleGetChatHistory
};

// Re-export HealthController class
export { HealthController };

// Re-export UserController namespace
export { UserController };