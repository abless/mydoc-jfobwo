/**
 * Middleware Index Module
 * 
 * This module centralizes and re-exports all middleware components used in the
 * Health Advisor Express backend application. It provides a single import point
 * for middleware functionality throughout the application, making it easier to
 * manage and use middleware consistently.
 * 
 * @module middlewares/index
 */

// Authentication middleware - JWT token verification and user extraction
import { 
  authenticate, 
  optionalAuthenticate 
} from './auth.middleware';

// Error handling middleware - Centralized error processing
import { 
  errorMiddleware, 
  notFoundMiddleware, 
  uncaughtExceptionHandler, 
  unhandledRejectionHandler 
} from './error.middleware';

// File upload middleware - Processing different types of file uploads
import { 
  imageUpload, 
  audioUpload, 
  documentUpload, 
  healthDataUpload, 
  handleUploadError 
} from './file.middleware';

// Rate limiting middleware - Preventing API abuse
import { 
  rateLimitMiddleware, 
  authRateLimitMiddleware, 
  chatRateLimitMiddleware, 
  createRateLimitMiddleware 
} from './rate-limit.middleware';

// Request validation middleware - Schema-based validation using Joi
import { 
  validate, 
  validateBody, 
  validateQuery, 
  validateParams 
} from './validation.middleware';

// Re-export all middleware components for convenient imports
export {
  // Authentication middleware
  authenticate,
  optionalAuthenticate,
  
  // Error handling middleware
  errorMiddleware,
  notFoundMiddleware,
  uncaughtExceptionHandler,
  unhandledRejectionHandler,
  
  // File upload middleware
  imageUpload,
  audioUpload,
  documentUpload,
  healthDataUpload,
  handleUploadError,
  
  // Rate limiting middleware
  rateLimitMiddleware,
  authRateLimitMiddleware,
  chatRateLimitMiddleware,
  createRateLimitMiddleware,
  
  // Validation middleware
  validate,
  validateBody,
  validateQuery,
  validateParams
};