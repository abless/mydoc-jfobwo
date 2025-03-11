/**
 * Validators Module Index
 * 
 * This module serves as a centralized export point for all validator functions and schemas
 * used throughout the application. It aggregates validation utilities from specific domain
 * modules (auth, chat, health, user) to provide a consistent interface for data validation.
 * 
 * By importing from this index, other modules can access all validation utilities without
 * needing to know their specific source files, promoting better code organization and maintainability.
 * 
 * The validators implement server-side validation with Joi to prevent malicious inputs
 * and ensure consistent validation logic across all API endpoints.
 */

// Authentication validators
export {
  validateLogin,
  validateSignup,
  validateLoginSchema,
  validateSignupSchema
} from './auth.validator';

// Chat validators
export {
  validateSendMessage,
  validateSendMessageSchema,
  validateGetChatHistorySchema,
  validateGetConversationsSchema,
  validateConversationIdSchema
} from './chat.validator';

// Health data validators
export {
  validateCreateHealthData,
  validateGetHealthData,
  validateHealthDataId,
  validateCreateHealthDataSchema,
  validateGetHealthDataSchema,
  validateHealthDataIdSchema
} from './health.validator';

// User validators
export {
  validateUserId,
  validateUserProfile,
  validateUserIdSchema,
  validateUserProfileSchema
} from './user.validator';